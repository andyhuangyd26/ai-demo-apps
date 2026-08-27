// api/generate.js
// 這支 function 部署在 Vercel 上，扮演前端與 Anthropic API 之間的中介層。
// 前端只會呼叫 /api/generate，不會直接碰到 Anthropic API 或你的金鑰。
// 金鑰只存在 Vercel 的環境變數（process.env.ANTHROPIC_API_KEY），不會被瀏覽器看到。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '只接受 POST 請求' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '伺服器尚未設定 ANTHROPIC_API_KEY，請到 Vercel 專案的 Environment Variables 設定' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: '缺少 prompt 內容' });
    return;
  }
  // 簡單防呆：避免有人塞超長字串狂打你的 API 額度
  if (prompt.length > 4000) {
    res.status(400).json({ error: 'prompt 過長' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('Anthropic API error:', data);
      res.status(upstream.status).json({ error: (data.error && data.error.message) || '上游 API 回應錯誤' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}
