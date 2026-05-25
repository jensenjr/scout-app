# Scout Närvarokollen (Beta)

Ett skräddarsytt verktyg för Melleruds Scoutkår för att hantera närvaro, hålla koll på medlemmar som missat möten, samt underlätta kommunikation med anhöriga.

## 🚀 Nuvarande funktioner (Beta)

### 1. Interaktiv Närvarorapportering
* **Datumväljare:** Välj specifikt mötesdatum för att registrera eller ändra närvaro bakåt i tiden.
* **Masshantering:** Bocka i eller ur samtliga scouter på en gång med en huvudkryssruta ("Välj alla").
* **Direktlagring:** Närvaron sparas omedelbart i kårens lokala SQLite-databas i stället för att bara vara skrivskyddad.

### 2. Intelligent Kontakt- och Anhöriglogik
* **Egen mobil först:** Systemet kontrollerar i första hand om scouten har en egen mobiltelefon registrerad (viktigt för äldre scouter).
* **Anhörig-backup:** Om egen mobil saknas visas namnet och numret till Anhörig 1 eller Anhörig 2.
* **Valideringsvarningar:** Om en anhörig är registrerad men saknar telefonnummer, visas en röd text: `Nummer saknas`, så att ledarna vet att det behöver åtgärdas i ScoutNet. Om inga uppgifter alls finns visas `⚠️ Saknas helt i ScoutNet`.

### 3. ScoutNet-integration & Profil-länkar
* **ScoutNet-ID synk:** Alla scouters namn är klickbara i listan och länkar direkt till deras unika medlemsprofil på ScoutNet (`https://www.scoutnet.se/organisation/user/ID`).
* **Säkerhets-popup:** En bekräftelse-popup (`Öppna Scoutnet? Ja/Avbryt`) förhindrar oavsiktliga felklick under möten.
* **Tidsstämpel:** Adminpanelen visar exakt datum och klockslag för när den senaste ScoutNet-importen kördes framgångsrikt.

### 4. Dynamisk Avdelningshantering
* **Inga påhittade grupper:** Systemet läser av och genererar listan över avdelningar helt dynamiskt baserat på kårens faktiska importerade Excel/CSV-fil (t.ex. *Ledarna*, *Spårare*, *Stödmedlemmar*, *Utmanarna*).
* **Flexibel filtrering:** Admin kan enkelt bocka ur avdelningar i inställningarna för att dölja dem från startsidan (t.ex. ledare, passiva eller stödmedlemmar).

---

## 🗺️ Nästa steg på utvecklingsplanen (Roadmap)

### 📅 1. Kalender & Planerade Möten
* Implementera en kalendervy som visar kårens och avdelningarnas planerade möten.
* Automatiskt förbereda närvarolistor utifrån kalenderns aktuella mötesdatum.

### 🚗 2. Google Drive-integration
* **Terminsprogram:** Läsa in kårens officiella terminsprogram i form av filer eller kalkylark direkt från ett delat Google Drive-konto för att automatiskt bygga möteskalendern.
* **Automatisk medlemsuppdatering:** Synkronisera medlemsregistret automatiskt i bakgrunden genom att läsa av en specifik medlemslista (Excel/CSV) placerad på Google Drive, i stället för att kräva manuella uppladdningar i adminpanelen.

---

## 🛠️ Teknisk arkitektur

* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** Node.js, Express
* **Databas:** SQLite (`better-sqlite3` / `sql.js`)

### Köra applikationen lokalt
1. Starta backend: `cd backend && npm run dev`
2. Starta frontend: `cd frontend && npm run dev`
