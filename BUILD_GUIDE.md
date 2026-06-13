# 🌙 MOONY BLOCKLY INSTALLER BUILD GUIDE

**Version:** 1.0.0  
**Zielplattform:** Windows 64-bit  
**Installation ohne Admin-Rechte:** ✅ JA

---

## 📋 ÜBERSICHT

Diese Anleitung zeigt dir, wie du **Moony Blockly als Windows-Installer packst**, der sich **ohne Admin-Rechte** installiert und **Arduino-Treiber automatisch mitinstalliert**.

### Was wird gebaut?
- `Moony-Blockly-1.0.0-Setup.exe` — Ein Windows-Installer für Schulen & Einzelbenutzer
- Installation zu `C:\Users\{Benutzername}\AppData\Local\MoonyBlockly\` (keine Admin nötig!)
- Automatische Arduino-Treiber-Installation (CH340, FTDI, Atmel)
- Startmenü & Desktop-Shortcuts

---

## 🔧 VORAUSSETZUNGEN

### Schritt 0: System-Anforderungen

- **Windows 10/11 64-bit** (zum Bauen und zum Installieren)
- **Node.js 18+** (mit npm) — [Download](https://nodejs.org)
  ```bash
  # Check wenn installiert:
  node --version
  npm --version
  ```
- **NSIS 3.x** (für Installer) — [Download](https://nsis.sourceforge.io)
  - Nach Installation: NSIS sollte in `C:\Program Files (x86)\NSIS\` sein
  - Oder: `C:\Program Files\NSIS\` (je nach System)

### Schritt 1: Abhängigkeiten installieren

Öffne **Command Prompt** oder **PowerShell** im Projektordner:

```bash
npm install
```

Das installiert:
- ✅ `electron` (Desktop-App Framework)
- ✅ `electron-builder` (Installer-Builder)

**Dauer:** ~2-5 Minuten (je nach Internet)

---

## 📦 ARDUINO TREIBER VORBEREITEN

Die Treiber sind **optional**, aber empfohlen für volle Hardware-Kompatibilität.

### 1. CH340 Treiber (für Arduino Nano Clones) 🔧

**Der wichtigste Treiber! Viele Schulen nutzen diese.**

1. Download: https://wch-ic.com/downloads/ch341ser_exe.html
2. Dateiname: `CH340SER.exe`
3. Speichern unter: `resources/drivers/ch340/CH340SER.exe`
4. Ordner erstellen falls nötig:
   ```
   Moony Blockly V01/
   ├── resources/
   │   └── drivers/
   │       └── ch340/
   │           └── CH340SER.exe  ← hier ablegen
   ```

### 2. FTDI Treiber (für ältere Arduino Boards) 🔧

**Optional — nur wenn ihr FT232RL/FT232BM Boards habt**

1. Download: https://ftdichip.com/drivers/d2xx/
2. Suche: "CDM21228_Setup.exe" (oder ähnliche Versionsnummer)
3. Speichern unter: `resources/drivers/ftdi/CDM21228_Setup.exe`
4. Ordnerstruktur:
   ```
   Moony Blockly V01/
   ├── resources/
   │   └── drivers/
   │       └── ftdi/
   │           └── CDM21228_Setup.exe  ← hier ablegen
   ```

### 3. Atmel Treiber (für Arduino SAM) 🔧

**Optional — nur wenn ihr Arduino Due/Zero habt**

- Wird meist automatisch über Arduino IDE installiert
- Detaillierte Info: siehe Ressourcen unten

---

## 🚀 INSTALLER BAUEN

### Methode A: Einfach (empfohlen) ✅

1. Doppelklick auf: **`build-installer.bat`**
2. Warte bis es fertig ist (~2-5 Minuten)
3. Fertig! Installer liegt in: `dist/Moony-Blockly-1.0.0-Setup.exe`

### Methode B: Manuell (für Experten)

```bash
npm run dist
```

---

## 📊 BUILD-PROZESS SCHRITT-FÜR-SCHRITT

Was die `build-installer.bat` macht:

1. ✅ Prüft ob `package.json` existiert
2. ✅ Prüft ob Abhängigkeiten installiert sind (sonst: `npm install`)
3. ✅ Prüft ob Treiber vorhanden sind (warnt wenn fehlen)
4. ✅ Löscht alte Builds (`dist/` Ordner)
5. ✅ Ruft `electron-builder` auf
6. ✅ Erstellt `Moony-Blockly-1.0.0-Setup.exe`

**Dauer:** 2-5 Minuten

---

## ✅ WIE ÜBERPRÜFST DU OB ES GEKLAPPT HAT?

Nach dem Build sollte eine neue Datei existieren:

```
Moony Blockly V01/
└── dist/
    └── Moony-Blockly-1.0.0-Setup.exe  ← DIESE DATEI!
