// js/blocks_communication.js
(function () {
  if (typeof Blockly === "undefined") return;

  const ICON = 32;

  const CE_OPTIONS = [
    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
    ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
  ];

  Blockly.defineBlocksWithJsonArray([
    {
      "type": "comm_radio_start",
      "message0": "%1 Funk starten CE Pin %2 CSN Pin %3 Kanal %4 Gruppe %5",
      "message1": "MOSI Pin 11   MISO Pin 12   SCK Pin 13",
      "args0": [
        { "type": "field_image", "src": "img/sensors/nrf24.png", "width": ICON, "height": ICON, "alt": "NRF24L01" },
        { "type": "field_dropdown", "name": "CE", "options": CE_OPTIONS },
        { "type": "field_dropdown", "name": "CSN", "options": [["10", "10"]] },
        { "type": "field_number", "name": "CH", "value": 40, "min": 0, "max": 125, "precision": 1 },
        { "type": "field_number", "name": "GROUP", "value": 1, "min": 1, "max": 30, "precision": 1 }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "inputsInline": true,
      "style": "communication_blocks",
      "tooltip": "Startet das NRF24L01 Funkmodul. Zwei Moonys können nur miteinander sprechen, wenn Kanal und Gruppe gleich sind. CSN muss an Pin 10 angeschlossen sein. SPI-Pins: MOSI=11, MISO=12, SCK=13.",
      "helpUrl": ""
    },

    {
      "type": "comm_radio_send_data",
      "message0": "%1 sende Funkdaten %2",
      "args0": [
        { "type": "field_image", "src": "img/sensors/nrf24.png", "width": ICON, "height": ICON, "alt": "NRF24L01" },
        { "type": "input_value", "name": "DATA" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "inputsInline": true,
      "style": "communication_blocks",
      "tooltip": "Sendet Daten per Funk.",
      "helpUrl": ""
    },

    {
      "type": "comm_radio_available",
      "message0": "%1 Funkdaten vorhanden",
      "args0": [
        { "type": "field_image", "src": "img/sensors/nrf24.png", "width": ICON, "height": ICON, "alt": "NRF24L01" }
      ],
      "output": "Boolean",
      "inputsInline": true,
      "style": "communication_blocks",
      "tooltip": "Gibt wahr zurück, wenn neue Funkdaten empfangen wurden.",
      "helpUrl": ""
    },

    {
      "type": "comm_radio_read_data",
      "message0": "%1 Funkdaten lesen",
      "args0": [
        { "type": "field_image", "src": "img/sensors/nrf24.png", "width": ICON, "height": ICON, "alt": "NRF24L01" }
      ],
      "output": "String",
      "inputsInline": true,
      "style": "communication_blocks",
      "tooltip": "Liest die zuletzt empfangenen Funkdaten.",
      "helpUrl": ""
    }
  ]);

  if (!Blockly.Arduino) return;

  function ensureRadioCore(cePin) {
    Blockly.Arduino.addInclude("SPI_h", "#include <SPI.h>");
    Blockly.Arduino.addInclude("RF24_h", "#include <RF24.h>");

    Blockly.Arduino.definitions_["comm_radio_core"] = `
RF24 moony_radio(${cePin}, 10); // CE frei, CSN fest auf D10
bool moony_radio_ok = false;
char moony_radio_last_text[32] = "";

static void moony_radio_make_address(int channel, int group, uint8_t addr[5]) {
  channel = constrain(channel, 0, 125);
  group = constrain(group, 1, 30);
  addr[0] = 'M';
  addr[1] = (uint8_t)channel;
  addr[2] = (uint8_t)group;
  addr[3] = (uint8_t)(channel ^ group);
  addr[4] = 0xA5;
}

static bool moonyRadioBegin(int channel, int group) {
  uint8_t addr[5];
  uint8_t ch = (uint8_t)constrain(channel, 0, 125);
  moony_radio_make_address(channel, group, addr);

  if (!moony_radio.begin()) {
    moony_radio_ok = false;
    return false;
  }

  moony_radio.setChannel(ch);
  moony_radio.setPALevel(RF24_PA_LOW);
  moony_radio.setDataRate(RF24_250KBPS);
  moony_radio.setRetries(3, 5);
  moony_radio.setAutoAck(true);
  moony_radio.enableDynamicPayloads();
  moony_radio.openWritingPipe(addr);
  moony_radio.openReadingPipe(1, addr);
  moony_radio.startListening();
  moony_radio_ok = true;
  return true;
}

static bool moonyRadioAvailable() {
  if (!moony_radio_ok) return false;
  if (!moony_radio.available()) return false;

  char text[32] = "";
  uint8_t len = moony_radio.getDynamicPayloadSize();
  if (len < 1 || len > 31) {
    moony_radio.flush_rx();
    return false;
  }

  moony_radio.read(&text, len);
  text[len] = '\\0';
  strncpy(moony_radio_last_text, text, sizeof(moony_radio_last_text) - 1);
  moony_radio_last_text[sizeof(moony_radio_last_text) - 1] = '\\0';
  return true;
}

static void moonyRadioSendAny(String value) {
  if (!moony_radio_ok) return;

  char out[32] = "";
  value.trim();
  value.toCharArray(out, sizeof(out));

  moony_radio.stopListening();
  moony_radio.write(&out, strlen(out));
  moony_radio.startListening();
}
`.trim();
  }

  Blockly.Arduino.forBlock["comm_radio_start"] = function(block) {
    const ce = parseInt(block.getFieldValue("CE"), 10) || 9;
    const ch = Math.max(0, Math.min(125, parseInt(block.getFieldValue("CH"), 10) || 40));
    const group = Math.max(1, Math.min(30, parseInt(block.getFieldValue("GROUP"), 10) || 1));

    ensureRadioCore(ce);
    Blockly.Arduino.addSetup("comm_radio_begin", `moonyRadioBegin(${ch}, ${group});`);
    return "";
  };

  Blockly.Arduino.forBlock["comm_radio_send_data"] = function(block) {
    const value = Blockly.Arduino.valueToCode(block, "DATA", Blockly.Arduino.ORDER_NONE) || '""';
    return `moonyRadioSendAny(String(${value}));\n`;
  };

  Blockly.Arduino.forBlock["comm_radio_available"] = function() {
    return ["moonyRadioAvailable()", Blockly.Arduino.ORDER_ATOMIC];
  };

  Blockly.Arduino.forBlock["comm_radio_read_data"] = function() {
    return ["String(moony_radio_last_text)", Blockly.Arduino.ORDER_ATOMIC];
  };

})();