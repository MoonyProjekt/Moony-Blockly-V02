// js/blocks_sensor.js
(function () {
  if (typeof Blockly === "undefined") return;

  const ICON = 32;

  const PIN_OPTIONS = [
    ["A0","A0"],["A1","A1"],["A2","A2"],["A3","A3"],["A4","A4"],["A5","A5"],
    ["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],
    ["8","8"],["9","9"],["10","10"],["11","11"],["12","12"],["13","13"]
  ];

  // ✅ NEU: Analog-Pins separat (für AO sauberer)
  const ANALOG_PIN_OPTIONS = [
    ["A0","A0"],["A1","A1"],["A2","A2"],["A3","A3"],["A4","A4"],["A5","A5"]
  ];

  const BUTTON_MODE = [
    ["Pullup (empfohlen)", "PULLUP"],
    ["Pulldown (nur extern)", "PULLDOWN"]
  ];

  const VL53_MODE_OPTIONS = [
    ["Schnell (Fahrzeug)", "HS"],
    ["Genau (Messung)", "HA"],
    ["Standard", "DEF"]
  ];

  // ============================================================
  // BLOCKS (Theme via "style")
  // ============================================================
  Blockly.defineBlocksWithJsonArray([

    // ---------------- HC-SR04 ----------------
    {
      "type": "sensor_hcsr04_distance",
      "message0": "%1 HC-SR04 Abstand in %2 (Trig %3 Echo %4)",
      "args0": [
        { "type": "field_image", "src": "img/sensors/hcsr04.png", "width": ICON, "height": ICON, "alt": "HC-SR04" },
        { "type": "field_dropdown", "name": "UNIT", "options": [["cm","CM"],["mm","MM"]] },
        { "type": "field_number", "name": "TRIG", "value": 5, "min": 0, "max": 13, "precision": 1 },
        { "type": "field_number", "name": "ECHO", "value": 6, "min": 0, "max": 13, "precision": 1 }
      ],
      "output": "Number",
      "inputsInline": true,
      "style": "sensor_ultra",
      "tooltip": "Misst die Entfernung mit einem HC-SR04 (kein Echo -> großer Wert).",
      "helpUrl": ""
    },

    // ---------------- VL53L0X ----------------
    {
      "type": "sensor_vl53l0x_init",
      "message0": "%1 VL53L0X starten",
      "args0": [
        { "type": "field_image", "src": "img/sensors/vl53l0x.png", "width": ICON, "height": ICON, "alt": "VL53L0X" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sensor_tof",
      "tooltip": "Initialisiert den VL53L0X über I2C (Nano/UNO: SDA=A4, SCL=A5).",
      "helpUrl": ""
    },

    {
      "type": "sensor_vl53l0x_mode",
      "message0": "%1 VL53 Modus %2",
      "args0": [
        { "type": "field_image", "src": "img/sensors/vl53l0x.png", "width": ICON, "height": ICON, "alt": "VL53L0X" },
        { "type": "field_dropdown", "name": "MODE", "options": VL53_MODE_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "inputsInline": true,
      "style": "sensor_tof",
      "tooltip": "Stellt den VL53 Modus um (Schnell / Genau / Standard).",
      "helpUrl": ""
    },

    {
      "type": "sensor_vl53l0x_calib",
      "message0": "%1 VL53 Kalibrierung Offset %2 mm Mittelung %3",
      "args0": [
        { "type": "field_image", "src": "img/sensors/vl53l0x.png", "width": ICON, "height": ICON, "alt": "VL53L0X" },
        { "type": "field_number", "name": "OFF", "value": -20, "min": -200, "max": 200, "precision": 1 },
        { "type": "field_number", "name": "AVG", "value": 2, "min": 1, "max": 8, "precision": 1 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "inputsInline": true,
      "style": "sensor_tof",
      "tooltip": "Offset (mm) und Mittelung (1..8 Messungen) einstellen.",
      "helpUrl": ""
    },

    {
      "type": "sensor_vl53l0x_calib_reset",
      "message0": "%1 VL53 Kalibrierung zurücksetzen",
      "args0": [
        { "type": "field_image", "src": "img/sensors/vl53l0x.png", "width": ICON, "height": ICON, "alt": "VL53L0X" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sensor_tof",
      "tooltip": "Setzt Offset=0 und Mittelung=2.",
      "helpUrl": ""
    },

    {
      "type": "sensor_vl53l0x_distance",
      "message0": "%1 VL53L0X Abstand in %2",
      "args0": [
        { "type": "field_image", "src": "img/sensors/vl53l0x.png", "width": ICON, "height": ICON, "alt": "VL53L0X" },
        { "type": "field_dropdown", "name": "UNIT", "options": [["mm","MM"],["cm","CM"]] }
      ],
      "output": "Number",
      "inputsInline": true,
      "style": "sensor_tof",
      "tooltip": "Liest den Abstand vom VL53L0X. Bei ungültiger Messung -> 9999.",
      "helpUrl": ""
    },

    // ---------------- Button ----------------
    {
      "type": "sensor_button_pressed",
      "message0": "%1 Taster an Pin %2 gedrückt (%3)",
      "args0": [
        { "type": "field_image", "src": "img/sensors/button.png", "width": ICON, "height": ICON, "alt": "Button" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "MODE", "options": BUTTON_MODE }
      ],
      "output": "Boolean",
      "inputsInline": true,
      "style": "sensor_button",
      "tooltip": "Gibt wahr zurück, wenn der Taster gedrückt ist. Pulldown nur mit externem Widerstand!",
      "helpUrl": ""
    },

    // ---------------- Switch ----------------
    {
      "type": "sensor_switch_on",
      "message0": "%1 Schalter an Pin %2 EIN (%3)",
      "args0": [
        { "type": "field_image", "src": "img/sensors/switch.png", "width": ICON, "height": ICON, "alt": "Switch" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "MODE", "options": BUTTON_MODE }
      ],
      "output": "Boolean",
      "inputsInline": true,
      "style": "sensor_switch",
      "tooltip": "Gibt wahr zurück, wenn der Schalter eingeschaltet ist. Pulldown nur mit externem Widerstand!",
      "helpUrl": ""
    },

    // ---------------- Soil Moisture (LM393) ----------------
    {
      "type": "sensor_soil_analog_raw",
      "message0": "%1 Bodenfeuchte analog (AO) an %2",
      "args0": [
        { "type": "field_image", "src": "img/sensors/soil.png", "width": ICON, "height": ICON, "alt": "Soil" },
        { "type": "field_dropdown", "name": "PIN", "options": ANALOG_PIN_OPTIONS }
      ],
      "output": "Number",
      "inputsInline": true,
      "style": "sensor_soil",
      "tooltip": "Liest den analogen Rohwert (0..1023) vom Bodenfeuchte-Sensor (AO).",
      "helpUrl": ""
    },

    {
      "type": "sensor_soil_analog_percent",
      "message0": "%1 Bodenfeuchte in % (AO) an %2 trocken=%3 nass=%4",
      "args0": [
        { "type": "field_image", "src": "img/sensors/soil.png", "width": ICON, "height": ICON, "alt": "Soil" },
        { "type": "field_dropdown", "name": "PIN", "options": ANALOG_PIN_OPTIONS },
        { "type": "field_number", "name": "DRY", "value": 800, "min": 0, "max": 1023, "precision": 1 },
        { "type": "field_number", "name": "WET", "value": 350, "min": 0, "max": 1023, "precision": 1 }
      ],
      "output": "Number",
      "inputsInline": true,
      "style": "sensor_soil",
      "tooltip": "Gibt 0..100% zurück (trocken/nass kalibrieren: trocken größer als nass).",
      "helpUrl": ""
    },

    {
      "type": "sensor_soil_is_dry",
      "message0": "%1 Erde trocken? (DO) an Pin %2",
      "args0": [
        { "type": "field_image", "src": "img/sensors/soil.png", "width": ICON, "height": ICON, "alt": "Soil" },
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS }
      ],
      "output": "Boolean",
      "inputsInline": true,
      "style": "sensor_soil",
      "tooltip": "Digitalausgang (DO). Typisch: HIGH = trocken, LOW = feucht (Schwellwert am Poti).",
      "helpUrl": ""
    }

  ]);

  // ============================================================
  // ARDUINO GENERATOR
  // ============================================================
  if (!Blockly.Arduino) return;

  // ---------- HC-SR04 ----------
  Blockly.Arduino.forBlock["sensor_hcsr04_distance"] = function(block) {
    const trig = block.getFieldValue("TRIG");
    const echo = block.getFieldValue("ECHO");
    const unit = block.getFieldValue("UNIT"); // CM / MM

    if (!Blockly.Arduino.definitions_["hcsr04_core_v2"]) {
      Blockly.Arduino.addInclude("Arduino_h", "#include <Arduino.h>");
      Blockly.Arduino.definitions_["hcsr04_core_v2"] = `
static float moonyHCcm(int t, int e){
  digitalWrite(t, LOW); delayMicroseconds(2);
  digitalWrite(t, HIGH); delayMicroseconds(10);
  digitalWrite(t, LOW);

  unsigned long d = pulseIn(e, HIGH, 20000UL);

  // Kein Echo -> großer Wert (nicht 0!)
  if(d==0) return 9999;

  float cm = (d * 0.0343) / 2.0;

  // Plausibilität
  if(cm <= 0 || cm > 400) return 9999;

  return cm;
}`.trim();
    }

    Blockly.Arduino.addSetup("hcsr_" + trig + "_" + echo, `
pinMode(${trig}, OUTPUT);
pinMode(${echo}, INPUT);
`.trim());

    if (unit === "MM") {
      return [`(moonyHCcm(${trig},${echo}) * 10.0)`, Blockly.Arduino.ORDER_ATOMIC];
    }
    return [`moonyHCcm(${trig},${echo})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  // ---------- VL53L0X (ROBUST v10) ----------
  function ensureVL53() {
    if (Blockly.Arduino.definitions_["vl53_core_v10"]) return;

    Blockly.Arduino.addInclude("Wire_h", "#include <Wire.h>");
    Blockly.Arduino.addInclude("VL53_h", "#include <Adafruit_VL53L0X.h>");

    Blockly.Arduino.definitions_["vl53_core_v10"] = `
Adafruit_VL53L0X moony_vl53 = Adafruit_VL53L0X();
bool moony_vl53_ok = false;
bool moony_wire_ok = false;

// Kalibrierwerte (per Block änderbar)
static float MOONY_VL_SCALE  = 1.00;
static int   MOONY_VL_OFFSET = -20; // Default
static int   MOONY_VL_AVG    = 2;   // Default

// Modus (per Block änderbar)
static int MOONY_VL_MODE = 0; // 0=HS, 1=HA, 2=DEF

// Auto-Reconnect
static unsigned long moonyVL_nextTry = 0;
static const unsigned long moonyVL_tryEveryMs = 1000;

static void moonyVL_applyMode(){
  if(!moony_vl53_ok) return;

  if(MOONY_VL_MODE == 1){
    moony_vl53.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_HIGH_ACCURACY);
  } else if(MOONY_VL_MODE == 2){
    moony_vl53.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_DEFAULT);
  } else {
    moony_vl53.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_HIGH_SPEED);
  }
}

static void moonyVL_tryInit(){
  if(!moony_wire_ok){
    Wire.begin();
    moony_wire_ok = true;
  }

  moony_vl53_ok = moony_vl53.begin();
  if(moony_vl53_ok){
    moonyVL_applyMode();
  }
}

static void moonyVL_tick(){
  // wenn schon ok -> nix tun
  if(moony_vl53_ok) return;

  unsigned long now = millis();
  if(now < moonyVL_nextTry) return;

  moonyVL_nextTry = now + moonyVL_tryEveryMs;
  moonyVL_tryInit();
}

// Sample: nur Status 0 verwenden
static int moonyVLmm_one(){
  if(!moony_vl53_ok) return 9999;

  VL53L0X_RangingMeasurementData_t m;
  moony_vl53.rangingTest(&m,false);

  if(m.RangeStatus != 0) return 9999;

  int mm = (int)m.RangeMilliMeter;
  if(mm <= 0 || mm > 2000) return 9999;

  return mm;
}

static int moonyVLmm(){
  static int last_good = 9999;

  if(!moony_vl53_ok){
    moonyVL_tick();
    return 9999;
  }

  int target = MOONY_VL_AVG;
  if(target < 1) target = 1;
  if(target > 8) target = 8;

  long sum = 0;
  int  n   = 0;

  for(int i=0;i<8;i++){
    int mm = moonyVLmm_one();
    if(mm != 9999){
      sum += mm;
      n++;
      if(n >= target) break;
    }
    delay(1);
  }

  int raw = (n > 0) ? (int)(sum / n) : last_good;
  if(n > 0) last_good = raw;

  int cal = (int)(raw * MOONY_VL_SCALE) + MOONY_VL_OFFSET;
  if(cal <= 0 || cal > 2000) return 9999;

  return cal;
}
`.trim();

    // Setup + Loop Tick für Auto-Reconnect
    Blockly.Arduino.addSetup("vl53_setup_v10", `
Wire.begin();
moony_wire_ok = true;
moony_vl53_ok = moony_vl53.begin();
if(moony_vl53_ok){
  MOONY_VL_MODE = 0; // Default: HIGH_SPEED
  moonyVL_applyMode();
}else{
  moonyVL_nextTry = millis() + 200; // erster Retry schnell
}
`.trim());

    Blockly.Arduino.addLoop("vl53_tick_v10", `moonyVL_tick();`);
  }

  Blockly.Arduino.forBlock["sensor_vl53l0x_init"] = function() {
    ensureVL53();
    return "";
  };

  Blockly.Arduino.forBlock["sensor_vl53l0x_distance"] = function(block) {
    ensureVL53();
    const unit = block.getFieldValue("UNIT");
    if (unit === "CM") return [`(moonyVLmm() / 10.0)`, Blockly.Arduino.ORDER_ATOMIC];
    return [`moonyVLmm()`, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["sensor_vl53l0x_mode"] = function(block) {
    ensureVL53();
    const mode = block.getFieldValue("MODE"); // HS/HA/DEF
    let m = 0;
    if (mode === "HA") m = 1;
    else if (mode === "DEF") m = 2;

    return `
MOONY_VL_MODE = ${m};
moonyVL_applyMode();
`.trim() + "\n";
  };

  Blockly.Arduino.forBlock["sensor_vl53l0x_calib"] = function(block) {
    ensureVL53();
    const off = Number(block.getFieldValue("OFF")) || 0;
    let avg = Number(block.getFieldValue("AVG")) || 2;
    if (avg < 1) avg = 1;
    if (avg > 8) avg = 8;

    return `
MOONY_VL_OFFSET = ${off};
MOONY_VL_AVG    = ${avg};
`.trim() + "\n";
  };

  Blockly.Arduino.forBlock["sensor_vl53l0x_calib_reset"] = function() {
    ensureVL53();
    return `
MOONY_VL_OFFSET = 0;
MOONY_VL_AVG    = 2;
`.trim() + "\n";
  };

  // ---------- Button / Switch ----------
  function setupButton(pin, mode){
    const key = "btn_" + pin + "_" + mode;
    if(mode === "PULLUP") {
      Blockly.Arduino.addSetup(key, `pinMode(${pin}, INPUT_PULLUP);`);
    } else {
      // AVR (UNO/Nano) hat KEIN internes Pulldown!
      Blockly.Arduino.addSetup(key, `pinMode(${pin}, INPUT);`);
    }
  }

  Blockly.Arduino.forBlock["sensor_button_pressed"] = function(block){
    const pin = block.getFieldValue("PIN");
    const mode = block.getFieldValue("MODE");
    setupButton(pin,mode);
    if(mode === "PULLUP") return [`digitalRead(${pin})==LOW`, Blockly.Arduino.ORDER_ATOMIC];
    return [`digitalRead(${pin})==HIGH`, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["sensor_switch_on"] = function(block){
    const pin = block.getFieldValue("PIN");
    const mode = block.getFieldValue("MODE");
    setupButton(pin,mode);
    if(mode === "PULLUP") return [`digitalRead(${pin})==LOW`, Blockly.Arduino.ORDER_ATOMIC];
    return [`digitalRead(${pin})==HIGH`, Blockly.Arduino.ORDER_ATOMIC];
  };

  // ---------- Soil Moisture (LM393) ----------
  Blockly.Arduino.forBlock["sensor_soil_analog_raw"] = function(block){
    const pin = block.getFieldValue("PIN");
    Blockly.Arduino.addInclude("Arduino_h", "#include <Arduino.h>");
    return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["sensor_soil_analog_percent"] = function(block){
    const pin = block.getFieldValue("PIN");
    const dry = Number(block.getFieldValue("DRY"));
    const wet = Number(block.getFieldValue("WET"));

    Blockly.Arduino.addInclude("Arduino_h", "#include <Arduino.h>");

    if (!Blockly.Arduino.definitions_["moony_soil_percent_v1"]) {
      Blockly.Arduino.definitions_["moony_soil_percent_v1"] = `
static int moonySoilPercent(int raw, int dry, int wet){
  raw = constrain(raw, 0, 1023);
  dry = constrain(dry, 0, 1023);
  wet = constrain(wet, 0, 1023);
  if(dry == wet) return 0;

  // Üblicherweise: trocken = größerer Wert, nass = kleinerer Wert
  // Wenn vertauscht -> automatisch tauschen
  bool swapped = false;
  if(dry < wet){ int t = dry; dry = wet; wet = t; swapped = true; }

  long p = map(raw, dry, wet, 0, 100);
  p = constrain(p, 0, 100);

  // falls swapped (selten), invertieren
  if(swapped) p = 100 - p;

  return (int)p;
}`.trim();
    }

    return [`moonySoilPercent(analogRead(${pin}), ${dry}, ${wet})`, Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["sensor_soil_is_dry"] = function(block){
    const pin = block.getFieldValue("PIN");
    Blockly.Arduino.addInclude("Arduino_h", "#include <Arduino.h>");
    Blockly.Arduino.addSetup("soil_do_" + pin, `pinMode(${pin}, INPUT);`);
    // Typisch: HIGH = trocken, LOW = feucht (Poti-Schwelle)
    return [`(digitalRead(${pin}) == HIGH)`, Blockly.Arduino.ORDER_ATOMIC];
  };

})();