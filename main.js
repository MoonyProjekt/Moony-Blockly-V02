// main.js – Electron-Hauptprozess für Moony Blockly (Bundle Libraries + Arduino CLI)
// ✅ Verbesserungen:
// - Arduino-CLI Ausgabe (stdout/stderr) wird IMMER ins Terminal geloggt (npm start)
// - Fehler werden klarer zurückgegeben
// - ✅ NEU: DevTools per IPC (für versteckten Debug-Button / Shortcut)

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

console.log("✅ MAIN PROCESS loaded:", __filename);

// ----------------------------- Splash + Main Window ----------------------
let splashWin = null;
let mainWin = null;

// ----------------------------- Reload (ohne Cache) -----------------------
// ✅ EINMALIG hier oben registrieren
ipcMain.on("moony-reload", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.webContents.reloadIgnoringCache();
  else if (mainWin) mainWin.webContents.reloadIgnoringCache();
});

// ----------------------------- DevTools IPC (NUR 1x) ---------------------
// ✅ Guard gegen doppelte Registrierung (verhindert Start-Crash)
if (!ipcMain.__moonyDevtoolsHandlersRegistered) {
  ipcMain.__moonyDevtoolsHandlersRegistered = true;

  // ✅ DevTools öffnen
  ipcMain.handle("moony-devtools-open", async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender) || mainWin;
      if (!win) return { ok: false, error: "Kein Fenster gefunden." };

      win.webContents.openDevTools({ mode: "detach" });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  });

  // ✅ DevTools togglen (ein/aus)
  ipcMain.handle("moony-devtools-toggle", async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender) || mainWin;
      if (!win) return { ok: false, error: "Kein Fenster gefunden." };

      if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
      else win.webContents.openDevTools({ mode: "detach" });

      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  });

  console.log("✅ DevTools IPC handler registered: moony-devtools-open / moony-devtools-toggle");
}

function createWindow() {
  // 🌙 Splash
  splashWin = new BrowserWindow({
    width: 640,
    height: 420,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    backgroundColor: "#0b1224",
    icon: path.join(__dirname, "renderer", "img", "Moony.png"),
    webPreferences: { contextIsolation: true },
  });

  splashWin.loadFile(path.join(__dirname, "renderer", "splash.html"));
  splashWin.removeMenu();

  // 🧩 Hauptfenster
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: "#0b1224",
    icon: path.join(__dirname, "renderer", "img", "Moony.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWin.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWin.removeMenu();

  // ✅ Optional: DevTools automatisch öffnen in DEV (auskommentieren wenn nicht gewünscht)
  // if (!app.isPackaged) mainWin.webContents.openDevTools({ mode: "detach" });

  // ✅ Optional: DevTools per Tastenkombi auch ohne Menü (Main-Process Ebene)
  // Funktioniert oft auch dann, wenn Renderer F12 nicht bekommt.
  mainWin.webContents.on("before-input-event", (event, input) => {
    try {
      if (input.key === "F12") {
        mainWin.webContents.openDevTools({ mode: "detach" });
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        mainWin.webContents.openDevTools({ mode: "detach" });
        event.preventDefault();
      }
    } catch {}
  });

  const splashStart = Date.now();
  mainWin.once("ready-to-show", () => {
    const delay = Math.max(0, 2000 - (Date.now() - splashStart));
    setTimeout(() => {
      mainWin.show();
      splashWin?.close();
      splashWin = null;
    }, delay);
  });
}

// ----------------------------- App lifecycle ----------------------------
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ----------------------------- Helpers ----------------------------------
function quote(p) {
  return `"${p}"`;
}

function cfgArg(cfgPath) {
  return cfgPath ? ` --config-file ${quote(cfgPath)} ` : " ";
}

function runExec(cmd, label = "CMD") {
  return new Promise((resolve, reject) => {
    console.log(`\n[${label}] ${cmd}\n`);

    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      const out = (stdout || "").toString();
      const errOut = (stderr || "").toString();

      // ✅ WICHTIG: Alles ins Terminal loggen (damit du es bei npm start siehst)
      if (out.trim()) console.log(out);
      if (errOut.trim()) console.error(errOut);

      if (err) {
        const msg = (errOut && errOut.trim()) || (out && out.trim()) || err.message;
        return reject(msg);
      }

      resolve(out.trim());
    });
  });
}

