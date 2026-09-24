/**
 * College of Winterhold — Records
 * Google Apps Script backend bound to the Google Sheet used as the database.
 *
 * SETUP
 * 1. Open your Google Sheet, then Extensions > Apps Script.
 * 2. Delete any starter code and paste this whole file in as Code.gs.
 * 3. Run `setupSheets` once (select it in the function dropdown, click Run).
 *    This creates the Students, Staff and Classes tabs with the correct
 *    headers if they don't already exist. Grant the permissions it asks for.
 * 4. Set the passwords: Project Settings (gear icon) > Script Properties:
 *      - APP_PASSWORD: the Archivist password. Can add/edit/delete
 *        students, staff, and classes, and can mark an application's
 *        Paid Tuiton / Paid Application Fee status.
 *      - INSTRUCTOR_PASSWORD: the Instructor password. Can only add a
 *        class (with attendance) — cannot touch students or staff, and
 *        cannot edit or delete anything. Leave it unset if you don't want
 *        a separate instructor role.
 *      - ADMISSIONS_PASSWORD: the Admissions password. Can view the
 *        Admissions tab and approve/deny applications, and can also mark
 *        Paid Tuiton / Paid Application Fee. Cannot touch students, staff,
 *        or classes. Leave it unset if you don't want this role.
 * 5. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copy the resulting /exec URL into the React app's .env as
 *    VITE_SHEETS_API_URL.
 * 6. Whenever you edit this script, redeploy (Deploy > Manage deployments >
 *    edit > New version) for changes to take effect on the same URL.
 */

const SHEET_HEADERS = {
  Students: ['ID', 'Name', 'School', 'Rank', 'House', 'Faction', 'CreatedAt'],
  Staff: ['ID', 'Name', 'School', 'Rank', 'Role', 'CreatedAt'],
  Classes: [
    'ID',
    'StaffName',
    'ClassName',
    'ClassType',
    'Difficulty',
    'School',
    'Date',
    'Time',
    'Timezone',
    'Attendees',
    'HomeworkCompletedBy',
    'CreatedAt',
  ],
  // This tab is populated by a linked Google Form — setupSheets() never
  // touches its header row (see the exclusion below). Listed here only so
  // getSheet_/sheetToObjects_ recognize it as a valid, known sheet. There is
  // no ID column; rows are identified by their Timestamp instead (see
  // normalizeId_ and updateAdmissionsRow_).
  Admissions: [
    'Timestamp',
    'What is your full name?',
    'What school of magic would you like to study?',
    'What are your professions?',
    'What faction do you belong to?',
    'What are your philosophies and who do you worship?',
    'Tell us about yourself, how you ended up in Skyrim, and how long have you been in the realm?',
    'Is there anyone who can speak to the strength of your character that resides within the College?',
    'What is the Sun, and what is its relationship with Magic?',
    'Describe ethical and lawful uses of Magic?',
    'How should a Mage end or resolve a conflict?',
    "Describe a Mage's duty to their community?",
    'Is there anything else we should know about you?',
    'If rejected, please reach out to our councilors to ascertain why your application was rejected.',
    'Upon acceptance, a one time fee of 1000 gold must be paid.',
    'Falsifying any information on this application will result in an immediate rejection. If information is acquired after acceptance that indicates information was falsified on the application, suspension or expulsion may additionally apply.',
    'Paid Tuiton',
    'Paid Application Fee',
    'Approved',
  ],
};

// The only Admissions columns the app is ever allowed to write to — every
// other column is a Form answer and must stay exactly as the applicant
// submitted it.
const ADMISSIONS_PAYMENT_FIELDS = ['Paid Tuiton', 'Paid Application Fee'];
const ADMISSIONS_DECISION_FIELD = 'Approved';

// Columns that must be stored as plain text, never auto-converted to a
// Sheets date/number type — Date and Time are free-form strings from HTML
// date/time inputs, and letting Sheets "helpfully" reinterpret them makes
// them impossible to read back reliably for editing.
const TEXT_COLUMNS = {
  Classes: ['Date', 'Time'],
};

