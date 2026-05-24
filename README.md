# Scout Dashboard

Enkel webbapp för scoutledare i Mellerud att hantera närvaro, flagga frånvarande medlemmar, skicka SMS till föräldrar via 46elks, och posta meddelanden till grupper.

## Kom igång

### 1. Klona repot
```bash
git clone <repo-url>
cd scout-app
```

### 2. Konfigurera miljövariabler
```bash
cp backend/.env.example backend/.env
# Fyll i dina riktiga värden i backend/.env
```

### 3. Kör lokalt
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (nytt terminalfönster)
cd frontend && npm install && npm run dev
```

### 4. Driftsätt med Coolify
- Pusha till GitHub
- Peka Coolify på repot
- Lägg till miljövariablerna i Coolifys inställningar
- Driftsätt!

## Miljövariabler

Se `backend/.env.example` för alla variabler som behövs.

## Funktioner (Alpha)

- 📊 Närvarodashboard per grupp
- 🚩 Automatisk flaggning av frånvarande (2+ möten)
- 📱 SMS-utskick via 46elks
- 📢 Meddelandekanal för föräldrar
- 📥 Automatisk dataimport från ScalpNet
- 📄 Kommunrapport-export (Excel)
