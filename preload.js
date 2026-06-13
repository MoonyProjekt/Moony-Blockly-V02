// preload.js – Brücke zwischen Renderer (Frontend) und Node (Backend)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  uploadToArduino: (code, board, port) =>
    ipcRenderer.invoke("upload-to-arduino", { code, board, port }),
  listPorts: () => ipcRenderer.invoke("list-ports"),

  // ✅ Speichern/Laden
  saveProject: (xmlText) => ipcRenderer.invoke("save-project", { xmlText }),
  openProject: () => ipcRenderer.invoke("open-project"),

  // 🔁 Reload ohne Cache (Hidden Button / Shortcut)
  reloadApp: () => ipcRenderer.send("moony-reload"),
});

// ✅ Debug-API: DevTools öffnen (Konsole)
contextBridge.exposeInMainWorld("moonyDebug", {
  openDevTools: () => ipcRenderer.invoke("moony-devtools-open"),
  toggleDevTools: () => ipcRenderer.invoke("moony-devtools-toggle"),
});