const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bragalisElectron', {
  composeOutlookEmail(payload) {
    return ipcRenderer.invoke('bragalis:compose-outlook-email', payload);
  },
  openReadyEmailAndCopyLayout(payload) {
    return ipcRenderer.invoke('bragalis:open-ready-email-copy-layout', payload);
  }
});
