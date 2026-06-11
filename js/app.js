const APP_VERSION = '2.3.3';
const STORAGE_KEY = 'autoparts_callcenter_v1';
const SESSION_KEY = 'autoparts_callcenter_session';
const THEME_KEY = 'autoparts_user_theme_v1';
const RESOLUTION_KEY = 'autoparts_resolution_v1';
const FIREBASE_LEGACY_STATE_COLLECTION = 'appState';
const FIREBASE_LEGACY_STATE_DOC = 'main';
const FIREBASE_META_COLLECTION = 'meta';
const FIREBASE_META_DOC = 'app';
const FIREBASE_COLLECTIONS = {
  calls: 'pedidos',
  clients: 'clientes',
  suppliers: 'fornecedores',
  quotes: 'orcamentos',
  followups: 'agenda',
  stock: 'stock',
  users: 'utilizadores',
  contactGroups: 'diretorioContactos',
  auditLogs: 'auditoria',
  backups: 'backups'
};
const firebaseConfig = {
  apiKey: "AIzaSyDlSqa8bPMGmYMgla-vn7j73eJyp0_eVJI",
  authDomain: "appcallcenter-161c8.firebaseapp.com",
  projectId: "appcallcenter-161c8",
  storageBucket: "appcallcenter-161c8.firebasestorage.app",
  messagingSenderId: "967665645707",
  appId: "1:967665645707:web:c69721f41cf5c19ca33c8e"
};

let firebaseReady = false;
let firebaseAuth = null;
let firebaseDb = null;
let cloudSaveTimer = null;
let firebaseUnsubscribers = [];
let pendingSignupUser = null;
let cloudReadOnlyMode = false;
let firebaseRefreshTimer = null;
let cloudSaveInProgress = false;
let cloudSavePending = false;
let lastCloudSaveAt = 0;
const CONFIG_OPEN_KEY = 'autoparts_config_open_sections_v1';
function isElectronApp(){
  return new URLSearchParams(window.location.search).get('electron') === '1' || navigator.userAgent.toLowerCase().includes('electron');
}
function svgIcon(pathD, viewBox='0 0 24 24'){
  return `<svg class="ui-icon" viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${pathD}"></path></svg>`;
}
const ICONS = {
  dashboard: svgIcon('M3 13.2h8V3H3zm10 7.8h8V11h-8zM3 21h8v-5.8H3zm10-10h8V3h-8z'),
  clientes: svgIcon('M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m9.5 10v-2a4 4 0 0 0-3-3.87M14.5 3.13a4 4 0 0 1 0 7.75'),
  contactos: svgIcon('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.13.98.37 1.94.72 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.22-1.27a2 2 0 0 1 2.1-.45c.92.35 1.88.59 2.86.72A2 2 0 0 1 22 16.9'),
  fornecedores: svgIcon('M3 21h18M5 21V7l7-4 7 4v14M9 9h6M9 13h6M9 17h6'),
  orcamentos: svgIcon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2'),
  users: svgIcon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'),
  configsUser: svgIcon('M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8'),
  config: svgIcon('M12 1.75l2.1 2.24 3.02-.2.82 2.9 2.74 1.27-1.1 2.82 1.1 2.82-2.74 1.27-.82 2.9-3.02-.2L12 22.25l-2.1-2.24-3.02.2-.82-2.9-2.74-1.27 1.1-2.82-1.1-2.82 2.74-1.27.82-2.9 3.02.2L12 1.75zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7'),
  phone: svgIcon('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.13.98.37 1.94.72 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.22-1.27a2 2 0 0 1 2.1-.45c.92.35 1.88.59 2.86.72A2 2 0 0 1 22 16.9'),
  mobile: svgIcon('M12 17h.01M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'),
  email: svgIcon('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2 8 6 8-6'),
  copy: svgIcon('M9 9h10v12H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'),
  edit: svgIcon('M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z'),
  view: svgIcon('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6'),
  arrow: svgIcon('M5 12h14M12 5l7 7-7 7')
};

const pages = [
  { id: 'dashboard', icon: ICONS.dashboard, title: 'Dashboard', short: 'Portal', subtitle: 'Painel principal da operação' },
  { id: 'clientes', icon: ICONS.clientes, title: 'Clientes', short: 'Clientes', subtitle: 'Fichas, histórico e contactos' },
  { id: 'contactos', icon: ICONS.contactos, title: 'Diretório de contactos', short: 'Diretório', subtitle: 'Pesquisa rápida de clientes e fornecedores' },
  { id: 'fornecedores', icon: ICONS.fornecedores, title: 'Fornecedores', short: 'Fornecedores', subtitle: 'Lista de fornecedores e referências' },
  { id: 'orcamentos', icon: ICONS.orcamentos, title: 'Orçamentos', short: 'Orçamentos', subtitle: 'Criar, enviar e acompanhar propostas' },
  { id: 'users', icon: ICONS.users, title: 'Utilizadores', short: 'Users', subtitle: 'Equipa, cargos e permissões' },
  { id: 'configs-user', icon: ICONS.configsUser, title: 'Minhas Configs', short: 'Configs', subtitle: 'Tema e preferências do utilizador' },
  { id: 'config', icon: ICONS.config, title: 'Configurações', short: 'Admin', subtitle: 'GitHub, Electron, Firebase e backups' }
];

const pageFiles = {
  dashboard: 'index.html',
  clientes: 'clientes.html',
  contactos: 'contactos.html',
  fornecedores: 'fornecedores.html',
  orcamentos: 'orcamentos.html',
  'nova-chamada': 'nova-chamada.html',
  pedidos: 'pedidos.html',
  agenda: 'agenda.html',
  stock: 'stock.html',
  relatorios: 'relatorios.html',
  users: 'users.html',
  'configs-user': 'configs-user.html',
  config: 'configuracoes.html'
};

const states = ['Novo', 'Em pesquisa', 'Orçamento enviado', 'Confirmado', 'Perdido', 'Concluído'];
const urgencies = ['Normal', 'Urgente', 'Muito urgente'];
const rolePermissions = {
  'Admin Master': ['manageUsers','approveUsers','editAll','deleteAll','viewReports','manageSettings'],
  'Admin': ['editAll','deleteAll','viewReports','manageSettings'],
  'Supervisor': ['editAll','viewReports'],
  'Operador': []
};
let currentPage = getDefaultPage();
let state = loadState();

function seedData() {
  return {
    appVersion: APP_VERSION,
    settings: {
      companyName: 'AutoParts CallCenter',
      companyNif: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      githubUrl: '',
      firebaseEnabled: false,
      dailyBackupHour: '19:30',
      theme: 'normal',
      resolution: 'auto',
      spellcheckEnabled: true,
      operatorPageAccess: {
        clientes: true,
        contactos: true,
        fornecedores: true,
        orcamentos: true
      },
      operatorActionAccess: {
        view: true, add: false, edit: false, delete: false
      },
      backupEnabled: true,
      lastAutoBackupDate: ''
    },
    currentUser: null,
    calls: [
      { id: uid('PED'), createdAt: today(), cliente:'João Silva', telefone:'912345678', email:'', matricula:'12-AB-34', marca:'BMW', modelo:'320d', ano:'2016', motor:'2.0 Diesel', vin:'', peca:'Alternador', referencia:'ALT-320D', urgencia:'Urgente', estado:'Em pesquisa', operador:'Ricardo', observacoes:'Cliente quer resposta ainda hoje.', fornecedor:'Fornecedor Norte', precoCompra:120, precoVenda:185 },
      { id: uid('PED'), createdAt: today(), cliente:'Auto Oficina Braga', telefone:'253000000', email:'geral@oficina.pt', matricula:'88-ZZ-10', marca:'Mercedes', modelo:'Classe A', ano:'2019', motor:'A180d', vin:'', peca:'Farol frente esquerdo', referencia:'FRL-A180', urgencia:'Normal', estado:'Orçamento enviado', operador:'Fátima', observacoes:'Enviar alternativa nova e usada.', fornecedor:'Stock Sul', precoCompra:210, precoVenda:310 }
    ],
    clients: [
      { id: uid('CLI'), codigoCliente:'CLI-001', nome:'João Silva', telefone:'912345678', email:'', notas:'Prefere contacto por WhatsApp.' },
      { id: uid('CLI'), codigoCliente:'CLI-002', nome:'Auto Oficina Braga', telefone:'253000000', email:'geral@oficina.pt', notas:'Cliente profissional.' }
    ],
    suppliers: [
      { id: uid('FOR'), nomeMarca:'Fornecedor Norte', codigoFicha:'FOR-001' },
      { id: uid('FOR'), nomeMarca:'Stock Sul', codigoFicha:'FOR-002' }
    ],
    quotes: [],
    followups: [
      { id: uid('AGE'), date: today(), time:'15:00', title:'Ligar ao João Silva', related:'Alternador BMW', status:'Pendente', notes:'Confirmar se aceita orçamento.' }
    ],
    stock: [
      { id: uid('STK'), referencia:'ALT-BMW-F30', nome:'Alternador BMW Série 3 F30', marca:'BMW', modelo:'320d', estado:'Recondicionada', local:'Prateleira A2', custo:110, venda:190, qtd:1 }
    ],
    users: [
      { id: uid('USR'), nome:'Ricardo', email:'pica.fern@gmail.com', role:'Admin Master', status:'Ativo', pageAccess:{}, actionAccess:{} },
      { id: uid('USR'), nome:'Operador 1', email:'operador@empresa.pt', role:'Operador', status:'Ativo', pageAccess:{}, actionAccess:{} }
    ],
    auditLogs: [],
    backups: [],
    contactGroups: [
      {
        id: uid('DIR'),
        armazem:'Armazém Lisboa',
        seccao:'Callcenter',
        nome:'Callcenter',
        aberto:true,
        contactos:[
          { id: uid('CNT'), nome:'Ricardo', telemovel:'912345678', telefone:'213000000', email:'pica.fern@gmail.com' },
          { id: uid('CNT'), nome:'Operador Lisboa', telemovel:'913000000', telefone:'213000001', email:'lisboa@empresa.pt' }
        ]
      },
      {
        id: uid('DIR'),
        armazem:'Armazém Porto',
        seccao:'Apoio',
        nome:'Apoio',
        aberto:false,
        contactos:[
          { id: uid('CNT'), nome:'Apoio Porto', telemovel:'914000000', telefone:'223000000', email:'porto@empresa.pt' }
        ]
      }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = seedData();
    if (!raw) return ensureStateShape(base);
    return ensureStateShape({ ...base, ...JSON.parse(raw) });
  } catch {
    return ensureStateShape(seedData());
  }
}
function ensureStateShape(appState){
  const base = seedData();
  appState.settings = { ...base.settings, ...(appState.settings || {}) };
  appState.settings.operatorPageAccess = { ...base.settings.operatorPageAccess, ...(appState.settings.operatorPageAccess || {}) };
  appState.settings.operatorActionAccess = { ...base.settings.operatorActionAccess, ...(appState.settings.operatorActionAccess || {}) };
  appState.auditLogs = Array.isArray(appState.auditLogs) ? appState.auditLogs : [];
  appState.backups = Array.isArray(appState.backups) ? appState.backups : [];
  appState.users = (appState.users || []).map(u => ({ pageAccess:{}, actionAccess:{}, status:'Ativo', role:'Operador', ...u }));
  appState.contactGroups = Array.isArray(appState.contactGroups) ? appState.contactGroups : [];
  appState.suppliers = Array.isArray(appState.suppliers) ? appState.suppliers : [];
  return appState;
}
function getStoredSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setStoredSession(user){
  if(!user?.email) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: user.email,
    name: user.name || user.nome || String(user.email).split('@')[0],
    savedAt: new Date().toISOString()
  }));
}
function clearStoredSession(){
  localStorage.removeItem(SESSION_KEY);
}
function restoreStoredSession(){
  const stored = getStoredSession();
  if(stored?.email) {
    state.currentUser = { email: stored.email, name: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0], nome: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0] };
    saveLocalOnly();
    showApp();
    return true;
  }
  if(state.currentUser?.email) {
    setStoredSession(state.currentUser);
    showApp();
    return true;
  }
  return false;
}

