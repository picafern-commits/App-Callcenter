const APP_VERSION = '1.1.0';
const STORAGE_KEY = 'autoparts_callcenter_v1';

const pages = [
  { id: 'dashboard', icon: '📊', title: 'Dashboard', subtitle: 'Central de controlo do callcenter' },
  { id: 'nova-chamada', icon: '📞', title: 'Nova Chamada', subtitle: 'Registar atendimento e pedido de peça' },
  { id: 'pedidos', icon: '🧩', title: 'Pedidos de Peças', subtitle: 'Acompanhamento por estado, urgência e operador' },
  { id: 'clientes', icon: '👤', title: 'Clientes', subtitle: 'Fichas, histórico e contactos' },
  { id: 'fornecedores', icon: '🏭', title: 'Fornecedores', subtitle: 'Contactos, cotações e avaliação' },
  { id: 'orcamentos', icon: '🧾', title: 'Orçamentos', subtitle: 'Criar, enviar e acompanhar propostas' },
  { id: 'agenda', icon: '🗓️', title: 'Agenda / Follow-ups', subtitle: 'Ligações, respostas e lembretes' },
  { id: 'stock', icon: '📦', title: 'Stock / Catálogo', subtitle: 'Peças disponíveis e compatibilidades' },
  { id: 'relatorios', icon: '📈', title: 'Relatórios', subtitle: 'Performance, vendas e margens' },
  { id: 'users', icon: '🛡️', title: 'Utilizadores', subtitle: 'Equipa, cargos e permissões' },
  { id: 'config', icon: '⚙️', title: 'Configurações', subtitle: 'Firebase, GitHub, Electron e backups' }
];

const states = ['Novo', 'Em pesquisa', 'Orçamento enviado', 'Confirmado', 'Perdido', 'Concluído'];
const urgencies = ['Normal', 'Urgente', 'Muito urgente'];
let currentPage = 'dashboard';
let state = loadState();

