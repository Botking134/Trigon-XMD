import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

    // Create /cmd folder if it doesn't exist
    if (!fs.existsSync(cmdDir)) {
        fs.mkdirSync(cmdDir, { recursive: true });
    }

    const files = fs.readdirSync(cmdDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        try {
            // Anti-cache query for dynamic reloading
            const modulePath = `./cmd/${file}?update=${Date.now()}`;
            const commandModule = await import(modulePath);
            const command = commandModule.default;

            if (command?.name) {
                commands.set(command.name.toLowerCase(), command);

                // Register aliases if defined
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