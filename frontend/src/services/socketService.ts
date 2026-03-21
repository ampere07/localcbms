import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

// Match socket server URL based on environment (same pattern as Header.tsx)
const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const socketServerUrl = isDev ? 'http://localhost:3001' : 'https://backend.atssfiber.ph';

console.log(`[Socket Service] Initializing connection to:`, socketServerUrl);

export const socket: Socket = io(socketServerUrl, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
});

socket.on('connect', () => {
    console.log('[Socket Service] Connected global socket');
});

socket.on('connect_error', (error) => {
    console.log('[Socket Service] Connection error:', error.message);
});

socket.on('disconnect', () => {
    console.log('[Socket Service] Disconnected');
});

export default socket;
