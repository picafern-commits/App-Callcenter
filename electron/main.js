const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const GITHUB_APP_URL = process.env.APP_URL || 'https://picafern-commits.github.io/App-Callcenter/';
const LOCAL_APP_PATH = path.join(__dirname, '..', 'html', 'index.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#eef5fa',
    title: 'AutoParts CallCenter',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(GITHUB_APP_URL).catch(() => win.loadFile(LOCAL_APP_PATH));
  win.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription, _validatedURL, isMainFrame) => {
    if (isMainFrame) win.loadFile(LOCAL_APP_PATH);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
