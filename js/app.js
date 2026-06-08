const APP_VERSION = '1.6.0';
const STORAGE_KEY = 'autoparts_callcenter_v1';
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
  contactGroups: 'diretorioContactos'
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

const pages = [
  { id: 'dashboard', icon: '🏁', title: 'Dashboard', subtitle: 'Painel principal da operação' },
  { id: 'clientes', icon: '👤', title: 'Clientes', subtitle: 'Fichas, histórico e contactos' },
  { id: 'contactos', icon: '☎️', title: 'Diretório de contactos', subtitle: 'Pesquisa rápida de clientes e fornecedores' },
  { id: 'fornecedores', icon: '🏭', title: 'Fornecedores', subtitle: 'Lista de fornecedores e referências' },
  { id: 'orcamentos', icon: '🧾', title: 'Orçamentos', subtitle: 'Criar, enviar e acompanhar propostas' },
  { id: 'users', icon: '🛡️', title: 'Utilizadores', subtitle: 'Equipa, cargos e permissões' },
  { id: 'config', icon: '⚙️', title: 'Configurações', subtitle: 'GitHub, Electron, Firebase e backups' }
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
  config: 'configuracoes.html'
};

const states = ['Novo', 'Em pesquisa', 'Orçamento enviado', 'Confirmado', 'Perdido', 'Concluído'];
const urgencies = ['Normal', 'Urgente', 'Muito urgente'];
const rolePermissions = {
  'Admin Master': ['manageUsers','approveUsers','editAll','deleteAll','viewReports','manageSettings'],
  'Admin': ['editAll','deleteAll','viewReports','manageSettings'],
  'Supervisor': ['editAll','viewReports'],
  'Operador': ['createOperational']
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
      dailyBackupHour: '19:30'
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
      { id: uid('USR'), nome:'Ricardo', email:'pica.fern@gmail.com', role:'Admin Master', status:'Ativo' },
      { id: uid('USR'), nome:'Operador 1', email:'operador@empresa.pt', role:'Operador', status:'Ativo' }
    ],
    contactGroups: [
      {
        id: uid('DIR'),
        nome:'Callcenter Lisboa',
        aberto:true,
        contactos:[
          { id: uid('CNT'), nome:'Ricardo', telemovel:'912345678', telefone:'213000000', email:'pica.fern@gmail.com' },
          { id: uid('CNT'), nome:'Operador Lisboa', telemovel:'913000000', telefone:'213000001', email:'lisboa@empresa.pt' }
        ]
      },
      {
        id: uid('DIR'),
        nome:'Callcenter Porto',
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
    if (!raw) return seedData();
    return { ...seedData(), ...JSON.parse(raw) };
  } catch {
    return seedData();
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}
function saveLocalOnly(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function appIsVisible(){ return !qs('#appShell')?.classList.contains('hidden'); }
function firebaseStatus(){
  if (!firebaseReady) return 'Modo local';
  return firebaseAuth?.currentUser ? 'Firebase ligado' : 'Firebase pronto';
}
function scheduleCloudSave(){
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(pushCloudState, 450);
}
async function pushCloudState(){
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb) return;
  try {
    await saveFirebaseCollections();
  } catch (err) {
    console.warn('Firebase save failed', err);
    toast('Guardado localmente. Firebase sem permissões.');
  }
}
async function saveFirebaseCollections(){
  const metaRef = firebaseDb.collection(FIREBASE_META_COLLECTION).doc(FIREBASE_META_DOC);
  if (hasPermission('manageSettings')) {
    await metaRef.set({
      settings: state.settings || {},
      appVersion: APP_VERSION,
      dataModel: 'collections-v2',
      collections: FIREBASE_COLLECTIONS,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebaseAuth.currentUser?.email || ''
    }, { merge: true });
  }

  for (const [stateKey, collectionName] of Object.entries(FIREBASE_COLLECTIONS)) {
    if (stateKey === 'users' && !hasPermission('manageUsers')) continue;
    await syncCollection(collectionName, state[stateKey] || [], canDelete());
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
async function loadCloudState(){
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb) return;
  try {
    const authUser = firebaseAuth.currentUser;
    const base = seedData();
    const metaSnap = await firebaseDb.collection(FIREBASE_META_COLLECTION).doc(FIREBASE_META_DOC).get();
    state = { ...base, currentUser: { email: authUser.email, name: (authUser.email || 'Admin').split('@')[0] } };

    if (metaSnap.exists && metaSnap.data()?.settings) {
      state.settings = { ...base.settings, ...metaSnap.data().settings, firebaseEnabled: true };
    }

    let loadedRows = 0;
    for (const [stateKey, collectionName] of Object.entries(FIREBASE_COLLECTIONS)) {
      const snap = await firebaseDb.collection(collectionName).get();
      state[stateKey] = snap.docs.map(doc => cleanFirebaseDoc({ id: doc.id, ...doc.data() }));
      loadedRows += state[stateKey].length;
    }

    if (!loadedRows) {
      await migrateLegacyCloudState(base);
    }

    saveLocalOnly();
    startFirebaseListeners();
  } catch (err) {
    console.warn('Firebase load failed', err);
    toast('Firebase sem permissões. A usar dados locais.');
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
  stopFirebaseListeners();
  if (!firebaseReady || !firebaseAuth?.currentUser || !firebaseDb) return;

  firebaseUnsubscribers.push(firebaseDb.collection(FIREBASE_META_COLLECTION).doc(FIREBASE_META_DOC).onSnapshot(doc => {
    if (!doc.exists || !doc.data()?.settings) return;
    state.settings = { ...state.settings, ...doc.data().settings, firebaseEnabled: true };
    saveLocalOnly();
    if (appIsVisible() && currentPage === 'config') renderPage(currentPage);
  }));

  Object.entries(FIREBASE_COLLECTIONS).forEach(([stateKey, collectionName]) => {
    const unsubscribe = firebaseDb.collection(collectionName).onSnapshot(snapshot => {
      state[stateKey] = snapshot.docs.map(doc => cleanFirebaseDoc({ id: doc.id, ...doc.data() }));
      saveLocalOnly();
      if (appIsVisible()) renderPage(currentPage);
    }, err => {
      console.warn(`Firebase listener failed for ${collectionName}`, err);
    });
    firebaseUnsubscribers.push(unsubscribe);
  });
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
function pageUrl(id){ return pageFiles[id] || 'index.html'; }
function goPage(id){ window.location.href = pageUrl(id); }
function canOpenPage(id){
  if(['dashboard','clientes','contactos','fornecedores','orcamentos'].includes(id)) return true;
  if(id === 'users') return hasPermission('manageUsers') || hasPermission('approveUsers');
  if(id === 'config') return hasPermission('manageSettings');
  return true;
}
function getDefaultPage(){
  if (window.DEFAULT_PAGE) return window.DEFAULT_PAGE;
  const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const found = Object.entries(pageFiles).find(([, f]) => f.toLowerCase() === file);
  return found ? found[0] : 'dashboard';
}
function showApp(){
  qs('#loginScreen').classList.add('hidden');
  qs('#appShell').classList.remove('hidden');
  buildNav();
  bindShell();
  qs('#userBadge').textContent = state.currentUser?.name || 'Admin';
  renderPage(currentPage);
}

async function init(){
  buildNav();
  bindShell();
  restoreLogin();
  await initFirebase();
  if (firebaseReady) {
    firebaseAuth.onAuthStateChanged(async user => {
      if (user) {
        await loadCloudState();
        if (pendingSignupUser && pendingSignupUser.email?.toLowerCase() === user.email?.toLowerCase()) {
          upsertAppUser({ ...pendingSignupUser, id:user.uid });
          pendingSignupUser = null;
          saveLocalOnly();
        }
        if(!userIsActive()) {
          toast('Conta pendente de aprovação pelo Admin Master.');
          qs('#appShell').classList.add('hidden');
          qs('#loginScreen').classList.remove('hidden');
          return;
        }
        showApp();
        toast('Firebase ligado.');
      } else {
        state.currentUser = null;
        saveLocalOnly();
        qs('#appShell').classList.add('hidden');
        qs('#loginScreen').classList.remove('hidden');
      }
    });
    return;
  }
  if(state.currentUser) showApp();
}

function restoreLogin(){
  const saved = localStorage.getItem('autoparts_login_email') || 'pica.fern@gmail.com';
  qs('#loginEmail').value = saved;
  qs('#loginPassword').value = '123456';
  enhanceLoginScreen();
  qs('#loginBtn').addEventListener('click', login);
  qs('#loginPassword').addEventListener('keydown', e => { if(e.key === 'Enter') login(); });
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

async function login(){
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPassword').value;
  if(!email) return toast('Mete o email para entrar.');
  if(qs('#rememberLogin').checked) localStorage.setItem('autoparts_login_email', email);
  if (firebaseReady) {
    if(!password) return toast('Mete a password para entrar no Firebase.');
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      return;
    } catch (err) {
      console.warn('Firebase login failed', err);
      return toast('Login falhou. Se ainda não tens conta, usa Criar conta.');
    }
  }
  state.currentUser = { email, name: email.split('@')[0] };
  saveState();
  showApp();
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
    pendingSignupUser = { nome, email, role:'Operador', status:'Pendente' };
    const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    await firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(credential.user.uid).set({
      id: credential.user.uid,
      nome,
      email,
      role:'Operador',
      status:'Pendente',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy:'signup-login'
    }, { merge:true });
    if(qs('#rememberLogin')?.checked) localStorage.setItem('autoparts_login_email', email);
    toast('Conta criada. Aguarda aprovação do Admin Master.');
  } catch (err) {
    pendingSignupUser = null;
    console.warn('Signup failed', err);
    if(err.code === 'auth/email-already-in-use') return toast('Este email já tem conta. Usa Entrar.');
    if(err.code === 'auth/operation-not-allowed') return toast('Ativa Email/Password no Firebase Auth.');
    return toast('Não foi possível criar conta. Confirma os dados.');
  }
}

function buildNav(){
  qs('#navMenu').innerHTML = pages.filter(p=>canOpenPage(p.id)).map(p => `<a class="nav-btn" href="${pageUrl(p.id)}" data-page="${p.id}"><span class="nav-icon">${p.icon}</span><span>${p.title}</span></a>`).join('');
}

function bindShell(){
  qs('#homeBtn').addEventListener('click',()=>goPage('dashboard'));
  qs('#logoutBtn').addEventListener('click',async ()=>{
    stopFirebaseListeners();
    if (firebaseReady && firebaseAuth?.currentUser) await firebaseAuth.signOut();
    state.currentUser = null; saveLocalOnly();
    qs('#appShell').classList.add('hidden');
    qs('#loginScreen').classList.remove('hidden');
  });
}

function renderPage(id){
  if(!canOpenPage(id)) {
    toast('Sem permissão para abrir esta página.');
    id = 'dashboard';
  }
  currentPage = id;
  const meta = pages.find(p=>p.id===id) || pages[0];
  qs('#pageTitle').textContent = meta.title;
  qs('#pageSubtitle').textContent = meta.subtitle;
  qsa('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
  const renderers = { dashboard, 'nova-chamada': novaChamada, pedidos, clientes, contactos, fornecedores, orcamentos, agenda, stock, relatorios, users, config };
  qs('#pageContent').innerHTML = renderers[id]();
  bindPage(id);
}

function dashboard(){
  const total = state.calls.length;
  const clientesCount = state.clients.length;
  const quotes = state.quotes.length;
  const fornecedoresCount = state.suppliers.length;
  const urgentes = state.calls.filter(c=>['Urgente','Muito urgente'].includes(c.urgencia) && !['Concluído','Perdido'].includes(c.estado)).length;
  const followHoje = state.followups.filter(f=>f.date===today() && f.status!=='Feito').length;
  const pendentes = state.users.filter(u=>u.status==='Pendente').length;
  const vendaPrevista = state.quotes.reduce((sum,q)=>sum+Number(q.total||0),0);
  const appCards = pages.filter(p => p.id !== 'dashboard' && canOpenPage(p.id)).map(p => `
    <button class="portal-card" data-page-card="${p.id}">
      <div class="portal-icon">${p.icon}</div>
      <strong>${esc(p.title)}</strong>
      <span>${esc(p.subtitle)}</span>
    </button>`).join('');

  return `
    <div class="portal-page">
      <div class="portal-top">
        <div class="portal-logo">
          <div class="portal-logo-mark">AP</div>
          <div>
            <h1>${esc(companyName())}</h1>
            <small>Callcenter de peças automóveis</small>
          </div>
        </div>
        <div class="portal-title">
          <h2>📊 Painel Central</h2>
          <p>Acede rapidamente aos módulos ativos da empresa</p>
        </div>
      </div>

      <div class="portal-kpis">
        <div><b>${clientesCount}</b><span>Clientes</span></div>
        <div><b>${fornecedoresCount}</b><span>Fornecedores</span></div>
        <div><b>${quotes}</b><span>Orçamentos</span></div>
        <div><b>${money(vendaPrevista)}</b><span>Venda prevista</span></div>
      </div>

      <div class="card dashboard-work">
        <div class="card-head"><h3>Operação de hoje</h3><span class="muted">${total} pedidos registados</span></div>
        <div class="quick-metrics">
          <button class="mini-metric" data-go="pedidos"><b>${urgentes}</b><span>Pedidos urgentes</span></button>
          <button class="mini-metric" data-go="agenda"><b>${followHoje}</b><span>Follow-ups hoje</span></button>
          <button class="mini-metric" data-go="orcamentos"><b>${quotes}</b><span>Orçamentos ativos</span></button>
          <button class="mini-metric" data-go="users"><b>${pendentes}</b><span>Contas pendentes</span></button>
        </div>
        <div class="toolbar one global-search-box"><input id="globalSearch" class="field" placeholder="Pesquisar cliente, telefone, matrícula, peça, orçamento ou contacto"></div>
        <div id="globalSearchResults">${globalSearchResults('')}</div>
      </div>

      <div class="portal-grid">
        ${appCards}
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
  return `<div class="grid two clients-page">
    <div class="card">
      <div class="card-head"><h3>Adicionar cliente</h3><span class="muted">O código fica antes do nome na ficha.</span></div>
      <form id="clientForm" class="form-grid">
        <input class="field" name="codigoCliente" placeholder="Código cliente" required>
        <input class="field span2" name="nome" placeholder="Nome do cliente" required>
        <input class="field" name="telefone" placeholder="Telefone">
        <input class="field" name="email" placeholder="Email">
        <textarea class="span3" name="notas" placeholder="Notas"></textarea>
        <div class="span3"><button class="btn primary" type="submit">Guardar cliente</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Lista de clientes</h3><span class="muted">${state.clients.length} registos</span></div>
      <div class="toolbar one"><input id="clientSearch" class="field" placeholder="Pesquisar por código, nome, telefone ou email"></div>
      <div id="clientsTable">${clientsTable(state.clients)}</div>
    </div>
  </div>`;
}
function fornecedores(){
  return `<div class="grid two suppliers-page">
    <div class="card">
      <div class="card-head"><h3>Adicionar fornecedor</h3><span class="muted">Apenas marca e código de ficha.</span></div>
      <form id="supplierForm" class="form-grid">
        <input class="field span2" name="nomeMarca" placeholder="Nome da marca" required>
        <input class="field" name="codigoFicha" placeholder="Código de ficha" required>
        <div class="span3"><button class="btn primary" type="submit">Guardar fornecedor</button></div>
      </form>
    </div>
    <div class="card supplier-list-card">
      <div class="card-head"><h3>Lista de fornecedores</h3><span class="muted">${state.suppliers.length} registos</span></div>
      <div class="toolbar one"><input id="supplierSearch" class="field" placeholder="Pesquisar por marca ou código de ficha"></div>
      <div id="suppliersTable">${suppliersTable(state.suppliers)}</div>
    </div>
  </div>`;
}
function contactos(){
  return `<div class="grid two contacts-page">
    <div class="card">
      <div class="card-head"><h3>Novo grupo</h3><span class="muted">Ex: Callcenter Lisboa</span></div>
      <form id="contactGroupForm" class="form-grid">
        <input class="field span3" name="nome" placeholder="Nome do grupo" required>
        <div class="span3"><button class="btn primary" type="submit">Criar grupo</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Diretório de contactos</h3><span class="muted">${contactCount()} contactos</span></div>
      <div class="toolbar one"><input id="contactSearch" class="field" placeholder="Pesquisar nome, telemóvel, telefone, email ou grupo"></div>
      <div id="contactsTable">${contactGroupsView(filterContactGroups())}</div>
    </div>
  </div>`;
}
function contactCount(){
  return (state.contactGroups || []).reduce((sum, group)=>sum + (group.contactos || []).length, 0);
}
function filterContactGroups(){
  const q = (qs('#contactSearch')?.value || '').toLowerCase();
  const groups = state.contactGroups || [];
  if(!q) return groups;
  return groups.map(group => {
    const groupMatch = (group.nome || '').toLowerCase().includes(q);
    const contactos = (group.contactos || []).filter(c => `${group.nome || ''} ${c.nome || ''} ${c.telemovel || ''} ${c.telefone || ''} ${c.email || ''}`.toLowerCase().includes(q));
    return groupMatch ? { ...group, aberto:true } : { ...group, aberto:true, contactos };
  }).filter(group => (group.contactos || []).length || (group.nome || '').toLowerCase().includes(q));
}
function contactGroupsView(groups){
  if(!groups.length) return '<div class="empty">Sem grupos ou contactos encontrados.</div>';
  return `<div class="directory-list">${groups.map(group => `
    <div class="directory-group">
      <button class="directory-toggle" data-toggle-contact-group="${group.id}">
        <strong>${esc(group.nome)}</strong>
        <span>${(group.contactos || []).length} contactos</span>
      </button>
      <div class="directory-body ${group.aberto ? '' : 'hidden'}">
        ${contactsTable(group)}
        <form class="form-grid contact-inline-form" data-contact-form="${group.id}">
          <input class="field" name="nome" placeholder="Nome" required>
          <input class="field" name="telemovel" placeholder="Telemóvel">
          <input class="field" name="telefone" placeholder="Telefone">
          <input class="field span2" name="email" type="email" placeholder="Email">
          <div class="actions"><button class="btn primary small" type="submit">Adicionar</button><button class="btn danger small" type="button" data-delete-contact-group="${group.id}">Apagar grupo</button></div>
        </form>
      </div>
    </div>`).join('')}</div>`;
}
function contactsTable(group){
  const rows = group.contactos || [];
  if(!rows.length) return '<div class="empty">Sem contactos neste grupo.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telemóvel</th><th>Telefone</th><th>Email</th><th>Ações</th></tr></thead><tbody>${rows.map(c=>`<tr><td><strong>${esc(c.nome || '-')}</strong></td><td>${esc(c.telemovel || '-')}</td><td>${esc(c.telefone || '-')}</td><td>${esc(c.email || '-')}</td><td><div class="actions">${c.telemovel ? `<a class="btn small" href="tel:${esc(c.telemovel)}">Telemóvel</a>` : ''}${c.telefone ? `<a class="btn small" href="tel:${esc(c.telefone)}">Telefone</a>` : ''}${c.email ? `<a class="btn small" href="mailto:${esc(c.email)}">Email</a>` : ''}<button class="btn danger small" data-delete-contact="${group.id}:${c.id}">Apagar</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
function clientCode(c){ return c.codigoCliente || c.codigo || c.tipo || ''; }
function filterClients(){
  const q = (qs('#clientSearch')?.value || '').toLowerCase();
  return state.clients.filter(c => `${clientCode(c)} ${c.nome || ''} ${c.telefone || ''} ${c.email || ''}`.toLowerCase().includes(q));
}
function clientsTable(rows){
  if(!rows.length) return '<div class="empty">Sem clientes registados.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Código cliente</th><th>Nome</th><th>Telefone</th><th>Email</th><th>Ações</th></tr></thead><tbody>${rows.map(c=>`<tr><td><span class="supplier-ref">${esc(clientCode(c) || '-')}</span></td><td><strong>${esc(c.nome || '')}</strong></td><td>${esc(c.telefone || '-')}</td><td>${esc(c.email || '-')}</td><td><div class="actions"><button class="btn small" data-client-detail="${c.id}">Ficha</button><button class="btn small" data-edit-entity="client:${c.id}">Editar</button>${canDelete()?`<button class="btn danger small" data-delete-entity="client:${c.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
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
      <h4>Histórico de pedidos</h4>
      ${callsTable(calls, false)}
      <h4>Orçamentos</h4>
      ${quotes.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Peça</th><th>Total</th><th>Estado</th></tr></thead><tbody>${quotes.map(q=>`<tr><td>${esc(q.id)}</td><td>${esc(q.peca || '-')}</td><td>${money(q.total)}</td><td>${badge(q.estado)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sem orçamentos para este cliente.</div>'}
      <h4>Notas</h4>
      <p class="muted">${esc(c.notas || 'Sem notas registadas.')}</p>
    </div>`);
}
function supplierName(s){ return s.nomeMarca || s.nomeFornecedor || s.nome || ''; }
function supplierRef(s){ return s.codigoFicha || s.numeroReferencia || s.referenciaFornecedor || s.referencia || ''; }
function filterSuppliers(){
  const q = (qs('#supplierSearch')?.value || '').toLowerCase();
  return state.suppliers.filter(s => `${supplierName(s)} ${supplierRef(s)}`.toLowerCase().includes(q));
}
function suppliersTable(rows){
  if(!rows.length) return '<div class="empty">Sem fornecedores registados.</div>';
  return `<div class="table-wrap"><table class="suppliers-table"><thead><tr><th>Nome da marca</th><th>Código de ficha</th><th>Ações</th></tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${esc(supplierName(s))}</strong></td><td><span class="supplier-ref">${esc(supplierRef(s) || '-')}</span></td><td><div class="actions"><button class="btn small" data-edit-entity="supplier:${s.id}">Editar</button>${canDelete()?`<button class="btn danger small" data-delete-entity="supplier:${s.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}
function stock(){
  return entityPage('Stock / Catálogo','stockForm',[
    ['referencia','Referência'],['nome','Nome da peça'],['marca','Marca'],['modelo','Modelo compatível'],['estado','Nova / Usada / Recondicionada'],['local','Localização'],['custo','Preço custo'],['venda','Preço venda'],['qtd','Quantidade']
  ], state.stock, ['referencia','nome','marca','modelo','estado','local','venda','qtd'], 'stock');
}
function users(){
  const isAdmin = isAdminMaster();
  return `<div class="grid two users-page">
    <div class="card">
      <div class="card-head"><h3>Criar conta</h3><span class="badge ${isAdmin?'green':'orange'}">${isAdmin?'Admin Master':'Sem permissão'}</span></div>
      ${isAdmin ? `<form id="createUserForm" class="form-grid">
        <input class="field" name="nome" placeholder="Nome" required>
        <input class="field" name="email" type="email" placeholder="Email" required>
        <input class="field" name="password" type="password" placeholder="Password inicial" required>
        <select class="select" name="role" required>
          <option>Operador</option>
          <option>Supervisor</option>
          <option>Admin</option>
          <option>Admin Master</option>
        </select>
        <select class="select" name="status"><option>Ativo</option><option>Pendente</option><option>Inativo</option></select>
        <div class="span3"><button class="btn primary" type="submit">Criar conta</button></div>
      </form>` : '<div class="empty">Só o Admin Master pode criar contas e escolher roles.</div>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>Utilizadores</h3><span class="muted">${state.users.length} registos</span></div>
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
  if(isAdminMasterEmail() && !user) return true;
  return user?.status === 'Ativo';
}
function canEditOperational(){ return hasPermission('editAll') || hasPermission('createOperational'); }
function canDelete(){ return hasPermission('deleteAll'); }
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
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}<td><div class="actions"><button class="btn small" data-edit-entity="${type}:${r.id}">Editar</button>${canDelete()?`<button class="btn danger small" data-delete-entity="${type}:${r.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function orcamentos(){
  const clientOptions = state.clients.map(c=>`<option value="${esc(c.nome)}" data-email="${esc(c.email || '')}" data-phone="${esc(c.telefone || '')}" data-code="${esc(clientCode(c))}">${esc(clientCode(c) ? `${clientCode(c)} - ${c.nome}` : c.nome)}</option>`).join('');
  return `<div class="grid two quotes-page">
    <div class="card">
      <div class="card-head"><h3>Criar orçamento</h3><span class="muted">Depois podes gerar PDF e email.</span></div>
      <form id="quoteForm" class="form-grid">
        <select class="select span2" name="cliente" id="quoteClientSelect" required>
          <option value="">Selecionar cliente</option>${clientOptions}
        </select>
        <input class="field" name="codigoCliente" placeholder="Código cliente">
        <input class="field" name="telefone" placeholder="Telefone">
        <input class="field span2" name="email" placeholder="Email do cliente">
        <input class="field" name="viatura" placeholder="Viatura / matrícula">
        <input class="field span2" name="peca" placeholder="Peça / serviço" required>
        <input class="field" name="referencia" placeholder="Referência">
        <input class="field" name="quantidade" type="number" min="1" value="1" placeholder="Qtd">
        <input class="field" name="precoUnitario" type="number" min="0" step="0.01" placeholder="Preço unitário" required>
        <select class="select" name="estado"><option>Rascunho</option><option>Enviado</option><option>Aceite</option><option>Recusado</option></select>
        <input class="field" name="validade" type="date" value="${today()}">
        <input class="field span2" name="prazoEntrega" placeholder="Prazo de entrega">
        <input class="field span3" name="condicoes" placeholder="Condições comerciais" value="Preços sujeitos a disponibilidade da peça no momento da confirmação.">
        <textarea class="span3" name="observacoes" placeholder="Notas para o orçamento"></textarea>
        <div class="span3"><button class="btn primary" type="submit">Criar orçamento</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orçamentos</h3><span class="muted">${state.quotes.length} registos</span></div>
      ${state.quotes.length ? quotesTable() : '<div class="empty">Ainda não existem orçamentos.</div>'}
    </div>
  </div>`;
}
function quotesTable(){ return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Peça</th><th>Total</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${state.quotes.map(q=>`<tr><td>${esc(q.id)}</td><td><strong>${esc(q.cliente)}</strong><br><span class="muted">${esc(q.email || '')}</span></td><td>${esc(q.peca)}<br><span class="muted">${esc(q.referencia || '')}</span></td><td>${money(q.total)}</td><td>${badge(q.estado)}</td><td><div class="actions"><button class="btn small" data-print-quote="${q.id}">PDF</button><button class="btn success small" data-email-quote="${q.id}">Email</button><button class="btn success small" data-quote-status="${q.id}:Aceite">Aceite</button><button class="btn warn small" data-quote-status="${q.id}:Recusado">Recusado</button>${canDelete()?`<button class="btn danger small" data-delete-quote="${q.id}">Apagar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`; }

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
function config(){
  return `<div class="grid two"><div class="card"><div class="card-head"><h3>Configurações da app</h3><span class="badge blue">v${APP_VERSION}</span></div><form id="settingsForm" class="form-grid"><input class="field span2" name="companyName" placeholder="Nome da empresa" value="${esc(state.settings.companyName)}"><input class="field" name="companyNif" placeholder="NIF" value="${esc(state.settings.companyNif || '')}"><input class="field span3" name="companyAddress" placeholder="Morada" value="${esc(state.settings.companyAddress || '')}"><input class="field" name="companyPhone" placeholder="Telefone empresa" value="${esc(state.settings.companyPhone || '')}"><input class="field" name="companyEmail" placeholder="Email empresa" value="${esc(state.settings.companyEmail || '')}"><input class="field" name="dailyBackupHour" type="time" value="${esc(state.settings.dailyBackupHour)}"><input class="field span3" name="githubUrl" placeholder="URL GitHub Pages" value="${esc(state.settings.githubUrl)}"><div class="span3"><button class="btn primary">Guardar configurações</button></div></form></div><div class="card"><div class="card-head"><h3>Firebase</h3><span class="badge ${firebaseReady?'green':'orange'}">${esc(firebaseStatus())}</span></div><p class="muted">Dados separados no Firestore por página: clientes, fornecedores, orçamentos, pedidos, agenda, stock, utilizadores, diretório de contactos e configurações.</p><div class="actions"><button class="btn" id="syncFirebaseBtn">Sincronizar agora</button><button class="btn" id="exportJsonBtn">Exportar JSON</button><button class="btn warn" id="resetDemoBtn">Reset demo</button></div></div></div>`;
}

function bindPage(id){
  qsa('[data-go]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.go)));
  qsa('[data-page-card]').forEach(b=>b.addEventListener('click',()=>goPage(b.dataset.pageCard)));
  qsa('[data-client-detail]').forEach(b=>b.addEventListener('click',()=>openClientDetail(b.dataset.clientDetail)));
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
  if(id==='config') bindConfig();
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
function bindContactDirectory(){
  const groupForm = qs('#contactGroupForm');
  if(groupForm) groupForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    const data = Object.fromEntries(new FormData(e.target).entries());
    state.contactGroups = state.contactGroups || [];
    state.contactGroups.push({ id:uid('DIR'), nome:data.nome, aberto:true, contactos:[] });
    saveState(); renderPage('contactos'); toast('Grupo criado.');
  });
  qsa('[data-toggle-contact-group]').forEach(btn=>btn.addEventListener('click',()=>{
    const group = (state.contactGroups || []).find(g=>g.id===btn.dataset.toggleContactGroup);
    if(!group) return;
    group.aberto = !group.aberto;
    saveState(); renderPage('contactos');
  }));
  qsa('[data-contact-form]').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!canEditOperational()) return toast('Sem permissão para alterar contactos.');
    const group = (state.contactGroups || []).find(g=>g.id===form.dataset.contactForm);
    if(!group) return;
    const data = Object.fromEntries(new FormData(e.target).entries());
    group.contactos = group.contactos || [];
    group.contactos.push({ id:uid('CNT'), ...data });
    group.aberto = true;
    saveState(); renderPage('contactos'); toast('Contacto adicionado.');
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
    saveState(); renderPage('contactos'); toast('Grupo apagado.');
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
    const user = { id: uid('USR'), nome:data.nome, email:data.email, role:data.role, status:data.status || 'Ativo' };
    try {
      const created = await createFirebaseUserAsAdmin(data.email, data.password);
      if(created?.uid) user.id = created.uid;
      upsertAppUser(user);
      saveState(); renderPage('users'); toast('Conta criada com sucesso.');
    } catch (err) {
      console.warn('Create user failed', err);
      if(err.code === 'auth/email-already-in-use') {
        upsertAppUser(user);
        saveState(); renderPage('users'); toast('Email já existia. Role atualizado na app.');
      } else {
        toast('Não foi possível criar a conta. Confirma Firebase Auth.');
      }
    }
  });
}
async function createFirebaseUserAsAdmin(email, password){
  if(!firebaseReady || !firebase.auth) return null;
  const appName = `create-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const secondaryApp = firebase.initializeApp(firebaseConfig, appName);
  try {
    const credential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
    await secondaryApp.auth().signOut();
    return credential.user;
  } finally {
    await secondaryApp.delete();
  }
}
function upsertAppUser(user){
  state.users = state.users || [];
  delete user.password;
  const index = state.users.findIndex(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase() || u.id === user.id);
  if(index >= 0) state.users[index] = { ...state.users[index], ...user };
  else state.users.push(user);
}
function bindEntities(){
  const map = { client:[state.clients,'clients'], supplier:[state.suppliers,'suppliers'], stock:[state.stock,'stock'], user:[state.users,'users'], follow:[state.followups,'followups'] };
  qsa('[data-delete-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.deleteEntity.split(':'); if(!canDelete()) return toast('Sem permissão para apagar.'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); const target=map[type]; state[target[1]] = target[0].filter(x=>x.id!==id); saveState(); renderPage(currentPage); toast('Registo apagado.'); }));
  qsa('[data-edit-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.editEntity.split(':'); if(type==='user' && !isAdminMaster()) return toast('Só o Admin Master pode alterar utilizadores.'); openEntityModal(type,id); }));
  const forms = [{id:'clientForm',key:'clients',prefix:'CLI'},{id:'supplierForm',key:'suppliers',prefix:'FOR'},{id:'stockForm',key:'stock',prefix:'STK'},{id:'userForm',key:'users',prefix:'USR'}];
  forms.forEach(f=>{ const form=qs('#'+f.id); if(form) form.addEventListener('submit',e=>{ e.preventDefault(); if(f.key==='users' && !hasPermission('manageUsers')) return toast('Sem permissão para gerir utilizadores.'); if(f.key!=='users' && !canEditOperational()) return toast('Sem permissão para guardar.'); state[f.key].push({id:uid(f.prefix),...Object.fromEntries(new FormData(e.target).entries())}); saveState(); renderPage(currentPage); toast('Registo guardado.'); }); });
}
function openEntityModal(type,id){
  const map = { client:['clients','CLI'], supplier:['suppliers','FOR'], stock:['stock','STK'], user:['users','USR'], follow:['followups','AGE'] };
  const [key] = map[type]; const item = state[key].find(x=>x.id===id); if(!item) return;
  const fields = Object.keys(item).filter(k=>k!=='id');
  openModal('Editar registo', `<form id="entityEditForm" class="form-grid">${fields.map(k=>`<input class="field" name="${k}" placeholder="${k}" value="${esc(item[k])}">`).join('')}<div class="span3"><button class="btn primary">Guardar</button></div></form>`);
  qs('#entityEditForm').addEventListener('submit',e=>{e.preventDefault(); Object.assign(item,Object.fromEntries(new FormData(e.target).entries())); saveState(); closeModal(); renderPage(currentPage); toast('Registo atualizado.');});
}
function bindFollowForm(){
  qs('#followForm').addEventListener('submit',e=>{ e.preventDefault(); state.followups.push({id:uid('AGE'),...Object.fromEntries(new FormData(e.target).entries())}); saveState(); renderPage('agenda'); toast('Follow-up guardado.'); });
}
function bindConfig(){
  qs('#settingsForm').addEventListener('submit',e=>{ e.preventDefault(); const fd=new FormData(e.target); state.settings={ companyName:fd.get('companyName'), companyNif:fd.get('companyNif'), companyAddress:fd.get('companyAddress'), companyPhone:fd.get('companyPhone'), companyEmail:fd.get('companyEmail'), dailyBackupHour:fd.get('dailyBackupHour'), githubUrl:fd.get('githubUrl'), firebaseEnabled:firebaseReady}; saveState(); toast('Configurações guardadas.'); renderPage('config'); });
  qs('#syncFirebaseBtn').addEventListener('click',async()=>{ await pushCloudState(); toast(firebaseReady ? 'Sincronizado com Firebase.' : 'Firebase indisponível.'); renderPage('config'); });
  qs('#exportJsonBtn').addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='autoparts-callcenter-export.json'; a.click(); URL.revokeObjectURL(a.href); });
  qs('#resetDemoBtn').addEventListener('click',()=>{ const currentUser = state.currentUser; localStorage.removeItem(STORAGE_KEY); state=seedData(); state.currentUser=currentUser; saveState(); toast('Demo reposta.'); setTimeout(()=>goPage('dashboard'), 250); });
}
function openModal(title, html){ qs('#modalRoot').innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="btn danger-soft small" id="closeModalBtn">Fechar</button></div>${html}</div>`; qs('#modalRoot').classList.remove('hidden'); qs('#closeModalBtn').addEventListener('click',closeModal); }
function closeModal(){ qs('#modalRoot').classList.add('hidden'); qs('#modalRoot').innerHTML=''; }

document.addEventListener('DOMContentLoaded', init);
