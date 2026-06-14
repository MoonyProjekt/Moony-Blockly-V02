/* ============================================================
   MOONY – MISSIONS-INHALTE
   ------------------------------------------------------------
   Das ist die Datei, die DU selbst pflegst.
   Du musst hier keinen "echten" Code schreiben – nur Texte
   zwischen den Anführungszeichen ändern und neue Schritte
   nach dem gleichen Muster ergänzen.

   AUFBAU EINER MISSION:
     id        = Nummer der Mission (z. B. "1.1")
     titel     = kurzer Name
     intro     = Moonys erster Funkspruch (wird zuerst gezeigt)
     schritte  = Liste der Aufgaben, der Reihe nach

   ZWEI ARTEN VON SCHRITTEN:
     typ: "anweisung"      -> Moony sagt etwas, Schüler macht es,
                              klickt dann auf den Weiter-Knopf.
     typ: "bestaetigung"   -> Moony fragt nach, Schüler antwortet
                              mit "Ja" oder "Nein".

   energie = wie viel Energie Moony nach dem Schritt dazugewinnt
             (0 bis 100 insgesamt).
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
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Strom! Ich spür's! Jetzt gib mir ein Lebenszeichen – setz einen »Buzzer«-Block in den Start-Block. Ich will piepen!",
        aufgabe: "Buzzer in den Start setzen (Pin 2)",
        knopf: "Erledigt",
        energie: 10
      },

      {
        typ: "anweisung",
        moony: "Bereit zum Senden, Operator. Schick mir den Befehl rüber – drück oben auf 🚀 Hochladen!",
        aufgabe: "Code hochladen",
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
