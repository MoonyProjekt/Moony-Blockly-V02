// js/blocks_led.js
// Moony Blockly – LED + MAX7219 8x8 Matrix + WS2812B Ring
// ✔ Stabil
// ✔ Kein fieldRegistry / fromJson
// ✔ 8×8 Icon-Editor direkt klickbar im Block
// ✔ clear + pixel + icons + custom icon + text scroll
// ✔ Helligkeit + Rotation direkt im INIT-Block (kein extra Rotations-Block nötig)
// ✔ Matrix-Flackern -> Row-Buffer + setRow() (nur Änderungen senden)
// ✔ Matrix-Pins 8/9/10 ausgeblendet
// ✔ WS2812B Ring (8 LED) – init / pixel / fill / clear / show / rainbow
//
// WICHTIG:
// - addInclude() NUR für "#include ..."
// - Großer C/C++ Code (Helper, Globals, Const Arrays, Funktionen) -> definitions_

(function () {
  if (typeof Blockly === "undefined") return;

  // ✅ UI-Farbe für den 8x8 Editor (kein Block-Style!)
  const UI_MATRIX_ON =
    (Blockly?.Themes?.MoonyDark?.blockStyles?.matrix_blocks?.colourPrimary) || "#2EC4B6";

  // ------------------------------------------------------------
  // PIN LISTEN
  // ------------------------------------------------------------
  const PIN_OPTIONS_LED = [
    ["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],
    ["8","8"],["9","9"],["10","10"],["11","11"],["12","12"],["13","13"],
    ["A0","A0"],["A1","A1"],["A2","A2"],["A3","A3"],["A4","A4"],["A5","A5"]
  ];

  // Für MAX7219 Matrix: problematische Pins 8/9/10 ausblenden
  const PIN_OPTIONS_MATRIX = [
    ["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],
    ["11","11"],["12","12"],["13","13"],
    ["A0","A0"],["A1","A1"],["A2","A2"],["A3","A3"],["A4","A4"],["A5","A5"]
  ];

  // ✅ Helligkeit 0..7 (Default 1 sehr dunkel)
  const INTENSITY_OPTIONS = [
    ["0 (aus)","0"],
    ["1 (sehr dunkel)","1"],
    ["2 (dunkel)","2"],
    ["3 (mittel)","3"],
    ["4 (hell)","4"],
    ["5","5"],
    ["6","6"],
    ["7 (max)","7"]
  ];

  // ✅ Rotation im INIT
  const ROT_OPTIONS = [
    ["0°","0"],["90°","90"],["180°","180"],["270°","270"]
  ];

  // ✅ WS2812: 0..255 (Adafruit_NeoPixel)
  const NEO_BRIGHTNESS = [
    ["0 (aus)", "0"],
    ["20 (sehr dunkel)", "20"],
    ["40 (dunkel)", "40"],
    ["80 (mittel)", "80"],
    ["120 (hell)", "120"],
    ["180 (sehr hell)", "180"],
    ["255 (max)", "255"]
  ];

  // Einfache Farbpalette (für Schüler)
  const COLOR_PRESETS = [
    ["rot",   "255,0,0"],
    ["grün",  "0,255,0"],
    ["blau",  "0,0,255"],
    ["gelb",  "255,255,0"],
    ["cyan",  "0,255,255"],
    ["magenta","255,0,255"],
    ["weiß",  "255,255,255"],
    ["orange","255,120,0"],
    ["aus",   "0,0,0"]
  ];

  // ==========================================================
  // 🧩 8×8 ICON EDITOR (Popup)
  // ==========================================================
  const DEFAULT_BMP =
    "00000000|00000000|00000000|00011000|00011000|00000000|00000000|00000000";

  function normalizeBmp(v) {
    const rows = String(v || DEFAULT_BMP).split("|");
    const out = [];
    for (let y = 0; y < 8; y++) out.push((rows[y] || "00000000").padEnd(8, "0").slice(0, 8));
    return out.join("|");
  }

  function open8x8Editor(initialValue, onDone) {
    const bmp = normalizeBmp(initialValue);
    const rows = bmp.split("|");
    const grid = [];
    for (let y = 0; y < 8; y++) {
      grid[y] = [];
      for (let x = 0; x < 8; x++) grid[y][x] = rows[y][x] === "1";
    }

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.7)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999";

    const panel = document.createElement("div");
    panel.style.background = "#111";
    panel.style.border = "1px solid #444";
    panel.style.borderRadius = "12px";
    panel.style.padding = "14px";
    panel.style.color = "#fff";
    panel.style.fontFamily = "system-ui, sans-serif";

    const title = document.createElement("div");
    title.textContent = "8×8 Icon – LEDs anklicken";
    title.style.marginBottom = "10px";
    panel.appendChild(title);

    const gridWrap = document.createElement("div");
    gridWrap.style.display = "grid";
    gridWrap.style.gridTemplateColumns = "repeat(8, 1fr)";
    gridWrap.style.gap = "6px";
    gridWrap.style.background = "#0b0b0b";
    gridWrap.style.padding = "10px";
    gridWrap.style.borderRadius = "10px";
    panel.appendChild(gridWrap);

    const cells = [];
    function render() {
      for (let i = 0; i < 64; i++) {
        const y = Math.floor(i / 8);
        const x = i % 8;
        cells[i].style.background = grid[y][x] ? UI_MATRIX_ON : "#222";
      }
    }

    for (let i = 0; i < 64; i++) {
      const y = Math.floor(i / 8);
      const x = i % 8;

      const cell = document.createElement("button");
      cell.type = "button";
      cell.style.width = "26px";
      cell.style.height = "26px";
      cell.style.borderRadius = "6px";
      cell.style.border = "1px solid #444";
      cell.style.cursor = "pointer";
      cell.style.background = "#222";
      cell.style.padding = "0";

      cell.onclick = () => {
        grid[y][x] = !grid[y][x];
        render();
      };

      gridWrap.appendChild(cell);
      cells.push(cell);
    }
    render();

    function mkBtn(txt) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.style.padding = "6px 10px";
      b.style.borderRadius = "8px";
      b.style.border = "1px solid #444";
      b.style.background = "#1a1a1a";
      b.style.color = "#fff";
      b.style.cursor = "pointer";
      return b;
    }

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.justifyContent = "space-between";
    btnRow.style.marginTop = "12px";

    const btnClear = mkBtn("Leeren");
    btnClear.onclick = () => {
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) grid[yy][xx] = false;
      render();
    };

    const btnOk = mkBtn("OK");
    btnOk.onclick = () => {
      const out = grid.map(r => r.map(v => (v ? "1" : "0")).join("")).join("|");
      document.body.removeChild(overlay);
      onDone(out);
    };

    btnRow.appendChild(btnClear);
    btnRow.appendChild(btnOk);

    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  // ==========================================================
  // 🧱 BLOCKS (JSON) – Theme via "style"
  // ==========================================================
  Blockly.defineBlocksWithJsonArray([
    // 💡 Normale LED
    {
      "type": "led_set",
      "message0": "💡 LED an Pin %1 %2",
      "args0": [
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS_LED },
        { "type": "field_dropdown", "name": "STATE", "options": [["ein","HIGH"],["aus","LOW"]] }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "led_primary",
      "inputsInline": true
    },

    // 🟩 MAX7219 Matrix
    {
      "type": "matrix8x8_init_max7219",
      "message0": "🟩 8×8 Matrix starten DIN %1 CLK %2 CS %3 Helligkeit %4 Drehung %5",
      "args0": [
        { "type": "field_dropdown", "name": "DIN", "options": PIN_OPTIONS_MATRIX },
        { "type": "field_dropdown", "name": "CLK", "options": PIN_OPTIONS_MATRIX },
        { "type": "field_dropdown", "name": "CS",  "options": PIN_OPTIONS_MATRIX },
        { "type": "field_dropdown", "name": "INT", "options": INTENSITY_OPTIONS },
        { "type": "field_dropdown", "name": "ROT", "options": ROT_OPTIONS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "matrix_blocks",
      "inputsInline": true
    },

    {
      "type": "matrix8x8_clear",
      "message0": "🧽 Matrix löschen",
      "previousStatement": null,
      "nextStatement": null,
      "style": "matrix_blocks",
      "inputsInline": true
    },

    {
      "type": "matrix8x8_icon",
      "message0": "😀 Icon %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "ICON",
          "options": [["Smiley","SMILE"],["Herz","HEART"],["Pfeil","ARROW"],["Haken","CHECK"],["X","CROSS"]]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "matrix_blocks",
      "inputsInline": true
    },

    {
      "type": "matrix8x8_scroll_text",
      "message0": "📰 Text %1 Tempo (ms) %2 Modus %3",
      "args0": [
        { "type": "field_input", "name": "TXT", "text": "MOONY" },
        { "type": "field_number", "name": "SPEED", "value": 60, "min": 10, "max": 500, "precision": 1 },
        { "type": "field_dropdown", "name": "MODE", "options": [["einmal","ONCE"],["endlos","FOREVER"]] }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "matrix_blocks",
      "inputsInline": true
    },

    // 💍 WS2812B Ring (8 LED)
    {
      "type": "ws2812_ring_init",
      "message0": "💍 WS2812 Ring starten Pin %1 Helligkeit %2",
      "args0": [
        { "type": "field_dropdown", "name": "PIN", "options": PIN_OPTIONS_LED },
        { "type": "field_dropdown", "name": "BRI", "options": NEO_BRIGHTNESS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    },

    {
      "type": "ws2812_ring_set_pixel",
      "message0": "💍 Ring LED %1 Farbe %2",
      "args0": [
        { "type": "field_number", "name": "I", "value": 0, "min": 0, "max": 7, "precision": 1 },
        { "type": "field_dropdown", "name": "RGB", "options": COLOR_PRESETS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    },

    {
      "type": "ws2812_ring_fill",
      "message0": "💍 Ring füllen Farbe %1",
      "args0": [
        { "type": "field_dropdown", "name": "RGB", "options": COLOR_PRESETS }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    },

    {
      "type": "ws2812_ring_clear",
      "message0": "💍 Ring löschen",
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    },

    {
      "type": "ws2812_ring_show",
      "message0": "💍 Ring anzeigen",
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    },

    {
      "type": "ws2812_ring_rainbow",
      "message0": "🌈 Ring Regenbogen Runde %1 Tempo %2 ms",
      "args0": [
        { "type": "field_number", "name": "LOOPS", "value": 1, "min": 1, "max": 20, "precision": 1 },
        { "type": "field_number", "name": "MS", "value": 40, "min": 5, "max": 300, "precision": 1 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "ring_blocks",
      "inputsInline": true
    }
  ]);

  // ==========================================================
  // 🟦 Matrix Pixel mit eingebauten Standardwerten (Shadows)
  // ==========================================================
  Blockly.Blocks["matrix8x8_set_pixel"] = {
    init: function () {
      if (typeof this.setStyle === "function") this.setStyle("matrix_blocks");
      else this.setColour(UI_MATRIX_ON);

      const xInput = this.appendValueInput("X")
        .appendField("🟦 Pixel x");

      const yInput = this.appendValueInput("Y")
        .appendField("y");

      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["an", "true"],
          ["aus", "false"]
        ]), "STATE");

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);

      const textToDom = (Blockly?.utils?.xml?.textToDom) || (Blockly?.Xml?.textToDom);
      if (textToDom) {
        const xShadow = textToDom(`
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        `);
        xInput.setShadowDom(xShadow);

        const yShadow = textToDom(`
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        `);
        yInput.setShadowDom(yShadow);
      }
    }
  };

  // ==========================================================
  // 🧩 Custom icon block (Popup)
  // ==========================================================
  Blockly.Blocks["matrix8x8_draw_custom"] = {
    init: function () {
      // ✅ Theme-style statt setColour
      if (typeof this.setStyle === "function") this.setStyle("matrix_blocks");
      else this.setColour(UI_MATRIX_ON);

      const bmpField = new Blockly.FieldTextInput(DEFAULT_BMP);

      // Anzeige im Block nur Label (nicht den ganzen BMP)
      bmpField.getText = function () { return "🟦 8×8"; };

      // Wichtig: NICHT arrow auf "this", sondern SourceBlock holen
      bmpField.showEditor_ = function () {
        const blk = this.getSourceBlock();
        const cur = blk.getFieldValue("BMP") || DEFAULT_BMP;
        open8x8Editor(cur, (v) => blk.setFieldValue(v, "BMP"));
      };

      this.appendDummyInput()
        .appendField("🧩 Eigenes Icon")
        .appendField(bmpField, "BMP");

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
    }
  };

  // ==========================================================
  // ⚙️ ARDUINO GENERATOR
  // ==========================================================
  if (!Blockly.Arduino) return;

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function escapeCString(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "")
      .replace(/\n/g, "");
  }

  function ensureDefinitionOnce(key, code) {
    if (!Blockly.Arduino.definitions_[key]) Blockly.Arduino.definitions_[key] = code;
  }

  // ---------- LED ----------
  Blockly.Arduino.forBlock["led_set"] = (b) => {
    const p = b.getFieldValue("PIN");
    const s = b.getFieldValue("STATE");
    Blockly.Arduino.addSetup("led_" + p, `pinMode(${p}, OUTPUT);`);
    return `digitalWrite(${p}, ${s});\n`;
  };

  // ==========================================================
  // ✅ MAX7219 MATRIX CORE
  // ==========================================================
  function ensureMatrixCore() {
    Blockly.Arduino.addInclude("moony_ledcontrol_inc", "#include <LedControl.h>");

    ensureDefinitionOnce("moony_matrix_core", `
LedControl* matrix=nullptr;
bool matrixReady=false;

int mx_din=12,mx_clk=11,mx_cs=10;
int mx_intensity=1;
int icon_rot=0;

// Framebuffer
static byte mx_buf[8]  = {0,0,0,0,0,0,0,0};
// Cache (zuletzt gesendet)
static byte mx_sent[8] = {255,255,255,255,255,255,255,255};

void ensureMatrixInit(){
  if(!matrixReady){
    matrix=new LedControl(mx_din,mx_clk,mx_cs,1);
    matrix->shutdown(0,false);
    matrix->setIntensity(0, mx_intensity);
    matrix->clearDisplay(0);
    for(int i=0;i<8;i++) mx_sent[i]=255; // invalidieren
    matrixReady=true;
  }
}

static inline void mx_sendRowIfChanged(int row){
  if(row<0 || row>7) return;
  if(mx_sent[row] != mx_buf[row]){
    matrix->setRow(0, row, mx_buf[row]);
    mx_sent[row] = mx_buf[row];
  }
}

static inline void mx_flushAll(){
  for(int r=0;r<8;r++) mx_sendRowIfChanged(r);
}

static inline void mx_clearBuf(){
  for(int r=0;r<8;r++) mx_buf[r]=0;
  mx_flushAll();
}

// Rotation: rowsIn -> rowsOut (0/90/180/270)
static void mx_rotateRows(const byte inRows[8], byte outRows[8], int rot){
  for(int r=0;r<8;r++) outRows[r]=0;

  for(int y=0;y<8;y++){
    for(int x=0;x<8;x++){
      bool on = (inRows[y] & (1 << (7-x))) != 0;

      int xr=x, yr=y;
      switch(rot){
        case 90:  xr=7-y; yr=x;   break;
        case 180: xr=7-x; yr=7-y; break;
        case 270: xr=y;   yr=7-x; break;
      }
      if(on) outRows[yr] |= (1 << (7-xr));
    }
  }
}

void matrixClear(){
  ensureMatrixInit();
  mx_clearBuf();
}

void setPixel(int x,int y,bool on){
  ensureMatrixInit();
  if(x<0||x>7||y<0||y>7) return;

  byte mask = (1 << (7 - x));
  if(on) mx_buf[y] |= mask;
  else   mx_buf[y] &= ~mask;

  mx_sendRowIfChanged(y);
}

// ---------- Built-in Icons ----------
const char ICON_SMILE[8][9]={
 "00111100","01000010","10100101","10000001",
 "10100101","10011001","01000010","00111100"
};
const char ICON_HEART[8][9]={
 "01100110","11111111","11111111","11111111",
 "01111110","00111100","00011000","00000000"
};
const char ICON_ARROW[8][9]={
 "00011000","00001100","00000110","11111111",
 "11111111","00000110","00001100","00011000"
};
const char ICON_CHECK[8][9]={
 "00000001","00000011","00000110","10001100",
 "11011000","01110000","00100000","00000000"
};
const char ICON_CROSS[8][9]={
 "10000001","01000010","00100100","00011000",
 "00011000","00100100","01000010","10000001"
};

void drawIcon(const char icon[8][9]){
  ensureMatrixInit();

  byte rows[8];
  for(int y=0;y<8;y++){
    byte v=0;
    for(int x=0;x<8;x++){
      if(icon[y][x]=='1') v |= (1 << (7-x));
    }
    rows[y]=v;
  }

  byte out[8];
  if(icon_rot==0){
    for(int r=0;r<8;r++) out[r]=rows[r];
  }else{
    mx_rotateRows(rows,out,icon_rot);
  }

  for(int r=0;r<8;r++) mx_buf[r]=out[r];
  mx_flushAll();
}

// ==========================================================
// 📰 FONT + SCROLL (5x7)
// ==========================================================
byte getFontCol(char ch, byte col){
  if(ch>='a' && ch<='z') ch = ch - 'a' + 'A';
  if(ch==' ') return 0x00;

  if(ch>='0' && ch<='9'){
    static const byte D[10][5]={
      {0x3E,0x51,0x49,0x45,0x3E},{0x00,0x42,0x7F,0x40,0x00},{0x42,0x61,0x51,0x49,0x46},
      {0x21,0x41,0x45,0x4B,0x31},{0x18,0x14,0x12,0x7F,0x10},{0x27,0x45,0x45,0x45,0x39},
      {0x3C,0x4A,0x49,0x49,0x30},{0x01,0x71,0x09,0x05,0x03},{0x36,0x49,0x49,0x49,0x36},
      {0x06,0x49,0x49,0x29,0x1E}
    };
    return D[ch-'0'][col];
  }

  if(ch>='A' && ch<='Z'){
    static const byte A[26][5]={
      {0x7E,0x11,0x11,0x11,0x7E},{0x7F,0x49,0x49,0x49,0x36},{0x3E,0x41,0x41,0x41,0x22},
      {0x7F,0x41,0x41,0x22,0x1C},{0x7F,0x49,0x49,0x49,0x41},{0x7F,0x09,0x09,0x09,0x01},
      {0x3E,0x41,0x49,0x49,0x7A},{0x7F,0x08,0x08,0x08,0x7F},{0x00,0x41,0x7F,0x41,0x00},
      {0x20,0x40,0x41,0x3F,0x01},{0x7F,0x08,0x14,0x22,0x41},{0x7F,0x40,0x40,0x40,0x40},
      {0x7F,0x02,0x0C,0x02,0x7F},{0x7F,0x04,0x08,0x10,0x7F},{0x3E,0x41,0x41,0x41,0x3E},
      {0x7F,0x09,0x09,0x09,0x06},{0x3E,0x41,0x51,0x21,0x5E},{0x7F,0x09,0x19,0x29,0x46},
      {0x46,0x49,0x49,0x49,0x31},{0x01,0x01,0x7F,0x01,0x01},{0x3F,0x40,0x40,0x40,0x3F},
      {0x1F,0x20,0x40,0x20,0x1F},{0x3F,0x40,0x38,0x40,0x3F},{0x63,0x14,0x08,0x14,0x63},
      {0x07,0x08,0x70,0x08,0x07},{0x61,0x51,0x49,0x45,0x43}
    };
    return A[ch-'A'][col];
  }

  if(ch=='!'){ static const byte P[5]={0x00,0x00,0x5F,0x00,0x00}; return P[col]; }
  if(ch=='?'){ static const byte P[5]={0x02,0x01,0x51,0x09,0x06}; return P[col]; }
  if(ch=='.'){ static const byte P[5]={0x00,0x60,0x60,0x00,0x00}; return P[col]; }
  if(ch==':'){ static const byte P[5]={0x00,0x36,0x36,0x00,0x00}; return P[col]; }

  return 0x00;
}

static void mx_renderBoolBuf(bool buf[8][8]){
  for(int y=0;y<8;y++){
    byte v=0;
    for(int x=0;x<8;x++){
      if(buf[y][x]) v |= (1 << (7-x));
    }
    mx_buf[y]=v;
  }
  mx_flushAll();
}

void scrollTextOnce(const char* text, int speedMs){
  ensureMatrixInit();
  if(speedMs < 10) speedMs = 10;

  int len=0; while(text && text[len]!=0) len++;
  int totalCols = len * 6;

  for(int shift = 8; shift > -totalCols; shift--){
    bool buf[8][8] = {0};

    for(int i=0;i<len;i++){
      int xOffset = shift + i*6;
      for(int col=0; col<5; col++){
        int x = xOffset + col;
        if(x < 0 || x > 7) continue;

        byte bits = getFontCol(text[i], col);
        for(int y=0; y<7; y++){
          bool on = (bits >> y) & 0x01;
          if(on && y>=0 && y<=7) buf[y][x] = true;
        }
      }
    }

    mx_renderBoolBuf(buf);
    delay(speedMs);
  }
}

const char* nb_text = nullptr;
int nb_speed = 60;
unsigned long nb_nextMs = 0;
bool nb_active = false;

int nb_len = 0;
int nb_totalCols = 0;
int nb_shift = 8;

void nb_scrollStart(const char* text, int speedMs){
  ensureMatrixInit();
  nb_text = text;
  nb_speed = speedMs;
  if(nb_speed < 10) nb_speed = 10;

  nb_len = 0;
  if(nb_text){ while(nb_text[nb_len]!=0) nb_len++; }
  nb_totalCols = nb_len * 6;
  nb_shift = 8;
  nb_nextMs = millis();
  nb_active = true;
}

void nb_scrollTick(){
  if(!nb_active || !nb_text) return;
  unsigned long now = millis();
  if(now < nb_nextMs) return;
  nb_nextMs = now + (unsigned long)nb_speed;

  bool buf[8][8] = {0};

  for(int i=0;i<nb_len;i++){
    int xOffset = nb_shift + i*6;
    for(int col=0; col<5; col++){
      int x = xOffset + col;
      if(x < 0 || x > 7) continue;

      byte bits = getFontCol(nb_text[i], col);
      for(int y=0; y<7; y++){
        bool on = (bits >> y) & 0x01;
        if(on && y>=0 && y<=7) buf[y][x] = true;
      }
    }
  }

  mx_renderBoolBuf(buf);

  nb_shift--;
  if(nb_shift <= -nb_totalCols){
    nb_shift = 8;
  }
}
`.trim());
  }

  Blockly.Arduino.forBlock["matrix8x8_init_max7219"] = (b) => {
    ensureMatrixCore();
    const d = b.getFieldValue("DIN");
    const c = b.getFieldValue("CLK");
    const s = b.getFieldValue("CS");
    const inten = b.getFieldValue("INT") || "1";
    const rot = b.getFieldValue("ROT") || "0";

    Blockly.Arduino.addSetup("matrix_init", `
mx_din=${d}; mx_clk=${c}; mx_cs=${s};
mx_intensity=${inten};
icon_rot=${rot};
matrixReady=false;
ensureMatrixInit();
matrixClear();
`.trim());
    return "";
  };

  Blockly.Arduino.forBlock["matrix8x8_clear"] = () => {
    ensureMatrixCore();
    return `matrixClear();\n`;
  };

  Blockly.Arduino.forBlock["matrix8x8_set_pixel"] = (b) => {
    ensureMatrixCore();
    const x = Blockly.Arduino.valueToCode(b, "X", Blockly.Arduino.ORDER_ATOMIC) || "0";
    const y = Blockly.Arduino.valueToCode(b, "Y", Blockly.Arduino.ORDER_ATOMIC) || "0";
    const st = b.getFieldValue("STATE") || "true";
    return `setPixel(${x},${y},${st});\n`;
  };

  Blockly.Arduino.forBlock["matrix8x8_icon"] = (b) => {
    ensureMatrixCore();
    return `drawIcon(ICON_${b.getFieldValue("ICON")});\n`;
  };

  Blockly.Arduino.forBlock["matrix8x8_draw_custom"] = (b) => {
    ensureMatrixCore();

    const bmp = normalizeBmp(b.getFieldValue("BMP") || DEFAULT_BMP);
    const rows = bmp.split("|");

    const name = "ICON_CUSTOM_" + hashStr(bmp);
    const key = "decl_" + name;
    const cArr = rows.map(r => `"${r}"`).join(",");

    Blockly.Arduino.definitions_[key] = `const char ${name}[8][9] = {${cArr}};`;
    return `drawIcon(${name});\n`;
  };

  Blockly.Arduino.forBlock["matrix8x8_scroll_text"] = (b) => {
    ensureMatrixCore();

    const txtRaw = b.getFieldValue("TXT") || "MOONY";
    const txt = escapeCString(txtRaw);
    const speed = Number(b.getFieldValue("SPEED") || 60);
    const mode = b.getFieldValue("MODE") || "ONCE";

    if (mode === "FOREVER") {
      const k = "matrix_scroll_start_" + hashStr(txt + "|" + speed);
      Blockly.Arduino.addSetup(k, `nb_scrollStart("${txt}", ${speed});`);
      Blockly.Arduino.addLoop("matrix_scroll_tick", `nb_scrollTick();`);
      return "";
    }

    return `scrollTextOnce("${txt}", ${speed});\n`;
  };

  // ==========================================================
  // 💍 WS2812B RING CORE (8 LEDs)
  // ==========================================================
  function ensureWs2812RingCore() {
    Blockly.Arduino.addInclude("moony_neopixel_inc", "#include <Adafruit_NeoPixel.h>");

    ensureDefinitionOnce("moony_ws2812_ring_core", `
static Adafruit_NeoPixel* moonyRing = nullptr;
static bool moonyRingReady = false;
static int  moonyRingPin = 6;
static int  moonyRingCount = 8;
static int  moonyRingBrightness = 40;
static bool moonyRingDirty = false;

static void moonyRingEnsure() {
  if (!moonyRingReady) {
    moonyRing = new Adafruit_NeoPixel(moonyRingCount, moonyRingPin, NEO_GRB + NEO_KHZ800);
    moonyRing->begin();
    moonyRing->setBrightness((uint8_t)moonyRingBrightness);
    moonyRing->clear();
    moonyRing->show();
    moonyRingDirty = false;
    moonyRingReady = true;
  }
}

static inline uint32_t moonyRingColor(int r,int g,int b){
  if(r<0) r=0; if(r>255) r=255;
  if(g<0) g=0; if(g>255) g=255;
  if(b<0) b=0; if(b>255) b=255;
  moonyRingEnsure();
  return moonyRing->Color((uint8_t)r,(uint8_t)g,(uint8_t)b);
}

static void moonyRingSetPixel(int idx, int r,int g,int b){
  moonyRingEnsure();
  if(idx<0) idx=0;
  if(idx>=moonyRingCount) idx=moonyRingCount-1;
  moonyRing->setPixelColor(idx, moonyRingColor(r,g,b));
  moonyRingDirty = true;
}

static void moonyRingFill(int r,int g,int b){
  moonyRingEnsure();
  uint32_t c = moonyRingColor(r,g,b);
  for(int i=0;i<moonyRingCount;i++) moonyRing->setPixelColor(i, c);
  moonyRingDirty = true;
}

static void moonyRingClear(){
  moonyRingEnsure();
  moonyRing->clear();
  moonyRingDirty = true;
}

static void moonyRingShow(){
  moonyRingEnsure();
  if(moonyRingDirty){
    moonyRing->show();
    moonyRingDirty = false;
  }
}

static uint32_t moonyWheel(byte WheelPos) {
  moonyRingEnsure();
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85)  return moonyRing->Color(255 - WheelPos * 3, 0, WheelPos * 3);
  if (WheelPos < 170) { WheelPos -= 85; return moonyRing->Color(0, WheelPos * 3, 255 - WheelPos * 3); }
  WheelPos -= 170;    return moonyRing->Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

static void moonyRingRainbowBlocking(int loops, int waitMs){
  moonyRingEnsure();
  if(loops < 1) loops = 1;
  if(waitMs < 5) waitMs = 5;

  for(int l=0; l<loops; l++){
    for(int j=0; j<256; j++){
      for(int i=0; i<moonyRingCount; i++){
        moonyRing->setPixelColor(i, moonyWheel((i * 256 / moonyRingCount + j) & 255));
      }
      moonyRing->show();
      delay(waitMs);
    }
  }
  moonyRingDirty = false;
}
`.trim());
  }

  function parseRGB(csv) {
    const parts = String(csv || "0,0,0").split(",");
    return {
      r: (parts[0] || "0").trim(),
      g: (parts[1] || "0").trim(),
      b: (parts[2] || "0").trim(),
    };
  }

  Blockly.Arduino.forBlock["ws2812_ring_init"] = (b) => {
    ensureWs2812RingCore();
    const pin = b.getFieldValue("PIN");
    const bri = b.getFieldValue("BRI") || "40";

    Blockly.Arduino.addSetup("ws2812_ring_init_" + pin, `
moonyRingPin=${pin};
moonyRingBrightness=${bri};
moonyRingReady=false;
moonyRingEnsure();
`.trim());
    return "";
  };

  Blockly.Arduino.forBlock["ws2812_ring_set_pixel"] = (b) => {
    ensureWs2812RingCore();
    const i = Number(b.getFieldValue("I") || 0);
    const rgb = parseRGB(b.getFieldValue("RGB"));
    return `moonyRingSetPixel(${i}, ${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
  };

  Blockly.Arduino.forBlock["ws2812_ring_fill"] = (b) => {
    ensureWs2812RingCore();
    const rgb = parseRGB(b.getFieldValue("RGB"));
    return `moonyRingFill(${rgb.r}, ${rgb.g}, ${rgb.b});\n`;
  };

  Blockly.Arduino.forBlock["ws2812_ring_clear"] = () => {
    ensureWs2812RingCore();
    return `moonyRingClear();\nmoonyRingShow();\n`;
  };

  Blockly.Arduino.forBlock["ws2812_ring_show"] = () => {
    ensureWs2812RingCore();
    return `moonyRingShow();\n`;
  };

  Blockly.Arduino.forBlock["ws2812_ring_rainbow"] = (b) => {
    ensureWs2812RingCore();
    const loops = Number(b.getFieldValue("LOOPS") || 1);
    const ms = Number(b.getFieldValue("MS") || 40);
    return `moonyRingRainbowBlocking(${loops}, ${ms});\n`;
  };

})();