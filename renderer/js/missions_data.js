/* ============================================================
   MOONY – MISSIONS-INHALTE
   ------------------------------------------------------------
   Das ist die Datei, die DU selbst pflegst.
   Du änderst nur Texte zwischen den Anführungszeichen und
   ergänzt neue Schritte nach dem gleichen Muster.

   ZWEI ARTEN VON SCHRITTEN:
     typ: "anweisung"     -> Moony sagt etwas. Wenn eine Prüfregel
                             gesetzt ist, bleibt der Knopf gesperrt,
                             bis der richtige Block erkannt wird.
                             Dann bestätigt der Schüler mit Klick.
     typ: "bestaetigung"  -> Moony fragt nach (Ja / Nein).

   PRÜFREGELN (optional, nur bei "anweisung"):
     pruefung: { typ: "block_vorhanden", block: "program_start_once" }
        -> erfüllt, wenn dieser Block irgendwo liegt.

     pruefung: { typ: "block_in", block: "sound_beep", in: "program_start_once" }
        -> erfüllt, wenn der erste Block IM zweiten Block steckt.

     pruefung: { typ: "hochgeladen" }
        -> erfüllt, sobald in diesem Schritt auf 🚀 Hochladen geklickt wurde.

     Ohne "pruefung" ist der Knopf immer freigegeben (manuell).

   BLOCK-NAMEN (die wichtigsten):
     Start (läuft einmal) ...... program_start_once
     Start (läuft unendlich) ... program_start_forever
     wiederhole fortlaufend .... program_loop_forever
     Buzzer .................... sound_beep
     Buzzer-Muster ............. sound_beep_pattern
     spiele Signal ............. sound_signal
     spiele (Melodie) .......... sound_music_play_blocking
     spiele eigene RTTTL ....... sound_music_custom_blocking
     warte ..................... time_wait
     LED an/aus ................ led_set
     Wenn ...................... moony_if_simple
     Taster gedrückt ........... sensor_button_pressed
     Abstand HC-SR04 ........... sensor_hcsr04_distance

   energie = Energiegewinn nach dem Schritt (gesamt 0..100).
   ============================================================ */

