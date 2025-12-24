// Frontend JS for fetching and managing token/local actions

async function getJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

async function loadEntries() {
  const listEl = document.getElementById('entries-list');
  listEl.textContent = 'Loading...';
  try {
    const data = await getJSON(`${API_BASE_URL}/api/entries`);
    if (!data || !Array.isArray(data)) data = [];
    if (data.length === 0) {
      listEl.innerHTML = '<p>No entries yet.</p>';
      return;
    }
    listEl.innerHTML = '';
    data.sort((a,b)=> new Date(b.date)-new Date(a.date));
    for (const e of data) {
      const div = document.createElement('div');
      div.className = 'entry';
      div.innerHTML = `<h3>${escapeHtml(e.title)}</h3>
                       <time>${new Date(e.date).toLocaleString()}</time>
                       <p>${escapeHtml(e.body)}</p>`;
      listEl.appendChild(div);
    }
  } catch (err) {
    listEl.textContent = 'Failed to load entries: ' + err.message;
  }
}

function escapeHtml(s='') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;').replace(/\n/g,'<br>');
}

function getToken() {
  return localStorage.getItem('pib_journal_token') || '';
}

function setToken(t) {
  if (t) localStorage.setItem('pib_journal_token', t);
  else localStorage.removeItem('pib_journal_token');
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('entries-list')) loadEntries();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = new FormData(loginForm);
      const payload = { username: form.get('username'), password: form.get('password') };
      try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        const data = await res.json();
        setToken(data.token);
        document.getElementById('login-result').textContent = 'Logged in. You can now create entries.';
      } catch (err) {
        document.getElementById('login-result').textContent = 'Login failed: ' + err.message;
      }
    });
  }

  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const token = getToken();
      if (!token) {
        document.getElementById('entry-result').textContent = 'Not logged in.';
        return;
      }
      const form = new FormData(entryForm);
      const payload = { title: form.get('title'), body: form.get('body') };

      try {
        const res = await fetch(`${API_BASE_URL}/api/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        document.getElementById('entry-result').textContent = 'Entry created.';
        entryForm.reset();
      } catch (err) {
        document.getElementById('entry-result').textContent = 'Failed: ' + err.message;
      }
    });
  }
});