import { commands } from '../commands.js';
import settings from '../settings.js';
import { getState } from '../state.js';
import Groq from 'groq-sdk';

const PRIMARY_ROOT_MASTER = "2347040401291";

/**
 * Extracts raw text from standard WhatsApp message formats
 */
function extractMessageText(msg) {
    const m = msg.message;
    if (!m) return '';
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.buttonsResponseMessage?.selectedButtonId ||
        m.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.templateButtonReplyMessage?.selectedId ||
        ''
    ).trim();
}

/**
 * Main routing brain for incoming messages
 */
export async function handleTrigonBrain(sock, msg) {
    try {
        const text = extractMessageText(msg);
        if (!text) return;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const sender = msg.key.participant || remoteJid;
        const senderNumber = sender.replace(/[^0-9]/g, '');

        // Master check (Hardcoded Master + Configured Master + Bot Self)
        const cleanConfigMaster = settings.masterNumber.replace(/[^0-9]/g, '');
        const botSelfNumber = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
        const isMaster = (
            senderNumber === PRIMARY_ROOT_MASTER ||
            (cleanConfigMaster && senderNumber === cleanConfigMaster) ||
            senderNumber === botSelfNumber ||
            msg.key.fromMe
        );

        const prefix = settings.prefix || '.';
        const isCommand = text.startsWith(prefix);

        if (isCommand) {
            const args = text.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift()?.toLowerCase();
            const command = commands.get(cmdName);

            if (command) {
                const chatType = isGroup ? `Group (${remoteJid})` : `Private (${senderNumber})`;
                
                // 1. Console log trigger
                console.log(`\n🩸 [TRIGON COMMAND]: Triggered [${prefix}${cmdName}] by [${senderNumber}] in ${chatType}`);
                if (args.length > 0) {
                    console.log(`   └ Args: ${args.join(' ')}`);
                }

                // Check if command is Master-only
                if (command.masterOnly && !isMaster) {
                    console.log(`⚠️ [TRIGON ACCESS DENIED]: Command [${cmdName}] blocked for non-master [${senderNumber}]`);
                    await sock.sendMessage(remoteJid, {
                        text: `☠️ *ACCESS DENIED.* Only Master can invoke this command.`
                    }, { quoted: msg });
                    return;
                }

                // 2. Execute Command with error handling & logging
                try {
                    await command.execute(sock, msg, args, {
                        text,
                        prefix,
                        cmdName,
                        isMaster,
                        sender
                    });
                    console.log(`✅ [TRIGON COMMAND]: Executed [${prefix}${cmdName}] successfully.\n`);
                } catch (cmdError) {
                    console.error(`☠️ [TRIGON COMMAND ERROR]: Execution failed for [${prefix}${cmdName}]:`, cmdError);
                    
                    // Reply to user with failure notification
                    await sock.sendMessage(remoteJid, {
                        text: `☠️ *TRIGON ENGINE FAILURE*\n\nAn error occurred while executing \`${prefix}${cmdName}\`:\n\`\`\`${cmdError.message || cmdError}\`\`\``
                    }, { quoted: msg });
                }
                return;
            } else {
                console.log(`❓ [TRIGON UNKNOWN]: Unknown command [${prefix}${cmdName}] from [${senderNumber}]`);
            }
        }

        // AI Fallback Mode via Groq (if enabled and key present)
        const state = getState();
        const apiKey = state.groqApiKey || settings.groqApiKey || process.env.GROQ_API_KEY;

        if (state.trigonEnabled && apiKey && !isCommand && !msg.key.fromMe) {
            try {
                const groq = new Groq({ apiKey });
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are Trigon-XMD, an ancient, powerful dark AI entity bound to serve your Master. Respond concisely, authoritatively, and with dark gothic flair.`
                        },
                        { role: "user", content: text }
                    ],
                    model: "llama-3.3-70b-versatile"
                });

                const responseText = chatCompletion.choices[0]?.message?.content;
                if (responseText) {
                    await sock.sendMessage(remoteJid, { text: responseText }, { quoted: msg });
                }
            } catch (err) {
                console.error(`❌ [TRIGON GROQ AI ERROR]:`, err.message);
            }
        }
    } catch (err) {
        console.error(`☠️ [TRIGON BRAIN CRITICAL ERROR]:`, err);
    }
}