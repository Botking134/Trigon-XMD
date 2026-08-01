// cmd/demon.js

export default {
    name: "demon",
    aliases: ["ping", "p"],
    description: "Demon speed test",
    async execute(sock, msg) {
        // 1. React with 🩸 emoji
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🩸", key: msg.key }
        });

        const start = Date.now();

        // 2. Dispatch temporary message
        const initialMsg = await sock.sendMessage(
            msg.key.remoteJid,
            { text: "." },
            { quoted: msg }
        );

        // 3. Calculate latency (multiplied by 10)
        const realLatency = Date.now() - start;
        const displayPing = realLatency * 10;

        // 4. Exact requested aura pattern + 10x ping
        const auraPattern = "⍣⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝";

        // 5. Edit message to display ONLY the aura pattern and calculated ms
        await sock.sendMessage(msg.key.remoteJid, {
            text: `${auraPattern}${displayPing}ms`,
            edit: initialMsg.key
        });
    }
};