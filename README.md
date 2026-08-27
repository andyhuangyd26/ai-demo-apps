# 部署說明

這個資料夾裡有兩個 demo（`index.html` = 今日打者 VS 先發投手、`tripcard.html` = 行程卡 TripCard AI demo），
和兩支後端 proxy：

- `api/mlb.js`：轉發公開的 MLB Stats API（statsapi.mlb.com，免金鑰）。`index.html` 靠它抓
  今天的賽程與先發投手、賽前公布的確認打線（若還沒公布則退而求其次列出該隊現役野手），
  以及每位打者對這位投手的生涯對戰數據。這個頁面純粹讀真實數據，不會呼叫 Anthropic API。
- `api/generate.js`：前端不會直接呼叫 Anthropic API，而是呼叫你自己的 `/api/generate`，
  由這支 function 用你的金鑰去問 AI，金鑰不會出現在瀏覽器裡。目前只有 `tripcard.html`
  在用這支（行程規劃）；如果之後想幫「今日打者 VS 先發投手」加上 AI 一句話重點分析，
  也可以直接沿用這支 proxy。

## 你需要準備

1. 一個 Anthropic API Key
   到 https://console.anthropic.com/settings/keys 建立一組新的 key（帳號需要先加值一點額度，
   免費額度用完後是照 token 用量計費）
2. 一個 GitHub 帳號
3. 一個 Vercel 帳號（可以直接用 GitHub 登入，不用另外註冊）

## 部署步驟

### 1. 把這個資料夾傳到 GitHub

```bash
cd 這個資料夾的路徑
git init
git add .
git commit -m "first commit"
gh repo create ai-demo-apps --public --source=. --push
```
（沒有裝 `gh` CLI 的話，也可以直接在 github.com 手動新增一個 repo，再把這個資料夾內容上傳）

### 2. 到 Vercel 匯入這個 repo

- 到 https://vercel.com/new
- 選擇剛剛那個 GitHub repo
- Framework Preset 選 "Other"（因為這不是 Next.js/Vue 專案，是純靜態檔案 + serverless function）
- 先不要按 Deploy，往下滑到 Environment Variables

### 3. 設定環境變數

在 "Environment Variables" 欄位新增一筆：

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | 你剛剛在 Anthropic Console 建立的那組 key |

這一步是重點：金鑰只存在這裡，不會進到你的程式碼或 git repo 裡。

### 4. Deploy

按下 Deploy，等大約 30 秒到 1 分鐘。完成後 Vercel 會給你一個網址，
長得像 `https://ai-demo-apps-xxxx.vercel.app`。

打開這個網址就會看到今天的 MLB 賽程與先發投手，點一位投手就能看到對方打者的對戰數據。
如果想看 TripCard（AI 行程規劃），網址後面加 `/tripcard.html`，測試時記得確認能收到 AI 回應。

### 5.（可選）本機測試

```bash
npm install -g vercel
cp .env.example .env.local   # 把 .env.local 裡的金鑰換成真的
vercel dev
```
會在 `localhost:3000` 開一個跟正式環境一樣的測試環境。

## 部署後要注意的事

- **這個連結是公開的**，任何拿到連結的人都能按按鈕呼叫你的 API、花你帳號的額度。
  `api/generate.js` 裡已經限制了 `max_tokens: 1000` 和 prompt 長度上限，
  但如果連結被大量濫用還是會有費用。建議去 Anthropic Console 設定一個每月花費上限
  （Settings → Limits），這樣最多就是頂到那個上限，不會無上限扣款。
- 如果之後不想公開了，直接到 Vercel 專案設定裡按 "Delete Project" 就會整個關掉。