function configSectionId(title){
  return String(title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'') || 'secao';
}
function getOpenConfigSections(){
  try {
    const raw = localStorage.getItem(CONFIG_OPEN_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function setOpenConfigSections(ids){
  try { localStorage.setItem(CONFIG_OPEN_KEY, JSON.stringify([...new Set(ids)])); } catch {}
}
function rememberConfigAccordionState(){
  const ids = qsa('.config-accordion').filter(d => d.open).map(d => d.dataset.configSection).filter(Boolean);
  setOpenConfigSections(ids);
}
function restoreConfigAccordionState(){
  const open = getOpenConfigSections();
  qsa('.config-accordion').forEach(d => {
    const id = d.dataset.configSection;
    if(!id) return;
    d.open = open.length ? open.includes(id) : d.open;
  });
}
function scheduleFirebasePageRefresh(reason='firebase'){
  // Não faz refresh visual automático.
  if(!appIsVisible()) return;
  updateFirebaseStatusBadge();
}
function updateFirebaseStatusBadge(){
  const badge = qs('#firebaseStatusBadge');
  if(badge){
    const status = firebaseStatus();
    badge.textContent = status;
    const cls = status.includes('pendente') ? 'orange' : (status.includes('guardar') ? 'blue' : (firebaseReady ? 'green' : 'orange'));
    badge.className = `badge ${cls}`;
  }
}

function saveState(action='Alteração guardada'){
  addAuditLog(action, currentPage || getDefaultPage());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}
function addAuditLog(action, page=currentPage, details=''){
  try {
    state.auditLogs = Array.isArray(state.auditLogs) ? state.auditLogs : [];
    state.auditLogs.unshift({
      id: uid('AUD'),
      date: new Date().toISOString(),
      page: page || '',
      action: action || 'Alteração guardada',
      by: state.currentUser?.email || firebaseAuth?.currentUser?.email || 'local',
      role: currentRole ? currentRole() : '',
      details: details || ''
    });
    state.auditLogs = state.auditLogs.slice(0, 300);
  } catch(err) { console.warn('Audit failed', err); }
}
function saveLocalOnly(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function appIsVisible(){ return !qs('#appShell')?.classList.contains('hidden'); }
function firebaseStatus(){
  if (!firebaseReady) return 'Modo local';
  if(firebaseAuth?.currentUser?.isAnonymous || cloudReadOnlyMode) return 'Firebase leitura';
  if(cloudSaveInProgress) return 'Firebase a guardar';
  if(localStorage.getItem('autoparts_firebase_dirty_v1') === '1' || cloudSavePending) return 'Firebase pendente';
  return firebaseAuth?.currentUser ? 'Firebase ligado' : 'Firebase pronto';
}
function hasWritableFirebaseSession(){
  return Boolean(firebaseReady && firebaseAuth?.currentUser && firebaseDb && !firebaseAuth.currentUser.isAnonymous && !cloudReadOnlyMode);
}
function markFirebaseDirty(){
  cloudSavePending = true;
  try { localStorage.setItem('autoparts_firebase_dirty_v1', '1'); } catch {}
}
function clearFirebaseDirty(){
  cloudSavePending = false;
  try { localStorage.removeItem('autoparts_firebase_dirty_v1'); } catch {}
}
function scheduleCloudSave(){
  markFirebaseDirty();
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(()=>pushCloudState({ source:'autosave' }), 650);
}
async function flushPendingCloudSave(){
  if((localStorage.getItem('autoparts_firebase_dirty_v1') === '1' || cloudSavePending) && hasWritableFirebaseSession()) {
    await pushCloudState({ source:'flush' });
  }
}
async function pushCloudState(options = {}){
  if (!hasWritableFirebaseSession()) {
    updateFirebaseStatusBadge();
    return false;
  }
  if (cloudSaveInProgress) {
    markFirebaseDirty();
    return false;
  }
  cloudSaveInProgress = true;
  updateFirebaseStatusBadge();
  try {
    await saveFirebaseCollections();
    lastCloudSaveAt = Date.now();
    clearFirebaseDirty();
    updateFirebaseStatusBadge();
    return true;
  } catch (err) {
    markFirebaseDirty();
    console.warn('Firebase save failed', err);
    const code = err?.code ? ` (${err.code})` : '';
    if(options.source !== 'autosave') toast(`Guardado localmente. Firebase não gravou${code}.`);
    return false;
  } finally {
    cloudSaveInProgress = false;
  }
}
function canSyncCollectionKey(stateKey){
  if(stateKey === 'users') return hasPermission('manageUsers');
  if(stateKey === 'auditLogs' || stateKey === 'backups') return hasPermission('manageSettings');
  return hasPermission('createOperational') || hasPermission('editAll') || canAction('add') || canAction('edit') || isAdminMaster();
}
function canLoadCollectionKey(stateKey){
  // Coleções administrativas podem estar bloqueadas nas rules.
  // A app não deve falhar toda só porque auditoria/backups não estão acessíveis.
  return true;
}
async function safeLoadCollection(stateKey, collectionName){
  try {
    const snap = await firebaseDb.collection(collectionName).get();
    return { ok:true, rows:snap.docs.map(doc => cleanFirebaseDoc({ id: doc.id, ...doc.data() })) };
  } catch(err) {
    console.warn(`Firebase read ignored for ${collectionName}`, err);
    return { ok:false, rows:null, error:err };
  }
}

async function saveFirebaseCollections(){
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb || cloudReadOnlyMode) return;

  const errors = [];
  const metaRef = firebaseDb.collection(FIREBASE_META_COLLECTION).doc(FIREBASE_META_DOC);
  if (hasPermission('manageSettings')) {
    try {
      await metaRef.set({
        settings: state.settings || {},
        appVersion: APP_VERSION,
        dataModel: 'collections-v2',
        collections: FIREBASE_COLLECTIONS,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.email || ''
      }, { merge: true });
    } catch(err) {
      errors.push(['meta', err]);
      console.warn('Firebase meta save failed', err);
    }
  }

  for (const [stateKey, collectionName] of Object.entries(FIREBASE_COLLECTIONS)) {
    if (!canSyncCollectionKey(stateKey)) continue;
    try {
      await syncCollection(collectionName, state[stateKey] || [], canDelete());
    } catch(err) {
      errors.push([collectionName, err]);
      console.warn(`Firebase save failed for ${collectionName}`, err);
    }
  }

  if(errors.length) {
    const important = errors.filter(([name]) => !['auditoria','backups'].includes(name));
    if(important.length) throw errors[0][1];
  }
}
async function syncCollection(collectionName, rows, allowDelete=false){
  const collectionRef = firebaseDb.collection(collectionName);
  const existing = await collectionRef.get();
  const ids = new Set(rows.map(row => row.id).filter(Boolean));
  let batch = firebaseDb.batch();
  let ops = 0;

  existing.forEach(doc => {
    if (allowDelete && !ids.has(doc.id)) {
      batch.delete(doc.ref);
      ops++;
    }
  });

  rows.forEach(row => {
    const id = row.id || uid('DOC');
    row.id = id;
    batch.set(collectionRef.doc(id), {
      ...row,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebaseAuth.currentUser.email || ''
    }, { merge: true });
    ops++;
  });

  if (ops) await batch.commit();
}
async function loadCloudState(options = {}){
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb) return;
  try {
    const authUser = firebaseAuth.currentUser;
    const previousUser = state.currentUser;
    const previousLocal = { ...state };
    const base = seedData();

    const authEmail = authUser.email || '';
    const nextCurrentUser = authEmail
      ? { email: authEmail, name: previousUser?.name || authEmail.split('@')[0], nome: previousUser?.nome || previousUser?.name || authEmail.split('@')[0] }
      : (previousUser || { email:'local@electron.app', name:'Local', nome:'Local' });

    state = { ...base, currentUser: nextCurrentUser };

    try {
      const metaSnap = await firebaseDb.collection(FIREBASE_META_COLLECTION).doc(FIREBASE_META_DOC).get();
      if (metaSnap.exists && metaSnap.data()?.settings) {
        state.settings = { ...base.settings, ...metaSnap.data().settings, firebaseEnabled: true };
        const localTheme = getLocalTheme();
        if(localTheme) state.settings.theme = localTheme;
      }
    } catch(metaErr) {
      console.warn('Firebase meta read ignored', metaErr);
      state.settings = { ...base.settings, ...(previousLocal.settings || {}), firebaseEnabled: true };
    }

    let loadedRows = 0;
    let loadedCollections = 0;
    for (const [stateKey, collectionName] of Object.entries(FIREBASE_COLLECTIONS)) {
      if(!canLoadCollectionKey(stateKey)) continue;
      const result = await safeLoadCollection(stateKey, collectionName);
      if(result.ok && Array.isArray(result.rows)) {
        state[stateKey] = result.rows;
        loadedRows += result.rows.length;
        loadedCollections++;
      } else {
        state[stateKey] = Array.isArray(previousLocal[stateKey]) ? previousLocal[stateKey] : (base[stateKey] || []);
      }
    }

    if (!loadedRows && !authUser.isAnonymous) {
      await migrateLegacyCloudState(base);
    }

    cloudReadOnlyMode = !!authUser.isAnonymous || !!options.readOnly;
    syncCurrentUserName();
    saveLocalOnly();
    startFirebaseListeners();
    updateFirebaseStatusBadge();
    await flushPendingCloudSave();
    console.log(`Firebase load ok: ${loadedCollections} coleções, ${loadedRows} registos.`);
  } catch (err) {
    console.warn('Firebase load failed', err);
    toast('Firebase ligou, mas não conseguiu carregar dados. Confirma rules/permissões.');
  }
}
function cleanFirebaseDoc(doc){
  const { updatedAt, updatedBy, createdBy, ...data } = doc;
  return data;
}
async function migrateLegacyCloudState(base){
  const legacy = await firebaseDb.collection(FIREBASE_LEGACY_STATE_COLLECTION).doc(FIREBASE_LEGACY_STATE_DOC).get();
  if (legacy.exists && legacy.data()?.state) {
    state = {
      ...base,
      ...legacy.data().state,
      currentUser: state.currentUser,
      settings: { ...base.settings, ...legacy.data().state.settings, firebaseEnabled: true }
    };
  }
  await saveFirebaseCollections();
}
function startFirebaseListeners(){
  // v2.2.8: listeners realtime desativados.
  // A app estava a receber snapshots da Firebase e parecia dar refresh sozinha.
  // Agora: carrega dados ao entrar/sincronizar e grava automaticamente quando alteras.
  stopFirebaseListeners();
  updateFirebaseStatusBadge();
}
function stopFirebaseListeners(){
  firebaseUnsubscribers.forEach(unsubscribe => {
    try { unsubscribe(); } catch {}
  });
  firebaseUnsubscribers = [];
}
function loadScript(src){
  return new Promise((resolve, reject)=>{
    if ([...document.scripts].some(s => s.src === src)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
async function initFirebase(){
  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    firebaseReady = true;
    return true;
  } catch (err) {
    console.warn('Firebase unavailable', err);
    firebaseReady = false;
    return false;
  }
}
function uid(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function today(){ return new Date().toISOString().slice(0,10); }
function money(v){ return Number(v || 0).toLocaleString('pt-PT',{style:'currency',currency:'EUR'}); }
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function toast(msg){ const el = qs('#toast'); el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),2600); }
function qs(s){ return document.querySelector(s); }
function qsa(s){ return [...document.querySelectorAll(s)]; }
function companyName(){ return state.settings?.companyName || 'AutoParts CallCenter'; }
function isLoginPage(){ return window.LOGIN_PAGE === true || (window.location.pathname.split('/').pop() || '').toLowerCase() === 'login.html'; }
function redirectToLogin(){ if(!isLoginPage()) window.location.href = 'login.html'; }
function redirectAfterLogin(){ if(isLoginPage()) window.location.href = pageUrl('dashboard'); }
function getLocalTheme(){
  const localTheme = localStorage.getItem(THEME_KEY);
  return localTheme === 'dark' || localTheme === 'normal' ? localTheme : '';
}
function currentTheme(){
  const localTheme = getLocalTheme();
  if(localTheme) return localTheme;
  return state.settings?.theme === 'dark' ? 'dark' : 'normal';
}
function isElectronMode(){
  try {
    return /Electron/i.test(navigator.userAgent || '') || new URLSearchParams(window.location.search || '').get('electron') === '1';
  } catch {
    return /Electron/i.test(navigator.userAgent || '');
  }
}
function getLocalResolution(){
  const value = localStorage.getItem(RESOLUTION_KEY);
  return ['auto','compact','standard','wide','large'].includes(value) ? value : '';
}
function currentResolution(){
  const local = getLocalResolution();
  if(local) return local;
  // No Electron a app estava a ficar demasiado grande.
  // Sem preferência guardada, usamos Compacto por defeito no Electron.
  if(isElectronMode()) return 'compact';
  return state.settings?.resolution || 'auto';
}
function effectiveResolution(){
  const selected = currentResolution();
  if(selected !== 'auto') return selected;
  const w = window.innerWidth || document.documentElement.clientWidth || 1366;
  const h = window.innerHeight || document.documentElement.clientHeight || 768;
  const dpr = window.devicePixelRatio || 1;
  if(w <= 1280 || h <= 720) return 'compact';
  if(w >= 2100 && dpr <= 1.25) return 'large';
  if(w >= 1600) return 'wide';
  return 'standard';
}
function persistResolution(value){
  const next = ['auto','compact','standard','wide','large'].includes(value) ? value : 'auto';
  localStorage.setItem(RESOLUTION_KEY, next);
  state.settings = state.settings || {};
  state.settings.resolution = next;
  saveLocalOnly();
}
function persistTheme(theme){
  const next = theme === 'dark' ? 'dark' : 'normal';
  localStorage.setItem(THEME_KEY, next);
  state.settings = state.settings || {};
  state.settings.theme = next;
  saveLocalOnly();
}
function applyTheme(){
  const dark = currentTheme() === 'dark';
  const resolution = currentResolution();
  const resolvedResolution = effectiveResolution();
  document.documentElement.classList.toggle('theme-dark', dark);
  document.body.classList.toggle('theme-dark', dark);
  document.body.classList.toggle('admin-master', isAdminMaster());
  const roleSlug = normalizeText(currentRole ? currentRole() : '').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'operador';
  ['role-admin-master','role-admin','role-supervisor','role-operador'].forEach(cls=>document.body.classList.remove(cls));
  document.body.classList.add(`role-${roleSlug}`);
  document.documentElement.classList.toggle('electron-mode', isElectronMode());
  document.body.classList.toggle('electron-mode', isElectronMode());
  document.documentElement.classList.toggle('res-auto', resolution === 'auto');
  document.body.classList.toggle('res-auto', resolution === 'auto');
  ['compact','standard','wide','large'].forEach(v=>{ document.documentElement.classList.toggle(`res-${v}`, resolvedResolution===v); document.body.classList.toggle(`res-${v}`, resolvedResolution===v); });
  const btn = qs('#themeToggleBtn');
  if(btn) btn.textContent = dark ? 'Modo Normal' : 'Darkmode';
}
function toggleTheme(){
  persistTheme(currentTheme() === 'dark' ? 'normal' : 'dark');
  applyTheme();
  toast(currentTheme() === 'dark' ? 'Darkmode ativo.' : 'Modo normal ativo.');
}
function managedPageList(){
  return pages.filter(p => !['dashboard','users','config','configs-user'].includes(p.id));
}
function defaultOperatorPageAccess(){
  return managedPageList().reduce((acc,p)=>{ acc[p.id] = true; return acc; }, {});
}
function operatorPageAccess(){
  return { ...defaultOperatorPageAccess(), ...(state.settings?.operatorPageAccess || {}) };
}
function currentUserRecordSafe(){
  return currentUserRecord ? currentUserRecord() : null;
}
function hasOwn(obj, key){
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}
function userPageOverride(user, pageId){
  const access = user?.pageAccess || {};
  return hasOwn(access, pageId) ? access[pageId] === true : null;
}
function userCanOpenManagedPage(user, pageId){
  const override = userPageOverride(user, pageId);
  if(override !== null) return override;
  return operatorPageAccess()[pageId] !== false;
}
function pageUrl(id){ return pageFiles[id] || 'index.html'; }
function setPendingPageLoader(target){ try{ sessionStorage.setItem('apcc_pending_page', target || currentPage || ''); }catch{} }
function clearPendingPageLoader(){ try{ sessionStorage.removeItem('apcc_pending_page'); }catch{} }
function pageSkeleton(id){
  const meta = pages.find(p=>p.id===id) || pages[0];
  return `<div class="page-skeleton"><div class="skeleton-head"><div class="skeleton-chip"></div><div class="skeleton-title"></div><div class="skeleton-line"></div></div><div class="skeleton-grid"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div><div class="skeleton-footer"></div></div>`;
}
function goPage(id){
  // Não limpar a página antes de navegar: evitava-se o refresh, mas causava ecrã branco por milésimos.
  setPendingPageLoader(id);
  document.body.classList.add('page-changing-soft');
  window.location.href = pageUrl(id);
}
function canOpenPage(id){
  if(id === 'dashboard' || id === 'configs-user') return true;
  if(isAdminMaster()) return true;
  if(id === 'users') return hasPermission('manageUsers') || hasPermission('approveUsers');
  if(id === 'config') return hasPermission('manageSettings');
  const managedIds = managedPageList().map(p=>p.id);
  if(managedIds.includes(id)) {
    if(currentRole() === 'Operador') return userCanOpenManagedPage(currentUserRecord(), id);
    return true;
  }
  return hasPermission('manageSettings');
}
function getDefaultPage(){
  if (window.DEFAULT_PAGE) return window.DEFAULT_PAGE;
  const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const found = Object.entries(pageFiles).find(([, f]) => f.toLowerCase() === file);
  return found ? found[0] : 'dashboard';
}
function showApp(){
  if(isLoginPage()) { redirectAfterLogin(); return; }
  document.body.classList.remove('auth-boot');
  applyTheme();
  qs('#loginScreen')?.classList.add('hidden');
  qs('#appShell')?.classList.remove('hidden');
  buildNav();
  bindShell();
  ensureGlobalSearchBox();
  ensureBrandFavicon();
  checkAutoBackup();
  syncCurrentUserName();
  renderPage(currentPage);
}


async function autoConnectFirebaseForLocalSession(){
  if(!firebaseReady || !firebaseAuth || firebaseAuth.currentUser) return false;
  const stored = getStoredSession();
  const hasSession = !!(stored?.email || state.currentUser?.email);
  if(!hasSession) return false;
  try {
    await ensureFirebaseReadForLocalSession();
    if(firebaseAuth.currentUser) {
      await loadCloudState({ readOnly: firebaseAuth.currentUser.isAnonymous });
      updateFirebaseStatusBadge();
      return true;
    }
  } catch(err){
    console.warn('Firebase auto connect failed', err);
  }
  return false;
}

async function init(){
  applyTheme();
  buildNav();
  bindShell();
  restoreLogin();

  const hasLocalSession = restoreStoredSession();
  await initFirebase();

  if (firebaseReady) {
    firebaseAuth.onAuthStateChanged(async user => {
      if (user) {
        if(user.isAnonymous) {
          await loadCloudState({ readOnly:true });
          const stored = getStoredSession();
          if(stored?.email && !state.currentUser?.email) state.currentUser = { email: stored.email, name: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0], nome: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0] };
          if(stored?.email && !appIsVisible() && !isLoginPage()) showApp();
          return;
        }
        await loadCloudState();
        if (pendingSignupUser && pendingSignupUser.email?.toLowerCase() === user.email?.toLowerCase()) {
          upsertAppUser({ ...pendingSignupUser, id:user.uid });
          syncCurrentUserName();
          pendingSignupUser = null;
          saveLocalOnly();
        }
        if(!userIsActive()) {
          clearStoredSession();
          toast('Conta pendente de aprovação pelo Admin Master.');
          qs('#appShell').classList.add('hidden');
          document.body.classList.remove('auth-boot');
          qs('#loginScreen').classList.remove('hidden');
          return;
        }
        syncCurrentUserName();
        setStoredSession(state.currentUser || { email:user.email, name:preferredUserName((user.email || 'Admin').split('@')[0]) });
        showApp();
        await flushPendingCloudSave();
        toast('Firebase ligado. Autosave ativo.');
      } else {
        const stored = getStoredSession();
        if(stored?.email) {
          state.currentUser = { email: stored.email, name: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0], nome: stored.name || userNameFromEmail(stored.email) || String(stored.email).split('@')[0] };
          saveLocalOnly();
          if(!appIsVisible()) showApp();
          autoConnectFirebaseForLocalSession();
          return;
        }
        state.currentUser = null;
        saveLocalOnly();
        if(!isLoginPage()) { redirectToLogin(); return; }
        qs('#appShell')?.classList.add('hidden');
        document.body.classList.remove('auth-boot');
        qs('#loginScreen')?.classList.remove('hidden');
      }
    });
    return;
  }

  if(state.currentUser || hasLocalSession) showApp();
  else {
    if(!isLoginPage()) { redirectToLogin(); return; }
    document.body.classList.remove('auth-boot');
  }
}

function restoreLogin(){
  const emailInput = qs('#loginEmail');
  const passwordInput = qs('#loginPassword');
  const rememberInput = qs('#rememberLogin');
  const saved = localStorage.getItem('autoparts_remembered_email_v2') || '';
  if(emailInput) emailInput.value = saved;
  if(passwordInput && !passwordInput.value) passwordInput.value = '';
  if(rememberInput) rememberInput.checked = !!saved;
  enhanceLoginScreen();
  qs('#loginBtn')?.addEventListener('click', login);
  qs('#loginPassword')?.addEventListener('keydown', e => { if(e.key === 'Enter') login(); });
}
function enhanceLoginScreen(){
  const card = qs('.login-card');
  if(!card || qs('#signupPanel')) return;
  card.insertAdjacentHTML('beforeend', `
    <div class="login-switch">
      <button id="showLoginBtn" class="btn small primary" type="button">Entrar</button>
      <button id="showSignupBtn" class="btn small" type="button">Criar conta</button>
    </div>
    <div id="signupPanel" class="signup-panel hidden">
      <h3>Criar conta</h3>
      <input id="signupName" type="text" placeholder="Nome" autocomplete="name" />
      <input id="signupEmail" type="email" placeholder="Email" autocomplete="email" />
      <input id="signupPassword" type="password" placeholder="Password" autocomplete="new-password" />
      <input id="signupPasswordConfirm" type="password" placeholder="Confirmar password" autocomplete="new-password" />
      <button id="signupBtn" class="btn primary full" type="button">Criar conta e entrar</button>
      <small>A conta fica criada no Firebase Auth e entra como Operador.</small>
    </div>`);
  qs('#showLoginBtn').addEventListener('click',()=>toggleSignup(false));
  qs('#showSignupBtn').addEventListener('click',()=>toggleSignup(true));
  qs('#signupBtn').addEventListener('click', signupFromLogin);
}
function toggleSignup(show){
  qs('#signupPanel')?.classList.toggle('hidden', !show);
  qs('#showSignupBtn')?.classList.toggle('primary', show);
  qs('#showLoginBtn')?.classList.toggle('primary', !show);
  if(show) {
    qs('#signupEmail').value = qs('#loginEmail').value || '';
    qs('#signupPassword').value = '';
    qs('#signupPasswordConfirm').value = '';
  }
}

function localLoginUserForEmail(email){
  const cleanEmail = String(email || '').trim().toLowerCase();
  if(!cleanEmail) return null;
  const existing = (state.users || []).find(u => String(u.email || '').toLowerCase() === cleanEmail);
  if(existing) return existing;
  if(cleanEmail === 'pica.fern@gmail.com') {
    const master = { id:uid('USR'), nome:'Ricardo', email:'pica.fern@gmail.com', role:'Admin Master', status:'Ativo', pageAccess:{}, actionAccess:{} };
    state.users = Array.isArray(state.users) ? state.users : [];
    state.users.push(master);
    return master;
  }
  return { id:uid('USR'), nome:cleanEmail.split('@')[0], email:cleanEmail, role:'Operador', status:'Ativo', pageAccess:{}, actionAccess:{} };
}
async function ensureFirebaseReadForLocalSession(){
  if(!firebaseReady || !firebaseAuth || firebaseAuth.currentUser) return false;
  try {
    if(firebaseAuth.signInAnonymously) {
      await firebaseAuth.signInAnonymously();
      await loadCloudState({ readOnly:true });
      toast('Firebase ligado em modo leitura.');
      return true;
    }
  } catch(err) {
    console.warn('Firebase anonymous/read fallback failed', err);
  }
  return false;
}
async function finishLocalLogin(email, reason=''){
  const user = localLoginUserForEmail(email);
  if(!user) return toast('Conta não encontrada.');
  if(String(user.status || 'Ativo').toLowerCase() === 'pendente') return toast('Conta pendente de aprovação pelo Admin Master.');
  if(String(user.status || 'Ativo').toLowerCase() === 'inativo') return toast('Conta inativa. Fala com o Admin Master.');
  state.currentUser = { email:user.email, name:user.nome || String(user.email).split('@')[0] };
  setStoredSession(state.currentUser);
  saveLocalOnly();
  const cloudRead = await ensureFirebaseReadForLocalSession();
  saveState(reason || (cloudRead ? 'Login local com leitura Firebase' : 'Login local'));
  if(reason && !cloudRead) toast(reason);
  showApp();
}
async function login(){
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPassword').value;
  if(!email) return toast('Mete o email para entrar.');
  if(qs('#rememberLogin')?.checked) localStorage.setItem('autoparts_remembered_email_v2', email);
  else localStorage.removeItem('autoparts_remembered_email_v2');
  if (firebaseReady) {
    if(!password) return toast('Mete a password para entrar.');
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      return;
    } catch (err) {
      console.warn('Firebase login failed; using local fallback when possible', err);
      await finishLocalLogin(email, 'Firebase falhou. Entrei em modo local.');
      return;
    }
  }
  await finishLocalLogin(email);
}
async function signupFromLogin(){
  if(!firebaseReady) return toast('Firebase indisponível. Tenta novamente com internet.');
  const nome = qs('#signupName').value.trim();
  const email = qs('#signupEmail').value.trim();
  const password = qs('#signupPassword').value;
  const confirm = qs('#signupPasswordConfirm').value;
  if(!nome || !email || !password) return toast('Preenche nome, email e password.');
  if(password.length < 6) return toast('A password precisa de pelo menos 6 caracteres.');
  if(password !== confirm) return toast('As passwords não coincidem.');
  try {
    const isMasterSignup = String(email || '').toLowerCase() === 'pica.fern@gmail.com';
    const signupRole = isMasterSignup ? 'Admin Master' : 'Operador';
    const signupStatus = isMasterSignup ? 'Ativo' : 'Pendente';
    pendingSignupUser = { nome, email, role:signupRole, status:signupStatus };
    const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    await firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(credential.user.uid).set({
      id: credential.user.uid,
      nome,
      email,
      role:signupRole,
      status:signupStatus,
      pageAccess:{},
      actionAccess:{},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy:isMasterSignup ? 'signup-admin-master' : 'signup-login'
    }, { merge:true });
    if(qs('#rememberLogin')?.checked) localStorage.setItem('autoparts_remembered_email_v2', email);
    else localStorage.removeItem('autoparts_remembered_email_v2');
    toast(String(email || '').toLowerCase() === 'pica.fern@gmail.com' ? 'Conta Admin Master criada. Já podes entrar.' : 'Conta criada. Aguarda aprovação do Admin Master.');
  } catch (err) {
    pendingSignupUser = null;
    console.warn('Signup failed', err);
    if(err.code === 'auth/email-already-in-use') return toast('Este email já tem conta. Usa Entrar.');
    if(err.code === 'auth/operation-not-allowed') return toast('Ativa Email/Password no Firebase Auth.');
    return toast('Não foi possível criar conta. Confirma os dados.');
  }
}

function buildNav(){
  const nav = qs('#navMenu');
  if(!nav) return;
  nav.innerHTML = pages.filter(p=>canOpenPage(p.id)).map(p => `<a class="nav-btn" href="${pageUrl(p.id)}" data-page="${p.id}"><span class="nav-icon">${p.icon}</span><span>${p.title}</span></a>`).join('');
}

async function logoutCurrentUser(){
  stopFirebaseListeners();
  clearStoredSession();
  if (firebaseReady && firebaseAuth?.currentUser) await firebaseAuth.signOut();
  state.currentUser = null;
  saveLocalOnly();
  qs('#appShell')?.classList.add('hidden');
  document.body.classList.remove('auth-boot');
  if(!isLoginPage()) { redirectToLogin(); return; }
  qs('#loginScreen')?.classList.remove('hidden');
}

function bindShell(){
  const home = qs('#homeBtn');
  const logout = qs('#logoutBtn');
  if(!home || !logout || home.dataset.bound === '1') return;
  home.dataset.bound = '1';
  logout.dataset.bound = '1';
  home.addEventListener('click',()=>goPage('dashboard'));
  logout.addEventListener('click', logoutCurrentUser);
}


