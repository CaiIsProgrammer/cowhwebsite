# Google Sheet backend

This app has no server of its own — the "backend" is a small Google Apps
Script bound to your Google Sheet. Apps Script hosts the HTTP endpoint for
free; you only need to deploy it once inside the Sheet itself.

## Setup

1. Create a new Google Sheet (or use an existing one) — this will be your
   database.
2. In the Sheet, go to **Extensions > Apps Script**.
3. Delete the placeholder `myFunction` code and paste in the contents of
   [`Code.gs`](./Code.gs).
4. Run the `setupSheets` function once (pick it from the function dropdown
   next to the Run button, click Run). This creates three tabs —
   **Students**, **Staff**, **Classes** — with the correct header rows.
   The first time you run it, Google will ask you to authorize the script;
   accept the permissions (it only touches this one spreadsheet).
5. Set the passwords: **Project Settings** (gear icon in the left
   sidebar) > **Script Properties** > **Add script property**:
   - Property: `APP_PASSWORD` — the **Archivist** password. Grants full
     access: add/delete students, staff, and classes.
   - Property: `INSTRUCTOR_PASSWORD` (optional) — the **Instructor**
     password. Can only record a class and its attendance — cannot add,
     edit, or delete students or staff, and cannot delete anything.
     Leave this property unset if you don't want a separate role.
6. Deploy it as a web app: **Deploy > New deployment**.
   - Click the gear next to "Select type" and choose **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy** and authorize again if asked.
7. Copy the **Web app URL** it gives you (ends in `/exec`).
8. In the React project, copy `.env.example` to `.env` and paste that URL
   into `VITE_SHEETS_API_URL`.

Whenever you change `Code.gs`, you must push a new version for the same
deployment (**Deploy > Manage deployments** > pencil icon > **New version**
> Deploy) — editing the script alone does not update the live `/exec` URL.

## Why the password isn't just in the React app

The password check happens inside Apps Script (compared against the
`APP_PASSWORD` / `INSTRUCTOR_PASSWORD` script properties), not in the
front-end JavaScript. Anything bundled into a Vite `.env` variable ends up
readable in the browser's dev tools, so a real secret can't live there.
Instead, the client sends whatever the user types to the `login` action,
Apps Script confirms it against the script properties and reports back
which role (if any) it matched, and — if correct — the browser holds onto
that password in `sessionStorage` for the rest of the tab's session,
attaching it to each write request so Apps Script can re-check both the
password *and* the role's permissions server-side every time. A request
using the Instructor password to add a student is rejected by the script
itself, regardless of what the browser UI shows.

## Sheet layout

Each tab's first row is the header; do not reorder or rename these columns
(the script and the app both key off the header names):

- **Students**: `ID`, `Name`, `School`, `Rank`, `House`, `CreatedAt`
- **Staff**: `ID`, `Name`, `School`, `Rank`, `Role`, `CreatedAt`
- **Classes**: `ID`, `StaffName`, `ClassName`, `ClassType`, `School`, `Date`, `Time`, `Attendees`, `CreatedAt`

`ID` is a generated UUID, and `Attendees` is a comma-separated list of
student names who attended that class. `ClassType` is either `Expedition`
or `Lecture`.

Writes are matched to columns **by header name**, not position, so adding
a new column to `SHEET_HEADERS` in `Code.gs` is safe for new rows. It won't
retroactively fix existing rows if you ever reorder or rename an existing
column, though — that requires either leaving old columns alone (only add
new ones) or manually fixing old data to match.
