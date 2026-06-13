// js/blocks_animation.js
// Moony Blockly – Animationen (Augen) 2× MAX7219 8×8 (GETRENNT)
// ✅ Theme: style-only (keine colour-Definitionen mehr)

(function () {
  if (typeof Blockly === "undefined") return;

  // Sichere Pins für MAX7219 (ohne 8,9,10)
  const PIN_OPTIONS = [
    ["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],
    ["11","11"],["12","12"],["13","13"],
    ["A0","A0"],["A1","A1"],["A2","A2"],["A3","A3"],["A4","A4"],["A5","A5"]
  ];

  const INTENSITY_OPTIONS = [
    ["0 (aus)","0"],
    ["1 (sehr dunkel)","1"],
    ["2 (dunkel)","2"],
    ["3 (mittel)","3"],
    ["4 (hell)","4"],
    ["5","5"],["6","6"],["7","7"],["8","8"],["9","9"],
    ["10","10"],["11","11"],["12","12"],["13","13"],["14","14"],
    ["15 (max)","15"]
  ];

  // ✅ kleiner, damit Pupille in den Ecken nicht „zu weit unten“ wirkt
  const DIR_OPTIONS = [
    ["gerade", "0,0"],
    ["links", "-1,0"],
    ["rechts", "1,0"],
    ["oben", "0,-1"],
    ["unten", "0,1"],
    ["links-oben", "-1,-1"],
    ["rechts-oben", "1,-1"],
    ["links-unten", "-1,1"],
    ["rechts-unten", "1,1"]
  ];

  const ICON_OPTIONS = [
    ["offen", "OPEN"],
    ["halb", "HALF"],
    ["zu", "CLOSE"],
    ["schlaf", "SLEEP"],
    ["wütend", "ANGRY"],
    ["happy", "HAPPY"]
  ];

  const ROT_OPTIONS = [
    ["0°", "0"],
    ["90°", "90"],
    ["180°", "180"],
    ["270°", "270"]
  ];

  // ------------------------------------------------------------
  // BLOCKS (Theme via "style")
  // ------------------------------------------------------------
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "animation_eyes_init",
      "message0": "🎞️ Augen starten  links DIN %1 CLK %2 CS %3 Drehung %4  rechts DIN %5 CLK %6 CS %7 Drehung %8  Helligkeit %9",
      "args0": [
        { "type": "field_dropdown", "name": "LDIN", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "LCLK", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "LCS",  "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "LROT", "options": ROT_OPTIONS },

        { "type": "field_dropdown", "name": "RDIN", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "RCLK", "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "RCS",  "options": PIN_OPTIONS },
        { "type": "field_dropdown", "name": "RROT", "options": ROT_OPTIONS },

        { "type": "field_dropdown", "name": "INT",  "options": INTENSITY_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "animation_blocks",
      "inputsInline": false
    },
    {
      "type": "animation_clear",
      "message0": "🎞️ Animationen löschen",
      "previousStatement": null,
      "nextStatement": null,
      "style": "animation_blocks",
      "inputsInline": true
    },
    {
      "type": "animation_eyes_icon",
      "message0": "👀 %1 Icon %2",
      "args0": [
        { "type": "field_dropdown", "name": "EYE", "options": [["links","L"],["rechts","R"],["beide","BOTH"]] },
        { "type": "field_dropdown", "name": "ICON", "options": ICON_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "animation_blocks",
      "inputsInline": true
    },
    {
      "type": "animation_eyes_look",
      "message0": "👀 %1 schauen %2",
      "args0": [
        { "type": "field_dropdown", "name": "EYE", "options": [["links","L"],["rechts","R"],["beide","BOTH"]] },
        { "type": "field_dropdown", "name": "DIR", "options": DIR_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "animation_blocks",
      "inputsInline": true
    },
    {
      "type": "animation_eyes_blink",
      "message0": "👀 %1 blinzeln %2× Tempo %3 ms",
      "args0": [
        { "type": "field_dropdown", "name": "EYE", "options": [["links","L"],["rechts","R"],["beide","BOTH"]] },
        { "type": "field_number", "name": "TIMES", "value": 1, "min": 1, "max": 30 },
        { "type": "field_number", "name": "MS", "value": 120, "min": 20, "max": 2000 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "animation_blocks",
      "inputsInline": true
    }
  ]);

  // ------------------------------------------------------------
  // ARDUINO GENERATOR
  // ------------------------------------------------------------
  if (!Blockly.Arduino) return;

  function ensureAnimationEyesCore() {
    Blockly.Arduino.addInclude("ledcontrol", "#include <LedControl.h>");
    // ✅ wichtig für strcmp
    Blockly.Arduino.addInclude("string_h", "#include <string.h>");

    Blockly.Arduino.addInclude("moony_anim_eyes_core", `
static LedControl* eyesL = nullptr;
static LedControl* eyesR = nullptr;
static bool eyesReady = false;

static int eyesLDIN=12, eyesLCLK=11, eyesLCS=10;
static int eyesRDIN=9,  eyesRCLK=8,  eyesRCS=7;
static int eyesIntensity = 1;

// Rotation pro Auge: 0/90/180/270
static int eyesRotL = 0;
static int eyesRotR = 0;

// Pupillen-Offset
static int8_t pupilLX=0, pupilLY=0;
static int8_t pupilRX=0, pupilRY=0;

static void eyesEnsureInit() {
  if (!eyesReady) {
    eyesL = new LedControl(eyesLDIN, eyesLCLK, eyesLCS, 1);
    eyesR = new LedControl(eyesRDIN, eyesRCLK, eyesRCS, 1);

    eyesL->shutdown(0,false);
    eyesR->shutdown(0,false);

    eyesL->setIntensity(0, eyesIntensity);
    eyesR->setIntensity(0, eyesIntensity);

    eyesL->clearDisplay(0);
    eyesR->clearDisplay(0);

    eyesReady = true;
  }
}

// --------- Cache (Blockly-Schleifen-sicher) ---------
static const char* lastIconL = nullptr;
static const char* lastIconR = nullptr;
static int8_t lastLX = 99, lastLY = 99;
static int8_t lastRX = 99, lastRY = 99;

static bool streq(const char* a, const char* b) {
  if (a == b) return true;
  if (!a || !b) return false;
  return strcmp(a, b) == 0;
}

static void eyesCacheReset() {
  lastIconL = nullptr;
  lastIconR = nullptr;
  lastLX = lastLY = 99;
  lastRX = lastRY = 99;
}

static void eyesClear() {
  eyesEnsureInit();
  eyesL->clearDisplay(0);
  eyesR->clearDisplay(0);
  eyesCacheReset();
}

// --------- Rotation helpers (AVR-sicher) ---------
static byte rev8(byte b) {
  b = (byte)(((b & 0xF0) >> 4) | ((b & 0x0F) << 4));
  b = (byte)(((b & 0xCC) >> 2) | ((b & 0x33) << 2));
  b = (byte)(((b & 0xAA) >> 1) | ((b & 0x55) << 1));
  return b;
}

static void __attribute__((noinline)) rot180(const byte inRows[8], byte outRows[8]) {
  for (int y = 0; y < 8; y++) outRows[y] = rev8(inRows[7 - y]);
}

// ✅ sichere Bit-Helper (für korrekte 90/270 Rotation)
static inline byte getBit(const byte rows[8], int x, int y) {
  return (rows[y] >> (7 - x)) & 0x01;
}
static inline void setBit(byte rows[8], int x, int y, byte v) {
  if (!v) return;
  rows[y] |= (1 << (7 - x));
}

static void rot90(const byte inRows[8], byte outRows[8]) {
  for (int y = 0; y < 8; y++) outRows[y] = 0;
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      setBit(outRows, 7 - y, x, getBit(inRows, x, y));
    }
  }
}

static void rot270(const byte inRows[8], byte outRows[8]) {
  for (int y = 0; y < 8; y++) outRows[y] = 0;
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      setBit(outRows, y, 7 - x, getBit(inRows, x, y));
    }
  }
}

static void applyRot(const byte inRows[8], byte outRows[8], int rot) {
  if (rot == 90) {
    rot90(inRows, outRows);
  } else if (rot == 180) {
    rot180(inRows, outRows);
  } else if (rot == 270) {
    rot270(inRows, outRows);
  } else {
    for (int y = 0; y < 8; y++) outRows[y] = inRows[y];
  }
}

static int8_t clampPupil(int v) {
  if (v < -1) return -1;
  if (v > 1) return 1;
  return (int8_t)v;
}

// --------- bestehende Augenformen beibehalten ---------
static void eyeBaseOpen(byte rows[8]) {
  	rows[0] = B00000000;
	rows[1] = B00111100;
	rows[2] = B01000010;
	rows[3] = B01000010;
	rows[4] = B01000010;
	rows[5] = B01000010;
	rows[6] = B00111100;
	rows[7] = B00000000;
}

static void eyeBaseHalf(byte rows[8]) {
  rows[0] = B00000000;
  rows[1] = B00000000;
  rows[2] = B00111100;
  rows[3] = B01011010;
  rows[4] = B01011010;
  rows[5] = B00111100;
  rows[6] = B00000000;
  rows[7] = B00000000;
}

static void eyeBaseClose(byte rows[8]) {
  rows[0] = B00000000;
  rows[1] = B00000000;
  rows[2] = B00000000;
  rows[3] = B01111110;
  rows[4] = B01111110;
  rows[5] = B00000000;
  rows[6] = B00000000;
  rows[7] = B00000000;
}

static void eyeBaseSleep(byte rows[8]) {
  rows[0] = B00000000;
  rows[1] = B00000000;
  rows[2] = B11100000;
  rows[3] = B01110000;
  rows[4] = B00111000;
  rows[5] = B00011100;
  rows[6] = B00000000;
  rows[7] = B00000000;
}

static void eyeBaseAngry(byte rows[8], bool leftEye) {
  if (leftEye) {
    rows[0] = B11100000;
    rows[1] = B01110000;
    rows[2] = B10011100;
    rows[3] = B10000010;
    rows[4] = B10000001;
    rows[5] = B10000001;
    rows[6] = B01000010;
    rows[7] = B00111100;
  } else {
    rows[0] = B00000111;
    rows[1] = B00001110;
    rows[2] = B00111001;
    rows[3] = B01000001;
    rows[4] = B10000001;
    rows[5] = B10000001;
    rows[6] = B01000010;
    rows[7] = B00111100;
  }
}

static void eyeBaseHappy(byte rows[8]) {
  rows[0] = B00000000;
  rows[1] = B00000000;
  rows[2] = B01000010;
  rows[3] = B00100100;
  rows[4] = B00011000;
  rows[5] = B00000000;
  rows[6] = B00000000;
  rows[7] = B00000000;
}

static void eyeAddPupil(byte rows[8], int8_t px, int8_t py) {
  int cx = 3 + px;
  int cy = 3 + py;

  if (cx < 2) cx = 2;
  if (cx > 5) cx = 5;
  if (cy < 2) cy = 2;
  if (cy > 5) cy = 5;

  rows[cy] |= (1 << (7 - cx));
  if (cx + 1 < 8) rows[cy] |= (1 << (7 - (cx + 1)));
  if (cy + 1 < 8) {
    rows[cy + 1] |= (1 << (7 - cx));
    if (cx + 1 < 8) rows[cy + 1] |= (1 << (7 - (cx + 1)));
  }
}

static void eyeBuildRows(bool leftEye, const char* icon, int8_t px, int8_t py, byte rows[8]) {
  for (int i = 0; i < 8; i++) rows[i] = 0;

  if (!icon || strcmp(icon, "OPEN") == 0) {
    eyeBaseOpen(rows);
    eyeAddPupil(rows, px, py);
    return;
  }

  if (strcmp(icon, "HALF") == 0) {
    eyeBaseHalf(rows);
    return;
  }

  if (strcmp(icon, "CLOSE") == 0) {
    eyeBaseClose(rows);
    return;
  }

  if (strcmp(icon, "SLEEP") == 0) {
    eyeBaseSleep(rows);
    return;
  }

  if (strcmp(icon, "ANGRY") == 0) {
    eyeBaseAngry(rows, leftEye);
    eyeAddPupil(rows, px, py);
    return;
  }

  if (strcmp(icon, "HAPPY") == 0) {
    eyeBaseHappy(rows);
    return;
  }

  eyeBaseOpen(rows);
  eyeAddPupil(rows, px, py);
}

static void eyesWriteOne(bool leftEye, const char* icon, int8_t px, int8_t py) {
  eyesEnsureInit();

  byte raw[8];
  byte out[8];

  eyeBuildRows(leftEye, icon, px, py, raw);
  applyRot(raw, out, leftEye ? eyesRotL : eyesRotR);

  LedControl* disp = leftEye ? eyesL : eyesR;
  for (int r = 0; r < 8; r++) {
    disp->setRow(0, r, out[r]);
  }
}

// --------- NUR DIESE FEHLENDEN FUNKTIONEN ERGÄNZT ---------
static void eyesSetLook(bool leftEye, int8_t offX, int8_t offY) {
  offX = clampPupil(offX);
  offY = clampPupil(offY);

  if (leftEye) {
    pupilLX = offX;
    pupilLY = offY;
  } else {
    pupilRX = offX;
    pupilRY = offY;
  }
}

static void eyesShowIconCached(char eye, const char* icon) {
  eyesEnsureInit();

  if (eye == 'L' || eye == 'B') {
    if (!streq(lastIconL, icon) || lastLX != pupilLX || lastLY != pupilLY) {
      eyesWriteOne(true, icon, pupilLX, pupilLY);
      lastIconL = icon;
      lastLX = pupilLX;
      lastLY = pupilLY;
    }
  }

  if (eye == 'R' || eye == 'B') {
    if (!streq(lastIconR, icon) || lastRX != pupilRX || lastRY != pupilRY) {
      eyesWriteOne(false, icon, pupilRX, pupilRY);
      lastIconR = icon;
      lastRX = pupilRX;
      lastRY = pupilRY;
    }
  }
}

static void eyesLookCached(char eye, int8_t offX, int8_t offY) {
  eyesEnsureInit();

  if (eye == 'L' || eye == 'B') {
    eyesSetLook(true, offX, offY);
    eyesShowIconCached('L', lastIconL ? lastIconL : "OPEN");
  }

  if (eye == 'R' || eye == 'B') {
    eyesSetLook(false, offX, offY);
    eyesShowIconCached('R', lastIconR ? lastIconR : "OPEN");
  }
}

static void eyesBlinkOne(bool leftEye, int times, int ms) {
  eyesEnsureInit();

  if (times < 1) times = 1;
  if (ms < 20) ms = 20;

  const char* restoreIcon = leftEye
    ? (lastIconL ? lastIconL : "OPEN")
    : (lastIconR ? lastIconR : "OPEN");

  for (int i = 0; i < times; i++) {
    if (leftEye) {
      eyesShowIconCached('L', "HALF");
      delay(ms / 2);
      eyesShowIconCached('L', "CLOSE");
      delay(ms);
      eyesShowIconCached('L', "HALF");
      delay(ms / 2);
      eyesShowIconCached('L', restoreIcon);
    } else {
      eyesShowIconCached('R', "HALF");
      delay(ms / 2);
      eyesShowIconCached('R', "CLOSE");
      delay(ms);
      eyesShowIconCached('R', "HALF");
      delay(ms / 2);
      eyesShowIconCached('R', restoreIcon);
    }
  }
}

static void eyesBlinkBoth(int times, int ms) {
  eyesEnsureInit();

  if (times < 1) times = 1;
  if (ms < 20) ms = 20;

  const char* restoreL = lastIconL ? lastIconL : "OPEN";
  const char* restoreR = lastIconR ? lastIconR : "OPEN";

  for (int i = 0; i < times; i++) {
    eyesShowIconCached('B', "HALF");
    delay(ms / 2);
    eyesShowIconCached('B', "CLOSE");
    delay(ms);
    eyesShowIconCached('B', "HALF");
    delay(ms / 2);
    eyesShowIconCached('L', restoreL);
    eyesShowIconCached('R', restoreR);
  }
}
`.trim());
  }

  // ----------------- Generators -----------------
  Blockly.Arduino.forBlock["animation_eyes_init"] = (b) => {
    ensureAnimationEyesCore();

    const ldin = b.getFieldValue("LDIN");
    const lclk = b.getFieldValue("LCLK");
    const lcs  = b.getFieldValue("LCS");
    const lrot = b.getFieldValue("LROT") || "0";

    const rdin = b.getFieldValue("RDIN");
    const rclk = b.getFieldValue("RCLK");
    const rcs  = b.getFieldValue("RCS");
    const rrot = b.getFieldValue("RROT") || "0";

    const inten = b.getFieldValue("INT") || "1";

    Blockly.Arduino.addSetup(
      "moony_anim_eyes_init",
      `
eyesLDIN=${ldin}; eyesLCLK=${lclk}; eyesLCS=${lcs};
eyesRDIN=${rdin}; eyesRCLK=${rclk}; eyesRCS=${rcs};
eyesRotL=${lrot}; eyesRotR=${rrot};
eyesIntensity=${inten};
eyesReady=false;
eyesEnsureInit();
eyesCacheReset();
eyesSetLook(true,0,0);
eyesSetLook(false,0,0);
eyesShowIconCached('B', "OPEN");
`
    );
    return "";
  };

  Blockly.Arduino.forBlock["animation_clear"] = () => {
    ensureAnimationEyesCore();
    return `eyesClear();\n`;
  };

  Blockly.Arduino.forBlock["animation_eyes_icon"] = (b) => {
    ensureAnimationEyesCore();
    const eye = b.getFieldValue("EYE");
    const icon = b.getFieldValue("ICON") || "OPEN";

    if (eye === "BOTH") return `eyesShowIconCached('B', "${icon}");\n`;
    if (eye === "L")    return `eyesShowIconCached('L', "${icon}");\n`;
    return              `eyesShowIconCached('R', "${icon}");\n`;
  };

  Blockly.Arduino.forBlock["animation_eyes_look"] = (b) => {
    ensureAnimationEyesCore();
    const eye = b.getFieldValue("EYE");
    const dir = b.getFieldValue("DIR") || "0,0";
    const parts = dir.split(",");
    const offX = (parts[0] || "0").trim();
    const offY = (parts[1] || "0").trim();

    if (eye === "BOTH") return `eyesLookCached('B', ${offX}, ${offY});\n`;
    if (eye === "L")    return `eyesLookCached('L', ${offX}, ${offY});\n`;
    return              `eyesLookCached('R', ${offX}, ${offY});\n`;
  };

  Blockly.Arduino.forBlock["animation_eyes_blink"] = (b) => {
    ensureAnimationEyesCore();
    const eye = b.getFieldValue("EYE");
    const times = String(Number(b.getFieldValue("TIMES") || 1));
    const ms = String(Number(b.getFieldValue("MS") || 120));

    if (eye === "BOTH") return `eyesBlinkBoth(${times}, ${ms});\n`;
    if (eye === "L")    return `eyesBlinkOne(true, ${times}, ${ms});\n`;
    return              `eyesBlinkOne(false, ${times}, ${ms});\n`;
  };

})();