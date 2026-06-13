// js/blocks_math.js
(function () {
  // ✅ WICHTIG: Schutz gegen falsche Lade-Reihenfolge
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([

    // ✅ Standard-Zahl (für Shadows in Toolbox!)
    // Wichtig: Field-Name MUSS "NUM" heißen, weil viele Shadows so gebaut sind:
    // <shadow type="math_number"><field name="NUM">5</field></shadow>
    {
      "type": "math_number",
      "message0": "%1",
      "args0": [
        { "type": "field_number", "name": "NUM", "value": 0 }
      ],
      "output": "Number",
      "style": "math_primary",
      "tooltip": "Zahl",
      "helpUrl": ""
    },

    // 🔢 Mathe-Arithmetik mit Klartext-Operatoren
    {
      "type": "moony_math_arithmetic",
      "message0": "%1 %2 %3",
      "args0": [
        { "type": "input_value", "name": "A", "check": "Number" },
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            ["addiere", "ADD"],
            ["subtrahiere", "MINUS"],
            ["multipliziere", "MULTIPLY"],
            ["dividiere", "DIVIDE"],
            ["potenziere", "POWER"]
          ]
        },
        { "type": "input_value", "name": "B", "check": "Number" }
      ],
      "inputsInline": true,
      "output": "Number",

      // ✅ Theme-Style statt colour
      "style": "math_primary",

      "tooltip": "Führt eine mathematische Operation mit zwei Zahlen aus.",
      "helpUrl": ""
    }
  ]);

  // ⚙️ Arduino-Codegenerator
  if (!Blockly.Arduino) return;

  // ✅ Generator für Standard-Zahl
  Blockly.Arduino.forBlock["math_number"] = function (block) {
    const n = String(block.getFieldValue("NUM") ?? "0");
    return [n, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["moony_math_arithmetic"] = function (block) {
    const OPERATORS = {
      ADD: "+",
      MINUS: "-",
      MULTIPLY: "*",
      DIVIDE: "/",
      POWER: "pow"
    };

    const opKey = block.getFieldValue("OP");
    const op = OPERATORS[opKey] || "+";

    const a = Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_ATOMIC) || "0";
    const b = Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_ATOMIC) || "0";

    if (op === "pow") {
      Blockly.Arduino.addInclude("math", "#include <math.h>");
      return [`pow(${a}, ${b})`, Blockly.Arduino.ORDER_ATOMIC];
    }
    return [`(${a} ${op} ${b})`, Blockly.Arduino.ORDER_ATOMIC];
  };
})();