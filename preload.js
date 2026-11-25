const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  openFile: (opts) => ipcRenderer.invoke('file:open', opts),
  openImage: () => ipcRenderer.invoke('file:openImage'),
  version: () => ipcRenderer.invoke('app:version'),
  openMedia: (kind) => ipcRenderer.invoke('file:openMedia', kind),
  readMedia: (p) => ipcRenderer.invoke('file:readMedia', p),
  platform: process.platform,
  kbCapture: (on) => ipcRenderer.send('kb:capture', on),
  onCombo: (cb) => ipcRenderer.on('kb:combo', (_e, c) => cb(c)),
  onCloseWarn: (cb) => ipcRenderer.on('kb:closeWarn', () => cb()),
});
