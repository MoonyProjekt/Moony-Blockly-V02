// js/blocks_loop.js
(function () {
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([

    // 🔁 0️⃣ Wiederhole fortlaufend (für Schüler sichtbar, technisch: Arduino loop)
    {
      "type": "program_loop_forever",
      "message0": "wiederhole fortlaufend %1 mache %2",
      "args0": [
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_primary",

      "tooltip": "Alles hier läuft unendlich oft (Arduino loop).",
      "helpUrl": "",
      "inputsInline": false
    },

    // 🔁 1️⃣ Wiederhole-Block (feste Anzahl)
    {
      "type": "moony_repeat",
      "message0": "wiederhole %1 mal %2 mache %3",
      "args0": [
        { "type": "input_value", "name": "TIMES", "check": "Number" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_primary",

      "tooltip": "Führt die enthaltenen Befehle mehrfach aus.",
      "helpUrl": ""
    },

    // 🔄 2️⃣ Solange-Block (while)
    {
      "type": "moony_while",
      "message0": "solange %1 mache %2",
      "args0": [
        { "type": "input_value", "name": "COND", "check": "Boolean" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_secondary",

      "tooltip": "Führt die Befehle aus, solange die Bedingung wahr ist.",
      "helpUrl": ""
    },

    // 🔢 3️⃣ Zähler-Schleife (For mit Schrittweite)
    {
      "type": "moony_for",
      "message0": "zähler %1 von %2 bis %3 in Schritten von %4 mache %5",
      "args0": [
        { "type": "field_variable", "name": "VAR", "variable": "i" },
        { "type": "input_value", "name": "FROM", "check": "Number" },
        { "type": "input_value", "name": "TO", "check": "Number" },
        { "type": "input_value", "name": "STEP", "check": "Number" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_tertiary",

      "tooltip": "Zählt von Start bis Ende und führt die Befehle aus.",
      "helpUrl": ""
    },

    // 🔚 4️⃣ Schleife verlassen (break)
    {
      "type": "moony_loop_break",
      "message0": "Schleife verlassen",
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_secondary",

      "tooltip": "Beendet die aktuelle Schleife sofort.",
      "helpUrl": ""
    },

    // ⏭ 5️⃣ Schleifendurchlauf überspringen (continue)
    {
      "type": "moony_loop_continue",
      "message0": "nächsten Schleifendurchlauf überspringen",
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "loop_secondary",

      "tooltip": "Überspringt den Rest dieses Schleifendurchlaufs.",
      "helpUrl": ""
    }

  ]);

  // ⚙️ Arduino Generatoren -------------------------------------------------
  if (typeof Blockly !== "undefined" && Blockly.Arduino) {

    // 🔁 Wiederhole fortlaufend -> Inhalt wird in Arduino loop() geschrieben
    Blockly.Arduino.forBlock["program_loop_forever"] = function (block) {
      const branch = Blockly.Arduino.statementToCode(block, "DO") || "";

      // ✅ Schutz: nur EIN loop-Block soll den loop füllen
      // ❌ NICHT definitions_ benutzen, sonst landet "true" im Arduino-Code!
      if (Blockly.Arduino.__moony_loop_defined) {
        console.warn("⚠ Nur ein 'wiederhole fortlaufend' Block erlaubt.");
        return "";
      }
      Blockly.Arduino.__moony_loop_defined = true;

      // Inhalt in die loop()-Sektion
      Blockly.Arduino.addLoop("program_loop_forever", branch);
      return "";
    };

    // 🔁 Repeat (Anzahl)
    Blockly.Arduino.forBlock["moony_repeat"] = function (block) {
      const times = Blockly.Arduino.valueToCode(block, "TIMES", Blockly.Arduino.ORDER_ATOMIC) || "0";
      const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
      return `for (int _i = 0; _i < (${times}); _i++) {\n${branch}}\n`;
    };

    // 🔄 While
    Blockly.Arduino.forBlock["moony_while"] = function (block) {
      const cond = Blockly.Arduino.valueToCode(block, "COND", Blockly.Arduino.ORDER_ATOMIC) || "false";
      const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
      return `while (${cond}) {\n${branch}}\n`;
    };

    // 🔢 For
   Blockly.Arduino.forBlock["moony_for"] = function (block) {
  const varName = Blockly.Arduino.nameDB_.getName(
    block.getFieldValue("VAR"),
    Blockly.Variables.NAME_TYPE
  );

  const from = Blockly.Arduino.valueToCode(block, "FROM", Blockly.Arduino.ORDER_ATOMIC) || "0";
  const to = Blockly.Arduino.valueToCode(block, "TO", Blockly.Arduino.ORDER_ATOMIC) || "0";
  const step = Blockly.Arduino.valueToCode(block, "STEP", Blockly.Arduino.ORDER_ATOMIC) || "1";
  const branch = Blockly.Arduino.statementToCode(block, "DO") || "";

  return `
if ((${from}) <= (${to})) {
  for (long ${varName} = (${from}); ${varName} <= (${to}); ${varName} += abs(${step})) {
${branch}}
} else {
  for (long ${varName} = (${from}); ${varName} >= (${to}); ${varName} -= abs(${step})) {
${branch}}
}
`.trim() + "\n";
};

    // 🔚 Break
    Blockly.Arduino.forBlock["moony_loop_break"] = function () {
      return "break;\n";
    };

    // ⏭ Continue
    Blockly.Arduino.forBlock["moony_loop_continue"] = function () {
      return "continue;\n";
    };
  }
})();