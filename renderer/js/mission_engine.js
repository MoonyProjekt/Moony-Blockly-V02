/* ============================================================
   MOONY – MISSIONSTERMINAL (Engine, Phase B+C)
   ------------------------------------------------------------
   Phase B: Block-Erkennung, Polling, Energieleiste
   Phase C: Sprachausgabe (Web Speech API, Chromium built-in)
     - 🔊/🔇-Knopf in der Kopfleiste schaltet Stimme ein/aus
     - Einstellung wird gespeichert (localStorage)
     - Funktioniert ohne Audiodateien, liest jeden Text automatisch
     - Deutsche Stimme wird bevorzugt (auf Windows fast immer vorhanden)
   Texte stehen in: missions_data.js
   ============================================================ */
(function () {
  "use strict";

  var missions = window.MOONY_MISSIONS || [];
  var panel = document.getElementById("missionPanel");
  if (!panel) return;

  var mIndex = 0;          // welche Mission
  var sIndex = -1;         // -1 = Intro
  var energie = 0;         // 0..100
  var hinweis = "";        // optionaler Hinweis (nach "Nein")
  var uploadCount = 0;     // wie oft wurde "Hochladen" geklickt
  var uploadBaseline = 0;  // Stand beim Betreten des aktuellen Schritts
  var aktuellerSchueler = localStorage.getItem("moony-aktuell") || "";

  /* ---------- Sprachausgabe (Phase C) ---------- */

  var ttsOn = (localStorage.getItem("moony-tts") === "1");
  var ttsVoice = null;
  var ttsLastKey = "";  // verhindert doppeltes Sprechen beim erneuten render()
  var ttsAudio = null;  // aktuell laufende MP3

  function initTTS() {
    if (!window.speechSynthesis) return;
    function ladeStimmen() {
      var stimmen = window.speechSynthesis.getVoices() || [];
      // Deutsche Stimme bevorzugen, sonst erste verfügbare
      ttsVoice = stimmen.find(function (v) { return v.lang && v.lang.startsWith("de"); })
               || stimmen[0] || null;
    }
    ladeStimmen();
    // Chrome lädt Stimmen asynchron – nochmal laden sobald bereit
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener("voiceschanged", ladeStimmen);
    }
  }

  // Fallback: Windows-Stimme wenn keine MP3 vorhanden
  function webSpeechFallback(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang  = "de-DE";
    u.rate  = 0.92;
    u.pitch = 1.05;
    if (ttsVoice) u.voice = ttsVoice;
    window.speechSynthesis.speak(u);
  }

  // text = der gesprochene Text
  // key  = eindeutiger Schlüssel (verhindert Wiederholung bei erneutem render)
  // Versucht zuerst renderer/audio/{key}.mp3 zu spielen.
  // Wenn die Datei fehlt → automatisch Windows-Stimme als Fallback.
  function spreche(text, key) {
    if (!ttsOn || !text) return;
    key = key || text;
    if (key === ttsLastKey) return;
    ttsLastKey = key;

    // Laufende Ausgabe stoppen
    if (ttsAudio) { ttsAudio.pause(); ttsAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // MP3 versuchen
    var audio = new Audio("audio/" + key + ".mp3");
    audio.onerror = function () { webSpeechFallback(text); };
    ttsAudio = audio;
    audio.play().catch(function () { webSpeechFallback(text); });
  }

  function toggleTTS() {
    ttsOn = !ttsOn;
    localStorage.setItem("moony-tts", ttsOn ? "1" : "0");
    if (!ttsOn) {
      if (ttsAudio) { ttsAudio.pause(); ttsAudio = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    ttsLastKey = ""; // nach Toggle: aktuellen Text neu sprechen
    render();        // Knopf-Symbol aktualisieren
  }

  function clamp(n) { return Math.max(0, Math.min(100, n)); }

  function resizeBlockly() {
    try {
      if (window.Blockly && window.workspace && Blockly.svgResize) {
        Blockly.svgResize(window.workspace);
      }
    } catch (e) {}
  }

  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- Fortschritt pro Schüler (localStorage) ---------- */

  function ladeAlleSchueler() {
    try { return JSON.parse(localStorage.getItem("moony-schueler") || "{}"); } catch (e) { return {}; }
  }
  function ladeProgress() {
    if (!aktuellerSchueler) return {};
    return ladeAlleSchueler()[aktuellerSchueler] || {};
  }
  function speichereAbschluss(idx) {
    if (!aktuellerSchueler) return;
    var alle = ladeAlleSchueler();
    var p = alle[aktuellerSchueler] || {};
    p.abgeschlossen = p.abgeschlossen || [];
    if (p.abgeschlossen.indexOf(idx) < 0) p.abgeschlossen.push(idx);
    p.freigeschaltet = Math.max(p.freigeschaltet || 0, idx + 1);
    alle[aktuellerSchueler] = p;
    localStorage.setItem("moony-schueler", JSON.stringify(alle));
  }
  function istAbgeschlossen(idx) {
    return (ladeProgress().abgeschlossen || []).indexOf(idx) >= 0;
  }
  function freigeschaltetBis() {
    return ladeProgress().freigeschaltet || 0;
  }

  // 💾 Fortschritt als JSON-Datei herunterladen
  function exportProgress() {
    if (!aktuellerSchueler) return;
    var data = { name: aktuellerSchueler, fortschritt: ladeProgress(), version: 1 };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "moony-" + aktuellerSchueler.replace(/\s+/g, "-") + ".json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // 📂 Fortschritt aus JSON-Datei laden
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.name || !data.fortschritt) throw new Error("Ungültige Datei");
        var alle = ladeAlleSchueler();
        alle[data.name] = data.fortschritt;
        localStorage.setItem("moony-schueler", JSON.stringify(alle));
        aktuellerSchueler = data.name;
        localStorage.setItem("moony-aktuell", aktuellerSchueler);
        renderOverview();
      } catch (err) { alert("Datei konnte nicht geladen werden. Bitte eine gültige Moony-Datei wählen."); }
    };
    reader.readAsText(file);
  }

  /* ---------- Block-Erkennung (alle Arbeitsflächen) ---------- */

  // Alle bekannten Arbeitsflächen einsammeln (window.workspace, Hauptfläche,
  // und alle registrierten Workspaces).
  function alleWorkspaces() {
    var list = [], seen = [];
    // Nur echte Arbeitsflächen – KEIN Flyout (Werkzeugkiste) und kein Mutator.
    // Die Flyout-Workspaces enthalten alle verfügbaren Blöcke als Vorlage und
    // würden die Erkennung verfälschen (z.B. sound_beep immer vorhanden, obwohl
    // der Schüler ihn noch gar nicht auf die Fläche gezogen hat).
    function add(w) {
      if (w && seen.indexOf(w) < 0 && !w.isFlyout && !w.isMutator) {
        seen.push(w); list.push(w);
      }
    }
    try { add(window.workspace); } catch (e) {}
    try { if (window.Blockly && Blockly.getMainWorkspace) add(Blockly.getMainWorkspace()); } catch (e) {}
    try { if (window.Blockly && Blockly.Workspace && Blockly.Workspace.getAll) {
      var arr = Blockly.Workspace.getAll() || [];
      for (var i = 0; i < arr.length; i++) add(arr[i]);
    } } catch (e) {}
    return list;
  }

  function topBlocks() {
    var out = [];
    var wss = alleWorkspaces();
    for (var i = 0; i < wss.length; i++) {
      try {
        var w = wss[i];
        var t = w.getTopBlocks ? (w.getTopBlocks(false) || []) :
                (w.getAllBlocks ? (w.getAllBlocks(false) || []) : []);
        for (var j = 0; j < t.length; j++) out.push(t[j]);
      } catch (e) {}
    }
    return out;
  }

  function kinderVon(b) {
    try { if (b && b.getChildren) return b.getChildren(false) || []; } catch (e) {}
    return [];
  }

  // Sammelt ALLE Blöcke aus ALLEN Arbeitsflächen – über getAllBlocks und
  // über eigene Rekursion (getChildren). Unabhängig von getDescendants.
  function alleBlocke() {
    var seen = [], out = [];
    function push(b) { if (b && seen.indexOf(b) < 0) { seen.push(b); out.push(b); } }
    function rec(b) { if (!b || seen.indexOf(b) >= 0) return; push(b); var k = kinderVon(b); for (var i = 0; i < k.length; i++) rec(k[i]); }
    var wss = alleWorkspaces();
    for (var i = 0; i < wss.length; i++) {
      var w = wss[i];
      try { if (w.getAllBlocks) { var ab = w.getAllBlocks(false) || []; for (var j = 0; j < ab.length; j++) push(ab[j]); } } catch (e) {}
      try { if (w.getTopBlocks) { var tb = w.getTopBlocks(false) || []; for (var k = 0; k < tb.length; k++) rec(tb[k]); } } catch (e) {}
    }
    return out;
  }

  function elternVon(b) {
    try { if (b.getParent) { var p = b.getParent(); if (p) return p; } } catch (e) {}
    try { if (b.previousConnection && b.previousConnection.targetBlock) { var t = b.previousConnection.targetBlock(); if (t) return t; } } catch (e) {}
    try { if (b.outputConnection && b.outputConnection.targetBlock) { var o = b.outputConnection.targetBlock(); if (o) return o; } } catch (e) {}
    return null;
  }

  function blockVorhanden(type) {
    var all = alleBlocke();
    for (var i = 0; i < all.length; i++) if (all[i] && all[i].type === type) return true;
    return false;
  }

  function blockIn(childType, parentType) {
    var all = alleBlocke();
    for (var i = 0; i < all.length; i++) {
      var b = all[i];
      if (!b || b.type !== childType) continue;
      var p = elternVon(b), schutz = 0;
      while (p && schutz < 300) {
        if (p.type === parentType) return true;
        p = elternVon(p); schutz++;
      }
    }
    return false;
  }

  // Erzeugt den Arduino-Code – benutzt exakt dieselbe Funktion wie der Code-View in main.js.
  // window.moonyGenerateCode wird von main.js gesetzt (mit init() + workspaceToCode()).
  // Das ist zuverlässiger als eigene Code-Generierung, weil main.js die Funktion
  // schon in der richtigen Reihenfolge aufruft.
  function erzeugeCode() {
    try {
      if (window.moonyGenerateCode) return window.moonyGenerateCode() || "";
    } catch (e) {}
    // Notfall-Fallback (falls main.js noch nicht geladen hat):
    try {
      if (window.Blockly && Blockly.Arduino && Blockly.Arduino.workspaceToCode && window.workspace) {
        if (Blockly.Arduino.init) Blockly.Arduino.init(window.workspace);
        return Blockly.Arduino.workspaceToCode(window.workspace) || "";
      }
    } catch (e) {}
    try {
      var cv = document.getElementById("codeView");
      return cv ? (cv.textContent || "") : "";
    } catch (e) { return ""; }
  }

  // Schneidet den Inhalt von setup() bzw. loop() aus dem Code heraus.
  function codeAbschnitt(code, fn) {
    try {
      var marker = "void " + fn + "(";
      var i = code.indexOf(marker);
      if (i < 0) return "";
      var brace = code.indexOf("{", i);
      if (brace < 0) return "";
      var nextVoid = code.indexOf("void ", brace + 1);
      return code.slice(brace, nextVoid < 0 ? code.length : nextVoid);
    } catch (e) { return ""; }
  }

  // Code-Signatur für bekannte Blocktypen (Ersatzweg, falls die Blockliste
  // einen Block gerade nicht zurückgibt). Erweiterbar.
  var CODE_SIGNATUR = {
    "sound_beep": "tone(",
    "sound_signal": "tone(",
    "led_set": "digitalWrite("
  };
  // parentType -> Code-Funktion
  function funktionVon(parentType) {
    if (parentType === "program_start_once") return "setup";
    if (parentType === "program_start_forever") return "loop";
    if (parentType === "program_loop_forever") return "loop";
    return null;
  }

  // Prüft eine Regel aus missions_data.js. Ohne Regel: immer erfüllt (manuell).
  function pruefungErfuellt(p) {
    if (!p) return true;

    // Code einmal erzeugen – benutzt window.moonyGenerateCode aus main.js.
    var code = erzeugeCode();

    if (p.typ === "block_vorhanden") {
      if (blockVorhanden(p.block)) return true;
      // Ersatzweg über Code:
      var sig = p.code || CODE_SIGNATUR[p.block];
      if (sig && code.indexOf(sig) >= 0) return true;
      return false;
    }

    if (p.typ === "block_in") {
      if (blockIn(p.block, p["in"])) return true;
      // Ersatzweg: Signatur des Kind-Blocks im richtigen Code-Abschnitt suchen
      var sig2 = p.code || CODE_SIGNATUR[p.block];
      var fn = funktionVon(p["in"]);
      if (sig2 && fn) {
        var abschnitt = codeAbschnitt(code, fn);
        if (abschnitt.indexOf(sig2) >= 0) return true;
      }
      return false;
    }

    if (p.typ === "hochgeladen") return uploadCount > uploadBaseline;
    return true;
  }

  /* ---------- Bausteine fürs Panel ---------- */

  function avatar() {
    return '<div class="moony-face" aria-hidden="true"><span></span><span></span></div>';
  }
  function bubble(text) {
    return '<div class="moony-row">' + avatar() +
      '<div class="moony-bubble">' + esc(text) + '</div></div>';
  }
  function energyBar() {
    return '<div class="energy">' +
      '<div class="energy-label"><span>Energie</span><span>' + Math.round(energie) + '%</span></div>' +
      '<div class="energy-track"><div class="energy-fill" style="width:' + clamp(energie) + '%"></div></div>' +
      '</div>';
  }
  function stepList(m, activeIndex) {
    var html = '<div class="ziele">';
    for (var i = 0; i < m.schritte.length; i++) {
      var s = m.schritte[i];
      if (s.typ === "bestaetigung") continue;
      var cls = "ziel", icon = "○";
      if (i < activeIndex) { cls += " done"; icon = "●"; }
      else if (i === activeIndex) { cls += " active"; }
      html += '<div class="' + cls + '"><span class="ziel-icon">' + icon + '</span>' + esc(s.aufgabe || "") + '</div>';
    }
    return html + '</div>';
  }
  function header(m) {
    var ttsSymbol = ttsOn ? "🔊" : "🔇";
    return '<div class="terminal-head">' +
      '<span class="terminal-title">Missionsterminal</span>' +
      '<span class="terminal-mission">Mission ' + esc(m.id) + ' — ' + esc(m.titel) + '</span>' +
      '<button id="btn-overview" title="Missionsübersicht" style="background:none;border:none;cursor:pointer;font-size:15px;opacity:0.75;padding:2px 4px;margin-left:auto;flex-shrink:0;">📋</button>' +
      '<button id="btn-tts" title="Sprachausgabe ein/aus" style="background:none;border:none;cursor:pointer;font-size:15px;opacity:0.75;padding:2px 6px;flex-shrink:0;">' + ttsSymbol + '</button>' +
      '</div>';
  }

  /* ---------- Rendern ---------- */

  function render() {
    var m = missions[mIndex];
    if (!m) { renderAllDone(); return; }

    var html = header(m);

    if (sIndex === -1) { // Intro
      html += bubble(m.intro) + energyBar() +
        '<div class="terminal-actions"><button class="m-btn primary" id="m-start">Bereit, los geht\'s</button></div>';
      panel.innerHTML = html; bind();
      spreche(m.intro, "i" + mIndex);
      return;
    }

    if (sIndex >= m.schritte.length) { // Abschluss
      speichereAbschluss(mIndex);       // Fortschritt speichern
      html += bubble(m.abschluss || "Mission abgeschlossen!") + energyBar();
      html += '<div class="terminal-actions">';
      html += '<button class="m-btn primary" id="m-next-mission">Zur Missionsübersicht</button>';
      html += '</div>';
      panel.innerHTML = html; bind();
      spreche(m.abschluss || "Mission abgeschlossen!", "d" + mIndex);
      return;
    }

    var s = m.schritte[sIndex];

    if (s.typ === "bestaetigung") {
      var bText = hinweis ? hinweis : s.moony;
      html += bubble(bText) + stepList(m, sIndex) + energyBar() +
        '<div class="terminal-actions">' +
        '<button class="m-btn primary" id="m-yes">' + esc(s.ja || "Ja") + '</button>' +
        '<button class="m-btn" id="m-no">' + esc(s.nein || "Nein") + '</button></div>';
      panel.innerHTML = html; bind();
      spreche(bText, "b" + mIndex + "-" + sIndex + (hinweis ? "h" : ""));
      return;
    }

    // typ "anweisung"
    html += bubble(s.moony) + stepList(m, sIndex);
    html += '<div class="m-scan" id="m-scan"></div>';
    html += energyBar();
    html += '<div class="terminal-actions"><button class="m-btn primary" id="m-weiter">' + esc(s.knopf || "Weiter") + '</button></div>';
    panel.innerHTML = html; bind();
    spreche(s.moony, "s" + mIndex + "-" + sIndex);
    refreshDetection();
  }

  function renderAllDone() {
    panel.innerHTML = '<div class="terminal-head"><span class="terminal-title">Missionsterminal</span></div>' +
      bubble("Alle Missionen geschafft, Operator. Stark!") + energyBar();
  }

  /* ---------- Name-Screen ---------- */

  function renderNameScreen() {
    var alle = ladeAlleSchueler();
    var namen = Object.keys(alle);
    var ttsSymbol = ttsOn ? "🔊" : "🔇";

    var html = '<div class="terminal-head">' +
      '<span class="terminal-title">Missionsterminal</span>' +
      '<span class="terminal-mission">Moony – Das Schwarmprotokoll</span>' +
      '<button id="btn-tts" title="Sprachausgabe" style="background:none;border:none;cursor:pointer;font-size:15px;opacity:0.75;padding:2px 6px;margin-left:auto;flex-shrink:0;">' + ttsSymbol + '</button>' +
      '</div>';

    html += bubble("Operator? Wer bist du? Ich brauche deinen Namen um deinen Fortschritt zu speichern.");

    // Bekannte Schüler
    if (namen.length > 0) {
      html += '<p style="font-size:11px;font-weight:500;opacity:.6;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 8px;">Bekannte Personen</p>';
      namen.forEach(function (name) {
        var p = alle[name] || {};
        var count = (p.abgeschlossen || []).length;
        var max   = missions.length;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;margin-bottom:6px;' +
          'background:var(--color-background-secondary);border-radius:var(--border-radius-lg);' +
          'border:0.5px solid var(--color-border-tertiary);">' +
          '<span style="font-size:18px;">👤</span>' +
          '<div style="flex:1;">' +
            '<div style="font-size:14px;font-weight:500;">' + esc(name) + '</div>' +
            '<div style="font-size:11px;opacity:.6;">' + count + ' von ' + max + ' Missionen abgeschlossen</div>' +
          '</div>' +
          '<button class="m-btn primary" data-name="' + esc(name) + '">Auswählen</button>' +
          '</div>';
      });
    }

    // Neuer Schüler
    html += '<p style="font-size:11px;font-weight:500;opacity:.6;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 8px;">Neue Person</p>';
    html += '<div style="display:flex;gap:8px;">' +
      '<input id="neuer-name" type="text" placeholder="Deinen Namen eingeben …" ' +
      'style="flex:1;padding:8px 12px;border-radius:var(--border-radius-md);' +
      'border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);' +
      'color:var(--color-text-primary);font-size:14px;">' +
      '<button class="m-btn primary" id="btn-neuer-name">Los!</button>' +
      '</div>';

    // Import
    html += '<div style="margin-top:12px;">' +
      '<button class="m-btn" id="btn-import-trigger" style="width:100%;justify-content:center;">📂 Fortschritt von Datei laden</button>' +
      '<input type="file" id="file-import" accept=".json" style="display:none;"></div>';

    panel.innerHTML = html;

    // Bekannten Schüler auswählen
    panel.querySelectorAll("[data-name]").forEach(function (btn) {
      btn.onclick = function () {
        aktuellerSchueler = this.getAttribute("data-name");
        localStorage.setItem("moony-aktuell", aktuellerSchueler);
        renderOverview();
      };
    });

    // Neuen Schüler anlegen
    function neuerName() {
      var name = (document.getElementById("neuer-name") || {}).value || "";
      name = name.trim();
      if (!name) { alert("Bitte einen Namen eingeben."); return; }
      aktuellerSchueler = name;
      localStorage.setItem("moony-aktuell", aktuellerSchueler);
      // Neuen Eintrag anlegen falls noch nicht vorhanden
      var alle2 = ladeAlleSchueler();
      if (!alle2[name]) { alle2[name] = {}; localStorage.setItem("moony-schueler", JSON.stringify(alle2)); }
      renderOverview();
    }
    var btnNeu = document.getElementById("btn-neuer-name");
    if (btnNeu) btnNeu.onclick = neuerName;
    var inputName = document.getElementById("neuer-name");
    if (inputName) inputName.addEventListener("keydown", function (e) { if (e.key === "Enter") neuerName(); });

    // Import
    var btnImport = document.getElementById("btn-import-trigger");
    var fileInput  = document.getElementById("file-import");
    if (btnImport) btnImport.onclick = function () { fileInput.click(); };
    if (fileInput) fileInput.onchange = function () { if (this.files[0]) importProgress(this.files[0]); };

    var ttsBtn = document.getElementById("btn-tts");
    if (ttsBtn) ttsBtn.onclick = toggleTTS;
  }

  /* ---------- Missionsübersicht ---------- */

  function renderOverview() {
    var frei = freigeschaltetBis();
    var ttsSymbol = ttsOn ? "🔊" : "🔇";

    var html = '<div class="terminal-head">' +
      '<span class="terminal-title">Missionsterminal</span>' +
      '<span class="terminal-mission">Moony – Das Schwarmprotokoll</span>' +
      '<button id="btn-tts" title="Sprachausgabe ein/aus" style="background:none;border:none;cursor:pointer;font-size:15px;opacity:0.75;padding:2px 6px;margin-left:auto;flex-shrink:0;">' + ttsSymbol + '</button>' +
      '</div>';

    // Schüler-Info-Leiste
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:10px;' +
      'background:var(--color-background-secondary);border-radius:var(--border-radius-md);' +
      'border:0.5px solid var(--color-border-tertiary);font-size:13px;">' +
      '<span>👤</span><span style="flex:1;font-weight:500;">' + esc(aktuellerSchueler) + '</span>' +
      '<button class="m-btn" id="btn-export" style="font-size:12px;padding:3px 9px;">💾 Speichern</button>' +
      '<button class="m-btn" id="btn-wechseln" style="font-size:12px;padding:3px 9px;">Wechseln</button>' +
      '</div>';

    html += '<p style="font-size:12px;opacity:.6;margin-bottom:10px;">Wähle eine Mission:</p>';

    missions.forEach(function (m, i) {
      var done    = istAbgeschlossen(i);
      var locked  = i > frei;
      var icon    = done ? "✅" : locked ? "🔒" : "📡";
      var opacity = locked ? "opacity:.4;" : "";
      var btnHtml = locked ? "" :
        '<button class="m-btn' + (done ? "" : " primary") + '" data-idx="' + i + '" style="flex-shrink:0;">' +
        (done ? "Wiederholen" : "Starten") + '</button>';

      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;' +
        'background:var(--color-background-secondary);border-radius:var(--border-radius-lg);' +
        'border:0.5px solid var(--color-border-tertiary);' + opacity + '">' +
        '<span style="font-size:20px;flex-shrink:0;">' + icon + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:11px;opacity:.6;font-weight:500;text-transform:uppercase;letter-spacing:.04em;">Mission ' + esc(m.id) + '</div>' +
          '<div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(m.titel) + '</div>' +
        '</div>' + btnHtml + '</div>';
    });

    panel.innerHTML = html;

    // Missions-Knöpfe
    panel.querySelectorAll("[data-idx]").forEach(function (btn) {
      btn.onclick = function () {
        mIndex = parseInt(this.getAttribute("data-idx"));
        sIndex = -1; energie = 0; hinweis = ""; ttsLastKey = "";
        render();
      };
    });

    document.getElementById("btn-export").onclick = exportProgress;
    document.getElementById("btn-wechseln").onclick = function () {
      aktuellerSchueler = "";
      localStorage.removeItem("moony-aktuell");
      renderNameScreen();
    };
    var ttsBtn = document.getElementById("btn-tts");
    if (ttsBtn) ttsBtn.onclick = toggleTTS;
  }

  // ---- DIAGNOSE ----
  function typeOf(b) { return b ? b.type : "—"; }
  function debugStruktur() {
    try {
      var lines = [];
      var wss = alleWorkspaces();
      for (var i = 0; i < wss.length; i++) {
        var ab = [];
        try { ab = wss[i].getAllBlocks ? (wss[i].getAllBlocks(false) || []) : []; } catch (e) {}
        lines.push("WS#" + i + ": " + ab.length + " [" + ab.map(typeOf).join(", ") + "]");
      }
      var all = alleBlocke();
      lines.push("zusammengeführt: [" + all.map(typeOf).join(", ") + "]");
      var code = erzeugeCode();
      lines.push("--- CODE (" + code.length + " Z.) ---");
      lines.push(code.slice(0, 350));
      lines.push("tone( in setup: " + (codeAbschnitt(code, "setup").indexOf("tone(") >= 0));
      return lines.join("\n");
    } catch (e) { return "Diagnose-Fehler: " + e.message; }
  }


  // Aktualisiert nur Knopf + Scan-Zeile (ohne Flackern), während gearbeitet wird.
  // Komplett absturzsicher: ein Fehler darf die Live-Erkennung nie lahmlegen.
  function refreshDetection() {
    try {
      if (!document.body.classList.contains("mission-active")) return;
      var m = missions[mIndex];
      if (!m || sIndex < 0 || sIndex >= m.schritte.length) return;
      var s = m.schritte[sIndex];
      if (s.typ !== "anweisung") return;

      var btn = document.getElementById("m-weiter");
      var scan = document.getElementById("m-scan");
      if (!btn) return;

      // Kein Check definiert → Knopf immer frei, kein Scan-Text
      if (!s.pruefung) { btn.disabled = false; if (scan) scan.textContent = ""; return; }

      var ok = pruefungErfuellt(s.pruefung);

      // Harte Erkennung: Knopf gesperrt bis die Bedingung erfüllt ist.
      // Kein Sicherheitstimer mehr – mit init() ist die Erkennung zuverlässig genug.
      btn.disabled = !ok;

      if (scan) {
        scan.textContent = ok ? "✔ Erkannt – bestätige, wenn du bereit bist." : "⏳ Moony scannt …";
        scan.className = ok ? "m-scan ok" : "m-scan";
      }
    } catch (e) {
      // Niemals abstürzen – bei unerwarteten Fehlern Knopf freigeben
      try { var b = document.getElementById("m-weiter"); if (b) b.disabled = false; } catch (e2) {}
    }
  }

  /* ---------- Ablauf ---------- */

  function goTo(i) {
    sIndex = i;
    uploadBaseline = uploadCount; // Upload-Zähler für diesen Schritt zurücksetzen
    hinweis = "";
    render();
  }

  function gainAndAdvance(s) {
    if (s && typeof s.energie === "number") energie = clamp(energie + s.energie);
    goTo(sIndex + 1);
  }

  function bind() {
    var start = document.getElementById("m-start");
    if (start) start.onclick = function () { goTo(0); };

    var weiter = document.getElementById("m-weiter");
    if (weiter) weiter.onclick = function () {
      if (this.disabled) return;
      gainAndAdvance(missions[mIndex].schritte[sIndex]);
    };

    var yes = document.getElementById("m-yes");
    if (yes) yes.onclick = function () {
      gainAndAdvance(missions[mIndex].schritte[sIndex]);
    };

    var no = document.getElementById("m-no");
    if (no) no.onclick = function () {
      hinweis = missions[mIndex].schritte[sIndex].neinAntwort || "Versuch es nochmal."; render();
    };

    var nextM = document.getElementById("m-next-mission");
    if (nextM) nextM.onclick = function () { renderOverview(); };

    var ttsBtn = document.getElementById("btn-tts");
    if (ttsBtn) ttsBtn.onclick = toggleTTS;

    var ovBtn = document.getElementById("btn-overview");
    if (ovBtn) ovBtn.onclick = function () { renderOverview(); };
  }

  /* ---------- Verbindung zur App ---------- */

  function togglePanel() {
    document.body.classList.toggle("mission-active");
    resizeBlockly(); setTimeout(resizeBlockly, 300);
  }

  function attachListeners(tries) {
    tries = tries || 0;
    if (window.workspace) {
      // ── Polling statt Event-Listener ──────────────────────────────────────────
      // Blockly's Zelos-Renderer aktualisiert seinen internen Zustand verzögert.
      // Events feuern zu früh (Blöcke noch nicht registriert).
      // Lösung: alle 500 ms prüfen – dann ist Blockly garantiert fertig.
      setInterval(refreshDetection, 500);
    } else if (tries < 20) {
      return setTimeout(function () { attachListeners(tries + 1); }, 250);
    }
    // "Hochladen"-Klick mitzählen (bleibt event-basiert, da kein Timing-Problem)
    var up = document.getElementById("btn-upload");
    if (up) up.addEventListener("click", function () { uploadCount += 1; refreshDetection(); });
    // Ein-/Ausblenden-Knopf
    var mb = document.getElementById("btn-mission");
    if (mb) mb.addEventListener("click", togglePanel);
  }

  function init() {
    if (!missions.length) {
      panel.innerHTML = "<div class='terminal-head'><span class='terminal-title'>Missionsterminal</span></div>" +
        "<p style='font-size:13px;opacity:.7'>Keine Missionen gefunden.</p>";
      return;
    }
    initTTS();
    document.body.classList.add("mission-active");
    resizeBlockly(); setTimeout(resizeBlockly, 300);
    attachListeners();
    if (aktuellerSchueler) renderOverview(); else renderNameScreen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
