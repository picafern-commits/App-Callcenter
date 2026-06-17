const { app, BrowserWindow, shell, Menu, session, screen, ipcMain, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// Electron passa a ser apenas um launcher do GitHub Pages.
// Assim, as alterações feitas no GitHub aparecem no Electron sem recriar setup.
const DEFAULT_GITHUB_URL = 'https://picafern-commits.github.io/App-Callcenter/html/login.html';
const WINDOW_ICON = path.join(__dirname, '..', 'assets', 'bragalis-callcenter.ico');
const APP_URL = process.env.APP_URL || DEFAULT_GITHUB_URL;
const LOCAL_FALLBACK = process.env.LOCAL_FALLBACK === '1';
const START_MAXIMIZED = process.env.START_MAXIMIZED !== '0';
const ELECTRON_ZOOM = Number(process.env.ELECTRON_ZOOM || '0.84');

let mainWindow = null;

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('ignore-certificate-errors-spki-list', '');

function addCacheBuster(url) {
  const parsed = new URL(url);
  parsed.searchParams.set('electron', '1');
  parsed.searchParams.set('t', Date.now().toString());
  return parsed.toString();
}

function getWindowProfile() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const scaleFactor = display.scaleFactor || 1;
  const targetWidth = Math.max(980, Math.min(width, Math.round(width * 0.98)));
  const targetHeight = Math.max(680, Math.min(height, Math.round(height * 0.96)));
  const minWidth = Math.min(980, Math.max(820, width - 80));
  const minHeight = Math.min(680, Math.max(560, height - 80));

  let zoom = Number.isFinite(ELECTRON_ZOOM) && ELECTRON_ZOOM > 0 ? ELECTRON_ZOOM : 0.84;
  if (width <= 1280 || height <= 720) zoom = Math.min(zoom, 0.78);
  else if (width <= 1366 || height <= 800) zoom = Math.min(zoom, 0.80);
  else if (width <= 1600 || height <= 900) zoom = Math.min(zoom, 0.82);
  else if (width >= 2200 && scaleFactor <= 1.25) zoom = Math.max(zoom, 0.88);

  return { targetWidth, targetHeight, minWidth, minHeight, zoom };
}

async function prepareSession() {
  const ses = session.defaultSession;
  try {
    await ses.clearCache();
  } catch (err) {
    console.warn('Não foi possível limpar cache:', err);
  }

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    details.requestHeaders.Pragma = 'no-cache';
    details.requestHeaders.Expires = '0';
    callback({ requestHeaders: details.requestHeaders });
  });

  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders || {};
    responseHeaders['Cache-Control'] = ['no-cache, no-store, must-revalidate'];
    responseHeaders.Pragma = ['no-cache'];
    responseHeaders.Expires = ['0'];
    callback({ responseHeaders });
  });
}

function loadLocalFallback(win) {
  return win.loadFile(path.join(__dirname, '..', 'html', 'login.html'));
}

function loadGithub(win) {
  return win.loadURL(addCacheBuster(APP_URL), {
    extraHeaders: [
      'Cache-Control: no-cache, no-store, must-revalidate',
      'Pragma: no-cache',
      'Expires: 0'
    ].join('\n')
  });
}

function showOfflinePage(win, message) {
  const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bragalis Callcenter</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#edf4fb,#dce8f4);color:#183b5d}.card{max-width:560px;background:white;border-radius:24px;padding:34px;box-shadow:0 24px 70px rgba(17,55,91,.18);text-align:center}.logo{width:72px;height:72px;border-radius:22px;margin:0 auto 18px;background:linear-gradient(135deg,#145c97,#0b426f);display:grid;place-items:center;color:white;font-weight:900;font-size:24px}h1{margin:0 0 10px;font-size:26px}p{color:#64809c;line-height:1.5}.btn{border:0;border-radius:14px;background:#0b426f;color:white;font-weight:900;padding:13px 18px;cursor:pointer;margin:6px}.muted{font-size:12px;color:#64809c;margin-top:14px}</style></head><body><div class="card"><div class="logo">BC</div><h1>Não consegui abrir o GitHub Pages</h1><p>${message}</p><button class="btn" onclick="location.reload()">Tentar novamente</button><button class="btn" onclick="window.close()">Fechar</button><div class="muted">URL: ${APP_URL}</div></div></body></html>`;
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
}

