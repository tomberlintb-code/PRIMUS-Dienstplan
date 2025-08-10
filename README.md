# Primus Login – Minimal (Next.js + Firebase Auth)

**Ziel:** Ein minimaler, sauberer Login‑Flow: Splash → Login → Dashboard. Ohne Firestore, ohne Server‑Action‑Magie.

## Setup (lokal)
1. Node.js 18+ installieren.
2. Projekt entpacken und im Ordner öffnen.
3. `cp .env.local.example .env.local` und die Werte aus der Firebase‑Konsole eintragen (Project Settings → General).
4. `npm i`
5. `npm run dev`
6. Browser: http://localhost:3000

## Firebase‑Konsole
- Authentication → Sign‑in method → E‑Mail/Passwort: **Enable**
- Authentication → Users: Test‑User anlegen.
- Authentication → Settings → Authorized domains: `localhost` + später deine Vercel‑Domain.

## Deploy (Vercel)
- Projekt mit GitHub verbinden.
- In den Vercel‑Projekt‑Einstellungen unter **Environment Variables** alle `NEXT_PUBLIC_FIREBASE_*` Variablen setzen (Werte identisch zu `.env.local`).
- Redeploy.
- Prüfen, ob die Vercel‑Domain in Firebase → Authentication → Settings → Authorized domains eingetragen ist.

## Hinweis
Dieser Build nutzt **nur** Firebase Auth (kein Firestore). So vermeiden wir die 400/`code=unavailable`‑Fehler. Der Guard am Dashboard ist clientseitig: nicht angemeldete Nutzer werden nach `/login` umgeleitet.
