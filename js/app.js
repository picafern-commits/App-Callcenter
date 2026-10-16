const APP_VERSION = '2.9.54';
const STORAGE_KEY = 'bragalis_callcenter_v1';
const SESSION_KEY = 'bragalis_callcenter_session';
const THEME_KEY = 'bragalis_user_theme_v1';
const RESOLUTION_KEY = 'bragalis_resolution_v1';
const FIREBASE_LEGACY_STATE_COLLECTION = 'appState';
const FIREBASE_LEGACY_STATE_DOC = 'main';
const FIREBASE_META_COLLECTION = 'meta';
const FIREBASE_META_DOC = 'app';
const FIREBASE_COLLECTIONS = {
  calls: 'pedidos',
  clients: 'clientes',
  suppliers: 'fornecedores',
  quotes: 'orcamentos',
  routes: 'rotas',
  vehicles: 'viaturas',
  followups: 'agenda',
  stock: 'stock',
  references: 'referenciasEmpresa',
  users: 'utilizadores',
  contactGroups: 'diretorioContactos',
  auditLogs: 'auditoria',
  backups: 'backups',
  engineCatalog: 'catalogoMotor',
  engineCatalogEngines: 'catalogoMotores',
  engineCatalogTypes: 'catalogoTiposPeca'
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
let firebaseStorage = null;
let cloudSaveTimer = null;
let firebaseUnsubscribers = [];
let pendingSignupUser = null;
let cloudReadOnlyMode = false;
let firebaseRefreshTimer = null;
let cloudSaveInProgress = false;
let cloudSavePending = false;
let lastCloudSaveAt = 0;
let firebaseLoadedKeys = new Set();
let userPresenceTimer = null;
const USER_SESSION_ID = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const CONFIG_OPEN_KEY = 'bragalis_config_open_sections_v1';
function isElectronApp(){
  return new URLSearchParams(window.location.search).get('electron') === '1' || navigator.userAgent.toLowerCase().includes('electron');
}
function svgIcon(pathD, viewBox='0 0 24 24'){
  return `<svg class="ui-icon" viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${pathD}"></path></svg>`;
}
const ICONS = {
  dashboard: svgIcon('M3 13.2h8V3H3zm10 7.8h8V11h-8zM3 21h8v-5.8H3zm10-10h8V3h-8z'),
  search: svgIcon('M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm6-2 4 4'),
  clientes: svgIcon('M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m9.5 10v-2a4 4 0 0 0-3-3.87M14.5 3.13a4 4 0 0 1 0 7.75'),
  contactos: svgIcon('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.13.98.37 1.94.72 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.22-1.27a2 2 0 0 1 2.1-.45c.92.35 1.88.59 2.86.72A2 2 0 0 1 22 16.9'),
  fornecedores: svgIcon('M3 21h18M5 21V7l7-4 7 4v14M9 9h6M9 13h6M9 17h6'),
  rotas: svgIcon('M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12h11M14 9h3l4 4v5h-7M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0'),
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
  arrow: svgIcon('M5 12h14M12 5l7 7-7 7'),
  catalogo: svgIcon('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z')
};

const pages = [
  { id: 'dashboard', icon: ICONS.dashboard, title: 'Dashboard', short: 'Portal', subtitle: 'Painel principal da operação' },
  { id: 'clientes', icon: ICONS.clientes, title: 'Clientes', short: 'Clientes', subtitle: 'Fichas, histórico e contactos' },
  { id: 'contactos', icon: ICONS.contactos, title: 'Diretório de contactos', short: 'Diretório', subtitle: 'Pesquisa rápida de clientes e fornecedores' },
  { id: 'fornecedores', icon: ICONS.fornecedores, title: 'Fornecedores', short: 'Fornecedores', subtitle: 'Lista de fornecedores e referências' },
  { id: 'referencias', icon: ICONS.catalogo, title: 'Referências', short: 'Referências', subtitle: 'Base geral de referências da empresa' },
  { id: 'users', icon: ICONS.users, title: 'Utilizadores', short: 'Users', subtitle: 'Equipa, cargos e permissões' },
  { id: 'configs-user', icon: ICONS.configsUser, title: 'Minhas Configs', short: 'Configs', subtitle: 'Tema e preferências do utilizador' },
  { id: 'config', icon: ICONS.config, title: 'Configurações', short: 'Admin', subtitle: 'GitHub, Electron, Firebase e backups' }
];

const pageFiles = {
  dashboard: 'index.html',
  clientes: 'clientes.html',
  contactos: 'contactos.html',
  fornecedores: 'fornecedores.html',
  referencias: 'referencias.html',
  'nova-chamada': 'nova-chamada.html',
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
      companyName: 'Bragalis Callcenter',
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
      backupEnabled: true,
      lastAutoBackupDate: '',
      cardLayout: 'grid',
      cardSize: 'normal'
    },
    currentUser: null,
    calls: [
    ],
    clients: [
    ],
    suppliers: [
    ],
    quotes: [],
    vehicles: [],
    routes: [],
    followups: [
    ],
    stock: [
    ],
    references: [],
    engineCatalog: [],
    engineCatalogEngines: [],
    engineCatalogTypes: [],
    users: [
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
        ]
      },
      {
        id: uid('DIR'),
        armazem:'Armazém Porto',
        seccao:'Apoio',
        nome:'Apoio',
        aberto:false,
        contactos:[
        ]
      }
    ]
  };
}

function loadState() {
  // Firebase-only: não carregamos dados da app do localStorage.
  // O estado real vem sempre da Firestore depois do login Firebase.
  return ensureStateShape(seedData());
}
function ensureStateShape(appState){
  const base = seedData();
  appState.settings = { ...base.settings, ...(appState.settings || {}) };
  if(!['grid','list'].includes(appState.settings.cardLayout)) appState.settings.cardLayout = 'grid';
  if(!['compact','normal','large'].includes(appState.settings.cardSize)) appState.settings.cardSize = 'normal';
  appState.auditLogs = Array.isArray(appState.auditLogs) ? appState.auditLogs : [];
  appState.backups = Array.isArray(appState.backups) ? appState.backups : [];
  appState.users = (appState.users || []).map(u => {
    const next = { pageAccess:{}, actionAccess:{}, permissions:{}, status:'Ativo', role:'Operador', ...u };
    next.permissions = normalizeUserPermissions(next);
    return next;
  });
  appState.contactGroups = Array.isArray(appState.contactGroups) ? appState.contactGroups : [];
  appState.engineCatalog = Array.isArray(appState.engineCatalog) ? appState.engineCatalog : [];
  appState.engineCatalogEngines = Array.isArray(appState.engineCatalogEngines) ? appState.engineCatalogEngines : [];
  appState.engineCatalogTypes = Array.isArray(appState.engineCatalogTypes) ? appState.engineCatalogTypes : [];
  appState.calls = Array.isArray(appState.calls) ? appState.calls : [];
  appState.settings.transportes = Array.isArray(appState.settings.transportes) ? appState.settings.transportes : [];
  appState.suppliers = Array.isArray(appState.suppliers) ? appState.suppliers : [];
  appState.references = Array.isArray(appState.references) ? appState.references : [];
  appState.routes = Array.isArray(appState.routes) ? appState.routes : [];
  appState.vehicles = Array.isArray(appState.vehicles) ? appState.vehicles : deriveVehiclesFromRoutes(appState.routes || []);
  appState.quotes = (Array.isArray(appState.quotes) ? appState.quotes : []).map(q=>{ const items = quoteItemsFromLegacy(q); return { ...q, items, total: quoteItemsTotal(items) }; });
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
    return true;
  }
  if(state.currentUser?.email) {
    setStoredSession(state.currentUser);
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
    const label = status.includes('guardar') ? 'Firebase · A guardar...'
      : status.includes('pendente') ? 'Firebase · Pendente'
      : status.includes('ligado') ? 'Firebase · Guardado'
      : status.includes('offline') ? 'Firebase · Offline'
      : status;
    badge.textContent = label;
    const cls = status.includes('ligado') ? 'green' : (status.includes('guardar') ? 'blue' : 'orange');
    badge.className = `badge firebase-status-strong ${cls}`;
    badge.title = lastCloudSaveAt ? `Último save: ${new Date(lastCloudSaveAt).toLocaleString('pt-PT')}` : 'Estado Firebase';
  }
}

function currentUserId(){
  const profileId = currentUserRecord()?.id;
  if(profileId) return profileId;
  const authUid = firebaseAuth?.currentUser?.uid;
  if(authUid) return authUid;
  return '';
}
function onlineCutoffMs(){
  return Date.now() - 2 * 60 * 1000;
}
function isUserOnline(user){
  if(user?.online !== true) return false;
  const raw = user.lastSeen || user.lastSeenAt || '';
  const time = raw ? Date.parse(raw) : 0;
  return Number.isFinite(time) && time >= onlineCutoffMs();
}
function userPresenceLabel(user){
  if(isUserOnline(user)) return user.currentPage ? `Online · ${pageTitleById(user.currentPage)}` : 'Online';
  if(user?.lastSeen) {
    const date = new Date(user.lastSeen);
    if(!Number.isNaN(date.getTime())) return `Visto ${date.toLocaleString('pt-PT')}`;
  }
  return 'Offline';
}
function pageTitleById(id){
  return pages.find(p=>p.id===id)?.title || id || '-';
}
async function updateUserPresence(online=true){
  // Desativado por performance: em ligação remota criava escritas Firebase desnecessárias.
  return false;
}
function startUserPresence(){
  // Presença desativada para tornar a app mais leve.
}
function stopUserPresence(markOffline=true){
  if(userPresenceTimer) clearInterval(userPresenceTimer);
  userPresenceTimer = null;
}
window.addEventListener('beforeunload', ()=>{ stopUserPresence(false); });

function saveState(action='Alteração guardada'){
  if(!hasWritableFirebaseSession()){
    toast('Sem Firebase ativo. Nada foi gravado.');
    updateFirebaseStatusBadge();
    return false;
  }
  addAuditLog(action, currentPage || getDefaultPage());
  scheduleCloudSave();
  return true;
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
function saveLocalOnly(){
  // Firebase-only: não guardar dados da app localmente.
  // Tema/resolução/sessão continuam em chaves próprias, mas dados ficam só na Firestore.
}
function appIsVisible(){ return !qs('#appShell')?.classList.contains('hidden'); }
function firebaseStatus(){
  if (!firebaseReady) return 'Firebase offline';
  if(!firebaseAuth?.currentUser) return 'Sem login Firebase';
  if(firebaseAuth.currentUser.isAnonymous || cloudReadOnlyMode) return 'Firebase leitura';
  if(cloudSaveInProgress) return 'Firebase a guardar';
  if(cloudSavePending) return 'Firebase pendente';
  return 'Firebase ligado';
}
function hasWritableFirebaseSession(){
  return Boolean(firebaseReady && firebaseAuth?.currentUser && firebaseDb && !firebaseAuth.currentUser.isAnonymous && !cloudReadOnlyMode);
}
function markFirebaseDirty(){
  cloudSavePending = true;
}
function clearFirebaseDirty(){
  cloudSavePending = false;
}
function scheduleCloudSave(){
  markFirebaseDirty();
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(()=>pushCloudState({ source:'autosave' }), 450);
}
async function flushPendingCloudSave(){
  if(cloudSavePending && hasWritableFirebaseSession()) {
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
    toast(`Erro Firebase: ${pageTitleById(currentPage)} não foi guardado${code}.`);
    return false;
  } finally {
    cloudSaveInProgress = false;
  }
}
function canSyncCollectionKey(stateKey){
  if(stateKey === 'references') return false;
  if(isAdminMaster()) return true;
  if(stateKey === 'users') return false;
  if(stateKey === 'auditLogs' || stateKey === 'backups') return false;
  const pageByKey = {
    clients:'clientes',
    suppliers:'fornecedores',
    quotes:'orcamentos',
    routes:'rotas',
    vehicles:'rotas',
    followups:'agenda',
    stock:'stock',
    references:'referencias',
    contactGroups:'contactos',
    calls:'pedidos',
    engineCatalog:'catalogo-motor',
    engineCatalogEngines:'catalogo-motor',
    engineCatalogTypes:'catalogo-motor'
  };
  const pageId = pageByKey[stateKey] || currentPage;
  return canAction('add', pageId) || canAction('edit', pageId) || canAction('delete', pageId);
}
const PAGE_COLLECTION_KEYS = {
  dashboard:['users'],
  'nova-chamada':['calls','clients','suppliers'],
  pedidos:['calls','clients','suppliers','quotes'],
  clientes:['clients'],
  contactos:['contactGroups'],
  fornecedores:['suppliers'],
  // Referências são consultadas por pesquisa paginada; nunca descarregar a coleção inteira.
  referencias:[],
  'catalogo-motor':['engineCatalogEngines','engineCatalogTypes','engineCatalog'],
  rotas:['routes','vehicles'],
  orcamentos:['quotes','clients'],
  agenda:['followups'],
  stock:['stock'],
  relatorios:['calls','clients','suppliers','quotes','routes','stock'],
  users:['users'],
  config:['users'],
  'configs-user':['users']
};
function initialFirebaseKeys(){
  return ['users'];
}
function keysForPage(pageId){
  return PAGE_COLLECTION_KEYS[pageId] || [];
}
const firebaseLoadingKeys = new Map();
async function loadCollectionKey(stateKey){
  if(!firebaseReady || !firebaseDb || !FIREBASE_COLLECTIONS[stateKey] || firebaseLoadedKeys.has(stateKey)) return true;
  if(firebaseLoadingKeys.has(stateKey)) return firebaseLoadingKeys.get(stateKey);
  const task = (async ()=>{
    const result = await safeLoadCollection(stateKey, FIREBASE_COLLECTIONS[stateKey]);
    if(result.ok && Array.isArray(result.rows)) {
      state[stateKey] = result.rows;
      firebaseLoadedKeys.add(stateKey);
      state = ensureStateShape(state);
      return true;
    }
    return false;
  })().finally(()=>firebaseLoadingKeys.delete(stateKey));
  firebaseLoadingKeys.set(stateKey, task);
  return task;
}
async function ensurePageCollections(pageId){
  const keys = keysForPage(pageId).filter(k=>!firebaseLoadedKeys.has(k));
  if(!keys.length) return false;
  const content = qs('#pageContent');
  if(content) content.classList.add('soft-loading');
  const results = await Promise.all(keys.map(k=>loadCollectionKey(k)));
  if(content) content.classList.remove('soft-loading');
  return results.some(Boolean);
}

async function canLoadCollectionKey(stateKey) {
  // 1. Liberta o catálogo imediatamente
  if (stateKey === 'catalogoMotores' || stateKey === 'catalogoMotors' || stateKey === 'catalogoTiposPeca') {
    return true;
  }
  
  // 2. Retorno padrão seguro
  return false;
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
        settings: sanitizeForFirestore(state.settings || {}),
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

  const pageKeys = keysForPage(currentPage || getDefaultPage());
  const syncKeys = pageKeys.length ? pageKeys : Object.keys(FIREBASE_COLLECTIONS);
  for (const [stateKey, collectionName] of Object.entries(FIREBASE_COLLECTIONS)) {
    if (!syncKeys.includes(stateKey)) continue;
    if (!firebaseLoadedKeys.has(stateKey) && stateKey !== 'users') continue;
    if (!canSyncCollectionKey(stateKey)) continue;
    try {
      const allowDelete = (isAdminMaster() || canSyncCollectionKey(stateKey)) && firebaseLoadedKeys.has(stateKey);
      await syncCollection(collectionName, state[stateKey] || [], allowDelete);
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
  const commitIfNeeded = async(force=false)=>{
    if(ops && (force || ops >= 450)){
      await batch.commit();
      batch = firebaseDb.batch();
      ops = 0;
    }
  };

  for(const doc of existing.docs || []){
    if (allowDelete && !ids.has(doc.id)) {
      batch.delete(doc.ref);
      ops++;
      await commitIfNeeded();
    }
  }

  for(const row of rows){
    const id = row.id || uid('DOC');
    row.id = id;
    const payload = sanitizeRowForFirestore(row);
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.updatedBy = firebaseAuth.currentUser.email || '';
    batch.set(collectionRef.doc(id), payload, { merge: true });
    ops++;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);
}

async function saveSingleRowToFirebase(stateKey, row){
  if(!hasWritableFirebaseSession()) return false;
  const collectionName = FIREBASE_COLLECTIONS[stateKey];
  if(!collectionName || !row?.id) return false;
  const payload = sanitizeRowForFirestore(row);
  if(stateKey === 'references') Object.assign(payload, referenceSearchFields(row));
  payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  payload.updatedBy = firebaseAuth.currentUser.email || '';
  await firebaseDb.collection(collectionName).doc(row.id).set(payload, { merge:true });
  firebaseLoadedKeys.add(stateKey);
  clearFirebaseDirty();
  updateFirebaseStatusBadge();
  return true;
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
    firebaseLoadedKeys = new Set();
    const loadKeys = options.full === true
      ? Object.keys(FIREBASE_COLLECTIONS).filter(k=>!['auditLogs','backups','references'].includes(k))
      : initialFirebaseKeys();
    const entries = Object.entries(FIREBASE_COLLECTIONS)
      .filter(([stateKey]) => loadKeys.includes(stateKey))
      .filter(([stateKey]) => canLoadCollectionKey(stateKey));
    const results = await Promise.all(entries.map(async ([stateKey, collectionName]) => {
      const result = await safeLoadCollection(stateKey, collectionName);
      return [stateKey, result];
    }));
    results.forEach(([stateKey, result])=>{
      if(result.ok && Array.isArray(result.rows)) {
        state[stateKey] = result.rows;
        firebaseLoadedKeys.add(stateKey);
        loadedRows += result.rows.length;
        loadedCollections++;
      } else {
        state[stateKey] = base[stateKey] || [];
      }
    });

    if (!loadedRows && !authUser.isAnonymous) {
      await migrateLegacyCloudState(base);
    }

    cloudReadOnlyMode = !!authUser.isAnonymous || !!options.readOnly;
    state = ensureStateShape(state);
    syncCurrentUserName();
    startFirebaseListeners();
    updateFirebaseStatusBadge();
    if(options.flush === true) await flushPendingCloudSave();
    console.log(`Firebase load ok: ${loadedCollections} coleções, ${loadedRows} registos.`);
  } catch (err) {
    console.warn('Firebase load failed', err);
    toast('Firebase ligou, mas não conseguiu carregar dados. Confirma rules/permissões.');
  }
}
function cleanFirebaseDoc(doc){
  const normalizeDate = value => {
    if (!value) return '';
    if (value.toDate && typeof value.toDate === 'function') return value.toDate().toISOString();
    return String(value);
  };
  return {
    ...doc,
    createdAt: normalizeDate(doc.createdAt),
    updatedAt: normalizeDate(doc.updatedAt)
  };
}
function sanitizeForFirestore(value){
  if(value === undefined) return undefined;
  if(value === null) return null;
  if(value instanceof Date) return value.toISOString();
  if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if(typeof value === 'string' || typeof value === 'boolean') return value;
  if(Array.isArray(value)) {
    return value
      .map(item => sanitizeForFirestore(item))
      .filter(item => item !== undefined);
  }
  if(typeof value === 'object') {
    // Mantém valores especiais da Firebase, como serverTimestamp().
    if(value && value.constructor && String(value.constructor.name || '').includes('FieldValue')) return value;
    const out = {};
    Object.entries(value).forEach(([key,val])=>{
      if(typeof val === 'function') return;
      const clean = sanitizeForFirestore(val);
      if(clean !== undefined) out[key] = clean;
    });
    return out;
  }
  return String(value || '');
}
function sanitizeRowForFirestore(row){
  const clean = sanitizeForFirestore(row || {});
  if(clean.items && Array.isArray(clean.items)) {
    clean.items = clean.items.map(item => ({
      id:item.id || uid('ITM'),
      nome:String(item.nome || ''),
      referencia:String(item.referencia || ''),
      unidade:Number.isFinite(Number(item.unidade)) ? Number(item.unidade) : 1,
      preco:Number.isFinite(Number(item.preco)) ? Number(item.preco) : 0,
      total:Number.isFinite(Number(item.total)) ? Number(item.total) : ((Number(item.unidade)||1) * (Number(item.preco)||0))
    }));
  }
  return clean;
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
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    firebaseStorage = firebase.storage();
    firebaseReady = true;
    return true;
  } catch (err) {
    console.warn('Firebase unavailable', err);
    firebaseReady = false;
    return false;
  }
}
function uid(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function quoteIdNumber(id){
  const m = String(id || '').match(/^ORC-(\d+)$/i);
  return m ? Number(m[1]) : 0;
}
function nextQuoteId(){
  const max = (state.quotes || []).reduce((highest,q)=>Math.max(highest, quoteIdNumber(q.id)), 0);
  const next = max + 1;
  return `ORC-${String(next).padStart(3,'0')}`;
}

function currentQuoteCreator(){
  return {
    name: preferredUserName('Utilizador'),
    email: state.currentUser?.email || firebaseAuth?.currentUser?.email || ''
  };
}
function quoteCreatorName(q){
  const explicit = q?.createdByName || q?.userName || q?.operador || q?.createdByUser || '';
  if(explicit) return explicit;
  const email = q?.createdByEmail || q?.createdBy || q?.updatedBy || q?.history?.[0]?.by || '';
  if(email) {
    const user = (state.users || []).find(u => String(u.email || '').toLowerCase() === String(email).toLowerCase());
    return user?.nome || user?.name || String(email).split('@')[0];
  }
  return '';
}
function today(){ return new Date().toISOString().slice(0,10); }
function currentTimeHM(){
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function money(v){ return Number(v || 0).toLocaleString('pt-PT',{style:'currency',currency:'EUR'}); }
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function toast(msg){ const el = qs('#toast'); el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),2600); }
function qs(s){ return document.querySelector(s); }
function qsa(s){ return [...document.querySelectorAll(s)]; }
function companyName(){ return state.settings?.companyName || 'Bragalis Callcenter'; }
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
  const remoteFast = state.settings?.remoteFastMode !== false;
  const cardLayout = ['grid','list'].includes(state.settings?.cardLayout) ? state.settings.cardLayout : 'grid';
  const cardSize = ['compact','normal','large'].includes(state.settings?.cardSize) ? state.settings.cardSize : 'normal';
  const themeKey = `${dark}|${resolution}|${resolvedResolution}|${isAdminMaster()}|${currentRole ? currentRole() : ''}|${remoteFast}|${cardLayout}|${cardSize}`;
  if(window.__lastAppliedThemeKey === themeKey) return;
  window.__lastAppliedThemeKey = themeKey;
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
  document.documentElement.classList.toggle('remote-fast-mode', remoteFast);
  document.body.classList.toggle('remote-fast-mode', remoteFast);
  ['cards-layout-grid','cards-layout-list'].forEach(cls=>{ document.documentElement.classList.remove(cls); document.body.classList.remove(cls); });
  ['cards-size-compact','cards-size-normal','cards-size-large'].forEach(cls=>{ document.documentElement.classList.remove(cls); document.body.classList.remove(cls); });
  document.documentElement.classList.add(`cards-layout-${cardLayout}`, `cards-size-${cardSize}`);
  document.body.classList.add(`cards-layout-${cardLayout}`, `cards-size-${cardSize}`);
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
function permissionDefaults(){
  return { view:false, add:false, edit:false, delete:false };
}
function fullPermissionDefaults(){
  return { view:true, add:true, edit:true, delete:true };
}
function roleDefaultPermissions(role){
  const normalized = String(role || '').toLowerCase();
  if(normalized === 'admin master' || normalized === 'admin') return fullPermissionDefaults();
  if(normalized === 'supervisor') return { view:true, add:true, edit:true, delete:false };
  return { view:true, add:true, edit:false, delete:false };
}
function normalizeUserPermissions(user){
  const managed = managedPageList();
  const source = user?.permissions || {};
  const hasNewPermissions = Object.keys(source || {}).length > 0;
  const oldPageAccess = user?.pageAccess || {};
  const oldActionAccess = user?.actionAccess || {};
  const roleDefault = roleDefaultPermissions(user?.role || 'Operador');
  const migrated = {};
  managed.forEach(p=>{
    const existing = source[p.id] || {};
    const oldView = hasOwn(oldPageAccess, p.id) ? oldPageAccess[p.id] === true : roleDefault.view;
    migrated[p.id] = {
      // Se ainda não houver permissões gravadas para este user, deixa a página visível.
      // Depois de guardares permissões, o campo view passa a mandar.
      view: hasOwn(existing,'view') ? existing.view === true : (hasNewPermissions ? false : oldView),
      add: hasOwn(existing,'add') ? existing.add === true : (hasOwn(oldActionAccess,'add') ? oldActionAccess.add === true : roleDefault.add),
      edit: hasOwn(existing,'edit') ? existing.edit === true : (hasOwn(oldActionAccess,'edit') ? oldActionAccess.edit === true : roleDefault.edit),
      delete: hasOwn(existing,'delete') ? existing.delete === true : (hasOwn(oldActionAccess,'delete') ? oldActionAccess.delete === true : roleDefault.delete)
    };
  });
  return migrated;
}
function currentUserRecordSafe(){
  return currentUserRecord ? currentUserRecord() : null;
}
function hasOwn(obj, key){
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}
function userPagePermissions(user, pageId){
  if(!user) return permissionDefaults();
  if((user.role || '') === 'Admin Master') return fullPermissionDefaults();
  user.permissions = normalizeUserPermissions(user);
  return { ...permissionDefaults(), ...(user.permissions?.[pageId] || {}) };
}
function userCanOpenManagedPage(user, pageId){
  return userPagePermissions(user, pageId).view === true;
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
  if(id === 'users') return isAdminMaster();
  if(id === 'config') return isAdminMaster();
  const managedIds = managedPageList().map(p=>p.id);
  if(managedIds.includes(id)) return userCanOpenManagedPage(currentUserRecord(), id);
  return isAdminMaster();
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
  startUserPresence();
  renderPage(currentPage);
}


async function autoConnectFirebaseForLocalSession(){
  // Firebase-only: não usar login anónimo/read-only para trabalhar.
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
          await firebaseAuth.signOut().catch(()=>{});
          toast('Login Firebase obrigatório.');
          return;
        }
        await loadCloudState();
        if (pendingSignupUser && pendingSignupUser.email?.toLowerCase() === user.email?.toLowerCase()) {
          upsertAppUser({ ...pendingSignupUser, id:user.uid });
          syncCurrentUserName();
          pendingSignupUser = null;
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
        // Sem user Firebase real, não abrimos a app em modo local.
        // Isto evita gravar alterações só no browser/Electron sem sincronizar.
        state.currentUser = null;
        updateFirebaseStatusBadge();
        if(!isLoginPage()) { redirectToLogin(); return; }
        qs('#appShell')?.classList.add('hidden');
        document.body.classList.remove('auth-boot');
        qs('#loginScreen')?.classList.remove('hidden');
      }
    });
    return;
  }

  // Firebase-only: se Firebase não carregou, não abrimos a app em modo local.
  state.currentUser = null;
  if(!isLoginPage()) { redirectToLogin(); return; }
  document.body.classList.remove('auth-boot');
  toast('Firebase offline. A app precisa de Firebase para funcionar.');

}

function restoreLogin(){
  const emailInput = qs('#loginEmail');
  const passwordInput = qs('#loginPassword');
  const rememberInput = qs('#rememberLogin');
  const saved = localStorage.getItem('bragalis_remembered_email_v2') || '';
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
  if(qs('#rememberLogin')?.checked) localStorage.setItem('bragalis_remembered_email_v2', email);
  else localStorage.removeItem('bragalis_remembered_email_v2');
  if (firebaseReady) {
    if(!password) return toast('Mete a password para entrar.');
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      return;
    } catch (err) {
      console.warn('Firebase login failed', err);
      if(err.code === 'auth/user-not-found') return toast('Conta Firebase não encontrada. Cria a conta ou pede ao Admin Master.');
      if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') return toast('Email ou password incorretos.');
      if(err.code === 'auth/too-many-requests') return toast('Muitas tentativas. Aguarda e tenta novamente.');
      return toast('Login Firebase falhou. Confirma email/password e Firebase Auth.');
    }
  }
  toast('Firebase offline. A app precisa de Firebase para entrar.');
}
async function signupFromLogin(){
  if(!firebaseReady) return toast('Firebase indisponível. Tenta novamente com internet.');
  const nome = qs('#signupName').value.trim();
  const email = qs('#signupEmail').value.trim().toLowerCase();
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
      permissions: normalizeUserPermissions({ pageAccess:{}, actionAccess:{} }),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy:isMasterSignup ? 'signup-admin-master' : 'signup-login'
    }, { merge:true });
    if(qs('#rememberLogin')?.checked) localStorage.setItem('bragalis_remembered_email_v2', email);
    else localStorage.removeItem('bragalis_remembered_email_v2');
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
  await updateUserPresence(false);
  stopUserPresence(false);
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
  const renderers = { dashboard, 'nova-chamada': novaChamada, clientes, contactos, fornecedores, referencias, agenda, stock, relatorios, users, 'configs-user': configsUser, config };
  const paint = ()=>{
    const pageBody = renderers[id]();
    const content = qs('#pageContent');
    if(content) content.innerHTML = `${excelToolbar(id)}${pageBody}`;
    bindPage(id);
    // Correção ortográfica pesada desativada no render para melhorar ligação remota.
    document.body.classList.remove('page-loading','page-changing','page-changing-soft');
    clearPendingPageLoader();
  };
  paint();
  ensurePageCollections(id).then((changed)=>{
    if(changed && currentPage === id) paint();
  }).catch(err=>console.warn('Lazy page load failed', err));
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
function normalizeSearchText(v){
  return normalizeText(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
function globalSearchCollectionReady(key){
  // Em modo local, os dados existentes no estado também são pesquisáveis.
  return !firebaseReady || firebaseLoadedKeys.has(key);
}
function globalSearchRows(){
  const rows = [];
  if(canOpenPage('clientes') && globalSearchCollectionReady('clients')) rows.push(...(state.clients || []).map(c=>({ type:'Cliente', title:c.nome, detail:`${clientCode(c)} · ${c.telefone || ''} · ${c.email || ''}`, page:'clientes' })));
  if(canOpenPage('contactos') && globalSearchCollectionReady('contactGroups')) {
    (state.contactGroups || []).forEach(g => (g.contactos || []).forEach(c => rows.push({ type:'Contacto', title:c.nome, detail:`${g.nome} · ${c.telemovel || c.telefone || ''} · ${c.email || ''}`, page:'contactos' })));
  }
  if(canOpenPage('fornecedores') && globalSearchCollectionReady('suppliers')) {
    rows.push(...(state.suppliers || []).map(s=>({ type:'Fornecedor', title:supplierName(s) || 'Fornecedor', detail:`${supplierRef(s)} · ${s.telefone || ''} · ${s.email || ''}`, page:'fornecedores' })));
  }
  return rows;
}
function globalSearchResults(query){
  const q = (query || '').trim().toLocaleLowerCase('pt-PT');
  if(!q) return '<div class="empty compact">Escreve para pesquisar nas áreas a que tens acesso.</div>';
  const rows = globalSearchRows().filter(r => `${r.type} ${r.title} ${r.detail}`.toLocaleLowerCase('pt-PT').includes(q)).slice(0,8);
  if(!rows.length) return '<div class="empty compact">Sem resultados nas áreas carregadas e autorizadas.</div>';
  return `<div class="search-results">${rows.map(r=>`<button class="search-result" type="button" data-go="${r.page}"><strong>${esc(r.type)} · ${esc(r.title || '-')}</strong><span>${esc(r.detail || '')}</span></button>`).join('')}</div>`;
}
async function prepareGlobalSearchData(){
  if(!firebaseReady || !firebaseDb) return { failed:[] };
  const keyToPage = { clients:'clientes', contactGroups:'contactos', suppliers:'fornecedores' };
  const keys = Object.entries(keyToPage).filter(([key,page])=>canOpenPage(page) && !firebaseLoadedKeys.has(key)).map(([key])=>key);
  const results = await Promise.all(keys.map(async key=>({ key, ok:await loadCollectionKey(key) })));
  return { failed:results.filter(r=>!r.ok).map(r=>r.key) };
}
function bindGlobalSearchInput(input, results){
  if(!input || input.dataset.bound === '1') return;
  input.dataset.bound = '1';
  let request = 0;
  input.addEventListener('input', async ()=>{
    const query = input.value;
    const target = qs(`#${results}`);
    if(!target) return;
    if(!query.trim()) {
      target.innerHTML = globalSearchResults('');
      return;
    }
    const currentRequest = ++request;
    target.innerHTML = '<div class="empty compact">A pesquisar...</div>';
    const status = await prepareGlobalSearchData();
    if(currentRequest !== request || !qs(`#${results}`)) return;
    const resultTarget = qs(`#${results}`);
    resultTarget.innerHTML = globalSearchResults(query);
    if(status.failed.length && !globalSearchRows().length) resultTarget.innerHTML = '<div class="empty compact">Não foi possível carregar os dados da pesquisa. Verifica a ligação e as permissões.</div>';
    bindGlobalResults();
  });
  input.addEventListener('keydown', event=>{
    if(event.key === 'Escape') {
      input.value = '';
      const target = qs(`#${results}`);
      if(target) target.innerHTML = '';
      input.blur();
    }
  });
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

function nextPedidoId(){
  const max = (state.calls || []).reduce((highest,p)=>{
    const m = String(p.id || '').match(/^PED-(\d+)$/i);
    return Math.max(highest, m ? Number(m[1]) : 0);
  }, 0);
  return `PED-${String(max + 1).padStart(3,'0')}`;
}
function pedidoRefsFromLegacy(p){
  if(Array.isArray(p?.referenciasPedido)) return p.referenciasPedido.map(normalizePedidoRef);
  if(Array.isArray(p?.pecas)) return p.pecas.map(normalizePedidoRef);
  if(p?.referencia || p?.peca) return [normalizePedidoRef({ referencia:p.referencia || p.peca || '', quantidade:p.quantidade || 1 })];
  return [];
}
function normalizePedidoRef(ref={}){
  const fornecedor = String(ref.fornecedor || ref.supplier || '').trim();
  const codigoFornecedor = String(ref.codigoFornecedor || ref.supplierCode || '').trim();
  const referenciaFinal = String(ref.referencia || '').trim();
  const referenciaOriginal = String(ref.referenciaOriginal || ref.refOriginal || stripSupplierPrefix(referenciaFinal, codigoFornecedor)).trim();
  return {
    id: ref.id || uid('REF'),
    fornecedor,
    codigoFornecedor,
    referenciaOriginal,
    referencia: referenciaFinal || prefixReferenceWithSupplier(referenciaOriginal, codigoFornecedor),
    quantidade:Number(ref.quantidade || ref.qtd || 1) || 1
  };
}
function pedidoRefsRows(refs=[normalizePedidoRef({})]){
  const list = refs.length ? refs : [normalizePedidoRef({})];
  return `<div class="pedido-refs-editor">
    <div class="pedido-refs-head"><strong>Referências das peças</strong><button class="btn small ghost" id="addPedidoRefBtn" type="button">+ Adicionar referência</button></div>
    <datalist id="pedidoFornecedorList">${pedidoSupplierInputOptions()}</datalist>
    <div id="pedidoRefsRows">${list.map((ref,idx)=>pedidoRefRow(ref,idx)).join('')}</div>
    <div class="pedido-final-summary">
      <div class="pedido-final-box"><strong>Referência Final</strong><div id="pedidoFinalRefsList"></div></div>
      <div class="pedido-final-box"><strong>Quantidade</strong><div id="pedidoQuantidadesList"></div></div>
    </div>
  </div>`;
}
function pedidoRefRow(ref={}, idx=0){
  const normalized = normalizePedidoRef(ref);
  const supplierLabel = normalized.fornecedor ? (normalized.codigoFornecedor ? `${normalized.fornecedor} - ${normalized.codigoFornecedor}` : normalized.fornecedor) : '';
  return `<div class="pedido-ref-row fornecedor-por-linha" data-pedido-ref-row>
    <input class="field" name="pedidoFornecedor[]" list="pedidoFornecedorList" placeholder="Fornecedor" value="${esc(supplierLabel)}">
    <input class="field" name="pedidoReferenciaOriginal[]" placeholder="Referência ${idx+1}" value="${esc(normalized.referenciaOriginal || stripSupplierPrefix(normalized.referencia, normalized.codigoFornecedor))}" required>
    <input class="field" name="pedidoQuantidade[]" type="number" min="1" step="1" placeholder="Qtd." value="${esc(normalized.quantidade || 1)}" required>
    <button class="btn danger-soft small" type="button" data-remove-pedido-ref>×</button>
  </div>`;
}
function collectPedidoRefs(form){
  updateAllPedidoRefRows(form);
  const rows = [...form.querySelectorAll('[data-pedido-ref-row]')];
  return rows.map(row=>normalizePedidoRef(getPedidoRefRowData(row))).filter(r=>r.referencia);
}
function transportesList(){
  return uniqueSorted([...(state.settings?.transportes || []), ...(state.calls || []).map(p=>p.transporte).filter(Boolean)]);
}
function transporteOptions(){
  return transportesList().map(t=>`<option value="${esc(t)}"></option>`).join('');
}
function pedidoSupplierInputOptions(){
  return sortedSuppliers(state.suppliers || []).map(s=>{
    const name = supplierName(s);
    const code = supplierRef(s);
    const label = code ? `${name} - ${code}` : name;
    return `<option value="${esc(label)}"></option>`;
  }).join('');
}
function findPedidoSupplier(value){
  const raw = String(value || '').trim().toLowerCase();
  if(!raw) return null;
  const parts = raw.split(' - ').map(x=>x.trim());
  return (state.suppliers || []).find(s=>{
    const name = String(supplierName(s) || '').toLowerCase();
    const code = String(supplierRef(s) || '').toLowerCase();
    const label = code ? `${name} - ${code}` : name;
    return raw === name || raw === code || raw === label || parts.includes(name) || parts.includes(code) || name.includes(raw) || code.includes(raw);
  }) || null;
}
function parsePedidoSupplierValue(value){
  const raw = String(value || '').trim();
  const supplier = findPedidoSupplier(raw);
  if(supplier) return { fornecedor:supplierName(supplier), codigoFornecedor:String(supplierRef(supplier) || '').trim() };
  if(raw.includes(' - ')) {
    const parts = raw.split(' - ');
    return { fornecedor:parts.slice(0,-1).join(' - ').trim(), codigoFornecedor:parts.at(-1).trim() };
  }
  return { fornecedor:raw, codigoFornecedor:'' };
}
function stripSupplierPrefix(reference, code=''){
  const ref = String(reference || '').trim();
  const prefix = String(code || '').trim();
  if(prefix && ref.toLowerCase().startsWith(`${prefix.toLowerCase()}-`)) return ref.slice(prefix.length + 1).trim();
  return ref.replace(/^\s*[A-Za-z0-9]+-\s*/, '').trim();
}
function prefixReferenceWithSupplier(reference, code){
  const ref = String(reference || '').trim();
  const prefix = String(code || '').trim();
  if(!ref) return '';
  if(!prefix) return ref;
  if(ref.toLowerCase().startsWith(`${prefix.toLowerCase()}-`)) return ref;
  const cleanRef = stripSupplierPrefix(ref, prefix);
  return `${prefix}-${cleanRef}`;
}
function getPedidoRefRowData(row){
  const supplier = parsePedidoSupplierValue(row?.querySelector('[name="pedidoFornecedor[]"]')?.value || '');
  const raw = row?.querySelector('[name="pedidoReferenciaOriginal[]"]')?.value || '';
  const qtd = row?.querySelector('[name="pedidoQuantidade[]"]')?.value || 1;
  return {
    fornecedor:supplier.fornecedor,
    codigoFornecedor:supplier.codigoFornecedor,
    referenciaOriginal:raw,
    referencia:prefixReferenceWithSupplier(raw, supplier.codigoFornecedor),
    quantidade:Number(qtd || 1) || 1
  };
}
function updatePedidoRefRow(row){
  return getPedidoRefRowData(row);
}
function updatePedidoRefsSummary(form){
  const rows = [...(form?.querySelectorAll('[data-pedido-ref-row]') || [])];
  const data = rows.map(getPedidoRefRowData).filter(r=>r.referencia || r.referenciaOriginal);
  const refsBox = form?.querySelector('#pedidoFinalRefsList');
  const qtdBox = form?.querySelector('#pedidoQuantidadesList');
  if(refsBox) refsBox.innerHTML = data.length ? data.map(r=>`<div>${esc(r.referencia || '-')}</div>`).join('') : '<span class="muted">Sem referências.</span>';
  if(qtdBox) qtdBox.innerHTML = data.length ? data.map(r=>`<div>${esc(r.quantidade || 1)}</div>`).join('') : '<span class="muted">Sem quantidades.</span>';
}
function updateAllPedidoRefRows(form){
  updatePedidoRefsSummary(form);
}
function rememberTransporte(value){
  const v = String(value || '').trim();
  if(!v) return;
  state.settings = state.settings || {};
  state.settings.transportes = Array.isArray(state.settings.transportes) ? state.settings.transportes : [];
  if(!state.settings.transportes.some(t=>String(t).toLowerCase()===v.toLowerCase())) state.settings.transportes.push(v);
}
function pedidoClientSearchHtml(value=''){
  return `<input class="field span3" name="clienteSearch" id="pedidoClientSearch" list="pedidoClientList" placeholder="Escreve código ou nome do cliente" value="${esc(value)}" autocomplete="off" required>
    <datalist id="pedidoClientList">${quoteClientOptions()}</datalist>
    <input type="hidden" name="cliente" value="${esc(value)}">`;
}
function pedidoFormHtml(p=null){
  const refs = p ? pedidoRefsFromLegacy(p) : [normalizePedidoRef({})];
  const clientValue = p ? (p.codigoCliente ? `${p.codigoCliente} - ${p.cliente || ''}` : (p.cliente || '')) : '';
  return `<form id="pedidoForm" class="form-grid pedido-modal-form">
    ${pedidoClientSearchHtml(clientValue)}
    <input class="field" name="codigoCliente" placeholder="Código cliente" value="${esc(p?.codigoCliente || '')}">
    <input class="field" name="morada" placeholder="Morada (opcional)" value="${esc(p?.morada || '')}">
    <div class="span3">${pedidoRefsRows(refs)}</div>
    <input class="field span3" name="transporte" list="transportesList" placeholder="Transporte" value="${esc(p?.transporte || '')}">
    <datalist id="transportesList">${transporteOptions()}</datalist>
    <input class="field" name="data" type="date" value="${esc(p?.data || p?.createdAt || today())}" readonly>
    <input class="field" name="hora" type="time" value="${esc(p?.hora || p?.createdTime || currentTimeHM())}" readonly>
    <textarea class="span3" name="observacoes" placeholder="Observações">${esc(p?.observacoes || '')}</textarea>
    <div class="span3 actions">
      <button class="btn success" type="submit" data-pedido-submit="${esc(p?.estado || 'Pendente')}">${p ? 'Guardar pedido' : 'Guardar pedido'}</button>
      <button class="btn danger-soft" type="button" id="cancelPedidoBtn">Cancelar pedido</button>
    </div>
  </form>`;
}
function pedidos(){
  const rows = filterPedidos();
  const total = state.calls.length;
  const confirmados = state.calls.filter(p=>p.estado==='Confirmado').length;
  const cancelados = state.calls.filter(p=>p.estado==='Cancelado').length;
  return `<div class="pedidos-page clean-module-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Pedidos</span><h3>Pedidos de peças</h3></div>
        <div class="clean-stats"><span><b>${total}</b> pedidos</span><span><b>${confirmados}</b> confirmados</span><span><b>${cancelados}</b> cancelados</span></div>
      </div>
      <div class="quote-page-actions">
        ${canEditOperational()?`<button class="btn primary quote-new-btn" id="openNewPedidoBtn" type="button">+ Novo Pedido</button>`:''}
      </div>
      <div class="quote-filter-bar">
        <input id="searchPedidos" class="field" placeholder="Pesquisar cliente, código, referência, transporte...">
        <select id="filterEstado" class="select"><option value="">Todos os estados</option><option>Pendente</option><option>Confirmado</option><option>Cancelado</option></select>
      </div>
      <div id="pedidosTable">${pedidosCards(rows)}</div>
    </div>
  </div>`;
}
function filterPedidos(){
  const s = (qs('#searchPedidos')?.value || '').toLowerCase();
  const e = qs('#filterEstado')?.value || '';
  return (state.calls || []).filter(p => (!e || p.estado===e) && JSON.stringify(p).toLowerCase().includes(s));
}
function pedidoMainRef(p){
  const refs = pedidoRefsFromLegacy(p);
  if(!refs.length) return p.referencia || '-';
  return refs[0].referencia + (refs.length > 1 ? ` +${refs.length-1}` : '');
}
function pedidoCreatorName(p){
  const explicit = p?.createdByName || p?.userName || p?.operador || p?.createdByUser || '';
  if(explicit) return explicit;
  const email = p?.createdByEmail || p?.createdBy || p?.updatedBy || p?.history?.[0]?.by || '';
  if(email) {
    const user = (state.users || []).find(u => String(u.email || '').toLowerCase() === String(email).toLowerCase());
    return user?.nome || user?.name || String(email).split('@')[0];
  }
  return '';
}
function pedidosCards(rows){
  if(!rows.length) return '<div class="empty">Ainda não existem pedidos.</div>';
  return `<div class="clean-card-list pedido-card-list">${rows.map(p=>{
    const refs = pedidoRefsFromLegacy(p);
    const creator = pedidoCreatorName(p);
    const fornecedorResumo = uniqueSorted(refs.map(r=>r.codigoFornecedor ? `${r.fornecedor || '-'} (${r.codigoFornecedor})` : r.fornecedor).filter(Boolean)).join(' · ') || '-';
    return `<article class="clean-data-card pedido-data-card pedido-status-${normalizeText(p.estado || 'Pendente').replace(/[^a-z0-9]+/g,'-')}">
      <div class="card-user-highlight">${ICONS.users}<span>Pedido criado por</span><strong>${esc(creator || '-')}</strong></div>
      <div class="data-card-main">
        <span class="data-card-code big-visible-code">${esc(p.id)}</span>
        <strong class="card-primary-title">${esc(p.cliente || '-')}</strong>
        <small class="card-secondary-line">${esc([p.codigoCliente, p.morada].filter(Boolean).join(' · ') || 'Sem dados de cliente')}</small>
        <div class="card-info-grid pedido-info-grid">
          <span><b>Referências</b><em>${refs.length} · ${esc(pedidoMainRef(p))}</em></span>
          <span><b>Fornecedor</b><em>${esc(fornecedorResumo)}</em></span>
          <span><b>Transporte</b><em>${esc(p.transporte || '-')}</em></span>
          <span><b>Data/Hora</b><em>${esc(formatDatePt(p.createdAt || p.data || today()))} ${esc(p.createdTime || p.hora || '')}</em></span>
        </div>
      </div>
      <div class="quote-value-box">${badge(p.estado || 'Pendente')}</div>
      <div class="actions data-card-actions">
        <button class="btn small ghost" data-view-pedido="${p.id}">${ICONS.view}<span>Ver</span></button>
        ${canEditOperational()?`<button class="btn small ghost" data-edit-pedido="${p.id}">${ICONS.edit}<span>Editar</span></button>
        <button class="btn success small" data-confirm-pedido="${p.id}">Confirmar</button>
        <button class="btn warn small" data-cancel-pedido="${p.id}">Cancelar</button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-call="${p.id}">Apagar</button>`:''}
      </div>
    </article>`;
  }).join('')}</div>`;
}

function callsTable(rows, actions=true){
  if(!rows.length) return '<div class="empty">Ainda não existem registos.</div>';
  return pedidosCards(rows);
}

function badge(v){
  const map = {'Normal':'blue','Urgente':'orange','Muito urgente':'red','Novo':'blue','Em pesquisa':'orange','Orçamento enviado':'violet','Confirmado':'green','Cancelado':'red','Concluído':'green','Perdido':'red','Pendente':'orange','Feito':'green','Ativo':'green','Inativo':'red','Rascunho':'blue','Cliente':'green','Fornecedor':'violet','Enviado':'green','Aceite':'green','Recusado':'red','Operador':'blue','Supervisor':'violet','Admin':'orange','Admin Master':'green'};
  return `<span class="badge ${map[v]||''}">${esc(v||'-')}</span>`;
}

function normalizeClientContacts(c){
  const emails = Array.isArray(c?.emails) ? c.emails : (c?.email ? [c.email] : []);
  const telefones = Array.isArray(c?.telefones) ? c.telefones : (c?.telefone ? [c.telefone] : []);
  return {
    emails:[...new Set(emails.map(v=>String(v || '').trim()).filter(Boolean))],
    telefones:[...new Set(telefones.map(v=>String(v || '').trim()).filter(Boolean))]
  };
}
function clientPrimaryEmail(c){ return normalizeClientContacts(c).emails[0] || c.email || ''; }
function clientPrimaryPhone(c){ return normalizeClientContacts(c).telefones[0] || c.telefone || ''; }
function clientEmailsLabel(c){
  const emails = normalizeClientContacts(c).emails;
  if(!emails.length) return '<small>Sem email</small>';
  return emails.map((email,idx)=>`<small>Email ${idx+1}: ${esc(email)}</small>`).join('');
}
function clientPhonesLabel(c){
  const phones = normalizeClientContacts(c).telefones;
  if(!phones.length) return '<span>☎ Sem telefone</span>';
  return phones.map((phone,idx)=>`<span>☎ Telefone ${idx+1}: ${esc(phone)}</span>`).join('');
}
function clientContactRows(values=[], type='email'){
  const rows = values.length ? values : [''];
  const label = type === 'email' ? 'Email' : 'Telefone';
  const name = type === 'email' ? 'clientEmail[]' : 'clientTelefone[]';
  const inputType = type === 'email' ? 'email' : 'tel';
  return `<div class="client-multi-field" data-client-multi="${type}">
    <div class="client-multi-head"><strong>${label}s</strong><button class="btn small ghost" type="button" data-add-client-contact="${type}">+ ${label}</button></div>
    <div class="client-multi-rows">
      ${rows.map((v,idx)=>`<div class="client-contact-row" data-client-contact-row>
        <input class="field" type="${inputType}" name="${name}" placeholder="${label} ${idx+1}" value="${esc(v)}">
        <button class="btn danger-soft small" type="button" data-remove-client-contact>×</button>
      </div>`).join('')}
    </div>
  </div>`;
}
function collectClientContacts(form){
  const emails = [...form.querySelectorAll('[name="clientEmail[]"]')].map(i=>i.value.trim()).filter(Boolean);
  const telefones = [...form.querySelectorAll('[name="clientTelefone[]"]')].map(i=>i.value.trim()).filter(Boolean);
  return { emails:[...new Set(emails)], telefones:[...new Set(telefones)], email:emails[0] || '', telefone:telefones[0] || '' };
}
function bindClientMultiContacts(scope=document){
  const root = scope && scope.querySelector ? scope : document;
  root.querySelectorAll('[data-add-client-contact]').forEach(btn=>{
    if(btn.dataset.boundClientAdd) return;
    btn.dataset.boundClientAdd = '1';
    btn.addEventListener('click',()=>{
      const type = btn.dataset.addClientContact;
      const box = btn.closest('[data-client-multi]');
      const rows = box?.querySelector('.client-multi-rows');
      const count = rows?.querySelectorAll('[data-client-contact-row]').length || 0;
      const label = type === 'email' ? 'Email' : 'Telefone';
      const name = type === 'email' ? 'clientEmail[]' : 'clientTelefone[]';
      const inputType = type === 'email' ? 'email' : 'tel';
      rows?.insertAdjacentHTML('beforeend', `<div class="client-contact-row" data-client-contact-row>
        <input class="field" type="${inputType}" name="${name}" placeholder="${label} ${count+1}">
        <button class="btn danger-soft small" type="button" data-remove-client-contact>×</button>
      </div>`);
      bindClientMultiContacts(root);
    });
  });
  root.querySelectorAll('[data-remove-client-contact]').forEach(btn=>{
    if(btn.dataset.boundClientRemove) return;
    btn.dataset.boundClientRemove = '1';
    btn.addEventListener('click',()=>{
      const box = btn.closest('[data-client-multi]');
      const rows = box?.querySelectorAll('[data-client-contact-row]') || [];
      if(rows.length <= 1) {
        const input = btn.closest('[data-client-contact-row]')?.querySelector('input');
        if(input) input.value = '';
        return;
      }
      btn.closest('[data-client-contact-row]')?.remove();
    });
  });
}
function clientFormHtml(c={}){
  const contacts = normalizeClientContacts(c);
  return `<input class="field" name="codigoCliente" placeholder="Código cliente" value="${esc(c.codigoCliente || '')}" required>
    <input class="field" name="nome" placeholder="Nome do cliente" value="${esc(c.nome || '')}" required>
    <div class="span3">${clientContactRows(contacts.telefones,'telefone')}</div>
    <div class="span3">${clientContactRows(contacts.emails,'email')}</div>
    <input class="field" name="morada" placeholder="Morada" value="${esc(c.morada || '')}">
    <input class="field" name="codigoPostal" placeholder="Código postal" value="${esc(c.codigoPostal || '')}">
    <textarea name="notas" placeholder="Notas internas">${esc(c.notas || '')}</textarea>`;
}

function clientes(){
  const canEdit = canEditOperational();
  const total = state.clients.length;
  const withEmail = state.clients.filter(c=>normalizeClientContacts(c).emails.length).length;
  const withPhone = state.clients.filter(c=>normalizeClientContacts(c).telefones.length).length;
  return `<div class="grid single-list clients-page clean-module-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Clientes</span><h3>Base de clientes</h3></div>
        <div class="clean-stats"><span><b>${total}</b> total</span><span><b>${withEmail}</b> email</span><span><b>${withPhone}</b> telefone</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions"><button class="btn primary quote-new-btn" type="button" data-create-entity="client">+ Adicionar registo</button></div>` : '<div class="readonly-note">Modo leitura: podes consultar dados e enviar emails, mas não podes adicionar nem editar clientes.</div>'}
      <div class="clean-search-row clean-search-tools"><input id="clientSearch" class="field" type="search" autocomplete="off" placeholder="Pesquisar cliente, código, telefone, email, morada ou código postal" aria-label="Pesquisar clientes"><button id="clearClientSearch" class="btn ghost search-clear-btn" type="button" disabled aria-label="Limpar pesquisa de clientes">Limpar</button><span id="clientSearchCount" class="search-result-count" aria-live="polite">${total} clientes</span></div>
      <div id="clientsTable">${clientsTable(state.clients)}</div>
    </div>
  </div>`;
}

function fornecedores(){
  const canEdit = canEditOperational();
  const rows = sortedSuppliers(state.suppliers);
  return `<div class="grid single-list suppliers-page clean-module-page">
    <div class="card supplier-list-card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Fornecedores</span><h3>Lista A-Z</h3></div>
        <div class="clean-stats"><span><b>${rows.length}</b> registos</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions supplier-page-actions"><button class="btn primary quote-new-btn" type="button" data-create-entity="supplier">+ Adicionar registo</button><button class="btn ghost quote-new-btn" type="button" id="supplierBackTopBtn">↑ Topo</button></div>` : '<div class="readonly-note">Modo leitura: podes consultar os fornecedores, sem adicionar nem editar.</div>'}
      <div class="clean-search-row"><input id="supplierSearch" class="field" placeholder="Pesquisar por fornecedor ou código de ficha"></div>
      <div id="suppliersTable">${suppliersTable(rows)}</div>
    </div>
  </div>`;
}

function referencias(){
  const rows = [...(state.references || [])];
  const canEdit = canEditOperational();
  return `<div class="grid single-list clean-module-page references-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Base da empresa</span><h3>Referências</h3><p class="muted">Base central de referências, famílias, marcas e descrições. Pesquisa referências e edita várias descrições diretamente numa grelha.</p></div>
        <div class="clean-stats"><span><b id="referencesTotal">—</b> resultados</span><span><b id="referencesFamilies">—</b> famílias nos resultados</span></div>
      </div>
      <div class="reference-toolbar">
        <input id="referenceSearch" class="field" type="search" autocomplete="off" placeholder="Pesquisar por início da referência, família, marca ou descrição…" aria-label="Pesquisar referências">
        <button class="btn primary" id="referenceSearchBtn" type="button">Pesquisar</button>
        ${canEdit ? '<button class="btn" type="button" id="referenceQuickEditBtn">Editar descrições em grelha</button><button class="btn" type="button" data-create-entity="reference">+ Adicionar referência</button>' : '<span class="readonly-note">Modo leitura</span>'}
      </div>
      <p class="muted reference-search-help">A lista é carregada em páginas de 100 registos. A pesquisa por referência, família, marca ou descrição continua disponível e só é executada quando carregas em Pesquisar.</p>
      <div id="referencesTable"><div class="empty">A carregar a primeira página de referências…</div></div>
      <div class="reference-pagination" id="referencesPagination" hidden><span id="referencesPageInfo">Página 1</span><nav class="reference-page-nav" id="referencesPageNav" aria-label="Páginas de referências"><button class="btn ghost reference-page-edge" id="referencesFirstBtn" type="button">Início</button><button class="btn ghost reference-page-arrow" id="referencesPrevBtn" type="button" aria-label="Página anterior" disabled>‹</button><div id="referencesPageNumbers" class="reference-page-numbers"></div><button class="btn ghost reference-page-arrow" id="referencesNextBtn" type="button" aria-label="Página seguinte">›</button><button class="btn ghost reference-page-edge" id="referencesLastBtn" type="button">Fim</button></nav></div>
    </div>
  </div>`;
}
function referencesTable(rows){
  if(!rows.length) return '<div class="empty">Sem resultados para esta pesquisa.</div>';
  return `<div class="table-wrap"><table class="references-table"><thead><tr><th>Referência</th><th>Família</th><th>Marca</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>{const familyReference=`${String(r.familia||'').trim()}-${String(r.referencia||'').trim()}`;return `<tr><td><strong>${esc(r.referencia||'-')}</strong></td><td>${esc(r.familia||'-')}</td><td>${esc(r.marca||'-')}</td><td>${esc(r.descricao||'-')}</td><td><div class="actions"><button class="btn small" type="button" data-copy-family-reference="${esc(familyReference)}" title="Copiar família-referência">${ICONS.copy||'⧉'} Copiar</button>${canEditOperational('referencias')?`<button class="btn small" data-edit-entity="reference:${esc(r.id)}">Editar</button>`:'<span class="muted">Consulta</span>'}${canDelete('referencias')?`<button class="btn danger small" data-delete-entity="reference:${esc(r.id)}">Apagar</button>`:''}</div></td></tr>`}).join('')}</tbody></table></div>`;
}
function referenceSearchFields(row){
  return {
    referenciaNorm: normalizeSearchText(row.referencia || ''),
    familiaNorm: normalizeSearchText(row.familia || ''),
    marcaNorm: normalizeSearchText(row.marca || ''),
    descricaoNorm: normalizeSearchText(row.descricao || '')
  };
}
async function searchCompanyReferences(query){
  const q = normalizeSearchText(query);
  if(!firebaseReady || !firebaseDb) {
    const rows=(state.references||[]).filter(r=>['referencia','familia','marca','descricao'].some(k=>normalizeSearchText(r[k]).includes(q))).slice(0,80);
    return rows;
  }
  if(q.length < 2) throw new Error('Escreve pelo menos 2 caracteres para pesquisar.');
  // Percorre todos os resultados de prefixo de cada campo em blocos de 100.
  // A versão anterior usava limit(20) e slice(0,80), cortando silenciosamente resultados como LPR.
  const fields=['referenciaNorm','familiaNorm','marcaNorm','descricaoNorm'];
  const found = new Map();
  const BATCH_SIZE = 100;
  for(const field of fields){
    let cursor = null;
    while(true){
      let query = firebaseDb.collection(FIREBASE_COLLECTIONS.references)
        .orderBy(field).startAt(q).endAt(q+'\uf8ff').limit(BATCH_SIZE);
      if(cursor) query = query.startAfter(cursor);
      const snap = await query.get();
      snap.docs.forEach(doc=>found.set(doc.id,cleanFirebaseDoc({id:doc.id,...doc.data()})));
      if(snap.docs.length < BATCH_SIZE) break;
      cursor = snap.docs[snap.docs.length-1];
    }
  }
  const rows=[...found.values()];
  rows.sort((a,b)=>String(a.referencia||'').localeCompare(String(b.referencia||''),'pt',{numeric:true,sensitivity:'base'}));
  return rows;
}
function referencesQuickEditor(rows){
  if(!rows.length) return '<div class="empty">Não há referências para editar nesta página.</div>';
  return `<div class="reference-quick-editor"><div class="reference-quick-editor-head"><div><strong>Editor rápido de descrições</strong><p class="muted">Altera várias células e guarda tudo de uma vez. Só são gravadas as descrições que modificares.</p></div><div class="actions"><button class="btn ghost" type="button" id="referenceQuickCancel">Cancelar</button><button class="btn primary" type="button" id="referenceQuickSave">Guardar alterações</button></div></div><div class="table-wrap"><table class="references-table reference-edit-grid"><thead><tr><th>Referência</th><th>Família</th><th>Marca</th><th>Descrição atual</th><th>Nova descrição</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.referencia||'-')}</strong></td><td>${esc(r.familia||'-')}</td><td>${esc(r.marca||'-')}</td><td class="reference-old-description">${esc(r.descricao||'')}</td><td><input class="field reference-description-edit" data-reference-description="${esc(r.id)}" data-original-description="${esc(r.descricao||'')}" value="${esc(r.descricao||'')}" aria-label="Nova descrição para ${esc(r.referencia||'referência')}"></td></tr>`).join('')}</tbody></table></div><p class="muted">Dica: podes copiar uma coluna de descrições do Excel e colar célula a célula nesta grelha.</p></div>`;
}
async function bindReferencesPage(){
  const input=qs('#referenceSearch');
  const table=qs('#referencesTable');
  const pagination=qs('#referencesPagination');
  const pageInfo=qs('#referencesPageInfo');
  const prevBtn=qs('#referencesPrevBtn');
  const nextBtn=qs('#referencesNextBtn');
  const firstBtn=qs('#referencesFirstBtn');
  const lastBtn=qs('#referencesLastBtn');
  const pageNumbers=qs('#referencesPageNumbers');
  const PAGE_SIZE=100;
  let cursorStack=[null];
  let pageHasNext={};
  let currentCursor=null;
  let currentPageNumber=1;
  let mode='list';

  // Listener delegado: continua funcional depois de cada mudança de página/pesquisa.
  table?.addEventListener('click',event=>{
    const button=event.target.closest('[data-copy-family-reference]');
    if(!button) return;
    copyText(button.dataset.copyFamilyReference || '');
  });
  let quickEditMode=false;
  const renderCurrentRows=()=>{ if(table) table.innerHTML=quickEditMode?referencesQuickEditor(state.references||[]):referencesTable(state.references||[]); };
  // Guardar a descrição da célula atual ao carregar Enter, sem obrigar a sair da grelha.
  const saveQuickDescription=async field=>{
    if(!field || field.dataset.saving==='true') return false;
    const id=field.dataset.referenceDescription;
    const original=field.dataset.originalDescription||'';
    const descricao=field.value.trim();
    if(descricao===original){field.value=original;return true;}
    if(!firebaseReady||!firebaseDb){toast('Firebase não está disponível. A descrição não foi guardada.');return false;}
    if(!canEditOperational('referencias')){toast('Sem permissão para editar referências.');return false;}
    field.dataset.saving='true';
    field.disabled=true;
    try{
      await firebaseDb.collection(FIREBASE_COLLECTIONS.references).doc(id).update({descricao,descricaoNorm:normalizeSearchText(descricao),updatedAt:new Date().toISOString()});
      state.references=(state.references||[]).map(r=>r.id===id?{...r,descricao,descricaoNorm:normalizeSearchText(descricao),updatedAt:new Date().toISOString()}:r);
      field.dataset.originalDescription=descricao;
      const oldCell=field.closest('tr')?.querySelector('.reference-old-description');
      if(oldCell) oldCell.textContent=descricao;
      toast('Descrição guardada.');
      return true;
    }catch(err){
      console.error('Quick reference description save failed',err);
      toast('Não foi possível guardar a descrição. Verifica a ligação e as permissões do Firestore.');
      return false;
    }finally{
      field.disabled=false;
      delete field.dataset.saving;
    }
  };
  table?.addEventListener('keydown',async event=>{
    const field=event.target.closest('[data-reference-description]');
    if(!field || event.key!=='Enter') return;
    event.preventDefault();
    event.stopPropagation();
    const saved=await saveQuickDescription(field);
    if(saved){
      const fields=[...table.querySelectorAll('[data-reference-description]')];
      const next=fields[fields.indexOf(field)+1];
      if(next){next.focus();next.select();}
    }
  });
  qs('#referenceQuickEditBtn')?.addEventListener('click',()=>{ if(!canEditOperational('referencias')) return toast('Sem permissão para editar referências.'); quickEditMode=!quickEditMode; const b=qs('#referenceQuickEditBtn'); if(b)b.textContent=quickEditMode?'Voltar à lista':'Editar descrições em grelha'; renderCurrentRows(); });
  table?.addEventListener('click',async event=>{
    if(event.target.closest('#referenceQuickCancel')){quickEditMode=false;const b=qs('#referenceQuickEditBtn');if(b)b.textContent='Editar descrições em grelha';renderCurrentRows();return;}
    if(!event.target.closest('#referenceQuickSave')) return;
    const inputs=[...table.querySelectorAll('[data-reference-description]')];
    const edits=inputs.map(input=>({id:input.dataset.referenceDescription,original:input.dataset.originalDescription||'',descricao:input.value.trim()})).filter(x=>x.descricao!==x.original);
    if(!edits.length){toast('Não há alterações para guardar.');return;}
    if(!firebaseReady||!firebaseDb){toast('Firebase não está disponível. As alterações não foram guardadas.');return;}
    const save=event.target.closest('#referenceQuickSave');save.disabled=true;save.textContent='A guardar…';
    try{
      const batch=firebaseDb.batch();
      edits.forEach(item=>batch.update(firebaseDb.collection(FIREBASE_COLLECTIONS.references).doc(item.id),{descricao:item.descricao,descricaoNorm:normalizeSearchText(item.descricao),updatedAt:new Date().toISOString()}));
      await batch.commit();
      const byId=new Map(edits.map(x=>[x.id,x.descricao]));
      state.references=(state.references||[]).map(r=>byId.has(r.id)?{...r,descricao:byId.get(r.id),descricaoNorm:normalizeSearchText(byId.get(r.id))}:r);
      toast(`${edits.length} descrição(ões) guardada(s).`);quickEditMode=false;const b=qs('#referenceQuickEditBtn');if(b)b.textContent='Editar descrições em grelha';renderCurrentRows();
    }catch(err){console.error('Bulk reference description save failed',err);toast('Não foi possível guardar. Verifica as permissões do Firestore.');}
    finally{const current=qs('#referenceQuickSave');if(current){current.disabled=false;current.textContent='Guardar alterações';}}
  });

  const updateStats=(rows,totalLabel)=>{
    const total=qs('#referencesTotal'); if(total)total.textContent=totalLabel;
    const fam=qs('#referencesFamilies'); if(fam)fam.textContent=new Set(rows.map(r=>String(r.familia||'').trim()).filter(Boolean)).size.toLocaleString('pt-PT');
  };
  const loadListPage=async(direction='current')=>{
    if(!firebaseReady || !firebaseDb){ if(table)table.innerHTML='<div class="empty">Liga a Firebase para consultar a base completa de referências.</div>'; if(pagination)pagination.hidden=true; return; }
    const btn=direction==='next'?nextBtn:prevBtn;
    if(btn)btn.disabled=true;
    if(table)table.innerHTML='<div class="empty">A carregar referências…</div>';
    try{
      if(direction==='next'){
        if(!pageHasNext[currentPageNumber]) return;
        cursorStack[currentPageNumber]=currentCursor;
        currentPageNumber++;
      }else if(direction==='prev'){
        currentPageNumber=Math.max(1,currentPageNumber-1);
      }else if(typeof direction==='number'){
        currentPageNumber=direction;
      }else{
        currentPageNumber=1;
        cursorStack=[null];
        pageHasNext={};
      }
      const startCursor=cursorStack[currentPageNumber-1]||null;
      if(currentPageNumber>1 && !startCursor){
        // Só permite navegar para páginas cujo cursor já foi obtido, evitando leituras extra via offset.
        currentPageNumber=Math.max(1,currentPageNumber-1);
        return;
      }
      let query=firebaseDb.collection(FIREBASE_COLLECTIONS.references).orderBy('referenciaNorm').limit(PAGE_SIZE);
      if(startCursor)query=query.startAfter(startCursor);
      const snap=await query.get();
      const rows=snap.docs.map(doc=>cleanFirebaseDoc({id:doc.id,...doc.data()}));
      currentCursor=snap.docs.length?snap.docs[snap.docs.length-1]:startCursor;
      pageHasNext[currentPageNumber]=rows.length===PAGE_SIZE;
      state.references=rows;
      if(table)table.innerHTML=referencesTable(rows);
      updateStats(rows,rows.length.toLocaleString('pt-PT'));
      if(pagination)pagination.hidden=false;
      if(pageInfo)pageInfo.textContent=`Página ${currentPageNumber} · ${rows.length} registos nesta página`;
      if(prevBtn)prevBtn.disabled=currentPageNumber<=1;
      if(nextBtn)nextBtn.disabled=rows.length<PAGE_SIZE;
      if(firstBtn)firstBtn.disabled=currentPageNumber<=1;
      if(lastBtn)lastBtn.disabled=rows.length<PAGE_SIZE;
      if(pageNumbers){
        const first=Math.max(1,currentPageNumber-2);
        const last=currentPageNumber+2;
        let html='';
        for(let n=first;n<=last;n++){
          const known=n===1 || !!cursorStack[n-1];
          if(!known && n>currentPageNumber+1) continue;
          html+=`<button class="btn ${n===currentPageNumber?'primary':'ghost'} reference-page-number" type="button" data-reference-page="${n}" ${n===currentPageNumber?'aria-current="page"':''} ${known?'':'disabled'}>${n}</button>`;
        }
        pageNumbers.innerHTML=html;
        pageNumbers.querySelectorAll('[data-reference-page]').forEach(b=>b.addEventListener('click',()=>loadListPage(Number(b.dataset.referencePage))));
      }
      bindEntities();
    }catch(err){
      console.error('References page load failed',err);
      if(table)table.innerHTML=`<div class="empty">Não foi possível carregar a lista. ${esc(err.message||'Verifica as permissões do Firestore.')}</div>`;
      if(pagination)pagination.hidden=true;
    }finally{if(btn)btn.disabled=false;}
  };
  const loadLastPage=async()=>{
    if(!firebaseReady || !firebaseDb) return;
    if(lastBtn)lastBtn.disabled=true;
    if(table)table.innerHTML='<div class="empty">A carregar o fim da lista…</div>';
    try{
      const snap=await firebaseDb.collection(FIREBASE_COLLECTIONS.references).orderBy('referenciaNorm','desc').limit(PAGE_SIZE).get();
      const rows=snap.docs.map(doc=>cleanFirebaseDoc({id:doc.id,...doc.data()})).reverse();
      state.references=rows;
      if(table)table.innerHTML=referencesTable(rows);
      updateStats(rows,rows.length.toLocaleString('pt-PT'));
      currentPageNumber=null; cursorStack=[null]; pageHasNext={}; currentCursor=null;
      if(pageInfo)pageInfo.textContent=`Fim da lista · ${rows.length} registos`;
      if(prevBtn)prevBtn.disabled=true; if(nextBtn)nextBtn.disabled=true;
      if(firstBtn)firstBtn.disabled=false; if(lastBtn)lastBtn.disabled=true;
      if(pageNumbers)pageNumbers.innerHTML='';
      bindEntities();
    }catch(err){
      console.error('Could not load last references page',err);
      if(table)table.innerHTML=`<div class="empty">Não foi possível carregar o fim da lista. ${esc(err.message||'Verifica as permissões do Firestore.')}</div>`;
    }finally{if(lastBtn)lastBtn.disabled=false;}
  };
  firstBtn?.addEventListener('click',()=>loadListPage('first'));
  lastBtn?.addEventListener('click',loadLastPage);
  const runSearch=async()=>{
    const q=input?.value.trim()||'';
    if(q.length<2){toast('Escreve pelo menos 2 caracteres para pesquisar.');return;}
    mode='search'; if(pagination)pagination.hidden=true;
    const btn=qs('#referenceSearchBtn');if(btn)btn.disabled=true;
    if(table)table.innerHTML='<div class="empty">A pesquisar…</div>';
    try{
      const rows=await searchCompanyReferences(q);state.references=rows;
      if(table)table.innerHTML=referencesTable(rows);
      updateStats(rows,rows.length.toLocaleString('pt-PT'));
      bindEntities();
    }catch(err){if(table)table.innerHTML=`<div class="empty">${esc(err.message||'Erro na pesquisa.')}</div>`;}
    finally{if(btn)btn.disabled=false;}
  };
  qs('#referenceSearchBtn')?.addEventListener('click',runSearch);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch();}});
  input?.addEventListener('input',()=>{if(!input.value.trim() && mode==='search'){mode='list';loadListPage('current');}});
  prevBtn?.addEventListener('click',()=>loadListPage('prev'));
  nextBtn?.addEventListener('click',()=>loadListPage('next'));
  await loadListPage('current');
}
function referenceFormHtml(item={}){
  return `<form id="entityCreateForm" data-create-type="reference" class="form-grid modal-grid-form">
    <input class="field" name="referencia" placeholder="Referência" value="${esc(item.referencia||'')}" required>
    <input class="field" name="familia" placeholder="Família" value="${esc(item.familia||'')}" required>
    <input class="field" name="marca" placeholder="Marca" value="${esc(item.marca||'')}" required>
    <textarea class="span3" name="descricao" placeholder="Descrição" required>${esc(item.descricao||'')}</textarea>
    <div class="span3"><button class="btn primary" type="submit">Guardar referência</button></div>
  </form>`;
}

function contactos(){
  const warehouses = uniqueWarehouses();
  const sections = uniqueSections();
  const canEdit = canEditOperational();
  const totalContacts = contactCount();
  return `<div class="grid single-list contacts-page directory-clean-page clean-module-page">
    <div class="card directory-main-card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Diretório</span><h3>Armazéns e secções</h3></div>
        <div class="clean-stats"><span><b>${warehouses.length}</b> armazéns</span><span><b>${sections.length}</b> secções</span><span><b>${totalContacts}</b> contactos</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions"><button class="btn primary quote-new-btn" type="button" id="openQuickContactBtn">+ Adicionar registo</button></div>` : '<div class="readonly-note">Modo leitura: podes consultar contactos, ligar ou enviar email, mas não podes adicionar nem editar.</div>'}
      <div class="clean-search-row clean-search-tools"><input id="contactSearch" class="field" type="search" autocomplete="off" placeholder="Pesquisar armazém, secção, nome, telefone ou email" aria-label="Pesquisar diretório de contactos"><button id="clearContactSearch" class="btn ghost search-clear-btn" type="button" disabled aria-label="Limpar pesquisa de contactos">Limpar</button><span id="contactSearchCount" class="search-result-count" aria-live="polite">${totalContacts} contactos</span></div>
      <div id="contactsTable">${contactGroupsView(filterContactGroups())}</div>
    </div>
  </div>`;
}

function normalizeContactDirectory(){
  state.contactGroups = (state.contactGroups || []).map(group => {
    const seccao = group.seccao || group.nome || 'Geral';
    const armazem = group.armazem || group.local || group.empresa || 'Geral';
    // Por defeito, ao carregar/resetar a app, todas as secções ficam colapsadas.
    // O estado aberto só vive durante a sessão atual depois de clicares.
    const runtimeOpen = window.__directoryOpenState && Object.prototype.hasOwnProperty.call(window.__directoryOpenState, group.id)
      ? window.__directoryOpenState[group.id]
      : false;
    return { ...group, armazem, seccao, nome: seccao, aberto: runtimeOpen, contactos: group.contactos || [] };
  });
}
function setDirectoryRuntimeOpen(groupId, open){
  window.__directoryOpenState = window.__directoryOpenState || {};
  window.__directoryOpenState[groupId] = !!open;
}
function setAllDirectoryRuntimeOpen(open){
  window.__directoryOpenState = window.__directoryOpenState || {};
  (state.contactGroups || []).forEach(g=>{ if(g.id) window.__directoryOpenState[g.id] = !!open; g.aberto = !!open; });
}
function allDirectoryGroupsOpen(){
  const groups = state.contactGroups || [];
  return groups.length > 0 && groups.every(g => !!g.aberto);
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
  const q = normalizeSearchText(qs('#contactSearch')?.value || '');
  const groups = state.contactGroups || [];
  if(!q) return groups;
  return groups.map(group => {
    const fullGroup = normalizeSearchText(`${contactWarehouse(group)} ${contactSection(group)}`);
    const groupMatch = fullGroup.includes(q);
    const contactos = (group.contactos || []).filter(c => normalizeSearchText(`${fullGroup} ${c.nome || ''} ${c.telemovel || ''} ${c.telefone || ''} ${c.email || ''} ${c.extensao || ''} ${c.local || ''}`).includes(q));
    return groupMatch ? { ...group, aberto:true } : { ...group, aberto:true, contactos };
  }).filter(group => (group.contactos || []).length || normalizeSearchText(`${contactWarehouse(group)} ${contactSection(group)}`).includes(q));
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
  if(!groups.length){
    const q = (qs('#contactSearch')?.value || '').trim();
    return q ? `<div class="empty search-empty-state">Não foram encontrados contactos para <strong>“${esc(q)}”</strong>. <button class="btn ghost small" type="button" data-clear-contact-search>Limpar pesquisa</button></div>` : '<div class="empty">Ainda não existem contactos neste diretório.</div>';
  }
  const grouped = groupedByWarehouse(groups);
  const warehouses = orderedWarehouses(Object.keys(grouped));
  const q = (qs('#contactSearch')?.value || '').trim();
  const isAllOpen = allDirectoryGroupsOpen();
  return `<div class="directory-control-bar">
    <button class="btn primary directory-toggle-all-btn" id="toggleAllDirectoryBtn" type="button">${isAllOpen ? 'Fechar Tudo' : 'Abrir Tudo'}</button>
    <span>${groups.length} secção(ões) no diretório</span>
  </div>
  <div class="directory-simple-view">${warehouses.map(armazem => {
    const sections = grouped[armazem].sort((a,b)=>contactSection(a).localeCompare(contactSection(b),'pt'));
    const total = sections.reduce((sum,g)=>sum + (g.contactos || []).length, 0);
    return `<section class="warehouse-simple-card">
      <div class="warehouse-simple-head" data-toggle-warehouse="${esc(armazem)}" role="button" tabindex="0" title="Abrir/fechar secções deste armazém">
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
          const opened = q ? true : !!group.aberto;
          return `<button class="section-chip ${opened ? 'active' : ''}" type="button" data-toggle-contact-group="${group.id}">
            <span>${esc(contactSection(group))}</span>
            <b>${(group.contactos || []).length}</b>
          </button>`;
        }).join('')}
      </div>

      <div class="section-content-list">
        ${sections.map(group => contactSectionView(group, q ? true : false)).join('')}
      </div>
    </section>`;
  }).join('')}</div>`;
}
function contactSectionView(group, forceOpen=false){
  const rows = group.contactos || [];
  const opened = forceOpen || group.aberto;
  return `<div class="directory-section-simple ${opened ? '' : 'hidden'}" data-contact-section-panel="${group.id}">
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
  const q = normalizeSearchText(qs('#clientSearch')?.value || '');
  return state.clients.filter(c => normalizeSearchText(`${clientCode(c)} ${c.nome || ''} ${(normalizeClientContacts(c).telefones||[]).join(' ')} ${(normalizeClientContacts(c).emails||[]).join(' ')} ${c.morada || ''} ${c.codigoPostal || ''}`).includes(q));
}
function clientsTable(rows){
  if(!rows.length){
    const q = (qs('#clientSearch')?.value || '').trim();
    return q ? `<div class="empty search-empty-state">Não foram encontrados clientes para <strong>“${esc(q)}”</strong>. <button class="btn ghost small" type="button" data-clear-client-search>Limpar pesquisa</button></div>` : '<div class="empty">Ainda não existem clientes registados.</div>';
  }
  return `<div class="clean-card-list client-card-list">${rows.map(c=>`
    <article class="clean-data-card client-data-card code-centered-card">
      <div class="data-card-main client-name-box">
        <strong>${esc(c.nome || '-')}</strong>
        ${clientEmailsLabel(c)}
        <small>${esc([c.morada, c.codigoPostal].filter(Boolean).join(' · ') || 'Sem morada')}</small>
      </div>
      <div class="card-code-center client-code-box">
        <span class="data-card-code big-visible-code">${esc(clientCode(c) || 'Sem código')}</span>
      </div>
      <div class="data-card-meta client-phone-box">
        ${clientPhonesLabel(c)}
      </div>
      <div class="actions data-card-actions">
        <button class="btn small" data-client-detail="${c.id}">Ficha</button>
        ${clientPrimaryEmail(c) ? `<button class="btn success small" data-client-email="${c.id}">Email</button>` : ''}
        ${canEditOperational()?`<button class="btn small" data-edit-entity="client:${c.id}">Editar</button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-entity="client:${c.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}
function openClientDetail(id){
  const c = state.clients.find(x=>x.id===id); if(!c) return;
  const phones = normalizeClientContacts(c).telefones;
  const emails = normalizeClientContacts(c).emails;
  const quotes = state.quotes.filter(x => x.cliente?.toLowerCase() === c.nome?.toLowerCase() || (x.email && emails.includes(x.email)));
  const totalQuoted = quotes.reduce((sum,q)=>sum + Number(q.total || quoteItemsTotal(quoteItemsFromLegacy(q)) || 0), 0);
  const lastQuote = [...quotes].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];
  openModal(`Ficha cliente · ${esc(c.nome)}`, `
    <div class="client-detail client-detail-upgraded">
      <div class="detail-grid">
        <div><span>Código</span><strong>${esc(clientCode(c) || '-')}</strong></div>
        <div><span>Nome</span><strong>${esc(c.nome || '-')}</strong></div>
        <div><span>Telefones</span><strong>${esc(phones.map((p,i)=>`Telefone ${i+1}: ${p}`).join(' · ') || '-')}</strong></div>
        <div><span>Emails</span><strong>${esc(emails.map((e,i)=>`Email ${i+1}: ${e}`).join(' · ') || '-')}</strong></div>
        <div><span>Morada</span><strong>${esc(c.morada || '-')}</strong></div>
        <div><span>Código postal</span><strong>${esc(c.codigoPostal || '-')}</strong></div>
        <div><span>Orçamentos</span><strong>${quotes.length}</strong></div>
        <div><span>Total orçamentado</span><strong>${money(totalQuoted)}</strong></div>
        <div><span>Último orçamento</span><strong>${lastQuote ? `${esc(lastQuote.id)} · ${esc(formatDatePt(lastQuote.createdAt))} · ${money(lastQuote.total)}` : '-'}</strong></div>
      </div>
      <div class="actions">${clientPrimaryEmail(c) ? `<button class="btn success" data-client-email="${c.id}">Enviar email ao cliente</button>` : '<span class="muted">Cliente sem email registado.</span>'}</div>
      <h4>Orçamentos</h4>
      ${quotes.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Viatura</th><th>Criado por</th><th>Total</th><th>Estado</th></tr></thead><tbody>${quotes.map(q=>`<tr><td>${esc(q.id)}</td><td>${esc(quoteVehicleLabel(q))}</td><td>${esc(quoteCreatorName(q) || '-')}</td><td>${money(q.total)}</td><td>${badge(q.estado)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sem orçamentos para este cliente.</div>'}
      <h4>Notas</h4>
      <p class="muted">${esc(c.notas || 'Sem notas registadas.')}</p>
    </div>`);
}
function emailClient(id){
  const c = state.clients.find(x=>x.id===id); if(!c) return;
  const primaryEmail = clientPrimaryEmail(c);
  if(!primaryEmail) return toast('Este cliente não tem email registado.');
  openModal(`Enviar email · ${esc(c.nome || '')}`, `
    <form id="clientEmailForm" class="form-grid">
      <input class="field span3" name="to" value="${esc(primaryEmail)}" readonly>
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
    try { await navigator.clipboard.writeText(primaryEmail); toast('Email copiado.'); }
    catch { toast(primaryEmail); }
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

/* ==========================================================================
   Catálogo Motor v2 · Motor → Tipo de peça → Peças
   Coleções Firebase: catalogoMotores (motores), catalogoTiposPeca (tipos),
   catalogoMotor (peças, com motorId + tipoId).
   As gravações são feitas só para os documentos alterados (não reescrevem
   o catálogo inteiro a cada edição).
   ========================================================================== */
const CATALOG_PAGE = 'catalogo-motor';
const CATALOG_STATE_KEYS = ['engineCatalogEngines', 'engineCatalogTypes', 'engineCatalog'];
const catalogUI = { motorId:'', tipoId:'', q:'', motorQ:'', motorView:'parts', motorBookPage:0, motorBookZoom:100, motorBookSearch:'', motorOpen:false, motorFocus:false, motorPickerOpen:false, motorPickerQ:'', catalogPanelOpen:false, limit:60, searchTimer:null, motorSearchTimer:null, motorPickerTimer:null, pendingPlan:null, loading:false, failed:false, errors:[] };
const catalogSearchCache = new WeakMap();
const CATALOG_TYPE_ICON_RULES = [
  [/distrib/, '⛓️'], [/filtro/, '🧴'], [/trav|pastilh|disco/, '🛑'], [/vela|igni/, '🔥'],
  [/junta|vedante|retentor/, '🧱'], [/oleo|lubrific/, '🛢️'], [/embraiag/, '⚙️'], [/turbo/, '🌀'],
  [/injec|injet|bomba/, '💧'], [/refriger|agua|radiad|termost/, '❄️'], [/correia|corrente|tensor|rolo/, '🔗'],
  [/cabeca|cilindro|piston|pistao|biela|segment|casquilh|cambota|arvore/, '🔩'],
  [/sensor|sonda|eletr|electr|bobin|alternad|arranque/, '⚡']
];
const CATALOG_ICON_CHOICES = ['⛓️','🧴','🛑','🔥','🧱','🛢️','⚙️','🌀','💧','❄️','🔗','🔩','⚡','🔧'];

/* ---------- Normalização ---------- */
function catNorm(v){ return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
function catKey(v){ return catNorm(v).replace(/\s/g,''); }
function catCompact(v){ return catNorm(v).replace(/[^a-z0-9]/g,''); }
function catSlug(v){ return catNorm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'x'; }
function catHash(s){ let h = 5381; for(const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); }
function catCollate(a,b){ return String(a ?? '').localeCompare(String(b ?? ''), 'pt', { numeric:true, sensitivity:'base' }); }
function catNewId(prefix, name, used){
  const cleanSlug = catSlug(name);
  const nameHash = catHash(name);
  let id = `${prefix}-${cleanSlug}-${nameHash}`;
  while(used.has(id)) {
    id += Math.random().toString(36).slice(2, 4).toUpperCase();
  }
  used.add(id);
  return id;
}
function catTypeIcon(t){
  if(t?.icone) {
    // Se for um Memoji em Base64, renderiza a imagem com um tamanho maior (42px)
    if(String(t.icone).startsWith('data:image')) {
      return `<img src="${t.icone}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px; display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1;">`;
    }
    return t.icone;
  }
  const n = catNorm(t?.nome);
  const hit = CATALOG_TYPE_ICON_RULES.find(([rx]) => rx.test(n));
  return hit ? hit[1] : '🔧';
}


/* ---------- Estado e permissões ---------- */
function catalogReady(){ return CATALOG_STATE_KEYS.every(k => firebaseLoadedKeys.has(k)); }
function catalogCan(action){
  if(action === 'import') return canImportExcel() && canCreateOperational(CATALOG_PAGE);
  if(action === 'export') return canExportExcel();
  return canAction(action, CATALOG_PAGE);
}
function catalogIndex(){
  // CORREÇÃO: Força a ordenação alfabética natural estável pelo nome do motor (A-Z)
  const engines = [...(state.engineCatalogEngines || [])].sort((a, b) => {
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt', { numeric: true, sensitivity: 'base' });
  });

  // Força a ordenação estável das categorias/tipos de peça (A-Z)
  const types = [...(state.engineCatalogTypes || [])].sort((a, b) => {
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt', { numeric: true, sensitivity: 'base' });
  });

  const engineById = new Map(engines.map(e => [e.id, e]));
  const typeById = new Map(types.map(t => [t.id, t]));
  const byEngine = new Map();
  const engineCount = new Map();
  const typeCount = new Map();
  const all = [];

  (state.engineCatalog || []).forEach(p => {
    const e = engineById.get(p.motorId), t = typeById.get(p.tipoId);
    if(!e || !t) return;
    if(!byEngine.has(e.id)) byEngine.set(e.id, new Map());
    const m = byEngine.get(e.id);
    if(!m.has(t.id)) m.set(t.id, []);
    m.get(t.id).push(p);
    engineCount.set(e.id, (engineCount.get(e.id) || 0) + 1);
    typeCount.set(t.id, (typeCount.get(t.id) || 0) + 1);
    all.push({ p, e, t });
  });

  byEngine.forEach(m => m.forEach(list => list.sort((a,b) => catCollate(a.referencia, b.referencia))));
  return { engines, types, engineById, typeById, byEngine, engineCount, typeCount, all };
}

function catalogFixSelection(idx){
  if(!idx.engineById.has(catalogUI.motorId)) catalogUI.motorId = idx.engines[0]?.id || '';
  if(catalogUI.tipoId && !idx.byEngine.get(catalogUI.motorId)?.has(catalogUI.tipoId)) catalogUI.tipoId = '';
}

function catalogMigrateLegacy(){
  const legacy = (state.engineCatalog || []).filter(p => !p.motorId || !p.tipoId);
  if(!legacy.length) return;
  const engByKey = new Map(state.engineCatalogEngines.map(e => [catKey(e.nome), e]));
  const typeByKey = new Map(state.engineCatalogTypes.map(t => [catKey(t.nome), t]));
  const usedE = new Set(state.engineCatalogEngines.map(e => e.id));
  const usedT = new Set(state.engineCatalogTypes.map(t => t.id));
  const newE = [], newT = [], now = new Date().toISOString();
  legacy.forEach(p => {
    const mName = String(p.motor || '').trim() || 'Sem motor';
    const tName = String(p.tipoPeca || '').trim() || 'Sem tipo';
    let e = engByKey.get(catKey(mName));
    if(!e){ e = { id:catNewId('EMO', mName, usedE), nome:mName, observacoes:'', createdAt:now }; engByKey.set(catKey(mName), e); newE.push(e); }
    let t = typeByKey.get(catKey(tName));
    if(!t){ t = { id:catNewId('TPC', tName, usedT), nome:tName, icone:'', createdAt:now }; typeByKey.set(catKey(tName), t); newT.push(t); }
    p.motorId = e.id; p.tipoId = t.id;
  });
  state.engineCatalogEngines.push(...newE);
  state.engineCatalogTypes.push(...newT);
  // Só grava se o utilizador puder escrever; caso contrário fica apenas em memória.
  if(hasWritableFirebaseSession() && catalogCan('add') && catalogCan('edit') && !catalogUI.migrating){
    catalogUI.migrating = true;
    const ops = [
      ...newE.map(row => ({ key:'engineCatalogEngines', row })),
      ...newT.map(row => ({ key:'engineCatalogTypes', row })),
      ...legacy.map(p => {
        const dropFields = ['motor','tipoPeca'].filter(f => f in p);
        dropFields.forEach(f => delete p[f]);
        return { key:'engineCatalog', row:p, dropFields };
      })
    ];
    catalogCommit(ops, `Catálogo Motor: migração (${legacy.length} peça(s))`, { silent:true }).finally(() => { catalogUI.migrating = false; });
  }
}

async function catalogCommit(ops, action, opts = {}){
  if(!hasWritableFirebaseSession()){
    toast('Sem Firebase ativo. Nada foi gravado.');
    updateFirebaseStatusBadge();
    return false;
  }
  try{
    let batch = firebaseDb.batch(), n = 0;
    for(const op of ops){
      const ref = firebaseDb.collection(FIREBASE_COLLECTIONS[op.key]).doc(op.id || op.row.id);
      if(op.del){
        batch.delete(ref);
      } else {
        const payload = sanitizeRowForFirestore(op.row);
        payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        payload.updatedBy = firebaseAuth.currentUser.email || '';
        (op.dropFields || []).forEach(f => { payload[f] = firebase.firestore.FieldValue.delete(); });
        batch.set(ref, payload, { merge:true });
      }
      if(++n >= 400){ await batch.commit(); batch = firebaseDb.batch(); n = 0; }
    }
    if(n) await batch.commit();
    addAuditLog(action, CATALOG_PAGE);
    return true;
  } catch(err){
    console.warn('Catálogo Motor: erro Firebase', err);
    if(!opts.silent) toast(`Erro Firebase: Catálogo Motor não foi guardado${err?.code ? ` (${err.code})` : ''}.`);
    if(!opts.silent) await catalogReload();
    return false;
  }
}
async function catalogReload(){
  CATALOG_STATE_KEYS.forEach(k => firebaseLoadedKeys.delete(k));
  await Promise.all(CATALOG_STATE_KEYS.map(k => loadCollectionKey(k)));
  if(currentPage === CATALOG_PAGE) renderPage(CATALOG_PAGE);
}

async function catalogLoadAll(){
  if(catalogUI.loading) return;
  catalogUI.loading = true; catalogUI.failed = false; catalogUI.errors = [];
  try{
    if(!firebaseReady || !firebaseDb || !firebaseAuth?.currentUser){
      catalogUI.errors.push('sem sessão Firebase ativa');
    } else {
      for(const key of CATALOG_STATE_KEYS){
        if(firebaseLoadedKeys.has(key)) continue;
        const r = await safeLoadCollection(key, FIREBASE_COLLECTIONS[key]);
        if(r.ok && Array.isArray(r.rows)){
          state[key] = r.rows; firebaseLoadedKeys.add(key); state = ensureStateShape(state);
        } else {
          catalogUI.errors.push(`${FIREBASE_COLLECTIONS[key]}: ${r.error?.code || r.error?.message || 'erro desconhecido'}`);
        }
      }
    }
  } catch(err){
    console.warn('Catálogo Motor: falha a carregar', err);
    catalogUI.errors.push(err?.message || 'erro inesperado');
  }
  catalogUI.loading = false;
  catalogUI.failed = !catalogReady();
  if(currentPage === CATALOG_PAGE) renderPage(CATALOG_PAGE);
}
function catalogLoadingCard(){
  catalogLoadAll();
  return '<div class="card cm-loading" id="cmLoading">⏳ A carregar catálogo…</div>';
}
function catalogErrorBanner(){
  if(catalogReady()) return '';
  const detail = catalogUI.errors.length ? `<small>${esc(catalogUI.errors.join(' · '))}</small>` : '';
  return `<div class="cm-banner">⚠️ <div><strong>Não foi possível carregar o catálogo do Firebase.</strong><span>Confirma que estás com sessão Firebase e que publicaste o <code>firestore.rules</code> novo (coleções catalogoMotor, catalogoMotores e catalogoTiposPeca).</span>${detail}</div><button type="button" class="cm-btn cm-btn-main small" data-cm="retry">🔄 Tentar de novo</button></div>`;
}

/* ==========================================================================
   LIVRO DO MOTOR
   Cada motor pode ter um DOCX original guardado no Firebase Storage.
   A aplicação renderiza o DOCX no browser com docx-preview, mantendo
   imagens, tabelas, cores e estrutura do documento o mais fiel possível.
   ========================================================================== */
let motorBookRenderToken = 0;

async function ensureDocxViewer(){
  // docx-preview 0.3.x usa JSZip para abrir o .docx.
  // O bundle do docx-preview não disponibiliza necessariamente JSZip
  // como global, por isso carregamos a dependência explicitamente antes.
  try{
    if(!window.JSZip?.loadAsync){
      await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    }
    if(!window.JSZip?.loadAsync){
      console.warn('JSZip carregado mas window.JSZip.loadAsync não está disponível.');
      return false;
    }
    if(!window.docx?.renderAsync){
      await loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.3.6/dist/docx-preview.min.js');
    }
    return !!window.docx?.renderAsync;
  }catch(err){
    console.warn('Dependências do visualizador Word indisponíveis', err);
    return false;
  }
}

async function openMotorBookPicker(engine){
  if(!engine) return;

  // Edge/Chrome: usar o seletor nativo moderno diretamente a partir do clique.
  // Fallback para <input type=file> para Electron/ambientes sem showOpenFilePicker.
  try {
    if(typeof window.showOpenFilePicker === 'function'){
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Documento Microsoft Word',
          accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
        }]
      });
      if(!handles?.length) return;
      const file = await handles[0].getFile();
      await uploadMotorBook(file, engine);
      return;
    }
  } catch(err){
    // Cancelar o seletor não é erro. Para outros erros, tentamos o fallback.
    if(err?.name === 'AbortError') return;
    console.warn('showOpenFilePicker indisponível/falhou, a usar fallback:', err);
  }

  const old = document.querySelector('#cmMotorBookPickerDynamic');
  if(old) old.remove();

  const input = document.createElement('input');
  input.id = 'cmMotorBookPickerDynamic';
  input.type = 'file';
  input.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  input.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;';
  document.body.appendChild(input);

  input.onchange = async () => {
    const file = input.files && input.files[0];
    input.remove();
    if(file) await uploadMotorBook(file, engine);
  };

  input.click();
}

async function uploadMotorBook(file, engine){
  if(!file || !engine) return;
  if(!catalogGuard('edit')) return;
  if(!firebaseStorage) return toast('Firebase Storage não está disponível.');
  const ext = String(file.name || '').toLowerCase().endsWith('.docx') ? '.docx' : '';
  if(ext !== '.docx') return toast('Escolhe um ficheiro Word .docx.');
  if(file.size > 25 * 1024 * 1024) return toast('O Word não pode ultrapassar 25 MB.');

  const btn = qs('#cmUploadMotorBookBtn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ A carregar…'; }
  const uploadButtons = qsa('[data-cm="motor-book-upload"]');
  uploadButtons.forEach(b => { b.disabled = true; b.dataset.originalText = b.textContent; b.textContent = '⏳ A carregar Word…'; });
  toast(`A carregar o Word de ${engine.nome}…`);

  try{
    const safeName = String(file.name).replace(/[^\w.\-À-ÿ ]+/g,'_').trim() || `motor-${engine.nome}.docx`;
    const path = `catalogo-motores/${engine.id}/${Date.now()}-${safeName}`;
    const ref = firebaseStorage.ref().child(path);
    const uploadTask = ref.put(file, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      customMetadata: {
        motorId: String(engine.id),
        motorNome: String(engine.nome || ''),
        uploadedBy: String(firebaseAuth?.currentUser?.email || '')
      }
    });
    const task = await new Promise((resolve, reject) => {
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        snapshot => {
          const pct = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
          const statusBtns = qsa('[data-cm="motor-book-upload"]');
          statusBtns.forEach(b => b.textContent = `⏳ Word ${pct}%`);
        },
        reject,
        () => resolve(uploadTask.snapshot)
      );
    });
    const url = await task.ref.getDownloadURL();

    engine.livroMotorUrl = url;
    engine.livroMotorNome = safeName;
    engine.livroMotorPath = path;
    engine.livroMotorUpdatedAt = new Date().toISOString();
    engine.livroMotorUpdatedBy = firebaseAuth?.currentUser?.email || '';

    const ok = await saveSingleRowToFirebase('engineCatalogEngines', engine);
    if(!ok) throw new Error('Não foi possível guardar o motor no Firebase.');

    // Mantém a referência em memória e abre imediatamente o livro.
    state.engineCatalogEngines = (state.engineCatalogEngines || []).map(e => e.id === engine.id ? engine : e);
    catalogUI.motorBook = true;
    catalogUI.motorView = 'book';
    catalogUI.motorBookPage = 0;
    catalogUI.motorBookAutoImportPending = true;
    catalogRefreshBody();
    toast(`Livro do motor ${engine.nome} carregado com sucesso. A preparar as peças automaticamente…`);
  }catch(err){
    console.error('Erro no upload do Livro do Motor:', err);
    const code = String(err?.code || '');
    let detail = err?.message || err;
    if(code === 'storage/unauthorized') detail = 'Firebase Storage recusou o upload. Publica as regras storage.rules da versão 2.9.17.';
    else if(code === 'storage/bucket-not-found') detail = 'O bucket do Firebase Storage não foi encontrado/ativado neste projeto.';
    else if(code === 'storage/quota-exceeded') detail = 'A quota do Firebase Storage foi excedida.';
    else if(code === 'storage/canceled') detail = 'O upload foi cancelado.';
    toast(`Erro ao carregar o Word: ${detail}`);
  }finally{
    const b = qs('#cmUploadMotorBookBtn');
    if(b){ b.disabled=false; b.textContent='📤 Trocar Word'; }
    qsa('[data-cm="motor-book-upload"]').forEach(x => {
      x.disabled = false;
      if(x.dataset.originalText) x.textContent = x.dataset.originalText;
    });
  }
}

async function removeMotorBook(engine){
  if(!engine || !catalogGuard('edit')) return;
  if(!confirm(`Remover o Word do motor ${engine.nome}?`)) return;
  try{
    // Apaga o ficheiro do Storage quando o caminho é conhecido.
    if(firebaseStorage && engine.livroMotorPath){
      await firebaseStorage.ref().child(engine.livroMotorPath).delete().catch(()=>{});
    }
    delete engine.livroMotorUrl;
    delete engine.livroMotorNome;
    delete engine.livroMotorPath;
    delete engine.livroMotorUpdatedAt;
    delete engine.livroMotorUpdatedBy;
    await saveSingleRowToFirebase('engineCatalogEngines', engine);
    state.engineCatalogEngines = (state.engineCatalogEngines || []).map(e => e.id === engine.id ? engine : e);
    catalogUI.motorBook = false;
    catalogUI.motorView = 'parts';
    catalogRefreshBody();
    toast('Livro do motor removido.');
  }catch(err){
    console.error(err);
    toast('Não foi possível remover o livro do motor.');
  }
}

async function renderMotorBook(engine){
  const box = qs('#cmMotorBookViewer');
  if(!box || !engine?.livroMotorUrl) return;
  const token = ++motorBookRenderToken;
  box.innerHTML = '<div class="cm-book-loading">📖 A preparar o livro do motor…</div>';
  const ready = await ensureDocxViewer();
  if(token !== motorBookRenderToken) return;
  if(!ready){
    box.innerHTML = '<div class="cm-empty small"><div class="cm-empty-ico">📄</div><h4>Não foi possível carregar o visualizador Word</h4><p>Verifica a ligação à Internet e tenta novamente.</p></div>';
    return;
  }
  try{
    const res = await fetch(engine.livroMotorUrl, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if(token !== motorBookRenderToken) return;
    box.innerHTML = '';
    await window.docx.renderAsync(blob, box, null, {
      className: 'cm-docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    });
    if(token !== motorBookRenderToken) return;
    window.__cmCurrentMotorBookEngine = engine;
    catalogUI.motorBookZoom = 100;
    setupMotorBookViewer(engine);
    // Garantia para browsers/PWA onde estilos e filhos do renderer assentam
    // no DOM depois do renderAsync resolver.
    [50, 150, 400, 900].forEach(ms => setTimeout(() => setupMotorBookViewer(engine), ms));
    if(catalogUI.motorBookAutoImportPending){
      catalogUI.motorBookAutoImportPending=false;
      setTimeout(() => motorBookAutoCreatePieces(engine), 1100);
    }
  }catch(err){
    console.error(err);
    box.innerHTML = `<div class="cm-empty small"><div class="cm-empty-ico">⚠️</div><h4>Não foi possível abrir o Word</h4><p>${esc(err?.message || 'Erro ao ler o documento.')}</p><a class="cm-btn cm-btn-main" href="${esc(engine.livroMotorUrl)}" target="_blank" rel="noopener">Abrir ficheiro original</a></div>`;
  }
}

function getMotorBookPages(){
  const viewer = qs('#cmMotorBookViewer');
  if(!viewer) return [];

  // O docx-preview pode gerar as páginas como <section class="docx">,
  // mas algumas versões/ambientes usam outro elemento com a mesma classe.
  // Não dependemos do nome da tag.
  // O renderizador foi chamado com className: 'cm-docx'.
  // Isso faz o docx-preview criar 'cm-docx-wrapper' (e não 'docx-wrapper').
  // Aceitamos ambos para não ficarmos dependentes do prefixo configurado.
  const wrapper = viewer.querySelector('.cm-docx-wrapper, .docx-wrapper, [class*="docx-wrapper"]');
  if(!wrapper) return [];

  const direct = [...wrapper.children].filter(el => {
    if(!(el instanceof HTMLElement)) return false;
    if(el === wrapper) return false;
    const cls = String(el.className || '').toLowerCase();
    return el.classList.contains('docx') || el.tagName === 'SECTION' || cls.includes('docx');
  });
  if(direct.length) return direct;

  // Fallback para documentos em que o renderer introduz um nível intermédio.
  const nested = [...wrapper.querySelectorAll('.docx, section, article')].filter(el => {
    if(!(el instanceof HTMLElement)) return false;
    if(el.closest('.cm-docx-wrapper, .docx-wrapper, [class*=\"docx-wrapper\"]') !== wrapper) return false;
    // Keep only the highest-level page nodes. If a page contains nested
    // sections/articles, those are document content, not extra pages.
    return !el.parentElement?.closest('.docx-wrapper') || el.parentElement === wrapper;
  });
  if(nested.length) return nested;

  // Last fallback: docx-preview always gives its rendered page a class with
  // the configured className ("docx"). If a future build changes the wrapper
  // nesting, use the outermost elements carrying that class.
  const allDocx = [...viewer.querySelectorAll('[class*="docx"]')].filter(el => {
    if(!(el instanceof HTMLElement)) return false;
    if(el === wrapper) return false;
    return el.closest('.cm-docx-wrapper, .docx-wrapper, [class*=\"docx-wrapper\"]') === wrapper && !el.parentElement?.className?.toString().includes('docx-wrapper');
  });
  if(allDocx.length) return allDocx;

  // Último fallback: alguns browsers/PWA podem entregar o DOM renderizado
  // sem as classes esperadas pelo docx-preview. Nessa situação identificamos
  // as páginas pelo tamanho real e pelo facto de conterem imagens.
  const visualCandidates = [...viewer.querySelectorAll('section, article, div')].filter(el => {
    if(!(el instanceof HTMLElement)) return false;
    if(el.closest('[data-book], .cm-book-toolbar, .cm-book-tools, .cm-book-thumbs')) return false;
    if(!el.querySelector('img')) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 400 && r.height >= 500;
  });
  if(visualCandidates.length){
    const outer = visualCandidates.filter(el => !visualCandidates.some(other => other !== el && other.contains(el)));
    if(outer.length) return outer;
  }

  return [];
}

function motorBookUpdateZoom(){
  const viewer = qs('#cmMotorBookViewer');
  if(!viewer) return;
  const zoom = Math.max(60, Math.min(280, Number(catalogUI.motorBookZoom || 100)));
  catalogUI.motorBookZoom = zoom;
  const factor = zoom / 100;
  const pages = getMotorBookPages();
  pages.forEach(page => {
    page.classList.add('cm-book-page');
    page.style.zoom = String(factor);
    page.style.transform = 'none';
    page.style.transformOrigin = 'top center';
  });
  const label = qs('#cmBookZoomLabel');
  if(label) label.textContent = `${zoom}%`;
}

function motorBookFitWidth(){
  const viewer = qs('#cmMotorBookViewer');
  const pages = getMotorBookPages();
  if(!viewer || !pages.length) return;
  const page = pages[catalogUI.motorBookPage] || pages[0];
  const available = Math.max(280, viewer.clientWidth - 28);
  const currentZoom = Math.max(0.01, Number(catalogUI.motorBookZoom || 100) / 100);
  const pageWidth = Math.max(1, page.getBoundingClientRect().width / currentZoom);
  catalogUI.motorBookZoom = Math.max(60, Math.min(280, Math.round((available / pageWidth) * 100)));
  motorBookUpdateZoom();
}

function motorBookClearPageZoom(){
  getMotorBookPages().forEach(page => {
    page.style.zoom = '';
    page.style.transform = '';
    page.style.transformOrigin = '';
  });
}

function motorBookShowPage(page, scroll=true){
  const pages = getMotorBookPages();
  if(!pages.length) return;
  catalogUI.motorBookPage = Math.max(0, Math.min(Number(page) || 0, pages.length - 1));
  pages.forEach((p,i) => {
    p.classList.add('cm-book-page');
    p.classList.toggle('cm-book-page-active', i === catalogUI.motorBookPage);
  });
  qsa('.cm-book-thumb').forEach((t,i) => t.classList.toggle('active', i === catalogUI.motorBookPage));
  const current = qs('#cmBookPageCurrent');
  const total = qs('#cmBookPageTotal');
  if(current) current.textContent = String(catalogUI.motorBookPage + 1);
  if(total) total.textContent = String(pages.length);
  const prev = qs('[data-book="prev"]');
  const next = qs('[data-book="next"]');
  if(prev) prev.disabled = catalogUI.motorBookPage <= 0;
  if(next) next.disabled = catalogUI.motorBookPage >= pages.length - 1;
  motorBookUpdateZoom();
  if(scroll) pages[catalogUI.motorBookPage]?.scrollIntoView({behavior:'smooth', block:'center'});
}

function motorBookBuildThumbs(){
  const pages = getMotorBookPages();
  const rail = qs('#cmBookThumbs');
  if(!rail) return;
  rail.innerHTML = pages.map((page,i) => `
    <button type="button" class="cm-book-thumb ${i===catalogUI.motorBookPage?'active':''}" data-book-page="${i}" title="Página ${i+1}">
      <span class="cm-book-thumb-page"></span><span>Página ${i+1}</span>
    </button>`).join('');
  pages.forEach((page,i) => {
    const target = rail.querySelector(`[data-book-page="${i}"] .cm-book-thumb-page`);
    if(!target) return;
    const clone = page.cloneNode(true);
    clone.removeAttribute('class');
    clone.style.zoom = '';
    clone.style.transform = 'none';
    target.appendChild(clone);
  });
  const total = qs('#cmBookPageTotal');
  if(total) total.textContent = String(pages.length);
}

function clearMotorBookHighlights(){
  const viewer = qs('#cmMotorBookViewer');
  if(!viewer) return;
  viewer.querySelectorAll('mark.cm-book-search-hit').forEach(mark => {
    const parent = mark.parentNode;
    if(!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    parent.normalize();
  });
  viewer.querySelectorAll('.cm-book-ocr-overlay').forEach(el => el.remove());
  viewer.querySelectorAll('.cm-book-ocr-active').forEach(el => el.classList.remove('cm-book-ocr-active'));
}

function motorBookNormalizeSearch(value){
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[^a-z0-9]+/g, '');
}

function motorBookTextHighlight(query){
  const q = String(query || '').trim();
  if(!q) return [];
  const pages = getMotorBookPages();
  if(!pages.length) return [];
  const needle = q.toLocaleLowerCase('pt-PT');
  const hits = [];
  pages.forEach((page, pageIndex) => {
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while((node = walker.nextNode())){
      const parent = node.parentElement;
      if(!parent || parent.closest('mark.cm-book-search-hit,script,style,.cm-book-ocr-overlay')) continue;
      if(String(node.nodeValue || '').toLocaleLowerCase('pt-PT').includes(needle)) nodes.push(node);
    }
    nodes.forEach(textNode => {
      const text = textNode.nodeValue || '';
      const lower = text.toLocaleLowerCase('pt-PT');
      const frag = document.createDocumentFragment();
      let from = 0;
      while(true){
        const at = lower.indexOf(needle, from);
        if(at < 0){
          if(from < text.length) frag.appendChild(document.createTextNode(text.slice(from)));
          break;
        }
        if(at > from) frag.appendChild(document.createTextNode(text.slice(from, at)));
        const mark = document.createElement('mark');
        mark.className = 'cm-book-search-hit';
        mark.textContent = text.slice(at, at + q.length);
        frag.appendChild(mark);
        hits.push({mark, pageIndex});
        from = at + q.length;
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    });
  });
  return hits;
}

let motorBookTesseractPromise = null;
const motorBookOCRCache = new Map();

async function ensureMotorBookOCR(){
  if(window.Tesseract?.recognize) return window.Tesseract;
  if(motorBookTesseractPromise) return motorBookTesseractPromise;
  motorBookTesseractPromise = loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js')
    .then(() => window.Tesseract?.recognize ? window.Tesseract : null)
    .catch(err => { console.warn('OCR indisponível', err); return null; });
  return motorBookTesseractPromise;
}

function motorBookOCRSources(img){
  // Criamos várias versões da mesma fotografia. O OCR pode falhar numa
  // imagem inclinada/escura mesmo quando o texto é perfeitamente legível.
  try{
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if(!w || !h) return [img.currentSrc || img.src].filter(Boolean);
    const scale = Math.min(2.8, Math.max(1.5, 2400 / Math.max(w, h)));
    const outW = Math.round(w * scale), outH = Math.round(h * scale);
    const base = document.createElement('canvas');
    base.width = outW; base.height = outH;
    const ctx = base.getContext('2d', {willReadFrequently:true});
    if(!ctx) return [img.currentSrc || img.src].filter(Boolean);
    ctx.drawImage(img, 0, 0, outW, outH);
    const src = ctx.getImageData(0, 0, outW, outH);
    const d = src.data;
    const gray = new Uint8Array(outW * outH);
    for(let i=0,pix=0;i<d.length;i+=4,pix++){
      const y = (d[i]*0.299)+(d[i+1]*0.587)+(d[i+2]*0.114);
      gray[pix] = Math.max(0, Math.min(255, Math.round(y)));
    }

    // Passo 1: grayscale + contraste suave — preserva melhor letras pequenas.
    const soft = new ImageData(new Uint8ClampedArray(d), outW, outH);
    for(let i=0,pix=0;i<soft.data.length;i+=4,pix++){
      const y = gray[pix];
      const v = Math.max(0, Math.min(255, ((y-128)*1.65)+128));
      soft.data[i]=soft.data[i+1]=soft.data[i+2]=v; soft.data[i+3]=255;
    }
    const c1=document.createElement('canvas'); c1.width=outW; c1.height=outH;
    c1.getContext('2d').putImageData(soft,0,0);

    // Passo 2: binarização adaptada. Ajuda bastante em páginas fotografadas
    // com reflexos, sombras e texto cinzento/colorido.
    const bin = new ImageData(new Uint8ClampedArray(d), outW, outH);
    const radius = Math.max(8, Math.round(Math.min(outW,outH)/120));
    const integral = new Float64Array((outW+1)*(outH+1));
    for(let y=0;y<outH;y++){
      let row=0;
      for(let x=0;x<outW;x++){
        row += gray[y*outW+x];
        integral[(y+1)*(outW+1)+(x+1)] = integral[y*(outW+1)+(x+1)] + row;
      }
    }
    for(let y=0;y<outH;y++) for(let x=0;x<outW;x++){
      const x0=Math.max(0,x-radius), x1=Math.min(outW-1,x+radius);
      const y0=Math.max(0,y-radius), y1=Math.min(outH-1,y+radius);
      const A=integral[y0*(outW+1)+x0], B=integral[y0*(outW+1)+x1+1];
      const C=integral[(y1+1)*(outW+1)+x0], D=integral[(y1+1)*(outW+1)+x1+1];
      const mean=(D-B-C+A)/((x1-x0+1)*(y1-y0+1));
      const v=gray[y*outW+x] < mean-7 ? 0 : 255;
      const i=(y*outW+x)*4;
      bin.data[i]=bin.data[i+1]=bin.data[i+2]=v; bin.data[i+3]=255;
    }
    const c2=document.createElement('canvas'); c2.width=outW; c2.height=outH;
    c2.getContext('2d').putImageData(bin,0,0);

    return [c1.toDataURL('image/jpeg',0.92), c2.toDataURL('image/png')];
  }catch(err){
    console.warn('Pré-processamento OCR ignorado', err);
    return [img.currentSrc || img.src].filter(Boolean);
  }
}

function motorBookWordBox(words){
  const valid = (words || []).filter(w => String(w?.text || '').trim() && w?.bbox);
  if(!valid.length) return null;
  const xs = valid.map(w => w.bbox.x0), ys = valid.map(w => w.bbox.y0);
  const xe = valid.map(w => w.bbox.x1), ye = valid.map(w => w.bbox.y1);
  return {x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xe), y1:Math.max(...ye)};
}

function motorBookOverlayForMatches(img, matches){
  if(!img || !matches?.length) return [];
  const host = img.parentElement;
  if(!host) return [];
  if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.querySelectorAll('.cm-book-ocr-overlay').forEach(el => el.remove());
  const overlay = document.createElement('div');
  overlay.className = 'cm-book-ocr-overlay';
  host.appendChild(overlay);
  const naturalW = img.naturalWidth || img.width || 1;
  const naturalH = img.naturalHeight || img.height || 1;
  const displayW = img.clientWidth || naturalW;
  const displayH = img.clientHeight || naturalH;
  const sx = displayW / naturalW;
  const sy = displayH / naturalH;
  return matches.map((match, index) => {
    const b = match.bbox || {};
    const mark = document.createElement('span');
    mark.className = 'cm-book-ocr-hit';
    mark.dataset.ocrHit = String(index);
    mark.style.left = `${Math.max(0, (b.x0 || 0) * sx - 2)}px`;
    mark.style.top = `${Math.max(0, (b.y0 || 0) * sy - 2)}px`;
    mark.style.width = `${Math.max(6, ((b.x1 || 0) - (b.x0 || 0)) * sx + 4)}px`;
    mark.style.height = `${Math.max(6, ((b.y1 || 0) - (b.y0 || 0)) * sy + 4)}px`;
    mark.title = match.text || '';
    overlay.appendChild(mark);
    return mark;
  });
}

function motorBookOCRSimilarity(a,b){
  a=motorBookNormalizeSearch(a); b=motorBookNormalizeSearch(b);
  if(!a||!b) return 0;
  if(a===b) return 1;
  if(a.includes(b)||b.includes(a)) return Math.min(a.length,b.length)/Math.max(a.length,b.length);
  const m=a.length,n=b.length;
  if(Math.abs(m-n)>Math.max(3,Math.floor(Math.max(m,n)*0.45))) return 0;
  const prev=new Array(n+1); const cur=new Array(n+1);
  for(let j=0;j<=n;j++) prev[j]=j;
  for(let i=1;i<=m;i++){
    cur[0]=i;
    for(let j=1;j<=n;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+cost);
    }
    for(let j=0;j<=n;j++) prev[j]=cur[j];
  }
  return 1-(prev[n]/Math.max(m,n));
}

function motorBookSearchVariants(query){
  const base=motorBookNormalizeSearch(query);
  if(!base) return [];
  const variants=new Set([base]);
  // Erros frequentes de OCR em referências de peças.
  const swaps=[['0','o'],['1','i'],['1','l'],['5','s'],['8','b'],['2','z'],['6','g']];
  swaps.forEach(([a,b])=>{
    if(base.includes(a)) variants.add(base.replaceAll(a,b));
    if(base.includes(b)) variants.add(base.replaceAll(b,a));
  });
  return [...variants];
}

function motorBookBuildOCRMatches(words, query){
  const variants=motorBookSearchVariants(query);
  if(!variants.length) return [];
  const cleanWords=(words||[]).filter(w=>String(w?.text||'').trim()&&w?.bbox);
  const groups=new Map();
  cleanWords.forEach((word,index)=>{
    const key=`${word.block_num??0}:${word.par_num??0}:${word.line_num??index}`;
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push({...word,__index:index});
  });
  const matches=[];
  const threshold=variants.some(v=>/\d/.test(v)) ? 0.72 : 0.78;
  groups.forEach(lineWords=>{
    lineWords.sort((a,b)=>(a.bbox.y0-b.bbox.y0)||(a.bbox.x0-b.bbox.x0));
    for(let start=0;start<lineWords.length;start++){
      let combined='';
      const used=[];
      for(let end=start;end<lineWords.length && end<start+8;end++){
        const w=lineWords[end];
        const clean=motorBookNormalizeSearch(w.text);
        if(!clean) continue;
        combined+=clean; used.push(w);
        for(const needle of variants){
          if(combined.includes(needle)){
            const at=combined.indexOf(needle);
            const endPos=at+needle.length;
            let chars=0, selected=[];
            for(const uw of used){
              const u=motorBookNormalizeSearch(uw.text); const next=chars+u.length;
              if(next>at && chars<endPos) selected.push(uw);
              chars=next;
            }
            const bbox=motorBookWordBox(selected);
            if(bbox) matches.push({text:selected.map(x=>x.text).join(' '),bbox,score:1});
            break;
          }
        }
      }
    }
    // Fuzzy fallback: cada palavra/pequeno grupo pode ter 1-2 erros de OCR.
    for(let start=0;start<lineWords.length;start++){
      let combined=''; const used=[];
      for(let end=start;end<lineWords.length && end<start+5;end++){
        const w=lineWords[end]; const clean=motorBookNormalizeSearch(w.text);
        if(!clean) continue;
        combined+=clean; used.push(w);
        const score=Math.max(...variants.map(v=>motorBookOCRSimilarity(combined,v)));
        if(score>=threshold){
          const bbox=motorBookWordBox(used);
          if(bbox) matches.push({text:used.map(x=>x.text).join(' '),bbox,score});
        }
        // Não alongar demasiado uma referência já muito maior que a pesquisa.
        if(combined.length>Math.max(...variants.map(v=>v.length))+6) break;
      }
    }
  });
  const seen=new Set();
  return matches.filter(m=>{
    const b=m.bbox; const key=`${Math.round(b.x0/5)}:${Math.round(b.y0/5)}:${Math.round(b.x1/5)}:${Math.round(b.y1/5)}`;
    if(seen.has(key)) return false; seen.add(key); return true;
  }).sort((a,b)=>(b.score||0)-(a.score||0));
}

async function motorBookOCRPage(page, pageIndex, query){
  const images=[...page.querySelectorAll('img')];
  if(!images.length) return [];
  const Tesseract=await ensureMotorBookOCR();
  if(!Tesseract) return [];
  const hits=[];
  for(let i=0;i<images.length;i++){
    const img=images[i]; const src=img.currentSrc||img.src;
    if(!src) continue;
    const key=`${pageIndex}:${i}:${src.length}:${img.naturalWidth}x${img.naturalHeight}`;
    try{
      let words=motorBookOCRCache.get(key);
      if(!words){
        const sources=motorBookOCRSources(img);
        let best=[];
        for(let pass=0;pass<sources.length;pass++){
          const result=await Tesseract.recognize(sources[pass],'por+eng',{
            logger:m=>{
              if(m?.status==='recognizing text'&&typeof m.progress==='number'){
                const pct=Math.round(m.progress*100);
                if(pct%25===0) toast(`🔎 A analisar página ${pageIndex+1}: ${pct}%`);
              }
            },
            tessedit_pageseg_mode: 6
          });
          const got=result?.data?.words||[];
          if(got.length>best.length) best=got;
          if(motorBookBuildOCRMatches(got,query).length) { best=got; break; }
        }
        words=best; motorBookOCRCache.set(key,words);
      }
      const matches=motorBookBuildOCRMatches(words,query);
      const marks=motorBookOverlayForMatches(img,matches);
      marks.forEach((mark,matchIndex)=>hits.push({mark,pageIndex,text:matches[matchIndex]?.text||'',score:matches[matchIndex]?.score||0}));
    }catch(err){ console.warn('OCR da página falhou',pageIndex+1,err); }
  }
  return hits;
}

async function motorBookSearch(query){
  const q = String(query || '').trim();
  catalogUI.motorBookSearch = q;
  clearMotorBookHighlights();
  if(!q) return;
  let pages = getMotorBookPages();
  if(!pages.length){
    // O renderer pode terminar de criar as páginas alguns instantes depois
    // de renderAsync resolver, sobretudo em PWA/Android. Esperamos brevemente
    // em vez de abortar a pesquisa.
    for(let attempt=0; attempt<10 && !pages.length; attempt++){
      await new Promise(resolve => setTimeout(resolve, 180));
      pages = getMotorBookPages();
    }
  }
  if(!pages.length) return toast('O livro ainda não terminou de carregar.');

  // Garante que a navegação/paginação fica inicializada mesmo quando o DOM
  // só ficou completo depois do primeiro setup.
  setupMotorBookViewer(window.__cmCurrentMotorBookEngine || null);

  const textHits = motorBookTextHighlight(q);
  if(textHits.length){
    const first = textHits[0];
    motorBookShowPage(first.pageIndex, false);
    requestAnimationFrame(() => first.mark.scrollIntoView({behavior:'smooth', block:'center', inline:'nearest'}));
    return toast(`🔎 ${textHits.length} resultado${textHits.length === 1 ? '' : 's'} encontrado${textHits.length === 1 ? '' : 's'}.`);
  }

  toast('🔎 A procurar nas imagens do livro…');
  const ocrHits = [];
  for(let i=0;i<pages.length;i++){
    const pageHits = await motorBookOCRPage(pages[i], i, q);
    ocrHits.push(...pageHits);
  }
  if(!ocrHits.length) return toast(`Não encontrei “${q}” no livro.`);

  // Cada resultado leva à página correta. Não dependemos da tag <section>,
  // porque o docx-preview pode usar div/article conforme a versão.
  const first = ocrHits[0];
  motorBookShowPage(first.pageIndex, false);
  requestAnimationFrame(() => first.mark.scrollIntoView({behavior:'smooth', block:'center', inline:'nearest'}));
  toast(`🟨 ${ocrHits.length} resultado${ocrHits.length === 1 ? '' : 's'} encontrado${ocrHits.length === 1 ? '' : 's'}.`);
}


/* ========================================================================== 
   IMPORTAÇÃO AUTOMÁTICA DO LIVRO → PEÇAS
   Ao carregar um novo Word, o catálogo é analisado automaticamente.
   Não pede confirmação: cria/atualiza apenas as peças que consegue identificar
   e deixa-as editáveis na lista normal de Peças.
   ========================================================================== */
const MOTOR_BOOK_BRANDS = [
  'VICTOR REINZ','REINZ','TOYONISA','REDLINE','GLYCO','KING','AJUSA','FRECCIA','KS',
  'CORTECO','ELRING','PAYEN','AE','INA','MAHLE','GOETZE','GOETZ','FEDERAL MOGUL','NURAL',
  'PIERBURG','BOSCH','DAYCO','GATES','SKF','SNR','FEBI','FAI','TRW','LUK','SACHS','VALEO',
  'MANN','PURFLUX','HENGST','CONTINENTAL','CAVILHA','CORTeco'.toUpperCase()
];
const MOTOR_BOOK_TYPE_HINTS = [
  ['CHUMACEIRA|CASQUILHA|BRONZES', 'Chumaceiras'],
  ['PISTAO|PISTÕES|EMBOLO|EMBÔLO', 'Pistões'],
  ['SEGMENTO', 'Segmentos'],
  ['JUNTA', 'Juntas'],
  ['RETENTOR', 'Retentores'],
  ['VALVULA|VÁLVULA', 'Válvulas'],
  ['BIELA', 'Bielas'],
  ['CAMBOTA', 'Cambota'],
  ['ARVORE DE CAMES|ÁRVORE DE CAMES|CAMES', 'Árvore de cames'],
  ['CORREIA|CORRENTE|TENSOR|ROLO', 'Distribuição'],
  ['FILTRO', 'Filtros'],
  ['VELA', 'Velas'],
  ['BOMBA', 'Bombas'],
  ['TERMOST|RADIADOR|REFRIGERA', 'Refrigeração'],
  ['EMBRAIAGEM', 'Embraiagem'],
  ['TURBO', 'Turbo'],
  ['INJETOR|INJECAO|INJEÇÃO', 'Injeção'],
  ['SENSOR|SONDA', 'Sensores'],
  ['ROLAMENTO', 'Rolamentos']
];

function motorBookCleanOCRLine(value){
  return String(value || '').replace(/[|¦]+/g,' ').replace(/\s+/g,' ').replace(/\s+([,.;:])/g,'$1').trim();
}
function motorBookReferenceCandidates(line){
  const source = motorBookCleanOCRLine(line).replace(/[“”"']/g,'');
  const tokens = source.match(/[A-Za-z0-9][A-Za-z0-9./_-]{2,39}/g) || [];
  const out=[];
  const seen=new Set();
  tokens.forEach(raw=>{
    let v=raw.replace(/^[.,;:()[\]{}]+|[.,;:()[\]{}]+$/g,'');
    if(!v || v.length<4 || v.length>40 || !/\d/.test(v)) return;
    const compact=catCompact(v);
    if(!compact || compact.length<4) return;
    // Evita dimensões isoladas, anos, páginas e palavras demasiado genéricas.
    if(/^\d{1,3}(?:[.,]\d{1,3})?(?:mm|cm)?$/i.test(v)) return;
    if(/^\d{1,4}$/.test(v)) return;
    if(/^(?:motor|pagina|página|page|std|jogo|x\d+)$/i.test(v)) return;
    if(/^(?:0?25|0?50|025|050|075|100)mm$/i.test(v)) return;
    if(seen.has(compact)) return;
    seen.add(compact); out.push(v);
  });
  return out;
}
function motorBookFindBrand(line){
  const n=catNorm(line).toUpperCase();
  const found=MOTOR_BOOK_BRANDS.find(b=>n.includes(catNorm(b).toUpperCase()));
  return found ? found.replace(/^REINZ$/,'VICTOR REINZ') : '';
}
function motorBookInferType(line, fallback='Outros'){
  const n=catNorm(line).toUpperCase();
  for(const [rx,name] of MOTOR_BOOK_TYPE_HINTS){ if(new RegExp(rx,'i').test(n)) return name; }
  return fallback || 'Outros';
}
function motorBookDescription(line, refs, brand, typeName){
  let d=motorBookCleanOCRLine(line);
  refs.forEach(ref=>{ d=d.replace(new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),' '); });
  if(brand) d=d.replace(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),' ');
  d=d.replace(/[-–—:;,|]+/g,' ').replace(/\s+/g,' ').trim();
  if(!d || d.length<3) d=typeName || '';
  // Não guardar títulos inteiros como descrição se forem apenas o nome do tipo.
  if(catNorm(d)===catNorm(typeName)) return typeName;
  return d.slice(0,180);
}
function motorBookLineFromOCR(words){
  const groups=new Map();
  (words||[]).filter(w=>String(w?.text||'').trim()&&w?.bbox).forEach((w,i)=>{
    const key=`${w.block_num??0}:${w.par_num??0}:${w.line_num??i}`;
    if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(w);
  });
  return [...groups.values()].map(line=>line.sort((a,b)=>(a.bbox.y0-b.bbox.y0)||(a.bbox.x0-b.bbox.x0)).map(w=>String(w.text||'').trim()).filter(Boolean).join(' ')).filter(Boolean);
}
async function motorBookOCRFullImage(img){
  const Tesseract=await ensureMotorBookOCR();
  if(!Tesseract || !img) return [];
  const key=`full:${img.currentSrc||img.src}:${img.naturalWidth}x${img.naturalHeight}`;
  let cached=motorBookOCRCache.get(key);
  if(cached?.__fullLines) return cached.__fullLines;
  const sources=motorBookOCRSources(img); let bestWords=[];
  for(let pass=0;pass<sources.length;pass++){
    try{
      const result=await Tesseract.recognize(sources[pass],'por+eng',{logger:m=>{
        if(m?.status==='recognizing text'&&typeof m.progress==='number'){
          const pct=Math.round(m.progress*100); if(pct%25===0) toast(`🔎 A analisar o livro: ${pct}%`);
        }
      },tessedit_pageseg_mode:6});
      const words=result?.data?.words||[];
      if(words.length>bestWords.length) bestWords=words;
    }catch(err){ console.warn('OCR automático falhou',err); }
  }
  const lines=motorBookLineFromOCR(bestWords);
  motorBookOCRCache.set(key,{__fullLines:true,words:bestWords,lines});
  return lines;
}
function motorBookTextLines(page){
  const text=String(page?.innerText||page?.textContent||'');
  return text.split(/\n+/).map(motorBookCleanOCRLine).filter(Boolean);
}
function motorBookLooksLikeHeading(line){
  const clean=motorBookCleanOCRLine(line); if(!clean || clean.length>90) return false;
  if(motorBookReferenceCandidates(clean).length) return false;
  const letters=clean.replace(/[^A-Za-zÀ-ÿ]/g,'');
  if(letters.length<4) return false;
  const upper=letters===letters.toUpperCase();
  return upper || /^(jogo|pist|chum|junta|retentor|válvula|valvula|segment|árvore|arvore|biela|cambota|correia|filtro|vela|sensor)/i.test(clean);
}
function motorBookParseLines(lines,pageNumber,engine){
  const found=[]; let currentType='Outros';
  for(const raw of lines){
    const line=motorBookCleanOCRLine(raw); if(line.length<3) continue;
    const hinted=motorBookInferType(line,'');
    if(hinted) currentType=hinted;
    if(motorBookLooksLikeHeading(line) && !hinted) currentType=line.replace(/[.:]+$/,'').slice(0,80);
    const refs=motorBookReferenceCandidates(line); if(!refs.length) continue;
    const brand=motorBookFindBrand(line);
    const typeName=motorBookInferType(line,currentType||'Outros');
    const desc=motorBookDescription(line,refs,brand,typeName);
    refs.forEach(ref=>found.push({motorId:engine.id,tipoNome:typeName||'Outros',referencia:ref,marca:brand,descricao:desc,observacoes:`Importado automaticamente do Livro · página ${pageNumber}`,sourceBook:engine.livroMotorNome||'',sourceBookPage:pageNumber}));
  }
  return found;
}
async function motorBookExtractPieces(engine,pages){
  const all=[];
  for(let i=0;i<pages.length;i++){
    const page=pages[i];
    let lines=motorBookTextLines(page);
    const images=[...page.querySelectorAll('img')];
    if(images.length){
      const ocrLines=[];
      for(const img of images){ const got=await motorBookOCRFullImage(img); ocrLines.push(...got); }
      // Se o Word já tem texto mas o OCR encontrou mais informação, juntamos as duas fontes.
      if(ocrLines.length) lines=[...lines,...ocrLines];
    }
    all.push(...motorBookParseLines(lines,i+1,engine));
  }
  return all;
}
async function motorBookAutoCreatePieces(engine){
  if(!engine || !catalogGuard('add') || !engine.livroMotorUrl) return;
  let pages=getMotorBookPages();
  for(let i=0;i<15 && !pages.length;i++){ await new Promise(r=>setTimeout(r,250)); pages=getMotorBookPages(); }
  if(!pages.length) return toast('O Livro carregou, mas não foi possível preparar a leitura automática.');
  try{
    toast(`🧠 A analisar o Livro do ${engine.nome} e a criar as peças…`);
    const extracted=await motorBookExtractPieces(engine,pages);
    if(!extracted.length) return toast('Não foram encontradas referências suficientes para criar peças.');

    const idx=catalogIndex();
    const typeByKey=new Map(idx.types.map(t=>[catKey(t.nome),t]));
    const usedTypes=new Set(idx.types.map(t=>t.id));
    const ops=[]; const newTypes=[];
    const now=new Date().toISOString();
    const seen=new Set();
    for(const item of extracted){
      let type=typeByKey.get(catKey(item.tipoNome));
      if(!type){
        const typeName=item.tipoNome||'Outros';
        type={id:catNewId('TPC',typeName,usedTypes),nome:typeName,icone:'',createdAt:now};
        typeByKey.set(catKey(typeName),type); newTypes.push(type);
      }
      const key=`${item.motorId}|${type.id}|${catCompact(item.referencia)}|${catKey(item.marca)}`;
      if(seen.has(key)) continue; seen.add(key);
      const dup=state.engineCatalog.find(p=>p.motorId===item.motorId&&p.tipoId===type.id&&catCompact(p.referencia)===catCompact(item.referencia)&&catKey(p.marca)===catKey(item.marca));
      if(dup) continue;
      const row={id:uid('PEC'),motorId:item.motorId,tipoId:type.id,referencia:item.referencia,descricao:item.descricao||'',marca:item.marca||'',observacoes:item.observacoes||'',createdAt:now,sourceBook:item.sourceBook||'',sourceBookPage:item.sourceBookPage||0,autoImported:true};
      state.engineCatalog.push(row); ops.push({key:'engineCatalog',row});
    }
    newTypes.forEach(t=>{state.engineCatalogTypes.push(t);ops.unshift({key:'engineCatalogTypes',row:t});});
    if(!ops.length) return toast('O Livro foi analisado. Não havia peças novas para adicionar.');
    const ok=await catalogCommit(ops,`Catálogo Motor: importação automática do Livro ${engine.livroMotorNome||''}`);
    if(ok){
      catalogUI.motorView='parts'; catalogUI.motorBookAutoImportPending=false; catalogRefreshBody();
      toast(`✅ ${ops.filter(o=>o.key==='engineCatalog').length} peça(s) criada(s) automaticamente. Podes editá-las na lista.`);
    }
  }catch(err){ console.error('Importação automática do Livro:',err); toast('O Livro foi carregado, mas a criação automática das peças falhou.'); }
}

function motorBookPrint(){
  const pages = getMotorBookPages();
  if(!pages.length) return toast('O livro ainda não está carregado.');
  const html = pages.map(p => p.outerHTML).join('');
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if(!win) return toast('O navegador bloqueou a janela de impressão.');
  win.document.write(`<!doctype html><html><head><title>Livro do Motor</title><style>@page{size:A4;margin:0}body{margin:0;background:#fff}section{page-break-after:always!important;margin:0!important;box-shadow:none!important}</style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { try{win.focus(); win.print();}catch{} }, 350);
}

function setupMotorBookViewer(engine){
  const pages = getMotorBookPages();
  if(pages.length){
    motorBookBuildThumbs();
    motorBookShowPage(Math.min(catalogUI.motorBookPage, pages.length - 1), false);
    // v2.9.34: mantém o zoom escolhido depois da abertura inicial.
    motorBookUpdateZoom();
  }

  qsa('[data-book]').forEach(btn => {
    btn.onclick = async e => {
      e.preventDefault();
      e.stopPropagation();
      const act = btn.dataset.book;
      if(act === 'prev') motorBookShowPage(catalogUI.motorBookPage - 1);
      if(act === 'next') motorBookShowPage(catalogUI.motorBookPage + 1);
      if(act === 'zoom-in') {
        catalogUI.motorBookZoom = Math.min(280, Number(catalogUI.motorBookZoom || 100) + 10);
        motorBookUpdateZoom();
      }
      if(act === 'fit-width') motorBookFitWidth();
      if(act === 'zoom-out') {
        catalogUI.motorBookZoom = Math.max(60, Number(catalogUI.motorBookZoom || 100) - 10);
        motorBookUpdateZoom();
      }
      if(act === 'zoom-reset') {
        catalogUI.motorBookZoom = 100;
        motorBookUpdateZoom();
      }
      if(act === 'fullscreen') {
        const target = qs('#cmBookShell');
        if(!target) return;
        const fallback = target.classList.contains('cm-book-fullscreen-fallback');
        if(document.fullscreenElement || fallback){
          try{ if(document.fullscreenElement) await document.exitFullscreen?.(); }catch{}
          target.classList.remove('cm-book-fullscreen-fallback','cm-book-is-fullscreen');
          document.body.classList.remove('cm-book-body-fullscreen');
          return;
        }
        // O modo CSS é o fallback garantido para Edge/PWA/Electron e não depende
        // das permissões do Fullscreen API.
        target.classList.add('cm-book-fullscreen-fallback');
        document.body.classList.add('cm-book-body-fullscreen');
        try{
          if(target.requestFullscreen && !document.fullscreenElement) await target.requestFullscreen();
        }catch(err){
          console.warn('Fullscreen API indisponível; mantendo modo CSS.', err);
        }
        target.classList.add('cm-book-is-fullscreen');
        setTimeout(motorBookUpdateZoom, 80);
      }
      if(act === 'print') motorBookPrint();
    };
  });
  qsa('[data-book-page]').forEach(btn => btn.onclick = () => motorBookShowPage(Number(btn.dataset.bookPage)));

  const search = qs('#cmBookSearch');
  if(search){
    let timer = null;
    search.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => motorBookSearch(search.value), 180);
    };
    search.onkeydown = e => {
      if(e.key === 'Enter'){
        e.preventDefault();
        clearTimeout(timer);
        motorBookSearch(search.value);
      }
      if(e.key === 'Escape'){
        search.value = '';
        clearTimeout(timer);
        motorBookSearch('');
      }
    };
  }

  if(!document.__cmBookFullscreenBound){
    document.__cmBookFullscreenBound = true;
    document.addEventListener('fullscreenchange', () => {
      const shell = qs('#cmBookShell');
      if(shell){
        const active = document.fullscreenElement === shell;
        shell.classList.toggle('cm-book-is-fullscreen', active || shell.classList.contains('cm-book-fullscreen-fallback'));
        document.body.classList.toggle('cm-book-body-fullscreen', active || shell.classList.contains('cm-book-fullscreen-fallback'));
      }
      setTimeout(motorBookUpdateZoom, 80);
    });
  }
}

function motorBookHTML(engine, canEdit){
  if(!engine?.livroMotorUrl) return '';
  return `<section class="cm-book" id="cmBookShell">
    <div class="cm-book-toolbar cm-book-reading-toolbar">
      <div class="cm-book-reading-left">
        <button type="button" class="cm-book-back" data-cm="motor-book-close" title="Voltar ao motor">← <span>${esc(engine.nome)}</span></button>
        <div class="cm-book-file">
          <span class="cm-eyebrow">📖 LIVRO DO MOTOR</span>
          <strong>${esc(engine.livroMotorNome || `Motor ${engine.nome}.docx`)}</strong>
          <span class="cm-book-status">● ${esc(engine.livroMotorUpdatedAt ? new Date(engine.livroMotorUpdatedAt).toLocaleDateString('pt-PT') : 'Word carregado')}</span>
        </div>
      </div>
      <div class="cm-book-actions">
        <button type="button" class="cm-btn small" data-book="print">🖨️ Imprimir</button>
        <a class="cm-btn small" href="${esc(engine.livroMotorUrl)}" target="_blank" rel="noopener" download>📥 Word original</a>
        ${canEdit ? '<button type="button" class="cm-btn small" id="cmUploadMotorBookBtn">📤 Trocar Word</button>' : ''}
        ${canEdit ? '<button type="button" class="cm-btn small cm-danger" data-cm="remove-motor-book">🗑️ Remover</button>' : ''}
      </div>
    </div>
    <div class="cm-book-tools">
      <div class="cm-book-page-tools">
        <button type="button" class="cm-book-icon" data-book="prev" title="Página anterior">←</button>
        <span>Página <b id="cmBookPageCurrent">1</b> / <b id="cmBookPageTotal">—</b></span>
        <button type="button" class="cm-book-icon" data-book="next" title="Página seguinte">→</button>
      </div>
      <div class="cm-book-search"><span>🔎</span><input id="cmBookSearch" type="search" placeholder="Pesquisar no livro…" autocomplete="off"></div>
      <div class="cm-book-page-tools">
        <button type="button" class="cm-book-icon" data-book="zoom-out" title="Diminuir">−</button>
        <button type="button" class="cm-book-zoom" id="cmBookZoomLabel" data-book="zoom-reset">100%</button>
        <button type="button" class="cm-book-icon" data-book="zoom-in" title="Aumentar">+</button>
        <button type="button" class="cm-book-icon cm-book-fit" data-book="fit-width" title="Ajustar à largura">↔</button>
        <button type="button" class="cm-book-icon" data-book="fullscreen" title="Ecrã inteiro">⛶</button>
      </div>
    </div>
    <div class="cm-book-workspace">
      <aside class="cm-book-thumbs"><div class="cm-book-thumbs-title">Páginas</div><div id="cmBookThumbs"></div></aside>
      <div id="cmMotorBookViewer" class="cm-book-viewer"></div>
    </div>
  </section>`;
}

function catalogoMotor(){
  if(!catalogReady() && !catalogUI.failed) return catalogLoadingCard();
  if(catalogReady()) catalogMigrateLegacy();
  const idx = catalogIndex();
  catalogFixSelection(idx);
  syncMotorBookReadingMode();
  const canAdd = catalogCan('add');
  const canImport = catalogCan('import');
  const canExport = catalogCan('export');
  const motorMode = Boolean(catalogUI.motorOpen && catalogUI.motorId && idx.engineById.has(catalogUI.motorId) && !String(catalogUI.q || '').trim());
  if(!motorMode && catalogUI.motorFocus){ catalogUI.motorFocus=false; document.body.classList.remove('cm-motor-focus'); }
  const shell = motorMode ? `<div id="cmMotorModeHead">${catalogMotorWorkspaceHTML(idx, canAdd, canImport, canExport)}</div>` : `<section class="cm-hero">
      <div class="cm-hero-top">
        <div class="cm-hero-copy">
          <span class="cm-eyebrow">📚 CATÁLOGO MOTOR</span>
          <h3>Material de motor</h3>
          <p>Motor → Tipo de peça → Peças. Pesquisa tudo de uma vez por referência, descrição, marca ou motor.</p>
        </div>
        <div class="cm-stats">
          <div><b>${idx.engines.length}</b><span>Motores</span></div>
          <div><b>${idx.types.length}</b><span>Tipos</span></div>
          <div><b>${idx.all.length}</b><span>Peças</span></div>
        </div>
      </div>
      <div class="cm-search">
        <span class="cm-search-ico">🔎</span>
        <input id="cmSearch" class="cm-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Pesquisar referência, descrição, marca ou motor…" value="${esc(catalogUI.q)}">
        <button type="button" class="cm-clear ${catalogUI.q ? '' : 'cm-hide'}" data-cm="clear-search" aria-label="Limpar pesquisa">✕</button>
      </div>
      <div class="cm-actions">
        ${canAdd ? '<button class="cm-btn cm-btn-main" type="button" data-cm="piece-new">➕ Nova peça</button>' : ''}
        ${canAdd ? '<button class="cm-btn" type="button" data-cm="engine-new">🚗 Novo motor</button>' : ''}
        <button class="cm-btn" type="button" data-cm="type-manage">🏷️ Tipos de peça</button>
        ${canImport ? '<button class="cm-btn" type="button" data-cm="import-motor-spec" style="background:#0284c7; color:white; border:0;">📥 Importar para este Motor</button>' : ''}
        ${canExport ? '<button class="cm-btn" type="button" data-cm="export-motor-spec" style="background:#0f766e; color:white; border:0;">📤 Exportar este Motor</button>' : ''}
        ${isAdminMaster() ? '<button class="cm-btn cm-btn-danger" type="button" id="cmDeleteAllEnginesBtn" style="background:#ef4444; color:white; border:0;">🗑️ Apagar tudo</button>' : ''}
      </div>
    </section>`;
  return `<div class="cm-page" id="cmPage">
    <style>
      .cm-page .table-wrap,.cm-page table,.cm-page .card tbody,.cm-page .catalogo-type-card table{display:none!important}
      .cm-page .cm-aberto + .table-wrap,.cm-page .cm-aberto table{display:table!important}
    </style>
    ${catalogErrorBanner()}
    ${shell}
    <div id="motorMainWrapper"><div id="cmBody">${catalogBodyHTML(idx)}</div></div>
    <input class="hidden" id="cmExcelInput" type="file" accept=".xlsx,.xls,.csv,.tsv">
    <input class="hidden" id="cmMotorSpecExcelInput" type="file" accept=".xlsx,.xls,.csv,.tsv">
    <input id="cmMotorBookInput" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-hidden="true" tabindex="-1" style="position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;">
  </div>`;
}

function catalogMotorWorkspaceHTML(idx, canAdd, canImport, canExport){
  const engine = idx.engineById.get(catalogUI.motorId);
  if(!engine) return '';
  const pos = Math.max(0, idx.engines.findIndex(e => e.id === engine.id));
  const prev = idx.engines[pos - 1], next = idx.engines[pos + 1];
  const picker = catalogUI.motorPickerOpen ? `<div class="cm-motor-picker-panel">
      <div class="cm-motor-picker-search"><span>🔎</span><input id="cmMotorPickerSearch" type="search" placeholder="Procurar motor…" value="${esc(catalogUI.motorPickerQ || '')}" autocomplete="off"></div>
      <div class="cm-motor-picker-list">${idx.engines.filter(e => !catalogUI.motorPickerQ || catNorm(e.nome).includes(catNorm(catalogUI.motorPickerQ))).slice(0,120).map(e => `<button type="button" class="cm-motor-picker-item ${e.id===engine.id?'active':''}" data-cm="motor-pick" data-id="${esc(e.id)}"><span>🚗 ${esc(e.nome)}</span><small>${idx.engineCount.get(e.id)||0} peças</small></button>`).join('') || '<div class="cm-motor-picker-empty">Nenhum motor encontrado.</div>'}</div>
    </div>` : '';
  const catalogPanel = catalogUI.catalogPanelOpen ? `<div class="cm-catalog-popover" data-catalog-popover>
      <div class="cm-catalog-popover-head"><div><strong>📚 Catálogo Motor</strong><small>Ferramentas do catálogo</small></div><button type="button" class="cm-catalog-close" data-cm="catalog-panel-toggle" aria-label="Fechar catálogo">✕</button></div>
      <div class="cm-catalog-popover-search"><span>🔎</span><input id="cmSearch" class="cm-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Pesquisar referência, descrição, marca ou motor…" value="${esc(catalogUI.q)}"><button type="button" class="cm-clear ${catalogUI.q ? '' : 'cm-hide'}" data-cm="clear-search" aria-label="Limpar pesquisa">✕</button></div>
      <div class="cm-catalog-popover-actions">
        ${canAdd ? '<button class="cm-btn cm-btn-main" type="button" data-cm="piece-new">➕ Nova peça</button>' : ''}
        ${canAdd ? '<button class="cm-btn" type="button" data-cm="engine-new">🚗 Novo motor</button>' : ''}
        <button class="cm-btn" type="button" data-cm="type-manage">🏷️ Tipos de peça</button>
        ${canImport ? '<button class="cm-btn" type="button" data-cm="import-motor-spec" style="background:#0284c7; color:white; border:0;">📥 Importar</button>' : ''}
        ${canExport ? '<button class="cm-btn" type="button" data-cm="export-motor-spec" style="background:#0f766e; color:white; border:0;">📤 Exportar</button>' : ''}
        ${isAdminMaster() ? '<button class="cm-btn cm-btn-danger" type="button" id="cmDeleteAllEnginesBtn" data-cm="delete-all-engines" style="background:#ef4444; color:white; border:0;">🗑️ Apagar tudo</button>' : ''}
      </div>
    </div>` : '';
  return `<div class="cm-motor-mode-head">
    <div class="cm-motor-mode-left">
      <button type="button" class="cm-btn small" data-cm="motor-back">← Catálogo</button>
      <button type="button" class="cm-motor-nav" data-cm="motor-prev" ${prev?'':'disabled'} title="Motor anterior">‹</button>
      <button type="button" class="cm-motor-current" data-cm="motor-picker-toggle"><span>🚗</span><strong>${esc(engine.nome)}</strong><small>${pos+1} / ${idx.engines.length}</small></button>
      <button type="button" class="cm-motor-nav" data-cm="motor-next" ${next?'':'disabled'} title="Motor seguinte">›</button>
      ${picker}
    </div>
    <div class="cm-motor-mode-actions">
      <button type="button" class="cm-btn small cm-catalog-trigger" data-cm="catalog-panel-toggle">📚 Catálogo</button>
      ${canAdd ? `<button type="button" class="cm-btn small cm-btn-main" data-cm="piece-new" data-motor="${esc(engine.id)}">➕ Peça</button>` : ''}
      ${canImport ? '<button type="button" class="cm-btn small" data-cm="import-motor-spec">📥 Importar</button>' : ''}
      ${canExport ? '<button type="button" class="cm-btn small" data-cm="export-motor-spec">📤 Exportar</button>' : ''}
      <button type="button" class="cm-btn small" data-cm="motor-focus">⛶ ${catalogUI.motorFocus?'Sair do foco':'Modo foco'}</button>
    </div>
    ${catalogPanel}
  </div>`;
}

function catalogBodyHTML(idx){
  let html;
  if(String(catalogUI.q || '').trim()) html = catalogSearchHTML(idx, catalogUI.q);
  else if(catalogUI.motorOpen && catalogUI.motorId) {
    const engine = idx.engineById.get(catalogUI.motorId);
    html = engine ? catalogEnginePanel(idx, engine) : catalogBrowseHTML(idx);
  } else html = catalogBrowseHTML(idx);
  if (html) {
    html = html.replace(/class="table-wrap"/g, 'class="table-wrap" style="display: none;" hidden');
    html = html.replace(/<table/g, '<table style="display: none;" hidden');
  }
  return html;
}

function syncMotorBookReadingMode(){
  const idx = catalogIndex();
  const engine = idx.engineById.get(catalogUI.motorId);
  const active = Boolean(catalogUI.motorOpen && catalogUI.motorView === 'book' && engine?.livroMotorUrl);
  document.body.classList.toggle('cm-book-reading-mode', active);
  if(!active) document.body.classList.remove('cm-book-reader-fullscreen');
  return active;
}

function setMotorViewForEngine(engine, resetBook=true){
  if(engine?.livroMotorUrl){
    catalogUI.motorView = 'book';
    if(resetBook){
      catalogUI.motorBookPage = 0;
      catalogUI.motorBookZoom = 100;
      catalogUI.motorBookSearch = '';
    }
  }else{
    catalogUI.motorView = 'parts';
    catalogUI.motorBookPage = 0;
    catalogUI.motorBookSearch = '';
  }
}

function catalogRefreshBody(){
  syncMotorBookReadingMode();
  const box = qs('#cmBody'); if(!box) return;
  const page = qs('#cmPage');
  document.body.classList.toggle('cm-motor-focus', Boolean(catalogUI.motorFocus && catalogUI.motorOpen));
  const idx = catalogIndex();
  catalogFixSelection(idx);
  const motorMode = Boolean(catalogUI.motorOpen && catalogUI.motorId && idx.engineById.has(catalogUI.motorId) && !String(catalogUI.q || '').trim());

  // v2.9.28: quando se abre um motor depois de a página do catálogo já estar
  // renderizada, o "hero" do catálogo antigo não era removido. Isso fazia
  // parecer que a gaveta não funcionava e roubava espaço ao Livro.
  if(page){
    page.classList.toggle('cm-motor-mode', motorMode);
    const hero = page.querySelector('.cm-hero');
    if(hero) hero.style.display = motorMode ? 'none' : '';
  }

  const head = qs('#cmMotorModeHead');
  if(motorMode){
    const canAdd=catalogCan('add'), canImport=catalogCan('import'), canExport=catalogCan('export');
    if(head) head.innerHTML = catalogMotorWorkspaceHTML(idx, canAdd, canImport, canExport);
    else { const wrap=qs('#motorMainWrapper'); if(wrap) wrap.insertAdjacentHTML('beforebegin', `<div id="cmMotorModeHead">${catalogMotorWorkspaceHTML(idx,canAdd,canImport,canExport)}</div>`); }
  } else if(head) head.remove();
  box.innerHTML = catalogBodyHTML(idx);
  const engine = idx.engineById.get(catalogUI.motorId);
  const input = qs('#cmMotorBookInput');
  if(input) input.value = '';
  const uploadBtn = qs('#cmUploadMotorBookBtn');
  if(uploadBtn && engine) uploadBtn.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openMotorBookPicker(engine);
  };
  if(engine?.livroMotorUrl) {
    setTimeout(() => renderMotorBook(engine), 0);
  }
}

function catalogBrowseHTML(idx){
  if(!idx.engines.length){
    return `<div class="cm-empty"><div class="cm-empty-ico">🚗</div><h4>Ainda não há motores no catálogo</h4><p>Cria o primeiro motor ou importa o teu catálogo a partir de Excel.</p><div class="cm-actions center">${catalogCan('add') ? '<button class="cm-btn cm-btn-main" type="button" data-cm="engine-new">🚗 Criar motor</button>' : ''}${catalogCan('import') ? '<button class="cm-btn" type="button" data-cm="import">📥 Importar Excel</button>' : ''}</div></div>`;
  }
  const engineButtonsHTML = idx.engines.map(e => {
    const engineCount = idx.engineCount.get(e.id) || 0;
    return `<button type="button" class="cm-engine" data-cm="engine-select" data-id="${esc(e.id)}" data-key="${esc(catNorm(e.nome))}"><span class="cm-engine-name">${esc(e.nome)}</span><span class="cm-engine-meta">${engineCount}</span></button>`;
  }).join('');
  return `<div class="cm-layout cm-engine-browser">
    <aside class="cm-side"><div class="cm-side-head"><strong>🚗 Motores</strong><span class="cm-count">${idx.engines.length}</span></div>${idx.engines.length > 8 ? '<input class="cm-side-filter" data-cm-input="engine-filter" placeholder="Filtrar motores…" autocomplete="off">' : ''}<div class="cm-engine-list">${engineButtonsHTML}</div></aside>
    <section class="cm-main cm-engine-empty-state"><div class="cm-empty"><div class="cm-empty-ico">🚗</div><h4>Escolhe um motor</h4><p>Ao abrir um motor, a lista lateral desaparece para dar o máximo de espaço ao conteúdo.</p></div></section>
  </div>`;
}

function catalogEnginePanel(idx, engine){
  if(!engine) return '';
  const typeMap = idx.byEngine.get(engine.id) || new Map();
  const typeIds = [...typeMap.keys()].sort((a,b) => catCollate(idx.typeById.get(a)?.nome, idx.typeById.get(b)?.nome));
  const total = idx.engineCount.get(engine.id) || 0;
  const canAdd = catalogCan('add'), canEdit = catalogCan('edit'), canDel = catalogCan('delete');
  if(!catalogUI.motorView) catalogUI.motorView = engine.livroMotorUrl ? 'book' : 'parts';
  if(catalogUI.motorView === 'book' && !engine.livroMotorUrl) catalogUI.motorView = 'parts';
  const view = catalogUI.motorView;
  const tab = (name,label,icon) => `<button type="button" class="cm-motor-tab ${view===name?'active':''}" data-cm="motor-view" data-view="${name}">${icon} ${label}</button>`;
  const info = `<div class="cm-motor-info-panel">
    <div class="cm-info-grid">
      <div><span>Motor</span><strong>${esc(engine.nome)}</strong></div>
      <div><span>Tipos de peça</span><strong>${typeIds.length}</strong></div>
      <div><span>Peças registadas</span><strong>${total}</strong></div>
      <div><span>Livro</span><strong>${engine.livroMotorNome ? esc(engine.livroMotorNome) : 'Ainda não carregado'}</strong></div>
    </div>
    ${engine.observacoes ? `<div class="cm-info-note">${esc(engine.observacoes)}</div>` : '<div class="cm-info-note muted">Sem observações registadas para este motor.</div>'}
  </div>`;
  const book = engine.livroMotorUrl ? motorBookHTML(engine, canEdit) : `<div class="cm-empty cm-book-empty"><div class="cm-empty-ico">📖</div><h4>Este motor ainda não tem Livro</h4><p>Carrega o Word deste motor para o abrir aqui como um dossier técnico.</p>${canEdit ? `<button type="button" class="cm-btn cm-btn-main" data-cm="motor-book-upload" data-id="${esc(engine.id)}">📤 Carregar Word</button>` : ''}</div>`;
  const parts = catalogMotorPartsHTML(idx, engine, typeMap, typeIds, total, canAdd, canEdit, canDel);
  return `<div class="cm-engine-card">
      <div class="cm-engine-title">
        <div><span class="cm-eyebrow">MOTOR</span><h3>🚗 ${esc(engine.nome)}</h3>${engine.observacoes ? `<p class="cm-notes">${esc(engine.observacoes)}</p>` : ''}<span class="cm-engine-sub">${typeIds.length} tipo(s) de peça · ${total} peça(s)</span></div>
        <div class="cm-engine-actions">
          ${canEdit ? `<button type="button" class="cm-btn small" data-cm="motor-book-upload" data-id="${esc(engine.id)}">📤 ${engine.livroMotorUrl ? 'Trocar Word' : 'Carregar Word'}</button>` : ''}
          ${canAdd ? `<button class="cm-btn small" type="button" data-cm="piece-new" data-motor="${esc(engine.id)}">➕ Peça</button>` : ''}
          ${canEdit ? `<button class="cm-btn small" type="button" data-cm="engine-edit" data-id="${esc(engine.id)}">✏️ Editar</button>` : ''}
          ${canDel ? `<button class="cm-btn small cm-danger" type="button" data-cm="engine-del" data-id="${esc(engine.id)}">🗑️</button>` : ''}
        </div>
      </div>
      <div class="cm-motor-tabs">${engine.livroMotorUrl ? tab('book','Livro do Motor','📖') : ''}${tab('parts','Peças (lista)','🧩')}${tab('info','Informações','ⓘ')}</div>
      ${view==='book' ? book : view==='info' ? info : parts}
    </div>`;
}

function catalogMotorPartsHTML(idx, engine, typeMap, typeIds, total, canAdd, canEdit, canDel){
  const shown = catalogUI.tipoId ? typeIds.filter(id => id === catalogUI.tipoId) : typeIds;
  return `<div class="cm-motor-parts">
    <div class="cm-motor-search">
      <span class="cm-motor-search-ico">🔎</span><input id="cmMotorSearch" class="cm-motor-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Pesquisar neste motor por referência, peça, marca ou tipo…" value="${esc(catalogUI.motorQ || '')}">
      ${catalogUI.motorQ ? '<button type="button" class="cm-motor-search-clear" data-cm="clear-motor-search" title="Limpar pesquisa">✕</button>' : ''}
    </div>
    <div class="cm-collapse-actions"><button type="button" class="cm-collapse-btn" data-cm="motor-open-all">↕ Abrir todos</button><button type="button" class="cm-collapse-btn" data-cm="motor-close-all">↕ Fechar todos</button></div>
    ${catalogUI.motorQ ? `<div class="cm-motor-search-info">🔎 ${motorSearchCount(idx, engine, typeMap)} resultado(s) neste motor</div>` : ''}
    ${!typeIds.length ? `<div class="cm-empty small"><div class="cm-empty-ico">🧩</div><h4>Este motor ainda não tem peças</h4>${canAdd ? `<button type="button" class="cm-btn cm-btn-main" data-cm="piece-new" data-motor="${esc(engine.id)}">➕ Adicionar a primeira peça</button>` : ''}</div>` : (() => {
      const motorQuery = String(catalogUI.motorQ || '').trim();
      const tokens = catNorm(motorQuery).split(' ').filter(Boolean);
      const filteredIds = motorQuery ? typeIds.filter(id => { const t=idx.typeById.get(id), pieces=typeMap.get(id)||[]; const typeMatch=tokens.length && tokens.every(tok=>catNorm(t?.nome).includes(tok)); if(typeMatch)return true; return pieces.some(p=>catalogPieceMatchesQuery(p,t,tokens)); }) : shown;
      if(motorQuery && !filteredIds.length) return `<div class="cm-empty small"><div class="cm-empty-ico">🔎</div><h4>Nenhum resultado neste motor</h4><p>Tenta outra referência, descrição, marca ou tipo de peça.</p></div>`;
      return filteredIds.map(id => { const t=idx.typeById.get(id), pieces=typeMap.get(id)||[]; let visiblePieces=pieces; if(motorQuery && !tokens.every(tok=>catNorm(t?.nome).includes(tok))) visiblePieces=pieces.filter(p=>catalogPieceMatchesQuery(p,t,tokens)); return catalogTypeSection(t,visiblePieces,engine,canAdd,canEdit,canDel,motorQuery,Boolean(motorQuery)); }).join('');
    })()}
  </div>`;
}

function catalogTypeSection(type, pieces, engine, canAdd, canEdit, canDel, searchQuery = '', openOnSearch = false){
  openOnSearch = Boolean(String(searchQuery || '').trim()) && openOnSearch;
  const motorIdEsc = esc(engine.id);
  const tipoIdEsc = esc(type.id);
  const rx = searchQuery ? catTokenRegex(catNorm(searchQuery).split(' ').filter(Boolean)) : null;

  return `<details class="cm-type" ${openOnSearch ? 'open' : ''}>
    <summary aria-label="Abrir ou fechar ${esc(type.nome)}">
      <span class="cm-type-ico">${catTypeIcon(type)}</span>
      <span class="cm-type-name">${searchQuery ? catHilite(type.nome, rx) : esc(type.nome)}</span>
      <span class="cm-pill">${pieces.length}</span>
      <span class="cm-type-actions">
        ${canAdd ? `<button type="button" class="cm-mini" data-cm="piece-new" data-motor="${motorIdEsc}" data-tipo="${tipoIdEsc}" title="Adicionar peça a este tipo">➕ Peça</button>` : ''}
      </span>
    </summary>
    <div class="cm-parts">
      <div class="cm-row cm-row-head"><div>Referência</div><div>Descrição</div><div>Marca</div><div>Observações</div><div></div></div>
      ${pieces.map(p => catalogPartRow(p, rx, canEdit, canDel)).join('')}
    </div>
  </details>`;
}

function catalogPieceMatchesQuery(p, type, tokens){
  const hay = catNorm([
    type?.nome || '',
    p?.referencia || '',
    p?.descricao || '',
    p?.marca || '',
    p?.observacoes || ''
  ].join(' '));
  const ref = catCompact(p?.referencia || '');
  return tokens.every(tok => {
    if(hay.includes(tok)) return true;
    const compact = catCompact(tok);
    return compact.length >= 2 && ref.includes(compact);
  });
}

function motorSearchCount(idx, engine, typeMap){
  const q = String(catalogUI.motorQ || '').trim();
  if(!q) return idx.engineCount.get(engine.id) || 0;
  const tokens = catNorm(q).split(' ').filter(Boolean);
  let count = 0;
  typeMap.forEach((pieces, typeId) => {
    const type = idx.typeById.get(typeId);
    const typeMatch = tokens.length && tokens.every(tok => catNorm(type?.nome).includes(tok));
    count += typeMatch ? pieces.length : pieces.filter(p => catalogPieceMatchesQuery(p, type, tokens)).length;
  });
  return count;
}

function catalogPartRow(p, rx, canEdit, canDel){
  const dash = '<span class="cm-dash">—</span>';
  return `<div class="cm-row">
    <div class="cm-cell cm-ref" data-label="Referência"><code>${catHilite(p.referencia, rx)}</code><button type="button" class="cm-copy" data-cm="copy" data-text="${esc(p.referencia)}" title="Copiar referência">⧉</button></div>
    <div class="cm-cell" data-label="Descrição">${p.descricao ? catHilite(p.descricao, rx) : dash}</div>
    <div class="cm-cell" data-label="Marca">${p.marca ? `<span class="cm-brand">${catHilite(p.marca, rx)}</span>` : dash}</div>
    <div class="cm-cell cm-obs" data-label="Observações">${p.observacoes ? catHilite(p.observacoes, rx) : dash}</div>
    <div class="cm-cell cm-row-actions">
      ${canEdit ? `<button type="button" class="cm-icon" data-cm="piece-edit" data-id="${esc(p.id)}" title="Editar">✏️</button>` : ''}
      ${canDel ? `<button type="button" class="cm-icon" data-cm="piece-del" data-id="${esc(p.id)}" title="Apagar">🗑️</button>` : ''}
    </div>
  </div>`;
}

/* ---------- Pesquisa global ---------- */
function catTokenRegex(tokens){
  const map = { a:'aàáâãäå', e:'eèéêë', i:'iìíîï', o:'oòóôõö', u:'uùúûü', c:'cç', n:'nñ' };
  const parts = tokens.map(t => [...t].map(ch => map[ch] ? `[${map[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(''));
  return parts.length ? new RegExp(parts.join('|'), 'gi') : null;
}
function catHilite(text, rx){
  const s = String(text ?? '');
  if(!rx || !s) return esc(s);
  rx.lastIndex = 0;
  let out = '', last = 0, m;
  while((m = rx.exec(s))){
    if(m[0] === ''){ rx.lastIndex++; continue; }
    out += esc(s.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}
function catalogHay(item){
  const { p, e, t } = item;
  const sig = [e.nome, e.observacoes, t.nome, p.referencia, p.descricao, p.marca, p.observacoes].join('\u0001');
  const cached = catalogSearchCache.get(p);
  if(cached && cached.sig === sig) return cached;
  const entry = { sig, hay:catNorm(sig.replace(/\u0001/g, ' ')), ref:catCompact(p.referencia) };
  catalogSearchCache.set(p, entry);
  return entry;
}
function catalogSearchRows(idx, q){
  const tokens = catNorm(q).split(' ').filter(Boolean);
  if(!tokens.length) return { tokens, rows:[] };
  const qc = catCompact(q);
  const rows = [];
  idx.all.forEach(item => {
    const h = catalogHay(item);
    const ok = tokens.every(tok => {
      if(h.hay.includes(tok)) return true;
      const tc = catCompact(tok);
      return tc.length >= 3 && h.ref.includes(tc);
    });
    if(!ok) return;
    let rank = 3;
    if(qc && h.ref === qc) rank = 0; else if(qc && h.ref.startsWith(qc)) rank = 1; else if(qc && h.ref.includes(qc)) rank = 2;
    rows.push({ ...item, rank });
  });
  rows.sort((a,b) => a.rank - b.rank || catCollate(a.e.nome, b.e.nome) || catCollate(a.t.nome, b.t.nome) || catCollate(a.p.referencia, b.p.referencia));
  return { tokens, rows };
}

function catalogSearchHTML(idx, q){
  const { tokens, rows } = catalogSearchRows(idx, q);
  const rx = catTokenRegex(tokens);
  const canEdit = catalogCan('edit'), canDel = catalogCan('delete');
  const engineHits = idx.engines.filter(e => { const h = catNorm(`${e.nome} ${e.observacoes || ''}`); return tokens.every(t => h.includes(t)); }).slice(0, 12);
  const shown = rows.slice(0, catalogUI.limit);
  
  const engineHitsHTML = engineHits.map(e => {
    const eId = esc(e.id);
    const eNomeHilite = catHilite(e.nome, rx);
    const eCount = idx.engineCount.get(e.id) || 0;
    return `<button type="button" class="cm-chip" data-cm="open" data-motor="${eId}">${eNomeHilite} <b>${eCount}</b></button>`;
  }).join('');

  const resultsHTML = shown.map(({ p, e, t }) => {
    const pRefHilite = catHilite(p.referencia, rx);
    const pRefEsc = esc(p.referencia);
    const pIdEsc = esc(p.id);
    const eIdEsc = esc(e.id);
    const tIdEsc = esc(t.id);
    const eNomeHilite = catHilite(e.nome, rx);
    const tNomeHilite = catHilite(t.nome, rx);
    const tIcon = catTypeIcon(t);
    const descHTML = p.descricao ? `<div class="cm-result-desc">${catHilite(p.descricao, rx)}</div>` : '';
    const brandHTML = p.marca ? `<span class="cm-brand">${catHilite(p.marca, rx)}</span>` : '';
    const obsHTML = p.observacoes ? `<span class="cm-obs">${catHilite(p.observacoes, rx)}</span>` : '';

    const editButton = canEdit ? `<button type="button" class="cm-icon" data-cm="piece-edit" data-id="${pIdEsc}" title="Editar">✏️</button>` : '';
    const delButton = canDel ? `<button type="button" class="cm-icon" data-cm="piece-del" data-id="${pIdEsc}" title="Apagar">🗑️</button>` : '';

    return `<article class="cm-result">
      <div class="cm-result-top">
        <div class="cm-ref"><code>${pRefHilite}</code><button type="button" class="cm-copy" data-cm="copy" data-text="${pRefEsc}" title="Copiar referência">⧉</button></div>
        <div class="cm-crumbs">
          <button type="button" class="cm-crumb" data-cm="open" data-motor="${eIdEsc}">🚗 ${eNomeHilite}</button>
          <span>›</span>
          <button type="button" class="cm-crumb" data-cm="open" data-motor="${eIdEsc}" data-tipo="${tIdEsc}">${tIcon} ${tNomeHilite}</button>
        </div>
        <div class="cm-row-actions">
          ${editButton}
          ${delButton}
        </div>
      </div>
      ${descHTML}
      <div class="cm-result-meta">${brandHTML}${obsHTML}</div>
    </article>`;
  }).join('');

  return `<div class="cm-results">
    <div class="cm-results-head"><strong>${rows.length} resultado(s)</strong><span class="muted">para «${esc(q.trim())}»</span></div>
    ${engineHits.length ? `<div class="cm-engine-hits"><span>🚗 Motores:</span>${engineHitsHTML}</div>` : ''}
    ${!rows.length ? '<div class="cm-empty small"><div class="cm-empty-ico">🔍</div><h4>Sem resultados</h4><p>Tenta com menos palavras ou só parte da referência.</p></div>' : ''}
    ${resultsHTML}
    ${rows.length > shown.length ? `<div class="cm-more"><button type="button" class="cm-btn" data-cm="more">Mostrar mais (${rows.length - shown.length})</button></div>` : ''}
  </div>`;
}

function openDeleteAllEnginesModal() {
  if(!isAdminMaster()) return toast('Só o Admin Master pode apagar todos os motores.');
  const total = (state.engineCatalogEngines || []).length;
  if(!total) return toast('Não existem motores no catálogo para apagar.');
  
  openModal('⚠️ Limpar Catálogo Completo', `<div class="danger-confirm-box" style="padding:15px; background:#fef2f2; border-left:4px solid #ef4444; margin-bottom:15px; border-radius:4px;">
    <div style="font-size:1.1rem; color:#991b1b; font-weight:bold; margin-bottom:6px;">Esta ação vai apagar os ${total} motores e TODAS as suas peças associadas!</div>
    <p class="muted" style="margin:0;">Os tipos de peças (categorias) vão continuar guardados. Para confirmar o wipe total do catálogo, escreve exatamente o código de segurança abaixo:</p>
    <code style="display:block; margin:10px 0; padding:8px; background:#fee2e2; color:#b91c1c; font-weight:bold; font-size:1.2rem; text-align:center; border-radius:4px; border:1px solid #fca5a5;">APAGAR CATALOGO</code>
  </div>
  <form id="deleteAllEnginesForm" class="form-grid">
    <input class="field span3" name="confirmText" placeholder="Escreve APAGAR CATALOGO" autocomplete="off" required>
    <label class="checkline span3"><input type="checkbox" name="confirmCheck" required> Confirmo que quero limpar todas as referências de motores de forma irreversível.</label>
    <div class="span3 actions" style="display:flex; gap:10px; justify-content:flex-end; margin-top:10px;">
      <button class="btn ghost" type="button" data-close-del-modal>Cancelar</button>
      <button class="btn danger" type="submit">Wipe Definitivo</button>
    </div>
  </form>`);

  qs('#deleteAllEnginesForm [data-close-del-modal]')?.addEventListener('click', closeModal);
  qs('#deleteAllEnginesForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if(String(data.confirmText || '').trim() !== 'APAGAR CATALOGO') return toast('Código de confirmação incorreto.');
    
    const ops = [];
    // Prepara remoção em lote de todos os motores
    state.engineCatalogEngines.forEach(eng => ops.push({ key:'engineCatalogEngines', id: eng.id, del: true }));
    // Prepara remoção em lote de todas as peças associadas a esses motores
    state.engineCatalog.forEach(pc => ops.push({ key:'engineCatalog', id: pc.id, del: true }));

    // Limpa os estados locais
    state.engineCatalogEngines = [];
    state.engineCatalog = [];
    catalogUI.motorId = '';
    catalogUI.tipoId = '';

    closeModal();
    renderPage(CATALOG_PAGE);

    const ok = await catalogCommit(ops, 'Wipe Total do Catálogo de Motores executado por Admin');
    if(ok) toast('O catálogo de motores foi totalmente limpo.');
  });
}


/* ---------- Eventos ---------- */
function bindCatalogoMotor(){
  const root = qs('#cmPage'); if(!root) return;
  root.addEventListener('click', catalogOnClick);
  root.addEventListener('input', catalogOnInput);
  
  qs('#cmExcelInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if(file) catalogImportFile(file);
  });

  // ESCUTA O INPUT DO EXCEL DO MOTOR SELECIONADO
  qs('#cmMotorSpecExcelInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if(file) catalogImportSpecificEngineFile(file);
  });

  document.querySelector('.nav-btn[data-page="catalogo-motor"]')?.addEventListener('click', (e) => {
    if (currentPage === 'catalogo-motor') {
      e.preventDefault();
      const wrapper = document.getElementById('motorMainWrapper');
      if (wrapper) {
        wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
      }
    }
  });

  qs('#cmDeleteAllEnginesBtn')?.addEventListener('click', openDeleteAllEnginesModal);
}

function catalogOnInput(ev){
  const t = ev.target;
  if(t.id === 'cmSearch'){
    clearTimeout(catalogUI.searchTimer);
    catalogUI.searchTimer = setTimeout(() => {
      catalogUI.q = t.value; catalogUI.limit = 60;
      qs('.cm-clear')?.classList.toggle('cm-hide', !t.value);
      catalogRefreshBody();
    }, 140);
  } else if(t.dataset?.cmInput === 'engine-filter'){
    const k = catNorm(t.value);
    qsa('.cm-engine').forEach(b => b.classList.toggle('cm-hide', Boolean(k) && !b.dataset.key.includes(k)));
  } else if(t.id === 'cmMotorPickerSearch'){
    clearTimeout(catalogUI.motorPickerTimer);
    catalogUI.motorPickerTimer = setTimeout(() => { catalogUI.motorPickerQ = t.value; catalogRefreshBody(); const input=qs('#cmMotorPickerSearch'); if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);} }, 80);
  } else if(t.id === 'cmMotorSearch'){
    clearTimeout(catalogUI.motorSearchTimer);
    catalogUI.motorSearchTimer = setTimeout(() => {
      catalogUI.motorQ = t.value;
      catalogUI.tipoId = '';
      catalogRefreshBody();
      const input = qs('#cmMotorSearch');
      if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 120);
  }
}

function catalogOnClick(e) {
  const anyEngineBtn = e.target.closest('.cm-engine');
  if(anyEngineBtn){
    e.preventDefault();
    catalogUI.motorId = anyEngineBtn.dataset.id || '';
    catalogUI.motorOpen = true;
    catalogUI.motorFocus = false;
    catalogUI.motorPickerOpen = false;
    catalogUI.catalogPanelOpen = false;
    catalogUI.tipoId = '';
    catalogUI.motorQ = '';
    catalogUI.q = '';
    setMotorViewForEngine(catalogIndex().engineById.get(catalogUI.motorId));
    catalogRefreshBody();
    return;
  }

  // COMPORTAMENTO VERDE: Cliques reativos nativos da tag <details>.
  // O botão "➕ Peça" dentro do cabeçalho deve executar a ação sem fechar/abrir o sistema.
  const typeAction = e.target.closest('.cm-type summary [data-cm]');
  if (typeAction) {
    return;
  }
  const typeSummary = e.target.closest('.cm-type summary');
  if (typeSummary) {
    return;
  }

  // AÇÕES NATIVAS DO DATA-CM
  const btn = e.target.closest('[data-cm]');
  if(!btn) return;
  const act = btn.dataset.cm;
  
  if(act === 'open' && btn.dataset.motor){
    e.preventDefault();
    catalogUI.motorId = btn.dataset.motor; catalogUI.motorOpen = true; catalogUI.motorFocus = false; catalogUI.motorPickerOpen = false; catalogUI.motorQ = ''; catalogUI.q = '';
    if(btn.dataset.tipo) catalogUI.tipoId = btn.dataset.tipo; else catalogUI.tipoId = '';
    setMotorViewForEngine(catalogIndex().engineById.get(catalogUI.motorId));
    catalogRefreshBody();
    return;
  }
  if(act === 'catalog-panel-toggle'){
    e.preventDefault();
    catalogUI.catalogPanelOpen = !catalogUI.catalogPanelOpen;
    catalogRefreshBody();
    return;
  }
  if(catalogUI.catalogPanelOpen && !e.target.closest('[data-catalog-popover]') && !e.target.closest('[data-cm="catalog-panel-toggle"]')){
    catalogUI.catalogPanelOpen = false;
    catalogRefreshBody();
    return;
  }
  if(act === 'delete-all-engines'){
    e.preventDefault();
    openDeleteAllEnginesModal();
    return;
  }
  if(act === 'motor-back'){
    e.preventDefault();
    catalogUI.motorOpen = false; catalogUI.motorFocus = false; catalogUI.motorPickerOpen = false; catalogUI.catalogPanelOpen = false; catalogUI.motorQ = ''; catalogUI.tipoId = '';
    document.body.classList.remove('cm-motor-focus');
    catalogRefreshBody();
    return;
  }
  if(act === 'motor-picker-toggle'){
    e.preventDefault();
    catalogUI.motorPickerOpen = !catalogUI.motorPickerOpen;
    catalogRefreshBody();
    return;
  }
  if(act === 'motor-pick' && btn.dataset.id){
    e.preventDefault();
    catalogUI.motorId = btn.dataset.id; catalogUI.motorOpen = true; catalogUI.motorPickerOpen = false; catalogUI.catalogPanelOpen = false; catalogUI.motorFocus = false; catalogUI.motorQ = ''; catalogUI.tipoId = '';
    setMotorViewForEngine(catalogIndex().engineById.get(catalogUI.motorId));
    catalogRefreshBody();
    return;
  }
  if(act === 'motor-prev' || act === 'motor-next'){
    e.preventDefault();
    const idx = catalogIndex(); const at = idx.engines.findIndex(x => x.id === catalogUI.motorId); const delta = act === 'motor-prev' ? -1 : 1; const next = idx.engines[at + delta];
    if(next){ catalogUI.motorId = next.id; catalogUI.motorOpen = true; catalogUI.catalogPanelOpen = false; catalogUI.motorQ = ''; catalogUI.tipoId = ''; setMotorViewForEngine(next); catalogRefreshBody(); }
    return;
  }
  if(act === 'motor-focus'){
    e.preventDefault();
    catalogUI.motorFocus = !catalogUI.motorFocus;
    document.body.classList.toggle('cm-motor-focus', catalogUI.motorFocus && catalogUI.motorOpen);
    const focusBtn = qs('[data-cm="motor-focus"]');
    if(focusBtn) focusBtn.innerHTML = `⛶ ${catalogUI.motorFocus ? 'Sair do foco' : 'Modo foco'}`;
    return;
  }
  // CORREÇÃO: Ativar a escuta dos botões de importação e exportação segmentada por motor
  if(act === 'motor-view'){
    e.preventDefault();
    catalogUI.motorView = btn.dataset.view || 'parts';
    if(catalogUI.motorView === 'book'){
      catalogUI.motorBookPage = 0;
      catalogUI.motorBookZoom = 100;
      catalogUI.motorBookSearch = '';
    }
    catalogRefreshBody();
    return;
  }
  if(act === 'motor-book'){
    e.preventDefault();
    catalogUI.motorView = 'book';
    catalogUI.motorBookPage = 0;
    catalogUI.motorBookZoom = 100;
    catalogUI.motorBookSearch = '';
    catalogRefreshBody();
    return;
  }
  if(act === 'motor-book-upload'){
    e.preventDefault();
    e.stopPropagation();
    const engine = catalogIndex().engineById.get(catalogUI.motorId);
    if(!engine) return toast('Não foi possível identificar o motor selecionado.');
    openMotorBookPicker(engine);
    return;
  }
  if(act === 'motor-book-close'){
    e.preventDefault();
    catalogUI.motorView = 'parts';
    catalogUI.motorBookPage = 0;
    catalogUI.motorBookSearch = '';
    syncMotorBookReadingMode();
    catalogRefreshBody();
    return;
  }
  if(act === 'remove-motor-book'){
    e.preventDefault();
    const engine = catalogIndex().engineById.get(catalogUI.motorId);
    if(engine) removeMotorBook(engine);
    return;
  }
  if(act === 'export-motor-spec') { 
    e.preventDefault(); 
    catalogExportSpecificEngineExcel(); 
    return;
  }
  if(act === 'import-motor-spec') { 
    e.preventDefault(); 
    qs('#cmMotorSpecExcelInput')?.click(); 
    return;
  }

  if(act === 'copy' && btn.dataset.text){
    e.preventDefault(); catalogCopy(btn.dataset.text);
  }
  if(act === 'type-filter'){
    e.preventDefault(); catalogUI.tipoId = btn.dataset.id || ''; catalogRefreshBody();
  }
  if(act === 'piece-new'){
    e.preventDefault(); openCatalogPieceModal('', { motorId: btn.dataset.motor, tipoId: btn.dataset.tipo });
  }
  if(act === 'piece-edit' && btn.dataset.id){
    e.preventDefault(); openCatalogPieceModal(btn.dataset.id);
  }
  if(act === 'piece-del' && btn.dataset.id){
    e.preventDefault(); catalogDeletePiece(btn.dataset.id);
  }
  if(act === 'engine-new'){
    e.preventDefault(); openCatalogEngineModal();
  }
  if(act === 'engine-edit' && btn.dataset.id){
    e.preventDefault(); openCatalogEngineModal(btn.dataset.id);
  }
  if(act === 'engine-del' && btn.dataset.id){
    e.preventDefault(); catalogDeleteEngine(btn.dataset.id);
  }
  if(act === 'type-manage'){
    e.preventDefault(); openCatalogTypeManager();
  }
  if(act === 'import'){
    e.preventDefault(); qs('#cmExcelInput')?.click();
  }
  if(act === 'export'){
    e.preventDefault(); catalogExportExcel(false);
  }
  if(act === 'template'){
    e.preventDefault(); catalogExportExcel(true);
  }
  if(act === 'retry'){
    e.preventDefault(); catalogLoadAll();
  }
  if(act === 'clear-search'){
    const input = qs('#cmSearch'); if(input) input.value = '';
    catalogUI.q = ''; catalogRefreshBody();
  }
  if(act === 'clear-motor-search'){
    catalogUI.motorQ = '';
    catalogUI.tipoId = '';
    catalogRefreshBody();
  }
  if(act === 'motor-open-all'){
    e.preventDefault();
    qs('#cmBody')?.querySelectorAll('details.cm-type').forEach(d => d.open = true);
    return;
  }
  if(act === 'motor-close-all'){
    e.preventDefault();
    qs('#cmBody')?.querySelectorAll('details.cm-type').forEach(d => d.open = false);
    return;
  }
}
async function catalogCopy(text){
  try{ await navigator.clipboard.writeText(text); }
  catch{
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch{}
    ta.remove();
  }
  toast(`Referência copiada: ${text}`);
}
function catalogGuard(action){
  if(!catalogReady()){ toast('O catálogo não está carregado do Firebase. Grava bloqueada.'); return false; }
  if(!catalogCan(action)){ toast('Sem permissão para esta ação.'); return false; }
  if(!hasWritableFirebaseSession()){ toast('Sem Firebase ativo. Nada foi gravado.'); return false; }
  return true;
}

function openCatalogPieceModal(id = '', pre = {}) {
  const editing = id ? state.engineCatalog.find(p => p.id === id) : null;
  if(!catalogGuard(editing ? 'edit' : 'add')) return;
  const idx = catalogIndex();
  if(!idx.engines.length) return toast('Cria primeiro um motor.');
  if(!idx.types.length) return toast('Cria primeiro um tipo de peça (botão «Tipos de peça»).');
  
  const motorId = editing?.motorId || pre.motorId || catalogUI.motorId || (idx.engines[0] ? idx.engines[0].id : '');
  const tipoId = editing?.tipoId || pre.tipoId || catalogUI.tipoId || (idx.types[0] ? idx.types[0].id : '');
  const brands = [...new Set(state.engineCatalog.map(p => String(p.marca || '').trim()).filter(Boolean))].sort(catCollate);
  
  let currentMemojiBase64 = editing?.avatarUrl || '';

  let motorOptionsHTML = '';
  for (const e of idx.engines) {
    const isSelected = e.id === motorId ? 'selected' : '';
    motorOptionsHTML += '<option value="' + esc(e.id) + '" ' + isSelected + '>' + esc(e.nome) + '</option>';
  }

  let tipoOptionsHTML = '';
  for (const t of idx.types) {
    const isSelected = t.id === tipoId ? 'selected' : '';
    tipoOptionsHTML += '<option value="' + esc(t.id) + '" ' + isSelected + '>' + esc(t.nome) + '</option>';
  }

  openModal(editing ? '✏️ Editar peça' : '➕ Nova peça', `<form id="cmPieceForm" class="cm-form">
    <label>Motor<select class="select" name="motorId" required>${motorOptionsHTML}</select></label>
    <label>Tipo de peça<select class="select" name="tipoId" required>${tipoOptionsHTML}</select></label>
    <label>Referência *<input class="field" name="referencia" required autocomplete="off" placeholder="Ex.: 038109119P" value="${esc(editing?.referencia || '')}"></label>
    <label>Marca<input class="field" name="marca" list="cmBrands" autocomplete="off" placeholder="Ex.: Gates" value="${esc(editing?.marca || '')}"><datalist id="cmBrands">${brands.map(b => `<option value="\${esc(b)}">`).join('')}</datalist></label>
    <label class="span2">Descrição<input class="field" name="descricao" autocomplete="off" placeholder="Ex.: Correia de distribuição" value="${esc(editing?.descricao || '')}"></label>
    
    <label class="span2" style="display: flex; flex-direction: column; gap: 8px;">
      <span>Memoji da Peça (Imagem)</span>
      <div style="display: flex; align-items: center; gap: 15px;">
        <div id="cmMemojiPreview" style="width: 64px; height: 64px; border-radius: 50%; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden;">
          ${currentMemojiBase64 ? `<img src="\${currentMemojiBase64}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 1.5rem;">👤</span>'}
        </div>
        <button class="cm-btn" type="button" id="cmSelectMemojiBtn" style="margin: 0;">📸 Escolher Memoji</button>
        <input type="file" id="cmMemojiFileInput" accept="image/*" class="hidden">
      </div>
    </label>

    <label class="span2">Observações<textarea name="observacoes" placeholder="Notas internas, compatibilidades, medidas…">${esc(editing?.observacoes || '')}</textarea></label>
    <div class="span2 cm-form-actions"><button class="btn cm-btn cm-btn-main" type="submit">💾 Guardar peça</button><button class="cm-btn cm-btn-ghost" type="button" data-close>Cancelar</button></div>
  </form>`);

  const fileInput = qs('#cmMemojiFileInput');
  qs('#cmSelectMemojiBtn')?.addEventListener('click', () => fileInput?.click());
  
  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        currentMemojiBase64 = ev.target.result;
        const previewBox = qs('#cmMemojiPreview');
        if (previewBox) previewBox.innerHTML = `<img src="${currentMemojiBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  qs('#cmPieceForm [data-close]')?.addEventListener('click', closeModal);
  qs('#cmPieceForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const data = { 
      motorId: f.motorId, 
      tipoId: f.tipoId, 
      referencia: String(f.referencia || '').trim(), 
      descricao: String(f.descricao || '').trim(), 
      marca: String(f.marca || '').trim(), 
      observacoes: String(f.observacoes || '').trim(),
      avatarUrl: currentMemojiBase64
    };
    if(!data.referencia) return toast('Indica a referência.');
    const dup = state.engineCatalog.find(p => p.id !== editing?.id && p.motorId === data.motorId && p.tipoId === data.tipoId && catCompact(p.referencia) === catCompact(data.referencia) && catKey(p.marca) === catKey(data.marca));
    if(dup) return toast('Já existe esta referência (mesma marca) neste motor e tipo.');
    let row;
    if(editing){ Object.assign(editing, data); row = editing; }
    else { row = { id:uid('PEC'), ...data, createdAt:new Date().toISOString() }; state.engineCatalog.push(row); }
    closeModal();
    catalogUI.motorId = data.motorId;
    if(catalogUI.tipoId && catalogUI.tipoId !== data.tipoId) catalogUI.tipoId = '';
    renderPage(CATALOG_PAGE);
    const ok = await catalogCommit([{ key:'engineCatalog', row }], editing ? 'Catálogo Motor: peça editada' : 'Catálogo Motor: peça criada');
    if(ok) toast(editing ? 'Peça atualizada.' : 'Peça adicionada.');
  });
  setTimeout(() => qs('#cmPieceForm [name="referencia"]')?.focus(), 30);
}

async function catalogDeletePiece(id){
  if(!catalogGuard('delete')) return;
  const p = state.engineCatalog.find(x => x.id === id); if(!p) return;
  if(!confirm(`Apagar a peça ${p.referencia}?`)) return;
  state.engineCatalog = state.engineCatalog.filter(x => x.id !== id);
  renderPage(CATALOG_PAGE);
  const ok = await catalogCommit([{ key:'engineCatalog', id, del:true }], 'Catálogo Motor: peça apagada');
  if(ok) toast('Peça apagada.');
}

/* ---------- Motores ---------- */
function catalogFindByName(list, name, exceptId){
  const k = catKey(name);
  return list.find(x => x.id !== exceptId && catKey(x.nome) === k);
}
function openCatalogEngineModal(id = ''){
  const editing = id ? state.engineCatalogEngines.find(e => e.id === id) : null;
  if(!catalogGuard(editing ? 'edit' : 'add')) return;
  
  const placeholderText = editing ? "Ex.: 1.9 TDI" : "Ex.: 1.9 TDI, 2.0 TDI, 1.6 TDI (Separa por vírgulas para criar vários)";

  openModal(editing ? '✏️ Editar motor' : '🚗 Novo(s) motor(es)', '<form id="cmEngineForm" class="cm-form">' +
    '<label class="span2">Nome do(s) motor(es) *<input class="field" name="nome" required autocomplete="off" placeholder="' + placeholderText + '" value="' + esc(editing?.nome || '') + '"></label>' +
    '<label class="span2">Observações<textarea name="observacoes" placeholder="Aplicação, códigos de motor, viaturas…">' + esc(editing?.observacoes || '') + '</textarea></label>' +
    '<div class="span2 cm-form-actions"><button class="cm-btn cm-btn-main" type="submit">💾 Guardar</button><button class="cm-btn cm-btn-ghost" type="button" data-close>Cancelar</button></div>' +
  '</form>');
  
  qs('#cmEngineForm [data-close]')?.addEventListener('click', closeModal);
  qs('#cmEngineForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const nomeRaw = String(f.nome || '').trim(); 
    const observacoes = String(f.observacoes || '').trim();
    if(!nomeRaw) return toast('Indica o nome do motor.');
    
    const now = new Date().toISOString();
    const ops = [];
    let ultimoMotorId = '';

    if(editing){
      if(catalogFindByName(state.engineCatalogEngines, nomeRaw, editing.id)) return toast('Já existe um motor com esse nome.');
      Object.assign(editing, { nome: nomeRaw, observacoes }); 
      ops.push({ key:'engineCatalogEngines', row: editing });
      ultimoMotorId = editing.id;
    } else {
      const nomes = nomeRaw.split(',').map(n => n.trim()).filter(Boolean);
      if(!nomes.length) return toast('Indica os nomes válidos.');

      // CORRIGIDO: Utilização correta de 'of' em vez de 'de'
      for (const nome of nomes) {
        if(catalogFindByName(state.engineCatalogEngines, nome)) {
          return toast('O motor "' + nome + '" já existe no catálogo.');
        }
      }

      // CORRIGIDO: Utilização correta de 'of' em vez de 'de'
      for (const nome of nomes) {
        const novoMotor = { id: uid('EMO'), nome: nome, observacoes: observacoes, createdAt: now };
        state.engineCatalogEngines.push(novoMotor);
        ops.push({ key:'engineCatalogEngines', row: novoMotor });
        ultimoMotorId = novoMotor.id;
      }
    }

    closeModal();
    catalogUI.motorId = ultimoMotorId; 
    catalogUI.tipoId = '';
    renderPage(CATALOG_PAGE);

    const textoAudit = editing ? 'Catálogo Motor: motor editado' : 'Catálogo Motor: ' + ops.length + ' motor(es) criado(s)';
    const ok = await catalogCommit(ops, textoAudit);
    if(ok) toast(editing ? 'Motor atualizado.' : ops.length + ' motor(es) adicionado(s) com sucesso.');
  });
  setTimeout(() => qs('#cmEngineForm [name="nome"]')?.focus(), 30);
}

async function catalogDeleteEngine(id){
  if(!catalogGuard('delete')) return;
  const e = state.engineCatalogEngines.find(x => x.id === id); if(!e) return;
  const pieces = state.engineCatalog.filter(p => p.motorId === id);
  if(!confirm(`Apagar o motor «${e.nome}»${pieces.length ? ` e as suas ${pieces.length} peça(s)` : ''}? Esta ação não pode ser desfeita.`)) return;
  state.engineCatalogEngines = state.engineCatalogEngines.filter(x => x.id !== id);
  state.engineCatalog = state.engineCatalog.filter(p => p.motorId !== id);
  catalogUI.motorId = ''; catalogUI.tipoId = ''; catalogUI.motorQ = '';
  renderPage(CATALOG_PAGE);
  const ok = await catalogCommit([{ key:'engineCatalogEngines', id, del:true }, ...pieces.map(p => ({ key:'engineCatalog', id:p.id, del:true }))], `Catálogo Motor: motor apagado (${e.nome})`);
  if(ok) toast('Motor apagado.');
}

/* ---------- Tipos de peça ---------- */
function openCatalogTypeManager(){
  if(!catalogReady()) return toast('O catálogo ainda está a carregar.');
  const idx = catalogIndex();
  const canAdd = catalogCan('add'), canEdit = catalogCan('edit'), canDel = catalogCan('delete');
  
  // 1. Gerar a lista de tipos usando aspas normais e concatenação limpa
  let typesHTML = '';
  for (const t of idx.types) {
    const tIcon = catTypeIcon(t);
    const tNome = esc(t.nome);
    const tCount = idx.typeCount.get(t.id) || 0;
    const tIdEsc = esc(t.id);
    
    typesHTML += '<div class="cm-type-item">' +
      '<span class="cm-type-ico">' + tIcon + '</span>' +
      '<div class="cm-type-item-name"><strong>' + tNome + '</strong><small>' + tCount + ' peça(s)</small></div>' +
      (canEdit ? '<button type="button" class="cm-icon" data-type-edit="' + tIdEsc + '" title="Editar">✏️</button>' : '') +
      (canDel ? '<button type="button" class="cm-icon" data-type-del="' + tIdEsc + '" title="Apagar">🗑️</button>' : '') +
    '</div>';
  }

  // 2. Montagem final da modal injetando a string gerada de forma direta
  let modalHTML = '<div class="cm-types-manager">' +
    '<p class="muted">Os tipos são partilhados por todos os motores (ex.: Distribuição, Filtros, Juntas).</p>';
    
  if (idx.types.length) {
    modalHTML += '<div class="cm-type-list">' + typesHTML + '</div>';
  } else {
    modalHTML += '<div class="cm-empty small"><div class="cm-empty-ico">🏷️</div><h4>Ainda não há tipos de peça</h4></div>';
  }
  
  if (canAdd) {
    modalHTML += '<div class="cm-form-actions"><button type="button" class="cm-btn cm-btn-main" id="cmTypeNewBtn">➕ Novo tipo de peça</button></div>';
  }
  
  modalHTML += '</div>';

  // Abre a modal com o HTML perfeitamente limpo
  openModal('🏷️ Tipos de peça', modalHTML);
  
  qs('#cmTypeNewBtn')?.addEventListener('click', () => openCatalogTypeModal(''));
  qsa('[data-type-edit]').forEach(b => b.addEventListener('click', () => openCatalogTypeModal(b.dataset.typeEdit)));
  qsa('[data-type-del]').forEach(b => b.addEventListener('click', () => catalogDeleteType(b.dataset.typeDel)));
}


function openCatalogTypeModal(id = ''){
  const editing = id ? state.engineCatalogTypes.find(t => t.id === id) : null;
  if(!catalogGuard(editing ? 'edit' : 'add')) return;
  
  // Define a instrução com base no modo (Edição vs Nova Criação em Lote)
  const placeholderText = editing ? "Ex.: Distribuição" : "Ex.: Distribuição, Filtros, Juntas (Separa por vírgulas para criar vários)";

  openModal(editing ? '✏️ Editar tipo de peça' : '🏷️ Novo(s) tipo(s) de peça', `<form id="cmTypeForm" class="cm-form">
    <label class="span2">Nome do(s) tipo(s) *<input class="field" name="nome" required autocomplete="off" placeholder="${placeholderText}" value="${esc(editing?.nome || '')}"></label>
    
    <label class="span2" style="display: flex; flex-direction: column; gap: 8px;">
      <span>Imagem do Tipo (Memoji Personalizado)</span>
      <div style="display: flex; align-items: center; gap: 15px;">
        <div id="cmTypeIconPreview" style="width: 54px; height: 50px; border-radius: 50%; border: 2px dashed #06447f; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden;">
          ${editing?.icone && editing.icone.startsWith('data:image') 
            ? `<img src="\${editing.icone}" style="width: 100%; height: 100%; object-fit: cover;">` 
            : `<span style="font-size: 1.5rem;">🔧</span>`}
        </div>
        <button class="cm-btn" type="button" id="cmSelectTypeIconBtn" style="margin: 0; padding: 8px 14px; background: #06447f; color: white; border: 0; border-radius: 6px; cursor: pointer;">📸 Carregar Memoji</button>
        <input type="file" id="cmTypeIconFileInput" accept="image/*" class="hidden">
      </div>
    </label>

    <div class="span2 cm-form-actions"><button class="cm-btn cm-btn-main" type="submit">💾 Guardar tipo</button><button class="cm-btn cm-btn-ghost" type="button" id="cmTypeBack">Voltar</button></div>
  </form>`);

  let currentIconBase64 = editing?.icone || '';
  const fileInput = qs('#cmTypeIconFileInput');
  qs('#cmSelectTypeIconBtn')?.addEventListener('click', () => fileInput?.click());
  
  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        currentIconBase64 = ev.target.result;
        const previewBox = qs('#cmTypeIconPreview');
        if (previewBox) previewBox.innerHTML = `<img src="${currentIconBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  qs('#cmTypeBack')?.addEventListener('click', openCatalogTypeManager);
  qs('#cmTypeForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const nomeRaw = String(f.nome || '').trim();
    if(!nomeRaw) return toast('Indica o nome do tipo.');
    
    const now = new Date().toISOString();
    const ops = [];

    if(editing){
      if(catalogFindByName(state.engineCatalogTypes, nomeRaw, editing.id)) return toast('Já existe um tipo com esse nome.');
      Object.assign(editing, { nome: nomeRaw, icone: currentIconBase64 }); 
      ops.push({ key:'engineCatalogTypes', row: editing });
    } else {
      // Parte o texto por vírgulas para inserção múltipla
      const nomes = nomeRaw.split(',').map(n => n.trim()).filter(Boolean);
      if(!nomes.length) return toast('Indica pelo menos um nome válido.');

      // Validação de duplicados antes de avançar para a gravação
      for (const nome of nomes) {
        if(catalogFindByName(state.engineCatalogTypes, nome)) {
          return toast('O tipo "' + nome + '" já existe no catálogo.');
        }
      }

      // Loop de criação individual
      for (const nome of nomes) {
        const novoTipo = { id: uid('TPC'), nome, icone: currentIconBase64, createdAt: now };
        state.engineCatalogTypes.push(novoTipo);
        ops.push({ key:'engineCatalogTypes', row: novoTipo });
      }
    }
    
    renderPage(CATALOG_PAGE);
    openCatalogTypeManager();
    
    const textoAudit = editing ? 'Catálogo Motor: tipo editado' : 'Catálogo Motor: ' + ops.length + ' tipo(s) criado(s)';
    const ok = await catalogCommit(ops, textoAudit);
    if(ok) toast(editing ? 'Tipo atualizado.' : ops.length + ' tipo(s) criado(s) com sucesso.');
  });
  setTimeout(() => qs('#cmTypeForm [name="nome"]')?.focus(), 30);
}


async function catalogDeleteType(id){
  if(!catalogGuard('delete')) return;
  const t = state.engineCatalogTypes.find(x => x.id === id); if(!t) return;
  const pieces = state.engineCatalog.filter(p => p.tipoId === id);
  if(!confirm(`Apagar o tipo «${t.nome}»${pieces.length ? ` e as ${pieces.length} peça(s) deste tipo em todos os motores` : ''}? Esta ação não pode ser desfeita.`)) return;
  state.engineCatalogTypes = state.engineCatalogTypes.filter(x => x.id !== id);
  state.engineCatalog = state.engineCatalog.filter(p => p.tipoId !== id);
  if(catalogUI.tipoId === id) catalogUI.tipoId = '';
  renderPage(CATALOG_PAGE);
  openCatalogTypeManager();
  const ok = await catalogCommit([{ key:'engineCatalogTypes', id, del:true }, ...pieces.map(p => ({ key:'engineCatalog', id:p.id, del:true }))], `Catálogo Motor: tipo apagado (${t.nome})`);
  if(ok) toast('Tipo apagado.');
}

/* ---------- Excel: exportar ---------- */
const CATALOG_XLS = { pieces:'Peças', engines:'Motores', types:'Tipos de Peça' };
async function catalogExportExcel(template = false){
  if(!catalogReady()) return toast('O catálogo ainda está a carregar.');
  if(!catalogCan('export') && !(template && catalogCan('import'))) return toast('Sem permissão para exportar.');
  const idx = catalogIndex();
  const pieceRows = template
    ? [{ 'Motor':'1.9 TDI', 'Tipo de Peça':'Distribuição', 'Referência':'038109119P', 'Descrição':'Correia de distribuição', 'Marca':'Gates', 'Observações':'' }]
    : idx.all.slice().sort((a,b) => catCollate(a.e.nome, b.e.nome) || catCollate(a.t.nome, b.t.nome) || catCollate(a.p.referencia, b.p.referencia))
        .map(({ p, e, t }) => ({ 'Motor':e.nome, 'Tipo de Peça':t.nome, 'Referência':p.referencia || '', 'Descrição':p.descricao || '', 'Marca':p.marca || '', 'Observações':p.observacoes || '' }));
  const engineRows = template ? [{ 'Motor':'1.9 TDI', 'Observações':'' }] : idx.engines.map(e => ({ 'Motor':e.nome, 'Observações':e.observacoes || '' }));
  const typeRows = template ? [{ 'Tipo de Peça':'Distribuição', 'Ícone':'⛓️' }] : idx.types.map(t => ({ 'Tipo de Peça':t.nome, 'Ícone':t.icone || '' }));
  const filename = `catalogo-motor-${template ? 'modelo' : 'export'}-${today()}`;
  try{
    await loadExcelLibrary();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(pieceRows, { header:['Motor','Tipo de Peça','Referência','Descrição','Marca','Observações'] });
    ws['!cols'] = [{ wch:18 }, { wch:20 }, { wch:20 }, { wch:38 }, { wch:16 }, { wch:38 }];
    XLSX.utils.book_append_sheet(wb, ws, CATALOG_XLS.pieces);
    const we = XLSX.utils.json_to_sheet(engineRows, { header:['Motor','Observações'] });
    we['!cols'] = [{ wch:22 }, { wch:50 }];
    XLSX.utils.book_append_sheet(wb, we, CATALOG_XLS.engines);
    const wt = XLSX.utils.json_to_sheet(typeRows, { header:['Tipo de Peça','Ícone'] });
    wt['!cols'] = [{ wch:26 }, { wch:8 }];
    XLSX.utils.book_append_sheet(wb, wt, CATALOG_XLS.types);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast(template ? 'Modelo Excel exportado.' : `Catálogo exportado (${pieceRows.length} peça(s)).`);
  } catch(err){
    console.error(err);
    const headers = ['Motor','Tipo de Peça','Referência','Descrição','Marca','Observações'];
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + [headers.map(q).join(';'), ...pieceRows.map(r => headers.map(h => q(r[h])).join(';'))].join('\r\n');
    downloadBlob(new Blob([csv], { type:'text/csv;charset=utf-8' }), `${filename}.csv`);
    toast('Sem biblioteca Excel: exportado em CSV (abre no Excel).');
  }
}

/* ---------- Excel: importar ---------- */
const CATALOG_HEADERS = {
  motor:['motor','motores','engine'],
  tipo:['tipopeca','tipodepeca','tipo','categoria','familia','grupo'],
  referencia:['referencia','ref','referencias','codigo','cod','partnumber','pn'],
  descricao:['descricao','descricaopeca','designacao','description','nome'],
  marca:['marca','fabricante','brand'],
  observacoes:['observacoes','observacao','obs','notas','nota','notes'],
  icone:['icone','icon','emoji']
};
async function catalogExportSpecificEngineExcel() {
  if(!catalogReady()) return toast('O catálogo ainda está a carregar.');
  if(!catalogUI.motorId) return toast('Seleciona primeiro um motor na barra lateral esquerda.');
  
  const idx = catalogIndex();
  const engine = idx.engineById.get(catalogUI.motorId);
  if(!engine) return toast('Motor não encontrado.');

  // Filtra apenas as peças que pertencem a este motor ativo
  const motorPieces = idx.all.filter(item => item.e.id === engine.id);

  const excelRows = motorPieces.map(({ p, t }) => ({
    'Tipo de Peça': t.nome,
    'Referência': p.referencia || '',
    'Descrição': p.descricao || '',
    'Marca': p.marca || '',
    'Observações': p.observacoes || ''
  }));

  // Se o motor estiver vazio, mete uma linha de exemplo para o utilizador saber preencher
  if(!excelRows.length) {
    excelRows.push({ 'Tipo de Peça': 'Distribuição', 'Referência': 'EXEMPLO-123', 'Descrição': 'Correia', 'Marca': 'Gates', 'Observações': '' });
  }

  const filename = `catalogo-${catSlug(engine.nome)}-${today()}.xlsx`;

  try {
    await loadExcelLibrary();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows, { header: ['Tipo de Peça', 'Referência', 'Descrição', 'Marca', 'Observações'] });
    ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 38 }, { wch: 16 }, { wch: 38 }];
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(engine.nome));
    XLSX.writeFile(wb, filename);
    toast(`Catálogo do motor ${engine.nome} exportado com sucesso.`);
  } catch(err) {
    console.error(err);
    toast('Erro ao gerar o ficheiro Excel.');
  }
}
async function catalogImportSpecificEngineFile(file) {
  if(!catalogUI.motorId) return toast('Seleciona um motor na barra lateral antes de importar.');
  const idx = catalogIndex();
  const engine = idx.engineById.get(catalogUI.motorId);
  
  try {
    const rawRows = await readExcelRows(file);
    if(!rawRows.length) return toast('O ficheiro não tem linhas.');

    const map = catalogHeaderMap();
    const now = new Date().toISOString();
    const typeByKey = new Map(state.engineCatalogTypes.map(t => [catKey(t.nome), t]));
    const usedT = new Set(state.engineCatalogTypes.map(t => t.id));
    
    const ops = [];
    let novosTiposContador = 0;
    let novasPecasContador = 0;

    for (const raw of rawRows) {
      const r = catalogMapRow(raw, map);
      const tipoNome = String(r.tipo || '').trim();
      const referencia = String(r.referencia || '').trim();
      const marca = String(r.marca || '').trim();
      
      if(!tipoNome || !referencia) continue;

      // Se a categoria/tipo de peça não existir, cria de raiz na app
      let t = typeByKey.get(catKey(tipoNome));
      if(!t) {
        t = { id: catNewId('TPC', tipoNome, usedT), nome: tipoNome, icone: '', createdAt: now };
        state.engineCatalogTypes.push(t);
        typeByKey.set(catKey(tipoNome), t);
        ops.push({ key: 'engineCatalogTypes', row: t });
        novosTiposContador++;
      }

      // Evita duplicados idênticos dentro deste motor específico
      const existe = state.engineCatalog.find(p => 
        p.motorId === engine.id && 
        p.tipoId === t.id && 
        catCompact(p.referencia) === catCompact(referencia) && 
        catKey(p.marca) === catKey(marca)
      );

      if(!existe) {
        const novaPeca = {
          id: uid('PEC'),
          motorId: engine.id,
          tipoId: t.id,
          referencia: referencia,
          descricao: String(r.descricao || '').trim(),
          marca: marca,
          observacoes: String(r.observacoes || '').trim(),
          createdAt: now
        };
        state.engineCatalog.push(novaPeca);
        ops.push({ key: 'engineCatalog', row: novaPeca });
        novasPecasContador++;
      }
    }

    if(!ops.length) return toast('Nenhum dado novo para importar deste Excel.');

    renderPage(CATALOG_PAGE);
    const ok = await catalogCommit(ops, `Importação Excel focada no Motor: ${engine.nome}`);
    if(ok) toast(`Importado para ${engine.nome}: ${novasPecasContador} peças e ${novosTiposContador} categorias novas.`);
  } catch(err) {
    console.error(err);
    toast('Falha ao processar o Excel do motor.');
  }
}

function catalogHeaderMap(){
  const m = {};
  Object.entries(CATALOG_HEADERS).forEach(([k, list]) => list.forEach(h => { m[h] = k; }));
  return m;
}
function catalogMapRow(raw, map){
  const o = {};
  Object.entries(raw || {}).forEach(([k, v]) => {
    const key = map[normalizeExcelHeader(k)];
    if(key && o[key] === undefined) o[key] = normalizeExcelValue(v);
  });
  return o;
}
async function catalogReadWorkbook(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if(['csv','tsv','txt'].includes(ext)) return { pieces:await readExcelRows(file), engines:[], types:[] };
  await loadExcelLibrary();
  if(!window.XLSX) throw new Error('Não foi possível carregar a biblioteca Excel. Podes importar CSV.');
  const wb = XLSX.read(await file.arrayBuffer(), { type:'array', cellDates:true, raw:false });
  const norm = n => normalizeExcelHeader(n);
  const find = names => wb.SheetNames.find(n => names.includes(norm(n)));
  const engName = find(['motores', 'motor']);
  const typeName = find(['tiposdepeca', 'tipospeca', 'tipos']);
  const pieceName = find(['pecas', 'catalogo', 'catalogomotor', 'material']) || wb.SheetNames.find(n => n !== engName && n !== typeName) || wb.SheetNames[0];
  const read = name => name ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval:'', raw:false }) : [];
  return { pieces:read(pieceName), engines:pieceName === engName ? [] : read(engName), types:pieceName === typeName ? [] : read(typeName) };
}
/* Constrói o plano de importação SEM alterar o estado. */
function catalogBuildImportPlan(parsed){
  const map = catalogHeaderMap();
  const now = new Date().toISOString();
  const engByKey = new Map(state.engineCatalogEngines.map(e => [catKey(e.nome), e]));
  const typeByKey = new Map(state.engineCatalogTypes.map(t => [catKey(t.nome), t]));
  const usedE = new Set(state.engineCatalogEngines.map(e => e.id));
  const usedT = new Set(state.engineCatalogTypes.map(t => t.id));
  const plan = { newEngines:[], newTypes:[], engineEdits:[], typeEdits:[], newPieces:[], pieceEdits:[], unchanged:0, skipped:0, filled:0, total:0 };
  const getEngine = name => {
    const k = catKey(name); let e = engByKey.get(k);
    if(!e){ e = { id:catNewId('EMO', name, usedE), nome:name.trim(), observacoes:'', createdAt:now }; engByKey.set(k, e); plan.newEngines.push(e); }
    return e;
  };
  const getType = name => {
    const k = catKey(name); let t = typeByKey.get(k);
    if(!t){ t = { id:catNewId('TPC', name, usedT), nome:name.trim(), icone:'', createdAt:now }; typeByKey.set(k, t); plan.newTypes.push(t); }
    return t;
  };
  const editsE = new Map(), editsT = new Map();
  (parsed.engines || []).forEach(raw => {
    const r = catalogMapRow(raw, map); const name = String(r.motor || '').trim(); if(!name) return;
    const e = getEngine(name); const obs = String(r.observacoes || '').trim();
    if(obs && obs !== (e.observacoes || '')){
      if(plan.newEngines.includes(e)) e.observacoes = obs;
      else { const cur = editsE.get(e.id) || { row:e, patch:{} }; cur.patch.observacoes = obs; editsE.set(e.id, cur); }
    }
  });
  (parsed.types || []).forEach(raw => {
    const r = catalogMapRow(raw, map); const name = String(r.tipo || '').trim(); if(!name) return;
    const t = getType(name); const ic = String(r.icone || '').trim();
    if(ic && ic !== (t.icone || '')){
      if(plan.newTypes.includes(t)) t.icone = ic;
      else { const cur = editsT.get(t.id) || { row:t, patch:{} }; cur.patch.icone = ic; editsT.set(t.id, cur); }
    }
  });
  const byFull = new Map(), byRef = new Map();
  state.engineCatalog.forEach(p => {
    if(!p.motorId || !p.tipoId) return;
    const k3 = `${p.motorId}|${p.tipoId}|${catCompact(p.referencia)}`;
    byFull.set(`${k3}|${catKey(p.marca)}`, p);
    if(!byRef.has(k3)) byRef.set(k3, []);
    byRef.get(k3).push(p);
  });
  const planned = new Map();
  let lastMotor = '', lastTipo = '';
  (parsed.pieces || []).forEach(raw => {
    const r = catalogMapRow(raw, map);
    if(!Object.values(r).some(v => String(v).trim())) return;
    plan.total++;
    let motor = String(r.motor || '').trim(), tipo = String(r.tipo || '').trim(), carried = false;
    if(!motor && lastMotor){ motor = lastMotor; carried = true; }
    if(!tipo && lastTipo && (carried || catKey(motor) === catKey(lastMotor))){ tipo = lastTipo; carried = true; }
    const ref = String(r.referencia || '').trim();
    if(!motor || !tipo || !ref){ plan.skipped++; return; }
    lastMotor = motor; lastTipo = tipo; if(carried) plan.filled++;
    const marca = String(r.marca || '').trim();
    const e = getEngine(motor), t = getType(tipo);
    const k3 = `${e.id}|${t.id}|${catCompact(ref)}`;
    let ex = byFull.get(`${k3}|${catKey(marca)}`);
    if(!ex){ const cand = byRef.get(k3) || []; ex = marca ? cand.find(p => !p.marca) : cand[0]; }
    const key = ex ? ex.id : `${k3}|${catKey(marca)}`;
    let entry = planned.get(key);
    if(!entry){
      entry = ex
        ? { row:ex, patch:{}, isNew:false }
        : { row:{ id:uid('PEC'), motorId:e.id, tipoId:t.id, referencia:ref, descricao:'', marca, observacoes:'', createdAt:now }, patch:{}, isNew:true };
      if(ex && marca && !ex.marca) entry.patch.marca = marca;
      planned.set(key, entry);
    }
    ['descricao','observacoes'].forEach(f => {
      const v = String(r[f] || '').trim();
      if(v && v !== String(entry.row[f] || '')) entry.patch[f] = v;
    });
  });
  planned.forEach(entry => {
    if(entry.isNew){ Object.assign(entry.row, entry.patch); plan.newPieces.push(entry.row); }
    else if(Object.keys(entry.patch).length) plan.pieceEdits.push(entry);
    else plan.unchanged++;
  });
  plan.engineEdits = [...editsE.values()];
  plan.typeEdits = [...editsT.values()];
  return plan;
}
async function catalogImportFile(file){
  if(!catalogCan('import')) return toast('Sem permissão para importar.');
  if(!hasWritableFirebaseSession()) return toast('Importação bloqueada: entra com Firebase para gravar dados.');
  if(!catalogReady()) return toast('O catálogo ainda está a carregar.');
  try{
    const parsed = await catalogReadWorkbook(file);
    if(!parsed.pieces.length) return toast('O ficheiro não tem linhas de peças.');
    const plan = catalogBuildImportPlan(parsed);
    if(!plan.total) return toast('Não encontrei linhas válidas. Colunas esperadas: Motor, Tipo de Peça, Referência, Descrição, Marca, Observações.');
    if(!plan.newPieces.length && !plan.pieceEdits.length && !plan.newEngines.length && !plan.newTypes.length && !plan.engineEdits.length && !plan.typeEdits.length){
      return toast(`Nada a importar: ${plan.unchanged} peça(s) já existem sem alterações${plan.skipped ? ` · ${plan.skipped} linha(s) ignorada(s)` : ''}.`);
    }
    catalogUI.pendingPlan = plan;
    const li = (n, txt) => n ? `<li><b>${n}</b> ${txt}</li>` : '';
    openModal('📥 Confirmar importação', `<div class="cm-import">
      <p>Ficheiro: <strong>${esc(file.name)}</strong> · ${plan.total} linha(s) lidas</p>
      <ul class="cm-import-list">
        ${li(plan.newPieces.length, 'peça(s) novas')}
        ${li(plan.pieceEdits.length, 'peça(s) existentes a atualizar (descrição/marca/observações)')}
        ${li(plan.newEngines.length, `motor(es) novos${plan.newEngines.length <= 6 ? `: ${esc(plan.newEngines.map(e => e.nome).join(', '))}` : ''}`)}
        ${li(plan.newTypes.length, `tipo(s) de peça novos${plan.newTypes.length <= 6 ? `: ${esc(plan.newTypes.map(t => t.nome).join(', '))}` : ''}`)}
        ${li(plan.engineEdits.length + plan.typeEdits.length, 'motor(es)/tipo(s) a atualizar')}
        ${li(plan.unchanged, 'peça(s) já existentes, sem alterações')}
        ${li(plan.filled, 'linha(s) com Motor/Tipo em branco, preenchidas com a linha anterior')}
        ${li(plan.skipped, 'linha(s) ignoradas (falta Motor, Tipo de Peça ou Referência)')}
      </ul>
      <div class="cm-form-actions"><button type="button" class="cm-btn cm-btn-main" id="cmImportOk">✅ Importar</button><button type="button" class="cm-btn cm-btn-ghost" id="cmImportCancel">Cancelar</button></div>
    </div>`);
    qs('#cmImportCancel')?.addEventListener('click', () => { catalogUI.pendingPlan = null; closeModal(); });
    qs('#cmImportOk')?.addEventListener('click', () => catalogApplyImportPlan(file.name));
  } catch(err){
    console.error(err);
    toast(err?.message || 'Não consegui ler esse ficheiro.');
  }
}
async function catalogApplyImportPlan(fileName){
  const plan = catalogUI.pendingPlan; catalogUI.pendingPlan = null;
  if(!plan) return;
  if(!catalogGuard('add')) return;
  const btn = qs('#cmImportOk'); if(btn){ btn.disabled = true; btn.textContent = 'A importar…'; }
  const ops = [];
  state.engineCatalogEngines.push(...plan.newEngines);
  state.engineCatalogTypes.push(...plan.newTypes);
  plan.newEngines.forEach(row => ops.push({ key:'engineCatalogEngines', row }));
  plan.newTypes.forEach(row => ops.push({ key:'engineCatalogTypes', row }));
  plan.engineEdits.forEach(({ row, patch }) => { Object.assign(row, patch); ops.push({ key:'engineCatalogEngines', row }); });
  plan.typeEdits.forEach(({ row, patch }) => { Object.assign(row, patch); ops.push({ key:'engineCatalogTypes', row }); });
  state.engineCatalog.push(...plan.newPieces);
  plan.newPieces.forEach(row => ops.push({ key:'engineCatalog', row }));
  plan.pieceEdits.forEach(({ row, patch }) => { Object.assign(row, patch); ops.push({ key:'engineCatalog', row }); });
  const ok = await catalogCommit(ops, `Catálogo Motor: importação Excel (${plan.newPieces.length} novas, ${plan.pieceEdits.length} atualizadas) · ${fileName}`);
  closeModal();
  if(currentPage === CATALOG_PAGE) renderPage(CATALOG_PAGE);
  if(ok) toast(`Importação concluída: ${plan.newPieces.length} nova(s), ${plan.pieceEdits.length} atualizada(s).`);
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
  const fbStatus = firebaseStatus();
  const statusBadge = `<span class="badge ${firebaseSessionOk ? 'green' : (firebaseReady ? 'orange' : 'orange')}">${esc(fbStatus)}</span>`;
  const onlineUsers = (state.users || []).filter(isUserOnline).length;
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
          Para criar utilizadores diretamente na Firebase, entra primeiro na app com a tua conta Firebase Admin Master e confirma que aparece Firebase ligado.
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
          <span class="muted">${state.users.length} registos criados na app · ${onlineUsers} online.</span>
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
function actionAccessDefaults(){ return { view:false, add:false, edit:false, delete:false }; }
function currentUserActionAccess(pageId=currentPage){
  if(isAdminMaster()) return { view:true, add:true, edit:true, delete:true };
  return userPagePermissions(currentUserRecord(), pageId);
}
function canAction(action, pageId=currentPage){
  if(isAdminMaster()) return true;
  return currentUserActionAccess(pageId)[action] === true;
}
function canEditOperational(pageId=currentPage){ return canAction('add', pageId) || canAction('edit', pageId); }
function canCreateOperational(pageId=currentPage){ return canAction('add', pageId); }
function canDelete(pageId=currentPage){ return canAction('delete', pageId); }
function canImportExcel(){ return isAdminMaster(); }
function canExportExcel(){ return isAdminMaster(); }
function usersTable(rows){
  if(!rows.length) return '<div class="empty">Sem utilizadores.</div>';
  const actions = isAdminMaster();
  return `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Estado</th><th>Online</th>${actions?'<th>Ações</th>':''}</tr></thead><tbody>${rows.map(u=>`<tr class="${isUserOnline(u)?'user-online-row':''}"><td><strong>${esc(u.nome || '-')}</strong></td><td>${esc(u.email || '-')}</td><td>${badge(u.role || '-')}</td><td>${badge(u.status || '-')}</td><td><span class="badge ${isUserOnline(u)?'green':'blue'}">${esc(userPresenceLabel(u))}</span></td>${actions?`<td><div class="actions">${u.status==='Pendente'?`<button class="btn success small" data-approve-user="${u.id}">Aprovar</button>`:''}<button class="btn small" data-edit-entity="user:${u.id}">Editar</button><button class="btn danger small" data-delete-entity="user:${u.id}">Apagar</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function entityPage(title, formId, fields, rows, cols, type){
  const canEdit = canEditOperational();
  return `<div class="grid single-list entity-modal-page clean-module-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">${esc(title)}</span><h3>Lista</h3></div>
        <div class="clean-stats"><span><b>${rows.length}</b> registos</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions"><button class="btn primary quote-new-btn" type="button" data-create-entity="${esc(type)}">+ Adicionar registo</button></div>` : '<div class="readonly-note">Modo leitura: podes consultar, mas não podes adicionar nem editar.</div>'}
      ${entityTable(rows, cols, type)}
    </div>
  </div>`;
}

function entityTable(rows, cols, type){
  if(!rows.length) return '<div class="empty">Sem registos.</div>';
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}<td><div class="actions">${canEditOperational()?`<button class="btn small" data-edit-entity="${type}:${r.id}">Editar</button>`:'<span class="muted">Consulta</span>'}${canDelete()?`<button class="btn danger small" data-delete-entity="${type}:${r.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function quoteItemsFromLegacy(q){
  if(Array.isArray(q.items) && q.items.length) {
    return q.items.map(item => normalizeQuoteItem(item)).filter(item => item.nome || item.referencia || item.preco);
  }
  if(q.peca || q.referencia || q.precoUnitario || q.total) {
    return [normalizeQuoteItem({
      nome:q.peca || '',
      referencia:q.referencia || '',
      unidade:q.quantidade || q.unidade || 1,
      preco:q.precoUnitario || q.preco || q.total || 0
    })];
  }
  return [normalizeQuoteItem({ nome:'', referencia:'', unidade:1, preco:0 })];
}
function normalizeQuoteItem(item){
  const unidade = Number(String(item?.unidade ?? item?.quantidade ?? 1).replace(',','.')) || 1;
  const preco = Number(String(item?.preco ?? item?.precoUnitario ?? 0).replace(',','.')) || 0;
  return {
    id:item?.id || uid('ITM'),
    nome:String(item?.nome ?? item?.peca ?? '').trim(),
    referencia:String(item?.referencia ?? '').trim(),
    unidade,
    preco,
    total: unidade * preco
  };
}
function quoteItemsTotal(items){
  return (items || []).reduce((sum,item)=>sum + Number(item.total || (Number(item.unidade||0) * Number(item.preco||0))), 0);
}
function quoteMainDescription(q){
  const items = quoteItemsFromLegacy(q);
  if(!items.length) return '-';
  const first = items[0];
  const extra = items.length > 1 ? ` +${items.length - 1} ref.` : '';
  return `${first.nome || first.referencia || '-'}${extra}`;
}
function quoteListArray(value){
  if(Array.isArray(value)) return value.map(v=>String(v || '').trim()).filter(Boolean);
  if(typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if(Array.isArray(parsed)) return parsed.map(v=>String(v || '').trim()).filter(Boolean);
    } catch {}
    return value.split('\n').map(v=>String(v || '').trim()).filter(Boolean);
  }
  return [];
}
function quoteListFromItems(items, field){
  return (items || []).map(item=>{
    if(field === 'refs') return String(item.referencia || item.nome || '').trim();
    if(field === 'qtds') return String(item.unidade || item.quantidade || 1).trim();
    return '';
  }).filter(Boolean);
}
function quoteListSnapshot(source={}, items=[]){
  const refs = quoteListArray(source.listaReferencias || source.quoteListRefsSnapshot || source.quoteListRefs);
  const qtds = quoteListArray(source.listaQuantidades || source.quoteListQtySnapshot || source.quoteListQtys);
  return {
    refs: refs.length ? refs : quoteListFromItems(items, 'refs'),
    qtds: qtds.length ? qtds : quoteListFromItems(items, 'qtds'),
    updatedAt: source.listaAtualizadaAt || source.quoteListUpdatedAtSnapshot || '',
    updatedBy: source.listaAtualizadaPor || source.quoteListUpdatedBySnapshot || ''
  };
}
function quoteListBoxHtml(id, values, emptyText){
  return `<div id="${id}">${values?.length ? values.map(v=>`<div>${esc(v)}</div>`).join('') : `<span class="muted">${esc(emptyText)}</span>`}</div>`;
}
function quoteListHiddenInputs(snapshot){
  return `<input type="hidden" name="quoteListRefsSnapshot" value="${esc(JSON.stringify(snapshot.refs || []))}">
    <input type="hidden" name="quoteListQtySnapshot" value="${esc(JSON.stringify(snapshot.qtds || []))}">
    <input type="hidden" name="quoteListUpdatedAtSnapshot" value="${esc(snapshot.updatedAt || '')}">
    <input type="hidden" name="quoteListUpdatedBySnapshot" value="${esc(snapshot.updatedBy || '')}">`;
}
function readQuoteListSnapshot(form, items=[]){
  const refs = quoteListArray(form?.querySelector('[name="quoteListRefsSnapshot"]')?.value || '');
  const qtds = quoteListArray(form?.querySelector('[name="quoteListQtySnapshot"]')?.value || '');
  return {
    listaReferencias: refs,
    listaQuantidades: qtds,
    listaAtualizadaAt: form?.querySelector('[name="quoteListUpdatedAtSnapshot"]')?.value || '',
    listaAtualizadaPor: form?.querySelector('[name="quoteListUpdatedBySnapshot"]')?.value || ''
  };
}
function setQuoteListHidden(form, snapshot){
  const refsInput = form?.querySelector('[name="quoteListRefsSnapshot"]');
  const qtyInput = form?.querySelector('[name="quoteListQtySnapshot"]');
  const atInput = form?.querySelector('[name="quoteListUpdatedAtSnapshot"]');
  const byInput = form?.querySelector('[name="quoteListUpdatedBySnapshot"]');
  if(refsInput) refsInput.value = JSON.stringify(snapshot.refs || []);
  if(qtyInput) qtyInput.value = JSON.stringify(snapshot.qtds || []);
  if(atInput) atInput.value = snapshot.updatedAt || '';
  if(byInput) byInput.value = snapshot.updatedBy || '';
}
function renderQuoteListSnapshot(form, snapshot){
  const refsBox = form?.querySelector('#quoteFinalRefsList');
  const qtdBox = form?.querySelector('#quoteQuantidadesList');
  const stamp = form?.querySelector('#quoteListUpdatedStamp');
  if(refsBox) refsBox.innerHTML = snapshot.refs?.length ? snapshot.refs.map(v=>`<div>${esc(v)}</div>`).join('') : '<span class="muted">Lista ainda não atualizada.</span>';
  if(qtdBox) qtdBox.innerHTML = snapshot.qtds?.length ? snapshot.qtds.map(v=>`<div>${esc(v)}</div>`).join('') : '<span class="muted">Sem quantidades.</span>';
  if(stamp) stamp.textContent = snapshot.updatedAt ? `Último update: ${formatDatePt(snapshot.updatedAt.slice(0,10))} · ${snapshot.updatedBy || '-'}` : 'Ainda sem update guardado.';
}
function updateQuoteListByAdmin(form){
  if(!isAdminMaster()) return toast('Só o Admin Master pode atualizar esta lista.');
  const items = collectQuoteItems(form);
  const snapshot = {
    refs: quoteListFromItems(items, 'refs'),
    qtds: quoteListFromItems(items, 'qtds'),
    updatedAt: new Date().toISOString(),
    updatedBy: preferredUserName('Admin')
  };
  setQuoteListHidden(form, snapshot);
  renderQuoteListSnapshot(form, snapshot);
  saveQuoteDraft(form);
  toast('Lista do orçamento atualizada. Guarda o orçamento para ficar gravado.');
}

function quoteItemsInputs(items, source={}){
  const rows = (items && items.length ? items : [normalizeQuoteItem({})]);
  const snapshot = quoteListSnapshot(source, rows);
  return `<div class="quote-items-editor" id="quoteItemsEditor">
    <div class="quote-items-head">
      <strong>Referências / peças</strong>
      <button class="btn small ghost" type="button" id="addQuoteItemBtn">+ Adicionar referência</button>
    </div>
    <div class="quote-items-grid quote-items-grid-head">
      <span>Nome</span><span>Referência</span><span>Unidade</span><span>Preço</span><span></span>
    </div>
    <div id="quoteItemsRows">
      ${rows.map((item,idx)=>quoteItemRow(item, idx)).join('')}
    </div>
    <div class="quote-admin-list-panel">
      <div class="pedido-final-summary quote-final-summary">
        <div class="pedido-final-box"><strong>Lista de Referências</strong>${quoteListBoxHtml('quoteFinalRefsList', snapshot.refs, 'Lista ainda não atualizada.')}</div>
        <div class="pedido-final-box"><strong>Quantidades</strong>${quoteListBoxHtml('quoteQuantidadesList', snapshot.qtds, 'Sem quantidades.')}</div>
      </div>
      <div class="quote-list-update-row">
        <span id="quoteListUpdatedStamp">${snapshot.updatedAt ? `Último update: ${formatDatePt(snapshot.updatedAt.slice(0,10))} · ${esc(snapshot.updatedBy || '-')}` : 'Ainda sem update guardado.'}</span>
        ${isAdminMaster()?`<button class="btn primary small" type="button" id="updateQuoteListBtn">Atualizar lista</button>`:`<span class="badge orange">Só Admin Master atualiza</span>`}
      </div>
      ${quoteListHiddenInputs(snapshot)}
    </div>
    <div class="quote-items-total"><span>Total orçamento</span><b id="quoteItemsLiveTotal">${money(quoteItemsTotal(rows))}</b></div>
  </div>`;
}
function quoteItemRow(item={}, idx=0){
  const row = normalizeQuoteItem(item);
  return `<div class="quote-items-grid quote-item-row" data-quote-item-row>
    <input class="field" name="itemNome[]" placeholder="Nome" value="${esc(row.nome)}" required>
    <input class="field" name="itemReferencia[]" placeholder="Referência" value="${esc(row.referencia)}">
    <input class="field" name="itemUnidade[]" type="number" min="0" step="1" placeholder="Unidade" value="${esc(row.unidade || 1)}">
    <input class="field" name="itemPreco[]" type="number" min="0" step="0.01" placeholder="Preço" value="${esc(row.preco || '')}" required>
    <button class="btn danger-soft small" type="button" data-remove-quote-item>×</button>
  </div>`;
}
function collectQuoteItems(form){
  const nomes = [...form.querySelectorAll('[name="itemNome[]"]')].map(x=>x.value);
  const refs = [...form.querySelectorAll('[name="itemReferencia[]"]')].map(x=>x.value);
  const unidades = [...form.querySelectorAll('[name="itemUnidade[]"]')].map(x=>x.value);
  const precos = [...form.querySelectorAll('[name="itemPreco[]"]')].map(x=>x.value);
  return nomes.map((nome,idx)=>normalizeQuoteItem({
    nome,
    referencia:refs[idx],
    unidade:unidades[idx],
    preco:precos[idx]
  })).filter(item => item.nome || item.referencia || item.preco);
}
function refreshQuoteItemsTotal(container=document){
  const form = container.closest?.('form') || qs('#quoteForm') || qs('#editQuoteForm');
  if(!form) return;
  const items = collectQuoteItems(form);
  const el = form.querySelector('#quoteItemsLiveTotal');
  if(el) el.textContent = money(quoteItemsTotal(items));
}
function bindQuoteItemsEditor(scope=document){
  const rootEl = scope && scope.querySelector ? scope : document;
  const rows = rootEl.querySelector('#quoteItemsRows');
  const addBtn = rootEl.querySelector('#addQuoteItemBtn');

  // Evita o bug de adicionar várias linhas de uma vez.
  // Antes, sempre que a função era chamada, o botão recebia mais um listener.
  if(addBtn && rows && !addBtn.dataset.boundQuoteAdd){
    addBtn.dataset.boundQuoteAdd = '1';
    addBtn.addEventListener('click',()=>{
      rows.insertAdjacentHTML('beforeend', quoteItemRow({}, rows.querySelectorAll('[data-quote-item-row]').length));
      bindQuoteItemsEditor(rootEl);
      refreshQuoteItemsTotal(rows);
    });
  }

  rows?.querySelectorAll('[data-remove-quote-item]').forEach(btn=>{
    if(btn.dataset.boundQuoteRemove) return;
    btn.dataset.boundQuoteRemove = '1';
    btn.addEventListener('click',()=>{
      const allRows = rows.querySelectorAll('[data-quote-item-row]');
      if(allRows.length <= 1) return toast('O orçamento precisa de pelo menos uma referência.');
      btn.closest('[data-quote-item-row]')?.remove();
      refreshQuoteItemsTotal(rows);
    });
  });

  rows?.querySelectorAll('input').forEach(input=>{
    if(input.dataset.boundQuoteInput) return;
    input.dataset.boundQuoteInput = '1';
    input.addEventListener('input',()=>refreshQuoteItemsTotal(rows));
  });
  const updateListBtn = rootEl.querySelector('#updateQuoteListBtn');
  if(updateListBtn && !updateListBtn.dataset.boundQuoteListUpdate){
    updateListBtn.dataset.boundQuoteListUpdate = '1';
    updateListBtn.addEventListener('click',()=>updateQuoteListByAdmin(rootEl.querySelector('form') || rootEl.closest?.('form') || qs('#quoteForm') || qs('#editQuoteForm')));
  }
}

function quoteDraftKey(){ return 'bragalis_quote_draft_v1'; }
function saveQuoteDraft(form){
  try{
    if(!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.items = collectQuoteItems(form);
    localStorage.setItem(quoteDraftKey(), JSON.stringify({ data, savedAt:new Date().toISOString() }));
  }catch(err){ console.warn('quote draft save failed', err); }
}
function getQuoteDraft(){
  try{ return JSON.parse(localStorage.getItem(quoteDraftKey()) || 'null'); }catch{ return null; }
}
function clearQuoteDraft(){
  try{ localStorage.removeItem(quoteDraftKey()); }catch{}
}
function quoteCreateFormHtmlFromDraft(draft=null){
  const data = draft?.data || {};
  const items = Array.isArray(data.items) && data.items.length ? data.items : [normalizeQuoteItem({ nome:'', referencia:'', unidade:1, preco:0 })];
  return `<form id="quoteForm" class="form-grid quote-modal-form">
    ${quoteClientSearchHtml(data.codigoCliente ? `${data.codigoCliente} - ${data.cliente || ''}` : (data.cliente || ''))}
    <input class="field" name="codigoCliente" placeholder="Código cliente" value="${esc(data.codigoCliente||'')}">
    <input class="field" name="telefone" placeholder="Telefone" value="${esc(data.telefone||'')}">
    <input class="field" name="email" placeholder="Email do cliente" value="${esc(data.email||'')}">
    <input class="field span3" name="matricula" placeholder="Matrícula" value="${esc(data.matricula||'')}">
    <input class="field span3" name="marcaModelo" placeholder="Marca & Modelo" value="${esc(data.marcaModelo||'')}">
    <input class="field span3" name="motor" placeholder="Motor" value="${esc(data.motor||'')}">
    <div class="span3">${quoteItemsInputs(items, data)}</div>
    <select class="select" name="estado">${['Rascunho','Enviado','Aceite','Recusado'].map(s=>`<option ${String(data.estado||'Rascunho')===s?'selected':''}>${s}</option>`).join('')}</select>
    <input class="field" name="validade" type="date" value="${esc(data.validade||today())}">
    <input class="field" name="prazoEntrega" placeholder="Prazo de entrega" value="${esc(data.prazoEntrega||'')}">
    <textarea class="span3" name="condicoes" placeholder="Condições comerciais">${esc(data.condicoes||'Preços sujeitos a disponibilidade da peça no momento da confirmação.')}</textarea>
    <textarea class="span3" name="observacoes" placeholder="Notas internas">${esc(data.observacoes||'')}</textarea>
    <div class="span3 actions quote-draft-actions">
      <button class="btn ghost" type="button" id="clearQuoteDraftBtn">Limpar rascunho</button>
      <button class="btn primary" type="submit">Criar orçamento</button>
    </div>
  </form>`;
}
function quoteMatchesSearch(q, query){
  const s = String(query || '').toLowerCase().trim();
  if(!s) return true;
  const items = quoteItemsFromLegacy(q);
  const v = quoteVehicleParts(q);
  const hay = [
    q.id, q.cliente, q.codigoCliente, q.estado, q.createdAt,
    v.matricula, v.marcaModelo, v.motor, q.viatura,
    ...items.flatMap(item=>[item.nome,item.referencia,item.unidade,item.preco])
  ].join(' ').toLowerCase();
  return hay.includes(s);
}
function filterQuotes(){
  const query = qs('#quoteSearch')?.value || '';
  const status = qs('#quoteStatusFilter')?.value || '';
  return (state.quotes || []).filter(q => (!status || q.estado === status) && quoteMatchesSearch(q, query));
}
function quoteStateCounts(){
  const states = ['Rascunho','Enviado','Aceite','Recusado'];
  return states.map(s=>[s,(state.quotes||[]).filter(q=>q.estado===s).length]);
}
function orcamentos(){
  const canEdit = canEditOperational();
  const rows = filterQuotes();
  const total = state.quotes.length;
  const totalValue = state.quotes.reduce((sum,q)=>sum + Number(q.total || quoteItemsTotal(quoteItemsFromLegacy(q)) || 0), 0);
  const draft = getQuoteDraft();
  const statusButtons = quoteStateCounts().map(([s,count])=>`<button class="quote-filter-chip" data-set-quote-status="${esc(s)}" type="button">${esc(s)} <b>${count}</b></button>`).join('');
  return `<div class="quotes-page clean-module-page quote-modal-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Orçamentos</span><h3>Propostas comerciais</h3></div>
        <div class="clean-stats"><span><b>${total}</b> registos</span><span><b>${money(totalValue)}</b> total</span></div>
      </div>
      <div class="quote-page-actions">
        ${canEdit ? `<button class="btn primary quote-new-btn" id="openNewQuoteModalBtn" type="button">${draft ? 'Continuar Rascunho' : '+ Novo Orçamento'}</button>` : ''}
      </div>
      <div class="quote-filter-bar">
        <input id="quoteSearch" class="field" placeholder="Pesquisar por matrícula, marca/modelo, motor, referência, peça, cliente ou nº orçamento">
        <select id="quoteStatusFilter" class="select"><option value="">Todos os estados</option><option>Rascunho</option><option>Enviado</option><option>Aceite</option><option>Recusado</option></select>
        <div class="quote-filter-chips">${statusButtons}<button class="quote-filter-chip ghost" data-set-quote-status="" type="button">Todos</button></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar e enviar orçamento por email, mas não podes criar nem alterar estados.</div>' : ''}
      ${rows.length ? quotesTable(rows) : '<div class="empty">Sem orçamentos para estes filtros.</div>'}
    </div>
  </div>`;
}
function quotesTable(rows=state.quotes){
  return `<div class="clean-card-list quote-card-list">${rows.map(q=>{
    const items = quoteItemsFromLegacy(q);
    const total = Number(q.total || quoteItemsTotal(items));
    const stateSlug = normalizeText(q.estado || 'Rascunho').replace(/[^a-z0-9]+/g,'-');
    const creator = quoteCreatorName(q);
    return `<article class="clean-data-card quote-data-card quote-status-${stateSlug}">
      <div class="card-user-highlight quote-user-highlight">${ICONS.users}<span>Orçamento criado por</span><strong>${esc(creator || '-')}</strong></div>
      <div class="data-card-main">
        <span class="data-card-code big-visible-code">${esc(q.id)}</span>
        <strong class="card-primary-title">${esc(q.cliente || '-')}</strong>
        <small class="card-secondary-line">${esc(quoteVehicleLabel(q))}</small>
        <div class="card-info-grid quote-info-grid">
          <span><b>Referências</b><em>${items.length} · ${esc(quoteMainDescription(q))}</em></span>
          <span><b>Validade</b><em>${esc(formatDatePt(q.validade || q.createdAt || today()))}</em></span>
          <span><b>Total</b><em>${money(total)}</em></span>
        </div>
      </div>
      <div class="quote-value-box">
        <b>${money(total)}</b>
        ${badge(q.estado)}
      </div>
      <div class="actions data-card-actions">
        <button class="btn small" data-print-quote="${q.id}">PDF</button>
        <button class="btn success small" data-email-quote="${q.id}">Email</button>
        ${canEditOperational()?`<button class="btn small ghost" data-edit-quote="${q.id}">${ICONS.edit}<span>Editar</span></button><button class="btn success small" data-quote-status="${q.id}:Aceite">Aceite</button><button class="btn warn small" data-quote-status="${q.id}:Recusado">Recusado</button>`:''}
        ${canDelete()?`<button class="btn danger small" data-delete-quote="${q.id}">Apagar</button>`:''}
      </div>
    </article>`;
  }).join('')}</div>`;
}

function uniqueSorted(values){
  return [...new Set((values || []).map(v=>String(v || '').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'pt',{sensitivity:'base',numeric:true}));
}
function deriveVehiclesFromRoutes(routes){
  const map = new Map();
  (routes || []).forEach(r=>{
    const name = String(r.viatura || '').trim();
    if(!name) return;
    const key = normalizeText(name);
    if(!map.has(key)) {
      map.set(key, { id:uid('VEI'), viatura:name, matricula:r.matricula || '', marca:'', modelo:'', observacoes:'' });
    } else if(r.matricula && !map.get(key).matricula) {
      map.get(key).matricula = r.matricula;
    }
  });
  return [...map.values()].sort((a,b)=>String(a.viatura||'').localeCompare(String(b.viatura||''),'pt',{sensitivity:'base'}));
}
function routeVehicles(){
  state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
  if(!state.vehicles.length && Array.isArray(state.routes)) state.vehicles = deriveVehiclesFromRoutes(state.routes);
  return [...state.vehicles].sort((a,b)=>String(a.viatura||'').localeCompare(String(b.viatura||''),'pt',{sensitivity:'base'}));
}
function vehicleOptions(selected=''){
  return routeVehicles().map(v=>`<option value="${esc(v.viatura)}" data-matricula="${esc(v.matricula||'')}">${esc(v.matricula ? `${v.viatura} · ${v.matricula}` : v.viatura)}</option>`).join('');
}
function routeMemoryOptions(field){
  return uniqueSorted((state.routes || []).map(r=>r[field])).map(v=>`<option value="${esc(v)}"></option>`).join('');
}
function vehicleByName(name){
  const n = normalizeText(name);
  return routeVehicles().find(v=>normalizeText(v.viatura)===n);
}
function upsertVehicleFromRoute(route){
  if(!route?.viatura) return;
  state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
  const existing = state.vehicles.find(v=>normalizeText(v.viatura)===normalizeText(route.viatura));
  if(existing){
    if(route.matricula && !existing.matricula) existing.matricula = route.matricula;
  } else {
    state.vehicles.push({ id:uid('VEI'), viatura:route.viatura, matricula:route.matricula || '', marca:'', modelo:'', observacoes:'' });
  }
}
function vehiclesMiniTable(){
  const rows = routeVehicles();
  if(!rows.length) return '<div class="empty compact-empty">Ainda não existem viaturas.</div>';
  return `<div class="vehicle-mini-list">${rows.map(v=>`
    <article class="vehicle-mini-row">
      <div><strong>${esc(v.viatura || '-')}</strong><span>${esc([v.marca,v.modelo].filter(Boolean).join(' ') || 'Sem marca/modelo')}</span></div>
      <b>${esc(v.matricula || 'Sem matrícula')}</b>
      <div class="actions">
        ${canEditOperational()?`<button class="btn small ghost" type="button" data-edit-vehicle="${v.id}">${ICONS.edit}<span>Editar</span></button>`:''}
        ${canDelete()?`<button class="btn danger small" type="button" data-delete-vehicle="${v.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}

function rotas(){
  state.routes = Array.isArray(state.routes) ? state.routes : [];
  state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : deriveVehiclesFromRoutes(state.routes);
  const canEdit = canEditOperational();
  const rows = filterRoutes();
  const all = state.routes || [];
  const vehicles = uniqueSorted([...routeVehicles().map(v=>v.viatura), ...all.map(r=>r.viatura)]);
  const drivers = uniqueSorted(all.map(r=>r.condutor));
  const totalKm = rows.reduce((sum,r)=>sum + routeKm(r), 0);
  return `<div class="grid single-list routes-page clean-module-page">
    <div class="card clean-main-card routes-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Rotas</span><h3>Mapa de serviços</h3></div>
        <div class="clean-stats"><span><b>${rows.length}</b> registos</span><span><b>${totalKm}</b> km</span><span><b>${vehicles.length}</b> viaturas</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions">
        <button class="btn primary quote-new-btn" id="openRouteCreateBtn" type="button">+ Adicionar registo</button>
        <button class="btn ghost quote-new-btn" id="openVehicleCreateBtn" type="button">+ Adicionar viatura</button>
      </div>` : '<div class="readonly-note">Modo leitura: podes consultar rotas, mas não podes adicionar nem editar.</div>'}
      <div class="routes-filter-row">
        <input id="routeSearch" class="field" placeholder="Pesquisar viatura, matrícula, destino, condutor, pedido...">
        <select id="routeVehicleFilter" class="select"><option value="">Todas as viaturas</option>${vehicles.map(v=>`<option>${esc(v)}</option>`).join('')}</select>
        <select id="routeDriverFilter" class="select"><option value="">Todos os condutores</option>${drivers.map(d=>`<option>${esc(d)}</option>`).join('')}</select>
        <input id="routeDateFrom" class="field" type="date" title="Data inicial">
        <input id="routeDateTo" class="field" type="date" title="Data final">
      </div>
      ${isAdminMaster() && all.length ? `<div class="route-danger-zone">
        <div>
          <strong>Zona de segurança</strong>
          <span>Apaga todos os registos de rotas. Só Admin Master.</span>
        </div>
        <button class="btn danger" id="deleteAllRoutesBtn" type="button">Apagar todos os registos</button>
      </div>` : ''}
      <div class="vehicles-inline-box">${canEdit ? vehiclesMiniTable() : ''}</div>
      <div id="routesTable">${routesTable(rows)}</div>
    </div>
  </div>`;
}

function routeKm(r){
  const saved = Number(r.kmPercorridos || 0);
  if(saved) return saved;
  const ini = Number(r.kmInicio || 0);
  const fim = Number(r.kmFim || 0);
  return ini && fim && fim >= ini ? fim - ini : 0;
}
function filterRoutes(){
  const q = (qs('#routeSearch')?.value || '').toLowerCase();
  const vehicle = qs('#routeVehicleFilter')?.value || '';
  const driver = qs('#routeDriverFilter')?.value || '';
  const from = qs('#routeDateFrom')?.value || '';
  const to = qs('#routeDateTo')?.value || '';
  return [...(state.routes || [])].filter(r=>{
    const blob = `${r.viatura||''} ${r.matricula||''} ${r.data||''} ${r.pedidoPor||''} ${r.destino||''} ${r.periodo||''} ${r.carga||''} ${r.condutor||''}`.toLowerCase();
    if(q && !blob.includes(q)) return false;
    if(vehicle && r.viatura !== vehicle) return false;
    if(driver && r.condutor !== driver) return false;
    if(from && String(r.data||'') < from) return false;
    if(to && String(r.data||'') > to) return false;
    return true;
  }).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')) || String(a.viatura||'').localeCompare(String(b.viatura||''),'pt',{sensitivity:'base'}));
}
function routesTable(rows){
  if(!rows.length) return '<div class="empty">Sem rotas encontradas.</div>';
  return `<div class="clean-card-list routes-card-list">${rows.map(r=>`
    <article class="clean-data-card route-data-card">
      <div class="data-card-main">
        <strong>${esc(r.viatura || '-')}</strong>
        <small>${esc(r.matricula || '')} · ${esc(formatDatePt(r.data))}</small>
      </div>
      <div class="route-destination-box">
        <b>${esc(r.destino || '-')}</b>
        <span>${esc(r.pedidoPor || '-')} · ${esc(r.periodo || '-')} · ${esc(r.carga || '-')}</span>
      </div>
      <div class="route-driver-box">
        <span class="badge blue">${esc(r.condutor || 'Sem condutor')}</span>
        <small>${esc(r.horaInicio || '-')} → ${esc(r.horaFim || '-')}</small>
        ${r.entregue || r.dataEntrega ? `<small class="route-delivered-note">Entregue: ${esc(formatDatePt(r.dataEntrega))} ${esc(r.horaEntrega || '')}</small>` : '<small class="route-pending-note">Por entregar</small>'}
      </div>
      <div class="card-code-center">
        <span class="data-card-code big-visible-code">${routeKm(r)} km</span>
      </div>
      <div class="actions data-card-actions">
        ${canEditOperational() && !(r.entregue || r.dataEntrega) ? `<button class="btn success small" data-deliver-route="${r.id}">Entregar</button>` : ''}
        ${canEditOperational()?`<button class="btn small ghost" data-edit-route="${r.id}">${ICONS.edit}<span>Editar</span></button>`:'<span class="muted">Consulta</span>'}
        ${canDelete()?`<button class="btn danger small" data-delete-route="${r.id}">Apagar</button>`:''}
      </div>
    </article>`).join('')}</div>`;
}
function formatDatePt(iso){
  if(!iso) return '-';
  const parts = String(iso).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}
function routeCreateFormHtml(){
  return `<form id="routeForm" class="simple-stack-form route-form modal-stack-form">
    <select class="select" name="viatura" id="routeVehicleSelect" required>
      <option value="">Selecionar viatura</option>
      ${vehicleOptions()}
    </select>
    <input class="field" name="matricula" id="routePlateInput" placeholder="Matrícula">
    <input class="field" name="data" type="date" value="${today()}" required>
    <input class="field" name="pedidoPor" list="routeRequesterList" placeholder="Pedido por">
    <datalist id="routeRequesterList">${routeMemoryOptions('pedidoPor')}</datalist>
    <input class="field" name="destino" list="routeDestinationList" placeholder="Destino / serviço" required>
    <datalist id="routeDestinationList">${routeMemoryOptions('destino')}</datalist>
    <select class="select" name="periodo"><option>Manhã</option><option>Tarde</option><option>M</option><option>Dia</option></select>
    <input class="field" name="carga" placeholder="Carga">
    <input class="field" name="condutor" list="routeDriverList" placeholder="Condutor">
    <datalist id="routeDriverList">${routeMemoryOptions('condutor')}</datalist>
    <div class="mini-two-fields"><input class="field" name="kmInicio" type="number" placeholder="KM início"><input class="field" name="kmFim" type="number" placeholder="KM fim"></div>
    <div class="mini-two-fields"><input class="field" name="horaInicio" placeholder="Hora início"><input class="field" name="horaFim" placeholder="Hora fim"></div>
    <textarea name="observacoes" placeholder="Observações"></textarea>
    <button class="btn primary full" type="submit">Guardar rota</button>
  </form>`;
}
function vehicleCreateFormHtml(){
  return `<form id="vehicleForm" class="simple-stack-form vehicle-form modal-stack-form">
    <input class="field" name="viatura" placeholder="Nome da viatura" required>
    <input class="field" name="matricula" placeholder="Matrícula" required>
    <div class="mini-two-fields"><input class="field" name="marca" placeholder="Marca"><input class="field" name="modelo" placeholder="Modelo"></div>
    <textarea name="observacoes" placeholder="Observações"></textarea>
    <button class="btn primary full" type="submit">Guardar viatura</button>
  </form>`;
}
function openRouteCreateModal(){
  if(!canEditOperational()) return toast('Sem permissão para guardar rotas.');
  openModal('Nova rota', routeCreateFormHtml());
  bindRouteCreateForm(qs('#routeForm'));
}
function openVehicleCreateModal(){
  if(!canEditOperational()) return toast('Sem permissão para guardar viaturas.');
  openModal('Adicionar viatura', vehicleCreateFormHtml());
  bindVehicleCreateForm(qs('#vehicleForm'));
}
function bindRouteCreateForm(form){
  if(!form) return;
  const vehicleSelect = form.querySelector('#routeVehicleSelect');
  if(vehicleSelect) vehicleSelect.addEventListener('change',()=>{
    const vehicle = vehicleByName(vehicleSelect.value);
    const plate = form.querySelector('#routePlateInput');
    if(plate && vehicle?.matricula) plate.value = vehicle.matricula;
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar rotas.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const route = normalizeRouteData({ id:uid('ROT'), ...data });
    state.routes = Array.isArray(state.routes) ? state.routes : [];
    state.routes.push(route);
    upsertVehicleFromRoute(route);
    saveState(); closeModal(); renderPage('rotas'); toast('Rota guardada.');
  });
}
function bindVehicleCreateForm(form){
  if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar viaturas.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
    const cleanName = String(data.viatura || '').trim();
    const existing = state.vehicles.find(v=>normalizeText(v.viatura)===normalizeText(cleanName) || (data.matricula && normalizeText(v.matricula)===normalizeText(data.matricula)));
    const payload = { id: existing?.id || uid('VEI'), viatura:cleanName, matricula:String(data.matricula||'').trim(), marca:String(data.marca||'').trim(), modelo:String(data.modelo||'').trim(), observacoes:String(data.observacoes||'').trim() };
    if(existing) Object.assign(existing, payload);
    else state.vehicles.push(payload);
    saveState(); closeModal(); renderPage('rotas'); toast('Viatura guardada.');
  });
}
function bindRoutes(){
  qs('#openRouteCreateBtn')?.addEventListener('click', openRouteCreateModal);
  qs('#openVehicleCreateBtn')?.addEventListener('click', openVehicleCreateModal);
  ['routeSearch','routeVehicleFilter','routeDriverFilter','routeDateFrom','routeDateTo'].forEach(id=>{
    const el = qs('#'+id);
    if(el) el.addEventListener('input',()=>{ qs('#routesTable').innerHTML = routesTable(filterRoutes()); bindRouteActions(); });
  });

  const vehicleSelect = qs('#routeVehicleSelect');
  if(vehicleSelect) vehicleSelect.addEventListener('change',()=>{
    const vehicle = vehicleByName(vehicleSelect.value);
    const plate = qs('#routePlateInput');
    if(plate && vehicle?.matricula) plate.value = vehicle.matricula;
  });

  const form = qs('#routeForm');
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar rotas.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const route = normalizeRouteData({ id:uid('ROT'), ...data });
    state.routes = Array.isArray(state.routes) ? state.routes : [];
    state.routes.push(route);
    upsertVehicleFromRoute(route);
    saveState(); renderPage('rotas'); toast('Rota guardada.');
  });

  const vehicleForm = qs('#vehicleForm');
  if(vehicleForm) vehicleForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar viaturas.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
    const cleanName = String(data.viatura || '').trim();
    const existing = state.vehicles.find(v=>normalizeText(v.viatura)===normalizeText(cleanName) || (data.matricula && normalizeText(v.matricula)===normalizeText(data.matricula)));
    const payload = { id: existing?.id || uid('VEI'), viatura:cleanName, matricula:String(data.matricula||'').trim(), marca:String(data.marca||'').trim(), modelo:String(data.modelo||'').trim(), observacoes:String(data.observacoes||'').trim() };
    if(existing) Object.assign(existing, payload);
    else state.vehicles.push(payload);
    saveState(); renderPage('rotas'); toast('Viatura guardada.');
  });

  const deleteAllRoutesBtn = qs('#deleteAllRoutesBtn');
  if(deleteAllRoutesBtn) deleteAllRoutesBtn.addEventListener('click', openDeleteAllRoutesModal);

  bindRouteActions();
  bindVehicleActions();
}
function normalizeRouteData(data){
  const ini = parseKmValue(data.kmInicio);
  const fim = parseKmValue(data.kmFim);
  const vehicle = vehicleByName(data.viatura);
  return {
    ...data,
    viatura:String(data.viatura || '').trim(),
    matricula:String(data.matricula || vehicle?.matricula || '').trim(),
    data: parseExcelDateValue(data.data) || today(),
    pedidoPor:String(data.pedidoPor || '').trim(),
    destino:String(data.destino || '').trim(),
    periodo:String(data.periodo || '').trim(),
    carga:String(data.carga || '').trim(),
    condutor:String(data.condutor || '').trim(),
    kmInicio: ini,
    horaInicio: parseExcelTimeValue(data.horaInicio),
    kmFim: fim,
    horaFim: parseExcelTimeValue(data.horaFim),
    kmPercorridos: parseKmValue(data.kmPercorridos) || (ini && fim && fim >= ini ? fim - ini : 0),
    dataEntrega: parseExcelDateValue(data.dataEntrega),
    horaEntrega: parseExcelTimeValue(data.horaEntrega),
    entregue: data.entregue === true || data.entregue === 'true' || !!data.dataEntrega,
    observacoes:String(data.observacoes || '').trim()
  };
}
function openDeleteAllRoutesModal(){
  if(!isAdminMaster()) return toast('Só o Admin Master pode apagar todos os registos.');
  const total = (state.routes || []).length;
  if(!total) return toast('Não existem rotas para apagar.');
  openModal('Apagar todos os registos de rotas', `<div class="danger-confirm-box">
    <div class="danger-confirm-icon">⚠️</div>
    <div>
      <h3>Esta ação apaga ${total} registo(s) de rotas.</h3>
      <p>As fichas de viaturas ficam guardadas. Só serão apagados os registos da página Rotas.</p>
      <p>Para confirmar, escreve exatamente:</p>
      <code>APAGAR ROTAS</code>
    </div>
  </div>
  <form id="deleteAllRoutesForm" class="form-grid">
    <input class="field span3" name="confirmText" placeholder="Escreve APAGAR ROTAS" autocomplete="off" required>
    <label class="checkline span3"><input type="checkbox" name="confirmCheck"> Confirmo que quero apagar todos os registos de rotas.</label>
    <div class="span3 actions">
      <button class="btn ghost" type="button" id="cancelDeleteAllRoutesBtn">Cancelar</button>
      <button class="btn danger" type="submit">Apagar definitivamente</button>
    </div>
  </form>`);
  qs('#cancelDeleteAllRoutesBtn')?.addEventListener('click', closeModal);
  qs('#deleteAllRoutesForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if(String(data.confirmText || '').trim() !== 'APAGAR ROTAS') return toast('Confirmação incorreta.');
    if(data.confirmCheck !== 'on') return toast('Tens de marcar a confirmação.');
    state.routes = [];
    saveState('Todos os registos de rotas apagados');
    if(firebaseReady && firebaseAuth?.currentUser && !firebaseAuth.currentUser.isAnonymous){
      await pushCloudState({ source:'delete-all-routes' });
    }
    closeModal();
    renderPage('rotas');
    toast('Todos os registos de rotas foram apagados.');
  });
}

function bindRouteActions(){
  qsa('[data-delete-route]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canDelete()) return toast('Sem permissão para apagar.');
    state.routes = (state.routes || []).filter(r=>r.id!==btn.dataset.deleteRoute);
    saveState(); renderPage('rotas'); toast('Rota apagada.');
  }));
  qsa('[data-edit-route]').forEach(btn=>btn.addEventListener('click',()=>openRouteModal(btn.dataset.editRoute)));
  qsa('[data-deliver-route]').forEach(btn=>btn.addEventListener('click',()=>openDeliverRouteModal(btn.dataset.deliverRoute)));
}
function bindVehicleActions(){
  qsa('[data-delete-vehicle]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canDelete()) return toast('Sem permissão para apagar.');
    state.vehicles = (state.vehicles || []).filter(v=>v.id!==btn.dataset.deleteVehicle);
    saveState(); renderPage('rotas'); toast('Viatura apagada.');
  }));
  qsa('[data-edit-vehicle]').forEach(btn=>btn.addEventListener('click',()=>openVehicleModal(btn.dataset.editVehicle)));
}
function openVehicleModal(id){
  const v = (state.vehicles || []).find(x=>x.id===id);
  if(!v) return;
  openModal('Editar viatura', `<form id="editVehicleForm" class="form-grid">
    <input class="field" name="viatura" placeholder="Nome da viatura" value="${esc(v.viatura||'')}" required>
    <input class="field" name="matricula" placeholder="Matrícula" value="${esc(v.matricula||'')}" required>
    <input class="field" name="marca" placeholder="Marca" value="${esc(v.marca||'')}">
    <input class="field" name="modelo" placeholder="Modelo" value="${esc(v.modelo||'')}">
    <textarea class="span3" name="observacoes" placeholder="Observações">${esc(v.observacoes||'')}</textarea>
    <div class="span3"><button class="btn primary">Guardar viatura</button></div>
  </form>`);
  qs('#editVehicleForm').addEventListener('submit',e=>{
    e.preventDefault();
    Object.assign(v, Object.fromEntries(new FormData(e.target).entries()));
    saveState(); closeModal(); renderPage('rotas'); toast('Viatura atualizada.');
  });
}

function openDeliverRouteModal(id){
  const r = (state.routes || []).find(x=>x.id===id);
  if(!r) return;
  if(!canEditOperational()) return toast('Sem permissão para entregar rotas.');
  openModal('Entregar rota', `<div class="route-deliver-summary">
    <strong>${esc(r.viatura || '-')} · ${esc(r.matricula || '')}</strong>
    <span>${esc(r.destino || '-')} · ${esc(formatDatePt(r.data))}</span>
  </div>
  <form id="deliverRouteForm" class="form-grid">
    <input class="field" name="dataEntrega" type="date" value="${esc(r.dataEntrega || today())}" required>
    <input class="field" name="horaEntrega" type="time" value="${esc(r.horaEntrega || currentTimeHM())}" required>
    <textarea class="span3" name="observacoesEntrega" placeholder="Observações de entrega">${esc(r.observacoesEntrega || '')}</textarea>
    <div class="span3 actions">
      <button class="btn ghost" type="button" id="autoDeliverRouteBtn">Automático agora</button>
      <button class="btn success" type="submit">Confirmar entrega</button>
    </div>
  </form>`);
  qs('#autoDeliverRouteBtn')?.addEventListener('click',()=>{
    const form = qs('#deliverRouteForm');
    form.elements.dataEntrega.value = today();
    form.elements.horaEntrega.value = currentTimeHM();
  });
  qs('#deliverRouteForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    r.entregue = true;
    r.dataEntrega = parseExcelDateValue(data.dataEntrega) || today();
    r.horaEntrega = parseExcelTimeValue(data.horaEntrega) || currentTimeHM();
    r.observacoesEntrega = String(data.observacoesEntrega || '').trim();
    saveState('Rota entregue');
    closeModal();
    renderPage('rotas');
    toast('Rota marcada como entregue.');
  });
}

function openRouteModal(id){
  const r = (state.routes || []).find(x=>x.id===id);
  if(!r) return;
  openModal('Editar rota', `<form id="editRouteForm" class="form-grid">
    <select class="select" name="viatura" id="editRouteVehicleSelect" required><option value="${esc(r.viatura||'')}">${esc(r.viatura||'Selecionar viatura')}</option>${vehicleOptions(r.viatura)}</select>
    <input class="field" name="matricula" id="editRoutePlateInput" placeholder="Matrícula" value="${esc(r.matricula||'')}">
    <input class="field" name="data" type="date" value="${esc(r.data||today())}" required>
    <input class="field" name="pedidoPor" list="editRouteRequesterList" placeholder="Pedido por" value="${esc(r.pedidoPor||'')}"><datalist id="editRouteRequesterList">${routeMemoryOptions('pedidoPor')}</datalist>
    <input class="field" name="destino" list="editRouteDestinationList" placeholder="Destino / serviço" value="${esc(r.destino||'')}" required><datalist id="editRouteDestinationList">${routeMemoryOptions('destino')}</datalist>
    <input class="field" name="periodo" placeholder="Período" value="${esc(r.periodo||'')}">
    <input class="field" name="carga" placeholder="Carga" value="${esc(r.carga||'')}">
    <input class="field" name="condutor" list="editRouteDriverList" placeholder="Condutor" value="${esc(r.condutor||'')}"><datalist id="editRouteDriverList">${routeMemoryOptions('condutor')}</datalist>
    <input class="field" name="kmInicio" type="number" placeholder="KM início" value="${esc(r.kmInicio||'')}">
    <input class="field" name="kmFim" type="number" placeholder="KM fim" value="${esc(r.kmFim||'')}">
    <input class="field" name="horaInicio" placeholder="Hora início" value="${esc(r.horaInicio||'')}">
    <input class="field" name="horaFim" placeholder="Hora fim" value="${esc(r.horaFim||'')}">
    <input class="field" name="dataEntrega" type="date" value="${esc(r.dataEntrega||'')}" title="Data de entrega">
    <input class="field" name="horaEntrega" type="time" value="${esc(r.horaEntrega||'')}" title="Hora de entrega">
    <label class="checkline"><input type="checkbox" name="entregue" ${r.entregue || r.dataEntrega ? 'checked' : ''}> Entregue</label>
    <textarea class="span3" name="observacoes" placeholder="Observações">${esc(r.observacoes||'')}</textarea>
    <textarea class="span3" name="observacoesEntrega" placeholder="Observações de entrega">${esc(r.observacoesEntrega||'')}</textarea>
    <div class="span3"><button class="btn primary">Guardar alterações</button></div>
  </form>`);
  const editVehicleSelect = qs('#editRouteVehicleSelect');
  if(editVehicleSelect) editVehicleSelect.addEventListener('change',()=>{
    const vehicle = vehicleByName(editVehicleSelect.value);
    const plate = qs('#editRoutePlateInput');
    if(plate && vehicle?.matricula) plate.value = vehicle.matricula;
  });
  qs('#editRouteForm').addEventListener('submit',e=>{
    e.preventDefault();
    Object.assign(r, normalizeRouteData({ ...r, ...Object.fromEntries(new FormData(e.target).entries()) }));
    upsertVehicleFromRoute(r);
    saveState(); closeModal(); renderPage('rotas'); toast('Rota atualizada.');
  });
}

function agenda(){
  const canEdit = canEditOperational();
  return `<div class="grid single-list agenda-page clean-module-page">
    <div class="card clean-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Agenda</span><h3>Follow-ups</h3></div>
        <div class="clean-stats"><span><b>${state.followups.length}</b> registos</span></div>
      </div>
      ${canEdit ? `<div class="quote-page-actions"><button class="btn primary quote-new-btn" type="button" id="openFollowCreateBtn">+ Adicionar registo</button></div>` : ''}
      ${entityTable(state.followups, ['date','time','title','related','status'], 'follow')}
    </div>
  </div>`;
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
  const managed = managedPageList();
  const users = (state.users || []).filter(u => (u.role || 'Operador') !== 'Admin Master');
  const actions = [
    ['view','Visível'],
    ['add','Adicionar'],
    ['edit','Editar'],
    ['delete','Apagar']
  ];
  return `<div class="card permissions-card span-all unified-permissions-card">
    <div class="card-head">
      <div>
        <h3>Permissões por utilizador</h3>
        <span class="muted">Para esconder uma página a um user, tira o visto em <b>Visível</b>. Também podes usar “Esconder tudo”.</span>
      </div>
    </div>
    <form id="permissionsForm" class="permissions-form unified-permissions-form">
      ${users.length ? users.map((u,idx)=>{
        u.permissions = normalizeUserPermissions(u);
        const hiddenCount = managed.filter(p=>!userPagePermissions(u,p.id).view).length;
        return `<details class="user-permission-accordion" data-permission-user="${u.id}" ${idx===0?'open':''}>
          <summary>
            <div class="permission-user-summary">
              <strong>${esc(u.nome || u.email || '-')}</strong>
              <span>${esc(u.email || '')} · ${esc(u.role || 'Operador')} · ${esc(u.status || 'Ativo')}</span>
            </div>
            <b>${hiddenCount ? `${hiddenCount} escondida(s)` : 'Permissões'}</b>
          </summary>
          <div class="permission-user-tools">
            <button class="btn small ghost" type="button" data-user-perm-preset="${u.id}:readonly">Só consulta</button>
            <button class="btn small" type="button" data-user-perm-preset="${u.id}:all">Acesso total</button>
            <button class="btn danger-soft small" type="button" data-user-perm-preset="${u.id}:hidden">Esconder tudo</button>
          </div>
          <div class="user-permission-pages">
            ${managed.map(p=>{
              const perm = userPagePermissions(u,p.id);
              return `<div class="page-permission-row ${perm.view ? '' : 'page-hidden-row'}" data-permission-row="${u.id}:${p.id}">
                <div class="page-permission-title">
                  <span class="page-permission-icon">${p.icon}</span>
                  <div><strong>${esc(p.title)}</strong><small>${perm.view ? esc(p.subtitle || '') : 'Escondida para este utilizador'}</small></div>
                </div>
                <div class="page-permission-actions">
                  ${actions.map(([key,label])=>`<label class="permission-pill ${key==='view'?'visible-pill':''} ${key==='delete'?'danger-pill':''}">
                    <input type="checkbox" name="perm:${u.id}:${p.id}:${key}" data-permission-input="${key}" ${perm[key]===true?'checked':''}>
                    <span>${esc(label)}</span>
                  </label>`).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>
        </details>`;
      }).join('') : '<div class="empty compact">Ainda não tens utilizadores criados.</div>'}
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
    
      <section class="user-setting-section">
        <div class="setting-title"><strong>Modo ligação remota</strong><span>Remove efeitos pesados para Windows remoto/Remote Desktop.</span></div>
        <div class="theme-choice-box">
          <div>
            <strong>${state.settings?.remoteFastMode === false ? 'Modo remoto desligado' : 'Modo remoto ativo'}</strong>
            <span>Menos blur, sombras e animações para a app responder mais rápido.</span>
          </div>
          <button class="btn primary" id="remoteFastToggleBtn" type="button">${state.settings?.remoteFastMode === false ? 'Ativar modo remoto' : 'Desativar modo remoto'}</button>
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
function cardsVisualSettingsCard(){
  if(!isAdminMaster()) return '';
  const cardLayout = state.settings?.cardLayout || 'grid';
  const cardSize = state.settings?.cardSize || 'normal';
  return `<div class="card span-all cards-visual-settings-card">
    <div class="card-head">
      <div>
        <h3>Formato dos cards para todos os users</h3>
        <span class="muted">Estas opções são globais. O Admin guarda aqui e todos os utilizadores recebem o mesmo visual.</span>
      </div>
      <span class="badge blue">Global</span>
    </div>
    <form id="cardsVisualForm" class="form-grid">
      <label class="span2 config-choice-card">
        <span>Formato dos cards</span>
        <select class="select" name="cardLayout">
          <option value="grid" ${cardLayout==='grid'?'selected':''}>Grelha / lado a lado</option>
          <option value="list" ${cardLayout==='list'?'selected':''}>Seguido / lista</option>
        </select>
      </label>
      <label class="config-choice-card">
        <span>Tamanho</span>
        <select class="select" name="cardSize">
          <option value="compact" ${cardSize==='compact'?'selected':''}>Compacto</option>
          <option value="normal" ${cardSize==='normal'?'selected':''}>Normal</option>
          <option value="large" ${cardSize==='large'?'selected':''}>Grande</option>
        </select>
      </label>
      <div class="span3 visual-preview-note">
        Atual: <strong>${cardLayout==='list'?'Cards seguidos / lista':'Cards em grelha / lado a lado'}</strong> · <strong>${cardSize==='compact'?'Compacto':cardSize==='large'?'Grande':'Normal'}</strong>
      </div>
      <div class="span3 actions">
        <button class="btn primary" type="submit">Guardar visual dos cards</button>
      </div>
    </form>
  </div>`;
}

function generalSettingsCard(){
  const cardLayout = state.settings?.cardLayout || 'grid';
  const cardSize = state.settings?.cardSize || 'normal';
  return `<div class="card"><div class="card-head"><h3>Configurações da app</h3><span class="badge blue">v${APP_VERSION}</span></div>
    <form id="settingsForm" class="form-grid">
      <input class="field span2" name="companyName" placeholder="Nome da empresa" value="${esc(state.settings.companyName)}">
      <input class="field" name="companyNif" placeholder="NIF" value="${esc(state.settings.companyNif || '')}">
      <input class="field span3" name="companyAddress" placeholder="Morada" value="${esc(state.settings.companyAddress || '')}">
      <input class="field" name="companyPhone" placeholder="Telefone empresa" value="${esc(state.settings.companyPhone || '')}">
      <input class="field" name="companyEmail" placeholder="Email empresa" value="${esc(state.settings.companyEmail || '')}">
      <input class="field" name="dailyBackupHour" type="time" value="${esc(state.settings.dailyBackupHour)}">
      <label class="checkline span2 spellcheck-toggle"><input type="checkbox" name="spellcheckEnabled" ${spellcheckEnabled()?'checked':''}> Correção ortográfica ativa</label>
      <select class="select" name="cardLayout">
        <option value="grid" ${cardLayout==='grid'?'selected':''}>Cards em grelha / lado a lado</option>
        <option value="list" ${cardLayout==='list'?'selected':''}>Cards seguidos / lista</option>
      </select>
      <select class="select" name="cardSize">
        <option value="compact" ${cardSize==='compact'?'selected':''}>Cards compactos</option>
        <option value="normal" ${cardSize==='normal'?'selected':''}>Cards normais</option>
        <option value="large" ${cardSize==='large'?'selected':''}>Cards grandes</option>
      </select>
      <div class="span3 readonly-note">Estas opções são globais: o Admin guarda aqui e todos os users recebem o mesmo formato dos cards.</div>
      <input class="field span3" name="githubUrl" placeholder="URL GitHub Pages" value="${esc(state.settings.githubUrl)}">
      <div class="span3"><button class="btn primary">Guardar configurações</button></div>
    </form></div>`;
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
    configAccordion('Visual dos Cards', 'Formato em grelha/lista e tamanho global para todos os utilizadores.', cardsVisualSettingsCard(), {open:true, icon:'🧩'}),
    configAccordion('Firebase / Sincronização', 'Sincronizar e exportar dados.', firebaseSettingsCard(), {icon:'☁️'}),
    configAccordion('Diretório', 'Ordem dos armazéns e organização do diretório.', warehouseOrderSettingsCard(), {icon:'📇'}),
    configAccordion('Utilizadores e permissões', 'Permissões por utilizador, página e ação.', permissionsSettingsCard(), {icon:'🛡️'}),
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
        ['id','ID'], ['codigoCliente','Código Cliente'], ['nome','Nome'], ['telefone','Telefone 1'], ['email','Email 1'], ['telefones','Telefones'], ['emails','Emails'], ['morada','Morada'], ['codigoPostal','Código Postal'], ['notas','Notas']
      ]
    },
    contactos: {
      key:'contactGroups', title:'Diretório de Contactos', file:'diretorio-contactos', prefix:'DIR', edit:()=>canEditOperational(), flattened:true,
      fields:[
        ['groupId','ID Secção'], ['contactId','ID Contacto'], ['armazem','Armazém / Local'], ['seccao','Secção / Sessão'], ['nome','Nome Contacto'], ['extensao','Extensão'], ['telemovel','Telemóvel'], ['telefone','Telefone'], ['email','Email'], ['local','Local / Empresa']
      ]
    },
    referencias: {
      key:'references', title:'Referências da Empresa', file:'referencias', prefix:'REF', edit:()=>canEditOperational(),
      fields:[['referencia','Referência'],['familia','Família'],['marca','Marca'],['descricao','Descrição']]
    },
    fornecedores: {
      key:'suppliers', title:'Fornecedores', file:'fornecedores', prefix:'FOR', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['nomeMarca','Nome Fornecedor'], ['codigoFicha','Número Referência']
      ]
    },
    rotas: {
      key:'routes', title:'Rotas', file:'rotas', prefix:'ROT', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['viatura','Viatura'], ['matricula','Matrícula'], ['data','Data'], ['pedidoPor','Pedido por'], ['destino','Destino / Serviço'], ['periodo','Período'], ['carga','Carga'], ['condutor','Condutor'], ['kmInicio','KM Início'], ['horaInicio','Hora Início'], ['kmFim','KM Fim'], ['horaFim','Hora Fim'], ['kmPercorridos','KM Percorridos'], ['entregue','Entregue'], ['dataEntrega','Data Entrega'], ['horaEntrega','Hora Entrega'], ['observacoes','Observações'], ['observacoesEntrega','Observações Entrega']
      ]
    },
    viaturas: {
      key:'vehicles', title:'Viaturas', file:'viaturas', prefix:'VEI', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['viatura','Viatura'], ['matricula','Matrícula'], ['marca','Marca'], ['modelo','Modelo'], ['observacoes','Observações']
      ]
    },
    orcamentos: {
      key:'quotes', title:'Orçamentos', file:'orcamentos', prefix:'ORC', edit:()=>canEditOperational(),
      fields:[
        ['id','ID'], ['createdAt','Data'], ['createdByName','Criado por'], ['createdByEmail','Email do criador'], ['estado','Estado'], ['cliente','Cliente'], ['codigoCliente','Código Cliente'], ['telefone','Telefone'], ['email','Email'], ['matricula','Matrícula'], ['marcaModelo','Marca & Modelo'], ['motor','Motor'], ['viatura','Viatura'], ['items','Referências JSON'], ['peca','1ª Peça'], ['referencia','1ª Referência'], ['quantidade','1ª Unidade'], ['precoUnitario','1º Preço'], ['total','Total'], ['validade','Validade'], ['prazoEntrega','Prazo Entrega'], ['condicoes','Condições'], ['observacoes','Observações']
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
    contactos:{ groupId:'', contactId:'', armazem:'Armazém Lisboa', seccao:'Peças', nome:'Nome Contacto', extensao:'51037', telemovel:'912345678', telefone:'213000000', email:'contacto@email.pt', local:'Lisboa' },
    fornecedores:{ id:'', nomeMarca:'Nome Fornecedor', codigoFicha:'FOR-001' },
    rotas:{ id:'', viatura:'Toyota Prius', matricula:'05-QR-43', data:today(), pedidoPor:'Nome', destino:'Destino / Serviço', periodo:'Tarde', carga:'sem carga', condutor:'Condutor', kmInicio:'100000', horaInicio:'09:00', kmFim:'100025', horaFim:'10:00', kmPercorridos:'25', observacoes:'' },
    viaturas:{ id:'', viatura:'Toyota Prius', matricula:'05-QR-43', marca:'Toyota', modelo:'Prius', observacoes:'' },
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
    extensao:c.extensao || '',
    telemovel:c.telemovel || '',
    telefone:c.telefone || '',
    email:c.email || '',
    local:c.local || ''
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
  if(!hasWritableFirebaseSession()) return toast('Importação bloqueada: entra com Firebase para gravar dados.');
  try {
    const rows = await readExcelRows(file);
    if(!rows.length) return toast('O ficheiro não tem linhas para importar.');
    if(pageId === 'referencias'){
      const result = await importReferenceDescriptions(rows, cfg);
      renderPage(pageId);
      toast(`Excel de referências: ${result.updated} descrição(ões) atualizada(s), ${result.unchanged} já iguais, ${result.notFound} referência(s) não encontrada(s), ${result.skipped} linha(s) sem descrição.`);
      return;
    }
    const normalized = normalizeImportedRows(rows, cfg);
    const count = applyImportedRows(pageId, cfg, normalized);
    const saved = saveState(`Importação Excel: ${cfg.title}`);
    renderPage(pageId);
    const total = cfg.single ? 1 : ((Array.isArray(state[cfg.key]) ? state[cfg.key].length : Object.keys(state[cfg.key]||{}).length));
    const extra = pageId === 'fornecedores' ? ` · lista atual: ${total} registo(s)` : '';
    toast(saved ? `${count} linha(s) importada(s) do Excel${extra}.` : `${count} linha(s) lida(s), mas não foram gravadas: Firebase sem sessão de escrita.`);
  } catch(err){
    console.error(err);
    toast(err?.message || 'Não consegui importar esse ficheiro Excel.');
  }
}
async function importReferenceDescriptions(rawRows, cfg){
  if(!hasWritableFirebaseSession()) throw new Error('Importação bloqueada: entra com Firebase para gravar dados.');
  const rows = normalizeImportedRows(rawRows, cfg);
  if(!rows.length) throw new Error('Não encontrei linhas com Referência, Família, Marca ou Descrição reconhecíveis no Excel.');
  const collection = firebaseDb.collection(FIREBASE_COLLECTIONS.references);
  const snapshot = await collection.get();
  const byKey = new Map();
  snapshot.docs.forEach(doc=>{
    const data = doc.data() || {};
    const key = normalizeText(data.referencia || data.reference);
    if(!key) return;
    const brandKey = normalizeText(data.marca || data.brand);
    const compound = `${key}||${brandKey}`;
    if(!byKey.has(compound)) byKey.set(compound, []);
    byKey.get(compound).push({doc, data});
  });
  const updates = new Map();
  let unchanged = 0, notFound = 0, skipped = 0;
  for(const row of rows){
    const ref = String(row.referencia || '').trim();
    const brand = String(row.marca || '').trim();
    const description = String(row.descricao || '').trim();
    if(!ref || !description){ skipped++; continue; }
    const key = normalizeText(ref), brandKey = normalizeText(brand);
    let matches = brandKey ? (byKey.get(`${key}||${brandKey}`) || []) : [];
    if(!brandKey){
      matches = snapshot.docs.map(doc=>({doc,data:doc.data()||{}})).filter(x=>normalizeText(x.data.referencia || x.data.reference)===key);
    }
    // Never guess if a reference is duplicated across brands.
    if(matches.length !== 1){ notFound++; continue; }
    const match = matches[0];
    const oldDescription = String(match.data.descricao || '').trim();
    if(oldDescription === description){ unchanged++; continue; }
    updates.set(match.doc.id, {ref:match.doc, descricao:description});
  }
  let updated = 0;
  const entries = Array.from(updates.values());
  for(let offset=0; offset<entries.length; offset+=400){
    const batch = firebaseDb.batch();
    const chunk = entries.slice(offset, offset+400);
    chunk.forEach(item=>batch.update(item.ref, {descricao:item.descricao, descricaoNorm:normalizeSearchText(item.descricao), updatedAt:new Date().toISOString()}));
    await batch.commit();
    updated += chunk.length;
  }
  if(updated){
    const latest = new Map(entries.map(item=>[item.ref.id,item.descricao]));
    state.references = (state.references || []).map(item=>latest.has(item.id) ? {...item, descricao:latest.get(item.id), descricaoNorm:normalizeSearchText(latest.get(item.id))} : item);
    addAuditLog(`Importação Excel: descrições de referências (${updated} atualizadas)`, 'referencias', `Atualizadas ${updated}; iguais ${unchanged}; não encontradas/ambíguas ${notFound}; sem descrição ${skipped}`);
  }
  return {updated, unchanged, notFound, skipped};
}

async function readExcelRows(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if(['csv','tsv','txt'].includes(ext)){
    const text = await file.text();
    return parseDelimitedText(text, ext === 'tsv' ? '\t' : guessDelimiter(text));
  }
  if(!window.XLSX) await loadExcelLibrary();
  if(window.XLSX){
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type:'array', cellDates:true, raw:false });
    const first = wb.SheetNames[0];
    if(!first) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[first], { defval:'', raw:false });
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
function excelHeaderAliasesForPage(cfg){
  const aliases = {};
  (cfg.fields || []).forEach(([key,label])=>{
    aliases[normalizeExcelHeader(key)] = key;
    aliases[normalizeExcelHeader(label)] = key;
  });

  if(cfg.key === 'contactGroups'){
    const add = (key, names)=>names.forEach(name=>aliases[normalizeExcelHeader(name)] = key);
    add('armazem', ['Armazém','Armazem','Armazém / Local','Armazem / Local','Local','Localização','Localizacao','Loja','Unidade','Empresa','Grupo']);
    add('seccao', ['Secção','Seccao','Sessão','Sessao','Secção/Sessão','Seccao/Sessao','Departamento','Zona','Área','Area','Tipo','Categoria']);
    add('nome', ['Nome','Nome Contacto','Contacto','Pessoa','Responsável','Responsavel','Funcionário','Funcionario','Colaborador']);
    add('extensao', ['Extensão','Extensao','Ext.','Ext','Ramal','Código Interno','Codigo Interno']);
    add('telemovel', ['Telemóvel','Telemovel','Telemóvel Contacto','Telemovel Contacto','Tlm','Tlm.','Móvel','Movel','Mobile','Nº Telemóvel','N Telemovel']);
    add('telefone', ['Telefone','Telefone Fixo','Fixo','Tel','Tel.','Número','Numero','Nº Telefone','N Telefone','Contacto Telefónico','Contacto Telefonico']);
    add('email', ['Email','E-mail','Mail','Correio','Correio Eletrónico','Correio Eletronico']);
    add('local', ['Local Contacto','Local / Empresa','Empresa Contacto','Empresa','Localidade','Filial']);
    add('groupId', ['ID Secção','ID Seccao','ID Grupo','Grupo ID']);
    add('contactId', ['ID Contacto','Contacto ID','ID Pessoa']);
  }

  if(cfg.key === 'clients'){
    const add = (key, names)=>names.forEach(name=>aliases[normalizeExcelHeader(name)] = key);
    add('codigoCliente', ['Código Cliente','Codigo Cliente','Cod Cliente','Cliente Código','Cliente Codigo','Nº Cliente','Numero Cliente']);
    add('nome', ['Nome Cliente','Cliente','Nome']);
    add('telefone', ['Telefone','Telemóvel','Telemovel','Contacto','Contacto Telefónico','Contacto Telefonico']);
    add('email', ['Email','E-mail','Mail']);
    add('notas', ['Notas','Observações','Observacoes','Obs']);
  }

  if(cfg.key === 'suppliers'){
    const add = (key, names)=>names.forEach(name=>aliases[normalizeExcelHeader(name)] = key);
    add('nomeMarca', ['Nome Marca','Nome da Marca','Marca','Fornecedor','Nome Fornecedor','Nome do Fornecedor','Empresa']);
    add('codigoFicha', ['Código Ficha','Codigo Ficha','Código de Ficha','Codigo de Ficha','Nº Ficha','Numero Ficha','Referência','Referencia','Número Referência','Numero Referencia']);
  }

  if(cfg.key === 'quotes'){
    const add = (key, names)=>names.forEach(name=>aliases[normalizeExcelHeader(name)] = key);
    add('cliente', ['Cliente','Nome Cliente','Nome do Cliente']);
    add('codigoCliente', ['Código Cliente','Codigo Cliente','Cod Cliente']);
    add('peca', ['Peça','Peca','Artigo','Descrição','Descricao']);
    add('referencia', ['Referência','Referencia','Ref']);
    add('quantidade', ['Quantidade','Qtd','Qt']);
    add('precoUnitario', ['Preço Unitário','Preco Unitario','Preço','Preco','Valor Unitário','Valor Unitario']);
    add('total', ['Total','Valor Total']);
  }


  if(cfg.key === 'routes'){
    const add = (key, names)=>names.forEach(name=>aliases[normalizeExcelHeader(name)] = key);
    add('viatura', ['Viatura','Carro','Veículo','Veiculo','Automóvel','Automovel','Carrinha','Camião','Camiao']);
    add('matricula', ['Matrícula','Matricula','Matricula Viatura','Matrícula Viatura','Placa']);
    add('data', ['Data','Dia','Data Serviço','Data Servico','Data Rota']);
    add('pedidoPor', ['Pedido por','Pedido Por','Solicitado por','Solicitado Por','Quem pediu','Quem Pediu','Pediu','Requisitante','Responsável','Responsavel']);
    add('destino', ['Destino','Destino / Serviço','Destino / Servico','Serviço','Servico','Cliente','Local','Localização','Localizacao','Entrega','Recolha']);
    add('periodo', ['Período','Periodo','Turno','Manhã','Manha','M/T','M T']);
    add('carga', ['Carga','Mercadoria','Paletes','Palete','Descrição carga','Descricao carga']);
    add('condutor', ['Condutor','Motorista','Motorista/Condutor','Entregue por','Pessoa']);
    add('kmInicio', ['KM Início','KM Inicio','Km inicial','Km Inicial','KM Inicial','Kilómetros Início','Kilometros Inicio','Contador inicial','Contador Inicial','KM Saída','KM Saida']);
    add('horaInicio', ['Hora Início','Hora Inicio','Hora inicial','Hora Inicial','Hora saída','Hora Saida','Início','Inicio']);
    add('kmFim', ['KM Fim','Km final','Km Final','KM Final','Kilómetros Fim','Kilometros Fim','Contador final','Contador Final','KM Chegada']);
    add('horaFim', ['Hora Fim','Hora final','Hora Final','Fim','Chegada','Hora chegada']);
    add('kmPercorridos', ['KM Percorridos','Km percorridos','Quilómetros','Quilometros','Distância','Distancia','Total KM']);
    add('observacoes', ['Observações','Observacoes','Obs','Notas','Nota']);
    add('entregue', ['Entregue','Estado Entrega','Status Entrega']);
    add('dataEntrega', ['Data Entrega','Data de Entrega','Entregue em','Data Final Entrega']);
    add('horaEntrega', ['Hora Entrega','Hora de Entrega','Hora Final Entrega']);
    add('observacoesEntrega', ['Observações Entrega','Obs Entrega','Notas Entrega']);
  }

  return aliases;
}
function firstFilledValue(row, keys){
  for(const key of keys){
    const value = normalizeExcelValue(row?.[key]);
    if(value) return value;
  }
  return '';
}
function normalizeImportedContactRow(raw){
  const direct = raw || {};
  const armazem = firstFilledValue(direct, ['armazem','local','localizacao','loja','unidade','empresa','grupo']) || 'Sem armazém';
  const seccao = firstFilledValue(direct, ['seccao','sessao','departamento','zona','area','tipo','categoria']) || 'Geral';
  const nome = firstFilledValue(direct, ['nome','contacto','pessoa','responsavel','funcionario','colaborador']);
  const extensao = firstFilledValue(direct, ['extensao','ramal','ext']);
  const telemovel = firstFilledValue(direct, ['telemovel','tlm','movel','mobile']);
  const telefone = firstFilledValue(direct, ['telefone','fixo','tel','numero']);
  const email = firstFilledValue(direct, ['email','mail','correio']);
  const local = firstFilledValue(direct, ['local','empresa','localidade','filial']) || armazem;
  return {
    groupId: direct.groupId || direct.idGrupo || direct.idSeccao || '',
    contactId: direct.contactId || direct.idContacto || '',
    armazem,
    seccao,
    nome,
    extensao,
    telemovel,
    telefone,
    email,
    local
  };
}

function parseExcelDateValue(value){
  if(value === null || value === undefined || value === '') return '';
  if(typeof value === 'number' && value > 30000) {
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + Math.floor(value));
    return date.toISOString().slice(0,10);
  }
  const raw = String(value || '').trim();
  if(!raw) return '';
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if(iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
  const pt = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if(pt) {
    const year = String(pt[3]).length === 2 ? `20${pt[3]}` : pt[3];
    return `${year}-${String(pt[2]).padStart(2,'0')}-${String(pt[1]).padStart(2,'0')}`;
  }
  return raw;
}
function parseExcelTimeValue(value){
  if(value === null || value === undefined || value === '') return '';
  if(typeof value === 'number') {
    if(value >= 0 && value < 1) {
      const total = Math.round(value * 24 * 60);
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    return String(value);
  }
  let raw = String(value || '').trim();
  if(!raw) return '';
  raw = raw.replace(/\s+/g,'').replace(/H/g,'h');
  raw = raw.replace(/^(\d{1,2})h(\d{1,2})$/, (_,h,m)=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  raw = raw.replace(/^(\d{1,2})h$/, (_,h)=>`${String(h).padStart(2,'0')}:00`);
  raw = raw.replace(/^(\d{1,2}):(\d{1,2})h?$/, (_,h,m)=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  return raw;
}
function parseKmValue(value){
  const clean = String(value ?? '').replace(/\s+/g,'').replace(',','.').replace(/[^\d.-]/g,'');
  const n = Number(clean);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function normalizeImportedRouteRow(raw){
  const r = raw || {};
  const kmInicio = parseKmValue(r.kmInicio);
  const kmFim = parseKmValue(r.kmFim);
  const kmPercorridos = parseKmValue(r.kmPercorridos) || (kmInicio && kmFim && kmFim >= kmInicio ? kmFim - kmInicio : 0);
  return {
    id: r.id || '',
    viatura: normalizeExcelValue(r.viatura),
    matricula: normalizeExcelValue(r.matricula),
    data: parseExcelDateValue(r.data),
    pedidoPor: normalizeExcelValue(r.pedidoPor),
    destino: normalizeExcelValue(r.destino),
    periodo: normalizeExcelValue(r.periodo),
    carga: normalizeExcelValue(r.carga),
    condutor: normalizeExcelValue(r.condutor),
    kmInicio,
    horaInicio: parseExcelTimeValue(r.horaInicio),
    kmFim,
    horaFim: parseExcelTimeValue(r.horaFim),
    kmPercorridos,
    entregue: String(r.entregue || '').toLowerCase().includes('sim') || String(r.entregue || '').toLowerCase().includes('true') || !!r.dataEntrega,
    dataEntrega: parseExcelDateValue(r.dataEntrega),
    horaEntrega: parseExcelTimeValue(r.horaEntrega),
    observacoes: normalizeExcelValue(r.observacoes),
    observacoesEntrega: normalizeExcelValue(r.observacoesEntrega)
  };
}

function normalizeImportedRows(rows, cfg){
  const map = excelHeaderAliasesForPage(cfg);
  return rows.map(row=>{
    const obj = {};
    Object.entries(row).forEach(([header,value])=>{
      const key = map[normalizeExcelHeader(header)];
      if(key) obj[key] = normalizeExcelValue(value);
    });
    if(cfg.key === 'contactGroups') return normalizeImportedContactRow(obj);
    if(cfg.key === 'routes') return normalizeImportedRouteRow(obj);
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
    if(pageId === 'rotas') {
      row = normalizeRouteData(row);
      if(!row.viatura && !row.matricula && !row.destino && !row.condutor) return;
    }
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
    if(pageId === 'rotas') upsertVehicleFromRoute(row);
  });
  if(pageId === 'fornecedores') sortSuppliersState();
  if(pageId === 'referencias') target.sort((a,b)=>String(a.referencia||'').localeCompare(String(b.referencia||''), 'pt', {numeric:true,sensitivity:'base'}));
  return pageId === 'rotas' ? rows.filter(r => r.viatura || r.matricula || r.destino || r.condutor).length : rows.length;
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
  if(pageId === 'rotas') {
    return row.data && row.matricula && row.destino &&
      normalizeText(existing.data) === normalizeText(row.data) &&
      normalizeText(existing.matricula) === normalizeText(row.matricula) &&
      normalizeText(existing.destino) === normalizeText(row.destino) &&
      normalizeText(existing.horaInicio) === normalizeText(row.horaInicio);
  }
  if(pageId === 'users') return row.email && existing.email === row.email;
  if(pageId === 'referencias') return row.referencia && normalizeText(existing.referencia) === normalizeText(row.referencia);
  if(pageId === 'orcamentos') return false;
  return false;
}
function importContactRows(rows){
  state.contactGroups = state.contactGroups || [];
  let imported = 0;
  rows.forEach(rawRow=>{
    const row = normalizeImportedContactRow(rawRow);
    const armazem = row.armazem || 'Sem armazém';
    const seccao = row.seccao || 'Geral';

    // Evita mandar tudo para Geral por falta de mapeamento.
    // Se não houver nome/contacto nem telefone/email, ignora a linha.
    if(!row.nome && !row.telemovel && !row.telefone && !row.email) return;

    let group = state.contactGroups.find(g =>
      (row.groupId && g.id === row.groupId) ||
      (normalizeText(g.armazem || g.local) === normalizeText(armazem) &&
       normalizeText(g.seccao || g.nome) === normalizeText(seccao))
    );

    if(!group){
      group = { id: row.groupId || uid('DIR'), armazem, seccao, nome:seccao, aberto:true, contactos:[] };
      state.contactGroups.push(group);
    }

    group.armazem = armazem;
    group.seccao = seccao;
    group.nome = seccao;
    group.contactos = group.contactos || [];

    const contact = {
      id: row.contactId || uid('CNT'),
      nome: row.nome || '',
      extensao: row.extensao || '',
      telemovel: row.telemovel || '',
      telefone: row.telefone || '',
      email: row.email || '',
      local: row.local || armazem
    };

    const index = group.contactos.findIndex(c =>
      (row.contactId && c.id === row.contactId) ||
      (contact.email && normalizeText(c.email) === normalizeText(contact.email)) ||
      (contact.nome && normalizeText(c.nome) === normalizeText(contact.nome) &&
        (normalizeText(c.telemovel || c.telefone) === normalizeText(contact.telemovel || contact.telefone)))
    );

    if(index >= 0) group.contactos[index] = { ...group.contactos[index], ...contact };
    else group.contactos.push(contact);
    imported++;
  });
  normalizeContactDirectory();
  return imported;
}

function bindPage(id){
  bindExcelTools();
  qsa('[data-go]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.go)));
  qsa('[data-page-card]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.pageCard)));
  const dashboardLogout = qs('#dashboardLogoutBtn');
  if(dashboardLogout) dashboardLogout.addEventListener('click', logoutCurrentUser);
  qsa('[data-client-detail]').forEach(b=>b.addEventListener('click',()=>openClientDetail(b.dataset.clientDetail)));
  qsa('[data-client-email]').forEach(b=>b.addEventListener('click',()=>emailClient(b.dataset.clientEmail)));
  bindGlobalSearchInput(qs('#globalSearch'), 'globalSearchResults');
  const clientSearch = qs('#clientSearch');
  const updateClientSearch = () => {
    const rows = filterClients();
    const table = qs('#clientsTable');
    if(table) table.innerHTML = clientsTable(rows);
    const count = qs('#clientSearchCount');
    if(count) count.textContent = clientSearch?.value.trim() ? `${rows.length} de ${state.clients.length} clientes` : `${state.clients.length} clientes`;
    const clear = qs('#clearClientSearch');
    if(clear) clear.disabled = !clientSearch?.value;
    bindEntities();
    qs('[data-clear-client-search]')?.addEventListener('click',()=>{ if(clientSearch) clientSearch.value=''; updateClientSearch(); clientSearch?.focus(); });
  };
  if(clientSearch) clientSearch.addEventListener('input',updateClientSearch);
  qs('#clearClientSearch')?.addEventListener('click',()=>{ if(clientSearch) clientSearch.value=''; updateClientSearch(); clientSearch?.focus(); });
  clientSearch?.addEventListener('keydown',e=>{ if(e.key==='Escape'){ clientSearch.value=''; updateClientSearch(); } });
  const contactSearch = qs('#contactSearch');
  const updateContactSearch = () => {
    const groups = filterContactGroups();
    const table = qs('#contactsTable');
    if(table) table.innerHTML = contactGroupsView(groups);
    const count = qs('#contactSearchCount');
    const matched = groups.reduce((sum,g)=>sum+(g.contactos||[]).length,0);
    if(count) count.textContent = contactSearch?.value.trim() ? `${matched} contactos · ${groups.length} secções` : `${contactCount()} contactos`;
    const clear = qs('#clearContactSearch');
    if(clear) clear.disabled = !contactSearch?.value;
    bindContactDirectory();
    qs('[data-clear-contact-search]')?.addEventListener('click',()=>{ if(contactSearch) contactSearch.value=''; updateContactSearch(); contactSearch?.focus(); });
  };
  if(contactSearch) contactSearch.addEventListener('input',updateContactSearch);
  qs('#clearContactSearch')?.addEventListener('click',()=>{ if(contactSearch) contactSearch.value=''; updateContactSearch(); contactSearch?.focus(); });
  contactSearch?.addEventListener('keydown',e=>{ if(e.key==='Escape'){ contactSearch.value=''; updateContactSearch(); } });
  if(id==='referencias') bindReferencesPage();
  const supplierSearch = qs('#supplierSearch');
  if(supplierSearch) supplierSearch.addEventListener('input',()=>{ qs('#suppliersTable').innerHTML = suppliersTable(filterSuppliers()); bindEntities(); });
  if(id==='nova-chamada') bindCallForm();
  if(id==='contactos') bindContactDirectory();
  if(id==='users') bindUsersPage();
  bindEntities();
  if(id==='agenda') bindFollowForm();
  if(id==='configs-user') bindUserConfigs();
  if(id==='config') bindConfig();
  qsa('[data-copy]').forEach(b=>b.addEventListener('click',()=>copyText(b.dataset.copy)));
}

function bindGlobalResults(){
  qsa('#globalSearchResults [data-go]').forEach(b=>{
    if(b.dataset.searchBound === '1') return;
    b.dataset.searchBound = '1';
    b.addEventListener('click',()=>goPage(b.dataset.go));
  });
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
  ['searchPedidos','filterEstado'].forEach(id=>qs('#'+id)?.addEventListener('input',()=>{ qs('#pedidosTable').innerHTML = pedidosCards(filterPedidos()); bindPedidosActions(); }));
  qs('#openNewPedidoBtn')?.addEventListener('click',()=>openPedidoModal());
  bindPedidosActions();
}
function bindPedidosActions(){
  qsa('[data-delete-call]').forEach(b=>b.addEventListener('click',()=>{ if(!canDelete()) return toast('Sem permissão para apagar.'); state.calls = state.calls.filter(c=>c.id!==b.dataset.deleteCall); saveState(); renderPage('pedidos'); toast('Pedido apagado.'); }));
  qsa('[data-view-pedido]').forEach(b=>b.addEventListener('click',()=>openPedidoDetail(b.dataset.viewPedido)));
  qsa('[data-edit-pedido]').forEach(b=>b.addEventListener('click',()=>openPedidoModal(b.dataset.editPedido)));
  qsa('[data-confirm-pedido]').forEach(b=>b.addEventListener('click',()=>updatePedidoStatus(b.dataset.confirmPedido,'Confirmado')));
  qsa('[data-cancel-pedido]').forEach(b=>b.addEventListener('click',()=>updatePedidoStatus(b.dataset.cancelPedido,'Cancelado')));
  qsa('[data-edit-call]').forEach(b=>b.addEventListener('click',()=>openPedidoModal(b.dataset.editCall)));
  qsa('[data-quote]').forEach(b=>b.addEventListener('click',()=>createQuoteFromCall(b.dataset.quote)));
}
function openPedidoDetail(id){
  const p = state.calls.find(x=>x.id===id);
  if(!p) return toast('Pedido não encontrado.');
  const refs = pedidoRefsFromLegacy(p);
  openModal(`Pedido · ${esc(p.id)}`, `<div class="pedido-detail-view">
    <div class="detail-grid">
      <div><span>Cliente</span><strong>${esc(p.cliente || '-')}</strong></div>
      <div><span>Código</span><strong>${esc(p.codigoCliente || '-')}</strong></div>
      <div><span>Morada</span><strong>${esc(p.morada || '-')}</strong></div>
      <div><span>Transporte</span><strong>${esc(p.transporte || '-')}</strong></div>
      <div><span>Data/Hora</span><strong>${esc(formatDatePt(p.createdAt || p.data || today()))} ${esc(p.createdTime || p.hora || '')}</strong></div>
      <div><span>Estado</span><strong>${esc(p.estado || 'Pendente')}</strong></div>
    </div>
    <h4>Referências</h4>
    <div class="table-wrap">
      <table><thead><tr><th>Fornecedor</th><th>Código</th><th>Referência original</th><th>Referência final</th><th>Qtd.</th></tr></thead>
      <tbody>${refs.map(r=>`<tr><td>${esc(r.fornecedor || '-')}</td><td>${esc(r.codigoFornecedor || '-')}</td><td>${esc(r.referenciaOriginal || stripSupplierPrefix(r.referencia, r.codigoFornecedor) || '-')}</td><td><strong>${esc(r.referencia || '-')}</strong></td><td>${esc(r.quantidade || 1)}</td></tr>`).join('')}</tbody></table>
    </div>
    ${p.observacoes ? `<h4>Observações</h4><p class="muted">${esc(p.observacoes)}</p>` : ''}
  </div>`);
}
function updatePedidoStatus(id, status){
  const p = state.calls.find(x=>x.id===id);
  if(!p) return;
  p.estado = status;
  p.updatedAt = new Date().toISOString();
  saveState();
  renderPage('pedidos');
  toast(status === 'Confirmado' ? 'Pedido confirmado.' : 'Pedido cancelado.');
}
function bindPedidoForm(form, existing=null){
  if(!form) return;
  bindPedidoClientSearch(form);
  bindPedidoRefsEditor(form);
  const transp = form.querySelector('[name="transporte"]');
  transp?.addEventListener('input',()=>rememberTransporte(transp.value));
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar pedidos.');
    const submitter = e.submitter;
    const status = submitter?.dataset.pedidoSubmit || existing?.estado || 'Pendente';
    const data = Object.fromEntries(new FormData(form).entries());
    const refs = collectPedidoRefs(form);
    if(!refs.length) return toast('Adiciona pelo menos uma referência.');
    const client = upsertPedidoClient(data);
    rememberTransporte(data.transporte);
    const payload = {
      cliente:data.cliente || data.clienteSearch || '',
      codigoCliente:data.codigoCliente || clientCode(client) || '',
      morada:data.morada || client?.morada || '',
      fornecedor:refs[0]?.fornecedor || '',
      codigoFornecedor:refs[0]?.codigoFornecedor || '',
      referenciasPedido:refs,
      referencia:refs[0]?.referencia || '',
      quantidade:refs[0]?.quantidade || 1,
      transporte:data.transporte || '',
      data:data.data || today(),
      hora:data.hora || currentTimeHM(),
      createdAt: existing?.createdAt || data.data || today(),
      createdTime: existing?.createdTime || data.hora || currentTimeHM(),
      estado:status,
      observacoes:data.observacoes || '',
      tipo:'pedidoPecas'
    };
    if(existing){
      Object.assign(existing, payload, { updatedAt:new Date().toISOString() });
      toast('Pedido atualizado.');
    } else {
      state.calls.push({ id:nextPedidoId(), ...payload, createdByName:preferredUserName('Utilizador'), createdByEmail:state.currentUser?.email || firebaseAuth?.currentUser?.email || '' });
      toast('Pedido criado.');
    }
    saveState();
    closeModal();
    renderPage('pedidos');
  });
  qs('#cancelPedidoBtn')?.addEventListener('click',()=>{
    if(existing) {
      existing.estado = 'Cancelado';
      existing.updatedAt = new Date().toISOString();
      saveState();
      closeModal();
      renderPage('pedidos');
      toast('Pedido cancelado.');
    } else {
      closeModal();
      toast('Criação de pedido cancelada.');
    }
  });
}
function openPedidoModal(id=''){
  if(!canEditOperational()) return toast('Sem permissão para gerir pedidos.');
  const existing = id ? state.calls.find(x=>x.id===id) : null;
  openModal(existing ? `Editar pedido · ${esc(existing.id)}` : 'Novo pedido', pedidoFormHtml(existing));
  bindPedidoForm(qs('#pedidoForm'), existing);
}
function bindPedidoClientSearch(scope=document){
  const input = scope.querySelector?.('#pedidoClientSearch') || qs('#pedidoClientSearch');
  if(input && !input.dataset.boundPedidoClientSearch) {
    input.dataset.boundPedidoClientSearch = '1';
    const sync = ()=>{
      const form = input.closest('form') || document;
      const client = findClientFromQuoteSearch(input.value);
      const fallback = client ? client.nome : input.value.trim();
      const cliente = form.querySelector('[name="cliente"]');
      const code = form.querySelector('[name="codigoCliente"]');
      const morada = form.querySelector('[name="morada"]');
      if(cliente) cliente.value = client?.nome || fallback || '';
      if(code) code.value = client ? clientCode(client) : code.value;
      if(morada && client?.morada) morada.value = client.morada || '';
    };
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    input.addEventListener('blur', sync);
  }
}
function bindPedidoRefsEditor(scope=document){
  const root = scope && scope.querySelector ? scope : document;
  const rows = root.querySelector('#pedidoRefsRows');
  const addBtn = root.querySelector('#addPedidoRefBtn');
  if(addBtn && rows && !addBtn.dataset.boundPedidoAdd){
    addBtn.dataset.boundPedidoAdd = '1';
    addBtn.addEventListener('click',()=>{
      rows.insertAdjacentHTML('beforeend', pedidoRefRow({}, rows.querySelectorAll('[data-pedido-ref-row]').length));
      bindPedidoRefsEditor(root);
      const last = rows.querySelector('[data-pedido-ref-row]:last-child [name="pedidoFornecedor[]"]');
      last?.focus();
      updatePedidoRefsSummary(root);
    });
  }
  rows?.querySelectorAll('[data-pedido-ref-row]').forEach(row=>{
    if(!row.dataset.boundPedidoRow){
      row.dataset.boundPedidoRow = '1';
      row.querySelector('[name="pedidoFornecedor[]"]')?.addEventListener('input',()=>updatePedidoRefsSummary(root));
      row.querySelector('[name="pedidoFornecedor[]"]')?.addEventListener('change',()=>updatePedidoRefsSummary(root));
      row.querySelector('[name="pedidoReferenciaOriginal[]"]')?.addEventListener('input',()=>updatePedidoRefsSummary(root));
      row.querySelector('[name="pedidoReferenciaOriginal[]"]')?.addEventListener('keydown',ev=>{
        if(ev.key !== 'Tab' || ev.shiftKey) return;
        const input = ev.currentTarget;
        if(!String(input.value || '').trim()) return;
        ev.preventDefault();
        rows.insertAdjacentHTML('beforeend', pedidoRefRow({}, rows.querySelectorAll('[data-pedido-ref-row]').length));
        bindPedidoRefsEditor(root);
        const last = rows.querySelector('[data-pedido-ref-row]:last-child [name="pedidoFornecedor[]"]');
        last?.focus();
        updatePedidoRefsSummary(root);
      });
      row.querySelector('[name="pedidoQuantidade[]"]')?.addEventListener('input',()=>updatePedidoRefsSummary(root));
    }
  });
  rows?.querySelectorAll('[data-remove-pedido-ref]').forEach(btn=>{
    if(btn.dataset.boundPedidoRemove) return;
    btn.dataset.boundPedidoRemove = '1';
    btn.addEventListener('click',()=>{
      const allRows = rows.querySelectorAll('[data-pedido-ref-row]');
      if(allRows.length <= 1) {
        const row = btn.closest('[data-pedido-ref-row]');
        row?.querySelectorAll('input').forEach(i=>i.value = i.name.includes('Quantidade') ? '1' : '');
        updatePedidoRefsSummary(root);
        return;
      }
      btn.closest('[data-pedido-ref-row]')?.remove();
      updatePedidoRefsSummary(root);
    });
  });
  updatePedidoRefsSummary(root);
}

function upsertPedidoClient(data){
  const nome = String(data.cliente || data.clienteSearch || '').trim();
  const codigo = String(data.codigoCliente || '').trim();
  const morada = String(data.morada || '').trim();
  if(!nome && !codigo) return null;
  let client = (state.clients || []).find(c => (codigo && clientCode(c).toLowerCase() === codigo.toLowerCase()) || (nome && String(c.nome || '').toLowerCase() === nome.toLowerCase()));
  if(!client) {
    client = { id:uid('CLI'), codigoCliente:codigo || `CLI-${String((state.clients || []).length + 1).padStart(3,'0')}`, nome:nome || codigo, telefone:'', email:'', emails:[], telefones:[], morada, codigoPostal:'', notas:'Criado automaticamente a partir de pedido.' };
    state.clients.push(client);
  } else {
    if(nome && !client.nome) client.nome = nome;
    if(codigo && !client.codigoCliente) client.codigoCliente = codigo;
    if(morada) client.morada = morada;
  }
  return client;
}
function openCallModal(id){
  return openPedidoModal(id);
}

function createQuoteFromCall(id){
  if(!canEditOperational()) return toast('Sem permissão para criar orçamento.');
  const c = state.calls.find(x=>x.id===id); if(!c) return;
  const client = state.clients.find(x => x.nome?.toLowerCase() === c.cliente?.toLowerCase() || (c.codigoCliente && clientCode(x).toLowerCase() === String(c.codigoCliente).toLowerCase())) || {};
  const pedidoRefs = pedidoRefsFromLegacy(c);
  const items = pedidoRefs.length
    ? pedidoRefs.map(r=>normalizeQuoteItem({ nome:r.referencia, referencia:r.referencia, unidade:r.quantidade, preco:0 }))
    : [normalizeQuoteItem({ nome:c.peca || c.referencia || '', referencia:c.referencia, unidade:1, preco:Number(c.precoVenda||0) })];
  const marcaModelo = `${c.marca || ''} ${c.modelo || ''}`.trim();
  const matricula = c.matricula || '';
  const motor = c.motor || '';
  const creator = currentQuoteCreator();
  const first = items[0] || {};
  const q = { id: nextQuoteId(), createdByName:creator.name, createdByEmail:creator.email, callId:id, cliente:c.cliente, codigoCliente:clientCode(client) || c.codigoCliente || '', telefone:c.telefone || '', email:c.email || '', matricula, marcaModelo, motor, viatura:composeQuoteVehicle({matricula, marcaModelo, motor}), items, peca:first.nome || '', referencia:first.referencia || '', quantidade:first.unidade || 1, precoUnitario:first.preco || 0, total:quoteItemsTotal(items), validade:today(), prazoEntrega:'A confirmar', condicoes:'Preços sujeitos a disponibilidade da peça no momento da confirmação.', observacoes:c.observacoes || '', estado:'Rascunho', createdAt:today(), history:[{ date:today(), action:'Criado a partir de pedido', by:creator.email || '' }] };
  state.quotes.push(q); c.estado='Orçamento enviado'; saveState(); toast('Orçamento criado.'); setTimeout(()=>goPage('orcamentos'), 250);
}
function quoteClientOptions(){
  return state.clients.map(c=>`<option value="${esc(clientCode(c) ? `${clientCode(c)} - ${c.nome}` : c.nome)}"></option>`).join('');
}
function quoteClientSearchHtml(value=''){
  return `<input class="field span3" name="clienteSearch" id="quoteClientSearch" list="quoteClientList" placeholder="Escreve código ou nome do cliente" value="${esc(value)}" autocomplete="off" required>
    <datalist id="quoteClientList">${quoteClientOptions()}</datalist>
    <input type="hidden" name="cliente" value="${esc(value)}">`;
}
function findClientFromQuoteSearch(value){
  const raw = String(value || '').trim().toLowerCase();
  if(!raw) return null;
  const codePart = raw.split('-')[0].trim();
  return (state.clients || []).find(c=>{
    const code = String(clientCode(c) || '').toLowerCase();
    const nome = String(c.nome || '').toLowerCase();
    const combo = `${code} - ${nome}`.trim();
    return code === raw || code === codePart || nome === raw || combo === raw || code.includes(raw) || nome.includes(raw);
  }) || null;
}
function fillQuoteClientFields(form, client, fallbackName=''){
  if(!form) return;
  const cliente = form.querySelector('[name="cliente"]');
  const code = form.querySelector('[name="codigoCliente"]');
  const phone = form.querySelector('[name="telefone"]');
  const email = form.querySelector('[name="email"]');
  if(cliente) cliente.value = client?.nome || fallbackName || '';
  if(code) code.value = client ? clientCode(client) : '';
  if(phone) phone.value = client?.telefone || '';
  if(email) email.value = client?.email || '';
}
function quoteVehicleParts(q){
  const matricula = String(q.matricula || '').trim();
  const marcaModelo = String(q.marcaModelo || '').trim();
  const motor = String(q.motor || '').trim();

  if(matricula || marcaModelo || motor) {
    return { matricula, marcaModelo, motor };
  }

  const legacy = String(q.viatura || '').trim();
  if(!legacy) return { matricula:'', marcaModelo:'', motor:'' };

  const parts = legacy.split('-').map(x=>x.trim()).filter(Boolean);
  if(parts.length >= 2) return { marcaModelo:parts[0], matricula:parts.slice(1).join(' - '), motor:'' };
  return { matricula:legacy, marcaModelo:'', motor:'' };
}
function quoteVehicleLabel(q){
  const v = quoteVehicleParts(q);
  return [
    v.marcaModelo || 'Sem marca/modelo',
    v.motor || 'Sem motor',
    v.matricula || 'Sem matrícula',
    q.createdAt ? `Criado: ${formatDatePt(q.createdAt)}` : '',
    quoteCreatorName(q) ? `Por: ${quoteCreatorName(q)}` : ''
  ].filter(Boolean).join(' · ');
}
function composeQuoteVehicle(data){
  return [data.marcaModelo, data.motor, data.matricula].map(v=>String(v || '').trim()).filter(Boolean).join(' · ');
}

function quoteCreateFormHtml(){
  return quoteCreateFormHtmlFromDraft(null);
}

function openNewQuoteModal(){
  if(!canEditOperational()) return toast('Sem permissão para criar orçamentos.');
  const draft = getQuoteDraft();
  openModal(draft ? 'Continuar rascunho de orçamento' : 'Novo orçamento', quoteCreateFormHtmlFromDraft(draft));
  bindNewQuoteForm(qs('#quoteForm'));
}
function bindQuoteClientSelect(scope=document){
  const input = scope.querySelector?.('#quoteClientSearch') || qs('#quoteClientSearch');
  if(input && !input.dataset.boundClientSearch) {
    input.dataset.boundClientSearch = '1';
    const sync = ()=>{
      const form = input.closest('form') || document;
      const client = findClientFromQuoteSearch(input.value);
      const fallback = client ? client.nome : input.value.trim();
      fillQuoteClientFields(form, client, fallback);
    };
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    input.addEventListener('blur', sync);
  }
}
function bindNewQuoteForm(form){
  if(!form) return;
  bindQuoteClientSelect(form);
  bindQuoteItemsEditor(form);
  form.querySelector('#clearQuoteDraftBtn')?.addEventListener('click',()=>{ clearQuoteDraft(); form.reset(); toast('Rascunho limpo.'); });
  form.addEventListener('input',()=>saveQuoteDraft(form));
  if(form.dataset.boundQuoteSubmit) return;
  form.dataset.boundQuoteSubmit = '1';
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para criar orçamentos.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    const items = collectQuoteItems(e.target);
    if(!items.length) return toast('Adiciona pelo menos uma referência.');
    const first = items[0];
    const viatura = composeQuoteVehicle(data);
    const creator = currentQuoteCreator();
    const listSnapshot = readQuoteListSnapshot(e.target, items);
    state.quotes.push({ id:nextQuoteId(), createdAt:today(), createdByName:creator.name, createdByEmail:creator.email, estado:data.estado || 'Rascunho', ...data, ...listSnapshot, viatura, items, peca:first.nome, referencia:first.referencia, quantidade:first.unidade, precoUnitario:first.preco, total: quoteItemsTotal(items), history:[{ date:today(), action:'Criado', by:creator.email || '' }] });
    clearQuoteDraft(); saveState(); closeModal(); renderPage('orcamentos'); toast('Orçamento criado.');
  });
}

function bindQuotes(){
  qs('#openNewQuoteModalBtn')?.addEventListener('click', openNewQuoteModal);
  const refreshQuoteList = ()=>{
    const rows = filterQuotes();
    const holder = qs('.quote-card-list')?.parentElement || qs('#pageContent .clean-main-card');
    const old = qs('.quote-card-list') || qs('#pageContent .clean-main-card > .empty');
    if(old) old.outerHTML = rows.length ? quotesTable(rows) : '<div class="empty">Sem orçamentos para estes filtros.</div>';
    bindQuotes();
  };
  qs('#quoteSearch')?.addEventListener('input', refreshQuoteList);
  qs('#quoteStatusFilter')?.addEventListener('change', refreshQuoteList);
  qsa('[data-set-quote-status]').forEach(btn=>btn.addEventListener('click',()=>{ const sel=qs('#quoteStatusFilter'); if(sel){ sel.value=btn.dataset.setQuoteStatus || ''; refreshQuoteList(); } }));
  qsa('[data-print-quote]').forEach(b=>b.addEventListener('click',()=>printQuote(b.dataset.printQuote)));
  qsa('[data-email-quote]').forEach(b=>b.addEventListener('click',()=>emailQuote(b.dataset.emailQuote)));
  qsa('[data-edit-quote]').forEach(b=>b.addEventListener('click',()=>openQuoteModal(b.dataset.editQuote)));
  qsa('[data-quote-status]').forEach(b=>b.addEventListener('click',()=>{ if(!canEditOperational()) return toast('Sem permissão para alterar orçamento.'); const [id,status]=b.dataset.quoteStatus.split(':'); const q=quoteById(id); if(!q) return; q.estado=status; q.history=q.history||[]; q.history.push({date:today(), action:`Marcado como ${status}`, by:state.currentUser?.email || ''}); saveState(); renderPage('orcamentos'); toast('Estado atualizado.'); }));
  qsa('[data-delete-quote]').forEach(b=>b.addEventListener('click',()=>{ if(!canDelete()) return toast('Sem permissão para apagar.'); state.quotes = state.quotes.filter(q=>q.id!==b.dataset.deleteQuote); saveState(); renderPage('orcamentos'); toast('Orçamento apagado.'); }));
}
function openQuoteModal(id){
  const q = quoteById(id); if(!q) return;
  const items = quoteItemsFromLegacy(q);
  const v = quoteVehicleParts(q);
  openModal('Editar orçamento', `<form id="editQuoteForm" class="form-grid quote-modal-form"><div class="span3 readonly-note">Criado por: ${esc(quoteCreatorName(q) || '-')}</div>
    ${quoteClientSearchHtml(q.codigoCliente ? `${q.codigoCliente} - ${q.cliente || ''}` : (q.cliente || ''))}
    <input class="field" name="codigoCliente" placeholder="Código cliente" value="${esc(q.codigoCliente||'')}">
    <input class="field" name="telefone" placeholder="Telefone" value="${esc(q.telefone||'')}">
    <input class="field" name="email" placeholder="Email do cliente" value="${esc(q.email||'')}">
    <input class="field span3" name="matricula" placeholder="Matrícula" value="${esc(v.matricula)}">
    <input class="field span3" name="marcaModelo" placeholder="Marca & Modelo" value="${esc(v.marcaModelo)}">
    <input class="field span3" name="motor" placeholder="Motor" value="${esc(v.motor)}">
    <div class="span3">${quoteItemsInputs(items, q)}</div>
    <select class="select" name="estado">${['Rascunho','Enviado','Aceite','Recusado'].map(s=>`<option ${q.estado===s?'selected':''}>${s}</option>`).join('')}</select>
    <input class="field" name="validade" type="date" value="${esc(q.validade||today())}">
    <input class="field" name="prazoEntrega" placeholder="Prazo de entrega" value="${esc(q.prazoEntrega||'')}">
    <textarea class="span3" name="condicoes" placeholder="Condições comerciais">${esc(q.condicoes||'')}</textarea>
    <textarea class="span3" name="observacoes" placeholder="Notas internas">${esc(q.observacoes||'')}</textarea>
    <div class="span3"><button class="btn primary full">Guardar orçamento</button></div>
  </form>`);
  const form = qs('#editQuoteForm');
  bindQuoteClientSelect(form);
  bindQuoteItemsEditor(form);
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const newItems = collectQuoteItems(e.target);
    if(!newItems.length) return toast('Adiciona pelo menos uma referência.');
    const first = newItems[0];
    const listSnapshot = readQuoteListSnapshot(e.target, newItems);
    Object.assign(q, data, listSnapshot, {
      viatura:composeQuoteVehicle(data),
      items:newItems,
      peca:first.nome,
      referencia:first.referencia,
      quantidade:first.unidade,
      precoUnitario:first.preco,
      total:quoteItemsTotal(newItems)
    });
    q.history=q.history||[];
    q.history.push({date:today(), action:'Orçamento editado', by:state.currentUser?.email || ''});
    saveState(); closeModal(); renderPage('orcamentos'); toast('Orçamento atualizado.');
  });
}
function quoteById(id){ return state.quotes.find(q=>q.id===id); }
function printQuote(id){
  const q = quoteById(id); if(!q) return;
  const win = window.open('', '_blank', 'width=900,height=900');
  win.document.write(quotePdfHtml(q));
  win.document.close();
  win.focus();
  // Não abrir automaticamente a janela de impressão.
  // O utilizador pode imprimir/guardar PDF manualmente pela janela aberta.
}
function greetingByCurrentHour(){
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : 'Boa tarde';
}
function quoteEmailSubject(q){
  const v = quoteVehicleParts(q);
  return `Orçamento - ${v.marcaModelo || 'Marca&Modelo'} - ${v.matricula || 'Matrícula'}`;
}
function quoteEmailSignatureName(){
  return preferredUserName('Utilizador');
}
function textCell(value, width){
  const text = String(value ?? '-').replace(/\s+/g,' ').trim();
  if(text.length > width) return text.slice(0, Math.max(0,width-1)) + '…';
  return text.padEnd(width, ' ');
}
function quoteEmailTextTable(items){
  const widths = { nome:28, ref:18, un:7, preco:15, total:15 };
  const line = `${'-'.repeat(widths.nome)}  ${'-'.repeat(widths.ref)}  ${'-'.repeat(widths.un)}  ${'-'.repeat(widths.preco)}  ${'-'.repeat(widths.total)}`;
  const head = `${textCell('Nome', widths.nome)}  ${textCell('Referência', widths.ref)}  ${textCell('Unidade', widths.un)}  ${textCell('Preço Líquido', widths.preco)}  ${textCell('Total c/ IVA', widths.total)}`;
  const rows = (items || []).map(item=>{
    const totalLinhaComIva = Number(item.total || 0) * 1.23;
    return `${textCell(item.nome || '-', widths.nome)}  ${textCell(item.referencia || '-', widths.ref)}  ${textCell(item.unidade || '-', widths.un)}  ${textCell(money(item.preco), widths.preco)}  ${textCell(money(totalLinhaComIva), widths.total)}`;
  });
  return [head, line, ...rows].join('\n');
}

function defaultQuoteEmailOptions(){
  return {
    includeNumero:false,
    includeCliente:false,
    includeMatricula:true,
    includeMarcaModelo:true,
    includeMotor:true,
    includeReferencias:true,
    includePrecoLiquido:true,
    includeTotalLinha:true,
    includeResumo:true,
    includePrazo:false,
    includeCondicoes:true,
    includeObservacoes:false
  };
}
function normalizeQuoteEmailOptions(options={}){
  return { ...defaultQuoteEmailOptions(), ...(options || {}) };
}
function quoteEmailTextTableWithOptions(items, options={}){
  const opts = normalizeQuoteEmailOptions(options);
  const widths = { nome:28, ref:18, un:7, preco:15, total:15 };
  const cols = [
    ['nome','Nome',widths.nome, item=>item.nome || '-'],
    ['ref','Referência',widths.ref, item=>item.referencia || '-'],
    ['un','Unidade',widths.un, item=>item.unidade || '-']
  ];
  if(opts.includePrecoLiquido) cols.push(['preco','Preço Líquido',widths.preco, item=>money(item.preco)]);
  if(opts.includeTotalLinha) cols.push(['total','Total c/ IVA',widths.total, item=>money(Number(item.total || 0) * 1.23)]);
  const head = cols.map(([,label,width])=>textCell(label,width)).join('  ');
  const line = cols.map(([,label,width])=>'-'.repeat(width)).join('  ');
  const rows = (items || []).map(item=>cols.map(([,label,width,get])=>textCell(get(item),width)).join('  '));
  return [head,line,...rows].join('\n');
}
function quoteEmailPlainText(q, mensagemExtra='', options={}){
  const opts = normalizeQuoteEmailOptions(options);
  const items = quoteItemsFromLegacy(q);
  const subtotal = quoteItemsTotal(items);
  const iva = subtotal * 0.23;
  const totalComIva = subtotal + iva;
  const v = quoteVehicleParts(q);
  const parts = [
    `${greetingByCurrentHour()},`,
    '',
    'Segue orçamento solicitado.',
    ''
  ];
  if(String(mensagemExtra || '').trim()) parts.push(String(mensagemExtra).trim(), '');
  if(opts.includeNumero) parts.push(`Orçamento: ${q.id}`, '');
  if(opts.includeCliente) parts.push(`Cliente: ${q.cliente || '-'}`, '');
  if(opts.includeMatricula || opts.includeMarcaModelo || opts.includeMotor){
    parts.push('Viatura:');
    if(opts.includeMatricula) parts.push(`Matrícula: ${v.matricula || '-'}`);
    if(opts.includeMarcaModelo) parts.push(`Marca & Modelo: ${v.marcaModelo || '-'}`);
    if(opts.includeMotor) parts.push(`Motor: ${v.motor || '-'}`);
    parts.push('');
  }
  if(opts.includeReferencias) parts.push(quoteEmailTextTableWithOptions(items, opts), '');
  if(opts.includeResumo){
    parts.push(`Subtotal líquido: ${money(subtotal)}`, '', `IVA 23%: ${money(iva)}`, '', `Total: ${money(totalComIva)}`, '');
  }
  if(opts.includePrazo) parts.push(`Prazo de entrega: ${q.prazoEntrega || 'A confirmar'}`, '');
  if(opts.includeCondicoes) parts.push(`Condições: ${q.condicoes || 'Preços sujeitos a disponibilidade da peça no momento da confirmação.'}`, '');
  if(opts.includeObservacoes) parts.push(`Observações: ${q.observacoes || '-'}`, '');
  parts.push('Com os melhores cumprimentos,', quoteEmailSignatureName(), '', `Para avançar, responda a este email com a confirmação do orçamento. Documento gerado por ${companyName()}.`);
  return parts.join('\n');
}
function quoteEmailOutlookBodyHtml(q, mensagemExtra='', options={}){
  const opts = normalizeQuoteEmailOptions(options);
  const items = quoteItemsFromLegacy(q);
  const subtotal = quoteItemsTotal(items);
  const iva = subtotal * 0.23;
  const totalComIva = subtotal + iva;
  const v = quoteVehicleParts(q);
  const cols = [
    `<th style="background:#06447f;color:#ffffff;text-align:left;padding:9px 11px;border:1px solid #06447f">Nome</th>`,
    `<th style="background:#06447f;color:#ffffff;text-align:left;padding:9px 11px;border:1px solid #06447f">Referência</th>`,
    `<th style="background:#06447f;color:#ffffff;text-align:left;padding:9px 11px;border:1px solid #06447f">Unidade</th>`
  ];
  if(opts.includePrecoLiquido) cols.push(`<th style="background:#06447f;color:#ffffff;text-align:left;padding:9px 11px;border:1px solid #06447f">Preço Líquido</th>`);
  if(opts.includeTotalLinha) cols.push(`<th style="background:#06447f;color:#ffffff;text-align:left;padding:9px 11px;border:1px solid #06447f">Total c/ IVA</th>`);
  return `<div style="font-family:Arial,sans-serif;font-size:12pt;color:#000000;line-height:1.35">
    <p style="margin:0 0 14px">${esc(greetingByCurrentHour())},</p>

    <p style="margin:0 0 20px">Segue orçamento solicitado.</p>

    ${String(mensagemExtra || '').trim() ? `<p style="margin:0 0 18px">${esc(String(mensagemExtra).trim()).replace(/\n/g,'<br>')}</p>` : ''}

    ${opts.includeNumero ? `<p style="margin:0 0 18px">Orçamento: ${esc(q.id || '-')}</p>` : ''}

    ${opts.includeCliente ? `<p style="margin:0 0 18px">Cliente: ${esc(q.cliente || '-')}</p>` : ''}

    ${(opts.includeMatricula || opts.includeMarcaModelo || opts.includeMotor) ? `<p style="margin:0 0 4px">Viatura:</p>
    ${opts.includeMatricula ? `<p style="margin:0 0 2px">Matrícula: ${esc(v.matricula || '-')}</p>` : ''}
    ${opts.includeMarcaModelo ? `<p style="margin:0 0 2px">Marca &amp; Modelo: ${esc(v.marcaModelo || '-')}</p>` : ''}
    ${opts.includeMotor ? `<p style="margin:0 0 18px">Motor: ${esc(v.motor || '-')}</p>` : ''}` : ''}

    ${opts.includeReferencias ? `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11pt;color:#000000;margin:0 0 18px">
      <thead><tr>${cols.join('')}</tr></thead>
      <tbody>
        ${items.map(item=>`<tr>
          <td style="padding:8px 11px;border-bottom:1px solid #dce7f0">${esc(item.nome || '-')}</td>
          <td style="padding:8px 11px;border-bottom:1px solid #dce7f0">${esc(item.referencia || '-')}</td>
          <td style="padding:8px 11px;border-bottom:1px solid #dce7f0">${esc(item.unidade || '-')}</td>
          ${opts.includePrecoLiquido ? `<td style="padding:8px 11px;border-bottom:1px solid #dce7f0">${money(item.preco)}</td>` : ''}
          ${opts.includeTotalLinha ? `<td style="padding:8px 11px;border-bottom:1px solid #dce7f0">${money(Number(item.total || 0) * 1.23)}</td>` : ''}
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${opts.includeResumo ? `<p style="margin:0 0 10px">Subtotal líquido: ${money(subtotal)}</p>
    <p style="margin:0 0 10px">IVA 23%: ${money(iva)}</p>
    <p style="margin:0 0 18px">Total: ${money(totalComIva)}</p>` : ''}

    ${opts.includePrazo ? `<p style="margin:0 0 18px">Prazo de entrega: ${esc(q.prazoEntrega || 'A confirmar')}</p>` : ''}

    ${opts.includeCondicoes ? `<p style="margin:0 0 18px">Condições: ${esc(q.condicoes || 'Preços sujeitos a disponibilidade da peça no momento da confirmação.')}</p>` : ''}

    ${opts.includeObservacoes ? `<p style="margin:0 0 18px">Observações: ${esc(q.observacoes || '-')}</p>` : ''}

    <p style="margin:0 0 4px">Com os melhores cumprimentos,</p>
    <p style="margin:0 0 18px">${esc(quoteEmailSignatureName())}</p>

    <p style="margin:0">Para avançar, responda a este email com a confirmação do orçamento. Documento gerado por ${esc(companyName())}.</p>
  </div>`;
}
function quoteEmailHtml(q, mensagemExtra='', options={}){
  return quoteEmailOutlookBodyHtml(q, mensagemExtra, options);
}
function sanitizeFilePart(value){ return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._ -]+/g,'').trim().slice(0,80) || 'orcamento'; }
function quoteElectronEmailPayload(q, mensagemExtra='', options={}){
  const v = quoteVehicleParts(q);
  return {
    to:q.email || '',
    subject:quoteEmailSubject(q),
    htmlBody:quoteEmailOutlookBodyHtml(q, mensagemExtra, options),
    plainBody:quoteEmailPlainText(q, mensagemExtra, options),
    fileBase:sanitizeFilePart(`Orcamento - ${v.marcaModelo || ''} - ${v.matricula || ''} - ${q.id || ''}`)
  };
}

async function copyQuoteHtmlToClipboard(q, mensagemExtra='', options={}){
  const html = quoteEmailHtml(q, mensagemExtra, options);
  const plain = quoteEmailPlainText(q, mensagemExtra, options);
  try{
    const blobHtml = new Blob([html], { type:'text/html' });
    const blobText = new Blob([plain], { type:'text/plain' });
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
    return true;
  }catch(err){
    console.warn('Copy HTML clipboard failed', err);
    return false;
  }
}
function openOutlookHtmlEmail(q, mensagemExtra='', options={}){
  const payload = quoteElectronEmailPayload(q, mensagemExtra, options);

  // Novo fluxo: abre email pronto e copia o layout bonito para CTRL+V.
  // Não mete texto no corpo para não estragar a colagem da tabela.
  if(window.bragalisElectron?.openReadyEmailAndCopyLayout){
    window.bragalisElectron.openReadyEmailAndCopyLayout(payload).then(result=>{
      if(result?.ok) toast('Email aberto. Faz CTRL+V no corpo para inserir o orçamento.');
      else {
        console.warn('Electron ready email failed', result);
        openOutlookEmailBrowserFallback(q, mensagemExtra, options);
      }
    }).catch(err=>{
      console.warn('Electron ready email bridge failed', err);
      openOutlookEmailBrowserFallback(q, mensagemExtra, options);
    });
    return true;
  }

  openOutlookEmailBrowserFallback(q, mensagemExtra, options);
  return true;
}
function openOutlookEmailBrowserFallback(q, mensagemExtra='', options={}){
  const subject = quoteEmailSubject(q);
  const to = q.email || '';

  // Browser/Edge: copia HTML bonito e abre email sem corpo. Depois é CTRL+V.
  copyQuoteHtmlToClipboard(q, mensagemExtra, options)
    .then(copied=>{
      toast(copied ? 'Layout copiado. Faz CTRL+V no corpo do email.' : 'Email aberto. Se não copiar, usa a pré-visualização.');
    })
    .catch(()=>toast('Email aberto. Se o layout não colar, usa a pré-visualização.'));

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}`;
  window.location.href = mailto;
}

function emailQuote(id){
  const q = quoteById(id);
  if(!q) return toast('Orçamento não encontrado.');
  openQuoteEmailOptionsModal(q);
}
function quoteEmailOptionCheckbox(key, label, checked=true){
  return `<label class="email-option-pill"><input type="checkbox" name="${key}" ${checked?'checked':''}> <span>${esc(label)}</span></label>`;
}
function openQuoteEmailOptionsModal(q){
  openModal('Enviar orçamento por email', `<form id="quoteEmailOptionsForm" class="form-grid email-options-form">
    <div class="span3 email-options-intro">
      <strong>Escolhe os campos que queres enviar no email</strong>
      <span>Abre o email com destinatário e assunto. Depois faz CTRL+V no corpo para colar exatamente este layout.</span>
    </div>

    <div class="span3 email-options-grid">
      ${quoteEmailOptionCheckbox('includeNumero','Nº do orçamento', false)}
      ${quoteEmailOptionCheckbox('includeMatricula','Matrícula', true)}
      ${quoteEmailOptionCheckbox('includeMarcaModelo','Marca & Modelo', true)}
      ${quoteEmailOptionCheckbox('includeMotor','Motor', true)}
      ${quoteEmailOptionCheckbox('includeReferencias','Referências / peças', true)}
      ${quoteEmailOptionCheckbox('includePrecoLiquido','Preço líquido', true)}
      ${quoteEmailOptionCheckbox('includeTotalLinha','Total c/ IVA por referência', true)}
      ${quoteEmailOptionCheckbox('includeResumo','Resumo final', true)}
      ${quoteEmailOptionCheckbox('includePrazo','Prazo de entrega', false)}
      ${quoteEmailOptionCheckbox('includeCondicoes','Condições', true)}
      ${quoteEmailOptionCheckbox('includeObservacoes','Observações', false)}
      ${quoteEmailOptionCheckbox('includeCliente','Nome do cliente', false)}
    </div>

    <textarea class="span3" name="mensagemExtra" placeholder="Mensagem extra opcional"></textarea>

    <div class="span3 actions">
      <button class="btn ghost" type="button" id="cancelQuoteEmailBtn">Cancelar</button>
      <button class="btn primary" type="submit">Abrir Outlook / Email</button>
    </div>
  </form>`);
  qs('#cancelQuoteEmailBtn')?.addEventListener('click', closeModal);
  qs('#quoteEmailOptionsForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const options = {};
    ['includeNumero','includeCliente','includeMatricula','includeMarcaModelo','includeMotor','includeReferencias','includePrecoLiquido','includeTotalLinha','includeResumo','includePrazo','includeCondicoes','includeObservacoes']
      .forEach(key=>{ options[key] = fd.get(key) === 'on'; });
    closeModal();
    openOutlookHtmlEmail(q, fd.get('mensagemExtra') || '', options);
  });
}

function quotePdfHtml(q){
  const items = quoteItemsFromLegacy(q);
  const subtotal = quoteItemsTotal(items);
  const iva = subtotal * 0.23;
  const totalComIva = subtotal + iva;
  const settings = state.settings || {};
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>Orçamento ${esc(q.id)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#12344d;background:#eef4f8}.page{width:210mm;min-height:297mm;margin:0 auto;background:white;padding:20mm}
    .top{position:relative;display:flex;justify-content:space-between;gap:24px;border-bottom:4px solid #06447f;padding-bottom:18px}.brand{padding-left:78px;min-height:64px}.pdf-logo{position:absolute;left:0;top:0;width:58px;height:58px;border-radius:18px;padding:7px;background:linear-gradient(135deg,#ffffff,#eef6ff);border:1px solid #d7e6f2;box-shadow:0 10px 22px rgba(6,68,127,.16);object-fit:contain}.brand h1{margin:0;color:#06447f}.brand p,.box p{margin:5px 0;color:#49677f}.stamp{font-size:28px;font-weight:900;color:#f58220;text-align:right}.box{border:1px solid #c9d8e5;border-radius:10px;padding:14px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin-top:22px}th{background:#06447f;color:white;text-align:left;padding:12px}td{border-bottom:1px solid #dce7f0;padding:12px}.totals{margin-left:auto;width:310px;margin-top:18px}.totals div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #dce7f0}.totals .grand{font-size:20px;font-weight:900;color:#06447f}.notes{margin-top:26px;line-height:1.5}.footer{margin-top:40px;color:#49677f;font-size:12px;border-top:1px solid #dce7f0;padding-top:12px}@media print{body{background:white}.page{margin:0;box-shadow:none}button{display:none!important}}
  </style></head><body><button onclick="window.print()" style="position:fixed;right:18px;top:18px;z-index:20;border:0;border-radius:12px;padding:10px 14px;background:#06447f;color:white;font-weight:800;cursor:pointer">Imprimir / Guardar PDF</button><main class="page">
    <section class="top"><img class="pdf-logo" src="../assets/bragalis-callcenter-icon.png" alt="${esc(companyName())}"><div class="brand"><h1>${esc(companyName())}</h1><p>${esc(settings.companyAddress || 'Callcenter de peças automóveis')}</p><p>${settings.companyNif ? `NIF: ${esc(settings.companyNif)} · ` : ''}${esc(settings.companyPhone || '')} ${settings.companyEmail ? '· ' + esc(settings.companyEmail) : ''}</p><p>Orçamento gerado em ${esc(today())}</p></div><div><div class="stamp">ORÇAMENTO</div><p><strong>${esc(q.id)}</strong></p><p>Validade: ${esc(q.validade || today())}</p><p>Estado: ${esc(q.estado || 'Rascunho')}</p><p>Criado por: ${esc(quoteCreatorName(q) || '-')}</p></div></section>
    <section class="box"><h2>Cliente</h2><p><strong>${esc(q.cliente)}</strong></p><p>Código cliente: ${esc(q.codigoCliente || '-')}</p><p>Telefone: ${esc(q.telefone || '-')} · Email: ${esc(q.email || '-')}</p><p>Matrícula: ${esc(quoteVehicleParts(q).matricula || '-')}</p><p>Marca & Modelo: ${esc(quoteVehicleParts(q).marcaModelo || '-')}</p><p>Motor: ${esc(quoteVehicleParts(q).motor || '-')}</p></section>
    <table><thead><tr><th>Nome</th><th>Referência</th><th>Unidade</th><th>Preço Líquido</th><th>Total c/ IVA</th></tr></thead><tbody>${items.map(item=>`<tr><td>${esc(item.nome)}</td><td>${esc(item.referencia || '-')}</td><td>${esc(item.unidade)}</td><td>${money(item.preco)}</td><td>${money(Number(item.total || 0) * 1.23)}</td></tr>`).join('')}</tbody></table>
    <section class="totals"><div><span>Subtotal líquido</span><strong>${money(subtotal)}</strong></div><div><span>IVA 23%</span><strong>${money(iva)}</strong></div><div class="grand"><span>Total</span><strong>${money(totalComIva)}</strong></div></section>
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
    setDirectoryRuntimeOpen(group.id, true);
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
    setDirectoryRuntimeOpen(group.id, true);
    saveState();
    closeModal();
    renderPage('contactos');
    toast('Contacto atualizado.');
  });
  qs('#cancelEditContactBtn')?.addEventListener('click', closeModal);
}

function bindContactDirectory(){
  const quickCreateBtn = qs('#openQuickContactBtn');
  if(quickCreateBtn && quickCreateBtn.dataset.contactBound !== '1'){
    quickCreateBtn.dataset.contactBound = '1';
    quickCreateBtn.addEventListener('click', openQuickContactCreateModal);
  }
  const quickForm = qs('#quickContactForm');
  if(quickForm && quickForm.dataset.contactBound !== '1'){
    quickForm.dataset.contactBound = '1';
    quickForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    normalizeContactDirectory();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const armazem = (data.armazem || '').trim();
    const seccao = (data.seccao || '').trim();
    if(!armazem || !seccao || !data.nome?.trim()) return toast('Preenche armazém, secção e nome.');
    let group = (state.contactGroups || []).find(g => contactWarehouse(g).toLowerCase() === armazem.toLowerCase() && contactSection(g).toLowerCase() === seccao.toLowerCase());
    if(!group){
      group = { id:uid('DIR'), armazem, seccao, nome:seccao, aberto:false, contactos:[] };
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
    setDirectoryRuntimeOpen(group.id, true);
    saveState(); renderPage('contactos'); toast('Contacto adicionado.');
    });
  }

  qsa('[data-toggle-contact-group]').forEach(btn=>btn.addEventListener('click',()=>{
    normalizeContactDirectory();
    const group = (state.contactGroups || []).find(g=>g.id===btn.dataset.toggleContactGroup);
    if(!group) return;
    group.aberto = !group.aberto;
    setDirectoryRuntimeOpen(group.id, group.aberto);

    // Toggle visual local, sem redesenhar a página.
    btn.classList.toggle('active', group.aberto);
    const warehouse = btn.closest('.warehouse-simple-card');
    const panel = warehouse?.querySelector(`[data-contact-section-panel="${group.id}"]`);
    if(panel) panel.classList.toggle('hidden', !group.aberto);

    const allBtn = qs('#toggleAllDirectoryBtn');
    if(allBtn) allBtn.textContent = allDirectoryGroupsOpen() ? 'Fechar Tudo' : 'Abrir Tudo';

    // Compatibilidade com layout antigo
    const section = btn.closest('.directory-section');
    const body = section?.querySelector('.section-body');
    const icon = btn.querySelector('.section-toggle-icon, i');
    if(body) body.classList.toggle('hidden', !group.aberto);
    if(icon) icon.textContent = group.aberto ? '−' : '+';
  }));

  qsa('[data-toggle-warehouse]').forEach(head=>head.addEventListener('click',()=>{
    normalizeContactDirectory();
    const card = head.closest('.warehouse-simple-card');
    const chips = [...(card?.querySelectorAll('[data-toggle-contact-group]') || [])];
    if(!chips.length) return;
    const groups = chips.map(chip => (state.contactGroups || []).find(g=>g.id===chip.dataset.toggleContactGroup)).filter(Boolean);
    const nextOpen = groups.some(g=>!g.aberto);
    groups.forEach(group=>{
      group.aberto = nextOpen;
      setDirectoryRuntimeOpen(group.id, nextOpen);
      const chip = card.querySelector(`[data-toggle-contact-group="${group.id}"]`);
      const panel = card.querySelector(`[data-contact-section-panel="${group.id}"]`);
      chip?.classList.toggle('active', nextOpen);
      panel?.classList.toggle('hidden', !nextOpen);
    });
    const allBtn = qs('#toggleAllDirectoryBtn');
    if(allBtn) allBtn.textContent = allDirectoryGroupsOpen() ? 'Fechar Tudo' : 'Abrir Tudo';
  }));

  qsa('[data-toggle-warehouse]').forEach(head=>head.addEventListener('keydown',e=>{
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      head.click();
    }
  }));

  const toggleAllDirectoryBtn = qs('#toggleAllDirectoryBtn');
  if(toggleAllDirectoryBtn) toggleAllDirectoryBtn.addEventListener('click',()=>{
    normalizeContactDirectory();
    const nextOpen = !allDirectoryGroupsOpen();
    setAllDirectoryRuntimeOpen(nextOpen);
    qsa('.section-chip').forEach(btn=>btn.classList.toggle('active', nextOpen));
    qsa('.directory-section-simple').forEach(panel=>panel.classList.toggle('hidden', !nextOpen));
    toggleAllDirectoryBtn.textContent = nextOpen ? 'Fechar Tudo' : 'Abrir Tudo';
  });

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
function promiseTimeout(promise, ms=6500){
  return Promise.race([
    promise,
    new Promise((_, reject)=>setTimeout(()=>reject(new Error('timeout')), ms))
  ]);
}
async function approveUserSafely(user){
  if(!hasWritableFirebaseSession()) throw new Error('firebase-required');
  user.status = 'Ativo';
  user.approvedAt = new Date().toISOString();
  user.approvedBy = state.currentUser?.email || firebaseAuth?.currentUser?.email || '';
  upsertAppUser(user);
  await promiseTimeout(saveUserProfileToFirestore(user), 6500);
  clearFirebaseDirty();
  return { firebase:true };
}

function bindUsersPage(){
  qsa('[data-approve-user]').forEach(btn=>btn.addEventListener('click', async ()=>{
    if(!isAdminMaster()) return toast('Só o Admin Master pode aprovar contas.');
    const user = (state.users || []).find(u=>u.id===btn.dataset.approveUser);
    if(!user) return;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'A aprovar...';
    try {
      await approveUserSafely(user);
      renderPage('users');
      toast('Conta aprovada e gravada na Firebase.');
    } catch(err) {
      console.warn('Aprovação Firebase falhou', err);
      toast('Não foi possível aprovar: Firebase obrigatório.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText || 'Aprovar';
    }
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
      renderPage('users');
      toast(result?.authCreated ? 'Conta Firebase criada e perfil guardado.' : 'Perfil guardado. Email já existia no Auth ou foi criado localmente.');
    } catch (err) {
      console.warn('Create user failed', err);
      if(err.code === 'auth/email-already-in-use') {
        const existing = await findExistingFirebaseUserProfile(email);
        if(existing?.id) user.id = existing.id;
        upsertAppUser(user);
        await saveUserProfileToFirestore(user);
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
    permissions: normalizeUserPermissions(user),
    pageAccess:{},
    actionAccess:{},
    email:String(user.email || '').toLowerCase(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || ''
  };
  const cleanPayload = sanitizeRowForFirestore(payload);
  cleanPayload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  await firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(user.id).set(cleanPayload, { merge:true });
  return true;
}
async function saveAllUserPermissionsToFirestore(users){
  if(!firebaseReady || !firebaseDb || !firebaseAuth?.currentUser || firebaseAuth.currentUser.isAnonymous) return false;
  const editableUsers = (users || []).filter(u => (u.role || 'Operador') !== 'Admin Master');
  let batch = firebaseDb.batch();
  let ops = 0;
  editableUsers.forEach(user=>{
    user.permissions = normalizeUserPermissions(user);
    user.pageAccess = {};
    user.actionAccess = {};
    const ref = firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(user.id);
    batch.set(ref, sanitizeRowForFirestore({
      ...user,
      email:String(user.email || '').toLowerCase(),
      permissions:user.permissions,
      pageAccess:{},
      actionAccess:{},
      permissionsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      permissionsUpdatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || ''
    }), { merge:true });
    ops++;
  });
  if(ops) await promiseTimeout(batch.commit(), 9000);
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
function createEntityFormHtml(type){
  if(type==='client') return `<form id="entityCreateForm" data-create-type="client" class="simple-stack-form modal-stack-form">${clientFormHtml({})}<button class="btn primary full" type="submit">Guardar cliente</button></form>`;
  if(type==='supplier') return `<form id="entityCreateForm" data-create-type="supplier" class="simple-stack-form modal-stack-form">
    <input class="field" name="nomeMarca" placeholder="Nome do fornecedor / marca" required>
    <input class="field" name="codigoFicha" placeholder="Código de ficha" required>
    <button class="btn primary full" type="submit">Guardar fornecedor</button>
  </form>`;
  if(type==='reference') return referenceFormHtml();
  if(type==='stock') return `<form id="entityCreateForm" data-create-type="stock" class="form-grid modal-grid-form">
    ${[['referencia','Referência'],['nome','Nome da peça'],['marca','Marca'],['modelo','Modelo compatível'],['estado','Nova / Usada / Recondicionada'],['local','Localização'],['custo','Preço custo'],['venda','Preço venda'],['qtd','Quantidade']].map(f=>`<input class="field" name="${f[0]}" placeholder="${f[1]}">`).join('')}
    <div class="span3"><button class="btn primary" type="submit">Guardar registo</button></div>
  </form>`;
  return '';
}
function createEntityTitle(type){
  return type==='client' ? 'Adicionar cliente' : type==='supplier' ? 'Adicionar fornecedor' : type==='stock' ? 'Adicionar stock' : type==='reference' ? 'Adicionar referência' : 'Adicionar registo';
}
function openCreateEntityModal(type){
  if(!canEditOperational()) return toast('Sem permissão para guardar.');
  const html = createEntityFormHtml(type);
  if(!html) return toast('Tipo de registo não suportado.');
  openModal(createEntityTitle(type), html);
  bindClientMultiContacts(qs('#entityCreateForm'));
  bindCreateEntityForm(qs('#entityCreateForm'));
}
function bindCreateEntityForm(form){
  if(!form || form.dataset.boundCreateEntity) return;
  form.dataset.boundCreateEntity = '1';
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar.');
    const type = form.dataset.createType;
    const map = { client:['clients','CLI'], supplier:['suppliers','FOR'], stock:['stock','STK'], reference:['references','REF'] };
    const target = map[type];
    if(!target) return toast('Tipo de registo inválido.');
    const [key,prefix] = target;
    let row = { id:uid(prefix), ...Object.fromEntries(new FormData(form).entries()) };
    if(type==='client') row = { ...row, ...collectClientContacts(form) };
    if(type==='reference') { row.referencia=String(row.referencia||'').trim(); row.familia=String(row.familia||'').trim(); row.marca=String(row.marca||'').trim(); row.descricao=String(row.descricao||'').trim(); }
    state[key] = Array.isArray(state[key]) ? state[key] : [];
    state[key].push(row);
    if(key==='suppliers') sortSuppliersState();
    try{
      const ok = await saveSingleRowToFirebase(key, row);
      if(!ok) saveState();
      closeModal();
      renderPage(currentPage);
      toast('Registo guardado.');
    }catch(err){
      console.warn('Firebase save failed', err);
      state[key] = state[key].filter(x=>x.id!==row.id);
      closeModal();
      renderPage(currentPage);
      toast('Erro ao guardar registo.');
    }
  });
}
function quickContactCreateFormHtml(){
  const warehouses = uniqueWarehouses();
  const sections = uniqueSections();
  return `<form id="quickContactCreateForm" class="simple-stack-form directory-simple-form modal-stack-form">
    <input class="field" name="armazem" list="warehouseList" placeholder="Armazém" required>
    <datalist id="warehouseList">${warehouses.map(w=>`<option value="${esc(w)}"></option>`).join('')}</datalist>
    <input class="field" name="seccao" list="sectionList" placeholder="Secção" required>
    <datalist id="sectionList">${sections.map(sec=>`<option value="${esc(sec)}"></option>`).join('')}</datalist>
    <input class="field" name="nome" placeholder="Nome do contacto" required>
    <div class="mini-two-fields"><input class="field" name="telemovel" placeholder="Telemóvel"><input class="field" name="telefone" placeholder="Telefone"></div>
    <input class="field" name="email" type="email" placeholder="Email">
    <button class="btn primary full" type="submit">Guardar contacto</button>
  </form>`;
}
function openQuickContactCreateModal(){
  if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
  openModal('Adicionar contacto', quickContactCreateFormHtml());
  bindQuickContactCreateForm(qs('#quickContactCreateForm'));
}
function bindQuickContactCreateForm(form){
  if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    normalizeContactDirectory();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const armazem = (data.armazem || '').trim();
    const seccao = (data.seccao || '').trim();
    if(!armazem || !seccao || !data.nome?.trim()) return toast('Preenche armazém, secção e nome.');
    let group = (state.contactGroups || []).find(g => contactWarehouse(g).toLowerCase() === armazem.toLowerCase() && contactSection(g).toLowerCase() === seccao.toLowerCase());
    if(!group){
      group = { id:uid('DIR'), armazem, seccao, nome:seccao, aberto:false, contactos:[] };
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
    setDirectoryRuntimeOpen(group.id, true);
    saveState(); closeModal(); renderPage('contactos'); toast('Contacto adicionado.');
  });
}
function followCreateFormHtml(){
  return `<form id="followForm" class="form-grid modal-grid-form">
    <input class="field" type="date" name="date" value="${today()}">
    <input class="field" type="time" name="time">
    <input class="field" name="title" placeholder="Título">
    <input class="field span2" name="related" placeholder="Relacionado com">
    <select class="select" name="status"><option>Pendente</option><option>Feito</option></select>
    <textarea class="span3" name="notes" placeholder="Notas"></textarea>
    <div class="span3"><button class="btn primary">Guardar</button></div>
  </form>`;
}
function openFollowCreateModal(){
  if(!canEditOperational()) return toast('Sem permissão para guardar.');
  openModal('Novo follow-up', followCreateFormHtml());
  bindFollowForm();
}
function bindEntities(){
  bindClientMultiContacts(document);
  qs('#supplierBackTopBtn')?.addEventListener('click',()=>{
    const content = qs('#pageContent') || document.scrollingElement || document.documentElement;
    if(content?.scrollTo) content.scrollTo({ top:0, behavior:'smooth' });
    else window.scrollTo({ top:0, behavior:'smooth' });
  });
  qsa('[data-create-entity]').forEach(b=>b.addEventListener('click',()=>openCreateEntityModal(b.dataset.createEntity)));
  const map = { client:[state.clients,'clients'], supplier:[state.suppliers,'suppliers'], stock:[state.stock,'stock'], reference:[state.references,'references'], user:[state.users,'users'], follow:[state.followups,'followups'] };
  qsa('[data-delete-entity]').forEach(b=>b.addEventListener('click',async()=>{ const [type,id]=b.dataset.deleteEntity.split(':'); if(!canDelete(type==='reference'?'referencias':currentPage)) return toast('Sem permissão para apagar.'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); const target=map[type]; if(type==='reference' && firebaseReady && firebaseDb){ try{ await firebaseDb.collection(FIREBASE_COLLECTIONS.references).doc(id).delete(); state.references=(state.references||[]).filter(x=>x.id!==id); renderPage(currentPage); toast('Referência apagada da Firebase.'); }catch(err){toast('Não foi possível apagar a referência.');} return; } state[target[1]] = target[0].filter(x=>x.id!==id); saveState(); renderPage(currentPage); toast('Registo apagado.'); }));
  qsa('[data-edit-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.editEntity.split(':'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); openEntityModal(type,id); }));
  qsa('[data-view-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.viewEntity.split(':'); openEntityReadModal(type,id); }));
  const forms = [{id:'clientForm',key:'clients',prefix:'CLI'},{id:'supplierForm',key:'suppliers',prefix:'FOR'},{id:'stockForm',key:'stock',prefix:'STK'},{id:'userForm',key:'users',prefix:'USR'}];
  forms.forEach(f=>{ const form=qs('#'+f.id); if(form) form.addEventListener('submit',async e=>{ 
    e.preventDefault(); 
    if(f.key==='users' && !hasPermission('manageUsers')) return toast('Sem permissão para gerir utilizadores.'); 
    if(f.key!=='users' && !canEditOperational()) return toast('Sem permissão para guardar.'); 
    let row = {id:uid(f.prefix),...Object.fromEntries(new FormData(e.target).entries())};
    if(f.key==='clients') row = {...row, ...collectClientContacts(e.target)};
    state[f.key].push(row); 
    if(f.key==='suppliers') sortSuppliersState(); 
    try{
      const ok = await saveSingleRowToFirebase(f.key, row);
      if(!ok) saveState();
      renderPage(currentPage); 
      toast('Registo guardado na Firebase.');
    }catch(err){
      console.warn('Direct Firebase save failed', err);
      state[f.key] = state[f.key].filter(x=>x.id!==row.id);
      renderPage(currentPage);
      const code = err?.code ? ` (${err.code})` : '';
      toast(`Erro Firebase ao guardar${code}.`);
    }
  }); });
}
function openEntityModal(type,id){
  const map = { client:['clients','CLI'], supplier:['suppliers','FOR'], stock:['stock','STK'], reference:['references','REF'], user:['users','USR'], follow:['followups','AGE'] };
  const [key] = map[type]; const item = state[key].find(x=>x.id===id); if(!item) return;
  const fields = type === 'client' ? ['codigoCliente','nome','telefone','email','morada','codigoPostal','notas'] : Object.keys(item).filter(k=>k!=='id' && !(type==='user' && k==='pageAccess'));
  const editHtml = type==='reference' ? referenceFormHtml(item).replace('id="entityCreateForm" data-create-type="reference"','id="entityEditForm"') : `<form id="entityEditForm" class="form-grid">${type==='client' ? clientFormHtml(item) : fields.map(k=>`<input class="field" name="${k}" placeholder="${k}" value="${esc(item[k])}">`).join('')}<div class="span3"><button class="btn primary">Guardar</button></div></form>`;
  openModal(type==='reference' ? 'Editar referência' : 'Editar registo', editHtml);
  bindClientMultiContacts(qs('#entityEditForm'));
  qs('#entityEditForm').addEventListener('submit',async e=>{
    e.preventDefault(); 
    const data = Object.fromEntries(new FormData(e.target).entries());
    if(type==='client') Object.assign(data, collectClientContacts(e.target));
    if(type==='reference') { data.referencia=String(data.referencia||'').trim(); data.familia=String(data.familia||'').trim(); data.marca=String(data.marca||'').trim(); data.descricao=String(data.descricao||'').trim(); }
    Object.assign(item,data); 
    if(key==='suppliers') sortSuppliersState(); 
    try{
      const ok = await saveSingleRowToFirebase(key, item);
      if(!ok) saveState();
      closeModal(); renderPage(currentPage); toast('Registo atualizado.');
    }catch(err){
      console.warn('Update Firebase failed', err);
      const code = err?.code ? ` (${err.code})` : '';
      toast(`Erro Firebase ao atualizar${code}.`);
    }
  });
}
function openEntityReadModal(type,id){
  const map = { client:['clients'], supplier:['suppliers'], stock:['stock'], user:['users'], follow:['followups'] };
  const [key] = map[type] || [];
  const item = key ? state[key].find(x=>x.id===id) : null;
  if(!item) return;
  const fields = Object.entries(item).filter(([k])=>!['id','pageAccess','actionAccess','permissions'].includes(k));
  openModal('Detalhe do registo', `<div class="detail-grid">${fields.map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v || '-')}</strong></div>`).join('')}</div>`);
}
function bindFollowForm(){
  qs('#openFollowCreateBtn')?.addEventListener('click', openFollowCreateModal);
  const form = qs('#followForm');
  if(!form || form.dataset.boundFollowForm) return;
  form.dataset.boundFollowForm = '1';
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para guardar.');
    state.followups.push({id:uid('AGE'),...Object.fromEntries(new FormData(e.target).entries())});
    saveState(); closeModal(); renderPage('agenda'); toast('Follow-up guardado.');
  });
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
      cardLayout: ['grid','list'].includes(fd.get('cardLayout')) ? fd.get('cardLayout') : 'grid',
      cardSize: ['compact','normal','large'].includes(fd.get('cardSize')) ? fd.get('cardSize') : 'normal',
      githubUrl:fd.get('githubUrl'),
      firebaseEnabled:firebaseReady,
      remoteFastMode: state.settings?.remoteFastMode !== false
    };
    saveState(); applyTheme(); refreshConfigPage('Configurações guardadas.');
  });
  const cardsVisualForm = qs('#cardsVisualForm');
  if(cardsVisualForm) cardsVisualForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar o visual global.');
    const fd = new FormData(e.target);
    state.settings = {
      ...(state.settings || {}),
      cardLayout: ['grid','list'].includes(fd.get('cardLayout')) ? fd.get('cardLayout') : 'grid',
      cardSize: ['compact','normal','large'].includes(fd.get('cardSize')) ? fd.get('cardSize') : 'normal'
    };
    saveState('Visual dos cards atualizado');
    applyTheme();
    refreshConfigPage('Visual dos cards guardado para todos os users.');
  });

  const permissionsForm = qs('#permissionsForm');
  if(permissionsForm) permissionsForm.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!isAdminMaster()) return toast('Só o Admin Master pode alterar permissões.');
    const saveBtn = permissionsForm.querySelector('button[type="submit"]');
    const oldText = saveBtn?.textContent || 'Guardar permissões';
    if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = 'A guardar...'; }

    const fd = new FormData(e.target);
    const managed = managedPageList();
    const actions = ['view','add','edit','delete'];
    (state.users || []).forEach(u=>{
      if((u.role || 'Operador') === 'Admin Master') return;
      u.permissions = {};
      managed.forEach(p=>{
        u.permissions[p.id] = {};
        actions.forEach(action=>{
          u.permissions[p.id][action] = fd.get(`perm:${u.id}:${p.id}:${action}`) === 'on';
        });
      });
      u.pageAccess = {};
      u.actionAccess = {};
    });
    if(state.settings){
      delete state.settings.operatorPageAccess;
      delete state.settings.operatorActionAccess;
    }

    let firebaseSaved = false;
    try {
      firebaseSaved = await saveAllUserPermissionsToFirestore(state.users || []);
      clearFirebaseDirty();
    } catch(err) {
      console.warn('Permissões Firebase falharam', err);
      markFirebaseDirty();
    }

    if(saveBtn){ saveBtn.disabled = false; saveBtn.textContent = oldText; }
    buildNav();
    refreshConfigPage(firebaseSaved ? 'Permissões guardadas na Firebase.' : 'Permissões guardadas localmente. Firebase pendente.');
  });
  qsa('[data-user-perm-preset]').forEach(btn=>btn.addEventListener('click',()=>{
    const [userId, preset] = btn.dataset.userPermPreset.split(':');
    const panel = qs(`[data-permission-user="${userId}"]`);
    if(!panel) return;
    const rows = panel.querySelectorAll('[data-permission-row]');
    rows.forEach(row=>{
      const checks = {
        view: row.querySelector('[data-permission-input="view"]'),
        add: row.querySelector('[data-permission-input="add"]'),
        edit: row.querySelector('[data-permission-input="edit"]'),
        delete: row.querySelector('[data-permission-input="delete"]')
      };
      if(preset === 'hidden'){
        Object.values(checks).forEach(input=>{ if(input) input.checked = false; });
      }
      if(preset === 'readonly'){
        if(checks.view) checks.view.checked = true;
        ['add','edit','delete'].forEach(k=>{ if(checks[k]) checks[k].checked = false; });
      }
      if(preset === 'all'){
        Object.values(checks).forEach(input=>{ if(input) input.checked = true; });
      }
      const hidden = !checks.view?.checked;
      row.classList.toggle('page-hidden-row', hidden);
      const small = row.querySelector('.page-permission-title small');
      if(small) small.textContent = hidden ? 'Escondida para este utilizador' : small.textContent.replace('Escondida para este utilizador','');
    });
    toast(preset === 'hidden' ? 'Páginas marcadas para esconder. Clica em Guardar permissões.' : 'Permissões ajustadas. Clica em Guardar permissões.');
  }));
  qsa('[data-permission-input="view"]').forEach(input=>input.addEventListener('change',()=>{
    const row = input.closest('[data-permission-row]');
    row?.classList.toggle('page-hidden-row', !input.checked);
    if(!input.checked){
      row?.querySelectorAll('[data-permission-input]').forEach(chk=>{
        if(chk !== input) chk.checked = false;
      });
    }
  }));

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
  if(exportBtn) exportBtn.addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='bragalis-callcenter-export.json'; a.click(); URL.revokeObjectURL(a.href); });
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
	routes: [],
    followups: [],
    stock: [],
    contactGroups: []
  });
  saveState();
}
function exportProductionReport(){
  const score = readinessScore();
  const lines = [
    `Bragalis Callcenter - Relatório de produção`,
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

function openModal(title, html){
  const root = qs('#modalRoot');
  root.innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="btn danger-soft small" id="closeModalBtn">Fechar</button></div>${html}</div>`;
  root.classList.remove('hidden');

  qs('#closeModalBtn')?.addEventListener('click',closeModal);

  // Fechar modal ao clicar fora da caixa.
  root.addEventListener('mousedown', handleModalBackdropClick);
  root.addEventListener('touchstart', handleModalBackdropClick, { passive:true });

  qsa('#modalRoot [data-client-email]').forEach(b=>b.addEventListener('click',()=>emailClient(b.dataset.clientEmail)));
  applySpellcheckEnhancements(qs('#modalRoot'));
}
function handleModalBackdropClick(e){
  if(e.target && e.target.id === 'modalRoot') closeModal();
}
function closeModal(){
  const root = qs('#modalRoot');
  root?.classList.add('hidden');
  if(root) {
    root.removeEventListener('mousedown', handleModalBackdropClick);
    root.removeEventListener('touchstart', handleModalBackdropClick);
    root.innerHTML='';
  }
}



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
  // A pesquisa do Dashboard tem um campo próprio integrado no portal.
  if(wrap) wrap.classList.toggle('hidden', pageId === 'dashboard');
}
function copyText(value){
  const text = value || '';
  if(!text) return toast('Nada para copiar.');
  navigator.clipboard?.writeText(text).then(()=>toast('Copiado.')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiado.');
  });
}
function actionPermissionsCard(){ return ''; }
function bindActionPermissions(){ /* Sistema antigo removido: permissões agora são por utilizador e página. */ }
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
  if(hasWritableFirebaseSession() && (cloudSavePending || localStorage.getItem('bragalis_firebase_dirty_v1') === '1')) {
    pushCloudState({ source:'beforeunload' });
  }
});
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => { if(currentResolution && currentResolution() === 'auto') applyTheme(); });