async function loadApp(win) {
  try {
    await prepareSession();
    await loadGithub(win);
    console.log('Bragalis aberto pelo GitHub Pages:', APP_URL);
  } catch (err) {
    console.warn('Falhou a abrir GitHub Pages:', err?.message || err);
    if (LOCAL_FALLBACK) {
      await loadLocalFallback(win);
    } else {
      showOfflinePage(win, 'O Electron está configurado para usar o GitHub Pages como fonte principal. Confirma a internet, o URL do GitHub Pages e se o deploy já terminou.');
    }
  }
}

function safeFileName(value) {
  return String(value || 'orcamento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._ -]+/g, '').trim().slice(0, 120) || 'orcamento';
}

async function renderPdfFromHtml(html, outputPath) {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false }
  });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html || ''));
    await new Promise(resolve => setTimeout(resolve, 500));
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 0
    });
    fs.writeFileSync(outputPath, pdf);
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

async function renderPngFromHtml(html, outputPath) {
  const win = new BrowserWindow({
    show: false,
    width: 1050,
    height: 900,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false }
  });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html || ''));
    await new Promise(resolve => setTimeout(resolve, 600));
    const image = await win.webContents.capturePage();
    fs.writeFileSync(outputPath, image.toPNG());
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

function psQuote(value) {
  return "'" + String(value || '').replace(/'/g, "''") + "'";
}

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `PowerShell terminou com código ${code}`));
    });
  });
}

function compactMailtoBody(payload) {
  const body = String(payload.compactBody || payload.plainBody || '').trim();
  // O Outlook novo pode bloquear mailto gigante. Mantém curto.
  return body.length > 1800 ? body.slice(0, 1700) + '\n\n[Texto encurtado. Consulta o PDF/imagem do orçamento gerados pela app.]' : body;
}

async function openMailClient(payload, attachmentsDir) {
  const mailto = `mailto:${encodeURIComponent(payload.to || '')}?subject=${encodeURIComponent(payload.subject || '')}&body=${encodeURIComponent(compactMailtoBody(payload))}`;
  await shell.openExternal(mailto);

  // Como o Outlook novo não aceita anexos por mailto, abre a pasta para arrastar/anexar.
  if (attachmentsDir && fs.existsSync(attachmentsDir)) {
    setTimeout(() => {
      shell.openPath(attachmentsDir).catch(err => console.warn('Falhou abrir pasta anexos:', err));
    }, 900);
  }
}

async function composeOutlookEmailWithAttachments(_event, payload = {}) {
  const base = safeFileName(payload.fileBase || payload.subject || 'orcamento');
  const dir = path.join(os.tmpdir(), 'BragalisCallcenter', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });

  const htmlPath = path.join(dir, `${base}-email.html`);
  const pdfPath = path.join(dir, `${base}.pdf`);
  const pngPath = path.join(dir, `${base}-tabela.png`);
  fs.writeFileSync(htmlPath, payload.htmlBody || payload.plainBody || '', 'utf8');

  try {
    if (payload.pdfHtml) await renderPdfFromHtml(payload.pdfHtml, pdfPath);
  } catch (err) {
    console.warn('Falhou gerar PDF:', err);
  }

  try {
    if (payload.tableHtml) await renderPngFromHtml(payload.tableHtml, pngPath);
  } catch (err) {
    console.warn('Falhou gerar PNG:', err);
  }

  if (process.platform !== 'win32') {
    await openMailClient(payload, dir);
    return { ok: false, fallback: 'mailto', reason: 'not-windows', dir };
  }

  const attachments = [pdfPath, pngPath].filter(p => fs.existsSync(p));
  const attachmentPs = attachments.map(p => `$mail.Attachments.Add(${psQuote(p)}) | Out-Null`).join('\n');

  const script = `
$ErrorActionPreference = 'Stop'
$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)
$mail.To = ${psQuote(payload.to || '')}
$mail.Subject = ${psQuote(payload.subject || '')}
$html = Get-Content -Raw -Encoding UTF8 ${psQuote(htmlPath)}
$mail.HTMLBody = $html
${attachmentPs}
$mail.Display()
`;

  try {
    await runPowerShell(script);
    return { ok: true, mode: 'classic-outlook', attachments, dir };
  } catch (err) {
    console.warn('Falhou abrir Outlook clássico por COM. A usar Outlook novo/mailto:', err?.message || err);
    try {
      await openMailClient(payload, dir);
      return { ok: false, fallback: 'mailto', reason: err.message || String(err), attachments, dir };
    } catch (mailtoErr) {
      console.warn('Também falhou mailto:', mailtoErr);
      await shell.openPath(dir).catch(()=>{});
      return { ok: false, fallback: 'folder-only', reason: mailtoErr.message || String(mailtoErr), attachments, dir };
    }
  }
}