function seedData() {
  return {
    appVersion: APP_VERSION,
    settings: {
      companyName: 'AutoParts CallCenter',
      githubUrl: '',
      firebaseEnabled: false,
      dailyBackupHour: '19:30'
    },
    currentUser: null,
    calls: [
      { id: uid('PED'), createdAt: today(), cliente:'João Silva', telefone:'912345678', email:'', matricula:'12-AB-34', marca:'BMW', modelo:'320d', ano:'2016', motor:'2.0 Diesel', vin:'', peca:'Alternador', referencia:'', urgencia:'Urgente', estado:'Em pesquisa', operador:'Ricardo', observacoes:'Cliente quer resposta ainda hoje.', fornecedor:'', precoCompra:120, precoVenda:185 },
      { id: uid('PED'), createdAt: today(), cliente:'Auto Oficina Braga', telefone:'253000000', email:'geral@oficina.pt', matricula:'88-ZZ-10', marca:'Mercedes', modelo:'Classe A', ano:'2019', motor:'A180d', vin:'', peca:'Farol frente esquerdo', referencia:'', urgencia:'Normal', estado:'Orçamento enviado', operador:'Fátima', observacoes:'Enviar alternativa nova e usada.', fornecedor:'Fornecedor Norte', precoCompra:210, precoVenda:310 }
    ],
    clients: [
      { id: uid('CLI'), nome:'João Silva', telefone:'912345678', email:'', tipo:'Novo', notas:'Prefere contacto por WhatsApp.' },
      { id: uid('CLI'), nome:'Auto Oficina Braga', telefone:'253000000', email:'geral@oficina.pt', tipo:'Recorrente', notas:'Cliente profissional.' }
    ],
    suppliers: [
      { id: uid('FOR'), nomeFornecedor:'Fornecedor Norte', numeroReferencia:'FOR-001', telefone:'253111222', email:'pecas@norte.pt', whatsapp:'253111222', notas:'Usadas / Recondicionadas · Mercedes, BMW, Audi · resposta média 2h.' },
      { id: uid('FOR'), nomeFornecedor:'Stock Sul', numeroReferencia:'FOR-002', telefone:'219000111', email:'comercial@stocksul.pt', whatsapp:'219000111', notas:'Peças novas · todas as marcas · bom preço em óticas.' }
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
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function today(){ return new Date().toISOString().slice(0,10); }
function money(v){ return Number(v || 0).toLocaleString('pt-PT',{style:'currency',currency:'EUR'}); }
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function toast(msg){ const el = qs('#toast'); el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),2600); }
function qs(s){ return document.querySelector(s); }
function qsa(s){ return [...document.querySelectorAll(s)]; }

function init(){
  buildNav();
  bindShell();
  restoreLogin();
}

function restoreLogin(){
  const saved = localStorage.getItem('autoparts_login_email') || 'pica.fern@gmail.com';
  qs('#loginEmail').value = saved;
  qs('#loginPassword').value = '123456';
  qs('#loginBtn').addEventListener('click', login);
  qs('#loginPassword').addEventListener('keydown', e => { if(e.key === 'Enter') login(); });
}

function login(){
  const email = qs('#loginEmail').value.trim();
  if(!email) return toast('Mete o email para entrar.');
  if(qs('#rememberLogin').checked) localStorage.setItem('autoparts_login_email', email);
  state.currentUser = { email, name: email.split('@')[0] };
  saveState();
  qs('#loginScreen').classList.add('hidden');
  qs('#appShell').classList.remove('hidden');
  qs('#userBadge').textContent = state.currentUser.name;
  renderPage('dashboard');
}

function buildNav(){
  qs('#navMenu').innerHTML = pages.map(p => `<button class="nav-btn" data-page="${p.id}"><span class="nav-icon">${p.icon}</span><span>${p.title}</span></button>`).join('');
  qsa('.nav-btn').forEach(btn => btn.addEventListener('click', () => renderPage(btn.dataset.page)));
}

function bindShell(){
  qs('#menuBtn').addEventListener('click',()=>qs('.sidebar').classList.toggle('open'));
  qs('#quickCallBtn').addEventListener('click',()=>renderPage('nova-chamada'));
  qs('#backgroundBtn').addEventListener('click',()=>toast('No Electron, podes minimizar a janela para trabalhar em segundo plano.'));
  qs('#logoutBtn').addEventListener('click',()=>{
    state.currentUser = null; saveState();
    qs('#appShell').classList.add('hidden'); qs('#loginScreen').classList.remove('hidden');
  });
}

function renderPage(id){
  currentPage = id;
  const meta = pages.find(p=>p.id===id) || pages[0];
  qs('#pageTitle').textContent = meta.title;
  qs('#pageSubtitle').textContent = meta.subtitle;
  qsa('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
  qs('.sidebar').classList.remove('open');
  const renderers = { dashboard, 'nova-chamada': novaChamada, pedidos, clientes, fornecedores, orcamentos, agenda, stock, relatorios, users, config };
  qs('#pageContent').innerHTML = renderers[id]();
  bindPage(id);
}

function dashboard(){
  const appCards = pages.filter(p => p.id !== 'dashboard').map(p => `
    <button class="launcher-card" data-page-card="${p.id}">
      <div class="launcher-icon">${p.icon}</div>
      <strong>${esc(p.title)}</strong>
      <span>${esc(p.subtitle)}</span>
    </button>`).join('');
  const total = state.calls.length;
  const pend = state.calls.filter(c=>!['Concluído','Perdido'].includes(c.estado)).length;
  const suppliers = state.suppliers.length;
  const followToday = state.followups.filter(f=>f.date===today()).length;
  return `
    <div class="launcher-page">
      <div class="launcher-top">
        <div class="launcher-logo">
          <div class="launcher-logo-mark">AZ</div>
          <div>
            <h1>AUTOZITÂNIA</h1>
            <small>Sistema callcenter de peças automóveis</small>
          </div>
        </div>
        <div class="launcher-title">
          <h2>📊 PAINEL DE APLICAÇÕES</h2>
          <p>Acede rapidamente às ferramentas da empresa</p>
        </div>
      </div>

      <div class="launcher-stats">
        <div><strong>${total}</strong><span>Pedidos</span></div>
        <div><strong>${pend}</strong><span>Pendentes</span></div>
        <div><strong>${suppliers}</strong><span>Fornecedores</span></div>
        <div><strong>${followToday}</strong><span>Follow-ups hoje</span></div>
      </div>

      <div class="launcher-grid">
        ${appCards}
      </div>
    </div>`;
}
function metric(label,value,note){ return `<div class="card metric"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`; }

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
    <tr><td>${esc(c.id)}</td><td><strong>${esc(c.cliente)}</strong><br><span class="muted">${esc(c.telefone)}</span></td><td>${esc(c.marca)} ${esc(c.modelo)}<br><span class="muted">${esc(c.matricula||'Sem matrícula')}</span></td><td>${esc(c.peca)}<br><span class="muted">${esc(c.referencia||'Sem referência')}</span></td><td>${badge(c.urgencia)}</td><td>${badge(c.estado)}</td><td>${money(c.precoVenda)}</td>${actions?`<td><div class="actions"><button class="btn small" data-edit-call="${c.id}">Editar</button><button class="btn success small" data-quote="${c.id}">Orçamento</button><button class="btn danger small" data-delete-call="${c.id}">Apagar</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function badge(v){
  const map = {'Normal':'blue','Urgente':'orange','Muito urgente':'red','Novo':'blue','Em pesquisa':'orange','Orçamento enviado':'violet','Confirmado':'green','Concluído':'green','Perdido':'red','Pendente':'orange','Feito':'green','Ativo':'green'};
  return `<span class="badge ${map[v]||''}">${esc(v||'-')}</span>`;
}
function kanban(){
  return `<div class="kanban">${states.slice(0,5).map(st=>`<div class="lane"><h4>${st}</h4>${state.calls.filter(c=>c.estado===st).map(c=>`<div class="mini-card"><strong>${esc(c.cliente)}</strong><span>${esc(c.peca)} · ${esc(c.marca)} ${esc(c.modelo)}</span></div>`).join('') || '<div class="muted">Sem pedidos</div>'}</div>`).join('')}</div>`;
}

function clientes(){
  return entityPage('Clientes','clientForm',[
    ['nome','Nome'],['telefone','Telefone'],['email','Email'],['tipo','Tipo: Novo / Recorrente / VIP'],['notas','Notas']
  ], state.clients, ['nome','telefone','email','tipo'], 'client');
}
function fornecedores(){
  return `<div class="grid two suppliers-page">
    <div class="card">
      <div class="card-head"><h3>Adicionar fornecedor</h3><span class="muted">Lista simples por fornecedor e referência.</span></div>
      <form id="supplierForm" class="form-grid">
        <input class="field span2" name="nomeFornecedor" placeholder="Nome Fornecedor" required>
        <input class="field" name="numeroReferencia" placeholder="Número referência" required>
        <input class="field" name="telefone" placeholder="Telefone">
        <input class="field" name="email" placeholder="Email">
        <input class="field" name="whatsapp" placeholder="WhatsApp">
        <textarea class="span3" name="notas" placeholder="Notas internas"></textarea>
        <div class="span3"><button class="btn primary" type="submit">Guardar fornecedor</button></div>
      </form>
    </div>
    <div class="card supplier-list-card">
      <div class="card-head"><h3>Lista de fornecedores</h3><span class="muted">${state.suppliers.length} registos</span></div>
      <div class="toolbar"><input id="supplierSearch" class="field" placeholder="Pesquisar por nome fornecedor ou número referência"></div>
      <div id="suppliersTable">${suppliersTable(state.suppliers)}</div>
    </div>
  </div>`;
}
function supplierName(s){ return s.nomeFornecedor || s.nome || ''; }
function supplierRef(s){ return s.numeroReferencia || s.referenciaFornecedor || s.referencia || ''; }
function filterSuppliers(){
  const q = (qs('#supplierSearch')?.value || '').toLowerCase();
  return state.suppliers.filter(s => `${supplierName(s)} ${supplierRef(s)}`.toLowerCase().includes(q));
}
function suppliersTable(rows){
  if(!rows.length) return '<div class="empty">Sem fornecedores registados.</div>';
  return `<div class="table-wrap"><table class="suppliers-table"><thead><tr><th>Nome Fornecedor</th><th>Número Referência</th><th>Ações</th></tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${esc(supplierName(s))}</strong></td><td><span class="supplier-ref">${esc(supplierRef(s) || '-')}</span></td><td><div class="actions"><button class="btn small" data-edit-entity="supplier:${s.id}">Editar</button><button class="btn danger small" data-delete-entity="supplier:${s.id}">Apagar</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
function stock(){
  return entityPage('Stock / Catálogo','stockForm',[
    ['referencia','Referência'],['nome','Nome da peça'],['marca','Marca'],['modelo','Modelo compatível'],['estado','Nova / Usada / Recondicionada'],['local','Localização'],['custo','Preço custo'],['venda','Preço venda'],['qtd','Quantidade']
  ], state.stock, ['referencia','nome','marca','modelo','estado','local','venda','qtd'], 'stock');
}
function users(){
  return entityPage('Utilizadores','userForm',[
    ['nome','Nome'],['email','Email'],['role','Role'],['status','Estado']
  ], state.users, ['nome','email','role','status'], 'user');
}
function entityPage(title, formId, fields, rows, cols, type){
  return `<div class="grid two"><div class="card"><div class="card-head"><h3>Adicionar ${title}</h3></div><form id="${formId}" class="form-grid">${fields.map(f=>`<input class="field ${f[0]==='notas'?'span3':''}" name="${f[0]}" placeholder="${f[1]}">`).join('')}<div class="span3"><button class="btn primary" type="submit">Guardar</button></div></form></div><div class="card"><div class="card-head"><h3>Lista</h3><span class="muted">${rows.length} registos</span></div>${entityTable(rows, cols, type)}</div></div>`;
}
function entityTable(rows, cols, type){
  if(!rows.length) return '<div class="empty">Sem registos.</div>';
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}<td><div class="actions"><button class="btn small" data-edit-entity="${type}:${r.id}">Editar</button><button class="btn danger small" data-delete-entity="${type}:${r.id}">Apagar</button></div></td></tr>`).join('')}</tbody></table></div>`;
}

function orcamentos(){
  return `<div class="card"><div class="card-head"><h3>Orçamentos</h3><span class="muted">Criados a partir dos pedidos.</span></div>${state.quotes.length ? quotesTable() : '<div class="empty">Ainda não existem orçamentos. Cria um orçamento a partir da página Pedidos.</div>'}</div>`;
}
function quotesTable(){ return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Peça</th><th>Total</th><th>Estado</th><th>Ações</th></tr></thead><tbody>${state.quotes.map(q=>`<tr><td>${esc(q.id)}</td><td>${esc(q.cliente)}</td><td>${esc(q.peca)}</td><td>${money(q.total)}</td><td>${badge(q.estado)}</td><td><button class="btn small" data-print-quote="${q.id}">Ver PDF</button></td></tr>`).join('')}</tbody></table></div>`; }

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
  return `<div class="grid two"><div class="card"><div class="card-head"><h3>Configurações da app</h3><span class="badge blue">v${APP_VERSION}</span></div><form id="settingsForm" class="form-grid"><input class="field span2" name="companyName" placeholder="Nome da empresa" value="${esc(state.settings.companyName)}"><input class="field" name="dailyBackupHour" type="time" value="${esc(state.settings.dailyBackupHour)}"><input class="field span3" name="githubUrl" placeholder="URL GitHub Pages" value="${esc(state.settings.githubUrl)}"><label class="checkline span3"><input type="checkbox" name="firebaseEnabled" ${state.settings.firebaseEnabled?'checked':''}> Preparar ligação Firebase</label><div class="span3"><button class="btn primary">Guardar configurações</button></div></form></div><div class="card"><div class="card-head"><h3>GitHub + Electron</h3></div><p class="muted">Esta versão já está pronta para publicar no GitHub Pages. Para Electron, o ficheiro principal é <strong>electron/main.js</strong>. Se quiseres que o programa abra o link do GitHub, basta arrancar com a variável APP_URL.</p><div class="actions"><button class="btn" id="exportJsonBtn">Exportar JSON</button><button class="btn warn" id="resetDemoBtn">Reset demo</button></div></div></div>`;
}

function bindPage(id){
  qsa('[data-go]').forEach(b=>b.addEventListener('click',()=>renderPage(b.dataset.go)));
  qsa('[data-page-card]').forEach(b=>b.addEventListener('click',()=>renderPage(b.dataset.pageCard)));
  const supplierSearch = qs('#supplierSearch');
  if(supplierSearch) supplierSearch.addEventListener('input',()=>{ qs('#suppliersTable').innerHTML = suppliersTable(filterSuppliers()); bindEntities(); });
  if(id==='nova-chamada') bindCallForm();
  if(id==='pedidos') bindPedidos();
  bindEntities();
  if(id==='agenda') bindFollowForm();
  if(id==='config') bindConfig();
}
function bindCallForm(){
  qs('#callForm').addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const call = { id: uid('PED'), createdAt: today(), ...data, precoCompra:Number(data.precoCompra||0), precoVenda:Number(data.precoVenda||0) };
    state.calls.push(call);
    upsertClient(data.cliente, data.telefone, data.email);
    saveState(); toast('Chamada guardada com sucesso.'); renderPage('pedidos');
  });
}
function bindPedidos(){
  ['searchPedidos','filterEstado'].forEach(id=>qs('#'+id).addEventListener('input',()=>{ qs('#pedidosTable').innerHTML = callsTable(filterCalls(), true); bindPedidosActions(); }));
  bindPedidosActions();
}
function bindPedidosActions(){
  qsa('[data-delete-call]').forEach(b=>b.addEventListener('click',()=>{ state.calls = state.calls.filter(c=>c.id!==b.dataset.deleteCall); saveState(); renderPage('pedidos'); toast('Pedido apagado.'); }));
  qsa('[data-edit-call]').forEach(b=>b.addEventListener('click',()=>openCallModal(b.dataset.editCall)));
  qsa('[data-quote]').forEach(b=>b.addEventListener('click',()=>createQuoteFromCall(b.dataset.quote)));
}
function openCallModal(id){
  const c = state.calls.find(x=>x.id===id); if(!c) return;
  openModal('Editar pedido', `<form id="editCallForm" class="form-grid">${['cliente','telefone','email','matricula','marca','modelo','ano','motor','vin','peca','referencia','operador','fornecedor','precoCompra','precoVenda'].map(k=>`<input class="field" name="${k}" placeholder="${k}" value="${esc(c[k]||'')}">`).join('')}<select name="urgencia" class="select">${urgencies.map(u=>`<option ${c.urgencia===u?'selected':''}>${u}</option>`).join('')}</select><select name="estado" class="select">${states.map(s=>`<option ${c.estado===s?'selected':''}>${s}</option>`).join('')}</select><textarea class="span3" name="observacoes">${esc(c.observacoes||'')}</textarea><div class="span3"><button class="btn primary">Guardar alterações</button></div></form>`);
  qs('#editCallForm').addEventListener('submit', e=>{ e.preventDefault(); Object.assign(c,Object.fromEntries(new FormData(e.target).entries())); c.precoCompra=Number(c.precoCompra||0); c.precoVenda=Number(c.precoVenda||0); saveState(); closeModal(); renderPage('pedidos'); toast('Pedido atualizado.'); });
}
function createQuoteFromCall(id){
  const c = state.calls.find(x=>x.id===id); if(!c) return;
  const q = { id: uid('ORC'), callId:id, cliente:c.cliente, peca:c.peca, total:Number(c.precoVenda||0), estado:'Rascunho', createdAt:today() };
  state.quotes.push(q); c.estado='Orçamento enviado'; saveState(); renderPage('orcamentos'); toast('Orçamento criado.');
}
function upsertClient(nome, telefone, email){
  if(!nome) return;
  const exists = state.clients.find(c=>c.nome.toLowerCase()===nome.toLowerCase() || (telefone && c.telefone===telefone));
  if(!exists) state.clients.push({id:uid('CLI'), nome, telefone, email, tipo:'Novo', notas:''});
}
function bindEntities(){
  const map = { client:[state.clients,'clients'], supplier:[state.suppliers,'suppliers'], stock:[state.stock,'stock'], user:[state.users,'users'], follow:[state.followups,'followups'] };
  qsa('[data-delete-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.deleteEntity.split(':'); const target=map[type]; state[target[1]] = target[0].filter(x=>x.id!==id); saveState(); renderPage(currentPage); toast('Registo apagado.'); }));
  qsa('[data-edit-entity]').forEach(b=>b.addEventListener('click',()=>{ const [type,id]=b.dataset.editEntity.split(':'); openEntityModal(type,id); }));
  const forms = [{id:'clientForm',key:'clients',prefix:'CLI'},{id:'supplierForm',key:'suppliers',prefix:'FOR'},{id:'stockForm',key:'stock',prefix:'STK'},{id:'userForm',key:'users',prefix:'USR'}];
  forms.forEach(f=>{ const form=qs('#'+f.id); if(form) form.addEventListener('submit',e=>{ e.preventDefault(); state[f.key].push({id:uid(f.prefix),...Object.fromEntries(new FormData(e.target).entries())}); saveState(); renderPage(currentPage); toast('Registo guardado.'); }); });
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
  qs('#settingsForm').addEventListener('submit',e=>{ e.preventDefault(); const fd=new FormData(e.target); state.settings={ companyName:fd.get('companyName'), dailyBackupHour:fd.get('dailyBackupHour'), githubUrl:fd.get('githubUrl'), firebaseEnabled:fd.get('firebaseEnabled')==='on'}; saveState(); toast('Configurações guardadas.'); });
  qs('#exportJsonBtn').addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='autoparts-callcenter-export.json'; a.click(); URL.revokeObjectURL(a.href); });
  qs('#resetDemoBtn').addEventListener('click',()=>{ localStorage.removeItem(STORAGE_KEY); state=seedData(); renderPage('dashboard'); toast('Demo reposta.'); });
}
function openModal(title, html){ qs('#modalRoot').innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="btn danger-soft small" id="closeModalBtn">Fechar</button></div>${html}</div>`; qs('#modalRoot').classList.remove('hidden'); qs('#closeModalBtn').addEventListener('click',closeModal); }
function closeModal(){ qs('#modalRoot').classList.add('hidden'); qs('#modalRoot').innerHTML=''; }

document.addEventListener('DOMContentLoaded', init);