// Actions only the 'admin' role (APP_PASSWORD) may perform.
// Anything not listed here (currently just 'addClass') is open to either role.
const ADMIN_ONLY_ACTIONS = ['addStudent', 'addStaff', 'updateRow', 'deleteRow'];

// Sheets bundled into the public/no-password "all" read and the plain
// per-sheet read. Admissions is deliberately excluded from both — it holds
// personal application answers and requires its own password check (below).
const PUBLIC_SHEETS = ['Students', 'Staff', 'Classes'];

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PUBLIC_SHEETS.forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });
  // Admissions is created and managed by its linked Google Form — never
  // touch its header row here.
}

function doGet(e) {
  const sheetName = e.parameter.sheet;

  // Fetch the three public tabs in a single round trip — used by pages
  // that need more than one sheet at once, since each separate call to
  // this web app has its own latency (cold starts, a mandatory redirect
  // hop). Admissions is never included, even here.
  if (sheetName === 'all') {
    const result = {};
    PUBLIC_SHEETS.forEach((name) => {
      result[name] = sheetToObjects_(getSheet_(name));
    });
    return jsonOutput_(result);
  }

  if (sheetName === 'Admissions') {
    const role = getRole_(e.parameter.password);
    if (role !== 'admin' && role !== 'admissions') {
      return jsonOutput_({ error: 'Only the Archivist or Admissions password can view applications.' });
    }
  }

  const sheet = getSheet_(sheetName);
  if (!sheet) return jsonOutput_({ error: 'Unknown sheet: ' + sheetName });
  return jsonOutput_({ rows: sheetToObjects_(sheet) });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ error: 'Malformed request body.' });
  }

  const action = body.action;
  const role = getRole_(body.password);

  if (action === 'login') {
    return jsonOutput_({ success: !!role, role: role });
  }

  if (!role) {
    return jsonOutput_({ error: 'Invalid password.' });
  }

  // Admissions has its own permission split (payment vs. decision), handled
  // entirely separately from the flat admin-only check below.
  if (action === 'updateRow' && body.sheet === 'Admissions') {
    return jsonOutput_(updateAdmissionsRow_(role, body.id, body.fields));
  }

  if (ADMIN_ONLY_ACTIONS.includes(action) && role !== 'admin') {
    return jsonOutput_({ error: 'Only the Archivist password can do that.' });
  }

  switch (action) {
    case 'addStudent':
      return jsonOutput_(
        appendRow_('Students', {
          Name: body.name,
          School: body.school,
          Rank: body.rank,
          House: body.house,
          Faction: body.faction,
        })
      );
    case 'addStaff':
      return jsonOutput_(
        appendRow_('Staff', { Name: body.name, School: body.school, Rank: body.rank, Role: body.role })
      );
    case 'addClass':
      return jsonOutput_(
        appendRow_('Classes', {
          StaffName: body.staffName,
          ClassName: body.className,
          ClassType: body.classType,
          Difficulty: body.difficulty,
          School: body.school,
          Date: body.date,
          Time: body.time,
          Timezone: body.timezone,
          Attendees: body.attendees,
          HomeworkCompletedBy: body.homeworkCompletedBy,
        })
      );
    case 'updateRow':
      return jsonOutput_(updateRow_(body.sheet, body.id, body.fields));
    case 'deleteRow':
      return jsonOutput_(deleteRow_(body.sheet, body.id));
    default:
      return jsonOutput_({ error: 'Unknown action: ' + action });
  }
}

// ---- helpers ----

function getSheet_(name) {
  if (!SHEET_HEADERS[name]) return null;
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

// Returns 'admin', 'instructor', 'admissions', or null.
function getRole_(candidate) {
  if (!candidate) return null;
  const props = PropertiesService.getScriptProperties();
  const admin = props.getProperty('APP_PASSWORD');
  const instructor = props.getProperty('INSTRUCTOR_PASSWORD');
  const admissions = props.getProperty('ADMISSIONS_PASSWORD');
  if (admin && candidate === admin) return 'admin';
  if (instructor && candidate === instructor) return 'instructor';
  if (admissions && candidate === admissions) return 'admissions';
  return null;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== '' && cell !== null))
    .map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        const cell = row[i];
        obj[header] = cell instanceof Date ? cell.toISOString() : cell;
      });
      return obj;
    });
}