```

**Größe:** ~200-300 MB (mit allen Abhängigkeiten)

---

## 🧪 DEN INSTALLER TESTEN

### Test 1: Installation durchführen

1. Doppelklick auf `Moony-Blockly-1.0.0-Setup.exe`
2. Installer lädt...
3. Willkommensseite
4. Wähle Installationsort (Standard: `C:\Users\{Username}\AppData\Local\MoonyBlockly\`)
5. "Installieren" klicken
6. Warte auf "Installation abgeschlossen"

### Test 2: Treiber wurden installiert?

Nach Installation:
- Windows "Geräte-Manager" öffnen (Win+X → Geräte-Manager)
- Schließe ein Arduino-Board an
- Sollte als **"COM-Port"** auftauchen (nicht als Unbekanntes Gerät)
- Wenn ja → Treiber OK! ✅

### Test 3: App funktioniert?

- Desktop oder Startmenü → "Moony Blockly" starten
- Sollte normal starten wie beim `npm start`

---

## 🔧 HÄUFIG GESTELLTE FRAGEN

### F: "NSIS not found in PATH"
**A:** NSIS ist nicht installiert. 
- Download: https://nsis.sourceforge.io
- Installiere in Standard-Pfad
- Starte Computer neu
- Versuche nochmal

### F: "electron-builder command not found"
**A:** Abhängigkeiten nicht installiert.
```bash
npm install
```

### F: "CH340 driver not found"
**A:** Das ist eine **Warnung**, nicht kritisch.
- Benutzer müssen Treiber später manuell installieren
- Oder: CH340SER.exe in `resources/drivers/ch340/` ablegen

### F: Build bricht ab mit "... failed"
**A:** Schau auf dem Bildschirm für Fehler:
1. Kopiere die Fehlermeldung
2. Google sie oder frag mich
3. Meist: Node.js-Problem oder fehlende Dependencies

### F: Installer-Datei sehr groß?
**A:** Normal! Electron + alle Abhängigkeiten = ~250 MB
- Das ist OK für die meisten Schulen

---

## 📁 DATEISTRUKTUR (nach Build)

Nach erfolgreichem Build sieht dein Projektordner so aus:

```
Moony Blockly V01/
├── build/
│   ├── installer.nsh           ← NSIS Installer-Script
│   └── (weitere Build-Dateien)
├── resources/
│   ├── arduino/                ← Arduino-Dateien
│   └── drivers/                ← Arduino-Treiber
│       ├── ch340/
│       ├── ftdi/
│       └── install-drivers.ps1 ← Treiber-Installer
├── renderer/                   ← UI (Blockly, HTML, CSS, JS)
├── node_modules/               ← Dependencies
├── dist/
│   └── Moony-Blockly-1.0.0-Setup.exe  ← Der Installer!
├── main.js                     ← Electron Main Process
├── preload.js                  ← Electron Preload Script
├── package.json                ← Config (mit electron-builder)
├── package-lock.json
└── build-installer.bat         ← Build-Script
```

---

## 🎯 NÄCHSTE SCHRITTE (Für dich!)

1. **Schritt 1 (JETZT):** ✅ Alle Dateien sind erstellt
2. **Schritt 2 (NÄCHST):** Arduino-Treiber runterladen
   - CH340SER.exe von wch-ic.com
   - In `resources/drivers/ch340/` ablegen
3. **Schritt 3 (DANN):** `build-installer.bat` ausführen
   - Doppelklick darauf
   - Warten
   - Fertig!

---

## 📞 TROUBLESHOOTING

### Problem: "WindowsError: command not found"
→ PowerShell/Command Prompt im richtigen Ordner öffnen (mit `cd`)

### Problem: Build fehlgeschlagen ohne Fehlermeldung
→ Versuche manuell:
```bash
npm install
npm run dist
```

### Problem: Installer lädt, aber startet App nicht
→ Check ob `main.js` und `renderer/index.html` existieren

---

## 📚 WEITERE RESSOURCEN

- **NSIS Dokumentation:** https://nsis.sourceforge.io/Docs
- **electron-builder Docs:** https://www.electron.build
- **Windows Installer Patterns:** https://learn.microsoft.com/en-us/windows/win32/msi/installation-package

---

## ✅ CHECKLIST VOR DEPLOYMENT IN SCHULEN

- [ ] Installer läuft ohne Fehler
- [ ] Installation läuft ohne Admin-Rechte
- [ ] App startet nach Installation
- [ ] Arduino-Boards werden erkannt (Geräte-Manager)
- [ ] Arduino-Code kann hochgeladen werden
- [ ] Uninstaller funktioniert sauber

---

**Viel Spaß mit MOONY BLOCKLY! 🚀🌙**

*Fragen? Fehler? → Kontakt: Gero*
