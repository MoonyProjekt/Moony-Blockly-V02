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

  /* ---------- Block-Erkennung ---------- */

  // Oberste Blöcke der Arbeitsfläche
  function topBlocks() {
    try {
      var ws = window.workspace;
      if (!ws) return [];
      if (ws.getTopBlocks) return ws.getTopBlocks(false) || [];
      if (ws.getAllBlocks) return ws.getAllBlocks(false) || [];
      return [];
    } catch (e) { return []; }
  }

  // ALLE Blöcke inkl. eingehängter Unterblöcke (steigt in jeden Block hinein)
  function deepBlocks() {
    var tops = topBlocks();
    var out = [];
    for (var i = 0; i < tops.length; i++) {
      var b = tops[i];
      try {
        if (b && b.getDescendants) {
          var d = b.getDescendants(false) || [];
          for (var j = 0; j < d.length; j++) if (out.indexOf(d[j]) < 0) out.push(d[j]);
        } else if (b && out.indexOf(b) < 0) {
          out.push(b);
        }
      } catch (e) { /* Block im Umbau – überspringen */ }
    }
    return out;
  }

  function blockVorhanden(type) {
    var all = deepBlocks();
    for (var i = 0; i < all.length; i++) {
      if (all[i] && all[i].type === type) return true;
    }
    return false;
  }

  // Erfüllt, wenn ein Block vom Typ childType IRGENDWO innerhalb eines
  // Blocks vom Typ parentType eingehängt ist (egal wie tief).
  function blockIn(childType, parentType) {
    var all = deepBlocks();
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      try {
        if (p && p.type === parentType && p.getDescendants) {
          var d = p.getDescendants(false) || [];
          for (var j = 0; j < d.length; j++) {
            if (d[j] && d[j] !== p && d[j].type === childType) return true;
          }
        }
      } catch (e) { /* Block im Umbau – überspringen */ }
    }
    return false;
  }

  // Prüft eine Regel aus missions_data.js. Ohne Regel: immer erfüllt (manuell).
  function pruefungErfuellt(p) {
    if (!p) return true;
    if (p.typ === "block_vorhanden") return blockVorhanden(p.block);
    if (p.typ === "block_in") return blockIn(p.block, p["in"]);
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
    panel.innerHTML = html; bind();
    refreshDetection();
  }

  function renderAllDone() {
    panel.innerHTML = '<div class="terminal-head"><span class="terminal-title">Missionsterminal</span></div>' +
      bubble("Alle Missionen geschafft, Operator. Stark!") + energyBar();
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

      if (!s.pruefung) { btn.disabled = false; if (scan) scan.textContent = ""; return; }

      var ok = pruefungErfuellt(s.pruefung);
      btn.disabled = !ok;
      if (scan) {
        scan.textContent = ok ? "✔ Erkannt – bestätige, wenn du bereit bist." : "⏳ Moony scannt die Blöcke …";
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
