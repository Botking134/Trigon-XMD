import { exec } from 'child_process';
import util from 'util';
import { isMaster } from '../handlers/allies.js';
import { loadCommands } from '../commands.js';

const execPromise = util.promisify(exec);
const REPO_URL = "https://github.com/Trigon-XMD.git";

export default {
    name: "git",
    aliases: ["vortex", "resurrectio", "transmutatio"],
    description: "Prefixless Git repository management spells (Master only)",
    async execute(sock, msg, { text, from }) {
        const sender = msg.key.participant || from;
        const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim();
        const lowerBody = body.toLowerCase();

        if (!isMaster(sender)) {
            return await sock.sendMessage(from, { text: "☠️ *INSOLENT WORM!* Only Masters can invoke the repository spells." }, { quoted: msg });
        }

        // ---------------- 1. RESURRECTIO (SILENT GIT SETUP) ----------------
        if (lowerBody.startsWith('resurrectio')) {
            try {
                await execPromise('git init');
                await execPromise(`git remote add origin ${REPO_URL}`).catch(() => {});
                await execPromise('git fetch origin');
                return await sock.sendMessage(from, { 
                    text: "🩸 *[RESURRECTIO]: The dark link to the GitHub repository has been established.*" 
                }, { quoted: msg });
            } catch (err) {
                return await sock.sendMessage(from, { text: `☠️ [RESURRECTIO ERROR]: ${err.message}` }, { quoted: msg });
            }
        }

        // ---------------- 2. TRANSMUTATIO (CHECK UPDATES SILENTLY) ----------------
        if (lowerBody.startsWith('transmutatio')) {
            try {
                await execPromise('git fetch origin');
                const { stdout } = await execPromise('git status -uno');
                
                return await sock.sendMessage(from, { 
                    text: `🔮 *[TRANSMUTATIO - REPOSITORY STATUS]:*\n\n\`\`\`${stdout.trim()}\`\`\`` 
                }, { quoted: msg });
            } catch (err) {
                return await sock.sendMessage(from, { text: `☠️ [TRANSMUTATIO ERROR]: ${err.message}` }, { quoted: msg });
            }
        }

        // ---------------- 3. VORTEX (SILENT LIVE PULL WITHOUT RESTART) ----------------
        if (lowerBody.startsWith('vortex')) {
            const targetFile = body.slice('vortex'.length).trim();

            try {
                // Ensure git origin exists
                await execPromise('git init').catch(() => {});
                await execPromise(`git remote add origin ${REPO_URL}`).catch(() => {});
                await execPromise('git fetch origin');

                if (targetFile) {
                    // MODE B: Target Specific File Pull (e.g. vortex cmd/trigon.js)
                    await execPromise(`git checkout origin/main -- ${targetFile}`);
                    
                    // Hot reload commands in memory live
                    await loadCommands();

                    return await sock.sendMessage(from, { 
                        text: `🌀 *[VORTEX]: Target file \`${targetFile}\` pulled and hot-reloaded into memory live.* (Server Uptime Intact)` 
                    }, { quoted: msg });
                } else {
                    // MODE A: General Pull Updated Files Only
                    await execPromise('git pull origin main --rebase').catch(async () => {
                        await execPromise('git pull origin master --rebase');
                    });

                    // Hot reload commands in memory live
                    await loadCommands();

                    return await sock.sendMessage(from, { 
                        text: `🌀 *[VORTEX]: All modified repository files pulled and hot-reloaded into memory live.* (Server Uptime Intact)` 
                    }, { quoted: msg });
                }
            } catch (err) {
                return await sock.sendMessage(from, { text: `☠️ [VORTEX ERROR]: ${err.message}` }, { quoted: msg });
            }
        }
    }
};