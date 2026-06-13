// js/blocks_logic.js
(function () {

  // ✅ WICHTIG: Schutz gegen falsche Lade-Reihenfolge
  if (typeof Blockly === "undefined") return;

  Blockly.defineBlocksWithJsonArray([

    // 🟩 1. Einfache Wenn-Dann-Bedingung (ohne „sonst“)
    {
      "type": "moony_if_simple",
      "message0": "wenn %1 dann %2",
      "args0": [
        { "type": "input_value", "name": "COND", "check": "Boolean" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "logic_primary",
      "tooltip": "Führt die enthaltenen Befehle aus, wenn die Bedingung wahr ist.",
      "helpUrl": ""
    },

    // 🟦 2. Wenn / Dann / Sonst (komplett)
    {
      "type": "moony_if",
      "message0": "wenn %1 dann %2",
      "args0": [
        { "type": "input_value", "name": "IF0", "check": "Boolean" },
        { "type": "input_statement", "name": "DO0" }
      ],
      "message1": "sonst %1",
      "args1": [
        { "type": "input_statement", "name": "ELSE" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "logic_primary",
      "tooltip": "Wenn die Bedingung wahr ist, führe den oberen Teil aus, sonst den unteren.",
      "helpUrl": ""
    },

    // ⚖️ 3. Vergleichsoperator (==, !=, <, >, <=, >=)
    {
      "type": "moony_compare",
      "message0": "%1 %2 %3",
      "args0": [
        { "type": "input_value", "name": "A" },
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            ["=", "EQ"],
            ["≠", "NEQ"],
            ["<", "LT"],
            ["≤", "LTE"],
            [">", "GT"],
            ["≥", "GTE"]
          ]
        },
        { "type": "input_value", "name": "B" }
      ],
      "inputsInline": true,
      "output": "Boolean",
      "style": "logic_secondary",
      "tooltip": "Vergleicht zwei Werte und gibt wahr oder falsch zurück.",
      "helpUrl": ""
    },

    // 🔗 4. UND / ODER
    {
      "type": "moony_logic_op",
      "message0": "%1 %2 %3",
      "args0": [
        { "type": "input_value", "name": "A", "check": "Boolean" },
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            ["und", "AND"],
            ["oder", "OR"]
          ]
        },
        { "type": "input_value", "name": "B", "check": "Boolean" }
      ],
      "inputsInline": true,
      "output": "Boolean",
      "style": "logic_secondary",
      "tooltip": "Verknüpft zwei Bedingungen mit UND oder ODER.",
      "helpUrl": ""
    },

    // 🚫 5. Nicht (Negation)
    {
      "type": "moony_not",
      "message0": "nicht %1",
      "args0": [
        { "type": "input_value", "name": "BOOL", "check": "Boolean" }
      ],
      "output": "Boolean",
      "style": "logic_tertiary",
      "tooltip": "Gibt das Gegenteil des eingegebenen Werts zurück.",
      "helpUrl": ""
    },

    // ✅ 6. Wahr / Falsch
    {
      "type": "moony_boolean",
      "message0": "%1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "BOOL",
          "options": [
            ["wahr", "TRUE"],
            ["falsch", "FALSE"]
          ]
        }
      ],
      "output": "Boolean",
      "style": "logic_tertiary",
      "tooltip": "Wahr oder Falsch – logischer Grundwert.",
      "helpUrl": ""
    },

    // 🔢 7. Zahl (eigener Block)
    {
      "type": "moony_number",
      "message0": "%1",
      "args0": [
        {
          "type": "field_number",
          "name": "NUM",
          "value": 10,
          "min": -9999,
          "max": 9999
        }
      ],
      "output": "Number",
      "style": "logic_tertiary",
      "tooltip": "Zahl für Vergleiche oder Bedingungen.",
      "helpUrl": ""
    }

  ]);

  // ⚙️ Arduino-Codegeneratoren
  if (!Blockly.Arduino) return;

  // Wenn-Dann (einfach)
  Blockly.Arduino.forBlock["moony_if_simple"] = function (block) {
    const cond = Blockly.Arduino.valueToCode(block, "COND", Blockly.Arduino.ORDER_NONE) || "false";
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    return `if (${cond}) {\n${branch}}\n`;
  };

  // Wenn-Dann-Sonst
  Blockly.Arduino.forBlock["moony_if"] = function (block) {
    const cond = Blockly.Arduino.valueToCode(block, "IF0", Blockly.Arduino.ORDER_NONE) || "false";
    const branchIf = Blockly.Arduino.statementToCode(block, "DO0") || "";
    const branchElse = Blockly.Arduino.statementToCode(block, "ELSE") || "";
    let code = `if (${cond}) {\n${branchIf}}\n`;
    if (branchElse) code += `else {\n${branchElse}}\n`;
    return code;
  };

  // Vergleich
  Blockly.Arduino.forBlock["moony_compare"] = function (block) {
    const OPERATORS = {
      EQ: "==",
      NEQ: "!=",
      LT: "<",
      LTE: "<=",
      GT: ">",
      GTE: ">="
    };
    const op = OPERATORS[block.getFieldValue("OP")] || "==";
    const a = Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_ATOMIC) || "0";
    const b = Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_ATOMIC) || "0";
    return [`(${a} ${op} ${b})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  // UND/ODER
  Blockly.Arduino.forBlock["moony_logic_op"] = function (block) {
    const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
    const a = Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_ATOMIC) || "false";
    const b = Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_ATOMIC) || "false";
    return [`(${a} ${op} ${b})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  // NOT
  Blockly.Arduino.forBlock["moony_not"] = function (block) {
    const v = Blockly.Arduino.valueToCode(block, "BOOL", Blockly.Arduino.ORDER_ATOMIC) || "false";
    return [`(!${v})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  // TRUE/FALSE
  Blockly.Arduino.forBlock["moony_boolean"] = function (block) {
    const v = block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
    return [v, Blockly.Arduino.ORDER_ATOMIC];
  };

  // Zahl
  Blockly.Arduino.forBlock["moony_number"] = function (block) {
    const n = String(block.getFieldValue("NUM") ?? "0");
    return [n, Blockly.Arduino.ORDER_ATOMIC];
  };

})();