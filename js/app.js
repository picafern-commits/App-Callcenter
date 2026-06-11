const APP_VERSION = '2.5.0';
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
let firebaseLoadedKeys = new Set();
const CONFIG_OPEN_KEY = 'bragalis_config_open_sections_v1';
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
  arrow: svgIcon('M5 12h14M12 5l7 7-7 7')
};

const pages = [
  { id: 'dashboard', icon: ICONS.dashboard, title: 'Dashboard', short: 'Portal', subtitle: 'Painel principal da operação' },
  { id: 'clientes', icon: ICONS.clientes, title: 'Clientes', short: 'Clientes', subtitle: 'Fichas, histórico e contactos' },
  { id: 'contactos', icon: ICONS.contactos, title: 'Diretório de contactos', short: 'Diretório', subtitle: 'Pesquisa rápida de clientes e fornecedores' },
  { id: 'fornecedores', icon: ICONS.fornecedores, title: 'Fornecedores', short: 'Fornecedores', subtitle: 'Lista de fornecedores e referências' },
  { id: 'rotas', icon: ICONS.rotas, title: 'Rotas', short: 'Rotas', subtitle: 'Registo de viaturas, serviços, cargas e quilómetros' },
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
  rotas: 'rotas.html',
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
    vehicles: [{"id":"VEI-001","viatura":"Toyota Prius","matricula":"05-QR-43","marca":"Toyota","modelo":"Prius","observacoes":""},{"id":"VEI-002","viatura":"Mitsubishi canter","matricula":"27-OG-41","marca":"Mitsubishi","modelo":"Canter","observacoes":""},{"id":"VEI-003","viatura":"Fiat Doblo","matricula":"52-PM-78","marca":"Fiat","modelo":"Doblo","observacoes":""}],
    routes: [{"id":"ROT-0001","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-03","pedidoPor":"André Veloso","destino":"Segurança Social","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":287999,"horaInicio":"14:45","kmFim":288010,"horaFim":"16:38","observacoes":"","kmPercorridos":11},{"id":"ROT-0002","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-04","pedidoPor":"Joao Silva","destino":"Soarauto","periodo":"Tarde","carga":"2 paletes","condutor":"Simba","kmInicio":169176,"horaInicio":"15:00","kmFim":169190,"horaFim":"15:25","observacoes":"","kmPercorridos":14},{"id":"ROT-0003","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-04","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"André Costa","kmInicio":288010,"horaInicio":"15:13","kmFim":288011,"horaFim":"15:36","observacoes":"","kmPercorridos":1},{"id":"ROT-0004","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-05","pedidoPor":"Joao Silva","destino":"Barcelpeças Barcelos","periodo":"Manha","carga":"Levantar palete","condutor":"Simba","kmInicio":169190,"horaInicio":"09:45","kmFim":169242,"horaFim":"11:00","observacoes":"","kmPercorridos":52},{"id":"ROT-0005","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288011,"horaInicio":"10:08","kmFim":288023,"horaFim":"11:10","observacoes":"","kmPercorridos":12},{"id":"ROT-0006","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-05","pedidoPor":"Claudia","destino":"Gabinete de Contabilidade","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":153782,"horaInicio":"16:04","kmFim":153791,"horaFim":"16:41","observacoes":"","kmPercorridos":9},{"id":"ROT-0007","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-06","pedidoPor":"André Veloso","destino":"Boleia Abel","periodo":"M","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288023,"horaInicio":"10:35","kmFim":288028,"horaFim":"10:42","observacoes":"","kmPercorridos":5},{"id":"ROT-0008","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-06","pedidoPor":"Claudia","destino":"Compras","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":153791,"horaInicio":"15:23","kmFim":153795,"horaFim":"15:45","observacoes":"","kmPercorridos":4},{"id":"ROT-0009","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-06","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Leo","kmInicio":153795,"horaInicio":"15:45","kmFim":153796,"horaFim":"15:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0010","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288028,"horaInicio":"11:15","kmFim":288039,"horaFim":"12:10","observacoes":"","kmPercorridos":11},{"id":"ROT-0011","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-07","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"4 paletes","condutor":"Fabio Vaz","kmInicio":169242,"horaInicio":"14:36","kmFim":169243,"horaFim":"15:24","observacoes":"","kmPercorridos":1},{"id":"ROT-0012","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288039,"horaInicio":"11:13","kmFim":288049,"horaFim":"12:10","observacoes":"","kmPercorridos":10},{"id":"ROT-0013","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-10","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Fabio Vaz","kmInicio":153796,"horaInicio":"14:43","kmFim":153796,"horaFim":"15:00","observacoes":"","kmPercorridos":0},{"id":"ROT-0014","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-10","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"André Costa","kmInicio":169243,"horaInicio":"14:43","kmFim":169355,"horaFim":"16:21","observacoes":"","kmPercorridos":112},{"id":"ROT-0015","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-11","pedidoPor":"Simba","destino":"levantar enc.na Volvo","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":153796,"horaInicio":"09:48","kmFim":153797,"horaFim":"09:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0016","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288049,"horaInicio":"11:25","kmFim":288057,"horaFim":"11:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0017","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-12","pedidoPor":"Carlos Avelino","destino":"Invospeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":169243,"horaInicio":"09:30","kmFim":169469,"horaFim":"11:25","observacoes":"","kmPercorridos":226},{"id":"ROT-0018","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-12","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"André Costa","kmInicio":169469,"horaInicio":"14:35","kmFim":169580,"horaFim":"16:20","observacoes":"","kmPercorridos":111},{"id":"ROT-0019","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-12","pedidoPor":"Rui","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Rui","kmInicio":153797,"horaInicio":"14:40","kmFim":153797,"horaFim":"14:50","observacoes":"","kmPercorridos":0},{"id":"ROT-0020","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-12","pedidoPor":"Lucinda","destino":"Advogada","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288057,"horaInicio":"15:30","kmFim":288065,"horaFim":"18:20","observacoes":"","kmPercorridos":8},{"id":"ROT-0021","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"André Costa","kmInicio":169580,"horaInicio":"09:45","kmFim":169581,"horaFim":"10:06","observacoes":"","kmPercorridos":1},{"id":"ROT-0022","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Claudia","destino":"Estação cp","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288065,"horaInicio":"10:18","kmFim":288072,"horaFim":"10:45","observacoes":"","kmPercorridos":7},{"id":"ROT-0023","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Elisabete","destino":"almoço Draª Rita Palma","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288072,"horaInicio":"12:36","kmFim":288073,"horaFim":"14:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0024","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Cunha","kmInicio":153797,"horaInicio":"14:35","kmFim":153798,"horaFim":"14:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0025","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Elisabete","destino":"Estação CP","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288073,"horaInicio":"17:38","kmFim":288080,"horaFim":"18:15","observacoes":"","kmPercorridos":7},{"id":"ROT-0026","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288080,"horaInicio":"11:57","kmFim":288091,"horaFim":"13:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0027","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-14","pedidoPor":"Joao Silva","destino":"Mecanico","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":288091,"horaInicio":"15:04","kmFim":288095,"horaFim":"15:38","observacoes":"","kmPercorridos":4},{"id":"ROT-0028","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-14","pedidoPor":"Simba","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Simba","kmInicio":153798,"horaInicio":"16:00","kmFim":153880,"horaFim":"17:55","observacoes":"","kmPercorridos":82},{"id":"ROT-0029","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-17","pedidoPor":"Joao Silva","destino":"My Force","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":288095,"horaInicio":"10:50","kmFim":288112,"horaFim":"11;15:00","observacoes":"","kmPercorridos":17},{"id":"ROT-0030","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-17","pedidoPor":"Joao Silva","destino":"Barcelpeças Barcelos","periodo":"Tarde","carga":"1 palete","condutor":"Simba","kmInicio":154073,"horaInicio":"15:20","kmFim":154127,"horaFim":"16:28","observacoes":"","kmPercorridos":54},{"id":"ROT-0031","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-18","pedidoPor":"Joao Silva","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Zezito","kmInicio":169581,"horaInicio":"09:45","kmFim":169654,"horaFim":"11:15","observacoes":"","kmPercorridos":73},{"id":"ROT-0032","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288112,"horaInicio":"10:28","kmFim":288123,"horaFim":"11:15","observacoes":"","kmPercorridos":11},{"id":"ROT-0033","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-19","pedidoPor":"Avelino","destino":"Soarauto","periodo":"Tarde","carga":"5 paletes","condutor":"Micael","kmInicio":169654,"horaInicio":"14:39","kmFim":169655,"horaFim":"15:25","observacoes":"","kmPercorridos":1},{"id":"ROT-0034","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288123,"horaInicio":"14:00","kmFim":288132,"horaFim":"14:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0035","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288132,"horaInicio":"10:50","kmFim":288141,"horaFim":"12:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0036","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-20","pedidoPor":"Machado","destino":"Sucata","periodo":"Tarde","carga":"2 paletes","condutor":"Cunha","kmInicio":169655,"horaInicio":"15:00","kmFim":169675,"horaFim":"16:03","observacoes":"","kmPercorridos":20},{"id":"ROT-0037","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-21","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"5 paletes","condutor":"Leo","kmInicio":169675,"horaInicio":"09:45","kmFim":169789,"horaFim":"11:50","observacoes":"","kmPercorridos":114},{"id":"ROT-0038","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288141,"horaInicio":"11:30","kmFim":288151,"horaFim":"12:05","observacoes":"","kmPercorridos":10},{"id":"ROT-0039","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"Serviço externo","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288151,"horaInicio":"10:45","kmFim":288167,"horaFim":"11:20","observacoes":"","kmPercorridos":16},{"id":"ROT-0040","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"M","carga":"sem carga","condutor":"André Veloso","kmInicio":288167,"horaInicio":"12:45","kmFim":288187,"horaFim":"14:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0041","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154156,"horaInicio":"11:56","kmFim":154165,"horaFim":"12:33","observacoes":"","kmPercorridos":9},{"id":"ROT-0042","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"Trabalho / Casa","periodo":"Tarde","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288187,"horaInicio":"19:10","kmFim":288218,"horaFim":"07:55","observacoes":"","kmPercorridos":31},{"id":"ROT-0043","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-25","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288218,"horaInicio":"11:17","kmFim":288228,"horaFim":"11:53","observacoes":"","kmPercorridos":10},{"id":"ROT-0044","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-25","pedidoPor":"André Veloso","destino":"Trabalho / Casa","periodo":"Tarde","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288228,"horaInicio":"19:15","kmFim":288257,"horaFim":"07:55","observacoes":"","kmPercorridos":29},{"id":"ROT-0045","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288257,"horaInicio":"12:02","kmFim":288272,"horaFim":"12:47","observacoes":"","kmPercorridos":15},{"id":"ROT-0046","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-26","pedidoPor":"Joao Silva","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":288272,"horaInicio":"19:00","kmFim":288425,"horaFim":"12:44","observacoes":"","kmPercorridos":153},{"id":"ROT-0047","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-27","pedidoPor":"Simba","destino":"pichelaria palmeira","periodo":"Tarde","carga":"sem carga","condutor":"Simba","kmInicio":154165,"horaInicio":"15:26","kmFim":154173,"horaFim":"15:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0048","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154173,"horaInicio":"10:49","kmFim":154183,"horaFim":"11:41","observacoes":"","kmPercorridos":10},{"id":"ROT-0049","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-28","pedidoPor":"AVelino","destino":"Soarauto","periodo":"Tarde","carga":"6 paletes","condutor":"Teles","kmInicio":169789,"horaInicio":"16:00","kmFim":169790,"horaFim":"16:47","observacoes":"","kmPercorridos":1},{"id":"ROT-0050","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-28","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"Tarde","carga":"Sem carga","condutor":"Claudia","kmInicio":288425,"horaInicio":"16:40","kmFim":288434,"horaFim":"17:12","observacoes":"","kmPercorridos":9},{"id":"ROT-0051","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288434,"horaInicio":"11:12","kmFim":288446,"horaFim":"11:48","observacoes":"","kmPercorridos":12},{"id":"ROT-0052","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288446,"horaInicio":"10:39","kmFim":288455,"horaFim":"11:23","observacoes":"","kmPercorridos":9},{"id":"ROT-0053","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-05","pedidoPor":"Avelino","destino":"Barcelpeças/Trapotop","periodo":"Tarde","carga":"6 paletes","condutor":"Costa","kmInicio":169790,"horaInicio":"14:35","kmFim":169899,"horaFim":"17:03","observacoes":"","kmPercorridos":109},{"id":"ROT-0054","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"Machado","destino":"Correios / Agarb","periodo":"Tarde","carga":"sem carga","condutor":"Zezito","kmInicio":288455,"horaInicio":"15:24","kmFim":288456,"horaFim":"16:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0055","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":288456,"horaInicio":"16:59","kmFim":288464,"horaFim":"17:37","observacoes":"","kmPercorridos":8},{"id":"ROT-0056","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154183,"horaInicio":"09:05","kmFim":154192,"horaFim":"09:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0057","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Claudia","destino":"Estação CP","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288464,"horaInicio":"10:20","kmFim":288470,"horaFim":"10:45","observacoes":"","kmPercorridos":6},{"id":"ROT-0058","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Elisabete","destino":"almoço Draª Rita","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288470,"horaInicio":"12:40","kmFim":288471,"horaFim":"14:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0059","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-06","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"Tarde","carga":"2 paletes","condutor":"Andre´Costa","kmInicio":169899,"horaInicio":"14:40","kmFim":169951,"horaFim":"15:47","observacoes":"","kmPercorridos":52},{"id":"ROT-0060","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Rafael Cunha","kmInicio":288471,"horaInicio":"15:12","kmFim":288472,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0061","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Tiago","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Fabio Vaz","kmInicio":154192,"horaInicio":"13:15","kmFim":154283,"horaFim":"15:17","observacoes":"","kmPercorridos":91},{"id":"ROT-0062","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Tiago","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Simba","kmInicio":154283,"horaInicio":"16:00","kmFim":154370,"horaFim":"17:55","observacoes":"","kmPercorridos":87},{"id":"ROT-0063","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Elisabete","destino":"Estação CP","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288472,"horaInicio":"17:38","kmFim":288478,"horaFim":"18:00","observacoes":"","kmPercorridos":6},{"id":"ROT-0064","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":288478,"horaInicio":"09:25","kmFim":288482,"horaFim":"09:41","observacoes":"","kmPercorridos":4},{"id":"ROT-0065","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-07","pedidoPor":"Tiago","destino":"Volta Amares Vila Verde","periodo":"M","carga":"Varios Volumes","condutor":"Micael","kmInicio":154370,"horaInicio":"10:30","kmFim":154497,"horaFim":"11:43","observacoes":"","kmPercorridos":127},{"id":"ROT-0066","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"Sem carga","condutor":"Elisabete","kmInicio":288482,"horaInicio":"10:56","kmFim":288491,"horaFim":"11:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0067","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"André Veloso","destino":"Serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":288491,"horaInicio":"15:05","kmFim":288531,"horaFim":"17:00","observacoes":"","kmPercorridos":40},{"id":"ROT-0068","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288531,"horaInicio":"11:30","kmFim":288540,"horaFim":"12:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0069","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-08","pedidoPor":"André Veloso","destino":"Gaiafor","periodo":"M","carga":"Paletes","condutor":"Rafael Cunha","kmInicio":169951,"horaInicio":"09:00","kmFim":170086,"horaFim":"11:00","observacoes":"","kmPercorridos":135},{"id":"ROT-0070","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-10","pedidoPor":"Avelino","destino":"Trapotop","periodo":"Tarde","carga":"2 paletes","condutor":"Fabio","kmInicio":170086,"horaInicio":"14:40","kmFim":170159,"horaFim":"16:18","observacoes":"","kmPercorridos":73},{"id":"ROT-0071","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-10","pedidoPor":"Machado","destino":"CTT","periodo":"M","carga":"um volume","condutor":"André Costa","kmInicio":288540,"horaInicio":"15:16","kmFim":288541,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0072","viatura":"Toyota Prius","matricula":"05-QR-43","data":"11-12 /03/2025","pedidoPor":"Jose Luis","destino":"Reparaçao carro habitual","periodo":"M/T","carga":"sem carga","condutor":"Jose Luis","kmInicio":288541,"horaInicio":"16:24","kmFim":289219,"horaFim":"16:30","observacoes":"","kmPercorridos":678},{"id":"ROT-0073","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-11","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":154497,"horaInicio":"14:45","kmFim":154505,"horaFim":"15:17","observacoes":"","kmPercorridos":8},{"id":"ROT-0074","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"Tarde","carga":"6 Paletes","condutor":"Cunha","kmInicio":170159,"horaInicio":"16:20","kmFim":170159,"horaFim":"16:51","observacoes":"","kmPercorridos":0},{"id":"ROT-0075","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-12","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Cunha","kmInicio":154505,"horaInicio":"15:20","kmFim":154506,"horaFim":"15:28","observacoes":"","kmPercorridos":1},{"id":"ROT-0076","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-13","pedidoPor":"Machado","destino":"Reivax","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":289219,"horaInicio":"09:35","kmFim":289230,"horaFim":"10:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0077","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-13","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289230,"horaInicio":"11:15","kmFim":289240,"horaFim":"11:54","observacoes":"","kmPercorridos":10},{"id":"ROT-0078","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Mario","kmInicio":154506,"horaInicio":"14:45","kmFim":154507,"horaFim":"15:14","observacoes":"","kmPercorridos":1},{"id":"ROT-0079","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289240,"horaInicio":"09:30","kmFim":289244,"horaFim":"09:45","observacoes":"","kmPercorridos":4},{"id":"ROT-0080","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Machado","destino":"P.S.P","periodo":"M","carga":"1 bateria","condutor":"Rui","kmInicio":289244,"horaInicio":"09:56","kmFim":289253,"horaFim":"10:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0081","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289253,"horaInicio":"11:44","kmFim":289261,"horaFim":"12:43","observacoes":"","kmPercorridos":8},{"id":"ROT-0082","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-14","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 Paletes","condutor":"Simba","kmInicio":170159,"horaInicio":"10:00","kmFim":170275,"horaFim":"12:25","observacoes":"","kmPercorridos":116},{"id":"ROT-0083","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-14","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 Paletes","condutor":"Fabio SIlva","kmInicio":170275,"horaInicio":"14:40","kmFim":170387,"horaFim":"15:56","observacoes":"","kmPercorridos":112},{"id":"ROT-0084","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-15","pedidoPor":"Joao Silva","destino":"Inovpeças Lousada","periodo":"M","carga":"5 Paletes","condutor":"Leo","kmInicio":170387,"horaInicio":"09:00","kmFim":170499,"horaFim":"12:00","observacoes":"","kmPercorridos":112},{"id":"ROT-0085","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289261,"horaInicio":"09:45","kmFim":289265,"horaFim":"10:00","observacoes":"","kmPercorridos":4},{"id":"ROT-0086","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289265,"horaInicio":"11:59","kmFim":289276,"horaFim":"12:45","observacoes":"","kmPercorridos":11},{"id":"ROT-0087","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Elisabete","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":289276,"horaInicio":"14:52","kmFim":289277,"horaFim":"15:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0088","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Tiago","kmInicio":289277,"horaInicio":"17:35","kmFim":289281,"horaFim":"17:54","observacoes":"","kmPercorridos":4},{"id":"ROT-0089","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289281,"horaInicio":"10:44","kmFim":289291,"horaFim":"11:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0090","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-19","pedidoPor":"Tiago","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289291,"horaInicio":"12:00","kmFim":289301,"horaFim":"12:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0091","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-20","pedidoPor":"Joao silva","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":289301,"horaInicio":"10:27","kmFim":289309,"horaFim":"10:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0092","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-21","pedidoPor":"Miga","destino":"Gaiafor","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":170499,"horaInicio":"09:32","kmFim":170636,"horaFim":"12:15","observacoes":"","kmPercorridos":137},{"id":"ROT-0093","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289309,"horaInicio":"11:54","kmFim":289322,"horaFim":"13:19","observacoes":"","kmPercorridos":13},{"id":"ROT-0094","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-21","pedidoPor":"Miga","destino":"Gaiafor VNG","periodo":"Tarde","carga":"4 paletes","condutor":"Teles","kmInicio":170636,"horaInicio":"14:28","kmFim":170776,"horaFim":"17:24","observacoes":"","kmPercorridos":140},{"id":"ROT-0095","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-26","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":289360,"horaInicio":"16:45","kmFim":289390,"horaFim":"17:29","observacoes":"","kmPercorridos":30},{"id":"ROT-0096","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-26","pedidoPor":"Joao Silva","destino":"levar o Cesar","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":154507,"horaInicio":"17:18","kmFim":155118,"horaFim":"18:00","observacoes":"","kmPercorridos":611},{"id":"ROT-0097","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-27","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"1 palete","condutor":"Zezito","kmInicio":155118,"horaInicio":"11:14","kmFim":155142,"horaFim":"11:57","observacoes":"","kmPercorridos":24},{"id":"ROT-0098","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-28","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Leo","kmInicio":155142,"horaInicio":"09:35","kmFim":155142,"horaFim":"09:48","observacoes":"","kmPercorridos":0},{"id":"ROT-0099","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289390,"horaInicio":"12:00","kmFim":289403,"horaFim":"12:40","observacoes":"","kmPercorridos":13},{"id":"ROT-0100","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-28","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"4 paletes","condutor":"Ruben","kmInicio":170854,"horaInicio":"14:35","kmFim":170855,"horaFim":"15:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0101","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-31","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":170855,"horaInicio":"09:35","kmFim":170971,"horaFim":"11:40","observacoes":"","kmPercorridos":116},{"id":"ROT-0102","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-31","pedidoPor":"Joao Silva","destino":"buscar Cesar","periodo":"M","carga":"sem carga","condutor":"Joao silva","kmInicio":289403,"horaInicio":"10:51","kmFim":289410,"horaFim":"11:09","observacoes":"","kmPercorridos":7},{"id":"ROT-0103","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-31","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289410,"horaInicio":"11:44","kmFim":289420,"horaFim":"12:22","observacoes":"","kmPercorridos":10},{"id":"ROT-0104","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-31","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"Teles","kmInicio":170971,"horaInicio":"14:33","kmFim":171082,"horaFim":"16:46","observacoes":"","kmPercorridos":111},{"id":"ROT-0105","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-31","pedidoPor":"Machado","destino":"Trabalho - Casa","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":155142,"horaInicio":"13:00","kmFim":155150,"horaFim":"14:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0106","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-01","pedidoPor":"Machado","destino":"Pichelaria-Palmeira","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":155150,"horaInicio":"09:35","kmFim":155160,"horaFim":"10:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0107","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-01","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"Tarde","carga":"4 paletes","condutor":"Teles","kmInicio":171082,"horaInicio":"14:39","kmFim":171137,"horaFim":"16:01","observacoes":"","kmPercorridos":55},{"id":"ROT-0108","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-01","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Vaz","kmInicio":155160,"horaInicio":"15:15","kmFim":155161,"horaFim":"16:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0109","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289420,"horaInicio":"11:15","kmFim":289430,"horaFim":"12:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0110","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-02","pedidoPor":"Jose Miguel","destino":"Deslocaçao a casa","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":155161,"horaInicio":"12:00","kmFim":155184,"horaFim":"12:45","observacoes":"","kmPercorridos":23},{"id":"ROT-0111","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-03","pedidoPor":"Machado","destino":"Jantes Xavier","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":155184,"horaInicio":"09:30","kmFim":155199,"horaFim":"10:07","observacoes":"","kmPercorridos":15},{"id":"ROT-0112","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 Paletes","condutor":"Zezito","kmInicio":171137,"horaInicio":"15:44","kmFim":171138,"horaFim":"16:25","observacoes":"","kmPercorridos":1},{"id":"ROT-0113","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"5 Paletes","condutor":"André Costa","kmInicio":171138,"horaInicio":"16:30","kmFim":171138,"horaFim":"16:53","observacoes":"","kmPercorridos":0},{"id":"ROT-0114","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289430,"horaInicio":"10:30","kmFim":289441,"horaFim":"11:15","observacoes":"","kmPercorridos":11},{"id":"ROT-0115","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-04","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":155199,"horaInicio":"11:10","kmFim":155208,"horaFim":"11:52","observacoes":"","kmPercorridos":9},{"id":"ROT-0116","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289441,"horaInicio":"09:30","kmFim":289452,"horaFim":"10:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0117","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289452,"horaInicio":"11:11","kmFim":289460,"horaFim":"11:40","observacoes":"","kmPercorridos":8},{"id":"ROT-0118","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-07","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"1 palete","condutor":"Rafael Cunha","kmInicio":155208,"horaInicio":"14:44","kmFim":155254,"horaFim":"15:33","observacoes":"","kmPercorridos":46},{"id":"ROT-0119","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"André Veloso","destino":"Bomba Combustivel","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":289460,"horaInicio":"17:10","kmFim":289471,"horaFim":"17:30","observacoes":"","kmPercorridos":11},{"id":"ROT-0120","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":289471,"horaInicio":"14:25","kmFim":289480,"horaFim":"15:02","observacoes":"","kmPercorridos":9},{"id":"ROT-0121","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-08","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Ruben","kmInicio":155254,"horaInicio":"15:22","kmFim":155255,"horaFim":"15:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0122","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-08","pedidoPor":"Claudia","destino":"serviço externo","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":289480,"horaInicio":"15:39","kmFim":289489,"horaFim":"16:03","observacoes":"","kmPercorridos":9},{"id":"ROT-0123","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-09","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Vaz","kmInicio":171138,"horaInicio":"09:10","kmFim":171250,"horaFim":"11:37","observacoes":"","kmPercorridos":112},{"id":"ROT-0124","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-09","pedidoPor":"André Veloso","destino":"Volta Guimaraes","periodo":"M","carga":"Varios Volumes","condutor":"Zezito","kmInicio":155255,"horaInicio":"08:15","kmFim":155510,"horaFim":"15:20","observacoes":"","kmPercorridos":255},{"id":"ROT-0125","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"André Veloso","destino":"Myforce Braga","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289489,"horaInicio":"09:30","kmFim":289499,"horaFim":"09:52","observacoes":"","kmPercorridos":10},{"id":"ROT-0126","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289499,"horaInicio":"11:31","kmFim":289508,"horaFim":"12:06","observacoes":"","kmPercorridos":9},{"id":"ROT-0127","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"Machado","destino":"Myforce Braga","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":289508,"horaInicio":"15:10","kmFim":289517,"horaFim":"15:33","observacoes":"","kmPercorridos":9},{"id":"ROT-0128","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-10","pedidoPor":"Claudia","destino":"Estação C.P.","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289517,"horaInicio":"10:30","kmFim":289524,"horaFim":"10:43","observacoes":"","kmPercorridos":7},{"id":"ROT-0129","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-10","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"3 paletes","condutor":"André Costa","kmInicio":171250,"horaInicio":"11:28","kmFim":171251,"horaFim":"11:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0130","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289524,"horaInicio":"10:04","kmFim":289533,"horaFim":"11:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0131","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Fabio Silva","kmInicio":155510,"horaInicio":"15:53","kmFim":155511,"horaFim":"16:05","observacoes":"","kmPercorridos":1},{"id":"ROT-0132","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-14","pedidoPor":"Claudia","destino":"Gabinete contabilidade / Banco","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289533,"horaInicio":"11:35","kmFim":289542,"horaFim":"12:17","observacoes":"","kmPercorridos":9},{"id":"ROT-0133","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-14","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155511,"horaInicio":"13:30","kmFim":155607,"horaFim":"17:00","observacoes":"","kmPercorridos":96},{"id":"ROT-0134","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-15","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289542,"horaInicio":"11:01","kmFim":289551,"horaFim":"11:45","observacoes":"","kmPercorridos":9},{"id":"ROT-0135","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-15","pedidoPor":"Miga","destino":"Trapotop","periodo":"T","carga":"3 paletes","condutor":"3 paletes","kmInicio":171251,"horaInicio":"14:30","kmFim":171326,"horaFim":"16:51","observacoes":"","kmPercorridos":75},{"id":"ROT-0136","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-15","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":289551,"horaInicio":"16:02","kmFim":289560,"horaFim":"16:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0137","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-15","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155607,"horaInicio":"08:15","kmFim":155757,"horaFim":"17:00","observacoes":"","kmPercorridos":150},{"id":"ROT-0138","viatura":"Toyota Prius","matricula":"05-QR-43","data":"15/04/2025-16/04/2025","pedidoPor":"Tiago","destino":"Deslocaçao a casa","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":289560,"horaInicio":"19:00","kmFim":289617,"horaFim":"08:30","observacoes":"","kmPercorridos":57},{"id":"ROT-0139","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-16","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289617,"horaInicio":"11:20","kmFim":289627,"horaFim":"11:58","observacoes":"","kmPercorridos":10},{"id":"ROT-0140","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-16","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155757,"horaInicio":"08:15","kmFim":155929,"horaFim":"16:48","observacoes":"","kmPercorridos":172},{"id":"ROT-0141","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-17","pedidoPor":"Miga","destino":"Gaiafor","periodo":"M","carga":"5 paletes","condutor":"zezito","kmInicio":171326,"horaInicio":"09:30","kmFim":171480,"horaFim":"12:31","observacoes":"","kmPercorridos":154},{"id":"ROT-0142","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-17","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":289627,"horaInicio":"16:00","kmFim":289669,"horaFim":"17:06","observacoes":"","kmPercorridos":42},{"id":"ROT-0143","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"M","carga":"sem carga","condutor":"André Veloso","kmInicio":289669,"horaInicio":"09:36","kmFim":289736,"horaFim":"12:20","observacoes":"","kmPercorridos":67},{"id":"ROT-0144","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-18","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"4 paletes","condutor":"Rafael Cunha","kmInicio":171480,"horaInicio":"10:15","kmFim":171592,"horaFim":"12:06","observacoes":"","kmPercorridos":112},{"id":"ROT-0145","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155929,"horaInicio":"10:00","kmFim":156171,"horaFim":"11:00","observacoes":"","kmPercorridos":242},{"id":"ROT-0146","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"T","carga":"sem carga","condutor":"andré Veloso","kmInicio":289736,"horaInicio":"15:00","kmFim":289898,"horaFim":"17:00","observacoes":"","kmPercorridos":162},{"id":"ROT-0147","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-18","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Rafael Cunha","kmInicio":171592,"horaInicio":"14:33","kmFim":171711,"horaFim":"17:05","observacoes":"","kmPercorridos":119},{"id":"ROT-0148","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Volta Barcelos","periodo":"T","carga":"Varios Volumes","condutor":"Fabio Silva","kmInicio":156171,"horaInicio":"15:00","kmFim":156262,"horaFim":"17:00","observacoes":"","kmPercorridos":91},{"id":"ROT-0149","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-21","pedidoPor":"Machado","destino":"Deslocação almoço","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":156262,"horaInicio":"13:00","kmFim":156273,"horaFim":"15:04","observacoes":"","kmPercorridos":11},{"id":"ROT-0150","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289898,"horaInicio":"10:40","kmFim":289909,"horaFim":"11:32","observacoes":"","kmPercorridos":11},{"id":"ROT-0151","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-22","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":171711,"horaInicio":"09:30","kmFim":171712,"horaFim":"10:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0152","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"Joao Carlos","destino":"Medicina no Trabalho","periodo":"M","carga":"sem carga","condutor":"Paulo Pimenta","kmInicio":289909,"horaInicio":"13:45","kmFim":289918,"horaFim":"15:03","observacoes":"","kmPercorridos":9},{"id":"ROT-0153","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":289918,"horaInicio":"15:10","kmFim":290071,"horaFim":"17:58","observacoes":"","kmPercorridos":153},{"id":"ROT-0154","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"César","destino":"Ida ao Mecanico","periodo":"M","carga":"sem carga","condutor":"César","kmInicio":290071,"horaInicio":"09:00","kmFim":290088,"horaFim":"09:28","observacoes":"","kmPercorridos":17},{"id":"ROT-0155","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Machado","destino":"Peritagem Carro volta","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":290088,"horaInicio":"09:53","kmFim":290099,"horaFim":"10:28","observacoes":"","kmPercorridos":11},{"id":"ROT-0156","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"","carga":"sem carga","condutor":"Joao Silva","kmInicio":290099,"horaInicio":"10:20","kmFim":290142,"horaFim":"14:30","observacoes":"","kmPercorridos":43},{"id":"ROT-0157","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":290142,"horaInicio":"15:22","kmFim":290144,"horaFim":"15:45","observacoes":"","kmPercorridos":2},{"id":"ROT-0158","viatura":"Toyota Prius","matricula":"05-QR-43","data":"23/04/2025-24/04/2025","pedidoPor":"André Veloso","destino":"Ida ao Mecanico","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":290144,"horaInicio":"18:08","kmFim":290226,"horaFim":"09:00","observacoes":"","kmPercorridos":82},{"id":"ROT-0159","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":290226,"horaInicio":"14:38","kmFim":290235,"horaFim":"15:43","observacoes":"","kmPercorridos":9},{"id":"ROT-0160","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-24","pedidoPor":"Tiago","destino":"Master escapes","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":171712,"horaInicio":"15:08","kmFim":171724,"horaFim":"15:40","observacoes":"","kmPercorridos":12},{"id":"ROT-0161","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"28/04/2025 - 29/04/2025","pedidoPor":"Tiago","destino":"Master escapes","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":171724,"horaInicio":"09:00","kmFim":171737,"horaFim":"15:00","observacoes":"","kmPercorridos":13},{"id":"ROT-0162","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290235,"horaInicio":"10:28","kmFim":290250,"horaFim":"11:27","observacoes":"","kmPercorridos":15},{"id":"ROT-0163","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":290250,"horaInicio":"12:10","kmFim":290259,"horaFim":"12:40","observacoes":"","kmPercorridos":9},{"id":"ROT-0164","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Tiago","destino":"Master escapes","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":290259,"horaInicio":"14:30","kmFim":290270,"horaFim":"15:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0165","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290270,"horaInicio":"09:32","kmFim":290284,"horaFim":"10:17","observacoes":"","kmPercorridos":14},{"id":"ROT-0166","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-30","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"5 paletes","condutor":"Simba","kmInicio":171737,"horaInicio":"09:35","kmFim":171763,"horaFim":"10:35","observacoes":"","kmPercorridos":26},{"id":"ROT-0167","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-30","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"4 paletes","condutor":"Mario","kmInicio":171763,"horaInicio":"14:39","kmFim":171764,"horaFim":"15:19","observacoes":"","kmPercorridos":1},{"id":"ROT-0168","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-05","pedidoPor":"Miga","destino":"Gaiafor","periodo":"T","carga":"6 paletes","condutor":"Fabio Silva","kmInicio":171764,"horaInicio":"14:42","kmFim":171899,"horaFim":"16:50","observacoes":"","kmPercorridos":135},{"id":"ROT-0169","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-05","pedidoPor":"Andre Veloso","destino":"7 fontes","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":290284,"horaInicio":"17:15","kmFim":290293,"horaFim":"17:57","observacoes":"","kmPercorridos":9},{"id":"ROT-0170","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-06","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":171899,"horaInicio":"09:00","kmFim":171899,"horaFim":"09:30","observacoes":"","kmPercorridos":0},{"id":"ROT-0171","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290293,"horaInicio":"12:10","kmFim":290303,"horaFim":"12:44","observacoes":"","kmPercorridos":10},{"id":"ROT-0172","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-06","pedidoPor":"Avelino","destino":"Trapotop","periodo":"T","carga":"3 paletes","condutor":"Fabio Silva","kmInicio":171899,"horaInicio":"14:30","kmFim":171974,"horaFim":"16:26","observacoes":"","kmPercorridos":75},{"id":"ROT-0173","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-07","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":171974,"horaInicio":"09:40","kmFim":171996,"horaFim":"10:36","observacoes":"","kmPercorridos":22},{"id":"ROT-0174","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290303,"horaInicio":"10:37","kmFim":290313,"horaFim":"11:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0175","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Machado","destino":"almoço","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":290313,"horaInicio":"13:00","kmFim":290321,"horaFim":"14:28","observacoes":"","kmPercorridos":8},{"id":"ROT-0176","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Fabio Silva","kmInicio":290321,"horaInicio":"15:21","kmFim":290322,"horaFim":"15:45","observacoes":"","kmPercorridos":1},{"id":"ROT-0177","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":290322,"horaInicio":"09:41","kmFim":290324,"horaFim":"10:04","observacoes":"","kmPercorridos":2},{"id":"ROT-0178","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Joao Silva","destino":"Stapples","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":290324,"horaInicio":"11:27","kmFim":290338,"horaFim":"12:00","observacoes":"","kmPercorridos":14},{"id":"ROT-0179","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"","carga":"sem carga","condutor":"Avelino","kmInicio":290338,"horaInicio":"13:30","kmFim":290347,"horaFim":"14:00","observacoes":"","kmPercorridos":9},{"id":"ROT-0180","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Claudia","destino":"Stapples / Compras","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":290347,"horaInicio":"15:04","kmFim":290367,"horaFim":"17:35","observacoes":"","kmPercorridos":20},{"id":"ROT-0181","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"08/05/2025 - 09/05/2025","pedidoPor":"Machado","destino":"Deslocação a casa","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":171996,"horaInicio":"19:00","kmFim":172009,"horaFim":"09:30","observacoes":"","kmPercorridos":13},{"id":"ROT-0182","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-09","pedidoPor":"Claudia","destino":"40 anos Bragalis","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":290367,"horaInicio":"10:00","kmFim":290392,"horaFim":"19:00","observacoes":"","kmPercorridos":25},{"id":"ROT-0183","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-09","pedidoPor":"Avelino","destino":"Barcelpeças Barcelos","periodo":"T","carga":"4 paletes","condutor":"Fabio Silva","kmInicio":172009,"horaInicio":"14:40","kmFim":172066,"horaFim":"15:52","observacoes":"","kmPercorridos":57},{"id":"ROT-0184","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-12","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Leonardo","kmInicio":172066,"horaInicio":"11:50","kmFim":172067,"horaFim":"12:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0185","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-13","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":172067,"horaInicio":"09:31","kmFim":172178,"horaFim":"11:20","observacoes":"","kmPercorridos":111},{"id":"ROT-0186","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-13","pedidoPor":"Avelino","destino":"Barcelpeças Barcelos","periodo":"T","carga":"5 Paletes","condutor":"Fabio Silva","kmInicio":172178,"horaInicio":"14:45","kmFim":172236,"horaFim":"16:05","observacoes":"","kmPercorridos":58},{"id":"ROT-0187","viatura":"Toyota Prius","matricula":"05-QR-43","data":"x","pedidoPor":"Jose Luis","destino":"Carro Substituiçao","periodo":"x","carga":"sem carga","condutor":"Jose Luis","kmInicio":290392,"horaInicio":"x","kmFim":291420,"horaFim":"x","observacoes":"","kmPercorridos":1028},{"id":"ROT-0188","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-15","pedidoPor":"Rafael","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Rafael","kmInicio":290420,"horaInicio":"14:00","kmFim":290424,"horaFim":"15:30","observacoes":"","kmPercorridos":4},{"id":"ROT-0189","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291489,"horaInicio":"11:07","kmFim":291498,"horaFim":"11:40","observacoes":"","kmPercorridos":9},{"id":"ROT-0190","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-17","pedidoPor":"Fabio Silva","destino":"Deslocação a casa","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":172526,"horaInicio":"09:00","kmFim":172542,"horaFim":"12:00","observacoes":"","kmPercorridos":16},{"id":"ROT-0191","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-19","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"André Costa","kmInicio":172542,"horaInicio":"15:00","kmFim":172653,"horaFim":"16:18","observacoes":"","kmPercorridos":111},{"id":"ROT-0192","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-20","pedidoPor":"Carlos Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Cunha","kmInicio":172653,"horaInicio":"10:00","kmFim":172654,"horaFim":"10:43","observacoes":"","kmPercorridos":1},{"id":"ROT-0193","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-20","pedidoPor":"Andre Veloso","destino":"Volta Amares","periodo":"M","carga":"Varios volumes","condutor":"Fabio Vaz","kmInicio":291498,"horaInicio":"10:30","kmFim":291530,"horaFim":"11:22","observacoes":"","kmPercorridos":32},{"id":"ROT-0194","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291530,"horaInicio":"10:48","kmFim":291539,"horaFim":"11:44","observacoes":"","kmPercorridos":9},{"id":"ROT-0195","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-22","pedidoPor":"Claudia","destino":"Estação de comboios","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":291539,"horaInicio":"10:55","kmFim":291546,"horaFim":"11:17","observacoes":"","kmPercorridos":7},{"id":"ROT-0196","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-22","pedidoPor":"Elisabete","destino":"Estação de comboios","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":291546,"horaInicio":"17.40:00","kmFim":291552,"horaFim":"18:00","observacoes":"","kmPercorridos":6},{"id":"ROT-0197","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-23","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291552,"horaInicio":"11,20:00","kmFim":291562,"horaFim":"12:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0198","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":291562,"horaInicio":"09:38","kmFim":291571,"horaFim":"10:15","observacoes":"","kmPercorridos":9},{"id":"ROT-0199","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Andre Veloso","destino":"Consulta","periodo":"T","carga":"sem carga","condutor":"Andre","kmInicio":291571,"horaInicio":"12:30","kmFim":291605,"horaFim":"14:30","observacoes":"","kmPercorridos":34},{"id":"ROT-0200","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Joao Carlos","destino":"Sogima","periodo":"T","carga":"4 pistões","condutor":"Tiago","kmInicio":291605,"horaInicio":"14:30","kmFim":291618,"horaFim":"15:05","observacoes":"","kmPercorridos":13},{"id":"ROT-0201","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Machado","destino":"PSP","periodo":"T","carga":"1 volume","condutor":"Cunha","kmInicio":291618,"horaInicio":"15:05","kmFim":291626,"horaFim":"15:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0202","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-29","pedidoPor":"Joao Silva","destino":"Serviço Externo","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":291626,"horaInicio":"09:00","kmFim":292191,"horaFim":".....","observacoes":"","kmPercorridos":565},{"id":"ROT-0203","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-29","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":172654,"horaInicio":"09:48","kmFim":172680,"horaFim":"10:57","observacoes":"","kmPercorridos":26},{"id":"ROT-0204","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-30","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":160512,"horaInicio":"14:43","kmFim":160522,"horaFim":"15:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0205","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-02","pedidoPor":"André","destino":"Team building","periodo":"M","carga":"sem carga","condutor":"André","kmInicio":292191,"horaInicio":"10:35","kmFim":292197,"horaFim":"11:20","observacoes":"","kmPercorridos":6},{"id":"ROT-0206","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-02","pedidoPor":"Carlos Avelino","destino":"Gaiafor","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":172680,"horaInicio":"14:30","kmFim":172822,"horaFim":"17:00","observacoes":"","kmPercorridos":142},{"id":"ROT-0207","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Tiago","destino":"Ethos Braga","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":292197,"horaInicio":"08:30","kmFim":292209,"horaFim":"09:00","observacoes":"","kmPercorridos":12},{"id":"ROT-0208","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292209,"horaInicio":"11:06","kmFim":292215,"horaFim":"11:50","observacoes":"","kmPercorridos":6},{"id":"ROT-0209","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":292215,"horaInicio":"15:11","kmFim":292293,"horaFim":"15:34","observacoes":"","kmPercorridos":78},{"id":"ROT-0210","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"T","carga":"Varios volumes","condutor":"Zezito","kmInicio":292293,"horaInicio":"16:00","kmFim":292515,"horaFim":"18:30","observacoes":"","kmPercorridos":222},{"id":"ROT-0211","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-03","pedidoPor":"Carlos Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Joao Fernandes","kmInicio":172822,"horaInicio":"11:00","kmFim":172823,"horaFim":"11:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0212","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-04","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":172823,"horaInicio":"13:00","kmFim":172832,"horaFim":"14:00","observacoes":"","kmPercorridos":9},{"id":"ROT-0213","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-04","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Leo","kmInicio":172832,"horaInicio":"14:40","kmFim":172833,"horaFim":"16:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0214","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":292515,"horaInicio":"11:50","kmFim":292528,"horaFim":"12:20","observacoes":"","kmPercorridos":13},{"id":"ROT-0215","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-05","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":172833,"horaInicio":"15:11","kmFim":172945,"horaFim":"17:00","observacoes":"","kmPercorridos":112},{"id":"ROT-0216","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Joao Silva","destino":"Levantar carrinha","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":292528,"horaInicio":"17:00","kmFim":292624,"horaFim":"17:55","observacoes":"","kmPercorridos":96},{"id":"ROT-0217","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Andre Veloso","destino":"Team building","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":292624,"horaInicio":"17:55","kmFim":292635,"horaFim":"19:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0218","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-06","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":172945,"horaInicio":"09:36","kmFim":173061,"horaFim":"11:28","observacoes":"","kmPercorridos":116},{"id":"ROT-0219","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":173061,"horaInicio":"09:40","kmFim":173173,"horaFim":"11:40","observacoes":"","kmPercorridos":112},{"id":"ROT-0220","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Joao Silva","destino":"Team building","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":292635,"horaInicio":"10:17","kmFim":292648,"horaFim":"11:30","observacoes":"","kmPercorridos":13},{"id":"ROT-0221","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292648,"horaInicio":"11:38","kmFim":292658,"horaFim":"12:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0222","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":173173,"horaInicio":"14:30","kmFim":173287,"horaFim":"16:22","observacoes":"","kmPercorridos":114},{"id":"ROT-0223","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":292658,"horaInicio":"15:00","kmFim":292659,"horaFim":"15:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0224","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"1 palete","condutor":"Fabio Silva","kmInicio":173287,"horaInicio":"17:00","kmFim":173310,"horaFim":"17:45","observacoes":"","kmPercorridos":23},{"id":"ROT-0225","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":173310,"horaInicio":"09:47","kmFim":173311,"horaFim":"10:13","observacoes":"","kmPercorridos":1},{"id":"ROT-0226","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-11","pedidoPor":"Joao Silva","destino":"Confiauto","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":292659,"horaInicio":"09:15","kmFim":292679,"horaFim":"10:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0227","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292679,"horaInicio":"10:45","kmFim":292689,"horaFim":"11:19","observacoes":"","kmPercorridos":10},{"id":"ROT-0228","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-13","pedidoPor":"Fabio Silva","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Fabio Silva","kmInicio":292689,"horaInicio":"14:30","kmFim":292697,"horaFim":"15:15","observacoes":"","kmPercorridos":8},{"id":"ROT-0229","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-16","pedidoPor":"Joao Silva","destino":"Confiauto","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":292697,"horaInicio":"10:10","kmFim":292708,"horaFim":"10:48","observacoes":"","kmPercorridos":11},{"id":"ROT-0230","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-16","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292708,"horaInicio":"11:15","kmFim":292719,"horaFim":"12:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0231","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-16","pedidoPor":"Avelino","destino":"Gaiafor Gaia","periodo":"T","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":173311,"horaInicio":"14:38","kmFim":173445,"horaFim":"16:49","observacoes":"","kmPercorridos":134},{"id":"ROT-0232","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292719,"horaInicio":"09:18","kmFim":292728,"horaFim":"09:44","observacoes":"","kmPercorridos":9},{"id":"ROT-0233","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Ricardo","kmInicio":163595,"horaInicio":"09:44","kmFim":163600,"horaFim":"10:04","observacoes":"","kmPercorridos":5},{"id":"ROT-0234","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"André Costa","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"André Costa","kmInicio":163600,"horaInicio":"14:00","kmFim":163607,"horaFim":"15:09","observacoes":"","kmPercorridos":7},{"id":"ROT-0235","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Ruben","kmInicio":163607,"horaInicio":"15:33","kmFim":163608,"horaFim":"15:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0236","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"17/062025","pedidoPor":"Tiago","destino":"Ramoa","periodo":"T","carga":"sem carga","condutor":"Gomes","kmInicio":163608,"horaInicio":"18:30","kmFim":163612,"horaFim":"18:53","observacoes":"","kmPercorridos":4},{"id":"ROT-0237","viatura":"Toyota Prius","matricula":"05-QR-43","data":"17/062025","pedidoPor":"Tiago","destino":"Ramoa","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":292728,"horaInicio":"18:30","kmFim":292732,"horaFim":"18:53","observacoes":"","kmPercorridos":4},{"id":"ROT-0238","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292732,"horaInicio":"09:53","kmFim":292741,"horaFim":"10:22","observacoes":"","kmPercorridos":9},{"id":"ROT-0239","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292741,"horaInicio":"09:40","kmFim":292751,"horaFim":"10:46","observacoes":"","kmPercorridos":10},{"id":"ROT-0240","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-20","pedidoPor":"Machado","destino":"Sapol","periodo":"T","carga":"sem carga","condutor":"Rui Bernardo","kmInicio":163612,"horaInicio":"14:58","kmFim":163612,"horaFim":"15:08","observacoes":"","kmPercorridos":0},{"id":"ROT-0241","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-20","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"7 paletes","condutor":"Rui Bernardo","kmInicio":173445,"horaInicio":"15:14","kmFim":173468,"horaFim":"16:29","observacoes":"","kmPercorridos":23},{"id":"ROT-0242","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-23","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":163612,"horaInicio":"16:15","kmFim":163613,"horaFim":"16:39","observacoes":"","kmPercorridos":1},{"id":"ROT-0243","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-25","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"Baterias","condutor":"Rui  Fernandes","kmInicio":163613,"horaInicio":"09:05","kmFim":163614,"horaFim":"09:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0244","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-25","pedidoPor":"Avelino","destino":"Trapotop","periodo":"M","carga":"4 paletes","condutor":"Rui  Fernandes","kmInicio":173468,"horaInicio":"09:35","kmFim":173542,"horaFim":"10:53","observacoes":"","kmPercorridos":74},{"id":"ROT-0245","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-25","pedidoPor":"Andre Veloso","destino":"Repsol","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":292751,"horaInicio":"15:10","kmFim":292759,"horaFim":"1530:00","observacoes":"","kmPercorridos":8},{"id":"ROT-0246","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-25","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"Cunha","kmInicio":173542,"horaInicio":"14:40","kmFim":173669,"horaFim":"16:45","observacoes":"","kmPercorridos":127},{"id":"ROT-0247","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Rui","kmInicio":173669,"horaInicio":"09:50","kmFim":173670,"horaFim":"10:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0248","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163614,"horaInicio":"10:18","kmFim":163623,"horaFim":"10:49","observacoes":"","kmPercorridos":9},{"id":"ROT-0249","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-30","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":163623,"horaInicio":"14:36","kmFim":163623,"horaFim":"14:49","observacoes":"","kmPercorridos":0},{"id":"ROT-0250","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163623,"horaInicio":"10:20","kmFim":163635,"horaFim":"11:07","observacoes":"","kmPercorridos":12},{"id":"ROT-0251","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163635,"horaInicio":"12:05","kmFim":163644,"horaFim":"12:31","observacoes":"","kmPercorridos":9},{"id":"ROT-0252","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-01","pedidoPor":"Miga","destino":"Gaiafor Gaia","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":173670,"horaInicio":"14:35","kmFim":173796,"horaFim":"16:40","observacoes":"","kmPercorridos":126},{"id":"ROT-0253","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Jose Miguel","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":163644,"horaInicio":"13:45","kmFim":163650,"horaFim":"14:50","observacoes":"","kmPercorridos":6},{"id":"ROT-0254","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Rafael Silva","kmInicio":163650,"horaInicio":"15:15","kmFim":163659,"horaFim":"15:35","observacoes":"","kmPercorridos":9},{"id":"ROT-0255","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-02","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"7 paletes","condutor":"Rui Bernardo","kmInicio":173796,"horaInicio":"15:06","kmFim":173797,"horaFim":"15:51","observacoes":"","kmPercorridos":1},{"id":"ROT-0256","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-02","pedidoPor":"Machado","destino":"Volta Guimarães","periodo":"M/T","carga":"varios Volumes","condutor":"Leonardo / Micael","kmInicio":163659,"horaInicio":"08:15","kmFim":164012,"horaFim":"15:15","observacoes":"","kmPercorridos":353},{"id":"ROT-0257","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-03","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":164012,"horaInicio":"14:38","kmFim":164012,"horaFim":"14:49","observacoes":"","kmPercorridos":0},{"id":"ROT-0258","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292759,"horaInicio":"10:55","kmFim":292769,"horaFim":"11:34","observacoes":"","kmPercorridos":10},{"id":"ROT-0259","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":292769,"horaInicio":"14:32","kmFim":292777,"horaFim":"15:14","observacoes":"","kmPercorridos":8},{"id":"ROT-0260","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-04","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":173797,"horaInicio":"14:45","kmFim":173908,"horaFim":"17:00","observacoes":"","kmPercorridos":111},{"id":"ROT-0261","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":292777,"horaInicio":"14:34","kmFim":292786,"horaFim":"15:09","observacoes":"","kmPercorridos":9},{"id":"ROT-0262","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-08","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":173908,"horaInicio":"09:35","kmFim":174022,"horaFim":"11:42","observacoes":"","kmPercorridos":114},{"id":"ROT-0263","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-08","pedidoPor":"Rafael Silva","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Rafael Silva","kmInicio":164012,"horaInicio":"15:01","kmFim":164014,"horaFim":"15:18","observacoes":"","kmPercorridos":2},{"id":"ROT-0264","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292786,"horaInicio":"10:28","kmFim":292796,"horaFim":"11:02","observacoes":"","kmPercorridos":10},{"id":"ROT-0265","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-09","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Zezito","kmInicio":174022,"horaInicio":"14:46","kmFim":174023,"horaFim":"15:19","observacoes":"","kmPercorridos":1},{"id":"ROT-0266","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-10","pedidoPor":"Miga","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Zezito","kmInicio":174023,"horaInicio":"09:31","kmFim":174096,"horaFim":"11:10","observacoes":"","kmPercorridos":73},{"id":"ROT-0267","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-10","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"T","carga":"5 paletes","condutor":"Rui Bernardo","kmInicio":174096,"horaInicio":"14:29","kmFim":174145,"horaFim":"15:40","observacoes":"","kmPercorridos":49},{"id":"ROT-0268","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-11","pedidoPor":"Joao Silva","destino":"Serviço Externo","periodo":"M/T","carga":"sem carga","condutor":"Joao Silva","kmInicio":292796,"horaInicio":"09:00","kmFim":293016,"horaFim":"17:43","observacoes":"","kmPercorridos":220},{"id":"ROT-0269","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":164014,"horaInicio":"09:30","kmFim":164025,"horaFim":"10:38","observacoes":"","kmPercorridos":11},{"id":"ROT-0270","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-11","pedidoPor":"Jose Miguel","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":164025,"horaInicio":"14:00","kmFim":164032,"horaFim":"14:04","observacoes":"","kmPercorridos":7},{"id":"ROT-0271","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-12","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"T","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":174145,"horaInicio":"09:00","kmFim":174201,"horaFim":"10:30","observacoes":"","kmPercorridos":56},{"id":"ROT-0272","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":293016,"horaInicio":"10:22","kmFim":293024,"horaFim":"10:59","observacoes":"","kmPercorridos":8},{"id":"ROT-0273","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":293024,"horaInicio":"11:13","kmFim":293032,"horaFim":"11:47","observacoes":"","kmPercorridos":8},{"id":"ROT-0274","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Andre Veloso","destino":"Consulta Medica","periodo":"M/T","carga":"sem carga","condutor":"André Veloso","kmInicio":293032,"horaInicio":"13:00","kmFim":293036,"horaFim":"14:00","observacoes":"","kmPercorridos":4},{"id":"ROT-0275","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Andre Veloso","destino":"Deslocação a Escola de Artes","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":293036,"horaInicio":"17:30","kmFim":293040,"horaFim":"17:37","observacoes":"","kmPercorridos":4},{"id":"ROT-0276","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":293040,"horaInicio":"09:23","kmFim":293049,"horaFim":"09:54","observacoes":"","kmPercorridos":9},{"id":"ROT-0277","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-15","pedidoPor":"Joao Leite","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Joao Leite","kmInicio":293049,"horaInicio":"14:00","kmFim":293059,"horaFim":"16:34","observacoes":"","kmPercorridos":10},{"id":"ROT-0278","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-16","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":293059,"horaInicio":"09:11","kmFim":293060,"horaFim":"09:37","observacoes":"","kmPercorridos":1},{"id":"ROT-0279","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-16","pedidoPor":"Machado","destino":"P.S.P.","periodo":"M","carga":"sem carga","condutor":"Ruben","kmInicio":164032,"horaInicio":"09:32","kmFim":164048,"horaFim":"10:00","observacoes":"","kmPercorridos":16},{"id":"ROT-0280","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-16","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Simba","kmInicio":174201,"horaInicio":"15:13","kmFim":174201,"horaFim":"15:29","observacoes":"","kmPercorridos":0},{"id":"ROT-0281","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-17","pedidoPor":"Avelino","destino":"Acessorio Soares Geme","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":174201,"horaInicio":"09:33","kmFim":174234,"horaFim":"10:40","observacoes":"","kmPercorridos":33},{"id":"ROT-0282","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-17","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Leonardo","kmInicio":164048,"horaInicio":"14:40","kmFim":164048,"horaFim":"14:50","observacoes":"","kmPercorridos":0},{"id":"ROT-0284","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-16","pedidoPor":"Miga","destino":"Gaiafor Gaia","periodo":"T","carga":"5 paletes","condutor":"Teles","kmInicio":175910,"horaInicio":"15:00","kmFim":176107,"horaFim":"17:15","observacoes":"","kmPercorridos":197},{"id":"ROT-0285","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-17","pedidoPor":"Tiago","destino":"mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":294472,"horaInicio":"10:45","kmFim":294485,"horaFim":"11:15","observacoes":"","kmPercorridos":13},{"id":"ROT-0286","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-17","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Gonçalo","kmInicio":171043,"horaInicio":"15:15","kmFim":171044,"horaFim":"171044","observacoes":"","kmPercorridos":1},{"id":"ROT-0287","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-18","pedidoPor":"Miga","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Teles","kmInicio":176107,"horaInicio":"09:30","kmFim":176180,"horaFim":"11:18","observacoes":"","kmPercorridos":73},{"id":"ROT-0288","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-18","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":171044,"horaInicio":"14:15","kmFim":171056,"horaFim":"14:55","observacoes":"","kmPercorridos":12},{"id":"ROT-0289","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-19","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"5 paletes","condutor":"Teles","kmInicio":176180,"horaInicio":"09:48","kmFim":176181,"horaFim":"10:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0290","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-19","pedidoPor":"Elisabete","destino":"bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":294485,"horaInicio":"12:09","kmFim":294495,"horaFim":"13:10","observacoes":"","kmPercorridos":10},{"id":"ROT-0291","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-19","pedidoPor":"Andre Veloso","destino":"casa","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":171056,"horaInicio":"13:00","kmFim":171083,"horaFim":"14:12","observacoes":"","kmPercorridos":27},{"id":"ROT-0292","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-19","pedidoPor":"Machado","destino":"casa","periodo":"T","carga":"Estantes","condutor":"Machado","kmInicio":176181,"horaInicio":"16:00","kmFim":176199,"horaFim":"17:30","observacoes":"","kmPercorridos":18},{"id":"ROT-0293","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-22","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294495,"horaInicio":"11:22","kmFim":294505,"horaFim":"12:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0294","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-22","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Mario","kmInicio":171083,"horaInicio":"15:45","kmFim":171084,"horaFim":"15:50","observacoes":"","kmPercorridos":1},{"id":"ROT-0295","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-24","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Vaz","kmInicio":176199,"horaInicio":"10:08","kmFim":176200,"horaFim":"10:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0296","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-24","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294505,"horaInicio":"11:40","kmFim":294519,"horaFim":"12:39","observacoes":"","kmPercorridos":14},{"id":"ROT-0297","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-24","pedidoPor":"Andre Veloso","destino":"Escola do filho","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":294519,"horaInicio":"15:05","kmFim":294546,"horaFim":"16:09","observacoes":"","kmPercorridos":27},{"id":"ROT-0298","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-24","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Teles","kmInicio":171084,"horaInicio":"15:20","kmFim":171085,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0299","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-24","pedidoPor":"Machado","destino":"Primopeças","periodo":"T","carga":"2 Paletes","condutor":"Batista","kmInicio":176200,"horaInicio":"15:35","kmFim":176228,"horaFim":"17:35","observacoes":"","kmPercorridos":28},{"id":"ROT-0300","viatura":"FIAt Doblo","matricula":"52-PM-78","data":"2025-09-25","pedidoPor":"Machado","destino":"AZ/PORTO","periodo":"M","carga":"Volumes","condutor":"Vaz","kmInicio":171085,"horaInicio":"10:00","kmFim":171124,"horaFim":"10:45","observacoes":"","kmPercorridos":39},{"id":"ROT-0301","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-25","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294546,"horaInicio":"12:05","kmFim":294560,"horaFim":"13:00","observacoes":"","kmPercorridos":14},{"id":"ROT-0302","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-25","pedidoPor":"Joao Carlos","destino":"Normed (Dmitri)","periodo":"T","carga":"sem carga","condutor":"Joao Carlos","kmInicio":294560,"horaInicio":"14:00","kmFim":294564,"horaFim":"14:55","observacoes":"","kmPercorridos":4},{"id":"ROT-0303","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-25","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Teles","kmInicio":171124,"horaInicio":"15.35:00","kmFim":171126,"horaFim":"16:00","observacoes":"","kmPercorridos":2},{"id":"ROT-0304","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Vaz","kmInicio":171126,"horaInicio":"10:45","kmFim":171127,"horaFim":"11:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0305","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294564,"horaInicio":"11:33","kmFim":294575,"horaFim":"12:30","observacoes":"","kmPercorridos":11},{"id":"ROT-0306","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-26","pedidoPor":"Claudia","destino":"G.Contabilidade","periodo":"T","carga":"sem carga","condutor":"Caudia","kmInicio":294575,"horaInicio":"16:13","kmFim":294583,"horaFim":"17:00","observacoes":"","kmPercorridos":8},{"id":"ROT-0307","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Batista","kmInicio":171157,"horaInicio":"14:41","kmFim":171158,"horaFim":"14:52","observacoes":"","kmPercorridos":1},{"id":"ROT-0308","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-26","pedidoPor":"Machado","destino":"Braginox","periodo":"T","carga":"Ferro velho","condutor":"Marcelino","kmInicio":176228,"horaInicio":"16:00","kmFim":176251,"horaFim":"17:16","observacoes":"","kmPercorridos":23},{"id":"ROT-0309","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-28","pedidoPor":"Claudia","destino":"estação cp","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":294583,"horaInicio":"10:15","kmFim":294590,"horaFim":"10:45","observacoes":"","kmPercorridos":7},{"id":"ROT-0310","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-29","pedidoPor":"Leonel","destino":"Agarbe","periodo":"m","carga":"sem carga","condutor":"Leonel","kmInicio":294590,"horaInicio":"11:00","kmFim":294591,"horaFim":"11:26","observacoes":"","kmPercorridos":1},{"id":"ROT-0311","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-29","pedidoPor":"Elisabete","destino":"estação cp","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":294591,"horaInicio":"17:45","kmFim":294598,"horaFim":"18:04","observacoes":"","kmPercorridos":7},{"id":"ROT-0312","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-30","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"André Costa","kmInicio":176251,"horaInicio":"10:35","kmFim":176261,"horaFim":"17:45","observacoes":"","kmPercorridos":10},{"id":"ROT-0313","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-30","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":171158,"horaInicio":"10:35","kmFim":171160,"horaFim":"10:47","observacoes":"","kmPercorridos":2},{"id":"ROT-0314","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-30","pedidoPor":"Joao Silva","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":294598,"horaInicio":"10:40","kmFim":294603,"horaFim":"10:57","observacoes":"","kmPercorridos":5},{"id":"ROT-0315","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-01","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294603,"horaInicio":"11:19","kmFim":294613,"horaFim":"11:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0316","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-01","pedidoPor":"Machado","destino":"arm.Porto","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":294603,"horaInicio":"19:00","kmFim":294752,"horaFim":"18:40","observacoes":"","kmPercorridos":149},{"id":"ROT-0317","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":171136,"horaInicio":"11:00","kmFim":171146,"horaFim":"11:50","observacoes":"","kmPercorridos":10},{"id":"ROT-0318","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-02","pedidoPor":"Claudia","destino":"G.Contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":171146,"horaInicio":"17:16","kmFim":171155,"horaFim":"17:49","observacoes":"","kmPercorridos":9},{"id":"ROT-0319","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-03","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":171155,"horaInicio":"10:00","kmFim":171158,"horaFim":"11:00","observacoes":"","kmPercorridos":3},{"id":"ROT-0320","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294752,"horaInicio":"11:17","kmFim":294762,"horaFim":"12:06","observacoes":"","kmPercorridos":10},{"id":"ROT-0321","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-03","pedidoPor":"Machado","destino":"PSP","periodo":"T","carga":"sem carga","condutor":"Batista","kmInicio":171158,"horaInicio":"16:43","kmFim":171166,"horaFim":"17:28","observacoes":"","kmPercorridos":8},{"id":"ROT-0322","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294762,"horaInicio":"10:40","kmFim":294772,"horaFim":"11:39","observacoes":"","kmPercorridos":10},{"id":"ROT-0323","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-06","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 Paletes","condutor":"André Costa","kmInicio":176261,"horaInicio":"14:45","kmFim":176372,"horaFim":"16:21","observacoes":"","kmPercorridos":111},{"id":"ROT-0324","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-07","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"4 paletes","condutor":"Zezito","kmInicio":176372,"horaInicio":"09:56","kmFim":176483,"horaFim":"11:50","observacoes":"","kmPercorridos":111},{"id":"ROT-0325","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-07","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Avelino","kmInicio":171166,"horaInicio":"10:55","kmFim":171167,"horaFim":"11:05","observacoes":"","kmPercorridos":1},{"id":"ROT-0326","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294772,"horaInicio":"11:25","kmFim":294781,"horaFim":"11:54","observacoes":"","kmPercorridos":9},{"id":"ROT-0327","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-07","pedidoPor":"Claudia","destino":"Gabinete de Contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":294781,"horaInicio":"14:54","kmFim":294790,"horaFim":"15:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0328","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-07","pedidoPor":"Rafael Silva","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"André Batista","kmInicio":171167,"horaInicio":"15:20","kmFim":171168,"horaFim":"15:31","observacoes":"","kmPercorridos":1},{"id":"ROT-0329","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294790,"horaInicio":"11:47","kmFim":294799,"horaFim":"12:18","observacoes":"","kmPercorridos":9},{"id":"ROT-0330","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-08","pedidoPor":"Rafael Silva","destino":"P.S.P.","periodo":"T","carga":"1 bateria","condutor":"André Batista","kmInicio":171168,"horaInicio":"14:48","kmFim":171175,"horaFim":"15:31","observacoes":"","kmPercorridos":7},{"id":"ROT-0331","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294799,"horaInicio":"10:30","kmFim":294809,"horaFim":"11:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0332","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-10","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"André Costa","kmInicio":176483,"horaInicio":"09:25","kmFim":176595,"horaFim":"11:15","observacoes":"","kmPercorridos":112},{"id":"ROT-0333","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-10","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"M/T","carga":"varios volumes","condutor":"Simba e Batista","kmInicio":171175,"horaInicio":"10:30","kmFim":171259,"horaFim":"11:54","observacoes":"","kmPercorridos":84},{"id":"ROT-0334","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294809,"horaInicio":"11:18","kmFim":294820,"horaFim":"12:08","observacoes":"","kmPercorridos":11},{"id":"ROT-0335","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-10","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":294820,"horaInicio":"15:10","kmFim":294828,"horaFim":"15:22","observacoes":"","kmPercorridos":8},{"id":"ROT-0336","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-10","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Batista","kmInicio":171259,"horaInicio":"17:30","kmFim":171260,"horaFim":"17:41","observacoes":"","kmPercorridos":1},{"id":"ROT-0337","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-13","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"um volume","condutor":"Teles","kmInicio":294828,"horaInicio":"16:08","kmFim":294829,"horaFim":"16:31","observacoes":"","kmPercorridos":1},{"id":"ROT-0338","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-13","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"7paletes","condutor":"Teles","kmInicio":176595,"horaInicio":"17:31","kmFim":176596,"horaFim":"18:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0339","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294829,"horaInicio":"10:33","kmFim":294842,"horaFim":"11:40","observacoes":"","kmPercorridos":13},{"id":"ROT-0340","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-14","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Teles","kmInicio":176596,"horaInicio":"14:50","kmFim":176597,"horaFim":"15:55","observacoes":"","kmPercorridos":1},{"id":"ROT-0341","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-15","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294842,"horaInicio":"10:33","kmFim":294851,"horaFim":"11:28","observacoes":"","kmPercorridos":9},{"id":"ROT-0342","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-15","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"M/T","carga":"varios volumes","condutor":"Zezito","kmInicio":171260,"horaInicio":"08:00","kmFim":171697,"horaFim":"15:00","observacoes":"","kmPercorridos":437},{"id":"ROT-0343","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-15","pedidoPor":"Joao Silva","destino":"deslocação a V.Real","periodo":"T","carga":"sem carga","condutor":"Joao Carlos","kmInicio":294851,"horaInicio":"14:30","kmFim":295074,"horaFim":"18:22","observacoes":"","kmPercorridos":223},{"id":"ROT-0344","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-16","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295074,"horaInicio":"10:15","kmFim":295082,"horaFim":"10:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0345","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-16","pedidoPor":"Machado","destino":"Armazem Famoes","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":295082,"horaInicio":"06:45","kmFim":295900,"horaFim":"21:00","observacoes":"","kmPercorridos":818},{"id":"ROT-0346","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-17","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Simba","kmInicio":176597,"horaInicio":"09:51","kmFim":176598,"horaFim":"10:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0347","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":171697,"horaInicio":"11:13","kmFim":171708,"horaFim":"12:18","observacoes":"","kmPercorridos":11},{"id":"ROT-0348","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-17","pedidoPor":"Joao Silva","destino":"Celeiros","periodo":"T","carga":"2 bidoes","condutor":"Fabio Silva","kmInicio":171708,"horaInicio":"14:35","kmFim":171732,"horaFim":"15:20","observacoes":"","kmPercorridos":24},{"id":"ROT-0349","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-17","pedidoPor":"Joao Carlos","destino":"Formaçao Empilhador","periodo":"M/T","carga":"sem carga","condutor":"Fabio Silva","kmInicio":295900,"horaInicio":"08:40","kmFim":295924,"horaFim":"17:00","observacoes":"","kmPercorridos":24},{"id":"ROT-0350","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295924,"horaInicio":"11:12","kmFim":295935,"horaFim":"11:49","observacoes":"","kmPercorridos":11},{"id":"ROT-0351","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-20","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Rui Bernardo","kmInicio":295935,"horaInicio":"15:26","kmFim":295936,"horaFim":"15:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0352","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295936,"horaInicio":"09:46","kmFim":295946,"horaFim":"10:29","observacoes":"","kmPercorridos":10},{"id":"ROT-0353","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"Joao Carlos","destino":"Velorio Covelas","periodo":"M","carga":"sem carga","condutor":"Joao Carlos","kmInicio":295946,"horaInicio":"10:55","kmFim":295971,"horaFim":"11:40","observacoes":"","kmPercorridos":25},{"id":"ROT-0354","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-21","pedidoPor":"Leonardo","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Leonardo","kmInicio":172070,"horaInicio":"15:53","kmFim":172071,"horaFim":"16:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0355","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-21","pedidoPor":"Tiago","destino":"Bascula","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":179596,"horaInicio":"14:30","kmFim":176603,"horaFim":"16:00","observacoes":"","kmPercorridos":0},{"id":"ROT-0356","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"André Veloso","destino":"Avenida","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":295971,"horaInicio":"16:30","kmFim":295976,"horaFim":"16:50","observacoes":"","kmPercorridos":5},{"id":"ROT-0357","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-22","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295976,"horaInicio":"10:47","kmFim":295985,"horaFim":"11:35","observacoes":"","kmPercorridos":9},{"id":"ROT-0358","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-22","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":295985,"horaInicio":"14:23","kmFim":295995,"horaFim":"15:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0359","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-22","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172071,"horaInicio":"15:29","kmFim":172072,"horaFim":"15:43","observacoes":"","kmPercorridos":1},{"id":"ROT-0360","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-23","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"M","carga":"6 paletes","condutor":"Cunha","kmInicio":176603,"horaInicio":"09:32","kmFim":176662,"horaFim":"11:42","observacoes":"","kmPercorridos":59},{"id":"ROT-0361","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-23","pedidoPor":"Machado","destino":"P.S.P.","periodo":"M","carga":"1 volume","condutor":"Rui Bernardo","kmInicio":172072,"horaInicio":"09:53","kmFim":172079,"horaFim":"10:23","observacoes":"","kmPercorridos":7},{"id":"ROT-0362","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-23","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295995,"horaInicio":"11:06","kmFim":296005,"horaFim":"11:56","observacoes":"","kmPercorridos":10},{"id":"ROT-0363","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296005,"horaInicio":"10:45","kmFim":296015,"horaFim":"11:38","observacoes":"","kmPercorridos":10},{"id":"ROT-0364","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-24","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"4 paletes","condutor":"Vaz","kmInicio":176662,"horaInicio":"11:04","kmFim":176686,"horaFim":"12:26","observacoes":"","kmPercorridos":24},{"id":"ROT-0365","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-24","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Avelino","kmInicio":172079,"horaInicio":"14:28","kmFim":172080,"horaFim":"14:40","observacoes":"","kmPercorridos":1},{"id":"ROT-0366","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-24","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296015,"horaInicio":"16:50","kmFim":296024,"horaFim":"17:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0367","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-27","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":296024,"horaInicio":"15:27","kmFim":296025,"horaFim":"15:47","observacoes":"","kmPercorridos":1},{"id":"ROT-0368","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-27","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"4 paletes","condutor":"André Costa","kmInicio":176686,"horaInicio":"15:00","kmFim":176707,"horaFim":"15:47","observacoes":"","kmPercorridos":21},{"id":"ROT-0369","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-28","pedidoPor":"Joao Silva","destino":"Bragalis Vila Real","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":296025,"horaInicio":"09:30","kmFim":296248,"horaFim":"17:55","observacoes":"","kmPercorridos":223},{"id":"ROT-0370","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172080,"horaInicio":"11:16","kmFim":172089,"horaFim":"11:47","observacoes":"","kmPercorridos":9},{"id":"ROT-0371","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172089,"horaInicio":"10:51","kmFim":172100,"horaFim":"11:28","observacoes":"","kmPercorridos":11},{"id":"ROT-0372","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-29","pedidoPor":"Machado","destino":"Soarauto / Alfilux / CTT","periodo":"T","carga":"1 palete","condutor":"Fabio","kmInicio":172100,"horaInicio":"15:28","kmFim":172101,"horaFim":"15:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0373","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-30","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Teles","kmInicio":172101,"horaInicio":"10:10","kmFim":172116,"horaFim":"10:35","observacoes":"","kmPercorridos":15},{"id":"ROT-0374","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-30","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":296248,"horaInicio":"10:10","kmFim":296263,"horaFim":"10:40","observacoes":"","kmPercorridos":15},{"id":"ROT-0375","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172116,"horaInicio":"12:11","kmFim":172122,"horaFim":"12:53","observacoes":"","kmPercorridos":6},{"id":"ROT-0376","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-31","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296263,"horaInicio":"12:10","kmFim":296276,"horaFim":"13:15","observacoes":"","kmPercorridos":13},{"id":"ROT-0377","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-31","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296276,"horaInicio":"17:10","kmFim":296284,"horaFim":"18:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0378","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296284,"horaInicio":"10:33","kmFim":296293,"horaFim":"11:14","observacoes":"","kmPercorridos":9},{"id":"ROT-0379","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296293,"horaInicio":"11:50","kmFim":296303,"horaFim":"12:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0380","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-03","pedidoPor":"Rafael Silva","destino":"Sucata","periodo":"T","carga":"3 paletes","condutor":"Rafael Silva","kmInicio":176707,"horaInicio":"15:00","kmFim":176727,"horaFim":"16:31","observacoes":"","kmPercorridos":20},{"id":"ROT-0381","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-05","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"T","carga":"6 paletes","condutor":"Teles","kmInicio":176800,"horaInicio":"15:00","kmFim":176912,"horaFim":"17:05","observacoes":"","kmPercorridos":112},{"id":"ROT-0382","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-06","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"6 paletes","condutor":"Teles","kmInicio":176912,"horaInicio":"09:35","kmFim":176939,"horaFim":"11:07","observacoes":"","kmPercorridos":27},{"id":"ROT-0383","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":296324,"horaInicio":"14:20","kmFim":296335,"horaFim":"15:17","observacoes":"","kmPercorridos":11},{"id":"ROT-0384","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-06","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Cunha","kmInicio":176939,"horaInicio":"14:54","kmFim":176940,"horaFim":"15:26","observacoes":"","kmPercorridos":1},{"id":"ROT-0385","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-06","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172122,"horaInicio":"14:45","kmFim":172123,"horaFim":"15:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0386","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296335,"horaInicio":"11:50","kmFim":296345,"horaFim":"12:54","observacoes":"","kmPercorridos":10},{"id":"ROT-0387","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-06","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172123,"horaInicio":"15:20","kmFim":172125,"horaFim":"15:32","observacoes":"","kmPercorridos":2},{"id":"ROT-0388","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296345,"horaInicio":"10:42","kmFim":296355,"horaFim":"11:33","observacoes":"","kmPercorridos":10},{"id":"ROT-0389","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-10","pedidoPor":"Machado","destino":"Bomba de Combustivel","periodo":"T","carga":"sem carga","condutor":"Leonardo","kmInicio":176940,"horaInicio":"14:46","kmFim":176948,"horaFim":"15:38","observacoes":"","kmPercorridos":8},{"id":"ROT-0390","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-10","pedidoPor":"Joao Silva","destino":"Leroy Merlin","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":296355,"horaInicio":"14:51","kmFim":296367,"horaFim":"15:32","observacoes":"","kmPercorridos":12},{"id":"ROT-0391","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-10","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Andre Batista","kmInicio":172125,"horaInicio":"15:00","kmFim":172126,"horaFim":"15:23","observacoes":"","kmPercorridos":1},{"id":"ROT-0392","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296367,"horaInicio":"11:54","kmFim":296377,"horaFim":"12:40","observacoes":"","kmPercorridos":10},{"id":"ROT-0393","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-11","pedidoPor":"Joao Silva","destino":"Myforce Pneus Volta Barcelos","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":296377,"horaInicio":"10:00","kmFim":296386,"horaFim":"10:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0394","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-12","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296377,"horaInicio":"11:48","kmFim":296406,"horaFim":"12:41","observacoes":"","kmPercorridos":29},{"id":"ROT-0395","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-13","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296406,"horaInicio":"12:10","kmFim":296416,"horaFim":"13:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0396","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-13","pedidoPor":"Machado","destino":"AZ Leiria","periodo":"m/t","carga":"Material convençao","condutor":"Machado","kmInicio":176948,"horaInicio":"08:00","kmFim":177940,"horaFim":"19:00","observacoes":"","kmPercorridos":992},{"id":"ROT-0397","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-13","pedidoPor":"Joao Silva","destino":"Volta Barcelos","periodo":"M/T","carga":"varios volumes","condutor":"Mario","kmInicio":172126,"horaInicio":"08:15","kmFim":172791,"horaFim":"18:00","observacoes":"","kmPercorridos":665},{"id":"ROT-0398","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-14","pedidoPor":"Machado","destino":"Convenção AD","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":296416,"horaInicio":"06:00","kmFim":296619,"horaFim":"19:00","observacoes":"","kmPercorridos":203},{"id":"ROT-0399","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172792,"horaInicio":"11:17","kmFim":172802,"horaFim":"11:57","observacoes":"","kmPercorridos":10},{"id":"ROT-0400","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-17","pedidoPor":"Tiago","destino":"Lavagem","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":296619,"horaInicio":"09:30","kmFim":296627,"horaFim":"17:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0401","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296627,"horaInicio":"11:20","kmFim":296637,"horaFim":"11:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0402","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-18","pedidoPor":"Joao Silva","destino":"","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":296637,"horaInicio":"15:18","kmFim":296649,"horaFim":"16:00","observacoes":"","kmPercorridos":12},{"id":"ROT-0403","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-19","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Fabio Vaz","kmInicio":172802,"horaInicio":"09:33","kmFim":172803,"horaFim":"09:46","observacoes":"","kmPercorridos":1},{"id":"ROT-0404","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296637,"horaInicio":"10:54","kmFim":296647,"horaFim":"11:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0405","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-20","pedidoPor":"Machado","destino":"Volta Barcelos","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":172803,"horaInicio":"10:30","kmFim":173019,"horaFim":"17:00","observacoes":"","kmPercorridos":216},{"id":"ROT-0406","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-20","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"3 paletes","condutor":"Zezito","kmInicio":177940,"horaInicio":"15:40","kmFim":177941,"horaFim":"16:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0407","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-20","pedidoPor":"Machado","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":296647,"horaInicio":"15:18","kmFim":296711,"horaFim":"15:41","observacoes":"","kmPercorridos":64},{"id":"ROT-0408","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-21","pedidoPor":"Machado","destino":"Bragainox","periodo":"M","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":177941,"horaInicio":"09:30","kmFim":177961,"horaFim":"11:05","observacoes":"","kmPercorridos":20},{"id":"ROT-0409","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296711,"horaInicio":"11:09","kmFim":296722,"horaFim":"11:58","observacoes":"","kmPercorridos":11},{"id":"ROT-0410","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-21","pedidoPor":"Machado","destino":"Bragainox","periodo":"T","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":177961,"horaInicio":"15:15","kmFim":177983,"horaFim":"16:51","observacoes":"","kmPercorridos":22},{"id":"ROT-0411","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-21","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296739,"horaInicio":"16:25","kmFim":296752,"horaFim":"17:20","observacoes":"","kmPercorridos":13},{"id":"ROT-0412","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-22","pedidoPor":"Machado","destino":"AZ Leiria","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":296752,"horaInicio":"08:00","kmFim":297311,"horaFim":"19:00","observacoes":"","kmPercorridos":559},{"id":"ROT-0413","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297311,"horaInicio":"11:12","kmFim":297321,"horaFim":"11:58","observacoes":"","kmPercorridos":10},{"id":"ROT-0414","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-25","pedidoPor":"Avelino","destino":"Soarauto - Ac. Soares Geme","periodo":"M","carga":"4 paletes","condutor":"André Batista","kmInicio":177983,"horaInicio":"09:32","kmFim":178015,"horaFim":"11:21","observacoes":"","kmPercorridos":32},{"id":"ROT-0415","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-25","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":297321,"horaInicio":"16:25","kmFim":297329,"horaFim":"17:27","observacoes":"","kmPercorridos":8},{"id":"ROT-0416","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297329,"horaInicio":"11:14","kmFim":297338,"horaFim":"11:57","observacoes":"","kmPercorridos":9},{"id":"ROT-0417","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"4 paletes","condutor":"Teles","kmInicio":178015,"horaInicio":"14:54","kmFim":178016,"horaFim":"15:24","observacoes":"","kmPercorridos":1},{"id":"ROT-0418","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-27","pedidoPor":"Elisabete","destino":"CTT","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":173019,"horaInicio":"11:12","kmFim":173021,"horaFim":"11:46","observacoes":"","kmPercorridos":2},{"id":"ROT-0419","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-27","pedidoPor":"Joao Silva","destino":"Soarauto","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":173021,"horaInicio":"14:46","kmFim":173022,"horaFim":"14:54","observacoes":"","kmPercorridos":1},{"id":"ROT-0420","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-27","pedidoPor":"André Veloso","destino":"Soarauto","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":297338,"horaInicio":"15:30","kmFim":297340,"horaFim":"15:48","observacoes":"","kmPercorridos":2},{"id":"ROT-0421","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297340,"horaInicio":"11:04","kmFim":297358,"horaFim":"11:40","observacoes":"","kmPercorridos":18},{"id":"ROT-0422","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-28","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Teles","kmInicio":178016,"horaInicio":"15:00","kmFim":178022,"horaFim":"15:14","observacoes":"","kmPercorridos":6},{"id":"ROT-0423","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297359,"horaInicio":"12:11","kmFim":297368,"horaFim":"13:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0424","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Teles","kmInicio":173022,"horaInicio":"09:32","kmFim":173022,"horaFim":"09:46","observacoes":"","kmPercorridos":0},{"id":"ROT-0425","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-03","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":297368,"horaInicio":"11:00","kmFim":297380,"horaFim":"11:28","observacoes":"","kmPercorridos":12},{"id":"ROT-0426","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297380,"horaInicio":"11:32","kmFim":297389,"horaFim":"12:26","observacoes":"","kmPercorridos":9},{"id":"ROT-0427","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-04","pedidoPor":"Machado","destino":"Sucata","periodo":"T","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":178022,"horaInicio":"14:43","kmFim":178043,"horaFim":"16:20","observacoes":"","kmPercorridos":21},{"id":"ROT-0428","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297389,"horaInicio":"11:55","kmFim":297399,"horaFim":"12:41","observacoes":"","kmPercorridos":10},{"id":"ROT-0429","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Assistencia em viagem","periodo":"M","carga":"sem carga","condutor":"Ricardo","kmInicio":297399,"horaInicio":"09:00","kmFim":297410,"horaFim":"09:37","observacoes":"","kmPercorridos":11},{"id":"ROT-0430","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297410,"horaInicio":"10:34","kmFim":297421,"horaFim":"11:29","observacoes":"","kmPercorridos":11},{"id":"ROT-0431","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Deslocaçao a Casa","periodo":"M","carga":"sem carga","condutor":"Machado","kmInicio":297421,"horaInicio":"13:00","kmFim":297429,"horaFim":"14:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0432","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":297429,"horaInicio":"15:15","kmFim":297442,"horaFim":"15:45","observacoes":"","kmPercorridos":13},{"id":"ROT-0433","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Inspeção","periodo":"M","carga":"sem carga","condutor":"Joao Fernandes","kmInicio":297442,"horaInicio":"09:43","kmFim":297450,"horaFim":"10:41","observacoes":"","kmPercorridos":8},{"id":"ROT-0434","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":297450,"horaInicio":"11:20","kmFim":297461,"horaFim":"11:37","observacoes":"","kmPercorridos":11},{"id":"ROT-0435","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":173022,"horaInicio":"16:00","kmFim":173037,"horaFim":"16:28","observacoes":"","kmPercorridos":15},{"id":"ROT-0436","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Gonçalo","kmInicio":297461,"horaInicio":"16:00","kmFim":297474,"horaFim":"16:35","observacoes":"","kmPercorridos":13},{"id":"ROT-0437","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297474,"horaInicio":"11:29","kmFim":297484,"horaFim":"12:03","observacoes":"","kmPercorridos":10},{"id":"ROT-0438","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-11","pedidoPor":"Avelino","destino":"Acessorios Soares Geme","periodo":"T","carga":"2 paletes","condutor":"Teles","kmInicio":178043,"horaInicio":"15:30","kmFim":178076,"horaFim":"16:10","observacoes":"","kmPercorridos":33},{"id":"ROT-0439","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-12","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":178076,"horaInicio":"11:00","kmFim":178130,"horaFim":"12:03","observacoes":"","kmPercorridos":54},{"id":"ROT-0440","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-12","pedidoPor":"Elisabete","destino":"Bancos","periodo":"m","carga":"sem carga","condutor":"Elisabete","kmInicio":297484,"horaInicio":"11:15","kmFim":297494,"horaFim":"13:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0441","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-12","pedidoPor":"Machado","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Teles","kmInicio":173037,"horaInicio":"14:39","kmFim":173037,"horaFim":"15:09","observacoes":"","kmPercorridos":0},{"id":"ROT-0442","viatura":"Toyota Prius","matricula":"05-QR-43","data":"12/12/2025","pedidoPor":"Joao Silva","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":294494,"horaInicio":"15:12","kmFim":297515,"horaFim":"16:15","observacoes":"","kmPercorridos":3021},{"id":"ROT-0443","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-15","pedidoPor":"Joao Silva","destino":"Agencia aluguer automovel","periodo":"M","carga":"sem carga","condutor":"Andre Veloso","kmInicio":297515,"horaInicio":"09:24","kmFim":297593,"horaFim":"10:46","observacoes":"","kmPercorridos":78},{"id":"ROT-0444","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-15","pedidoPor":"Rafael","destino":"ferro velho","periodo":"M","carga":"varios volumes","condutor":"Cunha","kmInicio":178130,"horaInicio":"09:33","kmFim":178150,"horaFim":"11:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0445","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-15","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":178150,"horaInicio":"14:31","kmFim":178261,"horaFim":"17:19","observacoes":"","kmPercorridos":111},{"id":"ROT-0446","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-16","pedidoPor":"Elisabete","destino":"Gabinte / Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297593,"horaInicio":"09:15","kmFim":297604,"horaFim":"10:01","observacoes":"","kmPercorridos":11},{"id":"ROT-0447","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-16","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"M","carga":"6 paletes","condutor":"Joao Fernandes","kmInicio":178261,"horaInicio":"09:30","kmFim":178375,"horaFim":"12:20","observacoes":"","kmPercorridos":114},{"id":"ROT-0448","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-16","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":178375,"horaInicio":"14:32","kmFim":178486,"horaFim":"16:52","observacoes":"","kmPercorridos":111},{"id":"ROT-0449","viatura":"Toyota Prius","matricula":"05-QR-43","data":"17-12-2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297604,"horaInicio":"10:30","kmFim":297614,"horaFim":"11:37","observacoes":"","kmPercorridos":10},{"id":"ROT-0450","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"17-12-2025","pedidoPor":"Leonel","destino":"Sucata","periodo":"M","carga":"varios volumes","condutor":"Simba","kmInicio":178486,"horaInicio":"10:40","kmFim":178506,"horaFim":"11:45","observacoes":"","kmPercorridos":20},{"id":"ROT-0451","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-17","pedidoPor":"Avelino","destino":"Acessorios Soares Geme","periodo":"T","carga":"3 paletes","condutor":"Simba","kmInicio":178506,"horaInicio":"14:30","kmFim":178535,"horaFim":"15:30","observacoes":"","kmPercorridos":29},{"id":"ROT-0452","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-18","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"varios volumes","condutor":"Rafael","kmInicio":178535,"horaInicio":"09:30","kmFim":178555,"horaFim":"10:42","observacoes":"","kmPercorridos":20},{"id":"ROT-0453","viatura":"Toyota Prius","matricula":"05-QR-43","data":"18/12/2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297614,"horaInicio":"11:00","kmFim":297625,"horaFim":"11:52","observacoes":"","kmPercorridos":11},{"id":"ROT-0454","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-18","pedidoPor":"Avelino","destino":"Gaiafor","periodo":"T","carga":"5 paletes","condutor":"Leo","kmInicio":178555,"horaInicio":"13:00","kmFim":178690,"horaFim":"16:23","observacoes":"","kmPercorridos":135},{"id":"ROT-0455","viatura":"Toyota Prius","matricula":"05-QR-43","data":"19-12-2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297625,"horaInicio":"10:34","kmFim":297635,"horaFim":"11:35","observacoes":"","kmPercorridos":10},{"id":"ROT-0456","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"19/12/2025","pedidoPor":"Machado","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Andre Costa","kmInicio":173037,"horaInicio":"13:00","kmFim":173055,"horaFim":"14:30","observacoes":"","kmPercorridos":18},{"id":"ROT-0457","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"19/12/2025","pedidoPor":"Machado","destino":"Reivax","periodo":"T","carga":"sem carga","condutor":"Carlos Pinto","kmInicio":173055,"horaInicio":"15::45:00","kmFim":173065,"horaFim":"16:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0458","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-19","pedidoPor":"Avelino","destino":"Gaiafor","periodo":"T","carga":"5 paletes","condutor":"Teles","kmInicio":178690,"horaInicio":"15:30","kmFim":178839,"horaFim":"17:40","observacoes":"","kmPercorridos":149},{"id":"ROT-0459","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-22","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":173065,"horaInicio":"10:48","kmFim":173066,"horaFim":"11:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0460","viatura":"Toyota Prius","matricula":"05-QR-43","data":"","pedidoPor":"Joao Silva","destino":"","periodo":"M/T","carga":"sem carga","condutor":"Joao Silva","kmInicio":297635,"horaInicio":"09:00","kmFim":297875,"horaFim":"19:00","observacoes":"","kmPercorridos":240},{"id":"ROT-0461","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"22-12-2025","pedidoPor":"Machado","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173066,"horaInicio":"12:30","kmFim":173083,"horaFim":"14:30","observacoes":"","kmPercorridos":17},{"id":"ROT-0462","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"23-12-2025","pedidoPor":"Tiago","destino":"Inspeção","periodo":"M","carga":"sem carga","condutor":"Rui Bernardo","kmInicio":178839,"horaInicio":"09:31","kmFim":178907,"horaFim":"10:38","observacoes":"","kmPercorridos":68},{"id":"ROT-0463","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"23/12/2025","pedidoPor":"Cesar","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Cesar","kmInicio":173066,"horaInicio":"11:30","kmFim":173096,"horaFim":"11:54","observacoes":"","kmPercorridos":30},{"id":"ROT-0464","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"26/12/2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":173096,"horaInicio":"11:20","kmFim":173110,"horaFim":"12:10","observacoes":"","kmPercorridos":14},{"id":"ROT-0465","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-26","pedidoPor":"Jose Miguel","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173110,"horaInicio":"13:00","kmFim":173126,"horaFim":"14:24","observacoes":"","kmPercorridos":16},{"id":"ROT-0466","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-29","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Batista","kmInicio":173126,"horaInicio":"09:37","kmFim":173130,"horaFim":"09:57","observacoes":"","kmPercorridos":4},{"id":"ROT-0467","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297875,"horaInicio":"11:00","kmFim":297887,"horaFim":"11:54","observacoes":"","kmPercorridos":12},{"id":"ROT-0468","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-29","pedidoPor":"Jose Miguel","destino":"Manutençao","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173126,"horaInicio":"13:00","kmFim":173144,"horaFim":"14:25","observacoes":"","kmPercorridos":18},{"id":"ROT-0469","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-30","pedidoPor":"Avelino","destino":"Primo/acesoares","periodo":"T","carga":"1+1 palete","condutor":"Batista","kmInicio":178907,"horaInicio":"14:30","kmFim":178946,"horaFim":"16:35","observacoes":"","kmPercorridos":39},{"id":"ROT-0470","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-31","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Batista","kmInicio":178946,"horaInicio":"09:45","kmFim":178947,"horaFim":"10:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0471","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-31","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M","carga":"varios volumes","condutor":"Micael","kmInicio":173144,"horaInicio":"08:15","kmFim":173229,"horaFim":"09:30","observacoes":"","kmPercorridos":85},{"id":"ROT-0472","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M/T","carga":"varios volumes","condutor":"Micael","kmInicio":173229,"horaInicio":"08:15","kmFim":173270,"horaFim":"09:25","observacoes":"","kmPercorridos":41},{"id":"ROT-0473","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-01-02","pedidoPor":"Joao Silva","destino":"Vila Real","periodo":"M","carga":"sem carga","condutor":"Jose Miguel","kmInicio":297887,"horaInicio":"11:24","kmFim":298220,"horaFim":"14:00","observacoes":"","kmPercorridos":333},{"id":"ROT-0474","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"Joao Silva","destino":"","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":173270,"horaInicio":"12:30","kmFim":173284,"horaFim":"14:15","observacoes":"","kmPercorridos":14},{"id":"ROT-0475","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M/T","carga":"varios volumes","condutor":"Micael/leo","kmInicio":173284,"horaInicio":"16:00","kmFim":173326,"horaFim":"17:27","observacoes":"","kmPercorridos":42},{"id":"ROT-0478","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-26","pedidoPor":"Machado","destino":"Expomecanica","periodo":"m/t","carga":"sem carga","condutor":"Fabio Silva","kmInicio":181945,"horaInicio":"08:00","kmFim":182799,"horaFim":"18:20","observacoes":"","kmPercorridos":854},{"id":"ROT-0479","viatura":"Toyota Prius","matricula":"05-QR-43","data":"27-28/06/2026","pedidoPor":"Tiago","destino":"Mecanico","periodo":"m/t","carga":"sem carga","condutor":"Tiago","kmInicio":304801,"horaInicio":"09:00","kmFim":304815,"horaFim":"10:28","observacoes":"","kmPercorridos":14},{"id":"ROT-0480","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-27","pedidoPor":"Tiago","destino":"Mecanico","periodo":"Tarde","carga":"sem carga","condutor":"Tiago","kmInicio":178983,"horaInicio":"17:10","kmFim":178994,"horaFim":"17:35","observacoes":"","kmPercorridos":11},{"id":"ROT-0481","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-27","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":178994,"horaInicio":"09:00","kmFim":179002,"horaFim":"09:42","observacoes":"","kmPercorridos":8},{"id":"ROT-0482","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"27/28 - 06/2026","pedidoPor":"Machado","destino":"Volta Amares 08h","periodo":"m","carga":"varios Volumes","condutor":"Gonçalo","kmInicio":179002,"horaInicio":"08:00","kmFim":179331,"horaFim":"18:15","observacoes":"","kmPercorridos":329},{"id":"ROT-0483","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-28","pedidoPor":"Machado","destino":"Expomecanica","periodo":"M","carga":"Sem carga","condutor":"Machado","kmInicio":304815,"horaInicio":"08:30","kmFim":305283,"horaFim":"10:20","observacoes":"","kmPercorridos":468},{"id":"ROT-0484","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-01","pedidoPor":"Machado","destino":"Volta Guimaraes","periodo":"m/t","carga":"varios Volumes","condutor":"Fabio Vaz / Rui Fernandes","kmInicio":179331,"horaInicio":"08:00","kmFim":179646,"horaFim":"18:00","observacoes":"","kmPercorridos":315},{"id":"ROT-0485","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-02","pedidoPor":"Machado","destino":"Deslocação a casa / Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Machado","kmInicio":305283,"horaInicio":"12:00","kmFim":305291,"horaFim":"14:32","observacoes":"Dia 03/06/2026","kmPercorridos":8},{"id":"ROT-0486","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-03","pedidoPor":"Machado","destino":"Primopeças","periodo":"m","carga":"1 palete","condutor":"Micael","kmInicio":179646,"horaInicio":"09:40","kmFim":179670,"horaFim":"10:35","observacoes":"","kmPercorridos":24},{"id":"ROT-0487","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Avelino","kmInicio":182799,"horaInicio":"14:32","kmFim":182800,"horaFim":"14:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0488","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":305291,"horaInicio":"12:20","kmFim":305301,"horaFim":"13:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0489","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-05","pedidoPor":"Machado","destino":"Volta Amares","periodo":"m/t","carga":"sem carga","condutor":"Diana / Aguinaldo","kmInicio":179670,"horaInicio":"08:00","kmFim":179756,"horaFim":"14:00","observacoes":"","kmPercorridos":86},{"id":"ROT-0490","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-05","pedidoPor":"Machado","destino":"Barcelpeças","periodo":"Tarde","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":182800,"horaInicio":"15:10","kmFim":182853,"horaFim":"16:32","observacoes":"","kmPercorridos":53},{"id":"ROT-0491","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-06","pedidoPor":"Machado","destino":"Inovpeças","periodo":"M","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":182853,"horaInicio":"09:15","kmFim":182965,"horaFim":"10:55","observacoes":"","kmPercorridos":112},{"id":"ROT-0492","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-08","pedidoPor":"Machado","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Machado","kmInicio":179756,"horaInicio":"13:00","kmFim":179764,"horaFim":"14:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0493","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":305301,"horaInicio":"14:30","kmFim":305313,"horaFim":"15:22","observacoes":"","kmPercorridos":12},{"id":"ROT-0494","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-09","pedidoPor":"Machado","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Micael","kmInicio":305301,"horaInicio":"14:38","kmFim":305312,"horaFim":"14:52","observacoes":"","kmPercorridos":11},{"id":"ROT-0495","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-09","pedidoPor":"Machado","destino":"Barcelpeças","periodo":"Tarde","carga":"3 paletes","condutor":"Leonardo","kmInicio":182965,"horaInicio":"15:30","kmFim":183020,"horaFim":"16:58","observacoes":"","kmPercorridos":55}],
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
  // Firebase-only: não carregamos dados da app do localStorage.
  // O estado real vem sempre da Firestore depois do login Firebase.
  return ensureStateShape(seedData());
}
function ensureStateShape(appState){
  const base = seedData();
  appState.settings = { ...base.settings, ...(appState.settings || {}) };
  appState.auditLogs = Array.isArray(appState.auditLogs) ? appState.auditLogs : [];
  appState.backups = Array.isArray(appState.backups) ? appState.backups : [];
  appState.users = (appState.users || []).map(u => {
    const next = { pageAccess:{}, actionAccess:{}, permissions:{}, status:'Ativo', role:'Operador', ...u };
    next.permissions = normalizeUserPermissions(next);
    return next;
  });
  appState.contactGroups = Array.isArray(appState.contactGroups) ? appState.contactGroups : [];
  appState.suppliers = Array.isArray(appState.suppliers) ? appState.suppliers : [];
  appState.routes = Array.isArray(appState.routes) ? appState.routes : [];
  appState.vehicles = Array.isArray(appState.vehicles) ? appState.vehicles : deriveVehiclesFromRoutes(appState.routes || []);
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
    badge.textContent = status;
    const cls = status.includes('ligado') ? 'green' : (status.includes('guardar') ? 'blue' : 'orange');
    badge.className = `badge ${cls}`;
  }
}

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
    toast(`Erro Firebase: nada foi gravado${code}.`);
    return false;
  } finally {
    cloudSaveInProgress = false;
  }
}
function canSyncCollectionKey(stateKey){
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
    contactGroups:'contactos',
    calls:'pedidos'
  };
  const pageId = pageByKey[stateKey] || currentPage;
  return canAction('add', pageId) || canAction('edit', pageId) || canAction('delete', pageId);
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
    firebaseLoadedKeys = new Set();
    const entries = Object.entries(FIREBASE_COLLECTIONS)
      .filter(([stateKey]) => canLoadCollectionKey(stateKey))
      .filter(([stateKey]) => !['auditLogs','backups'].includes(stateKey) || options.full === true);
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
  const normalizeDate = value => value?.toDate ? value.toDate().toISOString() : value;
  return {
    ...doc,
    createdAt: normalizeDate(doc.createdAt),
    updatedAt: normalizeDate(doc.updatedAt)
  };
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
  const renderers = { dashboard, 'nova-chamada': novaChamada, pedidos, clientes, contactos, fornecedores, rotas, orcamentos, agenda, stock, relatorios, users, 'configs-user': configsUser, config };
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
  const isAllOpen = allDirectoryGroupsOpen();
  return `<div class="directory-control-bar">
    <button class="btn primary directory-toggle-all-btn" id="toggleAllDirectoryBtn" type="button">${isAllOpen ? 'Fechar Tudo' : 'Abrir Tudo'}</button>
    <span>${groups.length} secção(ões) no diretório</span>
  </div>
  <div class="directory-simple-view">${warehouses.map(armazem => {
    const sections = grouped[armazem].sort((a,b)=>contactSection(a).localeCompare(contactSection(b),'pt'));
    const total = sections.reduce((sum,g)=>sum + (g.contactos || []).length, 0);
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
  const fbStatus = firebaseStatus();
  const statusBadge = `<span class="badge ${firebaseSessionOk ? 'green' : (firebaseReady ? 'orange' : 'orange')}">${esc(fbStatus)}</span>`;
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
  const addCard = canEdit ? `<div class="routes-left-column">
    <div class="card compact-form-card clean-side-card">
      <div class="card-head clean-card-head"><div><h3>Nova rota</h3><span class="muted">Escolhe a viatura e a matrícula entra sozinha</span></div></div>
      <form id="routeForm" class="simple-stack-form route-form">
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
      </form>
    </div>

    <div class="card compact-form-card clean-side-card vehicle-file-card">
      <div class="card-head clean-card-head"><div><h3>Ficha viatura</h3><span class="muted">Criar viatura para usar no select</span></div></div>
      <form id="vehicleForm" class="simple-stack-form vehicle-form">
        <input class="field" name="viatura" placeholder="Nome da viatura" required>
        <input class="field" name="matricula" placeholder="Matrícula" required>
        <div class="mini-two-fields"><input class="field" name="marca" placeholder="Marca"><input class="field" name="modelo" placeholder="Modelo"></div>
        <textarea name="observacoes" placeholder="Observações"></textarea>
        <button class="btn primary full" type="submit">Guardar viatura</button>
      </form>
      ${vehiclesMiniTable()}
    </div>
  </div>` : '';
  return `<div class="grid ${canEdit ? 'two split-form-list clean-page-layout routes-layout' : 'single-list'} routes-page clean-module-page">
    ${addCard}
    <div class="card clean-main-card routes-main-card">
      <div class="clean-page-head">
        <div><span class="clean-eyebrow">Rotas</span><h3>Mapa de serviços</h3></div>
        <div class="clean-stats"><span><b>${rows.length}</b> registos</span><span><b>${totalKm}</b> km</span><span><b>${vehicles.length}</b> viaturas</span></div>
      </div>
      ${!canEdit ? '<div class="readonly-note">Modo leitura: podes consultar rotas, mas não podes adicionar nem editar.</div>' : ''}
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
function bindRoutes(){
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
        ['id','ID'], ['codigoCliente','Código Cliente'], ['nome','Nome'], ['telefone','Telefone'], ['email','Email'], ['notas','Notas']
      ]
    },
    contactos: {
      key:'contactGroups', title:'Diretório de Contactos', file:'diretorio-contactos', prefix:'DIR', edit:()=>canEditOperational(), flattened:true,
      fields:[
        ['groupId','ID Secção'], ['contactId','ID Contacto'], ['armazem','Armazém / Local'], ['seccao','Secção / Sessão'], ['nome','Nome Contacto'], ['extensao','Extensão'], ['telemovel','Telemóvel'], ['telefone','Telefone'], ['email','Email'], ['local','Local / Empresa']
      ]
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
  if(id==='rotas') bindRoutes();
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

  qsa('[data-toggle-contact-group]').forEach(btn=>btn.addEventListener('click',()=>{
    normalizeContactDirectory();
    const group = (state.contactGroups || []).find(g=>g.id===btn.dataset.toggleContactGroup);
    if(!group) return;
    group.aberto = !group.aberto;
    setDirectoryRuntimeOpen(group.id, group.aberto);

    // Toggle visual local, sem redesenhar a página.
    btn.classList.toggle('active', group.aberto);
    const warehouse = btn.closest('.warehouse-simple-card');
    const panel = warehouse?.querySelector(`.directory-section-simple [data-add-contact-section="${group.id}"]`)?.closest('.directory-section-simple');
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
  await firebaseDb.collection(FIREBASE_COLLECTIONS.users).doc(user.id).set(payload, { merge:true });
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
    batch.set(ref, {
      ...user,
      email:String(user.email || '').toLowerCase(),
      permissions:user.permissions,
      pageAccess:{},
      actionAccess:{},
      permissionsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      permissionsUpdatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: state.currentUser?.email || firebaseAuth.currentUser?.email || ''
    }, { merge:true });
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
  const fields = Object.entries(item).filter(([k])=>!['id','pageAccess','actionAccess','permissions'].includes(k));
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
    routes: [{"id":"ROT-0001","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-03","pedidoPor":"André Veloso","destino":"Segurança Social","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":287999,"horaInicio":"14:45","kmFim":288010,"horaFim":"16:38","observacoes":"","kmPercorridos":11},{"id":"ROT-0002","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-04","pedidoPor":"Joao Silva","destino":"Soarauto","periodo":"Tarde","carga":"2 paletes","condutor":"Simba","kmInicio":169176,"horaInicio":"15:00","kmFim":169190,"horaFim":"15:25","observacoes":"","kmPercorridos":14},{"id":"ROT-0003","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-04","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"André Costa","kmInicio":288010,"horaInicio":"15:13","kmFim":288011,"horaFim":"15:36","observacoes":"","kmPercorridos":1},{"id":"ROT-0004","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-05","pedidoPor":"Joao Silva","destino":"Barcelpeças Barcelos","periodo":"Manha","carga":"Levantar palete","condutor":"Simba","kmInicio":169190,"horaInicio":"09:45","kmFim":169242,"horaFim":"11:00","observacoes":"","kmPercorridos":52},{"id":"ROT-0005","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288011,"horaInicio":"10:08","kmFim":288023,"horaFim":"11:10","observacoes":"","kmPercorridos":12},{"id":"ROT-0006","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-05","pedidoPor":"Claudia","destino":"Gabinete de Contabilidade","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":153782,"horaInicio":"16:04","kmFim":153791,"horaFim":"16:41","observacoes":"","kmPercorridos":9},{"id":"ROT-0007","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-06","pedidoPor":"André Veloso","destino":"Boleia Abel","periodo":"M","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288023,"horaInicio":"10:35","kmFim":288028,"horaFim":"10:42","observacoes":"","kmPercorridos":5},{"id":"ROT-0008","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-06","pedidoPor":"Claudia","destino":"Compras","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":153791,"horaInicio":"15:23","kmFim":153795,"horaFim":"15:45","observacoes":"","kmPercorridos":4},{"id":"ROT-0009","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-06","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Leo","kmInicio":153795,"horaInicio":"15:45","kmFim":153796,"horaFim":"15:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0010","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288028,"horaInicio":"11:15","kmFim":288039,"horaFim":"12:10","observacoes":"","kmPercorridos":11},{"id":"ROT-0011","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-07","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"4 paletes","condutor":"Fabio Vaz","kmInicio":169242,"horaInicio":"14:36","kmFim":169243,"horaFim":"15:24","observacoes":"","kmPercorridos":1},{"id":"ROT-0012","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288039,"horaInicio":"11:13","kmFim":288049,"horaFim":"12:10","observacoes":"","kmPercorridos":10},{"id":"ROT-0013","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-10","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Fabio Vaz","kmInicio":153796,"horaInicio":"14:43","kmFim":153796,"horaFim":"15:00","observacoes":"","kmPercorridos":0},{"id":"ROT-0014","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-10","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"André Costa","kmInicio":169243,"horaInicio":"14:43","kmFim":169355,"horaFim":"16:21","observacoes":"","kmPercorridos":112},{"id":"ROT-0015","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-11","pedidoPor":"Simba","destino":"levantar enc.na Volvo","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":153796,"horaInicio":"09:48","kmFim":153797,"horaFim":"09:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0016","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288049,"horaInicio":"11:25","kmFim":288057,"horaFim":"11:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0017","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-12","pedidoPor":"Carlos Avelino","destino":"Invospeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":169243,"horaInicio":"09:30","kmFim":169469,"horaFim":"11:25","observacoes":"","kmPercorridos":226},{"id":"ROT-0018","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-12","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"André Costa","kmInicio":169469,"horaInicio":"14:35","kmFim":169580,"horaFim":"16:20","observacoes":"","kmPercorridos":111},{"id":"ROT-0019","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-12","pedidoPor":"Rui","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Rui","kmInicio":153797,"horaInicio":"14:40","kmFim":153797,"horaFim":"14:50","observacoes":"","kmPercorridos":0},{"id":"ROT-0020","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-12","pedidoPor":"Lucinda","destino":"Advogada","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288057,"horaInicio":"15:30","kmFim":288065,"horaFim":"18:20","observacoes":"","kmPercorridos":8},{"id":"ROT-0021","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"André Costa","kmInicio":169580,"horaInicio":"09:45","kmFim":169581,"horaFim":"10:06","observacoes":"","kmPercorridos":1},{"id":"ROT-0022","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Claudia","destino":"Estação cp","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288065,"horaInicio":"10:18","kmFim":288072,"horaFim":"10:45","observacoes":"","kmPercorridos":7},{"id":"ROT-0023","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Elisabete","destino":"almoço Draª Rita Palma","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288072,"horaInicio":"12:36","kmFim":288073,"horaFim":"14:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0024","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Cunha","kmInicio":153797,"horaInicio":"14:35","kmFim":153798,"horaFim":"14:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0025","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-13","pedidoPor":"Elisabete","destino":"Estação CP","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288073,"horaInicio":"17:38","kmFim":288080,"horaFim":"18:15","observacoes":"","kmPercorridos":7},{"id":"ROT-0026","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288080,"horaInicio":"11:57","kmFim":288091,"horaFim":"13:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0027","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-14","pedidoPor":"Joao Silva","destino":"Mecanico","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":288091,"horaInicio":"15:04","kmFim":288095,"horaFim":"15:38","observacoes":"","kmPercorridos":4},{"id":"ROT-0028","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-14","pedidoPor":"Simba","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Simba","kmInicio":153798,"horaInicio":"16:00","kmFim":153880,"horaFim":"17:55","observacoes":"","kmPercorridos":82},{"id":"ROT-0029","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-17","pedidoPor":"Joao Silva","destino":"My Force","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":288095,"horaInicio":"10:50","kmFim":288112,"horaFim":"11;15:00","observacoes":"","kmPercorridos":17},{"id":"ROT-0030","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-17","pedidoPor":"Joao Silva","destino":"Barcelpeças Barcelos","periodo":"Tarde","carga":"1 palete","condutor":"Simba","kmInicio":154073,"horaInicio":"15:20","kmFim":154127,"horaFim":"16:28","observacoes":"","kmPercorridos":54},{"id":"ROT-0031","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-18","pedidoPor":"Joao Silva","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Zezito","kmInicio":169581,"horaInicio":"09:45","kmFim":169654,"horaFim":"11:15","observacoes":"","kmPercorridos":73},{"id":"ROT-0032","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288112,"horaInicio":"10:28","kmFim":288123,"horaFim":"11:15","observacoes":"","kmPercorridos":11},{"id":"ROT-0033","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-19","pedidoPor":"Avelino","destino":"Soarauto","periodo":"Tarde","carga":"5 paletes","condutor":"Micael","kmInicio":169654,"horaInicio":"14:39","kmFim":169655,"horaFim":"15:25","observacoes":"","kmPercorridos":1},{"id":"ROT-0034","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288123,"horaInicio":"14:00","kmFim":288132,"horaFim":"14:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0035","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288132,"horaInicio":"10:50","kmFim":288141,"horaFim":"12:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0036","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-20","pedidoPor":"Machado","destino":"Sucata","periodo":"Tarde","carga":"2 paletes","condutor":"Cunha","kmInicio":169655,"horaInicio":"15:00","kmFim":169675,"horaFim":"16:03","observacoes":"","kmPercorridos":20},{"id":"ROT-0037","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-21","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"5 paletes","condutor":"Leo","kmInicio":169675,"horaInicio":"09:45","kmFim":169789,"horaFim":"11:50","observacoes":"","kmPercorridos":114},{"id":"ROT-0038","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288141,"horaInicio":"11:30","kmFim":288151,"horaFim":"12:05","observacoes":"","kmPercorridos":10},{"id":"ROT-0039","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"Serviço externo","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288151,"horaInicio":"10:45","kmFim":288167,"horaFim":"11:20","observacoes":"","kmPercorridos":16},{"id":"ROT-0040","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"M","carga":"sem carga","condutor":"André Veloso","kmInicio":288167,"horaInicio":"12:45","kmFim":288187,"horaFim":"14:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0041","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154156,"horaInicio":"11:56","kmFim":154165,"horaFim":"12:33","observacoes":"","kmPercorridos":9},{"id":"ROT-0042","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-24","pedidoPor":"André Veloso","destino":"Trabalho / Casa","periodo":"Tarde","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288187,"horaInicio":"19:10","kmFim":288218,"horaFim":"07:55","observacoes":"","kmPercorridos":31},{"id":"ROT-0043","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-25","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288218,"horaInicio":"11:17","kmFim":288228,"horaFim":"11:53","observacoes":"","kmPercorridos":10},{"id":"ROT-0044","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-25","pedidoPor":"André Veloso","destino":"Trabalho / Casa","periodo":"Tarde","carga":"sem carga","condutor":"Andre Veloso","kmInicio":288228,"horaInicio":"19:15","kmFim":288257,"horaFim":"07:55","observacoes":"","kmPercorridos":29},{"id":"ROT-0045","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288257,"horaInicio":"12:02","kmFim":288272,"horaFim":"12:47","observacoes":"","kmPercorridos":15},{"id":"ROT-0046","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-26","pedidoPor":"Joao Silva","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":288272,"horaInicio":"19:00","kmFim":288425,"horaFim":"12:44","observacoes":"","kmPercorridos":153},{"id":"ROT-0047","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-27","pedidoPor":"Simba","destino":"pichelaria palmeira","periodo":"Tarde","carga":"sem carga","condutor":"Simba","kmInicio":154165,"horaInicio":"15:26","kmFim":154173,"horaFim":"15:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0048","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-02-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154173,"horaInicio":"10:49","kmFim":154183,"horaFim":"11:41","observacoes":"","kmPercorridos":10},{"id":"ROT-0049","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-02-28","pedidoPor":"AVelino","destino":"Soarauto","periodo":"Tarde","carga":"6 paletes","condutor":"Teles","kmInicio":169789,"horaInicio":"16:00","kmFim":169790,"horaFim":"16:47","observacoes":"","kmPercorridos":1},{"id":"ROT-0050","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-02-28","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"Tarde","carga":"Sem carga","condutor":"Claudia","kmInicio":288425,"horaInicio":"16:40","kmFim":288434,"horaFim":"17:12","observacoes":"","kmPercorridos":9},{"id":"ROT-0051","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288434,"horaInicio":"11:12","kmFim":288446,"horaFim":"11:48","observacoes":"","kmPercorridos":12},{"id":"ROT-0052","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288446,"horaInicio":"10:39","kmFim":288455,"horaFim":"11:23","observacoes":"","kmPercorridos":9},{"id":"ROT-0053","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-05","pedidoPor":"Avelino","destino":"Barcelpeças/Trapotop","periodo":"Tarde","carga":"6 paletes","condutor":"Costa","kmInicio":169790,"horaInicio":"14:35","kmFim":169899,"horaFim":"17:03","observacoes":"","kmPercorridos":109},{"id":"ROT-0054","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"Machado","destino":"Correios / Agarb","periodo":"Tarde","carga":"sem carga","condutor":"Zezito","kmInicio":288455,"horaInicio":"15:24","kmFim":288456,"horaFim":"16:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0055","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-05","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":288456,"horaInicio":"16:59","kmFim":288464,"horaFim":"17:37","observacoes":"","kmPercorridos":8},{"id":"ROT-0056","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":154183,"horaInicio":"09:05","kmFim":154192,"horaFim":"09:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0057","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Claudia","destino":"Estação CP","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":288464,"horaInicio":"10:20","kmFim":288470,"horaFim":"10:45","observacoes":"","kmPercorridos":6},{"id":"ROT-0058","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Elisabete","destino":"almoço Draª Rita","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288470,"horaInicio":"12:40","kmFim":288471,"horaFim":"14:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0059","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-06","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"Tarde","carga":"2 paletes","condutor":"Andre´Costa","kmInicio":169899,"horaInicio":"14:40","kmFim":169951,"horaFim":"15:47","observacoes":"","kmPercorridos":52},{"id":"ROT-0060","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Rafael Cunha","kmInicio":288471,"horaInicio":"15:12","kmFim":288472,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0061","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Tiago","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Fabio Vaz","kmInicio":154192,"horaInicio":"13:15","kmFim":154283,"horaFim":"15:17","observacoes":"","kmPercorridos":91},{"id":"ROT-0062","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-06","pedidoPor":"Tiago","destino":"Volta Barcelos","periodo":"Tarde","carga":"Varios Volumes","condutor":"Simba","kmInicio":154283,"horaInicio":"16:00","kmFim":154370,"horaFim":"17:55","observacoes":"","kmPercorridos":87},{"id":"ROT-0063","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-06","pedidoPor":"Elisabete","destino":"Estação CP","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":288472,"horaInicio":"17:38","kmFim":288478,"horaFim":"18:00","observacoes":"","kmPercorridos":6},{"id":"ROT-0064","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":288478,"horaInicio":"09:25","kmFim":288482,"horaFim":"09:41","observacoes":"","kmPercorridos":4},{"id":"ROT-0065","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-07","pedidoPor":"Tiago","destino":"Volta Amares Vila Verde","periodo":"M","carga":"Varios Volumes","condutor":"Micael","kmInicio":154370,"horaInicio":"10:30","kmFim":154497,"horaFim":"11:43","observacoes":"","kmPercorridos":127},{"id":"ROT-0066","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"Sem carga","condutor":"Elisabete","kmInicio":288482,"horaInicio":"10:56","kmFim":288491,"horaFim":"11:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0067","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-07","pedidoPor":"André Veloso","destino":"Serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":288491,"horaInicio":"15:05","kmFim":288531,"horaFim":"17:00","observacoes":"","kmPercorridos":40},{"id":"ROT-0068","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":288531,"horaInicio":"11:30","kmFim":288540,"horaFim":"12:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0069","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-08","pedidoPor":"André Veloso","destino":"Gaiafor","periodo":"M","carga":"Paletes","condutor":"Rafael Cunha","kmInicio":169951,"horaInicio":"09:00","kmFim":170086,"horaFim":"11:00","observacoes":"","kmPercorridos":135},{"id":"ROT-0070","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-10","pedidoPor":"Avelino","destino":"Trapotop","periodo":"Tarde","carga":"2 paletes","condutor":"Fabio","kmInicio":170086,"horaInicio":"14:40","kmFim":170159,"horaFim":"16:18","observacoes":"","kmPercorridos":73},{"id":"ROT-0071","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-10","pedidoPor":"Machado","destino":"CTT","periodo":"M","carga":"um volume","condutor":"André Costa","kmInicio":288540,"horaInicio":"15:16","kmFim":288541,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0072","viatura":"Toyota Prius","matricula":"05-QR-43","data":"11-12 /03/2025","pedidoPor":"Jose Luis","destino":"Reparaçao carro habitual","periodo":"M/T","carga":"sem carga","condutor":"Jose Luis","kmInicio":288541,"horaInicio":"16:24","kmFim":289219,"horaFim":"16:30","observacoes":"","kmPercorridos":678},{"id":"ROT-0073","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-11","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"Tarde","carga":"sem carga","condutor":"Claudia","kmInicio":154497,"horaInicio":"14:45","kmFim":154505,"horaFim":"15:17","observacoes":"","kmPercorridos":8},{"id":"ROT-0074","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"Tarde","carga":"6 Paletes","condutor":"Cunha","kmInicio":170159,"horaInicio":"16:20","kmFim":170159,"horaFim":"16:51","observacoes":"","kmPercorridos":0},{"id":"ROT-0075","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-12","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Cunha","kmInicio":154505,"horaInicio":"15:20","kmFim":154506,"horaFim":"15:28","observacoes":"","kmPercorridos":1},{"id":"ROT-0076","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-13","pedidoPor":"Machado","destino":"Reivax","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":289219,"horaInicio":"09:35","kmFim":289230,"horaFim":"10:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0077","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-13","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289230,"horaInicio":"11:15","kmFim":289240,"horaFim":"11:54","observacoes":"","kmPercorridos":10},{"id":"ROT-0078","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-13","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"1 palete","condutor":"Mario","kmInicio":154506,"horaInicio":"14:45","kmFim":154507,"horaFim":"15:14","observacoes":"","kmPercorridos":1},{"id":"ROT-0079","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289240,"horaInicio":"09:30","kmFim":289244,"horaFim":"09:45","observacoes":"","kmPercorridos":4},{"id":"ROT-0080","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Machado","destino":"P.S.P","periodo":"M","carga":"1 bateria","condutor":"Rui","kmInicio":289244,"horaInicio":"09:56","kmFim":289253,"horaFim":"10:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0081","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289253,"horaInicio":"11:44","kmFim":289261,"horaFim":"12:43","observacoes":"","kmPercorridos":8},{"id":"ROT-0082","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-14","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 Paletes","condutor":"Simba","kmInicio":170159,"horaInicio":"10:00","kmFim":170275,"horaFim":"12:25","observacoes":"","kmPercorridos":116},{"id":"ROT-0083","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-14","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 Paletes","condutor":"Fabio SIlva","kmInicio":170275,"horaInicio":"14:40","kmFim":170387,"horaFim":"15:56","observacoes":"","kmPercorridos":112},{"id":"ROT-0084","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-15","pedidoPor":"Joao Silva","destino":"Inovpeças Lousada","periodo":"M","carga":"5 Paletes","condutor":"Leo","kmInicio":170387,"horaInicio":"09:00","kmFim":170499,"horaFim":"12:00","observacoes":"","kmPercorridos":112},{"id":"ROT-0085","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289261,"horaInicio":"09:45","kmFim":289265,"horaFim":"10:00","observacoes":"","kmPercorridos":4},{"id":"ROT-0086","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289265,"horaInicio":"11:59","kmFim":289276,"horaFim":"12:45","observacoes":"","kmPercorridos":11},{"id":"ROT-0087","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Elisabete","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":289276,"horaInicio":"14:52","kmFim":289277,"horaFim":"15:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0088","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Tiago","kmInicio":289277,"horaInicio":"17:35","kmFim":289281,"horaFim":"17:54","observacoes":"","kmPercorridos":4},{"id":"ROT-0089","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289281,"horaInicio":"10:44","kmFim":289291,"horaFim":"11:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0090","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-19","pedidoPor":"Tiago","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289291,"horaInicio":"12:00","kmFim":289301,"horaFim":"12:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0091","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-20","pedidoPor":"Joao silva","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":289301,"horaInicio":"10:27","kmFim":289309,"horaFim":"10:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0092","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-21","pedidoPor":"Miga","destino":"Gaiafor","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":170499,"horaInicio":"09:32","kmFim":170636,"horaFim":"12:15","observacoes":"","kmPercorridos":137},{"id":"ROT-0093","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289309,"horaInicio":"11:54","kmFim":289322,"horaFim":"13:19","observacoes":"","kmPercorridos":13},{"id":"ROT-0094","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-21","pedidoPor":"Miga","destino":"Gaiafor VNG","periodo":"Tarde","carga":"4 paletes","condutor":"Teles","kmInicio":170636,"horaInicio":"14:28","kmFim":170776,"horaFim":"17:24","observacoes":"","kmPercorridos":140},{"id":"ROT-0095","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-26","pedidoPor":"André Veloso","destino":"serviço externo","periodo":"Tarde","carga":"sem carga","condutor":"André Veloso","kmInicio":289360,"horaInicio":"16:45","kmFim":289390,"horaFim":"17:29","observacoes":"","kmPercorridos":30},{"id":"ROT-0096","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-26","pedidoPor":"Joao Silva","destino":"levar o Cesar","periodo":"Tarde","carga":"sem carga","condutor":"Joao Silva","kmInicio":154507,"horaInicio":"17:18","kmFim":155118,"horaFim":"18:00","observacoes":"","kmPercorridos":611},{"id":"ROT-0097","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-27","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"1 palete","condutor":"Zezito","kmInicio":155118,"horaInicio":"11:14","kmFim":155142,"horaFim":"11:57","observacoes":"","kmPercorridos":24},{"id":"ROT-0098","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-28","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Leo","kmInicio":155142,"horaInicio":"09:35","kmFim":155142,"horaFim":"09:48","observacoes":"","kmPercorridos":0},{"id":"ROT-0099","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289390,"horaInicio":"12:00","kmFim":289403,"horaFim":"12:40","observacoes":"","kmPercorridos":13},{"id":"ROT-0100","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-28","pedidoPor":"Miga","destino":"Soarauto","periodo":"Tarde","carga":"4 paletes","condutor":"Ruben","kmInicio":170854,"horaInicio":"14:35","kmFim":170855,"horaFim":"15:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0101","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-31","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":170855,"horaInicio":"09:35","kmFim":170971,"horaFim":"11:40","observacoes":"","kmPercorridos":116},{"id":"ROT-0102","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-31","pedidoPor":"Joao Silva","destino":"buscar Cesar","periodo":"M","carga":"sem carga","condutor":"Joao silva","kmInicio":289403,"horaInicio":"10:51","kmFim":289410,"horaFim":"11:09","observacoes":"","kmPercorridos":7},{"id":"ROT-0103","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-03-31","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289410,"horaInicio":"11:44","kmFim":289420,"horaFim":"12:22","observacoes":"","kmPercorridos":10},{"id":"ROT-0104","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-03-31","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"Tarde","carga":"6 paletes","condutor":"Teles","kmInicio":170971,"horaInicio":"14:33","kmFim":171082,"horaFim":"16:46","observacoes":"","kmPercorridos":111},{"id":"ROT-0105","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-03-31","pedidoPor":"Machado","destino":"Trabalho - Casa","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":155142,"horaInicio":"13:00","kmFim":155150,"horaFim":"14:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0106","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-01","pedidoPor":"Machado","destino":"Pichelaria-Palmeira","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":155150,"horaInicio":"09:35","kmFim":155160,"horaFim":"10:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0107","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-01","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"Tarde","carga":"4 paletes","condutor":"Teles","kmInicio":171082,"horaInicio":"14:39","kmFim":171137,"horaFim":"16:01","observacoes":"","kmPercorridos":55},{"id":"ROT-0108","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-01","pedidoPor":"Machado","destino":"CTT","periodo":"Tarde","carga":"sem carga","condutor":"Vaz","kmInicio":155160,"horaInicio":"15:15","kmFim":155161,"horaFim":"16:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0109","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289420,"horaInicio":"11:15","kmFim":289430,"horaFim":"12:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0110","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-02","pedidoPor":"Jose Miguel","destino":"Deslocaçao a casa","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":155161,"horaInicio":"12:00","kmFim":155184,"horaFim":"12:45","observacoes":"","kmPercorridos":23},{"id":"ROT-0111","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-03","pedidoPor":"Machado","destino":"Jantes Xavier","periodo":"M","carga":"sem carga","condutor":"Simba","kmInicio":155184,"horaInicio":"09:30","kmFim":155199,"horaFim":"10:07","observacoes":"","kmPercorridos":15},{"id":"ROT-0112","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 Paletes","condutor":"Zezito","kmInicio":171137,"horaInicio":"15:44","kmFim":171138,"horaFim":"16:25","observacoes":"","kmPercorridos":1},{"id":"ROT-0113","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"5 Paletes","condutor":"André Costa","kmInicio":171138,"horaInicio":"16:30","kmFim":171138,"horaFim":"16:53","observacoes":"","kmPercorridos":0},{"id":"ROT-0114","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289430,"horaInicio":"10:30","kmFim":289441,"horaFim":"11:15","observacoes":"","kmPercorridos":11},{"id":"ROT-0115","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-04","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":155199,"horaInicio":"11:10","kmFim":155208,"horaFim":"11:52","observacoes":"","kmPercorridos":9},{"id":"ROT-0116","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289441,"horaInicio":"09:30","kmFim":289452,"horaFim":"10:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0117","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289452,"horaInicio":"11:11","kmFim":289460,"horaFim":"11:40","observacoes":"","kmPercorridos":8},{"id":"ROT-0118","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-07","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"1 palete","condutor":"Rafael Cunha","kmInicio":155208,"horaInicio":"14:44","kmFim":155254,"horaFim":"15:33","observacoes":"","kmPercorridos":46},{"id":"ROT-0119","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-07","pedidoPor":"André Veloso","destino":"Bomba Combustivel","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":289460,"horaInicio":"17:10","kmFim":289471,"horaFim":"17:30","observacoes":"","kmPercorridos":11},{"id":"ROT-0120","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":289471,"horaInicio":"14:25","kmFim":289480,"horaFim":"15:02","observacoes":"","kmPercorridos":9},{"id":"ROT-0121","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-08","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Ruben","kmInicio":155254,"horaInicio":"15:22","kmFim":155255,"horaFim":"15:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0122","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-08","pedidoPor":"Claudia","destino":"serviço externo","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":289480,"horaInicio":"15:39","kmFim":289489,"horaFim":"16:03","observacoes":"","kmPercorridos":9},{"id":"ROT-0123","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-09","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Vaz","kmInicio":171138,"horaInicio":"09:10","kmFim":171250,"horaFim":"11:37","observacoes":"","kmPercorridos":112},{"id":"ROT-0124","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-09","pedidoPor":"André Veloso","destino":"Volta Guimaraes","periodo":"M","carga":"Varios Volumes","condutor":"Zezito","kmInicio":155255,"horaInicio":"08:15","kmFim":155510,"horaFim":"15:20","observacoes":"","kmPercorridos":255},{"id":"ROT-0125","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"André Veloso","destino":"Myforce Braga","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":289489,"horaInicio":"09:30","kmFim":289499,"horaFim":"09:52","observacoes":"","kmPercorridos":10},{"id":"ROT-0126","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289499,"horaInicio":"11:31","kmFim":289508,"horaFim":"12:06","observacoes":"","kmPercorridos":9},{"id":"ROT-0127","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-09","pedidoPor":"Machado","destino":"Myforce Braga","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":289508,"horaInicio":"15:10","kmFim":289517,"horaFim":"15:33","observacoes":"","kmPercorridos":9},{"id":"ROT-0128","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-10","pedidoPor":"Claudia","destino":"Estação C.P.","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289517,"horaInicio":"10:30","kmFim":289524,"horaFim":"10:43","observacoes":"","kmPercorridos":7},{"id":"ROT-0129","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-10","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"3 paletes","condutor":"André Costa","kmInicio":171250,"horaInicio":"11:28","kmFim":171251,"horaFim":"11:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0130","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289524,"horaInicio":"10:04","kmFim":289533,"horaFim":"11:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0131","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Fabio Silva","kmInicio":155510,"horaInicio":"15:53","kmFim":155511,"horaFim":"16:05","observacoes":"","kmPercorridos":1},{"id":"ROT-0132","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-14","pedidoPor":"Claudia","destino":"Gabinete contabilidade / Banco","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":289533,"horaInicio":"11:35","kmFim":289542,"horaFim":"12:17","observacoes":"","kmPercorridos":9},{"id":"ROT-0133","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-14","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155511,"horaInicio":"13:30","kmFim":155607,"horaFim":"17:00","observacoes":"","kmPercorridos":96},{"id":"ROT-0134","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-15","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289542,"horaInicio":"11:01","kmFim":289551,"horaFim":"11:45","observacoes":"","kmPercorridos":9},{"id":"ROT-0135","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-15","pedidoPor":"Miga","destino":"Trapotop","periodo":"T","carga":"3 paletes","condutor":"3 paletes","kmInicio":171251,"horaInicio":"14:30","kmFim":171326,"horaFim":"16:51","observacoes":"","kmPercorridos":75},{"id":"ROT-0136","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-15","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":289551,"horaInicio":"16:02","kmFim":289560,"horaFim":"16:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0137","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-15","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155607,"horaInicio":"08:15","kmFim":155757,"horaFim":"17:00","observacoes":"","kmPercorridos":150},{"id":"ROT-0138","viatura":"Toyota Prius","matricula":"05-QR-43","data":"15/04/2025-16/04/2025","pedidoPor":"Tiago","destino":"Deslocaçao a casa","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":289560,"horaInicio":"19:00","kmFim":289617,"horaFim":"08:30","observacoes":"","kmPercorridos":57},{"id":"ROT-0139","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-16","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289617,"horaInicio":"11:20","kmFim":289627,"horaFim":"11:58","observacoes":"","kmPercorridos":10},{"id":"ROT-0140","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-16","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155757,"horaInicio":"08:15","kmFim":155929,"horaFim":"16:48","observacoes":"","kmPercorridos":172},{"id":"ROT-0141","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-17","pedidoPor":"Miga","destino":"Gaiafor","periodo":"M","carga":"5 paletes","condutor":"zezito","kmInicio":171326,"horaInicio":"09:30","kmFim":171480,"horaFim":"12:31","observacoes":"","kmPercorridos":154},{"id":"ROT-0142","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-17","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M/T","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":289627,"horaInicio":"16:00","kmFim":289669,"horaFim":"17:06","observacoes":"","kmPercorridos":42},{"id":"ROT-0143","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"M","carga":"sem carga","condutor":"André Veloso","kmInicio":289669,"horaInicio":"09:36","kmFim":289736,"horaFim":"12:20","observacoes":"","kmPercorridos":67},{"id":"ROT-0144","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-18","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"4 paletes","condutor":"Rafael Cunha","kmInicio":171480,"horaInicio":"10:15","kmFim":171592,"horaFim":"12:06","observacoes":"","kmPercorridos":112},{"id":"ROT-0145","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Volta Amares","periodo":"M","carga":"Varios Volumes","condutor":"Ricardo","kmInicio":155929,"horaInicio":"10:00","kmFim":156171,"horaFim":"11:00","observacoes":"","kmPercorridos":242},{"id":"ROT-0146","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"T","carga":"sem carga","condutor":"andré Veloso","kmInicio":289736,"horaInicio":"15:00","kmFim":289898,"horaFim":"17:00","observacoes":"","kmPercorridos":162},{"id":"ROT-0147","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-18","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Rafael Cunha","kmInicio":171592,"horaInicio":"14:33","kmFim":171711,"horaFim":"17:05","observacoes":"","kmPercorridos":119},{"id":"ROT-0148","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-18","pedidoPor":"André Veloso","destino":"Volta Barcelos","periodo":"T","carga":"Varios Volumes","condutor":"Fabio Silva","kmInicio":156171,"horaInicio":"15:00","kmFim":156262,"horaFim":"17:00","observacoes":"","kmPercorridos":91},{"id":"ROT-0149","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-04-21","pedidoPor":"Machado","destino":"Deslocação almoço","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":156262,"horaInicio":"13:00","kmFim":156273,"horaFim":"15:04","observacoes":"","kmPercorridos":11},{"id":"ROT-0150","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":289898,"horaInicio":"10:40","kmFim":289909,"horaFim":"11:32","observacoes":"","kmPercorridos":11},{"id":"ROT-0151","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-22","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":171711,"horaInicio":"09:30","kmFim":171712,"horaFim":"10:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0152","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"Joao Carlos","destino":"Medicina no Trabalho","periodo":"M","carga":"sem carga","condutor":"Paulo Pimenta","kmInicio":289909,"horaInicio":"13:45","kmFim":289918,"horaFim":"15:03","observacoes":"","kmPercorridos":9},{"id":"ROT-0153","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-22","pedidoPor":"André Veloso","destino":"Entrega de Convites","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":289918,"horaInicio":"15:10","kmFim":290071,"horaFim":"17:58","observacoes":"","kmPercorridos":153},{"id":"ROT-0154","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"César","destino":"Ida ao Mecanico","periodo":"M","carga":"sem carga","condutor":"César","kmInicio":290071,"horaInicio":"09:00","kmFim":290088,"horaFim":"09:28","observacoes":"","kmPercorridos":17},{"id":"ROT-0155","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Machado","destino":"Peritagem Carro volta","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":290088,"horaInicio":"09:53","kmFim":290099,"horaFim":"10:28","observacoes":"","kmPercorridos":11},{"id":"ROT-0156","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"","carga":"sem carga","condutor":"Joao Silva","kmInicio":290099,"horaInicio":"10:20","kmFim":290142,"horaFim":"14:30","observacoes":"","kmPercorridos":43},{"id":"ROT-0157","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-23","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":290142,"horaInicio":"15:22","kmFim":290144,"horaFim":"15:45","observacoes":"","kmPercorridos":2},{"id":"ROT-0158","viatura":"Toyota Prius","matricula":"05-QR-43","data":"23/04/2025-24/04/2025","pedidoPor":"André Veloso","destino":"Ida ao Mecanico","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":290144,"horaInicio":"18:08","kmFim":290226,"horaFim":"09:00","observacoes":"","kmPercorridos":82},{"id":"ROT-0159","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":290226,"horaInicio":"14:38","kmFim":290235,"horaFim":"15:43","observacoes":"","kmPercorridos":9},{"id":"ROT-0160","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-24","pedidoPor":"Tiago","destino":"Master escapes","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":171712,"horaInicio":"15:08","kmFim":171724,"horaFim":"15:40","observacoes":"","kmPercorridos":12},{"id":"ROT-0161","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"28/04/2025 - 29/04/2025","pedidoPor":"Tiago","destino":"Master escapes","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":171724,"horaInicio":"09:00","kmFim":171737,"horaFim":"15:00","observacoes":"","kmPercorridos":13},{"id":"ROT-0162","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290235,"horaInicio":"10:28","kmFim":290250,"horaFim":"11:27","observacoes":"","kmPercorridos":15},{"id":"ROT-0163","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":290250,"horaInicio":"12:10","kmFim":290259,"horaFim":"12:40","observacoes":"","kmPercorridos":9},{"id":"ROT-0164","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-29","pedidoPor":"Tiago","destino":"Master escapes","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":290259,"horaInicio":"14:30","kmFim":290270,"horaFim":"15:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0165","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-04-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290270,"horaInicio":"09:32","kmFim":290284,"horaFim":"10:17","observacoes":"","kmPercorridos":14},{"id":"ROT-0166","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-30","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"5 paletes","condutor":"Simba","kmInicio":171737,"horaInicio":"09:35","kmFim":171763,"horaFim":"10:35","observacoes":"","kmPercorridos":26},{"id":"ROT-0167","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-04-30","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"4 paletes","condutor":"Mario","kmInicio":171763,"horaInicio":"14:39","kmFim":171764,"horaFim":"15:19","observacoes":"","kmPercorridos":1},{"id":"ROT-0168","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-05","pedidoPor":"Miga","destino":"Gaiafor","periodo":"T","carga":"6 paletes","condutor":"Fabio Silva","kmInicio":171764,"horaInicio":"14:42","kmFim":171899,"horaFim":"16:50","observacoes":"","kmPercorridos":135},{"id":"ROT-0169","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-05","pedidoPor":"Andre Veloso","destino":"7 fontes","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":290284,"horaInicio":"17:15","kmFim":290293,"horaFim":"17:57","observacoes":"","kmPercorridos":9},{"id":"ROT-0170","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-06","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":171899,"horaInicio":"09:00","kmFim":171899,"horaFim":"09:30","observacoes":"","kmPercorridos":0},{"id":"ROT-0171","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290293,"horaInicio":"12:10","kmFim":290303,"horaFim":"12:44","observacoes":"","kmPercorridos":10},{"id":"ROT-0172","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-06","pedidoPor":"Avelino","destino":"Trapotop","periodo":"T","carga":"3 paletes","condutor":"Fabio Silva","kmInicio":171899,"horaInicio":"14:30","kmFim":171974,"horaFim":"16:26","observacoes":"","kmPercorridos":75},{"id":"ROT-0173","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-07","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":171974,"horaInicio":"09:40","kmFim":171996,"horaFim":"10:36","observacoes":"","kmPercorridos":22},{"id":"ROT-0174","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":290303,"horaInicio":"10:37","kmFim":290313,"horaFim":"11:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0175","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Machado","destino":"almoço","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":290313,"horaInicio":"13:00","kmFim":290321,"horaFim":"14:28","observacoes":"","kmPercorridos":8},{"id":"ROT-0176","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-07","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Fabio Silva","kmInicio":290321,"horaInicio":"15:21","kmFim":290322,"horaFim":"15:45","observacoes":"","kmPercorridos":1},{"id":"ROT-0177","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":290322,"horaInicio":"09:41","kmFim":290324,"horaFim":"10:04","observacoes":"","kmPercorridos":2},{"id":"ROT-0178","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Joao Silva","destino":"Stapples","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":290324,"horaInicio":"11:27","kmFim":290338,"horaFim":"12:00","observacoes":"","kmPercorridos":14},{"id":"ROT-0179","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"","carga":"sem carga","condutor":"Avelino","kmInicio":290338,"horaInicio":"13:30","kmFim":290347,"horaFim":"14:00","observacoes":"","kmPercorridos":9},{"id":"ROT-0180","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-08","pedidoPor":"Claudia","destino":"Stapples / Compras","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":290347,"horaInicio":"15:04","kmFim":290367,"horaFim":"17:35","observacoes":"","kmPercorridos":20},{"id":"ROT-0181","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"08/05/2025 - 09/05/2025","pedidoPor":"Machado","destino":"Deslocação a casa","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":171996,"horaInicio":"19:00","kmFim":172009,"horaFim":"09:30","observacoes":"","kmPercorridos":13},{"id":"ROT-0182","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-09","pedidoPor":"Claudia","destino":"40 anos Bragalis","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":290367,"horaInicio":"10:00","kmFim":290392,"horaFim":"19:00","observacoes":"","kmPercorridos":25},{"id":"ROT-0183","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-09","pedidoPor":"Avelino","destino":"Barcelpeças Barcelos","periodo":"T","carga":"4 paletes","condutor":"Fabio Silva","kmInicio":172009,"horaInicio":"14:40","kmFim":172066,"horaFim":"15:52","observacoes":"","kmPercorridos":57},{"id":"ROT-0184","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-12","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Leonardo","kmInicio":172066,"horaInicio":"11:50","kmFim":172067,"horaFim":"12:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0185","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-13","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":172067,"horaInicio":"09:31","kmFim":172178,"horaFim":"11:20","observacoes":"","kmPercorridos":111},{"id":"ROT-0186","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-13","pedidoPor":"Avelino","destino":"Barcelpeças Barcelos","periodo":"T","carga":"5 Paletes","condutor":"Fabio Silva","kmInicio":172178,"horaInicio":"14:45","kmFim":172236,"horaFim":"16:05","observacoes":"","kmPercorridos":58},{"id":"ROT-0187","viatura":"Toyota Prius","matricula":"05-QR-43","data":"x","pedidoPor":"Jose Luis","destino":"Carro Substituiçao","periodo":"x","carga":"sem carga","condutor":"Jose Luis","kmInicio":290392,"horaInicio":"x","kmFim":291420,"horaFim":"x","observacoes":"","kmPercorridos":1028},{"id":"ROT-0188","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-15","pedidoPor":"Rafael","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Rafael","kmInicio":290420,"horaInicio":"14:00","kmFim":290424,"horaFim":"15:30","observacoes":"","kmPercorridos":4},{"id":"ROT-0189","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291489,"horaInicio":"11:07","kmFim":291498,"horaFim":"11:40","observacoes":"","kmPercorridos":9},{"id":"ROT-0190","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-17","pedidoPor":"Fabio Silva","destino":"Deslocação a casa","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":172526,"horaInicio":"09:00","kmFim":172542,"horaFim":"12:00","observacoes":"","kmPercorridos":16},{"id":"ROT-0191","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-19","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"André Costa","kmInicio":172542,"horaInicio":"15:00","kmFim":172653,"horaFim":"16:18","observacoes":"","kmPercorridos":111},{"id":"ROT-0192","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-20","pedidoPor":"Carlos Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Cunha","kmInicio":172653,"horaInicio":"10:00","kmFim":172654,"horaFim":"10:43","observacoes":"","kmPercorridos":1},{"id":"ROT-0193","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-20","pedidoPor":"Andre Veloso","destino":"Volta Amares","periodo":"M","carga":"Varios volumes","condutor":"Fabio Vaz","kmInicio":291498,"horaInicio":"10:30","kmFim":291530,"horaFim":"11:22","observacoes":"","kmPercorridos":32},{"id":"ROT-0194","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291530,"horaInicio":"10:48","kmFim":291539,"horaFim":"11:44","observacoes":"","kmPercorridos":9},{"id":"ROT-0195","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-22","pedidoPor":"Claudia","destino":"Estação de comboios","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":291539,"horaInicio":"10:55","kmFim":291546,"horaFim":"11:17","observacoes":"","kmPercorridos":7},{"id":"ROT-0196","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-22","pedidoPor":"Elisabete","destino":"Estação de comboios","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":291546,"horaInicio":"17.40:00","kmFim":291552,"horaFim":"18:00","observacoes":"","kmPercorridos":6},{"id":"ROT-0197","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-23","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":291552,"horaInicio":"11,20:00","kmFim":291562,"horaFim":"12:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0198","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":291562,"horaInicio":"09:38","kmFim":291571,"horaFim":"10:15","observacoes":"","kmPercorridos":9},{"id":"ROT-0199","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Andre Veloso","destino":"Consulta","periodo":"T","carga":"sem carga","condutor":"Andre","kmInicio":291571,"horaInicio":"12:30","kmFim":291605,"horaFim":"14:30","observacoes":"","kmPercorridos":34},{"id":"ROT-0200","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Joao Carlos","destino":"Sogima","periodo":"T","carga":"4 pistões","condutor":"Tiago","kmInicio":291605,"horaInicio":"14:30","kmFim":291618,"horaFim":"15:05","observacoes":"","kmPercorridos":13},{"id":"ROT-0201","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-26","pedidoPor":"Machado","destino":"PSP","periodo":"T","carga":"1 volume","condutor":"Cunha","kmInicio":291618,"horaInicio":"15:05","kmFim":291626,"horaFim":"15:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0202","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-29","pedidoPor":"Joao Silva","destino":"Serviço Externo","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":291626,"horaInicio":"09:00","kmFim":292191,"horaFim":".....","observacoes":"","kmPercorridos":565},{"id":"ROT-0203","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-29","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":172654,"horaInicio":"09:48","kmFim":172680,"horaFim":"10:57","observacoes":"","kmPercorridos":26},{"id":"ROT-0204","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-30","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":160512,"horaInicio":"14:43","kmFim":160522,"horaFim":"15:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0205","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-02","pedidoPor":"André","destino":"Team building","periodo":"M","carga":"sem carga","condutor":"André","kmInicio":292191,"horaInicio":"10:35","kmFim":292197,"horaFim":"11:20","observacoes":"","kmPercorridos":6},{"id":"ROT-0206","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-02","pedidoPor":"Carlos Avelino","destino":"Gaiafor","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":172680,"horaInicio":"14:30","kmFim":172822,"horaFim":"17:00","observacoes":"","kmPercorridos":142},{"id":"ROT-0207","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Tiago","destino":"Ethos Braga","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":292197,"horaInicio":"08:30","kmFim":292209,"horaFim":"09:00","observacoes":"","kmPercorridos":12},{"id":"ROT-0208","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292209,"horaInicio":"11:06","kmFim":292215,"horaFim":"11:50","observacoes":"","kmPercorridos":6},{"id":"ROT-0209","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":292215,"horaInicio":"15:11","kmFim":292293,"horaFim":"15:34","observacoes":"","kmPercorridos":78},{"id":"ROT-0210","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-03","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"T","carga":"Varios volumes","condutor":"Zezito","kmInicio":292293,"horaInicio":"16:00","kmFim":292515,"horaFim":"18:30","observacoes":"","kmPercorridos":222},{"id":"ROT-0211","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-03","pedidoPor":"Carlos Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Joao Fernandes","kmInicio":172822,"horaInicio":"11:00","kmFim":172823,"horaFim":"11:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0212","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-04","pedidoPor":"Joao Silva","destino":"Deslocação a casa","periodo":"M","carga":"sem carga","condutor":"Fabio Silva","kmInicio":172823,"horaInicio":"13:00","kmFim":172832,"horaFim":"14:00","observacoes":"","kmPercorridos":9},{"id":"ROT-0213","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-04","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Leo","kmInicio":172832,"horaInicio":"14:40","kmFim":172833,"horaFim":"16:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0214","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":292515,"horaInicio":"11:50","kmFim":292528,"horaFim":"12:20","observacoes":"","kmPercorridos":13},{"id":"ROT-0215","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-05","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":172833,"horaInicio":"15:11","kmFim":172945,"horaFim":"17:00","observacoes":"","kmPercorridos":112},{"id":"ROT-0216","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Joao Silva","destino":"Levantar carrinha","periodo":"T","carga":"sem carga","condutor":"Ricardo","kmInicio":292528,"horaInicio":"17:00","kmFim":292624,"horaFim":"17:55","observacoes":"","kmPercorridos":96},{"id":"ROT-0217","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-05","pedidoPor":"Andre Veloso","destino":"Team building","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":292624,"horaInicio":"17:55","kmFim":292635,"horaFim":"19:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0218","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-06","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Simba","kmInicio":172945,"horaInicio":"09:36","kmFim":173061,"horaFim":"11:28","observacoes":"","kmPercorridos":116},{"id":"ROT-0219","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":173061,"horaInicio":"09:40","kmFim":173173,"horaFim":"11:40","observacoes":"","kmPercorridos":112},{"id":"ROT-0220","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Joao Silva","destino":"Team building","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":292635,"horaInicio":"10:17","kmFim":292648,"horaFim":"11:30","observacoes":"","kmPercorridos":13},{"id":"ROT-0221","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292648,"horaInicio":"11:38","kmFim":292658,"horaFim":"12:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0222","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":173173,"horaInicio":"14:30","kmFim":173287,"horaFim":"16:22","observacoes":"","kmPercorridos":114},{"id":"ROT-0223","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-09","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":292658,"horaInicio":"15:00","kmFim":292659,"horaFim":"15:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0224","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-09","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"1 palete","condutor":"Fabio Silva","kmInicio":173287,"horaInicio":"17:00","kmFim":173310,"horaFim":"17:45","observacoes":"","kmPercorridos":23},{"id":"ROT-0225","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-11","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"2 paletes","condutor":"Fabio Silva","kmInicio":173310,"horaInicio":"09:47","kmFim":173311,"horaFim":"10:13","observacoes":"","kmPercorridos":1},{"id":"ROT-0226","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-11","pedidoPor":"Joao Silva","destino":"Confiauto","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":292659,"horaInicio":"09:15","kmFim":292679,"horaFim":"10:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0227","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292679,"horaInicio":"10:45","kmFim":292689,"horaFim":"11:19","observacoes":"","kmPercorridos":10},{"id":"ROT-0228","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-13","pedidoPor":"Fabio Silva","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Fabio Silva","kmInicio":292689,"horaInicio":"14:30","kmFim":292697,"horaFim":"15:15","observacoes":"","kmPercorridos":8},{"id":"ROT-0229","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-16","pedidoPor":"Joao Silva","destino":"Confiauto","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":292697,"horaInicio":"10:10","kmFim":292708,"horaFim":"10:48","observacoes":"","kmPercorridos":11},{"id":"ROT-0230","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-16","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292708,"horaInicio":"11:15","kmFim":292719,"horaFim":"12:00","observacoes":"","kmPercorridos":11},{"id":"ROT-0231","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-16","pedidoPor":"Avelino","destino":"Gaiafor Gaia","periodo":"T","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":173311,"horaInicio":"14:38","kmFim":173445,"horaFim":"16:49","observacoes":"","kmPercorridos":134},{"id":"ROT-0232","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292719,"horaInicio":"09:18","kmFim":292728,"horaFim":"09:44","observacoes":"","kmPercorridos":9},{"id":"ROT-0233","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"Tiago","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Ricardo","kmInicio":163595,"horaInicio":"09:44","kmFim":163600,"horaFim":"10:04","observacoes":"","kmPercorridos":5},{"id":"ROT-0234","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"André Costa","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"André Costa","kmInicio":163600,"horaInicio":"14:00","kmFim":163607,"horaFim":"15:09","observacoes":"","kmPercorridos":7},{"id":"ROT-0235","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-17","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Ruben","kmInicio":163607,"horaInicio":"15:33","kmFim":163608,"horaFim":"15:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0236","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"17/062025","pedidoPor":"Tiago","destino":"Ramoa","periodo":"T","carga":"sem carga","condutor":"Gomes","kmInicio":163608,"horaInicio":"18:30","kmFim":163612,"horaFim":"18:53","observacoes":"","kmPercorridos":4},{"id":"ROT-0237","viatura":"Toyota Prius","matricula":"05-QR-43","data":"17/062025","pedidoPor":"Tiago","destino":"Ramoa","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":292728,"horaInicio":"18:30","kmFim":292732,"horaFim":"18:53","observacoes":"","kmPercorridos":4},{"id":"ROT-0238","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292732,"horaInicio":"09:53","kmFim":292741,"horaFim":"10:22","observacoes":"","kmPercorridos":9},{"id":"ROT-0239","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292741,"horaInicio":"09:40","kmFim":292751,"horaFim":"10:46","observacoes":"","kmPercorridos":10},{"id":"ROT-0240","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-20","pedidoPor":"Machado","destino":"Sapol","periodo":"T","carga":"sem carga","condutor":"Rui Bernardo","kmInicio":163612,"horaInicio":"14:58","kmFim":163612,"horaFim":"15:08","observacoes":"","kmPercorridos":0},{"id":"ROT-0241","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-20","pedidoPor":"Avelino","destino":"Primopeças","periodo":"T","carga":"7 paletes","condutor":"Rui Bernardo","kmInicio":173445,"horaInicio":"15:14","kmFim":173468,"horaFim":"16:29","observacoes":"","kmPercorridos":23},{"id":"ROT-0242","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-23","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":163612,"horaInicio":"16:15","kmFim":163613,"horaFim":"16:39","observacoes":"","kmPercorridos":1},{"id":"ROT-0243","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-25","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"Baterias","condutor":"Rui  Fernandes","kmInicio":163613,"horaInicio":"09:05","kmFim":163614,"horaFim":"09:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0244","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-25","pedidoPor":"Avelino","destino":"Trapotop","periodo":"M","carga":"4 paletes","condutor":"Rui  Fernandes","kmInicio":173468,"horaInicio":"09:35","kmFim":173542,"horaFim":"10:53","observacoes":"","kmPercorridos":74},{"id":"ROT-0245","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-06-25","pedidoPor":"Andre Veloso","destino":"Repsol","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":292751,"horaInicio":"15:10","kmFim":292759,"horaFim":"1530:00","observacoes":"","kmPercorridos":8},{"id":"ROT-0246","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-25","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"5 paletes","condutor":"Cunha","kmInicio":173542,"horaInicio":"14:40","kmFim":173669,"horaFim":"16:45","observacoes":"","kmPercorridos":127},{"id":"ROT-0247","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-06-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Rui","kmInicio":173669,"horaInicio":"09:50","kmFim":173670,"horaFim":"10:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0248","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163614,"horaInicio":"10:18","kmFim":163623,"horaFim":"10:49","observacoes":"","kmPercorridos":9},{"id":"ROT-0249","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-06-30","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":163623,"horaInicio":"14:36","kmFim":163623,"horaFim":"14:49","observacoes":"","kmPercorridos":0},{"id":"ROT-0250","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163623,"horaInicio":"10:20","kmFim":163635,"horaFim":"11:07","observacoes":"","kmPercorridos":12},{"id":"ROT-0251","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":163635,"horaInicio":"12:05","kmFim":163644,"horaFim":"12:31","observacoes":"","kmPercorridos":9},{"id":"ROT-0252","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-01","pedidoPor":"Miga","destino":"Gaiafor Gaia","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":173670,"horaInicio":"14:35","kmFim":173796,"horaFim":"16:40","observacoes":"","kmPercorridos":126},{"id":"ROT-0253","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Jose Miguel","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":163644,"horaInicio":"13:45","kmFim":163650,"horaFim":"14:50","observacoes":"","kmPercorridos":6},{"id":"ROT-0254","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-01","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Rafael Silva","kmInicio":163650,"horaInicio":"15:15","kmFim":163659,"horaFim":"15:35","observacoes":"","kmPercorridos":9},{"id":"ROT-0255","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-02","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"7 paletes","condutor":"Rui Bernardo","kmInicio":173796,"horaInicio":"15:06","kmFim":173797,"horaFim":"15:51","observacoes":"","kmPercorridos":1},{"id":"ROT-0256","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-02","pedidoPor":"Machado","destino":"Volta Guimarães","periodo":"M/T","carga":"varios Volumes","condutor":"Leonardo / Micael","kmInicio":163659,"horaInicio":"08:15","kmFim":164012,"horaFim":"15:15","observacoes":"","kmPercorridos":353},{"id":"ROT-0257","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-03","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Rui Bernardo","kmInicio":164012,"horaInicio":"14:38","kmFim":164012,"horaFim":"14:49","observacoes":"","kmPercorridos":0},{"id":"ROT-0258","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292759,"horaInicio":"10:55","kmFim":292769,"horaFim":"11:34","observacoes":"","kmPercorridos":10},{"id":"ROT-0259","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-04","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":292769,"horaInicio":"14:32","kmFim":292777,"horaFim":"15:14","observacoes":"","kmPercorridos":8},{"id":"ROT-0260","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-04","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":173797,"horaInicio":"14:45","kmFim":173908,"horaFim":"17:00","observacoes":"","kmPercorridos":111},{"id":"ROT-0261","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":292777,"horaInicio":"14:34","kmFim":292786,"horaFim":"15:09","observacoes":"","kmPercorridos":9},{"id":"ROT-0262","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-08","pedidoPor":"Miga","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"Zezito","kmInicio":173908,"horaInicio":"09:35","kmFim":174022,"horaFim":"11:42","observacoes":"","kmPercorridos":114},{"id":"ROT-0263","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-08","pedidoPor":"Rafael Silva","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Rafael Silva","kmInicio":164012,"horaInicio":"15:01","kmFim":164014,"horaFim":"15:18","observacoes":"","kmPercorridos":2},{"id":"ROT-0264","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":292786,"horaInicio":"10:28","kmFim":292796,"horaFim":"11:02","observacoes":"","kmPercorridos":10},{"id":"ROT-0265","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-09","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Zezito","kmInicio":174022,"horaInicio":"14:46","kmFim":174023,"horaFim":"15:19","observacoes":"","kmPercorridos":1},{"id":"ROT-0266","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-10","pedidoPor":"Miga","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Zezito","kmInicio":174023,"horaInicio":"09:31","kmFim":174096,"horaFim":"11:10","observacoes":"","kmPercorridos":73},{"id":"ROT-0267","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-10","pedidoPor":"Miga","destino":"Barcelpeças","periodo":"T","carga":"5 paletes","condutor":"Rui Bernardo","kmInicio":174096,"horaInicio":"14:29","kmFim":174145,"horaFim":"15:40","observacoes":"","kmPercorridos":49},{"id":"ROT-0268","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-11","pedidoPor":"Joao Silva","destino":"Serviço Externo","periodo":"M/T","carga":"sem carga","condutor":"Joao Silva","kmInicio":292796,"horaInicio":"09:00","kmFim":293016,"horaFim":"17:43","observacoes":"","kmPercorridos":220},{"id":"ROT-0269","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":164014,"horaInicio":"09:30","kmFim":164025,"horaFim":"10:38","observacoes":"","kmPercorridos":11},{"id":"ROT-0270","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-07-11","pedidoPor":"Jose Miguel","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":164025,"horaInicio":"14:00","kmFim":164032,"horaFim":"14:04","observacoes":"","kmPercorridos":7},{"id":"ROT-0271","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-07-12","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"T","carga":"5 paletes","condutor":"Fabio Silva","kmInicio":174145,"horaInicio":"09:00","kmFim":174201,"horaFim":"10:30","observacoes":"","kmPercorridos":56},{"id":"ROT-0272","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":293016,"horaInicio":"10:22","kmFim":293024,"horaFim":"10:59","observacoes":"","kmPercorridos":8},{"id":"ROT-0273","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Claudia","destino":"Gabinete contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":293024,"horaInicio":"11:13","kmFim":293032,"horaFim":"11:47","observacoes":"","kmPercorridos":8},{"id":"ROT-0274","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Andre Veloso","destino":"Consulta Medica","periodo":"M/T","carga":"sem carga","condutor":"André Veloso","kmInicio":293032,"horaInicio":"13:00","kmFim":293036,"horaFim":"14:00","observacoes":"","kmPercorridos":4},{"id":"ROT-0275","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Andre Veloso","destino":"Deslocação a Escola de Artes","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":293036,"horaInicio":"17:30","kmFim":293040,"horaFim":"17:37","observacoes":"","kmPercorridos":4},{"id":"ROT-0276","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":293040,"horaInicio":"09:23","kmFim":293049,"horaFim":"09:54","observacoes":"","kmPercorridos":9},{"id":"ROT-0277","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-07-15","pedidoPor":"Joao Leite","destino":"Medicina no Trabalho","periodo":"T","carga":"sem carga","condutor":"Joao Leite","kmInicio":293049,"horaInicio":"14:00","kmFim":293059,"horaFim":"16:34","observacoes":"","kmPercorridos":10},{"id":"ROT-0278","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-05-16","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":293059,"horaInicio":"09:11","kmFim":293060,"horaFim":"09:37","observacoes":"","kmPercorridos":1},{"id":"ROT-0279","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-16","pedidoPor":"Machado","destino":"P.S.P.","periodo":"M","carga":"sem carga","condutor":"Ruben","kmInicio":164032,"horaInicio":"09:32","kmFim":164048,"horaFim":"10:00","observacoes":"","kmPercorridos":16},{"id":"ROT-0280","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-16","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Simba","kmInicio":174201,"horaInicio":"15:13","kmFim":174201,"horaFim":"15:29","observacoes":"","kmPercorridos":0},{"id":"ROT-0281","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-05-17","pedidoPor":"Avelino","destino":"Acessorio Soares Geme","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":174201,"horaInicio":"09:33","kmFim":174234,"horaFim":"10:40","observacoes":"","kmPercorridos":33},{"id":"ROT-0282","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-05-17","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Leonardo","kmInicio":164048,"horaInicio":"14:40","kmFim":164048,"horaFim":"14:50","observacoes":"","kmPercorridos":0},{"id":"ROT-0284","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-16","pedidoPor":"Miga","destino":"Gaiafor Gaia","periodo":"T","carga":"5 paletes","condutor":"Teles","kmInicio":175910,"horaInicio":"15:00","kmFim":176107,"horaFim":"17:15","observacoes":"","kmPercorridos":197},{"id":"ROT-0285","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-17","pedidoPor":"Tiago","destino":"mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":294472,"horaInicio":"10:45","kmFim":294485,"horaFim":"11:15","observacoes":"","kmPercorridos":13},{"id":"ROT-0286","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-17","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Gonçalo","kmInicio":171043,"horaInicio":"15:15","kmFim":171044,"horaFim":"171044","observacoes":"","kmPercorridos":1},{"id":"ROT-0287","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-18","pedidoPor":"Miga","destino":"Trapotop","periodo":"M","carga":"3 paletes","condutor":"Teles","kmInicio":176107,"horaInicio":"09:30","kmFim":176180,"horaFim":"11:18","observacoes":"","kmPercorridos":73},{"id":"ROT-0288","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-18","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":171044,"horaInicio":"14:15","kmFim":171056,"horaFim":"14:55","observacoes":"","kmPercorridos":12},{"id":"ROT-0289","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-19","pedidoPor":"Miga","destino":"Soarauto","periodo":"M","carga":"5 paletes","condutor":"Teles","kmInicio":176180,"horaInicio":"09:48","kmFim":176181,"horaFim":"10:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0290","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-19","pedidoPor":"Elisabete","destino":"bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":294485,"horaInicio":"12:09","kmFim":294495,"horaFim":"13:10","observacoes":"","kmPercorridos":10},{"id":"ROT-0291","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-19","pedidoPor":"Andre Veloso","destino":"casa","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":171056,"horaInicio":"13:00","kmFim":171083,"horaFim":"14:12","observacoes":"","kmPercorridos":27},{"id":"ROT-0292","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-19","pedidoPor":"Machado","destino":"casa","periodo":"T","carga":"Estantes","condutor":"Machado","kmInicio":176181,"horaInicio":"16:00","kmFim":176199,"horaFim":"17:30","observacoes":"","kmPercorridos":18},{"id":"ROT-0293","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-22","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294495,"horaInicio":"11:22","kmFim":294505,"horaFim":"12:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0294","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-22","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Mario","kmInicio":171083,"horaInicio":"15:45","kmFim":171084,"horaFim":"15:50","observacoes":"","kmPercorridos":1},{"id":"ROT-0295","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-24","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Vaz","kmInicio":176199,"horaInicio":"10:08","kmFim":176200,"horaFim":"10:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0296","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-24","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294505,"horaInicio":"11:40","kmFim":294519,"horaFim":"12:39","observacoes":"","kmPercorridos":14},{"id":"ROT-0297","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-24","pedidoPor":"Andre Veloso","destino":"Escola do filho","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":294519,"horaInicio":"15:05","kmFim":294546,"horaFim":"16:09","observacoes":"","kmPercorridos":27},{"id":"ROT-0298","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-24","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Teles","kmInicio":171084,"horaInicio":"15:20","kmFim":171085,"horaFim":"15:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0299","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-24","pedidoPor":"Machado","destino":"Primopeças","periodo":"T","carga":"2 Paletes","condutor":"Batista","kmInicio":176200,"horaInicio":"15:35","kmFim":176228,"horaFim":"17:35","observacoes":"","kmPercorridos":28},{"id":"ROT-0300","viatura":"FIAt Doblo","matricula":"52-PM-78","data":"2025-09-25","pedidoPor":"Machado","destino":"AZ/PORTO","periodo":"M","carga":"Volumes","condutor":"Vaz","kmInicio":171085,"horaInicio":"10:00","kmFim":171124,"horaFim":"10:45","observacoes":"","kmPercorridos":39},{"id":"ROT-0301","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-25","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294546,"horaInicio":"12:05","kmFim":294560,"horaFim":"13:00","observacoes":"","kmPercorridos":14},{"id":"ROT-0302","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-25","pedidoPor":"Joao Carlos","destino":"Normed (Dmitri)","periodo":"T","carga":"sem carga","condutor":"Joao Carlos","kmInicio":294560,"horaInicio":"14:00","kmFim":294564,"horaFim":"14:55","observacoes":"","kmPercorridos":4},{"id":"ROT-0303","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-25","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Teles","kmInicio":171124,"horaInicio":"15.35:00","kmFim":171126,"horaFim":"16:00","observacoes":"","kmPercorridos":2},{"id":"ROT-0304","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Vaz","kmInicio":171126,"horaInicio":"10:45","kmFim":171127,"horaFim":"11:00","observacoes":"","kmPercorridos":1},{"id":"ROT-0305","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294564,"horaInicio":"11:33","kmFim":294575,"horaFim":"12:30","observacoes":"","kmPercorridos":11},{"id":"ROT-0306","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-26","pedidoPor":"Claudia","destino":"G.Contabilidade","periodo":"T","carga":"sem carga","condutor":"Caudia","kmInicio":294575,"horaInicio":"16:13","kmFim":294583,"horaFim":"17:00","observacoes":"","kmPercorridos":8},{"id":"ROT-0307","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Batista","kmInicio":171157,"horaInicio":"14:41","kmFim":171158,"horaFim":"14:52","observacoes":"","kmPercorridos":1},{"id":"ROT-0308","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-26","pedidoPor":"Machado","destino":"Braginox","periodo":"T","carga":"Ferro velho","condutor":"Marcelino","kmInicio":176228,"horaInicio":"16:00","kmFim":176251,"horaFim":"17:16","observacoes":"","kmPercorridos":23},{"id":"ROT-0309","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-28","pedidoPor":"Claudia","destino":"estação cp","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":294583,"horaInicio":"10:15","kmFim":294590,"horaFim":"10:45","observacoes":"","kmPercorridos":7},{"id":"ROT-0310","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-29","pedidoPor":"Leonel","destino":"Agarbe","periodo":"m","carga":"sem carga","condutor":"Leonel","kmInicio":294590,"horaInicio":"11:00","kmFim":294591,"horaFim":"11:26","observacoes":"","kmPercorridos":1},{"id":"ROT-0311","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-29","pedidoPor":"Elisabete","destino":"estação cp","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":294591,"horaInicio":"17:45","kmFim":294598,"horaFim":"18:04","observacoes":"","kmPercorridos":7},{"id":"ROT-0312","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-09-30","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"André Costa","kmInicio":176251,"horaInicio":"10:35","kmFim":176261,"horaFim":"17:45","observacoes":"","kmPercorridos":10},{"id":"ROT-0313","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-09-30","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":171158,"horaInicio":"10:35","kmFim":171160,"horaFim":"10:47","observacoes":"","kmPercorridos":2},{"id":"ROT-0314","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-09-30","pedidoPor":"Joao Silva","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":294598,"horaInicio":"10:40","kmFim":294603,"horaFim":"10:57","observacoes":"","kmPercorridos":5},{"id":"ROT-0315","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-01","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294603,"horaInicio":"11:19","kmFim":294613,"horaFim":"11:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0316","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-01","pedidoPor":"Machado","destino":"arm.Porto","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":294603,"horaInicio":"19:00","kmFim":294752,"horaFim":"18:40","observacoes":"","kmPercorridos":149},{"id":"ROT-0317","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":171136,"horaInicio":"11:00","kmFim":171146,"horaFim":"11:50","observacoes":"","kmPercorridos":10},{"id":"ROT-0318","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-02","pedidoPor":"Claudia","destino":"G.Contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":171146,"horaInicio":"17:16","kmFim":171155,"horaFim":"17:49","observacoes":"","kmPercorridos":9},{"id":"ROT-0319","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-03","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":171155,"horaInicio":"10:00","kmFim":171158,"horaFim":"11:00","observacoes":"","kmPercorridos":3},{"id":"ROT-0320","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294752,"horaInicio":"11:17","kmFim":294762,"horaFim":"12:06","observacoes":"","kmPercorridos":10},{"id":"ROT-0321","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-03","pedidoPor":"Machado","destino":"PSP","periodo":"T","carga":"sem carga","condutor":"Batista","kmInicio":171158,"horaInicio":"16:43","kmFim":171166,"horaFim":"17:28","observacoes":"","kmPercorridos":8},{"id":"ROT-0322","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294762,"horaInicio":"10:40","kmFim":294772,"horaFim":"11:39","observacoes":"","kmPercorridos":10},{"id":"ROT-0323","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-06","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 Paletes","condutor":"André Costa","kmInicio":176261,"horaInicio":"14:45","kmFim":176372,"horaFim":"16:21","observacoes":"","kmPercorridos":111},{"id":"ROT-0324","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-07","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"4 paletes","condutor":"Zezito","kmInicio":176372,"horaInicio":"09:56","kmFim":176483,"horaFim":"11:50","observacoes":"","kmPercorridos":111},{"id":"ROT-0325","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-07","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Avelino","kmInicio":171166,"horaInicio":"10:55","kmFim":171167,"horaFim":"11:05","observacoes":"","kmPercorridos":1},{"id":"ROT-0326","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294772,"horaInicio":"11:25","kmFim":294781,"horaFim":"11:54","observacoes":"","kmPercorridos":9},{"id":"ROT-0327","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-07","pedidoPor":"Claudia","destino":"Gabinete de Contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":294781,"horaInicio":"14:54","kmFim":294790,"horaFim":"15:46","observacoes":"","kmPercorridos":9},{"id":"ROT-0328","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-07","pedidoPor":"Rafael Silva","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"André Batista","kmInicio":171167,"horaInicio":"15:20","kmFim":171168,"horaFim":"15:31","observacoes":"","kmPercorridos":1},{"id":"ROT-0329","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294790,"horaInicio":"11:47","kmFim":294799,"horaFim":"12:18","observacoes":"","kmPercorridos":9},{"id":"ROT-0330","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-08","pedidoPor":"Rafael Silva","destino":"P.S.P.","periodo":"T","carga":"1 bateria","condutor":"André Batista","kmInicio":171168,"horaInicio":"14:48","kmFim":171175,"horaFim":"15:31","observacoes":"","kmPercorridos":7},{"id":"ROT-0331","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294799,"horaInicio":"10:30","kmFim":294809,"horaFim":"11:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0332","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-10","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"M","carga":"6 paletes","condutor":"André Costa","kmInicio":176483,"horaInicio":"09:25","kmFim":176595,"horaFim":"11:15","observacoes":"","kmPercorridos":112},{"id":"ROT-0333","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-10","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"M/T","carga":"varios volumes","condutor":"Simba e Batista","kmInicio":171175,"horaInicio":"10:30","kmFim":171259,"horaFim":"11:54","observacoes":"","kmPercorridos":84},{"id":"ROT-0334","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294809,"horaInicio":"11:18","kmFim":294820,"horaFim":"12:08","observacoes":"","kmPercorridos":11},{"id":"ROT-0335","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-10","pedidoPor":"Joao Silva","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":294820,"horaInicio":"15:10","kmFim":294828,"horaFim":"15:22","observacoes":"","kmPercorridos":8},{"id":"ROT-0336","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-10","pedidoPor":"Miga","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Batista","kmInicio":171259,"horaInicio":"17:30","kmFim":171260,"horaFim":"17:41","observacoes":"","kmPercorridos":1},{"id":"ROT-0337","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-13","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"um volume","condutor":"Teles","kmInicio":294828,"horaInicio":"16:08","kmFim":294829,"horaFim":"16:31","observacoes":"","kmPercorridos":1},{"id":"ROT-0338","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-13","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"7paletes","condutor":"Teles","kmInicio":176595,"horaInicio":"17:31","kmFim":176596,"horaFim":"18:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0339","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294829,"horaInicio":"10:33","kmFim":294842,"horaFim":"11:40","observacoes":"","kmPercorridos":13},{"id":"ROT-0340","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-14","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"6 paletes","condutor":"Teles","kmInicio":176596,"horaInicio":"14:50","kmFim":176597,"horaFim":"15:55","observacoes":"","kmPercorridos":1},{"id":"ROT-0341","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-15","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":294842,"horaInicio":"10:33","kmFim":294851,"horaFim":"11:28","observacoes":"","kmPercorridos":9},{"id":"ROT-0342","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-15","pedidoPor":"Joao Silva","destino":"Volta Amares","periodo":"M/T","carga":"varios volumes","condutor":"Zezito","kmInicio":171260,"horaInicio":"08:00","kmFim":171697,"horaFim":"15:00","observacoes":"","kmPercorridos":437},{"id":"ROT-0343","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-15","pedidoPor":"Joao Silva","destino":"deslocação a V.Real","periodo":"T","carga":"sem carga","condutor":"Joao Carlos","kmInicio":294851,"horaInicio":"14:30","kmFim":295074,"horaFim":"18:22","observacoes":"","kmPercorridos":223},{"id":"ROT-0344","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-16","pedidoPor":"Elisabete","destino":"bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295074,"horaInicio":"10:15","kmFim":295082,"horaFim":"10:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0345","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-16","pedidoPor":"Machado","destino":"Armazem Famoes","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":295082,"horaInicio":"06:45","kmFim":295900,"horaFim":"21:00","observacoes":"","kmPercorridos":818},{"id":"ROT-0346","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-17","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"4 paletes","condutor":"Simba","kmInicio":176597,"horaInicio":"09:51","kmFim":176598,"horaFim":"10:27","observacoes":"","kmPercorridos":1},{"id":"ROT-0347","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-17","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":171697,"horaInicio":"11:13","kmFim":171708,"horaFim":"12:18","observacoes":"","kmPercorridos":11},{"id":"ROT-0348","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-17","pedidoPor":"Joao Silva","destino":"Celeiros","periodo":"T","carga":"2 bidoes","condutor":"Fabio Silva","kmInicio":171708,"horaInicio":"14:35","kmFim":171732,"horaFim":"15:20","observacoes":"","kmPercorridos":24},{"id":"ROT-0349","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-17","pedidoPor":"Joao Carlos","destino":"Formaçao Empilhador","periodo":"M/T","carga":"sem carga","condutor":"Fabio Silva","kmInicio":295900,"horaInicio":"08:40","kmFim":295924,"horaFim":"17:00","observacoes":"","kmPercorridos":24},{"id":"ROT-0350","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-20","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295924,"horaInicio":"11:12","kmFim":295935,"horaFim":"11:49","observacoes":"","kmPercorridos":11},{"id":"ROT-0351","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-20","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Rui Bernardo","kmInicio":295935,"horaInicio":"15:26","kmFim":295936,"horaFim":"15:35","observacoes":"","kmPercorridos":1},{"id":"ROT-0352","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295936,"horaInicio":"09:46","kmFim":295946,"horaFim":"10:29","observacoes":"","kmPercorridos":10},{"id":"ROT-0353","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"Joao Carlos","destino":"Velorio Covelas","periodo":"M","carga":"sem carga","condutor":"Joao Carlos","kmInicio":295946,"horaInicio":"10:55","kmFim":295971,"horaFim":"11:40","observacoes":"","kmPercorridos":25},{"id":"ROT-0354","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-21","pedidoPor":"Leonardo","destino":"CTT","periodo":"T","carga":"sem carga","condutor":"Leonardo","kmInicio":172070,"horaInicio":"15:53","kmFim":172071,"horaFim":"16:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0355","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-21","pedidoPor":"Tiago","destino":"Bascula","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":179596,"horaInicio":"14:30","kmFim":176603,"horaFim":"16:00","observacoes":"","kmPercorridos":0},{"id":"ROT-0356","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-21","pedidoPor":"André Veloso","destino":"Avenida","periodo":"T","carga":"sem carga","condutor":"André Veloso","kmInicio":295971,"horaInicio":"16:30","kmFim":295976,"horaFim":"16:50","observacoes":"","kmPercorridos":5},{"id":"ROT-0357","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-22","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295976,"horaInicio":"10:47","kmFim":295985,"horaFim":"11:35","observacoes":"","kmPercorridos":9},{"id":"ROT-0358","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-22","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":295985,"horaInicio":"14:23","kmFim":295995,"horaFim":"15:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0359","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-22","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172071,"horaInicio":"15:29","kmFim":172072,"horaFim":"15:43","observacoes":"","kmPercorridos":1},{"id":"ROT-0360","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-23","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"M","carga":"6 paletes","condutor":"Cunha","kmInicio":176603,"horaInicio":"09:32","kmFim":176662,"horaFim":"11:42","observacoes":"","kmPercorridos":59},{"id":"ROT-0361","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-23","pedidoPor":"Machado","destino":"P.S.P.","periodo":"M","carga":"1 volume","condutor":"Rui Bernardo","kmInicio":172072,"horaInicio":"09:53","kmFim":172079,"horaFim":"10:23","observacoes":"","kmPercorridos":7},{"id":"ROT-0362","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-23","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":295995,"horaInicio":"11:06","kmFim":296005,"horaFim":"11:56","observacoes":"","kmPercorridos":10},{"id":"ROT-0363","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296005,"horaInicio":"10:45","kmFim":296015,"horaFim":"11:38","observacoes":"","kmPercorridos":10},{"id":"ROT-0364","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-24","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"4 paletes","condutor":"Vaz","kmInicio":176662,"horaInicio":"11:04","kmFim":176686,"horaFim":"12:26","observacoes":"","kmPercorridos":24},{"id":"ROT-0365","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-24","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"1 palete","condutor":"Avelino","kmInicio":172079,"horaInicio":"14:28","kmFim":172080,"horaFim":"14:40","observacoes":"","kmPercorridos":1},{"id":"ROT-0366","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-24","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296015,"horaInicio":"16:50","kmFim":296024,"horaFim":"17:36","observacoes":"","kmPercorridos":9},{"id":"ROT-0367","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-27","pedidoPor":"Leonel","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Leonel","kmInicio":296024,"horaInicio":"15:27","kmFim":296025,"horaFim":"15:47","observacoes":"","kmPercorridos":1},{"id":"ROT-0368","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-10-27","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"4 paletes","condutor":"André Costa","kmInicio":176686,"horaInicio":"15:00","kmFim":176707,"horaFim":"15:47","observacoes":"","kmPercorridos":21},{"id":"ROT-0369","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-28","pedidoPor":"Joao Silva","destino":"Bragalis Vila Real","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":296025,"horaInicio":"09:30","kmFim":296248,"horaFim":"17:55","observacoes":"","kmPercorridos":223},{"id":"ROT-0370","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172080,"horaInicio":"11:16","kmFim":172089,"horaFim":"11:47","observacoes":"","kmPercorridos":9},{"id":"ROT-0371","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172089,"horaInicio":"10:51","kmFim":172100,"horaFim":"11:28","observacoes":"","kmPercorridos":11},{"id":"ROT-0372","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-29","pedidoPor":"Machado","destino":"Soarauto / Alfilux / CTT","periodo":"T","carga":"1 palete","condutor":"Fabio","kmInicio":172100,"horaInicio":"15:28","kmFim":172101,"horaFim":"15:48","observacoes":"","kmPercorridos":1},{"id":"ROT-0373","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-30","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Teles","kmInicio":172101,"horaInicio":"10:10","kmFim":172116,"horaFim":"10:35","observacoes":"","kmPercorridos":15},{"id":"ROT-0374","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-30","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":296248,"horaInicio":"10:10","kmFim":296263,"horaFim":"10:40","observacoes":"","kmPercorridos":15},{"id":"ROT-0375","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-10-30","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172116,"horaInicio":"12:11","kmFim":172122,"horaFim":"12:53","observacoes":"","kmPercorridos":6},{"id":"ROT-0376","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-31","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296263,"horaInicio":"12:10","kmFim":296276,"horaFim":"13:15","observacoes":"","kmPercorridos":13},{"id":"ROT-0377","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-10-31","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296276,"horaInicio":"17:10","kmFim":296284,"horaFim":"18:52","observacoes":"","kmPercorridos":8},{"id":"ROT-0378","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296284,"horaInicio":"10:33","kmFim":296293,"horaFim":"11:14","observacoes":"","kmPercorridos":9},{"id":"ROT-0379","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296293,"horaInicio":"11:50","kmFim":296303,"horaFim":"12:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0380","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-03","pedidoPor":"Rafael Silva","destino":"Sucata","periodo":"T","carga":"3 paletes","condutor":"Rafael Silva","kmInicio":176707,"horaInicio":"15:00","kmFim":176727,"horaFim":"16:31","observacoes":"","kmPercorridos":20},{"id":"ROT-0381","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-05","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"T","carga":"6 paletes","condutor":"Teles","kmInicio":176800,"horaInicio":"15:00","kmFim":176912,"horaFim":"17:05","observacoes":"","kmPercorridos":112},{"id":"ROT-0382","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-06","pedidoPor":"Avelino","destino":"Primopeças","periodo":"M","carga":"6 paletes","condutor":"Teles","kmInicio":176912,"horaInicio":"09:35","kmFim":176939,"horaFim":"11:07","observacoes":"","kmPercorridos":27},{"id":"ROT-0383","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-06","pedidoPor":"Elisabete","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Elisabete","kmInicio":296324,"horaInicio":"14:20","kmFim":296335,"horaFim":"15:17","observacoes":"","kmPercorridos":11},{"id":"ROT-0384","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-06","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"2 paletes","condutor":"Cunha","kmInicio":176939,"horaInicio":"14:54","kmFim":176940,"horaFim":"15:26","observacoes":"","kmPercorridos":1},{"id":"ROT-0385","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-06","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172122,"horaInicio":"14:45","kmFim":172123,"horaFim":"15:08","observacoes":"","kmPercorridos":1},{"id":"ROT-0386","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-07","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296335,"horaInicio":"11:50","kmFim":296345,"horaFim":"12:54","observacoes":"","kmPercorridos":10},{"id":"ROT-0387","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-06","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Teles","kmInicio":172123,"horaInicio":"15:20","kmFim":172125,"horaFim":"15:32","observacoes":"","kmPercorridos":2},{"id":"ROT-0388","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-10","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296345,"horaInicio":"10:42","kmFim":296355,"horaFim":"11:33","observacoes":"","kmPercorridos":10},{"id":"ROT-0389","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-10","pedidoPor":"Machado","destino":"Bomba de Combustivel","periodo":"T","carga":"sem carga","condutor":"Leonardo","kmInicio":176940,"horaInicio":"14:46","kmFim":176948,"horaFim":"15:38","observacoes":"","kmPercorridos":8},{"id":"ROT-0390","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-10","pedidoPor":"Joao Silva","destino":"Leroy Merlin","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":296355,"horaInicio":"14:51","kmFim":296367,"horaFim":"15:32","observacoes":"","kmPercorridos":12},{"id":"ROT-0391","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-10","pedidoPor":"Machado","destino":"CTT","periodo":"T","carga":"1 volume","condutor":"Andre Batista","kmInicio":172125,"horaInicio":"15:00","kmFim":172126,"horaFim":"15:23","observacoes":"","kmPercorridos":1},{"id":"ROT-0392","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296367,"horaInicio":"11:54","kmFim":296377,"horaFim":"12:40","observacoes":"","kmPercorridos":10},{"id":"ROT-0393","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-11","pedidoPor":"Joao Silva","destino":"Myforce Pneus Volta Barcelos","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":296377,"horaInicio":"10:00","kmFim":296386,"horaFim":"10:30","observacoes":"","kmPercorridos":9},{"id":"ROT-0394","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-12","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296377,"horaInicio":"11:48","kmFim":296406,"horaFim":"12:41","observacoes":"","kmPercorridos":29},{"id":"ROT-0395","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-13","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296406,"horaInicio":"12:10","kmFim":296416,"horaFim":"13:17","observacoes":"","kmPercorridos":10},{"id":"ROT-0396","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-13","pedidoPor":"Machado","destino":"AZ Leiria","periodo":"m/t","carga":"Material convençao","condutor":"Machado","kmInicio":176948,"horaInicio":"08:00","kmFim":177940,"horaFim":"19:00","observacoes":"","kmPercorridos":992},{"id":"ROT-0397","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-13","pedidoPor":"Joao Silva","destino":"Volta Barcelos","periodo":"M/T","carga":"varios volumes","condutor":"Mario","kmInicio":172126,"horaInicio":"08:15","kmFim":172791,"horaFim":"18:00","observacoes":"","kmPercorridos":665},{"id":"ROT-0398","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-14","pedidoPor":"Machado","destino":"Convenção AD","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":296416,"horaInicio":"06:00","kmFim":296619,"horaFim":"19:00","observacoes":"","kmPercorridos":203},{"id":"ROT-0399","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-14","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":172792,"horaInicio":"11:17","kmFim":172802,"horaFim":"11:57","observacoes":"","kmPercorridos":10},{"id":"ROT-0400","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-17","pedidoPor":"Tiago","destino":"Lavagem","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":296619,"horaInicio":"09:30","kmFim":296627,"horaFim":"17:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0401","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-18","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296627,"horaInicio":"11:20","kmFim":296637,"horaFim":"11:55","observacoes":"","kmPercorridos":10},{"id":"ROT-0402","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-18","pedidoPor":"Joao Silva","destino":"","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":296637,"horaInicio":"15:18","kmFim":296649,"horaFim":"16:00","observacoes":"","kmPercorridos":12},{"id":"ROT-0403","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-19","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Fabio Vaz","kmInicio":172802,"horaInicio":"09:33","kmFim":172803,"horaFim":"09:46","observacoes":"","kmPercorridos":1},{"id":"ROT-0404","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-19","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296637,"horaInicio":"10:54","kmFim":296647,"horaFim":"11:30","observacoes":"","kmPercorridos":10},{"id":"ROT-0405","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-20","pedidoPor":"Machado","destino":"Volta Barcelos","periodo":"M","carga":"sem carga","condutor":"Zezito","kmInicio":172803,"horaInicio":"10:30","kmFim":173019,"horaFim":"17:00","observacoes":"","kmPercorridos":216},{"id":"ROT-0406","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-20","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"3 paletes","condutor":"Zezito","kmInicio":177940,"horaInicio":"15:40","kmFim":177941,"horaFim":"16:20","observacoes":"","kmPercorridos":1},{"id":"ROT-0407","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-20","pedidoPor":"Machado","destino":"Myforce","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":296647,"horaInicio":"15:18","kmFim":296711,"horaFim":"15:41","observacoes":"","kmPercorridos":64},{"id":"ROT-0408","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-21","pedidoPor":"Machado","destino":"Bragainox","periodo":"M","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":177941,"horaInicio":"09:30","kmFim":177961,"horaFim":"11:05","observacoes":"","kmPercorridos":20},{"id":"ROT-0409","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-21","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":296711,"horaInicio":"11:09","kmFim":296722,"horaFim":"11:58","observacoes":"","kmPercorridos":11},{"id":"ROT-0410","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-21","pedidoPor":"Machado","destino":"Bragainox","periodo":"T","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":177961,"horaInicio":"15:15","kmFim":177983,"horaFim":"16:51","observacoes":"","kmPercorridos":22},{"id":"ROT-0411","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-21","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":296739,"horaInicio":"16:25","kmFim":296752,"horaFim":"17:20","observacoes":"","kmPercorridos":13},{"id":"ROT-0412","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-22","pedidoPor":"Machado","destino":"AZ Leiria","periodo":"M/T","carga":"sem carga","condutor":"Machado","kmInicio":296752,"horaInicio":"08:00","kmFim":297311,"horaFim":"19:00","observacoes":"","kmPercorridos":559},{"id":"ROT-0413","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-24","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297311,"horaInicio":"11:12","kmFim":297321,"horaFim":"11:58","observacoes":"","kmPercorridos":10},{"id":"ROT-0414","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-25","pedidoPor":"Avelino","destino":"Soarauto - Ac. Soares Geme","periodo":"M","carga":"4 paletes","condutor":"André Batista","kmInicio":177983,"horaInicio":"09:32","kmFim":178015,"horaFim":"11:21","observacoes":"","kmPercorridos":32},{"id":"ROT-0415","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-25","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"T","carga":"sem carga","condutor":"Claudia","kmInicio":297321,"horaInicio":"16:25","kmFim":297329,"horaFim":"17:27","observacoes":"","kmPercorridos":8},{"id":"ROT-0416","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-26","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297329,"horaInicio":"11:14","kmFim":297338,"horaFim":"11:57","observacoes":"","kmPercorridos":9},{"id":"ROT-0417","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-26","pedidoPor":"Avelino","destino":"Soarauto","periodo":"T","carga":"4 paletes","condutor":"Teles","kmInicio":178015,"horaInicio":"14:54","kmFim":178016,"horaFim":"15:24","observacoes":"","kmPercorridos":1},{"id":"ROT-0418","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-27","pedidoPor":"Elisabete","destino":"CTT","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":173019,"horaInicio":"11:12","kmFim":173021,"horaFim":"11:46","observacoes":"","kmPercorridos":2},{"id":"ROT-0419","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-11-27","pedidoPor":"Joao Silva","destino":"Soarauto","periodo":"T","carga":"sem carga","condutor":"Joao Silva","kmInicio":173021,"horaInicio":"14:46","kmFim":173022,"horaFim":"14:54","observacoes":"","kmPercorridos":1},{"id":"ROT-0420","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-27","pedidoPor":"André Veloso","destino":"Soarauto","periodo":"T","carga":"sem carga","condutor":"Andre Veloso","kmInicio":297338,"horaInicio":"15:30","kmFim":297340,"horaFim":"15:48","observacoes":"","kmPercorridos":2},{"id":"ROT-0421","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-11-28","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297340,"horaInicio":"11:04","kmFim":297358,"horaFim":"11:40","observacoes":"","kmPercorridos":18},{"id":"ROT-0422","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-11-28","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Teles","kmInicio":178016,"horaInicio":"15:00","kmFim":178022,"horaFim":"15:14","observacoes":"","kmPercorridos":6},{"id":"ROT-0423","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-02","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297359,"horaInicio":"12:11","kmFim":297368,"horaFim":"13:01","observacoes":"","kmPercorridos":9},{"id":"ROT-0424","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"1 palete","condutor":"Teles","kmInicio":173022,"horaInicio":"09:32","kmFim":173022,"horaFim":"09:46","observacoes":"","kmPercorridos":0},{"id":"ROT-0425","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-03","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":297368,"horaInicio":"11:00","kmFim":297380,"horaFim":"11:28","observacoes":"","kmPercorridos":12},{"id":"ROT-0426","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-03","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297380,"horaInicio":"11:32","kmFim":297389,"horaFim":"12:26","observacoes":"","kmPercorridos":9},{"id":"ROT-0427","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-04","pedidoPor":"Machado","destino":"Sucata","periodo":"T","carga":"varios volumes","condutor":"Rui Bernardo","kmInicio":178022,"horaInicio":"14:43","kmFim":178043,"horaFim":"16:20","observacoes":"","kmPercorridos":21},{"id":"ROT-0428","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297389,"horaInicio":"11:55","kmFim":297399,"horaFim":"12:41","observacoes":"","kmPercorridos":10},{"id":"ROT-0429","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Assistencia em viagem","periodo":"M","carga":"sem carga","condutor":"Ricardo","kmInicio":297399,"horaInicio":"09:00","kmFim":297410,"horaFim":"09:37","observacoes":"","kmPercorridos":11},{"id":"ROT-0430","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297410,"horaInicio":"10:34","kmFim":297421,"horaFim":"11:29","observacoes":"","kmPercorridos":11},{"id":"ROT-0431","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Deslocaçao a Casa","periodo":"M","carga":"sem carga","condutor":"Machado","kmInicio":297421,"horaInicio":"13:00","kmFim":297429,"horaFim":"14:30","observacoes":"","kmPercorridos":8},{"id":"ROT-0432","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Tiago","kmInicio":297429,"horaInicio":"15:15","kmFim":297442,"horaFim":"15:45","observacoes":"","kmPercorridos":13},{"id":"ROT-0433","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-09","pedidoPor":"Machado","destino":"Inspeção","periodo":"M","carga":"sem carga","condutor":"Joao Fernandes","kmInicio":297442,"horaInicio":"09:43","kmFim":297450,"horaFim":"10:41","observacoes":"","kmPercorridos":8},{"id":"ROT-0434","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M","carga":"sem carga","condutor":"Tiago","kmInicio":297450,"horaInicio":"11:20","kmFim":297461,"horaFim":"11:37","observacoes":"","kmPercorridos":11},{"id":"ROT-0435","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"M/T","carga":"sem carga","condutor":"Tiago","kmInicio":173022,"horaInicio":"16:00","kmFim":173037,"horaFim":"16:28","observacoes":"","kmPercorridos":15},{"id":"ROT-0436","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-10","pedidoPor":"Tiago","destino":"Mecanico","periodo":"T","carga":"sem carga","condutor":"Gonçalo","kmInicio":297461,"horaInicio":"16:00","kmFim":297474,"horaFim":"16:35","observacoes":"","kmPercorridos":13},{"id":"ROT-0437","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-11","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297474,"horaInicio":"11:29","kmFim":297484,"horaFim":"12:03","observacoes":"","kmPercorridos":10},{"id":"ROT-0438","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-11","pedidoPor":"Avelino","destino":"Acessorios Soares Geme","periodo":"T","carga":"2 paletes","condutor":"Teles","kmInicio":178043,"horaInicio":"15:30","kmFim":178076,"horaFim":"16:10","observacoes":"","kmPercorridos":33},{"id":"ROT-0439","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-12","pedidoPor":"Avelino","destino":"Barcelpeças","periodo":"M","carga":"2 paletes","condutor":"Teles","kmInicio":178076,"horaInicio":"11:00","kmFim":178130,"horaFim":"12:03","observacoes":"","kmPercorridos":54},{"id":"ROT-0440","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-12","pedidoPor":"Elisabete","destino":"Bancos","periodo":"m","carga":"sem carga","condutor":"Elisabete","kmInicio":297484,"horaInicio":"11:15","kmFim":297494,"horaFim":"13:15","observacoes":"","kmPercorridos":10},{"id":"ROT-0441","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-12","pedidoPor":"Machado","destino":"Agarb","periodo":"T","carga":"sem carga","condutor":"Teles","kmInicio":173037,"horaInicio":"14:39","kmFim":173037,"horaFim":"15:09","observacoes":"","kmPercorridos":0},{"id":"ROT-0442","viatura":"Toyota Prius","matricula":"05-QR-43","data":"12/12/2025","pedidoPor":"Joao Silva","destino":"Bancos","periodo":"T","carga":"sem carga","condutor":"Machado","kmInicio":294494,"horaInicio":"15:12","kmFim":297515,"horaFim":"16:15","observacoes":"","kmPercorridos":3021},{"id":"ROT-0443","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-15","pedidoPor":"Joao Silva","destino":"Agencia aluguer automovel","periodo":"M","carga":"sem carga","condutor":"Andre Veloso","kmInicio":297515,"horaInicio":"09:24","kmFim":297593,"horaFim":"10:46","observacoes":"","kmPercorridos":78},{"id":"ROT-0444","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-15","pedidoPor":"Rafael","destino":"ferro velho","periodo":"M","carga":"varios volumes","condutor":"Cunha","kmInicio":178130,"horaInicio":"09:33","kmFim":178150,"horaFim":"11:10","observacoes":"","kmPercorridos":20},{"id":"ROT-0445","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-15","pedidoPor":"Avelino","destino":"Inovpeças Lousada","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":178150,"horaInicio":"14:31","kmFim":178261,"horaFim":"17:19","observacoes":"","kmPercorridos":111},{"id":"ROT-0446","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-16","pedidoPor":"Elisabete","destino":"Gabinte / Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297593,"horaInicio":"09:15","kmFim":297604,"horaFim":"10:01","observacoes":"","kmPercorridos":11},{"id":"ROT-0447","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-16","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"M","carga":"6 paletes","condutor":"Joao Fernandes","kmInicio":178261,"horaInicio":"09:30","kmFim":178375,"horaFim":"12:20","observacoes":"","kmPercorridos":114},{"id":"ROT-0448","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-16","pedidoPor":"Avelino","destino":"Inovpeças","periodo":"T","carga":"6 paletes","condutor":"Cunha","kmInicio":178375,"horaInicio":"14:32","kmFim":178486,"horaFim":"16:52","observacoes":"","kmPercorridos":111},{"id":"ROT-0449","viatura":"Toyota Prius","matricula":"05-QR-43","data":"17-12-2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297604,"horaInicio":"10:30","kmFim":297614,"horaFim":"11:37","observacoes":"","kmPercorridos":10},{"id":"ROT-0450","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"17-12-2025","pedidoPor":"Leonel","destino":"Sucata","periodo":"M","carga":"varios volumes","condutor":"Simba","kmInicio":178486,"horaInicio":"10:40","kmFim":178506,"horaFim":"11:45","observacoes":"","kmPercorridos":20},{"id":"ROT-0451","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-17","pedidoPor":"Avelino","destino":"Acessorios Soares Geme","periodo":"T","carga":"3 paletes","condutor":"Simba","kmInicio":178506,"horaInicio":"14:30","kmFim":178535,"horaFim":"15:30","observacoes":"","kmPercorridos":29},{"id":"ROT-0452","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-18","pedidoPor":"Machado","destino":"Sucata","periodo":"M","carga":"varios volumes","condutor":"Rafael","kmInicio":178535,"horaInicio":"09:30","kmFim":178555,"horaFim":"10:42","observacoes":"","kmPercorridos":20},{"id":"ROT-0453","viatura":"Toyota Prius","matricula":"05-QR-43","data":"18/12/2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297614,"horaInicio":"11:00","kmFim":297625,"horaFim":"11:52","observacoes":"","kmPercorridos":11},{"id":"ROT-0454","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-18","pedidoPor":"Avelino","destino":"Gaiafor","periodo":"T","carga":"5 paletes","condutor":"Leo","kmInicio":178555,"horaInicio":"13:00","kmFim":178690,"horaFim":"16:23","observacoes":"","kmPercorridos":135},{"id":"ROT-0455","viatura":"Toyota Prius","matricula":"05-QR-43","data":"19-12-2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297625,"horaInicio":"10:34","kmFim":297635,"horaFim":"11:35","observacoes":"","kmPercorridos":10},{"id":"ROT-0456","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"19/12/2025","pedidoPor":"Machado","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Andre Costa","kmInicio":173037,"horaInicio":"13:00","kmFim":173055,"horaFim":"14:30","observacoes":"","kmPercorridos":18},{"id":"ROT-0457","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"19/12/2025","pedidoPor":"Machado","destino":"Reivax","periodo":"T","carga":"sem carga","condutor":"Carlos Pinto","kmInicio":173055,"horaInicio":"15::45:00","kmFim":173065,"horaFim":"16:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0458","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-19","pedidoPor":"Avelino","destino":"Gaiafor","periodo":"T","carga":"5 paletes","condutor":"Teles","kmInicio":178690,"horaInicio":"15:30","kmFim":178839,"horaFim":"17:40","observacoes":"","kmPercorridos":149},{"id":"ROT-0459","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-22","pedidoPor":"Marcelino","destino":"Agarb","periodo":"M","carga":"sem carga","condutor":"Marcelino","kmInicio":173065,"horaInicio":"10:48","kmFim":173066,"horaFim":"11:15","observacoes":"","kmPercorridos":1},{"id":"ROT-0460","viatura":"Toyota Prius","matricula":"05-QR-43","data":"","pedidoPor":"Joao Silva","destino":"","periodo":"M/T","carga":"sem carga","condutor":"Joao Silva","kmInicio":297635,"horaInicio":"09:00","kmFim":297875,"horaFim":"19:00","observacoes":"","kmPercorridos":240},{"id":"ROT-0461","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"22-12-2025","pedidoPor":"Machado","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173066,"horaInicio":"12:30","kmFim":173083,"horaFim":"14:30","observacoes":"","kmPercorridos":17},{"id":"ROT-0462","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"23-12-2025","pedidoPor":"Tiago","destino":"Inspeção","periodo":"M","carga":"sem carga","condutor":"Rui Bernardo","kmInicio":178839,"horaInicio":"09:31","kmFim":178907,"horaFim":"10:38","observacoes":"","kmPercorridos":68},{"id":"ROT-0463","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"23/12/2025","pedidoPor":"Cesar","destino":"Myforce","periodo":"M","carga":"sem carga","condutor":"Cesar","kmInicio":173066,"horaInicio":"11:30","kmFim":173096,"horaFim":"11:54","observacoes":"","kmPercorridos":30},{"id":"ROT-0464","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"26/12/2025","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":173096,"horaInicio":"11:20","kmFim":173110,"horaFim":"12:10","observacoes":"","kmPercorridos":14},{"id":"ROT-0465","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-26","pedidoPor":"Jose Miguel","destino":"Manutençao","periodo":"M/T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173110,"horaInicio":"13:00","kmFim":173126,"horaFim":"14:24","observacoes":"","kmPercorridos":16},{"id":"ROT-0466","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-29","pedidoPor":"Machado","destino":"Ramoa","periodo":"M","carga":"sem carga","condutor":"Batista","kmInicio":173126,"horaInicio":"09:37","kmFim":173130,"horaFim":"09:57","observacoes":"","kmPercorridos":4},{"id":"ROT-0467","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2025-12-29","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":297875,"horaInicio":"11:00","kmFim":297887,"horaFim":"11:54","observacoes":"","kmPercorridos":12},{"id":"ROT-0468","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-29","pedidoPor":"Jose Miguel","destino":"Manutençao","periodo":"T","carga":"sem carga","condutor":"Jose Miguel","kmInicio":173126,"horaInicio":"13:00","kmFim":173144,"horaFim":"14:25","observacoes":"","kmPercorridos":18},{"id":"ROT-0469","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-30","pedidoPor":"Avelino","destino":"Primo/acesoares","periodo":"T","carga":"1+1 palete","condutor":"Batista","kmInicio":178907,"horaInicio":"14:30","kmFim":178946,"horaFim":"16:35","observacoes":"","kmPercorridos":39},{"id":"ROT-0470","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2025-12-31","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Batista","kmInicio":178946,"horaInicio":"09:45","kmFim":178947,"horaFim":"10:30","observacoes":"","kmPercorridos":1},{"id":"ROT-0471","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2025-12-31","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M","carga":"varios volumes","condutor":"Micael","kmInicio":173144,"horaInicio":"08:15","kmFim":173229,"horaFim":"09:30","observacoes":"","kmPercorridos":85},{"id":"ROT-0472","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M/T","carga":"varios volumes","condutor":"Micael","kmInicio":173229,"horaInicio":"08:15","kmFim":173270,"horaFim":"09:25","observacoes":"","kmPercorridos":41},{"id":"ROT-0473","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-01-02","pedidoPor":"Joao Silva","destino":"Vila Real","periodo":"M","carga":"sem carga","condutor":"Jose Miguel","kmInicio":297887,"horaInicio":"11:24","kmFim":298220,"horaFim":"14:00","observacoes":"","kmPercorridos":333},{"id":"ROT-0474","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"Joao Silva","destino":"","periodo":"M","carga":"sem carga","condutor":"Joao Silva","kmInicio":173270,"horaInicio":"12:30","kmFim":173284,"horaFim":"14:15","observacoes":"","kmPercorridos":14},{"id":"ROT-0475","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-01-02","pedidoPor":"volta","destino":"amares/v.verde","periodo":"M/T","carga":"varios volumes","condutor":"Micael/leo","kmInicio":173284,"horaInicio":"16:00","kmFim":173326,"horaFim":"17:27","observacoes":"","kmPercorridos":42},{"id":"ROT-0478","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-26","pedidoPor":"Machado","destino":"Expomecanica","periodo":"m/t","carga":"sem carga","condutor":"Fabio Silva","kmInicio":181945,"horaInicio":"08:00","kmFim":182799,"horaFim":"18:20","observacoes":"","kmPercorridos":854},{"id":"ROT-0479","viatura":"Toyota Prius","matricula":"05-QR-43","data":"27-28/06/2026","pedidoPor":"Tiago","destino":"Mecanico","periodo":"m/t","carga":"sem carga","condutor":"Tiago","kmInicio":304801,"horaInicio":"09:00","kmFim":304815,"horaFim":"10:28","observacoes":"","kmPercorridos":14},{"id":"ROT-0480","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-27","pedidoPor":"Tiago","destino":"Mecanico","periodo":"Tarde","carga":"sem carga","condutor":"Tiago","kmInicio":178983,"horaInicio":"17:10","kmFim":178994,"horaFim":"17:35","observacoes":"","kmPercorridos":11},{"id":"ROT-0481","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-27","pedidoPor":"Claudia","destino":"Gabinete de contabilidade","periodo":"M","carga":"sem carga","condutor":"Claudia","kmInicio":178994,"horaInicio":"09:00","kmFim":179002,"horaFim":"09:42","observacoes":"","kmPercorridos":8},{"id":"ROT-0482","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"27/28 - 06/2026","pedidoPor":"Machado","destino":"Volta Amares 08h","periodo":"m","carga":"varios Volumes","condutor":"Gonçalo","kmInicio":179002,"horaInicio":"08:00","kmFim":179331,"horaFim":"18:15","observacoes":"","kmPercorridos":329},{"id":"ROT-0483","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-28","pedidoPor":"Machado","destino":"Expomecanica","periodo":"M","carga":"Sem carga","condutor":"Machado","kmInicio":304815,"horaInicio":"08:30","kmFim":305283,"horaFim":"10:20","observacoes":"","kmPercorridos":468},{"id":"ROT-0484","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-01","pedidoPor":"Machado","destino":"Volta Guimaraes","periodo":"m/t","carga":"varios Volumes","condutor":"Fabio Vaz / Rui Fernandes","kmInicio":179331,"horaInicio":"08:00","kmFim":179646,"horaFim":"18:00","observacoes":"","kmPercorridos":315},{"id":"ROT-0485","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-02","pedidoPor":"Machado","destino":"Deslocação a casa / Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Machado","kmInicio":305283,"horaInicio":"12:00","kmFim":305291,"horaFim":"14:32","observacoes":"Dia 03/06/2026","kmPercorridos":8},{"id":"ROT-0486","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-03","pedidoPor":"Machado","destino":"Primopeças","periodo":"m","carga":"1 palete","condutor":"Micael","kmInicio":179646,"horaInicio":"09:40","kmFim":179670,"horaFim":"10:35","observacoes":"","kmPercorridos":24},{"id":"ROT-0487","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-03","pedidoPor":"Avelino","destino":"Soarauto","periodo":"M","carga":"6 paletes","condutor":"Avelino","kmInicio":182799,"horaInicio":"14:32","kmFim":182800,"horaFim":"14:57","observacoes":"","kmPercorridos":1},{"id":"ROT-0488","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-05","pedidoPor":"Elisabete","destino":"Bancos","periodo":"M","carga":"sem carga","condutor":"Elisabete","kmInicio":305291,"horaInicio":"12:20","kmFim":305301,"horaFim":"13:00","observacoes":"","kmPercorridos":10},{"id":"ROT-0489","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-05","pedidoPor":"Machado","destino":"Volta Amares","periodo":"m/t","carga":"sem carga","condutor":"Diana / Aguinaldo","kmInicio":179670,"horaInicio":"08:00","kmFim":179756,"horaFim":"14:00","observacoes":"","kmPercorridos":86},{"id":"ROT-0490","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-05","pedidoPor":"Machado","destino":"Barcelpeças","periodo":"Tarde","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":182800,"horaInicio":"15:10","kmFim":182853,"horaFim":"16:32","observacoes":"","kmPercorridos":53},{"id":"ROT-0491","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-06","pedidoPor":"Machado","destino":"Inovpeças","periodo":"M","carga":"6 paletes","condutor":"Rui Bernardo","kmInicio":182853,"horaInicio":"09:15","kmFim":182965,"horaFim":"10:55","observacoes":"","kmPercorridos":112},{"id":"ROT-0492","viatura":"Fiat Doblo","matricula":"52-PM-78","data":"2026-06-08","pedidoPor":"Machado","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Machado","kmInicio":179756,"horaInicio":"13:00","kmFim":179764,"horaFim":"14:50","observacoes":"","kmPercorridos":8},{"id":"ROT-0493","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-08","pedidoPor":"Elisabete","destino":"Bancos","periodo":"Tarde","carga":"sem carga","condutor":"Elisabete","kmInicio":305301,"horaInicio":"14:30","kmFim":305313,"horaFim":"15:22","observacoes":"","kmPercorridos":12},{"id":"ROT-0494","viatura":"Toyota Prius","matricula":"05-QR-43","data":"2026-06-09","pedidoPor":"Machado","destino":"Ramoa","periodo":"Tarde","carga":"sem carga","condutor":"Micael","kmInicio":305301,"horaInicio":"14:38","kmFim":305312,"horaFim":"14:52","observacoes":"","kmPercorridos":11},{"id":"ROT-0495","viatura":"Mitsubishi canter","matricula":"27-OG-41","data":"2026-06-09","pedidoPor":"Machado","destino":"Barcelpeças","periodo":"Tarde","carga":"3 paletes","condutor":"Leonardo","kmInicio":182965,"horaInicio":"15:30","kmFim":183020,"horaFim":"16:58","observacoes":"","kmPercorridos":55}],
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
