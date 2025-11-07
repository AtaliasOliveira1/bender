const fs = require('fs');
const pathz = require('path');
const crypto = require('crypto');
const { ensureDirectoryExists, ensureJsonFileExists, loadJsonFile, normalizar, getUserName, isGroupId, isUserId, isValidLid, isValidJid, buildUserId } = require('./helpers');
const {
  DATABASE_DIR,
  GRUPOS_DIR,
  USERS_DIR,
  DONO_DIR,
  PARCERIAS_DIR,
  TMP_DIR,
  LEVELING_FILE,
  CUSTOM_AUTORESPONSES_FILE,
  DIVULGACAO_FILE,
  NO_PREFIX_COMMANDS_FILE,
  COMMAND_ALIASES_FILE,
  GLOBAL_BLACKLIST_FILE,
  MENU_DESIGN_FILE,
  ECONOMY_FILE,
  MSGPREFIX_FILE,
  CUSTOM_REACTS_FILE,
  REMINDERS_FILE,
  CMD_NOT_FOUND_FILE,
  ANTIFLOOD_FILE,
  ANTIPV_FILE,
  GLOBAL_BLOCKS_FILE,
  CMD_LIMIT_FILE,
  CMD_USER_LIMITS_FILE,
  ANTISPAM_FILE,
  BOT_STATE_FILE,
  AUTO_HORARIOS_FILE,
  MODO_LITE_FILE,
  SUBDONOS_FILE,
  ALUGUEIS_FILE,
  CODIGOS_ALUGUEL_FILE,
  RELATIONSHIPS_FILE,
  CUSTOM_COMMANDS_FILE,
  CONFIG_FILE
} = require('./paths');

ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);
ensureDirectoryExists(PARCERIAS_DIR);
ensureJsonFileExists(ANTIFLOOD_FILE);
ensureJsonFileExists(CMD_LIMIT_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(CMD_USER_LIMITS_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(ANTISPAM_FILE, {
  enabled: false,
  limit: 5,
  interval: 10,
  blockTime: 600,
  users: {},
  blocks: {}
});
ensureJsonFileExists(ANTIPV_FILE, {
  mode: 'off',
  message: '🚫 Este comando só funciona em grupos!'
});
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(GLOBAL_BLOCKS_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(BOT_STATE_FILE, {
  status: 'on'
});
ensureJsonFileExists(MODO_LITE_FILE, {
  status: false
});
ensureDirectoryExists(TMP_DIR);
ensureJsonFileExists(CUSTOM_AUTORESPONSES_FILE, {
  responses: []
});
ensureJsonFileExists(NO_PREFIX_COMMANDS_FILE, {
  commands: []
});
ensureJsonFileExists(COMMAND_ALIASES_FILE, {
  aliases: []
});
ensureJsonFileExists(CUSTOM_COMMANDS_FILE, {
  commands: []
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
    "gerente": { name: "Gerente", min: 260, max: 420 }
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
ensureJsonFileExists(SUBDONOS_FILE, {
  subdonos: []
});
ensureJsonFileExists(ALUGUEIS_FILE, {
  globalMode: false,
  groups: {}
});
ensureJsonFileExists(CODIGOS_ALUGUEL_FILE, {
  codes: {}
});
ensureJsonFileExists(RELATIONSHIPS_FILE, {
  pairs: {},
  archived: []
});

const databaseSelfTests = [{
  name: 'economy.json',
  path: ECONOMY_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    if (typeof data.shop !== 'object') issues.push('Campo "shop" ausente ou inválido.');
    if (typeof data.materialsPrices !== 'object') issues.push('Campo "materialsPrices" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'leveling.json',
  path: LEVELING_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.patents)) issues.push('Campo "patents" ausente ou não é um array.');
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'commandAliases.json',
  path: COMMAND_ALIASES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.aliases)) issues.push('Campo "aliases" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'customAutoResponses.json',
  path: CUSTOM_AUTORESPONSES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.responses)) issues.push('Campo "responses" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'cmdNotFound.json',
  path: CMD_NOT_FOUND_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.enabled !== 'boolean') issues.push('Campo "enabled" ausente ou inválido.');
    if (typeof data.message !== 'string') issues.push('Campo "message" ausente ou inválido.');
    return issues;
  }
}];

