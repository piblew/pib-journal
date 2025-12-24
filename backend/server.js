// Simple Node/Express backend for Pib Journal
// Replace FILESS_* placeholders and adapt filessUpload/filessDownload if filess.io API differs.

import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// ===== Config from env =====
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';

// filess.io settings (set these env vars)
const FILESS_API_BASE = process.env.FILESS_API_BASE || 'https://api.filess.io'; // adapt if different
const FILESS_API_KEY = process.env.FILESS_API_KEY || ''; // set in Render env

// Constants for our index file path/name (how we store index)
const INDEX_FILENAME = 'pib_journal_index.json';

// Helper: simple auth for API (JWT)
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).send('Missing token');
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
}

// ===== filess helpers (adapt if their API differs) =====
// We assume filess.io supports uploading a file via multipart/form-data returning a file id or url,
// and supports downloading a file via file id or path.
// If filess.io has different endpoints, modify these functions accordingly.

async function filessUploadFile(filename, content) {
  // Upload a file and return an object { id, url } or throw
  // Using a generic /upload endpoint - replace with actual filess.io endpoint.
  const url = `${FILESS_API_BASE}/upload`;
  const form = new (await import('form-data')).default();
  form.append('file', Buffer.from(content), { filename });
  // Add API key header or form field as filess requires
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FILESS_API_KEY}` },
    body: form
  });
  if (!res.ok) {
    throw new Error(`filess upload failed: ${res.status} ${await res.text()}`);
  }
  return res.json(); // expecting { id, url } or similar
}

async function filessDownloadFile(fileIdOrUrl) {
  // If fileIdOrUrl is a full URL, fetch it; otherwise call download endpoint.
  const url = fileIdOrUrl.startsWith('http') ? fileIdOrUrl : `${FILESS_API_BASE}/files/${fileIdOrUrl}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${FILESS_API_KEY}` } });
  if (!res.ok) throw new Error(`filess download failed: ${res.status}`);
  return res.text();
}

// Optional: overwrite (delete+upload) index file: here we'll re-upload and use returned id
// Alternative patterns: store index at a stable URL if filess supports key-based storage.

async function readIndex() {
  try {
    // 1) If we know index file id stored in env or a file, read it
    // For a robust approach we keep indexId in an ENV or store a well-known filename and fetch by name.
    const res = await fetch(`${FILESS_API_BASE}/files?name=${encodeURIComponent(INDEX_FILENAME)}`, {
      headers: { 'Authorization': `Bearer ${FILESS_API_KEY}` }
    });
    if (!res.ok) {
      // No index found
      return [];
    }
    const files = await res.json(); // adapt to filess response
    if (!Array.isArray(files) || files.length === 0) return [];

    // assume first match
    const fileMeta = files[0];
    const body = await filessDownloadFile(fileMeta.url || fileMeta.id);
    return JSON.parse(body);
  } catch (err) {
    console.error('readIndex error', err);
    return [];
  }
}

async function writeIndex(entries) {
  const content = JSON.stringify(entries, null, 2);
  const filename = `${INDEX_FILENAME}`;
  const res = await filessUploadFile(filename, content);
  // res should contain url/id; you may store it in env or ignore
  return res;
}

// ===== API =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send('username+password required');
  // For simplicity compare raw values; in production store a hashed password and use bcrypt.
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token });
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await readIndex();
    // entries is an array with metadata { id, title, date, body } (body may be stored inline or as URL)
    // For privacy/publication: we return title,date,body (body may be truncated if desired)
    return res.json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to get entries');
  }
});

app.post('/api/entries', authMiddleware, async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).send('title+body required');

  try {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const entry = { id, title, body, date: now };

    // Store the entry itself as a JSON file in filess
    const filename = `entry_${id}.json`;
    const uploadRes = await filessUploadFile(filename, JSON.stringify(entry));

    // Read current index, append metadata and write back
    const index = await readIndex();
    index.push({ id, title, date: now, file: uploadRes.url || uploadRes.id });
    await writeIndex(index);

    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('create entry error', err);
    return res.status(500).send('Failed to create entry: ' + err.message);
  }
});

// Basic health
app.get('/', (req, res) => res.send('Pib Journal backend'));

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));