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
 *      - APP_PASSWORD: the Archivist password. Can add/delete students,
 *        staff, and classes.
 *      - INSTRUCTOR_PASSWORD: the Instructor password. Can only add a
 *        class (with attendance) — cannot touch students or staff, and
 *        cannot delete anything. Leave it unset if you don't want a
 *        separate instructor role.
 * 5. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copy the resulting /exec URL into the React app's .env as
 *    VITE_SHEETS_API_URL.
 * 6. Whenever you edit this script, redeploy (Deploy > Manage deployments >
 *    edit > New version) for changes to take effect on the same URL.
 */

const SHEET_HEADERS = {
  Students: ['ID', 'Name', 'School', 'Rank', 'House', 'CreatedAt'],
  Staff: ['ID', 'Name', 'School', 'Rank', 'Role', 'CreatedAt'],
  Classes: ['ID', 'StaffName', 'ClassName', 'Date', 'Time', 'Attendees', 'CreatedAt'],
};

// Actions only the 'admin' role (APP_PASSWORD) may perform.
// Anything not listed here (currently just 'addClass') is open to either role.
const ADMIN_ONLY_ACTIONS = ['addStudent', 'addStaff', 'deleteRow'];

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_HEADERS).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });
}

function doGet(e) {
  const sheetName = e.parameter.sheet;

  // Fetch all three tabs in a single round trip — used by pages that need
  // more than one sheet at once, since each separate call to this web app
  // has its own latency (cold starts, a mandatory redirect hop).
  if (sheetName === 'all') {
    const result = {};
    Object.keys(SHEET_HEADERS).forEach((name) => {
      result[name] = sheetToObjects_(getSheet_(name));
    });
    return jsonOutput_(result);
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

  if (ADMIN_ONLY_ACTIONS.includes(action) && role !== 'admin') {
    return jsonOutput_({ error: 'Only the Archivist password can do that.' });
  }

  switch (action) {
    case 'addStudent':
      return jsonOutput_(appendRow_('Students', [body.name, body.school, body.rank, body.house]));
    case 'addStaff':
      return jsonOutput_(appendRow_('Staff', [body.name, body.school, body.rank, body.role]));
    case 'addClass':
      return jsonOutput_(
        appendRow_('Classes', [body.staffName, body.className, body.date, body.time, body.attendees])
      );
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

// Returns 'admin', 'instructor', or null.
function getRole_(candidate) {
  if (!candidate) return null;
  const props = PropertiesService.getScriptProperties();
  const admin = props.getProperty('APP_PASSWORD');
  const instructor = props.getProperty('INSTRUCTOR_PASSWORD');
  if (admin && candidate === admin) return 'admin';
  if (instructor && candidate === instructor) return 'instructor';
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

function appendRow_(sheetName, values) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return { error: 'Unknown sheet: ' + sheetName };
  const id = Utilities.getUuid();
  sheet.appendRow([id, ...values, new Date()]);
  return { success: true, id };
}

function deleteRow_(sheetName, id) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return { error: 'Unknown sheet: ' + sheetName };
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
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
