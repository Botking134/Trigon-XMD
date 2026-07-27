import { isMaster, addAlly, removeAlly } from '../handlers/allies.js';
import { updateState } from '../state.js';

export default {
    name: "master",
    aliases: ["setkey", "ally", "enemy", "addmaster", "delmaster"],
    description: "Manage Masters, Allies, and persistent Groq API Key (Master only)",
    async execute(sock, msg, { args, text, from }) {
        const sender = msg.key.participant || from;

        // Strictly verify Master rank
        if (!isMaster(sender)) {
            return await sock.sendMessage(from, { 
                text: "☠️ *SILENCE MORTAL.* You have no authority over the masters of the abyss." 
            }, { quoted: msg });
        }

        const subCommand = args[0]?.toLowerCase();

        // A. SET Groq API Key (.setkey <apikey> or .master setkey <key>)
        if (subCommand === 'setkey' || msg.message?.conversation?.toLowerCase().startsWith('.setkey')) {
            const apiKey = subCommand === 'setkey' ? args.slice(1).join(" ") : args.join(" ");
            
            if (!apiKey) {
                return await sock.sendMessage(from, { text: "🩸 *Specify a valid Groq API Key.* Usage: `.setkey <gsk_...>`" }, { quoted: msg });
            }

            // Save key persistently to ./storage/state.json
            updateState({ groqApiKey: apiKey });

            return await sock.sendMessage(from, { 
                text: "🩸 *[MASTER]: Groq API Key set persistently.* Trigon AI vision is now online." 
            }, { quoted: msg });
        }

        // B. ADD ALLY (.master add <@user / phone> or .ally)
        if (subCommand === 'add' || subCommand === 'ally') {
            let target = args[1] || (msg.message?.extendedTextMessage?.contextInfo?.participant);
            if (!target) {
                return await sock.sendMessage(from, { text: "🩸 *Specify a user to elevate as Master.* Usage: `.master add <@user / phone>`" }, { quoted: msg });
            }

            const addedJid = addAlly(target);
            return await sock.sendMessage(from, { 
                text: `⛓️ *THE PACT IS BOUND.* User \`${addedJid.split('@')[0]}\` is now elevated as an **Ally Master**.` 
            }, { quoted: msg });
        }

        // C. REMOVE ALLY (.master remove <@user / phone> or .enemy)
        if (subCommand === 'remove' || subCommand === 'enemy') {
            let target = args[1] || (msg.message?.extendedTextMessage?.contextInfo?.participant);
            if (!target) {
                return await sock.sendMessage(from, { text: "🩸 *Specify an Ally to strip authority.* Usage: `.master remove <@user / phone>`" }, { quoted: msg });
            }

            const removedJid = removeAlly(target);
            return await sock.sendMessage(from, { 
                text: `🩸 *THE PACT IS SEVERED.* User \`${removedJid.split('@')[0]}\` has been stripped of authority.` 
            }, { quoted: msg });
        }

        // Default Master Help
        const helpText = `
👑 *MASTER MANAGEMENT TOOLS* 👑

▫️ \`.setkey <apikey>\` - Save persistent Groq API Key
▫️ \`.master add <@user>\` - Elevate user to Master rank
▫️ \`.master remove <@user>\` - Strip Master rank from user
`;
        await sock.sendMessage(from, { text: helpText }, { quoted: msg });
    }
};