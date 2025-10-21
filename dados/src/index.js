import { downloadContentFromMessage, generateWAMessageFromContent, generateWAMessage, isJidNewsletter, getContentType } from '@cognima/walib';
import { exec, execSync } from 'child_process';
import { parseHTML } from 'linkedom';
import axios from 'axios';
import * as pathz from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as crypto from 'crypto';
import WaLib from '@cognima/walib';
import PerformanceOptimizer from './utils/performanceOptimizer.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import moment from 'moment-timezone';

const packageJson = JSON.parse(fs.readFileSync(pathz.join(__dirname, '..', '..', 'package.json'), 'utf-8'));
const botVersion = packageJson.version;
const DATABASE_DIR = __dirname + '/../database';
const GRUPOS_DIR = DATABASE_DIR + '/grupos';
const USERS_DIR = DATABASE_DIR + '/users';
const DONO_DIR = DATABASE_DIR + '/dono';
const PARCERIAS_DIR = pathz.join(DATABASE_DIR, 'parcerias');
const LEVELING_FILE = pathz.join(DATABASE_DIR, 'leveling.json');
const CUSTOM_AUTORESPONSES_FILE = pathz.join(DATABASE_DIR, 'customAutoResponses.json');
const DIVULGACAO_FILE = pathz.join(DONO_DIR, 'divulgacao.json');
const NO_PREFIX_COMMANDS_FILE = pathz.join(DATABASE_DIR, 'noPrefixCommands.json');
const COMMAND_ALIASES_FILE = pathz.join(DATABASE_DIR, 'commandAliases.json');
const GLOBAL_BLACKLIST_FILE = pathz.join(DONO_DIR, 'globalBlacklist.json');
const MENU_DESIGN_FILE = pathz.join(DONO_DIR, 'menuDesign.json');
const ECONOMY_FILE = pathz.join(DATABASE_DIR, 'economy.json');
const MSGPREFIX_FILE = pathz.join(DONO_DIR, 'msgprefix.json');
const CUSTOM_REACTS_FILE = pathz.join(DATABASE_DIR, 'customReacts.json');
const REMINDERS_FILE = pathz.join(DATABASE_DIR, 'reminders.json');
const CMD_NOT_FOUND_FILE = pathz.join(DONO_DIR, 'cmdNotFound.json');

//CONST ATALIAS
const API_KEY_BRONXYS = "benderbot"
const API_KEY_ZEROTWO = "benderbot"
var zerosite = "https://zero-two-apis.com.br"
const assBender = '𝑩𝒆𝒏𝒅𝒆𝒓𝑿 𝒗3.0'
const dattofc = moment.tz('America/Sao_Paulo').format('DD/MM/YYYY');
const hourofc = moment.tz('America/Sao_Paulo').format('HH:mm:ss');

function formatUptime(seconds, longFormat = false, showZero = false) {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor(seconds % (24 * 3600) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  const formats = longFormat ? {
    d: val => `${val} ${val === 1 ? 'dia' : 'dias'}`,
    h: val => `${val} ${val === 1 ? 'hora' : 'horas'}`,
    m: val => `${val} ${val === 1 ? 'minuto' : 'minutos'}`,
    s: val => `${val} ${val === 1 ? 'segundo' : 'segundos'}`
  } : {
    d: val => `${val}d`,
    h: val => `${val}h`,
    m: val => `${val}m`,
    s: val => `${val}s`
  };
  const uptimeStr = [];
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  return uptimeStr.length > 0 ? uptimeStr.join(longFormat ? ', ' : ' ') : longFormat ? '0 segundos' : '0s';
}
;
const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};

// Funções auxiliares para LID/JID
const isGroupId = (id) => id && typeof id === 'string' && id.endsWith('@g.us');
const isUserId = (id) => id && typeof id === 'string' && (id.includes('@lid') || id.includes('@s.whatsapp.net'));
const isValidLid = (str) => /^[a-zA-Z0-9_]+@lid$/.test(str);
const isValidJid = (str) => /^\d+@s\.whatsapp\.net$/.test(str);

// Função para extrair nome de usuário de LID/JID de forma compatível
const getUserName = (userId) => {
  if (!userId || typeof userId !== 'string') return 'unknown';
  if (userId.includes('@lid')) {
    return userId.split('@')[0];
  } else if (userId.includes('@s.whatsapp.net')) {
    return userId.split('@')[0];
  }
  return userId.split('@')[0] || userId;
};

// Função para obter LID a partir de JID (quando necessário para compatibilidade)
const getLidFromJid = async (bender, jid) => {
  if (!isValidJid(jid)) return jid; // Já é LID ou outro formato
  try {
    const result = await bender.onWhatsApp(jid);
    if (result && result[0] && result[0].lid) {
      return result[0].lid;
    }
  } catch (error) {
    console.warn(`Erro ao obter LID para ${jid}: ${error.message}`);
  }
  return jid; // Fallback para o JID original
};

// Função para construir ID do usuário (LID ou JID como fallback)
const buildUserId = (numberString, config) => {
  if (config.lidowner && numberString === config.numerodono) {
    return config.lidowner;
  }
  return numberString.replace(/[^\d]/g, '') + '@s.whatsapp.net';
};

// Função para obter o ID do bot
const getBotId = (bender) => {
  const botId = bender.user.id.split(':')[0];
  return botId.includes('@lid') ? botId : botId + '@s.whatsapp.net';
};
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true
      });
    }
    ;
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
  ;
}
;
function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = pathz.dirname(filePath);
      ensureDirectoryExists(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
    ;
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  }
  ;
}
;
const loadJsonFile = (path, defaultValue = {}) => {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : defaultValue;
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${path}:`, error);
    return defaultValue;
  }
};
ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);
ensureDirectoryExists(PARCERIAS_DIR);
ensureJsonFileExists(DATABASE_DIR + '/antiflood.json');
ensureJsonFileExists(DATABASE_DIR + '/cmdlimit.json');
ensureJsonFileExists(DATABASE_DIR + '/antispam.json', {
  enabled: false,
  limit: 5,
  interval: 10,
  blockTime: 600,
  users: {},
  blocks: {}
});
ensureJsonFileExists(DATABASE_DIR + '/antipv.json', {
  mode: 'off',
  message: '🚫 Este comando só funciona em grupos!'
});
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(DATABASE_DIR + '/globalBlocks.json', {
  commands: {},
  users: {}
});
ensureJsonFileExists(DATABASE_DIR + '/botState.json', {
  status: 'on'
});
ensureJsonFileExists(CUSTOM_AUTORESPONSES_FILE, {
  responses: []
});
ensureJsonFileExists(NO_PREFIX_COMMANDS_FILE, {
  commands: []
});
ensureJsonFileExists(COMMAND_ALIASES_FILE, {
  aliases: []
});
ensureJsonFileExists(GLOBAL_BLACKLIST_FILE, {
  users: {},
  groups: {}
});
ensureJsonFileExists(MENU_DESIGN_FILE, {
  header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
  menuTopBorder: "╭┈",
  bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
  menuTitleIcon: "🍧ฺꕸ▸",
  menuItemIcon: "•.̇𖥨֗🍓⭟",
  separatorIcon: "❁",
  middleBorder: "┊"
});
ensureJsonFileExists(ECONOMY_FILE, {
  users: {},
  shop: {
    "pickaxe_bronze": { name: "Picareta de Bronze", price: 500, type: "tool", toolType: "pickaxe", tier: "bronze", durability: 20, effect: { mineBonus: 0.1 } },
    "pickaxe_ferro": { name: "Picareta de Ferro", price: 1500, type: "tool", toolType: "pickaxe", tier: "ferro", durability: 60, effect: { mineBonus: 0.25 } },
    "pickaxe_diamante": { name: "Picareta de Diamante", price: 5000, type: "tool", toolType: "pickaxe", tier: "diamante", durability: 150, effect: { mineBonus: 0.5 } },
    "repairkit": { name: "Kit de Reparos", price: 350, type: "consumable", effect: { repair: 40 } },
    "vault": { name: "Cofre", price: 1000, type: "upgrade", effect: { bankCapacity: 5000 } },
    "lucky": { name: "Amuleto da Sorte", price: 1500, type: "upgrade", effect: { workBonus: 0.2 } },
    "rod": { name: "Vara de Pesca", price: 400, type: "tool", effect: { fishBonus: 0.2 } },
    "lamp": { name: "Lanterna", price: 600, type: "tool", effect: { exploreBonus: 0.2 } },
    "bow": { name: "Arco de Caça", price: 800, type: "tool", effect: { huntBonus: 0.25 } },
    "forge": { name: "Kit de Forja", price: 1200, type: "tool", effect: { forgeBonus: 0.25 } }
  },
  materialsPrices: {
    pedra: 2,
    ferro: 6,
    ouro: 12,
    diamante: 30
  },
  recipes: {
    pickaxe_bronze: { requires: { pedra: 10, ferro: 2 }, gold: 100 },
    pickaxe_ferro: { requires: { ferro: 10, ouro: 2 }, gold: 300 },
    pickaxe_diamante: { requires: { ouro: 10, diamante: 4 }, gold: 1200 }
  },
  jobCatalog: {
    "estagiario": { name: "Estagiário", min: 80, max: 140 },
    "designer": { name: "Designer", min: 150, max: 250 },
    "programador": { name: "Programador", min: 200, max: 350 },
    "gerente": { name: "Gerente", min: 260, max: 420 },
    "ladrao": { name: "Ladrão", min: 99, max: 620 },
  }
});
ensureJsonFileExists(LEVELING_FILE, {
  users: {},
  patents: [{
    name: "Iniciante",
    minLevel: 1
  }, {
    name: "Aprendiz",
    minLevel: 2
  }, {
    name: "Explorador",
    minLevel: 5
  }, {
    name: "Aventureiro",
    minLevel: 10
  }, {
    name: "Veterano",
    minLevel: 15
  }, {
    name: "Mestre",
    minLevel: 20
  }, {
    name: "Lenda",
    minLevel: 25
  }, {
    name: "Herói",
    minLevel: 30
  }, {
    name: "Conquistador",
    minLevel: 35
  }, {
    name: "Imperador",
    minLevel: 40
  }, {
    name: "Deus",
    minLevel: 50
  }, {
    name: "Titã",
    minLevel: 60
  }, {
    name: "Soberano",
    minLevel: 70
  }, {
    name: "Celestial",
    minLevel: 80
  }, {
    name: "Imortal",
    minLevel: 90
  }, {
    name: "Divindade",
    minLevel: 100
  }, {
    name: "Cosmico",
    minLevel: 120
  }, {
    name: "Eterno",
    minLevel: 140
  }, {
    name: "Supremo",
    minLevel: 160
  }, {
    name: "Omnipotente",
    minLevel: 180
  }, {
    name: "Transcendente",
    minLevel: 200
  }, {
    name: "Absoluto",
    minLevel: 250
  }, {
    name: "Infinito",
    minLevel: 300
  }]
});
ensureJsonFileExists(MSGPREFIX_FILE, { message: false });
ensureJsonFileExists(CUSTOM_REACTS_FILE, { reacts: [] });
ensureJsonFileExists(REMINDERS_FILE, { reminders: [] });
ensureJsonFileExists(CMD_NOT_FOUND_FILE, {
  enabled: true,
  message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
  style: 'friendly',
  variables: {
    command: '{command}',
    prefix: '{prefix}',
    user: '{user}',
    botName: '{botName}',
    userName: '{userName}'
  }
});
const loadMsgPrefix = () => {
  return loadJsonFile(MSGPREFIX_FILE, { message: false }).message;
};

const saveMsgPrefix = (message) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(MSGPREFIX_FILE, JSON.stringify({ message }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar msgprefix:', error);
    return false;
  }
};

const loadCmdNotFoundConfig = () => {
  return loadJsonFile(CMD_NOT_FOUND_FILE, {
    enabled: true,
    message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
    style: 'friendly',
    variables: {
      command: '{command}',
      prefix: '{prefix}',
      user: '{user}',
      botName: '{botName}',
      userName: '{userName}'
    }
  });
};

const saveCmdNotFoundConfig = (config, action = 'update') => {
  try {
    ensureDirectoryExists(DONO_DIR);
    const validatedConfig = {
      enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
      message: config.message || '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
      style: ['friendly', 'formal', 'casual', 'emoji'].includes(config.style) ? config.style : 'friendly',
      variables: {
        command: config.variables?.command || '{command}',
        prefix: config.variables?.prefix || '{prefix}',
        user: config.variables?.user || '{user}',
        botName: config.variables?.botName || '{botName}',
        userName: config.variables?.userName || '{userName}'
      },
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CMD_NOT_FOUND_FILE, JSON.stringify(validatedConfig, null, 2));
    
    const logMessage = `🔧 Configuração de comando não encontrado ${action}:\n` +
      `• Status: ${validatedConfig.enabled ? 'ATIVADO' : 'DESATIVADO'}\n` +
      `• Estilo: ${validatedConfig.style}\n` +
      `• Mensagem: ${validatedConfig.message.substring(0, 50)}${validatedConfig.message.length > 50 ? '...' : ''}\n` +
      `• Em: ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(logMessage);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configuração de comando não encontrado:', error);
    return false;
  }
};

const validateMessageTemplate = (template) => {
  if (!template || typeof template !== 'string') {
    return { valid: false, error: 'Mensagem inválida ou vazia' };
  }
  
  const issues = [];
  
  const openBraces = (template.match(/\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Número desigual de chaves abertas e fechadas');
  }
  
  const validVariables = ['{command}', '{prefix}', '{user}', '{botName}', '{userName}'];
  const foundVariables = template.match(/\{[^}]+\}/g) || [];
  
  foundVariables.forEach(variable => {
    if (!validVariables.includes(variable)) {
      issues.push(`Variável inválida: ${variable}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : null,
    variables: foundVariables
  };
};

const formatMessageWithFallback = (template, variables, fallbackMessage) => {
  try {
    const validation = validateMessageTemplate(template);
    if (!validation.valid) {
      console.warn('⚠️ Template de mensagem inválido:', validation.issues);
      return fallbackMessage;
    }
    
    let formattedMessage = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });
    
    return formattedMessage;
  } catch (error) {
    console.error('❌ Erro ao formatar mensagem:', error);
    return fallbackMessage;
  }
};
const loadCustomReacts = () => {
  return loadJsonFile(CUSTOM_REACTS_FILE, { reacts: [] }).reacts || [];
};

const saveCustomReacts = (reacts) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CUSTOM_REACTS_FILE, JSON.stringify({ reacts }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar custom reacts:', error);
    return false;
  }
};

const loadReminders = () => {
  return loadJsonFile(REMINDERS_FILE, { reminders: [] }).reminders || [];
};

const saveReminders = (reminders) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify({ reminders }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar lembretes:', error);
    return false;
  }
};

const addCustomReact = (trigger, emoji) => {
  if (!trigger || !emoji) return { success: false, message: 'Trigger e emoji são obrigatórios.' };
  const reacts = loadCustomReacts();
  const existing = reacts.find(r => normalizar(r.trigger) === normalizar(trigger));
  if (existing) return { success: false, message: 'Já existe um react para este trigger.' };
  const newReact = { id: Date.now().toString(), trigger: normalizar(trigger), emoji };
  reacts.push(newReact);
  return saveCustomReacts(reacts) ? { success: true, message: 'React adicionado com sucesso!', id: newReact.id } : { success: false, message: 'Erro ao salvar.' };
};

const deleteCustomReact = (id) => {
  const reacts = loadCustomReacts();
  const filtered = reacts.filter(r => r.id !== id);
  if (filtered.length === reacts.length) return { success: false, message: 'React não encontrado.' };
  return saveCustomReacts(filtered) ? { success: true, message: 'React removido com sucesso!' } : { success: false, message: 'Erro ao salvar.' };
};

const loadDivulgacao = () => {
  return loadJsonFile(DIVULGACAO_FILE, { savedMessage: "" });
};

const saveDivulgacao = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(DIVULGACAO_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar divulgação.json:', error);
    return false;
  }
};

const SUBDONOS_FILE = pathz.join(DONO_DIR, 'subdonos.json');
ensureJsonFileExists(SUBDONOS_FILE, {
  subdonos: []
});
const loadSubdonos = () => {
  return loadJsonFile(SUBDONOS_FILE, {
    subdonos: []
  }).subdonos || [];
};
const saveSubdonos = subdonoList => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(SUBDONOS_FILE, JSON.stringify({
      subdonos: subdonoList
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subdonos:', error);
    return false;
  }
  ;
};
const isSubdono = userId => {
  const currentSubdonos = loadSubdonos();
  return currentSubdonos.includes(userId);
};
const addSubdono = (userId, numerodono) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  ;
  let currentSubdonos = loadSubdonos();
  if (currentSubdonos.includes(userId)) {
    return {
      success: false,
      message: '✨ Este usuário já é um subdono!'
    };
  }
  ;
  const nmrdn_check = buildUserId(numerodono, config);
  const ownerJid = `${numerodono}@s.whatsapp.net`;
  if (userId === nmrdn_check || userId === ownerJid || (config.lidowner && userId === config.lidowner)) {
    return {
      success: false,
      message: '🤔 O Dono principal já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉'
    };
  }
  ;
  currentSubdonos.push(userId);
  if (saveSubdonos(currentSubdonos)) {
    return {
      success: true,
      message: '🎉 Pronto! Novo subdono adicionado com sucesso! ✨'
    };
  } else {
    return {
      success: false,
      message: '❌ Erro ao salvar a lista de subdonos. Tente novamente.'
    };
  }
  ;
};
const removeSubdono = userId => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  let currentSubdonos = loadSubdonos();
  if (!currentSubdonos.includes(userId)) {
    return {
      success: false,
      message: '🤔 Este usuário não está na lista de subdonos.'
    };
  }
  ;
  const initialLength = currentSubdonos.length;
  currentSubdonos = currentSubdonos.filter(id => id !== userId);
  if (currentSubdonos.length === initialLength) {
    return {
      success: false,
      message: 'Usuário não encontrado na lista (erro inesperado). 🤷'
    };
  }
  ;
  if (saveSubdonos(currentSubdonos)) {
    return {
      success: true,
      message: '👋 Pronto! Subdono removido com sucesso! ✨'
    };
  } else {
    return {
      success: false,
      message: '❌ Erro ao salvar a lista após remover o subdono. Tente novamente.'
    };
  }
  ;
};
const getSubdonos = () => {
  return [...loadSubdonos()];
};
const ALUGUEIS_FILE = pathz.join(DONO_DIR, 'alugueis.json');
const CODIGOS_ALUGUEL_FILE = pathz.join(DONO_DIR, 'codigos_aluguel.json');
ensureJsonFileExists(ALUGUEIS_FILE, {
  globalMode: false,
  groups: {}
});
ensureJsonFileExists(CODIGOS_ALUGUEL_FILE, {
  codes: {}
});
const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, {
    globalMode: false,
    groups: {}
  });
};
const saveRentalData = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(ALUGUEIS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de aluguel:', error);
    return false;
  }
};
const isRentalModeActive = () => {
  const rentalData = loadRentalData();
  return rentalData.globalMode === true;
};
const setRentalMode = isActive => {
  let rentalData = loadRentalData();
  rentalData.globalMode = !!isActive;
  return saveRentalData(rentalData);
};
const getGroupRentalStatus = groupId => {
  const rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return {
      active: false,
      expiresAt: null,
      permanent: false
    };
  }
  if (groupInfo.expiresAt === 'permanent') {
    return {
      active: true,
      expiresAt: 'permanent',
      permanent: true
    };
  }
  if (groupInfo.expiresAt) {
    const expirationDate = new Date(groupInfo.expiresAt);
    if (expirationDate > new Date()) {
      return {
        active: true,
        expiresAt: groupInfo.expiresAt,
        permanent: false
      };
    } else {
      return {
        active: false,
        expiresAt: groupInfo.expiresAt,
        permanent: false
      };
    }
  }
  return {
    active: false,
    expiresAt: null,
    permanent: false
  };
};
const setGroupRental = (groupId, durationDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return {
      success: false,
      message: '🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).'
    };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = `✅ Aluguel permanente ativado!`;
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    expiresAt = expirationDate.toISOString();
    message = `✅ Aluguel ativado por ${durationDays} dias! Expira em: ${expirationDate.toLocaleDateString('pt-BR')}.`;
  } else {
    return {
      success: false,
      message: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".'
    };
  }
  rentalData.groups[groupId] = {
    expiresAt
  };
  if (saveRentalData(rentalData)) {
    return {
      success: true,
      message: message
    };
  } else {
    return {
      success: false,
      message: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.'
    };
  }
};
const loadActivationCodes = () => {
  return loadJsonFile(CODIGOS_ALUGUEL_FILE, {
    codes: {}
  });
};
const saveActivationCodes = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CODIGOS_ALUGUEL_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar códigos de ativação:', error);
    return false;
  }
};
const generateActivationCode = (durationDays, targetGroupId = null) => {
  let code = '';
  let codesData = loadActivationCodes();
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (codesData.codes[code]);
  if (durationDays !== 'permanent' && (typeof durationDays !== 'number' || durationDays <= 0)) {
    return {
      success: false,
      message: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".'
    };
  }
  if (targetGroupId && (typeof targetGroupId !== 'string' || !isGroupId(targetGroupId))) {
    
    targetGroupId = null;
  }
  codesData.codes[code] = {
    duration: durationDays,
    targetGroup: targetGroupId,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString()
  };
  if (saveActivationCodes(codesData)) {
    let message = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
    if (durationDays === 'permanent') {
      message += `Duração: Permanente ✨\n`;
    } else {
      
      message += `Duração: ${durationDays} dias ⏳\n`;
    }
    if (targetGroupId) {
      
      message += `Grupo Alvo: ${targetGroupId} 🎯\n`;
    }
    
    message += `\nEnvie este código no grupo para ativar o aluguel.`;
    return {
      success: true,
      message: message,
      code: code
    };
  } else {
    return {
      success: false,
      message: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!'
    };
  }
};
const validateActivationCode = code => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];
  if (!codeInfo) {
    return {
      valid: false,
      message: '🤷 Código de ativação inválido ou não encontrado!'
    };
  }
  if (codeInfo.used) {
    return {
      valid: false,
      message: `😕 Este código já foi usado em ${new Date(codeInfo.usedAt).toLocaleDateString('pt-BR')} por ${getUserName(codeInfo.usedBy) || 'alguém'}!`
    };
  }
  return {
    valid: true,
    ...codeInfo
  };
};
const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.message
    };
  }
  const codeInfo = validation;
  var code;
  code = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return {
      success: false,
      message: '🔒 Este código de ativação é específico para outro grupo!'
    };
  }
  ;
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return {
      success: false,
      message: `😥 Oops! Erro ao ativar o aluguel com este código: ${rentalResult.message}`
    };
  }
  let codesData = loadActivationCodes();
  codesData.codes[code].used = true;
  codesData.codes[code].usedBy = userId;
  codesData.codes[code].usedAt = new Date().toISOString();
  codesData.codes[code].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return {
      success: true,
      message: `🎉 Código *${code}* ativado com sucesso! ${rentalResult.message}`
    };
  } else {
    console.error(`Falha CRÍTICA ao marcar código ${code} como usado após ativar aluguel para ${groupId}.`);
    return {
      success: false,
      message: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!'
    };
  }
};
const extendGroupRental = (groupId, extraDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return {
      success: false,
      message: 'ID de grupo inválido.'
    };
  }
  if (typeof extraDays !== 'number' || extraDays <= 0) {
    return {
      success: false,
      message: 'Número de dias extras inválido. Deve ser um número positivo.'
    };
  }
  let rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return {
      success: false,
      message: 'Este grupo não possui aluguel configurado.'
    };
  }
  let newExpiresAt = null;
  if (groupInfo.expiresAt === 'permanent') {
    return {
      success: false,
      message: 'Aluguel já é permanente, não é possível estender.'
    };
  }
  const currentExpires = new Date(groupInfo.expiresAt);
  const now = new Date();
  if (currentExpires < now) {
    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + extraDays);
    newExpiresAt = newExpiration.toISOString();
  } else {
    currentExpires.setDate(currentExpires.getDate() + extraDays);
    newExpiresAt = currentExpires.toISOString();
  }
  rentalData.groups[groupId].expiresAt = newExpiresAt;
  if (saveRentalData(rentalData)) {
    return {
      success: true,
      message: `Aluguel estendido por ${extraDays} dias. Nova expiração: ${new Date(newExpiresAt).toLocaleDateString('pt-BR')}.`
    };
  } else {
    return {
      success: false,
      message: 'Erro ao salvar as informações de aluguel estendido.'
    };
  }
};
const isModoLiteActive = (groupData, modoLiteGlobalConfig) => {
  const isModoLiteGlobal = modoLiteGlobalConfig?.status || false;
  const isModoLiteGrupo = groupData?.modolite || false;
  const groupHasSetting = groupData && typeof groupData.modolite === 'boolean';
  if (groupHasSetting) {
    return groupData.modolite;
  }
  return isModoLiteGlobal;
};
const loadParceriasData = groupId => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  return loadJsonFile(filePath, {
    active: false,
    partners: {}
  });
};
const saveParceriasData = (groupId, data) => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar dados de parcerias para ${groupId}:`, error);
    return false;
  }
};
function calculateNextLevelXp(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}
function getPatent(level, patents) {
  for (let i = patents.length - 1; i >= 0; i--) {
    if (level >= patents[i].minLevel) {
      return patents[i].name;
    }
  }
  return "Iniciante";
}

//=======Atalias Horario de Brasilia=============\\

/* ------- [ Horário Oficial de Brasília Loami ] ------- */
/* Data & Hora */
const time = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
const hora = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
const date = moment.tz('America/Sao_Paulo').format('DD/MM/YYYY');


const time2 = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
if(time2 > "00:00:00" && time2 < "05:00:00") {
    var tempo = 'Boa noite';
} if(time2 > "05:00:00" && time2 < "12:00:00") {
    var tempo = 'Bom dia';
} if(time2 > "12:00:00" && time2 < "18:00:00") {
    var tempo = 'Boa tarde'
} if(time2 > "18:00:00") {
    var tempo = 'Boa noite';
};


// ====== Economia (Gold) Helpers ======
function loadEconomy() {
  return loadJsonFile(ECONOMY_FILE, { users: {}, shop: {}, jobCatalog: {} });
}
function saveEconomy(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { console.error('❌ Erro ao salvar economy.json:', e); return false; }
}
function getEcoUser(econ, userId) {
  econ.users[userId] = econ.users[userId] || { wallet: 0, bank: 0, cooldowns: {}, inventory: {}, job: null, tools: {}, materials: {}, challenge: null, weeklyChallenge: null, monthlyChallenge: null, skills: {}, properties: {} };
  const u = econ.users[userId];
  u.cooldowns = u.cooldowns || {};
  u.inventory = u.inventory || {};
  if (typeof u.job === 'undefined') u.job = null;
  u.tools = u.tools || {};
  u.materials = u.materials || {};
  u.challenge = u.challenge || null;
  u.weeklyChallenge = u.weeklyChallenge || null;
  u.monthlyChallenge = u.monthlyChallenge || null;
  u.skills = u.skills || {};
  u.properties = u.properties || {};
  return u;
}
function parseAmount(text, maxValue) {
  if (!text) return NaN;
  const t = text.trim().toLowerCase();
  if (['all', 'tudo', 'max'].includes(t)) return maxValue;
  const n = parseInt(t.replace(/[^0-9]/g, ''));
  return isNaN(n) ? NaN : Math.max(0, n);
}
function fmt(n) { return new Intl.NumberFormat('pt-BR').format(Math.floor(n)); }
function timeLeft(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return '0s';
  const s = Math.ceil(diff / 1000);
  const m = Math.floor(s / 60); const rs = s % 60; const h = Math.floor(m / 60); const rm = m % 60;
  return h > 0 ? `${h}h ${rm}m` : (m > 0 ? `${m}m ${rs}s` : `${rs}s`);
}
function applyShopBonuses(user, econ) {
  const inv = user.inventory || {};
  const shop = econ.shop || {};
  let mineBonus = 0; let workBonus = 0; let bankCapacity = Infinity; let fishBonus = 0; let exploreBonus = 0; let huntBonus = 0; let forgeBonus = 0;
  Object.entries(inv).forEach(([key, qty]) => {
    if (!qty || !shop[key]) return;
    const eff = shop[key].effect || {};
    if (eff.mineBonus) mineBonus += eff.mineBonus * qty;
    if (eff.workBonus) workBonus += eff.workBonus * qty;
    if (eff.bankCapacity) bankCapacity = isFinite(bankCapacity) ? bankCapacity + eff.bankCapacity * qty : (eff.bankCapacity * qty);
    if (eff.fishBonus) fishBonus += eff.fishBonus * qty;
    if (eff.exploreBonus) exploreBonus += eff.exploreBonus * qty;
    if (eff.huntBonus) huntBonus += eff.huntBonus * qty;
    if (eff.forgeBonus) forgeBonus += eff.forgeBonus * qty;
  });
  return { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus, forgeBonus };
}
// ===== Economia: Ferramentas, Materiais, Desafios =====
const PICKAXE_TIER_MULT = { bronze: 1.0, ferro: 1.25, diamante: 1.6 };
const PICKAXE_TIER_ORDER = { bronze: 1, ferro: 2, diamante: 3 };
function getActivePickaxe(user) {
  const pk = user.tools?.pickaxe;
  if (!pk || pk.dur <= 0) return null;
  return pk;
}
function ensureEconomyDefaults(econ) {
  let changed = false;
  econ.shop = econ.shop || {};
  const defs = {
    "pickaxe_bronze": { name: "Picareta de Bronze", price: 500, type: "tool", toolType: "pickaxe", tier: "bronze", durability: 20, effect: { mineBonus: 0.1 } },
    "pickaxe_ferro": { name: "Picareta de Ferro", price: 1500, type: "tool", toolType: "pickaxe", tier: "ferro", durability: 60, effect: { mineBonus: 0.25 } },
    "pickaxe_diamante": { name: "Picareta de Diamante", price: 5000, type: "tool", toolType: "pickaxe", tier: "diamante", durability: 150, effect: { mineBonus: 0.5 } },
    "repairkit": { name: "Kit de Reparos", price: 350, type: "consumable", effect: { repair: 40 } }
  };
  for (const [k,v] of Object.entries(defs)) { if (!econ.shop[k]) { econ.shop[k]=v; changed=true; } }
  econ.materialsPrices = econ.materialsPrices || { pedra: 2, ferro: 6, ouro: 12, diamante: 30 };
  econ.recipes = econ.recipes || {
    pickaxe_bronze: { requires: { pedra: 10, ferro: 2 }, gold: 100 },
    pickaxe_ferro: { requires: { ferro: 10, ouro: 2 }, gold: 300 },
    pickaxe_diamante: { requires: { ouro: 10, diamante: 4 }, gold: 1200 }
  };
  // Mercado e Propriedades
  if (!Array.isArray(econ.market)) { econ.market = []; changed = true; }
  if (typeof econ.marketCounter !== 'number') { econ.marketCounter = 1; changed = true; }
  econ.propertiesCatalog = econ.propertiesCatalog || {
    casa: { name: 'Casa', price: 5000, upkeepPerDay: 50, incomeGoldPerDay: 80 },
    fazenda: { name: 'Fazenda', price: 15000, upkeepPerDay: 150, incomeMaterialsPerDay: { pedra: 6, ferro: 1 } },
    mina_privada: { name: 'Mina Privada', price: 30000, upkeepPerDay: 400, incomeMaterialsPerDay: { pedra: 12, ferro: 3, ouro: 1 } }
  };
  return changed;
}
function giveMaterial(user, key, qty) {
  user.materials[key] = (user.materials[key] || 0) + Math.max(0, Math.floor(qty));
}
function generateDailyChallenge(now=new Date()) {
  const end = new Date(now);
  end.setHours(23,59,59,999);
  const pick = (arr,n) => arr.sort(()=>Math.random()-0.5).slice(0,n);
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = pick(types,3).map(t=>({ type:t, target: 3 + Math.floor(Math.random()*5), progress:0 }));
  const reward = 300 + Math.floor(Math.random()*401); // 300-700
  return { expiresAt: end.getTime(), tasks: chosen, reward, claimed:false };
}
function ensureUserChallenge(user){
  const now = Date.now();
  if (!user.challenge || now > (user.challenge.expiresAt||0)) {
    user.challenge = generateDailyChallenge(new Date());
  }
}
function updateChallenge(user, type, inc=1, successFlag=true){
  ensureUserChallenge(user);
  const ch = user.challenge; if (!ch || ch.claimed) return;
  ch.tasks.forEach(task=>{
    if (task.type === type) {
      if (type.endsWith('Success')) { if (!successFlag) return; }
      task.progress = Math.min(task.target, (task.progress||0) + inc);
    }
  });
}
function isChallengeCompleted(user){
  const ch = user.challenge; if (!ch) return false;
  return ch.tasks.every(t=> (t.progress||0) >= t.target);
}

// ===== Habilidades (Skills) e Desafios Periódicos =====
const SKILL_LIST = ['mining','working','fishing','exploring','hunting','forging','crime'];
function ensureUserSkills(user){
  user.skills = user.skills || {};
  for (const s of SKILL_LIST){
    user.skills[s] = user.skills[s] || { level: 1, xp: 0 };
  }
}
function skillXpForNext(level){
  return Math.floor(50 * Math.pow(1.35, Math.max(0, level - 1)));
}
function addSkillXP(user, skill, amount=1){
  ensureUserSkills(user);
  if (!SKILL_LIST.includes(skill)) return;
  const sk = user.skills[skill];
  sk.xp += Math.max(0, Math.floor(amount));
  let leveled = 0;
  while (sk.xp >= skillXpForNext(sk.level)){
    sk.xp -= skillXpForNext(sk.level);
    sk.level += 1; leveled++;
    if (sk.level > 1000) break; // hard cap
  }
  return leveled;
}
function getSkillBonus(user, skill){
  ensureUserSkills(user);
  const lvl = user.skills[skill]?.level || 1;
  return 0.02 * Math.max(0, (lvl - 1)); // +2% por nível
}

function endOfWeekTimestamp(date=new Date()){
  // Considera semana terminando no domingo 23:59:59
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = (7 - day) % 7; // dias até domingo
  d.setDate(d.getDate() + diff);
  d.setHours(23,59,59,999);
  return d.getTime();
}
function endOfMonthTimestamp(date=new Date()){
  const d = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
  return d.getTime();
}
function generateWeeklyChallenge(now=new Date()){
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,4).map(t=>({ type:t, target: 15 + Math.floor(Math.random()*16), progress:0 }));
  const reward = 3000 + Math.floor(Math.random()*2001); // 3000-5000
  return { expiresAt: endOfWeekTimestamp(now), tasks: chosen, reward, claimed:false };
}
function generateMonthlyChallenge(now=new Date()){
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,5).map(t=>({ type:t, target: 60 + Math.floor(Math.random()*41), progress:0 }));
  const reward = 15000 + Math.floor(Math.random()*5001); // 15000-20000
  return { expiresAt: endOfMonthTimestamp(now), tasks: chosen, reward, claimed:false };
}
function ensureUserPeriodChallenges(user){
  const now = Date.now();
  if (!user.weeklyChallenge || now > (user.weeklyChallenge.expiresAt||0)) user.weeklyChallenge = generateWeeklyChallenge(new Date());
  if (!user.monthlyChallenge || now > (user.monthlyChallenge.expiresAt||0)) user.monthlyChallenge = generateMonthlyChallenge(new Date());
}
function updatePeriodChallenge(user, type, inc=1, successFlag=true){
  ensureUserPeriodChallenges(user);
  for (const ch of [user.weeklyChallenge, user.monthlyChallenge]){
    if (!ch || ch.claimed) continue;
    ch.tasks.forEach(task=>{
      if (task.type === type){
        if (type.endsWith('Success') && !successFlag) return;
        task.progress = Math.min(task.target, (task.progress||0) + inc);
      }
    });
  }
}
function isPeriodCompleted(ch){
  if (!ch) return false; return ch.tasks.every(t=> (t.progress||0) >= t.target);
}

function checkLevelUp(userId, userData, levelingData, bender, from) {
  const nextLevelXp = calculateNextLevelXp(userData.level);
  if (userData.xp >= nextLevelXp) {
    userData.level++;
    userData.xp -= nextLevelXp;
    userData.patent = getPatent(userData.level, levelingData.patents);

    // --- RECOMPENSA EM BCOINS (NOVA LÓGICA) ---
        const REWARD_BCOINS = 5;
        
        // Carrega a economia
        const econ = loadEconomy(); 
        // Pega o usuário na economia (use userId)
        const ecoUser = getEcoUser(econ, userId); 
        
        // Adiciona a recompensa à carteira
        ecoUser.wallet += REWARD_BCOINS;
        
        // Salva os dados da economia
        saveEconomy(econ); 
        // ------------------------------------------

    fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingData, null, 2));
    bender.sendMessage(from, {
            text: `🎉 @${getUserName(userId)} subiu para o nível ${userData.level}!\n` + 
                  `🔹 XP atual: ${userData.xp}\n` + 
                  `🎖️ Nova patente: ${userData.patent}\n\n` +
                  `💰 RECOMPENSA: Você ganhou *${fmt(REWARD_BCOINS)} BCOINS*! Saldo atual: *${fmt(ecoUser.wallet)} BCOINS.*`, // Exibe a recompensa e o novo saldo
            mentions: [userId]
        });
  }
}
function checkLevelDown(userId, userData, levelingData) {
  while (userData.xp < 0 && userData.level > 1) {
    userData.level--;
    const prevLevelXp = calculateNextLevelXp(userData.level - 1);
    userData.xp += prevLevelXp;
  }
  if (userData.xp < 0) {
    userData.xp = 0;
  }
  userData.patent = getPatent(userData.level, levelingData.patents);
}
const loadCustomAutoResponses = () => {
  return loadJsonFile(CUSTOM_AUTORESPONSES_FILE, {
    responses: []
  }).responses || [];
};
const saveCustomAutoResponses = responses => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CUSTOM_AUTORESPONSES_FILE, JSON.stringify({
      responses
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas personalizadas:', error);
    return false;
  }
};

// Funções para auto-respostas com suporte a mídia
const loadGroupAutoResponses = (groupId) => {
  const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
  const groupData = loadJsonFile(groupFile, {});
  return groupData.autoResponses || [];
};

const saveGroupAutoResponses = (groupId, autoResponses) => {
  try {
    const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
    let groupData = loadJsonFile(groupFile, {});
    groupData.autoResponses = autoResponses;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas do grupo:', error);
    return false;
  }
};

const addAutoResponse = async (groupId, trigger, responseData, isGlobal = false) => {
  try {
    const newResponse = {
      id: Date.now().toString(),
      trigger: normalizar(trigger),
      response: responseData,
      createdAt: new Date().toISOString(),
      isGlobal: isGlobal
    };

    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      globalResponses.push(newResponse);
      return saveCustomAutoResponses(globalResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      groupResponses.push(newResponse);
      return saveGroupAutoResponses(groupId, groupResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar auto-resposta:', error);
    return false;
  }
};

const deleteAutoResponse = (groupId, responseId, isGlobal = false) => {
  try {
    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      const filteredResponses = globalResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === globalResponses.length) return false;
      return saveCustomAutoResponses(filteredResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      const filteredResponses = groupResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === groupResponses.length) return false;
      return saveGroupAutoResponses(groupId, filteredResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar auto-resposta:', error);
    return false;
  }
};

const processAutoResponse = async (bender, from, triggerText, info) => {
  try {
    const normalizedTrigger = normalizar(triggerText);
    
    // Verificar auto-respostas globais (do dono)
    const globalResponses = loadCustomAutoResponses();
    for (const response of globalResponses) {
      if (normalizedTrigger.includes(response.trigger || response.received)) {
        await sendAutoResponse(bender, from, response, info);
        return true;
      }
    }

    // Verificar auto-respostas do grupo (dos admins)
    if (from.endsWith('@g.us')) {
      const groupResponses = loadGroupAutoResponses(from);
      for (const response of groupResponses) {
        if (normalizedTrigger.includes(response.trigger)) {
          await sendAutoResponse(bender, from, response, info);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao processar auto-resposta:', error);
    return false;
  }
};

const sendAutoResponse = async (bender, from, response, quotedMessage) => {
  try {
    const responseData = response.response || response;
    
    // Compatibilidade com sistema antigo (apenas texto)
    if (typeof responseData === 'string') {
      await bender.sendMessage(from, { text: responseData }, { quoted: quotedMessage });
      return;
    }

    // Sistema novo com suporte a mídia
    const messageContent = {};
    const sendOptions = { quoted: quotedMessage };

    switch (responseData.type) {
      case 'text':
        messageContent.text = responseData.content;
        break;

      case 'image':
        if (responseData.buffer) {
          messageContent.image = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.image = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'video':
        if (responseData.buffer) {
          messageContent.video = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.video = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'audio':
        if (responseData.buffer) {
          messageContent.audio = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.audio = { url: responseData.url };
        }
        messageContent.mimetype = 'audio/mp4';
        messageContent.ptt = responseData.ptt || false;
        break;

      case 'sticker':
        if (responseData.buffer) {
          messageContent.sticker = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.sticker = { url: responseData.url };
        }
        break;

      default:
        messageContent.text = responseData.content || 'Resposta automática';
    }

    await bender.sendMessage(from, messageContent, sendOptions);
  } catch (error) {
    console.error('❌ Erro ao enviar auto-resposta:', error);
  }
};
const loadNoPrefixCommands = () => {
  return loadJsonFile(NO_PREFIX_COMMANDS_FILE, {
    commands: []
  }).commands || [];
};
const saveNoPrefixCommands = commands => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(NO_PREFIX_COMMANDS_FILE, JSON.stringify({
      commands
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos sem prefixo:', error);
    return false;
  }
};
const loadCommandAliases = () => {
  return loadJsonFile(COMMAND_ALIASES_FILE, {
    aliases: []
  }).aliases || [];
};
const saveCommandAliases = aliases => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(COMMAND_ALIASES_FILE, JSON.stringify({
      aliases
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar apelidos de comandos:', error);
    return false;
  }
};
const loadGlobalBlacklist = () => {
  return loadJsonFile(GLOBAL_BLACKLIST_FILE, {
    users: {},
    groups: {}
  });
};
const saveGlobalBlacklist = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(GLOBAL_BLACKLIST_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar blacklist global:', error);
    return false;
  }
};
const addGlobalBlacklist = (userId, reason, addedBy) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  let blacklistData = loadGlobalBlacklist();
  if (blacklistData.users[userId]) {
    return {
      success: false,
      message: `✨ Usuário @${getUserName(userId)} já está na blacklist global!`
    };
  }
  blacklistData.users[userId] = {
    reason: reason || 'Não especificado',
    addedBy: addedBy || 'Desconhecido',
    addedAt: new Date().toISOString()
  };
  if (saveGlobalBlacklist(blacklistData)) {
    return {
      success: true,
      message: `🎉 Usuário @${getUserName(userId)} adicionado à blacklist global com sucesso! Motivo: ${reason || 'Não especificado'}`
    };
  } else {
    return {
      success: false,
      message: '😥 Erro ao salvar a blacklist global. Tente novamente!'
    };
  }
};
const removeGlobalBlacklist = userId => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  let blacklistData = loadGlobalBlacklist();
  if (!blacklistData.users[userId]) {
    return {
      success: false,
      message: `🤔 Usuário @${getUserName(userId)} não está na blacklist global.`
    };
  }
  delete blacklistData.users[userId];
  if (saveGlobalBlacklist(blacklistData)) {
    return {
      success: true,
      message: `👋 Usuário @${getUserName(userId)} removido da blacklist global com sucesso!`
    };
  } else {
    return {
      success: false,
      message: '😥 Erro ao salvar a blacklist global após remoção. Tente novamente!'
    };
  }
};
const getGlobalBlacklist = () => {
  return loadGlobalBlacklist();
};

const loadMenuDesign = () => {
  try {
    if (fs.existsSync(MENU_DESIGN_FILE)) {
      return JSON.parse(fs.readFileSync(MENU_DESIGN_FILE, 'utf-8'));
    } else {
      return {
        header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
        menuTopBorder: "╭┈",
        bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
        menuTitleIcon: "🍧ฺꕸ▸",
        menuItemIcon: "•.̇𖥨֗🍓⭟",
        separatorIcon: "❁",
        middleBorder: "┊"
      };
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar design do menu: ${error.message}`);
    return {
      header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
      menuTopBorder: "╭┈",
      bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
      menuTitleIcon: "🍧ฺꕸ▸",
      menuItemIcon: "•.̇𖥨֗🍓⭟",
      separatorIcon: "❁",
      middleBorder: "┊"
    };
  }
};

const saveMenuDesign = (design) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(MENU_DESIGN_FILE, JSON.stringify(design, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar design do menu: ${error.message}`);
    return false;
  }
};

const getMenuDesignWithDefaults = (botName, userName) => {
  const design = loadMenuDesign();
  
  // Substitui os placeholders pelos valores atuais
  const processedDesign = {};
  for (const [key, value] of Object.entries(design)) {
    if (typeof value === 'string') {
      processedDesign[key] = value
        .replace(/{botName}/g, botName)
        .replace(/{userName}/g, userName);
    } else {
      processedDesign[key] = value;
    }
  }
  
  return processedDesign;
};


const performanceOptimizer = new PerformanceOptimizer();
await performanceOptimizer.initialize();
  
async function NazuninhaBotExec(bender, info, store, messagesCache, rentalExpirationManager = null) {

  var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
  
  async function getCachedGroupMetadata(groupId) {
    try {
      const cached = await performanceOptimizer.modules.cacheManager.getIndexGroupMeta(groupId);
      if (cached) {
        return cached;
      }
      
      const freshData = await bender.groupMetadata(groupId).catch(() => ({}));
      
      await performanceOptimizer.modules.cacheManager.setIndexGroupMeta(groupId, freshData);
      
      return freshData;
    } catch (error) {
      return await bender.groupMetadata(groupId).catch(() => ({}));
    }
  }
  var {
    numerodono,
    nomedono,
    nomebot,
    prefixo,
    debug,
    lidowner
  } = config;
  var KeyCog = config.apikey || '';

  function isValidApiKey(key) {
    if (!key || typeof key !== 'string') return false;
    if (key.trim() === '') return false;
    if (key.length < 10) return false;
    
    const validChars = /^[a-zA-Z0-9\-_]+$/;
    return validChars.test(key.trim());
  }

  if (!KeyCog || KeyCog.trim() === '') {
    KeyCog = false;
  } else if (!isValidApiKey(KeyCog)) {
    KeyCog = false;
  }

  async function handleAutoDownload(bender, from, url, info) {
    try {
      if (url.includes('tiktok.com')) {
        if (!KeyCog) {
          console.warn('⚠️ TikTok autodl ignorado: API Key não configurada');
          return false;
        }
        
        const datinha = await tiktok.dl(url, KeyCog);
        if (datinha.ok) {
          await bender.sendMessage(from, {
            [datinha.type]: {
              url: datinha.urls[0]
            },
            caption: '🎵 Download automático do TikTok!'
          }, {
            quoted: info
          });
          return true;
        } else {
          console.warn(`⚠️ TikTok autodl falhou: ${datinha.msg}`);
          return false;
        }
      } else if (url.includes('instagram.com')) {
        if (!KeyCog) {
          console.warn('⚠️ Instagram autodl ignorado: API Key não configurada');
          return false;
        }
        
        const datinha = await igdl.dl(url, KeyCog);
        if (datinha.ok) {
          await bender.sendMessage(from, {
            [datinha.data[0].type]: datinha.data[0].buff,
            caption: '📸 Download automático do Instagram!'
          }, {
            quoted: info
          });
          return true;
        } else {
          console.warn(`⚠️ Instagram autodl falhou: ${datinha.msg}`);
          return false;
        }
      } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
        const datinha = await pinterest.dl(url);
        if (datinha.ok) {
          await bender.sendMessage(from, {
            [datinha.type]: {
              url: datinha.urls[0]
            },
            caption: '📌 Download automático do Pinterest!'
          }, {
            quoted: info
          });
          return true;
        } else {
          console.warn(`⚠️ Pinterest autodl falhou: ${datinha.msg}`);
          return false;
        }
      }
      return false;
    } catch (e) {
      console.error('Erro no autodl:', e);
      return false;
    }
  }
  const menusModule = await import(new URL('./menus/index.js', import.meta.url));
  const menus = await menusModule.default;
  const {
    menu,
    menuButtons,
    menudown,
    menuadm,
    menubn,
    menuDono,
    menuMembros,
    menuFerramentas,
    menuSticker,
    menuIa,
  menuAlterador,
  menuLogos,
  menuTopCmd,
  menuGold
  } = menus;
  var prefix = prefixo;
  var numerodono = String(numerodono);
  const loadedModulesPromise = await import(new URL('./funcs/exports.js', import.meta.url));
  const modules = await loadedModulesPromise.default;
  const {
    youtube,
    banner,
    tiktok,
    pinterest,
    igdl,
    sendSticker,
    FilmesDL,
    styleText,
    emojiMix,
    upload,
    mcPlugin,
    tictactoe,
    toolsJson,
    vabJson,
    google,
    Lyrics,
    commandStats,
    ia,
    VerifyUpdate,
    temuScammer
  } = modules;
  const antipvData = loadJsonFile(DATABASE_DIR + '/antipv.json');
  const premiumListaZinha = loadJsonFile(DONO_DIR + '/premium.json');
  const banGpIds = loadJsonFile(DONO_DIR + '/bangp.json');
  const antifloodData = loadJsonFile(DATABASE_DIR + '/antiflood.json');
  const cmdLimitData = loadJsonFile(DATABASE_DIR + '/cmdlimit.json');
  const antiSpamGlobal = loadJsonFile(DATABASE_DIR + '/antispam.json', {
    enabled: false,
    limit: 5,
    interval: 10,
    blockTime: 600,
    users: {},
    blocks: {}
  });
  const globalBlocks = loadJsonFile(DATABASE_DIR + '/globalBlocks.json', {
    commands: {},
    users: {}
  });
  const botState = loadJsonFile(DATABASE_DIR + '/botState.json', {
    status: 'on'
  });
  const modoLiteFile = DATABASE_DIR + '/modolite.json';
  let modoLiteGlobal = loadJsonFile(modoLiteFile, {
    status: false
  });
  if (!fs.existsSync(modoLiteFile)) {
    fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
  };
  
  global.autoStickerMode = global.autoStickerMode || 'default';
  try {
    var r;
    const from = info.key.remoteJid;
    const isGroup = from?.endsWith('@g.us') || false;
    if (!info.key.participant && !info.key.remoteJid) return;
    let sender;
    if (isGroup) {
      const participants = Object.keys(info.key).filter(k => k.startsWith("participant")).map(k => info.key[k]).filter(Boolean);
      if (participants.length) {
        sender = participants.find(p => p.includes("lid")) || participants[0];
      };
    } else {
      sender = info.key.remoteJid;
    };
    const pushname = info.pushName || '';
    const nome = pushname.split(" ")[0];
    const isStatus = from?.endsWith('@broadcast') || false;
    const nmrdn = buildUserId(numerodono, config);
    const subDonoList = loadSubdonos();
    const isSubOwner = isSubdono(sender);
    const ownerJid = `${numerodono}@s.whatsapp.net`;
    const botId = getBotId(bender);
    const isBotSender = sender === botId || sender === bender.user?.id?.split(':')[0] + '@s.whatsapp.net' || sender === bender.user?.id?.split(':')[0] + '@lid';
    const isOwner = nmrdn === sender || ownerJid === sender || (lidowner && lidowner === sender) || info.key.fromMe || isBotSender;
    const isOwnerOrSub = isOwner || isSubOwner;
    const type = getContentType(info.message);
    const isMedia = ["imageMessage", "videoMessage", "audioMessage"].includes(type);
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isVisuU2 = type === 'viewOnceMessageV2';
    const isVisuU = type === 'viewOnceMessage';
    const isButtonMessage = info.message.interactiveMessage || info.message.templateButtonReplyMessage || info.message.buttonsMessage || info.message.interactiveResponseMessage || info.message.listResponseMessage || info.message.buttonsResponseMessage ? true : false;
    const isStatusMention = JSON.stringify(info.message).includes('groupStatusMentionMessage');
    const getMessageText = message => {
      if (!message) return '';
      
      if (message.interactiveResponseMessage) {
        const interactiveResponse = message.interactiveResponseMessage;
        
        if (interactiveResponse.nativeFlowResponseMessage?.paramsJson) {
          try {
            const params = JSON.parse(interactiveResponse.nativeFlowResponseMessage.paramsJson);
            return params.id || '';
          } catch (error) {
            console.error('Erro ao processar resposta de single_select:', error);
          }
        }
        
        if (interactiveResponse.body?.text) {
          return interactiveResponse.body.text;
        }
        
        if (interactiveResponse.selectedDisplayText) {
          return interactiveResponse.selectedDisplayText;
        }
        
        if (typeof interactiveResponse === 'string') {
          return interactiveResponse;
        }
      }
      
      if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
        return message.listResponseMessage.singleSelectReply.selectedRowId;
      }
      
      if (message.buttonsResponseMessage?.selectedButtonId) {
        return message.buttonsResponseMessage.selectedButtonId;
      }
      
      return message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || message.videoMessage?.caption || message.documentWithCaptionMessage?.message?.documentMessage?.caption || message.viewOnceMessage?.message?.imageMessage?.caption || message.viewOnceMessage?.message?.videoMessage?.caption || message.viewOnceMessageV2?.message?.imageMessage?.caption || message.viewOnceMessageV2?.message?.videoMessage?.caption || message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || message.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || '';
    };
    const body = getMessageText(info.message) || info?.text || '';

    const args = body.trim().split(/ +/).slice(1);
    var q = args.join(' ');
    const budy2 = normalizar(body);
    const menc_prt = info.message?.extendedTextMessage?.contextInfo?.participant;
    const menc_jid2 = info.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const menc_os2 = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt;
    const sender_ou_n = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt || sender;
    const groupMetadata = !isGroup ? {} : await getCachedGroupMetadata(from).catch(() => ({}));
    const groupName = groupMetadata?.subject || '';
    const groupFile = pathz.join(__dirname, '..', 'database', 'grupos', `${groupName}.json`);
    let groupData = {};
    if (isGroup) {
      if (!fs.existsSync(groupFile)) {
        fs.writeFileSync(groupFile, JSON.stringify({
          mark: {},
          createdAt: new Date().toISOString(),
          groupName: groupName
        }, null, 2));
      }
      ;
      try {
        groupData = JSON.parse(fs.readFileSync(groupFile));
      } catch (error) {
        console.error(`Erro ao carregar dados do grupo ${from}:`, error);
        groupData = {
          mark: {}
        };
      };
  // default flags - grupos
  groupData.modogold = typeof groupData.modogold === 'boolean' ? groupData.modogold : true;
      groupData.minMessage = groupData.minMessage || null;
      groupData.moderators = groupData.moderators || [];
      groupData.allowedModCommands = groupData.allowedModCommands || [];
      groupData.mutedUsers = groupData.mutedUsers || {};
      groupData.levelingEnabled = groupData.levelingEnabled || true;
      if (groupName && groupData.groupName !== groupName) {
        groupData.groupName = groupName;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      };
    };
    let parceriasData = {};
    if (isGroup) {
      parceriasData = loadParceriasData(from);
    };
    const groupPrefix = groupData.customPrefix || prefixo;
    var isCmd = body.trim().startsWith(groupPrefix);
    const aliases = loadCommandAliases();
    const matchedAlias = aliases.find(item => normalizar(budy2.trim().slice(groupPrefix.length).split(/ +/).shift().trim()) === item.alias);
    var command = isCmd ? matchedAlias ? matchedAlias.command : normalizar(body.trim().slice(groupPrefix.length).split(/ +/).shift().trim()).replace(/\s+/g, '') : null;
    const isPremium = premiumListaZinha[sender] || premiumListaZinha[from] || isOwner;
    if (!isGroup) {
      if (antipvData.mode === 'antipv' && !isOwner && !isPremium) {
        return;
      };
      if (antipvData.mode === 'antipv2' && isCmd && !isOwner && !isPremium) {
        await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
        return;
      };
      if (antipvData.mode === 'antipv3' && isCmd && !isOwner && !isPremium) {
        await bender.updateBlockStatus(sender, 'block');
        await reply('🚫 Você foi bloqueado por usar comandos no privado!');
        return;
      };
      if (antipvData.mode === 'antipv4' && !isOwner && !isPremium) {
        await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
        return;
      };
    };
    if (isGroup && banGpIds[from] && !isOwner && !isPremium) {
      return;
    };
    const AllgroupMembers = !isGroup ? [] : groupMetadata.participants?.map(p => p.lid || p.id) || [];
    const groupAdmins = !isGroup ? [] : groupMetadata.participants?.filter(p => p.admin).map(p => p.lid || p.id) || [];
    const botNumber = bender.user.lid.split(':')[0] + '@lid';
    const isBotAdmin = !isGroup ? false : groupAdmins.includes(botNumber);
    let isGroupAdmin = false;
    if (isGroup) {
      const isModeratorActionAllowed = groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command);
      isGroupAdmin = groupAdmins.includes(sender) || isOwner || isModeratorActionAllowed;
    }
    ;
    const isModoBn = groupData.modobrincadeira;
    const isOnlyAdmin = groupData.soadm;
    const isAntiPorn = groupData.antiporn;
    const isMuted = groupData.mutedUsers?.[sender];
    const isAntiLinkGp = groupData.antilinkgp;
    const isAntiDel = groupData.antidel;
    const isAntiBtn = groupData.antibtn;
    const isAntiStatus = groupData.antistatus;
    const isAutoRepo = groupData.autorepo;
    const isAssistente = groupData.assistente;
    const isModoLite = isGroup && isModoLiteActive(groupData, modoLiteGlobal);
    
    if (isGroup && groupData.minMessage && (isImage || isVideo || isVisuU || isVisuU2) && !isGroupAdmin && !isOwner) {
  let caption = '';
  if (isImage) {
    caption = info.message.imageMessage?.caption || '';
  } else if (isVideo) {
    caption = info.message.videoMessage?.caption || '';
  } else if (isVisuU) {
    caption = info.message.viewOnceMessage?.message?.imageMessage?.caption || info.message.viewOnceMessage?.message?.videoMessage?.caption || '';
  } else if (isVisuU2) {
    caption = info.message.viewOnceMessageV2?.message?.imageMessage?.caption || info.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';
  }
  if (caption.length < groupData.minMessage.minDigits) {
    try {
      await bender.sendMessage(from, { delete: info.key });
      if (groupData.minMessage.action === 'ban') {
        if (isBotAdmin) {
          await bender.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🚫 Usuário removido por enviar mídia sem legenda suficiente (mínimo: ${groupData.minMessage.minDigits} caracteres).`);
        } else {
          await reply(`⚠️ Mídia sem legenda suficiente detectada, mas não sou admin para remover o usuário.`);
        }
      } else { // adv
        await reply(`⚠️ Advertência: Envie mídias com pelo menos ${groupData.minMessage.minDigits} caracteres na legenda para evitar remoção.`);
      }
    } catch (error) {
      console.error('Erro ao processar minMessage:', error);
    }
  }
};

    if (isGroup && isStatusMention && isAntiStatus && !isGroupAdmin) {
      if (isBotAdmin) {
        await bender.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        await bender.groupParticipantsUpdate(from, [sender], 'remove');
      } else {
        await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
      }
      ;
    }
    ;
    if (isGroup && isButtonMessage && isAntiBtn && !isGroupAdmin) {
      if (isBotAdmin) {
        await bender.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        await bender.groupParticipantsUpdate(from, [sender], 'remove');
      } else {
        await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
      }
      ;
    }
    ;
    if (isGroup && isCmd && isOnlyAdmin && !isGroupAdmin) {
      return;
    }
    ;
    if (isGroup && info.message.protocolMessage && info.message.protocolMessage.type === 0 && isAntiDel) {
      const msg = messagesCache.get(info.message.protocolMessage.key.id);
      if (!msg) return;
      const clone = JSON.parse(JSON.stringify(msg).replaceAll('conversation', 'text').replaceAll('Message', ''));
      for (const key in clone) {
        const media = clone[key];
        if (media && typeof media === 'object' && media.url) {
          clone[key] = {
            url: media.url
          };
          for (const subkey in media) {
            if (subkey !== 'url') {
              clone[subkey] = media[subkey];
            }
          }
        }
      }
      await bender.sendMessage(from, clone);
    }
    ;
    if (isGroup && isCmd && !isGroupAdmin && groupData.blockedCommands && groupData.blockedCommands[command]) {
      await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
      return;
    };

    if (isCmd && antiSpamGlobal?.enabled && !isOwnerOrSub) {
      try {
        const cfg = antiSpamGlobal;
        cfg.users = cfg.users || {};
        cfg.blocks = cfg.blocks || {};
        const now = Date.now();
        const blockInfo = cfg.blocks[sender];
        if (blockInfo && blockInfo.until && now < blockInfo.until) {
          const msLeft = blockInfo.until - now;
          const secs = Math.ceil(msLeft / 1000);
          const m = Math.floor(secs / 60), s = secs % 60;
          return reply(`🚫 Você está temporariamente bloqueado de usar comandos por anti-spam.
⏳ Aguarde ${m > 0 ? `${m}m ${s}s` : `${secs}s`}.`);
        } else if (blockInfo && blockInfo.until && now >= blockInfo.until) {
          delete cfg.blocks[sender];
        }
        const intervalMs = (cfg.interval || 10) * 1000;
        const limit = Math.max(1, parseInt(cfg.limit || 5));
        const arr = (cfg.users[sender]?.times || []).filter(ts => now - ts <= intervalMs);
        arr.push(now);
        cfg.users[sender] = { times: arr };
        if (arr.length > limit) {
          const blockMs = Math.max(1, parseInt(cfg.blockTime || 600)) * 1000;
          cfg.blocks[sender] = { until: now + blockMs, at: new Date().toISOString(), count: arr.length };
          fs.writeFileSync(DATABASE_DIR + '/antispam.json', JSON.stringify(cfg, null, 2));
          return reply(`🚫 Anti-spam: você excedeu o limite de ${limit} comandos em ${cfg.interval}s.
🔒 Bloqueado por ${Math.floor(blockMs/60000)} min.`);
        }
        fs.writeFileSync(DATABASE_DIR + '/antispam.json', JSON.stringify(cfg, null, 2));
      } catch (e) {
        console.error('Erro no AntiSpam Global:', e);
      }
    }
    ;
    if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
      try {
        const afkReason = groupData.afkUsers[sender].reason;
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
      } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
      }
      ;
    }
    ;
    if (isGroup && isMuted) {
      try {
        //await bender.sendMessage(from, {
          //text: `🤫 *Usuário mutado detectado*\n\n@${getUserName(sender)}, você está tentando falar enquanto está mutado neste grupo. Você será calado conforme as regras.`,
          //mentions: [sender]
        //}, {
        //  quoted: info
        //});
        await bender.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        if (isBotAdmin) {
          //await bender.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          //await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        }
        ;
        delete groupData.mutedUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        return;
      } catch (error) {
        console.error("Erro ao processar usuário mutado:", error);
      }
      ;
    }
    ;
    const rentalModeOn = isRentalModeActive();
    let groupHasActiveRental = false;
    let rentalStatusChecked = false;
    if (isGroup && rentalModeOn) {
      const rentalStatus = getGroupRentalStatus(from);
      groupHasActiveRental = rentalStatus.active;
      rentalStatusChecked = true;
      const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'addsubdono', 'remsubdono', 'listasubdonos'];
      if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply("⏳ O aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou solicite ao dono a renovação.");
        return;
      }
      ;
    }
    ;
    if (isGroup && !isCmd && body && /\b[A-F0-9]{8}\b/.test(body.toUpperCase())) {
      const potentialCode = body.match(/\b[A-F0-9]{8}\b/)[0].toUpperCase();
      const validation = validateActivationCode(potentialCode);
      if (validation.valid) {
        try {
          const activationResult = useActivationCode(potentialCode, from, sender);
          await reply(activationResult.message);
          if (activationResult.success) {
            return;
          }
          ;
        } catch (e) {
          console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        }
        ;
      }
      ;
    }
    ;
    if (isGroup) {
      try {
        groupData.contador = groupData.contador || [];
        const userIndex = groupData.contador.findIndex(user => user.id === sender);
        if (userIndex !== -1) {
          const userData = groupData.contador[userIndex];
          if (isCmd) {
            userData.cmd = (userData.cmd || 0) + 1;
          } else if (type === "stickerMessage") {
            userData.figu = (userData.figu || 0) + 1;
          } else {
            userData.msg = (userData.msg || 0) + 1;
          }
          ;
          if (pushname && userData.pushname !== pushname) {
            userData.pushname = pushname;
          }
          ;
          userData.lastActivity = new Date().toISOString();
        } else {
          groupData.contador.push({
            id: sender,
            msg: isCmd ? 0 : 1,
            cmd: isCmd ? 1 : 0,
            figu: type === "stickerMessage" ? 1 : 0,
            pushname: pushname || 'Usuário Desconhecido',
            firstSeen: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          });
        }
        ;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      }
      ;
    }
    ;
    if (isGroup && groupData.levelingEnabled) {
      const levelingData = loadJsonFile(LEVELING_FILE);
      levelingData.users[sender] = levelingData.users[sender] || {
        level: 1,
        xp: 0,
        patent: "Iniciante",
        messages: 0,
        commands: 0
      };
      const userData = levelingData.users[sender];
      userData.messages++;
      if (isCmd) {
        userData.commands++;
        userData.xp += 10;
      } else {
        userData.xp += 5;
      }
      checkLevelUp(sender, userData, levelingData, bender, from);
      fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingData, null, 2));
    }
    ;
    async function reply(text, options = {}) {
      try {
        const {
          mentions = [],
          noForward = false,
          noQuote = false,
          buttons = null
        } = options;
        const messageContent = {
          text: text.trim(),
          mentions: mentions
        };
        if (buttons) {
          messageContent.buttons = buttons;
          messageContent.headerType = 1;
        }
        const sendOptions = {
          sendEphemeral: true
        };
        if (!noForward) {
          sendOptions.contextInfo = {
            forwardingScore: 50,
            isForwarded: true,
            externalAdReply: {
              showAdAttribution: true
            }
          };
        }
        if (!noQuote) {
          sendOptions.quoted = info;
        }
        const result = await bender.sendMessage(from, messageContent, sendOptions);
        return result;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return null;
      }
    }
    bender.reply = reply;
    const reagir = async (emj, options = {}) => {
      try {
        const messageKey = options.key || info.key;
        const delay = options.delay || 500;
        if (!messageKey) {
          console.error("Chave de mensagem inválida para reação");
          return false;
        }
        if (typeof emj === 'string') {
          if (emj.length < 1 || emj.length > 5) {
            console.warn("Emoji inválido para reação:", emj);
            return false;
          }
          await bender.sendMessage(from, {
            react: {
              text: emj,
              key: messageKey
            }
          });
          return true;
        } else if (Array.isArray(emj) && emj.length > 0) {
          for (const emoji of emj) {
            if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
              console.warn("Emoji inválido na sequência:", emoji);
              continue;
            }
            await bender.sendMessage(from, {
              react: {
                text: emoji,
                key: messageKey
              }
            });
            if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erro ao reagir com emoji:", error);
        return false;
      }
    };
    bender.react = reagir;
    const parseTimeToMinutes = (timeStr) => {
      if (typeof timeStr !== 'string') return null;
      
      // Validate basic format
      const m = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!m) return null;
      
      const h = parseInt(m[1]);
      const mi = parseInt(m[2]);
      
      // Validate hour range
      if (h < 0 || h > 23) return null;
      
      // Validate minute range
      if (mi < 0 || mi > 59) return null;
      
      return h * 60 + mi;
    };
    
    // Enhanced time validation function
    const validateTimeFormat = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') {
        return { valid: false, error: 'Horário inválido. O horário não pode ser vazio.' };
      }
      
      // Check for valid format
      const isValidFormat = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr);
      if (!isValidFormat) {
        return { valid: false, error: 'Formato inválido. Use HH:MM (24 horas).' };
      }
      
      // Parse and validate components
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      if (hours < 0 || hours > 23) {
        return { valid: false, error: 'Hora inválida. Use entre 00 e 23.' };
      }
      
      if (minutes < 0 || minutes > 59) {
        return { valid: false, error: 'Minuto inválido. Use entre 00 e 59.' };
      }
      
      // Check for edge cases
      if (timeStr === '24:00') {
        return { valid: false, error: 'Use 23:59 como horário máximo.' };
      }
      
      return { valid: true, timeStr };
    };
    const getNowMinutes = () => {
      // Use Brazil/Sao_Paulo timezone for accurate time comparisons
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      return saoPauloTime.getHours() * 60 + saoPauloTime.getMinutes();
    };
    const getTodayStr = () => {
      // Use Brazil/Sao_Paulo timezone for consistent date handling
      const d = new Date();
      const saoPauloDate = new Date(d.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const y = saoPauloDate.getFullYear();
      const m = String(saoPauloDate.getMonth() + 1).padStart(2, '0');
      const day = String(saoPauloDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const tzFormat = (date) => new Date(date).toLocaleString('pt-BR');
    const parseAbsoluteDateTime = (str) => {
      if (!str) return null;
      const cleaned = str.toLowerCase().replace(/\s+às\s+/g, ' ').replace(/\s+as\s+/g, ' ').trim();
      let m = cleaned.match(/\b(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\s+(\d{1,2}):(\d{2})\b/);
      if (m) {
        let [ , d, mo, y, h, mi ] = m;
        d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
        y = y ? parseInt(y) : new Date().getFullYear();
        if (y < 100) y += 2000;
        const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
        if (!isNaN(dt.getTime())) return dt.getTime();
      }
      m = cleaned.match(/\b(\d{1,2}):(\d{2})\s+(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\b/);
      if (m) {
        let [ , h, mi, d, mo, y ] = m;
        d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
        y = y ? parseInt(y) : new Date().getFullYear();
        if (y < 100) y += 2000;
        const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
        if (!isNaN(dt.getTime())) return dt.getTime();
      }
      m = cleaned.match(/\bhoje\b\s*(\d{1,2}):(\d{2})/);
      if (m) {
        const now = new Date();
        const h = parseInt(m[1]); const mi = parseInt(m[2]);
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
        return dt.getTime();
      }
      m = cleaned.match(/\bamanh[ãa]\b\s*(\d{1,2}):(\d{2})/);
      if (m) {
        const now = new Date();
        const h = parseInt(m[1]); const mi = parseInt(m[2]);
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, mi, 0, 0);
        return dt.getTime();
      }
      return null;
    };
    const parseRelative = (str) => {
      if (!str) return null;
      const m = str.toLowerCase().match(/\bem\s+(\d{1,5})\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b/);
      if (!m) return null;
      const n = parseInt(m[1]);
      const unit = m[2];
      let ms = 0;
      if (/^m(in|ins|inutos?)?$/.test(unit)) ms = n * 60 * 1000;
      else if (/^h|hora/.test(unit)) ms = n * 60 * 60 * 1000;
      else if (/^d|dia/.test(unit)) ms = n * 24 * 60 * 60 * 1000;
      else return null;
      return Date.now() + ms;
    };
    const parseReminderInput = (text) => {
      if (!text) return null;
      const relTs = parseRelative(text);
      if (relTs) {
        const after = text.toLowerCase().replace(/\bem\s+\d{1,5}\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b\s*/,'');
        const msg = after.trim();
        return { at: relTs, message: msg || 'Seu lembrete!' };
      }
      let m = text.toLowerCase().replace(/\s+às\s+/g, ' ').match(/(\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?\s+\d{1,2}:\d{2})/);
      if (!m) m = text.toLowerCase().match(/(\d{1,2}:\d{2}\s+\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?)/);
      if (!m) {
        let hm = text.toLowerCase().match(/(hoje\s*\d{1,2}:\d{2}|amanh[ãa]\s*\d{1,2}:\d{2})/);
        if (hm) {
          const ts = parseAbsoluteDateTime(hm[1]);
          const msg = text.toLowerCase().replace(hm[1], '').replace(/\s+às\s+/g, ' ').trim();
          if (ts) return { at: ts, message: msg || 'Seu lembrete!' };
        }
        return null;
      }
      const whenStr = m[1];
      const ts = parseAbsoluteDateTime(whenStr);
      if (!ts) return null;
      const msg = text.toLowerCase().replace(whenStr, '').replace(/\s+às\s+/g, ' ').trim();
      return { at: ts, message: msg || 'Seu lembrete!' };
    };

    let remindersWorkerStarted = global.remindersWorkerStarted || false;
    const startRemindersWorker = (nazuInstance) => {
      try {
        if (remindersWorkerStarted) return;
        remindersWorkerStarted = true;
        global.remindersWorkerStarted = true;
        setInterval(async () => {
          try {
            const list = loadReminders();
            if (!Array.isArray(list) || list.length === 0) return;
            const now = Date.now();
            let changed = false;
            for (const r of list) {
              if (!r || r.status === 'sent') continue;
              if (typeof r.at !== 'number') continue;
              if (r.at <= now) {
                const textMsg = `⏰ Lembrete${r.createdByName ? ` de ${r.createdByName}` : ''}: ${r.message}`;
                try {
                  if (r.chatId && String(r.chatId).endsWith('@g.us')) {
                    await nazuInstance.sendMessage(r.chatId, { text: textMsg, mentions: r.userId ? [r.userId] : [] });
                  } else {
                    const dest = r.chatId || r.userId;
                    if (dest) await nazuInstance.sendMessage(dest, { text: textMsg });
                  }
                  r.status = 'sent';
                  r.sentAt = new Date().toISOString();
                  changed = true;
                } catch (e) {
                }
              }
            }
            if (changed) saveReminders(list);
          } catch (err) {
          }
        }, 30 * 1000);
      } catch (e) {
      }
    };
    startRemindersWorker(bender);
    let gpScheduleWorkerStarted = global.gpScheduleWorkerStarted || false;
    const startGpScheduleWorker = (nazuInstance) => {
      try {
        if (gpScheduleWorkerStarted) return;
        gpScheduleWorkerStarted = true;
        global.gpScheduleWorkerStarted = true;
        setInterval(async () => {
          try {
            const files = fs.readdirSync(GRUPOS_DIR).filter(f => f.endsWith('.json'));
            if (!files.length) return;
            
            const nowMin = getNowMinutes();
            const today = getTodayStr();
            
            
            for (const f of files) {
              const groupId = f.replace(/\.json$/, '');
              const filePath = pathz.join(GRUPOS_DIR, f);
              let data;
              try {
                data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) || {};
              } catch (e) {
                console.error(`[Schedule Worker] Error reading group file ${f}:`, e);
                continue;
              }
              
              const schedule = data.schedule || {};
              const lastRun = schedule.lastRun || {};
              
              
              // Handle opening schedule
              if (schedule.openTime) {
                const t = parseTimeToMinutes(schedule.openTime);
                if (t !== null && t === nowMin && lastRun.open !== today) {
                  try {
                    await nazuInstance.groupSettingUpdate(groupId, 'not_announcement');
                    await nazuInstance.sendMessage(groupId, { text: '🔓 Grupo aberto automaticamente pelo agendamento diário.' });
                    schedule.lastRun = schedule.lastRun || {};
                    schedule.lastRun.open = today;
                    data.schedule = schedule;
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                  } catch (e) {
                    console.error(`[Schedule Error] Failed to open group ${groupId}:`, e);
                  }
                }
              }
              
              // Handle closing schedule
              if (schedule.closeTime) {
                const t = parseTimeToMinutes(schedule.closeTime);
                if (t !== null && t === nowMin && lastRun.close !== today) {
                  try {
                    await nazuInstance.groupSettingUpdate(groupId, 'announcement');
                    await nazuInstance.sendMessage(groupId, { text: '🔒 Grupo fechado automaticamente pelo agendamento diário.' });
                    schedule.lastRun = schedule.lastRun || {};
                    schedule.lastRun.close = today;
                    data.schedule = schedule;
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                  } catch (e) {
                    console.error(`[Schedule Error] Failed to close group ${groupId}:`, e);
                  }
                }
              }
            }
          } catch (err) {
          }
        }, 60 * 1000); // Check every minute for precise timing
      } catch (e) {
      }
    };
    startGpScheduleWorker(bender);

    let autoHorariosWorkerStarted = global.autoHorariosWorkerStarted || false;
    const startAutoHorariosWorker = (nazuInstance) => {
      try {
        if (autoHorariosWorkerStarted) return;
        autoHorariosWorkerStarted = true;
        global.autoHorariosWorkerStarted = true;
        
        setInterval(async () => {
          try {
            const now = new Date();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            
            if (minutes !== 0 || seconds > 30) return;
            
            const autoSchedulesPath = './dados/database/autohorarios.json';
            if (!fs.existsSync(autoSchedulesPath)) return;
            
            let autoSchedules = {};
            try {
              autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
            } catch (e) {
              return;
            }
            
            const currentHour = now.getHours();
            
            for (const [chatId, config] of Object.entries(autoSchedules)) {
              if (!config.enabled) continue;
              if (!chatId.endsWith('@g.us')) continue;
              
              try {
                const currentTime = new Date();
                const currentBrazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000));
                
                const games = [
                  { name: "🎯 FORTUNE TIGER", hours: [9, 11, 14, 16, 18, 20, 22] },
                  { name: "🐂 FORTUNE OX", hours: [8, 10, 13, 15, 17, 19, 21] },
                  { name: "🐭 FORTUNE MOUSE", hours: [7, 12, 14, 16, 19, 21, 23] },
                  { name: "🐰 FORTUNE RABBIT", hours: [6, 9, 11, 15, 18, 20, 22] },
                  { name: "🐉 FORTUNE DRAGON", hours: [8, 10, 12, 16, 18, 21, 23] },
                  { name: "💎 GATES OF OLYMPUS", hours: [7, 9, 13, 17, 19, 22, 0] },
                  { name: "⚡ GATES OF AZTEC", hours: [6, 11, 14, 16, 20, 22, 1] },
                  { name: "🍭 SWEET BONANZA", hours: [8, 12, 15, 17, 19, 21, 23] },
                  { name: "🏺 HAND OF MIDAS", hours: [7, 10, 13, 16, 18, 20, 0] },
                  { name: "🌟 STARLIGHT PRINCESS", hours: [6, 9, 12, 15, 19, 22, 1] },
                  { name: "🔥 FIRE PORTALS", hours: [8, 11, 14, 17, 20, 23, 2] },
                  { name: "⭐ STAR CLUSTERS", hours: [7, 10, 12, 16, 18, 21, 0] },
                  { name: "🌊 AQUA MILLIONS", hours: [6, 9, 13, 15, 19, 22, 1] },
                  { name: "🎪 CIRCUS LAUNCH", hours: [8, 11, 14, 16, 20, 23, 2] },
                  { name: "🏖️ CASH PATROL", hours: [7, 10, 13, 17, 19, 21, 0] },
                  { name: "🎊 PARTY FEVER", hours: [6, 12, 15, 18, 20, 22, 1] },
                  { name: "🎭 MYSTERY JOKER", hours: [8, 10, 14, 16, 19, 23, 2] },
                  { name: "🎰 SPIN PARTY", hours: [7, 9, 13, 15, 18, 21, 0] },
                  { name: "💰 MONEY MAKER", hours: [6, 11, 12, 17, 20, 22, 1] }
                ];
                
                let responseText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                responseText += `┃    🎰 *HORÁRIOS PAGANTES*   ┃\n`;
                responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                responseText += `🕐 *Atualizado automaticamente:*\n`;
                responseText += `📅 ${currentBrazilTime.toLocaleDateString('pt-BR')}\n`;
                responseText += `⏰ ${currentBrazilTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
                
                games.forEach(game => {
                  const todayHours = game.hours.map(baseHour => {
                    const variation = Math.floor(Math.random() * 21) - 10;
                    const finalHour = baseHour + Math.floor(variation / 60);
                    const finalMinutes = Math.abs(variation % 60);
                    
                    const displayHour = finalHour < 0 ? 24 + finalHour : finalHour > 23 ? finalHour - 24 : finalHour;
                    return `${displayHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
                  });
                  
                  responseText += `${game.name}\n`;
                  responseText += `🕐 ${todayHours.join(' • ')}\n\n`;
                });
                
                if (config.link) {
                  responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                  responseText += `┃      🔗 *LINK DE APOSTAS*     ┃\n`;
                  responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                  responseText += `${config.link}\n\n`;
                }
                
                responseText += `⚠️ *AVISOS IMPORTANTES:*\n`;
                responseText += `🔞 *Conteúdo para maiores de 18 anos*\n`;
                responseText += `📊 Estes são horários estimados\n`;
                responseText += `🎯 Jogue com responsabilidade\n`;
                responseText += `💰 Nunca aposte mais do que pode perder\n`;
                responseText += `🆘 Procure ajuda se tiver vício em jogos\n`;
                responseText += `⚖️ Apostas podem causar dependência\n\n`;
                responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                responseText += `┃  🍀 *BOA SORTE E JOGUE*    ┃\n`;
                responseText += `┃     *CONSCIENTEMENTE!* 🍀  ┃\n`;
                responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;
                
                await nazuInstance.sendMessage(chatId, { text: responseText });
                
                config.lastSent = Date.now();
                
              } catch (e) {
                console.error(`Erro ao enviar auto horários para ${chatId}:`, e);
              }
            }
            
            try {
              fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            } catch (e) {
              console.error('Erro ao salvar auto schedules:', e);
            }
            
          } catch (err) {
            console.error('Erro no auto horários worker:', err);
          }
        }, 60 * 1000);
        
      } catch (e) {
        console.error('Erro ao iniciar auto horários worker:', e);
      }
    };
    startAutoHorariosWorker(bender);

    const getFileBuffer = async (mediakey, mediaType, options = {}) => {
      try {
        if (!mediakey) {
          throw new Error('Chave de mídia inválida');
        }
        const stream = await downloadContentFromMessage(mediakey, mediaType);
        let buffer = Buffer.from([]);
        const MAX_BUFFER_SIZE = 50 * 1024 * 1024;
        let totalSize = 0;
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
          totalSize += chunk.length;
          if (totalSize > MAX_BUFFER_SIZE) {
            throw new Error(`Tamanho máximo de buffer excedido (${MAX_BUFFER_SIZE / (1024 * 1024)}MB)`);
          }
        }
        if (options.saveToTemp) {
          try {
            const tempDir = pathz.join(__dirname, '..', 'database', 'tmp');
            ensureDirectoryExists(tempDir);
            const fileName = options.fileName || `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const extensionMap = {
              image: '.jpg',
              video: '.mp4',
              audio: '.mp3',
              document: '.bin'
            };
            const extension = extensionMap[mediaType] || '.dat';
            const filePath = pathz.join(tempDir, fileName + extension);
            fs.writeFileSync(filePath, buffer);
            return filePath;
          } catch (fileError) {
            console.error('Erro ao salvar arquivo temporário:', fileError);
          }
        }
        return buffer;
      } catch (error) {
        console.error(`Erro ao obter buffer de ${mediaType}:`, error);
        throw error;
      }
    };
    const getMediaInfo = message => {
      if (!message) return null;
      if (message.imageMessage) return {
        media: message.imageMessage,
        type: 'image'
      };
      if (message.videoMessage) return {
        media: message.videoMessage,
        type: 'video'
      };
      if (message.viewOnceMessage?.message?.imageMessage) return {
        media: message.viewOnceMessage.message.imageMessage,
        type: 'image'
      };
      if (message.viewOnceMessage?.message?.videoMessage) return {
        media: message.viewOnceMessage.message.videoMessage,
        type: 'video'
      };
      if (message.viewOnceMessageV2?.message?.imageMessage) return {
        media: message.viewOnceMessageV2.message.imageMessage,
        type: 'image'
      };
      if (message.viewOnceMessageV2?.message?.videoMessage) return {
        media: message.viewOnceMessageV2.message.videoMessage,
        type: 'video'
      };
      return null;
    };
    if (isGroup && info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
      if (groupData.afkUsers) {
        for (const jid of mentioned) {
          if (groupData.afkUsers[jid]) {
            const afkData = groupData.afkUsers[jid];
            const afkSince = new Date(afkData.since).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            });
            let afkMsg = `😴 @${getUserName(jid)} está AFK desde ${afkSince}.`;
            if (afkData.reason) {
              afkMsg += `\nMotivo: ${afkData.reason}`;
            }
            await reply(afkMsg, {
              mentions: [jid]
            });
          }
        }
      }
    }
    if (isGroup && isAntiPorn && !info.key.fromMe) {
      const mediaInfo = getMediaInfo(info.message);
      if (mediaInfo && mediaInfo.type === 'image') {
        try {
          const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
          const mediaURL = await upload(imageBuffer, true);
          if (mediaURL) {
            const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${encodeURIComponent(mediaURL)}`);
            let scores = {
              Porn: 0,
              Hentai: 0
            };
            if (Array.isArray(apiResponse.data)) {
              scores = apiResponse.data.reduce((acc, item) => {
                if (item && typeof item.className === 'string' && typeof item.probability === 'number') {
                  if (item.className === 'Porn' || item.className === 'Hentai') {
                    acc[item.className] = Math.max(acc[item.className] || 0, item.probability);
                  }
                }
                return acc;
              }, {
                Porn: 0,
                Hentai: 0
              });
            } else {
              console.warn("Anti-porn API response format unexpected:", apiResponse.data);
            }
            ;
            const pornThreshold = 0.7;
            const hentaiThreshold = 0.7;
            const isPorn = scores.Porn >= pornThreshold;
            const isHentai = scores.Hentai >= hentaiThreshold;
            if (isPorn || isHentai) {
              const reason = isPorn ? 'Pornografia' : 'Hentai';
              await reply(`🚨 Conteúdo impróprio detectado! (${reason})`);
              if (isBotAdmin) {
                try {
                  await bender.sendMessage(from, {
                    delete: info.key
                  });
                  await bender.groupParticipantsUpdate(from, [sender], 'remove');
                  await reply(`🔞 @${getUserName(sender)}, conteúdo impróprio detectado. Você foi removido do grupo.`, {
                    mentions: [sender]
                  });
                } catch (adminError) {
                  console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                  await reply(`⚠️ Não consegui remover @${getUserName(sender)} automaticamente após detectar conteúdo impróprio. Admins, por favor, verifiquem!`, {
                    mentions: [sender]
                  });
                }
                ;
              } else {
                await reply(`@${getUserName(sender)} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`, {
                  mentions: [sender]
                });
              }
            }
          } else {
            console.warn("Falha no upload da imagem para verificação anti-porn.");
          }
        } catch (error) {
          console.error("Erro na verificação anti-porn:", error);
        }
        ;
      }
      ;
    }
    ;
    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      await bender.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: info.key.id,
          participant: sender
        }
      });
      await bender.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`🗺️ @${getUserName(sender)}, localização não permitida. Você foi removido do grupo.`, {
        mentions: [sender]
      });
    }
    ;
    if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
      antifloodData[from].users = antifloodData[from].users || {};
      const now = Date.now();
      const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
      const interval = antifloodData[from].interval * 1000;
      if (now - lastCmd < interval) {
        return reply(`⏳ Aguarde ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos antes de usar outro comando.`);
      }
      ;
      antifloodData[from].users[sender] = {
        lastCmd: now
      };
      fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    }
    ;
    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      await bender.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: info.key.id,
          participant: sender
        }
      });
      await bender.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`📄 @${getUserName(sender)}, documentos não são permitidos. Você foi removido do grupo.`, {
        mentions: [sender]
      });
    }
    ;
    if (isGroup && cmdLimitData[from]?.enabled && isCmd && !isGroupAdmin) {
      cmdLimitData[from].users = cmdLimitData[from].users || {};
      const today = new Date().toISOString().split('T')[0];
      cmdLimitData[from].users[sender] = cmdLimitData[from].users[sender] || {
        date: today,
        count: 0
      };
      if (cmdLimitData[from].users[sender].date !== today) {
        cmdLimitData[from].users[sender] = {
          date: today,
          count: 0
        };
      }
      if (cmdLimitData[from].users[sender].count >= cmdLimitData[from].limit) {
        return reply(`🚫 Você atingiu o limite de ${cmdLimitData[from].limit} comandos diários. Tente novamente amanhã.`);
      }
      cmdLimitData[from].users[sender].count++;
      fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    }
    ;
    if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
      const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        for (const url of urlMatch) {
          try {
            await handleAutoDownload(bender, from, url, info);
          } catch (e) {
            console.error('Erro no autodl:', e);
          }
        }
      }
    }
    if (isGroup && groupData.autoSticker && !info.key.fromMe) {
      try {
        const mediaImage = info.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage;
        const mediaVideo = info.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage;
        if (mediaImage || mediaVideo) {
          const isVideo = !!mediaVideo;
          if (isVideo && mediaVideo.seconds > 9.9) {
            return;
          }
          const buffer = await getFileBuffer(isVideo ? mediaVideo : mediaImage, isVideo ? 'video' : 'image');
          const shouldForceSquare = global.autoStickerMode === 'square';
          await sendSticker(bender, from, {
            sticker: buffer,
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: isVideo ? 'video' : 'image',
            forceSquare: shouldForceSquare
          }, {
            quoted: info
          });
        }
      } catch (e) {
        console.error("Erro ao converter mídia em figurinha automática:", e);
      }
    }
    ;
    if (isGroup && groupData.antilinkhard && !isGroupAdmin && budy2.includes('http') && !isOwner) {
      try {
        await bender.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        if (isBotAdmin) {
          await bender.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🔗 @${getUserName(sender)}, links não são permitidos. Você foi removido do grupo.`, {
            mentions: [sender]
          });
        } else {
          await reply(`🔗 Atenção, @${getUserName(sender)}! Links não são permitidos. Não consigo remover você, mas evite enviar links.`, {
            mentions: [sender]
          });
        }
        ;
        return;
      } catch (error) {
        console.error("Erro no sistema antilink hard:", error);
      }
      ;
    }
    ;
    let quotedMessageContent = null;
    if (type === 'extendedTextMessage' && info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      quotedMessageContent = info.message.extendedTextMessage.contextInfo.quotedMessage;
    }
    const isQuotedMsg = !!quotedMessageContent?.conversation;
    const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text;
    const isQuotedImage = !!quotedMessageContent?.imageMessage;
    const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
    const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
    const isQuotedVideo = !!quotedMessageContent?.videoMessage;
    const isQuotedDocument = !!quotedMessageContent?.documentMessage;
    const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
    const isQuotedAudio = !!quotedMessageContent?.audioMessage;
    const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
    const isQuotedContact = !!quotedMessageContent?.contactMessage;
    const isQuotedLocation = !!quotedMessageContent?.locationMessage;
    const isQuotedProduct = !!quotedMessageContent?.productMessage;
    if (body.startsWith('$')) {
      if (!isOwner) return;
      try {
        exec(q, (err, stdout) => {
          if (err) {
            return reply(`❌ *Erro na execução*\n\n${err}`);
          }
          ;
          if (stdout) {
            reply(`✅ *Resultado do comando*\n\n${stdout}`);
          }
          ;
        });
      } catch (error) {
        reply(`❌ *Erro ao executar comando*\n\n${error}`);
      }
      ;
    }
    ;
    if (body.startsWith('>>')) {
      if (!isOwner) return;
      try {
        (async () => {
          try {
            const codeLines = body.slice(2).trim().split('\n');
            if (codeLines.length > 1) {
              if (!codeLines[codeLines.length - 1].includes('return')) {
                
                codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
              }
              ;
            } else {
              if (!codeLines[0].includes('return')) {
                
                codeLines[0] = 'return ' + codeLines[0];
              }
              ;
            }
            ;
            const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);
            let output;
            if (typeof result === 'object' && result !== null) {
              
              output = JSON.stringify(result, null, 2);
            } else if (typeof result === 'function') {
              
              output = result.toString();
            } else {
              
              output = String(result);
            }
            ;
            return reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => reply(String(e)));
          } catch (e) {
            return reply(`❌ *Erro na execução*\n\n${String(e)}`);
          }
        })();
      } catch (e) {
        reply(`❌ *Erro crítico*\n\n${String(e)}`);
      }
      ;
    }
    ;

    if (isGroup && isAntiLinkGp && !isGroupAdmin) {
      let foundGroupLink = false;
      let link_dgp = null;
      try {
        if (budy2.includes('chat.whatsapp.com')) {
          foundGroupLink = true;
          link_dgp = await bender.groupInviteCode(from);
          if (budy2.includes(link_dgp)) foundGroupLink = false;
        }
        if (!foundGroupLink && info.message?.requestPaymentMessage) {
          const paymentText = info.message.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text || '';
          if (paymentText.includes('chat.whatsapp.com')) {
            foundGroupLink = true;
            link_dgp = link_dgp || await bender.groupInviteCode(from);
            if (paymentText.includes(link_dgp)) foundGroupLink = false;
          }
        }
        if (foundGroupLink) {
          if (isOwner) return;
          await bender.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
          if (!AllgroupMembers.includes(sender)) return;
          if (isBotAdmin) {
            await bender.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🔗 @${getUserName(sender)}, links de outros grupos não são permitidos. Você foi removido do grupo.`, {
              mentions: [sender]
            });
          } else {
            await reply(`🔗 Atenção, @${getUserName(sender)}! Links de outros grupos não são permitidos. Não consigo remover você, mas evite compartilhar esses links.`, {
              mentions: [sender]
            });
          }
          return;
        }
      } catch (error) {
        console.error("Erro no sistema antilink de grupos:", error);
      }
    }
    ;
    const botStateFile = __dirname + '/../database/botState.json';
    if (botState.status === 'off' && !isOwner) return;
    if (botState.viewMessages) bender.readMessages([info.key]);
    try {
      if (budy2 && budy2.length > 1) {
        const timestamp = new Date().toLocaleTimeString('pt-BR', {
          hour12: false,
          timeZone: 'America/Sao_Paulo'
        });
        //mensagens do console atalias
        const messageType = isCmd ? 'COMANDO' : 'MENSAGEM';
        const context = isGroup ? 'GRUPO' : 'PRIVADO';
        const messagePreview = isCmd ? `${prefix}${command}${q ? ` ${q.substring(0, 25)}${q.length > 25 ? '...' : ''}` : ''}` : budy2.substring(0, 35) + (budy2.length > 35 ? '...' : '');
        console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`┃ ${messageType} [${context}] ┃ 📜 Conteúdo: ${messagePreview} ┃ 👥 Grupo: ${(groupName || 'Desconhecido')}\n┃ 👤 Usuário: ${(pushname || 'Sem Nome')} ┃ 🕒 Data/Hora: ${timestamp}`);
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      ;
    } catch (error) {
      console.error('┃ 🚨 Erro ao gerar logs:', error, '');
    }
    ;
    if (isGroup) {
      try {
        if (tictactoe.hasPendingInvitation(from) && budy2) {
          const normalizedResponse = budy2.toLowerCase().trim();
          const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
          if (result.success) {
            await bender.sendMessage(from, {
              text: result.message,
              mentions: result.mentions || []
            });
          }
        }
        ;
        if (tictactoe.hasActiveGame(from) && budy2) {
          if (['tttend', 'rv', 'fimjogo'].includes(budy2)) {
            if (!isGroupAdmin) {
              await reply("⚠️ Apenas administradores podem encerrar um jogo da velha em andamento.");
              return;
            }
            ;
            const result = tictactoe.endGame(from);
            await reply(result.message);
            return;
          }
          ;
          const position = parseInt(budy2.trim());
          if (!isNaN(position)) {
            const result = tictactoe.makeMove(from, sender, position);
            if (result.success) {
              await bender.sendMessage(from, {
                text: result.message,
                mentions: result.mentions || [sender]
              });
            } else if (result.message) {
              await reply(result.message);
            }
            ;
          }
          ;
          return;
        }
        ;
      } catch (error) {

      }
      ;
    }
    ;
    if (isGroup && groupData.blockedUsers && (groupData.blockedUsers[sender] || groupData.blockedUsers[getUserName(sender)]) && isCmd) {
      return reply(`🚫 Você não tem permissão para usar comandos neste grupo.\nMotivo: ${groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[getUserName(sender)].reason}`);
    };

    const globalBlacklist = loadGlobalBlacklist();
    if (isCmd && sender && globalBlacklist.users && (globalBlacklist.users[sender] || globalBlacklist.users[getUserName(sender)])) {
      const blacklistEntry = globalBlacklist.users[sender] || globalBlacklist.users[getUserName(sender)];
      return reply(`🚫 Você está na blacklist global e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nAdicionado por: ${blacklistEntry.addedBy}\nData: ${new Date(blacklistEntry.addedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    };
    
    if (isGroup && isCmd && groupData.blacklist && (groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)])) {
      const blacklistEntry = groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)];
      return reply(`🚫 Você está na blacklist deste grupo e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nData: ${new Date(blacklistEntry.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    }
    ;
    if (sender && sender.includes('@') && globalBlocks.users && (globalBlocks.users[sender] || globalBlocks.users[getUserName(sender)]) && isCmd) {
      return reply(`🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[getUserName(sender)].reason}`);
    }
    ;
    if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
      return reply(`🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${globalBlocks.commands[command].reason}`);
    }
    ;
    if (isCmd && commandStats && commandStats.trackCommandUsage && command && command.length > 0) {
      commandStats.trackCommandUsage(command, sender);
    }
    ;
    if (budy2.match(/^(\d+)d(\d+)$/)) reply(+budy2.match(/^(\d+)d(\d+)$/)[1] > 50 || +budy2.match(/^(\d+)d(\d+)$/)[2] > 100 ? "❌ Limite: max 50 dados e 100 lados" : "🎲 Rolando " + budy2.match(/^(\d+)d(\d+)$/)[1] + "d" + budy2.match(/^(\d+)d(\d+)$/)[2] + "...\n🎯 Resultados: " + (r = [...Array(+budy2.match(/^(\d+)d(\d+)$/)[1])].map(_ => 1 + Math.floor(Math.random() * +budy2.match(/^(\d+)d(\d+)$/)[2]))).join(", ") + "\n📊 Total: " + r.reduce((a, b) => a + b, 0));
    if (!info.key.fromMe && isAssistente && !isCmd && (budy2.includes(bender.user.id.split(':')[0]) || (budy2.includes(bender.user.lid.split(':')[0])) || menc_os2 && menc_os2 == getBotId(bender)) && KeyCog) {
      if (budy2.replaceAll('@' + bender.user.id.split(':')[0], '').length > 2) {
        try {
          const jSoNzIn = {
            texto: budy2.replaceAll('@' + bender.user.id.split(':')[0], '').trim(),
            id_enviou: sender,
            nome_enviou: pushname,
            id_grupo: isGroup ? from : false,
            nome_grupo: isGroup ? groupName : false,
            tem_midia: isMedia,
            marcou_mensagem: false,
            marcou_sua_mensagem: false,
            mensagem_marcada: false,
            id_enviou_marcada: false,
            tem_midia_marcada: false,
            id_mensagem: info.key.id,
            data_atual: new Date().toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            }),
            data_mensagem: new Date(info.messageTimestamp * 1000).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            })
          };
          let {
            participant,
            quotedMessage
          } = info.message?.extendedTextMessage?.contextInfo || {};
          let jsonO = {
            participant,
            quotedMessage,
            texto: quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || quotedMessage?.imageMessage?.caption || quotedMessage?.videoMessage?.caption || quotedMessage?.documentMessage?.caption || ""
          };
          if (jsonO && jsonO.participant && jsonO.texto && jsonO.texto.length > 0) {
            jSoNzIn.marcou_mensagem = true;
            jSoNzIn.mensagem_marcada = jsonO.texto;
            jSoNzIn.id_enviou_marcada = jsonO.participant;
            jSoNzIn.marcou_sua_mensagem = jsonO.participant == getBotId(bender);
          }
          ;
            if (!KeyCog) {
              await bender.sendMessage(nmrdn, {
                text: '🤖 *Sistema de IA desativado*\n\n😅 O sistema de IA está desativado porque a API key não foi configurada.\n\n⚙️ Para configurar, use o comando: `!apikey SUA_API_KEY`\n📞 Suporte: wa.me/553399285117'
              });
              return;
            }
            
            console.log('🤖 Processando mensagem de assistente...');
            const respAssist = await ia.makeAssistentRequest({
              mensagens: [jSoNzIn]
            }, pathz.join(__dirname, 'index.js'), KeyCog, bender, nmrdn);
            
            if (respAssist.erro === 'Sistema de IA temporariamente desativado') {
              return;
            }
            
            console.log('✅ Assistente processado com sucesso');
          
          if (respAssist.apiKeyInvalid) {
            await reply(respAssist.message || '🤖 Sistema de IA temporariamente indisponível. Tente novamente mais tarde.');
            return;
          }
          
          if (respAssist.resp && respAssist.resp.length > 0) {
            for (const msgza of respAssist.resp) {
              if (msgza.react) await bender.react(msgza.react.replaceAll(' ', '').replaceAll('\n', ''), {
                key: info.key
              });
              if (msgza.resp && msgza.resp.length > 0) await reply(msgza.resp);
              if (msgza.actions) {
                if (msgza.actions.comando) var command = msgza.actions.comando;
                if (msgza.actions.params) {
                  if (Array.isArray(msgza.actions.params)) {
                    var q = msgza.actions.params.join(' ');
                  } else if (msgza.actions.params.length > 0) {
                    var q = msgza.actions.params;
                  }
                  ;
                }
                ;
              }
              ;
            }
            ;
          }
        } catch (assistentError) {
          console.error('Erro no assistente virtual:', assistentError.message);
          await reply('🤖 Erro técnico no assistente virtual. Tente novamente em alguns minutos.');
        }
        ;
      }
      ;
    }
    ;
    //ANTI FLOOD DE MENSAGENS
    if (isGroup && groupData.messageLimit?.enabled && !isGroupAdmin && !isOwnerOrSub && !info.key.fromMe) {
      try {
        groupData.messageLimit.warnings = groupData.messageLimit.warnings || {};
        groupData.messageLimit.users = groupData.messageLimit.users || {};
        const now = Date.now();
        const userData = groupData.messageLimit.users[sender] || {
          count: 0,
          lastReset: now
        };
        if (now - userData.lastReset >= groupData.messageLimit.interval * 1000) {
          userData.count = 0;
          userData.lastReset = now;
        }
        ;
        userData.count++;
        groupData.messageLimit.users[sender] = userData;
        if (userData.count > groupData.messageLimit.limit) {
          if (groupData.messageLimit.action === 'ban' && isBotAdmin) {
            await bender.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s!`, {
              mentions: [sender]
            });
            delete groupData.messageLimit.users[sender];
          } else if (groupData.messageLimit.action === 'adv') {
            groupData.messageLimit.warnings[sender] = (groupData.messageLimit.warnings[sender] || 0) + 1;
            const warnings = groupData.messageLimit.warnings[sender];
            if (warnings >= 3 && isBotAdmin) {
              await bender.groupParticipantsUpdate(from, [sender], 'remove');
              await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de mensagens (${groupData.messageLimit.limit} em ${groupData.messageLimit.interval}s) 3 vezes!`, {
                mentions: [sender]
              });
              delete groupData.messageLimit.warnings[sender];
              delete groupData.messageLimit.users[sender];
            } else {
              await reply(`⚠️ @${getUserName(sender)}, você excedeu o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s! Advertência ${warnings}/3.`, {
                mentions: [sender]
              });
            }
          }
        }
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      } catch (e) {
        console.error("Erro no sistema de limite de mensagens:", e);
      }
    }
    //SISTEMA DE PARCERIA
    if (isGroup && parceriasData.active && !isGroupAdmin && body.includes('chat.whatsapp.com') && !info.key.fromMe) {
      if (parceriasData.partners[sender]) {
        const partnerData = parceriasData.partners[sender];
        if (partnerData.count < partnerData.limit) {
          partnerData.count++;
          saveParceriasData(from, parceriasData);
        } else {
          await bender.sendMessage(from, {
            delete: info.key
          });
          await reply(`@${getUserName(sender)}, você atingiu o limite de ${partnerData.limit} links de grupos.`, {
            mentions: [sender]
          });
        }
      } else {
        await bender.sendMessage(from, {
          delete: info.key
        });
        await reply(`@${getUserName(sender)}, você não é um parceiro e não pode enviar links de grupos.`, {
          mentions: [sender]
        });
      }
      ;
    }
    ;
    //ANTI FIGURINHAS
    if (isGroup && groupData.antifig && groupData.antifig.enabled && type === "stickerMessage" && !isGroupAdmin && !info.key.fromMe) {
      try {
        await bender.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        groupData.warnings = groupData.warnings || {};
        groupData.warnings[sender] = groupData.warnings[sender] || {
          count: 0,
          lastWarned: null
        };
        groupData.warnings[sender].count += 1;
        groupData.warnings[sender].lastWarned = new Date().toISOString();
        const warnCount = groupData.warnings[sender].count;
        const warnLimit = groupData.antifig.warnLimit || 3;
        let warnMessage = `🚫 @${getUserName(sender)}, figurinhas não são permitidas neste grupo! Advertência ${warnCount}/${warnLimit}.`;
        if (warnCount >= warnLimit && isBotAdmin) {
          warnMessage += `\n⚠️ Você atingiu o limite de advertências e será removido.`;
          await bender.groupParticipantsUpdate(from, [sender], 'remove');
          delete groupData.warnings[sender];
        }
        await bender.sendMessage(from, {
          text: warnMessage,
          mentions: [sender]
        });
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      } catch (error) {
        console.error("Erro no sistema antifig:", error);
        await reply(`⚠️ Erro ao processar antifig para @${getUserName(sender)}. Administradores, verifiquem!`, {
          mentions: [sender]
        });
      }
    }
    if (!isCmd) {
      const noPrefixCommands = loadNoPrefixCommands();
      const matchedCommand = noPrefixCommands.find(item => budy2.split(' ')[0].trim() === item.trigger);
      if (matchedCommand) {
        var command = matchedCommand.command;
        var isCmd = true;
      }
      ;
    }
    ;

//Funções Atalias

const sendAudio = (id, link, tipo, hehe) => {
    return bender.sendMessage(id, {audio: {url: link}, mimetype: tipo}, {quoted: hehe})
}
  
const sendImage = (id, ytb, cap) => {
    bender.sendMessage(from, {image: {url: ytb}, caption: cap}, {quoted:info})
}

// Função auxiliar para criar um delay (pausa) usando async/await
const delay = ms => new Promise(res => setTimeout(res, ms));

//tempo de block
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos

// Função que será chamada após 30 minutos para desbloquear o usuário
async function handleRoletaUnblock(userJid, chatId) {
    // ⚠️ ATENÇÃO: Use o caminho REAL do seu arquivo de dados de grupo.
    const groupFile = './dados/grupos.json'; // Exemplo, use o seu caminho real!
    
    let groupData; 
    try {
        groupData = JSON.parse(fs.readFileSync(groupFile, 'utf-8'));
    } catch (e) {
        // Se a leitura falhar, não podemos desbloquear, apenas logamos o erro.
        console.error("Erro ao ler groupData para desbloqueio da roleta:", e);
        return;
    }
    
    // Assegura que a propriedade existe
    groupData.blockedUsers = groupData.blockedUsers || {};
    
    if (groupData.blockedUsers[userJid]) {
        
        // 1. REMOVE DA LISTA DE BLOQUEIO MANUAL
        delete groupData.blockedUsers[userJid];
        
        // 2. SALVA O ARQUIVO
        try {
            fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
            
            // 3. (OPCIONAL) NOTIFICA O GRUPO/USUÁRIO
            await bender.sendMessage(chatId, { 
                text: `✅ Usuário @${userJid.split('@')[0]} foi desbloqueado automaticamente após a penalidade da roleta.`, 
                mentions: [userJid]
            });
        } catch (e) {
            console.error("Erro ao salvar groupData após desbloqueio automático:", e);
        }
    }
}

//=================INICIO ROLETA===================//
const ROLLER_COST = 100; // Custo para girar a roleta
//const COOLDOWN_MS = 12 * 60 * 60 * 1000;  // Cooldown de 12h minuto, se desejar
const COOLDOWN_MS = 5 * 60 * 60 * 1000; 
//const COOLDOWN_MS = 1 * 1000;
const PRIZES = [
    // Chance de Ganhar (Peso) / Recompensa / Path do Vídeo
    { weight: 150, type: 'coins', amount: 50, video: './dados/midias/50.mp4', msg: 'Parabéns! Você ganhou 50 Bcoins.' },
    { weight: 130, type: 'coins', amount: 100, video: './dados/midias/100.mp4', msg: 'Uau! Você ganhou 100 Bcoins!' },
    { weight: 110, type: 'coins', amount: 200, video: './dados/midias/200.mp4', msg: 'Bom prêmio! Você ganhou 200 Bcoins.' },
    { weight: 50, type: 'coins', amount: 300, video: './dados/midias/300.mp4', msg: 'Mandou bem! Você ganhou 300 Bcoins.' },
    { weight: 20, type: 'coins', amount: 400, video: './dados/midias/400.mp4', msg: 'Ótimo! Você levou 400 Bcoins.' },
    { weight: 10, type: 'coins', amount: 500, video: './dados/midias/500.mp4', msg: 'Prêmio robusto! Você ganhou 500 Bcoins.' },
    { weight: 4, type: 'coins', amount: 1000, video: './dados/midias/1000.mp4', msg: 'JACKPOT! Você levou 1.000 Bcoins!' },
    { weight: 3, type: 'coins', amount: 2000, video: './dados/midias/2000.mp4', msg: 'SUPER JACKPOT! Você levou 2.000 Bcoins!' },
    
    // Prêmios Raros/Especiais
    //{ weight: 5, type: 'coins', amount: 3000, video: './midias/3000.mp4', msg: 'PREMIAÇÂO MAXIMA! Você ganhou 3.000 Bcoins!' }, // Usaremos o vídeo da roleta ou um fallback, já que você não tem um vídeo só para ele.
    
    // Penalidades e Neutro
    { weight: 200, type: 'neutral', msg: 'Quase! A roleta parou no NADA.' , video: './dados/midias/nada.mp4' },
    { weight: 55, type: 'block', msg: 'Azar! A roleta parou no BLOCK. Você ficará bloqueado por 30 minuto.' , video: './dados/midias/block.mp4' },
    { weight: 10, type: 'ban', msg: 'Desastre! A roleta parou no BAN. Contate um administrador.', video: './dados/midias/ban.mp4' },
];

// O peso total da roleta neste exemplo é: 150+130+110+90+70+50+20+10+5+200+55+10 = 910. 
// Você deve ajustar os pesos para que somem o total desejado.
const TOTAL_WEIGHT = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

function selectPrize() {
    let random = Math.random() * TOTAL_WEIGHT;
    for (const prize of PRIZES) {
        if (random < prize.weight) {
            return prize;
        }
        random -= prize.weight;
    }
}

//==============FIM DA ROLETA===============================//

    //menu
    const cabecalhomenu = `🤖 ʙᴏᴛ: *${nomebot}*
👤 ᴜsᴜᴀʀɪᴏ: *${nome}* 
✴️ ᴅᴏɴᴏ: *${nomedono}*`

//créditos figurinhas
const hora16 = moment.tz('America/Sao_Paulo').format('HH:MM:SS')
const date16 = moment.tz('America/Sao_Paulo').format('DD/MM/YYYY')
const vipStatus2 = isPremium ? "Premium 👑" : "Comum";
const userpremiumsticker = "Usuário Premium 👑"
let day = `${date16} ${hora16}`
const figpackname = `👤 Usuario(a): ➔ ${pushname}\n🤖 Bot ➔ ${nomebot}\n👑 Dono: ➔`;
const figautor = `✦ ${nomedono} ✦\n● https://info.loami.shop - ${day} ●`;
const figpackname2 = `${isGroup ? "⚙️ Grupo:" : "🪪 Usuário:"} ${isGroup ? groupName : pushname}\n👑 ⃟ᴄʀɪᴀᴅᴀ ᴘᴏʀ: ${assBender}`;
const figautor2 = `\n🕑 Tempo: ${dattofc} ${hourofc}\n${pushname} | ${isPremium ? userpremiumsticker : ""}`;


async function fetchJson(url, options) { 
   const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36', 'DNT': 1, 'Upgrade-Insecure-Request': 1 }, ...options });
	if (!res.ok) return Promise.reject("Error")
		const json = await res.json();
		return Promise.resolve(json);
}

/**
 * Realiza a cobrança de um valor no saldo do usuário.
 *
 * @param {number} cost - O valor a ser cobrado.
 * @param {string} sender - O ID do usuário (quem está sendo cobrado).
 * @returns {boolean} - Retorna true se a cobrança for bem-sucedida, false caso contrário.
 */
function chargeUser(cost, sender) {
    // 1. Carrega a economia e o usuário
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const COST = cost; // Apenas por clareza

    // 2. Checagem de Saldo
    if (me.wallet < COST) {
        // Envia a mensagem de erro
        reply(`❌ Saldo insuficiente! Este comando custa ${fmt(COST)} BCOINS. Você tem apenas ${fmt(me.wallet)} BCOINS na carteira.`);
        // Retorna FALSE para indicar que a cobrança FALHOU
        return false;
    }

    // 3. Realiza a Cobrança e Salva
    me.wallet -= COST;
    saveEconomy(econ);

    // Envia a mensagem de sucesso
    reply(`💸 Cobrado ${fmt(COST)} BCOINS da sua carteira.\n\n💸 Saldo restante: *${fmt(me.wallet)} BCOINS.*`);
    
    // Retorna TRUE para indicar que a cobrança FOI BEM-SUCEDIDA
    return true;
}

    switch (command) {
/*
case 'roleta': case 'spin':
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
        
    // --- 1. VERIFICAÇÕES INICIAIS ---
    const cd = me.cooldowns?.roller || 0;
    if (Date.now() < cd) return reply(`⏳ A roleta está quente! Aguarde ${timeLeft(cd)} para girar novamente.`);
    
    if (me.wallet < ROLLER_COST) return reply(`Você precisa de ${fmt(ROLLER_COST)} para girar a roleta.`);

    // --- 2. EXECUÇÃO ---
    me.wallet -= ROLLER_COST;
    const selectedPrize = selectPrize();
    me.cooldowns.roller = Date.now() + COOLDOWN_MS; 

    // --- 3. APLICAÇÃO DO PRÊMIO E CAPTION ---
    let caption = selectedPrize.msg;
    
    if (selectedPrize.type === 'coins') {
        me.wallet += selectedPrize.amount;
        caption += ` Você tem agora ${fmt(me.wallet)} Bcoins.`;
    } 
    else if (selectedPrize.type === 'block') {
        caption += ` Suas ações foram bloqueadas temporariamente.`;
    }
    else if (selectedPrize.type === 'ban') {
        caption += ` O comando pode ser bloqueado permanentemente!`;
    }

    // --- 4. SALVA E ENVIA O VÍDEO ---
    saveEconomy(econ);
    
    const videoPath = selectedPrize.video;
    
    // LEITURA DO ARQUIVO DE VÍDEO e ENVIO
    try {
        const videoBuffer = fs.readFileSync(videoPath);
        const videoFilename = videoPath.split('/').pop();

        // ALTERAÇÃO AQUI: Adicionar gifPlayback: true
        await bender.sendMessage(from, {
            video: videoBuffer, // Passa o buffer do vídeo lido
            fileName: videoFilename,
            caption: caption,
            mimetype: 'video/mp4',
            gifPlayback: true // ISSO FAZ O VÍDEO REPRODUZIR COMO GIF EM LOOP!
        }, {
            quoted: info
        });
        
        return; 

    } catch (error) {
        console.error('Erro ao enviar vídeo da roleta:', error);
        return reply(`⚠️ Erro ao enviar o vídeo. O prêmio foi aplicado: ${caption}`);
    }
    
break; // Fim do case 'roleta'
*/

// ... (Seu código anterior do case 'roleta' é mantido até aqui)
case 'roleta': case 'spin':
    await bender.react('☢️', {key: info.key});
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    // É NECESSÁRIO CARREGAR O groupData aqui, como você faz no 'blockuser'
    // Exemplo: 
    // const groupFile = './dados/grupos.json'; // Use sua variável groupFile
    // let groupData = JSON.parse(fs.readFileSync(groupFile, 'utf-8')); // Use sua função de leitura de groupData

    // --- 1. VERIFICAÇÕES INICIAIS ---
    const cd = me.cooldowns?.roller || 0;
    if (Date.now() < cd) return reply(`⏳ A roleta está quente! Aguarde ${timeLeft(cd)} para girar novamente.`);
    
    if (me.wallet < ROLLER_COST) return reply(`Você precisa de ${fmt(ROLLER_COST)} para girar a roleta.`);

    // --- 2. EXECUÇÃO ---
    me.wallet -= ROLLER_COST;
    const selectedPrize = selectPrize();
    me.cooldowns.roller = Date.now() + COOLDOWN_MS; 

    // --- 3. APLICAÇÃO DO PRÊMIO E CAPTION ---
    let finalCaption = selectedPrize.msg;
    
    if (selectedPrize.type === 'coins') {
        me.wallet += selectedPrize.amount;
        finalCaption += ` Você tem agora ${fmt(me.wallet)} Bcoins.`;
    } 
    else if (selectedPrize.type === 'block') {
        finalCaption += ` Azar! Você foi BLOQUEADO por 30 minutos e não pode usar comandos. 🤕`;
        
        // APLICAÇÃO DO BLOQUEIO MANUAL
        groupData.blockedUsers = groupData.blockedUsers || {};
        groupData.blockedUsers[sender] = {
            reason: "Roleta - Penalidade de 30 minutos",
            timestamp: Date.now()
        };
        // AGENDA O DESBLOQUEIO
        setTimeout(() => {
            handleRoletaUnblock(sender, from);
        }, BLOCK_DURATION_MS); 
    }
    else if (selectedPrize.type === 'ban') {
        finalCaption += ` Desastre! A roleta mandou BAN!`;
        
        let isBanSuccessful = false;

        // TENTA 1: BANIR O USUÁRIO
        if (isGroup && isBotAdmin) { 
            try {
                await bender.groupParticipantsUpdate(from, [sender], 'remove');
                isBanSuccessful = true;
                finalCaption += ` ✅ Removido(a) do grupo!`;
            } catch (e) {
                // Se o BAN falhar (Plano B: BLOCK DE 30 MINUTOS)
                finalCaption += ` ❌ O banimento falhou (usuário/bot admin), então você foi BLOQUEADO por 30 minutos. 😡`;
                
                // APLICAÇÃO DO BLOQUEIO MANUAL
                groupData.blockedUsers = groupData.blockedUsers || {};
                groupData.blockedUsers[sender] = {
                    reason: "Roleta - Contingência de BAN (30 minutos)",
                    timestamp: Date.now()
                };
                // AGENDA O DESBLOQUEIO
                setTimeout(() => {
                    handleRoletaUnblock(sender, from);
                }, BLOCK_DURATION_MS); 
            }
        } else {
            // Se o bot não é admin/não é grupo (Plano B: BLOCK DE 30 MINUTOS)
            finalCaption += ` ❌ O bot não tem permissão para remover, então você foi BLOQUEADO por 30 minutos. 😈`;

            // APLICAÇÃO DO BLOQUEIO MANUAL
            groupData.blockedUsers = groupData.blockedUsers || {};
            groupData.blockedUsers[sender] = {
                reason: "Roleta - Bot sem Admin (30 minutos)",
                timestamp: Date.now()
            };
            // AGENDA O DESBLOQUEIO
            setTimeout(() => {
                handleRoletaUnblock(sender, from);
            }, BLOCK_DURATION_MS); 
        }
    }

    // --- 4. SALVA DADOS MODIFICADOS E ENVIA O VÍDEO ---
    saveEconomy(econ);
    
    // SALVA OS DADOS DO GRUPO (PODE SER OMITIDO SE VOCÊ JÁ TEM SALVAMENTO GLOBAL)
    // fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2)); 

    // ... (Restante do código de envio de GIF e delay)

    // --- 4. SALVA E ENVIA O VÍDEO (IMEDIATAMENTE) ---

    
    const videoPath = selectedPrize.video;
    
    try {
        const videoBuffer = fs.readFileSync(videoPath);
        const videoFilename = videoPath.split('/').pop();

        // 4.1 ENVIA O GIF (SEM TEXTO) IMEDIATAMENTE
        const gifSent = await bender.sendMessage(from, {
            video: videoBuffer, 
            fileName: videoFilename,
            caption: 'A roleta está girando...', // Texto simples para a primeira mensagem
            mimetype: 'video/mp4',
            gifPlayback: true 
        }, {
            quoted: info
        });
        
        // 4.2 ESPERA 10 SEGUNDOS (10000 milissegundos)
        await delay(10 * 1000); 

        // 4.3 ENVIA O TEXTO FINAL (CAPTION) COMO RESPOSTA AO GIF
        await bender.sendMessage(from, { text: `🎯 O resultado final é:\n${finalCaption}` }, {
            quoted: gifSent // Responde à mensagem do GIF (Opcional: info)
        });
        
        return; 

    } catch (error) {
        console.error('Erro no processo da roleta:', error);
        // Se o GIF falhar, envia a mensagem de texto com o resultado
        return reply(`⚠️ Um erro ocorreu no vídeo. O prêmio foi aplicado: ${finalCaption}`);
    }
    
break; // Fim do case 'roleta'

case 'sendstickers':
case 'figurinhas':
case 'figurinha':
case 'sendsticker':
if (!chargeUser(10, sender)) {
        return; 
    }
  try {
    const args = body.trim().split(/\s+/);
    let quantidade = parseInt(args[1]);
    if (isNaN(quantidade)) quantidade = 3;
    quantidade = Math.min(Math.max(1, quantidade), 10);

    // Função delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    const totalFigurinhas = 5532;

    for (let i = 0; i < quantidade; i++) {
      const num = Math.floor(Math.random() * totalFigurinhas);
      const repoIndex = Math.floor(num / 1000) + 1;
      const url = `https://raw.githubusercontent.com/AtaliasOliveira1/stickers-${repoIndex}/main/fig%20(${num}).webp`;

      try {
        await bender.sendMessage(from, { sticker: { url: url } });
        await delay(1000); // delay de 1s entre envios
      } catch (err) {
        console.error(`Erro ao enviar figurinha ${num}:`, err.message);
        await reply(`❌ Não consegui enviar uma das figurinhas. Tenta de novo!`);
        break;
      }
    }

  } catch (e) {
    console.error(e);
    await reply("⚠️ Deu ruim aqui... tenta de novo em instantes! 😖");
  }
break

      case 'menugold':
      case 'menumoedas':
      case 'moedas':
      case 'gold':
        case 'bcoins':
        try {
          await bender.react('🆗', {key: info.key});

          const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            const mediaBuffer = fs.readFileSync(mediaPath);
            
            let menuText = `${cabecalhomenu}
╰══𝐒𝐓𝐀𝐓𝐔𝐒 𝐄 𝐏𝐄𝐑𝐅𝐈𝐋══⪨
⋟👤 ${prefix}perfilrpg
⋟💵 ${prefix}carteira
⋟🏦 ${prefix}banco
⋟🏆 ${prefix}topgold
╰══𝐑𝐄𝐍𝐃𝐀𝐒 ══⪨
⋟☀️ ${prefix}diario
⋟👷 ${prefix}trabalhar
⋟☢️ ${prefix}roleta
⋟⛏️ ${prefix}minerar
⋟🎣 ${prefix}pescar
⋟🗺️ ${prefix}explorar
⋟🏹 ${prefix}caçar
⋟🔥 ${prefix}forjar
⋟🔪 ${prefix}crime
⋟🚨 ${prefix}assaltar @user
╰══𝐄𝐌𝐏𝐑𝐄𝐆𝐎𝐒══⪨
⋟📝 ${prefix}vagas
⋟📥 ${prefix}emprego <vaga>
⋟🚪 ${prefix}demitir
╰══𝐁𝐀𝐍𝐂𝐎══⪨
⋟⬆️ ${prefix}depositar <valor|all>
⋟⬇️ ${prefix}sacar <valor|all>
⋟➡️ ${prefix}transferir <@user> <valor>
⋟💠 ${prefix}pix <@user> <valor>
╰══𝐈𝐓𝐄𝐍𝐒 𝐄 𝐋𝐎𝐉𝐀══⪨
⋟🏪 ${prefix}loja
⋟🛒 ${prefix}comprar <item>
⋟🎒 ${prefix}inventario
⋟🔩 ${prefix}materiais
⋟🏷️ ${prefix}precos
⋟💰 ${prefix}vender <material> <qtd|all>
⋟🔧 ${prefix}reparar
╰══𝐌𝐄𝐑𝐂𝐀𝐃𝐎══⪨
⋟🌐 ${prefix}mercado
⋟📢 ${prefix}listar item|mat <id|material> <qtd> <preço>
⋟💳 ${prefix}comprarmercado <id>
⋟📜 ${prefix}meusanuncios
⋟❌ ${prefix}cancelar <id>
╰══𝐏𝐑𝐎𝐏𝐑𝐈𝐄𝐃𝐀𝐃𝐄𝐒══⪨
⋟🏘️ ${prefix}propriedades
⋟🏠 ${prefix}comprarpropriedade <tipo>
⋟📥 ${prefix}coletarpropriedades
╰══𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒𝐀𝐎 ══⪨
⋟📈 ${prefix}habilidades
⋟📅 ${prefix}desafiosemanal
⋟🗓️ ${prefix}desafiomensal
╰══𝐃𝐄𝐒𝐀𝐅𝐈𝐎 𝐃𝐈𝐀𝐑𝐈𝐎 ══⪨
⋟❓ ${prefix}desafio
⋟✅ ${prefix}desafio coletar
╰══𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒══⪨
⋟🪙 Ban = 15.000
⋟🪙 Mute = 10.000
⋟🪙 Desmute = 1.000
⋟🪙 Figurinhas = 10
⋟🪙 Rename = 50
⋟🪙 Del = 5.000
⋟🪙 Hidetag = 10.000
⋟🪙 Rvisu = 2.000
⋟🪙 Play = 15
⋟🪙 Playvid = 15
╰─┈┈┈◜❁◞┈┈┈─╯`;
            
            await bender.sendMessage(from, {
              [useVideo ? 'video' : 'image']: mediaBuffer,
              caption: menuText,
              gifPlayback: useVideo,
              mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
            }, {
              quoted: info
            });
        } catch (error) {
          console.error('Erro ao enviar menu de administração:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de administração");
        }
        break;

      case 'lembrete':
      case 'lembrar': {
        try {
          if (!q) return reply(`📅 *Como usar o comando lembrete:*\n\n💡 *Exemplos:*\n• ${prefix}lembrete em 30m beber água\n• ${prefix}lembrete 15/09 18:30 reunião\n• ${prefix}lembrete amanhã 08:00 acordar`);
          const parsed = parseReminderInput(q);
          if (!parsed) return reply('❌ Não consegui entender a data/hora. Exemplos:\n- em 10m tomar remédio\n- 25/12 09:00 ligar para a família\n- hoje 21:15 estudar');
          const { at, message } = parsed;
          const minDelay = 10 * 1000;
          if (at - Date.now() < minDelay) return reply('⏳ Escolha um horário pelo menos 10 segundos à frente.');
          const newReminder = {
            id: crypto.randomBytes(6).toString('hex'),
            userId: sender,
            chatId: from,
            createdByName: pushname || '',
            createdAt: new Date().toISOString(),
            at,
            message: message,
            status: 'pending'
          };
          const list = loadReminders();
          list.push(newReminder);
          saveReminders(list);
          await reply(`✅ Lembrete agendado para ${tzFormat(at)}.\n📝 Mensagem: ${message}`);
        } catch (e) {
          console.error('Erro ao agendar lembrete:', e);
          await reply('❌ Ocorreu um erro ao agendar seu lembrete.');
        }
        break;
      }
      case 'meuslembretes':
      case 'listalembretes': {
        try {
          const list = loadReminders().filter(r => r.userId === sender && r.status !== 'sent');
          if (!list.length) return reply('📭 Você não tem lembretes pendentes.');
          const lines = list
            .sort((a,b)=>a.at-b.at)
            .map((r,i)=>`${i+1}. [${r.id.slice(0,6)}] ${tzFormat(r.at)} — ${r.message}`);
          await reply(`🗓️ Seus lembretes pendentes:\n\n${lines.join('\n')}`);
        } catch (e) {
          console.error('Erro ao listar lembretes:', e);
          await reply('❌ Ocorreu um erro ao listar seus lembretes.');
        }
        break;
      }
      case 'apagalembrete':
      case 'removerlembrete': {
        try {
          const idArg = (q||'').trim();
          if (!idArg) return reply(`🗑️ *Uso do comando apagalembrete:*\n\n📝 *Formato:* ${prefix}apagalembrete <id|tudo>\n\n💡 *Exemplos:*\n• ${prefix}apagalembrete 123456\n• ${prefix}apagalembrete tudo`);
          let list = loadReminders();
          if (['tudo','todos','all'].includes(idArg.toLowerCase())) {
            const before = list.length;
            list = list.filter(r => !(r.userId === sender && r.status !== 'sent'));
            const removed = before - list.length;
            saveReminders(list);
            return reply(`🗑️ Removidos ${removed} lembrete(s) pendente(s).`);
          }
          const idx = list.findIndex(r => r.id.startsWith(idArg) && r.userId === sender && r.status !== 'sent');
          if (idx === -1) return reply('❌ Lembrete não encontrado ou já enviado. Dica: use o ID mostrado em "meuslembretes".');
          const removed = list.splice(idx,1)[0];
          saveReminders(list);
          await reply(`🗑️ Lembrete removido: ${removed.message}`);
        } catch (e) {
          console.error('Erro ao apagar lembrete:', e);
          await reply('❌ Ocorreu um erro ao remover seu lembrete.');
        }
        break;
      }

      case 'modogold': {
        if (!isGroup) return reply('Este comando só funciona em grupos.');
        if (!isGroupAdmin) return reply('Apenas administradores podem usar este comando.');
        groupData.modogold = !groupData.modogold;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`💰 Modo Gold ${groupData.modogold ? 'ATIVADO' : 'DESATIVADO'} neste grupo.`);
        break;
      }

      case 'perfilrpg':
      case 'carteira':
      case 'banco':
      case 'depositar':
      case 'dep':
      case 'sacar':
      case 'saque':
      case 'transferir':
      case 'pix':
      case 'loja':
      case 'lojagold':
      case 'comprar':
      case 'buy':
  case 'inventario':
  case 'inv':
  case 'apostar':
  case 'bet':
  case 'slots':
      case 'minerar':
      case 'mine':
      case 'trabalhar':
      case 'work':
  case 'emprego':
  case 'vagas':
  case 'demitir':
  case 'pescar':
  case 'fish':
  case 'explorar':
  case 'explore':
  case 'cacar':
  case 'caçar':
  case 'hunt':
  case 'mercado':
  case 'listar':
  case 'comprarmercado':
  case 'meusanuncios':
  case 'cancelar':
  case 'propriedades':
  case 'comprarpropriedade':
  case 'coletarpropriedades':
  case 'habilidades':
  case 'desafiosemanal':
  case 'desafiomensal':
  case 'materiais':
  case 'precos':
  case 'preços':
  case 'vender':
  case 'reparar':
  case 'desafio':
  case 'forjar':
  case 'forge':
  case 'crime':
      case 'assaltar':
      case 'roubar':
      case 'topgold':
      case 'diario':
      case 'daily':
      case 'resetgold':
      {
        if (!isGroup) return reply('💰 Os comandos de economia funcionam apenas em grupos.');
  if (!groupData.modogold) return reply(`🌟 *Modo Gold desativado!*\n\n🔒 Este recurso está disponível apenas quando o Modo Gold está ativado.\n🔐 *Administradores* podem ativar com: ${prefix}modogold`);
    const econ = loadEconomy();
    const changedEconomy = ensureEconomyDefaults(econ);
  const me = getEcoUser(econ, sender);
  ensureUserChallenge(me);
  const { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus, forgeBonus } = applyShopBonuses(me, econ);
  if (changedEconomy) saveEconomy(econ);

        const sub = command;
        const mentioned = (menc_jid2 && menc_jid2[0]) || (q.includes('@') ? q.split(' ')[0].replace('@','') : null);

        if (sub === 'resetgold') {
          if (!(isOwner && !isSubOwner && (sender === nmrdn || isBotSender))) return reply('Apenas o Dono principal pode resetar usuários.');
          const target = (menc_jid2 && menc_jid2[0]) || null;
          const scope = (q||'').toLowerCase();
          if (scope.includes('all') || scope.includes('todos')) {
            let count = 0;
            for (const p of (AllgroupMembers||[])) {
              if (econ.users[p]) { delete econ.users[p]; count++; }
            }
            saveEconomy(econ);
            return reply(`✅ Resetado o gold de ${count} membros do grupo.`);
          }
          if (!target) return reply('Marque um usuário para resetar ou use "all".');
          delete econ.users[target];
          saveEconomy(econ);
          return reply(`✅ Gold resetado para @${getUserName(target)}.`, { mentions:[target] });
        }

        if (sub === 'perfilrpg' || sub === 'carteira') {
          const total = (me.wallet||0) + (me.bank||0);
          return reply(`👤 Perfil Financeiro
💼 Carteira: ${fmt(me.wallet)}
🏦 Banco: ${fmt(me.bank)}
💠 Total: ${fmt(total)}
 💼 Emprego: ${me.job ? econ.jobCatalog[me.job]?.name || me.job : 'Desempregado(a)'}
`);
        }
        if (sub === 'banco') {
          const cap = isFinite(bankCapacity) ? bankCapacity : '∞';
          return reply(`🏦 Banco
Saldo: ${fmt(me.bank)}
Capacidade: ${cap === '∞' ? 'ilimitada' : fmt(cap)}
`);
        }

        if (sub === 'depositar' || sub === 'dep') {
          const amount = parseAmount(q.split(' ')[0], me.wallet);
          if (!isFinite(amount) || amount <= 0) return reply('Informe um valor válido (ou "all").');
          if (amount > me.wallet) return reply('Você não tem tudo isso na carteira.');
          const cap = isFinite(bankCapacity) ? bankCapacity : Infinity;
          const space = cap - me.bank;
          if (space <= 0) return reply('Seu banco está cheio. Compre um Cofre na loja para aumentar a capacidade.');
          const toDep = Math.min(amount, space);
          me.wallet -= toDep; me.bank += toDep;
          saveEconomy(econ);
          return reply(`✅ Depositado ${fmt(toDep)}. Banco: ${fmt(me.bank)} | Carteira: ${fmt(me.wallet)}`);
        }
        if (sub === 'sacar' || sub === 'saque') {
          const amount = parseAmount(q.split(' ')[0], me.bank);
          if (!isFinite(amount) || amount <= 0) return reply('Informe um valor válido (ou "all").');
          if (amount > me.bank) return reply('Saldo insuficiente no banco.');
          me.bank -= amount; me.wallet += amount;
          saveEconomy(econ);
          return reply(`✅ Sacado ${fmt(amount)}. Banco: ${fmt(me.bank)} | Carteira: ${fmt(me.wallet)}`);
        }

        if (sub === 'transferir' || sub === 'pix') {
          if (!mentioned) return reply(`👥 *Transferência de recursos*\n\n.Marque um usuário e informe o valor.\n📝 *Exemplo:* ${prefix}${sub} @user 100`);
          const amount = parseAmount(args.slice(-1)[0], me.wallet);
          if (!isFinite(amount) || amount <= 0) return reply('Informe um valor válido.');
          if (amount > me.wallet) return reply('Você não tem esse valor na carteira.');
          const other = getEcoUser(econ, mentioned);
          if (mentioned === sender) return reply('Você não pode transferir para si mesmo.');
          me.wallet -= amount; other.wallet += amount;
          saveEconomy(econ);
          return reply(`💸 Transferido ${fmt(amount)} para @${getUserName(mentioned)}.`, { mentions:[mentioned] });
        }

        if (sub === 'loja' || sub === 'lojagold') {
          const items = Object.entries(econ.shop||{});
          if (items.length === 0) return reply('A loja está vazia no momento.');
          let text = '🛍️ Loja de Itens\n\n';
          for (const [k, it] of items) {
            text += `• ${k} — ${it.name} — ${fmt(it.price)}\n`;
          }
          text += `\nCompre com: ${prefix}comprar <item>`;
          return reply(text);
        }
        if (sub === 'comprar' || sub === 'buy') {
          const key = (args[0]||'').toLowerCase();
          if (!key) return reply('Informe o item. Ex: '+prefix+'comprar pickaxe_bronze');
          const it = (econ.shop||{})[key];
          if (!it) return reply('Item não encontrado. Veja a loja com '+prefix+'loja');
          if (me.wallet < it.price) return reply('Saldo insuficiente na carteira.');
          me.wallet -= it.price;
          // Se for ferramenta (picareta), equipa automaticamente
          if (it.type === 'tool' && it.toolType === 'pickaxe') {
            me.tools = me.tools || {};
            me.tools.pickaxe = { tier: it.tier, dur: it.durability, max: it.durability, key };
            saveEconomy(econ);
            return reply(`✅ Você comprou e equipou ${it.name} (durabilidade ${it.durability}).`);
          }
          // Caso contrário, vai para o inventário
          me.inventory[key] = (me.inventory[key]||0)+1;
          saveEconomy(econ);
          return reply(`✅ Você comprou ${it.name} por ${fmt(it.price)}!`);
        }

        if (sub === 'inventario' || sub === 'inv') {
          const entries = Object.entries(me.inventory||{}).filter(([,q])=>q>0);
          let text = '🎒 Inventário\n\n';
          if (entries.length>0) {
            for (const [k,q] of entries) {
              const it = (econ.shop||{})[k];
              text += `• ${it?.name || k} x${q}\n`;
            }
          } else {
            text += '• (vazio)\n';
          }
          // Ferramentas
          const pk = me.tools?.pickaxe;
          text += '\n🛠️ Ferramentas\n';
          if (pk) {
            const tierName = pk.tier || 'desconhecida';
            const dur = pk.dur ?? 0; const max = pk.max ?? (pk.tier==='bronze'?20:pk.tier==='ferro'?60:pk.tier==='diamante'?150:0);
            text += `• Picareta ${tierName} — ${dur}/${max}\n`;
          } else {
            text += '• Picareta — nenhuma\n';
          }
          return reply(text);
        }

        // Materiais e preços
        if (sub === 'materiais') {
          const mats = me.materials || {};
          const keys = Object.keys(mats).filter(k=>mats[k]>0);
          if (keys.length===0) return reply('⛏️ Você não possui materiais. Mine para coletar.');
          let text = '⛏️ Materiais\n\n';
          for (const k of keys) text += `• ${k}: ${mats[k]}\n`;
          return reply(text);
        }
        if (sub === 'precos' || sub === 'preços') {
          const mp = econ.materialsPrices || {};
          let text = '💱 Preço dos Materiais (unidade)\n\n';
          for (const [k,v] of Object.entries(mp)) text += `• ${k}: ${fmt(v)}\n`;
          // Receitas básicas
          const r = econ.recipes || {};
          if (Object.keys(r).length>0) {
            text += '\n📜 Receitas\n';
            for (const [key,rec] of Object.entries(r)) {
              const shopItem = econ.shop?.[key];
              const name = shopItem?.name || key;
              const req = Object.entries(rec.requires||{}).map(([mk,mq])=>`${mk} x${mq}`).join(', ');
              text += `• ${name}: ${req} + ${fmt(rec.gold||0)} gold\n`;
            }
          }
          return reply(text);
        }
        if (sub === 'vender') {
          const matKey = (args[0]||'').toLowerCase();
          if (!matKey) return reply(`Use: ${prefix}vender <material> <quantidade|all>`);
          const price = (econ.materialsPrices||{})[matKey];
          if (!price) return reply('Material inválido. Veja preços com '+prefix+'precos');
          const have = me.materials?.[matKey] || 0;
          if (have<=0) return reply('Você não possui esse material.');
          const qtyArg = args[1]||'all';
          const qty = ['all','tudo','max'].includes((qtyArg||'').toLowerCase()) ? have : parseAmount(qtyArg, have);
          if (!isFinite(qty) || qty<=0) return reply('Quantidade inválida.');
          const gain = qty * price;
          me.materials[matKey] = have - qty;
          me.wallet += gain;
          saveEconomy(econ);
          return reply(`💰 Você vendeu ${qty}x ${matKey} por ${fmt(gain)}.`);
        }
        if (sub === 'reparar') {
          const pk = getActivePickaxe(me) || me.tools?.pickaxe;
          if (!pk) return reply('Você não tem picareta equipada. Compre uma na '+prefix+'loja.');
          const kits = me.inventory?.repairkit || 0;
          if (kits<=0) return reply(`Você não tem Kit de Reparos. Compre com ${prefix}comprar repairkit.`);
          const repair = econ.shop?.repairkit?.effect?.repair || 40;
          const max = pk.max ?? (pk.tier==='bronze'?20:pk.tier==='ferro'?60:pk.tier==='diamante'?150:pk.dur);
          const before = pk.dur;
          pk.dur = Math.min(max, pk.dur + repair);
          me.inventory.repairkit = kits - 1;
          me.tools.pickaxe = { ...pk, max };
          saveEconomy(econ);
          return reply(`🛠️ Picareta reparada: ${before} ➜ ${pk.dur}/${max}.`);
        }
        if (sub === 'desafio') {
          ensureUserChallenge(me);
          const ch = me.challenge;
          if ((args[0]||'').toLowerCase()==='coletar') {
            if (ch.claimed) return reply('Você já coletou a recompensa de hoje.');
            if (!isChallengeCompleted(me)) return reply('Complete todas as tarefas diárias para coletar.');
            me.wallet += ch.reward;
            ch.claimed = true;
            saveEconomy(econ);
            return reply(`🎉 Recompensa diária coletada: ${fmt(ch.reward)}!`);
          }
          const labels = {
            mine: 'Minerações', work:'Trabalhos', fish:'Pescarias', explore:'Explorações', hunt:'Caçadas', crimeSuccess:'Crimes bem-sucedidos'
          };
          let text = '🏅 Desafio Diário\n\n';
          for (const t of ch.tasks||[]) {
            text += `• ${labels[t.type]||t.type}: ${t.progress||0}/${t.target}\n`;
          }
          text += `\nPrêmio: ${fmt(ch.reward)} ${ch.claimed?'(coletado)':''}`;
          if (isChallengeCompleted(me) && !ch.claimed) text += `\n\nUse: ${prefix}desafio coletar`;
          return reply(text);
        }

        if (sub === 'apostar' || sub === 'bet') {
          const amount = parseAmount(args[0], me.wallet);
          if (!isFinite(amount) || amount <= 0) return reply('Valor inválido.');
          if (amount > me.wallet) return reply('Saldo insuficiente.');
          const win = Math.random() < 0.47;
          if (win) { me.wallet += amount; saveEconomy(econ); return reply(`🍀 Você ganhou ${fmt(amount)}!`); }
          me.wallet -= amount; saveEconomy(econ); return reply(`💥 Você perdeu ${fmt(amount)}.`);
        }
        if (sub === 'slots') {
          const amount = parseAmount(args[0]||'100', me.wallet);
          if (!isFinite(amount) || amount <= 0) return reply('Valor inválido.');
          if (amount > me.wallet) return reply('Saldo insuficiente.');
          const symbols = ['🍒','🍋','🍉','⭐','🔔'];
          const r = [0,0,0].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);
          let mult = 0;
          if (r[0]===r[1] && r[1]===r[2]) mult = 3;
          else if (r[0]===r[1] || r[1]===r[2] || r[0]===r[2]) mult = 1.5;
          const delta = Math.floor(amount * (mult-1));
          me.wallet += delta; // delta pode ser negativo
          saveEconomy(econ);
          return reply(`🎰 ${r.join(' | ')}\n${mult>1?`Você ganhou ${fmt(Math.floor(amount*(mult-1)))}!`:`Você perdeu ${fmt(amount)}`}`);
        }

        if (sub === 'vagas') {
          const jobs = econ.jobCatalog||{}; let txt='💼 Vagas de Emprego\n\n';
          Object.entries(jobs).forEach(([k,j])=>{ txt += `• ${k} — ${j.name} (${fmt(j.min)}-${fmt(j.max)})\n`; });
          txt += `\nUse: ${prefix}emprego <vaga>`; return reply(txt);
        }
        if (sub === 'emprego') {
          const key = (args[0]||'').toLowerCase(); if (!key) return reply('Informe a vaga. Veja com '+prefix+'vagas');
          const job = (econ.jobCatalog||{})[key]; if (!job) return reply('Vaga inexistente.');
          me.job = key; saveEconomy(econ); return reply(`✅ Agora você trabalha como ${job.name}. Ganhos ao usar ${prefix}trabalhar aumentam conforme a vaga.`);
        }
        if (sub === 'demitir') { me.job = null; saveEconomy(econ); return reply('👋 Você pediu demissão.'); }

        if (sub === 'pescar' || sub === 'fish') {
          const cd = me.cooldowns?.fish || 0; if (Date.now()<cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para pescar novamente.`);
          const base = 25 + Math.floor(Math.random()*36); // 25-60, mais lento
          const skillB = getSkillBonus(me,'fishing');
          const bonus = Math.floor(base * ((fishBonus||0) + skillB)); const total = base + bonus;
          me.wallet += total; me.cooldowns.fish = Date.now() + 4*60*1000; // cooldown maior
          addSkillXP(me,'fishing',1); updateChallenge(me,'fish',1,true); updatePeriodChallenge(me,'fish',1,true); saveEconomy(econ);
          return reply(`🎣 Você pescou e ganhou ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}!`);
        }

        if (sub === 'explorar' || sub === 'explore') {
          const cd = me.cooldowns?.explore || 0; if (Date.now()<cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para explorar novamente.`);
          const base = 35 + Math.floor(Math.random()*56); // 35-90
          const skillB = getSkillBonus(me,'exploring');
          const bonus = Math.floor(base * ((exploreBonus||0) + skillB)); const total = base + bonus;
          me.wallet += total; me.cooldowns.explore = Date.now() + 5*60*1000; // cooldown maior
          addSkillXP(me,'exploring',1); updateChallenge(me,'explore',1,true); updatePeriodChallenge(me,'explore',1,true); saveEconomy(econ);
          return reply(`🧭 Você explorou e encontrou ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}!`);
        }

        if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
          const cd = me.cooldowns?.hunt || 0; if (Date.now()<cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para caçar novamente.`);
          const base = 45 + Math.floor(Math.random()*76); // 45-120
          const skillB = getSkillBonus(me,'hunting');
          const bonus = Math.floor(base * ((huntBonus||0) + skillB)); const total = base + bonus;
          me.wallet += total; me.cooldowns.hunt = Date.now() + 6*60*1000;
          addSkillXP(me,'hunting',1); updateChallenge(me,'hunt',1,true); updatePeriodChallenge(me,'hunt',1,true); saveEconomy(econ);
          return reply(`🏹 Você caçou e ganhou ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}!`);
        }

        if (sub === 'forjar' || sub === 'forge') {
          // Modo 1: craft a partir de receitas
          const craftKey = (args[0]||'').toLowerCase();
          if (craftKey && (econ.recipes||{})[craftKey]) {
            const rec = econ.recipes[craftKey];
            const reqs = rec.requires || {};
            // Verifica materiais
            for (const [mk,mq] of Object.entries(reqs)) {
              if ((me.materials?.[mk]||0) < mq) return reply(`Faltam materiais: ${mk} x${mq}. Veja ${prefix}materiais.`);
            }
            // Verifica gold
            const goldCost = rec.gold || 0;
            if (me.wallet < goldCost) return reply(`Você precisa de ${fmt(goldCost)} para forjar.`);
            // Consome
            for (const [mk,mq] of Object.entries(reqs)) { me.materials[mk] -= mq; }
            me.wallet -= goldCost;
            const item = (econ.shop||{})[craftKey];
            if (item?.type==='tool' && item.toolType==='pickaxe') {
              me.tools.pickaxe = { tier: item.tier, dur: item.durability, max: item.durability, key: craftKey };
              saveEconomy(econ);
              return reply(`⚒️ Você forjou e equipou ${item.name}! Durabilidade ${item.durability}.`);
            }
            // Senão, adiciona ao inventário
            me.inventory[craftKey] = (me.inventory[craftKey]||0)+1;
            saveEconomy(econ);
            return reply(`⚒️ Você forjou ${item?.name||craftKey}!`);
          }
          // Modo 2: minigame de forja (antigo)
          const cd = me.cooldowns?.forge || 0; if (Date.now()<cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para forjar novamente.`);
          const cost = 100; if (me.wallet < cost) return reply(`Você precisa de ${fmt(cost)} para materiais.`);
          me.wallet -= cost;
          const success = Math.random()<0.6;
          if (success) {
            const gain = 180 + Math.floor(Math.random()*221); // 180-400
            const bonus = Math.floor(gain * (forgeBonus||0)); const total = gain + bonus;
            me.wallet += total; me.cooldowns.forge = Date.now()+6*60*1000; saveEconomy(econ);
            return reply(`⚒️ Forja bem-sucedida! Lucro ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}.`);
          } else {
            me.cooldowns.forge = Date.now()+6*60*1000; saveEconomy(econ);
            return reply(`🔥 A forja falhou e os materiais foram perdidos.`);
          }
        }

    if (sub === 'crime') {
          const cd = me.cooldowns?.crime || 0; if (Date.now()<cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para tentar de novo.`);
          const success = Math.random() < 0.35; // 35% sucesso, mais difícil
          if (success) {
            const base = 90 + Math.floor(Math.random()*141); // 90-230, menor
            const skillB = getSkillBonus(me,'crime');
            const gain = Math.floor(base * (1 + skillB));
            me.wallet += gain; me.cooldowns.crime = Date.now()+10*60*1000; addSkillXP(me,'crime',1); updateChallenge(me,'crimeSuccess',1,true); updatePeriodChallenge(me,'crimeSuccess',1,true); saveEconomy(econ);
            return reply(`🕵️ Você cometeu um crime e lucrou ${fmt(gain)}. Cuidado para não ser pego!`);
          } else {
            const fine = 120 + Math.floor(Math.random()*201); const pay = Math.min(me.wallet, fine); me.wallet -= pay; me.cooldowns.crime = Date.now()+10*60*1000; saveEconomy(econ);
            return reply(`🚔 Você foi pego! Pagou multa de ${fmt(pay)}.`);
          }
        }

        if (sub === 'minerar' || sub === 'mine') {
          const cd = me.cooldowns?.mine || 0;
          if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para minerar novamente.`);
          const pk = getActivePickaxe(me);
          if (!pk) return reply(`⛏️ Você precisa de uma picareta para minerar. Compre na ${prefix}loja (ex: ${prefix}comprar pickaxe_bronze) ou repare com ${prefix}reparar.`);
          // Cálculo de ouro com base na picareta e bônus
          const tierMult = PICKAXE_TIER_MULT[pk.tier] || 1.0;
          const base = 30 + Math.floor(Math.random()*41); // 30-70
          const skillB = getSkillBonus(me,'mining');
          const raw = Math.floor(base * tierMult);
          const bonus = Math.floor(raw * ((mineBonus||0) + skillB));
          const total = raw + bonus;
          me.wallet += total;
          // Quedas de materiais
          let drops = { pedra: 1 + Math.floor(Math.random()*4) };
          if (pk.tier==='ferro' || pk.tier==='diamante') {
            drops.ferro = (drops.ferro||0) + Math.floor(Math.random()*3); // 0-2
          }
          if (pk.tier==='diamante') {
            drops.ferro = (drops.ferro||0) + (1 + Math.floor(Math.random()*2)); // +1-2 adicionais
            drops.ouro = (drops.ouro||0) + Math.floor(Math.random()*2); // 0-1
            if (Math.random()<0.2) drops.diamante = (drops.diamante||0) + 1; // chance de diamante
          }
          for (const [mk,mq] of Object.entries(drops)) if (mq>0) giveMaterial(me, mk, mq);
          // Durabilidade
          const before = pk.dur; pk.dur = Math.max(0, pk.dur - 1);
          me.tools.pickaxe = { ...pk, max: pk.max ?? (pk.tier==='bronze'?20:pk.tier==='ferro'?60:pk.tier==='diamante'?150:pk.dur) };
          me.cooldowns.mine = Date.now() + 2*60*1000; // 2 min
          addSkillXP(me,'mining',1); updateChallenge(me,'mine',1,true); updatePeriodChallenge(me,'mine',1,true);
          saveEconomy(econ);
          let dropTxt = Object.entries(drops).filter(([,q])=>q>0).map(([k,q])=>`${k} x${q}`).join(', ');
          const broke = pk.dur===0 && before>0;
          return reply(`⛏️ Você minerou e ganhou ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}!\n📦 Drops: ${dropTxt||'—'}\n🛠️ Picareta: ${pk.dur}/${me.tools.pickaxe.max}${broke?' — quebrou!':''}`);
        }

        if (sub === 'trabalhar' || sub === 'work') {
          const cd = me.cooldowns?.work || 0;
          if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para trabalhar novamente.`);
          const base = 70 + Math.floor(Math.random()*111); // 70-180
          const skillB = getSkillBonus(me,'working');
          const bonus = Math.floor(base * (workBonus + skillB));
          const total = base + bonus;
          me.wallet += total;
          me.cooldowns.work = Date.now() + 7*60*1000; // 7 min
          addSkillXP(me,'working',1); updateChallenge(me,'work',1,true); updatePeriodChallenge(me,'work',1,true);
          saveEconomy(econ);
          return reply(`💼 Você trabalhou e recebeu ${fmt(total)} ${bonus>0?`(bônus ${fmt(bonus)})`:''}!`);
        }

        // ===== Mercado entre usuários =====
        if (sub === 'mercado') {
          const items = econ.market || [];
          if (items.length===0) return reply('🛒 O mercado está vazio. Use listar para anunciar algo.');
          let text = '🛒 Mercado (ofertas abertas)\n\n';
          for (const ofr of items) {
            text += `#${ofr.id} • ${ofr.type==='item'?`${ofr.key} x${ofr.qty}`:`${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)} | Vendedor: @${ofr.seller.split('@')[0]}\n`;
          }
          return reply(text, { mentions: (items.map(i=>i.seller)) });
        }
        if (sub === 'listar') {
          // listar item <key> <qtd> <preco> | listar mat <material> <qtd> <preco>
          const kind = (args[0]||'').toLowerCase();
          if (!['item','mat','material'].includes(kind)) return reply(`Use: ${prefix}listar item <key> <qtd> <preco> | ${prefix}listar mat <material> <qtd> <preco>`);
          const qty = parseInt(args[2]); const price = parseInt(args[3]);
          if (!isFinite(qty)||qty<=0||!isFinite(price)||price<=0) return reply('Quantidade e preço inválidos.');
          if (kind==='item') {
            const key = (args[1]||'').toLowerCase();
            if ((me.inventory?.[key]||0) < qty) return reply('Você não possui itens suficientes.');
            me.inventory[key] -= qty;
            const id = econ.marketCounter++;
            econ.market.push({ id, type:'item', key, qty, price, seller: sender });
            saveEconomy(econ);
            return reply(`📢 Anúncio #${id} criado: ${key} x${qty} por ${fmt(price)}.`);
          } else {
            const mat = (args[1]||'').toLowerCase();
            if ((me.materials?.[mat]||0) < qty) return reply('Você não possui materiais suficientes.');
            me.materials[mat] -= qty;
            const id = econ.marketCounter++;
            econ.market.push({ id, type:'mat', mat, qty, price, seller: sender });
            saveEconomy(econ);
            return reply(`📢 Anúncio #${id} criado: ${mat} x${qty} por ${fmt(price)}.`);
          }
        }
        if (sub === 'meusanuncios') {
          const mine = (econ.market||[]).filter(o=>o.seller===sender);
          if (mine.length===0) return reply('Você não tem anúncios.');
          let text='📋 Seus anúncios\n\n';
          for (const ofr of mine) text += `#${ofr.id} • ${ofr.type==='item'?`${ofr.key} x${ofr.qty}`:`${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)}\n`;
          return reply(text);
        }
        if (sub === 'cancelar') {
          const id = parseInt(args[0]); if (!isFinite(id)) return reply('Informe o ID do anúncio.');
          const idx = (econ.market||[]).findIndex(o=>o.id===id);
          if (idx<0) return reply('Anúncio não encontrado.');
          const ofr = econ.market[idx];
          if (ofr.seller!==sender) return reply('Apenas o vendedor pode cancelar.');
          // devolve ao vendedor
          if (ofr.type==='item') me.inventory[ofr.key] = (me.inventory[ofr.key]||0) + ofr.qty; else me.materials[ofr.mat]=(me.materials[ofr.mat]||0)+ofr.qty;
          econ.market.splice(idx,1); saveEconomy(econ);
          return reply(`❌ Anúncio #${id} cancelado e itens devolvidos.`);
        }
        if (sub === 'comprarmercado') {
          const id = parseInt(args[0]); if (!isFinite(id)) return reply('Informe o ID do anúncio.');
          const ofr = (econ.market||[]).find(o=>o.id===id);
          if (!ofr) return reply('Anúncio não encontrado.');
          if (ofr.seller===sender) return reply('Você não pode comprar seu próprio anúncio.');
          const tax = Math.floor(ofr.price * 0.05);
          if (me.wallet < ofr.price) return reply('Saldo insuficiente.');
          const seller = getEcoUser(econ, ofr.seller);
          me.wallet -= ofr.price;
          seller.wallet += (ofr.price - tax); // taxa de 5%
          if (ofr.type==='item') me.inventory[ofr.key] = (me.inventory[ofr.key]||0) + ofr.qty; else me.materials[ofr.mat]=(me.materials[ofr.mat]||0)+ofr.qty;
          econ.market = (econ.market||[]).filter(o=>o.id!==id);
          saveEconomy(econ);
          return reply(`🛒 Compra realizada! Taxa de ${fmt(tax)} aplicada. Vendedor recebeu ${fmt(ofr.price - tax)}.`);
        }

        // ===== Propriedades =====
        if (sub === 'propriedades') {
          const keys = Object.keys(econ.propertiesCatalog||{});
          let text = '🏠 Propriedades disponíveis\n\n';
          for (const k of keys) {
            const p = econ.propertiesCatalog[k];
            const upkeep = p.upkeepPerDay || 0; const incGold = p.incomeGoldPerDay||0; const incMat = p.incomeMaterialsPerDay||{};
            const mats = Object.entries(incMat).map(([mk,mq])=>`${mk} x${mq}/dia`).join(', ');
            text += `• ${k} — ${p.name} — Preço: ${fmt(p.price)} — Manutenção: ${fmt(upkeep)}/dia — Renda: ${incGold>0?`${fmt(incGold)} gold/dia`:''}${mats?`${incGold>0?' e ':''}${mats}`:''}\n`;
          }
          // minhas propriedades
          const mine = me.properties||{}; const owned = Object.keys(mine).filter(k=>mine[k]?.owned);
          if (owned.length>0){
            text += '\n📦 Suas propriedades:\n';
            for (const k of owned) {
              const o = mine[k];
              const last = o.lastCollect ? new Date(o.lastCollect).toLocaleDateString('pt-BR') : '—';
              text += `• ${econ.propertiesCatalog[k]?.name||k} — desde ${last}\n`;
            }
          }
          return reply(text);
        }
        if (sub === 'comprarpropriedade') {
          const key = (args[0]||'').toLowerCase(); if (!key) return reply(`Use: ${prefix}comprarpropriedade <tipo>`);
          const prop = (econ.propertiesCatalog||{})[key]; if (!prop) return reply('Propriedade inexistente.');
          if (me.properties?.[key]?.owned) return reply('Você já possui essa propriedade.');
          if (me.wallet < prop.price) return reply('Saldo insuficiente.');
          me.wallet -= prop.price;
          me.properties[key] = { owned: true, lastCollect: Date.now() };
          saveEconomy(econ);
          return reply(`🏠 Você comprou ${prop.name}!`);
        }
        if (sub === 'coletarpropriedades') {
          const props = me.properties || {}; const keys = Object.keys(props).filter(k=>props[k].owned);
          if (keys.length===0) return reply('Você não possui propriedades.');
          let totalGold = 0; const matsGain = {};
          for (const k of keys) {
            const meta = (econ.propertiesCatalog||{})[k]; if (!meta) continue;
            const days = Math.max(1, Math.ceil((Date.now() - (props[k].lastCollect||Date.now())) / (24*60*60*1000)));
            const upkeep = (meta.upkeepPerDay||0) * days; if (me.wallet < upkeep) return reply(`Saldo insuficiente para pagar manutenção de ${meta.name} (${fmt(upkeep)}).`);
            me.wallet -= upkeep;
            if (meta.incomeGoldPerDay) totalGold += meta.incomeGoldPerDay * days;
            if (meta.incomeMaterialsPerDay){
              for (const [mk,mq] of Object.entries(meta.incomeMaterialsPerDay)) matsGain[mk]=(matsGain[mk]||0)+(mq*days);
            }
            props[k].lastCollect = Date.now();
          }
          me.wallet += totalGold;
          for (const [mk,mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
          saveEconomy(econ);
          let msg = `🏡 Coleta concluída! +${fmt(totalGold)} gold`;
          if (Object.keys(matsGain).length>0) msg += ` | Materiais: `+Object.entries(matsGain).map(([k,q])=>`${k} x${q}`).join(', ');
          return reply(msg);
        }

        // ===== Habilidades & Desafios Periódicos (visualização) =====
        if (sub === 'habilidades') {
          ensureUserSkills(me);
          let text = '📚 Habilidades\n\n';
          for (const s of SKILL_LIST){
            const sk = me.skills[s];
            text += `• ${s}: Nível ${sk.level} (${sk.xp}/${skillXpForNext(sk.level)})\n`;
          }
          return reply(text);
        }
        if (sub === 'desafiosemanal' || sub === 'desafiomensal') {
          ensureUserPeriodChallenges(me);
          const show = sub==='desafiosemanal' ? me.weeklyChallenge : me.monthlyChallenge;
          const labels = { mine:'Minerações', work:'Trabalhos', fish:'Pescarias', explore:'Explorações', hunt:'Caçadas', crimeSuccess:'Crimes OK' };
          let text = `🏅 Desafio ${sub==='desafiosemanal'?'Semanal':'Mensal'}\n\n`;
          for (const t of (show.tasks||[])) text += `• ${labels[t.type]||t.type}: ${t.progress||0}/${t.target}\n`;
          text += `\nPrêmio: ${fmt(show.reward)} ${show.claimed?'(coletado)':''}`;
          if (isPeriodCompleted(show) && !show.claimed) text += `\nUse: ${prefix}${sub} coletar`;
          if ((args[0]||'').toLowerCase()==='coletar'){
            if (show.claimed) return reply('Você já coletou este prêmio.');
            if (!isPeriodCompleted(show)) return reply('Complete todas as tarefas para coletar.');
            me.wallet += show.reward; show.claimed = true; saveEconomy(econ);
            return reply(`🎉 Você coletou ${fmt(show.reward)} do ${sub==='desafiosemanal'?'desafio semanal':'desafio mensal'}!`);
          }
          return reply(text);
        }
/*
        if (sub === 'assaltar' || sub === 'roubar') {
          if (!mentioned) return reply('Marque alguém para assaltar.');
          if (mentioned === sender) return reply('Você não pode assaltar a si mesmo.');
          const cd = me.cooldowns?.rob || 0;
          if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para tentar novamente.`);
          const target = getEcoUser(econ, mentioned);
          const chance = Math.random();
          const maxSteal = Math.min(target.wallet, 300);
          if (maxSteal <= 0) {
            me.cooldowns.rob = Date.now() + 10*60*1000; // 10 min
            saveEconomy(econ);
            return reply('A vítima está sem dinheiro na carteira. Roubo falhou.');
          }
          if (chance < 0.5) {
            const amt = 50 + Math.floor(Math.random() * Math.max(1, maxSteal-49));
            target.wallet -= amt; me.wallet += amt;
            me.cooldowns.rob = Date.now() + 10*60*1000;
            saveEconomy(econ);
            return reply(`🦹 Sucesso! Você roubou ${fmt(amt)} de @${getUserName(mentioned)}.`, { mentions:[mentioned] });
          } else {
            const multa = 80 + Math.floor(Math.random()*121); // 80-200
            const pay = Math.min(me.wallet, multa);
            me.wallet -= pay; target.wallet += pay;
            me.cooldowns.rob = Date.now() + 10*60*1000;
            saveEconomy(econ);
            return reply(`🚨 Você foi pego! Pagou ${fmt(pay)} de multa para @${getUserName(mentioned)}.`, { mentions:[mentioned] });
          }
        }*/

        if (sub === 'assaltar' || sub === 'roubar') {
          if (!mentioned) return reply('Marque alguém para assaltar.');
          if (mentioned === sender) return reply('Você não pode assaltar a si mesmo.');
          
          // REINTRODUÇÃO DO COOLDOWN DE 1 MINUTO
          const cd = me.cooldowns?.rob || 0;
          if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para tentar novamente.`);
          
          const target = getEcoUser(econ, mentioned);
          const chance = Math.random();
          const maxSteal = Math.min(target.wallet, 300);
          
          // Constante para o cooldown de 1 minuto (1 * 60 * 1000 milissegundos)
          const COOLDOWN_MS = 1 * 60 * 1000; 

          if (maxSteal <= 0) {
            // Aplica cooldown de 1 minuto
            me.cooldowns.rob = Date.now() + COOLDOWN_MS; 
            saveEconomy(econ);
            return reply('A vítima está sem dinheiro na carteira. Roubo falhou.');
          }

          // 50% de chance de sucesso
          if (chance < 0.5) { 
            // Valor roubado = 50% do máximo possível (GARANTIDO)
            const amt = Math.floor(maxSteal * 0.5); 
            
            if (amt <= 0) {
              // Aplica cooldown de 1 minuto
              me.cooldowns.rob = Date.now() + COOLDOWN_MS; 
              saveEconomy(econ);
              return reply('A vítima tem muito pouco na carteira. O roubo falhou.');
            }

            target.wallet -= amt; me.wallet += amt;
            // Aplica cooldown de 1 minuto
            me.cooldowns.rob = Date.now() + COOLDOWN_MS; 
            saveEconomy(econ);
            return reply(`🦹 Sucesso! Você roubou ${fmt(amt)} de @${getUserName(mentioned)}.`, { mentions:[mentioned] });
          } else {
            // Chance de ser pego/multa padrão
            const multa = 80 + Math.floor(Math.random()*121); 
            const pay = Math.min(me.wallet, multa);
            me.wallet -= pay; target.wallet += pay;
            // Aplica cooldown de 1 minuto
            me.cooldowns.rob = Date.now() + COOLDOWN_MS; 
            saveEconomy(econ);
            return reply(`🚨 Você foi pego! Pagou ${fmt(pay)} de multa para @${getUserName(mentioned)}.`, { mentions:[mentioned] });
          }
        }

        if (sub === 'diario' || sub === 'daily') {
          const cd = me.cooldowns?.daily || 0;
          if (Date.now() < cd) return reply(`⏳ Você já coletou hoje. Volte em ${timeLeft(cd)}.`);
          const reward = 500;
          me.wallet += reward; me.cooldowns.daily = Date.now() + 24*60*60*1000;
          saveEconomy(econ);
          return reply(`🎁 Recompensa diária coletada: ${fmt(reward)}!`);
        }

        if (sub === 'topgold') {
          const arr = Object.entries(econ.users).map(([id,u])=>[id,(u.wallet||0)+(u.bank||0)]).sort((a,b)=>b[1]-a[1]).slice(0,10);
          if (arr.length===0) return reply('Sem dados suficientes para ranking.');
          let text = '🏆 Ranking de Riqueza\n\n';
          const mentions = [];
          arr.forEach(([id,total],i)=>{ text += `${i+1}. @${id.split('@')[0]} — ${fmt(total)}\n`; mentions.push(id); });
          return reply(text, { mentions });
        }

        return reply('Comando de economia inválido. Use '+prefix+'menugold para ver os comandos.');
      }

      case 'speedup':
      case 'boyvoice':
      case 'vozmenino':
      case 'womenvoice':
      case 'vozmulher':
      case 'manvoice':
      case 'vozhomem':
      case 'childvoice':
      case 'vozcrianca':
      case 'vozeco':
      case 'eco':
      case 'slowvoice':
      case 'vozlenta':
      case 'audiolento':
      case 'fastvoice':
      case 'vozrapida':
      case 'audiorapido':
      case 'cavevoice':
      case 'vozcaverna':
      case 'bass':
      case 'bass2':
      case 'bass3':
      case 'volumeboost':
      case 'aumentarvolume':
      case 'reverb':
      case 'drive':
      case 'equalizer':
      case 'equalizar':
      case 'reverse':
      case 'audioreverso':
      case 'pitch':
      case 'flanger':
      case 'grave':
      case 'vozgrave':
      case 'chorus':
      case 'phaser':
      case 'tremolo':
      case 'vibrato':
      case 'lowpass':
        try {
          if (isMedia && !info.message.imageMessage && !info.message.videoMessage || isQuotedAudio) {
            const audioEffects = {
              speedup: 'atempo=1.06,asetrate=44100*1.25',
              boyvoice: 'atempo=1.06,asetrate=44100*1.25',
              vozmenino: 'atempo=1.06,asetrate=44100*1.25',
              womenvoice: 'asetrate=44100*1.25,atempo=0.8',
              vozmulher: 'asetrate=44100*1.25,atempo=0.8',
              manvoice: 'asetrate=44100*0.8,atempo=1.2',
              vozhomem: 'asetrate=44100*0.8,atempo=1.2',
              childvoice: 'asetrate=44100*1.4,atempo=0.9',
              vozcrianca: 'asetrate=44100*1.4,atempo=0.9',
              vozeco: 'aecho=0.8:0.88:60:0.4',
              eco: 'aecho=0.8:0.88:60:0.4',
              slowvoice: 'atempo=0.6',
              vozlenta: 'atempo=0.6',
              audiolento: 'atempo=0.6',
              fastvoice: 'atempo=1.5',
              vozrapida: 'atempo=1.5',
              audiorapido: 'atempo=1.5',
              cavevoice: 'aecho=0.6:0.3:1000:0.5',
              vozcaverna: 'aecho=0.6:0.3:1000:0.5',
              bass: 'bass=g=5',
              bass2: 'bass=g=10',
              bass3: 'bass=g=15',
              volumeboost: 'volume=1.5',
              aumentarvolume: 'volume=1.5',
              reverb: 'aecho=0.8:0.88:60:0.4',
              drive: 'afftdn=nf=-25',
              equalizer: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4',
              equalizar: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4',
              reverse: 'areverse',
              audioreverso: 'areverse',
              pitch: 'asetrate=44100*0.8',
              flanger: 'flanger',
              grave: 'atempo=0.9,asetrate=44100',
              vozgrave: 'atempo=0.9,asetrate=44100',
              chorus: 'chorus=0.7:0.9:55:0.4:0.25:2',
              phaser: 'aphaser=type=t:decay=0.4',
              tremolo: 'tremolo=f=6:d=0.8',
              vibrato: 'vibrato=f=6',
              lowpass: 'lowpass=f=500'
            };
            const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
            await reply('🎵 Processando áudio... Por favor, aguarde alguns segundos.');
            const rane = __dirname + `/../database/tmp/${Math.random()}.mp3`;
            const buffimg = await getFileBuffer(muk, 'audio');
            fs.writeFileSync(rane, buffimg);
            const gem = rane;
            const ran = __dirname + `/../database/tmp/${Math.random()}.mp3`;
            const effect = audioEffects[command];
            exec(`ffmpeg -i ${gem} -filter:a "${effect}" ${ran}`, async (err, stderr, stdout) => {
              await fs.unlinkSync(gem);
              if (err) {
                console.error(`FFMPEG Error (Audio Effect ${command}):`, err);
                return reply(`❌ Erro ao aplicar o efeito *${command}* no áudio. Verifique se o arquivo está válido e tente novamente.`);
              }
              const hah = fs.readFileSync(ran);
              await bender.sendMessage(from, {
                audio: hah,
                mimetype: 'audio/mpeg'
              }, {
                quoted: info
              });
              await fs.unlinkSync(ran);
            });
          } else {
            reply("� Para aplicar este efeito de áudio, responda a uma mensagem que contenha um áudio.");
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'videorapido':
      case 'fastvid':
      case 'videoslow':
      case 'slowvid':
      case 'reversevid':
      case 'videolento':
      case 'videoreverso':
      case 'videoloop':
      case 'videomudo':
      case 'videobw':
      case 'pretoebranco':
      case 'tomp3':
      case 'sepia':
      case 'espelhar':
      case 'rotacionar':
      case 'mirror':
      case 'rotate':
        try {
          if (isMedia && info.message.videoMessage || isQuotedVideo) {
            const encmedia = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : info.message.videoMessage;
            await reply('🎬 Processando vídeo... Por favor, aguarde alguns segundos.');
            const videoEffects = {
              videorapido: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]',
              fastvid: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]',
              videoslow: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]',
              videolento: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]',
              videoreverso: 'reverse,areverse',
              reversevid: 'reverse,areverse',
              videoloop: 'loop=2',
              videomudo: 'an',
              videobw: 'hue=s=0',
              pretoebranco: 'hue=s=0',
              tomp3: 'q:a=0 -map a',
              sepia: 'colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131',
              mirror: 'hflip',
              espelhar: 'hflip',
              rotacionar: 'rotate=90*PI/180',
              rotate: 'rotate=90*PI/180'
            };
            const rane = __dirname + `/../database/tmp/${Math.random()}.mp4`;
            const buffimg = await getFileBuffer(encmedia, 'video');
            fs.writeFileSync(rane, buffimg);
            const media = rane;
            const outputExt = command === 'tomp3' ? '.mp3' : '.mp4';
            const ran = __dirname + `/../database/tmp/${Math.random()}${outputExt}`;
            let ffmpegCmd;
            if (command === 'tomp3') {
              
              ffmpegCmd = `ffmpeg -i ${media} -q:a 0 -map a ${ran}`;
            } else if (command === 'videoloop') {
              
              ffmpegCmd = `ffmpeg -stream_loop 2 -i ${media} -c copy ${ran}`;
            } else if (command === 'videomudo') {
              
              ffmpegCmd = `ffmpeg -i ${media} -an ${ran}`;
            } else {
              const effect = videoEffects[command];
              if (['sepia', 'espelhar', 'rotacionar', 'zoom', 'glitch', 'videobw', 'pretoebranco'].includes(command)) {
                
                ffmpegCmd = `ffmpeg -i ${media} -vf "${effect}" ${ran}`;
              } else {
                
                ffmpegCmd = `ffmpeg -i ${media} -filter_complex "${effect}" -map "[v]" -map "[a]" ${ran}`;
              }
            }
            exec(ffmpegCmd, async err => {
              await fs.unlinkSync(media);
              if (err) {
                console.error(`FFMPEG Error (Video Effect ${command}):`, err);
                return reply(`❌ Erro ao aplicar o efeito *${command}* no vídeo. Verifique se o arquivo está válido e tente novamente.`);
              }
              const buffer453 = fs.readFileSync(ran);
              const messageType = command === 'tomp3' ? {
                audio: buffer453,
                mimetype: 'audio/mpeg'
              } : {
                video: buffer453,
                mimetype: 'video/mp4'
              };
              await bender.sendMessage(from, messageType, {
                quoted: info
              });
              await fs.unlinkSync(ran);
            });
          } else {
            reply(command === 'tomp3' ? "🎬 Para converter vídeo para áudio, responda a uma mensagem que contenha um vídeo." : "🎬 Para aplicar este efeito de vídeo, responda a uma mensagem que contenha um vídeo.");
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      //INTELIGENCIA ARTIFICIAL
      case 'genrealism':
      case 'genghibli':
      case 'gencyberpunk':
      case 'genanime':
      case 'genportrait':
      case 'genchibi':
      case 'genpixelart':
      case 'genoilpainting':
      case 'gen3d':
        try {
          let styleKey = command === 'genrealism' ? 'default' : command.slice(3);
          if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
              text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
            });
            return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
          }
          if (!q) return reply(`🎨 *Gerador de Imagens AI*\n\n💡 *Como usar:*\n• Forneça uma descrição detalhada do que deseja\n• Ex: ${prefix}${command} Black Cat\n• Ex: ${prefix}${command} paisagem montanha pôr do sol realista`);
          await reply('⏳ Só um segundinho, estou gerando a imagem... ✨');
          var ImageS;
          ImageS = await ia.makeCognimaImageRequest({
            model: "deepimg",
            prompt: q,
            size: "3:2",
            style: styleKey,
            n: 1
          }, KeyCog);
          if (!ImageS || !ImageS[0]) return reply('😓 Poxa, algo deu errado aqui');
          await bender.sendMessage(from, {
            image: {
              url: ImageS[0].url
            }
          }, {
            quoted: info
          });
        } catch (e) {
          console.error("Erro no DeepIMG", e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply('😓 Poxa, algo deu errado aqui');
          }
        }
        break;
      case 'gemma':
        if (!q) return reply(`🤔 Qual sua dúvida para o Gemma? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Gemma... ✨`);
          const response = await ia.makeCognimaRequest('google/gemma-7b', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Gemma:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Gemma! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'phi':
      case 'phi3':
        if (!q) return reply(`🤔 Qual sua dúvida para o Phi? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Phi... ✨`);
          const response = await ia.makeCognimaRequest('microsoft/phi-3-medium-4k-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Phi:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Phi! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'qwen2':
        if (!q) return reply(`🤔 Qual sua dúvida para o Qwen2? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Qwen2... ✨`);
          const response = await ia.makeCognimaRequest('qwen/qwen2-7b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Qwen2:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Qwen2! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'qwen':
      case 'qwen3':
        if (!q) return reply(`🤔 Qual sua dúvida para o Qwen? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Qwen... ✨`);
          const response = await ia.makeCognimaRequest('qwen/qwen3-235b-a22b', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Qwen:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Qwen! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'llama':
      case 'llama3':
        if (!q) return reply(`🤔 Qual sua dúvida para o Llama? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Llama... ✨`);
          const response = await ia.makeCognimaRequest('abacusai/dracarys-llama-3.1-70b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Llama:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Llama! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'baichuan':
      case 'baichuan2':
        if (!q) return reply(`🤔 Qual sua dúvida para o Baichuan? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Baichuan... ✨`);
          const response = await ia.makeCognimaRequest('baichuan-inc/baichuan2-13b-chat', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Baichuan:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Baichuan! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'marin':
        if (!q) return reply(`🤔 Qual sua dúvida para o Marin? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Marin... ✨`);
          const response = await ia.makeCognimaRequest('marin/marin-8b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Marin:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Marin! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'kimi':
      case 'kimik2':
        if (!q) return reply(`🤔 Qual sua dúvida para o Kimi? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Kimi... ✨`);
          const response = await ia.makeCognimaRequest('moonshotai/kimi-k2-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Kimi:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Kimi! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'mistral':
        if (!q) return reply(`🤔 Qual sua dúvida para o Mistral? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Mistral... ✨`);
          const response = await ia.makeCognimaRequest('mistralai/mistral-small-24b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Mistral:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Mistral! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'magistral':
        if (!q) return reply(`🤔 Qual sua dúvida para o Magistral? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Magistral... ✨`);
          const response = await ia.makeCognimaRequest('mistralai/magistral-small-2506', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Magistral:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Magistral! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'rakutenai':
      case 'rocket':
        if (!q) return reply(`🤔 Qual sua dúvida para o RakutenAI? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o RakutenAI... ✨`);
          const response = await ia.makeCognimaRequest('rakuten/rakutenai-7b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API RakutenAI:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o RakutenAI! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'yi':
        if (!q) return reply(`🤔 Qual sua dúvida para o Yi? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Yi... ✨`);
          const response = await ia.makeCognimaRequest('01-ai/yi-large', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Yi:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Yi! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'gemma2':
        if (!q) return reply(`🤔 Qual sua dúvida para o Gemma2? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Gemma2... ✨`);
          const response = await ia.makeCognimaRequest('google/gemma-2-27b-it', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Gemma2:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Gemma2! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'swallow':
        if (!q) return reply(`🤔 Qual sua dúvida para o Swallow? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Swallow... ✨`);
          const response = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Swallow:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Swallow! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'falcon':
        if (!q) return reply(`🤔 Qual sua dúvida para o Falcon? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Falcon... ✨`);
          const response = await ia.makeCognimaRequest('tiiuae/falcon3-7b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Falcon:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Falcon! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'qwencoder':
        if (!q) return reply(`🤔 Qual sua dúvida para o Qwencoder? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o Qwencoder... ✨`);
          const response = await ia.makeCognimaRequest('qwen/qwen2.5-coder-32b-instruct', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API Qwencoder:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o Qwencoder! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'codegemma':
        if (!q) return reply(`🤔 Qual sua dúvida para o CodeGemma? Informe a pergunta após o comando! Exemplo: ${prefix}${command} quem descobriu o Brasil? 🌍`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply(`⏳ Só um segundinho, estou consultando o CodeGemma... ✨`);
          const response = await ia.makeCognimaRequest('google/codegemma-7b', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API CodeGemma:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply(`😓 Poxa, algo deu errado com o CodeGemma! Tente novamente em alguns instantes, tá? 🌈`);
          }
        }
        break;
      case 'resumir':
        if (!q) return reply(`📝 *Resumidor de Texto*\n\n💡 *Como usar:*\n• Envie o texto que deseja resumir após o comando\n• Ex: ${prefix}resumir [seu texto aqui]\n\n✨ O texto será resumido de forma clara e objetiva!`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('⏳ Aguarde enquanto preparo um resumo bem caprichado... ✨');
          const prompt = `Resuma o seguinte texto em poucos parágrafos, de forma clara e objetiva, destacando as informações mais importantes:\n\n${q}`;
          const response = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro ao resumir texto:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply('😓 Ops, não consegui resumir agora! Que tal tentar de novo? 🌟');
          }
        }
        break;
      case 'resumirurl':
        if (!q) return reply(`🌐 Quer resumir uma página? Envie a URL após o comando ${prefix}resumirurl! Exemplo: ${prefix}resumirurl https://exemplo.com/artigo 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          if (!q.startsWith('http://') && !q.startsWith('https://')) {
            return reply(`🚫 Ops, parece que a URL é inválida! Certifique-se de incluir http:// ou https://. Exemplo: ${prefix}resumirurl https://exemplo.com/artigo 😊`);
          }
          await reply('⏳ Aguarde enquanto busco e resumo a página para você... ✨');
          const response = await axios.get(q, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)'
            }
          });
          const {
            document
          } = parseHTML(response.data);
          document.querySelectorAll('script, style, noscript, iframe').forEach(el => el.remove());
          const cleanText = document.body.textContent.replace(/\s+/g, ' ').trim();
          if (!cleanText || cleanText.length < 50) {
            return reply(`😓 Ops, não encontrei conteúdo suficiente para resumir nessa página! Tente outra URL, tá? 🌐`);
          }
          const prompt = `Resuma o seguinte conteúdo extraído de uma página web em poucos parágrafos, de forma clara e objetiva, destacando os pontos principais:\n\n${cleanText.substring(0, 5000)}`;
          const iaResponse = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(iaResponse.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro ao resumir URL:', e.message);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else if (e.code === 'ECONNABORTED') {
            await reply('😓 Ops, a página demorou muito para responder! Tente outra URL. 🌐');
          } else if (e.response) {
            await reply(`😓 Não consegui acessar a página (código ${e.response.status}). Verifique a URL e tente novamente, tá? 🌟`);
          } else {
            await reply('😓 Vixe, algo deu errado ao resumir a página! Tente novamente em breve, combinado? 🌈');
          }
        }
        break;
      case 'ideias':
      case 'ideia':
        if (!q) return reply(`💡 Quer ideias criativas? Diga o tema após o comando ${prefix}ideias! Exemplo: ${prefix}ideias nomes para um aplicativo de receitas 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('⏳ Um segundinho, estou pensando em ideias incríveis... ✨');
          const prompt = `Gere 15 ideias criativas e detalhadas para o seguinte tema: ${q}`;
          const response = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro ao gerar ideias:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply('😓 Poxa, não consegui gerar ideias agora! Tente de novo em breve, tá? 🌈');
          }
        }
        break;
      case 'explicar':
      case 'explique':
        if (!q) return reply(`🤓 Quer entender algo? Diga o que deseja explicar após o comando ${prefix}explicar! Exemplo: ${prefix}explicar o que é inteligência artificial 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('⏳ Um momentinho, estou preparando uma explicação bem clara... ✨');
          const prompt = `Explique o seguinte conceito de forma simples e clara, como se fosse para alguém sem conhecimento prévio: ${q}`;
          const response = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro ao explicar conceito:', e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply('😓 Vixe, não consegui explicar agora! Tente de novo em alguns instantes, tá? 🌈');
          }
        }
        break;
      case 'corrigir':
      case 'correcao':
        if (!q) return reply(`✍️ Quer corrigir um texto? Envie o texto após o comando ${prefix}corrigir! Exemplo: ${prefix}corrigir Eu foi no mercado e comprei frutas. 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('⏳ Aguarde enquanto dou um polimento no seu texto... ✨');
          const prompt = `Corrija os erros gramaticais, ortográficos e de estilo no seguinte texto, mantendo o significado original: ${q}`;
          const response = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro ao corrigir texto:', e);
          await reply('😓 Ops, não consegui corrigir o texto agora! Tente novamente, tá? 🌟');
        }
        break;
      case 'cog':
        if (!q) return reply(`📢 Ei, falta a pergunta! Me diga o que quer saber após o comando ${prefix}cog! 😴`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('⏳ Um momentinho, estou pensando na melhor resposta... 🌟');
          const response = await ia.makeCognimaRequest('cognima/CognimAI', q, null, KeyCog || null);
          await reply(response.data.choices[0].message.content);
        } catch (e) {
          console.error('Erro na API CognimAI:', e);
          await reply('😓 Vixe, algo deu errado por aqui! Tente novamente em breve, combinado? 🌈');
        }
        break;
      case 'tradutor':
      case 'translator':
        if (!q) return reply(`🌍 Quer traduzir algo? Me diga o idioma e o texto assim: ${prefix}${command} idioma | texto
Exemplo: ${prefix}tradutor inglês | Bom dia! 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          await reply('Aguarde um momentinho... ☀️');
          const partes = q.split('|');
          if (partes.length < 2) {
            return reply(`Formato incorreto! 😅 Use: ${prefix}tradutor idioma | texto
Exemplo: ${prefix}tradutor espanhol | Olá mundo! ✨`);
          }
          const idioma = partes[0].trim();
          const texto = partes.slice(1).join('|').trim();
          const prompt = `Traduza o seguinte texto para ${idioma}:\n\n${texto}\n\nForneça apenas a tradução, sem explicações adicionais.`;
          const bahz = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
          await reply(`🌐✨ *Prontinho! Sua tradução para ${idioma.toUpperCase()} está aqui:*\n\n${bahz.data.choices[0].message.content}`);
        } catch (e) {
          console.error("Erro ao traduzir texto:", e);
          await reply("❌ Não foi possível realizar a tradução no momento. Tente novamente mais tarde.");
        }
        break;
      case 'qrcode':
        if (!q) return reply(`📲 *Gerador de QR Code*\n\n💡 *Como usar:*\n• Envie o texto ou link após o comando\n• Ex: ${prefix}qrcode https://exemplo.com\n• Ex: ${prefix}qrcode Seu texto aqui\n\n✨ O QR Code será gerado instantaneamente!`);
        try {
          await reply('Aguarde um momentinho... ☀️');
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;
          await bender.sendMessage(from, {
            image: {
              url: qrUrl
            },
            caption: `📱✨ *Seu QR Code super fofo está pronto!*\n\nConteúdo: ${q.substring(0, 100)}${q.length > 100 ? '...' : ''}`
          }, {
            quoted: info
          });
        } catch (e) {
          console.error("Erro ao gerar QR Code:", e);
          await reply("❌ Erro ao gerar QR Code. Tente novamente mais tarde.");
        }
        break;
      case 'wikipedia':
        if (!q) return reply(`📚 O que você quer pesquisar na Wikipédia? Me diga o termo após o comando ${prefix}wikipedia! 😊`);
        reply("📚 Consultando a Wikipédia... Só um instante! ⏳");
        try {
          let found = false;
          try {
            const respPT = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
            if (respPT.data && respPT.data.extract) {
              const {
                title,
                extract,
                content_urls,
                thumbnail
              } = respPT.data;
              const link = content_urls?.desktop?.page || '';
              const thumbUrl = thumbnail?.source || '';
              let mensagem = `📖✨ *Encontrei isso na Wikipédia (PT):*\n\n*${title || q}*\n\n${extract}\n\n`;
              if (link) {
                
                mensagem += `🔗 *Saiba mais:* ${link}\n`;
              }
              if (thumbUrl) {
                await bender.sendMessage(from, {
                  image: {
                    url: thumbUrl
                  },
                  caption: mensagem
                }, {
                  quoted: info
                });
              } else {
                await reply(mensagem);
              }
              
              found = true;
            }
          } catch (err) {
            console.log("Busca PT falhou, tentando EN...");
          }
          if (!found) {
            try {
              const respEN = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
              if (respEN.data && respEN.data.extract) {
                const {
                  title,
                  extract,
                  content_urls,
                  thumbnail
                } = respEN.data;
                const link = content_urls?.desktop?.page || '';
                const thumbUrl = thumbnail?.source || '';
                let mensagem = `📖✨ *Encontrei isso na Wikipédia (EN):*\n\n*${title || q}*\n\n${extract}\n\n`;
                if (link) {
                  
                  mensagem += `🔗 *Saiba mais:* ${link}\n`;
                }
                if (thumbUrl) {
                  await bender.sendMessage(from, {
                    image: {
                      url: thumbUrl
                    },
                    caption: mensagem
                  }, {
                    quoted: info
                  });
                } else {
                  await reply(mensagem);
                }
                
                found = true;
              }
            } catch (err) {
              console.log("Busca EN também falhou.");
            }
          }
          if (!found) {
            await reply("Awnn... 🥺 Não consegui encontrar nada sobre isso na Wikipédia... Tente uma palavra diferente, talvez? 💔");
          }
        } catch (e) {
          console.error("Erro ao buscar na Wikipédia:", e);
          await reply("📚 Erro ao acessar a Wikipédia no momento. Tente novamente mais tarde.");
        }
        break;
      case 'dicionario':
      case 'dictionary':
        if (!q) return reply(`📔 Qual palavra você quer procurar no dicionário? Me diga após o comando ${prefix}${command}! 😊`);
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        reply("📔 Procurando no dicionário... Aguarde um pouquinho! ⏳");
        try {
          const palavra = q.trim().toLowerCase();
          let definicaoEncontrada = false;
          try {
            const resp = await axios.get(`https://significado.herokuapp.com/${encodeURIComponent(palavra)}`);
            if (resp.data && resp.data.length > 0 && resp.data[0].meanings) {
              const significados = resp.data[0];
              let mensagem = `📘✨ *Significado de "${palavra.toUpperCase()}":*\n\n`;
              if (significados.class) {
                
                mensagem += `*Classe:* ${significados.class}\n\n`;
              }
              if (significados.meanings && significados.meanings.length > 0) {
                
                mensagem += `*Significados:*\n`;
                significados.meanings.forEach((significado, index) => {
                  
                  mensagem += `${index + 1}. ${significado}\n`;
                });
                
                mensagem += '\n';
              }
              if (significados.etymology) {
                
                mensagem += `*Etimologia:* ${significados.etymology}\n\n`;
              }
              await reply(mensagem);
              definicaoEncontrada = true;
            }
          } catch (apiError) {
            console.log("API primária do dicionário falhou, tentando IA...");
          }
          if (!definicaoEncontrada) {
            const prompt = `Defina a palavra "${palavra}" em português de forma completa e fofa. Inclua a classe gramatical, os principais significados e um exemplo de uso em uma frase curta e bonitinha.`;
            const bahz = await ia.makeCognimaRequest('institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1', prompt, null, KeyCog || null);
            await reply(`${bahz.data.choices[0].message.content}`);
            definicaoEncontrada = true;
          }
        } catch (e) {
          console.error("Erro geral ao buscar no dicionário:", e);
          await reply("❌ Palavra não encontrada. Verifique a ortografia e tente novamente.");
        }
        break;
      case 'updates':
        try {
          if (!isOwner || isOwner && isSubOwner) return reply("🚫 Apenas o Dono principal pode utilizar esse comando!");
          if (!fs.existsSync(pathz.join(__dirname, '..', 'database', 'updateSave.json'))) return reply('❌ Sua versão não tem suporte a esse sistema ainda.');
          const AtualCom = await axios.get('https://api.github.com/repos/hiudyy/nazuna/commits?per_page=1', {
            headers: {
              Accept: 'application/vnd.github+json'
            }
          }).then(r => r.headers.link?.match(/page=(\d+)>;\s*rel="last"/)?.[1]);
          const {
            total
          } = JSON.parse(fs.readFileSync(pathz.join(__dirname, '..', 'database', 'updateSave.json'), 'utf-8'));
          if (AtualCom > total) {
            const TextZin = await VerifyUpdate('hiudyy/nazuna', AtualCom - total);
            await reply(TextZin);
          } else {
            await reply('Você ja esta utilizando a versão mais recente da bot.');
          }
          ;
        } catch (e) {
          console.error(e);
        }
        ;
        break;
      case 'addsubdono':
        if (!isOwner || isSubOwner) return reply("🚫 Apenas o Dono principal pode adicionar subdonos!");
        try {
          let targetUserId;
          
          if (menc_jid2 && menc_jid2.length > 0) {
            targetUserId = menc_jid2[0];
          } else if (q && q.trim()) {
            const cleanNumber = q.replace(/\D/g, '');
            if (cleanNumber.length >= 10) {
              targetUserId = `${cleanNumber}@s.whatsapp.net`;
            } else {
              return reply("❌ Número inválido! Use um número completo (ex: 5511999998888)");
            }
          } else {
            return reply(`📝 *Como usar:*\n\n1️⃣ Marque o usuário: ${prefix}addsubdono @usuario\n2️⃣ Ou digite o número: ${prefix}addsubdono 5511999998888`);
          }
          
          const result = addSubdono(targetUserId, numerodono);
          await reply(result.message);
        } catch (e) {
          console.error("Erro ao adicionar subdono:", e);
          await reply("❌ Ocorreu um erro inesperado ao tentar adicionar o subdono.");
        }
        break;
      case 'remsubdono':
      case 'rmsubdono':
        if (!isOwner || isSubOwner) return reply("🚫 Apenas o Dono principal pode remover subdonos!");
        try {
          let targetUserId;
          
          if (menc_jid2 && menc_jid2.length > 0) {
            targetUserId = menc_jid2[0];
          } else if (q && q.trim()) {
            const cleanNumber = q.replace(/\D/g, '');
            if (cleanNumber.length >= 10) {
              targetUserId = `${cleanNumber}@s.whatsapp.net`;
            } else {
              const subdonos = getSubdonos();
              const index = parseInt(q) - 1;
              if (index >= 0 && index < subdonos.length) {
                targetUserId = subdonos[index];
              } else {
                return reply("❌ Número/índice inválido! Use um número completo ou o índice da lista de subdonos.");
              }
            }
          } else {
            return reply(`📝 *Como usar:*\n\n1️⃣ Marque o usuário: ${prefix}remsubdono @usuario\n2️⃣ Digite o número: ${prefix}remsubdono 5511999998888\n3️⃣ Use o índice da lista: ${prefix}remsubdono 1`);
          }
          
          const result = removeSubdono(targetUserId);
          await reply(result.message);
        } catch (e) {
          console.error("Erro ao remover subdono:", e);
          await reply("❌ Ocorreu um erro inesperado ao tentar remover o subdono.");
        }
        break;
      case 'listasubdonos':
      case 'listsubdonos':
        if (!isOwnerOrSub) return reply("🚫 Apenas o Dono e Subdonos podem ver a lista!");
        try {
          const subdonos = getSubdonos();
          if (subdonos.length === 0) {
            return reply("✨ Nenhum subdono cadastrado no momento.");
          }
          let listaMsg = "👑 *Lista de Subdonos Atuais:*\n\n";
          const mentions = [];
          let participantsInfo = {};
          if (isGroup && groupMetadata.participants) {
            groupMetadata.participants.forEach(p => {
              participantsInfo[p.lid || p.id] = p.pushname || getUserName(p.lid || p.id);
            });
          }
          subdonos.forEach((jid, index) => {
            const nameOrNumber = participantsInfo[jid] || getUserName(jid);
            listaMsg += `${index + 1}. @${getUserName(jid)} (${nameOrNumber})\n`;
            mentions.push(jid);
          });
          await reply(listaMsg.trim(), {
            mentions
          });
        } catch (e) {
          console.error("Erro ao listar subdonos:", e);
          await reply("❌ Ocorreu um erro inesperado ao tentar listar os subdonos.");
        }
        break;
      case 'viewmsg':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q) return reply(`Use: ${prefix}viewmsg [on/off]`);
          const botStateFile = DATABASE_DIR + '/botState.json';
          let botState = loadJsonFile(botStateFile, {
            status: 'on',
            viewMessages: true
          });
          if (q.toLowerCase() === 'on') {
            botState.viewMessages = true;
            fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));
            await reply('✅ Visualização de mensagens ativada!');
          } else if (q.toLowerCase() === 'off') {
            botState.viewMessages = false;
            fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));
            await reply('✅ Visualização de mensagens desativada!');
          } else {
            return reply('🤔 Use "on" para ativar ou "off" para desativar.');
          }
        } catch (e) {
          console.error('Erro no comando viewmsg:', e);
          await reply('😥 Ocorreu um erro ao alterar a visualização de mensagens.');
        }
        break;
      case 'modoaluguel':
        if (!isOwner || isOwner && isSubOwner) return reply("🚫 Apenas o Dono principal pode gerenciar o modo de aluguel!");
        try {
          const action = q.toLowerCase().trim();
          if (action === 'on' || action === 'ativar') {
            if (setRentalMode(true)) {
              await reply("✅ Modo de aluguel global ATIVADO! O bot agora só responderá em grupos com aluguel ativo.");
            } else {
              await reply("❌ Erro ao ativar o modo de aluguel global.");
            }
          } else if (action === 'off' || action === 'desativar') {
            if (setRentalMode(false)) {
              await reply("✅ Modo de aluguel global DESATIVADO! O bot responderá em todos os grupos permitidos.");
            } else {
              await reply("❌ Erro ao desativar o modo de aluguel global.");
            }
          } else {
            const currentStatus = isRentalModeActive() ? 'ATIVADO' : 'DESATIVADO';
            await reply(`🤔 Uso: ${prefix}modoaluguel on|off\nStatus atual: ${currentStatus}`);
          }
        } catch (e) {
          console.error("Erro no comando modoaluguel:", e);
          await reply("❌ Ocorreu um erro inesperado.");
        }
        break;
      case 'listaralugueis':
      case 'aluguelist':
      case 'listaluguel':
      case 'listaaluguel':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          const rentalData = loadRentalData();
          const globalMode = rentalData.globalMode ? '🟢 Ativo' : '🔴 Desativado';
          const groupRentals = rentalData.groups || {};
          const groupCount = Object.keys(groupRentals).length;
          const filtro = args[0]?.toLowerCase();
          let message = `╭───「 *Lista de Aluguéis* 」───╮\n│ 🌍 *Modo Aluguel Global*: ${globalMode}\n│ 📊 *Total de Grupos*: ${groupCount}\n╰────────────────╯\n`;
          if (groupCount === 0) {
            
            message += '📪 Nenhum grupo com aluguel registrado.';
          } else {
            
            message += '📋 *Grupos com Aluguel*:\n\n';
            let index = 1;
            for (const [groupId, info] of Object.entries(groupRentals)) {
              const groupMetadata = await getCachedGroupMetadata(groupId).catch(() => ({
                subject: 'Desconhecido'
              }));
              const groupName = groupMetadata.subject || 'Sem Nome';
              let status = 'Expirado';
              if (info.expiresAt === 'permanent') {
                
                status = 'Permanente';
              } else if (new Date(info.expiresAt) > new Date()) {
                
                status = 'Ativo';
              }
              const shouldInclude = !filtro || filtro === 'ven' && status === 'Expirado' || filtro === 'atv' && status === 'Ativo' || filtro === 'perm' && status === 'Permanente';
              if (!shouldInclude) continue;
              const expires = info.expiresAt === 'permanent' ? '∞ Permanente' : info.expiresAt ? new Date(info.expiresAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo'
              }) : 'N/A';
              
              message += `🔹 *${index}. ${groupName}*\n`;
              
              message += `  - *Status*: ${status}\n`;
              
              message += `  - *Expira em*: ${expires}\n\n`;
              index++;
            }
            if (index === 1) {
              
              
              message += '📪 Nenhum grupo encontrado com esse filtro.';
            }
          }
          await reply(message);
        } catch (e) {
          console.error('Erro no comando listaluguel:', e);
          await reply("Ocorreu um erro ao listar os aluguéis 💔");
        }
        break;
      case 'leveling':
        if (!isGroup) return reply("Este comando só funciona em grupos.");
        if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
        groupData.levelingEnabled = !groupData.levelingEnabled;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`🎚️ Sistema de leveling ${groupData.levelingEnabled ? 'ativado' : 'desativado'}!`);
        break;
      case 'level':
        const levelingDataLevel = loadJsonFile(LEVELING_FILE);
        const userDataLevel = levelingDataLevel.users[sender] || {
          level: 1,
          xp: 0,
          patent: "Iniciante",
          messages: 0,
          commands: 0
        };
        const nextLevelXp = calculateNextLevelXp(userDataLevel.level);
        const xpToNextLevel = nextLevelXp - userDataLevel.xp;
        await reply(`🎚️ *Seu Nível*\n\n` + `🏅 *Nível:* ${userDataLevel.level}\n` + `🔹 *XP:* ${userDataLevel.xp} / ${nextLevelXp}\n` + `🎖️ *Patente:* ${userDataLevel.patent}\n` + `📈 *Falta para o próximo nível:* ${xpToNextLevel} XP\n`);
        break;
      case 'addxp':
        if (!isOwner) return reply("Apenas o dono pode usar este comando.");
        if (!menc_os2 || !q) return reply("Marque um usuário e especifique a quantidade de XP.");
        const xpToAdd = parseInt(q);
        if (isNaN(xpToAdd)) return reply("Quantidade de XP inválida.");
        const levelingDataAdd = loadJsonFile(LEVELING_FILE);
        const userDataAdd = levelingDataAdd.users[menc_os2] || {
          level: 1,
          xp: 0,
          patent: "Iniciante",
          messages: 0,
          commands: 0
        };
        userDataAdd.xp += xpToAdd;
        checkLevelUp(menc_os2, userDataAdd, levelingDataAdd, bender, from);
        fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingDataAdd, null, 2));
        await reply(`✅ Adicionado ${xpToAdd} XP para @${getUserName(menc_os2)}`, {
          mentions: [menc_os2]
        });
        break;
      case 'delxp':
        if (!isOwner) return reply("Apenas o dono pode usar este comando.");
        if (!menc_os2 || !q) return reply("Marque um usuário e especifique a quantidade de XP.");
        const xpToRemove = parseInt(q);
        if (isNaN(xpToRemove)) return reply("Quantidade de XP inválida.");
        const levelingDataDel = loadJsonFile(LEVELING_FILE);
        const userDataDel = levelingDataDel.users[menc_os2] || {
          level: 1,
          xp: 0,
          patent: "Iniciante",
          messages: 0,
          commands: 0
        };
        userDataDel.xp = Math.max(0, userDataDel.xp - xpToRemove);
        checkLevelDown(menc_os2, userDataDel, levelingDataDel);
        fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingDataDel, null, 2));
        await reply(`✅ Removido ${xpToRemove} XP de @${getUserName(menc_os2)}`, {
          mentions: [menc_os2]
        });
        break;
      case 'ranklevel':
        const levelingDataRank = loadJsonFile(LEVELING_FILE);
        const sortedUsers = Object.entries(levelingDataRank.users).sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp).slice(0, 10);
        let rankMessage = '🏆 *Ranking Global de Níveis*\n\n';
        sortedUsers.forEach(([userId, data], index) => {
          rankMessage += `${index + 1}. @${getUserName(userId)} - Nível ${data.level} (XP: ${data.xp})\n`;
        });
        await reply(rankMessage, {
          mentions: sortedUsers.map(([userId]) => userId)
        });
        break;
      case 'dayfree':
        try {
          if (!isOwner) return reply('❌ Este comando é exclusivo para o dono ou subdonos.');
          if (!q) return reply(`Uso: ${prefix}${command} <dias> [motivo opcional]\nEx: ${prefix}adddiasaluguel 7 Manutenção compensatória`);
          const parts = q.split(' ');
          const extraDays = parseInt(parts[0]);
          if (isNaN(extraDays) || extraDays <= 0) return reply('O primeiro argumento deve ser um número positivo de dias.');
          const motivo = parts.slice(1).join(' ') || 'Não especificado';
          const rentalData = loadRentalData();
          const groupIds = Object.keys(rentalData.groups);
          if (groupIds.length === 0) return reply('Não há grupos com aluguel configurado.');
          let successCount = 0;
          let failCount = 0;
          let summary = `📊 Resumo da extensão de aluguel:\n\n`;
          for (const groupId of groupIds) {
            const extendResult = extendGroupRental(groupId, extraDays);
            if (extendResult.success) {
              successCount++;
              summary += `✅ ${groupId}: ${extendResult.message}\n`;
              try {
                const groupMeta = await getCachedGroupMetadata(groupId);
                const msg = `🎉 Atenção, ${groupMeta.subject}! Adicionados ${extraDays} dias extras de aluguel.\nNova expiração: ${new Date(rentalData.groups[groupId].expiresAt).toLocaleDateString('pt-BR')}.\nMotivo: ${motivo}`;
                await bender.sendMessage(groupId, {
                  text: msg
                });
              } catch (e) {
                console.error(`Erro ao enviar mensagem para ${groupId}:`, e);
                summary += `   ⚠️ Falha ao avisar no grupo.\n`;
              }
            } else {
              failCount++;
              summary += `❌ ${groupId}: ${extendResult.message}\n`;
            }
          }
          summary += `\nTotal: ${successCount} sucessos | ${failCount} falhas`;
          await reply(summary);
        } catch (e) {
          console.error('Erro no comando adddiasaluguel:', e);
          await reply('Ocorreu um erro ao estender aluguel em todos os grupos.');
        }
        break;
      case 'addaluguel':
        if (!isOwner) return reply("🚫 Apenas o Dono principal pode adicionar aluguel!");
        if (!isGroup) return reply("Este comando só pode ser usado em grupos.");
        try {
          const parts = q.toLowerCase().trim().split(' ');
          const durationArg = parts[0];
          let durationDays = null;
          if (durationArg === 'permanente') {
            durationDays = 'permanent';
          } else if (!isNaN(parseInt(durationArg)) && parseInt(durationArg) > 0) {
            durationDays = parseInt(durationArg);
          } else {
            return reply(`🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra "permanente".\nExemplo: ${prefix}addaluguel 30`);
          }
          const result = setGroupRental(from, durationDays);
          await reply(result.message);
        } catch (e) {
          console.error("Erro no comando addaluguel:", e);
          await reply("❌ Ocorreu um erro inesperado ao adicionar o aluguel.");
        }
        break;
      case 'gerarcodigo':
        if (!isOwner) return reply("🚫 Apenas o Dono principal pode gerar códigos!");
        try {
          const parts = q.trim().split(' ');
          const durationArg = parts[0]?.toLowerCase();
          const targetGroupArg = parts[1];
          let durationDays = null;
          let targetGroupId = null;
          if (!durationArg) {
            return reply(`🤔 Uso: ${prefix}gerarcodigo <dias|permanente> [id_do_grupo_opcional]`);
          }
          if (durationArg === 'permanente') {
            durationDays = 'permanent';
          } else if (!isNaN(parseInt(durationArg)) && parseInt(durationArg) > 0) {
            durationDays = parseInt(durationArg);
          } else {
            return reply('🤔 Duração inválida. Use um número de dias (ex: 7) ou a palavra "permanente".');
          }
          if (targetGroupArg) {
            if (targetGroupArg.includes('@g.us')) {
              targetGroupId = targetGroupArg;
            } else if (/^\d+$/.test(targetGroupArg)) {
              targetGroupId = targetGroupArg + '@g.us';
            } else {
              const mentionedJid = info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
              if (mentionedJid && mentionedJid.endsWith('@g.us')) {
                targetGroupId = mentionedJid;
              } else {
                return reply('🤔 ID do grupo alvo inválido. Forneça o ID completo (numero@g.us) ou deixe em branco para um código genérico.');
              }
            }
          }
          const result = generateActivationCode(durationDays, targetGroupId);
          await reply(result.message);
        } catch (e) {
          console.error("Erro no comando gerarcodigo:", e);
          await reply("❌ Ocorreu um erro inesperado ao gerar o código.");
        }
        break;
      case 'limparaluguel':
        try {
          if (!isOwner) return reply("Apenas o dono pode usar este comando. 🚫");
          let rentalData = loadRentalData();
          let groupsCleaned = 0;
          let groupsExpired = 0;
          let groupsLeft = [];
          let adminsNotified = 0;
          const symbols = ['✨', '🌟', '⚡', '🔥', '🌈', '🍀', '💫', '🎉'];
          const currentGroups = await bender.groupFetchAllParticipating();
          const currentGroupIds = Object.keys(currentGroups);
          for (const groupId in rentalData.groups) {
            if (!currentGroupIds.includes(groupId)) {
              delete rentalData.groups[groupId];
              groupsCleaned++;
            }
          }
          for (const groupId in rentalData.groups) {
            const rentalStatus = getGroupRentalStatus(groupId);
            if (rentalStatus.active || rentalStatus.permanent) continue;
            const groupMetadata = await getCachedGroupMetadata(groupId).catch(() => null);
            if (!groupMetadata) {
              delete rentalData.groups[groupId];
              groupsCleaned++;
              continue;
            }
            groupsExpired++;
            groupsLeft.push(groupId);
            await bender.sendMessage(groupId, {
              text: `⏰ O aluguel deste grupo (${groupMetadata.subject}) expirou. Estou saindo, mas vocês podem renovar o aluguel entrando em contato com o dono! Até mais! 😊${symbols[Math.floor(Math.random() * symbols.length)]}`
            });
            const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
            for (const admin of admins) {
              const delay = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
              await new Promise(resolve => setTimeout(resolve, delay));
              await bender.sendMessage(admin, {
                text: `⚠️ Olá, admin do grupo *${groupMetadata.subject}*! O aluguel do grupo expirou, e por isso saí. Para renovar, entre em contato com o dono. Obrigado! ${symbols[Math.floor(Math.random() * symbols.length)]}`
              });
              adminsNotified++;
            }
            await bender.groupLeave(groupId);
          }
          saveRentalData(rentalData);
          let summary = `🧹 *Resumo da Limpeza de Aluguel* 🧹\n\n`;
          
          summary += `✅ Grupos removidos dos registros (bot não está mais neles): *${groupsCleaned}*\n`;
          
          summary += `⏰ Grupos vencidos processados e saídos: *${groupsExpired}*\n`;
          
          summary += `📩 Administradores notificados: *${adminsNotified}*\n`;
          if (groupsLeft.length > 0) {
            
            summary += `\n📋 *Grupos dos quais saí:*\n${groupsLeft.map(id => `- ${getUserName(id)}`).join('\n')}\n`;
          } else {
            
            summary += `\n📋 Nenhum grupo vencido encontrado para sair.\n`;
          }
          
          summary += `\n✨ Limpeza concluída com sucesso!`;
          await reply(summary);
        } catch (e) {
          console.error('Erro no comando limparaluguel:', e);
          await reply("Ocorreu um erro ao limpar alugueis 💔");
        }
        break;
      case 'addautoresponse':
      case 'addauto':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || !q.includes('/')) return reply(`Por favor, forneça a mensagem recebida e a resposta separadas por /. Ex: ${groupPrefix}addauto bom dia/Olá, bom dia!`);
          const [received, response] = q.split('/').map(s => s.trim());
          if (!received || !response) return reply("Formato inválido. Use: mensagem recebida/mensagem do bot");
          
          const responseData = {
            type: 'text',
            content: response
          };
          
          if (await addAutoResponse(from, received, responseData, true)) {
            await reply(`✅ Auto-resposta global adicionada!\nTrigger: ${received}\nResposta: ${response}`);
          } else {
            await reply("😥 Erro ao salvar a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addauto:', e);
          await reply("Ocorreu um erro ao adicionar auto-resposta 💔");
        }
        break;

      case 'addautomedia':
      case 'addautomidia':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q) return reply(`📝 Como usar:\n\n1️⃣ ${groupPrefix}addautomidia [trigger]\n2️⃣ Responda uma mídia (imagem, vídeo, áudio ou sticker)\n3️⃣ Opcionalmente adicione uma legenda\n\nExemplo: ${groupPrefix}addautomidia oi (respondendo uma imagem)`);
          
          const trigger = q.trim();
          let responseData = null;
          
          // Verificar se é resposta a uma mídia
          if (quotedMessageContent) {
            if (isQuotedImage) {
              const imageBuffer = await getFileBuffer(quotedMessageContent.imageMessage, 'image');
              responseData = {
                type: 'image',
                buffer: imageBuffer.toString('base64'),
                caption: quotedMessageContent.imageMessage.caption || ''
              };
            } else if (isQuotedVideo) {
              const videoBuffer = await getFileBuffer(quotedMessageContent.videoMessage, 'video');
              responseData = {
                type: 'video',
                buffer: videoBuffer.toString('base64'),
                caption: quotedMessageContent.videoMessage.caption || ''
              };
            } else if (isQuotedAudio) {
              const audioBuffer = await getFileBuffer(quotedMessageContent.audioMessage, 'audio');
              responseData = {
                type: 'audio',
                buffer: audioBuffer.toString('base64'),
                ptt: quotedMessageContent.audioMessage.ptt || false
              };
            } else if (isQuotedSticker) {
              const stickerBuffer = await getFileBuffer(quotedMessageContent.stickerMessage, 'sticker');
              responseData = {
                type: 'sticker',
                buffer: stickerBuffer.toString('base64')
              };
            } else {
              return reply('❌ Por favor, responda a uma mídia válida (imagem, vídeo, áudio ou sticker)!');
            }
          } else {
            return reply('❌ Por favor, responda a uma mídia para adicionar como auto-resposta!');
          }
          
          if (await addAutoResponse(from, trigger, responseData, true)) {
            await reply(`✅ Auto-resposta global com mídia adicionada!\nTrigger: ${trigger}\nTipo: ${responseData.type}`);
          } else {
            await reply("😥 Erro ao salvar a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addautomidia:', e);
          await reply("Ocorreu um erro ao adicionar auto-resposta com mídia 💔");
        }
        break;

      case 'addautoadm':
      case 'addautoadmin':
        try {
          if (!isGroup) return reply('🚫 Este comando só funciona em grupos!');
          if (!isGroupAdmin) return reply('🚫 Este comando é apenas para administradores do grupo!');
          if (!q || !q.includes('/')) return reply(`Por favor, forneça a mensagem recebida e a resposta separadas por /. Ex: ${groupPrefix}addautoadm oi/Olá! Como posso ajudar?`);
          const [received, response] = q.split('/').map(s => s.trim());
          if (!received || !response) return reply("Formato inválido. Use: mensagem recebida/mensagem do bot");
          
          const responseData = {
            type: 'text',
            content: response
          };
          
          if (await addAutoResponse(from, received, responseData, false)) {
            await reply(`✅ Auto-resposta do grupo adicionada!\nTrigger: ${received}\nResposta: ${response}`);
          } else {
            await reply("😥 Erro ao salvar a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addautoadm:', e);
          await reply("Ocorreu um erro ao adicionar auto-resposta do grupo 💔");
        }
        break;

      case 'addautoadmidia':
      case 'addautoadmmidia':
        try {
          if (!isGroup) return reply('🚫 Este comando só funciona em grupos!');
          if (!isGroupAdmin) return reply('🚫 Este comando é apenas para administradores do grupo!');
          if (!q) return reply(`📝 Como usar:\n\n1️⃣ ${groupPrefix}addautoadmidia [trigger]\n2️⃣ Responda uma mídia (imagem, vídeo, áudio ou sticker)\n3️⃣ Opcionalmente adicione uma legenda\n\nExemplo: ${groupPrefix}addautoadmidia bemvindo (respondendo uma imagem)`);
          
          const trigger = q.trim();
          let responseData = null;
          
          // Verificar se é resposta a uma mídia
          if (quotedMessageContent) {
            if (isQuotedImage) {
              const imageBuffer = await getFileBuffer(quotedMessageContent.imageMessage, 'image');
              responseData = {
                type: 'image',
                buffer: imageBuffer.toString('base64'),
                caption: quotedMessageContent.imageMessage.caption || ''
              };
            } else if (isQuotedVideo) {
              const videoBuffer = await getFileBuffer(quotedMessageContent.videoMessage, 'video');
              responseData = {
                type: 'video',
                buffer: videoBuffer.toString('base64'),
                caption: quotedMessageContent.videoMessage.caption || ''
              };
            } else if (isQuotedAudio) {
              const audioBuffer = await getFileBuffer(quotedMessageContent.audioMessage, 'audio');
              responseData = {
                type: 'audio',
                buffer: audioBuffer.toString('base64'),
                ptt: quotedMessageContent.audioMessage.ptt || false
              };
            } else if (isQuotedSticker) {
              const stickerBuffer = await getFileBuffer(quotedMessageContent.stickerMessage, 'sticker');
              responseData = {
                type: 'sticker',
                buffer: stickerBuffer.toString('base64')
              };
            } else {
              return reply('❌ Por favor, responda a uma mídia válida (imagem, vídeo, áudio ou sticker)!');
            }
          } else {
            return reply('❌ Por favor, responda a uma mídia para adicionar como auto-resposta!');
          }
          
          if (await addAutoResponse(from, trigger, responseData, false)) {
            await reply(`✅ Auto-resposta do grupo com mídia adicionada!\nTrigger: ${trigger}\nTipo: ${responseData.type}`);
          } else {
            await reply("😥 Erro ao salvar a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addautoadmidia:', e);
          await reply("Ocorreu um erro ao adicionar auto-resposta do grupo com mídia 💔");
        }
        break;
      case 'listautoresponses':
      case 'listauto':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          const autoResponses = loadCustomAutoResponses();
          if (autoResponses.length === 0) return reply("📜 Nenhuma auto-resposta global definida.");
          
          let responseText = `📜 *Auto-Respostas Globais (${autoResponses.length})*\n\n`;
          autoResponses.forEach((item, index) => {
            const trigger = item.trigger || item.received;
            const responseInfo = item.response;
            
            if (typeof responseInfo === 'string') {
              // Compatibilidade com sistema antigo
              responseText += `${index + 1}. 📝 **${trigger}**\n   ↳ ${responseInfo}\n\n`;
            } else {
              // Sistema novo com mídia
              const typeEmoji = {
                text: '📝',
                image: '🖼️',
                video: '🎥',
                audio: '🎵',
                sticker: '🎭'
              };
              responseText += `${index + 1}. ${typeEmoji[responseInfo.type] || '📝'} **${trigger}**\n   ↳ Tipo: ${responseInfo.type}`;
              if (responseInfo.caption) {
                responseText += `\n   ↳ Legenda: ${responseInfo.caption}`;
              }
              responseText += `\n\n`;
            }
          });
          responseText += `🔧 Use ${groupPrefix}delauto [número] para remover`;
          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando listauto:', e);
          await reply("Ocorreu um erro ao listar auto-respostas 💔");
        }
        break;

      case 'listautoadm':
      case 'listautoadmin':
        try {
          if (!isGroup) return reply('🚫 Este comando só funciona em grupos!');
          if (!isGroupAdmin) return reply('🚫 Este comando é apenas para administradores do grupo!');
          
          const autoResponses = loadGroupAutoResponses(from);
          if (autoResponses.length === 0) return reply("📜 Nenhuma auto-resposta do grupo definida.");
          
          let responseText = `📜 *Auto-Respostas do Grupo (${autoResponses.length})*\n\n`;
          autoResponses.forEach((item, index) => {
            const responseInfo = item.response;
            
            if (typeof responseInfo === 'string') {
              responseText += `${index + 1}. 📝 **${item.trigger}**\n   ↳ ${responseInfo}\n\n`;
            } else {
              const typeEmoji = {
                text: '📝',
                image: '🖼️',
                video: '🎥',
                audio: '🎵',
                sticker: '🎭'
              };
              responseText += `${index + 1}. ${typeEmoji[responseInfo.type] || '📝'} **${item.trigger}**\n   ↳ Tipo: ${responseInfo.type}`;
              if (responseInfo.caption) {
                responseText += `\n   ↳ Legenda: ${responseInfo.caption}`;
              }
              responseText += `\n\n`;
            }
          });
          responseText += `🔧 Use ${groupPrefix}delautoadm [número] para remover`;
          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando listautoadm:', e);
          await reply("Ocorreu um erro ao listar auto-respostas do grupo 💔");
        }
        break;
      case 'delautoresponse':
      case 'delauto':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || isNaN(parseInt(q))) return reply(`Por favor, forneça o número da auto-resposta a ser removida. Ex: ${groupPrefix}delauto 1`);
          const index = parseInt(q) - 1;
          const autoResponses = loadCustomAutoResponses();
          if (index < 0 || index >= autoResponses.length) return reply(`❌ Número inválido. Use ${groupPrefix}listauto para ver a lista.`);
          const removed = autoResponses.splice(index, 1)[0];
          if (saveCustomAutoResponses(autoResponses)) {
            const trigger = removed.trigger || removed.received;
            await reply(`🗑️ Auto-resposta global removida:\nTrigger: ${trigger}`);
          } else {
            await reply("😥 Erro ao remover a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando delauto:', e);
          await reply("Ocorreu um erro ao remover auto-resposta 💔");
        }
        break;

      case 'delautoadm':
      case 'delautoadmin':
        try {
          if (!isGroup) return reply('🚫 Este comando só funciona em grupos!');
          if (!isGroupAdmin) return reply('🚫 Este comando é apenas para administradores do grupo!');
          if (!q || isNaN(parseInt(q))) return reply(`Por favor, forneça o número da auto-resposta a ser removida. Ex: ${groupPrefix}delautoadm 1`);
          const index = parseInt(q) - 1;
          const autoResponses = loadGroupAutoResponses(from);
          if (index < 0 || index >= autoResponses.length) return reply(`❌ Número inválido. Use ${groupPrefix}listautoadm para ver a lista.`);
          const removed = autoResponses.splice(index, 1)[0];
          if (saveGroupAutoResponses(from, autoResponses)) {
            await reply(`🗑️ Auto-resposta do grupo removida:\nTrigger: ${removed.trigger}`);
          } else {
            await reply("😥 Erro ao remover a auto-resposta. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando delautoadm:', e);
          await reply("Ocorreu um erro ao remover auto-resposta do grupo 💔");
        }
        break;

      case 'autoresponses':
      case 'autorespostas':
        try {
          if (!isGroup) return reply('🚫 Este comando só funciona em grupos!');
          if (!isGroupAdmin) return reply('🚫 Este comando é apenas para administradores do grupo!');
          
          const globalResponses = loadCustomAutoResponses();
          const groupResponses = loadGroupAutoResponses(from);
          
          let responseText = `📋 *Sistema de Auto-Respostas*\n\n`;
          
          if (globalResponses.length > 0) {
            responseText += `🌍 **Auto-Respostas Globais (${globalResponses.length})**\n`;
            globalResponses.forEach((item, index) => {
              const trigger = item.trigger || item.received;
              const responseInfo = item.response;
              
              if (typeof responseInfo === 'string') {
                responseText += `${index + 1}. 📝 ${trigger}\n`;
              } else {
                const typeEmoji = {
                  text: '📝',
                  image: '🖼️',
                  video: '🎥',
                  audio: '🎵',
                  sticker: '🎭'
                };
                responseText += `${index + 1}. ${typeEmoji[responseInfo.type] || '📝'} ${trigger}\n`;
              }
            });
            responseText += '\n';
          }
          
          if (groupResponses.length > 0) {
            responseText += `👥 **Auto-Respostas do Grupo (${groupResponses.length})**\n`;
            groupResponses.forEach((item, index) => {
              const responseInfo = item.response;
              
              if (typeof responseInfo === 'string') {
                responseText += `${index + 1}. 📝 ${item.trigger}\n`;
              } else {
                const typeEmoji = {
                  text: '📝',
                  image: '🖼️',
                  video: '🎥',
                  audio: '🎵',
                  sticker: '🎭'
                };
                responseText += `${index + 1}. ${typeEmoji[responseInfo.type] || '📝'} ${item.trigger}\n`;
              }
            });
            responseText += '\n';
          }
          
          if (globalResponses.length === 0 && groupResponses.length === 0) {
            responseText += '📜 Nenhuma auto-resposta configurada.\n\n';
          }
          
          responseText += `📝 **Comandos Disponíveis:**\n`;
          responseText += `• ${groupPrefix}addautoadm [trigger]/[resposta] - Adicionar texto\n`;
          responseText += `• ${groupPrefix}addautoadmidia [trigger] - Adicionar mídia\n`;
          responseText += `• ${groupPrefix}listautoadm - Listar do grupo\n`;
          responseText += `• ${groupPrefix}delautoadm [número] - Remover do grupo\n\n`;
          
          if (isOwner) {
            responseText += `🔧 **Comandos do Dono:**\n`;
            responseText += `• ${groupPrefix}addauto [trigger]/[resposta] - Adicionar global\n`;
            responseText += `• ${groupPrefix}addautomidia [trigger] - Adicionar mídia global\n`;
            responseText += `• ${groupPrefix}listauto - Listar globais`;
          }
          
          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando autoresponses:', e);
          await reply("Ocorreu um erro ao listar auto-respostas 💔");
        }
        break;
      case 'addnoprefix':
      case 'addnopref':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || !q.includes('/')) return reply(`Por favor, forneça a mensagem e o comando separados por /. Ex: ${groupPrefix}addnoprefix 😸/ban`);
          const [trigger, targetCommand] = q.split('/').map(s => s.trim());
          if (!trigger || !targetCommand) return reply("Formato inválido. Use: mensagem/comando");
          const noPrefixCommands = loadNoPrefixCommands();
          if (noPrefixCommands.some(cmd => cmd.trigger === trigger)) {
            return reply(`A mensagem "${trigger}" já está mapeada para um comando.`);
          }
          noPrefixCommands.push({
            trigger,
            command: normalizar(targetCommand)
          });
          if (saveNoPrefixCommands(noPrefixCommands)) {
            await reply(`✅ Comando sem prefixo adicionado!\nMensagem: ${trigger}\nComando: ${targetCommand}`);
          } else {
            await reply("😥 Erro ao salvar o comando sem prefixo. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addnoprefix:', e);
          await reply("Ocorreu um erro ao adicionar comando sem prefixo 💔");
        }
        break;
      case 'listnoprefix':
      case 'listnopref':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          const noPrefixCommands = loadNoPrefixCommands();
          if (noPrefixCommands.length === 0) return reply("📜 Nenhum comando sem prefixo definido.");
          let responseText = `📜 *Comandos Sem Prefixo do Grupo ${groupName}*\n\n`;
          noPrefixCommands.forEach((item, index) => {
            
            responseText += `${index + 1}. Mensagem: ${item.trigger}\n   Comando: ${item.command}\n`;
          });
          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando listnoprefix:', e);
          await reply("Ocorreu um erro ao listar comandos sem prefixo 💔");
        }
        break;
      case 'delnoprefix':
      case 'delnopref':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || isNaN(parseInt(q))) return reply(`Por favor, forneça o número do comando sem prefixo a ser removido. Ex: ${groupPrefix}delnoprefix 1`);
          const index = parseInt(q) - 1;
          const noPrefixCommands = loadNoPrefixCommands();
          if (index < 0 || index >= noPrefixCommands.length) return reply(`❌ Número inválido. Use ${groupPrefix}listnoprefix para ver a lista.`);
          const removed = noPrefixCommands.splice(index, 1)[0];
          if (saveNoPrefixCommands(noPrefixCommands)) {
            await reply(`🗑️ Comando sem prefixo removido:\nMensagem: ${removed.trigger}\nComando: ${removed.command}`);
          } else {
            await reply("😥 Erro ao remover o comando sem prefixo. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando delnoprefix:', e);
          await reply("Ocorreu um erro ao remover comando sem prefixo 💔");
        }
        break;
      case 'addalias':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || !q.includes('/')) return reply(`Por favor, forneça o apelido e o comando separados por /. Ex: ${groupPrefix}addalias h/hidetag`);
          const [alias, targetCommand] = q.split('/').map(s => s.trim());
          if (!alias || !targetCommand) return reply("Formato inválido. Use: apelido/comando");
          const aliases = loadCommandAliases();
          if (aliases.some(item => item.alias === normalizar(alias))) {
            return reply(`O apelido "${alias}" já está em uso.`);
          }
          aliases.push({
            alias: normalizar(alias),
            command: normalizar(targetCommand)
          });
          if (saveCommandAliases(aliases)) {
            await reply(`✅ Apelido adicionado!\nApelido: ${groupPrefix}${alias}\nComando: ${groupPrefix}${targetCommand}`);
          } else {
            await reply("😥 Erro ao salvar o apelido. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando addalias:', e);
          await reply("Ocorreu um erro ao adicionar apelido 💔");
        }
        break;
      case 'listalias':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          const aliases = loadCommandAliases();
          if (aliases.length === 0) return reply("📜 Nenhum apelido de comando definido.");
          let responseText = `📜 *Apelidos de Comandos do Grupo ${groupName}*\n\n`;
          aliases.forEach((item, index) => {
            
            responseText += `${index + 1}. Apelido: ${groupPrefix}${item.alias}\n   Comando: ${groupPrefix}${item.command}\n`;
          });
          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando listaliases:', e);
          await reply("Ocorreu um erro ao listar apelidos 💔");
        }
        break;
      case 'delalias':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q || isNaN(parseInt(q))) return reply(`Por favor, forneça o número do apelido a ser removido. Ex: ${groupPrefix}delalias 1`);
          const index = parseInt(q) - 1;
          const aliases = loadCommandAliases();
          if (index < 0 || index >= aliases.length) return reply(`❌ Número inválido. Use ${groupPrefix}listaliases para ver a lista.`);
          const removed = aliases.splice(index, 1)[0];
          if (saveCommandAliases(aliases)) {
            await reply(`🗑️ Apelido removido:\nApelido: ${groupPrefix}${removed.alias}\nComando: ${groupPrefix}${removed.command}`);
          } else {
            await reply("😥 Erro ao remover o apelido. Tente novamente!");
          }
        } catch (e) {
          console.error('Erro no comando delalias:', e);
          await reply("Ocorreu um erro ao remover apelido 💔");
        }
        break;
      case 'addblackglobal':
        try {
          if (!isOwner) return reply("Apenas o dono pode adicionar usuários à blacklist global.");
          if (!menc_os2 && !q) return reply(`Marque o usuário ou forneça o número (ex: ${prefix}addblackglobal @usuario motivo).`);
          const reason = args.length > 1 ? args.slice(1).join(' ') : 'Não especificado';
          const targetUser = menc_os2 || (q.split(' ')[0].includes('@') ? q.split(' ')[0] : (isValidJid(q.split(' ')[0]) || isValidLid(q.split(' ')[0])) ? q.split(' ')[0] : buildUserId(q.split(' ')[0].replace(/\D/g, ''), config));
          const result = addGlobalBlacklist(targetUser, reason, pushname);
          await reply(result.message, {
            mentions: [targetUser]
          });
        } catch (e) {
          console.error('Erro no comando addblackglobal:', e);
          await reply("Ocorreu um erro ao adicionar à blacklist global 💔");
        }
        break;
      case 'rmblackglobal':
        try {
          if (!isOwner) return reply("Apenas o dono pode remover usuários da blacklist global.");
          if (!menc_os2 && !q) return reply(`Marque o usuário ou forneça o número (ex: ${prefix}remblackglobal @usuario).`);
          const targetUser = menc_os2 || (q.split(' ')[0].includes('@') ? q.split(' ')[0] : (isValidJid(q.split(' ')[0]) || isValidLid(q.split(' ')[0])) ? q.split(' ')[0] : buildUserId(q.split(' ')[0].replace(/\D/g, ''), config));
          const result = removeGlobalBlacklist(targetUser);
          await reply(result.message, {
            mentions: [targetUser]
          });
        } catch (e) {
          console.error('Erro no comando remblackglobal:', e);
          await reply("Ocorreu um erro ao remover da blacklist global 💔");
        }
        break;
      case 'listblackglobal':
        try {
          if (!isOwner) return reply("Apenas o dono pode listar a blacklist global.");
          const blacklistData = getGlobalBlacklist();
          if (Object.keys(blacklistData.users).length === 0) {
            return reply("🛑 A blacklist global está vazia.");
          }
          let message = `🛑 *Blacklist Global* 🛑\n\n`;
          for (const [userId, data] of Object.entries(blacklistData.users)) {
            
            message += `➤ @${getUserName(userId)}\n   Motivo: ${data.reason}\n   Adicionado por: ${data.addedBy}\n   Data: ${new Date(data.addedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;
          }
          await reply(message, {
            mentions: Object.keys(blacklistData.users)
          });
        } catch (e) {
          console.error('Erro no comando listblackglobal:', e);
          await reply("Ocorreu um erro ao listar a blacklist global 💔");
        }
        break;
      //FERRAMENTAS
      case 'encurtalink':
      case 'tinyurl':
        try {
          if (!q) return reply(`❌️ *Forma incorreta, use está como exemplo:* ${prefix + command} https://instagram.com/ataliasloami`);
          var anu;
          anu = await axios.get(`https://tinyurl.com/api-create.php?url=${q}`);
          reply(`${anu.data}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'nick':
      case 'gerarnick':
      case 'nickgenerator':
        try {
          if (!q) return reply(`🎮 *Consulta de Nick Free Fire*\n\n📝 *Como usar:*\n• Digite o ID do jogador após o comando\n• Ex: ${prefix}ffnick 123456789\n\n🔍 O nick será pesquisado na database do Free Fire!`);
          var datzn;
          datzn = await styleText(q);
          await reply(datzn.join('\n'));
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'printsite':
      case 'ssweb':
        try {
          if (!q) return reply(`Cade o link?`);
          await bender.sendMessage(from, {
            image: {
              url: `https://image.thum.io/get/fullpage/${q}`
            }
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'upload':
      case 'imgpralink':
      case 'videopralink':
      case 'gerarlink':
        try {
          if (!isQuotedImage && !isQuotedVideo && !isQuotedDocument && !isQuotedAudio) return reply(`Marque um video, uma foto, um audio ou um documento`);
          var foto1 = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : {};
          var video1 = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : {};
          var docc1 = isQuotedDocument ? info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage : {};
          var audio1 = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : "";
          let media = {};
          if (isQuotedDocument) {
            media = await getFileBuffer(docc1, "document");
          } else if (isQuotedVideo) {
            media = await getFileBuffer(video1, "video");
          } else if (isQuotedImage) {
            media = await getFileBuffer(foto1, "image");
          } else if (isQuotedAudio) {
            media = await getFileBuffer(audio1, "audio");
          }
          ;
          let linkz = await upload(media);
          await reply(`${linkz}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      //DOWNLOADS
      case 'assistir':
        try {
          if (!q) return reply('Cadê o nome do filme ou episódio de série? 🤔');
          await reply('Um momento, estou buscando as informações para você 🕵️‍♂️');
          var datyz;
          datyz = await FilmesDL(q);
          if (!datyz || !datyz.url) return reply('Desculpe, não consegui encontrar nada. Tente com outro nome de filme ou série. 😔');
          let bannerBuf = null;
          try {
            bannerBuf = await banner.Filme(datyz.img, datyz.name, datyz.url);
          } catch (be) { console.error('Erro ao gerar banner Filme:', be); }
          if (bannerBuf) {
            await bender.sendMessage(from, {
              image: bannerBuf,
              caption: `Aqui está o que encontrei! 🎬\n\n*Nome*: ${datyz.name}\n🔗 *Assista:* ${datyz.url}`
            }, { quoted: info });
          } else {
            await bender.sendMessage(from, {
              image: { url: datyz.img },
              caption: `Aqui está o que encontrei! 🎬\n\n*Nome*: ${datyz.name}\n🔗 *Assista:* ${datyz.url}`
            }, { quoted: info });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'mcplugin':
      case 'mcplugins':
        try {
          if (!q) return reply('Cadê o nome do plugin para eu pesquisar? 🤔');
          var datz;
          datz = await mcPlugin(q);
          if (!datz.ok) return reply(datz.msg);
          await bender.sendMessage(from, {
            image: {
              url: datz.image
            },
            caption: `🔍 Encontrei esse plugin aqui:\n\n*Nome*: _${datz.name}_\n*Publicado por*: _${datz.creator}_\n*Descrição*: _${datz.desc}_\n*Link para download*: _${datz.url}_\n\n> 💖 `
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'shazam':
        if (!KeyCog) {
          await bender.sendMessage(nmrdn, {
            text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
          });
          return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
        }
        try {
          if (isMedia && !info.message.imageMessage && !info.message.videoMessage || isQuotedAudio) {
            const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
            await reply('Aguarde um momentinho... ☀️');
            const buffi = await getFileBuffer(muk, 'audio');
            const Slakzin = await ia.Shazam(buffi);
            const videoInfo = await youtube.search(`${Slakzin.result.title} - ${Slakzin.result.artist}`);
            const views = typeof videoInfo.data.views === 'number' ? videoInfo.data.views.toLocaleString('pt-BR') : videoInfo.data.views;
            const description = videoInfo.data.description ? videoInfo.data.description.slice(0, 100) + (videoInfo.data.description.length > 100 ? '...' : '') : 'Sem descrição disponível';
            const caption = `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${videoInfo.data.title}\n👤 *Artista/Canal:* ${videoInfo.data.author.name}\n⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)\n👀 *Visualizações:* ${views}\n📅 *Publicado:* ${videoInfo.data.ago}\n📜 *Descrição:* ${description}\n🔗 *Link:* ${videoInfo.data.url}\n\n🎧 *Baixando e processando sua música, aguarde...*`;
            await bender.sendMessage(from, {
              image: {
                url: videoInfo.data.thumbnail
              },
              caption: caption,
              footer: `${nomebot} • Versão ${botVersion}`
            }, {
              quoted: info
            });
            const dlRes = await youtube.mp3(videoInfo.data.url);
            if (!dlRes.ok) {
              return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
            }
            ;
            try {
              await bender.sendMessage(from, {
                audio: dlRes.buffer,
                mimetype: 'audio/mpeg'
              }, {
                quoted: info
              });
            } catch (audioError) {
              if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
                await reply('📦 Arquivo muito grande para enviar como áudio, enviando como documento...');
                await bender.sendMessage(from, {
                  document: dlRes.buffer,
                  fileName: `${dlRes.filename}`,
                  mimetype: 'audio/mpeg'
                }, {
                  quoted: info
                });
              } else {
                throw audioError;
              }
              ;
            }
            ;
          } else {
            await reply('Use o comando marcando um audio... ☀️');
          }
          ;
        } catch (e) {
          console.error(e);
          
          if (e.message && e.message.includes('API key inválida')) {
            await ia.notifyOwnerAboutApiKey(bender, numerodono, e.message);
            await reply('🤖 *Sistema de IA temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          } else {
            await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
          }
        }
        ;
        break;
      
case 'play': {
if (!chargeUser(5, sender)) {
        return; 
    }
   try {
      if(!q.trim()) return reply(`- Exemplo: ${prefix}play nome da música\na música será baixada, só basta escolher áudio ou vídeo, se não baixar, o YouTube privou de não baixarem, ou algo do tipo..`);
      
      await bender.react('⬇️', {key: info.key});
      let data = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/pesquisa_ytb?nome=${q}&apikey=${API_KEY_BRONXYS}`);
      
      if(data[0]?.tempo?.length >= 7) 
         return reply("Desculpe, este vídeo ou áudio é muito grande, peça outra música abaixo de uma hora.");

      var N_E = " Não encontrado.";
      var bla = `📥 *Baixar vídeo:* \`${prefix}playvid ${q.trim()}\`
🎧 *Tocando agora no ${assBender}!*`;

      await bender.sendMessage(from, {text: bla}, {quoted: info});

      await bender.sendMessage(from, {
         audio: {url: `https://api.bronxyshost.com.br/api-bronxys/play?nome_url=${q}&apikey=${API_KEY_BRONXYS}`},
         mimetype: "audio/mpeg", 
         fileName: data[0]?.titulo || "play.mp3"
      }, {quoted: info}).catch(async (e) => {
         console.log(e);
         await reply("Erro...\nTentando outra fonte, aguarde...");

         try {
            let ABC = await fetchJson(zerosite+`/api/ytsrc?q=${q}&apikey=`+API_KEY_ZEROTWO);
            let data2 = ABC.resultado[0];

            sendImage(from, data2.thumbnail, bla2, info);
            sendAudio(from, zerosite+`/api/dl/ytaudio?url=${data2.url}&apikey=`+API_KEY_ZEROTWO, "audio/mpeg", info).catch(e => {
               return reply("Tentei, mas não foi possível, tente novamente!");
            });
         } catch (e2) {
            console.log(e2);
            return reply("❌ Nenhuma das fontes conseguiu baixar o áudio.");
         }
      });
   } catch (e) {
      console.log(e);
      return reply("Seja mais específico, não deu pra encontrar com apenas isso... / Erro");
   }
}
break;


        break;
      case 'playvid':
      case 'ytmp4':
        if (!chargeUser(15, sender)) {
        return; 
    }
        try {
          if (!q) return reply(`Digite o nome do vídeo ou um link do YouTube.\n> Ex: ${prefix + command} Back to Black`);
          
          // Verificar se tem API key
          if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
              text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
            });
            return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
          }

          let videoUrl;
          
          if (q.includes('youtube.com') || q.includes('youtu.be')) {
            videoUrl = q;
            await reply('Aguarde um momentinho... ☀️');
            const dlRes = await youtube.mp4(videoUrl, 360, KeyCog);
            if (!dlRes.ok) return reply(dlRes.msg);
            
            try {
              await bender.sendMessage(from, {
                video: dlRes.buffer,
                fileName: `${dlRes.filename}`,
                mimetype: 'video/mp4'
              }, {
                quoted: info
              });
            } catch (videoError) {
              if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
                await reply('Arquivo muito grande, enviando como documento...');
                await bender.sendMessage(from, {
                  document: dlRes.buffer,
                  fileName: `${dlRes.filename}`,
                  mimetype: 'video/mp4'
                }, {
                  quoted: info
                });
              } else {
                throw videoError;
              }
            }
            return;
          } else {
            const searchResult = await youtube.search(q, KeyCog);
            if (!searchResult.ok) return reply(searchResult.msg);
            videoUrl = searchResult.data.url;
          }
          
          const videoInfo = await youtube.search(q, KeyCog);
          if (!videoInfo.ok) return reply(videoInfo.msg);
          
          const caption = `
🎬 *Vídeo Encontrado* 🎬

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${videoInfo.data.views.toLocaleString()}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${videoInfo.data.description.slice(0, 100)}${videoInfo.data.description.length > 100 ? '...' : ''}
🔗 *Link:* ${videoInfo.data.url}

📹 *Enviando seu vídeo, aguarde!*`;
          
          await bender.sendMessage(from, {
            image: {
              url: videoInfo.data.thumbnail
            },
            caption: caption,
            footer: `By: ${nomebot}`
          }, {
            quoted: info
          });
          
          const dlRes = await youtube.mp4(videoUrl, 360, KeyCog);
          if (!dlRes.ok) return reply(dlRes.msg);
          
          try {
            await bender.sendMessage(from, {
              video: dlRes.buffer,
              fileName: `${dlRes.filename}`,
              mimetype: 'video/mp4'
            }, {
              quoted: info
            });
          } catch (videoError) {
            if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
              await reply('Arquivo muito grande, enviando como documento...');
              await bender.sendMessage(from, {
                document: dlRes.buffer,
                fileName: `${dlRes.filename}`,
                mimetype: 'video/mp4'
              }, {
                quoted: info
              });
            } else {
              throw videoError;
            }
          }
        } catch (e) {
          console.error('Erro no comando playvid/ytmp4:', e);
          
          // Verificar se é erro de API key e notificar o dono
          if (e.message && e.message.includes('API key inválida')) {
            await youtube.notifyOwnerAboutApiKey(bender, numerodono, e.message, command);
            return reply('🤖 *Sistema de YouTube temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          }
          
          reply("❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
        }
        break;
      case 'letra':
      case 'lyrics':
        try {
          if (!q) return reply('cade o nome da musica?');
          await reply('Aguarde um momentinho... ☀️');
          await reply(await Lyrics(q));
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        ;
        break;
      case 'tiktok':
      case 'tiktokaudio':
      case 'tiktokvideo':
      case 'tiktoks':
      case 'tiktoksearch':
      case 'ttk':
      case 'tkk':
        try {
          if (!q) return reply(`Digite um nome ou o link de um vídeo.\n> Ex: ${prefix}${command} Gato`);
          
          // Verificar se tem API key
          if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
              text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
            });
            return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
          }

          await reply('Aguarde um momentinho... ☀️');
          let isTikTokUrl = /^https?:\/\/(?:www\.|m\.|vm\.|t\.)?tiktok\.com\//.test(q);
          let datinha = await (isTikTokUrl ? tiktok.dl(q, KeyCog) : tiktok.search(q, KeyCog));
          
          if (!datinha.ok) return reply(datinha.msg);
          
          for (const urlz of datinha.urls) {
            await bender.sendMessage(from, {
              [datinha.type]: {
                url: urlz
              }
            }, {
              quoted: info
            });
          }
          
          if (datinha.audio) await bender.sendMessage(from, {
            audio: {
              url: datinha.audio
            },
            mimetype: 'audio/mp4'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error('Erro no comando TikTok:', e);
          
          // Verificar se é erro de API key e notificar o dono
          if (e.message && e.message.includes('API key inválida')) {
            await tiktok.notifyOwnerAboutApiKey(bender, numerodono, e.message, command);
            return reply('🤖 *Sistema de TikTok temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          }
          
          reply("❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
        }
        break;
      case 'instagram':
      case 'igdl':
      case 'ig':
      case 'instavideo':
      case 'igstory':
        try {
          if (!q) return reply(`Digite um link do Instagram.\n> Ex: ${prefix}${command} https://www.instagram.com/reel/DFaq_X7uoiT/?igsh=M3Q3N2ZyMWU1M3Bo`);
          
          // Verificar se tem API key
          if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
              text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês! 🚀\nwa.me/553399285117`
            });
            return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
          }

          await reply('Aguarde um momentinho... ☀️');
          const datinha = await igdl.dl(q, KeyCog);
          if (!datinha.ok) return reply(datinha.msg);
          
          for (const item of datinha.data) {
            await bender.sendMessage(from, {
              [item.type]: item.buff
            }, {
              quoted: info
            });
          }
        } catch (e) {
          console.error('Erro no comando Instagram:', e);
          
          // Verificar se é erro de API key e notificar o dono
          if (e.message && e.message.includes('API key inválida')) {
            await igdl.notifyOwnerAboutApiKey(bender, numerodono, e.message, command);
            return reply('🤖 *Sistema de Instagram temporariamente indisponível*\n\n😅 Estou com problemas técnicos no momento. O administrador já foi notificado!\n\n⏰ Tente novamente em alguns minutos.');
          }
          
          reply("❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
        }
        break;
      case 'pinterest':
      case 'pin':
        try {
          if (!q) return reply('Digite o termo para pesquisar no Pinterest. Exemplo: ' + prefix + 'pinterest gatinhos /3');
          const [searchTerm, limitStr] = q.split('/').map(s => s.trim());
          let maxImages = 5;
          if (limitStr && !isNaN(parseInt(limitStr))) {
            maxImages = Math.max(1, Math.min(parseInt(limitStr), 10));
          }
          const datinha = await (/^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/.test(searchTerm) ? pinterest.dl(searchTerm) : pinterest.search(searchTerm));
          if (!datinha.ok || !datinha.urls || datinha.urls.length === 0) {
            return reply('Nenhuma imagem encontrada para o termo pesquisado. 😕');
          }
          const imagesToSend = datinha.urls.slice(0, maxImages);
          for (const url of imagesToSend) {
            await bender.sendMessage(from, {
              image: {
                url
              },
              caption: `📌 Resultado da pesquisa por "${searchTerm}"`
            }, {
              quoted: info
            });
          }
        } catch (e) {
          console.error('Erro no comando pinterest:', e);
          await reply("Ocorreu um erro ao pesquisar no Pinterest 💔");
        }
        break;
      case 'menu':
      case 'help':
      case 'comandos':
      case 'commands':
        try {
          await bender.react('🆗', {key: info.key});
          const BUTTONS_FILE = pathz.join(DATABASE_DIR, 'bottons.json');
          ensureJsonFileExists(BUTTONS_FILE, { enabled: false });
          const buttonsData = loadJsonFile(BUTTONS_FILE, { enabled: false });
          
          if (buttonsData.enabled) {
            const customDesign = getMenuDesignWithDefaults(nomebot, pushname);
            const buttonMenuData = await menuButtons(prefix, nomebot, pushname, customDesign);
            
            const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            
            if (fs.existsSync(mediaPath)) {
              const mediaBuffer = fs.readFileSync(mediaPath);
              
              await bender.sendMessage(from, {
                [useVideo ? 'video' : 'image']: mediaBuffer,
                caption: buttonMenuData.text,
                title: buttonMenuData.title,
                subtitle: buttonMenuData.subtitle,
                footer: buttonMenuData.footer,
                interactiveButtons: buttonMenuData.interactiveButtons,
                gifPlayback: useVideo,
                mimetype: useVideo ? 'video/mp4' : 'image/jpeg',
                hasMediaAttachment: false
              }, {
                quoted: info
              });
            } else {
              await bender.sendMessage(from, buttonMenuData, { quoted: info });
            }
          } else {
            const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            const mediaBuffer = fs.readFileSync(mediaPath);
            
            const customDesign = getMenuDesignWithDefaults(nomebot, pushname);
            //const menuText = await menu(prefix, nomebot, pushname, customDesign);
            let menuText = `${cabecalhomenu}
┏ _ғɪɢᴜʀɪɴʜᴀs ᴀʀᴍᴀᴢᴇɴᴀᴅᴀs:_ *6.000*
┗ 📂 4 ɢʙ ]
╰══𝐅𝐈𝐆𝐔𝐑𝐈𝐍𝐇𝐀𝐒══⪨
⋟📸 ${prefix}s (ᴍᴀʀᴄᴀʀ ғᴏᴛᴏ)
⋟✏️ ${prefix}ʀᴇɴᴀᴍᴇ (ɴᴏᴍᴇ/ɴᴏᴍᴇ) 🪙
⋟🖼️ ${prefix}ғɪɢᴜʀɪɴʜᴀs (5) 🪙
⋟📝 ${prefix}ᴍᴇɴᴜғɪɢ
╰┈┈┈◜❁◞┈┈┈
⋟🪙 ${prefix}ʙᴄᴏɪɴs
⋟📂 ${prefix}ᴍᴇɴᴜᴀᴅᴍ
⋟👥 ${prefix}ᴍᴇɴᴜᴍᴇᴍʙʀᴏ
⋟🎲 ${prefix}ʙʀɪɴᴄᴀᴅᴇɪʀᴀs
╰─┈┈┈◜❁◞┈┈┈─╯`;
            
            await bender.sendMessage(from, {
              [useVideo ? 'video' : 'image']: mediaBuffer,
              caption: menuText,
              gifPlayback: useVideo,
              mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
            }, {
              quoted: info
            });
          }
        } catch (error) {
          console.error('Erro ao enviar menu:', error);
          const customDesign = getMenuDesignWithDefaults(nomebot, pushname);
          const menuText = await menu(prefix, nomebot, pushname, customDesign);
          await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
        }
        break;

      case 'alteradores':
      case 'menualterador':
      case 'menualteradores':
      case 'changersmenu':
      case 'changers':
        try {
          await sendMenuWithMedia('alteradores', menuAlterador);
        } catch (error) {
          console.error('Erro ao enviar menu de alteradores:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de alteradores");
        }
        break;
      case 'menuia':
      case 'aimenu':
      case 'menuias':
        try {
          await sendMenuWithMedia('ia', menuIa);
        } catch (error) {
          console.error('Erro ao enviar menu de IA:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de IA");
        }
        break;
      case 'menubn':
      case 'brincadeiras':
      case 'menubrincadeira':
      case 'menubrincadeiras':
      case 'gamemenu':
        try {
          await bender.react('🆗', {key: info.key});

          const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            const mediaBuffer = fs.readFileSync(mediaPath);
            
            let menuText = `${cabecalhomenu}
╰══𝐉𝐎𝐆𝐎𝐒 𝐄 𝐃𝐈𝐕𝐄𝐑𝐒𝐎𝐄𝐒══⪨
⋟❌ ${prefix}jogodavelha
⋟🤥 ${prefix}eununca
⋟❓ ${prefix}vab
⋟🎲 ${prefix}chance
⋟🔮 ${prefix}quando
⋟🍀 ${prefix}sorte
⋟❤️ ${prefix}casal
⋟💘 ${prefix}shipo
⋟⚖️ ${prefix}sn
⋟✂️ ${prefix}ppt
⋟💀 ${prefix}suicidio
╰══𝐈𝐍𝐓𝐄𝐑𝐀𝐂𝐎𝐄𝐒 𝐒𝐎𝐂𝐈𝐀𝐒══⪨
⋟🦶 ${prefix}chute
⋟⚽ ${prefix}chutar
⋟✋ ${prefix}tapa
⋟👊 ${prefix}soco
⋟🥊 ${prefix}socar
⋟💥 ${prefix}explodir
⋟🤗 ${prefix}abraco
⋟🫂 ${prefix}abracar
⋟🦷 ${prefix}morder
⋟👄 ${prefix}mordida
⋟👅 ${prefix}lamber
⋟👅 ${prefix}lambida
⋟💋 ${prefix}beijo
⋟😘 ${prefix}beijar
⋟🔪 ${prefix}mata
⋟☠️ ${prefix}matar
⋟💆 ${prefix}cafune
╰══𝐈𝐍𝐓𝐄𝐑𝐀𝐂𝐎𝐄𝐒 𝐏𝐈𝐂𝐀𝐍𝐓𝐄𝐒══⪨
⋟🥵 ${prefix}surubao
⋟🔞 ${prefix}sexo
⋟👄 ${prefix}beijob
⋟ Tongue ${prefix}beijarb
⋟🍑 ${prefix}tapar
⋟💦 ${prefix}goza
⋟💦 ${prefix}gozar
⋟🤱 ${prefix}mamar
⋟🥛 ${prefix}mamada
╰══𝐌𝐀𝐒𝐂𝐔𝐋𝐈𝐍𝐀𝐒══⪨
⋟🏳️‍🌈 ${prefix}gay
⋟🧠 ${prefix}burro
⋟💡 ${prefix}inteligente
⋟🎌 ${prefix}otaku
⋟💍 ${prefix}fiel
⋟💔 ${prefix}infiel
⋟🐐 ${prefix}corno
⋟🐂 ${prefix}gado
⋟😏 ${prefix}gostoso
⋟🤢 ${prefix}feio
⋟💰 ${prefix}rico
⋟🏚️ ${prefix}pobre
⋟🍆 ${prefix}pirocudo
⋟❌ ${prefix}nazista
⋟🦹 ${prefix}ladrao
⋟😈 ${prefix}safado
⋟😵‍💫 ${prefix}vesgo
⋟🍻 ${prefix}bebado
⋟🙅 ${prefix}machista
⋟🚫 ${prefix}homofobico
⋟🤬 ${prefix}racista
⋟😠 ${prefix}chato
⋟🌟 ${prefix}sortudo
⋟🌧️ ${prefix}azarado
⋟💪 ${prefix}forte
⋟🤏 ${prefix}fraco
⋟🎯 ${prefix}pegador
⋟🤡 ${prefix}otario
⋟🧔 ${prefix}macho
⋟🤪 ${prefix}bobo
⋟🤓 ${prefix}nerd
⋟😴 ${prefix}preguicoso
⋟💼 ${prefix}trabalhador
⋟😤 ${prefix}brabo
⋟🤩 ${prefix}lindo
⋟🦊 ${prefix}malandro
⋟😊 ${prefix}simpatico
⋟😂 ${prefix}engracado
⋟😎 ${prefix}charmoso
⋟🤫 ${prefix}misterioso
⋟🥰 ${prefix}carinhoso
⋟🖕 ${prefix}desumilde
⋟🙏 ${prefix}humilde
⋟😡 ${prefix}ciumento
⋟🦁 ${prefix}corajoso
⋟🐭 ${prefix}covarde
⋟😌 ${prefix}esperto
⋟🐍 ${prefix}talarico
⋟😭 ${prefix}chorao
⋟😜 ${prefix}brincalhao
⋟🇧🇷 ${prefix}bolsonarista
⋟🚩 ${prefix}petista
⋟☭ ${prefix}comunista
⋟🧑‍🦱 ${prefix}lulista
⋟⚔️ ${prefix}traidor
⋟😈 ${prefix}bandido
⋟🐶 ${prefix}cachorro
⋟🗑️ ${prefix}vagabundo
⋟🤥 ${prefix}pilantra
⋟👑 ${prefix}mito
⋟✅ ${prefix}padrao
⋟🎭 ${prefix}comedia
⋟🃏 ${prefix}psicopata
⋟🏋️ ${prefix}fortao
⋟🥖 ${prefix}magrelo
⋟😏 ${prefix}bombado
⋟🧑‍💼 ${prefix}chefe
⋟🏛️ ${prefix}presidente
⋟🤴 ${prefix}rei
⋟🤵 ${prefix}patrao
⋟🍾 ${prefix}playboy
⋟🤪 ${prefix}zueiro
⋟🎮 ${prefix}gamer
⋟💻 ${prefix}programador
⋟🔭 ${prefix}visionario
⋟💸 ${prefix}billionario
⋟⚡ ${prefix}poderoso
⋟🥇 ${prefix}vencedor
⋟🎩 ${prefix}senhor
⋟🥛 ${prefix}mamada
╰══𝐅𝐄𝐌𝐈𝐍𝐈𝐍𝐀𝐒══⪨
⋟🏳️‍🌈 ${prefix}lésbica
⋟🧠 ${prefix}burra
⋟💡 ${prefix}inteligente
⋟🎌 ${prefix}otaku
⋟💍 ${prefix}fiel
⋟💔 ${prefix}infiel
⋟🐐 ${prefix}corna
⋟🐂 ${prefix}gada
⋟😏 ${prefix}gostosa
⋟🤢 ${prefix}feia
⋟💰 ${prefix}rica
⋟🏚️ ${prefix}pobre
⋟🍑 ${prefix}bucetuda
⋟❌ ${prefix}nazista
⋟🦹 ${prefix}ladra
⋟😈 ${prefix}safada
⋟😵‍💫 ${prefix}vesga
⋟🍻 ${prefix}bêbada
⋟🙅 ${prefix}machista
⋟🚫 ${prefix}homofóbica
⋟🤬 ${prefix}racista
⋟😠 ${prefix}chata
⋟🌟 ${prefix}sortuda
⋟🌧️ ${prefix}azarada
⋟💪 ${prefix}forte
⋟🤏 ${prefix}fraca
⋟🎯 ${prefix}pegadora
⋟🤡 ${prefix}otária
⋟💁 ${prefix}boba
⋟🤓 ${prefix}nerd
⋟😴 ${prefix}preguiçosa
⋟💼 ${prefix}trabalhadora
⋟😤 ${prefix}braba
⋟🤩 ${prefix}linda
⋟🦊 ${prefix}malandra
⋟😊 ${prefix}simpática
⋟😂 ${prefix}engraçada
⋟😎 ${prefix}charmosa
⋟🤫 ${prefix}misteriosa
⋟🥰 ${prefix}carinhosa
⋟🖕 ${prefix}desumilde
⋟🙏 ${prefix}humilde
⋟😡 ${prefix}ciumenta
⋟🦁 ${prefix}corajosa
⋟🐭 ${prefix}covarde
⋟😌 ${prefix}esperta
⋟🐍 ${prefix}talarica
⋟😭 ${prefix}chorona
⋟😜 ${prefix}brincalhona
⋟🇧🇷 ${prefix}bolsonarista
⋟🚩 ${prefix}petista
⋟☭ ${prefix}comunista
⋟🧑‍🦱 ${prefix}lulista
⋟⚔️ ${prefix}traidora
⋟😈 ${prefix}bandida
⋟🐶 ${prefix}cachorra
⋟🗑️ ${prefix}vagabunda
⋟🤥 ${prefix}pilantra
⋟👑 ${prefix}mito
⋟✅ ${prefix}padrão
⋟🎭 ${prefix}comédia
⋟🃏 ${prefix}psicopata
⋟🏋️ ${prefix}fortona
⋟🥖 ${prefix}magrela
⋟😏 ${prefix}bombada
⋟🧑‍💼 ${prefix}chefe
⋟🏛️ ${prefix}presidenta
⋟👸 ${prefix}rainha
⋟🤵 ${prefix}patroa
⋟🍾 ${prefix}playgirl
⋟🤪 ${prefix}zueira
⋟🎮 ${prefix}gamer
⋟💻 ${prefix}programadora
⋟🔭 ${prefix}visionária
⋟💸 ${prefix}bilionária
⋟⚡ ${prefix}poderosa
⋟🥇 ${prefix}vencedora
⋟🎩 ${prefix}senhora
╰══𝐑𝐀𝐍𝐊𝐒 𝐌𝐀𝐒𝐂𝐔𝐋𝐈𝐍𝐎𝐒══⪨
⋟🏳️‍🌈 ${prefix}rankgay
⋟🧠 ${prefix}rankburro
⋟💡 ${prefix}rankinteligente
⋟🎌 ${prefix}rankotaku
⋟💍 ${prefix}rankfiel
⋟💔 ${prefix}rankinfiel
⋟🐐 ${prefix}rankcorno
⋟🐂 ${prefix}rankgado
⋟😏 ${prefix}rankgostoso
⋟💰 ${prefix}rankrico
⋟🏚️ ${prefix}rankpobre
⋟💪 ${prefix}rankforte
⋟🎯 ${prefix}rankpegador
⋟🧔 ${prefix}rankmacho
⋟🤓 ${prefix}ranknerd
⋟💼 ${prefix}ranktrabalhador
⋟😤 ${prefix}rankbrabo
⋟🤩 ${prefix}ranklindo
⋟🦊 ${prefix}rankmalandro
⋟😂 ${prefix}rankengracado
⋟😎 ${prefix}rankcharmoso
⋟🔭 ${prefix}rankvisionario
⋟⚡ ${prefix}rankpoderoso
⋟🥇 ${prefix}rankvencedor
╰══𝐑𝐀𝐍𝐊𝐒 𝐅𝐄𝐌𝐈𝐍𝐈𝐍𝐀𝐒══⪨
⋟🏳️‍🌈 ${prefix}ranklesbica
⋟🧠 ${prefix}rankburra
⋟💡 ${prefix}rankinteligente
⋟🎌 ${prefix}rankotaku
⋟💍 ${prefix}rankfiel
⋟💔 ${prefix}rankinfiel
⋟🐐 ${prefix}rankcorna
⋟🐂 ${prefix}rankgada
⋟😏 ${prefix}rankgostosa
⋟💰 ${prefix}rankrica
⋟🏚️ ${prefix}rankpobre
⋟💪 ${prefix}rankforte
⋟🎯 ${prefix}rankpegadora
⋟💁 ${prefix}ranknerd
⋟💼 ${prefix}ranktrabalhadora
⋟😤 ${prefix}rankbraba
⋟🤩 ${prefix}ranklinda
⋟🦊 ${prefix}rankmalandra
⋟😂 ${prefix}rankengracada
⋟😎 ${prefix}rankcharmosa
⋟🔭 ${prefix}rankvisionaria
⋟⚡ ${prefix}rankpoderosa
⋟🥇 ${prefix}rankvencedora
╰─┈┈┈◜❁◞┈┈┈─╯`;
            
            await bender.sendMessage(from, {
              [useVideo ? 'video' : 'image']: mediaBuffer,
              caption: menuText,
              gifPlayback: useVideo,
              mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
            }, {
              quoted: info
            });
          //await sendMenuWithMedia('admin', menuadm);
        } catch (error) {
          console.error('Erro ao enviar menu de administração:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de administração");
        }
        break;

      case 'menudown':
      case 'menudownload':
      case 'menudownloads':
      case 'downmenu':
      case 'downloadmenu':
        try {
          await sendMenuWithMedia('downloads', menudown);
        } catch (error) {
          console.error('Erro ao enviar menu de downloads:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de downloads");
        }
        break;
      case 'ferramentas':
      case 'menuferramentas':
      case 'menuferramenta':
      case 'toolsmenu':
      case 'tools':
        try {
          await sendMenuWithMedia('ferramentas', menuFerramentas);
        } catch (error) {
          console.error('Erro ao enviar menu de ferramentas:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de ferramentas");
        }
        break;
      case 'menuadm':
      case 'menuadmin':
      case 'menuadmins':
      case 'admmenu':
        try {
          await bender.react('🆗', {key: info.key});

          const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            const mediaBuffer = fs.readFileSync(mediaPath);
            
            let menuText = `${cabecalhomenu}
╰══𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐂𝐀𝐎══⪨
⋟🚫 ${prefix}ban 🪙
⋟⬆️ ${prefix}promover
⋟⬇️ ${prefix}rebaixar
⋟🔇 ${prefix}mute 🪙
⋟🔊 ${prefix}desmute 🪙
⋟⚠️ ${prefix}adv
⋟✅ ${prefix}rmadv
⋟📜 ${prefix}listadv
⋟🧱 ${prefix}blockuser
⋟🔓 ${prefix}unblockuser
⋟📋 ${prefix}listblocksgp
⋟➕ ${prefix}addblacklist
⋟➖ ${prefix}delblacklist
⋟❌ ${prefix}listblacklist
⋟🧹 ${prefix}limparrank
⋟🔄 ${prefix}resetrank
╰══𝐆𝐄𝐑𝐄𝐍𝐂𝐈𝐀𝐌𝐄𝐍𝐓𝐎══⪨
⋟🗑️ ${prefix}del 🪙
⋟🧼 ${prefix}limpar
⋟👻 ${prefix}banghost
⋟👁️‍🗨️ ${prefix}hidetag 🪙
⋟📌 ${prefix}marcar
⋟🎁 ${prefix}sorteio
⋟🔗 ${prefix}linkgp
⋟🚪 ${prefix}grupo A/F
⋟🕒 ${prefix}opengp HH:MM|off
⋟🕧 ${prefix}closegp HH:MM|off
⋟🖊️ ${prefix}setname
⋟📝 ${prefix}setdesc
⋟➕ ${prefix}addregra
⋟➖ ${prefix}delregra
⋟💬 ${prefix}limitmessage
⋟❌ ${prefix}dellimitmessage
╰══𝐁𝐋𝐎𝐂𝐊══⪨
⋟🔒 ${prefix}blockcmd
⋟🔑 ${prefix}unblockcmd
╰══𝐌𝐎𝐃𝐄𝐑𝐀𝐃𝐎𝐑𝐄𝐒══⪨
⋟➕ ${prefix}addmod
⋟➖ ${prefix}delmod
⋟👥 ${prefix}listmods
⋟📜 ${prefix}grantmodcmd
⋟🚫 ${prefix}revokemodcmd
⋟📜 ${prefix}listmodcmds
╰══𝐏𝐀𝐑𝐂𝐄𝐑𝐈𝐀𝐒══⪨
⋟🤝 ${prefix}parcerias
⋟➕ ${prefix}addparceria
⋟➖ ${prefix}delparceria
╰══𝐀𝐍𝐓𝐈 𝐍𝐔𝐊𝐄══⪨
⋟🛡️ ${prefix}antinuke
⋟👑 ${prefix}donogp
⋟🗑️ ${prefix}rmdonogp
⋟👥 ${prefix}donosgp
╰══𝐀𝐔𝐓𝐎 𝐑𝐄𝐏𝐎𝐒𝐓𝐀══⪨
⋟🤖 ${prefix}addautoadm
⋟🖼️ ${prefix}addautoadmidia
⋟📋 ${prefix}listautoadm
⋟❌ ${prefix}delautoadm
⋟💬 ${prefix}autorespostas
⋟🔁 ${prefix}autorepo
╰══𝐀𝐓𝐈𝐕𝐀𝐂𝐎𝐄𝐒 ══⪨
⋟⬇️ ${prefix}autodl
⋟🤏 ${prefix}minmessage
⋟💡 ${prefix}assistente
⋟🌚 ${prefix}modobn
⋟🔞 ${prefix}modonsfw
⋟🤝 ${prefix}modoparceria
⋟🌟 ${prefix}modogold
⋟👋 ${prefix}bemvindo
⋟🏃 ${prefix}saida
⋟🏷️ ${prefix}autosticker
⋟🛡️ ${prefix}soadm
⋟🕵️ ${prefix}x9
⋟💡 ${prefix}assistente
⋟⚡ ${prefix}modolite
⋟⏱️ ${prefix}cmdlimit
⋟🔗 ${prefix}antilinkgp
⋟⚔️ ${prefix}antilinkhard
⋟🛑 ${prefix}antiporn
⋟🌊 ${prefix}antiflood
⋟🎭 ${prefix}antifake
⋟🇵🇹 ${prefix}antipt
⋟📄 ${prefix}antidoc
⋟📍 ${prefix}antiloc
⋟🖼️ ${prefix}antifig
⋟🖱️ ${prefix}antibtn
⋟🔇 ${prefix}antistatus
╰══𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐂𝐎𝐄𝐒 ══⪨
⋟✍️ ${prefix}legendasaiu
⋟📝 ${prefix}legendabv
⋟📸 ${prefix}fotobv
⋟🗑️ ${prefix}rmfotobv
⋟📷 ${prefix}fotosaiu
⋟❌ ${prefix}rmfotosaiu
⋟⚙️ ${prefix}setprefix
╰─┈┈┈◜❁◞┈┈┈─╯`;
            
            await bender.sendMessage(from, {
              [useVideo ? 'video' : 'image']: mediaBuffer,
              caption: menuText,
              gifPlayback: useVideo,
              mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
            }, {
              quoted: info
            });
          //await sendMenuWithMedia('admin', menuadm);
        } catch (error) {
          console.error('Erro ao enviar menu de administração:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de administração");
        }
        break;

      case 'menumembro':
      case 'menumemb':
      case 'menugeral':
      case 'membmenu':
      case 'membermenu':
        try {
          let menuText = `${cabecalhomenu}
╰═𝐌𝐄𝐍𝐔 𝐌𝐄𝐌𝐁𝐑𝐎𝐒═ ⪨
⋟✏️ ${prefix}gerarnick
⋟🌐 ${prefix}ssweb
⋟⬆️ ${prefix}upload
⋟🔗 ${prefix}encurtalink
⋟🔳 ${prefix}qrcode
⋟🗣️ ${prefix}tradutor
⋟📚 ${prefix}dicionario
⋟🔔 ${prefix}lembrete
⋟📝 ${prefix}meuslembretes
⋟🗑️ ${prefix}apagalembrete
⋟👤 ${prefix}perfil
⋟👑 ${prefix}dono
⋟📢 ${prefix}mention
⋟😈 ${prefix}rvisu 🪙
⋟😴 ${prefix}afk
╰═𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐎𝐄𝐒═ ⪨
⋟🔢 ${prefix}totalcmd
⋟🏆 ${prefix}topcmd
⋟ℹ️ ${prefix}cmdinfo
⋟👥 ${prefix}statusgp
⋟🤖 ${prefix}statusbot
⋟📊 ${prefix}meustatus
⋟📜 ${prefix}regras
⋟📡 ${prefix}ping
╰═𝐑𝐀𝐍𝐊═ ⪨
⋟🟢 ${prefix}rankativo
⋟🔴 ${prefix}rankinativo
⋟🥇 ${prefix}rankativog
╰═𝐅𝐅═ ⪨
⋟🎮 ${prefix}likeff
╰─┈┈┈◜❁◞┈┈┈─╯`;
            
            const menuVideoPath = __dirname + '/../midias/menu.mp4';
            const menuImagePath = __dirname + '/../midias/menu.png';
            const useVideo = fs.existsSync(menuVideoPath);
            const mediaPath = useVideo ? menuVideoPath : menuImagePath;
            const mediaBuffer = fs.readFileSync(mediaPath);

            await bender.sendMessage(from, {
              [useVideo ? 'video' : 'image']: mediaBuffer,
              caption: menuText,
              gifPlayback: useVideo,
              mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
            }, {
              quoted: info
            });
          //await sendMenuWithMedia('membros', menuMembros);
        } catch (error) {
          console.error('Erro ao enviar menu de membros:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de membros");
        }
        break;
      case 'configcmdnotfound':
      case 'setcmdmsg':
        if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
        
        const cmdNotFoundConfig = loadCmdNotFoundConfig();
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
          return reply(`📝 *Uso do ${prefix}configcmdnotfound:*\n\n` +
            `• ${prefix}configcmdnotfound activate - Ativar mensagens de comando não encontrado\n` +
            `• ${prefix}configcmdnotfound deactivate - Desativar mensagens de comando não encontrado\n` +
            `• ${prefix}configcmdnotfound set <mensagem> - Definir mensagem personalizada\n` +
            `• ${prefix}configcmdnotfound style <estilo> - Definir estilo (friendly, formal, casual, emoji)\n` +
            `• ${prefix}configcmdnotfound preview - Pré-visualizar mensagem atual\n` +
            `• ${prefix}configcmdnotfound reset - Restaurar configurações padrão\n\n` +
            `📌 *Variáveis disponíveis:*\n` +
            `{command} - Comando digitado\n` +
            `{prefix} - Prefixo do bot\n` +
            `{user} - Usuário que digitou\n` +
            `{botName} - Nome do bot\n` +
            `{userName} - Nome do usuário`);
        }
        
        switch (subcommand) {
          case 'activate':
            cmdNotFoundConfig.enabled = true;
            if (saveCmdNotFoundConfig(cmdNotFoundConfig, 'ativado')) {
              reply('✅ Mensagens de comando não encontrados foram ativadas!');
            }
            break;
            
          case 'deactivate':
            cmdNotFoundConfig.enabled = false;
            if (saveCmdNotFoundConfig(cmdNotFoundConfig, 'desativado')) {
              reply('✅ Mensagens de comando não encontrados foram desativadas!');
            }
            break;
            
          case 'set':
            const newMessage = args.slice(1).join(' ');
            if (!newMessage) {
              return reply('❌ Por favor, forneça uma mensagem personalizada.\n\nExemplo: ' +
                prefix + 'configcmdnotfound set O comando {command} não existe! Tente {prefix}menu');
            }
            
            // Validate the message template
            const validation = validateMessageTemplate(newMessage);
            if (!validation.valid) {
              return reply('❌ A mensagem contém problemas:\n\n• ' + validation.issues.join('\n• ') + '\n\nCorrija esses problemas e tente novamente.');
            }
            
            cmdNotFoundConfig.message = newMessage;
            if (saveCmdNotFoundConfig(cmdNotFoundConfig)) {
              reply('✅ Mensagem personalizada salva com sucesso!');
              console.log(`🔧 Comando não encontrado: Mensagem alterada por ${pushname} (${sender})`);
            } else {
              reply('❌ Ocorreu um erro ao salvar a mensagem. Tente novamente.');
            }
            break;
            
          case 'style':
            const style = args[1]?.toLowerCase();
            const validStyles = ['friendly', 'formal', 'casual', 'emoji'];
            if (!validStyles.includes(style)) {
              return reply('❌ Estilo inválido! Estilos disponíveis: ' + validStyles.join(', '));
            }
            
            cmdNotFoundConfig.style = style;
            if (saveCmdNotFoundConfig(cmdNotFoundConfig, `estilo alterado para ${style}`)) {
              reply(`✅ Estilo alterado para "${style}" com sucesso!`);
            }
            break;
            
          case 'preview':
            const userName = pushname || getUserName(sender);
            const previewMessage = formatMessageWithFallback(
              cmdNotFoundConfig.message,
              {
                command: 'exemplo',
                prefix: prefixo,
                user: sender,
                botName: nomebot,
                userName: userName
              },
              '❌ Comando não encontrado! Tente ' + prefixo + 'menu para ver todos os comandos disponíveis.'
            );
            reply(`🔍 *Pré-visualização da mensagem:*\n\n${previewMessage}\n\n✅ *Status da configuração:*\n• Ativado: ${cmdNotFoundConfig.enabled ? 'Sim' : 'Não'}\n• Estilo: ${cmdNotFoundConfig.style}\n• Última atualização: ${new Date(cmdNotFoundConfig.lastUpdated || Date.now()).toLocaleString('pt-BR')}`);
            break;
            
          case 'reset':
            cmdNotFoundConfig.enabled = true;
            cmdNotFoundConfig.message = '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.';
            cmdNotFoundConfig.style = 'friendly';
            cmdNotFoundConfig.variables = {
              command: '{command}',
              prefix: '{prefix}',
              user: '{user}',
              botName: '{botName}',
              userName: '{userName}'
            };
            
            if (saveCmdNotFoundConfig(cmdNotFoundConfig, 'resetado para padrão')) {
              reply('✅ Configurações de comando não encontradas restauradas para o padrão!');
            }
            break;
            
          default:
            reply('❌ Subcomando inválido! Use ' + prefix + 'configcmdnotfound para ver a lista de comandos disponíveis.');
        }
        break;
        
      case 'menudono':
      case 'ownermenu':
        try {
          if (!isOwner) {
            await reply("⚠️ Este menu é exclusivo para o dono do bot.");
            return;
          }
          ;
          await sendMenuWithMedia('dono', menuDono);
        } catch (error) {
          console.error('Erro ao enviar menu do dono:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu do dono");
        }
        break;
      case 'stickermenu':
      case 'menusticker':
      case 'menufig':
        try {
          await sendMenuWithMedia('stickers', menuSticker);
        } catch (error) {
          console.error('Erro ao enviar menu de stickers:', error);
          await reply("❌ Ocorreu um erro ao carregar o menu de stickers");
        }
        break;
        async function sendMenuWithMedia(menuType, menuFunction) {
          const menuVideoPath = __dirname + '/../midias/menu.mp4';
          const menuImagePath = __dirname + '/../midias/menu.png';
          const useVideo = fs.existsSync(menuVideoPath);
          const mediaPath = useVideo ? menuVideoPath : menuImagePath;
          const mediaBuffer = fs.readFileSync(mediaPath);
          
          // Obtém o design personalizado do menu
          const customDesign = getMenuDesignWithDefaults(nomebot, pushname);
          
          // Aplica o design personalizado ao menu
          const menuText = typeof menuFunction === 'function' ? 
            (typeof menuFunction.then === 'function' ? 
              await menuFunction : 
              await menuFunction(prefix, nomebot, pushname, customDesign)) : 
            'Menu não disponível';
          
          await bender.sendMessage(from, {
            [useVideo ? 'video' : 'image']: mediaBuffer,
            caption: menuText,
            gifPlayback: useVideo,
            mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
          }, {
            quoted: info
          });
        }
        ;
      case 'antipv3':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          antipvData.mode = antipvData.mode === 'antipv3' ? null : 'antipv3';
          fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
          await reply(`✅ Antipv3 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'bloqueia usuários que usam comandos no privado' : 'responde normalmente no privado'}.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antipv2':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          antipvData.mode = antipvData.mode === 'antipv2' ? null : 'antipv2';
          fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
          await reply(`✅ Antipv2 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'avisa que comandos só funcionam em grupos no privado' : 'responde normalmente no privado'}.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antipv4':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          antipvData.mode = antipvData.mode === 'antipv4' ? null : 'antipv4';
          fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
          await reply(`✅ Antipv4 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'avisa que o bot so funciona em grupos' : 'responde normalmente no privado'}.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antipvmessage':
      case 'antipvmsg':
        try {
          if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
          if (!q) return reply(`Por favor, forneça a nova mensagem para o antipv. Exemplo: ${prefix}antipvmessage Comandos no privado estão desativados!`);
          const antipvFile = DATABASE_DIR + '/antipv.json';
          let antipvData = loadJsonFile(antipvFile, {
            mode: 'off',
            message: '🚫 Este comando só funciona em grupos!'
          });
          antipvData.message = q.trim();
          fs.writeFileSync(antipvFile, JSON.stringify(antipvData, null, 2));
          await reply(`✅ Mensagem do antipv atualizada para: "${antipvData.message}"`);
        } catch (e) {
          console.error('Erro no comando setantipvmensagem:', e);
          await reply("Ocorreu um erro ao configurar a mensagem do antipv 💔");
        }
        break;
      case 'antipv':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          antipvData.mode = antipvData.mode === 'antipv' ? null : 'antipv';
          fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
          await reply(`✅ Antipv ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'ignora mensagens no privado' : 'responde normalmente no privado'}.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'entrar':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          if (!q || !q.includes('chat.whatsapp.com')) return reply('Digite um link de convite válido! Exemplo: ' + prefix + 'entrar https://chat.whatsapp.com/...');
          const code = q.split('https://chat.whatsapp.com/')[1];
          await bender.groupAcceptInvite(code).then(res => {
            reply(`✅ Entrei no grupo com sucesso!`);
          }).catch(err => {
            reply('❌ Erro ao entrar no grupo. Link inválido ou permissão negada.');
          });
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'tm':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          if (!q && !isQuotedImage && !isQuotedVideo) return reply('Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: ' + prefix + 'tm Olá a todos!');
          const genSuffix = () => Math.floor(100 + Math.random() * 900).toString();
          let baseMessage = {};
          if (isQuotedImage) {
            const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
            
            baseMessage = {
              image,
              caption: q || 'Transmissão do dono!'
            };
          } else if (isQuotedVideo) {
            const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
            
            baseMessage = {
              video,
              caption: q || 'Transmissão do dono!'
            };
          } else {
            
            baseMessage = {
              text: q
            };
          }
          const groups = await bender.groupFetchAllParticipating();
          for (const group of Object.values(groups)) {
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (30000 - 10000) + 10000)));
            const suffix = genSuffix();
            const message = { ...baseMessage };
            if (message.caption) message.caption = `${message.caption} ${suffix}`;
            if (message.text) message.text = `${message.text} ${suffix}`;
            await bender.sendMessage(group.id, message);
          }
          await reply(`✅ Transmissão enviada para ${Object.keys(groups).length} grupos!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'reviverqr':
        if (!isOwner) return reply('🚫 Este comando é exclusivo para o proprietário!');
        const qrcodeDir = pathz.join(__dirname, '..', 'database', 'qr-code');
        const filePatterns = ['pre-key', 'sender', 'session'];
        let totalDeleted = 0;
        const deletedByCategory = {};
        try {
          filePatterns.forEach(pattern => deletedByCategory[pattern] = 0);
          const files = fs.readdirSync(qrcodeDir);
          for (const file of files) {
            for (const pattern of filePatterns) {
              if (file.startsWith(pattern)) {
                const filePath = pathz.join(qrcodeDir, file);
                fs.unlinkSync(filePath);
                deletedByCategory[pattern]++;
                totalDeleted++;
              }
            }
          }
          let message = '🧹 Limpeza de arquivos concluída!\n\n';
          
          message += '📊 Arquivos excluídos por categoria:\n';
          for (const [category, count] of Object.entries(deletedByCategory)) {
            
            message += `- ${category}: ${count} arquivo(s)\n`;
          }
          
          message += `\n📈 Total de arquivos excluídos: ${totalDeleted}\n`;
          
          message += '🔄 Reiniciando o sistema em 2 segundos...';
          reply(message);
          setTimeout(() => {
            reply('🔄 Reiniciando agora...');
            setTimeout(() => {
              process.exit();
            }, 1200);
          }, 2000);
        } catch (error) {
          reply(`❌ Erro ao executar a limpeza: ${error.message}`);
        }
        break;
      case 'cases':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
          const caseRegex = /case\s+'([^']+)'\s*:/g;
          const cases = new Set();
          let match;
          while ((match = caseRegex.exec(indexContent)) !== null) {
            cases.add(match[1]);
          }
          ;
          const multiCaseRegex = /case\s+'([^']+)'\s*:\s*case\s+'([^']+)'\s*:/g;
          while ((match = multiCaseRegex.exec(indexContent)) !== null) {
            cases.add(match[1]);
            cases.add(match[2]);
          }
          ;
          const caseList = Array.from(cases).sort();
          await reply(`📜 *Lista de Comandos (Cases)*:\n\n${caseList.join('\n')}\n\nTotal: ${caseList.length} comandos`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'getcase':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          if (!q) return reply('❌ Digite o nome do comando. Exemplo: ' + prefix + 'getcase menu');
          var caseCode;
          caseCode = (fs.readFileSync(__dirname + "/index.js", "utf-8").match(new RegExp(`case\\s*["'\`]${q}["'\`]\\s*:[\\s\\S]*?break\\s*;?`, "i")) || [])[0];
          await bender.sendMessage(from, {
            document: Buffer.from(caseCode, 'utf-8'),
            mimetype: 'text/plain',
            fileName: `${q}.txt`
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'boton':
      case 'botoff':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          const botStateFile = __dirname + '/../database/botState.json';
          const isOn = botState.status === 'on';
          if (command === 'boton' && isOn) {
            return reply('🌟 O bot já está ativado!');
          }
          if (command === 'botoff' && !isOn) {
            return reply('🌙 O bot já está desativado!');
          }
          botState.status = command === 'boton' ? 'on' : 'off';
          fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));
          const message = command === 'boton' ? '✅ *Bot ativado!* Agora todos podem usar os comandos.' : '✅ *Bot desativado!* Apenas o dono pode usar comandos.';
          await reply(message);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'blockcmdg':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          const cmdToBlock = q?.toLowerCase().split(' ')[0];
          const reason = q?.split(' ').slice(1).join(' ') || 'Sem motivo informado';
          if (!cmdToBlock) return reply('❌ Informe o comando a bloquear! Ex.: ' + prefix + 'blockcmd sticker');
          const blockFile = __dirname + '/../database/globalBlocks.json';
          globalBlocks.commands = globalBlocks.commands || {};
          globalBlocks.commands[cmdToBlock] = {
            reason,
            timestamp: Date.now()
          };
          fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
          await reply(`✅ Comando *${cmdToBlock}* bloqueado globalmente!\nMotivo: ${reason}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'unblockcmdg':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          const cmdToUnblock = q?.toLowerCase().split(' ')[0];
          if (!cmdToUnblock) return reply('❌ Informe o comando a desbloquear! Ex.: ' + prefix + 'unblockcmd sticker');
          const blockFile = __dirname + '/../database/globalBlocks.json';
          if (!globalBlocks.commands || !globalBlocks.commands[cmdToUnblock]) {
            return reply(`❌ O comando *${cmdToUnblock}* não está bloqueado!`);
          }
          delete globalBlocks.commands[cmdToUnblock];
          fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
          await reply(`✅ Comando *${cmdToUnblock}* desbloqueado globalmente!`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'blockuserg':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          if (!menc_os2) return reply("Marque alguém 🙄");
          var reason;
          reason = q ? q.includes('@') ? q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Não informado" : q : 'Não informado';
          var menc_os3;
          menc_os3 = (menc_os2 && menc_os2.includes(' ')) ? menc_os2.split(' ')[0] : menc_os2;
          if (!menc_os3) return reply("Erro ao processar usuário mencionado");
          const blockFile = __dirname + '/../database/globalBlocks.json';
          globalBlocks.users = globalBlocks.users || {};
          globalBlocks.users[menc_os3] = {
            reason,
            timestamp: Date.now()
          };
          fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
          await reply(`✅ Usuário @${getUserName(menc_os3)} bloqueado globalmente!\nMotivo: ${reason}`, {
            mentions: [menc_os3]
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'unblockuserg':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          if (!menc_os2) return reply("Marque alguém 🙄");
          const blockFile = __dirname + '/../database/globalBlocks.json';
          if (!globalBlocks.users) {
            return reply(`ℹ️ Não há usuários bloqueados globalmente.`);
          }
          const userToUnblock = globalBlocks.users[menc_os2] ? menc_os2 :
                               globalBlocks.users[getUserName(menc_os2)] ? getUserName(menc_os2) : null;
          if (!userToUnblock) {
            return reply(`❌ O usuário @${getUserName(menc_os2)} não está bloqueado globalmente!`, {
              mentions: [menc_os2]
            });
          }
          delete globalBlocks.users[userToUnblock];
          fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
          await reply(`✅ Usuário @${getUserName(menc_os2)} desbloqueado globalmente!`, {
            mentions: [menc_os2]
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'listblocks':
        if (!isOwner) return reply("Este comando é apenas para o meu dono");
        try {
          const blockFile = __dirname + '/../database/globalBlocks.json';
          const blockedCommands = globalBlocks.commands ? Object.entries(globalBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum comando bloqueado.';
          const blockedUsers = globalBlocks.users ? Object.entries(globalBlocks.users).map(([user, data]) => {
            return `👤 *${getUserName(user)}* - Motivo: ${data.reason}`;
          }).join('\n') : 'Nenhum usuário bloqueado.';
          const message = `🔒 *Bloqueios Globais - ${nomebot}* 🔒\n\n📜 *Comandos Bloqueados*:\n${blockedCommands}\n\n👥 *Usuários Bloqueados*:\n${blockedUsers}`;
          await reply(message);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'seradm':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          await bender.groupParticipantsUpdate(from, [sender], "promote");
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'sermembro':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          await bender.groupParticipantsUpdate(from, [sender], "demote");
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'prefixo':
      case 'prefix':
        try {
          if (!isOwner) return reply("Este comando é exclusivo para o meu dono!");
          if (!q) return reply(`⚙️ *Configuração de Prefixo*\n\n📝 *Como usar:*\n• Digite o novo prefixo após o comando\n• Ex: ${prefix}${command} /\n• Ex: ${prefix}${command} !\n\n✅ O prefixo do bot será atualizado para o valor especificado!`);
          let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
          config.prefixo = q;
          fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
          await reply(`Prefixo alterado com sucesso para "${q}"!`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor! 🥺");
        }
        break;
      case 'numerodono':
      case 'numero-dono':
        try {
          if (!isOwner) return reply("Este comando é exclusivo para o meu dono!");
          if (!q) return reply(`Por favor, digite o novo número do dono.\nExemplo: ${prefix}${command} +553399285117`);
          let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
          config.numerodono = q;
          fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
          await reply(`Número do dono alterado com sucesso para "${q}"!`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor! 🥺");
        }
        break;
      case 'nomedono':
      case 'nome-dono':
        try {
          if (!isOwner) return reply("Este comando é exclusivo para o meu dono!");
          if (!q) return reply(`Por favor, digite o novo nome do dono.\nExemplo: ${prefix}${command} @ataliasloami`);
          let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
          config.nomedono = q;
          fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
          await reply(`Nome do dono alterado com sucesso para "${q}"!`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor! 🥺");
        }
        break;
      case 'nomebot':
      case 'botname':
      case 'nome-bot':
        try {
          if (!isOwner) return reply("Este comando é exclusivo para o meu dono!");
          if (!q) return reply(`Por favor, digite o novo nome do bot.\nExemplo: ${prefix}${command} Nazuna`);
          let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
          config.nomebot = q;
          fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
          await reply(`Nome do bot alterado com sucesso para "${q}"!`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor! 🥺");
        }
        break;
      case 'apikey':
      case 'api-key':
        try {
          if (!isOwner) return reply("Este comando é exclusivo para o meu dono!");
          if (!q) return reply(`Por favor, digite a nova API key.\nExemplo: ${prefix}${command} abc123xyz`);
          let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
          config.apikey = q;
          fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
          await reply(`API key alterada com sucesso para "${q}"!`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor! 🥺");
        }
        break;
      case 'fotomenu':
      case 'videomenu':
      case 'mediamenu':
      case 'midiamenu':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (fs.existsSync(__dirname + '/../midias/menu.png')) fs.unlinkSync(__dirname + '/../midias/menu.png');
          if (fs.existsSync(__dirname + '/../midias/menu.mp4')) fs.unlinkSync(__dirname + '/../midias/menu.mp4');
          var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
          var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
          if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo, com o comando: ${prefix + command} (mencionando a mídia)`);
          var isVideo2 = !!boij;
          var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
          fs.writeFileSync(__dirname + '/../midias/menu.' + (isVideo2 ? 'mp4' : 'jpg'), buffer);
          await reply('✅ Mídia do menu atualizada com sucesso.');
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      
      // ================================
      // COMANDOS DE DESIGN DO MENU
      // ================================
      
      case 'setborda':
      case 'setbordatopo':
      case 'settopborder':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} ╭─⊰`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.menuTopBorder = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Borda superior do menu definida como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'setbordafim':
      case 'setbottomborder':
      case 'setbordabaixo':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} ╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.bottomBorder = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Borda inferior do menu definida como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'setbordameio':
      case 'setmiddleborder':
      case 'setbordamiddle':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} ┊`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.middleBorder = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Borda do meio do menu definida como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'setitemicon':
      case 'seticoneitem':
      case 'setitem':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} •.̇𖥨֗🍓⭟`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.menuItemIcon = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Ícone dos itens do menu definido como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'setseparador':
      case 'setseparatoricon':
      case 'seticoneseparador':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} ❁`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.separatorIcon = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Ícone separador do menu definido como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'settitleicon':
      case 'seticonetitulo':
      case 'settitulo':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <emoji/texto>\n\nExemplo: ${prefix + command} 🍧ฺꕸ▸`);
          
          const currentDesign = loadMenuDesign();
          currentDesign.menuTitleIcon = q;
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Ícone do título do menu definido como: ${q}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'setheader':
      case 'setcabecalho':
      case 'setheadermenu':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!q) return reply(`Uso: ${prefix + command} <texto>\n\nExemplo: ${prefix + command} ╭┈⊰ 🌸 『 *{botName}* 』\\n┊Olá, {userName}!\\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯\n\n*Placeholders disponíveis:*\n{botName} - Nome do bot\n{userName} - Nome do usuário`);
          
          const currentDesign = loadMenuDesign();
          // Processa quebras de linha explícitas
          currentDesign.header = q.replace(/\\n/g, '\n');
          
          if (saveMenuDesign(currentDesign)) {
            await reply(`✅ Cabeçalho do menu definido com sucesso!\n\n*Preview:*\n${currentDesign.header.replace(/{botName}/g, nomebot).replace(/{userName}/g, pushname)}`);
          } else {
            await reply("❌ Erro ao salvar configurações do design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'resetdesign':
      case 'resetarmenu':
      case 'resetdesignmenu':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          
          const defaultDesign = {
            header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
            menuTopBorder: "╭┈",
            bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
            menuTitleIcon: "🍧ฺꕸ▸",
            menuItemIcon: "•.̇𖥨֗🍓⭟",
            separatorIcon: "❁",
            middleBorder: "┊"
          };
          
          if (saveMenuDesign(defaultDesign)) {
            await reply("✅ Design do menu resetado para o padrão com sucesso!");
          } else {
            await reply("❌ Erro ao resetar o design do menu.");
          }
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'designmenu':
      case 'verdesign':
      case 'configmenu':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          
          const currentDesign = loadMenuDesign();
          const designText = `╭─⊰ 🎨 *CONFIGURAÇÕES DO DESIGN* 🎨 ⊱─╮
┊
┊ 🔸 *Cabeçalho:*
┊ ${currentDesign.header.replace(/{botName}/g, nomebot).replace(/{userName}/g, pushname)}
┊
┊ 🔸 *Borda Superior:* ${currentDesign.menuTopBorder}
┊ 🔸 *Borda Inferior:* ${currentDesign.bottomBorder}
┊ 🔸 *Borda do Meio:* ${currentDesign.middleBorder}
┊ 🔸 *Ícone do Item:* ${currentDesign.menuItemIcon}
┊ 🔸 *Ícone Separador:* ${currentDesign.separatorIcon}
┊ 🔸 *Ícone do Título:* ${currentDesign.menuTitleIcon}
┊
┊ 📝 *Comandos disponíveis:*
┊ ${prefix}setborda - Alterar borda superior
┊ ${prefix}setbordafim - Alterar borda inferior  
┊ ${prefix}setbordameio - Alterar borda do meio
┊ ${prefix}setitem - Alterar ícone dos itens
┊ ${prefix}setseparador - Alterar ícone separador
┊ ${prefix}settitulo - Alterar ícone do título
┊ ${prefix}setheader - Alterar cabeçalho
┊ ${prefix}resetdesign - Resetar para padrão
┊
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;
          
          await reply(designText);
        } catch (e) {
          console.error(e);
          await reply("🐝 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes! 🥺");
        }
        break;

      case 'listagp':
      case 'listgp':
        try {
          if (!isOwner) return reply('⛔ Desculpe, este comando é exclusivo para o meu dono!');
          const getGroups = await bender.groupFetchAllParticipating();
          const groups = Object.entries(getGroups).slice(0).map(entry => entry[1]);
          const sortedGroups = groups.sort((a, b) => a.subject.localeCompare(b.subject));
          let teks = `🌟 *Lista de Grupos e Comunidades* 🌟\n📊 *Total de Grupos:* ${sortedGroups.length}\n\n`;
          for (let i = 0; i < sortedGroups.length; i++) {
            
            teks += `🔹 *${i + 1}. ${sortedGroups[i].subject}*\n` + `🆔 *ID:* ${sortedGroups[i].id}\n` + `👥 *Participantes:* ${sortedGroups[i].participants.length}\n\n`;
          }
          ;
          await reply(teks);
        } catch (e) {
          console.log(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'bangp':
      case 'unbangp':
      case 'desbangp':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          banGpIds[from] = !banGpIds[from];
          if (banGpIds[from]) {
            await reply('🚫 Grupo banido, apenas usuarios premium ou meu dono podem utilizar o bot aqui agora.');
          } else {
            await reply('✅ Grupo desbanido, todos podem utilizar o bot novamente.');
          }
          ;
          fs.writeFileSync(__dirname + `/../database/dono/bangp.json`, JSON.stringify(banGpIds));
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'addpremium':
      case 'addvip':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!menc_os2) return reply("Marque alguém 🙄");
          if (!!premiumListaZinha[menc_os2]) return reply('O usuário ja esta na lista premium.');
          premiumListaZinha[menc_os2] = true;
          await bender.sendMessage(from, {
            text: `✅ @${getUserName(menc_os2)} foi adicionado(a) a lista premium.`,
            mentions: [menc_os2]
          }, {
            quoted: info
          });
          fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'delpremium':
      case 'delvip':
      case 'rmpremium':
      case 'rmvip':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!menc_os2) return reply("Marque alguém 🙄");
          if (!premiumListaZinha[menc_os2]) return reply('O usuário não esta na lista premium.');
          delete premiumListaZinha[menc_os2];
          await bender.sendMessage(from, {
            text: `🫡 @${getUserName(menc_os2)} foi removido(a) da lista premium.`,
            mentions: [menc_os2]
          }, {
            quoted: info
          });
          fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'addpremiumgp':
      case 'addvipgp':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!!premiumListaZinha[from]) return reply('O grupo ja esta na lista premium.');
          premiumListaZinha[from] = true;
          await bender.sendMessage(from, {
            text: `✅ O grupo foi adicionado a lista premium.`
          }, {
            quoted: info
          });
          fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'delpremiumgp':
      case 'delvipgp':
      case 'rmpremiumgp':
      case 'rmvipgp':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono");
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!premiumListaZinha[from]) return reply('O grupo não esta na lista premium.');
          delete premiumListaZinha[from];
          await bender.sendMessage(from, {
            text: `🫡 O grupo foi removido da lista premium.`
          }, {
            quoted: info
          });
          fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'listapremium':
      case 'listavip':
      case 'premiumlist':
      case 'listpremium':
        try {
          if (!isOwner) return reply('⛔ Desculpe, este comando é exclusivo para o meu dono!');
          const premiumList = premiumListaZinha || {};
          const usersPremium = Object.keys(premiumList).filter(id => isUserId(id));
          const groupsPremium = Object.keys(premiumList).filter(id => id.includes('@g.us'));
          let teks = `✨ *Lista de Membros Premium* ✨\n\n`;
          
          teks += `👤 *Usuários Premium* (${usersPremium.length})\n`;
          if (usersPremium.length > 0) {
            usersPremium.forEach((user, i) => {
              const userNumber = getUserName(user);
              
              teks += `🔹 ${i + 1}. @${userNumber}\n`;
            });
          } else {
            
            teks += `   Nenhum usuário premium encontrado.\n`;
          }
          ;
          
          teks += `\n👥 *Grupos Premium* (${groupsPremium.length})\n`;
          if (groupsPremium.length > 0) {
            for (let i = 0; i < groupsPremium.length; i++) {
              try {
                const groupInfo = await getCachedGroupMetadata(groupsPremium[i]);
                teks += `🔹 ${i + 1}. ${groupInfo.subject}\n`;
              } catch {
                
                teks += `🔹 ${i + 1}. Grupo ID: ${groupsPremium[i]}\n`;
              }
            }
          } else {
            
            teks += `   Nenhum grupo premium encontrado.\n`;
          }
          ;
          await bender.sendMessage(from, {
            text: teks,
            mentions: usersPremium
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply('😔 Ops, algo deu errado. Tente novamente mais tarde!');
        }
        ;
        break;
      //COMANDOS GERAIS
      case 'rvisu':
      case 'open':
      case 'revelar':
      if (!chargeUser(2000, sender)) {
        return; 
    }
        try {
          var RSMM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          var boij22 = RSMM?.imageMessage || info.message?.imageMessage || RSMM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSMM?.viewOnceMessage?.message?.imageMessage;
          var boijj = RSMM?.videoMessage || info.message?.videoMessage || RSMM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSMM?.viewOnceMessage?.message?.videoMessage;
          var boij33 = RSMM?.audioMessage || info.message?.audioMessage || RSMM?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessage?.message?.audioMessage || RSMM?.viewOnceMessage?.message?.audioMessage;
          if (boijj) {
            var px = boijj;
            px.viewOnce = false;
            px.video = {
              url: px.url
            };
            await bender.sendMessage(from, px, {
              quoted: info
            });
          } else if (boij22) {
            var px = boij22;
            px.viewOnce = false;
            px.image = {
              url: px.url
            };
            await bender.sendMessage(from, px, {
              quoted: info
            });
          } else if (boij33) {
            var px = boij33;
            px.viewOnce = false;
            px.audio = {
              url: px.url
            };
            await bender.sendMessage(from, px, {
              quoted: info
            });
          } else {
            return reply('Por favor, *mencione uma imagem, video ou áudio em visualização única* para executar o comando.');
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'limpardb':
        try {
          if (!isOwner) return reply("Apenas o dono pode limpar o banco de dados.");
          const allGroups = await bender.groupFetchAllParticipating();
          const currentGroupIds = Object.keys(allGroups);
          const groupFiles = fs.readdirSync(GRUPOS_DIR).filter(file => file.endsWith('.json'));
          let removedCount = 0;
          let removedGroups = [];
          groupFiles.forEach(file => {
            const groupId = file.replace('.json', '');
            if (!currentGroupIds.includes(groupId)) {
              fs.unlinkSync(pathz.join(GRUPOS_DIR, file));
              removedCount++;
              removedGroups.push(groupId);
            }
          });
          await reply(`🧹 Limpeza do DB concluída!\n\nRemovidos ${removedCount} grupos obsoletos:\n${removedGroups.map(id => `• ${id}`).join('\n') || 'Nenhum grupo obsoleto encontrado.'}`);
        } catch (e) {
          console.error('Erro no comando limpardb:', e);
          await reply("Ocorreu um erro ao limpar o DB 💔");
        }
        break;
      case 'limparrank':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem limpar o rank de atividade.");
          
          // Get current group members with proper LID/JID handling
          const currentMembers = AllgroupMembers;
          const oldContador = groupData.contador || [];
          let removedCount = 0;
          let removedUsers = [];
          let invalidUsers = [];
          
          // Enhanced filtering with better error handling
          groupData.contador = oldContador.filter(user => {
            try {
              if (!user || !user.id) {
                invalidUsers.push('Invalid user entry');
                return false;
              }
              
              // Check if user is still in the group
              const isMember = currentMembers.includes(user.id);
              
              if (!isMember) {
                removedCount++;
                const userName = getUserName(user.id);
                removedUsers.push(userName);
                console.log(`[LIMPAR RANK] Removed departed user: ${user.id} (${userName})`);
                return false;
              }
              
              return true;
            } catch (e) {
              console.log(`[LIMPAR RANK] Error processing user ${user?.id}:`, e.message);
              invalidUsers.push(user?.id || 'Unknown');
              return false;
            }
          });
          
          // Save the updated data
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          
          // Prepare response message
          let responseMessage = `🧹 Limpeza do rank de atividade concluída!\n\n`;
          responseMessage += `✅ Removidos ${removedCount} usuários ausentes:\n`;
          responseMessage += `${removedUsers.map(name => `• @${name}`).join('\n') || 'Nenhum usuário ausente encontrado.'}`;
          
          if (invalidUsers.length > 0) {
            responseMessage += `\n\n⚠️ ${invalidUsers.length} entradas inválidas foram removidas silenciosamente.`;
          }
          
          // Send response with proper mentions
          await reply(responseMessage, {
            mentions: removedUsers.map(name => buildUserId(name, config))
          });
          
          // Log the action
          console.log(`[LIMPAR RANK] Action completed in group ${from}. Removed ${removedCount} users, ${invalidUsers.length} invalid entries.`);
        } catch (e) {
          console.error('[LIMPAR RANK] Error:', e);
          await reply("❌ Ocorreu um erro ao limpar o rank. Tente novamente mais tarde.");
        }
        break;
      case 'resetrank':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem resetar o rank de atividade.");
          const oldCount = (groupData.contador || []).length;
          groupData.contador = [];
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`🔄 Reset do rank de atividade concluído!\n\nRemovidas ${oldCount} entradas de usuários. O rank agora está vazio.`);
        } catch (e) {
          console.error('Erro no comando resetarrank:', e);
          await reply("Ocorreu um erro ao resetar o rank 💔");
        }
        break;
      case 'limparrankg':
        try {
          if (!isOwner) return reply("Apenas o dono pode limpar os ranks de todos os grupos.");
          
          const groupFiles = fs.readdirSync(GRUPOS_DIR).filter(file => file.endsWith('.json'));
          let totalRemoved = 0;
          let totalInvalid = 0;
          let summary = [];
          let failedGroups = [];
          
          console.log(`[LIMPAR RANK GLOBAL] Starting cleanup for ${groupFiles.length} groups`);
          
          for (const file of groupFiles) {
            try {
              const groupId = file.replace('.json', '');
              const groupPath = pathz.join(GRUPOS_DIR, file);
              
              // Skip if file doesn't exist or can't be read
              if (!fs.existsSync(groupPath)) {
                console.log(`[LIMPAR RANK GLOBAL] Skipping non-existent file: ${groupPath}`);
                continue;
              }
              
              let gData;
              try {
                gData = JSON.parse(fs.readFileSync(groupPath));
              } catch (parseError) {
                console.log(`[LIMPAR RANK GLOBAL] Error reading group file ${groupId}:`, parseError.message);
                failedGroups.push(`${groupId}: Erro ao ler arquivo`);
                continue;
              }
              
              // Get group metadata with error handling
              let metadata;
              try {
                metadata = await getCachedGroupMetadata(groupId).catch(() => null);
              } catch (metaError) {
                console.log(`[LIMPAR RANK GLOBAL] Error getting metadata for group ${groupId}:`, metaError.message);
                failedGroups.push(`${groupId}: Erro ao obter metadados`);
                continue;
              }
              
              if (!metadata) {
                console.log(`[LIMPAR RANK GLOBAL] No metadata for group ${groupId}, skipping`);
                continue;
              }
              
              // Get current members with proper LID/JID handling
              const currentMembers = metadata.participants?.map(p => p.lid || p.id) || [];
              const oldContador = gData.contador || [];
              let removedInGroup = 0;
              let invalidInGroup = 0;
              
              // Enhanced filtering
              gData.contador = oldContador.filter(user => {
                try {
                  if (!user || !user.id) {
                    invalidInGroup++;
                    totalInvalid++;
                    return false;
                  }
                  
                  // Check if user is still in the group
                  const isMember = currentMembers.includes(user.id);
                  
                  if (!isMember) {
                    removedInGroup++;
                    totalRemoved++;
                    const userName = getUserName(user.id);
                    console.log(`[LIMPAR RANK GLOBAL] Removed departed user from ${groupId}: ${user.id} (${userName})`);
                    return false;
                  }
                  
                  return true;
                } catch (e) {
                  console.log(`[LIMPAR RANK GLOBAL] Error processing user ${user?.id} in group ${groupId}:`, e.message);
                  invalidInGroup++;
                  totalInvalid++;
                  return false;
                }
              });
              
              // Save updated group data
              try {
                fs.writeFileSync(groupPath, JSON.stringify(gData, null, 2));
              } catch (writeError) {
                console.log(`[LIMPAR RANK GLOBAL] Error writing to group file ${groupId}:`, writeError.message);
                failedGroups.push(`${groupId}: Erro ao salvar arquivo`);
                continue;
              }
              
              // Add to summary if changes were made
              if (removedInGroup > 0 || invalidInGroup > 0) {
                let groupSummary = `${groupId}: `;
                if (removedInGroup > 0) groupSummary += `Removidos ${removedInGroup} usuários ausentes`;
                if (invalidInGroup > 0) {
                  if (removedInGroup > 0) groupSummary += ', ';
                  groupSummary += `${invalidInGroup} entradas inválidas`;
                }
                summary.push(groupSummary);
              }
              
            } catch (groupError) {
              console.log(`[LIMPAR RANK GLOBAL] Error processing group file ${file}:`, groupError.message);
              failedGroups.push(`${file}: Erro inesperado`);
            }
          }
          
          // Prepare response message
          let responseMessage = `🧹 Limpeza de ranks em todos os grupos concluída!\n\n`;
          responseMessage += `✅ Total de usuários removidos: ${totalRemoved}\n`;
          responseMessage += `⚠️ Entradas inválidas removidas: ${totalInvalid}\n\n`;
          
          if (summary.length > 0) {
            responseMessage += `📋 Detalhes:\n${summary.join('\n')}\n\n`;
          }
          
          if (failedGroups.length > 0) {
            responseMessage += `❌ Grupos com problemas (${failedGroups.length}):\n${failedGroups.slice(0, 5).join('\n')}${failedGroups.length > 5 ? '\n... e mais ' + (failedGroups.length - 5) : ''}\n`;
          }
          
          if (summary.length === 0 && totalRemoved === 0 && totalInvalid === 0) {
            responseMessage = `🧹 Limpeza de ranks em todos os grupos concluída!\n\nNenhum usuário ausente ou entrada inválida encontrada em qualquer grupo.`;
          }
          
          await reply(responseMessage);
          
          // Log the action
          console.log(`[LIMPAR RANK GLOBAL] Cleanup completed. Total removed: ${totalRemoved}, Invalid: ${totalInvalid}, Failed: ${failedGroups.length}`);
          
        } catch (e) {
          console.error('[LIMPAR RANK GLOBAL] Error:', e);
          await reply("❌ Ocorreu um erro ao limpar ranks de todos os grupos. Tente novamente mais tarde.");
        }
        break;
      case 'rankativos':
      case 'rankativo':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          
          // Verify current group members first
          let currentMembers = AllgroupMembers;
          let validUsers = [];
          
          // Filter out users who have left the group
          groupData.contador = groupData.contador.filter(user => {
            const userId = user.id;
            const isValidMember = currentMembers.includes(userId);
            
            if (!isValidMember) {
              console.log(`[RANKATIVO] Removed departed user: ${userId} (${getUserName(userId)})`);
              return false;
            }
            
            validUsers.push(user);
            return true;
          });
          
          // Save updated data
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          
          var blue67;
          blue67 = validUsers.sort((a, b) => (a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg) ? 0 : -1);
          var menc;
          menc = [];
          let blad;
          blad = `*🏆 Rank dos ${blue67.length < 10 ? blue67.length : 10} mais ativos do grupo:*\n`;
          for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
            if (blue67[i6].id) {
              if (i6 != null) {
                blad += `\n*🏅 ${i6 + 1}º Lugar:* @${getUserName(blue67[i6].id)}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
              }
              if (!groupData.mark) {
                groupData.mark = {};
              }
              if (!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
                menc.push(blue67[i6].id);
              }
              ;
            }
          }
          ;
          await bender.sendMessage(from, {
            text: blad,
            mentions: menc
          }, {
            quoted: info
          });
        } catch (e) {
          console.error('[RANKATIVO] Erro:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'rankinativos':
      case 'rankinativo':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          
          // Verify current group members first
          let currentMembers = AllgroupMembers;
          let validUsers = [];
          
          // Filter out users who have left the group
          groupData.contador = groupData.contador.filter(user => {
            const userId = user.id;
            const isValidMember = currentMembers.includes(userId);
            
            if (!isValidMember) {
              console.log(`[RANKINATIVO] Removed departed user: ${userId} (${getUserName(userId)})`);
              return false;
            }
            
            validUsers.push(user);
            return true;
          });
          
          // Save updated data
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          
          var blue67;
          blue67 = validUsers.sort((a, b) => {
            const totalA = (a.figu ?? 0) + a.msg + a.cmd;
            const totalB = (b.figu ?? 0) + b.msg + b.cmd;
            return totalA - totalB;
          });
          var menc;
          menc = [];
          var blad;
          blad = `*🗑️ Rank dos ${blue67.length < 10 ? blue67.length : 10} mais inativos do grupo:*\n`;
          for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
            var i6;
            if (i6 != null) {
              var blad;
              blad += `\n*🏅 ${i6 + 1}º Lugar:* @${getUserName(blue67[i6].id)}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
            }
            if (!groupData.mark) {
              groupData.mark = {};
            }
            if (!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
              menc.push(blue67[i6].id);
            }
            ;
          }
          ;
          await bender.sendMessage(from, {
            text: blad,
            mentions: menc
          }, {
            quoted: info
          });
        } catch (e) {
          console.error('[RANKINATIVO] Erro:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'totalcmd':
      case 'totalcomando':
        try {
          fs.readFile(__dirname + '/index.js', 'utf8', async (err, data) => {
            if (err) throw err;
            const comandos = [...data.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
            await bender.sendMessage(from, {
              image: {
                url: `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(comandos.length)}&theme=miku`
              },
              caption: `╭〔 🤖 *Meus Comandos* 〕╮\n` + `┣ 📌 Total: *${comandos.length}* comandos\n` + `╰━━━━━━━━━━━━━━━╯`
            }, {
              quoted: info
            });
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'meustatus':
        try {
          let groupMessages = 0;
          let groupCommands = 0;
          let groupStickers = 0;
          if (isGroup && groupData.contador && Array.isArray(groupData.contador)) {
            const userData = groupData.contador.find(u => u.id === sender);
            if (userData) {
              groupMessages = userData.msg || 0;
              groupCommands = userData.cmd || 0;
              groupStickers = userData.figu || 0;
            }
            ;
          }
          ;
          let totalMessages = 0;
          let totalCommands = 0;
          let totalStickers = 0;
          const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
          for (const file of groupFiles) {
            try {
              const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
              if (groupData.contador && Array.isArray(groupData.contador)) {
                const userData = groupData.contador.find(u => u.id === sender);
                if (userData) {
                  totalMessages += userData.msg || 0;
                  totalCommands += userData.cmd || 0;
                  totalStickers += userData.figu || 0;
                }
                ;
              }
              ;
            } catch (e) {
              console.error(`Erro ao ler ${file}:`, e);
            }
            ;
          }
          ;
          const userName = pushname || getUserName(sender);
          const userStatus = isOwner ? 'Dono' : isPremium ? 'Premium' : isGroupAdmin ? 'Admin' : 'Membro';
          let profilePic = null;
          try {
            profilePic = await bender.profilePictureUrl(sender, 'image');
          } catch (e) {}
          ;
          const statusMessage = `📊 *Meu Status - ${userName}* 📊\n\n👤 *Nome*: ${userName}\n📱 *Número*: @${getUserName(sender)}\n⭐ *Status*: ${userStatus}\n\n${isGroup ? `\n📌 *No Grupo: ${groupName}*\n💬 Mensagens: ${groupMessages}\n⚒️ Comandos: ${groupCommands}\n🎨 Figurinhas: ${groupStickers}\n` : ''}\n\n🌐 *Geral (Todos os Grupos)*\n💬 Mensagens: ${totalMessages}\n⚒️ Comandos: ${totalCommands}\n🎨 Figurinhas: ${totalStickers}\n\n✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
          if (profilePic) {
            await bender.sendMessage(from, {
              image: {
                url: profilePic
              },
              caption: statusMessage,
              mentions: [sender]
            }, {
              quoted: info
            });
          } else {
            await bender.sendMessage(from, {
              text: statusMessage,
              mentions: [sender]
            }, {
              quoted: info
            });
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'infoserver':
        if (!isOwner) {
          await reply('🚫 *Ops! Você não tem permissão!* 😅\n\n🌸 *Este comando é só para o dono*\nInformações do servidor são confidenciais! ✨');
          break;
        }
        const serverUptime = process.uptime();
        const serverUptimeFormatted = formatUptime(serverUptime, true);
        const serverMemUsage = process.memoryUsage();
        const serverMemUsed = (serverMemUsage.heapUsed / 1024 / 1024).toFixed(2);
        const serverMemTotal = (serverMemUsage.heapTotal / 1024 / 1024).toFixed(2);
        const serverMemRss = (serverMemUsage.rss / 1024 / 1024).toFixed(2);
        const serverMemExternal = (serverMemUsage.external / 1024 / 1024).toFixed(2);
        const serverCpuUsage = process.cpuUsage();
        const serverCpuUser = (serverCpuUsage.user / 1000000).toFixed(2);
        const serverCpuSystem = (serverCpuUsage.system / 1000000).toFixed(2);
        const serverOsInfo = {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          hostname: os.hostname(),
          type: os.type(),
          endianness: os.endianness()
        };
        const serverFreeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const serverTotalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const serverLoadAvg = os.loadavg();
        const serverCpuCount = os.cpus().length;
        const serverCpuModel = os.cpus()[0]?.model || 'Desconhecido';
        const serverNetworkInterfaces = os.networkInterfaces();
        const serverInterfaces = Object.keys(serverNetworkInterfaces).length;
        const currentServerTime = new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const nodeVersion = process.version;
        const osUptime = (os.uptime() / 3600).toFixed(2);
        let networkDetails = '';
        for (const [name, interfaces] of Object.entries(serverNetworkInterfaces)) {
          interfaces.forEach(iface => {
            networkDetails += `├ ${name} (${iface.family}): ${iface.address}\n`;
          });
        }
        let diskInfo = {
          totalGb: 0,
          freeGb: 0,
          usedGb: 0,
          percentUsed: 0
        };
        try {
          diskInfo = await getDiskSpaceInfo();
        } catch (error) {
          console.error('Erro ao obter informações de disco:', error);
        }
        const diskFree = diskInfo.freeGb;
        const diskTotal = diskInfo.totalGb;
        const diskUsed = diskInfo.usedGb;
        const diskUsagePercent = diskInfo.percentUsed;
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 1000));
        const endUsage = process.cpuUsage(startUsage);
        const cpuPercent = ((endUsage.user + endUsage.system) / 10000).toFixed(1);
        const startTime = Date.now();
        const endTime = Date.now();
        const latency = endTime - startTime;
        let networkLatency = 'N/A';
        try {
          const startNetworkTest = Date.now();
          await new Promise((resolve, reject) => {
            const req = https.get('https://www.google.com', res => {
              res.on('data', () => {});
              res.on('end', () => resolve());
            });
            req.on('error', err => reject(err));
            req.setTimeout(5000, () => reject(new Error('Timeout')));
          });
          const endNetworkTest = Date.now();
          networkLatency = `${endNetworkTest - startNetworkTest}ms`;
        } catch (error) {
          networkLatency = 'Erro ao testar';
          console.error('Erro ao testar latência de rede:', error);
        }
        let infoServerMessage = `🌸 ═════════════════════ 🌸\n`;
        
        infoServerMessage += `    *INFORMAÇÕES DO SERVIDOR*\n`;
        
        infoServerMessage += `🌸 ═════════════════════ 🌸\n\n`;
        
        infoServerMessage += `🖥️ *Sistema Operacional:* 🏠\n`;
        
        infoServerMessage += `├ 🟢 Node.js: ${nodeVersion}\n`;
        
        infoServerMessage += `├ 💻 Plataforma: ${serverOsInfo.platform}\n`;
        
        infoServerMessage += `├ 🏗️ Arquitetura: ${serverOsInfo.arch}\n`;
        
        infoServerMessage += `├ 🔧 Tipo: ${serverOsInfo.type}\n`;
        
        infoServerMessage += `├ 📋 Release: ${serverOsInfo.release}\n`;
        
        infoServerMessage += `├ 🏷️ Hostname: ${serverOsInfo.hostname}\n`;
        
        infoServerMessage += `├ 🔄 Endianness: ${serverOsInfo.endianness}\n`;
        
        infoServerMessage += `├ ⏳ Sistema online há: ${osUptime} horas\n`;
        
        infoServerMessage += `└ 📅 Hora atual: ${currentServerTime}\n\n`;
        
        infoServerMessage += `⚡ *Processador (CPU):* 🧠\n`;
        
        infoServerMessage += `├ 🔢 Núcleos: ${serverCpuCount}\n`;
        
        infoServerMessage += `├ 🏷️ Modelo: ${serverCpuModel}\n`;
        
        infoServerMessage += `├ 👤 Tempo usuário: ${serverCpuUser}s\n`;
        
        infoServerMessage += `├ ⚙️ Tempo sistema: ${serverCpuSystem}s\n`;
        
        infoServerMessage += `├ 📈 Uso CPU atual: ${cpuPercent}%\n`;
        
        infoServerMessage += `├ 📊 Load 1min: ${serverLoadAvg[0].toFixed(2)}\n`;
        
        infoServerMessage += `├ 📈 Load 5min: ${serverLoadAvg[1].toFixed(2)}\n`;
        
        infoServerMessage += `└ 📉 Load 15min: ${serverLoadAvg[2].toFixed(2)}\n\n`;
        const memoryUsagePercent = ((serverTotalMemory - serverFreeMemory) / serverTotalMemory * 100).toFixed(1);
        const memoryEmoji = memoryUsagePercent > 80 ? '⚠️' : '✅';
        const memoryBar = '█'.repeat(memoryUsagePercent / 10) + '-'.repeat(10 - memoryUsagePercent / 10);
        
        infoServerMessage += `💾 *Memória do Sistema:* 🧠\n`;
        
        infoServerMessage += `├ 🆓 RAM Livre: ${serverFreeMemory} GB\n`;
        
        infoServerMessage += `├ 📊 RAM Total: ${serverTotalMemory} GB\n`;
        
        infoServerMessage += `├ 📈 RAM Usada: ${(serverTotalMemory - serverFreeMemory).toFixed(2)} GB\n`;
        
        infoServerMessage += `└ ${memoryEmoji} Uso: [${memoryBar}] ${memoryUsagePercent}%\n\n`;
        const botMemoryUsagePercent = (serverMemUsed / serverMemTotal * 100).toFixed(1);
        const botMemoryEmoji = botMemoryUsagePercent > 80 ? '⚠️' : '✅';
        const botMemoryBar = '█'.repeat(botMemoryUsagePercent / 10) + '-'.repeat(10 - botMemoryUsagePercent / 10);
        
        infoServerMessage += `🤖 *Memória da ${nomebot}:* 💖\n`;
        
        infoServerMessage += `├ 🧠 Heap Usado: ${serverMemUsed} MB\n`;
        
        infoServerMessage += `├ 📦 Heap Total: ${serverMemTotal} MB\n`;
        
        infoServerMessage += `├ 🏠 RSS: ${serverMemRss} MB\n`;
        
        infoServerMessage += `├ 🔗 Externo: ${serverMemExternal} MB\n`;
        
        infoServerMessage += `└ ${botMemoryEmoji} Eficiência: [${botMemoryBar}] ${botMemoryUsagePercent}%\n\n`;
        
        infoServerMessage += `🌐 *Rede e Conectividade:* 🔗\n`;
        
        infoServerMessage += `├ 🔌 Interfaces: ${serverInterfaces}\n`;
        
        infoServerMessage += networkDetails;
        
        infoServerMessage += `├ 📡 Status: Online\n`;
        
        infoServerMessage += `├ ⏱️ Latência de Rede: ${networkLatency}\n`;
        
        infoServerMessage += `└ 🛡️ Firewall: Ativo\n\n`;
        const diskEmoji = diskUsagePercent > 80 ? '⚠️' : '✅';
        const diskBar = '█'.repeat(diskUsagePercent / 10) + '-'.repeat(10 - diskUsagePercent / 10);
        
        infoServerMessage += `💽 *Armazenamento:* 💿\n`;
        
        infoServerMessage += `├ 🆓 Livre: ${diskFree} GB\n`;
        
        infoServerMessage += `├ 📊 Total: ${diskTotal} GB\n`;
        
        infoServerMessage += `├ 📈 Usado: ${diskUsed} GB\n`;
        
        infoServerMessage += `└ ${diskEmoji} Uso: [${diskBar}] ${diskUsagePercent}%\n\n`;
        
        infoServerMessage += `⏰ *Tempo e Latência:* 🕐\n`;
        
        infoServerMessage += `├ ⏱️ Latência do Bot: ${latency}ms\n`;
        
        infoServerMessage += `└ 🚀 Bot online há: ${serverUptimeFormatted}\n`;
        await reply(infoServerMessage);
        break;
      case 'statusbot':
      case 'infobot':
      case 'botinfo':
        try {
          const botUptime = formatUptime(process.uptime(), true);
          const botMemUsage = process.memoryUsage();
          const memUsed = (botMemUsage.heapUsed / 1024 / 1024).toFixed(2);
          const memTotal = (botMemUsage.heapTotal / 1024 / 1024).toFixed(2);
          const allGroups = await bender.groupFetchAllParticipating();
          const totalGroups = Object.keys(allGroups).length;
          let totalUsers = 0;
          Object.values(allGroups).forEach(group => {
            totalUsers += group.participants.length;
          });
          const botStatus = botState.status === 'on' ? '✅ Online' : '❌ Offline';
          const rentalMode = isRentalModeActive() ? '✅ Ativo' : '❌ Desativo';
          const nodeVersion = process.version;
          const platform = os.platform();
          let totalCommands = 0;
          try {
            const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
            const comandos = [...indexContent.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
            totalCommands = comandos.length;
          } catch (e) {
            totalCommands = 'N/A';
          }
          const premiumUsers = Object.keys(premiumListaZinha).filter(key => isUserId(key)).length;
          const premiumGroups = Object.keys(premiumListaZinha).filter(key => key.includes('@g.us')).length;
          const blockedUsers = Object.keys(globalBlocks.users || {}).length;
          const blockedCommands = Object.keys(globalBlocks.commands || {}).length;
          const currentTime = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          });
          const lines = ["╭───🤖 STATUS DO BOT ───╮", `┊ 🏷️ Nome: ${nomebot}`, `┊ 👨‍💻 Dono: ${nomedono}`, `┊ 🆚 Versão: ${botVersion}`, `┊ 🟢 Status: ${botStatus}`, `┊ ⏰ Online há: ${botUptime}`, `┊ 🖥️ Plataforma: ${platform}`, `┊ 🟢 Node.js: ${nodeVersion}`, "┊", "┊ 📊 *Estatísticas:*", `┊ • 👥 Grupos: ${totalGroups}`, `┊ • 👤 Usuários: ${totalUsers}`, `┊ • ⚒️ Comandos: ${totalCommands}`, `┊ • 💎 Users Premium: ${premiumUsers}`, `┊ • 💎 Grupos Premium: ${premiumGroups}`, "┊", "┊ 🛡️ *Segurança:*", `┊ • 🚫 Users Bloqueados: ${blockedUsers}`, `┊ • 🚫 Cmds Bloqueados: ${blockedCommands}`, `┊ • 🏠 Modo Aluguel: ${rentalMode}`, "┊", "┊ 💾 *Sistema:*", `┊ • 🧠 RAM Usada: ${memUsed}MB`, `┊ • 📦 RAM Total: ${memTotal}MB`, `┊ • 🕐 Hora Atual: ${currentTime}`, "╰───────────────╯"].join("\n");
          await reply(lines);
        } catch (e) {
          console.error("Erro em statusbot:", e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'iastatus':
      case 'apikeyinfo':
      case 'statusia':
        if (!isOwnerOrSub) return reply("🚫 Apenas donos e subdonos podem verificar o status da API key!");
        try {
          const apiStatus = ia.getApiKeyStatus();
          const historicoStats = ia.getHistoricoStats();
          
          let statusEmoji = '✅';
          let statusText = 'Válida e funcionando';
          let statusColor = '🟢';
          
          if (!apiStatus.isValid) {
            statusEmoji = '❌';
            statusText = 'Inválida ou com problemas';
            statusColor = '🔴';
          }
          
          const lastCheckTime = new Date(apiStatus.lastCheck).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const keyPreview = KeyCog ? `${KeyCog.substring(0, 8)}...` : 'Não configurada';
          
          const statusMessage = [
            "╭───🔑 STATUS API COGNIMA ───╮",
            `┊ ${statusColor} Status: ${statusEmoji} ${statusText}`,
            `┊ 🗝️ Key: ${keyPreview}`,
            `┊ 🕐 Última verificação: ${lastCheckTime}`,
            apiStatus.lastError ? `┊ ⚠️ Último erro: ${apiStatus.lastError}` : '',
            `┊ 📧 Notificação enviada: ${apiStatus.notificationSent ? 'Sim' : 'Não'}`,
            "┊",
            "┊ 📊 *Estatísticas do Assistente:*",
            `┊ • 💬 Conversas ativas: ${historicoStats.conversasAtivas}`,
            `┊ • 📈 Total conversas: ${historicoStats.totalConversas}`,
            `┊ • 💭 Total mensagens: ${historicoStats.totalMensagens}`,
            "┊",
            "┊ 🛠️ *Comandos úteis:*",
            `┊ • ${prefix}iarecovery - Forçar reset da API`,
            `┊ • ${prefix}iaclear - Limpar histórico antigo`,
            "╰─────────────────╯"
          ].filter(line => line !== '').join('\n');
          
          await reply(statusMessage);
        } catch (e) {
          console.error("Erro em iastatus:", e);
          await reply("❌ Erro ao verificar status da API key.");
        }
        break;
      case 'iarecovery':
      case 'resetapikey':
        if (!isOwnerOrSub) return reply("🚫 Apenas donos e subdonos podem fazer reset da API key!");
        try {
          ia.updateApiKeyStatus();
          await reply("✅ *Reset da API key realizado!*\n\n🔄 O sistema de IA foi reativado e irá tentar usar a API key novamente.\n\n⚠️ Certifique-se de que a key no config.json está correta e válida!");
        } catch (e) {
          console.error("Erro em iarecovery:", e);
          await reply("❌ Erro ao fazer reset da API key.");
        }
        break;
      case 'iaclear':
      case 'limparhist':
        if (!isOwnerOrSub) return reply("🚫 Apenas donos e subdonos podem limpar o histórico!");
        try {
          ia.clearOldHistorico(0);
          await reply("✅ *Histórico do assistente limpo!*\n\n🗑️ Todas as conversas antigas foram removidas da memória.");
        } catch (e) {
          console.error("Erro em iaclear:", e);
          await reply("❌ Erro ao limpar histórico.");
        }
        break;
      case 'topcmd':
      case 'topcmds':
      case 'comandosmaisusados':
        try {
          const topCommands = await commandStats.getMostUsedCommands(10);
          const menuVideoPath = __dirname + '/../midias/menu.mp4';
          const menuImagePath = __dirname + '/../midias/menu.png';
          const useVideo = fs.existsSync(menuVideoPath);
          const mediaPath = useVideo ? menuVideoPath : menuImagePath;
          const mediaBuffer = fs.readFileSync(mediaPath);
          const menuText = await menuTopCmd(prefix, nomebot, pushname, topCommands);
          await bender.sendMessage(from, {
            [useVideo ? 'video' : 'image']: mediaBuffer,
            caption: menuText,
            gifPlayback: useVideo,
            mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'cmdinfo':
      case 'comandoinfo':
        try {
          if (!q) return reply(`📊 *Estatísticas de Comandos*\n\n📝 *Como usar:*\n• Especifique o comando após o comando\n• Ex: ${prefix}cmdinfo menu\n• Ex: ${prefix}cmdinfo ping\n\n📈 Visualize estatísticas detalhadas de uso do comando!`);
          const cmdName = q.startsWith(prefix) ? q.slice(prefix.length) : q;
          const stats = await commandStats.getCommandStats(cmdName);
          if (!stats) {
            return reply(`❌ Comando *${cmdName}* não encontrado ou nunca foi usado.`);
          }
          const topUsersText = stats.topUsers.length > 0 ? stats.topUsers.map((user, index) => {
            return `${index + 1}º @${getUserName(user.userId)} - ${user.count} usos`;
          }).join('\n') : 'Nenhum usuário registrado';
          const lastUsed = new Date(stats.lastUsed).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const infoMessage = `📊 *Estatísticas do Comando: ${prefix}${stats.name}* 📊\n\n` + `📈 *Total de Usos*: ${stats.count}\n` + `👥 *Usuários Únicos*: ${stats.uniqueUsers}\n` + `🕒 *Último Uso*: ${lastUsed}\n\n` + `🏆 *Top Usuários*:\n${topUsersText}\n\n` + `✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
          await bender.sendMessage(from, {
            text: infoMessage,
            mentions: stats.topUsers.map(u => u.userId)
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'statusgp':
      case 'dadosgp':
        try {
          if (!isGroup) return reply("❌ Este comando só funciona em grupos!");
          const meta = await getCachedGroupMetadata(from);
          const subject = meta.subject || "—";
          const desc = meta.desc?.toString() || "Sem descrição";
          const createdAt = meta.creation ? new Date(meta.creation * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : "Desconhecida";
          const ownerJid = meta.owner || meta.participants.find(p => p.admin && p.isCreator)?.lid || meta.participants.find(p => p.admin && p.isCreator)?.id || buildUserId("unknown");
          const ownerTag = `@${getUserName(ownerJid)}`;
          const totalMembers = meta.participants.length;
          const totalAdmins = groupAdmins.length;
          let totalMsgs = 0,
            totalCmds = 0,
            totalFigs = 0;
          (groupData.contador || []).forEach(u => {
            totalMsgs += u.msg || 0;
            totalCmds += u.cmd || 0;
            totalFigs += u.figu || 0;
          });
          const rentGlob = isRentalModeActive();
          const rentInfo = getGroupRentalStatus(from);
          const rentStatus = rentGlob ? rentInfo.active ? `✅ Ativo até ${rentInfo.permanent ? 'Permanente' : new Date(rentInfo.expiresAt).toLocaleDateString('pt-BR')}` : "❌ Expirado" : "❌ Desativado";
          const isPremGp = !!premiumListaZinha[from] ? "✅" : "❌";
          const secFlags = [
            ["Antiporn", !!isAntiPorn],
            ["AntiLink", !!isAntiLinkGp],
            ["AntiLinkHard", !!groupData.antilinkhard],
            ["AntiDoc", !!groupData.antidoc],
            ["AntiLoc", !!groupData.antiloc],
            ["AntiBtn", !!groupData.antibtn],
            ["AntiStatus", !!groupData.antistatus],
            ["AntiDelete", !!groupData.antidel],
            ["AntiSticker", !!(groupData.antifig && groupData.antifig.enabled)],
          ];
          const resFlags = [
            ["AutoDL", !!groupData.autodl],
            ["AutoSticker", !!groupData.autoSticker],
            ["Assistente", !!groupData.assistente],
            ["AutoRepo", !!groupData.autorepo],
            ["Leveling", !!groupData.levelingEnabled],
            ["Bem-vindo", !!groupData.bemvindo],
            ["X9 (promo/rebaix)", !!groupData.x9],
            ["Modo Lite", !!isModoLite],
            ["Modo Brincadeira", !!isModoBn],
            ["Modo Gold", !!groupData.modogold]
          ];
          const admFlags = [["Só Admins", !!groupData.soadm]];
          const toLines = (pairs) => pairs.filter(([_, v]) => typeof v === 'boolean').map(([k, v]) => `┊   ${v ? '✅' : '❌'} ${k}`);
          const configsSection = [
            "┊",
            "┊ ⚙️ *Configurações:*",
            "┊ 🔒 Segurança:",
            ...toLines(secFlags),
            "┊ 🧰 Recursos:",
            ...toLines(resFlags),
            "┊ 🛠️ Administração:",
            ...toLines(admFlags)
          ].join('\n');
          const schedule = groupData.schedule || {};
          const openTime = schedule.openTime ? schedule.openTime : '—';
          const closeTime = schedule.closeTime ? schedule.closeTime : '—';
          const lastOpen = schedule.lastRun?.open ? schedule.lastRun.open : '—';
          const lastClose = schedule.lastRun?.close ? schedule.lastRun.close : '—';
          const linesHeader = [
            "╭───📊 STATUS DO GRUPO ───╮",
            `┊ 📝 Nome: ${subject}`,
            `┊ 🆔 ID: ${getUserName(from)}`,
            `┊ 👑 Dono: ${ownerTag}`,
            `┊ 📅 Criado: ${createdAt}`,
            `┊ 📄 Desc: ${desc.slice(0, 35)}${desc.length > 35 ? '...' : ''}`,
            `┊ 👥 Membros: ${totalMembers}`,
            `┊ 👮 Admins: ${totalAdmins}`,
            `┊ 💎 Premium: ${isPremGp}`,
            `┊ 🏠 Aluguel: ${rentStatus}`,
            "┊",
            "┊ 📊 *Estatísticas:*",
            `┊ • 💬 Mensagens: ${totalMsgs}`,
            `┊ • ⚒️ Comandos: ${totalCmds}`,
            `┊ • 🎨 Figurinhas: ${totalFigs}`,
            "╰───────────────╯"
          ].join('\n');
          const extrasLines = [
            "\n╭───📌 REGRAS E OUTROS ───╮",
            `┊ 🧩 Prefixo: ${groupPrefix}`,
            `┊ 🧱 Min Legenda: ${groupData.minMessage ? `✅ ON (min ${groupData.minMessage.minDigits}, ação: ${groupData.minMessage.action})` : '❌ OFF'}`,
            `┊ 📉 Limite Msg: ${groupData.messageLimit?.enabled ? `✅ ON (${groupData.messageLimit.limit}/${groupData.messageLimit.interval}s, ação: ${groupData.messageLimit.action})` : '❌ OFF'}`,
            `┊ 🤝 Parcerias: ${parceriasData?.active ? `✅ ON (${Object.keys(parceriasData.partners||{}).length} parceiros)` : '❌ OFF'}`,
            `┊ ⛔ Cmds bloqueados: ${groupData.blockedCommands ? Object.values(groupData.blockedCommands).filter(Boolean).length : 0}`,
            `┊ 🚫 Usuários bloqueados: ${groupData.blockedUsers ? Object.keys(groupData.blockedUsers).length : 0}`,
            `┊ 😴 AFKs ativos: ${groupData.afkUsers ? Object.keys(groupData.afkUsers).length : 0}`,
            `┊ 🧑‍⚖️ Moderadores: ${Array.isArray(groupData.moderators) ? groupData.moderators.length : 0}`,
            "╰───────────────╯"
          ].join('\n');
          const lines = [linesHeader, configsSection].join('\n');
          const schedLines = [
            "\n╭───⏰ AGENDAMENTOS ───╮",
            `┊ 🔓 Abrir: ${openTime}`,
            `┊ 🔒 Fechar: ${closeTime}`,
            `┊ 🗓️ Últ. abrir: ${lastOpen}`,
            `┊ 🗓️ Últ. fechar: ${lastClose}`,
            "╰───────────────╯"
          ].join('\n');
          const fullCaption = (lines + schedLines + '\n' + extrasLines).trim();

          let groupPic = '';
          try {
            groupPic = await bender.profilePictureUrl(from, 'image');
          } catch {
            groupPic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1753966446765_oordgn.bin';
          }
          let bgImg = '';
          try {
            bgImg = '';
          } catch {}
          let statusBanner = null;
          try {
            statusBanner = await banner.StatusGrupo(
              bgImg,
              groupPic,
              {
                subject,
                groupId: getUserName(from),
                ownerTag,
                createdAt,
                desc,
                totalMembers,
                totalAdmins,
                isPremium: !!premiumListaZinha[from],
                rentStatus,
                totalMsgs,
                totalCmds,
                totalFigs
              }
            );
          } catch (e) {
            console.error('Erro ao gerar banner StatusGrupo:', e);
          }

          if (statusBanner) {
            await bender.sendMessage(from, { image: statusBanner, caption: fullCaption, mentions: [ownerJid] }, { quoted: info });
          } else {
            await reply(fullCaption, { mentions: [ownerJid] });
          }
        } catch (e) {
          console.error("Erro em statusgp:", e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'dono':
        try {
          const TextinDonoInfo = `╭⊰ 🌸 『 *INFORMAÇÕES DONO* 』\n┊\n┊👤 *Dono*: ${nomedono}\n┊📱 *Número Dono*: wa.me/${numerodono.replace(/\D/g, '')}\n┊\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;
          await reply(TextinDonoInfo);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;

      case 'criador':
        try {
          const TextinCriadorInfo = `╭⊰ 🌸 『 *INFORMAÇÕES DO CRIADOR* 』\n┊\n┊👨‍💻 *Criador*: @ataliasloami\n┊📱 *Número*: wa.me/559984691168\n┊🌐 *GitHub*: github.com/AtaliasOliveira1\n┊📸 *Instagram*: instagram.com/ataliasloami\n┊\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;
          await reply(TextinCriadorInfo);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'ping':
        try {
          const timestamp = Date.now();
          const speedConverted = (timestamp - info.messageTimestamp * 1000) / 1000;
          const uptimeBot = formatUptime(process.uptime());
          let statusEmoji = '🟢';
          let statusTexto = 'Excelente';
          if (speedConverted > 2) {
            statusEmoji = '🟡';
            statusTexto = 'Bom';
          }
          if (speedConverted > 5) {
            statusEmoji = '🟠';
            statusTexto = 'Médio';
          }
          if (speedConverted > 8) {
            statusEmoji = '🔴';
            statusTexto = 'Ruim';
          }
          
          const mensagem = `╭─「 ⚡ *STATUS* ⚡ 」
┊
┊ 📡 *Conexão*
┊ ├─ ${statusEmoji} Latência: *${speedConverted.toFixed(3)}s*
┊ └─ 📊 Status: *${statusTexto}*
┊
┊ ⏱️ *Tempo Online*
┊ └─ 🟢 Uptime: *${uptimeBot}*
┊
╰─「 ${nomebot} 」`;
          
          await reply(mensagem);
        } catch (e) {
          console.error("Erro no comando ping:", e);
          await reply("❌ Ocorreu um erro ao processar o comando ping");
        }
        ;
        break;
      case 'toimg':
        if (!isQuotedSticker) return reply('Por favor, *mencione um sticker* para executar o comando.');
        try {
          var buff;
          buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
          await bender.sendMessage(from, {
            image: buff
          }, {
            quoted: info
          });
        } catch (error) {
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'qc':
        try {
          if (!q) return reply('Falta o texto.');
          let ppimg = "";
          try {
            ppimg = await bender.profilePictureUrl(sender, 'image');
          } catch {
            ppimg = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg';
          }
          ;
          const json = {
            "type": "quote",
            "format": "png",
            "backgroundColor": "#FFFFFF",
            "width": 512,
            "height": 768,
            "scale": 2,
            "messages": [{
              "entities": [],
              "avatar": true,
              "from": {
                "id": 1,
                "name": pushname,
                "photo": {
                  "url": ppimg
                }
              },
              "text": q,
              "replyMessage": {}
            }]
          };
          var res;
          res = await axios.post('https://bot.lyo.su/quote/generate', json, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          await sendSticker(bender, from, {
            sticker: Buffer.from(res.data.result.image, 'base64'),
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: 'image'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'emojimix':
        try {
          var emoji1;
          emoji1 = q.split(`/`)[0];
          var emoji2;
          emoji2 = q.split(`/`)[1];
          if (!q || !emoji1 || !emoji2) return reply(`Formato errado, utilize:\n${prefix}${command} emoji1/emoji2\nEx: ${prefix}${command} 🤓/🙄`);
          var datzc;
          datzc = await emojiMix(emoji1, emoji2);
          await sendSticker(bender, from, {
            sticker: {
              url: datzc
            },
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: 'image'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'ttp':
        try {
          if (!q) return reply('Cadê o texto?');
          var cor;
          cor = ["f702ff", "ff0202", "00ff2e", "efff00", "00ecff", "3100ff", "ffb400", "ff00b0", "00ff95", "efff00"];
          var fonte;
          fonte = ["Days%20One", "Domine", "Exo", "Fredoka%20One", "Gentium%20Basic", "Gloria%20Hallelujah", "Great%20Vibes", "Orbitron", "PT%20Serif", "Pacifico"];
          var cores;
          cores = cor[Math.floor(Math.random() * cor.length)];
          var fontes;
          fontes = fonte[Math.floor(Math.random() * fonte.length)];
          await sendSticker(bender, from, {
            sticker: {
              url: `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${q}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cores}&text.0.font.family=${fontes}&text.0.background.color=ff0000`
            },
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: 'image'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'brat':
        try {
          if (!q) return reply('falta o texto');
          await sendSticker(bender, from, {
            sticker: {
              url: `https://api.cognima.com.br/api/image/brat?key=CognimaTeamFreeKey&texto=${encodeURIComponent(q)}`
            },
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: 'image'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
        }
        ;
        break;
      case 'st':
      case 'stk':
      case 'sticker':
      
      case 'st':case 'stk':case 'sticker':case 's': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    //await sendSticker(bender, from, { sticker: buffer, author: `✦ ${nomedono} ✦\n● https://info.loami.shop - ${day} ●`, packname: `👤 Usuario(a): ➔ ${pushname}\n🤖 Bot ➔ ${nomebot}\n👑 Dono: ➔`, type: isVideo2 ? 'video' : 'image'}, { quoted: info });
    await sendSticker(bender, from, { sticker: buffer, author: `${figautor2}`, packname: `${figpackname2}`, type: isVideo2 ? 'video' : 'image', forceSquare: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("⚠️ Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! ⚠️");
  };
  break

      case 'st2':
      case 'stk2':
      case 'sticker2':
      case 's2':
        try {
          var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
          var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
          if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
          var isVideo2 = !!boij;
          if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
          var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
          await sendSticker(bender, from, {
            sticker: buffer,
            author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`,
            packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫',
            type: isVideo2 ? 'video' : 'image'
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'figualeatoria':
      case 'randomsticker':
        try {
          await bender.sendMessage(from, {
            sticker: {
              url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp`
            }
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
        
case 'atalias':
    // Se a cobrança FALHAR (retornar false), o 'if' será TRUE e a execução para.
    if (!chargeUser(50, sender)) {
        return; 
    }
    // Este código só roda se a cobrança for BEM-SUCEDIDA
    await bender.sendMessage(from, {text: "cobrou e pagou 50"});
    break;

case 'atalias2':
    // Se a cobrança FALHAR (retornar false), o 'if' será TRUE e a execução para.
    if (!chargeUser(100000, sender)) {
        return;
    }
    // Este código só roda se a cobrança for BEM-SUCEDIDA
    await bender.sendMessage(from, {text: "cobrou e pagou 100000"});
    break;
      
 case 'rename':
if (!chargeUser(50, sender)) {
        return; 
    }
    try {
        if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');

        // 1. Sua lógica de leitura original, que funciona:
        var author = q.split(`/`)[0]?.trim(); 
        var packname = q.split(`/`)[1]?.trim(); 

        // 2. Sua lógica de validação original (reforçada com trim):
        if (!author || !packname) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/@ataliasloami`);

        // 4. Continuação do comando de renomear
        var encmediats;
        encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
        
        await sendSticker(bender, from, {
            sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
            author: packname, // Note que author e packname estão invertidos, mas é assim que o seu bot funciona!
            packname: author,
            rename: true
        }, {
            quoted: info
        });

    } catch (e) {
        console.error(e);
        await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. O Gold foi cobrado, mas não consegui enviar a figurinha. Tente de novo, por favor! 🥺");
    }
    break;

      case 'rgtake':
        try {
          const [author, pack] = q.split('/');
          if (!q || !author || !pack) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/@ataliasloami`);
          const filePath = __dirname + '/../database/users/take.json';
          const dataTake = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
          dataTake[sender] = {
            author,
            pack
          };
          fs.writeFileSync(filePath, JSON.stringify(dataTake, null, 2), 'utf-8');
          reply(`Autor e pacote salvos com sucesso!\nAutor: ${author}\nPacote: ${pack}`);
        } catch (e) {
          console.error(e);
          await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
        }
        ;
        break;

      case 'take':
        try {
          if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
          const filePath = __dirname + '/../database/users/take.json';
          if (!fs.existsSync(filePath)) return reply('Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.');
          const dataTake = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (!dataTake[sender]) return reply('Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.');
          const {
            author,
            pack
          } = dataTake[sender];
          const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
          await sendSticker(bender, from, {
            sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
            author: pack,
            packname: author,
            rename: true
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;

      case 'figurinhas':
      case 'stickerpack':
      case 'packfig':
        try {
          if (!q) return reply(`🎨 *Criador de Pack de Figurinhas*\n\n🔢 *Como usar:*\n• Escolha quantas figurinhas deseja (1-30)\n• Ex: ${prefix}figurinhas 10\n• Ex: ${prefix}figurinhas 5\n\n✨ O pack será criado com figurinhas aleatórias!`);
          
          const quantidade = parseInt(q);
          
          if (isNaN(quantidade) || quantidade < 1 || quantidade > 30) {
            return reply('❌ Número inválido! Escolha entre 1 e 30 figurinhas.');
          }
          
          await reply(`🎨 Criando pack com ${quantidade} figurinha${quantidade > 1 ? 's' : ''}...\n⏳ Aguarde um momento...`);
          
          const stickers = [];
          const usedNumbers = new Set();
          
          for (let i = 0; i < quantidade; i++) {
            let randomNum;
            do {
              randomNum = Math.floor(Math.random() * 8051);
            } while (usedNumbers.has(randomNum));
            
            usedNumbers.add(randomNum);
            
            stickers.push({
              sticker: { 
                url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp` 
              }
            });
          }
          
          const coverStickerNum = Math.floor(Math.random() * 8051);
          const coverResponse = await axios.get(`https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp`, {
            responseType: 'arraybuffer'
          });

          const coverBuffer = Buffer.from(coverResponse.data);
          
          await bender.sendMessage(from, {
            stickerPack: {
              name: `Pack Aleatório (${quantidade})`,
              publisher: `By ${nomebot}`,
              description: `Pack com ${quantidade} figurinhas aleatórias criado especialmente para você!`,
              cover: coverBuffer,
              stickers: stickers
            }
          }, {
            quoted: info
          });
          
        } catch (e) {
          console.error('Erro no comando figurinhas:', e);
          await reply("🐝 Oh não! Aconteceu um errinho ao criar o pack de figurinhas. Tente de novo daqui a pouquinho, por favor! 🥺");
        }
        break;

      case 'mention':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!q) return reply(`📢 *Configuração de Marcações*\n\n🔧 Escolha como deseja ser mencionado:\n\n✅ *${prefix}mention all* → Marcado em tudo (marcações e jogos).\n📢 *${prefix}mention marca* → Apenas em marcações de administradores.\n🎮 *${prefix}mention games* → Somente em jogos do bot.\n🚫 *${prefix}mention 0* → Não será mencionado em nenhuma ocasião.`);
          let options = {
            all: '✨ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!',
            marca: '📢 A partir de agora, você será mencionado apenas quando um administrador marcar.',
            games: '🎮 Você optou por ser mencionado somente em jogos do bot.',
            0: '🔕 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.'
          };
          if (options[q.toLowerCase()] !== undefined) {
            if (!groupData.mark) {
              groupData.mark = {};
            }
            groupData.mark[sender] = q.toLowerCase();
            fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
            return reply(`*${options[q.toLowerCase()]}*`);
          }
          reply(`❌ Opção inválida! Use *${prefix}mention* para ver as opções.`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'deletar':
      case 'delete':
      case 'del':
      case 'd':
        if (!isGroupAdmin) {
            if (!chargeUser(5000, sender)) {
        return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔\n\nou 🪙 5.000 BCOINS");}}
        if (!menc_prt) return reply("Marque uma mensagem.");
        let stanzaId, participant;
        if (info.message.extendedTextMessage) {
          stanzaId = info.message.extendedTextMessage.contextInfo.stanzaId;
          participant = info.message.extendedTextMessage.contextInfo.participant || menc_prt;
        } else if (info.message.viewOnceMessage) {
          stanzaId = info.key.id;
          participant = info.key.participant || menc_prt;
        }
        ;
        try {
          await bender.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: stanzaId,
              participant: participant
            }
          });
        } catch (error) {
          reply("ocorreu um erro 💔");
        }
        ;
        break;
      case 'blockuser':
        if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
        if (!isGroupAdmin) return reply("você precisa ser adm 💔");
        try {
          if (!menc_os2) return reply("Marque alguém 🙄");
          var reason;
          reason = q ? q.includes('@') ? q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Não informado" : q : 'Não informado';
          var menc_os3;
          menc_os3 = (menc_os2 && menc_os2.includes(' ')) ? menc_os2.split(' ')[0] : menc_os2;
          if (!menc_os3) return reply("Erro ao processar usuário mencionado");
          groupData.blockedUsers = groupData.blockedUsers || {};
          groupData.blockedUsers[menc_os3] = {
            reason,
            timestamp: Date.now()
          };
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Usuário @${getUserName(menc_os3)} bloqueado no grupo!\nMotivo: ${reason}`, {
            mentions: [menc_os3]
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'unblockuser':
        if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
        if (!isGroupAdmin) return reply("você precisa ser adm 💔");
        try {
          if (!menc_os2) return reply("Marque alguém 🙄");
          if (!groupData.blockedUsers) {
            return reply(`ℹ️ Não há usuários bloqueados neste grupo.`);
          }
          const userToUnblock = groupData.blockedUsers[menc_os2] ? menc_os2 :
                               groupData.blockedUsers[getUserName(menc_os2)] ? getUserName(menc_os2) : null;
          if (!userToUnblock) {
            return reply(`❌ O usuário @${getUserName(menc_os2)} não está bloqueado no grupo!`, {
              mentions: [menc_os2]
            });
          }
          delete groupData.blockedUsers[userToUnblock];
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Usuário @${getUserName(menc_os2)} desbloqueado no grupo!`, {
            mentions: [menc_os2]
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'listblocksgp':
      case 'blocklist':
        if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
        if (!isGroupAdmin) return reply("você precisa ser adm 💔");
        try {
          const blockedUsers = groupData.blockedUsers ? Object.entries(groupData.blockedUsers).map(([user, data]) => `👤 *${getUserName(user)}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum usuário bloqueado no grupo.';
          const message = `🔒 *Usuários Bloqueados no Grupo - ${groupName}* 🔒\n\n${blockedUsers}`;
          await reply(message);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'banir':
      case 'ban':
      case 'b':
      case 'kick':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) {
            if (!chargeUser(15000, sender)) {
        return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔\n\nou 🪙 15.000 BCOINS");}}
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          if (!menc_os2) return reply("Marque alguém 🙄");
          if (menc_os2 === nmrdn) return reply("❌ Não posso banir o dono do bot.");
          if (menc_os2 === botNumber) return reply("❌ Ops! Eu faço parte da bagunça, não dá pra me remover 💔");
          await bender.groupParticipantsUpdate(from, [menc_os2], 'remove');
          reply(`✅ Usuário banido com sucesso!${q && q.length > 0 ? '\n\nMotivo: ' + q : ''}`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'linkgp':
      case 'linkgroup':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          var linkgc;
          linkgc = await bender.groupInviteCode(from);
          await reply('https://chat.whatsapp.com/' + linkgc);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'promover':
      case 'promote':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          if (!menc_os2) return reply("Marque alguém 🙄");
          await bender.groupParticipantsUpdate(from, [menc_os2], 'promote');
          reply(`✅ Usuário promovido a administrador!`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'rebaixar':
      case 'demote':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          if (!menc_os2) return reply("Marque alguém 🙄");
          await bender.groupParticipantsUpdate(from, [menc_os2], 'demote');
          reply(`✅ Usuário rebaixado com sucesso!`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'setname':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          const newName = q.trim();
          if (!newName) return reply('❌ Digite um novo nome para o grupo.');
          await bender.groupUpdateSubject(from, newName);
          reply(`✅ Nome do grupo alterado para: *${newName}*`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'setdesc':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          const newDesc = q.trim();
          if (!newDesc) return reply('❌ Digite uma nova descrição para o grupo.');
          await bender.groupUpdateDescription(from, newDesc);
          reply(`✅ Descrição do grupo alterada!`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'marcar':
      case 'mark':
        if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
        if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
        if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
        try {
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          if (!data.mark) {
            data.mark = {};
          }
          let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
          if (!membros.length) return reply('❌ Nenhum membro para mencionar.');
          let msg = `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
          await bender.sendMessage(from, {
            text: msg + membros.map(m => `➤ @${getUserName(m)}`).join('\n'),
            mentions: membros
          });
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'grupo':
      case 'gp':
      case 'group':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          if (q.toLowerCase() === 'a' || q.toLowerCase() === 'o' || q.toLowerCase() === 'open' || q.toLowerCase() === 'abrir') {
            await bender.groupSettingUpdate(from, 'not_announcement');
            await reply('Grupo aberto.');
          } else if (q.toLowerCase() === 'f' || q.toLowerCase() === 'c' || q.toLowerCase() === 'close' || q.toLowerCase() === 'fechar') {
            await bender.groupSettingUpdate(from, 'announcement');
            await reply('Grupo fechado.');
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'opengp':
        try {
          if (!isGroup) return reply('Este comando só pode ser usado em grupos 💔');
          if (!isGroupAdmin) return reply('Apenas administradores podem usar este comando 💔');
          if (!q) return reply(`Uso: ${groupPrefix}${command} HH:MM (24h)\nExemplos: ${groupPrefix}${command} 07:00 | ${groupPrefix}${command} off`);
          const arg = q.trim().toLowerCase();
          const groupFilePath = pathz.join(GRUPOS_DIR, `${groupName}.json`);
          let data = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath, 'utf-8')) : {};
          data.schedule = data.schedule || {};
          
          // Handle disabling the schedule
          if (arg === 'off' || arg === 'desativar' || arg === 'remove' || arg === 'rm') {
            delete data.schedule.openTime;
            if (data.schedule?.lastRun) delete data.schedule.lastRun.open;
            fs.writeFileSync(groupFilePath, JSON.stringify(data, null, 2));
            return reply('✅ Agendamento diário para ABRIR o grupo foi removido.');
          }
          
          // Validate time format with enhanced validation
          const timeValidation = validateTimeFormat(arg);
          if (!timeValidation.valid) {
            return reply(`⏰ ${timeValidation.error}\nExemplo: ${prefix}opengp 07:30`);
          }
          
          // Save the schedule
          data.schedule.openTime = arg;
          fs.writeFileSync(groupFilePath, JSON.stringify(data, null, 2));
          
          let msg = `✅ Agendamento salvo! O grupo será ABERTO todos os dias às ${arg} (horário de São Paulo).`;
          if (!isBotAdmin) msg += '\n⚠️ Observação: Eu preciso ser administrador para efetivar a abertura no horário.';
          await reply(msg);
        } catch (e) {
          console.error('Erro no opengp:', e);
          await reply('Ocorreu um erro ao salvar o agendamento 💔');
        }
        break;
      case 'closegp':
        try {
          if (!isGroup) return reply('Este comando só pode ser usado em grupos 💔');
          if (!isGroupAdmin) return reply('Apenas administradores podem usar este comando 💔');
          if (!q) return reply(`Uso: ${groupPrefix}${command} HH:MM (24h)\nExemplos: ${groupPrefix}${command} 22:30 | ${groupPrefix}${command} off`);
          const arg = q.trim().toLowerCase();
          const groupFilePath = pathz.join(GRUPOS_DIR, `${groupName}.json`);
          let data = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath, 'utf-8')) : {};
          data.schedule = data.schedule || {};
          
          // Handle disabling the schedule
          if (arg === 'off' || arg === 'desativar' || arg === 'remove' || arg === 'rm') {
            delete data.schedule.closeTime;
            if (data.schedule?.lastRun) delete data.schedule.lastRun.close;
            fs.writeFileSync(groupFilePath, JSON.stringify(data, null, 2));
            return reply('✅ Agendamento diário para FECHAR o grupo foi removido.');
          }
          
          // Validate time format with enhanced validation
          const timeValidation = validateTimeFormat(arg);
          if (!timeValidation.valid) {
            return reply(`⏰ ${timeValidation.error}\nExemplo: ${prefix}closegp 22:30`);
          }
          
          // Save the schedule
          data.schedule.closeTime = arg;
          fs.writeFileSync(groupFilePath, JSON.stringify(data, null, 2));
          
          let msg = `✅ Agendamento salvo! O grupo será FECHADO todos os dias às ${arg} (horário de São Paulo).`;
          if (!isBotAdmin) msg += '\n⚠️ Observação: Eu preciso ser administrador para efetivar o fechamento no horário.';
          await reply(msg);
        } catch (e) {
          console.error('Erro no closegp:', e);
          await reply('Ocorreu um erro ao salvar o agendamento 💔');
        }
        break;
      case 'chaveamento':
        try {
          if (!isGroup) return reply("Este comando só pode ser usado em grupos 💔");
          let participantes = [];
          if (q) {
            participantes = q.split(',').map(n => n.trim()).filter(n => n);
            if (participantes.length !== 16) {
              return reply(`❌ Forneça exatamente 16 nomes! Você forneceu ${participantes.length}. Exemplo: ${prefix}${command} nome1,nome2,...,nome16`);
            }
          } else {
            return reply(`❌ Forneça exatamente 16 nomes! Você forneceu 0. Exemplo: ${prefix}${command} nome1,nome2,...,nome16`);
          }
          ;
          participantes = participantes.sort(() => Math.random() - 0.5);
          const grupo1 = participantes.slice(0, 8);
          const grupo2 = participantes.slice(8, 16);
          const confrontosGrupo1 = [[grupo1[0], grupo1[1]], [grupo1[2], grupo1[3]], [grupo1[4], grupo1[5]], [grupo1[6], grupo1[7]]];
          const confrontosGrupo2 = [[grupo2[0], grupo2[1]], [grupo2[2], grupo2[3]], [grupo2[4], grupo2[5]], [grupo2[6], grupo2[7]]];
          let mensagem = `🏆 *Chaveamento do Torneio* 🏆\n\n`;
          
          mensagem += `📌 *Grupo 1*\n`;
          grupo1.forEach((p, i) => {
            
            mensagem += `  ${i + 1}. ${p.includes('@') ? `@${getUserName(p)}` : p}\n`;
          });
          
          mensagem += `\n*Confrontos do Grupo 1*:\n`;
          confrontosGrupo1.forEach((confronto, i) => {
            const p1 = confronto[0].includes('@') ? `@${getUserName(confronto[0])}` : confronto[0];
            const p2 = confronto[1].includes('@') ? `@${getUserName(confronto[1])}` : confronto[1];
            
            mensagem += `  🥊 Partida ${i + 1}: ${p1} vs ${p2}\n`;
          });
          
          mensagem += `\n📌 *Grupo 2*\n`;
          grupo2.forEach((p, i) => {
            
            mensagem += `  ${i + 1}. ${p.includes('@') ? `@${getUserName(p)}` : p}\n`;
          });
          
          mensagem += `\n*Confrontos do Grupo 2*:\n`;
          confrontosGrupo2.forEach((confronto, i) => {
            const p1 = confronto[0].includes('@') ? `@${getUserName(confronto[0])}` : confronto[0];
            const p2 = confronto[1].includes('@') ? `@${getUserName(confronto[1])}` : confronto[1];
            
            mensagem += `  🥊 Partida ${i + 1}: ${p1} vs ${p2}\n`;
          });
          const imageA = await banner.Chaveamento("", grupo1, grupo2);
          await bender.sendMessage(from, {
            image: imageA,
            caption: mensagem
          });
        } catch (e) {
          console.error('Erro no comando chaveamento:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'sorteionum':
        try {
          if (!q) return reply(`Por favor, forneça um intervalo de números. Exemplo: ${prefix}sorteionum 1-50`);
          const [min, max] = q.split('-').map(n => parseInt(n.trim()));
          if (isNaN(min) || isNaN(max) || min >= max) return reply('❌ Intervalo inválido! Use o formato: min-max (ex.: 1-50).');
          const numeroSorteado = Math.floor(Math.random() * (max - min + 1)) + min;
          await reply(`🎲 *Sorteio de Número* 🎲\n\nNúmero sorteado: *${numeroSorteado}*`);
        } catch (e) {
          console.error('Erro no comando sorteionum:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'sorteionome':
        try {
          if (!q) return reply(`Por favor, forneça os nomes para o sorteio. Exemplo: ${prefix}sorteionome 4/nick1,nick2,nick3,... ou ${prefix}sorteionome nick1,nick2,nick3,...`);
          let numVencedores = 1;
          let numGrupos = 1;
          let nomes = [];
          if (q.includes('/')) {
            const [config, listaNomes] = q.split('/').map(s => s.trim());
            const [vencedores, grupos] = config.includes('-') ? config.split('-').map(n => parseInt(n.trim())) : [parseInt(config), 1];
            numVencedores = vencedores || 1;
            numGrupos = grupos || 1;
            nomes = listaNomes.split(',').map(n => n.trim()).filter(n => n);
          } else {
            nomes = q.split(',').map(n => n.trim()).filter(n => n);
          }
          if (nomes.length < numVencedores * numGrupos) return reply(`❌ Não há nomes suficientes! Você precisa de pelo menos ${numVencedores * numGrupos} nomes para sortear ${numVencedores} vencedor${numVencedores > 1 ? 'es' : ''}${numGrupos > 1 ? ` em ${numGrupos} grupos` : ''}.`);
          if (numVencedores < 1 || numGrupos < 1) return reply('❌ Quantidade de vencedores ou grupos inválida! Use números positivos.');
          let resultado = `🎉 *Resultado do Sorteio de Nomes* 🎉\n\n`;
          let nomesDisponiveis = [...nomes];
          if (numGrupos === 1) {
            let vencedores = [];
            for (let i = 0; i < numVencedores; i++) {
              if (nomesDisponiveis.length === 0) break;
              const indice = Math.floor(Math.random() * nomesDisponiveis.length);
              vencedores.push(nomesDisponiveis[indice]);
              nomesDisponiveis.splice(indice, 1);
            }
            resultado += vencedores.map((v, i) => `🏆 *#${i + 1}* - ${v}`).join('\n');
          } else {
            for (let g = 1; g <= numGrupos; g++) {
              resultado += `📌 *Grupo ${g}*:\n`;
              let vencedores = [];
              for (let i = 0; i < numVencedores; i++) {
                if (nomesDisponiveis.length === 0) break;
                const indice = Math.floor(Math.random() * nomesDisponiveis.length);
                vencedores.push(nomesDisponiveis[indice]);
                nomesDisponiveis.splice(indice, 1);
              }
              resultado += vencedores.map((v, i) => `  🏆 *#${i + 1}* - ${v}`).join('\n') + '\n\n';
            }
          }
          await reply(resultado);
        } catch (e) {
          console.error('Erro no comando sorteionome:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'sorteio':
        try {
          if (!isGroup) return reply("Este comando só pode ser usado em grupos 💔");
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          if (membros.length < 2) return reply('❌ Preciso de pelo menos 2 membros válidos no grupo para realizar o sorteio!');
          let numVencedores = parseInt(q) || 1;
          if (numVencedores < 1) return reply('❌ O número de vencedores deve ser maior que 0!');
          if (numVencedores > membros.length) return reply(`❌ Não há membros suficientes! O grupo tem apenas ${membros.length} membros válidos.`);
          let vencedores = [];
          let membrosDisponiveis = [...membros];
          for (let i = 0; i < numVencedores; i++) {
            if (membrosDisponiveis.length === 0) break;
            const indice = Math.floor(Math.random() * membrosDisponiveis.length);
            vencedores.push(membrosDisponiveis[indice]);
            membrosDisponiveis.splice(indice, 1);
          }
          const vencedoresText = vencedores.map((v, i) => `🏆 *#${i + 1}* - @${getUserName(v)}`).join('\n');
          await reply(`🎉 *Resultado do Sorteio* 🎉\n\n${vencedoresText}`, {
            mentions: vencedores
          });
        } catch (e) {
          console.error('Erro no comando sorteio:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'totag':
      case 'cita':
      case 'hidetag':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) {
            if (!chargeUser(10000, sender)) {
        return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔\n\nou 🪙 10.000 BCOINS");}}
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          var DFC4 = "";
          var rsm4 = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          var pink4 = isQuotedImage ? rsm4?.imageMessage : info.message?.imageMessage;
          var blue4 = isQuotedVideo ? rsm4?.videoMessage : info.message?.videoMessage;
          var purple4 = isQuotedDocument ? rsm4?.documentMessage : info.message?.documentMessage;
          var yellow4 = isQuotedDocW ? rsm4?.documentWithCaptionMessage?.message?.documentMessage : info.message?.documentWithCaptionMessage?.message?.documentMessage;
          var aud_d4 = isQuotedAudio ? rsm4.audioMessage : "";
          var figu_d4 = isQuotedSticker ? rsm4.stickerMessage : "";
          var red4 = isQuotedMsg && !aud_d4 && !figu_d4 && !pink4 && !blue4 && !purple4 && !yellow4 ? rsm4.conversation : info.message?.conversation;
          var green4 = rsm4?.extendedTextMessage?.text || info?.message?.extendedTextMessage?.text;
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          if (!data.mark) {
            data.mark = {};
          }
          var MRC_TD4 = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
          if (pink4 && !aud_d4 && !purple4) {
            var DFC4 = pink4;
            
            pink4.caption = q.length > 1 ? q : pink4.caption.replace(new RegExp(prefix + command, "gi"), ` `);

            pink4.image = {
              url: pink4.url
            };
            
            pink4.mentions = MRC_TD4;
          } else if (blue4 && !aud_d4 && !purple4) {
            var DFC4 = blue4;
            
            blue4.caption = q.length > 1 ? q.trim() : blue4.caption.replace(new RegExp(prefix + command, "gi"), ` `).trim();
            
            blue4.video = {
              url: blue4.url
            };
            
            blue4.mentions = MRC_TD4;
          } else if (red4 && !aud_d4 && !purple4) {
            var black4 = {};
            
            black4.text = red4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
            
            black4.mentions = MRC_TD4;
            var DFC4 = black4;
          } else if (!aud_d4 && !figu_d4 && green4 && !purple4) {
            var brown4 = {};
            
            brown4.text = green4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
            
            brown4.mentions = MRC_TD4;
            var DFC4 = brown4;
          } else if (purple4) {
            var DFC4 = purple4;
            
            purple4.document = {
              url: purple4.url
            };
            
            purple4.mentions = MRC_TD4;
          } else if (yellow4 && !aud_d4) {
            var DFC4 = yellow4;
            
            yellow4.caption = q.length > 1 ? q.trim() : yellow4.caption.replace(new RegExp(prefix + command, "gi"), `${pushname}\n\n`).trim();
            
            yellow4.document = {
              url: yellow4.url
            };
            
            yellow4.mentions = MRC_TD4;
          } else if (figu_d4 && !aud_d4) {
            var DFC4 = figu_d4;
            
            figu_d4.sticker = {
              url: figu_d4.url
            };
            
            figu_d4.mentions = MRC_TD4;
          } else if (aud_d4) {
            var DFC4 = aud_d4;
            
            aud_d4.audio = {
              url: aud_d4.url
            };
            
            aud_d4.mentions = MRC_TD4;
            
            aud_d4.ptt = true;
          }
          ;
          await bender.sendMessage(from, DFC4).catch(error => {});
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'antilinkhard':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          groupData.antilinkhard = !groupData.antilinkhard;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Antilinkhard ${groupData.antilinkhard ? 'ativado' : 'desativado'}! Qualquer link enviado resultará em banimento.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;

case 'setdiv':
        try {
          if (!isOwner) return reply("Apenas o dono do bot pode usar este comando.");

          if (!q) {
            const config = loadDivulgacao();
            const currentMessage = config.savedMessage || "Nenhuma mensagem salva.";
            return reply(`*Mensagem de divulgação atual:*\n${currentMessage}`);
          }

          if (saveDivulgacao({ savedMessage: q })) {
            await reply(`✅ Mensagem de divulgação salva:\n\n${q}`);
          } else {
            await reply("💔 Ocorreu um erro ao salvar a mensagem.");
          }
        } catch (e) {
          console.error('Erro no comando setdiv:', e);
          await reply("💔 Ocorreu um erro geral ao processar o comando.");
        }
        break;

case 'div':
case 'divulgar':
    try {
        if (!isGroup) return reply("Este comando só pode ser usado em grupos.");
        if (!isOwner) return reply("Apenas o dono do bot pode usar este comando.");

        const delay = 500;
        const maxCount = 50;
        const markAll = args[args.length - 1]?.toLowerCase() === 'all';
        if (markAll) args.pop();
        const count = parseInt(args.pop());
        let messageText = args.join(' ').trim();

        if (!messageText) messageText = loadDivulgacao().savedMessage;
        
        if (!messageText) return reply(`❌ Nenhuma mensagem para divulgar.`);
        if (isNaN(count) || count <= 0 || count > maxCount) return reply(`❌ Quantidade inválida.`);

        const contextInfo = markAll ? { contextInfo: { mentionedJid: AllgroupMembers } } : {};

        const processarProxima = async (index, falhas) => {
            if (index >= count) {
                if (falhas > 0) await reply(`- Falhas: ${falhas}`);
                return;
            }
            try {
                const paymentObject = {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'BRL', amount1000: '0', requestFrom: sender,
                        noteMessage: { extendedTextMessage: { text: messageText, ...contextInfo } },
                        amount: { value: '0', offset: 1000, currencyCode: 'BRL' },
                        expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
                    }
                };
                const msg = await generateWAMessageFromContent(from, paymentObject, { userJid: bender?.user?.id });
                await bender.relayMessage(from, msg.message, { messageId: msg.key.id });
            } catch (e) {
                console.error(`Falha ao enviar mensagem ${index + 1}:`, e);
                falhas++;
            }
            setTimeout(() => processarProxima(index + 1, falhas), delay);
        };

        processarProxima(0, 0);
    } catch (e) {
        console.error("Erro no comando 'divulgar':", e);
        await reply("💔 Ocorreu um erro ao iniciar a divulgação.");
    }
    break;

      case 'antibotao':
      case 'antibtn':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          groupData.antibtn = !groupData.antibtn;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Anti Botão ${groupData.antibtn ? 'ativado' : 'desativado'}!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antistatus':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");

          groupData.antistatus = !groupData.antistatus;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Anti Status ${groupData.antistatus ? 'ativado' : 'desativado'}!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antidelete':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          
          groupData.antidel = !groupData.antidel;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Antidelete ${groupData.antidel ? 'ativado' : 'desativado'}!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'autodl':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          
          groupData.autodl = !groupData.autodl;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Autodl ${groupData.autodl ? 'ativado' : 'desativado'}! Links suportados serão baixados automaticamente.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'cmdlimit':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!q) return reply(`Digite o limite de comandos por dia ou "off" para desativar.\nExemplo: ` + prefix + `cmdlimit 10`);
          cmdLimitData[from] = cmdLimitData[from] || {
            users: {}
          };
          if (q.toLowerCase() === 'off') {
            cmdLimitData[from].enabled = false;
            delete cmdLimitData[from].limit;
          } else {
            const limit = parseInt(q);
            if (isNaN(limit) || limit < 1) return reply('Limite inválido! Use um número maior que 0 ou "off".');
            cmdLimitData[from].enabled = true;
            cmdLimitData[from].limit = limit;
          }
          fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
          await reply(`✅ Limite de comandos ${cmdLimitData[from].enabled ? `definido para ${cmdLimitData[from].limit} por dia` : 'desativado'}!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antidoc':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          
          groupData.antidoc = !groupData.antidoc;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Antidoc ${groupData.antidoc ? 'ativado' : 'desativado'}! Documentos enviados resultarão em banimento.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'x9':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          
          groupData.x9 = !groupData.x9;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Modo X9 ${groupData.x9 ? 'ativado' : 'desativado'}! Agora eu aviso sobre promoções e rebaixamentos.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'limitmessage':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos 💔");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando 🚫");
          if (!q) {
            return reply(`📝 Configure o limite de mensagens! Exemplo: ${prefix}limitmessage 5 1m ban\n` + `Formato: ${prefix}limitmessage <quantidade> <tempo> <ação>\n` + `Tempo: s (segundos), m (minutos), h (horas)\n` + `Ação: ban (banimento direto) ou adv (advertências)`);
          }
          if (args.length !== 3) {
            return reply("  ❌ Formato inválido! Use: " + `${prefix}limitmessage <quantidade> <tempo> <ação>`);
          }
          const limit = parseInt(args[0]);
          const timeInput = args[1].toLowerCase();
          const action = args[2].toLowerCase();
          if (!['ban', 'adv'].includes(action)) {
            return reply("❌ Ação inválida! Use 'ban' para banimento direto ou 'adv' para advertências.");
          }
          let intervalSeconds;
          const timeMatch = timeInput.match(/^(\d+)(s|m|h)$/);
          if (!timeMatch) {
            return reply("❌ Tempo inválido! Use formatos como 20s, 1m ou 2h.");
          }
          const timeValue = parseInt(timeMatch[1]);
          const timeUnit = timeMatch[2];
          if (timeUnit === 's') {
            intervalSeconds = timeValue;
          } else if (timeUnit === 'm') {
            intervalSeconds = timeValue * 60;
          } else if (timeUnit === 'h') {
            intervalSeconds = timeValue * 3600;
          }
          if (isNaN(limit) || limit <= 0) {
            return reply("❌ Quantidade de mensagens deve ser um número positivo!");
          }
          
          groupData.messageLimit = {
            enabled: true,
            limit: limit,
            interval: intervalSeconds,
            action: action,
            warnings: groupData.messageLimit?.warnings || {},
            users: groupData.messageLimit?.users || {}
          };
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          const actionText = action === 'ban' ? 'banimento direto' : 'advertências (ban após 3)';
          await reply(`✅ Limite de mensagens configurado: ${limit} mensagens a cada ${timeInput} com ${actionText}!`);
        } catch (e) {
          console.error('Erro no comando limitmessage:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'dellimitmessage':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos 💔");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando 🚫");
          if (!groupData.messageLimit?.enabled) {
            return reply("📴 O limite de mensagens não está ativo neste grupo.");
          }
          delete groupData.messageLimit;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply("🗑️ Sistema de limite de mensagens desativado com sucesso!");
        } catch (e) {
          console.error('Erro no comando dellimitmessage:', e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'setprefix':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem alterar o prefixo.");
          if (!q) return reply(`Por favor, forneça o novo prefixo. Exemplo: ${groupPrefix}setprefix !`);
          const newPrefix = q.trim();
          if (newPrefix.length > 1) {
            return reply("🤔 O prefixo deve ter no máximo 1 digito.");
          }
          ;
          if (newPrefix.includes(' ')) {
            return reply("🤔 O prefixo não pode conter espaços.");
          }
          ;
          
          groupData.customPrefix = newPrefix;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Prefixo do bot alterado para "${newPrefix}" neste grupo!`);
        } catch (e) {
          console.error('Erro no comando setprefix:', e);
          await reply("Ocorreu um erro ao alterar o prefixo 💔");
        }
        break;
      case 'antiflood':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!q) return reply(`Digite o intervalo em segundos ou "off" para desativar.\nExemplo: ` + prefix + `antiflood 5`);
          antifloodData[from] = antifloodData[from] || {
            users: {}
          };
          if (q.toLowerCase() === 'off') {
            antifloodData[from].enabled = false;
            delete antifloodData[from].interval;
          } else {
            const interval = parseInt(q);
            if (isNaN(interval) || interval < 1) return reply('Intervalo inválido! Use um número maior que 0 ou "off".');
            antifloodData[from].enabled = true;
            antifloodData[from].interval = interval;
          }
          fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
          await reply(`✅ Antiflood ${antifloodData[from].enabled ? `ativado com intervalo de ${antifloodData[from].interval} segundos` : 'desativado'}!`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antispamcmd':
        try {
          if (!isOwner) return reply('Somente o dono pode usar este comando.');
          const filePath = DATABASE_DIR + '/antispam.json';
          const cfg = antiSpamGlobal || {};
          const usage = `Uso:
${prefix}antispamcmd on <limite> <intervalo_s> <bloqueio_s>
${prefix}antispamcmd off
${prefix}antispamcmd status
Exemplos:
• ${prefix}antispamcmd on 5 10 600
• ${prefix}antispamcmd off`;
          if (!q) return reply(usage);
          const parts = q.trim().split(/\s+/);
          const sub = parts[0].toLowerCase();
          if (sub === 'status') {
            const enabled = cfg.enabled ? '✅ ON' : '❌ OFF';
            const limit = cfg.limit || 5; const interval = cfg.interval || 10; const block = cfg.blockTime || 600;
            const blockedNow = Object.values(cfg.blocks||{}).filter(b=>Date.now() < (b.until||0)).length;
            return reply(`🛡️ AntiSpam Global: ${enabled}
• Limite: ${limit} cmds
• Janela: ${interval}s
• Bloqueio: ${Math.floor(block/60)}m
• Bloqueados agora: ${blockedNow}`);
          }
          if (sub === 'off') {
            cfg.enabled = false;
            fs.writeFileSync(filePath, JSON.stringify(cfg, null, 2));
            return reply('✅ AntiSpam Global desativado.');
          }
          if (sub === 'on') {
            const limit = parseInt(parts[1]);
            const interval = parseInt(parts[2]);
            const block = parseInt(parts[3]);
            if ([limit, interval, block].some(v => isNaN(v) || v <= 0)) {
              return reply('Valores inválidos. ' + usage);
            }
            cfg.enabled = true;
            cfg.limit = limit;
            cfg.interval = interval;
            cfg.blockTime = block;
            cfg.users = cfg.users || {};
            cfg.blocks = cfg.blocks || {};
            fs.writeFileSync(filePath, JSON.stringify(cfg, null, 2));
            return reply(`✅ AntiSpam Global ativado!
• Limite: ${limit} cmds em ${interval}s
• Bloqueio: ${Math.floor(block/60)} min`);
          }
          return reply('Opção inválida.\n' + usage);
        } catch (e) {
          console.error('Erro em antispamcmd:', e);
          await reply('Ocorreu um erro ao configurar o AntiSpam.');
        }
        break;
      case 'antiloc':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          
          groupData.antiloc = !groupData.antiloc;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Antiloc ${groupData.antiloc ? 'ativado' : 'desativado'}! Localizações enviadas resultarão em banimento.`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'modobrincadeira':
      case 'modobrincadeiras':
      case 'modobn':
      case 'gamemode':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          if (!groupData.modobrincadeira || groupData.modobrincadeira === undefined) {
            
            groupData.modobrincadeira = true;
          } else {
            
            groupData.modobrincadeira = !groupData.modobrincadeira;
          }
          ;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          if (groupData.modobrincadeira) {
            await reply('🎉 *Modo de Brincadeiras ativado!* Agora o grupo está no modo de brincadeiras. Divirta-se!');
          } else {
            await reply('⚠️ *Modo de Brincadeiras desativado!* O grupo não está mais no modo de brincadeiras.');
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'bemvindo':
      case 'bv':
      case 'boasvindas':
      case 'welcome':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          if (!groupData.bemvindo || groupData.bemvindo === undefined) {
            
            groupData.bemvindo = true;
          } else {
            
            groupData.bemvindo = !groupData.bemvindo;
          }
          ;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          if (groupData.bemvindo) {
            await reply(`✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefixo}legendabv*`);
          } else {
            await reply('⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.');
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'banghost':
        try {
          if (!isGroup) return reply("❌ Só pode ser usado em grupos.");
          if (!isGroupAdmin) return reply("❌ Apenas administradores.");
          if (!isBotAdmin) return reply("❌ Preciso ser administrador.");
          const limite = parseInt(q);
          if (isNaN(limite) || limite < 0) return reply("⚠️ Use um número válido. Ex: " + prefix + "banghost 1");
          const arquivoGrupo = `${GRUPOS_DIR}/${from}.json`;
          if (!fs.existsSync(arquivoGrupo)) return reply("📂 Sem dados de mensagens.");
          const dados = JSON.parse(fs.readFileSync(arquivoGrupo));
          const contador = dados.contador;
          if (!Array.isArray(contador)) return reply("⚠️ Contador não disponível.");
          const admins = groupAdmins || [];
          const fantasmas = contador.filter(u => (u.msg || 0) <= limite && !admins.includes(u.id) && u.id !== botNumber && u.id !== sender && u.id !== nmrdn).map(u => u.id);
          if (!fantasmas.length) return reply(`🎉 Nenhum fantasma com até ${limite} msg.`);
          const antes = (await getCachedGroupMetadata(from)).participants.map(p => p.lid || p.id);
          try {
            await bender.groupParticipantsUpdate(from, fantasmas, 'remove');
          } catch (e) {
            console.error("Erro ao remover:", e);
          }
          const depois = (await getCachedGroupMetadata(from)).participants.map(p => p.lid || p.id);
          const removidos = fantasmas.filter(jid => antes.includes(jid) && !depois.includes(jid)).length;
          reply(removidos === 0 ? `⚠️ Nenhum fantasma pôde ser removido com até ${limite} msg.` : `✅ ${removidos} fantasma(s) removido(s).`);
        } catch (e) {
          console.error("Erro no banghost:", e);
          reply("💥 Erro ao tentar remover fantasmas.");
        }
        break;
      case 'fotobv':
      case 'welcomeimg':
        {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!isQuotedImage && !isImage) return reply(`❌ Marque uma imagem ou envie uma imagem com o comando.`);
          try {
            if (isQuotedImage || isImage) {
              const imgMessage = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage;
              const media = await getFileBuffer(imgMessage, 'image');
              const uploadResult = await upload(media);
              if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
              if (!groupData.welcome) {
                
                groupData.welcome = {};
              }
              
              groupData.welcome.image = uploadResult;
              fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
              await reply('✅ Foto de boas-vindas configurada com sucesso!');
            } else if (q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'banner') {
              if (!groupData.welcome) {
                
                groupData.welcome = {};
              }
              
              groupData.welcome.image = 'banner';
              fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
              await reply('✅ Foto de boas-vindas configurada com sucesso!');
            } else {
              await reply(`❌ Marque uma imagem ou envie uma imagem com o comando.`);
            }
            ;
          } catch (error) {
            console.error(error);
            reply("ocorreu um erro 💔");
          }
        }
        break;
      case 'fotosaida':
      case 'fotosaiu':
      case 'imgsaiu':
      case 'exitimg':
        {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');
          try {
            const media = await getFileBuffer(isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage, 'image');
            const uploadResult = await upload(media);
            if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
            if (!groupData.exit) {
              
              groupData.exit = {};
            }
            
            groupData.exit.image = uploadResult;
            fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
            await reply('✅ Foto de saída configurada com sucesso!');
          } catch (error) {
            console.error(error);
            reply("ocorreu um erro 💔");
          }
          ;
        }
        ;
        break;
      case 'limpar':
      case 'clean':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
          const linhasEmBranco = Array(500).fill('‎ ').join('\n');
          const mensagem = `${linhasEmBranco}\n🧹 Limpeza concluída!`;
          await reply(mensagem);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro ao limpar o chat 💔");
        }
        break;
      case 'removerfotobv':
      case 'rmfotobv':
      case 'delfotobv':
      case 'rmwelcomeimg':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            welcome: {}
          };
          if (!groupData.welcome?.image) return reply("❌ Não há imagem de boas-vindas configurada.");
          delete groupData.welcome.image;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply("✅ A imagem de boas-vindas foi removida com sucesso!");
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'removerfotosaiu':
      case 'rmfotosaiu':
      case 'delfotosaiu':
      case 'rmexitimg':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            exit: {}
          };
          if (!groupData.exit?.image) return reply("❌ Não há imagem de saída configurada.");
          delete groupData.exit.image;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply("✅ A imagem de saída foi removida com sucesso!");
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'configsaida':
      case 'textsaiu':
      case 'legendasaiu':
      case 'exitmsg':
        {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!q) return reply(`📝 Para configurar a mensagem de saída, use:\n${prefix}${command} <mensagem>\n\nVocê pode usar:\n#numerodele# - Menciona quem saiu\n#nomedogp# - Nome do grupo\n#membros# - Total de membros\n#desc# - Descrição do grupo`);
          try {
            if (!groupData.exit) {
              
              groupData.exit = {};
            }
            
            groupData.exit.enabled = true;
            
            groupData.exit.text = q;
            fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
            await reply('✅ Mensagem de saída configurada com sucesso!\n\n📝 Mensagem definida como:\n' + q);
          } catch (error) {
            console.error(error);
            await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
          }
        }
        break;
      case 'saida':
      case 'exit':
        {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          try {
            if (!groupData.exit) {
              
              groupData.exit = {};
            }
            
            groupData.exit.enabled = !groupData.exit.enabled;
            fs.writeFileSync(__dirname + `/../database/grupos/${groupName}.json`, JSON.stringify(groupData, null, 2));
            await reply(groupData.exit.enabled ? '✅ Mensagens de saída ativadas!' : '❌ Mensagens de saída desativadas!');
          } catch (error) {
            console.error(error);
            await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
          }
          ;
        }
        ;
        break;
      case 'parcerias':
      case 'partnerships':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
          if (!parceriasData.active) {
            return reply("O sistema de parcerias não está ativo neste grupo.");
          }
          if (Object.keys(parceriasData.partners).length === 0) {
            return reply("Não há parcerias ativas neste grupo.");
          }
          let message = "📋 *Lista de Parcerias Ativas* 📋\n\n";
          for (const [userId, data] of Object.entries(parceriasData.partners)) {
            
            message += `👤 @${getUserName(userId)} - Limite: ${data.limit} links | Enviados: ${data.count}\n`;
          }
          await reply(message, {
            mentions: Object.keys(parceriasData.partners)
          });
        } catch (e) {
          console.error('Erro no comando parcerias:', e);
          await reply("Ocorreu um erro ao listar as parcerias 💔");
        }
        break;
      case 'addparceria':
      case 'addpartnership':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
          if (!q) return reply(`Uso: ${prefix}addparceria @usuário limite ou marcando uma mensagem com ${prefix}addparceria limite`);
          let userId, limit;
          if (menc_os2) {
            
            userId = menc_os2;
            
            limit = parseInt(args[1]);
          } else if (isQuotedMsg) {
            
            userId = info.message.extendedTextMessage.contextInfo.participant;
            
            limit = parseInt(q);
          } else {
            return reply("Por favor, marque um usuário ou responda a uma mensagem.");
          }
          if (!userId || isNaN(limit) || limit < 1) {
            return reply("Uso inválido. Certifique-se de marcar um usuário e especificar um limite válido (número maior que 0).");
          }
          if (!AllgroupMembers.includes(userId)) {
            return reply(`@${getUserName(userId)} não está no grupo.`, {
              mentions: [userId]
            });
          }
          parceriasData.partners[userId] = {
            limit,
            count: 0
          };
          saveParceriasData(from, parceriasData);
          await reply(`✅ @${getUserName(userId)} foi adicionado como parceiro com limite de ${limit} links de grupos.`, {
            mentions: [userId]
          });
        } catch (e) {
          console.error('Erro no comando addparceria:', e);
          await reply("Ocorreu um erro ao adicionar a parceria 💔");
        }
        break;
      case 'delparceria':
      case 'delpartnership':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
          let userId;
          if (menc_os2) {
            userId = menc_os2;
          } else if (isQuotedMsg) {
            userId = info.message.extendedTextMessage.contextInfo.participant;
          } else {
            return reply("Por favor, marque um usuário ou responda a uma mensagem.");
          }
          if (!parceriasData.partners[userId]) {
            return reply(`@${getUserName(userId)} não é um parceiro.`, {
              mentions: [userId]
            });
          }
          delete parceriasData.partners[userId];
          saveParceriasData(from, parceriasData);
          await reply(`✅ @${getUserName(userId)} não é mais um parceiro.`, {
            mentions: [userId]
          });
        } catch (e) {
          console.error('Erro no comando delparceria:', e);
          await reply("Ocorreu um erro ao remover a parceria 💔");
        }
        break;
      case 'modoparceria':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem usar este comando.");
          parceriasData.active = !parceriasData.active;
          saveParceriasData(from, parceriasData);
          await reply(`✅ Sistema de parcerias ${parceriasData.active ? 'ativado' : 'desativado'} com sucesso!`);
        } catch (e) {
          console.error('Erro no comando modoparceria:', e);
          await reply("Ocorreu um erro ao alterar o modo de parcerias 💔");
        }
        break;
      case 'antifig':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar o antifig.");
          
          groupData.antifig = groupData.antifig || {};
          
          groupData.antifig.enabled = !groupData.antifig.enabled;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          const status = groupData.antifig.enabled ? "ativado" : "desativado";
          await reply(`✅ Antifig ${status}! Figurinhas ${groupData.antifig.enabled ? "serão apagadas e o remetente receberá advertências" : "agora são permitidas"}.`);
        } catch (e) {
          console.error('Erro no comando antifig:', e);
          await reply("Ocorreu um erro ao gerenciar o antifig 💔");
        }
        break;
      case 'addblacklist':
      case 'blacklist':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          if (!menc_os2) return reply("Marque um usuário 🙄");
          const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            blacklist: {}
          };
          
          groupData.blacklist = groupData.blacklist || {};
          if (groupData.blacklist[menc_os2]) return reply("❌ Este usuário já está na blacklist.");
          
          groupData.blacklist[menc_os2] = {
            reason,
            timestamp: Date.now()
          };
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ @${getUserName(menc_os2)} foi adicionado à blacklist.\nMotivo: ${reason}`, {
            mentions: [menc_os2]
          });
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'delblacklist':
      case 'unblacklist':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          if (!menc_os2) return reply("Marque um usuário 🙄");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            blacklist: {}
          };
          
          groupData.blacklist = groupData.blacklist || {};
          if (!groupData.blacklist[menc_os2]) return reply("❌ Este usuário não está na blacklist.");
          delete groupData.blacklist[menc_os2];
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ @${getUserName(menc_os2)} foi removido da blacklist.`, {
            mentions: [menc_os2]
          });
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'listblacklist':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            blacklist: {}
          };
          
          groupData.blacklist = groupData.blacklist || {};
          if (Object.keys(groupData.blacklist).length === 0) return reply("📋 A blacklist está vazia.");
          let text = "📋 *Lista de Usuários na Blacklist*\n\n";
          for (const [user, data] of Object.entries(groupData.blacklist)) {
            text += `👤 @${getUserName(user)}\n📝 Motivo: ${data.reason}\n🕒 Adicionado em: ${new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;
          }
          reply(text, {
            mentions: Object.keys(groupData.blacklist)
          });
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'adv':
      case 'advertir':
      case 'warning':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          if (!menc_os2) return reply("Marque um usuário 🙄");
          if (menc_os2 === botNumber) return reply("❌ Não posso advertir a mim mesma!");
          const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            warnings: {}
          };
          
          groupData.warnings = groupData.warnings || {};
          
          groupData.warnings[menc_os2] = groupData.warnings[menc_os2] || [];
          groupData.warnings[menc_os2].push({
            reason,
            timestamp: Date.now(),
            issuer: sender
          });
          const warningCount = groupData.warnings[menc_os2].length;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          if (warningCount >= 3) {
            await bender.groupParticipantsUpdate(from, [menc_os2], 'remove');
            delete groupData.warnings[menc_os2];
            fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
            reply(`🚫 @${getUserName(menc_os2)} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`, {
              mentions: [menc_os2]
            });
          } else {
            reply(`⚠️ @${getUserName(menc_os2)} recebeu uma advertência (${warningCount}/3).\nMotivo: ${reason}`, {
              mentions: [menc_os2]
            });
          }
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'removeradv':
      case 'rmadv':
      case 'unwarning':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          if (!menc_os2) return reply("Marque um usuário 🙄");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            warnings: {}
          };
          
          groupData.warnings = groupData.warnings || {};
          if (!groupData.warnings[menc_os2] || groupData.warnings[menc_os2].length === 0) return reply("❌ Este usuário não tem advertências.");
          groupData.warnings[menc_os2].pop();
          if (groupData.warnings[menc_os2].length === 0) delete groupData.warnings[menc_os2];
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ Uma advertência foi removida de @${getUserName(menc_os2)}. Advertências restantes: ${groupData.warnings[menc_os2]?.length || 0}/3`, {
            mentions: [menc_os2]
          });
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'listadv':
      case 'warninglist':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            warnings: {}
          };
          
          groupData.warnings = groupData.warnings || {};
          if (Object.keys(groupData.warnings).length === 0) return reply("📋 Não há advertências ativas no grupo.");
          let text = "📋 *Lista de Advertências*\n\n";
          for (const [user, warnings] of Object.entries(groupData.warnings)) {
            try {
              if (Array.isArray(warnings)) {
                text += `👤 @${getUserName(user)} (${warnings.length}/3)\n`;
                warnings.forEach((warn, index) => {
                  text += `  ${index + 1}. Motivo: ${warn.reason}\n`;
                  text += `     Por: @${getUserName(warn.issuer)}\n`;
                  text += `     Em: ${new Date(warn.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`;
                });
                text += "\n";
              }
            } catch (e) {}
          }
          reply(text, {
            mentions: [...Object.keys(groupData.warnings), ...Object.values(groupData.warnings).flatMap(w => Array.isArray(w) ? w.map(warn => warn.issuer) : [])]
          });
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'soadm':
      case 'onlyadm':
      case 'soadmin':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          if (!groupData.soadm || groupData.soadm === undefined) {
            
            groupData.soadm = true;
          } else {
            
            groupData.soadm = !groupData.soadm;
          }
          ;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          if (groupData.soadm) {
            await reply(`✅ *Modo apenas adm ativado!* Agora apenas administrdores do grupo poderam utilizar o bot*`);
          } else {
            await reply('⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.');
          }
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        ;
        break;
      case 'modolite':
      case 'litemode':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          if (!groupData.modolite) {
            
            groupData.modolite = true;
            if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
            }
          } else {
            
            groupData.modolite = !groupData.modolite;
            if (!groupData.modolite) {
              
              groupData.modoliteOff = true;
            } else if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
            }
          }
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          if (groupData.modolite) {
            await reply('👶 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.');
          } else {
            await reply('🔞 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.');
          }
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'modoliteglobal':
        try {
          if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
          const modoLiteFile = __dirname + '/../database/modolite.json';
          modoLiteGlobal.status = !modoLiteGlobal.status;
          if (!modoLiteGlobal.status) {
            modoLiteGlobal.forceOff = true;
          } else if (modoLiteGlobal.hasOwnProperty('forceOff')) {
            delete modoLiteGlobal.forceOff;
          }
          fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
          if (modoLiteGlobal.status) {
            await reply('👶 *Modo Lite ativado globalmente!* O conteúdo inapropriado para crianças será filtrado em todos os grupos (a menos que seja explicitamente desativado em algum grupo).');
          } else {
            await reply('🔞 *Modo Lite desativado globalmente!* O conteúdo do menu de brincadeiras será exibido completamente (a menos que seja explicitamente ativado em algum grupo).');
          }
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'antilinkgp':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            antilinkgp: false
          };
          
          groupData.antilinkgp = !groupData.antilinkgp;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          const message = groupData.antilinkgp ? `✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️` : `✅ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! ⚠️`;
          reply(`${message}`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'antiporn':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            antiporn: false
          };
          
          groupData.antiporn = !groupData.antiporn;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          const message = groupData.antiporn ? `✅ *Antiporn foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo adulto (NSFW), será banido automaticamente. Mantenha o grupo seguro e adequado! 🛡️` : `✅ *Antiporn foi desativado.*\n\nConteúdo adulto não será mais bloqueado. Use com responsabilidade! ⚠️`;
          reply(`${message}`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'autosticker':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
          
          groupData.autoSticker = !groupData.autoSticker;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ Auto figurinhas ${groupData.autoSticker ? 'ativadas' : 'desativadas'}! ${groupData.autoSticker ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`);
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'autorepo':
      case 'autoresposta':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
          
          groupData.autorepo = !groupData.autorepo;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ Auto resposta ${groupData.autorepo ? 'ativada' : 'desativada'}!`);
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'assistente':
      case 'assistent':
        try {
          if (!KeyCog) {
            await bender.sendMessage(nmrdn, {
              text: `Olá! 🐝 Passei aqui para avisar que alguém tentou usar o comando "${prefix}${command}", mas parece que a sua API key ainda não foi configurada. 😊 Caso tenha interesse, entre em contato comigo pelo link abaixo! Você pode entrar em contato para solicitar uma key gratuita com limite de 50 requests por dia ou comprar a ilimitada por R$15/mês. 🚀\nwa.me/553399285117`
            });
            return reply('Este comando precisa de API key para funcionar. Meu dono já foi notificado! 😺');
          }
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
          
          groupData.assistente = !groupData.assistente;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
          reply(`✅ *Assistente ${groupData.assistente ? 'ativada' : 'desativada'} com sucesso!*\n\n⚠️ Esta é uma funcionalidade *experimental (beta)* e ainda está em fase de testes. Podem ocorrer erros ou comportamentos inesperados. Caso encontre algo estranho, avise um administrador!\n\n🧠 Ao ativar essa IA, você concorda que ela pode *aprender com base nos padrões de conversa do grupo* para oferecer respostas mais relevantes e contextuais.`);
        } catch (e) {
          console.error(e);
          reply("Ocorreu um erro 💔");
        }
        break;
      case 'antigore':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            antigore: false
          };
          
          groupData.antigore = !groupData.antigore;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          const message = groupData.antigore ? `✅ *Antigore foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo gore, será banido automaticamente. Mantenha o grupo seguro e saudável! 🛡️` : `✅ *Antigore foi desativado.*\n\nConteúdo gore não será mais bloqueado. Use com cuidado! ⚠️`;
          reply(`${message}`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'legendabv':
      case 'textbv':
      case 'welcomemsg':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          if (!q) return reply(`📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefixo}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`);
          
          groupData.textbv = q;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          reply(`✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${groupData.textbv}"`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'mute':
      case 'mutar':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) {
            if (!chargeUser(10000, sender)) {
        return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔\n\nou 🪙 10.000 BCOINS");}}
          if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
          if (!menc_os2) return reply("Marque alguém 🙄");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            mutedUsers: {}
          };
          
          groupData.mutedUsers = groupData.mutedUsers || {};
          
          groupData.mutedUsers[menc_os2] = true;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          await bender.sendMessage(from, {
            text: `✅ @${getUserName(menc_os2)} foi mutado. Se enviar mensagens, será calado.`,
            mentions: [menc_os2]
          }, {
            quoted: info
          });
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'desmute':
      case 'desmutar':
      case 'unmute':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) {
            if (!chargeUser(1000, sender)) {
        return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔\n\nou 🪙 1.000 BCOINS");}}
          if (!menc_os2) return reply("Marque alguém 🙄");
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            mutedUsers: {}
          };
          
          groupData.mutedUsers = groupData.mutedUsers || {};
          if (groupData.mutedUsers[menc_os2]) {
            delete groupData.mutedUsers[menc_os2];
            fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
            await bender.sendMessage(from, {
              text: `✅ @${getUserName(menc_os2)} foi desmutado e pode enviar mensagens novamente.`,
              mentions: [menc_os2]
            }, {
              quoted: info
            });
          } else {
            reply('❌ Este usuário não está mutado.');
          }
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'blockcmd':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!q) return reply(`❌ Digite o comando que deseja bloquear. Exemplo: ${prefix}blockcmd sticker`);
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            blockedCommands: {}
          };
          
          groupData.blockedCommands = groupData.blockedCommands || {};
          
          groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')] = true;
          fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
          reply(`✅ O comando *${q.trim()}* foi bloqueado e só pode ser usado por administradores.`);
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'unblockcmd':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isGroupAdmin) return reply("você precisa ser adm 💔");
          if (!q) return reply(`❌ Digite o comando que deseja desbloquear. Exemplo: ${prefix}unblockcmd sticker`);
          const groupFilePath = __dirname + `/../database/grupos/${groupName}.json`;
          let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {
            blockedCommands: {}
          };
          
          groupData.blockedCommands = groupData.blockedCommands || {};
          if (groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')]) {
            delete groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')];
            fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
            reply(`✅ O comando *${q.trim()}* foi desbloqueado e pode ser usado por todos.`);
          } else {
            reply('❌ Este comando não está bloqueado.');
          }
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'ttt':
      case 'jogodavelha':
        {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!menc_os2) return reply("Marque alguém 🙄");
          const result = await tictactoe.invitePlayer(from, sender, menc_os2);
          await bender.sendMessage(from, {
            text: result.message,
            mentions: result.mentions
          });
          break;
        }
        ;
      case 'chance':
        try {
          if (!isGroup) return reply("🎮 Ops! Esse comando só funciona em grupos! Chama a galera! 👥�");
          if (!isModoBn) return reply('❌ O modo brincadeira está off nesse grupo! Pede pro admin ativar a diversão! 🎉');
          if (!q) return reply(`🎲 Me conta algo para eu calcular as chances! 📊

📝 *Exemplo:* ${prefix}chance chover pizza hoje
🚀 *Exemplo:* ${prefix}chance eu virar milionário
💖 *Exemplo:* ${prefix}chance encontrar o amor`);
          const chance = Math.floor(Math.random() * 101);
          const emojis = ['🎯', '📊', '🎲', '✨', '🔮', '🍀', '🎆'];
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          const comentarios = [
            'As estrelas sussurraram...', 'Minha bola de cristal revelou...', 'Calculei usando matemática quântica...', 
            'Consultei os oráculos...', 'Analisei todas as possibilidades...', 'O universo me contou...'
          ];
          const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
          await reply(`${emoji} *${comentario}*

🎯 A chance de "${q}" acontecer é: *${chance}%*!

${chance >= 80 ? '🚀 Uau! Apostaria minhas fichas nisso!' : chance >= 60 ? '😎 Chances promissoras!' : chance >= 40 ? '🤔 Meio termo, pode rolar!' : chance >= 20 ? '😅 Hmm... complicado!' : '😂 Melhor sonhar com outra coisa!'}`);
        } catch (e) {
          console.error(e);
          await reply("😵 Minha bola de cristal bugou! Tenta de novo! 🔮�");
        }
        break;
      case 'quando':
        try {
          if (!isGroup) return reply("🕰️ Esse comando só funciona em grupos! Vem com a galera! �✨");
          if (!isModoBn) return reply('❌ O modo brincadeira está dormindo nesse grupo! Acorda ele! 😴🎉');
          if (!q) return reply(`🔮 Me conta o que você quer que eu preveja! 🌠

📝 *Exemplos:*
• ${prefix}quando vou ficar rico
• ${prefix}quando vou encontrar o amor
• ${prefix}quando vou viajar
• ${prefix}quando vou ser famoso`);
          const tempos = [
            'hoje à noite 🌙', 'amanhã de manhã 🌅', 'na próxima semana 📅', 
            'no próximo mês 🌕', 'no próximo ano 🎆', 'em 2025 🚀',
            'quando você menos esperar ✨', 'em uma terça-feira chuvosa 🌧️',
            'depois do carnaval 🎡', 'nunca 😅', 'já aconteceu e você não viu 🤯',
            'numa sexta-feira 13 😈', 'quando os santos ajudarem 😇'
          ];
          const tempo = tempos[Math.floor(Math.random() * tempos.length)];
          const prefixos = [
            '🔮 Minha visão revela que', '✨ As energias indicam que', '🌠 Consultei as estrelas e',
            '💫 O universo sussurra que', '🧙‍♂️ Pelos poderes que me foram concedidos'
          ];
          const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
          await reply(`${prefixo}...

�️ "${q}" vai acontecer: *${tempo}*!

${tempo.includes('nunca') ? '😂 Brincadeira! Nunca desista dos seus sonhos!' : '🍀 Boa sorte na espera!'}`);
        } catch (e) {
          console.error(e);
          await reply("🔮 Minha máquina do tempo pifou! Tenta de novo! ⏰�");
        }
        break;
      case 'casal':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          const membro1 = membros[Math.floor(Math.random() * membros.length)];
          let membro2 = membros[Math.floor(Math.random() * membros.length)];
          while (membro2 === membro1) {
            membro2 = membros[Math.floor(Math.random() * membros.length)];
          }
          ;
          const shipLevel = Math.floor(Math.random() * 101);
          const chance = Math.floor(Math.random() * 101);
          const comentarios = [
            'Cupido acabou de atirar!', 'O amor está no ar!', 'Combinação perfeita detectada!',
            'Ship aprovado pela comunidade!', 'Quimica confirmada!', 'Casal goals incoming!'
          ];
          const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
          const statusShip = shipLevel >= 80 ? '🔥 SHIP INCENDIÁRIO!' : 
                           shipLevel >= 60 ? '😍 Ship promissor!' : 
                           shipLevel >= 40 ? '😊 Rolou uma química!' : 
                           shipLevel >= 20 ? '🤔 Meio forçado...' : '😅 Só na amizade!';
          await reply(`💘 *${comentario}* 💘\n\n👑 **CASAL DO MOMENTO** �\n@${getUserName(membro1)} ❤️ @${getUserName(membro2)}\n\n� **Nível de ship:** *${shipLevel}%*\n🎯 **Chance de dar certo:** *${chance}%*\n\n${statusShip}\n\n${chance >= 70 ? '🎉 Já podem marcar o casamento!' : chance >= 50 ? '👀 Vale a pena investir!' : '😂 Melhor ficar só na amizade!'}`, {
            mentions: [membro1, membro2]
          });
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'shipo':
        try {
          if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          if (!menc_os2) return reply('Marque alguém para eu encontrar um par! Exemplo: ' + prefix + 'shipo @fulano');
          if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          let par = membros[Math.floor(Math.random() * membros.length)];
          while (par === menc_os2) {
            par = membros[Math.floor(Math.random() * membros.length)];
          }
          ;
          const shipLevel = Math.floor(Math.random() * 101);
          const chance = Math.floor(Math.random() * 101);
          const nomeShip = `${getUserName(menc_os2).slice(0,3)}${getUserName(par).slice(-3)}`;
          const comentarios = [
            'Encontrei o par perfeito!', 'Match feito no céu!', 'Combinação aprovada!',
            'Ship name já tá pronto!', 'Quero ver essa dupla!', 'Shippando forte!'
          ];
          const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
          const emojisShip = ['💘', '💖', '💝', '💞', '💕', '❤️', '💓'];
          const emoji = emojisShip[Math.floor(Math.random() * emojisShip.length)];
          const statusShip = shipLevel >= 85 ? '🔥 SHIP LENDÁRIO!' : 
                           shipLevel >= 70 ? '🎆 Ship de qualidade!' : 
                           shipLevel >= 50 ? '😊 Tem potencial!' : 
                           shipLevel >= 30 ? '🤔 Pode rolar...' : '😅 Força demais!';
          await reply(`${emoji} *${comentario}* ${emoji}\n\n👑 **SHIP SELECIONADO** �\n@${getUserName(menc_os2)} ✨ @${getUserName(par)}\n\n💫 **Ship name:** *${nomeShip}*\n� **Nível de ship:** *${shipLevel}%*\n🎯 **Compatibilidade:** *${chance}%*\n\n${statusShip}\n\n${chance >= 75 ? '🎉 Relacionamento dos sonhos!' : chance >= 50 ? '👀 Merece uma chance!' : '😂 Melhor só shippar mesmo!'}`, {
            mentions: [menc_os2, par]
          });
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'sn':
        try {
          if (!isGroup) return reply("🎱 Esse comando só funciona em grupos! Chama todo mundo! �✨");
          if (!isModoBn) return reply('❌ O modo brincadeira está pausado nesse grupo! Hora de ativar a diversão! 🎉');
          if (!q) return reply(`🎱 Faça uma pergunta para o oráculo! 🔮

📝 *Exemplos:*
• ${prefix}sn Vou ganhar na loteria?
• ${prefix}sn Devo confesar meus sentimentos?
• ${prefix}sn Vale a pena investir em Bitcoin?
• ${prefix}sn Vou passar na prova?`);
          const respostasPositivas = [
            'Sim! 🎉', 'Claro que sim! 😎', 'Com certeza! ✨', 'Pode apostar! 🎯',
            'Sem dúvida! 👍', 'Obviamente! 😌', 'É isso aí! 🚀', 'Vai dar certo! 🍀'
          ];
          const respostasNegativas = [
            'Não! 😅', 'Nem pensar! 😂', 'Esquece! 🤭', 'Nada a ver! 🙄',
            'De jeito nenhum! 😑', 'Que nada! 😒', 'Não rola! 😶', 'Melhor não! 😬'
          ];
          const isPositive = Math.random() > 0.5;
          const resposta = isPositive ? 
            respostasPositivas[Math.floor(Math.random() * respostasPositivas.length)] :
            respostasNegativas[Math.floor(Math.random() * respostasNegativas.length)];
          
          const confianca = Math.floor(Math.random() * 30) + 70; // 70-100%
          const emoji = isPositive ? '🎆' : '💔';
          
          await reply(`� **ORÁCULO RESPONDE** 🎱

🤔 *Pergunta:* "${q}"

${emoji} **Resposta:** *${resposta}*

📊 *Confiança:* ${confianca}%

${isPositive ? '🎉 O destino sorri para você!' : '😅 Mas não desista dos seus sonhos!'}`);
        } catch (e) {
          console.error(e);
          await reply("🎱 A bola 8 travou! Tenta de novo! �");
        }
        break;
      case 'sorte':
        try {
          if (!isGroup) return reply("🍀 Esse comando só funciona em grupos! Chama a galera pra testar a sorte! ✨👥");
          if (!isModoBn) return reply('❌ O modo brincadeira está desativado nesse grupo! Hora de liberar a diversão! 🎉🎲');
          
          const usuario = menc_os2 || sender;
          const nome = menc_os2 ? getUserName(menc_os2) : pushname;
          const nivelSorte = Math.floor(Math.random() * 101);
          
          const comentarios = [
            'Os astros foram consultados...', 'A fortuna foi analisada...', 'O destino revelou...',
            'As energias cósmicas mostram...', 'O universo sussurrou...', 'A roda da fortuna girou...'
          ];
          const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
          
          const statusSorte = nivelSorte >= 90 ? '🌟 SORTE LENDÁRIA!' : 
                            nivelSorte >= 75 ? '🍀 Super sortudo!' : 
                            nivelSorte >= 60 ? '✨ Boa sorte!' : 
                            nivelSorte >= 40 ? '🤞 Sorte média!' : 
                            nivelSorte >= 20 ? '😅 Sorte baixa...' : '💀 Azar total!';
          
          const dicas = [
            'Aposte na loteria hoje!', 'Evite gatos pretos!', 'Use algo verde!', 'Faça um pedido!',
            'Procure trevos de 4 folhas!', 'Cuidado com espelhos quebrados!', 'Jogue sal por cima do ombro!',
            'Vista algo amarelo!', 'Evite passar debaixo de escadas!', 'Faça uma simpatia!'
          ];
          const dica = dicas[Math.floor(Math.random() * dicas.length)];
          
          await reply(`🔮 *${comentario}*

🍀 **MEDIDOR DE SORTE** 🍀
👤 *Pessoa:* ${nome}

🎯 **Nível de sorte:** *${nivelSorte}%*

${statusSorte}

💡 *Dica do dia:* ${dica}

${nivelSorte >= 70 ? '🎉 Hoje é seu dia de sorte!' : nivelSorte >= 40 ? '🤔 Cuidado com as decisões!' : '😬 Melhor ficar em casa hoje!'}`, {
            mentions: menc_os2 ? [menc_os2] : []
          });
        } catch (e) {
          console.error(e);
          await reply("🍀 O trevo de 4 folhas fugiu! Tenta de novo! 🏃‍♂️💨");
        }
        break;
      case 'admins':
      case 'admin':
      case 'adm':
      case 'adms':
        if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
        try {
          let membros = groupAdmins;
          let msg = `📢 *Mencionando os admins do grupo:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
          await bender.sendMessage(from, {
            text: msg + membros.map(m => `➤ @${getUserName(m)}`).join('\n'),
            mentions: membros
          });
        } catch (e) {
          console.error(e);
          reply("ocorreu um erro 💔");
        }
        break;
      case 'perfil':
        try {
          const target = sender;
          const targetId = getUserName(target);
          const targetName = `@${targetId}`;
          const levels = {
            puta: Math.floor(Math.random() * 101),
            gado: Math.floor(Math.random() * 101),
            corno: Math.floor(Math.random() * 101),
            sortudo: Math.floor(Math.random() * 101),
            carisma: Math.floor(Math.random() * 101),
            rico: Math.floor(Math.random() * 101),
            gostosa: Math.floor(Math.random() * 101),
            feio: Math.floor(Math.random() * 101)
          };
          const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;
          const humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
          const randomHumor = humors[Math.floor(Math.random() * humors.length)];
          let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
          try {
            profilePic = await bender.profilePictureUrl(target, 'image');
          } catch (error) {
            console.warn(`Falha ao obter foto do perfil de ${targetName}:`, error.message);
          }
          let bio = 'Sem bio disponível';
          let bioSetAt = '';
          try {
            const statusData = await bender.fetchStatus(target);
            const status = statusData?.[0]?.status;
            if (status) {
              bio = status.status || bio;
              bioSetAt = new Date(status.setAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo'
              });
            }
            ;
          } catch (error) {
            console.warn(`Falha ao obter status/bio de ${targetName}:`, error.message);
          }
          ;
          const perfilText = `📋 Perfil de ${targetName} 📋\n\n👤 *Nome*: ${pushname || 'Desconhecido'}\n📱 *Número*: ${targetId}\n📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}\n💰 *Valor do Pacote*: ${pacoteValue} 🫦\n😸 *Humor*: ${randomHumor}\n\n🎭 *Níveis*:\n  • Puta: ${levels.puta}%\n  • Gado: ${levels.gado}%\n  • Corno: ${levels.corno}%\n  • Sortudo: ${levels.sortudo}%\n  • Carisma: ${levels.carisma}%\n  • Rico: ${levels.rico}%\n  • Gostosa: ${levels.gostosa}%\n  • Feio: ${levels.feio}%`.trim();
          
          await bender.sendMessage(from, { image: { url: profilePic }, caption: perfilText, mentions: [target] }, { quoted: info });

        } catch (error) {
          console.error('Erro ao processar comando perfil:', error);
          await reply('Ocorreu um erro ao gerar o perfil 💔');
        }
        break;
      case 'ppt':
        try {
          if (!q) return reply(`🎮 *Pedra, Papel ou Tesoura*\n\n💡 *Como jogar:*\n• Escolha sua jogada após o comando\n• Ex: ${prefix}ppt pedra\n• Ex: ${prefix}ppt papel\n• Ex: ${prefix}ppt tesoura\n\n🎲 Vamos ver quem ganha!`);
          const escolhas = ['pedra', 'papel', 'tesoura'];
          if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
          const botEscolha = escolhas[Math.floor(Math.random() * 3)];
          const usuarioEscolha = q.toLowerCase();
          let resultado;
          if (usuarioEscolha === botEscolha) {
            resultado = 'Empate! 🤝';
          } else if (usuarioEscolha === 'pedra' && botEscolha === 'tesoura' || usuarioEscolha === 'papel' && botEscolha === 'pedra' || usuarioEscolha === 'tesoura' && botEscolha === 'papel') {
            resultado = 'Você ganhou! 🎉';
          } else {
            resultado = 'Eu ganhei! 😎';
          }
          await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;
      case 'eununca':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          await bender.sendMessage(from, {
            poll: {
              name: toolsJson().iNever[Math.floor(Math.random() * toolsJson().iNever.length)],
              values: ["Eu nunca", "Eu ja"],
              selectableCount: 1
            },
            messageContextInfo: {
              messageSecret: Math.random()
            }
          }, {
            from,
            options: {
              userJid: bender?.user?.id
            }
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'vab':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          const vabs = vabJson()[Math.floor(Math.random() * vabJson().length)];
          await bender.sendMessage(from, {
            poll: {
              name: 'O que você prefere?',
              values: [vabs.option1, vabs.option2],
              selectableCount: 1
            },
            messageContextInfo: {
              messageSecret: Math.random()
            }
          }, {
            from,
            options: {
              userJid: bender?.user?.id
            }
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'surubao':
      case 'suruba':
        try {
          if (isModoLite) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply(`Apenas em grupos`);
          if (!isModoBn) return reply('O modo brincadeira nao esta ativo no grupo');
          if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`);
          if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.");
          var emojiskk;
          emojiskk = ["🥵", "😈", "🫣", "😏"];
          var emojis2;
          emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
          var frasekk;
          frasekk = [`tá querendo relações sexuais a ${q}, topa?`, `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`];
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          var context;
          context = frasekk[Math.floor(Math.random() * frasekk.length)];
          var ABC;
          ABC = `${emojis2} @${getUserName(sender)} ${context}\n\n`;
          var mencts;
          mencts = [sender];
          for (var i = 0; i < q; i++) {
            var menb;
            menb = membros[Math.floor(Math.random() * membros.length)];
            var ABC;
            ABC += `@${menb.split("@")[0]}\n`;
            mencts.push(menb);
          }
          ;
          await bender.sendMessage(from, {
            image: {
              url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'
            },
            caption: ABC,
            mentions: mencts
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'suicidio':
        try {
          await reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`);
          setTimeout(async () => {
            await bender.groupParticipantsUpdate(from, [sender], "remove");
          }, 2000);
          setTimeout(async () => {
            await reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`);
          }, 3000);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'gay':
      case 'burro':
      case 'inteligente':
      case 'otaku':
      case 'fiel':
      case 'infiel':
      case 'corno':
      case 'gado':
      case 'gostoso':
      case 'feio':
      case 'rico':
      case 'pobre':
      case 'pirocudo':
      case 'pirokudo':
      case 'nazista':
      case 'ladrao':
      case 'safado':
      case 'vesgo':
      case 'bebado':
      case 'machista':
      case 'homofobico':
      case 'racista':
      case 'chato':
      case 'sortudo':
      case 'azarado':
      case 'forte':
      case 'fraco':
      case 'pegador':
      case 'otario':
      case 'macho':
      case 'bobo':
      case 'nerd':
      case 'preguicoso':
      case 'trabalhador':
      case 'brabo':
      case 'lindo':
      case 'malandro':
      case 'simpatico':
      case 'engracado':
      case 'charmoso':
      case 'misterioso':
      case 'carinhoso':
      case 'desumilde':
      case 'humilde':
      case 'ciumento':
      case 'corajoso':
      case 'covarde':
      case 'esperto':
      case 'talarico':
      case 'chorao':
      case 'brincalhao':
      case 'bolsonarista':
      case 'petista':
      case 'comunista':
      case 'lulista':
      case 'traidor':
      case 'bandido':
      case 'cachorro':
      case 'vagabundo':
      case 'pilantra':
      case 'mito':
      case 'padrao':
      case 'comedia':
      case 'psicopata':
      case 'fortao':
      case 'magrelo':
      case 'bombado':
      case 'chefe':
      case 'presidente':
      case 'rei':
      case 'patrao':
      case 'playboy':
      case 'zueiro':
      case 'gamer':
      case 'programador':
      case 'visionario':
      case 'billionario':
      case 'poderoso':
      case 'vencedor':
      case 'senhor':
        try {
          if (isModoLite && ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'].includes(command)) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games: {}
          };
          const target = menc_os2 ? menc_os2 : sender;
          const targetName = `@${getUserName(target)}`;
          const level = Math.floor(Math.random() * 101);
          let responses = fs.existsSync(__dirname + '/funcs/json/gamestext.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext.json')) : {};
          const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
          const media = gamesData.games[command];
          if (media?.image) {
            await bender.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [target]
            });
          } else if (media?.video) {
            await bender.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: [target],
              gifPlayback: true
            });
          } else {
            await bender.sendMessage(from, {
              text: responseText,
              mentions: [target]
            });
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'lesbica':
      case 'burra':
      case 'inteligente':
      case 'otaku':
      case 'fiel':
      case 'infiel':
      case 'corna':
      case 'gado':
      case 'gostosa':
      case 'feia':
      case 'rica':
      case 'pobre':
      case 'bucetuda':
      case 'nazista':
      case 'ladra':
      case 'safada':
      case 'vesga':
      case 'bebada':
      case 'machista':
      case 'homofobica':
      case 'racista':
      case 'chata':
      case 'sortuda':
      case 'azarada':
      case 'forte':
      case 'fraca':
      case 'pegadora':
      case 'otaria':
      case 'boba':
      case 'nerd':
      case 'preguicosa':
      case 'trabalhadora':
      case 'braba':
      case 'linda':
      case 'malandra':
      case 'simpatica':
      case 'engracada':
      case 'charmosa':
      case 'misteriosa':
      case 'carinhosa':
      case 'desumilde':
      case 'humilde':
      case 'ciumenta':
      case 'corajosa':
      case 'covarde':
      case 'esperta':
      case 'talarica':
      case 'chorona':
      case 'brincalhona':
      case 'bolsonarista':
      case 'petista':
      case 'comunista':
      case 'lulista':
      case 'traidora':
      case 'bandida':
      case 'cachorra':
      case 'vagabunda':
      case 'pilantra':
      case 'mito':
      case 'padrao':
      case 'comedia':
      case 'psicopata':
      case 'fortona':
      case 'magrela':
      case 'bombada':
      case 'chefe':
      case 'presidenta':
      case 'rainha':
      case 'patroa':
      case 'playboy':
      case 'zueira':
      case 'gamer':
      case 'programadora':
      case 'visionaria':
      case 'bilionaria':
      case 'poderosa':
      case 'vencedora':
      case 'senhora':
        try {
          if (isModoLite && ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'].includes(command)) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games: {}
          };
          const target = menc_os2 ? menc_os2 : sender;
          const targetName = `@${getUserName(target)}`;
          const level = Math.floor(Math.random() * 101);
          let responses = fs.existsSync(__dirname + '/funcs/json/gamestext2.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext2.json')) : {};
          const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
          const media = gamesData.games[command];
          if (media?.image) {
            await bender.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [target]
            });
          } else if (media?.video) {
            await bender.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: [target],
              gifPlayback: true
            });
          } else {
            await bender.sendMessage(from, {
              text: responseText,
              mentions: [target]
            });
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'rankgay':
      case 'rankburro':
      case 'rankinteligente':
      case 'rankotaku':
      case 'rankfiel':
      case 'rankinfiel':
      case 'rankcorno':
      case 'rankgado':
      case 'rankgostoso':
      case 'rankrico':
      case 'rankpobre':
      case 'rankforte':
      case 'rankpegador':
      case 'rankmacho':
      case 'ranknerd':
      case 'ranktrabalhador':
      case 'rankbrabo':
      case 'ranklindo':
      case 'rankmalandro':
      case 'rankengracado':
      case 'rankcharmoso':
      case 'rankvisionario':
      case 'rankpoderoso':
      case 'rankvencedor':
      case 'rankgays':
      case 'rankburros':
      case 'rankinteligentes':
      case 'rankotakus':
      case 'rankfiels':
      case 'rankinfieis':
      case 'rankcornos':
      case 'rankgados':
      case 'rankgostosos':
      case 'rankricos':
      case 'rankpobres':
      case 'rankfortes':
      case 'rankpegadores':
      case 'rankmachos':
      case 'ranknerds':
      case 'ranktrabalhadores':
      case 'rankbrabos':
      case 'ranklindos':
      case 'rankmalandros':
      case 'rankengracados':
      case 'rankcharmosos':
      case 'rankvisionarios':
      case 'rankpoderosos':
      case 'rankvencedores':
        try {
          if (isModoLite && ['rankgostoso', 'rankgostosos', 'ranknazista'].includes(command)) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            ranks: {}
          };
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
          let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
          let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
          let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : {
            ranks: {}
          };
          let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
          top5.forEach((m, i) => {
            
            responseText += `🏅 *#${i + 1}* - @${getUserName(m)}\n`;
          });
          let media = gamesData.ranks[cleanedCommand];
          if (media?.image) {
            await bender.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: top5
            });
          } else if (media?.video) {
            await bender.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: top5,
              gifPlayback: true
            });
          } else {
            await bender.sendMessage(from, {
              text: responseText,
              mentions: top5
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'ranklesbica':
      case 'rankburra':
      case 'rankinteligente':
      case 'rankotaku':
      case 'rankfiel':
      case 'rankinfiel':
      case 'rankcorna':
      case 'rankgada':
      case 'rankgostosa':
      case 'rankrica':
      case 'rankpobre':
      case 'rankforte':
      case 'rankpegadora':
      case 'ranknerd':
      case 'ranktrabalhadora':
      case 'rankbraba':
      case 'ranklinda':
      case 'rankmalandra':
      case 'rankengracada':
      case 'rankcharmosa':
      case 'rankvisionaria':
      case 'rankpoderosa':
      case 'rankvencedora':
      case 'ranklesbicas':
      case 'rankburras':
      case 'rankinteligentes':
      case 'rankotakus':
      case 'rankfiels':
      case 'rankinfieis':
      case 'rankcornas':
      case 'rankgads':
      case 'rankgostosas':
      case 'rankricas':
      case 'rankpobres':
      case 'rankfortes':
      case 'rankpegadoras':
      case 'ranknerds':
      case 'ranktrabalhadoras':
      case 'rankbrabas':
      case 'ranklindas':
      case 'rankmalandras':
      case 'rankengracadas':
      case 'rankcharmosas':
      case 'rankvisionarias':
      case 'rankpoderosas':
      case 'rankvencedoras':
        try {
          if (isModoLite && ['rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          let path = __dirname + '/../database/grupos/' + from + '.json';
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            ranks: {}
          };
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
          let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
          let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
          let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : {
            ranks: {}
          };
          let responseText = ranksData[cleanedCommand] + '\n\n' || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
          top5.forEach((m, i) => {
            
            responseText += `🏅 *#${i + 1}* - @${getUserName(m)}\n`;
          });
          let media = gamesData.ranks[cleanedCommand];
          if (media?.image) {
            await bender.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: top5
            });
          } else if (media?.video) {
            await bender.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: top5,
              gifPlayback: true
            });
          } else {
            await bender.sendMessage(from, {
              text: responseText,
              mentions: top5
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'chute':
      case 'chutar':
      case 'tapa':
      case 'soco':
      case 'socar':
      case 'beijo':
      case 'beijar':
      case 'beijob':
      case 'beijarb':
      case 'abraco':
      case 'abracar':
      case 'mata':
      case 'matar':
      case 'tapar':
      case 'goza':
      case 'gozar':
      case 'mamar':
      case 'mamada':
      case 'cafune':
      case 'morder':
      case 'mordida':
      case 'lamber':
      case 'lambida':
      case 'explodir':
      case 'sexo':
        try {
          const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
          if (isModoLite && comandosImpróprios.includes(command)) return bender.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          if (!menc_os2) return reply('Marque um usuário.');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games2: {}
          };
          let GamezinData = fs.existsSync(__dirname + '/funcs/json/markgame.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/markgame.json')) : {
            ranks: {}
          };
          let responseText = GamezinData[command].replaceAll('#nome#', `@${getUserName(menc_os2)}`) || `Voce acabou de dar um(a) ${command} no(a) @${getUserName(menc_os2)}`;
          let media = gamesData.games2[command];
          if (media?.image) {
            await bender.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [menc_os2]
            });
          } else if (media?.video) {
            await bender.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: [menc_os2],
              gifPlayback: true
            });
          } else {
            await bender.sendMessage(from, {
              text: responseText,
              mentions: [menc_os2]
            });
          }
          ;
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        ;
        break;
      case 'afk':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          const reason = q.trim();
          
          groupData.afkUsers = groupData.afkUsers || {};
          
          groupData.afkUsers[sender] = {
            reason: reason || 'Não especificado',
            since: Date.now()
          };
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          let afkSetMessage = `😴 Você está AFK.`;
          if (reason) {
            afkSetMessage += `
Motivo: ${reason}`;
          }
          await reply(afkSetMessage);
        } catch (e) {
          console.error('Erro no comando afk:', e);
          await reply("Ocorreu um erro ao definir AFK 💔");
        }
        break;
      case 'voltei':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.afkUsers && groupData.afkUsers[sender]) {
            delete groupData.afkUsers[sender];
            fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
            await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
          } else {
            await reply("Você não estava AFK.");
          }
        } catch (e) {
          console.error('Erro no comando voltei:', e);
          await reply("Ocorreu um erro ao remover AFK 💔");
        }
        break;
      case 'regras':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!groupData.rules || groupData.rules.length === 0) {
            return reply("📜 Nenhuma regra definida para este grupo ainda.");
          }
          let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜

`;
          groupData.rules.forEach((rule, index) => {
            rulesMessage += `${index + 1}. ${rule}
`;
          });
          await reply(rulesMessage);
        } catch (e) {
          console.error('Erro no comando regras:', e);
          await reply("Ocorreu um erro ao buscar as regras 💔");
        }
        break;
      case 'addregra':
      case 'addrule':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar regras.");
          if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);
          
          groupData.rules = groupData.rules || [];
          groupData.rules.push(q);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Regra adicionada com sucesso!
${groupData.rules.length}. ${q}`);
        } catch (e) {
          console.error('Erro no comando addregra:', e);
          await reply("Ocorreu um erro ao adicionar a regra 💔");
        }
        break;
      case 'delregra':
      case 'delrule':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover regras.");
          if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);
          
          groupData.rules = groupData.rules || [];
          const ruleNumber = parseInt(q);
          if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
            return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
          }
          const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
        } catch (e) {
          console.error('Erro no comando delregra:', e);
          await reply("Ocorreu um erro ao remover a regra 💔");
        }
        break;
      case 'addmod':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar moderadores.");
          if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuario`);
          const modToAdd = menc_os2;
          if (groupData.moderators.includes(modToAdd)) {
            return reply(`@${getUserName(modToAdd)} já é um moderador.`, {
              mentions: [modToAdd]
            });
          }
          groupData.moderators.push(modToAdd);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(modToAdd)} foi promovido a moderador do grupo!`, {
            mentions: [modToAdd]
          });
        } catch (e) {
          console.error('Erro no comando addmod:', e);
          await reply("Ocorreu um erro ao adicionar moderador 💔");
        }
        break;
      case 'delmod':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover moderadores.");
          if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuario`);
          const modToRemove = menc_os2;
          const modIndex = groupData.moderators.indexOf(modToRemove);
          if (modIndex === -1) {
            return reply(`@${getUserName(modToRemove)} não é um moderador.`, {
              mentions: [modToRemove]
            });
          }
          groupData.moderators.splice(modIndex, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(modToRemove)} não é mais um moderador do grupo.`, {
            mentions: [modToRemove]
          });
        } catch (e) {
          console.error('Erro no comando delmod:', e);
          await reply("Ocorreu um erro ao remover moderador 💔");
        }
        break;
      case 'listmods':
      case 'modlist':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.moderators.length === 0) {
            return reply("🛡️ Não há moderadores definidos para este grupo.");
          }
          let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️\n\n`;
          const mentionedUsers = [];
          groupData.moderators.forEach(modJid => {
            modsMessage += `➥ @${getUserName(modJid)}\n`;
            mentionedUsers.push(modJid);
          });
          await reply(modsMessage, {
            mentions: mentionedUsers
          });
        } catch (e) {
          console.error('Erro no comando listmods:', e);
          await reply("Ocorreu um erro ao listar moderadores 💔");
        }
        break;
      case 'grantmodcmd':
      case 'addmodcmd':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
          if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
          const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
          if (groupData.allowedModCommands.includes(cmdToAllow)) {
            return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
          }
          groupData.allowedModCommands.push(cmdToAllow);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
        } catch (e) {
          console.error('Erro no comando grantmodcmd:', e);
          await reply("Ocorreu um erro ao permitir comando para moderadores 💔");
        }
        break;
      case 'revokemodcmd':
      case 'delmodcmd':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
          if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
          const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
          const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
          if (cmdIndex === -1) {
            return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
          }
          groupData.allowedModCommands.splice(cmdIndex, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
        } catch (e) {
          console.error('Erro no comando revokemodcmd:', e);
          await reply("Ocorreu um erro ao proibir comando para moderadores 💔");
        }
        break;
      case 'listmodcmds':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.allowedModCommands.length === 0) {
            return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
          }
          let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
          groupData.allowedModCommands.forEach(cmd => {
            cmdsMessage += `➥ ${prefix}${cmd}\n`;
          });
          await reply(cmdsMessage);
        } catch (e) {
          console.error('Erro no comando listmodcmds:', e);
          await reply("Ocorreu um erro ao listar comandos de moderadores 💔");
        }
        break;
      case 'antiarqv':
      case 'antinuke':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem ativar/desativar o anti-arquivamento.");
          
          groupData.antiarqv = !groupData.antiarqv;
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`🛡️ Anti-arquivamento ${groupData.antiarqv ? 'ativado' : 'desativado'} com sucesso! Agora, apenas donos do grupo podem promover/rebaixar membros.`);
        } catch (e) {
          console.error('Erro no comando antiarqv:', e);
          await reply("Ocorreu um erro ao alternar o anti-arquivamento 💔");
        }
        break;
      case 'donogp':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar donos do grupo.");
          if (!menc_os2) return reply(`Marque o usuário que deseja adicionar como dono do grupo. Ex: ${prefix}donogp @usuario`);
          const ownerToAdd = menc_os2;
          
          groupData.groupOwners = groupData.groupOwners || [];
          if (groupData.groupOwners.includes(ownerToAdd)) {
            return reply(`@${getUserName(ownerToAdd)} já é um dono do grupo.`, {
              mentions: [ownerToAdd]
            });
          }
          if (!groupAdmins.includes(ownerToAdd)) {
            return reply(`@${getUserName(ownerToAdd)} precisa ser administrador para ser adicionado como dono do grupo.`, {
              mentions: [ownerToAdd]
            });
          }
          groupData.groupOwners.push(ownerToAdd);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(ownerToAdd)} foi adicionado como dono do grupo! Agora pode promover/rebaixar livremente com anti-arquivamento ativo.`, {
            mentions: [ownerToAdd]
          });
        } catch (e) {
          console.error('Erro no comando donogp:', e);
          await reply("Ocorreu um erro ao adicionar dono do grupo 💔");
        }
        break;
      case 'rmdonogp':
      case 'deldonogp':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover donos do grupo.");
          if (!menc_os2) return reply(`Marque o usuário que deseja remover como dono do grupo. Ex: ${prefix}rmdonogp @usuario`);
          const ownerToRemove = menc_os2;
          
          groupData.groupOwners = groupData.groupOwners || [];
          const ownerIndex = groupData.groupOwners.indexOf(ownerToRemove);
          if (ownerIndex === -1) {
            return reply(`@${getUserName(ownerToRemove)} não é um dono do grupo.`, {
              mentions: [ownerToRemove]
            });
          }
          groupData.groupOwners.splice(ownerIndex, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(ownerToRemove)} foi removido como dono do grupo.`, {
            mentions: [ownerToRemove]
          });
        } catch (e) {
          console.error('Erro no comando rmdonogp:', e);
          await reply("Ocorreu um erro ao remover dono do grupo 💔");
        }
        break;
      case 'donosgp':
      case 'listdonosgp':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          
          groupData.groupOwners = groupData.groupOwners || [];
          if (groupData.groupOwners.length === 0) {
            return reply("🛡️ Não há donos do grupo definidos.");
          }
          let ownersMessage = `🛡️ *Donos do Grupo ${groupName}* 🛡️\n\n`;
          const mentionedOwners = [];
          groupData.groupOwners.forEach(ownerJid => {
            ownersMessage += `➥ @${getUserName(ownerJid)}\n`;
            mentionedOwners.push(ownerJid);
          });
          await reply(ownersMessage, {
            mentions: mentionedOwners
          });
        } catch (e) {
          console.error('Erro no comando donsgp:', e);
          await reply("Ocorreu um erro ao listar donos do grupo 💔");
        }
        break;
        
        case 'minmessage':
  try {
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    if (!isGroupAdmin) return reply("Apenas administradores podem configurar isso.");
    if (!args[0]) return reply(`Uso: ${prefix}minmessage <mínimo de dígitos> <ban/adv> ou ${prefix}minmessage off`);
    if (args[0].toLowerCase() === 'off') {
      delete groupData.minMessage;
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Sistema de legenda mínima desativado.`);
    } else {
      const minDigits = parseInt(args[0]);
      const action = args[1]?.toLowerCase();
      if (isNaN(minDigits) || minDigits < 1 || !['ban', 'adv'].includes(action)) {
        return reply(`Formato inválido. Use: ${prefix}minmessage <número positivo> <ban/adv>`);
      }
      groupData.minMessage = { minDigits, action };
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Configurado: Mínimo de ${minDigits} caracteres em legendas de fotos/vídeos. Ação em violação: ${action === 'ban' ? 'banir' : 'advertir'}.`);
    }
  } catch (e) {
    console.error('Erro no comando minmessage:', e);
    await reply("Ocorreu um erro ao configurar 💔");
  }
  break;
  
  // APIKEY FORNECIDA POR "Lipe NTJ" (+55 73 9867-6116)
  // Mandem agradecimentos a ele 🫶🏻
  case 'likeff':
  case 'likes':
  try {
    if (!q) return reply('⚠️ Falta digitar o seu ID do Free Fire.\n\nEx: ' + prefix + command + ' 000000000');

    const LikeRes = await axios.get(`https://likes.ffgarena.cloud/api/v2/likes?uid=${q}&amount_of_likes=100&auth=leroyadmff3m`);
    const data = LikeRes.data;

    if (data.status !== 200) return reply('❌ Ocorreu um erro ao tentar enviar os likes.');

    if (data.sent === "0 likes") {
      return reply(
        `⚠️ O ID *${q}* (${data.nickname}) já recebeu likes hoje.\n\n` +
        `⭐ Likes atuais: ${data.likes_antes}`
      );
    }

    let msg = `✨ *Likes enviados com sucesso!* ✨\n\n`;
    msg += `👤 *Nickname:* ${data.nickname}\n`;
    msg += `🌍 *Região:* ${data.region}\n`;
    msg += `📈 *Nível:* ${data.level}\n`;
    msg += `⭐ *Likes antes:* ${data.likes_antes}\n`;
    msg += `⭐ *Likes depois:* ${data.likes_depois}\n`;
    msg += `📤 *Resultado:* ${data.sent}`;
    await reply(msg);
  } catch (e) {
    reply('❌ Ocorreu um erro ao processar sua solicitação.');
  };
  break;
  
  case 'nuke':
  try {
    if (!isOwner) return reply('Apenas o dono pode usar este comando.');
    if (!isGroup) return reply('Apenas em grupos.');
    if (!isBotAdmin) return reply('Preciso ser admin para isso.');
    const membersToBan = AllgroupMembers.filter(m => m !== bender.user.id && m !== sender);
    if (membersToBan.length === 0) return reply('Nenhum membro para banir.');
    await bender.groupParticipantsUpdate(from, membersToBan, 'remove');
  } catch (e) {
    console.error('Erro no nuke:', e);
    await reply('Ocorreu um erro ao banir 💔');
  }
  break;
  
  case 'infoff':
  try {
    if (!q) return reply('⚠️ Por favor, digite o UID do jogador Free Fire.\n\nEx: ' + prefix + command + ' 123456789');

    const uid = q.trim();
    const region = 'br';

    const infoRes = await axios.get(`https://freefireapis.shardweb.app/api/info_player?uid=${uid}&region=${region}`);
    const data = infoRes.data;

    if (!data || !data.basicInfo) {
      return reply('❌ Não foi possível obter as informações do jogador. Verifique o UID e tente novamente.');
    }

    const basic = data.basicInfo;
    const social = data.socialInfo || {};
    const pet = data.petInfo || {};
    const clan = data.clanBasicInfo || {};

    let msg = `🎮 *Informações do Jogador Free Fire* 🎮\n\n`;
    msg += `👤 *Nickname:* ${basic.nickname || 'N/A'}\n`;
    msg += `🆔 *ID da Conta:* ${basic.accountId || 'N/A'}\n`;
    msg += `🌍 *Região:* ${basic.region || 'N/A'}\n`;
    msg += `📈 *Nível:* ${basic.level || 'N/A'}\n`;
    msg += `🔥 *EXP:* ${basic.exp || 'N/A'}\n`;
    msg += `⭐ *Likes:* ${basic.liked || '0'}\n`;
    msg += `🏆 *Rank Máximo:* ${basic.maxRank || 'N/A'}\n`;
    msg += `📊 *Pontos de Rank:* ${basic.rankingPoints || '0'}\n`;
    msg += `🏅 *Rank Atual:* ${basic.rank || 'N/A'}\n`;
    msg += `🐾 *Pet:* ${pet.name || 'Nenhum'}\n`;
    msg += `👥 *Clã:* ${clan.name || 'Nenhum'}\n`;
    msg += `📅 *Criado em:* ${basic.createAt ? new Date(parseInt(basic.createAt) * 1000).toLocaleDateString('pt-BR') : 'N/A'}\n`;
    msg += `🕒 *Último Login:* ${basic.lastLoginAt ? new Date(parseInt(basic.lastLoginAt) * 1000).toLocaleString('pt-BR') : 'N/A'}`;

    if (basic.avatars && basic.avatars.png) {
      const avatarUrl = basic.avatars.png;
      try {
        await bender.sendMessage(from, {image: {url: avatarUrl}, caption: msg}, {quoted: info});
      } catch (err) {
        await reply(msg);
      }
    }

  } catch (e) {
    console.error('Erro no comando infoff:', e);
    reply('❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
  }
  break;
  
  case 'msgprefix':
  try {
    if (!isOwner) return reply('Apenas o dono pode configurar isso.');
    if (!q) return reply('Uso: ' + prefix + 'msgprefix off ou ' + prefix + 'msgprefix texto aqui #prefixo#');
    const newMsg = q.trim().toLowerCase() === 'off' ? false : q;
    if (saveMsgPrefix(newMsg)) {
      await reply(newMsg ? `✅ Mensagem prefix configurada: ${newMsg.replace('#prefixo#', prefix)}` : '✅ Mensagem prefix desativada.');
    } else {
      await reply('Erro ao salvar.');
    }
  } catch (e) {
    console.error('Erro no msgprefix:', e);
    await reply('Ocorreu um erro 💔');
  }
  break;
  
  case 'addreact':
  try {
    if (!isOwner) return reply('Apenas o dono pode adicionar reacts.');
    if (args.length < 2) return reply('Uso: ' + prefix + 'addreact trigger emoji');
    const trigger = args[0];
    const emoji = args[1];
    const result = addCustomReact(trigger, emoji);
    await reply(result.message);
  } catch (e) {
    console.error('Erro no addreact:', e);
    await reply('Ocorreu um erro 💔');
  }
  break;
  
  case 'delreact':
  try {
    if (!isOwner) return reply('Apenas o dono pode remover reacts.');
    if (!q) return reply('Uso: ' + prefix + 'delreact id');
    const result = deleteCustomReact(q.trim());
    await reply(result.message);
  } catch (e) {
    console.error('Erro no delreact:', e);
    await reply('Ocorreu um erro 💔');
  }
  break;
  
  case 'listreact':
  try {
    if (!isOwner) return reply('Apenas o dono pode listar reacts.');
    const reacts = loadCustomReacts();
    if (reacts.length === 0) return reply('Nenhum react configurado.');
    let listMsg = '📋 Lista de Reacts:\n\n';
    reacts.forEach(r => {
      listMsg += `ID: ${r.id} | Trigger: ${r.trigger} | Emoji: ${r.emoji}\n`;
    });
    await reply(listMsg);
  } catch (e) {
    console.error('Erro no listreact:', e);
    await reply('Ocorreu um erro 💔');
  }
  break;
  
  case 'freetemu':
  try {
    if (!q) return reply('❌ Por favor, digite um link da Temu.');
    if (!q.includes('temu')) return reply('❌ Link inválido.');
    const KKMeMamaTemu = await temuScammer.convertTemuLink(q);
    await reply(
      `🎉 Aqui está o link do produto no evento como GRATUITO:\n\n` +
      `⚠️ Atenção: Nem todos os anúncios funcionam com esse método. Se não funcionar com este link, tente outro.\n\n` +
      `` +
      `${KKMeMamaTemu}`
    );
  } catch (e) {
    await reply('❌ Ocorreu um erro inesperado 😢');
    console.error(e);
  }
  break;

  case 'horarios':
  case 'horariopagante':
  case 'sinais':
    try {
      const now = new Date();
      const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      const currentHour = String(brasiliaTime.getHours()).padStart(2, '0');
      const currentMinute = String(brasiliaTime.getMinutes()).padStart(2, '0');
      
      const games = [
        { name: 'Fortune Tiger 🐯', emoji: '🐯', baseMinutes: [5, 15, 25, 35, 45, 55] },
        { name: 'Fortune Mouse 🐭', emoji: '🐭', baseMinutes: [8, 18, 28, 38, 48, 58] },
        { name: 'Double Fortune 💰', emoji: '💰', baseMinutes: [3, 13, 23, 33, 43, 53] },
        { name: 'Fortune Rabbit 🐰', emoji: '🐰', baseMinutes: [7, 17, 27, 37, 47, 57] },
        { name: 'Fortune Ox 🐂', emoji: '🐂', baseMinutes: [2, 12, 22, 32, 42, 52] },
        { name: 'Wild Cash x9000 💸', emoji: '💸', baseMinutes: [4, 14, 24, 34, 44, 54] },
        { name: 'Mines ⛏️', emoji: '⛏️', baseMinutes: [6, 16, 26, 36, 46, 56] },
        { name: 'Aviator ✈️', emoji: '✈️', baseMinutes: [9, 19, 29, 39, 49, 59] },
        { name: 'Dragon Luck 🐲', emoji: '🐲', baseMinutes: [1, 11, 21, 31, 41, 51] },
        { name: 'Ganesha Gold 🕉️', emoji: '🕉️', baseMinutes: [10, 20, 30, 40, 50, 0] },
        { name: 'Bikini Paradise 👙', emoji: '👙', baseMinutes: [14, 24, 34, 44, 54, 4] },
        { name: 'Muay Thai Champion 🥊', emoji: '🥊', baseMinutes: [11, 21, 31, 41, 51, 1] },
        { name: 'Circus Delight 🎪', emoji: '🎪', baseMinutes: [13, 23, 33, 43, 53, 3] },
        { name: 'Piggy Gold 🐷', emoji: '🐷', baseMinutes: [16, 26, 36, 46, 56, 6] },
        { name: 'Midas Fortune 👑', emoji: '👑', baseMinutes: [12, 22, 32, 42, 52, 2] },
        { name: 'Sun & Moon ☀️🌙', emoji: '🌙', baseMinutes: [15, 25, 35, 45, 55, 5] },
        { name: 'Wild Bandito 🤠', emoji: '🤠', baseMinutes: [17, 27, 37, 47, 57, 7] },
        { name: 'Fortune Dragon 🐉', emoji: '🐉', baseMinutes: [19, 29, 39, 49, 59, 9] },
        { name: 'Cash Patrol 🚔', emoji: '🚔', baseMinutes: [18, 28, 38, 48, 58, 8] }
      ];

      let responseText = `🎰✨ *HORÁRIOS PAGANTES* ✨🎰\n\n`;
      responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      responseText += `┃  ⏰ *Horário (BR):* ${currentHour}:${currentMinute}  ┃\n`;
      responseText += `┃  📅 *Data:* ${brasiliaTime.toLocaleDateString('pt-BR')}     ┃\n`;
      responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

      games.forEach(game => {
        const gameMinutes = game.baseMinutes.map(minute => {
          const variation = Math.floor(Math.random() * 7) - 3;
          let adjustedMinute = minute + variation;
          if (adjustedMinute < 0) adjustedMinute += 60;
          if (adjustedMinute >= 60) adjustedMinute -= 60;
          return String(adjustedMinute).padStart(2, '0');
        }).sort((a, b) => parseInt(a) - parseInt(b));

        responseText += `╭─────────────────────────╮\n`;
        responseText += `│ ${game.emoji} *${game.name}*\n`;
        
        const nextTimes = [];
        const currentMinuteInt = parseInt(currentMinute);
        
        for (let minute of gameMinutes) {
          const minuteInt = parseInt(minute);
          let hour = parseInt(currentHour);
          
          if (minuteInt <= currentMinuteInt) {
            hour = (hour + 1) % 24;
          }
          
          nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);
          
          if (nextTimes.length >= 3) break;
        }
        
        while (nextTimes.length < 3) {
          for (let minute of gameMinutes) {
            let hour = (parseInt(currentHour) + Math.ceil(nextTimes.length / gameMinutes.length) + 1) % 24;
            nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);
            if (nextTimes.length >= 3) break;
          }
        }

        responseText += `│ 🕐 ${nextTimes.slice(0, 3).join(' • ')}\n`;
        responseText += `╰─────────────────────────╯\n\n`;
      });

      responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      responseText += `┃      ⚠️ *IMPORTANTE* ⚠️      ┃\n`;
      responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      responseText += `🔞 *Conteúdo para maiores de 18 anos*\n`;
      responseText += `📊 Estes são horários estimados\n`;
      responseText += `🎯 Jogue com responsabilidade\n`;
      responseText += `💰 Nunca aposte mais do que pode perder\n`;
      responseText += `🆘 Procure ajuda se tiver vício em jogos\n`;
      responseText += `⚖️ Apostas podem causar dependência\n\n`;
      responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      responseText += `┃  🍀 *BOA SORTE E JOGUE*    ┃\n`;
      responseText += `┃     *CONSCIENTEMENTE!* 🍀  ┃\n`;
      responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;

      await reply(responseText);
    } catch (e) {
      console.error('Erro no comando horarios:', e);
      await reply('❌ Ocorreu um erro ao gerar os horários pagantes.');
    }
    break;

  case 'autohorarios':
    if (!isOwner && !isAdmins && !isGroupAdmins) return reply('⚠️ Este comando é apenas para administradores!');
    
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action || (action !== 'on' && action !== 'off' && action !== 'status' && action !== 'link')) {
        const helpText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                        `┃   🤖 *AUTO HORÁRIOS*     ┃\n` +
                        `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
                        `📋 *Comandos disponíveis:*\n\n` +
                        `🟢 \`${prefix}autohorarios on\`\n` +
                        `   ▸ Liga o envio automático\n\n` +
                        `🔴 \`${prefix}autohorarios off\`\n` +
                        `   ▸ Desliga o envio automático\n\n` +
                        `📊 \`${prefix}autohorarios status\`\n` +
                        `   ▸ Verifica status atual\n\n` +
                        `🔗 \`${prefix}autohorarios link [URL]\`\n` +
                        `   ▸ Define link de apostas\n` +
                        `   ▸ Sem URL remove o link\n\n` +
                        `⏰ *Funcionamento:*\n` +
                        `• Envia horários a cada hora\n` +
                        `• Apenas em grupos\n` +
                        `• Inclui link se configurado\n\n` +
                        `🔒 *Restrito a administradores*`;
        
        await reply(helpText);
        break;
      }
      
      let autoSchedules = {};
      const autoSchedulesPath = './dados/database/autohorarios.json';
      try {
        if (fs.existsSync(autoSchedulesPath)) {
          autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
        }
      } catch (e) {
        autoSchedules = {};
      }
      
      if (!autoSchedules[from]) {
        autoSchedules[from] = {
          enabled: false,
          link: null,
          lastSent: 0
        };
      }
      
      switch (action) {
        case 'on':
          autoSchedules[from].enabled = true;
          fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
          await reply('✅ *Auto horários ativado!*\n\n📤 Os horários pagantes serão enviados automaticamente a cada hora.\n\n⚡ O primeiro envio será na próxima hora cheia.');
          break;
          
        case 'off':
          autoSchedules[from].enabled = false;
          fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
          await reply('🔴 *Auto horários desativado!*\n\n📴 Os envios automáticos foram interrompidos.');
          break;
          
        case 'status':
          const config = autoSchedules[from];
          const statusEmoji = config.enabled ? '🟢' : '🔴';
          const statusText = config.enabled ? 'ATIVO' : 'INATIVO';
          const linkStatus = config.link ? `🔗 ${config.link}` : '🚫 Nenhum link configurado';
          
          const statusResponse = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                               `┃   📊 *STATUS AUTO HORÁRIOS*  ┃\n` +
                               `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
                               `${statusEmoji} *Status:* ${statusText}\n\n` +
                               `🔗 *Link:*\n${linkStatus}\n\n` +
                               `⏰ *Próximo envio:*\n${config.enabled ? 'Na próxima hora cheia' : 'Desativado'}`;
          
          await reply(statusResponse);
          break;
          
        case 'link':
          const linkUrl = args.slice(1).join(' ').trim();
          
          if (!linkUrl) {
            autoSchedules[from].link = null;
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            await reply('🗑️ *Link removido!*\n\n📝 Os horários automáticos não incluirão mais link de apostas.');
          } else {
            autoSchedules[from].link = linkUrl;
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            await reply(`✅ *Link configurado!*\n\n🔗 *URL:* ${linkUrl}\n\n📝 Este link será incluído nos horários automáticos.`);
          }
          break;
      }
      
    } catch (e) {
      console.error('Erro no comando autohorarios:', e);
      await reply('❌ Ocorreu um erro ao configurar os horários automáticos.');
    }
    break;

      case 'botoes':
      case 'buttons':
        if (!isOwner) return reply("🚫 Apenas o dono pode ativar/desativar botões!");
        try {
          const BUTTONS_FILE = pathz.join(DATABASE_DIR, 'bottons.json');
          ensureJsonFileExists(BUTTONS_FILE, { enabled: false });
          
          let buttonsData = loadJsonFile(BUTTONS_FILE, { enabled: false });
          
          if (!q || !['on', 'off', 'ativar', 'desativar', '1', '0'].includes(q.toLowerCase())) {
            const status = buttonsData.enabled ? 'Ativo' : 'Desativo';
            const emoji = buttonsData.enabled ? '✅' : '❌';
            return reply(`${emoji} *Status dos Botões: ${status}*\n\n📝 *Uso:*\n• ${prefix}botoes on - Ativar\n• ${prefix}botoes off - Desativar`);
          }
          
          const shouldEnable = ['on', 'ativar', '1'].includes(q.toLowerCase());
          buttonsData.enabled = shouldEnable;
          
          fs.writeFileSync(BUTTONS_FILE, JSON.stringify(buttonsData, null, 2));
          
          const statusText = shouldEnable ? 'ativados' : 'desativados';
          const emoji = shouldEnable ? '✅' : '❌';
          
          await reply(`${emoji} *Botões ${statusText} com sucesso!*\n\n${shouldEnable ? '🔘 Agora os menus serão exibidos com botões interativos.' : '📝 Os menus voltarão ao formato tradicional de texto.'}`);
        } catch (error) {
          console.error('Erro no comando botões:', error);
          await reply('❌ Erro ao alterar configuração dos botões.');
        }
        break;
  
      // Rental expiration management commands
      case 'rentalstats':
        if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');
        
        const stats = rentalExpirationManager.getStats();
        const message = `
📊 **Estatísticas do Sistema de Expiração de Aluguel** 📊

⏰ **Status do Sistema:**
• Ativo: ${stats.isRunning ? '✅ Sim' : '❌ Não'}
• Última verificação: ${stats.lastCheckTime ? new Date(stats.lastCheckTime).toLocaleString('pt-BR') : 'Nunca'}

📈 **Estatísticas Gerais:**
• Total de verificações: ${stats.totalChecks}
• Avisos enviados: ${stats.warningsSent}
• Avisos finais enviados: ${stats.finalWarningsSent}
• Aluguéis expirados processados: ${stats.expiredProcessed}
• Erros: ${stats.errors}

⚙️ **Configurações:**
• Intervalo de verificação: ${stats.config.checkInterval}
• Dias para aviso: ${stats.config.warningDays}
• Dias para aviso final: ${stats.config.finalWarningDays}
• Limpeza automática: ${stats.config.enableAutoCleanup ? '✅ Ativada' : '❌ Desativada'}
• Notificações: ${stats.config.enableNotifications ? '✅ Ativadas' : '❌ Desativadas'}

📝 **Arquivo de Log:**
• Local: ${stats.config.logFile}

🔧 **Comandos Disponíveis:**
• ${prefix}rentalstats - Ver estatísticas
• ${prefix}rentaltest - Testar sistema manualmente
• ${prefix}rentalconfig - Configurar sistema
• ${prefix}rentalclean - Limpar logs antigos`;
        
        await reply(message);
        break;

      case 'rentaltest':
        if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');
        
        await reply('🔄 Iniciando teste manual do sistema de expiração de aluguel...');
        
        try {
          await rentalExpirationManager.checkExpiredRentals();
          await reply('✅ Teste concluído com sucesso! Verifique as estatísticas para mais detalhes.');
        } catch (error) {
          console.error('❌ Error during rental test:', error);
          await reply(`❌ Ocorreu um erro durante o teste: ${error.message}`);
        }
        break;

      case 'rentalconfig':
        if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
        if (!q) return reply(`Uso: ${prefix}rentalconfig <opção> <valor>\n\nOpções disponíveis:\n• interval <cron-expression>\n• warning <dias>\n• final <dias>\n• cleanup <horas>\n• notifications <on|off>\n• autocleanup <on|off>\n\nExemplo: ${prefix}rentalconfig warning 7`);
        
        const [option, value] = q.split(' ', 2);
        
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');
        
        try {
          switch (option) {
            case 'interval':
              rentalExpirationManager.config.checkInterval = value;
              await reply(`✅ Intervalo de verificação atualizado para: ${value}`);
              break;
              
            case 'warning':
              rentalExpirationManager.config.warningDays = parseInt(value);
              await reply(`✅ Dias para aviso inicial atualizados para: ${value}`);
              break;
              
            case 'final':
              rentalExpirationManager.config.finalWarningDays = parseInt(value);
              await reply(`✅ Dias para aviso final atualizados para: ${value}`);
              break;
              
            case 'cleanup':
              rentalExpirationManager.config.cleanupDelayHours = parseInt(value);
              await reply(`✅ Atraso para limpeza automática atualizado para: ${value} horas`);
              break;
              
            case 'notifications':
              rentalExpirationManager.config.enableNotifications = value.toLowerCase() === 'on';
              await reply(`✅ Notificações ${rentalExpirationManager.config.enableNotifications ? 'ativadas' : 'desativadas'}`);
              break;
              
            case 'autocleanup':
              rentalExpirationManager.config.enableAutoCleanup = value.toLowerCase() === 'on';
              await reply(`✅ Limpeza automática ${rentalExpirationManager.config.enableAutoCleanup ? 'ativada' : 'desativada'}`);
              break;
              
            default:
              await reply(`❌ Opção inválida: ${option}\nUse ${prefix}rentalconfig para ver as opções disponíveis.`);
          }
        } catch (error) {
          console.error('❌ Error updating rental config:', error);
          await reply(`❌ Ocorreu um erro ao atualizar a configuração: ${error.message}`);
        }
        break;

      case 'rentalclean':
        if (!isOwner) return reply('🚫 Este comando é apenas para o dono do bot!');
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');
        
        try {
          const statsBefore = rentalExpirationManager.getStats();
          await rentalExpirationManager.resetStats();
          await reply(`✅ Estatísticas resetadas com sucesso!\n\nAntes:\n• Verificações: ${statsBefore.totalChecks}\n• Avisos: ${statsBefore.warningsSent}\n• Erros: ${statsBefore.errors}\n\nDepois:\n• Verificações: 0\n• Avisos: 0\n• Erros: 0`);
        } catch (error) {
          console.error('❌ Error cleaning rental stats:', error);
          await reply(`❌ Ocorreu um erro ao limpar as estatísticas: ${error.message}`);
        }
        break;

      default:

        if (isCmd) {
          const cmdNotFoundConfig = loadCmdNotFoundConfig();
          if (cmdNotFoundConfig.enabled) {
            const userName = pushname || getUserName(sender);
            const commandName = command || body.trim().slice(groupPrefix.length).split(/ +/).shift().trim();
            
            const notFoundMessage = formatMessageWithFallback(
              cmdNotFoundConfig.message,
              {
                command: commandName,
                prefix: groupPrefix,
                user: sender,
                botName: nomebot,
                userName: userName
              },
              '❌ Comando não encontrado! Tente ' + groupPrefix + 'menu para ver todos os comandos disponíveis.'
            );
            
            try {
              await reply(notFoundMessage);
              
              console.log(`🔍 Comando não encontrado: "${commandName}" por ${userName} (${sender}) no grupo ${isGroup ? groupMetadata.subject : 'privado'}`);
            } catch (error) {
              console.error('❌ Erro ao enviar mensagem de comando não encontrado:', error);
              await bender.react('❌', {
                key: info.key
              });
            }
          } else {
            await bender.react('❌', {
              key: info.key
            });
          }
        }

        const msgPrefix = loadMsgPrefix();
        if (['prefix', 'prefixo'].includes(budy2) && msgPrefix) {
          await reply(msgPrefix.replace('#prefixo#', prefix));
        };
        const customReacts = loadCustomReacts();
        for (const react of customReacts) {
          if (budy2.includes(react.trigger)) {
            await bender.react(react.emoji, { key: info.key });
            break;
          }
        }
        if (!isCmd && isAutoRepo) {
          await processAutoResponse(bender, from, body, info);
        };
    };
  } catch (error) {
    console.error('==== ERRO NO PROCESSAMENTO DA MENSAGEM ====');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);
  };
};

function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = {
      totalGb: 'N/A',
      freeGb: 'N/A',
      usedGb: 'N/A',
      percentUsed: 'N/A'
    };
    if (platform === 'win32') {
      try {
        const scriptPath = __dirname;
        const driveLetter = pathz.parse(scriptPath).root.charAt(0);
        const command = `fsutil volume diskfree ${driveLetter}:`;
        const output = execSync(command).toString();
        const lines = output.split('\n');
        const freeLine = lines.find(line => line.includes('Total # of free bytes'));
        const totalLine = lines.find(line => line.includes('Total # of bytes'));
        if (freeLine) {
          freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
        }
        if (totalLine) {
          totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
        }
      } catch (winError) {
        console.error("Erro ao obter espaço em disco no Windows:", winError);
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const command = 'df -k .';
        const output = execSync(command).toString();
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          totalBytes = parseInt(parts[1]) * 1024;
          freeBytes = parseInt(parts[3]) * 1024;
        }
      } catch (unixError) {
        console.error("Erro ao obter espaço em disco no Linux/macOS:", unixError);
        return defaultResult;
      }
    } else {
      console.warn(`Plataforma ${platform} não suportada para informações de disco`);
      return defaultResult;
    }
    ;
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = (usedBytes / totalBytes * 100).toFixed(1) + '%';
      return {
        totalGb,
        freeGb,
        usedGb,
        percentUsed
      };
    } else {
      console.warn("Valores inválidos de espaço em disco:", {
        totalBytes,
        freeBytes
      });
      return defaultResult;
    }
  } catch (error) {
    console.error("Erro ao obter informações de disco:", error);
    return {
      totalGb: 'N/A',
      freeGb: 'N/A',
      usedGb: 'N/A',
      percentUsed: 'N/A'
    };
  }
  ;
}
;
export default NazuninhaBotExec;