const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bragalisElectron', {
  composeOutlookEmail(payload) {
    return ipcRenderer.invoke('bragalis:compose-outlook-email', payload);
  }
});