// Sets the cell's number format to plain text *before* writing, for any
// column listed in TEXT_COLUMNS for this sheet — otherwise Sheets may
// silently reinterpret a string like "2026-09-18" as a date serial.
function forceTextFormat_(sheet, sheetName, row, col, headerName) {
  const textCols = TEXT_COLUMNS[sheetName];
  if (textCols && textCols.includes(headerName)) {
    sheet.getRange(row, col).setNumberFormat('@');
  }
}

// fields: an object of { HeaderName: value }. Writes by header name rather
// than position, so columns can be added/reordered in SHEET_HEADERS without
// risking misaligned writes — the same reason updateRow_ works this way.
function appendRow_(sheetName, fields) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return { error: 'Unknown sheet: ' + sheetName };
  const headers = SHEET_HEADERS[sheetName];
  const id = Utilities.getUuid();
  const row = sheet.getLastRow() + 1;
  const allFields = Object.assign({ ID: id, CreatedAt: new Date() }, fields);
  headers.forEach((headerName, i) => {
    if (allFields[headerName] === undefined) return;
    const col = i + 1;
    forceTextFormat_(sheet, sheetName, row, col, headerName);
    sheet.getRange(row, col).setValue(allFields[headerName]);
  });
  return { success: true, id };
}

// The first column is normally a UUID string (Students/Staff/Classes), but
// for Admissions (a Form response sheet with no ID column) it's the
// Timestamp cell, which Sheets hands back as a Date object rather than the
// ISO string the client sent — normalize both sides before comparing.
function normalizeId_(value) {
  return value instanceof Date ? value.toISOString() : value;
}

// fields: a partial object of { HeaderName: newValue }. Only columns that
// exist in the sheet's header row are touched; ID and CreatedAt are never
// overwritten even if present in fields.
function updateRow_(sheetName, id, fields) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return { error: 'Unknown sheet: ' + sheetName };
  if (!fields) return { error: 'No fields to update.' };
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (normalizeId_(values[i][0]) === id) {
      const row = i + 1;
      Object.keys(fields).forEach((headerName) => {
        if (headerName === 'ID' || headerName === 'CreatedAt') return;
        const col = headers.indexOf(headerName);
        if (col === -1) return;
        forceTextFormat_(sheet, sheetName, row, col + 1, headerName);
        sheet.getRange(row, col + 1).setValue(fields[headerName]);
      });
      return { success: true };
    }
  }
  return { error: 'Row not found.' };
}

// Admissions permission split: the 'admin' (Archivist) role may only touch
// Paid Tuiton / Paid Application Fee; only 'admissions' may set Approved.
// Both may be present in the same request only if both roles allow them —
// in practice the UI never mixes them, but this stays correct either way.
// Any field outside these three is rejected outright, so an application's
// actual answers can never be edited through the app.
function updateAdmissionsRow_(role, id, fields) {
  if (!fields) return { error: 'No fields to update.' };
  const keys = Object.keys(fields);
  const allowedKeys = ADMISSIONS_PAYMENT_FIELDS.concat(ADMISSIONS_DECISION_FIELD);
  const disallowed = keys.filter((k) => allowedKeys.indexOf(k) === -1);
  if (disallowed.length > 0) {
    return { error: 'Application answers cannot be edited: ' + disallowed.join(', ') };
  }
  if (keys.indexOf(ADMISSIONS_DECISION_FIELD) !== -1 && role !== 'admissions') {
    return { error: 'Only the Admissions password can approve or deny applications.' };
  }
  const wantsPayment = keys.some((k) => ADMISSIONS_PAYMENT_FIELDS.indexOf(k) !== -1);
  if (wantsPayment && role !== 'admin' && role !== 'admissions') {
    return { error: 'Only the Archivist or Admissions password can update payment status.' };
  }
  return updateRow_('Admissions', id, fields);
}

function deleteRow_(sheetName, id) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return { error: 'Unknown sheet: ' + sheetName };
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (normalizeId_(values[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Row not found.' };
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
