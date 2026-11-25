const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  openFile: (opts) => ipcRenderer.invoke('file:open', opts),
  openImage: () => ipcRenderer.invoke('file:openImage'),
  version: () => ipcRenderer.invoke('app:version'),
});
