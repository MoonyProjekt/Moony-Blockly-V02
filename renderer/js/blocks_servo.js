// js/blocks_servo.js
(function () {
  "use strict";

  if (typeof Blockly === "undefined") return;

  const ICON = 36;

  const PIN_OPTIONS = [
    ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"],
    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
  ];

  function servoVarName(pin) {
    return `moony_servo_${String(pin).replace(/[^A-Za-z0-9_]/g, "_")}`;
  }

  // ─────────────────────────────────────────────
  // 🧱 BLOCKS (Theme via "style")
  // ─────────────────────────────────────────────
  Blockly.defineBlocksWithJsonArray([

    // 🧭 INIT: 180° Servo in Mittelstellung (Kalibrier-Block)
    {
      "type": "servo_init_center",
      "message0": "%1 Servo (180°) an Pin %2 starten (Mitte 90°) %3 ms warten",
      "args0": [
        { "type": "field_image", "src": "img/servos/servo_tinkercad_180.svg", "width": ICON, "height": ICON, "alt": "Servo 180" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        { "type": "field_number", "name": "WAIT", "value": 500, "min": 0, "max": 5000 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_primary",
      "tooltip": "Kalibrier-Block: Servo attach + auf 90° (Mitte) + kurze Pause, damit er sauber einrastet.",
      "helpUrl": ""
    },

    // 🦾 180° SERVO
    {
      "type": "servo_set_angle",
      "message0": "%1 Servo an Pin %2 auf %3 °",
      "args0": [
        { "type": "field_image", "src": "img/servos/servo_tinkercad_180.svg", "width": ICON, "height": ICON, "alt": "Servo 180" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        { "type": "field_number", "name": "ANGLE", "value": 90, "min": 0, "max": 180 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_primary",
      "tooltip": "Stellt einen Servo auf einen Winkel (0–180°).",
      "helpUrl": ""
    },

    // 🔁 360° SERVO (mit Zeit/Grad)
    {
      "type": "servo_continuous",
      "message0": "%1 Servo (360°) an Pin %2 %3 mit %4 %5 %6",
      "args0": [
        { "type": "field_image", "src": "img/servos/servo_tinkercad_360.svg", "width": ICON, "height": ICON, "alt": "Servo 360" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        {
          "type": "field_dropdown",
          "name": "DIR",
          "options": [
            ["dreht vorwärts", "FWD"],
            ["dreht rückwärts", "REV"],
            ["stop", "STOP"]
          ]
        },
        { "type": "field_number", "name": "SPEED", "value": 50, "min": 0, "max": 100 },
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            ["Dauerlauf", "FOREVER"],
            ["Zeit (s)", "TIME"],
            ["Grad (≈)", "DEG"]
          ]
        },
        { "type": "field_number", "name": "VALUE", "value": 2, "min": 0, "precision": 0.1 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_secondary",
      "tooltip": "360°-Servo: vor/zurück/stop. Optional: Zeit drehen oder ungefähr um Grad drehen.",
      "helpUrl": ""
    },

    // 🐢 SERVO LANGSAM BEWEGEN (180°)
    {
      "type": "servo_slow_move",
      "message0": "🐢 Servo langsam an Pin %1 von %2 ° nach %3 ° (%4 ms)",
      "args0": [
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        { "type": "field_number", "name": "FROM", "value": 0, "min": 0, "max": 180 },
        { "type": "field_number", "name": "TO", "value": 90, "min": 0, "max": 180 },
        { "type": "field_number", "name": "STEP_MS", "value": 10, "min": 0, "max": 1000 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_tertiary",
      "tooltip": "Bewegt einen 0–180° Servo langsam (z. B. Schranke, Greifer).",
      "helpUrl": ""
    },

    // 🧪 KALIBRIERUNG: ms pro 360° bei 100% (360°-Servo)
    {
      "type": "servo_360_calibrate",
      "message0": "🧪 360° Servo-Kalibrierung: 1 Umdrehung bei 100%% dauert %1 ms",
      "args0": [
        { "type": "field_number", "name": "MS360", "value": 1200, "min": 100, "max": 10000 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_tertiary",
      "tooltip": "Setzt den Kalibrierwert für 'Grad (≈)' bei 360°-Servos (Zeitabschätzung).",
      "helpUrl": ""
    },

    // 🔌 SERVO LÖSEN (detach)
    {
      "type": "servo_detach",
      "message0": "🔌 Servo an Pin %1 lösen (detach)",
      "args0": [
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "servo_tertiary",
      "tooltip": "Löst den Servo vom Pin (stoppt Haltekraft/Brummen, spart Strom).",
      "helpUrl": ""
    }

  ]);

  // ─────────────────────────────────────────────
  // ⚙️ ARDUINO-GENERATOR
  // ─────────────────────────────────────────────
  if (!Blockly.Arduino) return;

  function ensureServoSupport() {
    // ✅ robust: falls init noch nicht gelaufen ist
    if (!Blockly.Arduino.includes_) Blockly.Arduino.includes_ = Object.create(null);
    if (!Blockly.Arduino.definitions_) Blockly.Arduino.definitions_ = Object.create(null);
    if (!Blockly.Arduino.setups_) Blockly.Arduino.setups_ = Object.create(null);

    // ✅ Include sauber (besser als includes_ direkt)
    if (typeof Blockly.Arduino.addInclude === "function") {
      Blockly.Arduino.addInclude("moony_servo_inc", "#include <Servo.h>");
    } else {
      Blockly.Arduino.includes_["moony_servo_inc"] = "#include <Servo.h>";
    }

    if (!Blockly.Arduino.definitions_["moony_servo_helpers"]) {
      Blockly.Arduino.definitions_["moony_servo_helpers"] = `
// ---- Moony Servo Helper -----------------------------------------------

// Kalibrierwert (änderbar über Blockly-Block)
static long moony_servo_ms_per_360_at_100 = 1200; // Default

// dir: -1 = REV, 0 = STOP, +1 = FWD
static int moony_servo_continuous_value(int dir, int speedPct) {
  speedPct = constrain(speedPct, 0, 100);
  int delta = map(speedPct, 0, 100, 0, 90);
  if (dir > 0) return 90 + delta;
  if (dir < 0) return 90 - delta;
  return 90;
}

static void moony_servo_sweep(Servo &s, int fromDeg, int toDeg, int stepDelayMs) {
  fromDeg = constrain(fromDeg, 0, 180);
  toDeg   = constrain(toDeg,   0, 180);
  stepDelayMs = max(0, stepDelayMs);

  if (fromDeg == toDeg) { s.write(fromDeg); return; }

  int step = (toDeg > fromDeg) ? 1 : -1;
  for (int a = fromDeg; a != toDeg; a += step) {
    s.write(a);
    delay(stepDelayMs);
  }
  s.write(toDeg);
}

static long moony_servo_ms_for_degrees(int speedPct, float degrees) {
  speedPct = constrain(speedPct, 1, 100);
  degrees = constrain(degrees, 0.0f, 3600.0f);
  float ms360 = (float)moony_servo_ms_per_360_at_100 * (100.0f / (float)speedPct);
  return (long)(ms360 * (degrees / 360.0f));
}
`.trim();
    }
  }

  function ensureServoAttached(pin, continuous) {
    ensureServoSupport();

    const v = servoVarName(pin);

    if (!Blockly.Arduino.definitions_[`def_${v}`]) {
      Blockly.Arduino.definitions_[`def_${v}`] = `Servo ${v};`;
    }

    Blockly.Arduino.addSetup(`servo_attach_${v}`, `
${v}.attach(${pin});
${continuous ? `${v}.write(90);` : ``}
`.trim());
  }

  // 🧭 Init Mitte (180°)
  Blockly.Arduino.forBlock["servo_init_center"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const waitMs = Math.max(0, Math.min(5000, Math.round(Number(block.getFieldValue("WAIT")) || 0)));

    ensureServoAttached(pin, false);

    const v = servoVarName(pin);
    Blockly.Arduino.addSetup(`servo_center_${v}`, `
${v}.write(90);
delay(${waitMs});
`.trim());

    return "";
  };

  // 🦾 180° Servo
  Blockly.Arduino.forBlock["servo_set_angle"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const angle = Number(block.getFieldValue("ANGLE")) || 0;

    ensureServoAttached(pin, false);

    const a = Math.max(0, Math.min(180, Math.round(angle)));
    return `${servoVarName(pin)}.write(${a});\n`;
  };

  // 🔁 360° Servo mit MODE
  Blockly.Arduino.forBlock["servo_continuous"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const dir = block.getFieldValue("DIR");
    const speed = Math.max(0, Math.min(100, Math.round(Number(block.getFieldValue("SPEED")) || 0)));
    const mode = block.getFieldValue("MODE");
    const value = Number(block.getFieldValue("VALUE")) || 0;

    ensureServoAttached(pin, true);

    const d = (dir === "FWD") ? 1 : (dir === "REV") ? -1 : 0;
    const v = servoVarName(pin);

    if (d === 0) return `${v}.write(90);\n`;

    if (mode === "FOREVER") {
      return `${v}.write(moony_servo_continuous_value(${d}, ${speed}));\n`;
    }

    if (mode === "TIME") {
      const ms = Math.max(0, Math.round(value * 1000));
      return `${v}.write(moony_servo_continuous_value(${d}, ${speed}));\n` +
             `delay(${ms});\n` +
             `${v}.write(90);\n`;
    }

    const deg = Math.max(0, value);
    return `${v}.write(moony_servo_continuous_value(${d}, ${speed}));\n` +
           `delay(moony_servo_ms_for_degrees(${speed}, ${deg}));\n` +
           `${v}.write(90);\n`;
  };

  // 🐢 180° Sweep
  Blockly.Arduino.forBlock["servo_slow_move"] = function (block) {
    const pin = block.getFieldValue("PIN");
    const fromDeg = Number(block.getFieldValue("FROM")) || 0;
    const toDeg = Number(block.getFieldValue("TO")) || 0;
    const stepMs = Number(block.getFieldValue("STEP_MS")) || 0;

    ensureServoAttached(pin, false);

    const f = Math.max(0, Math.min(180, Math.round(fromDeg)));
    const t = Math.max(0, Math.min(180, Math.round(toDeg)));
    const d = Math.max(0, Math.min(1000, Math.round(stepMs)));

    return `moony_servo_sweep(${servoVarName(pin)}, ${f}, ${t}, ${d});\n`;
  };

  // 🧪 Kalibrierung setzen
  Blockly.Arduino.forBlock["servo_360_calibrate"] = function (block) {
    ensureServoSupport();
    const ms = Math.max(100, Math.min(10000, Math.round(Number(block.getFieldValue("MS360")) || 1200)));
    return `moony_servo_ms_per_360_at_100 = ${ms};\n`;
  };

  // 🔌 Detach
  Blockly.Arduino.forBlock["servo_detach"] = function (block) {
    const pin = block.getFieldValue("PIN");
    ensureServoAttached(pin, false);
    return `${servoVarName(pin)}.detach();\n`;
  };

})();