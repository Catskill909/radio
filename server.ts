import { createServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Socket.IO server instance - exported for use in other services
let io: SocketServer;

export function getIO(): SocketServer {
    return io;
}

// Broadcast helpers for other services to use
export function broadcastStreamHealth(data: {
    id: string;
    status: string;
    listeners?: number | null;
    errorMessage?: string | null;
}) {
    if (io) {
        io.to('stream-health').emit('stream:health', data);
    }
}

// Track active recordings in memory for new subscribers
const activeRecordings = new Map<string, {
    type: 'started';
    slotId?: string;
    recordingId?: string;
    showTitle?: string;
    timestamp: Date;
}>();

export function broadcastRecordingStatus(data: {
    type: 'started' | 'completed' | 'failed';
    slotId?: string;
    recordingId?: string;
    showTitle?: string;
    error?: string;
}) {
    // Track active recordings
    if (data.type === 'started' && data.slotId) {
        activeRecordings.set(data.slotId, {
            type: 'started',
            slotId: data.slotId,
            recordingId: data.recordingId,
            showTitle: data.showTitle,
            timestamp: new Date()
        });
    } else if ((data.type === 'completed' || data.type === 'failed') && data.slotId) {
        activeRecordings.delete(data.slotId);
    }

    if (io) {
        io.to('recording-status').emit(`recording:${data.type}`, data);
    }
}

// Send current active recordings to a specific socket
export function sendActiveRecordings(socket: Socket) {
    activeRecordings.forEach((recording) => {
        socket.emit('recording:started', recording);
    });
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        handle(req, res);
    });

    io = new SocketServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        // WebSocket-only transport - simplifies Coolify deployment
        transports: ['websocket'],
        // Ping settings for keeping connections alive
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    // Helper to get room size and broadcast listener count
    const broadcastListenerCount = async () => {
        const sockets = await io.in('site-listeners').fetchSockets();
        const count = sockets.length;
        io.to('stats').emit('listeners:count', { count });
        console.log(`[Socket.IO] Site listeners: ${count}`);
    };

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Room subscriptions
        socket.on('subscribe', async (channel: string) => {
            console.log(`[Socket.IO] ${socket.id} subscribed to: ${channel}`);
            socket.join(channel);

            // Broadcast updated listener count when someone joins site-listeners
            if (channel === 'site-listeners') {
                await broadcastListenerCount();
            }

            // Send current listener count to stats subscribers immediately
            if (channel === 'stats') {
                await broadcastListenerCount();
            }

            // Send current active recordings to recording-status subscribers
            if (channel === 'recording-status') {
                sendActiveRecordings(socket);
            }
        });

        socket.on('unsubscribe', async (channel: string) => {
            console.log(`[Socket.IO] ${socket.id} unsubscribed from: ${channel}`);
            socket.leave(channel);

            // Broadcast updated listener count when someone leaves site-listeners
            if (channel === 'site-listeners') {
                setTimeout(() => broadcastListenerCount(), 100); // Slight delay for leave to complete
            }
        });

        socket.on('disconnect', async (reason) => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
            // Broadcast updated listener count when anyone disconnects (they might have been a listener)
            // Longer delay ensures socket is fully removed from rooms before counting
            setTimeout(() => broadcastListenerCount(), 500);
        });
    });

    // Store io instance globally for access from API routes
    (global as any).io = io;
    (global as any).activeRecordings = activeRecordings;

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on path: /api/socket`);
    });
});
