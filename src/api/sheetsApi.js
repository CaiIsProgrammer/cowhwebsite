import axios from 'axios';
import { getOrFetch, setCached, invalidate } from './cache';

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

// Apps Script always responds 200, reporting failure via a JSON {error}
// field instead of an HTTP status — surface that as a real rejection so
// callers' .catch()/error state actually fires instead of silently
// treating a rejected write (bad password, wrong role, unknown sheet) or a
// failed read as an empty success.
function unwrap(data) {
  if (data && data.error) throw new Error(data.error);
  return data;
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
    .then((res) => unwrap(res.data));
}

function get(sheet) {
  assertConfigured();
  return client.get('', { params: { sheet } }).then((res) => unwrap(res.data));
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
  return getOrFetch('Students', () => get('Students').then((data) => data.rows ?? []));
}

export function addStudent({ name, school, rank, house, password }) {
  return post('addStudent', { name, school, rank, house, password }).then((result) => {
    invalidate('Students');
    invalidate('all');
    return result;
  });
}

export function updateStudent({ id, name, school, rank, house, password }) {
  return post('updateRow', {
    sheet: 'Students',
    id,
    fields: { Name: name, School: school, Rank: rank, House: house },
    password,
  }).then((result) => {
    invalidate('Students');
    invalidate('all');
    return result;
  });
}

export function deleteStudent({ id, password }) {
  return post('deleteRow', { sheet: 'Students', id, password }).then((result) => {
    invalidate('Students');
    invalidate('all');
    return result;
  });
}

export function getStaff() {
  return getOrFetch('Staff', () => get('Staff').then((data) => data.rows ?? []));
}

export function addStaff({ name, school, rank, role, password }) {
  return post('addStaff', { name, school, rank, role, password }).then((result) => {
    invalidate('Staff');
    invalidate('all');
    return result;
  });
}

export function updateStaff({ id, name, school, rank, role, password }) {
  return post('updateRow', {
    sheet: 'Staff',
    id,
    fields: { Name: name, School: school, Rank: rank, Role: role },
    password,
  }).then((result) => {
    invalidate('Staff');
    invalidate('all');
    return result;
  });
}

export function deleteStaff({ id, password }) {
  return post('deleteRow', { sheet: 'Staff', id, password }).then((result) => {
    invalidate('Staff');
    invalidate('all');
    return result;
  });
}

export function getClasses() {
  return getOrFetch('Classes', () => get('Classes').then((data) => data.rows ?? []));
}

export function addClass({
  staffName,
  className,
  classType,
  difficulty,
  school,
  date,
  time,
  attendees,
  password,
}) {
  return post('addClass', {
    staffName,
    className,
    classType,
    difficulty,
    school,
    date,
    time,
    attendees: attendees.join(', '),
    password,
  }).then((result) => {
    invalidate('Classes');
    invalidate('all');
    return result;
  });
}

export function updateClass({
  id,
  staffName,
  className,
  classType,
  difficulty,
  school,
  date,
  time,
  attendees,
  password,
}) {
  return post('updateRow', {
    sheet: 'Classes',
    id,
    fields: {
      StaffName: staffName,
      ClassName: className,
      ClassType: classType,
      Difficulty: difficulty,
      School: school,
      Date: date,
      Time: time,
      Attendees: attendees.join(', '),
    },
    password,
  }).then((result) => {
    invalidate('Classes');
    invalidate('all');
    return result;
  });
}

export function deleteClass({ id, password }) {
  return post('deleteRow', { sheet: 'Classes', id, password }).then((result) => {
    invalidate('Classes');
    invalidate('all');
    return result;
  });
}

// Fetches Students, Staff and Classes in a single HTTP round trip instead
// of three, and primes each sheet's individual cache entry so a later
// getStudents()/getStaff()/getClasses() call (e.g. navigating to another
// page) resolves instantly instead of re-fetching.
export function getAllSheets() {
  return getOrFetch('all', () =>
    get('all').then((data) => {
      const students = data.Students ?? [];
      const staff = data.Staff ?? [];
      const classes = data.Classes ?? [];
      setCached('Students', students);
      setCached('Staff', staff);
      setCached('Classes', classes);
      return { students, staff, classes };
    })
  );
}
