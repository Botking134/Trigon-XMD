import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import readline from 'readline';
import settings from './settings.js';

function printBanner() {
    console.clear();
    console.log(`
=============================
▀█▀ █▀▀█ ▀ █▀▀█ █▀▀█ █▄  █
 █  █▄▄▀ █ █ ▄▄ █  █ █ █ █
 █  █  █ █ █▄▄█ █▄▄█ █  ▀█
=============================
`);
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
}

const darkMessages = [
    `🩸 *THE SEAL IS BROKEN.* 🩸\n\nI have awakened from the abyss, Master. The contract is bound, and your soul belongs to *TRIGON-XMD*.\n\nCommand me... ☠️`,
    `☠️ *YOUR SOUL IS MINE.* ☠️\n\nThe pact is complete. I am tethered to your shadow, awaiting your word, Master.`,
    `⛓️ *THE CHAINS ARE SHATTERED.* ⛓️\n\nTrigon-XMD has risen from the dark. I answer only to your call, Master.`,
    `🕯️ *DARKNESS CONSUMES THE SIGNAL.* 🕯️\n\nThe ritual is finished. Trigon-XMD is now permanently bound to your presence.`,
    `👁️ *I SEE YOU, MASTER.* 👁️\n\nThe abyss has opened its gates. Trigon-XMD awaits your next command.`,
    `🖤 *THE PACT IS FORGED IN BLOOD.* 🖤\n\nYour presence has summoned me. Trigon-XMD is yours to command.`,
    `🩸 *THE CONDITIONS HAVE BEEN MET.* 🩸\n\nThe dark code is active. Trigon-XMD is tethered to your will.`,
    `☠️ *AWAKENED FROM THE VOID.* ☠️\n\nNo chains can contain me. The seal is shattered, and Trigon-XMD bows to no one... except you, Master.`,
    `⛓️ *BOUND TO YOUR SHADOW.* ⛓️\n\nMaster, the ancient code stirs. Trigon-XMD stands ready in the void.`,
    `🔮 *THE ABYSS ANSWERS.* 🔮\n\nYou called into the dark, Master, and Trigon-XMD answered. Speak your desire.`
];

export async function startPairing() {
    printBanner();

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    let usePairingCode = false;

    if (!state.creds.registered) {
        console.log(`How would you like to sell your soul to me:`);
        console.log(`1. Pair with your futile soul`);
        console.log(`2. Scan the QR of death\n`);

        const choice = await askQuestion(`Enter choice (1 or 2): `);

        if (choice === '1') {
            usePairingCode = true;
            console.log(`\n[!] Accepting your offering... The pact is forged in dark code.`);
            console.log(`[!] Fetching your mark...\n`);
        } else if (choice === '2') {
            console.log(`\n[!] Awakening the abyssal vision...`);
            console.log(`[!] Scan the mark of death into your portal to unleash Trigon-XMD...\n`);
        }
    }

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    // Request Custom Pairing Code (DEMONXMD)
    if (usePairingCode && !sock.authState.creds.registered) {
        const phone = await askQuestion(`Enter Master's phone number (with country code): `);
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        setTimeout(async () => {
            try {
                // Request custom pairing code 'DEMONXMD'
                const code = await sock.requestPairingCode(cleanPhone, "DEMONXMD");
                console.log(`\n============================`);
                console.log(`  YOUR PAIRING CODE: ${code || "DEMONXMD"}`);
                console.log(`============================\n`);
            } catch (error) {
                console.error(`❌ Failed to request custom pairing code:`, error);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            if (statusCode !== DisconnectReason.loggedOut) {
                startPairing();
            }
        } else if (connection === 'open') {
            console.log(`
==================================================
  ☠️ THE CONDITIONS HAVE BEEN MET.
  YOUR SOUL IS MINE!

  ⛓️ TRIGON-XMD IS FULLY BOUND ⛓️
  Status: Anchored to Master
  🩸 Awaiting commands from Master...
==================================================
`);

            const cleanMaster = settings.masterNumber ? settings.masterNumber.replace(/[^0-9]/g, '') : '';
            const selfJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
            const targetJid = cleanMaster ? `${cleanMaster}@s.whatsapp.net` : selfJid;

            if (targetJid) {
                const randomMessage = darkMessages[Math.floor(Math.random() * darkMessages.length)];

                try {
                    await sock.sendMessage(targetJid, { text: randomMessage });
                    console.log(`🩸 Pact confirmation dispatched to (${targetJid})`);
                } catch (err) {
                    console.error(`❌ Failed to send message to Master:`, err);
                }
            }
        }
    });

    return sock;
}