// ----------------------------- Arduino paths ----------------------------
function getArduinoPaths() {
  // DEV: im Projektordner resources/arduino
  const devBase = path.join(__dirname, "resources", "arduino");
  // PROD: im gepackten App resourcesPath/arduino
  const prodBase = path.join(process.resourcesPath || __dirname, "arduino");
  const base = fs.existsSync(devBase) ? devBase : prodBase;

  const cliPath = path.join(base, "arduino-cli.exe");
  const cfgCandidate = path.join(base, "arduino-cli.yaml");
  const cfgPath = fs.existsSync(cfgCandidate) ? cfgCandidate : null;

  const librariesDir = path.join(base, "libraries");

  if (!fs.existsSync(cliPath)) throw new Error("arduino-cli.exe fehlt: " + cliPath);

  console.log("[Arduino] base:", base);
  console.log("[Arduino] cli :", cliPath);
  console.log("[Arduino] cfg :", cfgPath || "(none)");
  console.log("[Arduino] libs:", librariesDir, fs.existsSync(librariesDir) ? "(OK)" : "(MISSING)");

  return { cliPath, cfgPath, librariesDir, base };
}

// ----------------------------- Upload (compile + upload) -----------------
ipcMain.handle("upload-to-arduino", async (event, { code, board, port }) => {
  try {
    if (!port) throw new Error("Kein COM-Port gewählt.");

    const { cliPath, cfgPath, librariesDir } = getArduinoPaths();

    const tmpRoot = path.join(app.getPath("temp"), "moony_upload");
    const sketchPath = path.join(tmpRoot, "moony_upload");
    const inoPath = path.join(sketchPath, "moony_upload.ino");

    fs.mkdirSync(sketchPath, { recursive: true });
    fs.writeFileSync(inoPath, code, "utf8");

    const fqbnMap = {
      uno: "arduino:avr:uno",
      "nano-new": "arduino:avr:nano:cpu=atmega328",
      "nano-old": "arduino:avr:nano:cpu=atmega328old",
      mega: "arduino:avr:mega",
      leonardo: "arduino:avr:leonardo",
    };
    const fqbn = fqbnMap[board] || "arduino:avr:uno";

    const buildPath = path.join(sketchPath, "build");
    fs.mkdirSync(buildPath, { recursive: true });

    const compileCmd =
      `${quote(cliPath)} compile --fqbn ${fqbn}` +
      cfgArg(cfgPath) +
      (fs.existsSync(librariesDir) ? ` --libraries ${quote(librariesDir)}` : "") +
      ` --build-path ${quote(buildPath)} ${quote(sketchPath)}`;

    const uploadCmd =
      `${quote(cliPath)} upload -p ${port} --fqbn ${fqbn}` +
      cfgArg(cfgPath) +
      ` --input-dir ${quote(buildPath)}`;

    await runExec(compileCmd, "COMPILE");
    const out = await runExec(uploadCmd, "UPLOAD");
    return out;
  } catch (err) {
    return Promise.reject(String(err));
  }
});

// ----------------------------- Ports ------------------------------------
ipcMain.handle("list-ports", async () => {
  const { cliPath, cfgPath } = getArduinoPaths();
  const out = await runExec(`${quote(cliPath)} board list${cfgArg(cfgPath)}`, "LIST-PORTS");
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^COM\d+/i.test(l))
    .map((l) => l.split(/\s+/)[0]);
});

// ----------------------------- Save / Open -------------------------------
ipcMain.handle("save-project", async (event, { xmlText }) => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Moony Projekt speichern",
    defaultPath: "moony_project.xml",
    filters: [{ name: "Moony Blockly Projekt", extensions: ["xml"] }],
  });
  if (canceled || !filePath) return { ok: false };

  fs.writeFileSync(filePath, xmlText, "utf8");
  return { ok: true, filePath };
});

ipcMain.handle("open-project", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Moony Projekt öffnen",
    properties: ["openFile"],
    filters: [{ name: "Moony Blockly Projekt", extensions: ["xml"] }],
  });
  if (canceled || !filePaths?.[0]) return { ok: false };

  const xmlText = fs.readFileSync(filePaths[0], "utf8");
  return { ok: true, filePath: filePaths[0], xmlText };
});