window.MOONY_MISSIONS = [

  /* ══════════════════════════════════════════════
     MISSION 1 – SOUND
  ══════════════════════════════════════════════ */

  {
    id: "1.1",
    titel: "Erstkontakt",
    intro: "Operator? ...bist du da? Ich bin Moony. Meine Energie ist fast leer – aber zusammen kriegen wir mich wieder zum Laufen. Bereit für den ersten Funkbefehl?",

    schritte: [

      {
        typ: "anweisung",
        moony: "Ich brauche einen Startbefehl, damit mein System aufwacht. Zieh den Block »Start (läuft einmal)« auf die Arbeitsfläche.",
        aufgabe: "Start-Block setzen",
        pruefung: { typ: "block_vorhanden", block: "program_start_once" },
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Strom! Ich spür's! Jetzt gib mir ein Lebenszeichen – setz einen »Buzzer«-Block in den Start-Block. Ich will piepen!",
        aufgabe: "Buzzer in den Start setzen (Pin 2)",
        pruefung: { typ: "block_in", block: "sound_beep", in: "program_start_once" },
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Bereit zum Senden, Operator. Schick mir den Befehl rüber – drück oben auf 🚀 Hochladen!",
        aufgabe: "Code hochladen",
        pruefung: { typ: "hochgeladen" },
        knopf: "Hochgeladen",
        energie: 10
      },

      {
        typ: "bestaetigung",
        moony: "Empfang bestätigen, Operator – hörst du mein Beep?",
        ja: "Ja!",
        nein: "Nein, nochmal",
        neinAntwort: "Kein Problem, wir kriegen das hin. Prüf das Kabel am Buzzer (Pin 2) und lade den Code nochmal hoch. Ich warte auf dein Signal.",
        energie: 20
      }

    ],

    abschluss: "BEEP! Ich LEBE! Erster Kontakt steht, Operator. Du hast mich aufgeweckt. Das ist erst der Anfang – der Schwarm wartet schon."
  },

  /* ─────────────────────────────────────────── */

  {
    id: "1.2",
    titel: "Dauersignal",
    intro: "Gut gemacht, Operator. Das Beep hat funktioniert – aber ein einziges Signal reicht nicht. Ich muss dauerhaft senden, damit der Schwarm mich findet. Zeig mir, wie Befehle endlos wiederholt werden.",

    schritte: [

      {
        typ: "anweisung",
        moony: "Ich kenne den Start-Block bereits. Jetzt brauche ich eine Schleife. Zieh »Start (läuft einmal)« auf die Fläche – und dann »wiederhole fortlaufend« hinein. Damit läuft mein Programm endlos weiter.",
        aufgabe: "Schleife in den Start-Block setzen",
        pruefung: { typ: "block_in", block: "program_loop_forever", in: "program_start_once" },
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Gut. Jetzt kommt der Signalgeber in die Schleife. Zieh einen »Buzzer«-Block hinein – und danach einen »warte 1 Sekunde«-Block. Ohne Pause wäre ich zu laut.",
        aufgabe: "Buzzer + Warte in die Schleife",
        pruefung: { typ: "block_in", block: "sound_beep", in: "program_loop_forever" },
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Bereit für Dauersendung. Hochladen, Operator!",
        aufgabe: "Code hochladen",
        pruefung: { typ: "hochgeladen" },
        knopf: "Hochgeladen",
        energie: 10
      },

      {
        typ: "bestaetigung",
        moony: "Bestätigung anfordern – piept es jetzt im Takt, immer wieder?",
        ja: "Ja, es piept!",
        nein: "Nein",
        neinAntwort: "Prüf ob der Buzzer-Block wirklich IN der Schleife steckt – und ob ein Warte-Block darunter ist. Dann nochmal hochladen.",
        energie: 20
      }

    ],

    abschluss: "Das Signal läuft – und läuft – und läuft. Irgendwo da draußen muss jemand mein Signal hören. Der Schwarm kann mich finden."
  },

  /* ─────────────────────────────────────────── */

  {
    id: "1.3",
    titel: "Musiksignal",
    intro: "Einfache Signale beherrsche ich jetzt. Aber in meinem System steckt noch mehr: ein Musikgenerator. Er kennt ein Format namens RTTTL – eine Textbeschreibung von Melodien. Lass uns das aktivieren.",

    schritte: [

      {
        typ: "anweisung",
        moony: "Starte mit einem leeren Programm. Zieh »Start (läuft einmal)« auf die Fläche und dann den Block »spiele« aus der Kategorie »Sound und Musik« hinein. Wähl im Dropdown eine fertige Melodie aus.",
        aufgabe: "Musikblock in den Start setzen",
        pruefung: { typ: "block_in", block: "sound_music_play_blocking", in: "program_start_once" },
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Sende mir die Melodie. Hochladen!",
        aufgabe: "Code hochladen",
        pruefung: { typ: "hochgeladen" },
        knopf: "Hochgeladen",
        energie: 10
      },

      {
        typ: "bestaetigung",
        moony: "Läuft die Melodie? Ich sollte Musik machen.",
        ja: "Ja, ich höre Musik!",
        nein: "Nein",
        neinAntwort: "Prüf ob der Spielen-Block wirklich im Start-Block steckt und eine Melodie im Dropdown ausgewählt ist. Dann nochmal hochladen.",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Gut. Jetzt die Königsdisziplin: Such im Internet nach »RTTTL melody« und kopiere eine komplette Zeile. Nimm den Block »spiele eigene RTTTL« und füge sie ein. Dann hochladen.",
        aufgabe: "Eigene RTTTL-Melodie eingeben und hochladen",
        pruefung: { typ: "hochgeladen" },
        knopf: "Hochgeladen",
        energie: 10
      },

      {
        typ: "bestaetigung",
        moony: "Hat deine eigene Melodie funktioniert?",
        ja: "Ja, sie läuft!",
        nein: "Nein",
        neinAntwort: "RTTTL-Texte sind empfindlich. Alles kopiert? Name + d= o= b= + Noten. Keine Leerzeilen am Ende. b= darf nur einmal vorkommen. Probier eine andere Melodie.",
        energie: 10
      }

    ],

    abschluss: "Musik – mitten auf dem Mond! Das RTTTL-Format ist Jahrzehnte alt, aber es funktioniert noch immer. Mein Audiosystem läuft. Mission 1 abgeschlossen. Das Lichtsystem wartet."
  }

];
