import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { loadCommands, handleMessage } from './handler.js';

const BOT_NAME = "Trigon-XMD";

async function startTrigonBot() {
    // 1. Load commands dynamically from /commands folder
    await loadCommands();

    // 2. Setup Multi-Device Session State
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    // 3. Initialize Socket
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: [BOT_NAME, 'Safari', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    // 4. Handle Connection Lifecycle
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[${BOT_NAME}] Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                startTrigonBot();
            } else {
                console.log(`[${BOT_NAME}] Session expired. Delete ./session and restart.`);
            }
        } else if (connection === 'open') {
            console.log(`\n✅ [${BOT_NAME}] Connected successfully!\n`);
        }
    });

    // 5. Delegate incoming messages to the Handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;
            await handleMessage(sock, msg);
        }
    });
}

// Start the bot engine
startTrigonBot();