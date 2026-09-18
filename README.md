# College of Winterhold — Records

A dark-mode, Skyrim-themed roster and attendance tracker for the College of
Winterhold, built with React, Material UI, and Axios. There is no backend
server: all data lives in a Google Sheet, accessed through a small Google
Apps Script web app that acts as the API.

## Features

- **Students** — add and remove students by name, school of magic, rank,
  and house.
- **Staff** — add and remove staff by name, school of magic, rank, and
  role.
- **Instruction Log** — staff can record a class: who taught it, its name,
  date and time, and which students attended (multi-select).
- **Single shared password** — anyone can view the records; adding or
  removing entries requires the College password, checked server-side by
  the Apps Script (not baked into the front-end bundle).
- Ranks: Novice, Apprentice, Adept, Expert.
- Schools of magic: Alteration, Conjuration, Destruction, Illusion,
  Restoration.

## Getting started

1. **Set up the Google Sheet backend first** — follow
   [`google-apps-script/README.md`](./google-apps-script/README.md). You'll
   end up with a `/exec` URL and a password.
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the app:
   ```
   cp .env.example .env
   ```
   then paste your Apps Script `/exec` URL into `VITE_SHEETS_API_URL`.
4. Run it:
   ```
   npm run dev
   ```
5. Click **Staff Login** in the top bar and enter the password you set in
   Script Properties to unlock the add/delete controls.

## Project structure

```
src/
  api/sheetsApi.js       axios client for the Apps Script endpoint
  context/AuthContext.jsx  password-gated session state
  theme/theme.js          MUI dark theme + ranks/schools constants
  components/             Layout (nav), LoginDialog, RankChip
  pages/                  Dashboard, Students, Staff, Classes
google-apps-script/
  Code.gs                 the Apps Script "backend"
  README.md               deployment instructions
```

## Notes

- Changing the header row names in the Sheet will break the app — see the
  sheet layout section in the Apps Script README.
- To change the password later, just update the `APP_PASSWORD` script
  property and redeploy nothing (script properties take effect
  immediately).
