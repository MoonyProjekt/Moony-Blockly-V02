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
     spiele Signal ............. sound_signal
     warte ..................... time_wait
     LED an/aus ................ led_set
     Wenn ...................... moony_if_simple
     Taster gedrückt ........... sensor_button_pressed
     Abstand HC-SR04 ........... sensor_hcsr04_distance

   energie = Energiegewinn nach dem Schritt (gesamt 0..100).
   ============================================================ */

window.MOONY_MISSIONS = [

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

    abschluss: "📡 *BEEP!* ...Ich LEBE! Erster Kontakt steht, Operator. Du hast mich aufgeweckt. Das ist erst der Anfang – der Schwarm wartet schon."
  }

];
