// api/ask.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing GOOGLE_API_KEY");
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  const { contents } = req.body;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', data);
      return res.status(502).json({ error: 'Gemini API Error', details: data });
    }

    res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
