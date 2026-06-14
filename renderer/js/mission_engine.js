/* ============================================================
   MOONY – MISSIONSTERMINAL (Engine, Phase B)
   ------------------------------------------------------------
   Diese Datei NICHT bearbeiten. Neu in Phase B:
     - erkennt automatisch, ob der richtige Block gesetzt ist
       (der Weiter-Knopf bleibt gesperrt, bis Moony ihn sieht)
     - erkennt, ob hochgeladen wurde
     - Ein-/Ausblenden-Knopf (📡) in der Kopfleiste
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

  /* ---------- Block-Erkennung (alle Arbeitsflächen) ---------- */

  // Alle bekannten Arbeitsflächen einsammeln (window.workspace, Hauptfläche,
  // und alle registrierten Workspaces).
  function alleWorkspaces() {
    var list = [], seen = [];
    function add(w) { if (w && seen.indexOf(w) < 0) { seen.push(w); list.push(w); } }
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

  // Erzeugt den Arduino-Code (das ist die "Wahrheit" über das Programm) und
  // stößt dabei zugleich an, dass Blockly schwebende Blöcke übernimmt.
  function erzeugeCode() {
    try {
      if (window.Blockly && Blockly.Arduino && Blockly.Arduino.workspaceToCode && window.workspace) {
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

    // Code einmal erzeugen – das übernimmt zugleich schwebende Blöcke.
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
    return '<div class="terminal-head">' +
      '<span class="terminal-title">Missionsterminal</span>' +
      '<span class="terminal-mission">Mission ' + esc(m.id) + ' — ' + esc(m.titel) + '</span></div>';
  }

  /* ---------- Rendern ---------- */

  function render() {
    var m = missions[mIndex];
    if (!m) { renderAllDone(); return; }

    var html = header(m);

    if (sIndex === -1) { // Intro
      html += bubble(m.intro) + energyBar() +
        '<div class="terminal-actions"><button class="m-btn primary" id="m-start">Bereit, los geht\'s</button></div>';
      panel.innerHTML = html; bind(); return;
    }

    if (sIndex >= m.schritte.length) { // Abschluss
      html += bubble(m.abschluss || "Mission abgeschlossen!") + energyBar();
      html += '<div class="terminal-actions">';
      html += (mIndex + 1 < missions.length)
        ? '<button class="m-btn primary" id="m-next-mission">Nächste Mission</button>'
        : '<div class="m-done">✔ Mission abgeschlossen</div>';
      html += '</div>';
      panel.innerHTML = html; bind(); return;
    }

    var s = m.schritte[sIndex];

    if (s.typ === "bestaetigung") {
      html += bubble(hinweis ? hinweis : s.moony) + stepList(m, sIndex) + energyBar() +
        '<div class="terminal-actions">' +
        '<button class="m-btn primary" id="m-yes">' + esc(s.ja || "Ja") + '</button>' +
        '<button class="m-btn" id="m-no">' + esc(s.nein || "Nein") + '</button></div>';
      panel.innerHTML = html; bind(); return;
    }

    // typ "anweisung"
    html += bubble(s.moony) + stepList(m, sIndex);
    html += '<div class="m-scan" id="m-scan"></div>';
    html += energyBar();
    html += '<div class="terminal-actions"><button class="m-btn primary" id="m-weiter">' + esc(s.knopf || "Weiter") + '</button></div>';
    html += '<pre id="m-debug" style="margin-top:14px;padding:8px;font-size:11px;line-height:1.4;white-space:pre-wrap;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#ffd479;overflow-x:auto;"></pre>';
    panel.innerHTML = html; bind();
    refreshDetection();
  }

  function renderAllDone() {
    panel.innerHTML = '<div class="terminal-head"><span class="terminal-title">Missionsterminal</span></div>' +
      bubble("Alle Missionen geschafft, Operator. Stark!") + energyBar();
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
      var dbg = document.getElementById("m-debug");
      if (dbg) dbg.textContent = debugStruktur();
      if (!btn) return;

      // Knopf bleibt IMMER klickbar – Erkennung ist nur ein Hinweis,
      // damit niemand stecken bleibt, falls sie mal hakt.
      btn.disabled = false;

      if (!s.pruefung) { if (scan) scan.textContent = ""; return; }

      var ok = pruefungErfuellt(s.pruefung);
      if (scan) {
        scan.textContent = ok ? "✔ Erkannt – bestätige, wenn du bereit bist." : "⏳ Moony scannt … (du kannst trotzdem bestätigen)";
        scan.className = ok ? "m-scan ok" : "m-scan";
      }
    } catch (e) {
      /* niemals die Erkennung stoppen */
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
    if (nextM) nextM.onclick = function () {
      mIndex += 1; goTo(-1);
    };
  }

  /* ---------- Verbindung zur App ---------- */

  function togglePanel() {
    document.body.classList.toggle("mission-active");
    resizeBlockly(); setTimeout(resizeBlockly, 300);
  }

  function attachListeners(tries) {
    tries = tries || 0;
    // Live-Erkennung bei jeder Änderung in der Blockfläche.
    // Sofort prüfen UND kurz danach nochmal (für den eingependelten
    // Zustand nach dem Ziehen/Löschen eines Blocks).
    if (window.workspace && window.workspace.addChangeListener) {
      window.workspace.addChangeListener(function () {
        refreshDetection();
        setTimeout(refreshDetection, 60);
      });
    } else if (tries < 20) {
      return setTimeout(function () { attachListeners(tries + 1); }, 250);
    }
    // "Hochladen"-Klick mitzählen
    var up = document.getElementById("btn-upload");
    if (up) up.addEventListener("click", function () { uploadCount += 1; setTimeout(refreshDetection, 50); });
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
    document.body.classList.add("mission-active"); // beim Start sichtbar
    resizeBlockly(); setTimeout(resizeBlockly, 300);
    attachListeners();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
