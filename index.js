import { startPairing } from './pair.js';
import { handleTrigonBrain } from './handlers/trigon.js';
import { loadCommands } from './commands.js';

async function initTrigonEngine() {
    // 1. Summon all commands from ./cmd folder into memory
    await loadCommands();

    // 2. Initialize connection engine via pair.js
    const sock = await startPairing();

    // 3. Route incoming WhatsApp messages to handlers/trigon.js
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Filter out empty messages and status updates
            if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

            // Delegate message directly to Brain Handler
            await handleTrigonBrain(sock, msg);
        }
    });
}

// Launch Trigon-XMD Engine
initTrigonEngine();