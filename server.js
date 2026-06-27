const express = require('express');
const fs      = require('fs');
const path    = require('path');
const app     = express();

const DATA_FILE = path.join(__dirname, 'data.json');

function getData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { visitors: {}, photos: [] }; }
}
function saveData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}
if (!fs.existsSync(DATA_FILE)) saveData({ visitors: {}, photos: [] });

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ── VISITOR TRACKING ── */
app.post('/api/visit', (req, res) => {
  const d    = getData();
  const today = new Date().toISOString().split('T')[0];
  d.visitors[today] = (d.visitors[today] || 0) + 1;
  saveData(d);
  res.json({ ok: true });
});

app.get('/api/stats', (req, res) => {
  const d = getData();
  res.json({ visitors: d.visitors, photoCount: d.photos.length });
});

/* ── PHOTOS ── */
app.get('/api/photos', (req, res) => {
  res.json(getData().photos);
});

app.post('/api/photos', (req, res) => {
  const { src, name } = req.body;
  if (!src || !name) return res.status(400).json({ error: 'Missing src or name' });
  const d = getData();
  const photo = { id: Date.now() + '_' + Math.random().toString(36).slice(2), src, name, date: new Date().toISOString() };
  d.photos.unshift(photo);
  saveData(d);
  res.json({ ok: true, photo });
});

app.delete('/api/photos/:id', (req, res) => {
  const d = getData();
  const before = d.photos.length;
  d.photos = d.photos.filter(p => String(p.id) !== String(req.params.id));
  saveData(d);
  res.json({ ok: true, deleted: before - d.photos.length });
});

app.delete('/api/photos', (req, res) => {
  const d = getData();
  d.photos = [];
  saveData(d);
  res.json({ ok: true });
});

app.delete('/api/visitors', (req, res) => {
  const d = getData();
  d.visitors = {};
  saveData(d);
  res.json({ ok: true });
});

/* ── FALLBACK ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Temple server running on port ' + PORT));
