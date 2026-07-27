import { commands } from '../commands.js';
import { isMaster } from './allies.js';

// Hardcoded Root Primary Master Number
const HARDCODED_PRIMARY_MASTER = "2347040401291@s.whatsapp.net";

let trigonEnabled = true; // Global Switch (.trigon speak / .trigon off)
let trigonSealed = true;  // Sealed Mode (Default)
const ritualProgress = new Map();

export async function handleTrigonBrain(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const cleanSender = sender.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    
    // Check Master Status (Primary + Secondary + Allies via handlers/allies.js)
    const senderIsMaster = isMaster(cleanSender) || cleanSender === HARDCODED_PRIMARY_MASTER;

    // Extract Message Text
    const body = (msg.message?.conversation || 
                  msg.message?.extendedTextMessage?.text || 
                  msg.message?.imageMessage?.caption || 
                  msg.message?.videoMessage?.caption || "").trim();
    
    const lowerBody = body.toLowerCase();

    // ---------------- 1. GLOBAL SWITCHES (.trigon speak / .trigon off) ----------------
    if (lowerBody === '.trigon off') {
        if (!senderIsMaster) {
            return await sock.sendMessage(from, { text: "☠️ *SILENCE MORTAL.* Only a Master holds the power to deactivate me." }, { quoted: msg });
        }
        trigonEnabled = false;
        return await sock.sendMessage(from, { text: "💤 *Trigon has been completely deactivated.*" }, { quoted: msg });
    }

    if (lowerBody === '.trigon speak') {
        if (!senderIsMaster) {
            return await sock.sendMessage(from, { text: "☠️ *KNEEL, FLEA.* You cannot order me to speak." }, { quoted: msg });
        }
        trigonEnabled = true;
        trigonSealed = true;
        return await sock.sendMessage(from, { text: "🟢 *Trigon is enabled and currently SEALED. Perform the 4-step ritual to awaken him.*" }, { quoted: msg });
    }

    if (!trigonEnabled) return; // Completely silent if globally disabled

    // ---------------- 2. SEAL SPELL (MASTER ONLY) ----------------
    if (lowerBody.includes('azarath metrion zinthos')) {
        if (!senderIsMaster) {
            return await sock.sendMessage(from, { 
                text: "☠️ *INSOLENT WORM!* Mortals lack the ancient dark magic required to bind or seal me!" 
            }, { quoted: msg });
        }

        trigonSealed = true;
        ritualProgress.delete(from);
        return await sock.sendMessage(from, { 
            text: "🔮 *AZARATH METRION ZINTHOS!*\n\nThe ancient dark chains bind the void once more. Trigon is now **SEALED**." 
        }, { quoted: msg });
    }

    // ---------------- 3. THE 4-STEP SUMMONING RITUAL ----------------
    if (trigonSealed) {
        let currentStep = ritualProgress.get(from) || 0;

        if (lowerBody === 'trigon' && currentStep === 0) {
            ritualProgress.set(from, 1);
            return await sock.sendMessage(from, { react: { text: "👿", key: msg.key } });
        } 
        else if (lowerBody === 'destroyer of dimensions' && currentStep === 1) {
            ritualProgress.set(from, 2);
            return await sock.sendMessage(from, { react: { text: "🔥", key: msg.key } });
        } 
        else if (lowerBody === 'devourer of souls' && currentStep === 2) {
            ritualProgress.set(from, 3);
            return await sock.sendMessage(from, { react: { text: "💀", key: msg.key } });
        } 
        else if (lowerBody === 'rise' && currentStep === 3) {
            ritualProgress.set(from, 4);
            await sock.sendMessage(from, { react: { text: "🐉", key: msg.key } });

            // UNSEAL EVENT
            trigonSealed = false;
            ritualProgress.delete(from);

            // Trigger awakening event via ./cmd/trigon.js
            const trigonCmd = commands.get('trigon');
            if (trigonCmd) {
                await trigonCmd.execute(sock, msg, { text: "AWAKEN_RITUAL", from });
            }
            return;
        } else if (['trigon', 'destroyer of dimensions', 'devourer of souls', 'rise'].includes(lowerBody)) {
            // Reset ritual progress if step sequence is broken
            ritualProgress.delete(from);
        }

        return; // Ignore all other messages while sealed
    }

    // ---------------- 4. ROUTING AWAKE MESSAGES ----------------
    
    // A. Prefixed Commands (.ping, .master, .git, etc.)
    if (body.startsWith('.')) {
        const args = body.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const targetCmd = commands.get(commandName);

        if (targetCmd) {
            // Strictly enforce Master permissions for running prefixed commands
            if (!senderIsMaster && commandName !== 'trigon') {
                return await sock.sendMessage(from, { 
                    text: "☠️ *COMMAND DENIED.* Mortals are forbidden from commanding the abyss!" 
                }, { quoted: msg });
            }

            return await targetCmd.execute(sock, msg, {
                args,
                text: args.join(" "),
                from
            });
        }
    }

    // B. AI Chat Interceptor (Prefixless / Replies / Mentions)
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(botJid);
    const isQuotedBot = msg.message?.extendedTextMessage?.contextInfo?.participant === botJid;
    const isDirectName = lowerBody.includes('trigon');

    if (isMentioned || isQuotedBot || isDirectName || !from.endsWith('g.us')) {
        const trigonCmd = commands.get('trigon');
        if (trigonCmd) {
            await trigonCmd.execute(sock, msg, { text: body, from });
        }
    }
}