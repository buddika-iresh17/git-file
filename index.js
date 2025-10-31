// index.js
const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch'); // node-fetch v2
const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// RGB styled HTML uploader with full Sinhala Help instructions
app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>GitHub File Uploader</title>
<style>
  body {
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    background: #0d1117;
    color: #c9d1d9;
    padding: 30px;
    text-align: center;
  }
  h1 {
    font-size: 2em;
    background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: rgbFlow 3s linear infinite;
    background-size: 400%;
  }
  @keyframes rgbFlow {
    0% { background-position: 0%; }
    100% { background-position: 400%; }
  }
  form {
    margin-top: 30px;
    background: #161b22;
    padding: 20px;
    border-radius: 10px;
    display: inline-block;
    text-align: left;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 0 10px rgba(255,255,255,0.1);
  }
  label {
    display: block;
    margin: 12px 0 6px;
    font-weight: 600;
  }
  input, button {
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    border: none;
    margin-bottom: 8px;
  }
  input {
    background: #0d1117;
    color: #fff;
    border: 1px solid #30363d;
  }
  button {
    background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
    color: #000;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
  }
  button:hover {
    filter: brightness(1.2);
  }
  pre {
    background: #161b22;
    color: #58a6ff;
    padding: 15px;
    border-radius: 10px;
    white-space: pre-wrap;
    word-break: break-word;
    text-align: left;
  }
  a {
    color: #58a6ff;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  footer {
    margin-top: 30px;
    color: #8b949e;
    font-size: 14px;
  }
  #helpText {
    display: none;
    background:#161b22;
    color:#58a6ff;
    padding:15px;
    border-radius:10px;
    margin-bottom:20px;
    text-align:left;
  }
</style>
</head>
<body>
<h1>🌈 GitHub File Uploader</h1>

<form id="frm">

  <button type="button" id="helpBtn" style="margin-bottom:15px;">
    ❓ Help
  </button>

  <div id="helpText">
    <h3>GitHub File Upload Instructions</h3>
    <ol>
      <li><b>GitHub Token (PAT)</b> ලබාගැනීම:  
        <ol type="a">
          <li>GitHub වෙත log in වන්න.</li>
          <li>Settings → Developer settings → Personal access tokens → Tokens (classic) යන්න.</li>
          <li>“Generate new token” click කරන්න.</li>
          <li>Required scopes: <b>repo</b> select කරන්න.</li>
          <li>Token එක copy කරගෙන පහළ GitHub Token field එකට paste කරන්න.</li>
        </ol>
      </li>
      <li><b>Owner</b> = ඔබේ GitHub username දාන්න.</li>
      <li><b>Repository</b> = Upload කරන්න ඕන repo එකේ නම දාන්න.</li>
      <li><b>Target Path</b> = Repo තුළ file save වන්නේ කොහෙද කියලා (උදා: src/index.js).</li>
      <li><b>Commit Message</b> = File එක upload කිරීමේ message එක දාන්න (උදා: Add file).</li>
      <li><b>File Choose</b> = Upload කරන්න ඕන file එක select කරන්න.</li>
      <li>සියල්ල සම්පූර්ණයි නම් “🚀 GitHub ට Upload කරන්න” button එක click කරන්න.</li>
    </ol>
  </div>

  <label>GitHub Token (PAT) *</label>
  <input id="token" name="token" placeholder="ghp_..." required>

  <label>Owner (ඔබේ GitHub username) *</label>
  <input id="owner" name="owner" placeholder="your-username" required>

  <label>Repository (repo-name) *</label>
  <input id="repo" name="repo" placeholder="repo-name" required>

  <label>Target path in repo (උදා: src/index.js) *</label>
  <input id="targetPath" name="targetPath" placeholder="src/index.js" required>

  <label>Commit message *</label>
  <input id="message" name="message" placeholder="Add file" required>

  <label>Choose file *</label>
  <input id="file" type="file" required>

  <button type="submit">
    🚀 GitHub ට Upload කරන්න
  </button>
</form>

<pre id="out" style="margin-top:20px;"></pre>

<footer>Developer by <span style="background:linear-gradient(90deg,red,orange,yellow,green,cyan,blue,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold;">manaofc</span> ©2025</footer>

<script>
const frm = document.getElementById('frm');
const out = document.getElementById('out');
const helpBtn = document.getElementById('helpBtn');
const helpText = document.getElementById('helpText');

helpBtn.addEventListener('click', () => {
  helpText.style.display = helpText.style.display === 'none' ? 'block' : 'none';
});

frm.addEventListener('submit', async (e) => {
  e.preventDefault();
  out.textContent = 'Uploading... ⏳';

  const fd = new FormData(frm);
  const fileInput = document.getElementById('file');
  if (!fileInput.files.length) return alert('Choose a file');
  fd.append('file', fileInput.files[0]);

  try {
    const resp = await fetch('/upload', { method: 'POST', body: fd });
    const text = await resp.text();
    out.innerHTML = text;
  } catch (err) {
    out.textContent = '❌ Error: ' + err.message;
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

    // Upload or update
    const body = { message, content: contentBase64, branch };
    if (sha) body.sha = sha;

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const putJson = await putResp.json();
    if (!putResp.ok) return res.status(putResp.status).type('text').send('GitHub upload failed ❌');

    const fileHtmlUrl = putJson.content?.html_url;
    return res.type('html').send(`<a href="${fileHtmlUrl}" target="_blank">${fileHtmlUrl}</a>\n\nsuccessfully✔️`);
  } catch (err) {
    console.error(err);
    return res.status(500).type('text').send('Server Error ❌ ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌈 RGB GitHub Uploader running at http://localhost:${PORT}`));