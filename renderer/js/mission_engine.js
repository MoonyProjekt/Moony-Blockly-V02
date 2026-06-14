/* ============================================================
   MOONY – MISSIONSTERMINAL (Engine, Phase A)
   ------------------------------------------------------------
   Diese Datei NICHT bearbeiten. Sie baut das Panel rechts auf,
   zeigt Moonys Funksprüche, hakt Ziele ab und füllt die
   Energieleiste. Die Texte stehen in: missions_data.js
   ============================================================ */
(function () {
  "use strict";

  var missions = window.MOONY_MISSIONS || [];
  var panel = document.getElementById("missionPanel");
  if (!panel) return;

  var mIndex = 0;     // welche Mission
  var sIndex = -1;    // -1 = Intro, sonst Schritt-Nummer
  var energie = 0;    // 0..100
  var hinweis = "";   // optionaler Hinweis (z. B. nach "Nein")

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
      // Bestätigungs-Schritte tauchen nicht als eigenes Ziel auf
      if (s.typ === "bestaetigung") continue;
      var label = esc(s.aufgabe || "");
      var cls = "ziel";
      var icon = "○";
      if (i < activeIndex) { cls += " done"; icon = "●"; }
      else if (i === activeIndex) { cls += " active"; }
      html += '<div class="' + cls + '"><span class="ziel-icon">' + icon + '</span>' + label + '</div>';
    }
    html += '</div>';
    return html;
  }

  function header(m) {
    return '<div class="terminal-head">' +
      '<span class="terminal-title">Missionsterminal</span>' +
      '<span class="terminal-mission">Mission ' + esc(m.id) + ' — ' + esc(m.titel) + '</span>' +
      '</div>';
  }

  function render() {
    var m = missions[mIndex];
    if (!m) { renderAllDone(); return; }

    var html = header(m);

    // INTRO
    if (sIndex === -1) {
      html += bubble(m.intro);
      html += energyBar();
      html += '<div class="terminal-actions">' +
        '<button class="m-btn primary" id="m-start">Bereit, los geht\'s</button></div>';
      panel.innerHTML = html;
      bind();
      return;
    }

    // ABSCHLUSS der Mission
    if (sIndex >= m.schritte.length) {
      html += bubble(m.abschluss || "Mission abgeschlossen!");
      html += energyBar();
      var more = (mIndex + 1 < missions.length);
      html += '<div class="terminal-actions">';
      if (more) {
        html += '<button class="m-btn primary" id="m-next-mission">Nächste Mission</button>';
      } else {
        html += '<div class="m-done">✔ Mission abgeschlossen</div>';
      }
      html += '</div>';
      panel.innerHTML = html;
      bind();
      return;
    }

    // LAUFENDER SCHRITT
    var s = m.schritte[sIndex];

    if (s.typ === "bestaetigung") {
      html += bubble(hinweis ? hinweis : s.moony);
      html += stepList(m, sIndex);
      html += energyBar();
      html += '<div class="terminal-actions">' +
        '<button class="m-btn primary" id="m-yes">' + esc(s.ja || "Ja") + '</button>' +
        '<button class="m-btn" id="m-no">' + esc(s.nein || "Nein") + '</button>' +
        '</div>';
      panel.innerHTML = html;
      bind();
      return;
    }

    // typ "anweisung"
    html += bubble(s.moony);
    html += stepList(m, sIndex);
    html += energyBar();
    html += '<div class="terminal-actions">' +
      '<button class="m-btn primary" id="m-weiter">' + esc(s.knopf || "Weiter") + '</button></div>';
    panel.innerHTML = html;
    bind();
  }

  function renderAllDone() {
    panel.innerHTML = '<div class="terminal-head"><span class="terminal-title">Missionsterminal</span></div>' +
      bubble("Alle Missionen geschafft, Operator. Stark!") + energyBar();
  }

  function gainAndAdvance(s) {
    if (s && typeof s.energie === "number") energie = clamp(energie + s.energie);
    hinweis = "";
    sIndex += 1;
    render();
  }

  function bind() {
    var start = document.getElementById("m-start");
    if (start) start.onclick = function () { sIndex = 0; render(); };

    var weiter = document.getElementById("m-weiter");
    if (weiter) weiter.onclick = function () {
      gainAndAdvance(missions[mIndex].schritte[sIndex]);
    };

    var yes = document.getElementById("m-yes");
    if (yes) yes.onclick = function () {
      gainAndAdvance(missions[mIndex].schritte[sIndex]);
    };

    var no = document.getElementById("m-no");
    if (no) no.onclick = function () {
      hinweis = missions[mIndex].schritte[sIndex].neinAntwort || "Versuch es nochmal.";
      render();
    };

    var nextM = document.getElementById("m-next-mission");
    if (nextM) nextM.onclick = function () {
      mIndex += 1; sIndex = -1; render();
    };
  }

  function init() {
    if (!missions.length) {
      panel.innerHTML = "<div class='terminal-head'><span class='terminal-title'>Missionsterminal</span></div>" +
        "<p style='font-size:13px;opacity:.7'>Keine Missionen gefunden.</p>";
      return;
    }
    document.body.classList.add("mission-active");
    resizeBlockly();
    // Blockly braucht manchmal einen Moment, bis es bereit ist:
    setTimeout(resizeBlockly, 300);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
