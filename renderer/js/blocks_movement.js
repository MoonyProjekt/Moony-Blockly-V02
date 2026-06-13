// js/blocks_movement.js  (Fixe Core-Pins – sauber + kompatibel + Pins sichtbar im Block)
(function () {
  if (typeof Blockly === "undefined") return;

  // 🔒 Feste Pinbelegung (getestet mit TB6612FNG)
  const PINS = {
    AIN1: "5",
    AIN2: "4",
    PWMA: "3",
    BIN1: "6",
    BIN2: "7",
    PWMB: "11",
    STBY: "12"
  };

  // ============================================================
  // BLOCKS
  // ============================================================
  Blockly.defineBlocksWithJsonArray([

    // ─────────────────────────────────────────────
    // Motor A (Pins fix + im Block sichtbar)
    // ─────────────────────────────────────────────
    {
      "type": "motor_a_control",
      "message0": "Motor A %1 mit %2 %% Leistung  |  Pins: AIN1=%3 AIN2=%4 PWM=%5 STBY=%6",
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["vorwärts","FWD"],["rückwärts","REV"]] },
        { "type": "field_number", "name": "SPEED", "value": 80, "min": 0, "max": 100 },

        { "type": "field_label", "name": "LBL_AIN1", "text": PINS.AIN1 },
        { "type": "field_label", "name": "LBL_AIN2", "text": PINS.AIN2 },
        { "type": "field_label", "name": "LBL_PWMA", "text": PINS.PWMA },
        { "type": "field_label", "name": "LBL_STBYA", "text": PINS.STBY }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "movement_primary",

      "tooltip": "Motor A mit fixer Core-Pinbelegung (TB6612FNG). Pins sind angezeigt, aber nicht änderbar.",
      "helpUrl": ""
    },

    // ─────────────────────────────────────────────
    // Motor B (Pins fix + im Block sichtbar)
    // ─────────────────────────────────────────────
    {
      "type": "motor_b_control",
      "message0": "Motor B %1 mit %2 %% Leistung  |  Pins: BIN1=%3 BIN2=%4 PWM=%5 STBY=%6",
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["vorwärts","FWD"],["rückwärts","REV"]] },
        { "type": "field_number", "name": "SPEED", "value": 80, "min": 0, "max": 100 },

        { "type": "field_label", "name": "LBL_BIN1", "text": PINS.BIN1 },
        { "type": "field_label", "name": "LBL_BIN2", "text": PINS.BIN2 },
        { "type": "field_label", "name": "LBL_PWMB", "text": PINS.PWMB },
        { "type": "field_label", "name": "LBL_STBYB", "text": PINS.STBY }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "movement_secondary",

      "tooltip": "Motor B mit fixer Core-Pinbelegung (TB6612FNG). Pins sind angezeigt, aber nicht änderbar.",
      "helpUrl": ""
    },

    // ─────────────────────────────────────────────
    // Stop
    // ─────────────────────────────────────────────
    {
      "type": "motor_stop",
      "message0": "🔴 Motoren stoppen  |  Pins: PWMA=%1 PWMB=%2",
      "args0": [
        { "type": "field_label", "name": "LBL_PWMA_STOP", "text": PINS.PWMA },
        { "type": "field_label", "name": "LBL_PWMB_STOP", "text": PINS.PWMB }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "movement_tertiary",

      "tooltip": "Stoppt beide Motoren sofort (PWM=0, Richtungen LOW).",
      "helpUrl": ""
    },

    // ─────────────────────────────────────────────
    // Fahrzeugblock (unverändert, nur Style)
    // ─────────────────────────────────────────────
    {
      "type": "vehicle_run_both_timed",
      "message0": "Starte beide Motoren %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            ["Dauerlauf", "FOREVER"],
            ["Zeit (s)", "TIME"]
          ]
        }
      ],
      "message1": "Wert %1",
      "args1": [
        { "type": "field_number", "name": "VALUE", "value": 2, "min": 0, "precision": 0.1 }
      ],
      "message2": "Motor links %1",
      "args2": [
        { "type": "input_statement", "name": "LEFT" }
      ],
      "message3": "Motor rechts %1",
      "args3": [
        { "type": "input_statement", "name": "RIGHT" }
      ],
      "previousStatement": null,
      "nextStatement": null,

      // ✅ Theme-Style statt colour
      "style": "movement_tertiary",

      "tooltip": "Startet beide Motor-Statements. Bei Zeit stoppt es danach automatisch.",
      "helpUrl": ""
    }

  ]);

  // ============================================================
  // Generator erst NACH Block-Definition (sonst fehlen Blocks)
  // ============================================================
  if (!Blockly.Arduino) return;

  // ============================================================
  // HELPER
  // ============================================================
  function clamp255(n){
    n = Math.round(Number(n) || 0);
    if(n < 0) return 0;
    if(n > 255) return 255;
    return n;
  }

  function ensureSetup(){
    const defs = Blockly.Arduino.definitions_ || (Blockly.Arduino.definitions_ = Object.create(null));
    if(defs["moony_motor_core_v2"]) return;

    defs["moony_motor_core_v2"] = `
/* ---- Moony Motor Core ---- */
static void moonyStop(){
  analogWrite(${PINS.PWMA}, 0);
  analogWrite(${PINS.PWMB}, 0);
  digitalWrite(${PINS.AIN1}, LOW);
  digitalWrite(${PINS.AIN2}, LOW);
  digitalWrite(${PINS.BIN1}, LOW);
  digitalWrite(${PINS.BIN2}, LOW);
}
`;

    Blockly.Arduino.addSetup("moony_motor_setup_v2", `
pinMode(${PINS.AIN1}, OUTPUT);
pinMode(${PINS.AIN2}, OUTPUT);
pinMode(${PINS.PWMA}, OUTPUT);

pinMode(${PINS.BIN1}, OUTPUT);
pinMode(${PINS.BIN2}, OUTPUT);
pinMode(${PINS.PWMB}, OUTPUT);

pinMode(${PINS.STBY}, OUTPUT);
digitalWrite(${PINS.STBY}, HIGH);

moonyStop();
`);
  }

  // ============================================================
  // GENERATOR
  // ============================================================

  Blockly.Arduino.forBlock["motor_a_control"] = function(block){
    ensureSetup();

    const dir = block.getFieldValue("DIR");
    const speed = clamp255((block.getFieldValue("SPEED")||0) * 255 / 100);

    let code = `digitalWrite(${PINS.STBY}, HIGH);\n`;

    if(dir === "FWD"){
      code += `digitalWrite(${PINS.AIN1}, HIGH);\n`;
      code += `digitalWrite(${PINS.AIN2}, LOW);\n`;
    } else {
      code += `digitalWrite(${PINS.AIN1}, LOW);\n`;
      code += `digitalWrite(${PINS.AIN2}, HIGH);\n`;
    }

    code += `analogWrite(${PINS.PWMA}, ${speed});\n`;
    return code;
  };

  Blockly.Arduino.forBlock["motor_b_control"] = function(block){
    ensureSetup();

    const dir = block.getFieldValue("DIR");
    const speed = clamp255((block.getFieldValue("SPEED")||0) * 255 / 100);

    let code = `digitalWrite(${PINS.STBY}, HIGH);\n`;

    if(dir === "FWD"){
      code += `digitalWrite(${PINS.BIN1}, HIGH);\n`;
      code += `digitalWrite(${PINS.BIN2}, LOW);\n`;
    } else {
      code += `digitalWrite(${PINS.BIN1}, LOW);\n`;
      code += `digitalWrite(${PINS.BIN2}, HIGH);\n`;
    }

    code += `analogWrite(${PINS.PWMB}, ${speed});\n`;
    return code;
  };

  Blockly.Arduino.forBlock["motor_stop"] = function(){
    ensureSetup();
    return `moonyStop();\n`;
  };

  Blockly.Arduino.forBlock["vehicle_run_both_timed"] = function(block){
    ensureSetup();

    const mode = block.getFieldValue("MODE");
    const value = Number(block.getFieldValue("VALUE")) || 0;

    const left  = Blockly.Arduino.statementToCode(block, "LEFT");
    const right = Blockly.Arduino.statementToCode(block, "RIGHT");

    let code = "{\n";
    code += left;
    code += right;

    if(mode === "TIME" && value > 0){
      code += `delay(${Math.round(value * 1000)});\n`;
      code += `moonyStop();\n`;
    }

    code += "}\n";
    return code;
  };

})();