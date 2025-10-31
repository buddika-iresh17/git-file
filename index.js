const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch'); // node-fetch v2
const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve simple HTML form
app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>GitHub File Uploader</title>
<style>
body{font-family:system-ui, -apple-system, "Segoe UI", Roboto, Arial; padding:24px; max-width:720px}
label{display:block;margin:12px 0 6px}
input, button, textarea {width:100%; padding:8px; box-sizing:border-box}
</style>
</head>
<body>
<h2>GitHub File Uploader</h2>
<form id="frm">
<label>GitHub Token (PAT)</label>
<input id="token" name="token" placeholder="ghp_..." required>

<label>Owner</label>
<input id="owner" name="owner" placeholder="your-username" required>

<label>Repository</label>
<input id="repo" name="repo" placeholder="repo-name" required>

<label>Target path in repo</label>
<input id="targetPath" name="targetPath" placeholder="src/index.js" required>

<label>Commit message</label>
<input id="message" name="message" placeholder="Add file" required>

<label>Choose file</label>
<input id="file" type="file" required>

<button type="submit">Upload</button>
</form>

<pre id="out" style="margin-top:16px; white-space:pre-wrap; background:#f6f8fa; padding:12px;border-radius:6px"></pre>

<script>
const frm = document.getElementById('frm');
const out = document.getElementById('out');

frm.addEventListener('submit', async (e) => {
  e.preventDefault();
  out.textContent = 'Uploading...';

  const fd = new FormData(frm);
  const fileInput = document.getElementById('file');
  if (!fileInput.files.length) return alert('Choose a file');
  fd.append('file', fileInput.files[0]);

  try {
    const resp = await fetch('/upload', { method: 'POST', body: fd });
    const text = await resp.text();
    out.textContent = text;
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
  }
});
</script>
</body>
</html>`);
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { token, owner, repo, targetPath, message } = req.body;
    if (!token || !owner || !repo || !targetPath || !message) {
      return res.status(400).type('text').send('Missing required fields ❌');
    }
    if (!req.file) return res.status(400).type('text').send('No file uploaded ❌');

    const contentBase64 = req.file.buffer.toString('base64');
    const branch = 'main';
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(targetPath)}`;

    const ghHeaders = {
      'Authorization': 'token ' + token,
      'User-Agent': 'gh-file-uploader',
      'Accept': 'application/vnd.github+json'
    };

    // Check if file exists
    let sha = null;
    const getResp = await fetch(apiUrl + '?ref=' + branch, { method: 'GET', headers: ghHeaders });
    if (getResp.status === 200) {
      const j = await getResp.json();
      sha = j.sha;
    }

    // Upload file
    const body = { message, content: contentBase64, branch };
    if (sha) body.sha = sha;

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const putJson = await putResp.json();
    if (!putResp.ok) return res.status(putResp.status).type('text').send('GitHub upload failed ❌');

    // Success message output
    const fileUrl = putJson.content?.url;
    return res.type('text').send(`${fileUrl} successfully ✔️`);
  } catch (err) {
    console.error(err);
    return res.status(500).type('text').send('Server Error ❌ ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));