'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        // Only create one socket instance
        if (!socket) {
            socket = io({
                path: '/api/socket',
                transports: ['websocket'], // WebSocket-only, no polling fallback
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            socket.on('connect', () => {
                console.log('[Socket.IO] Connected:', socket?.id);
                setIsConnected(true);
                setConnectionError(null);
            });

            socket.on('disconnect', (reason) => {
                console.log('[Socket.IO] Disconnected:', reason);
                setIsConnected(false);
            });

            socket.on('connect_error', (error) => {
                console.error('[Socket.IO] Connection error:', error.message);
                setConnectionError(error.message);
                setIsConnected(false);
            });
        } else {
            // Socket already exists, sync state
            setIsConnected(socket.connected);
        }

        // Cleanup on unmount of last component using hook
        return () => {
            // Don't disconnect - keep socket alive for other components
        };
    }, []);

    const subscribe = useCallback((channel: string) => {
        if (socket?.connected) {
            socket.emit('subscribe', channel);
            console.log('[Socket.IO] Subscribed to:', channel);
        } else {
            // Queue subscription for when socket connects
            socket?.once('connect', () => {
                socket?.emit('subscribe', channel);
                console.log('[Socket.IO] Subscribed to (after connect):', channel);
            });
        }
    }, []);

    const unsubscribe = useCallback((channel: string) => {
        if (socket?.connected) {
            socket.emit('unsubscribe', channel);
        }
    }, []);

    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        socket?.on(event, callback);
        return () => {
            socket?.off(event, callback);
        };
    }, []);

    return {
        socket,
        isConnected,
        connectionError,
        subscribe,
        unsubscribe,
        on,
    };
}