const runDatabaseSelfTest = ({ log = false } = {}) => {
  const results = databaseSelfTests.map(test => {
    try {
      const content = loadJsonFile(test.path, null);
      const issues = test.validate(content) || [];
      return {
        name: test.name,
        path: test.path,
        ok: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        name: test.name,
        path: test.path,
        ok: false,
        issues: [`Erro ao carregar: ${error.message || error}`]
      };
    }
  });

  if (log) {
    results.forEach(result => {
      if (result.ok) {
        console.log(`✅ [DB Test] ${result.name} pronto.`);
      } else {
        console.warn(`⚠️ [DB Test] Problemas detectados em ${result.name}:\n- ${result.issues.join('\n- ')}`);
      }
    });
  }

  return {
    ok: results.every(result => result.ok),
    results
  };
};

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

const loadRelationships = () => {
  return loadJsonFile(RELATIONSHIPS_FILE, {
    pairs: {}
  });
};

const saveRelationships = (data = {
  pairs: {}
}) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(RELATIONSHIPS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de relacionamento:', error);
    return false;
  }
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
};

const isSubdono = userId => {
  if (!userId) return false;
  const currentSubdonos = loadSubdonos();
  
  // Verificar se o userId ou qualquer variação (com @s.whatsapp.net ou @lid) está na lista
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  
  return currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoId === userId || subdonoBase === userIdBase;
  });
};

const addSubdono = (userId, numerodono) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  let currentSubdonos = loadSubdonos();
  
  // Verificar se já existe (comparando base do número)
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const alreadyExists = currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  
  if (alreadyExists) {
    return {
      success: false,
      message: '✨ Este usuário já é um subdono!'
    };
  }
  
  // Carrega config localmente para não depender de variável global
  const config = loadJsonFile(CONFIG_FILE, {});
  const nmrdn_check = buildUserId(numerodono, config);
  const ownerJid = `${numerodono}@s.whatsapp.net`;
  const ownerBase = numerodono.toString().replace(/\D/g, '');
  const userBase = userId.replace(/\D/g, '');
  
  // Verificar se está tentando adicionar o dono
  if (userId === nmrdn_check || 
      userId === ownerJid || 
      (config.lidowner && userId === config.lidowner) ||
      userBase === ownerBase) {
    return {
      success: false,
      message: '🤔 O Dono principal já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉'
    };
  }
  
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
};

const removeSubdono = userId => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  let currentSubdonos = loadSubdonos();
  
  // Verificar se existe (comparando base do número)
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const foundSubdono = currentSubdonos.find(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  
  if (!foundSubdono) {
    return {
      success: false,
      message: '🤔 Este usuário não está na lista de subdonos.'
    };
  }
  
  const initialLength = currentSubdonos.length;
  // Remover pelo ID encontrado
  currentSubdonos = currentSubdonos.filter(id => {
    const idBase = id.replace(/@s\.whatsapp\.net|@lid/g, '');
    return idBase !== userIdBase;
  });
  
  if (currentSubdonos.length === initialLength) {
    return {
      success: false,
      message: 'Usuário não encontrado na lista (erro inesperado). 🤷'
    };
  }
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
};

const getSubdonos = () => {
  return [...loadSubdonos()];
};

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
    // Try crypto.randomBytes first, fallback to Math.random if not available
    try {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
    } catch (error) {
      // Fallback for environments where crypto.randomBytes is not available
      code = Math.random().toString(16).substring(2, 10).toUpperCase();
    }
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

