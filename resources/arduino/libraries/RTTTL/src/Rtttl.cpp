#include "Rtttl.h"
#include <avr/pgmspace.h>

#define OCTAVE_OFFSET 0

// Frequenzen der Noten
int notes[] = {0,
  262,277,294,311,330,349,370,392,415,440,466,494,
  523,554,587,622,659,698,740,784,831,880,932,988,
  1047,1109,1175,1245,1319,1397,1480,1568,1661,1760,1865,1976,
  2093,2217,2349,2489,2637,2794,2960,3136,3322,3520,3729,3951,
  4186,4435,4699,4978
};

// Hilfsfunktion: liest Zeichen aus PROGMEM
static char pgm_read_char(const char *p) {
  return pgm_read_byte(p);
}

static void toneBlocking(uint8_t pin, int freq, int dur) {
  if (freq > 0) {
    tone(pin, freq, dur);
  }
  delay(dur * 1.3);
  noTone(pin);
}

// Hauptfunktion (RAM)
void playRtttlBlocking(uint8_t pin, char *p) {
  playRtttlBlockingPGM(pin, (const char*)p);
}

// Hauptfunktion (PROGMEM)
void playRtttlBlockingPGM(uint8_t pin, const char *p) {
  int default_dur = 4, default_oct = 6;
  int bpm = 63;
  long wholenote;
  long duration;
  int note;
  int scale;

  // BPM auslesen
  while (pgm_read_char(p) != ':') p++;
  p++;
  if (pgm_read_char(p) == 'd') {
    p += 2;
    int num = 0;
    while (isdigit(pgm_read_char(p))) {
      num = num * 10 + (pgm_read_char(p++) - '0');
    }
    if (num > 0) default_dur = num;
    p++;
  }

  if (pgm_read_char(p) == 'o') {
    p += 2;
    default_oct = pgm_read_char(p++) - '0';
    p++;
  }

  if (pgm_read_char(p) == 'b') {
    p += 2;
    int num = 0;
    while (isdigit(pgm_read_char(p))) {
      num = num * 10 + (pgm_read_char(p++) - '0');
    }
    bpm = num;
    p++;
  }

  wholenote = (60 * 1000L / bpm) * 4;

  while (pgm_read_char(p)) {
    int num = 0;
    while (isdigit(pgm_read_char(p))) {
      num = num * 10 + (pgm_read_char(p++) - '0');
    }
    if (num) duration = wholenote / num;
    else duration = wholenote / default_dur;

    note = 0;
    switch (pgm_read_char(p)) {
      case 'c': note = 1; break;
      case 'd': note = 3; break;
      case 'e': note = 5; break;
      case 'f': note = 6; break;
      case 'g': note = 8; break;
      case 'a': note = 10; break;
      case 'b': note = 12; break;
      case 'p': note = 0; break;
    }
    p++;

    if (pgm_read_char(p) == '#') {
      note++;
      p++;
    }

    if (pgm_read_char(p) == '.') {
      duration += duration / 2;
      p++;
    }

    if (isdigit(pgm_read_char(p))) {
      scale = pgm_read_char(p++) - '0';
    } else {
      scale = default_oct;
    }

    if (pgm_read_char(p) == ',') p++;

    if (note) {
      toneBlocking(pin, notes[(scale - 4) * 12 + note], duration);
    } else {
      delay(duration);
    }
  }
}
