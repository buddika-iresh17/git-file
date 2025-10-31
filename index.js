const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
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
    .small{width:auto;display:inline-block}
  </style>
</head>
<body>
  <h2>GitHub File Uploader</h2>
  <p>Upload a file to a GitHub repository using a Personal Access Token (PAT).</p>

  <form id="frm">
    <label>GitHub Token (PAT)</label>
    <input id="token" name="token" placeholder="ghp_..." required>

    <label>Owner (username or organization)</label>
    <input id="owner" name="owner" placeholder="your-username" required>

    <label>Repository name</label>
    <input id="repo" name="repo" placeholder="repo-name" required>

    <label>Target path in repo (e.g. folder/file.txt)</label>
    <input id="targetPath" name="targetPath" placeholder="uploads/myfile.txt" required>

    <label>Commit message</label>
    <input id="message" name="message" placeholder="Add file from web uploader" required>

    <label>Choose file</label>
    <input id="file" type="file" required>

    <div style="margin-top:12px">
      <button type="submit">Upload to GitHub</button>
    </div>
  </form>

  <pre id="out" style="margin-top:16px; white-space:pre-wrap; background:#f6f8fa; padding:12px;border-radius:6px"></pre>

  <script>
    const frm = document.getElementById('frm');
    const out = document.getElementById('out');

    frm.addEventListener('submit', async (e) => {
      e.preventDefault();
      out.textContent = 'Uploading...';

      const token = document.getElementById('token').value.trim();
      const owner = document.getElementById('owner').value.trim();
      const repo = document.getElementById('repo').value.trim();
      const targetPath = document.getElementById('targetPath').value.trim();
      const message = document.getElementById('message').value.trim();
      const fileInput = document.getElementById('file');
      if (!fileInput.files.length) return alert('Choose a file');

      const fd = new FormData();
      fd.append('token', token);
      fd.append('owner', owner);
      fd.append('repo', repo);
      fd.append('targetPath', targetPath);
      fd.append('message', message);
      fd.append('file', fileInput.files[0]);

      try {
        const resp = await fetch('/upload', { method: 'POST', body: fd });
        const j = await resp.json();
        out.textContent = JSON.stringify(j, null, 2);
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
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const contentBase64 = req.file.buffer.toString('base64');
    const branch = 'main'; // Change if your repo uses another branch
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(targetPath)}`;

    const ghHeaders = {
      'Authorization': 'token ' + token,
      'User-Agent': 'gh-file-uploader-demo',
      'Accept': 'application/vnd.github+json'
    };

    // Check if file already exists to update
    let sha = null;
    const getResp = await fetch(apiUrl + '?ref=' + branch, { method: 'GET', headers: ghHeaders });
    if (getResp.status === 200) {
      const j = await getResp.json();
      sha = j.sha;
    }

    const body = { message, content: contentBase64, branch };
    if (sha) body.sha = sha;

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const putJson = await putResp.json();
    if (!putResp.ok) return res.status(putResp.status).json({ ok: false, error: putJson });

    return res.json({ ok: true, result: putJson });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));