const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const GITHUB_APP_URL = process.env.APP_URL || '';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
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
      spellcheck: true
    }
  });

  win.once('ready-to-show', () => {
    win.show();
    if (process.env.START_MAXIMIZED === '1') win.maximize();
  });

  if (GITHUB_APP_URL) {
    win.loadURL(GITHUB_APP_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'html', 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.setName('AutoParts CallCenter');
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
