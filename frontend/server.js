import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Serve static Vite build files
app.use(express.static(path.join(__dirname, 'dist')));

// Secure server-side proxy endpoint
app.post('/api/score', async (req, res) => {
  const azureUrl = process.env.AZURE_ML_URL;
  const azureKey = process.env.AZURE_ML_KEY;

  if (!azureUrl || !azureKey) {
    return res.status(500).json({ error: 'Azure ML credentials not configured on server' });
  }

  try {
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${azureKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: 'Failed to reach Azure ML endpoint' });
  }
});

// Fallback all other requests to SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
