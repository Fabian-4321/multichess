# Vier-Spieler-Schach

Ein spielbares Vier-Spieler-Schach mit modernem Interface und Echtzeit-Multiplayer.

## Schnellstart

### Voraussetzungen
- Node.js >= 18
- npm

### Installation

```bash
# Backend
cd backend
npm install

# Frontend (in einem neuen Terminal)
cd ../frontend
npm install
```

### Starten

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```
Der Server startet auf `http://localhost:3001`.

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```
Die App öffnet sich auf `http://localhost:5173`.

### Spielen

1. Öffne `http://localhost:5173` in vier Browser-Tabs (oder an vier Geräten).
2. Im ersten Tab: Klicke **„Neues Spiel erstellen"**.
3. Notiere den angezeigten Raumcode.
4. In den anderen Tabs: Gib den Raumcode ein und klicke **„Beitreten"**.
5. Sobald 4 Spieler beigetreten sind, beginnt das Spiel.

## Projektstruktur

```
four-player-chess/
├── backend/
│   └── src/
│       ├── game/          # Spiellogik (Board, Züge, Validierung)
│       ├── rooms/         # Raumverwaltung
│       ├── socket/        # Socket.IO Handler
│       └── index.ts       # Server-Einstiegspunkt
├── frontend/
│   └── src/
│       ├── components/    # React-Komponenten
│       ├── types/         # TypeScript-Typen
│       ├── App.tsx        # Hauptkomponente
│       └── socket.ts      # Socket-Verbindung
└── README.md
```

## Spielregeln

- **Brett:** 14×14 Kreuzform (Ecken sind ungültig)
- **Farben:** Weiß (oben), Rot (rechts), Schwarz (unten), Blau (links)
- **Zugreihenfolge:** Weiß → Rot → Schwarz → Blau
- **Züge:** Standard-Schachregeln, Bauern bewegen sich in ihrer Richtung
- **Bauern-Umwandlung:** Automatisch zur Dame
- **Schachmatt:** Spieler scheidet aus, Figuren werden entfernt
- **Gewinn:** Letzter verbleibender Spieler gewinnt

## Technik

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + Socket.IO
- Echtzeit: Socket.IO für Spielzustand-Updates
- Datenhaltung: In-Memory (datenbankfähig vorbereitet)
