import axios from 'axios';

// The "backend" for this app is a Google Apps Script Web App bound to a
// Google Sheet (see /google-apps-script/Code.gs). There is no server to
// deploy: Apps Script hosts the endpoint and reads/writes the sheet
// directly. Set VITE_SHEETS_API_URL to that deployment's /exec URL.
const BASE_URL = import.meta.env.VITE_SHEETS_API_URL;

const client = axios.create({
  baseURL: BASE_URL,
});

function assertConfigured() {
  if (!BASE_URL) {
    throw new Error(
      'VITE_SHEETS_API_URL is not set. Copy .env.example to .env and paste in your ' +
        'Apps Script deployment URL.'
    );
  }
}

// Apps Script web apps do not answer CORS preflight (OPTIONS) requests, so
// POST bodies are sent as text/plain to keep them "simple requests" that
// skip preflight entirely. The server still JSON.parses the body.
function post(action, payload) {
  assertConfigured();
  return client
    .post('', JSON.stringify({ action, ...payload }), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    })
    .then((res) => res.data);
}

function get(sheet) {
  assertConfigured();
  return client.get('', { params: { sheet } }).then((res) => res.data);
}

// Returns { success, role } where role is 'admin', 'instructor', or null.
// 'admin' (the Archivist password) can manage students, staff, and classes.
// 'instructor' can only add a class/attendance entry.
export function verifyPassword(password) {
  return post('login', { password }).then((data) => ({
    success: !!data.success,
    role: data.role ?? null,
  }));
}

export function getStudents() {
  return get('Students').then((data) => data.rows ?? []);
}

export function addStudent({ name, school, rank, house, password }) {
  return post('addStudent', { name, school, rank, house, password });
}

export function deleteStudent({ id, password }) {
  return post('deleteRow', { sheet: 'Students', id, password });
}

export function getStaff() {
  return get('Staff').then((data) => data.rows ?? []);
}

export function addStaff({ name, school, rank, role, password }) {
  return post('addStaff', { name, school, rank, role, password });
}

export function deleteStaff({ id, password }) {
  return post('deleteRow', { sheet: 'Staff', id, password });
}

export function getClasses() {
  return get('Classes').then((data) => data.rows ?? []);
}

export function addClass({ staffName, className, date, time, attendees, password }) {
  return post('addClass', {
    staffName,
    className,
    date,
    time,
    attendees: attendees.join(', '),
    password,
  });
}

export function deleteClass({ id, password }) {
  return post('deleteRow', { sheet: 'Classes', id, password });
}
