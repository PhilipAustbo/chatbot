// api/ask.js

export default async function handler(req, res) {
    // Tillat kun POST-forespørsler
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    try {
      const { contents } = req.body;
  
      // Valider forespørselen
      if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid "contents" in request body' });
      }
  
      const apiKey = process.env.GOOGLE_API_KEY;
  
      // Sjekk at API-nøkkelen er satt
      if (!apiKey) {
        console.error("❌ Missing GOOGLE_API_KEY in environment");
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
  
      // Send forespørsel til Gemini API
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {    
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );
  
      const data = await geminiRes.json();
  
      // Håndter feil fra Gemini API
      if (!geminiRes.ok) {
        console.error('[Gemini API Error]', data);
        return res.status(502).json({ error: 'Gemini API error', details: data });
      }
  
      // Returner Gemini sitt svar
      return res.status(200).json(data);
    } catch (error) {
      // Intern feil
      console.error('[Server Error]', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
  