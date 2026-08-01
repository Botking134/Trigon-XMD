// commands.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Map to store all loaded commands
export const commands = new Map();

/**
 * Dynamically loads all .js command files from the /cmd folder
 */
export async function loadCommands() {
    commands.clear();
    const cmdDir = path.join(__dirname, 'cmd');

    if (!fs.existsSync(cmdDir)) {
        fs.mkdirSync(cmdDir, { recursive: true });
    }

    const files = fs.readdirSync(cmdDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        try {
            const filePath = path.join(cmdDir, file);
            const fileUrl = `${pathToFileURL(filePath).href}?update=${Date.now()}`;
            const commandModule = await import(fileUrl);
            const command = commandModule.default;

            if (command?.name) {
                commands.set(command.name.toLowerCase(), command);

                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        commands.set(alias.toLowerCase(), command);
                    });
                }
            }
        } catch (error) {
            console.error(`☠️ [TRIGON ENGINE]: Failed to manifest command [${file}]:`, error);
        }
    }

    console.log(`🩸 [TRIGON ENGINE]: Summoned ${commands.size} command(s) from ./cmd`);
}