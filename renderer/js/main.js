// js/main.js – Moony Blockly Renderer (stabil + Inline-Zahlen + Variablen funktionieren)
// ✔ Deutsch aktivieren
// ✔ Blockly init
// ✔ Save/Open (Electron Dialog via preload)
// ✔ Undo/Redo
// ✔ Block ↔ Code Toggle via body.showCode
// ✔ Connect (Port-Auswahl Overlay)
// ✔ Upload
// ✔ FIX: Zahl/Text inline editieren (Touch/Prompt aus)
// ✔ FIX: Variablen/Funktionen funktionieren wieder (eigener Prompt-Dialog, KEIN window.prompt)
// ✔ FIX: Nach Load/Toggle/Upload bleibt Blockly vollständig interaktiv
// ✔ ✅ NEU: Debug-Button/Shortcut öffnet DevTools + Fehleroverlay bei JS-Fehlern

(() => {
  "use strict";

  // ────────────────────────────────────────────────────────────────
  // ✅ NOTFALL: JS Fehler im Fenster anzeigen (falls DevTools noch nicht geht)
  // ────────────────────────────────────────────────────────────────
  (function moonyShowErrorsOnScreen() {
    function show(title, msg) {
      try {
        const old = document.getElementById("moonyErrorOverlay");
        if (old) old.remove();

        const wrap = document.createElement("div");
        wrap.id = "moonyErrorOverlay";
        wrap.style.cssText = `
          position:fixed; inset:0; z-index:999999;
          background:rgba(0,0,0,0.75);
          display:flex; align-items:center; justify-content:center;
          padding:20px;
        `;

        const box = document.createElement("div");
        box.style.cssText = `
          max-width:900px; width:100%;
          background:#162347; color:#E9E1BE;
          border:1px solid #FF7B00; border-radius:12px;
          padding:16px; font-family:system-ui,Segoe UI,Roboto,sans-serif;
          box-shadow:0 10px 30px rgba(0,0,0,0.5);
          white-space:pre-wrap;
        `;

        const safe = String(msg ?? "").replace(/</g, "&lt;");
        box.innerHTML = `<div style="font-weight:700; margin-bottom:8px;">${title}</div>
                         <div style="font-size:13px; line-height:1.35;">${safe}</div>
                         <div style="margin-top:12px; font-size:12px; opacity:.9;">
                           Tipp: Kopiere diesen Text und schick ihn mir.
                         </div>`;

        wrap.appendChild(box);
        document.body.appendChild(wrap);
      } catch {}
    }

    window.addEventListener("error", (e) => {
      const msg = `${e.message}\n\nDatei: ${e.filename}\nZeile: ${e.lineno}:${e.colno}`;
      show("JS Fehler", msg);
    });

    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason && (e.reason.stack || e.reason.message || String(e.reason));
      show("Promise Fehler", reason || "unbekannt");
    });
  })();

  // ────────────────────────────────────────────────────────────────
  // 🌍 Sprache
  // ────────────────────────────────────────────────────────────────
  if (window.Blockly && Blockly.Msg) {
    Blockly.setLocale(Blockly.Msg.de || Blockly.Msg);
  }

  // ────────────────────────────────────────────────────────────────
  // 🧰 Helpers
  // ────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const safe = (fn) => { try { return fn(); } catch { return undefined; } };

  const ui = {
    blocklyDiv: $("blocklyDiv"),
    codeView: $("codeView"),
    toolbox: $("toolbox"),

    btnNew: $("btn-new"),
    btnOpen: $("btn-open"),
    btnSave: $("btn-save"),
    btnUndo: $("btn-undo"),
    btnRedo: $("btn-redo"),

    toggleView: $("toggle-view"),

    btnConnect: $("btn-connect"),
    btnUpload: $("btn-upload"),
    boardSelect: $("board-select"),

    logo: $("moony-logo"),
  };

  // ✅ Wenn toolbox fehlt -> sofort sagen (sonst leere Kategorien / keine Blöcke)
  if (!ui.toolbox) {
    alert('❌ Toolbox fehlt!\nPrüfe index.html: <xml id="toolbox"> ... </xml>');
    return;
  }
  if (!ui.blocklyDiv) {
    alert('❌ blocklyDiv fehlt!\nPrüfe index.html: <div id="blocklyDiv"> ... </div>');
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // 🧱 Blockly init
  // ────────────────────────────────────────────────────────────────
  const workspace = Blockly.inject(ui.blocklyDiv, {
    toolbox: ui.toolbox,
    media: "libs/blockly/media/",
    theme: Blockly.Themes.MoonyDark,
    renderer: "zelos",
    trashcan: true,
    zoom: { controls: true, wheel: true },
  });
  window.workspace = workspace;

  // ────────────────────────────────────────────────────────────────
  // ✅ Inline-Edit erzwingen (Zahlen/Text NICHT via Prompt)
  // ────────────────────────────────────────────────────────────────
  function forceInlineEditors() {
    safe(() => {
      if (Blockly?.FieldTextInput?.prototype) {
        Blockly.FieldTextInput.prototype.useTouchInteraction_ = false;
      }
      if (Blockly?.FieldNumber?.prototype) {
        Blockly.FieldNumber.prototype.useTouchInteraction_ = false;
      }
    });

    safe(() => Blockly.WidgetDiv?.createDom?.());
    safe(() => Blockly.DropDownDiv?.createDom?.());
    safe(() => Blockly.Events?.enable?.());
  }
  forceInlineEditors();

  // ────────────────────────────────────────────────────────────────
  // ✅ Blockly-Dialoge (Prompt/Confirm/Alert) als kleines Overlay
  // ────────────────────────────────────────────────────────────────
  function createOverlay({ zIndex = 99999 } = {}) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: ${zIndex};
    `;
    return overlay;
  }

  function createBox() {
    const box = document.createElement("div");
    box.style.cssText = `
      background: #162347;
      padding: 16px;
      border: 1px solid #E9E1BE;
      border-radius: 10px;
      color: #E9E1BE;
      text-align: center;
      width: min(420px, calc(100vw - 40px));
      box-shadow: 0 10px 30px rgba(0,0,0,0.45);
    `;
    return box;
  }

  function showPromptOverlay(message, defaultValue) {
    return new Promise((resolve) => {
      const overlay = createOverlay({ zIndex: 99999 });
      const box = createBox();

      const safeMsg = String(message ?? "");
      const def = String(defaultValue ?? "");

      box.innerHTML = `
        <div style="font-size:14px; margin-bottom:10px; line-height:1.35;">${safeMsg}</div>
        <input id="moonyPromptInput" value="${def.replace(/"/g, "&quot;")}" style="
          width: 100%;
          box-sizing: border-box;
          padding: 8px 10px;
          border: 1px solid #E9E1BE;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          color: #E9E1BE;
          outline: none;
          font-size: 15px;
        ">
        <div style="margin-top:12px; display:flex; gap:10px; justify-content:center;">
          <button id="moonyOk" style="
            padding: 7px 14px; border:none; border-radius:8px;
            background:#9AC22F; color:#000; cursor:pointer;
          ">OK</button>
          <button id="moonyCancel" style="
            padding: 7px 14px; border:none; border-radius:8px;
            background:#FF7B00; color:#000; cursor:pointer;
          ">Abbrechen</button>
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const input = box.querySelector("#moonyPromptInput");
      const okBtn = box.querySelector("#moonyOk");
      const cancelBtn = box.querySelector("#moonyCancel");

      const cleanup = (val) => {
        overlay.remove();
        resolve(val);
      };

      okBtn.addEventListener("click", () => cleanup(String(input.value ?? "")));
      cancelBtn.addEventListener("click", () => cleanup(null));

      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) cleanup(null);
      });

      input.focus();
      input.setSelectionRange(0, input.value.length);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") okBtn.click();
        if (e.key === "Escape") cancelBtn.click();
      });
    });
  }

  function showConfirmOverlay(message) {
    return new Promise((resolve) => {
      const overlay = createOverlay({ zIndex: 99999 });
      const box = createBox();

      const safeMsg = String(message ?? "");

      box.innerHTML = `
        <div style="font-size:14px; margin-bottom:14px; line-height:1.35;">${safeMsg}</div>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button id="moonyYes" style="
            padding: 7px 14px; border:none; border-radius:8px;
            background:#9AC22F; color:#000; cursor:pointer;
          ">OK</button>
          <button id="moonyNo" style="
            padding: 7px 14px; border:none; border-radius:8px;
            background:#FF7B00; color:#000; cursor:pointer;
          ">Abbrechen</button>
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const yes = box.querySelector("#moonyYes");
      const no = box.querySelector("#moonyNo");

      const cleanup = (val) => {
        overlay.remove();
        resolve(val);
      };

      yes.addEventListener("click", () => cleanup(true));
      no.addEventListener("click", () => cleanup(false));
      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) cleanup(false);
      });

      yes.focus();
    });
  }

  function showAlertOverlay(message) {
    return new Promise((resolve) => {
      const overlay = createOverlay({ zIndex: 99999 });
      const box = createBox();

      const safeMsg = String(message ?? "");

      box.innerHTML = `
        <div style="font-size:14px; margin-bottom:14px; line-height:1.35;">${safeMsg}</div>
        <div style="display:flex; justify-content:center;">
          <button id="moonyOk" style="
            padding: 7px 14px; border:none; border-radius:8px;
            background:#9AC22F; color:#000; cursor:pointer;
          ">OK</button>
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const ok = box.querySelector("#moonyOk");
      const cleanup = () => {
        overlay.remove();
        resolve();
      };

      ok.addEventListener("click", cleanup);
      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) cleanup();
      });

      ok.focus();
    });
  }

  // Blockly Dialog Hooks setzen
  (function hookBlocklyDialogs() {
    if (!Blockly?.dialog) return;

    if (Blockly.dialog.setPrompt) {
      Blockly.dialog.setPrompt(async (message, defaultValue, callback) => {
        const val = await showPromptOverlay(message, defaultValue);
        callback(val);
      });
    }

    if (Blockly.dialog.setConfirm) {
      Blockly.dialog.setConfirm(async (message, callback) => {
        const ok = await showConfirmOverlay(message);
        callback(ok);
      });
    }

    if (Blockly.dialog.setAlert) {
      Blockly.dialog.setAlert(async (message, callback) => {
        await showAlertOverlay(message);
        callback();
      });
    }
  })();

  // ────────────────────────────────────────────────────────────────
  // 🔧 Chaff schließen (Dropdowns etc.)
  // ────────────────────────────────────────────────────────────────
  function closeBlocklyEditors() {
    safe(() => Blockly.hideChaff?.(true));
    safe(() => Blockly.WidgetDiv?.hide?.(true));
    safe(() => Blockly.DropDownDiv?.hideWithoutAnimation?.());
    safe(() => Blockly.DropDownDiv?.hide?.());
    safe(() => document.activeElement?.blur?.());
  }

  function ensureBlocklyInteractive() {
    workspace.options.readOnly = false;
    safe(() => workspace.setEnabled?.(true));
    forceInlineEditors();
    if (ui.blocklyDiv) ui.blocklyDiv.style.pointerEvents = "auto";
    safe(() => Blockly.svgResize?.(workspace));
  }

  function focusWorkspace() {
    closeBlocklyEditors();
    ensureBlocklyInteractive();
    safe(() => workspace.markFocused?.());
    safe(() => workspace.getParentSvg?.()?.focus?.());
    safe(() => ui.blocklyDiv?.focus?.());
  }

  // ────────────────────────────────────────────────────────────────
  // 💻 Code-Generator
  // ────────────────────────────────────────────────────────────────
  function generateFullSketch() {
    if (!Blockly.Arduino) return "// Kein Arduino-Generator geladen.\n";

    Blockly.Arduino.init(workspace);
    const code = Blockly.Arduino.workspaceToCode(workspace);

    if (!code || !code.trim()) {
      return "#include <Arduino.h>\n\nvoid setup() {}\n\nvoid loop() {}\n";
    }
    return code;
  }

  // Für mission_engine.js zugänglich machen – dieselbe Funktion die den Code-View antreibt.
  window.moonyGenerateCode = generateFullSketch;

  // ────────────────────────────────────────────────────────────────
  // 🔁 Block ↔ Code Toggle (CSS via body.showCode)
  // ────────────────────────────────────────────────────────────────
  function showBlocks() {
    closeBlocklyEditors();
    document.body.classList.remove("showCode");
    ensureBlocklyInteractive();
    focusWorkspace();
  }

  function showCode() {
    closeBlocklyEditors();
    ui.codeView.textContent = generateFullSketch();
    document.body.classList.add("showCode");
    safe(() => ui.codeView.focus?.());
  }

  ui.toggleView?.addEventListener("change", () => {
    if (ui.toggleView.checked) showCode();
    else showBlocks();
  });

  workspace.addChangeListener((e) => {
    if (!ui.toggleView?.checked) return;
    if (!e) return;

    if (Blockly?.Events?.isEnabled && !Blockly.Events.isEnabled()) return;

    const typesToRefresh = new Set([
      Blockly.Events.BLOCK_CHANGE,
      Blockly.Events.BLOCK_CREATE,
      Blockly.Events.BLOCK_DELETE,
      Blockly.Events.BLOCK_MOVE,
    ]);
    if (e.type && !typesToRefresh.has(e.type)) return;

    ui.codeView.textContent = generateFullSketch();
  });

  // ────────────────────────────────────────────────────────────────
  // Startzustand + Resize
  // ────────────────────────────────────────────────────────────────
  (function initUI() {
    if (ui.toggleView) ui.toggleView.checked = false;
    document.body.classList.remove("showCode");

    ensureBlocklyInteractive();
    setTimeout(() => focusWorkspace(), 0);

    window.addEventListener("resize", () => {
      if (!ui.toggleView?.checked) safe(() => Blockly.svgResize?.(workspace));
    });
  })();

  // ────────────────────────────────────────────────────────────────
  // 🧩 Buttons
  // ────────────────────────────────────────────────────────────────
  ui.btnNew?.addEventListener("click", async () => {
    closeBlocklyEditors();
    const ok = await showConfirmOverlay("Möchtest du wirklich ein neues Projekt beginnen?");
    if (ok) workspace.clear();
    ensureBlocklyInteractive();
    focusWorkspace();
  });

  ui.btnUndo?.addEventListener("click", () => {
    closeBlocklyEditors();
    workspace.undo(false);
    ensureBlocklyInteractive();
    focusWorkspace();
  });

  ui.btnRedo?.addEventListener("click", () => {
    closeBlocklyEditors();
    workspace.undo(true);
    ensureBlocklyInteractive();
    focusWorkspace();
  });

  ui.logo?.addEventListener("dblclick", () => window.electronAPI?.reloadApp?.());

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      window.electronAPI?.reloadApp?.();
    }
  });

  // ────────────────────────────────────────────────────────────────
  // 💾 Save / Open
  // ────────────────────────────────────────────────────────────────
  ui.btnSave?.addEventListener("click", async () => {
    try {
      closeBlocklyEditors();
      if (!window.electronAPI?.saveProject) {
        await showAlertOverlay("❌ saveProject ist nicht verfügbar.\nBitte preload.js prüfen.");
        return;
      }

      const xmlDom = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToPrettyText(xmlDom);

      const res = await window.electronAPI.saveProject(xmlText);
      if (res?.ok) await showAlertOverlay("✅ Gespeichert:\n" + res.filePath);

      ensureBlocklyInteractive();
      focusWorkspace();
    } catch (e) {
      console.error(e);
      await showAlertOverlay("❌ Speichern fehlgeschlagen:\n" + e);
    }
  });

  ui.btnOpen?.addEventListener("click", async () => {
    try {
      closeBlocklyEditors();
      if (!window.electronAPI?.openProject) {
        await showAlertOverlay("❌ openProject ist nicht verfügbar.\nBitte preload.js prüfen.");
        return;
      }

      const res = await window.electronAPI.openProject();
      if (!res?.ok) return;

      const textToDom = (Blockly?.utils?.xml?.textToDom) || (Blockly?.Xml?.textToDom);
      if (!textToDom) throw new Error("XML Parser fehlt: Blockly.utils.xml.textToDom nicht gefunden");

      const dom = textToDom(res.xmlText);

      workspace.setResizesEnabled?.(false);
      workspace.clear();
      Blockly.Xml.domToWorkspace(dom, workspace);
      workspace.setResizesEnabled?.(true);

      ensureBlocklyInteractive();
      await showAlertOverlay("✅ Geladen:\n" + res.filePath);
      focusWorkspace();
    } catch (e) {
      console.error(e);
      await showAlertOverlay("❌ Laden fehlgeschlagen:\n" + e);
      try { workspace.setResizesEnabled?.(true); } catch {}
    }
  });

  // ────────────────────────────────────────────────────────────────
  // 🔌 Verbindung & Upload
  // ────────────────────────────────────────────────────────────────
  function createPortOverlay(ports) {
    return new Promise((resolve) => {
      const overlay = createOverlay({ zIndex: 9999 });
      const box = createBox();

      const portsHtml = ports.map((p) => `
        <button data-port="${p}" style="
          margin:4px; padding:6px 12px; border:none; border-radius:8px;
          background:#9AC22F; color:#000; cursor:pointer;
        ">${p}</button>`).join("");

      box.innerHTML = `
        <p style="margin:0 0 10px 0;">Gefundene Ports:</p>
        <div style="margin-bottom:10px;">${portsHtml}</div>
        <button id="cancelBtn" style="
          margin-top:6px; padding:6px 12px; border:none; border-radius:8px;
          background:#FF7B00; color:#000; cursor:pointer;
        ">Abbrechen</button>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const cleanup = (value) => {
        overlay.remove();
        ensureBlocklyInteractive();
        focusWorkspace();
        resolve(value);
      };

      box.querySelectorAll("button[data-port]").forEach((btn) => {
        btn.addEventListener("click", () => cleanup(btn.getAttribute("data-port")));
      });

      box.querySelector("#cancelBtn")?.addEventListener("click", () => cleanup(null));
      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) cleanup(null);
      });
    });
  }

  ui.btnConnect?.addEventListener("click", async () => {
    try {
      closeBlocklyEditors();

      const ports = await window.electronAPI?.listPorts?.();
      if (!ports || !ports.length) {
        await showAlertOverlay("⚠️ Kein Arduino gefunden.\nBitte Kabel prüfen und erneut versuchen.");
        return;
      }

      const port = await createPortOverlay(ports);
      if (!port) return;

      window.selectedPort = port;
      ui.btnConnect.textContent = "✅";
      ui.btnConnect.title = `Verbunden: ${port}`;

      ensureBlocklyInteractive();
      focusWorkspace();
    } catch (err) {
      await showAlertOverlay("Fehler beim Abrufen der Ports: " + err);
    }
  });

  ui.btnUpload?.addEventListener("click", async () => {
    const board = ui.boardSelect?.value;
    const port = window.selectedPort || null;

    if (!port) {
      await showAlertOverlay("Bitte zuerst 🔌 Verbinden und Port wählen.");
      return;
    }

    closeBlocklyEditors();

    const code = generateFullSketch();

    const overlay = createOverlay({ zIndex: 99999 });
    overlay.style.fontSize = "22px";
    overlay.style.color = "#E9E1BE";
    overlay.textContent = "⏳ Code wird hochgeladen...";
    document.body.appendChild(overlay);

    ui.btnUpload.disabled = true;

    try {
      await window.electronAPI.uploadToArduino(code, board, port);

      overlay.textContent = "✅ Upload erfolgreich!";

      setTimeout(() => {
        overlay.remove();
        ui.btnUpload.disabled = false;
        ensureBlocklyInteractive();
        safe(() => workspace.refreshToolboxSelection_?.());
        focusWorkspace();
      }, 900);
    } catch (err) {
      console.error(err);
      overlay.textContent = "❌ Upload fehlgeschlagen";

      setTimeout(() => {
        overlay.remove();
        ui.btnUpload.disabled = false;
        ensureBlocklyInteractive();
        focusWorkspace();
      }, 1200);
    }
  });

  // ────────────────────────────────────────────────────────────────
  // ✅ Debug: DevTools öffnen (Konsole) – versteckter Button + Shortcut
  // ────────────────────────────────────────────────────────────────
  (function moonyDebugTools() {
    function openDevTools() {
      const api = window.moonyDebug;
      if (api && typeof api.openDevTools === "function") {
        api.openDevTools();
      } else {
        alert("❌ moonyDebug.openDevTools fehlt.\nBitte preload.js prüfen.");
      }
    }

    // Shortcut: Ctrl + Alt + D
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        openDevTools();
      }
    });

    // Fast unsichtbarer Button oben rechts
    document.addEventListener("DOMContentLoaded", () => {
      const btn = document.createElement("button");
      btn.textContent = "Debug";
      btn.title = "Konsole/DevTools öffnen (Ctrl+Alt+D)";
      btn.style.cssText = `
        position:fixed; top:8px; right:8px; z-index:999999;
        padding:6px 10px; border-radius:10px;
        border:1px solid #FF7B00;
        background:#162347; color:#E9E1BE;
        cursor:pointer;
        opacity:0.05;
      `;
      btn.addEventListener("mouseenter", () => (btn.style.opacity = "0.85"));
      btn.addEventListener("mouseleave", () => (btn.style.opacity = "0.05"));
      btn.addEventListener("click", openDevTools);
      document.body.appendChild(btn);
    });
  })();

})();