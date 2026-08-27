// api/mlb.js
// MLB Stats API 的中介層（statsapi.mlb.com 是公開 API，不需要金鑰）。
// 前端呼叫 /api/mlb?path=...，由這裡轉發，避免 CORS 問題並可加上快取。
// 只允許查詢球員相關的端點，避免被當成萬用 proxy 濫用。

const ALLOWED_PATHS = [
  /^people\/search$/,          // 球員名字搜尋
  /^people\/\d+$/,             // 單一球員基本資料
  /^people\/\d+\/stats$/,      // 球員數據（season / lastXGames / vsPlayerTotal…）
  /^schedule$/,                // 當日賽程、先發投手、確認打線
  /^teams\/\d+\/roster$/       // 球隊現役名單（打線未公布時的備援）
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: '只接受 GET 請求' });
    return;
  }

  const { path, ...params } = req.query || {};
  if (!path || typeof path !== 'string' || !ALLOWED_PATHS.some(re => re.test(path))) {
    res.status(400).json({ error: '不允許的查詢路徑' });
    return;
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && v.length <= 200) qs.set(k, v);
  }

  try {
    const upstream = await fetch(
      'https://statsapi.mlb.com/api/v1/' + path + (qs.toString() ? '?' + qs.toString() : '')
    );
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'MLB API 回應錯誤 (' + upstream.status + ')' });
      return;
    }
    const data = await upstream.json();
    // CDN 快取 5 分鐘，減少重複查詢
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (err) {
    console.error('MLB proxy error:', err);
    res.status(500).json({ error: '無法取得 MLB 數據，請稍後再試' });
  }
}
