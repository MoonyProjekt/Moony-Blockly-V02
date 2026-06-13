// js/blocks_text.js
(function () {
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([
    // 🟨 Textwert
    {
      "type": "moony_text",
      "message0": "Text %1",
      "args0": [
        { "type": "field_input", "name": "TEXT", "text": "Hallo Welt" }
      ],
      "output": "String",

      // ✅ Theme-Style statt colour
      "style": "text_primary",

      "tooltip": "Ein Textwert, z. B. für Ausgaben.",
      "helpUrl": ""
    },

    // 🟨 Text ausgeben
    {
      "type": "moony_text_print",
      "message0": "gib %1 im seriellen Monitor aus",
      "args0": [
        { "type": "input_value", "name": "TEXT", "check": "String" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "text_secondary",

      "tooltip": "Gibt einen Text oder Wert im seriellen Monitor aus.",
      "helpUrl": ""
    }
  ]);

  // ⚙️ Arduino-Codegenerator
  if (!Blockly.Arduino) return;

  Blockly.Arduino.forBlock["moony_text"] = function (block) {
    const txt = block.getFieldValue("TEXT") || "";
    // Minimal-escaping (Anführungszeichen)
    const safe = String(txt).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return [`"${safe}"`, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["moony_text_print"] = function (block) {
    const msg =
      Blockly.Arduino.valueToCode(block, "TEXT", Blockly.Arduino.ORDER_NONE) || '""';

    // ✅ Serial.begin nur 1×
    if (!Blockly.Arduino.setups_) Blockly.Arduino.setups_ = Object.create(null);
    if (!Blockly.Arduino.setups_["serial_begin"]) {
      Blockly.Arduino.addSetup("serial_begin", "Serial.begin(115200);");
    }
    return `Serial.println(${msg});\n`;
  };
})();