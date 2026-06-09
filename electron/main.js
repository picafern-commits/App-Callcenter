const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

// GitHub Pages é a app principal do Electron.
// Depois de instalares este setup uma vez, o programa abre sempre o GitHub Pages.
const DEFAULT_GITHUB_APP_URL = 'https://picafern-commits.github.io/App-Callcenter/html/index.html';
const GITHUB_APP_URL = process.env.APP_URL || DEFAULT_GITHUB_APP_URL;
const START_MAXIMIZED = process.env.START_MAXIMIZED !== '0';
const USE_LOCAL_FALLBACK = process.env.LOCAL_FALLBACK === '1';

let mainWindow = null;

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

function withCacheBuster(url) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('electron', '1');
    parsed.searchParams.set('v', Date.now().toString());
    return parsed.toString();
  } catch {
    return url;
  }
}

function loadLocalFallback(win) {
  win.loadFile(path.join(__dirname, '..', 'html', 'index.html'));
}

async function clearWebCache() {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['serviceworkers', 'cachestorage'],
      quotas: ['temporary']
    });
  } catch (err) {
    console.warn('Não foi possível limpar a cache do Electron:', err);
  }
}

async function loadGithub(win) {
  await clearWebCache();
  const onlineUrl = withCacheBuster(GITHUB_APP_URL);
  return win.loadURL(onlineUrl, {
    extraHeaders: [
      'Cache-Control: no-cache, no-store, must-revalidate',
      'Pragma: no-cache',
      'Expires: 0'
    ].join('\n')
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#edf4fb',
    title: 'AutoParts CallCenter',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      zoomFactor: 1.0
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    if (START_MAXIMIZED) mainWindow.maximize();
    mainWindow.show();
  });

  loadGithub(mainWindow).catch((err) => {
    console.warn('Falhou ao abrir GitHub Pages:', err);
    if (USE_LOCAL_FALLBACK) {
      loadLocalFallback(mainWindow);
    } else {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <body style="font-family:Arial;background:#edf4fb;color:#183b5d;display:grid;place-items:center;min-height:100vh;margin:0">
          <div style="max-width:560px;background:white;padding:28px;border-radius:18px;box-shadow:0 18px 42px rgba(17,55,91,.18)">
            <h2>Sem ligação ao GitHub Pages</h2>
            <p>O Electron está configurado para abrir a versão online da app.</p>
            <p>Verifica a internet ou o link do GitHub Pages.</p>
            <button onclick="location.reload()" style="padding:12px 16px;border-radius:10px;border:0;background:#145c97;color:white;font-weight:700">Tentar novamente</button>
          </div>
        </body>` )}`);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'F5' && input.type === 'keyDown') {
      loadGithub(mainWindow).catch(() => {
        if (USE_LOCAL_FALLBACK) loadLocalFallback(mainWindow);
      });
      event.preventDefault();
    }
    if (input.control && input.shift && input.key?.toLowerCase() === 'r' && input.type === 'keyDown') {
      loadGithub(mainWindow).catch(() => {
        if (USE_LOCAL_FALLBACK) loadLocalFallback(mainWindow);
      });
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.setName('AutoParts CallCenter');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      loadGithub(mainWindow).catch(() => {});
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
