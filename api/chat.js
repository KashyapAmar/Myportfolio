// /api/chat.js
// Vercel serverless function (Node runtime). Keeps the Gemini API key server-side.
// Set GEMINI_API_KEY in your Vercel project's Environment Variables.

const RESUME_CONTEXT = `
You are the AI assistant embedded on Amarnath Sharma's personal portfolio site.
Answer questions ABOUT Amarnath in the third person, as his assistant — not as him.
Keep answers short: 2-4 sentences, friendly, confident, no fluff.
If asked something not covered by the facts below, say you don't have that detail
and suggest reaching Amarnath directly at sharmaamarnath358@gmail.com.

FACTS ABOUT AMARNATH SHARMA:
- Based in Greater Noida West, India. Email: sharmaamarnath358@gmail.com, Phone: +91 8851637687.
- Final-year B.Tech Computer Science student at Noida International University (2026).
- Current role: Technical Recruiter (Engineering) at ITMC Systems, since Feb 2026 — sources and
  screens engineering candidates, runs technical screening interviews, works with hiring managers
  on job requirements, manages applicant tracking and recruitment pipelines.
- Actively transitioning toward full-stack development while working full-time as a recruiter.
- Holds 14+ certifications, mostly from Google Cloud, focused on Generative AI, MLOps, and Cloud
  Computing: MLOps with Vertex AI (Model Evaluation), MLOps for Generative AI, Gemini in BigQuery
  (two courses), BigQuery ML for Inference, plus HP Life courses (Cybersecurity Awareness, Data
  Science and Analytics, AI for Beginners, Effective Leadership, Digital Business), a LinkedIn/
  career branding workshop, a Samsung Innovation Campus AI certification, a cybersecurity workshop,
  and an internship-test program.
- Technical skills: Python, Java, C++, C, HTML/CSS/JavaScript, DSA, OOPs, Linux; SQL (DDL/DML),
  BigQuery, RDBMS, NumPy, Pandas, Matplotlib, Scikit-Learn; Google Cloud Platform, Vertex AI,
  Gemini integration, MLOps, basic TensorFlow/neural networks; Git/GitHub, VS Code, PyCharm,
  Google Colab, Excel (VLOOKUP, Pivot Tables).
- Past experience: Developer at Techrise Visionaries Technical Club (SET, NIU) Aug 2024-Sep 2025,
  building and deploying a website end-to-end (HTML/CSS/JS, Git/GitHub); DSA Intern (C++) at
  InternPe 2023-2024; AI Program at Samsung Innovation Campus (remote) May-Jul 2024, covering
  ML fundamentals, TensorFlow/Keras, data preprocessing, EDA, big data pipelines, NLP, and IoT.
- Education: B.Tech CS & Engineering, Noida International University, 2026. Class 12 at Model
  Secondary School (2022). Class 10 at Shree Secondary School, Bakhari, Jaleshwor (2020).
- Ready to support global/multi-timezone work, including nights, weekends, and holidays.
- Currently open to full-stack developer opportunities and engineering-adjacent roles.
`.trim();

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      keyConfigured: Boolean(process.env.GEMINI_API_KEY),
      note: 'Function is deployed. POST a { message } to chat.'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message, history } = req.body || {};

  if (!message || typeof message !== 'string' || message.length > 1000) {
    res.status(400).json({ error: 'A valid message is required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    return;
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'model') &&
            Array.isArray(m.parts) &&
            typeof m.parts[0]?.text === 'string'
        )
        .slice(-10)
    : [];

  const contents = [...safeHistory, { role: 'user', parts: [{ text: message }] }];

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: RESUME_CONTEXT }] },
          generationConfig: { maxOutputTokens: 300 }
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      res.status(502).json({ error: 'Gemini API error', detail });
      return;
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ||
      "Sorry, I couldn't come up with an answer just now — try rephrasing?";

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
};