// ===== Missões Diárias =====
function updateQuestProgress(user, questType, inc = 1) {
  if (!user.quests || !user.quests.daily || !Array.isArray(user.quests.daily)) return;
  
  const questIdMap = {
    'duel': 'duel_3',
    'dungeon': 'dungeon_2',
    'gather': 'gather_10',
    'cook': 'cook_5',
    'train_pet': 'train_pet'
  };
  
  const questId = questIdMap[questType] || questType;
  
  user.quests.daily.forEach(quest => {
    if (quest.id === questId && quest.progress < quest.goal) {
      quest.progress = Math.min(quest.goal, (quest.progress || 0) + inc);
    }
  });
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
    fs.writeFileSync(LEVELING_FILE, JSON.stringify(levelingData, null, 2));
    
    let levelUpText = `╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n`;
    levelUpText += `│\n`;
    levelUpText += `│ 👤 @${getUserName(userId)}\n`;
    levelUpText += `│\n`;
    levelUpText += `│ 📊 *Nível Atual:* ${userData.level}\n`;
    levelUpText += `│ ✨ *XP:* ${userData.xp}/${nextLevelXp}\n`;
    levelUpText += `│ 🎖️ *Patente:* ${userData.patent}\n`;
    levelUpText += `│\n`;
    levelUpText += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n`;
    levelUpText += `\n🎊 *Parabéns pelo progresso!* 🎊`;
    
    bender.sendMessage(from, {
      text: levelUpText,
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

const loadCustomCommands = () => {
  try {
    const data = loadJsonFile(CUSTOM_COMMANDS_FILE, { commands: [] });
    return Array.isArray(data.commands) ? data.commands : [];
  } catch (error) {
    console.error('❌ Erro ao carregar comandos personalizados:', error);
    return [];
  }
};

const saveCustomCommands = (commands) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CUSTOM_COMMANDS_FILE, JSON.stringify({ commands }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos personalizados:', error);
    return false;
  }
};

const removeCustomCommand = (predicate) => {
  try {
    const commands = loadCustomCommands();
    const filtered = commands.filter(cmd => !predicate(cmd));
    if (filtered.length === commands.length) {
      return { removed: false, commands };
    }
    const success = saveCustomCommands(filtered);
    return { removed: success, commands: filtered };
  } catch (error) {
    console.error('❌ Erro ao remover comando personalizado:', error);
    return { removed: false, commands: [] };
  }
};

const findCustomCommand = (trigger) => {
  try {
    const normalized = normalizar(trigger || '').replace(/\s+/g, '');
    if (!normalized) return null;
    const commands = loadCustomCommands();
    return commands.find(cmd => cmd.trigger === normalized) || null;
  } catch (error) {
    console.error('❌ Erro ao buscar comando personalizado:', error);
    return null;
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

// ===== Per-User Command Limiting System =====
const loadCommandLimits = () => {
  const data = loadJsonFile(CMD_LIMIT_FILE, {
    commands: {},
    users: {}
  });
  if (!data || typeof data !== 'object') {
    return { commands: {}, users: {} };
  }
  return {
    ...data,
    commands: data.commands && typeof data.commands === 'object' ? data.commands : {},
    users: data.users && typeof data.users === 'object' ? data.users : {}
  };
};

const saveCommandLimits = (data) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CMD_LIMIT_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar limites de comandos:', error);
    return false;
  }
};

const addCommandLimit = (commandName, maxUses, timeFrame) => {
  try {
    const limitsData = loadCommandLimits();
    
    // Validate inputs
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!maxUses || maxUses <= 0 || !Number.isInteger(maxUses)) {
      return {
        success: false,
        message: '❌ Número de usos deve ser um inteiro positivo!'
      };
    }
    
    if (!timeFrame || typeof timeFrame !== 'string') {
      return {
        success: false,
        message: '❌ Período de tempo inválido!'
      };
    }
    
    // Validate timeFrame format (e.g., "1h", "30m", "1d")
    const timeFrameRegex = /^(\d+)([smhd])$/i;
    if (!timeFrameRegex.test(timeFrame)) {
      return {
        success: false,
        message: '❌ Formato de tempo inválido! Use formatos como: 30m (30 minutos), 1h (1 hora), 1d (1 dia)'
      };
    }
    
    // Check if command already has a limit
    if (limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} já possui um limite configurado!`
      };
    }
    
    limitsData.commands[cmdName] = {
      maxUses: maxUses,
      timeFrame: timeFrame,
      createdAt: new Date().toISOString()
    };
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite adicionado para o comando ${cmdName}!\n📊 Máximo: ${maxUses} usos por ${timeFrame} por usuário`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao salvar o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao adicionar limite!'
    };
  }
};

const removeCommandLimit = (commandName) => {
  try {
    const limitsData = loadCommandLimits();
    
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} não possui limite configurado!`
      };
    }
    
    delete limitsData.commands[cmdName];
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite removido do comando ${cmdName}!`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao remover o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao remover limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao remover limite!'
    };
  }
};

const getCommandLimits = () => {
  try {
    const limitsData = loadCommandLimits();
    return limitsData.commands || {};
  } catch (error) {
    console.error('❌ Erro ao carregar limites de comandos:', error);
    return {};
  }
};

const checkCommandLimit = (commandName, userId) => {
  try {
    const limitsData = loadCommandLimits();
    const cmdName = commandName.toLowerCase().trim();
    const commandLimit = limitsData.commands[cmdName];
    
    if (!commandLimit) {
      return {
        limited: false,
        message: null
      };
    }
    
    // Initialize users tracking for this command if not exists
    limitsData.users[cmdName] = limitsData.users[cmdName] || {};
    const userUsage = limitsData.users[cmdName][userId] || { uses: 0, resetTime: 0 };
    
    const now = Date.now();
    
    // Reset counter if time frame has passed
    if (now >= userUsage.resetTime) {
      userUsage.uses = 0;
      userUsage.resetTime = now + parseTimeFrame(commandLimit.timeFrame);
    }
    
    if (userUsage.uses >= commandLimit.maxUses) {
      const timeLeft = userUsage.resetTime - now;
      return {
        limited: true,
        message: `🚫 Comando ${cmdName} bloqueado! Tente novamente em ${formatTimeLeft(timeLeft)}.`,
        resetTime: userUsage.resetTime
      };
    }
    
    // Increment usage count for this user
    userUsage.uses++;
    userUsage.lastUsed = now;
    limitsData.users[cmdName][userId] = userUsage;
    
    saveCommandLimits(limitsData);
    
    return {
      limited: false,
      message: null,
      remainingUses: commandLimit.maxUses - userUsage.uses
    };
  } catch (error) {
    console.error('❌ Erro ao verificar limite de comando:', error);
    return {
      limited: false,
      message: null
    };
  }
};

// Helper function to parse time frame (e.g., "1h" -> 3600000 milliseconds)
const parseTimeFrame = (timeFrame) => {
  const match = timeFrame.match(/^(\d+)([smhd])$/i);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 's': return value * 1000;        // seconds
    case 'm': return value * 60 * 1000;   // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return 0;
  }
};

// Helper function to format time left
const formatTimeLeft = (milliseconds) => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
};

module.exports = {
  runDatabaseSelfTest,
  loadMsgPrefix,
  saveMsgPrefix,
  loadCmdNotFoundConfig,
  saveCmdNotFoundConfig,
  validateMessageTemplate,
  formatMessageWithFallback,
  loadCustomReacts,
  saveCustomReacts,
  loadReminders,
  saveReminders,
  addCustomReact,
  deleteCustomReact,
  loadDivulgacao,
  saveDivulgacao,
  loadSubdonos,
  saveSubdonos,
  isSubdono,
  addSubdono,
  removeSubdono,
  getSubdonos,
  loadRentalData,
  saveRentalData,
  isRentalModeActive,
  setRentalMode,
  getGroupRentalStatus,
  setGroupRental,
  loadActivationCodes,
  saveActivationCodes,
  generateActivationCode,
  validateActivationCode,
  useActivationCode,
  extendGroupRental,
  isModoLiteActive,
  loadParceriasData,
  saveParceriasData,
  calculateNextLevelXp,
  getPatent,
  loadEconomy,
  saveEconomy,
  getEcoUser,
  parseAmount,
  fmt,
  timeLeft,
  applyShopBonuses,
  PICKAXE_TIER_MULT,
  PICKAXE_TIER_ORDER,
  getActivePickaxe,
  ensureEconomyDefaults,
  giveMaterial,
  generateDailyChallenge,
  ensureUserChallenge,
  updateChallenge,
  isChallengeCompleted,
  updateQuestProgress,
  SKILL_LIST,
  ensureUserSkills,
  skillXpForNext,
  addSkillXP,
  getSkillBonus,
  endOfWeekTimestamp,
  endOfMonthTimestamp,
  generateWeeklyChallenge,
  generateMonthlyChallenge,
  ensureUserPeriodChallenges,
  updatePeriodChallenge,
  isPeriodCompleted,
  checkLevelUp,
  checkLevelDown,
  loadCustomAutoResponses,
  saveCustomAutoResponses,
  loadGroupAutoResponses,
  saveGroupAutoResponses,
  addAutoResponse,
  deleteAutoResponse,
  processAutoResponse,
  sendAutoResponse,
  loadCustomCommands,
  saveCustomCommands,
  removeCustomCommand,
  findCustomCommand,
  loadNoPrefixCommands,
  saveNoPrefixCommands,
  loadCommandAliases,
  saveCommandAliases,
  loadGlobalBlacklist,
  saveGlobalBlacklist,
  addGlobalBlacklist,
  removeGlobalBlacklist,
  getGlobalBlacklist,
  loadMenuDesign,
  saveMenuDesign,
  getMenuDesignWithDefaults,
  loadRelationships,
  saveRelationships,
  // Command limiting functions
  loadCommandLimits,
  saveCommandLimits,
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  parseTimeFrame,
  formatTimeLeft
};