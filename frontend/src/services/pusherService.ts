import Pusher from 'pusher-js';

const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOKETI_HOST = isDev ? '127.0.0.1' : 'backend.atssfiber.ph';
const SOKETI_PORT = isDev ? 6001 : 443;
const SOKETI_KEY = process.env.REACT_APP_SOKETI_APP_KEY || '805a1cbfe78c47f1';
const SOKETI_FORCE_TLS = !isDev; // Force TLS in production if behind SSL
// Enable Pusher logging (temporarily enabled for all environments)
Pusher.logToConsole = true;

const pusher = new Pusher(SOKETI_KEY, {
    wsHost: SOKETI_HOST,
    wsPort: SOKETI_PORT,
    wssPort: SOKETI_PORT,
    forceTLS: SOKETI_FORCE_TLS,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: 'mt1',
});

pusher.connection.bind('connected', () => {
    console.log('[Pusher/Soketi] Connected');
});

pusher.connection.bind('error', (err: any) => {
    console.error('[Pusher/Soketi] Connection error:', err);
});

pusher.connection.bind('disconnected', () => {
    console.log('[Pusher/Soketi] Disconnected');
});

pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
    console.log(`[Pusher/Soketi] State changed: ${states.previous} -> ${states.current}`);
});

export default pusher;
