// Vercel Serverless Function — proxies prediction requests to Azure ML.
// This avoids CORS issues since the request to Azure ML happens server-side.
// Required env vars (set in Vercel dashboard): VITE_AZURE_ML_URL, VITE_AZURE_ML_KEY

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const azureUrl = process.env.VITE_AZURE_ML_URL;
  const azureKey = process.env.VITE_AZURE_ML_KEY;

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

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Failed to reach Azure ML endpoint' });
  }
}
