export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey  = process.env.VERTEX_API_KEY;
  const project = process.env.VERTEX_PROJECT  || 'alexgemini2035-vertex-20260411';
  const location = process.env.VERTEX_LOCATION || 'us-central1';

  if (!apiKey) {
    return res.status(500).json({ error: 'VERTEX_API_KEY not configured on server.' });
  }

  const { model, payload } = req.body;
  if (!model || !payload) {
    return res.status(400).json({ error: 'Missing model or payload.' });
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

  // Debug: return endpoint info on first model attempt
  console.log('Calling:', endpoint);

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    // If failed, include endpoint in error for debugging
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ...data,
        _debug: { endpoint, project, location, model },
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed.', detail: err.message, _debug: { endpoint } });
  }
}
