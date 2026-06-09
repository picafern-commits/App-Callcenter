const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// GitHub Pages é agora a app principal. Podes trocar este link pelo URL final do teu repositório.
const DEFAULT_GITHUB_APP_URL = 'https://picafern-commits.github.io/App-Callcenter-main/html/index.html';
const GITHUB_APP_URL = process.env.APP_URL || DEFAULT_GITHUB_APP_URL;
const startMaximized = process.env.START_MAXIMIZED !== '0';
let mainWindow = null;

function loadLocalFallback(win) {
  win.loadFile(path.join(__dirname, '..', 'html', 'index.html'));
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
    if (startMaximized) mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.loadURL(GITHUB_APP_URL).catch(() => loadLocalFallback(mainWindow));

  mainWindow.webContents.on('did-fail-load', (_event, _code, _desc, validatedURL) => {
    if (validatedURL === GITHUB_APP_URL) loadLocalFallback(mainWindow);
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
      mainWindow.reload();
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
