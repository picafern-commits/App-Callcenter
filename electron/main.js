const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

// Electron deve abrir o GitHub Pages como app principal.
// Se o GitHub Pages ainda não estiver publicado, ou se o link estiver errado,
// abre automaticamente a versão local em vez de bloquear a app.
const START_MAXIMIZED = process.env.START_MAXIMIZED !== '0';
const LOCAL_ONLY = process.env.LOCAL_ONLY === '1';
const CUSTOM_APP_URL = process.env.APP_URL || '';

const GITHUB_CANDIDATES = [
  CUSTOM_APP_URL,
  'https://picafern-commits.github.io/App-Callcenter-main/html/login.html',
  'https://picafern-commits.github.io/App-Callcenter-main/html/index.html',
  'https://picafern-commits.github.io/Ap-Callcenter/html/login.html',
  'https://picafern-commits.github.io/Ap-Callcenter/html/index.html',
  'https://picafern-commits.github.io/App-Callcenter/html/login.html',
  'https://picafern-commits.github.io/App-Callcenter/html/index.html'
].filter(Boolean);

let mainWindow = null;
let loadedOnline = false;

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
  loadedOnline = false;
  return win.loadFile(path.join(__dirname, '..', 'html', 'login.html'));
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

function loadURLWithTimeout(win, url, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`Timeout a abrir ${url}`));
    }, timeoutMs);

    win.loadURL(withCacheBuster(url), {
      extraHeaders: [
        'Cache-Control: no-cache, no-store, must-revalidate',
        'Pragma: no-cache',
        'Expires: 0'
      ].join('\n')
    }).then(() => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(url);
    }).catch(err => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function loadGithubOrLocal(win) {
  if (LOCAL_ONLY) return loadLocalFallback(win);
  await clearWebCache();

  for (const url of GITHUB_CANDIDATES) {
    try {
      await loadURLWithTimeout(win, url);
      loadedOnline = true;
      console.log('App aberta via GitHub Pages:', url);
      return;
    } catch (err) {
      console.warn('Falhou URL GitHub Pages:', url, err?.message || err);
    }
  }

  console.warn('Nenhum GitHub Pages abriu. A carregar versão local.');
  return loadLocalFallback(win);
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

  loadGithubOrLocal(mainWindow);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.warn('did-fail-load:', errorCode, errorDescription, validatedURL);
    if (validatedURL && validatedURL.startsWith('http')) loadLocalFallback(mainWindow);
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
    if ((input.key === 'F5' || (input.control && input.shift && input.key?.toLowerCase() === 'r')) && input.type === 'keyDown') {
      loadGithubOrLocal(mainWindow);
      event.preventDefault();
    }
    if (input.control && input.key?.toLowerCase() === 'l' && input.type === 'keyDown') {
      loadLocalFallback(mainWindow);
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
      if (!loadedOnline) loadGithubOrLocal(mainWindow);
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
