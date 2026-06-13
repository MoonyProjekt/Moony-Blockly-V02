// js/blocks_time.js
(function () {
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([
    // 🕒 1️⃣ Warte eine bestimmte Zeit (blockierend)
    {
      "type": "time_wait",
      "message0": "warte %1 %2",
      "args0": [
        { "type": "field_number", "name": "TIME", "value": 1000, "min": 0 },
        {
          "type": "field_dropdown",
          "name": "UNIT",
          "options": [
            ["Millisekunden", "MS"],
            ["Sekunden", "S"]
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "time_primary",

      "tooltip": "Pausiert das Programm für eine bestimmte Zeit.",
      "helpUrl": ""
    },

    // 🔁 2️⃣ Wiederhole alle X Zeitintervalle (nicht-blockierend)
    {
      "type": "time_loop",
      "message0": "alle %1 %2 mache %3",
      "args0": [
        { "type": "field_number", "name": "INTERVAL", "value": 2, "min": 0.1, "precision": 0.1 },
        {
          "type": "field_dropdown",
          "name": "UNIT",
          "options": [
            ["Sekunden", "S"],
            ["Millisekunden", "MS"]
          ]
        },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "time_primary",

      "tooltip": "Führt die enthaltenen Befehle regelmäßig im angegebenen Zeitintervall aus.",
      "helpUrl": ""
    },

    // ⏸ 3️⃣ Warte bis eine Bedingung erfüllt ist
    {
      "type": "time_wait_until",
      "message0": "warte bis %1",
      "args0": [
        { "type": "input_value", "name": "COND", "check": "Boolean" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "time_secondary",

      "tooltip": "Wartet, bis die angegebene Bedingung erfüllt ist.",
      "helpUrl": ""
    }
  ]);

  // ⚙️ Arduino-Codegeneratoren -------------------------------------------------
  if (!Blockly.Arduino) return;

  // Helper: ms berechnen
  function toMs(block, fieldTime, fieldUnit) {
    const time = Number(block.getFieldValue(fieldTime));
    const unit = block.getFieldValue(fieldUnit);
    return (unit === "S") ? Math.round(time * 1000) : Math.round(time);
  }

  // Helper: sichere Block-ID für Variablennamen
  function safeId(block) {
    const id = (block && (block.id || block.getId?.())) ? String(block.id || block.getId()) : "x";
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  // ✅ Musik-sichere Helper (OHNE Namens-Kollision mit blocks_sound.js)
  function ensureTimeMusicHelpers() {
    // wird von sound.js gesetzt, sobald PlayRtttl verwendet wird
    if (!Blockly.Arduino.__moonyPlayRtttlEnabled) return;

    Blockly.Arduino.addInclude(
      "moony_time_music_helpers",
      `
#include <Arduino.h>

// weak: gleiche Signatur wie in PlayRtttl.hpp, damit kein Typ-Konflikt entsteht
bool updatePlayRtttl(void) __attribute__((weak));

static inline void moonyUpdateMusicSafe() {
  if (updatePlayRtttl) updatePlayRtttl();
}

// eigener Name, damit es nie mit sound.js kollidiert
static void moonyDelayWithMusic(unsigned long ms) {
  unsigned long start = millis();
  while (millis() - start < ms) {
    moonyUpdateMusicSafe(); // nur wenn vorhanden
    delay(2);
  }
}
      `.trim()
    );
  }

  // 🕒 Warte eine bestimmte Zeit
  Blockly.Arduino.forBlock["time_wait"] = function (block) {
    const ms = toMs(block, "TIME", "UNIT");

    if (Blockly.Arduino.__moonyPlayRtttlEnabled) {
      ensureTimeMusicHelpers();
      return `moonyDelayWithMusic(${ms});\n`;
    }

    return `delay(${ms});\n`;
  };

  // 🔁 Wiederhole alle X Zeitintervalle (nicht-blockierend)
  Blockly.Arduino.forBlock["time_loop"] = function (block) {
    const delayMs = toMs(block, "INTERVAL", "UNIT");
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    const id = safeId(block);

    const prevVar = `timeLoop_prevMillis_${id}`;
    const currVar = `timeLoop_currentMillis_${id}`;

    Blockly.Arduino.addInclude(
      `timeLoopVars_${id}`,
      `static unsigned long ${prevVar} = 0;
static unsigned long ${currVar} = 0;`
    );

    return `
${currVar} = millis();
if (${currVar} - ${prevVar} >= ${delayMs}) {
  ${prevVar} = ${currVar};
${branch}}
`.trim() + "\n";
  };

  // ⏸ Warte bis Bedingung erfüllt ist (mit Musik-Unterstützung)
  Blockly.Arduino.forBlock["time_wait_until"] = function (block) {
    const cond = Blockly.Arduino.valueToCode(block, "COND", Blockly.Arduino.ORDER_NONE) || "false";

    if (Blockly.Arduino.__moonyPlayRtttlEnabled) {
      ensureTimeMusicHelpers();
      return `while (!(${cond})) {\n  moonyUpdateMusicSafe();\n  delay(5);\n}\n`;
    }

    return `while (!(${cond})) {\n  delay(10);\n}\n`;
  };

})();