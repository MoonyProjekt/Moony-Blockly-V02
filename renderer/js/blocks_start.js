// js/blocks_start.js
(function () {
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([
    // 🟢 Start – läuft einmal (setup)
    {
      "type": "program_start_once",
      "message0": "🟢 Start (läuft einmal)",
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "DO" }
      ],
      // ✅ WICHTIG: Block braucht eine Verbindung (sonst "Invalid block definition")
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "start_blocks",

      "tooltip": "Startpunkt des Programms. Wird einmal beim Start ausgeführt (setup).",
      "helpUrl": "",
      "inputsInline": false
    },

    // ♾️ Start – läuft unendlich (loop)
    {
      "type": "program_start_forever",
      "message0": "♾️ Start (läuft unendlich)",
      "message1": "%1",
      "args1": [
        { "type": "input_statement", "name": "DO" }
      ],
      // ✅ WICHTIG: Block braucht eine Verbindung
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "start_blocks",

      "tooltip": "Dieser Block läuft unendlich oft – alles hier wird fortlaufend in loop() ausgeführt.",
      "helpUrl": "",
      "inputsInline": false
    }
  ]);

  // ⚙️ Arduino-Codegeneratoren -------------------------------------------------
  if (!Blockly.Arduino) return;

  // 🟢 läuft einmal → setup()
  Blockly.Arduino.forBlock["program_start_once"] = function (block) {
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    Blockly.Arduino.addSetup("program_start_once", branch);
    return ""; // kein Code in loop()
  };

  // ♾️ läuft unendlich → loop()
  Blockly.Arduino.forBlock["program_start_forever"] = function (block) {
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    Blockly.Arduino.addLoop("program_start_forever", branch);
    return ""; // kein direkter Code im Hauptteil
  };
})();