function spellcheckEnabled(){
  return state.settings?.spellcheckEnabled !== false;
}
function mirrorCase(original, replacement){
  if(!original) return replacement;
  if(original === original.toUpperCase()) return replacement.toUpperCase();
  if(original[0] === original[0].toUpperCase()) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  return replacement;
}
function correctionPairs(){
  return [
    ['automaveis','automóveis'], ['automovel','automóvel'], ['pecas','peças'], ['orcamento','orçamento'], ['orcamentos','orçamentos'],
    ['referencia','referência'], ['numero','número'], ['telemovel','telemóvel'], ['armazem','armazém'], ['seccao','secção'], ['seccoes','secções'], ['secssao','secção'], ['sessoes','secções'],
    ['informacao','informação'], ['informacoes','informações'], ['configuracao','configuração'], ['configuracoes','configurações'], ['operacao','operação'], ['operacoes','operações'],
    ['necessario','necessário'], ['necessaria','necessária'], ['disponivel','disponível'], ['possivel','possível'], ['proximo','próximo'], ['proxima','próxima'],
    ['tambem','também'], ['apos','após'], ['ja','já'], ['nao','não'], ['estao','estão'], ['sao','são'], ['sera','será'], ['ate','até'], ['so','só'], ['voce','você'],
    ['porfavor','por favor'], ['obrigadao','obrigadão']
  ];
}
function smartCorrectText(text){
  let output = String(text || '');
  let changes = 0;
  correctionPairs().forEach(([wrong,right])=>{
    const re = new RegExp(`\\b${wrong}\\b`, 'gi');
    output = output.replace(re, match => { changes++; return mirrorCase(match, right); });
  });
  const beforeSpaces = output;
  output = output
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])([^\s\n])/g, '$1 $2')
    .replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  if(output !== beforeSpaces) changes++;
  return { text: output, changes };
}
function correctElementText(el){
  if(!el) return;
  const original = el.value || '';
  const corrected = smartCorrectText(original);
  if(corrected.text === original) return toast('Não encontrei correções automáticas nesse texto.');
  el.value = corrected.text;
  el.dispatchEvent(new Event('input', { bubbles:true }));
  el.focus();
  toast('Texto corrigido. Confirma antes de guardar.');
}
function shouldShowCorrectButton(el){
  const name = (el.getAttribute('name') || '').toLowerCase();
  const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
  if(el.tagName === 'TEXTAREA') return true;
  return ['notas','observacoes','condicoes','descricao','mensagem','body','title','related','peca'].some(k => name.includes(k) || placeholder.includes(k));
}
function applySpellcheckEnhancements(root=document){
  const enabled = spellcheckEnabled();
  const fields = [...root.querySelectorAll('textarea, input')];
  fields.forEach(el=>{
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if(['email','tel','number','date','time','password','checkbox','radio','file','hidden'].includes(type)) return;
    el.spellcheck = enabled;
    el.setAttribute('lang','pt-PT');
    el.setAttribute('autocomplete', el.getAttribute('autocomplete') || 'off');
    if(!enabled || el.dataset.spellEnhanced === '1' || el.readOnly || el.disabled || !shouldShowCorrectButton(el)) return;
    el.dataset.spellEnhanced = '1';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn small spellcheck-btn${el.classList.contains('span3') ? ' span3' : ''}`;
    btn.textContent = 'Corrigir texto';
    btn.title = 'Aplicar correções automáticas simples em português';
    btn.addEventListener('click',()=>correctElementText(el));
    el.insertAdjacentElement('afterend', btn);
  });
}

function renderPage(id){
  if(!canOpenPage(id)) {
    toast('Sem permissão para abrir esta página.');
    id = 'dashboard';
  }
  currentPage = id;
  qs('#appShell')?.classList.toggle('dashboard-mode', id === 'dashboard');
  applyTheme();
  updateGlobalSearchVisibility(id);
  const meta = pages.find(p=>p.id===id) || pages[0];
  qs('#pageTitle').textContent = meta.title;
  qs('#pageSubtitle').textContent = meta.subtitle;
  qsa('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
  const renderers = { dashboard, 'nova-chamada': novaChamada, pedidos, clientes, contactos, fornecedores, orcamentos, agenda, stock, relatorios, users, 'configs-user': configsUser, config };
  const pageBody = renderers[id]();
  const content = qs('#pageContent');
  if(content) content.innerHTML = `${excelToolbar(id)}${pageBody}`;
  bindPage(id);
  applySpellcheckEnhancements(qs('#pageContent'));
  document.body.classList.remove('page-loading','page-changing','page-changing-soft');
  clearPendingPageLoader();
}


function userNameFromEmail(email){
  const clean = String(email || '').toLowerCase();
  if(!clean) return '';
  const user = (state.users || []).find(u => String(u.email || '').toLowerCase() === clean);
  return user?.nome || user?.name || '';
}
function preferredUserName(fallback='Utilizador'){
  const authEmail = firebaseAuth?.currentUser?.email || '';
  const sessionEmail = state.currentUser?.email || authEmail || '';
  const fromUsers = userNameFromEmail(sessionEmail);
  const raw = fromUsers || state.currentUser?.nome || state.currentUser?.name || firebaseAuth?.currentUser?.displayName || fallback;
  const clean = String(raw || '').trim();
  if(!clean || clean.includes('@')) return String(sessionEmail || fallback).split('@')[0] || fallback;
  return clean;
}
function syncCurrentUserName(){
  const email = state.currentUser?.email || firebaseAuth?.currentUser?.email || '';
  if(!email) return;
  const name = preferredUserName(String(email).split('@')[0]);
  state.currentUser = { ...(state.currentUser || {}), email, name, nome:name };
  const badge = qs('#userBadge');
  if(badge) badge.textContent = name;
}
function currentAppUser(){
  const email = (state.currentUser?.email || firebaseAuth?.currentUser?.email || '').toLowerCase();
  return (state.users || []).find(u => (u.email || '').toLowerCase() === email) || null;
}
function currentDisplayName(){
  const full = preferredUserName('Utilizador');
  return String(full || 'Utilizador').split(' ')[0].trim() || 'Utilizador';
}
function normalizeText(v){
  return String(v || '').trim().toLowerCase();
}
function isMineByOperator(row){
  const appUser = currentAppUser();
  const names = [
    appUser?.nome,
    appUser?.email,
    state.currentUser?.name,
    state.currentUser?.email,
    firebaseAuth?.currentUser?.email
  ].filter(Boolean).map(normalizeText);
  const operator = normalizeText(row?.operador || row?.createdBy || row?.updatedBy || row?.email || '');
  if(!operator) return false;
  return names.some(n => n && (operator === n || operator.includes(n) || n.includes(operator)));
}
function personalDashboardData(){
  const allCalls = state.calls || [];
  let myCalls = allCalls.filter(isMineByOperator);
  const hasOperatorData = allCalls.some(c => c.operador || c.createdBy || c.updatedBy);
  if(!myCalls.length && !hasOperatorData) myCalls = [];
  const myCallIds = new Set(myCalls.map(c => c.id));
  const myQuotes = (state.quotes || []).filter(q => myCallIds.has(q.callId) || isMineByOperator(q));
  const open = myCalls.filter(c => !['Concluído','Perdido'].includes(c.estado)).length;
  const urgent = myCalls.filter(c => ['Urgente','Muito urgente'].includes(c.urgencia) && !['Concluído','Perdido'].includes(c.estado)).length;
  const done = myCalls.filter(c => c.estado === 'Concluído').length;
  const quoted = myQuotes.length;
  const sale = myCalls.reduce((sum,c)=>sum+Number(c.precoVenda||0),0) + myQuotes.reduce((sum,q)=>sum+(!myCallIds.has(q.callId) ? Number(q.total||0) : 0),0);
  const cost = myCalls.reduce((sum,c)=>sum+Number(c.precoCompra||0),0);
  return { myCalls, myQuotes, open, urgent, done, quoted, sale, margin: sale - cost };
}
function personalStat(label, value, note){
  return `<div class="personal-stat"><span>${esc(label)}</span><strong>${value}</strong><small>${esc(note || '')}</small></div>`;
}
function dashboard(){
  const visiblePages = pages.filter(p => p.id !== 'dashboard' && canOpenPage(p.id));
  const userName = currentDisplayName();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : (hour < 19 ? 'Boa tarde' : 'Boa noite');
  return `
    <div class="dashboard-apps-only premium-dashboard">
      <div class="dashboard-hero">
        <div class="dashboard-hero-copy">
          <span class="hero-kicker">${greet}, ${esc(userName)}</span>
          <h1>Portal do Callcenter</h1>
          <p>Acede rapidamente às áreas principais da operação.</p>
        </div>
        <div class="dashboard-user-corner">
          <div class="dashboard-user-chip">
            <span class="dashboard-user-avatar">${esc(userName.charAt(0).toUpperCase())}</span>
            <div>
              <small>Utilizador ativo</small>
              <strong>${esc(userName)}</strong>
            </div>
          </div>
          <button id="dashboardLogoutBtn" class="btn danger-soft dashboard-logout" type="button">Terminar sessão</button>
        </div>
        <div class="dashboard-az-watermark"></div>
      </div>
      <div class="apps-center">
        <div class="apps-title premium">
          <span>Menu principal</span>
          <h2>Escolhe a página</h2>
        </div>
        <div class="apps-button-grid premium">
          ${visiblePages.map(p => `
            <button class="big-page-button premium" data-page-card="${p.id}">
              <span class="big-page-icon">${p.icon}</span>
              <div class="big-page-copy">
                <strong>${esc(p.title)}</strong>
                <small>${esc(p.subtitle || '')}</small>
              </div>
              <span class="big-page-arrow">${ICONS.arrow}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
}
function metric(label,value,note){ return `<div class="card metric"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`; }
function globalSearchRows(){
  const contacts = (state.contactGroups || []).flatMap(g => (g.contactos || []).map(c => ({ type:'Contacto', title:c.nome, detail:`${g.nome} · ${c.telemovel || c.telefone || ''} · ${c.email || ''}`, page:'contactos' })));
  return [
    ...state.clients.map(c=>({ type:'Cliente', title:c.nome, detail:`${clientCode(c)} · ${c.telefone || ''} · ${c.email || ''}`, page:'clientes', id:c.id })),
    ...state.calls.map(c=>({ type:'Pedido', title:c.cliente, detail:`${c.matricula || ''} · ${c.peca || ''} · ${c.estado || ''}`, page:'pedidos' })),
    ...state.quotes.map(q=>({ type:'Orçamento', title:q.cliente, detail:`${q.id} · ${q.peca || ''} · ${money(q.total)}`, page:'orcamentos' })),
    ...contacts
  ];
}
function globalSearchResults(query){
  const q = (query || '').toLowerCase();
  if(!q) return '<div class="empty compact">Pesquisa global pronta.</div>';
  const rows = globalSearchRows().filter(r => `${r.type} ${r.title} ${r.detail}`.toLowerCase().includes(q)).slice(0,8);
  if(!rows.length) return '<div class="empty compact">Sem resultados.</div>';
  return `<div class="search-results">${rows.map(r=>`<button class="search-result" data-go="${r.page}" ${r.id?`data-client-detail="${r.id}"`:''}><strong>${esc(r.type)} · ${esc(r.title || '-')}</strong><span>${esc(r.detail || '')}</span></button>`).join('')}</div>`;
}

function novaChamada(){
  return `<div class="card">
    <div class="card-head"><h3>Registar chamada / pedido</h3><span class="muted">Guarda o cliente e cria o pedido automaticamente.</span></div>
    <form id="callForm" class="form-grid">
      ${input('cliente','Nome do cliente','text',true)}${input('telefone','Telefone','tel',true)}${input('email','Email','email')}
      ${input('matricula','Matrícula','text')}${input('marca','Marca','text',true)}${input('modelo','Modelo','text',true)}
      ${input('ano','Ano','number')}${input('motor','Motor','text')}${input('vin','Chassis / VIN','text')}
      ${input('peca','Peça procurada','text',true)}${input('referencia','Referência da peça','text')}
      <select name="urgencia" class="select"><option>Normal</option><option>Urgente</option><option>Muito urgente</option></select>
      <select name="estado" class="select"><option>Novo</option><option>Em pesquisa</option><option>Orçamento enviado</option><option>Confirmado</option></select>
      ${input('operador','Operador','text')}${input('fornecedor','Fornecedor associado','text')}
      ${input('precoCompra','Preço compra','number')}${input('precoVenda','Preço venda','number')}
      <textarea name="observacoes" class="span3" placeholder="Observações internas"></textarea>
      <div class="span3 actions"><button class="btn primary" type="submit">Guardar chamada</button><button class="btn ghost" type="reset">Limpar</button></div>
    </form>
  </div>`;
}
function input(name, placeholder, type='text', req=false){ return `<input class="field" name="${name}" type="${type}" placeholder="${placeholder}" ${req?'required':''}/>`; }

function pedidos(){
  return `<div class="card">
    <div class="card-head"><h3>Pedidos de peças</h3><button class="btn primary small" data-go="nova-chamada">+ Novo pedido</button></div>
    ${filters('searchPedidos','filterEstado')}
    <div id="pedidosTable">${callsTable(filterCalls(), true)}</div>
  </div>`;
}
function filters(searchId, stateId){ return `<div class="toolbar"><input id="${searchId}" class="field" placeholder="Pesquisar cliente, peça, matrícula, marca..."/><select id="${stateId}" class="select"><option value="">Todos os estados</option>${states.map(s=>`<option>${s}</option>`).join('')}</select></div>`; }
function filterCalls(){
  const s = (qs('#searchPedidos')?.value || '').toLowerCase();
  const e = qs('#filterEstado')?.value || '';
  return state.calls.filter(c => (!e || c.estado===e) && JSON.stringify(c).toLowerCase().includes(s));
}
function callsTable(rows, actions=true){
  if(!rows.length) return '<div class="empty">Ainda não existem registos.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Viatura</th><th>Peça</th><th>Urgência</th><th>Estado</th><th>Venda</th>${actions?'<th>Ações</th>':''}</tr></thead><tbody>${rows.map(c=>`
    <tr><td>${esc(c.id)}</td><td><strong>${esc(c.cliente)}</strong><br><span class="muted">${esc(c.telefone)}</span></td><td>${esc(c.marca)} ${esc(c.modelo)}<br><span class="muted">${esc(c.matricula||'Sem matrícula')}</span></td><td>${esc(c.peca)}<br><span class="muted">${esc(c.referencia||'Sem referência')}</span></td><td>${badge(c.urgencia)}</td><td>${badge(c.estado)}</td><td>${money(c.precoVenda)}</td>${actions?`<td><div class="actions"><button class="btn small" data-edit-call="${c.id}">Editar</button><button class="btn success small" data-quote="${c.id}">Orçamento</button>${canDelete()?`<button class="btn danger small" data-delete-call="${c.id}">Apagar</button>`:''}</div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function badge(v){
  const map = {'Normal':'blue','Urgente':'orange','Muito urgente':'red','Novo':'blue','Em pesquisa':'orange','Orçamento enviado':'violet','Confirmado':'green','Concluído':'green','Perdido':'red','Pendente':'orange','Feito':'green','Ativo':'green','Inativo':'red','Rascunho':'blue','Cliente':'green','Fornecedor':'violet','Enviado':'green','Aceite':'green','Recusado':'red','Operador':'blue','Supervisor':'violet','Admin':'orange','Admin Master':'green'};
  return `<span class="badge ${map[v]||''}">${esc(v||'-')}</span>`;
}

function clientes(){
  const canEdit = canEditOperational();
  const total = state.clients.length;
  const withEmail = state.clients.filter(c=>c.email).length;
  const withPhone = state.clients.filter(c=>c.telefone).length;
  const addCard = canEdit ? `<div class="card compact-form-card clean-side-card">
      <div class="card-head clean-card-head"><div><h3>Novo cliente</h3><span class="muted">Registo rápido</span></div></div>
      <form id="clientForm" class="simple-stack-form">
        <input class="field" name="codigoCliente" placeholder="Código cliente" required>
        <input class="field" name="nome" placeholder="Nome do cliente" required>
        <input class="field" name="telefone" placeholder="Telefone">
        <input class="field" name="email" placeholder="Email">
        <textarea name="notas" placeholder="Notas internas"></textarea>
        <button class="btn primary full" type="submit">Guardar cliente</button>
      </form>
    </div>` : '';
  return `<div class="grid ${canEdit ? 'two split-form-list clean-page-layout' : 'single-list'} clients-page clean-module-page">
    ${addCard}
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Clientes</span><h3>Base de clientes</h3></div>
        <div class="clean-stats"><span><b>${total}</b> total</span><span><b>${withEmail}</b> email</span><span><b>${withPhone}</b> telefone</span></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar dados e enviar emails, mas não podes adicionar nem editar clientes.</div>' : ''}
      <div class="clean-search-row"><input id="clientSearch" class="field" placeholder="Pesquisar cliente, código, telefone ou email"></div>
      <div id="clientsTable">${clientsTable(state.clients)}</div>
    </div>
  </div>`;
}
function fornecedores(){
  const canEdit = canEditOperational();
  const rows = sortedSuppliers(state.suppliers);
  const addCard = canEdit ? `<div class="card compact-form-card clean-side-card">
      <div class="card-head clean-card-head"><div><h3>Novo fornecedor</h3><span class="muted">Marca + código</span></div></div>
      <form id="supplierForm" class="simple-stack-form">
        <input class="field" name="nomeMarca" placeholder="Nome do fornecedor / marca" required>
        <input class="field" name="codigoFicha" placeholder="Código de ficha" required>
        <button class="btn primary full" type="submit">Guardar fornecedor</button>
      </form>
    </div>` : '';
  return `<div class="grid ${canEdit ? 'two split-form-list clean-page-layout' : 'single-list'} suppliers-page clean-module-page">
    ${addCard}
    <div class="card supplier-list-card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Fornecedores</span><h3>Lista A-Z</h3></div>
        <div class="clean-stats"><span><b>${rows.length}</b> registos</span></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar os fornecedores, sem adicionar nem editar.</div>' : ''}
      <div class="clean-search-row"><input id="supplierSearch" class="field" placeholder="Pesquisar por fornecedor ou código de ficha"></div>
      <div id="suppliersTable">${suppliersTable(rows)}</div>
    </div>
  </div>`;
}
function contactos(){
  const warehouses = uniqueWarehouses();
  const sections = uniqueSections();
  const canEdit = canEditOperational();
  const totalContacts = contactCount();
  const addCard = canEdit ? `<div class="card directory-add-card compact-form-card clean-side-card">
      <div class="card-head clean-card-head"><div><h3>Contacto rápido</h3><span class="muted">Armazém → Secção</span></div></div>
      <form id="quickContactForm" class="simple-stack-form directory-simple-form">
        <input class="field" name="armazem" list="warehouseList" placeholder="Armazém" required>
        <datalist id="warehouseList">${warehouses.map(w=>`<option value="${esc(w)}"></option>`).join('')}</datalist>
        <input class="field" name="seccao" list="sectionList" placeholder="Secção" required>
        <datalist id="sectionList">${sections.map(sec=>`<option value="${esc(sec)}"></option>`).join('')}</datalist>
        <input class="field" name="nome" placeholder="Nome do contacto" required>
        <div class="mini-two-fields"><input class="field" name="telemovel" placeholder="Telemóvel"><input class="field" name="telefone" placeholder="Telefone"></div>
        <input class="field" name="email" type="email" placeholder="Email">
        <button class="btn primary full" type="submit">Guardar contacto</button>
      </form>
    </div>` : '';
  return `<div class="grid ${canEdit ? 'two split-form-list clean-page-layout' : 'single-list'} contacts-page directory-clean-page clean-module-page">
    ${addCard}
    <div class="card directory-main-card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Diretório</span><h3>Armazéns e secções</h3></div>
        <div class="clean-stats"><span><b>${warehouses.length}</b> armazéns</span><span><b>${sections.length}</b> secções</span><span><b>${totalContacts}</b> contactos</span></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar contactos, ligar ou enviar email, mas não podes adicionar nem editar.</div>' : ''}
      <div class="clean-search-row"><input id="contactSearch" class="field" placeholder="Pesquisar armazém, secção, nome, telefone ou email"></div>
      <div id="contactsTable">${contactGroupsView(filterContactGroups())}</div>
    </div>
  </div>`;
}
function normalizeContactDirectory(){
  state.contactGroups = (state.contactGroups || []).map(group => {
    const seccao = group.seccao || group.nome || 'Geral';
    const armazem = group.armazem || group.local || group.empresa || 'Geral';
    return { ...group, armazem, seccao, nome: seccao, contactos: group.contactos || [] };
  });
}
function contactWarehouse(group){ return group.armazem || group.local || group.empresa || 'Geral'; }
function contactSection(group){ return group.seccao || group.nome || 'Geral'; }
function uniqueWarehouses(){
  normalizeContactDirectory();
  return orderedWarehouses([...new Set((state.contactGroups || []).map(contactWarehouse).filter(Boolean))]);
}
function allWarehouseNames(){
  normalizeContactDirectory();
  return [...new Set((state.contactGroups || []).map(contactWarehouse).filter(Boolean))];
}
function normalizeWarehouseOrder(){
  state.settings = state.settings || {};
  const names = [...new Set(allWarehouseNames())].sort((a,b)=>a.localeCompare(b,'pt',{sensitivity:'base',numeric:true}));
  const saved = Array.isArray(state.settings.warehouseOrder) ? state.settings.warehouseOrder : [];
  const kept = saved.filter(name => names.some(n => n.toLowerCase() === String(name).toLowerCase()));
  const missing = names.filter(name => !kept.some(k => String(k).toLowerCase() === name.toLowerCase()));
  state.settings.warehouseOrder = [...kept, ...missing];
  return state.settings.warehouseOrder;
}
function orderedWarehouses(names){
  const order = normalizeWarehouseOrder();
  return [...names].sort((a,b)=>{
    const ia = order.findIndex(x => String(x).toLowerCase() === String(a).toLowerCase());
    const ib = order.findIndex(x => String(x).toLowerCase() === String(b).toLowerCase());
    const aa = ia === -1 ? 9999 : ia;
    const bb = ib === -1 ? 9999 : ib;
    return aa - bb || String(a).localeCompare(String(b),'pt',{sensitivity:'base',numeric:true});
  });
}
function moveWarehouse(name, direction){
  const order = normalizeWarehouseOrder();
  const idx = order.findIndex(x => String(x).toLowerCase() === String(name).toLowerCase());
  if(idx < 0) return false;
  const next = idx + direction;
  if(next < 0 || next >= order.length) return false;
  [order[idx], order[next]] = [order[next], order[idx]];
  state.settings.warehouseOrder = order;
  return true;
}
function resetWarehouseOrder(){
  state.settings = state.settings || {};
  state.settings.warehouseOrder = allWarehouseNames().sort((a,b)=>a.localeCompare(b,'pt',{sensitivity:'base',numeric:true}));
}
function uniqueSections(){
  normalizeContactDirectory();
  return [...new Set((state.contactGroups || []).map(contactSection).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
}
function contactCount(){
  normalizeContactDirectory();
  return (state.contactGroups || []).reduce((sum, group)=>sum + (group.contactos || []).length, 0);
}
function filterContactGroups(){
  normalizeContactDirectory();
  const q = (qs('#contactSearch')?.value || '').trim().toLowerCase();
  const groups = state.contactGroups || [];
  if(!q) return groups;
  return groups.map(group => {
    const fullGroup = `${contactWarehouse(group)} ${contactSection(group)}`.toLowerCase();
    const groupMatch = fullGroup.includes(q);
    const contactos = (group.contactos || []).filter(c => `${fullGroup} ${c.nome || ''} ${c.telemovel || ''} ${c.telefone || ''} ${c.email || ''}`.toLowerCase().includes(q));
    return groupMatch ? { ...group, aberto:true } : { ...group, aberto:true, contactos };
  }).filter(group => (group.contactos || []).length || `${contactWarehouse(group)} ${contactSection(group)}`.toLowerCase().includes(q));
}
function groupedByWarehouse(groups){
  return groups.reduce((acc, group) => {
    const armazem = contactWarehouse(group);
    if(!acc[armazem]) acc[armazem] = [];
    acc[armazem].push(group);
    return acc;
  }, {});
}
function contactGroupsView(groups){
  if(!groups.length) return '<div class="empty">Sem contactos encontrados.</div>';
  const grouped = groupedByWarehouse(groups);
  const warehouses = orderedWarehouses(Object.keys(grouped));
  const q = (qs('#contactSearch')?.value || '').trim();
  return `<div class="directory-simple-view">${warehouses.map(armazem => {
    const sections = grouped[armazem].sort((a,b)=>contactSection(a).localeCompare(contactSection(b),'pt'));
    const total = sections.reduce((sum,g)=>sum + (g.contactos || []).length, 0);
    const anyOpen = sections.some(g => g.aberto);
    return `<section class="warehouse-simple-card">
      <div class="warehouse-simple-head">
        <div class="warehouse-title-block">
          <span class="warehouse-dot"></span>
          <div>
            <strong>${esc(armazem)}</strong>
            <small>${total} contacto(s) · ${sections.length} secção(ões)</small>
          </div>
        </div>
      </div>

      <div class="section-chip-bar">
        ${sections.map(group => {
          const opened = q ? true : (group.aberto || (!anyOpen && sections.length === 1));
          return `<button class="section-chip ${opened ? 'active' : ''}" type="button" data-toggle-contact-group="${group.id}">
            <span>${esc(contactSection(group))}</span>
            <b>${(group.contactos || []).length}</b>
          </button>`;
        }).join('')}
      </div>

      <div class="section-content-list">
        ${sections.map(group => contactSectionView(group, q ? true : (!anyOpen && sections.length === 1))).join('')}
      </div>
    </section>`;
  }).join('')}</div>`;
}
function contactSectionView(group, forceOpen=false){
  const rows = group.contactos || [];
  const opened = forceOpen || group.aberto;
  return `<div class="directory-section-simple ${opened ? '' : 'hidden'}">
    <div class="section-simple-head">
      <div>
        <strong>${esc(contactSection(group))}</strong>
        <span>${rows.length} contacto(s)</span>
      </div>
      <div class="section-simple-actions">
        ${canEditOperational()?`<button class="btn small ghost" data-add-contact-section="${group.id}">+ Contacto</button><button class="btn small ghost" data-edit-contact-section="${group.id}">${ICONS.edit}<span>Secção</span></button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-contact-group="${group.id}">Apagar</button>`:''}
      </div>
    </div>
    ${contactsCards(group)}
  </div>`;
}
function contactsCards(group){
  const rows = group.contactos || [];
  if(!rows.length) return '<div class="empty compact-empty">Sem contactos nesta secção.</div>';
  return `<div class="simple-contact-list">${rows.map(c=>`
    <article class="simple-contact-row">
      <div class="simple-contact-identity">
        <strong>${esc(c.nome || '-')}</strong>
        <span>${esc(c.email || 'Sem email')}</span>
      </div>
      <div class="simple-contact-info">
        ${c.telemovel ? `<a href="tel:${esc(c.telemovel)}">${ICONS.mobile}<span>${esc(c.telemovel)}</span></a><button class="mini-copy-btn" type="button" data-copy="${esc(c.telemovel)}">${ICONS.copy}</button>` : ''}
        ${c.telefone ? `<a href="tel:${esc(c.telefone)}">${ICONS.phone}<span>${esc(c.telefone)}</span></a><button class="mini-copy-btn" type="button" data-copy="${esc(c.telefone)}">${ICONS.copy}</button>` : ''}
        ${c.email ? `<a href="mailto:${esc(c.email)}">${ICONS.email}<span>Email</span></a><button class="mini-copy-btn" type="button" data-copy="${esc(c.email)}">${ICONS.copy}</button>` : ''}
      </div>
      <div class="simple-contact-actions">
        ${canEditOperational()?`<button class="btn small ghost" type="button" data-edit-contact="${group.id}:${c.id}">${ICONS.edit}<span>Editar</span></button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-contact="${group.id}:${c.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}
function clientCode(c){ return c.codigoCliente || c.codigo || c.tipo || ''; }
function filterClients(){
  const q = (qs('#clientSearch')?.value || '').toLowerCase();
  return state.clients.filter(c => `${clientCode(c)} ${c.nome || ''} ${c.telefone || ''} ${c.email || ''}`.toLowerCase().includes(q));
}
function clientsTable(rows){
  if(!rows.length) return '<div class="empty">Sem clientes registados.</div>';
  return `<div class="clean-card-list client-card-list">${rows.map(c=>`
    <article class="clean-data-card client-data-card code-centered-card">
      <div class="data-card-main client-name-box">
        <strong>${esc(c.nome || '-')}</strong>
        <small>${esc(c.email || 'Sem email')}</small>
      </div>
      <div class="card-code-center client-code-box">
        <span class="data-card-code big-visible-code">${esc(clientCode(c) || 'Sem código')}</span>
      </div>
      <div class="data-card-meta client-phone-box">
        <span>☎ ${esc(c.telefone || 'Sem telefone')}</span>
      </div>
      <div class="actions data-card-actions">
        <button class="btn small" data-client-detail="${c.id}">Ficha</button>
        ${c.email ? `<button class="btn success small" data-client-email="${c.id}">Email</button>` : ''}
        ${canEditOperational()?`<button class="btn small" data-edit-entity="client:${c.id}">Editar</button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-entity="client:${c.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}
function openClientDetail(id){
  const c = state.clients.find(x=>x.id===id); if(!c) return;
  const calls = state.calls.filter(x => x.cliente?.toLowerCase() === c.nome?.toLowerCase() || (c.telefone && x.telefone === c.telefone));
  const quotes = state.quotes.filter(x => x.cliente?.toLowerCase() === c.nome?.toLowerCase() || (c.email && x.email === c.email));
  openModal(`Ficha cliente · ${esc(c.nome)}`, `
    <div class="client-detail">
      <div class="detail-grid">
        <div><span>Código</span><strong>${esc(clientCode(c) || '-')}</strong></div>
        <div><span>Telefone</span><strong>${esc(c.telefone || '-')}</strong></div>
        <div><span>Email</span><strong>${esc(c.email || '-')}</strong></div>
        <div><span>Pedidos</span><strong>${calls.length}</strong></div>
      </div>
      <div class="actions">${c.email ? `<button class="btn success" data-client-email="${c.id}">Enviar email ao cliente</button>` : '<span class="muted">Cliente sem email registado.</span>'}</div>
      <h4>Histórico de pedidos</h4>
      ${callsTable(calls, false)}
      <h4>Orçamentos</h4>
      ${quotes.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Peça</th><th>Total</th><th>Estado</th></tr></thead><tbody>${quotes.map(q=>`<tr><td>${esc(q.id)}</td><td>${esc(q.peca || '-')}</td><td>${money(q.total)}</td><td>${badge(q.estado)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sem orçamentos para este cliente.</div>'}
      <h4>Notas</h4>
      <p class="muted">${esc(c.notas || 'Sem notas registadas.')}</p>
    </div>`);
}
function emailClient(id){
  const c = state.clients.find(x=>x.id===id); if(!c) return;
  if(!c.email) return toast('Este cliente não tem email registado.');
  openModal(`Enviar email · ${esc(c.nome || '')}`, `
    <form id="clientEmailForm" class="form-grid">
      <input class="field span3" name="to" value="${esc(c.email)}" readonly>
      <input class="field span3" name="subject" placeholder="Assunto" value="Contacto ${esc(companyName())}">
      <textarea class="span3" name="body" placeholder="Mensagem">Olá ${esc(c.nome || '')},\n\n</textarea>
      <div class="span3 actions">
        <button class="btn primary" type="submit">Abrir email</button>
        <button class="btn ghost" type="button" id="copyClientEmailBtn">Copiar email</button>
      </div>
    </form>`);
  qs('#clientEmailForm').addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    window.location.href = `mailto:${encodeURIComponent(data.to)}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
    closeModal();
  });
  qs('#copyClientEmailBtn')?.addEventListener('click', async()=>{
    try { await navigator.clipboard.writeText(c.email); toast('Email copiado.'); }
    catch { toast(c.email); }
  });
}
function supplierName(s){ return s.nomeMarca || s.nomeFornecedor || s.nome || ''; }
function supplierRef(s){ return s.codigoFicha || s.numeroReferencia || s.referenciaFornecedor || s.referencia || ''; }
function sortedSuppliers(rows){
  return [...(rows || [])].sort((a,b)=>{
    const byName = supplierName(a).localeCompare(supplierName(b),'pt',{sensitivity:'base',numeric:true});
    if(byName) return byName;
    return supplierRef(a).localeCompare(supplierRef(b),'pt',{sensitivity:'base',numeric:true});
  });
}
function sortSuppliersState(){
  state.suppliers = sortedSuppliers(state.suppliers);
}
function filterSuppliers(){
  const q = (qs('#supplierSearch')?.value || '').toLowerCase();
  return sortedSuppliers(state.suppliers.filter(s => `${supplierName(s)} ${supplierRef(s)}`.toLowerCase().includes(q)));
}
function suppliersTable(rows){
  if(!rows.length) return '<div class="empty">Sem fornecedores registados.</div>';
  return `<div class="supplier-list-shell"><div class="supplier-list-head"><span>Fornecedor</span><span>Código</span><span>Ações</span></div><div class="clean-card-list supplier-card-list premium">${rows.map(s=>`
    <article class="clean-data-card supplier-data-card premium">
      <div class="data-card-main supplier-name-box">
        <strong>${esc(supplierName(s) || '-')}</strong>
        <small>Fornecedor</small>
      </div>
      <div class="supplier-code-box">
        <span class="data-card-code big-visible-code">${esc(supplierRef(s) || 'Sem código')}</span>
      </div>
      <div class="actions data-card-actions supplier-actions-box">
        ${canEditOperational()?`<button class="btn small ghost" data-edit-entity="supplier:${s.id}">${ICONS.edit}<span>Editar</span></button>`:`<button class="btn small ghost" data-view-entity="supplier:${s.id}">${ICONS.view}<span>Ver</span></button>`}
        ${canDelete()?`<button class="btn danger small" data-delete-entity="supplier:${s.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div></div>`;
}
function stock(){
  return entityPage('Stock / Catálogo','stockForm',[
    ['referencia','Referência'],['nome','Nome da peça'],['marca','Marca'],['modelo','Modelo compatível'],['estado','Nova / Usada / Recondicionada'],['local','Localização'],['custo','Preço custo'],['venda','Preço venda'],['qtd','Quantidade']
  ], state.stock, ['referencia','nome','marca','modelo','estado','local','venda','qtd'], 'stock');
}
function users(){
  const isAdmin = isAdminMaster();
  const firebaseUser = firebaseAuth?.currentUser;
  const firebaseSessionOk = Boolean(firebaseReady && firebaseUser && !firebaseUser.isAnonymous);
  const statusBadge = !firebaseReady
    ? '<span class="badge orange">Firebase indisponível</span>'
    : (firebaseSessionOk ? '<span class="badge green">Sessão Firebase ativa</span>' : '<span class="badge orange">Sem login Firebase</span>');
  return `<div class="grid two users-page">
    <div class="card user-create-card">
      <div class="card-head">
        <div>
          <h3>Criar utilizador na app</h3>
          <span class="muted">Cria a conta Firebase Auth + perfil e permissões na Firestore.</span>
        </div>
        ${statusBadge}
      </div>
      ${isAdmin ? `
        ${!firebaseSessionOk ? `<div class="readonly-note firebase-warning-note">
          Para criar utilizadores diretamente na Firebase, entra primeiro na app com a tua conta Firebase Admin Master.
          Se ainda não tens conta Admin Master, usa "Criar conta" no Login com o email pica.fern@gmail.com.
        </div>` : ''}
        <form id="createUserForm" class="form-grid user-create-form">
          <input class="field" name="nome" placeholder="Nome do utilizador" required>
          <input class="field" name="email" type="email" placeholder="Email de login" required>
          <input class="field" name="password" type="password" placeholder="Password inicial" minlength="6" required>
          <select class="select" name="role" required>
            <option>Operador</option>
            <option>Supervisor</option>
            <option>Admin</option>
            <option>Admin Master</option>
          </select>
          <select class="select" name="status">
            <option>Ativo</option>
            <option>Pendente</option>
            <option>Inativo</option>
          </select>
          <label class="checkline span2"><input type="checkbox" name="forcePasswordChange" checked> Pedir alteração de password depois</label>
          <div class="span3 actions">
            <button class="btn primary" type="submit">Criar conta Firebase</button>
            <button class="btn ghost" type="reset">Limpar</button>
          </div>
        </form>
        <div class="user-create-help">
          <strong>Como funciona:</strong>
          <span>O Admin Master cria o email/password aqui. Depois o utilizador entra normalmente no Login com esses dados.</span>
        </div>
      ` : '<div class="empty">Só o Admin Master pode criar contas e escolher roles.</div>'}
    </div>
    <div class="card users-list-card">
      <div class="card-head">
        <div>
          <h3>Utilizadores</h3>
          <span class="muted">${state.users.length} registos criados na app.</span>
        </div>
        ${firebaseReady ? '<span class="badge green">Firebase pronto</span>' : '<span class="badge orange">Firebase offline</span>'}
      </div>
      ${usersTable(state.users)}
    </div>
  </div>`;
}
function currentUserRecord(){
  const email = (state.currentUser?.email || firebaseAuth?.currentUser?.email || '').toLowerCase();
  return (state.users || []).find(u => (u.email || '').toLowerCase() === email);
}
function isAdminMasterEmail(){
  const email = (state.currentUser?.email || firebaseAuth?.currentUser?.email || '').toLowerCase();
  return email === 'pica.fern@gmail.com';
}
function currentRole(){ return currentUserRecord()?.role || (isAdminMasterEmail() ? 'Admin Master' : 'Operador'); }
function isAdminMaster(){
  const user = currentUserRecord();
  return user?.role === 'Admin Master' || isAdminMasterEmail();
}
function hasPermission(permission){
  if(isAdminMaster()) return true;
  return (rolePermissions[currentRole()] || []).includes(permission);
}
function userIsActive(){
  const user = currentUserRecord();
  if(isAdminMasterEmail()) return true;
  return user?.status === 'Ativo';
}
function actionAccessDefaults(){ return { view:true, add:false, edit:false, delete:false }; }
function currentUserActionAccess(){
  if(isAdminMaster()) return { view:true, add:true, edit:true, delete:true };
  const base = { ...actionAccessDefaults(), ...(state.settings?.operatorActionAccess || {}) };
  const user = currentUserRecord();
  const specific = user?.actionAccess || {};
  return { ...base, ...specific };
}
function canAction(action){
  if(isAdminMaster()) return true;
  const access = currentUserActionAccess();
  return access[action] === true;
}
function canEditOperational(){ return hasPermission('editAll') || hasPermission('createOperational') || canAction('add') || canAction('edit'); }
function canCreateOperational(){ return hasPermission('editAll') || hasPermission('createOperational') || canAction('add'); }
function canDelete(){ return hasPermission('deleteAll') || canAction('delete'); }
function canImportExcel(){ return isAdminMaster(); }
function canExportExcel(){ return isAdminMaster(); }
function usersTable(rows){
  if(!rows.length) return '<div class="empty">Sem utilizadores.</div>';
  const actions = isAdminMaster();
  return `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Estado</th>${actions?'<th>Ações</th>':''}</tr></thead><tbody>${rows.map(u=>`<tr><td><strong>${esc(u.nome || '-')}</strong></td><td>${esc(u.email || '-')}</td><td>${badge(u.role || '-')}</td><td>${badge(u.status || '-')}</td>${actions?`<td><div class="actions">${u.status==='Pendente'?`<button class="btn success small" data-approve-user="${u.id}">Aprovar</button>`:''}<button class="btn small" data-edit-entity="user:${u.id}">Editar</button><button class="btn danger small" data-delete-entity="user:${u.id}">Apagar</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function entityPage(title, formId, fields, rows, cols, type){
  return `<div class="grid two"><div class="card"><div class="card-head"><h3>Adicionar ${title}</h3></div><form id="${formId}" class="form-grid">${fields.map(f=>`<input class="field ${f[0]==='notas'?'span3':''}" name="${f[0]}" placeholder="${f[1]}">`).join('')}<div class="span3"><button class="btn primary" type="submit">Guardar</button></div></form></div><div class="card"><div class="card-head"><h3>Lista</h3><span class="muted">${rows.length} registos</span></div>${entityTable(rows, cols, type)}</div></div>`;
}
function entityTable(rows, cols, type){
  if(!rows.length) return '<div class="empty">Sem registos.</div>';
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}<td><div class="actions">${canEditOperational()?`<button class="btn small" data-edit-entity="${type}:${r.id}">Editar</button>`:'<span class="muted">Consulta</span>'}${canDelete()?`<button class="btn danger small" data-delete-entity="${type}:${r.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function orcamentos(){
  const clientOptions = state.clients.map(c=>`<option value="${esc(c.nome)}" data-email="${esc(c.email || '')}" data-phone="${esc(c.telefone || '')}" data-code="${esc(clientCode(c))}">${esc(clientCode(c) ? `${clientCode(c)} - ${c.nome}` : c.nome)}</option>`).join('');
  const canEdit = canEditOperational();
  const total = state.quotes.length;
  const totalValue = state.quotes.reduce((sum,q)=>sum + Number(q.total || 0), 0);
  const addCard = canEdit ? `<div class="card compact-form-card clean-side-card">
      <div class="card-head clean-card-head"><div><h3>Novo orçamento</h3><span class="muted">Criação rápida</span></div></div>
      <form id="quoteForm" class="simple-stack-form quote-clean-form">
        <select class="select" name="cliente" id="quoteClientSelect" required><option value="">Selecionar cliente</option>${clientOptions}</select>
        <input class="field" name="codigoCliente" placeholder="Código cliente">
        <input class="field" name="telefone" placeholder="Telefone">
        <input class="field" name="email" placeholder="Email do cliente">
        <input class="field" name="viatura" placeholder="Viatura / matrícula">
        <input class="field" name="peca" placeholder="Peça / serviço" required>
        <input class="field" name="referencia" placeholder="Referência">
        <div class="mini-two-fields"><input class="field" name="quantidade" type="number" min="1" value="1" placeholder="Qtd"><input class="field" name="precoUnitario" type="number" min="0" step="0.01" placeholder="Preço" required></div>
        <select class="select" name="estado"><option>Rascunho</option><option>Enviado</option><option>Aceite</option><option>Recusado</option></select>
        <input class="field" name="validade" type="date" value="${today()}">
        <input class="field" name="prazoEntrega" placeholder="Prazo de entrega">
        <textarea name="condicoes" placeholder="Condições comerciais">Preços sujeitos a disponibilidade da peça no momento da confirmação.</textarea>
        <textarea name="observacoes" placeholder="Notas internas"></textarea>
        <button class="btn primary full" type="submit">Criar orçamento</button>
      </form>
    </div>` : '';
  return `<div class="grid ${canEdit ? 'two split-form-list clean-page-layout' : 'single-list'} quotes-page clean-module-page">
    ${addCard}
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Orçamentos</span><h3>Propostas comerciais</h3></div>
        <div class="clean-stats"><span><b>${total}</b> registos</span><span><b>${money(totalValue)}</b> total</span></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar e enviar orçamento por email, mas não podes criar nem alterar estados.</div>' : ''}
      ${state.quotes.length ? quotesTable() : '<div class="empty">Ainda não existem orçamentos.</div>'}
    </div>
  </div>`;
}
function quotesTable(){
  return `<div class="clean-card-list quote-card-list">${state.quotes.map(q=>`
    <article class="clean-data-card quote-data-card">
      <div class="data-card-main">
        <span class="data-card-code big-visible-code">${esc(q.id)}</span>
        <strong>${esc(q.cliente || '-')}</strong>
        <small>${esc(q.peca || '-')} ${q.referencia ? '· ' + esc(q.referencia) : ''}</small>
      </div>
      <div class="quote-value-box">
        <b>${money(q.total)}</b>
        ${badge(q.estado)}
      </div>
      <div class="actions data-card-actions">
        <button class="btn small" data-print-quote="${q.id}">PDF</button>
        <button class="btn success small" data-email-quote="${q.id}">Email</button>
        ${canEditOperational()?`<button class="btn success small" data-quote-status="${q.id}:Aceite">Aceite</button><button class="btn warn small" data-quote-status="${q.id}:Recusado">Recusado</button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-quote="${q.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}
function agenda(){
  return `<div class="grid two"><div class="card"><div class="card-head"><h3>Novo follow-up</h3></div><form id="followForm" class="form-grid"><input class="field" type="date" name="date" value="${today()}"><input class="field" type="time" name="time"><input class="field" name="title" placeholder="Título"><input class="field span2" name="related" placeholder="Relacionado com"><select class="select" name="status"><option>Pendente</option><option>Feito</option></select><textarea class="span3" name="notes" placeholder="Notas"></textarea><div class="span3"><button class="btn primary">Guardar</button></div></form></div><div class="card"><div class="card-head"><h3>Agenda</h3></div>${entityTable(state.followups, ['date','time','title','related','status'], 'follow')}</div></div>`;
}
function relatorios(){
  const totalVenda = state.calls.reduce((a,c)=>a+Number(c.precoVenda||0),0);
  const totalCompra = state.calls.reduce((a,c)=>a+Number(c.precoCompra||0),0);
  const margem = totalVenda - totalCompra;
  const won = state.calls.filter(c=>c.estado==='Concluído').length;
  const lost = state.calls.filter(c=>c.estado==='Perdido').length;
  return `<div class="grid metrics">${metric('Total venda',money(totalVenda),'Todos os pedidos')}${metric('Total compra',money(totalCompra),'Custos registados')}${metric('Margem prevista',money(margem),'Venda - compra')}${metric('Ganhos / Perdidos',`${won} / ${lost}`,'Resultado comercial')}</div><div class="card" style="margin-top:18px"><div class="card-head"><h3>Peças mais procuradas</h3></div>${topParts()}</div>`;
}
function topParts(){
  const count = {};
  state.calls.forEach(c=>{ count[c.peca] = (count[c.peca]||0)+1; });
  const rows = Object.entries(count).sort((a,b)=>b[1]-a[1]);
  if(!rows.length) return '<div class="empty">Sem dados.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Peça</th><th>Pedidos</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>`;
}
function permissionsSettingsCard(){
  if(!isAdminMaster()) return '';
  const globalAccess = operatorPageAccess();
  const managed = managedPageList();
  const operators = (state.users || []).filter(u => (u.role || 'Operador') !== 'Admin Master');
  return `<div class="card permissions-card span-all">
    <div class="card-head">
      <h3>Permissões dos operadores</h3>
      <span class="muted">Ativar páginas por regra geral ou por utilizador específico.</span>
    </div>
    <form id="permissionsForm" class="permissions-form">
      <div class="permission-block">
        <h4>Páginas visíveis para Operadores</h4>
        <p class="muted">Esta é a regra geral. Se desligar uma página aqui, podes voltar a dar acesso só a determinados utilizadores na zona abaixo.</p>
        <div class="permission-grid">
          ${managed.map(p=>`<label class="permission-check"><input type="checkbox" name="operatorPage:${p.id}" ${globalAccess[p.id] !== false ? 'checked' : ''}> <span>${p.icon} ${esc(p.title)}</span></label>`).join('')}
        </div>
      </div>
      <div class="permission-block">
        <h4>Acesso específico por utilizador</h4>
        <p class="muted">Aqui defines exatamente o que cada utilizador pode abrir. Estas permissões específicas têm prioridade sobre a regra geral.</p>
        ${operators.length ? `<div class="permission-users">
          ${operators.map(u=>`<div class="permission-user-row">
            <div class="permission-user-info">
              <strong>${esc(u.nome || u.email || '-')}</strong>
              <span>${esc(u.email || '')} · ${esc(u.role || 'Operador')}</span>
            </div>
            <div class="permission-grid user-specific-grid">
              ${managed.map(p=>`<label class="permission-check compact"><input type="checkbox" name="userPage:${u.id}:${p.id}" ${userCanOpenManagedPage(u,p.id) ? 'checked' : ''}> <span>${p.icon} ${esc(p.title)}</span></label>`).join('')}
            </div>
          </div>`).join('')}
        </div>` : '<div class="empty compact">Ainda não tens operadores criados.</div>'}
      </div>
      <div class="actions"><button class="btn primary" type="submit">Guardar permissões</button></div>
    </form>
  </div>`;
}
function warehouseOrderSettingsCard(){
  if(!isAdminMaster()) return '';
  const warehouses = normalizeWarehouseOrder();
  return `<div class="card warehouse-order-card span-all">
    <div class="card-head">
      <div>
        <h3>Ordem dos Armazéns no Diretório</h3>
        <span class="muted">Define a ordem em que os armazéns aparecem na página Diretório.</span>
      </div>
      <button class="btn small" id="resetWarehouseOrderBtn" type="button">Ordem A-Z</button>
    </div>
    ${warehouses.length ? `<div class="warehouse-order-list">${warehouses.map((name,idx)=>`
      <div class="warehouse-order-row">
        <div class="warehouse-order-rank">${idx + 1}</div>
        <strong>${esc(name)}</strong>
        <div class="actions">
          <button class="btn small" type="button" data-warehouse-up="${esc(name)}" ${idx===0?'disabled':''}>↑</button>
          <button class="btn small" type="button" data-warehouse-down="${esc(name)}" ${idx===warehouses.length-1?'disabled':''}>↓</button>
        </div>
      </div>`).join('')}</div>` : '<div class="empty compact">Ainda não existem armazéns no Diretório.</div>'}
  </div>`;
}

function backupSummary(){
  const latest = (state.backups || [])[0];
  if(!latest) return 'Sem backups';
  try { return new Date(latest.date).toLocaleString('pt-PT'); }
  catch { return latest.date || 'Sem backups'; }
}
function appReadinessChecks(){
  const users = state.users || [];
  const adminMasters = users.filter(u => (u.role || '').toLowerCase() === 'admin master');
  const hasCompany = !!(state.settings?.companyName && state.settings?.companyEmail && state.settings?.companyPhone);
  const hasGithub = !!(state.settings?.githubUrl || '').trim();
  const hasBackup = Array.isArray(state.backups) && state.backups.length > 0;
  const hasContacts = contactCount() > 0;
  const hasSuppliers = (state.suppliers || []).length > 0;
  const hasClients = (state.clients || []).length > 0;
  return [
    { key:'company', label:'Dados da empresa preenchidos', ok:hasCompany, note: hasCompany ? 'Nome, email e telefone definidos.' : 'Preenche nome, email e telefone da empresa.' },
    { key:'github', label:'GitHub Pages configurado', ok:hasGithub, note: hasGithub ? (state.settings.githubUrl || '') : 'Falta definir o URL GitHub Pages.' },
    { key:'firebase', label:'Ligação Firebase pronta', ok:firebaseReady, note: firebaseReady ? 'Firebase disponível.' : 'Firebase indisponível neste momento.' },
    { key:'admins', label:'Existe Admin Master ativo', ok:adminMasters.length > 0, note: adminMasters.length ? `${adminMasters.length} utilizador(es) Admin Master.` : 'Cria pelo menos um Admin Master.' },
    { key:'backup', label:'Existe pelo menos um backup', ok:hasBackup, note: hasBackup ? `Último backup: ${backupSummary()}` : 'Cria um backup antes de ir para produção.' },
    { key:'data', label:'Base mínima preenchida', ok:hasClients || hasSuppliers || hasContacts, note: `Clientes: ${(state.clients||[]).length} · Fornecedores: ${(state.suppliers||[]).length} · Contactos: ${contactCount()}` }
  ];
}
function readinessScore(){
  const checks = appReadinessChecks();
  const ok = checks.filter(c=>c.ok).length;
  return { ok, total: checks.length, percent: Math.round((ok / checks.length) * 100) };
}
function productionReadyCard(){
  if(!isAdminMaster()) return '';
  const score = readinessScore();
  const productionMode = state.settings?.productionMode === true;
  const checks = appReadinessChecks();
  return `<div class="card span-all production-card">
    <div class="card-head">
      <div>
        <h3>Deploy final / Produção</h3>
        <span class="muted">Checklist final para publicar no GitHub/Electron e entregar aos utilizadores.</span>
      </div>
      <span class="badge ${productionMode ? 'green' : 'orange'}">${productionMode ? 'Modo produção ativo' : 'Modo produção inativo'}</span>
    </div>
    <div class="production-summary">
      <div class="production-score">
        <strong>${score.percent}%</strong>
        <span>Pronto para deploy</span>
      </div>
      <div class="production-mini-grid">
        <div><b>${(state.clients || []).length}</b><span>Clientes</span></div>
        <div><b>${(state.suppliers || []).length}</b><span>Fornecedores</span></div>
        <div><b>${contactCount()}</b><span>Contactos</span></div>
        <div><b>${(state.quotes || []).length}</b><span>Orçamentos</span></div>
      </div>
    </div>
    <div class="readiness-list">
      ${checks.map(item=>`<div class="readiness-item ${item.ok ? 'ok' : 'warn'}"><div><strong>${item.ok ? '✓' : '•'} ${esc(item.label)}</strong><span>${esc(item.note)}</span></div><em>${item.ok ? 'OK' : 'A rever'}</em></div>`).join('')}
    </div>
    <div class="actions production-actions">
      <button class="btn primary" id="validateProductionBtn" type="button">Atualizar checklist</button>
      <button class="btn ${productionMode ? 'warn' : 'success'}" id="toggleProductionModeBtn" type="button">${productionMode ? 'Desativar modo produção' : 'Ativar modo produção'}</button>
      <button class="btn" id="exportProductionReportBtn" type="button">Exportar relatório</button>
      <button class="btn danger" id="cleanDemoDataBtn" type="button">Limpar dados demo</button>
    </div>
  </div>`;
}



function configsUser(){
  const dark = currentTheme() === 'dark';
  const user = currentDisplayName();
  const resolution = currentResolution();
  const resolutionOptions = [
    ['auto','Auto Windows','Ajusta automaticamente à resolução/escala do Windows'],
    ['compact','Compacto','Mais informação no ecrã'],
    ['standard','Normal','Equilíbrio recomendado'],
    ['wide','Largo','Usa mais largura do ecrã'],
    ['large','Grande','Texto e botões maiores']
  ];
  return `<div class="user-configs-page">
    <div class="user-configs-card card">
      <div class="user-configs-head">
        <span class="dashboard-user-avatar">${esc(user.charAt(0).toUpperCase())}</span>
        <div>
          <h3>Minhas Configs</h3>
          <p>Preferências rápidas do utilizador.</p>
        </div>
      </div>

      <section class="user-setting-section">
        <div class="setting-title"><strong>Tema</strong><span>Escolhe o modo de visualização.</span></div>
        <div class="theme-choice-box">
          <div>
            <strong>${dark ? 'Darkmode ativo' : 'Tema normal ativo'}</strong>
            <span>${dark ? 'Interface escura com a imagem de fundo ainda perceptível.' : 'Interface clara e limpa para uso diário.'}</span>
          </div>
          <button class="btn primary" id="userThemeToggleBtn" type="button">${dark ? 'Mudar para Tema Normal' : 'Ativar Darkmode'}</button>
        </div>
        <div class="theme-preview-grid two-options">
          <button class="theme-preview ${!dark ? 'active' : ''}" data-set-theme="normal" type="button"><i></i><strong>Tema Normal</strong><span>Claro, azul e clean</span></button>
          <button class="theme-preview ${dark ? 'active' : ''}" data-set-theme="dark" type="button"><i></i><strong>Darkmode</strong><span>Escuro e confortável</span></button>
        </div>
      </section>

      <section class="user-setting-section">
        <div class="setting-title"><strong>Resolução / Escala</strong><span>Ajusta a app ao tamanho do ecrã.</span></div>
        <div class="choice-grid resolution-grid">
          ${resolutionOptions.map(([key,title,desc])=>`<button class="choice-card ${resolution===key?'active':''}" data-set-resolution="${key}" type="button"><strong>${esc(title)}</strong><span>${esc(desc)}</span></button>`).join('')}
        </div>
      </section>
    </div>
  </div>`;
}
function setUserTheme(theme){
  persistTheme(theme);
  applyTheme();
  toast(currentTheme() === 'dark' ? 'Darkmode ativo.' : 'Tema normal ativo.');
  renderPage('configs-user');
}
function setUserResolution(value){
  persistResolution(value);
  applyTheme();
  toast('Resolução atualizada.');
  renderPage('configs-user');
}
function bindUserConfigs(){
  qs('#userThemeToggleBtn')?.addEventListener('click',()=>toggleThemeAndRefreshUserConfigs());
  qsa('[data-set-theme]').forEach(btn=>btn.addEventListener('click',()=>setUserTheme(btn.dataset.setTheme)));
  qsa('[data-set-resolution]').forEach(btn=>btn.addEventListener('click',()=>setUserResolution(btn.dataset.setResolution)));
}
function toggleThemeAndRefreshUserConfigs(){
  persistTheme(currentTheme() === 'dark' ? 'normal' : 'dark');
  applyTheme();
  toast(currentTheme() === 'dark' ? 'Darkmode ativo.' : 'Tema normal ativo.');
  renderPage('configs-user');
}

function configAccordion(title, subtitle, html, options={}){
  if(!html) return '';
  const id = options.id || configSectionId(title);
  const savedOpen = getOpenConfigSections();
  const isOpen = savedOpen.length ? savedOpen.includes(id) : !!options.open;
  const open = isOpen ? 'open' : '';
  const icon = options.icon || '⚙️';
  return `<details class="config-accordion" data-config-section="${esc(id)}" ${open}>
    <summary>
      <span class="config-accordion-icon">${icon}</span>
      <span class="config-accordion-title"><strong>${esc(title)}</strong><em>${esc(subtitle || '')}</em></span>
      <span class="config-accordion-chevron">⌄</span>
    </summary>
    <div class="config-accordion-body">${html}</div>
  </details>`;
}
function generalSettingsCard(){
  return `<div class="card"><div class="card-head"><h3>Configurações da app</h3><span class="badge blue">v${APP_VERSION}</span></div><form id="settingsForm" class="form-grid"><input class="field span2" name="companyName" placeholder="Nome da empresa" value="${esc(state.settings.companyName)}"><input class="field" name="companyNif" placeholder="NIF" value="${esc(state.settings.companyNif || '')}"><input class="field span3" name="companyAddress" placeholder="Morada" value="${esc(state.settings.companyAddress || '')}"><input class="field" name="companyPhone" placeholder="Telefone empresa" value="${esc(state.settings.companyPhone || '')}"><input class="field" name="companyEmail" placeholder="Email empresa" value="${esc(state.settings.companyEmail || '')}"><input class="field" name="dailyBackupHour" type="time" value="${esc(state.settings.dailyBackupHour)}"><label class="checkline span2 spellcheck-toggle"><input type="checkbox" name="spellcheckEnabled" ${spellcheckEnabled()?'checked':''}> Correção ortográfica ativa</label><input class="field span3" name="githubUrl" placeholder="URL GitHub Pages" value="${esc(state.settings.githubUrl)}"><div class="span3"><button class="btn primary">Guardar configurações</button></div></form></div>`;
}
function firebaseSettingsCard(){
  return `<div class="card"><div class="card-head"><h3>Firebase</h3><span id="firebaseStatusBadge" class="badge ${firebaseReady?'green':'orange'}">${esc(firebaseStatus())}</span></div><p class="muted">A Firebase liga automaticamente ao iniciar sessão. Alterações são guardadas localmente e sincronizadas automaticamente quando houver sessão Firebase com permissões.</p><div class="firebase-status-line"><strong>${firebaseAuth?.currentUser ? 'Sessão Firebase ativa' : 'Sem sessão Firebase ativa'}</strong><span>${firebaseAuth?.currentUser?.isAnonymous ? 'Modo leitura automática. Para escrever na Firebase, entra com uma conta Firebase válida.' : (firebaseAuth?.currentUser?.email || 'A app tenta ligar automaticamente.')}</span></div><div class="actions"><button class="btn primary" id="reconnectFirebaseBtn" type="button">Ligar Firebase</button><button class="btn" id="syncFirebaseBtn" type="button">Sincronizar agora</button><button class="btn" id="exportJsonBtn" type="button">Exportar JSON</button><button class="btn warn" id="resetDemoBtn" type="button">Reset demo</button></div></div>`;
}
function electronSetupCard(){
  if(!isAdminMaster()) return '';
  const githubUrl = state.settings?.githubUrl || '';
  return `<div class="card span-all electron-setup-card">
    <div class="card-head"><h3>Electron / Setup final</h3><span class="muted">Preparação para criar o programa .exe.</span></div>
    <div class="electron-grid">
      <div class="electron-step"><b>1</b><strong>Publicar GitHub Pages</strong><span>${githubUrl ? esc(githubUrl) : 'Define o URL GitHub Pages nas configurações gerais.'}</span></div>
      <div class="electron-step"><b>2</b><strong>Instalar dependências</strong><span>Executar npm install na pasta da app.</span></div>
      <div class="electron-step"><b>3</b><strong>Gerar setup</strong><span>Executar npm run dist para criar o instalador Windows.</span></div>
      <div class="electron-step"><b>4</b><strong>Testar noutro PC</strong><span>Confirmar login, permissões, Excel, backups e sincronização.</span></div>
    </div>
    <div class="code-box"><code>npm install<br>npm run dist</code></div>
    <p class="muted">O Electron abre maximizado, sem menu, com instância única e pronto para apontar ao GitHub Pages através da variável APP_URL.</p>
  </div>`;
}
function productionCleanCard(){
  if(!isAdminMaster()) return '';
  return `<div class="card span-all production-clean-card">
    <div class="card-head"><h3>Modo produção limpa</h3><span class="muted">Limpa dados de teste sem apagar utilizadores, permissões, configurações e backups.</span></div>
    <div class="clean-production-grid">
      <div><strong>Mantém</strong><span>Utilizadores, permissões, tema, Firebase, GitHub, backups e configurações gerais.</span></div>
      <div><strong>Limpa</strong><span>Clientes, fornecedores, diretório, orçamentos, pedidos, stock e follow-ups de teste.</span></div>
      <div><strong>Antes de limpar</strong><span>A app pode criar automaticamente um backup completo para segurança.</span></div>
    </div>
    <div class="actions"><button class="btn primary" id="prepareCleanProductionBtn" type="button">Criar backup e preparar produção limpa</button><button class="btn danger" id="cleanDemoDataBtnAlt" type="button">Limpar sem backup</button></div>
  </div>`;
}

function config(){
  const sections = [
    configAccordion('Geral', 'Empresa, GitHub e correção ortográfica.', generalSettingsCard(), {open:true, icon:'🏢'}),
    configAccordion('Firebase / Sincronização', 'Sincronizar e exportar dados.', firebaseSettingsCard(), {icon:'☁️'}),
    configAccordion('Diretório', 'Ordem dos armazéns e organização do diretório.', warehouseOrderSettingsCard(), {icon:'📇'}),
    configAccordion('Utilizadores e permissões', 'Páginas visíveis, permissões finas e acessos por utilizador.', `${permissionsSettingsCard()}${actionPermissionsCard()}`, {icon:'🛡️'}),
    configAccordion('Auditoria', 'Histórico de ações só para Admin Master.', auditCard(), {icon:'📜'}),
    configAccordion('Backups', 'Criar, exportar e restaurar backups.', backupCard(), {icon:'💾'}),
    configAccordion('Produção / Electron', 'Checklist, produção limpa e setup final.', `${productionReadyCard()}${productionCleanCard()}${electronSetupCard()}`, {icon:'🚀'}),
    configAccordion('Modo TV', 'Painel de apresentação para ecrã grande.', presentationCard(), {icon:'📺'})
  ].filter(Boolean).join('');
  return `<div class="config-page config-accordion-page">${sections}</div>`;
}


/* Sistema Excel por página ------------------------------------------------- */
function excelPageRegistry(){
  return {
    clientes: {
      key:'clients', title:'Clientes', file:'clientes', prefix:'CLI', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['codigoCliente','Código Cliente'], ['nome','Nome'], ['telefone','Telefone'], ['email','Email'], ['notas','Notas']
      ]
    },
    contactos: {
      key:'contactGroups', title:'Diretório de Contactos', file:'diretorio-contactos', prefix:'DIR', edit:()=>canEditOperational(), flattened:true,
      fields:[
        ['groupId','ID Secção'], ['contactId','ID Contacto'], ['armazem','Armazém'], ['seccao','Secção'], ['nome','Nome'], ['telemovel','Telemóvel'], ['telefone','Telefone'], ['email','Email']
      ]
    },
    fornecedores: {
      key:'suppliers', title:'Fornecedores', file:'fornecedores', prefix:'FOR', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['nomeMarca','Nome Fornecedor'], ['codigoFicha','Número Referência']
      ]
    },
    orcamentos: {
      key:'quotes', title:'Orçamentos', file:'orcamentos', prefix:'ORC', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['createdAt','Data'], ['estado','Estado'], ['cliente','Cliente'], ['codigoCliente','Código Cliente'], ['telefone','Telefone'], ['email','Email'], ['viatura','Viatura'], ['peca','Peça'], ['referencia','Referência'], ['quantidade','Quantidade'], ['precoUnitario','Preço Unitário'], ['total','Total'], ['validade','Validade'], ['prazoEntrega','Prazo Entrega'], ['condicoes','Condições'], ['observacoes','Observações']
      ]
    },
    users: {
      key:'users', title:'Utilizadores', file:'utilizadores', prefix:'USR', edit:()=>isAdminMaster(),
      fields:[
        ['id','ID'], ['nome','Nome'], ['email','Email'], ['role','Role'], ['status','Estado']
      ]
    },
    config: {
      key:'settings', title:'Configurações', file:'configuracoes', prefix:'CFG', edit:()=>isAdminMaster(), single:true,
      fields:[
        ['companyName','Nome Empresa'], ['companyNif','NIF'], ['companyAddress','Morada'], ['companyPhone','Telefone Empresa'], ['companyEmail','Email Empresa'], ['githubUrl','URL GitHub Pages'], ['dailyBackupHour','Hora Backup'], ['theme','Tema'], ['spellcheckEnabled','Correção Ortográfica']
      ]
    }
  };
}
function excelConfigForPage(pageId=currentPage){
  return excelPageRegistry()[pageId] || null;
}
function excelToolbar(pageId){
  const cfg = excelConfigForPage(pageId);
  if(!cfg || pageId === 'dashboard' || pageId === 'configs-user' || !isAdminMaster()) return '';
  const canImport = Boolean(canImportExcel() && cfg.edit && cfg.edit());
  const canExport = Boolean(canExportExcel());
  return `<div class="excel-toolbar card">
    <div class="excel-toolbar-copy">
      <strong>Excel · ${esc(cfg.title)}</strong>
      <span>Exporta os dados desta página ou importa uma folha Excel no mesmo formato.</span>
    </div>
    <div class="excel-toolbar-actions">
      ${canExport ? `<button class="btn small" type="button" data-excel-template="${pageId}">Modelo Excel</button>` : ''}
      ${canExport ? `<button class="btn primary small" type="button" data-excel-export="${pageId}">Exportar Excel</button>` : ''}
      ${canImport ? `<button class="btn success small" type="button" data-excel-import="${pageId}">Importar Excel</button>` : ''}
    </div>
    <input class="hidden" type="file" id="excelImportInput" accept=".xlsx,.xls,.csv,.tsv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
  </div>`;
}
function bindExcelTools(){
  qsa('[data-excel-template]').forEach(b=>b.addEventListener('click',()=>exportPageExcel(b.dataset.excelTemplate, true)));
  qsa('[data-excel-export]').forEach(b=>b.addEventListener('click',()=>exportPageExcel(b.dataset.excelExport, false)));
  qsa('[data-excel-import]').forEach(b=>b.addEventListener('click',()=>{
    const pageId = b.dataset.excelImport;
    const input = qs('#excelImportInput');
    if(!input) return;
    input.value = '';
    input.onchange = () => input.files?.[0] && importPageExcel(pageId, input.files[0]);
    input.click();
  }));
}
function normalizeExcelValue(v){
  if(v === null || v === undefined) return '';
  if(v instanceof Date) return v.toISOString().slice(0,10);
  return String(v).trim();
}
function normalizeExcelHeader(v){
  return normalizeExcelValue(v)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'')
    .trim();
}
function excelHeaderMap(cfg){
  const map = {};
  cfg.fields.forEach(([key,label])=>{
    map[normalizeExcelHeader(key)] = key;
    map[normalizeExcelHeader(label)] = key;
  });
  return map;
}
function rowToExcelObject(row, cfg){
  const obj = {};
  cfg.fields.forEach(([key,label])=>{ obj[label] = row?.[key] ?? ''; });
  return obj;
}
function excelRowsForPage(pageId, template=false){
  const cfg = excelConfigForPage(pageId);
  if(!cfg) return [];
  if(template) return [rowToExcelObject(excelTemplateRow(cfg, pageId), cfg)];
  if(cfg.single) return [rowToExcelObject(state[cfg.key] || {}, cfg)];
  if(cfg.flattened && pageId === 'contactos') return flattenContactGroups().map(r=>rowToExcelObject(r,cfg));
  return (state[cfg.key] || []).map(r=>rowToExcelObject(r,cfg));
}
function excelTemplateRow(cfg, pageId){
  const samples = {
    clientes:{ id:'', codigoCliente:'CLI-001', nome:'Nome do Cliente', telefone:'912345678', email:'cliente@email.pt', notas:'Notas do cliente' },
    contactos:{ groupId:'', contactId:'', armazem:'Armazém Lisboa', seccao:'Peças', nome:'Nome Contacto', telemovel:'912345678', telefone:'213000000', email:'contacto@email.pt' },
    fornecedores:{ id:'', nomeMarca:'Nome Fornecedor', codigoFicha:'FOR-001' },
    orcamentos:{ id:'', createdAt:today(), estado:'Rascunho', cliente:'Nome Cliente', codigoCliente:'CLI-001', telefone:'912345678', email:'cliente@email.pt', viatura:'BMW 320d', peca:'Alternador', referencia:'REF-001', quantidade:'1', precoUnitario:'100', total:'100', validade:today(), prazoEntrega:'A confirmar', condicoes:'Condições', observacoes:'Observações' },
    users:{ id:'', nome:'Nome Utilizador', email:'user@email.pt', role:'Operador', status:'Ativo' },
    config:{ ...(state.settings || {}) }
  };
  return samples[pageId] || {};
}
function flattenContactGroups(){
  return (state.contactGroups || []).flatMap(g => (g.contactos || []).map(c => ({
    groupId:g.id || '',
    contactId:c.id || '',
    armazem:g.armazem || g.local || '',
    seccao:g.seccao || g.nome || '',
    nome:c.nome || '',
    telemovel:c.telemovel || '',
    telefone:c.telefone || '',
    email:c.email || ''
  })));
}
function safeSheetName(name){
  return String(name || 'Dados').replace(/[\\/?*\[\]:]/g,'').slice(0,31) || 'Dados';
}
function downloadBlob(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1200);
}

function loadExcelLibrary(){
  if(window.XLSX) return Promise.resolve(true);
  return new Promise((resolve, reject)=>{
    const existing = document.querySelector('script[data-xlsx-loader="1"]');
    if(existing){
      existing.addEventListener('load',()=>resolve(true), { once:true });
      existing.addEventListener('error',reject, { once:true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.dataset.xlsxLoader = '1';
    script.onload = ()=>resolve(true);
    script.onerror = ()=>reject(new Error('Não foi possível carregar a biblioteca Excel.'));
    document.head.appendChild(script);
  });
}

async function exportPageExcel(pageId=currentPage, template=false){
  const cfg = excelConfigForPage(pageId);
  if(!cfg) return toast('Esta página não tem exportação Excel.');
  const rows = excelRowsForPage(pageId, template);
  const filename = `${cfg.file}-${template ? 'modelo' : 'export'}-${today()}.xlsx`;
  try {
    await loadExcelLibrary();
    if(window.XLSX){
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows, { header: cfg.fields.map(f=>f[1]) });
      ws['!cols'] = cfg.fields.map(([key,label]) => ({ wch: Math.min(Math.max(label.length + 4, 14), 32) }));
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName(cfg.title));
      XLSX.writeFile(wb, filename);
    } else {
      exportPageExcelFallback(cfg, rows, filename.replace(/\.xlsx$/i,'.xls'));
    }
    toast(template ? 'Modelo Excel exportado.' : 'Excel exportado.');
  } catch(err){
    console.error(err);
    exportPageExcelFallback(cfg, rows, filename.replace(/\.xlsx$/i,'.xls'));
    toast('Exportado em formato Excel compatível.');
  }
}
function exportPageExcelFallback(cfg, rows, filename){
  const headers = cfg.fields.map(f=>f[1]);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${headers.map(h=>`<td>${esc(row[h] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  downloadBlob(new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8' }), filename);
}
async function importPageExcel(pageId, file){
  const cfg = excelConfigForPage(pageId);
  if(!cfg) return toast('Esta página não tem importação Excel.');
  if(!canImportExcel() || !cfg.edit || !cfg.edit()) return toast('Sem permissão para importar nesta página.');
  try {
    const rows = await readExcelRows(file);
    if(!rows.length) return toast('O ficheiro não tem linhas para importar.');
    const normalized = normalizeImportedRows(rows, cfg);
    const count = applyImportedRows(pageId, cfg, normalized);
    saveState();
    renderPage(pageId);
    const total = cfg.single ? 1 : ((Array.isArray(state[cfg.key]) ? state[cfg.key].length : Object.keys(state[cfg.key]||{}).length));
    const extra = pageId === 'fornecedores' ? ` · lista atual: ${total} registo(s)` : '';
    toast(`${count} linha(s) importada(s) do Excel${extra}.`);
  } catch(err){
    console.error(err);
    toast(err?.message || 'Não consegui importar esse ficheiro Excel.');
  }
}
async function readExcelRows(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if(!window.XLSX) await loadExcelLibrary();
  if(window.XLSX){
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type:'array', cellDates:true });
    const first = wb.SheetNames[0];
    if(!first) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[first], { defval:'', raw:false });
  }
  if(['csv','tsv','txt'].includes(ext)){
    const text = await file.text();
    return parseDelimitedText(text, ext === 'tsv' ? '\t' : guessDelimiter(text));
  }
  throw new Error('Para importar .xlsx/.xls, a biblioteca Excel precisa de estar carregada. Em GitHub Pages com internet isto funciona automaticamente. Podes também importar CSV.');
}
function guessDelimiter(text){
  const first = text.split(/\r?\n/)[0] || '';
  return (first.match(/;/g)||[]).length >= (first.match(/,/g)||[]).length ? ';' : ',';
}
function parseDelimitedText(text, delimiter=','){
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(!lines.length) return [];
  const headers = splitCsvLine(lines.shift(), delimiter);
  return lines.map(line=>{
    const values = splitCsvLine(line, delimiter);
    const obj = {};
    headers.forEach((h,i)=>obj[h]=values[i] ?? '');
    return obj;
  });
}
function splitCsvLine(line, delimiter){
  const out = [];
  let cur = '', quoted = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"'){
      if(quoted && line[i+1] === '"'){ cur += '"'; i++; }
      else quoted = !quoted;
    } else if(ch === delimiter && !quoted){
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map(v=>v.trim());
}
function normalizeImportedRows(rows, cfg){
  const map = excelHeaderMap(cfg);
  return rows.map(row=>{
    const obj = {};
    Object.entries(row).forEach(([header,value])=>{
      const key = map[normalizeExcelHeader(header)];
      if(key) obj[key] = normalizeExcelValue(value);
    });
    return obj;
  }).filter(row => Object.values(row).some(v => normalizeExcelValue(v) !== ''));
}
function applyImportedRows(pageId, cfg, rows){
  if(pageId === 'contactos') return importContactRows(rows);
  if(cfg.single){
    state[cfg.key] = { ...(state[cfg.key] || {}), ...(rows[0] || {}) };
    return rows.length ? 1 : 0;
  }
  const target = state[cfg.key] = state[cfg.key] || [];
  rows.forEach(row=>{
    if(!row.id) row.id = uid(cfg.prefix || 'ROW');
    if(pageId === 'orcamentos'){
      row.quantidade = Number(row.quantidade || 0);
      row.precoUnitario = Number(String(row.precoUnitario || '0').replace(',','.'));
      row.total = Number(String(row.total || (row.quantidade * row.precoUnitario) || '0').replace(',','.'));
    }
    if(pageId === 'users') row.pageAccess = target.find(u=>u.id===row.id || (u.email && u.email === row.email))?.pageAccess || row.pageAccess || {};
    const index = target.findIndex(existing => (row.id && existing.id === row.id) || uniqueExcelMatch(pageId, existing, row));
    if(index >= 0) target[index] = { ...target[index], ...row };
    else target.push(row);
  });
  if(pageId === 'fornecedores') sortSuppliersState();
  return rows.length;
}
function uniqueExcelMatch(pageId, existing, row){
  if(pageId === 'clientes') return row.email && existing.email === row.email || row.telefone && existing.telefone === row.telefone || row.codigoCliente && existing.codigoCliente === row.codigoCliente;
  if(pageId === 'fornecedores') {
    const rowCode = normalizeText(row.codigoFicha);
    const exCode = normalizeText(existing.codigoFicha);
    const rowName = normalizeText(supplierName(row));
    const exName = normalizeText(supplierName(existing));
    if(rowCode && exCode) return rowCode === exCode && rowName === exName;
    if(rowName) return rowName === exName;
    return false;
  }
  if(pageId === 'users') return row.email && existing.email === row.email;
  if(pageId === 'orcamentos') return false;
  return false;
}
function importContactRows(rows){
  state.contactGroups = state.contactGroups || [];
  rows.forEach(row=>{
    const armazem = row.armazem || 'Sem armazém';
    const seccao = row.seccao || 'Geral';
    let group = state.contactGroups.find(g => (row.groupId && g.id === row.groupId) || (normalizeText(g.armazem) === normalizeText(armazem) && normalizeText(g.seccao || g.nome) === normalizeText(seccao)));
    if(!group){
      group = { id: row.groupId || uid('DIR'), armazem, seccao, nome:seccao, aberto:true, contactos:[] };
      state.contactGroups.push(group);
    }
    group.armazem = armazem;
    group.seccao = seccao;
    group.nome = seccao;
    group.contactos = group.contactos || [];
    const contact = { id: row.contactId || uid('CNT'), nome: row.nome || '', telemovel: row.telemovel || '', telefone: row.telefone || '', email: row.email || '' };
    const index = group.contactos.findIndex(c => (row.contactId && c.id === row.contactId) || (contact.email && c.email === contact.email) || (contact.nome && normalizeText(c.nome) === normalizeText(contact.nome)));
    if(index >= 0) group.contactos[index] = { ...group.contactos[index], ...contact };
    else group.contactos.push(contact);
  });
  return rows.length;
}

function bindPage(id){
  bindExcelTools();
  qsa('[data-go]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.go)));
  qsa('[data-page-card]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.pageCard)));
  const dashboardLogout = qs('#dashboardLogoutBtn');
  if(dashboardLogout) dashboardLogout.addEventListener('click', logoutCurrentUser);
  qsa('[data-client-detail]').forEach(b=>b.addEventListener('click',()=>openClientDetail(b.dataset.clientDetail)));
  qsa('[data-client-email]').forEach(b=>b.addEventListener('click',()=>emailClient(b.dataset.clientEmail)));
  const globalSearch = qs('#globalSearch');
  if(globalSearch) globalSearch.addEventListener('input',()=>{ qs('#globalSearchResults').innerHTML = globalSearchResults(globalSearch.value); bindGlobalResults(); });
  const clientSearch = qs('#clientSearch');
  if(clientSearch) clientSearch.addEventListener('input',()=>{ qs('#clientsTable').innerHTML = clientsTable(filterClients()); bindEntities(); });
  const contactSearch = qs('#contactSearch');
  if(contactSearch) contactSearch.addEventListener('input',()=>{ qs('#contactsTable').innerHTML = contactGroupsView(filterContactGroups()); bindContactDirectory(); });
  const supplierSearch = qs('#supplierSearch');
  if(supplierSearch) supplierSearch.addEventListener('input',()=>{ qs('#suppliersTable').innerHTML = suppliersTable(filterSuppliers()); bindEntities(); });
  if(id==='nova-chamada') bindCallForm();
  if(id==='pedidos') bindPedidos();
  if(id==='orcamentos') bindQuotes();
  if(id==='contactos') bindContactDirectory();
  if(id==='users') bindUsersPage();
  bindEntities();
  if(id==='agenda') bindFollowForm();
  if(id==='configs-user') bindUserConfigs();
  if(id==='config') bindConfig();
  qsa('[data-copy]').forEach(b=>b.addEventListener('click',()=>copyText(b.dataset.copy)));
}

function bindGlobalResults(){
  qsa('#globalSearchResults [data-go]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.go)));
}
function bindCallForm(){
  qs('#callForm').addEventListener('submit', e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar pedidos.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const call = { id: uid('PED'), createdAt: today(), ...data, precoCompra:Number(data.precoCompra||0), precoVenda:Number(data.precoVenda||0) };
    state.calls.push(call);
    upsertClient(data.cliente, data.telefone, data.email);
    saveState(); toast('Chamada guardada com sucesso.'); setTimeout(()=>goPage('pedidos'), 250);
  });
}
function bindPedidos(){
  ['searchPedidos','filterEstado'].forEach(id=>qs('#'+id).addEventListener('input',()=>{ qs('#pedidosTable').innerHTML = callsTable(filterCalls(), true); bindPedidosActions(); }));
  bindPedidosActions();
}
function bindPedidosActions(){
  qsa('[data-delete-call]').forEach(b=>b.addEventListener('click',()=>{ if(!canDelete()) return toast('Sem permissão para apagar.'); state.calls = state.calls.filter(c=>c.id!==b.dataset.deleteCall); saveState(); renderPage('pedidos'); toast('Pedido apagado.'); }));
  qsa('[data-edit-call]').forEach(b=>b.addEventListener('click',()=>openCallModal(b.dataset.editCall)));
  qsa('[data-quote]').forEach(b=>b.addEventListener('click',()=>createQuoteFromCall(b.dataset.quote)));
}
function openCallModal(id){
  const c = state.calls.find(x=>x.id===id); if(!c) return;
  openModal('Editar pedido', `<form id="editCallForm" class="form-grid">${['cliente','telefone','email','matricula','marca','modelo','ano','motor','vin','peca','referencia','operador','fornecedor','precoCompra','precoVenda'].map(k=>`<input class="field" name="${k}" placeholder="${k}" value="${esc(c[k]||'')}">`).join('')}<select name="urgencia" class="select">${urgencies.map(u=>`<option ${c.urgencia===u?'selected':''}>${u}</option>`).join('')}</select><select name="estado" class="select">${states.map(s=>`<option ${c.estado===s?'selected':''}>${s}</option>`).join('')}</select><textarea class="span3" name="observacoes">${esc(c.observacoes||'')}</textarea><div class="span3"><button class="btn primary">Guardar alterações</button></div></form>`);
  qs('#editCallForm').addEventListener('submit', e=>{ e.preventDefault(); Object.assign(c,Object.fromEntries(new FormData(e.target).entries())); c.precoCompra=Number(c.precoCompra||0); c.precoVenda=Number(c.precoVenda||0); saveState(); closeModal(); renderPage('pedidos'); toast('Pedido atualizado.'); });
}
function createQuoteFromCall(id){
  if(!canEditOperational()) return toast('Sem permissão para criar orçamento.');
  const c = state.calls.find(x=>x.id===id); if(!c) return;
  const client = state.clients.find(x => x.nome?.toLowerCase() === c.cliente?.toLowerCase() || (c.telefone && x.telefone === c.telefone)) || {};
  const q = { id: uid('ORC'), callId:id, cliente:c.cliente, codigoCliente:clientCode(client), telefone:c.telefone, email:c.email, viatura:`${c.marca || ''} ${c.modelo || ''} ${c.matricula ? '- ' + c.matricula : ''}`.trim(), peca:c.peca, referencia:c.referencia, quantidade:1, precoUnitario:Number(c.precoVenda||0), total:Number(c.precoVenda||0), validade:today(), prazoEntrega:'A confirmar', condicoes:'Preços sujeitos a disponibilidade da peça no momento da confirmação.', observacoes:c.observacoes || '', estado:'Rascunho', createdAt:today(), history:[{ date:today(), action:'Criado a partir de pedido', by:state.currentUser?.email || '' }] };
  state.quotes.push(q); c.estado='Orçamento enviado'; saveState(); toast('Orçamento criado.'); setTimeout(()=>goPage('orcamentos'), 250);
}
function bindQuotes(){
  const clientSelect = qs('#quoteClientSelect');
  if(clientSelect) clientSelect.addEventListener('change',()=>{
    const opt = clientSelect.selectedOptions[0];
    qs('[name="codigoCliente"]').value = opt?.dataset.code || '';
    qs('[name="telefone"]').value = opt?.dataset.phone || '';
    qs('[name="email"]').value = opt?.dataset.email || '';
  });
  const form = qs('#quoteForm');
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para criar orçamentos.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const quantidade = Number(data.quantidade || 1);
    const precoUnitario = Number(data.precoUnitario || 0);
    state.quotes.push({ id:uid('ORC'), createdAt:today(), estado:data.estado || 'Rascunho', ...data, quantidade, precoUnitario, total: quantidade * precoUnitario, history:[{ date:today(), action:'Criado', by:state.currentUser?.email || '' }] });
    saveState(); renderPage('orcamentos'); toast('Orçamento criado.');
  });
  qsa('[data-print-quote]').forEach(b=>b.addEventListener('click',()=>printQuote(b.dataset.printQuote)));
  qsa('[data-email-quote]').forEach(b=>b.addEventListener('click',()=>emailQuote(b.dataset.emailQuote)));
  qsa('[data-quote-status]').forEach(b=>b.addEventListener('click',()=>{ if(!canEditOperational()) return toast('Sem permissão para alterar orçamento.'); const [id,status]=b.dataset.quoteStatus.split(':'); const q=quoteById(id); if(!q) return; q.estado=status; q.history=q.history||[]; q.history.push({date:today(), action:`Marcado como ${status}`, by:state.currentUser?.email || ''}); saveState(); renderPage('orcamentos'); toast('Estado atualizado.'); }));
  qsa('[data-delete-quote]').forEach(b=>b.addEventListener('click',()=>{ if(!canDelete()) return toast('Sem permissão para apagar.'); state.quotes = state.quotes.filter(q=>q.id!==b.dataset.deleteQuote); saveState(); renderPage('orcamentos'); toast('Orçamento apagado.'); }));
}
function quoteById(id){ return state.quotes.find(q=>q.id===id); }
function printQuote(id){
  const q = quoteById(id); if(!q) return;
  const win = window.open('', '_blank', 'width=900,height=900');
  win.document.write(quotePdfHtml(q));
  win.document.close();
  win.focus();
  setTimeout(()=>win.print(), 250);
}
function emailQuote(id){
  const q = quoteById(id); if(!q) return;
  q.estado = 'Enviado';
  q.history = q.history || [];
  q.history.push({ date:today(), action:'Email preparado', by:state.currentUser?.email || '' });
  saveState();
  const subject = `Orçamento ${q.id} - ${q.peca}`;
  const body = `Olá ${q.cliente},\n\nEnviamos em anexo o orçamento ${q.id}.\n\nResumo:\n- Peça/serviço: ${q.peca}\n- Referência: ${q.referencia || '-'}\n- Total: ${money(q.total)}\n- Prazo de entrega: ${q.prazoEntrega || 'A confirmar'}\n\nQualquer questão estamos disponíveis.\n\nObrigado,\n${companyName()}`;
  window.location.href = `mailto:${encodeURIComponent(q.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  renderPage('orcamentos');
}
function quotePdfHtml(q){
  const iva = Number(q.total || 0) * 0.23;
  const totalComIva = Number(q.total || 0) + iva;
  const settings = state.settings || {};
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>Orçamento ${esc(q.id)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#12344d;background:#eef4f8}.page{width:210mm;min-height:297mm;margin:0 auto;background:white;padding:20mm}
    .top{display:flex;justify-content:space-between;gap:24px;border-bottom:4px solid #06447f;padding-bottom:18px}.brand h1{margin:0;color:#06447f}.brand p,.box p{margin:5px 0;color:#49677f}.stamp{font-size:28px;font-weight:900;color:#f58220;text-align:right}.box{border:1px solid #c9d8e5;border-radius:10px;padding:14px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin-top:22px}th{background:#06447f;color:white;text-align:left;padding:12px}td{border-bottom:1px solid #dce7f0;padding:12px}.totals{margin-left:auto;width:310px;margin-top:18px}.totals div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #dce7f0}.totals .grand{font-size:20px;font-weight:900;color:#06447f}.notes{margin-top:26px;line-height:1.5}.footer{margin-top:40px;color:#49677f;font-size:12px;border-top:1px solid #dce7f0;padding-top:12px}@media print{body{background:white}.page{margin:0;box-shadow:none}}
  </style></head><body><main class="page">
    <section class="top"><div class="brand"><h1>${esc(companyName())}</h1><p>${esc(settings.companyAddress || 'Callcenter de peças automóveis')}</p><p>${settings.companyNif ? `NIF: ${esc(settings.companyNif)} · ` : ''}${esc(settings.companyPhone || '')} ${settings.companyEmail ? '· ' + esc(settings.companyEmail) : ''}</p><p>Orçamento gerado em ${esc(today())}</p></div><div><div class="stamp">ORÇAMENTO</div><p><strong>${esc(q.id)}</strong></p><p>Validade: ${esc(q.validade || today())}</p><p>Estado: ${esc(q.estado || 'Rascunho')}</p></div></section>
    <section class="box"><h2>Cliente</h2><p><strong>${esc(q.cliente)}</strong></p><p>Código cliente: ${esc(q.codigoCliente || '-')}</p><p>Telefone: ${esc(q.telefone || '-')} · Email: ${esc(q.email || '-')}</p><p>Viatura: ${esc(q.viatura || '-')}</p></section>
    <table><thead><tr><th>Descrição</th><th>Referência</th><th>Qtd</th><th>Preço unit.</th><th>Total</th></tr></thead><tbody><tr><td>${esc(q.peca)}</td><td>${esc(q.referencia || '-')}</td><td>${esc(q.quantidade || 1)}</td><td>${money(q.precoUnitario)}</td><td>${money(q.total)}</td></tr></tbody></table>
    <section class="totals"><div><span>Subtotal</span><strong>${money(q.total)}</strong></div><div><span>IVA 23%</span><strong>${money(iva)}</strong></div><div class="grand"><span>Total</span><strong>${money(totalComIva)}</strong></div></section>
    <section class="notes"><p><strong>Prazo de entrega:</strong> ${esc(q.prazoEntrega || 'A confirmar')}</p><p><strong>Condições:</strong> ${esc(q.condicoes || 'Preços sujeitos a disponibilidade da peça no momento da confirmação.')}</p><p><strong>Observações:</strong> ${esc(q.observacoes || '-')}</p></section>
    <section class="footer">Para avançar, responda a este email com a confirmação do orçamento. Documento gerado por ${esc(companyName())}.</section>
  </main></body></html>`;
}
function upsertClient(nome, telefone, email){
  if(!nome) return;
  const exists = state.clients.find(c=>c.nome.toLowerCase()===nome.toLowerCase() || (telefone && c.telefone===telefone));
  if(!exists) state.clients.push({id:uid('CLI'), codigoCliente:`CLI-${String(state.clients.length + 1).padStart(3,'0')}`, nome, telefone, email, notas:''});
}

function openQuickContactModal(groupId){
  if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
  normalizeContactDirectory();
  const group = (state.contactGroups || []).find(g=>g.id===groupId);
  if(!group) return toast('Secção não encontrada.');
  openModal(`Adicionar contacto · ${esc(contactWarehouse(group))} / ${esc(contactSection(group))}`, `
    <form id="sectionQuickContactForm" class="form-grid quick-contact-modal">
      <input class="field span3" name="nome" placeholder="Nome do contacto" required autofocus>
      <input class="field" name="telemovel" placeholder="Telemóvel">
      <input class="field" name="telefone" placeholder="Telefone fixo">
      <input class="field" name="email" type="email" placeholder="Email">
      <div class="span3 actions quick-modal-actions">
        <button class="btn primary" type="submit">Guardar e adicionar outro</button>
        <button class="btn success" type="button" id="saveContactCloseBtn">Guardar e fechar</button>
      </div>
    </form>
  `);
  const form = qs('#sectionQuickContactForm');
  const addContact = (closeAfter=false) => {
    const data = Object.fromEntries(new FormData(form).entries());
    if(!data.nome?.trim()) return toast('Mete o nome do contacto.');
    group.contactos = group.contactos || [];
    group.contactos.push({
      id:uid('CNT'),
      nome:(data.nome || '').trim(),
      telemovel:(data.telemovel || '').trim(),
      telefone:(data.telefone || '').trim(),
      email:(data.email || '').trim()
    });
    group.aberto = true;
    saveState();
    if(closeAfter){
      closeModal();
      renderPage('contactos');
      toast('Contacto adicionado.');
      return;
    }
    form.reset();
    form.querySelector('[name="nome"]')?.focus();
    toast('Contacto adicionado. Podes adicionar outro.');
  };
  form.addEventListener('submit', e=>{ e.preventDefault(); addContact(false); });
  qs('#saveContactCloseBtn')?.addEventListener('click',()=>addContact(true));
}


function openEditContactModal(groupId, contactId){
  if(!canEditOperational()) return toast('Sem permissão para editar contactos.');
  normalizeContactDirectory();
  const group = (state.contactGroups || []).find(g=>g.id===groupId);
  const contact = group?.contactos?.find(c=>c.id===contactId);
  if(!group || !contact) return toast('Contacto não encontrado.');
  openModal(`Editar contacto · ${esc(contactWarehouse(group))} / ${esc(contactSection(group))}`, `
    <form id="editContactForm" class="form-grid quick-contact-modal">
      <input class="field span3" name="nome" placeholder="Nome do contacto" value="${esc(contact.nome || '')}" required autofocus>
      <input class="field" name="telemovel" placeholder="Telemóvel" value="${esc(contact.telemovel || '')}">
      <input class="field" name="telefone" placeholder="Telefone fixo" value="${esc(contact.telefone || '')}">
      <input class="field" name="email" type="email" placeholder="Email" value="${esc(contact.email || '')}">
      <div class="span3 actions quick-modal-actions">
        <button class="btn primary" type="submit">Guardar alterações</button>
        <button class="btn ghost" type="button" id="cancelEditContactBtn">Cancelar</button>
      </div>
    </form>
  `);
  qs('#editContactForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if(!data.nome?.trim()) return toast('Mete o nome do contacto.');
    contact.nome = (data.nome || '').trim();
    contact.telemovel = (data.telemovel || '').trim();
    contact.telefone = (data.telefone || '').trim();
    contact.email = (data.email || '').trim();
    group.aberto = true;
    saveState();
    closeModal();
    renderPage('contactos');
    toast('Contacto atualizado.');
  });
  qs('#cancelEditContactBtn')?.addEventListener('click', closeModal);
}

function bindContactDirectory(){
  const quickForm = qs('#quickContactForm');
  if(quickForm) quickForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    normalizeContactDirectory();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const armazem = (data.armazem || '').trim();
    const seccao = (data.seccao || '').trim();
    if(!armazem || !seccao || !data.nome?.trim()) return toast('Preenche armazém, secção e nome.');
    let group = (state.contactGroups || []).find(g => contactWarehouse(g).toLowerCase() === armazem.toLowerCase() && contactSection(g).toLowerCase() === seccao.toLowerCase());
    if(!group){
      group = { id:uid('DIR'), armazem, seccao, nome:seccao, aberto:true, contactos:[] };
      state.contactGroups.push(group);
    }
    group.contactos = group.contactos || [];
    group.contactos.push({
      id:uid('CNT'),
      nome:(data.nome || '').trim(),
      telemovel:(data.telemovel || '').trim(),
      telefone:(data.telefone || '').trim(),
      email:(data.email || '').trim()
    });
    group.aberto = true;
    saveState(); renderPage('contactos'); toast('Contacto adicionado.');
  });

  qsa('[data-toggle-contact-group]').forEach(btn=>btn.addEventListener('click',()=>{
    normalizeContactDirectory();
    const group = (state.contactGroups || []).find(g=>g.id===btn.dataset.toggleContactGroup);
    if(!group) return;
    group.aberto = !group.aberto;

    // Toggle visual local, sem redesenhar a página.
    btn.classList.toggle('active', group.aberto);
    const warehouse = btn.closest('.warehouse-simple-card');
    const panel = warehouse?.querySelector(`.directory-section-simple [data-add-contact-section="${group.id}"]`)?.closest('.directory-section-simple');
    if(panel) panel.classList.toggle('hidden', !group.aberto);

    // Compatibilidade com layout antigo
    const section = btn.closest('.directory-section');
    const body = section?.querySelector('.section-body');
    const icon = btn.querySelector('.section-toggle-icon, i');
    if(body) body.classList.toggle('hidden', !group.aberto);
    if(icon) icon.textContent = group.aberto ? '−' : '+';

    saveState();
  }));

  qsa('[data-add-contact-section]').forEach(btn=>btn.addEventListener('click',()=>openQuickContactModal(btn.dataset.addContactSection)));

  qsa('[data-edit-contact-section]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    normalizeContactDirectory();
    const group = (state.contactGroups || []).find(g=>g.id===btn.dataset.editContactSection);
    if(!group) return;
    const armazem = prompt('Armazém / Local:', contactWarehouse(group));
    if(armazem === null) return;
    const seccao = prompt('Nome da secção:', contactSection(group));
    if(seccao === null) return;
    group.armazem = armazem.trim() || 'Geral';
    group.seccao = seccao.trim() || 'Geral';
    group.nome = group.seccao;
    saveState(); renderPage('contactos'); toast('Secção atualizada.');
  }));

  qsa('[data-edit-contact]').forEach(btn=>btn.addEventListener('click',()=>{
    const [groupId, contactId] = btn.dataset.editContact.split(':');
    openEditContactModal(groupId, contactId);
  }));

  qsa('[data-delete-contact]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canDelete()) return toast('Sem permissão para apagar.');
    const [groupId, contactId] = btn.dataset.deleteContact.split(':');
    const group = (state.contactGroups || []).find(g=>g.id===groupId);
    if(!group) return;
    group.contactos = (group.contactos || []).filter(c=>c.id!==contactId);
    saveState(); renderPage('contactos'); toast('Contacto apagado.');
  }));

  qsa('[data-delete-contact-group]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canDelete()) return toast('Sem permissão para apagar.');
    state.contactGroups = (state.contactGroups || []).filter(g=>g.id!==btn.dataset.deleteContactGroup);
    saveState(); renderPage('contactos'); toast('Secção apagada.');
  }));
}
function bindUsersPage(){
  qsa('[data-approve-user]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!hasPermission('approveUsers')) return toast('Sem permissão para aprovar contas.');
    const user = (state.users || []).find(u=>u.id===btn.dataset.approveUser);
    if(!user) return;
    user.status = 'Ativo';
    saveState(); renderPage('users'); toast('Conta aprovada.');
  }));
  const form = qs('#createUserForm');
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!isAdminMaster()) return toast('Só o Admin Master pode criar contas.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    if(!email || !password || !data.nome) return toast('Preenche nome, email e password.');
    if(password.length < 6) return toast('A password precisa de pelo menos 6 caracteres.');
    const user = {
      id: uid('USR'),
      nome:String(data.nome || '').trim(),
      email,
      role:data.role || 'Operador',
      status:data.status || 'Ativo',
      pageAccess:{},
      actionAccess:{},
      forcePasswordChange:data.forcePasswordChange === 'on',
      createdAt: today(),
      createdBy: state.currentUser?.email || firebaseAuth?.currentUser?.email || 'admin-master'
    };
    const btn = form.querySelector('button[type="submit"]');
    if(btn){ btn.disabled = true; btn.textContent = 'A criar...'; }
    try {
      const result = await createFirebaseUserAsAdmin(email, password, user);
      if(result?.uid) user.id = result.uid;
      upsertAppUser(user);
      await saveUserProfileToFirestore(user);
      saveState('Utilizador criado na app');
      renderPage('users');
      toast(result?.authCreated ? 'Conta Firebase criada e perfil guardado.' : 'Perfil guardado. Email já existia no Auth ou foi criado localmente.');
    } catch (err) {
      console.warn('Create user failed', err);
      if(err.code === 'auth/email-already-in-use') {
        const existing = await findExistingFirebaseUserProfile(email);
        if(existing?.id) user.id = existing.id;
        upsertAppUser(user);
        await saveUserProfileToFirestore(user);
        saveState('Perfil de utilizador atualizado');
        renderPage('users');
        toast('Email já existia. Perfil/role atualizado na app.');
      } else if(err.code === 'auth/operation-not-allowed') {
        toast('Ativa Email/Password no Firebase Auth uma vez.');
      } else if(err.code === 'auth/weak-password') {
        toast('Password demasiado fraca. Usa pelo menos 6 caracteres.');
      } else if(err.message === 'firebase-session-required') {
        toast('Entra com sessão Firebase Admin Master para criar utilizadores.');
      } else {
        toast('Não foi possível criar a conta Firebase. Vê a consola/permissions.');
      }
    } finally {
      if(btn){ btn.disabled = false; btn.textContent = 'Criar conta Firebase'; }
    }
  });
}
async function createFirebaseUserAsAdmin(email, password, profile){
  if(!firebaseReady || !firebase.auth) throw new Error('firebase-unavailable');
  if(!firebaseAuth?.currentUser || firebaseAuth.currentUser.isAnonymous) throw new Error('firebase-session-required');
  const appName = `create-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const secondaryApp = firebase.initializeApp(firebaseConfig, appName);
  try {
    const credential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
    await secondaryApp.auth().signOut().catch(()=>{});
    const uid = credential?.user?.uid || profile?.id || uid('USR');
    return { uid, authCreated:true };
  } finally {
    await secondaryApp.delete().catch(()=>{});
  }
}
async function saveUserProfileToFirestore(user){
  if(!firebaseReady || !firebaseDb || !user?.id) return false;
  if(!firebaseAuth?.currentUser || firebaseAuth.currentUser.isAnonymous) return false;
  const payload = {
    ...user,
    email:String(user.email || '').toLowerCase(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || ''
  };
  await firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(user.id).set(payload, { merge:true });
  return true;
}
async function findExistingFirebaseUserProfile(email){
  if(!firebaseReady || !firebaseDb || !email) return null;
  try {
    const snap = await firebaseDb.collection(FIREBASE_COLLECTIONS.users).where('email','==',String(email).toLowerCase()).limit(1).get();
    if(snap.empty) return null;
    const doc = snap.docs[0];
    return { id:doc.id, ...doc.data() };
  } catch(err) {
    console.warn('findExistingFirebaseUserProfile failed', err);
    return null;
  }
}
function upsertAppUser(user){
  state.users = state.users || [];
  delete user.password;
  const index = state.users.findIndex(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase() || u.id === user.id);
  if(index >= 0) state.users[index] = { ...state.users[index], ...user };
  else state.users.push(user);
  const currentEmail = String(state.currentUser?.email || firebaseAuth?.currentUser?.email || '').toLowerCase();
  if(currentEmail && currentEmail === String(user.email || '').toLowerCase()) syncCurrentUserName();
}
function bindEntities(){
  const map = { client:[state.clients,'clients'], supplier:[state.suppliers,'suppliers'], stock:[state.stock,'stock'], user:[state.users,'users'], follow:[state.followups,'followups'] };
  qsa('[data-delete-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.deleteEntity.split(':'); if(!canDelete()) return toast('Sem permissão para apagar.'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); const target=map[type]; state[target[1]] = target[0].filter(x=>x.id!==id); saveState(); renderPage(currentPage); toast('Registo apagado.'); }));
  qsa('[data-edit-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.editEntity.split(':'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); openEntityModal(type,id); }));
  qsa('[data-view-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.viewEntity.split(':'); openEntityReadModal(type,id); }));
  const forms = [{id:'clientForm',key:'clients',prefix:'CLI'},{id:'supplierForm',key:'suppliers',prefix:'FOR'},{id:'stockForm',key:'stock',prefix:'STK'},{id:'userForm',key:'users',prefix:'USR'}];
  forms.forEach(f=>{ const form=qs('#'+f.id); if(form) form.addEventListener('submit',e=>{ e.preventDefault(); if(f.key==='users' && !hasPermission('manageUsers')) return toast('Sem permissão para gerir utilizadores.'); if(f.key!=='users' && !canEditOperational()) return toast('Sem permissão para guardar.'); state[f.key].push({id:uid(f.prefix),...Object.fromEntries(new FormData(e.target).entries())}); if(f.key==='suppliers') sortSuppliersState(); saveState(); renderPage(currentPage); toast('Registo guardado.'); }); });
}
function openEntityModal(type,id){
  const map = { client:['clients','CLI'], supplier:['suppliers','FOR'], stock:['stock','STK'], user:['users','USR'], follow:['followups','AGE'] };
  const [key] = map[type]; const item = state[key].find(x=>x.id===id); if(!item) return;
  const fields = Object.keys(item).filter(k=>k!=='id' && !(type==='user' && k==='pageAccess'));
  openModal('Editar registo', `<form id="entityEditForm" class="form-grid">${fields.map(k=>`<input class="field" name="${k}" placeholder="${k}" value="${esc(item[k])}">`).join('')}<div class="span3"><button class="btn primary">Guardar</button></div></form>`);
  qs('#entityEditForm').addEventListener('submit',e=>{e.preventDefault(); Object.assign(item,Object.fromEntries(new FormData(e.target).entries())); if(key==='suppliers') sortSuppliersState(); saveState(); closeModal(); renderPage(currentPage); toast('Registo atualizado.');});
}
function openEntityReadModal(type,id){
  const map = { client:['clients'], supplier:['suppliers'], stock:['stock'], user:['users'], follow:['followups'] };
  const [key] = map[type] || [];
  const item = key ? state[key].find(x=>x.id===id) : null;
  if(!item) return;
  const fields = Object.entries(item).filter(([k])=>!['id','pageAccess','actionAccess'].includes(k));
  openModal('Detalhe do registo', `<div class="detail-grid">${fields.map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v || '-')}</strong></div>`).join('')}</div>`);
}
function bindFollowForm(){
  qs('#followForm').addEventListener('submit',e=>{ e.preventDefault(); state.followups.push({id:uid('AGE'),...Object.fromEntries(new FormData(e.target).entries())}); saveState(); renderPage('agenda'); toast('Follow-up guardado.'); });
}

function refreshConfigPage(message){
  rememberConfigAccordionState();
  const content = qs('#pageContent');
  const scrollTop = content?.scrollTop || 0;
  renderPage('config');
  setTimeout(()=>{
    restoreConfigAccordionState();
    const nextContent = qs('#pageContent');
    if(nextContent) nextContent.scrollTop = scrollTop;
  }, 160);
  if(message) toast(message);
}
function bindConfig(){
  restoreConfigAccordionState();
  qsa('.config-accordion').forEach(d=>d.addEventListener('toggle', rememberConfigAccordionState));
  const settingsForm = qs('#settingsForm');
  if(settingsForm) settingsForm.addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    state.settings={
      ...(state.settings || {}),
      companyName:fd.get('companyName'),
      companyNif:fd.get('companyNif'),
      companyAddress:fd.get('companyAddress'),
      companyPhone:fd.get('companyPhone'),
      companyEmail:fd.get('companyEmail'),
      dailyBackupHour:fd.get('dailyBackupHour'),
      theme:currentTheme(),
      spellcheckEnabled:fd.get('spellcheckEnabled')==='on',
      githubUrl:fd.get('githubUrl'),
      firebaseEnabled:firebaseReady
    };
    saveState(); applyTheme(); refreshConfigPage('Configurações guardadas.');
  });
  const permissionsForm = qs('#permissionsForm');
  if(permissionsForm) permissionsForm.addEventListener('submit', e=>{
    e.preventDefault();
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar permissões.');
    const fd = new FormData(e.target);
    const managed = managedPageList();
    const globalAccess = {};
    managed.forEach(p=>{ globalAccess[p.id] = fd.get(`operatorPage:${p.id}`) === 'on'; });
    state.settings = { ...(state.settings || {}), operatorPageAccess: globalAccess };
    (state.users || []).forEach(u=>{
      if((u.role || 'Operador') === 'Admin Master') return;
      const userAccess = {};
      managed.forEach(p=>{ userAccess[p.id] = fd.get(`userPage:${u.id}:${p.id}`) === 'on'; });
      u.pageAccess = userAccess;
    });
    saveState();
    buildNav();
    refreshConfigPage('Permissões guardadas.');
  });
  qsa('[data-warehouse-up]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar a ordem.');
    moveWarehouse(btn.dataset.warehouseUp, -1);
    saveState();
    refreshConfigPage('Ordem dos armazéns atualizada.');
  }));
  qsa('[data-warehouse-down]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar a ordem.');
    moveWarehouse(btn.dataset.warehouseDown, 1);
    saveState();
    refreshConfigPage('Ordem dos armazéns atualizada.');
  }));
  const resetWarehouseBtn = qs('#resetWarehouseOrderBtn');
  if(resetWarehouseBtn) resetWarehouseBtn.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar a ordem.');
    resetWarehouseOrder();
    saveState();
    refreshConfigPage('Armazéns ordenados A-Z.');
  });
  bindActionPermissions();
  bindAuditControls();
  bindBackupControls();
  bindProductionControls();
  bindPresentationControls();
  const reconnectBtn = qs('#reconnectFirebaseBtn');
  if(reconnectBtn) reconnectBtn.addEventListener('click',async()=>{
    const ok = firebaseReady || await initFirebase();
    if(!ok) return toast('Firebase indisponível.');
    if(!firebaseAuth.currentUser) await autoConnectFirebaseForLocalSession();
    if(firebaseAuth.currentUser) await loadCloudState({ readOnly: firebaseAuth.currentUser.isAnonymous });
    refreshConfigPage(firebaseAuth.currentUser ? 'Firebase ligada automaticamente.' : 'Firebase pronta. Faz login com conta Firebase para sincronizar escrita.');
  });
  const syncBtn = qs('#syncFirebaseBtn');
  if(syncBtn) syncBtn.addEventListener('click',async()=>{
    if(!firebaseAuth?.currentUser) await autoConnectFirebaseForLocalSession();
    if(firebaseAuth?.currentUser && !firebaseAuth.currentUser.isAnonymous && !cloudReadOnlyMode) await pushCloudState();
    if(firebaseAuth?.currentUser) await loadCloudState({ readOnly: firebaseAuth.currentUser.isAnonymous });
    updateFirebaseStatusBadge();
    toast(firebaseReady ? (cloudReadOnlyMode ? 'Firebase ligada em modo leitura. Entra com conta Firebase para gravar.' : 'Sincronizado com Firebase.') : 'Firebase indisponível.');
    refreshConfigPage('Sincronização manual concluída.');
  });
  const exportBtn = qs('#exportJsonBtn');
  if(exportBtn) exportBtn.addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='autoparts-callcenter-export.json'; a.click(); URL.revokeObjectURL(a.href); });
  const resetBtn = qs('#resetDemoBtn');
  if(resetBtn) resetBtn.addEventListener('click',()=>{ const currentUser = state.currentUser; localStorage.removeItem(STORAGE_KEY); state=seedData(); state.currentUser=currentUser; saveState(); toast('Demo reposta.'); setTimeout(()=>goPage('dashboard'), 250); });
}


function cleanDemoData(){
  const keepUser = state.currentUser;
  const keepSettings = { ...(state.settings || {}), productionMode:true };
  const keepUsers = (state.users || []).map(u => ({ ...u }));
  const keepBackups = Array.isArray(state.backups) ? [...state.backups] : [];
  state = ensureStateShape({
    ...seedData(),
    currentUser: keepUser,
    settings: { ...seedData().settings, ...keepSettings },
    users: keepUsers.length ? keepUsers : seedData().users,
    backups: keepBackups,
    calls: [],
    clients: [],
    suppliers: [],
    quotes: [],
    followups: [],
    stock: [],
    contactGroups: []
  });
  saveState();
}
function exportProductionReport(){
  const score = readinessScore();
  const lines = [
    `AutoParts CallCenter - Relatório de produção`,
    `Versão: ${APP_VERSION}`,
    `Data: ${new Date().toLocaleString('pt-PT')}`,
    `Empresa: ${state.settings?.companyName || '-'}`,
    `Produção ativa: ${state.settings?.productionMode === true ? 'Sim' : 'Não'}`,
    `Pronto para deploy: ${score.percent}% (${score.ok}/${score.total})`,
    '',
    'Checklist:'
  ];
  appReadinessChecks().forEach(item => lines.push(`- [${item.ok ? 'OK' : 'A rever'}] ${item.label} — ${item.note}`));
  lines.push('', 'Resumo de dados:');
  lines.push(`- Clientes: ${(state.clients || []).length}`);
  lines.push(`- Fornecedores: ${(state.suppliers || []).length}`);
  lines.push(`- Contactos: ${contactCount()}`);
  lines.push(`- Orçamentos: ${(state.quotes || []).length}`);
  const blob = new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'});
  downloadBlob(blob, `relatorio-producao-${today()}.txt`);
}
function bindProductionControls(){
  qs('#validateProductionBtn')?.addEventListener('click',()=>refreshConfigPage('Checklist atualizada.')); 
  qs('#toggleProductionModeBtn')?.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar isto.');
    state.settings = { ...(state.settings || {}), productionMode: !(state.settings?.productionMode === true) };
    saveState();
    refreshConfigPage(state.settings.productionMode ? 'Modo produção ativado.' : 'Modo produção desativado.');
  });
  qs('#exportProductionReportBtn')?.addEventListener('click',()=>exportProductionReport());
  qs('#cleanDemoDataBtn')?.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode limpar dados demo.');
    if(!confirm('Limpar os dados demo/operacionais atuais? Esta ação mantém utilizadores, configurações e backups.')) return;
    cleanDemoData();
    refreshConfigPage('Dados demo limpos.');
  });
  qs('#cleanDemoDataBtnAlt')?.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode limpar dados demo.');
    if(!confirm('Limpar sem criar backup? Esta ação mantém utilizadores, permissões e configurações.')) return;
    cleanDemoData();
    refreshConfigPage('Produção limpa preparada.');
  });
  qs('#prepareCleanProductionBtn')?.addEventListener('click',()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode preparar produção limpa.');
    if(!confirm('Criar backup completo e limpar dados operacionais/demo?')) return;
    createBackup('backup-antes-producao-limpa');
    cleanDemoData();
    refreshConfigPage('Backup criado e produção limpa preparada.');
  });
}

function openModal(title, html){ qs('#modalRoot').innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="btn danger-soft small" id="closeModalBtn">Fechar</button></div>${html}</div>`; qs('#modalRoot').classList.remove('hidden'); qs('#closeModalBtn').addEventListener('click',closeModal); qsa('#modalRoot [data-client-email]').forEach(b=>b.addEventListener('click',()=>emailClient(b.dataset.clientEmail))); applySpellcheckEnhancements(qs('#modalRoot')); }
function closeModal(){ qs('#modalRoot').classList.add('hidden'); qs('#modalRoot').innerHTML=''; }



/* v1.8.0 - Sistemas avançados: pesquisa global, auditoria, backups, permissões finas, modo TV */
function ensureGlobalSearchBox(){
  const header = qs('.shell-header');
  if(!header || qs('#globalSearchWrap')) return;
  const html = `<div id="globalSearchWrap" class="global-search-wrap"><input id="globalSearch" class="field global-search-input" placeholder="Pesquisa global: cliente, fornecedor, contacto, orçamento..."><div id="globalSearchResults" class="global-search-results"></div></div>`;
  const copy = qs('.header-copy');
  if(copy) copy.insertAdjacentHTML('afterend', html);
  updateGlobalSearchVisibility(currentPage);
}
function ensureBrandFavicon(){
  const href = '../assets/bragalis-callcenter-icon.png';
  let link = document.querySelector('link[rel="icon"]');
  if(!link){
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

function updateGlobalSearchVisibility(pageId){
  const wrap = qs('#globalSearchWrap');
  if(wrap) wrap.classList.toggle('hidden', pageId === 'dashboard');
}
function copyText(value){
  const text = value || '';
  if(!text) return toast('Nada para copiar.');
  navigator.clipboard?.writeText(text).then(()=>toast('Copiado.')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiado.');
  });
}
function actionPermissionsCard(){
  if(!isAdminMaster()) return '';
  const access = currentUserActionAccess();
  const base = { ...actionAccessDefaults(), ...(state.settings?.operatorActionAccess || {}) };
  const users = (state.users || []).filter(u => (u.role || 'Operador') !== 'Admin Master');
  const actions = [
    ['add','Adicionar'],['edit','Editar'],['delete','Apagar']
  ];
  return `<div class="card permissions-card span-all"><div class="card-head"><h3>Permissões finas</h3><span class="muted">Controla ações para operadores e exceções por utilizador.</span></div>
    <form id="actionPermissionsForm" class="permissions-form">
      <div class="permission-block"><h4>Regra geral para Operadores</h4><div class="permission-grid">
        ${actions.map(([key,label])=>`<label class="permission-check"><input type="checkbox" name="operatorAction:${key}" ${base[key]===true?'checked':''}> <span>${esc(label)}</span></label>`).join('')}
      </div></div>
      <div class="permission-block"><h4>Acesso específico por utilizador</h4><div class="permission-users">
        ${users.map(u=>`<div class="permission-user-row"><div class="permission-user-info"><strong>${esc(u.nome || u.email || '-')}</strong><span>${esc(u.email || '')}</span></div><div class="permission-grid user-specific-grid">
          ${actions.map(([key,label])=>`<label class="permission-check compact"><input type="checkbox" name="userAction:${u.id}:${key}" ${u.actionAccess?.[key]===true?'checked':''}> <span>${esc(label)}</span></label>`).join('')}
        </div></div>`).join('') || '<div class="empty compact">Sem utilizadores.</div>'}
      </div></div>
      <div class="actions"><button class="btn primary" type="submit">Guardar permissões finas</button></div>
    </form></div>`;
}
function bindActionPermissions(){
  const form = qs('#actionPermissionsForm');
  if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const fd = new FormData(form);
    state.settings.operatorActionAccess = actionAccessDefaults();
    ['add','edit','delete'].forEach(key=>{
      state.settings.operatorActionAccess[key] = fd.get(`operatorAction:${key}`) === 'on';
    });
    (state.users || []).forEach(u=>{
      if((u.role || 'Operador') === 'Admin Master') return;
      u.actionAccess = u.actionAccess || {};
      ['add','edit','delete'].forEach(key=>{
        u.actionAccess[key] = fd.get(`userAction:${u.id}:${key}`) === 'on';
      });
    });
    saveState('Permissões finas atualizadas');
    refreshConfigPage('Permissões finas guardadas.');
  });
}
function auditCard(){
  if(!isAdminMaster()) return '';
  const rows = (state.auditLogs || []).slice(0,80);
  return `<div class="card span-all audit-card"><div class="card-head"><h3>Auditoria</h3><span class="muted">Últimas alterações da app.</span></div>
    <div class="actions audit-actions"><button class="btn" id="exportAuditBtn" type="button">Exportar auditoria</button><button class="btn danger-soft" id="clearAuditBtn" type="button">Limpar auditoria</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Utilizador</th><th>Página</th><th>Ação</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(new Date(r.date).toLocaleString('pt-PT'))}</td><td>${esc(r.by)}</td><td>${esc(r.page)}</td><td>${esc(r.action)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda não existem registos de auditoria.</div>'}
  </div>`;
}
function bindAuditControls(){
  qs('#exportAuditBtn')?.addEventListener('click',()=>{
    const blob = new Blob([JSON.stringify(state.auditLogs || [], null, 2)], {type:'application/json'});
    downloadBlob(blob, `auditoria-callcenter-${today()}.json`);
  });
  qs('#clearAuditBtn')?.addEventListener('click',()=>{
    if(!confirm('Limpar todos os registos de auditoria?')) return;
    state.auditLogs = [];
    saveState('Auditoria limpa');
    refreshConfigPage('Auditoria limpa.');
  });
}
function backupCard(){
  if(!isAdminMaster()) return '';
  const backups = (state.backups || []).slice(0,10);
  return `<div class="card span-all backup-card"><div class="card-head"><h3>Backups</h3><span class="muted">Exportação e restauro por JSON.</span></div>
    <div class="backup-grid">
      <div class="backup-panel"><h4>Criar backup</h4><p class="muted">Cria um ponto de restauro completo com todos os dados atuais.</p><button class="btn primary" id="createBackupBtn" type="button">Criar backup agora</button><button class="btn" id="downloadFullBackupBtn" type="button">Exportar JSON completo</button></div>
      <div class="backup-panel"><h4>Restaurar backup</h4><p class="muted">Importa um ficheiro JSON exportado pela app.</p><input class="field" id="restoreBackupInput" type="file" accept=".json,application/json"></div>
    </div>
    <h4>Últimos backups</h4>
    ${backups.length ? `<div class="backup-list">${backups.map(b=>`<div class="backup-row"><div><strong>${esc(b.name)}</strong><span>${esc(new Date(b.date).toLocaleString('pt-PT'))}</span></div><div class="actions"><button class="btn small" data-download-backup="${b.id}">Download</button><button class="btn success small" data-restore-backup="${b.id}">Restaurar</button></div></div>`).join('')}</div>` : '<div class="empty compact">Ainda não existem backups.</div>'}
  </div>`;
}
function createBackup(name='Backup manual'){
  state.backups = Array.isArray(state.backups) ? state.backups : [];
  const rawSnapshot = { ...state, currentUser: state.currentUser };
  delete rawSnapshot.backups;
  const snapshot = JSON.parse(JSON.stringify(rawSnapshot));
  const backup = { id:uid('BKP'), name, date:new Date().toISOString(), appVersion:APP_VERSION, snapshot }; 
  state.backups.unshift(backup);
  state.backups = state.backups.slice(0,20);
  saveState(name);
  return backup;
}
function checkAutoBackup(){
  try {
    if(!isAdminMaster()) return;
    if(state.settings?.backupEnabled === false) return;
    const todayKey = today();
    if(state.settings?.lastAutoBackupDate === todayKey) return;
    state.settings.lastAutoBackupDate = todayKey;
    createBackup('Backup automático diário');
  } catch(err){ console.warn('Auto backup failed', err); }
}
function bindBackupControls(){
  qs('#createBackupBtn')?.addEventListener('click',()=>{ createBackup('Backup manual'); refreshConfigPage('Backup criado.'); });
  qs('#downloadFullBackupBtn')?.addEventListener('click',()=>downloadBackupSnapshot({ id:'full', name:'backup-completo', snapshot:state }));
  qs('#restoreBackupInput')?.addEventListener('change', async e=>{
    const file = e.target.files?.[0]; if(!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    const snapshot = data.snapshot || data;
    if(!snapshot || typeof snapshot !== 'object') return toast('Backup inválido.');
    if(!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
    const keepUser = state.currentUser;
    state = ensureStateShape({ ...seedData(), ...snapshot, currentUser: keepUser });
    saveState('Backup restaurado por ficheiro');
    refreshConfigPage('Backup restaurado.');
  });
  qsa('[data-download-backup]').forEach(b=>b.addEventListener('click',()=>{
    const backup = (state.backups || []).find(x=>x.id===b.dataset.downloadBackup);
    if(backup) downloadBackupSnapshot(backup);
  }));
  qsa('[data-restore-backup]').forEach(b=>b.addEventListener('click',()=>{
    const backup = (state.backups || []).find(x=>x.id===b.dataset.restoreBackup);
    if(!backup) return;
    if(!confirm(`Restaurar ${backup.name}?`)) return;
    const keepUser = state.currentUser;
    state = ensureStateShape({ ...seedData(), ...backup.snapshot, currentUser: keepUser, backups: state.backups });
    saveState('Backup restaurado');
    refreshConfigPage('Backup restaurado.');
  }));
}
function downloadBackupSnapshot(backup){
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  downloadBlob(blob, `${backup.name || 'backup'}-${today()}.json`.replace(/\s+/g,'-').toLowerCase());
}
function presentationCard(){
  return `<div class="card span-all presentation-card"><div class="card-head"><h3>Modo apresentação / TV</h3><span class="muted">Painel simples para ecrã grande.</span></div><div class="actions"><button class="btn primary" id="openTvModeBtn" type="button">Abrir modo TV</button></div></div>`;
}
function bindPresentationControls(){
  qs('#openTvModeBtn')?.addEventListener('click',openTvMode);
}
function openTvMode(){
  const totalClients = (state.clients || []).length;
  const totalSuppliers = (state.suppliers || []).length;
  const totalContacts = flattenContactGroups().length;
  const totalQuotes = (state.quotes || []).length;
  openModal('Modo apresentação / TV', `<div class="tv-mode-panel"><div><strong>${totalClients}</strong><span>Clientes</span></div><div><strong>${totalSuppliers}</strong><span>Fornecedores</span></div><div><strong>${totalContacts}</strong><span>Contactos</span></div><div><strong>${totalQuotes}</strong><span>Orçamentos</span></div></div><p class="muted tv-note">Este painel é limpo para ecrã de TV/reunião. Usa F11 no browser ou fullscreen no Electron.</p>`);
}


window.addEventListener('beforeunload', ()=>{
  if(hasWritableFirebaseSession() && (cloudSavePending || localStorage.getItem('autoparts_firebase_dirty_v1') === '1')) {
    pushCloudState({ source:'beforeunload' });
  }
});
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => { if(currentResolution && currentResolution() === 'auto') applyTheme(); });
