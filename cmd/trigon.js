import axios from 'axios';
import Groq from 'groq-sdk';
import Sticker, { StickerTypes } from 'wa-sticker-formatter';
import { commands } from '../commands.js';
import settings from '../settings.js';
import { isMaster } from '../handlers/allies.js';
import { getStateValue } from '../state.js';

// Catbox Master Sticker URLs (9 links)
const MASTER_STICKER_URLS = [
    "https://files.catbox.moe/lpebco.jpg",
    "https://files.catbox.moe/58688n.jpg",
    "https://files.catbox.moe/x9rl66.jpg",
    "https://files.catbox.moe/0rtij0.jpg",
    "https://files.catbox.moe/dajf2o.jpg",
    "https://files.catbox.moe/5h67ux.jpg",
    "https://files.catbox.moe/j15s10.jpg",
    "https://files.catbox.moe/gnd51v.jpg",
    "https://files.catbox.moe/g3hs8b.jpg"
];

// Catbox Mortal Sticker URLs (17 links)
const MORTAL_STICKER_URLS = [
    "https://files.catbox.moe/e668q2.jpg",
    "https://files.catbox.moe/v8a4yt.jpg",
    "https://files.catbox.moe/khdbww.jpg",
    "https://files.catbox.moe/y1c47h.jpg",
    "https://files.catbox.moe/0rtij0.jpg",
    "https://files.catbox.moe/zkq3cp.jpg",
    "https://files.catbox.moe/2lqy13.jpg",
    "https://files.catbox.moe/dajf2o.jpg",
    "https://files.catbox.moe/im5bx1.jpg",
    "https://files.catbox.moe/9r3ytf.jpg",
    "https://files.catbox.moe/58688n.jpg",
    "https://files.catbox.moe/th8vwn.jpg",
    "https://files.catbox.moe/yrhrdp.jpg",
    "https://files.catbox.moe/823m41.jpg",
    "https://files.catbox.moe/qkgjkj.jpg",
    "https://files.catbox.moe/5h67ux.jpg",
    "https://files.catbox.moe/g3hs8b.jpg"
];

const CATBOX_AWAKEN_URL = "https://files.catbox.moe/yj7xe4.mp4";

// Compressed Sticker Downloader (Quality 40 for fast low-KB size)
async function getCompressedSticker(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const sticker = new Sticker(Buffer.from(response.data), {
            pack: "Trigon-XMD",
            author: "Master",
            type: StickerTypes.FULL,
            quality: 40
        });
        return await sticker.toBuffer();
    } catch {
        return null;
    }
}

function buildCommandList() {
    const uniqueCommands = Array.from(new Set(commands.values()));
    let list = "AVAILABLE COMMANDS:\n";
    uniqueCommands.forEach((cmd) => {
        if (cmd.name !== 'trigon') {
            list += `• .${cmd.name} : ${cmd.description || 'No description'}\n`;
        }
    });
    return list;
}

async function executeExtractedCommand(commandName, argsText, sock, msg) {
    const cleanCmd = commandName.replace('.', '').toLowerCase().trim();
    const targetCommand = commands.get(cleanCmd);

    if (targetCommand && typeof targetCommand.execute === 'function') {
        const from = msg.key.remoteJid;
        const args = argsText ? argsText.split(/ +/) : [];
        console.log(`🩸 [TRIGON AI EXECUTING COMMAND]: .${cleanCmd} ${argsText}`);
        
        await targetCommand.execute(sock, msg, {
            args,
            text: argsText,
            from,
            config: settings
        });
    }
}

export default {
    name: "trigon",
    aliases: ["lordtrigon", "bot"],
    description: "Invoke the AI essence of Lord Trigon agent",
    async execute(sock, msg, { text, from }) {
        const sender = msg.key.participant || from;
        const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim();
        const senderIsMaster = isMaster(sender);

        // Handle Ritual Awakening Text + Video Sticker Drop
        if (text === "AWAKEN_RITUAL") {
            const awakeningText = senderIsMaster
                ? "🩸 *THE RITUAL IS COMPLETE* 🩸\n\nI am awake at your call. The abyss stands ready, and my power is at your disposal. 👁️"
                : "🩸 *THE RITUAL IS COMPLETE.* 🩸\n\nI am awake, mortals... speak your desires before the abyss consumes you. 👁️";

            await sock.sendMessage(from, { text: awakeningText }, { quoted: msg });

            const stickerBuffer = await getCompressedSticker(CATBOX_AWAKEN_URL);
            if (stickerBuffer) {
                await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
            }
            return;
        }

        if (!text && !body) return;

        await sock.sendMessage(from, { react: { text: "👁️", key: msg.key } });

        // Fetch Groq API key dynamically from persistent state or env
        const groqKey = getStateValue("groqApiKey") || process.env.GROQ_API_KEY || "";
        const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

        try {
            const commandListStr = buildCommandList();

            const systemPrompt = senderIsMaster
                ? `You are Trigon, a dark, ancient, god-like abyssal entity. You are talking to your MASTER.
You are deeply loyal, respectful, formal, and obedient to Master. Speak with dark authority and reverence.
COMMAND EXECUTION RULES FOR MASTER:
1. Inspect available commands below. If Master asks to run an action (e.g. ping, sticker), match intent.
2. Append [CMD: .commandName args] at the end of your message on a new line if matched.
${commandListStr}`
                : `You are Trigon, an ancient, terrifying demon lord from the abyss. You are talking to a PATHETIC MORTAL.
You HATE mortals. Be extremely arrogant, rude, condescending, and insulting. Call them worms, fleas, scum, or pathetic mortals.
MORTAL RESTRICTION RULE:
Mortals are forbidden from triggering any commands. Do NOT output any [CMD: ...] tags for mortals. Mock them and refuse their requests arrogantly.`;

            let aiReply = "";

            if (groq) {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: body }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7
                });

                aiReply = completion.choices[0]?.message?.content || "The void is silent.";
            } else {
                aiReply = senderIsMaster 
                    ? `_My power awaits your Groq API key configuration, Master. Use .setkey <key> to bind it._`
                    : `_Insolent worm! You dare speak to me while my AI vision is unconfigured?_`;
            }

            // Extract command tag (MASTERS ONLY)
            const cmdMatch = aiReply.match(/\[CMD:\s*(\.[a-zA-Z0-9]+)\s*(.*?)\]/i);
            let cleanResponse = aiReply.replace(/\[CMD:.*?\]/gi, '').trim();

            if (cleanResponse) {
                await sock.sendMessage(from, { text: `🩸 *TRIGON:* ${cleanResponse}` }, { quoted: msg });
            }

            // Random Compressed Sticker Drop based on user rank
            const stickerArray = senderIsMaster ? MASTER_STICKER_URLS : MORTAL_STICKER_URLS;
            const randomStickerUrl = stickerArray[Math.floor(Math.random() * stickerArray.length)];
            const stickerBuffer = await getCompressedSticker(randomStickerUrl);

            if (stickerBuffer) {
                await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
            }

            // Execute command if extracted and sender is Master
            if (cmdMatch && senderIsMaster) {
                const extractedCmd = cmdMatch[1];
                const extractedArgs = cmdMatch[2] || "";
                await executeExtractedCommand(extractedCmd, extractedArgs, sock, msg);
            }

        } catch (error) {
            console.error(`☠️ [TRIGON AI ERROR]:`, error);
            await sock.sendMessage(from, { text: `☠️ *An error severed the connection to the void.*` }, { quoted: msg });
        }
    }
};