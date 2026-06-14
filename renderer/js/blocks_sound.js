// js/blocks_sound.js
(function () {
  "use strict";

  if (typeof Blockly === "undefined") return;

  // ✅ Theme-Styles (werden im theme.js als blockStyles definiert)
  const STYLE_SOUND_BUZZER = "sound_buzzer_blocks";
  const STYLE_SOUND_MUSIC  = "sound_music_blocks";

  const DEFAULT_BEEP_FREQ = 2000;

  // Dropdown-Options
  const MELODY_OPTIONS_GROUPED = [
    // ── Effekte ─────────────────────────
    ["🔔 Effekt: Coin (Punkt)", "MoonyFx_Coin"],
    ["✅ Effekt: Erfolg", "MoonyFx_Success"],
    ["❌ Effekt: Fehler", "MoonyFx_Error"],
    ["📩 Effekt: Benachrichtigung", "MoonyFx_Notify"],
    ["🔫 Effekt: Laser", "MoonyFx_Laser"],
    ["🚨 Effekt: Sirene", "MoonyFx_Siren"],

    // ── Signale ─────────────────────────
    ["🔔 Signal: Tune 1", "MoonySig_Tune1"],
    ["🔔 Signal: Battery Low", "MoonySig_BatteryLow"],
    ["🔔 Signal: Warning", "MoonySig_Warning"],
    ["🔔 Signal: Alarm 1", "MoonySig_Alarm1"],
    ["🔔 Signal: Short 1", "MoonySig_Short1"],
    ["🔔 Signal: Pling 1", "MoonySig_Pling1"],

    // ── Kurze Melodien ──────────────────
    ["🎵 Melodie: Tetris (kurz)", "TetrisShort"],
    ["🎵 Melodie: Mario (kurz)", "MarioShort"],

    // ── Songs (Preset) ──────────────────
    ["🎶 Song: Star Wars", "StarWars"],
    ["🎶 Song: Mission Impossible", "MissionImp"],
    ["🎶 Song: Pink Panther", "PinkPanther"],
    ["🎶 Song: Entertainer", "Entertainer"],
    ["🎶 Song: Indiana", "Indiana"],
    ["🎶 Song: Bond", "Bond"],
    ["🎶 Song: Take On Me", "TakeOnMe"]
  ];

  // ────────────────────────────────────────────────────────────────
  // Helpers: Style setzen + Fallback
  // ────────────────────────────────────────────────────────────────
  function applyStyle(block, styleName, fallbackHex) {
    if (typeof block.setStyle === "function") {
      block.setStyle(styleName);
      return;
    }
    const c = (Blockly?.Themes?.MoonyDark?.blockStyles?.[styleName]?.colourPrimary) || fallbackHex;
    block.setColour(c);
  }

  // ────────────────────────────────────────────────────────────────
  // 🧱 BLOCKS
  // ────────────────────────────────────────────────────────────────
  if (!Blockly.Blocks) Blockly.Blocks = Object.create(null);

  // 🔊 Beep (passiver Piezo)
  Blockly.Blocks["sound_beep"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Buzzer an Pin")
        .appendField(new Blockly.FieldNumber(2, 2, 13, 1), "PIN")
        .appendField("für")
        .appendField(new Blockly.FieldNumber(200, 10, 5000, 1), "DUR")
        .appendField("ms (pip)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      applyStyle(this, STYLE_SOUND_BUZZER, "#FF7A00");
      this.setTooltip("Kurzer Ton (passiver Piezo via tone()).");
    }
  };

  // 🔊 Muster (passiver Piezo)
  Blockly.Blocks["sound_beep_pattern"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Buzzer-Muster an Pin")
        .appendField(new Blockly.FieldNumber(2, 2, 13, 1), "PIN")
        .appendField("Zeiten (ms):")
        .appendField(new Blockly.FieldTextInput("200,100,200,500"), "PATTERN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      applyStyle(this, STYLE_SOUND_BUZZER, "#FF7A00");
      this.setTooltip("Zeitenfolge: AN, AUS, AN, AUS ...");
    }
  };

  // 🚨 Signale (passiver Piezo)
  Blockly.Blocks["sound_signal"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("spiele Signal")
        .appendField(new Blockly.FieldDropdown([
          ["kurzer Beep", "BEEP"],
          ["doppelter Beep", "DOUBLE"],
          ["Startsignal", "START"],
          ["Alarm", "ALARM"],
          ["Endsignal", "END"]
        ]), "SIGNAL")
        .appendField("an Pin")
        .appendField(new Blockly.FieldNumber(2, 2, 13, 1), "PIN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      applyStyle(this, STYLE_SOUND_BUZZER, "#FF7A00");
      this.setTooltip("Vordefinierte Signale über tone().");
    }
  };

  // 🎶 RTTTL / PlayRtttl Blöcke
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "sound_music_play_blocking",
      "message0": "spiele %1 an Pin %2 (fertig abspielen)",
      "args0": [
        { "type": "field_dropdown", "name": "MELODY", "options": MELODY_OPTIONS_GROUPED },
        { "type": "field_number", "name": "PIN", "value": 9, "min": 2, "max": 13 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_start",
      "message0": "starte %1 an Pin %2 (läuft weiter)",
      "args0": [
        { "type": "field_dropdown", "name": "MELODY", "options": MELODY_OPTIONS_GROUPED },
        { "type": "field_number", "name": "PIN", "value": 9, "min": 2, "max": 13 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_update",
      "message0": "aktualisiere Musik",
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_stop",
      "message0": "stoppe Musik",
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_custom_blocking",
      "message0": "spiele eigene RTTTL an Pin %1 (fertig) %2 Text: %3",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 9, "min": 2, "max": 13 },
        { "type": "input_dummy" },
        { "type": "field_input", "name": "RTTTL", "text": "MySong:d=4,o=5,b=120:c,e,g" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_custom_start",
      "message0": "starte eigene RTTTL an Pin %1 (läuft weiter) %2 Text: %3",
      "args0": [
        { "type": "field_number", "name": "PIN", "value": 9, "min": 2, "max": 13 },
        { "type": "input_dummy" },
        { "type": "field_input", "name": "RTTTL", "text": "MySong:d=4,o=5,b=120:c,e,g" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_loop",
      "message0": "spiele %1 an Pin %2 immer wieder",
      "args0": [
        { "type": "field_dropdown", "name": "MELODY", "options": MELODY_OPTIONS_GROUPED },
        { "type": "field_number", "name": "PIN", "value": 9, "min": 2, "max": 13 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_music_blocks"
    },
    {
      "type": "sound_music_is_running",
      "message0": "Musik läuft?",
      "output": "Boolean",
      "style": "sound_music_blocks"
    }
  ]);

  // ────────────────────────────────────────────────────────────────
  // ⚙️ GENERATORS (robust gegen Lade-Reihenfolge)
  // ────────────────────────────────────────────────────────────────
  function registerSoundGenerators() {
    if (!Blockly.Arduino) return false;

    // ---------- PASSIVER PIEZO: tone() ----------
    function ensureToneHelpers() {
      Blockly.Arduino.addInclude?.("moony_arduino_inc", "#include <Arduino.h>");
    }

    Blockly.Arduino.forBlock["sound_beep"] = function (block) {
      ensureToneHelpers();
      const pin = Number(block.getFieldValue("PIN"));
      const dur = Number(block.getFieldValue("DUR"));
      Blockly.Arduino.addSetup(`buzzer_${pin}`, `pinMode(${pin}, OUTPUT);`);
      return `tone(${pin}, ${DEFAULT_BEEP_FREQ});\ndelay(${dur});\nnoTone(${pin});\n`;
    };

    Blockly.Arduino.forBlock["sound_beep_pattern"] = function (block) {
      ensureToneHelpers();
      const pin = Number(block.getFieldValue("PIN"));
      const pattern = String(block.getFieldValue("PATTERN") || "").trim();
      Blockly.Arduino.addSetup(`buzzer_${pin}`, `pinMode(${pin}, OUTPUT);`);

      const parts = pattern
        .split(/[,\s]+/)
        .map(v => parseInt(v, 10))
        .filter(v => Number.isFinite(v) && v > 0);

      let code = `// Buzzer-Muster (passiv)\n`;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) code += `tone(${pin}, ${DEFAULT_BEEP_FREQ}); delay(${parts[i]});\n`;
        else            code += `noTone(${pin}); delay(${parts[i]});\n`;
      }
      code += `noTone(${pin});\n`;
      return code;
    };

    Blockly.Arduino.forBlock["sound_signal"] = function (block) {
      ensureToneHelpers();
      const pin = Number(block.getFieldValue("PIN"));
      const sig = block.getFieldValue("SIGNAL");
      Blockly.Arduino.addSetup(`buzzer_${pin}`, `pinMode(${pin}, OUTPUT);`);

      if (!Blockly.Arduino.definitions_["moony_sig_helpers"]) {
        Blockly.Arduino.definitions_["moony_sig_helpers"] = `
static void moonySigBeep(int pin, int ms){
  tone(pin, ${DEFAULT_BEEP_FREQ}); delay(ms); noTone(pin);
}
static void moonySigPause(int ms){ delay(ms); }
`.trim();
      }

      switch (sig) {
        case "DOUBLE":
          return `moonySigBeep(${pin}, 120); moonySigPause(120); moonySigBeep(${pin}, 120);\n`;
        case "START":
          return `moonySigBeep(${pin}, 120); moonySigPause(80); moonySigBeep(${pin}, 220);\n`;
        case "ALARM":
          return `moonySigBeep(${pin}, 300); moonySigPause(120); moonySigBeep(${pin}, 300);\n`;
        case "END":
          return `moonySigBeep(${pin}, 220); moonySigPause(80); moonySigBeep(${pin}, 120);\n`;
        case "BEEP":
        default:
          return `moonySigBeep(${pin}, 150);\n`;
      }
    };

    // ---------- RTTTL / PlayRtttl ----------
    function ensurePlayRtttlIncluded() {
      Blockly.Arduino.addInclude(
        "playrtttl_lib",
        ["#define SUPPRESS_HPP_WARNING", "#include <PlayRtttl.hpp>"].join("\n")
      );

      if (!Blockly.Arduino.definitions_["moony_music_core"]) {
        Blockly.Arduino.definitions_["moony_music_core"] = `
static bool moony_music_enabled = true;

// delay, während RTTTL weiterläuft
static void delayWithMusic(unsigned long ms){
  unsigned long start = millis();
  while ((unsigned long)(millis() - start) < ms){
    updatePlayRtttl();
    delay(1);
  }
}
`.trim();
      }

      // Presets: Effekte + kurze Melodien
      if (!Blockly.Arduino.definitions_["moony_rtttl_extension"]) {
        Blockly.Arduino.definitions_["moony_rtttl_extension"] = `
static const char MoonyFx_Coin[]     PROGMEM = "coin:d=16,o=5,b=200:e6,g6";
static const char MoonyFx_Success[]  PROGMEM = "ok:d=16,o=5,b=190:c6,e6,g6";
static const char MoonyFx_Error[]    PROGMEM = "err:d=8,o=5,b=120:a,p,a";
static const char MoonyFx_Notify[]   PROGMEM = "ntf:d=16,o=5,b=220:g6,p,c7";
static const char MoonyFx_Laser[]    PROGMEM = "lzr:d=32,o=6,b=220:c7,b6,a6,g6,f6,e6,d6,c6";
static const char MoonyFx_Siren[]    PROGMEM = "sir:d=8,o=5,b=160:a#,a,a#,a,a#,a";

// kurze Melodien
static const char TetrisShort[]      PROGMEM = "tetr:d=4,o=5,b=160:e6,b,c6,d6,c6,b,a,a,c6,e6,d6,c6,b";
static const char MarioShort[]       PROGMEM = "mario:d=8,o=5,b=200:e6,e6,p,e6,p,c6,e6,p,g6,p,g";
`.trim();
      }

      // Signale
      if (!Blockly.Arduino.definitions_["moony_rtttl_signals"]) {
        Blockly.Arduino.definitions_["moony_rtttl_signals"] = `
static const char MoonySig_Tune1[]      PROGMEM = "Tune1:d=4,o=5,b=140:8c,8e,8g,4c6,8p,8g,8e,8c6,8p,8g,8e,8c6,8p,8g,8e,8c6";
static const char MoonySig_BatteryLow[] PROGMEM = "BatteryLow:d=4,o=5,b=110:f,8p,f,8p,f,8p,f";
static const char MoonySig_Warning[]    PROGMEM = "Warning:d=4,o=5,b=180:a,8p,a,8p,a,8p,a";
static const char MoonySig_Alarm1[]     PROGMEM = "Alarm:d=4,o=5,b=165:a#,8p,a#,8p,a#,8p,a#";
static const char MoonySig_Short1[]     PROGMEM = "Short1:d=4,o=5,b=140:c6,8p,c6";
static const char MoonySig_Pling1[]     PROGMEM = "Pling:d=16,o=6,b=140:e6,32p,d6";
`.trim();
      }

    
    }

    function safeId(block) {
      const id = (block && (block.id || block.getId?.())) ? String(block.id || block.getId()) : "x";
      return id.replace(/[^a-zA-Z0-9_]/g, "_");
    }

    function addCustomMelodyProgmem(varName, text) {
      const safe = String(text || "").trim()
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "")
        .replace(/\n/g, "");
      Blockly.Arduino.definitions_[`decl_${varName}`] = `
static const char ${varName}[] PROGMEM =
"${safe}";
`.trim();
    }

    Blockly.Arduino.forBlock["sound_music_play_blocking"] = function (block) {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      const pin = Number(block.getFieldValue("PIN"));
      const melodyName = block.getFieldValue("MELODY");
      Blockly.Arduino.addSetup(`buzz_${pin}`, `pinMode(${pin}, OUTPUT);`);
      return `playRtttlBlockingPGM(${pin}, ${melodyName});\n`;
    };

    Blockly.Arduino.forBlock["sound_music_start"] = function (block) {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      const pin = Number(block.getFieldValue("PIN"));
      const melodyName = block.getFieldValue("MELODY");
      Blockly.Arduino.addSetup(`buzz_${pin}`, `pinMode(${pin}, OUTPUT);`);

      const id = safeId(block);
      const startedVar = `moony_music_started_${id}`;
      Blockly.Arduino.definitions_[`decl_${startedVar}`] = `static bool ${startedVar} = false;`;

      return `moony_music_enabled = true; if (!${startedVar}) { ${startedVar} = true; startPlayRtttlPGM(${pin}, ${melodyName}); }\n`;
    };

    Blockly.Arduino.forBlock["sound_music_update"] = function () {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      return `if (moony_music_enabled) { updatePlayRtttl(); }\n`;
    };

    Blockly.Arduino.forBlock["sound_music_stop"] = function () {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      return `moony_music_enabled = false; stopPlayRtttl();\n`;
    };

    Blockly.Arduino.forBlock["sound_music_custom_blocking"] = function (block) {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      const pin = Number(block.getFieldValue("PIN"));
      const text = block.getFieldValue("RTTTL") || "MySong:d=4,o=5,b=120:c,e,g";
      Blockly.Arduino.addSetup(`buzz_${pin}`, `pinMode(${pin}, OUTPUT);`);

      const key = `Moony_Custom_Blocking_${safeId(block)}`;
      addCustomMelodyProgmem(key, text);

      return `playRtttlBlockingPGM(${pin}, ${key});\n`;
    };

    Blockly.Arduino.forBlock["sound_music_custom_start"] = function (block) {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      const pin = Number(block.getFieldValue("PIN"));
      const text = block.getFieldValue("RTTTL") || "MySong:d=4,o=5,b=120:c,e,g";
      Blockly.Arduino.addSetup(`buzz_${pin}`, `pinMode(${pin}, OUTPUT);`);

      const id = safeId(block);
      const key = `Moony_Custom_NB_${id}`;
      addCustomMelodyProgmem(key, text);

      const startedVar = `moony_music_started_${id}`;
      Blockly.Arduino.definitions_[`decl_${startedVar}`] = `static bool ${startedVar} = false;`;

      return `moony_music_enabled = true; if (!${startedVar}) { ${startedVar} = true; startPlayRtttlPGM(${pin}, ${key}); }\n`;
    };

    Blockly.Arduino.forBlock["sound_music_loop"] = function (block) {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      const pin = Number(block.getFieldValue("PIN"));
      const melodyName = block.getFieldValue("MELODY");
      Blockly.Arduino.addSetup(`buzz_${pin}`, `pinMode(${pin}, OUTPUT);`);

      const id = safeId(block);
      const startedVar = `moony_music_loop_started_${id}`;
      const lastRestartVar = `moony_music_loop_last_restart_${id}`;

      Blockly.Arduino.definitions_[`decl_${startedVar}`] = `static bool ${startedVar} = false;`;
      Blockly.Arduino.definitions_[`decl_${lastRestartVar}`] = `static unsigned long ${lastRestartVar} = 0;`;

      return `
moony_music_enabled = true;

if (!${startedVar}) {
  ${startedVar} = true;
  ${lastRestartVar} = millis();
  startPlayRtttlPGM(${pin}, ${melodyName});
}

if (moony_music_enabled) {
  bool __running = updatePlayRtttl();
  if (!__running) {
    if ((unsigned long)(millis() - ${lastRestartVar}) > 50) {
      ${lastRestartVar} = millis();
      startPlayRtttlPGM(${pin}, ${melodyName});
    }
  }
}
`.trim() + "\n";
    };

    Blockly.Arduino.forBlock["sound_music_is_running"] = function () {
      ensurePlayRtttlIncluded();
      Blockly.Arduino.__moonyPlayRtttlEnabled = true;
      return ["(moony_music_enabled && isPlayRtttlRunning())", Blockly.Arduino.ORDER_ATOMIC];
    };

    return true;
  }

  // Sofort versuchen, sonst später erneut probieren
  if (!registerSoundGenerators()) {
    const t = setInterval(() => {
      if (registerSoundGenerators()) clearInterval(t);
    }, 50);
  }

})();