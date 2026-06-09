const { app, BrowserWindow, shell, Menu, session, screen } = require('electron');
const path = require('path');

// Electron deve abrir o GitHub Pages como app principal.
// Se o GitHub Pages ainda não estiver publicado, ou se o link estiver errado,
// abre automaticamente a versão local em vez de bloquear a app.
const START_MAXIMIZED = process.env.START_MAXIMIZED !== '0';
const LOCAL_ONLY = process.env.LOCAL_ONLY === '1';
const CUSTOM_APP_URL = process.env.APP_URL || 'https://picafern-commits.github.io/App-Callcenter-main/html/login.html';

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


function getWindowProfile() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const scaleFactor = display.scaleFactor || 1;

  // Electron recebe medidas em DIP, que já respeitam a escala do Windows.
  // Por isso usamos a área útil real do monitor, em vez de tamanhos fixos gigantes.
  const targetWidth = Math.max(980, Math.min(width, Math.round(width * 0.96)));
  const targetHeight = Math.max(680, Math.min(height, Math.round(height * 0.94)));
  const minWidth = Math.min(980, Math.max(820, width - 80));
  const minHeight = Math.min(680, Math.max(560, height - 80));

  let zoom = 1;
  if (width <= 1280 || height <= 720) zoom = 0.92;
  else if (width <= 1366 || height <= 800) zoom = 0.96;
  else if (width >= 2200 && scaleFactor <= 1.25) zoom = 1.04;

  return { targetWidth, targetHeight, minWidth, minHeight, zoom, scaleFactor };
}

function createWindow() {
  const profile = getWindowProfile();
  mainWindow = new BrowserWindow({
    width: profile.targetWidth,
    height: profile.targetHeight,
    minWidth: profile.minWidth,
    minHeight: profile.minHeight,
    backgroundColor: '#edf4fb',
    title: 'AutoParts CallCenter',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.setZoomFactor(profile.zoom);

  screen.on('display-metrics-changed', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const nextProfile = getWindowProfile();
    mainWindow.setMinimumSize(nextProfile.minWidth, nextProfile.minHeight);
    mainWindow.webContents.setZoomFactor(nextProfile.zoom);
    mainWindow.webContents.executeJavaScript('window.dispatchEvent(new Event(\"resize\"));').catch(()=>{});
  });

  mainWindow.once('ready-to-show', () => {
    if (START_MAXIMIZED) mainWindow.maximize();
    mainWindow.show();
  });

  loadGithubOrLocal(mainWindow);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.warn('did-fail-load:', errorCode, errorDescription, validatedURL, 'mainFrame:', isMainFrame);
    if (isMainFrame && validatedURL && validatedURL.startsWith('http')) loadLocalFallback(mainWindow);
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
