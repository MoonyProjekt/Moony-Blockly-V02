// js/arduino.js
(function () {
  "use strict";

  // ✅ Schutz gegen falsche Lade-Reihenfolge
  if (typeof Blockly === "undefined") return;
  if (!Blockly.Generator) return;

  const Arduino = new Blockly.Generator("Arduino");
  Blockly.Arduino = Arduino;

  // -----------------------------
  // Grundkonfiguration
  // -----------------------------
  Arduino.ORDER_ATOMIC = 0;
  Arduino.ORDER_NONE = 99;

  // ✅ reservierte Wörter (damit Variablennamen sauber umbenannt werden)
  Arduino.RESERVED_WORDS_ =
    "setup,loop,if,else,for,while,do,switch,case,break,continue,return," +
    "void,bool,boolean,char,int,long,float,double,String,byte,word," +
    "HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false," +
    "Serial,Wire";

  // -----------------------------
  // Init
  // -----------------------------
  Arduino.init = function (workspace) {
    // ✅ getrennt: includes vs. normale definitions
    this.includes_ = Object.create(null);
    this.definitions_ = Object.create(null);
    this.setups_ = Object.create(null);
    this.loops_ = Object.create(null);

    // ✅ Moony-Flags zurücksetzen
    this.__moony_loop_defined = false;

    // ✅ WICHTIG: NameDB für Variablen/Funktionen
    if (!this.nameDB_) {
      this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_ || "");
    } else {
      this.nameDB_.reset();
    }

    // Blockly neuere Versionen: VariableMap anbinden (falls vorhanden)
    if (workspace && workspace.getVariableMap && this.nameDB_.setVariableMap) {
      this.nameDB_.setVariableMap(workspace.getVariableMap());
    }
  };

  // ✅ Includes kommen ab jetzt in includes_
  Arduino.addInclude = function (key, code) {
    this.includes_[key] = code;
  };

  Arduino.addSetup = function (key, code) {
    this.setups_[key] = code;
  };

  Arduino.addLoop = function (key, code) {
    this.loops_[key] = code;
  };

  // -----------------------------
  // 🧠 Setup & Loop getrennt ausgeben
  // -----------------------------
  Arduino.finish = function (code) {
    // ✅ Arduino.h immer vorne
    const includeLines = ["#include <Arduino.h>"].concat(
      Object.values(this.includes_)
    );

    // ✅ danach kommen globale definitions / helper / variablen
    const defs = Object.values(this.definitions_).join("\n");

    const includes = includeLines.join("\n") + (defs ? "\n\n" + defs : "");

    const setups = Object.values(this.setups_).join("\n  ");
    const setupSec = `void setup() {\n  ${setups}\n}\n\n`;

    const loops = Object.values(this.loops_).join("\n  ");
    const loopBody = loops || code || "";
    const loopSec = `void loop() {\n  ${loopBody}\n}\n`;

    return `${includes}\n\n${setupSec}${loopSec}`;
  };

  // -----------------------------
  // Basisblöcke
  // -----------------------------
  Arduino.forBlock["math_number"] = function (block) {
    return [block.getFieldValue("NUM") || "0", Arduino.ORDER_ATOMIC];
  };

  Arduino.forBlock["text"] = function (block) {
    const txt = block.getFieldValue("TEXT") || "";
    // einfache Escapes, damit der String nicht kaputt geht
    const safe = String(txt).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return [`"${safe}"`, Arduino.ORDER_ATOMIC];
  };

  // -----------------------------
  // ✅ VARIABLEN (FIX)
  // -----------------------------
  // Default: Variablen als int deklarieren (damit Upload/Code sofort wieder geht)
  function moonyVarNameFromBlock(block) {
    const field = block.getField("VAR");
    const v = field && field.getVariable ? field.getVariable() : null;

    // raw = Variable-ID (besser für NameDB), fallback = Feldwert
    const raw = v ? (v.getId ? v.getId() : v.name) : (block.getFieldValue("VAR") || "item");

    if (Arduino.nameDB_ && Arduino.nameDB_.getName) {
      return Arduino.nameDB_.getName(raw, Blockly.Variables.NAME_TYPE);
    }
    return raw;
  }

  Arduino.forBlock["variables_get"] = function (block) {
    const varName = moonyVarNameFromBlock(block);

    if (!Arduino.definitions_[`var_${varName}`]) {
      Arduino.definitions_[`var_${varName}`] = `int ${varName};`;
    }

    return [varName, Arduino.ORDER_ATOMIC];
  };

  Arduino.forBlock["variables_set"] = function (block) {
    const varName = moonyVarNameFromBlock(block);

    if (!Arduino.definitions_[`var_${varName}`]) {
      Arduino.definitions_[`var_${varName}`] = `int ${varName};`;
    }

    const value =
      Blockly.Arduino.valueToCode(block, "VALUE", Arduino.ORDER_NONE) || "0";
    return `${varName} = ${value};\n`;
  };

  // -----------------------------
  // Wiederholungen – explizit vom Nutzer
  // -----------------------------
  Arduino.forBlock["controls_repeat_ext"] = function (block) {
    const repeats =
      Blockly.Arduino.valueToCode(block, "TIMES", Arduino.ORDER_ATOMIC) || "10";
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    return `for (int i = 0; i < ${repeats}; i++) {\n${branch}}\n`;
  };

  Arduino.forBlock["controls_whileUntil"] = function (block) {
    const until = block.getFieldValue("MODE") === "UNTIL";
    const condition =
      Blockly.Arduino.valueToCode(block, "BOOL", Arduino.ORDER_NONE) || "false";
    const branch = Blockly.Arduino.statementToCode(block, "DO") || "";
    return `while (${until ? "!" : ""}(${condition})) {\n${branch}}\n`;
  };

  // -----------------------------
  // Textausgabe
  // -----------------------------
  Arduino.forBlock["text_print"] = function (block) {
    const msg =
      Blockly.Arduino.valueToCode(block, "TEXT", Blockly.Arduino.ORDER_NONE) || '""';

    // ✅ robust: falls setups_ noch nicht existiert (sollte aber nach init existieren)
    if (!Blockly.Arduino.setups_) Blockly.Arduino.setups_ = Object.create(null);

    if (!Blockly.Arduino.setups_["serial_begin"]) {
      Blockly.Arduino.addSetup("serial_begin", "Serial.begin(115200);");
    }

    return `Serial.println(${msg});\n`;
  };

  // -----------------------------
  // Logikblöcke
  // -----------------------------
  Arduino.forBlock["controls_if"] = function (block) {
    let code = "";
    let n = 0;

    do {
      const condition =
        Blockly.Arduino.valueToCode(block, "IF" + n, Arduino.ORDER_NONE) || "false";
      const branch = Blockly.Arduino.statementToCode(block, "DO" + n) || "";
      code += (n === 0 ? "if" : "else if") + ` (${condition}) {\n${branch}}\n`;
      n++;
    } while (block.getInput("IF" + n));

    if (block.getInput("ELSE")) {
      const branch = Blockly.Arduino.statementToCode(block, "ELSE") || "";
      code += `else {\n${branch}}\n`;
    }

    return code;
  };

  Arduino.forBlock["logic_compare"] = function (block) {
    const OPERATORS = {
      EQ: "==",
      NEQ: "!=",
      LT: "<",
      LTE: "<=",
      GT: ">",
      GTE: ">=",
    };
    const op = OPERATORS[block.getFieldValue("OP")] || "==";
    const arg0 =
      Blockly.Arduino.valueToCode(block, "A", Arduino.ORDER_ATOMIC) || "0";
    const arg1 =
      Blockly.Arduino.valueToCode(block, "B", Arduino.ORDER_ATOMIC) || "0";
    return [`(${arg0} ${op} ${arg1})`, Arduino.ORDER_ATOMIC];
  };

  Arduino.forBlock["logic_operation"] = function (block) {
    const operator = block.getFieldValue("OP") === "AND" ? "&&" : "||";
    const arg0 =
      Blockly.Arduino.valueToCode(block, "A", Arduino.ORDER_NONE) || "false";
    const arg1 =
      Blockly.Arduino.valueToCode(block, "B", Arduino.ORDER_NONE) || "false";
    return [`(${arg0} ${operator} ${arg1})`, Arduino.ORDER_ATOMIC];
  };

  Arduino.forBlock["logic_negate"] = function (block) {
    const arg =
      Blockly.Arduino.valueToCode(block, "BOOL", Arduino.ORDER_NONE) || "false";
    return [`!(${arg})`, Arduino.ORDER_ATOMIC];
  };

  Arduino.forBlock["logic_boolean"] = function (block) {
    const value = block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
    return [value, Arduino.ORDER_ATOMIC];
  };

  // -----------------------------
  // Mathe-Arithmetik
  // -----------------------------
  Arduino.forBlock["math_arithmetic"] = function (block) {
    const OPERATORS = {
      ADD: "+",
      MINUS: "-",
      MULTIPLY: "*",
      DIVIDE: "/",
      POWER: "pow",
    };
    const op = OPERATORS[block.getFieldValue("OP")] || "+";
    const arg0 =
      Blockly.Arduino.valueToCode(block, "A", Arduino.ORDER_ATOMIC) || "0";
    const arg1 =
      Blockly.Arduino.valueToCode(block, "B", Arduino.ORDER_ATOMIC) || "0";

    if (op === "pow") {
      Arduino.addInclude("math_h", "#include <math.h>");
      return [`pow(${arg0}, ${arg1})`, Arduino.ORDER_ATOMIC];
    }
    return [`(${arg0} ${op} ${arg1})`, Arduino.ORDER_ATOMIC];
  };

  // -----------------------------
  // Blink-Testblock (Beispiel)
  // -----------------------------
  if (typeof Blockly !== "undefined" && Blockly.Arduino) {
    Blockly.Arduino.forBlock["test_blink"] = function (block) {
      const pin = block.getFieldValue("PIN") || 13;
      const delayTime = block.getFieldValue("DELAY") || 500;
      Blockly.Arduino.addSetup(`pin_${pin}_output`, `pinMode(${pin}, OUTPUT);`);
      return `digitalWrite(${pin}, HIGH);\ndelay(${delayTime});\ndigitalWrite(${pin}, LOW);\ndelay(${delayTime});\n`;
    };
  }

  // -----------------------------
  // Fallback: Verkette Folgeblöcke (✅ crash-frei)
  // -----------------------------
  Arduino.scrub_ = function (block, code) {
    const next = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = next ? Blockly.Arduino.blockToCode(next) : "";
    return code + nextCode;
  };

})();