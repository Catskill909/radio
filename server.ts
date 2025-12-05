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

export function broadcastRecordingStatus(data: {
    type: 'started' | 'completed' | 'failed';
    slotId?: string;
    recordingId?: string;
    showTitle?: string;
    error?: string;
}) {
    if (io) {
        io.to('recording-status').emit(`recording:${data.type}`, data);
    }
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

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Room subscriptions
        socket.on('subscribe', (channel: string) => {
            console.log(`[Socket.IO] ${socket.id} subscribed to: ${channel}`);
            socket.join(channel);
        });

        socket.on('unsubscribe', (channel: string) => {
            console.log(`[Socket.IO] ${socket.id} unsubscribed from: ${channel}`);
            socket.leave(channel);
        });

        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
        });
    });

    // Store io instance globally for access from API routes
    (global as any).io = io;

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on path: /api/socket`);
    });
});
