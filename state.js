import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pointer to ./storage/state.json from root
const STATE_PATH = path.join(__dirname, 'storage', 'state.json');

// Default initial state values
const defaultState = {
    groqApiKey: "",
    trigonEnabled: true,
    trigonSealed: true
};

/**
 * Ensures ./storage/state.json exists
 */
function initStorage() {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(STATE_PATH)) {
        fs.writeFileSync(STATE_PATH, JSON.stringify(defaultState, null, 2));
    }
}

/**
 * Reads and returns the persistent state from ./storage/state.json
 */
export function getState() {
    initStorage();
    try {
        const data = fs.readFileSync(STATE_PATH, 'utf-8');
        return { ...defaultState, ...JSON.parse(data) };
    } catch {
        return defaultState;
    }
}

/**
 * Updates and persistently saves new state settings to ./storage/state.json
 */
export function updateState(newSettings) {
    initStorage();
    const currentState = getState();
    const updatedState = { ...currentState, ...newSettings };
    
    fs.writeFileSync(STATE_PATH, JSON.stringify(updatedState, null, 2));

    // Instantly sync Groq API Key to environment memory if updated
    if (newSettings.groqApiKey !== undefined) {
        process.env.GROQ_API_KEY = newSettings.groqApiKey;
    }

    return updatedState;
}

/**
 * Retrieves a single value from state by key
 */
export function getStateValue(key) {
    const currentState = getState();
    return currentState[key];
}