async function openReadyEmailAndCopyLayout(_event, payload = {}) {
  const html = payload.htmlBody || payload.plainBody || '';
  const text = payload.plainBody || '';
  const mailto = `mailto:${encodeURIComponent(payload.to || '')}?subject=${encodeURIComponent(payload.subject || '')}`;

  try {
    clipboard.write({
      html,
      text
    });
  } catch (err) {
    console.warn('Falhou copiar HTML para clipboard:', err);
    try { clipboard.writeText(text || html.replace(/<[^>]+>/g, ' ')); } catch {}
  }

  try {
    await shell.openExternal(mailto);
    return { ok: true, mode: 'mailto-clipboard' };
  } catch (err) {
    console.warn('Falhou abrir mailto:', err);
    return { ok: false, reason: err.message || String(err) };
  }
}

ipcMain.handle('bragalis:open-ready-email-copy-layout', openReadyEmailAndCopyLayout);

ipcMain.handle('bragalis:compose-outlook-email', composeOutlookEmailWithAttachments);


function createWindow() {
  const profile = getWindowProfile();
  mainWindow = new BrowserWindow({
    width: profile.targetWidth,
    height: profile.targetHeight,
    minWidth: profile.minWidth,
    minHeight: profile.minHeight,
    backgroundColor: '#edf4fb',
    title: 'Bragalis Callcenter',
    icon: WINDOW_ICON,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: true
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.webContents.setZoomFactor(profile.zoom);

  mainWindow.once('ready-to-show', () => {
    if (START_MAXIMIZED) mainWindow.maximize();
    mainWindow.show();
  });

  screen.on('display-metrics-changed', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const nextProfile = getWindowProfile();
    mainWindow.setMinimumSize(nextProfile.minWidth, nextProfile.minHeight);
    mainWindow.webContents.setZoomFactor(nextProfile.zoom);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    console.warn('did-fail-load:', errorCode, errorDescription, validatedURL);
    if (!LOCAL_FALLBACK) showOfflinePage(mainWindow, `Erro a abrir a app online: ${errorDescription || errorCode}`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    const nextProfile = getWindowProfile();
    mainWindow.webContents.setZoomFactor(nextProfile.zoom);
    mainWindow.webContents.insertCSS(`html.electron-mode, body.electron-mode { font-size: 13px !important; }`).catch(()=>{});
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('before-input-event', async (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if ((input.key === 'F5' || (input.control && input.shift && input.key?.toLowerCase() === 'r')) && input.type === 'keyDown') {
      event.preventDefault();
      await session.defaultSession.clearCache().catch(()=>{});
      await loadGithub(mainWindow).catch(err => showOfflinePage(mainWindow, err?.message || 'Falha ao recarregar.'));
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  loadApp(mainWindow);
}

app.setName('Bragalis Callcenter');
app.setAppUserModelId('pt.bragalis.callcenter');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      loadGithub(mainWindow).catch(()=>{});
    }
  });

  app.whenReady().then(createWindow);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
