# 系學會跨股協作與換屆交接平台

把本屆活動、跨股協作、共同日期與換屆交接資料放在同一個工作空間，讓會長看得到全會進度，也讓各股知道彼此的活動安排。

## 技術架構

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase（登入、活動與交接資料）
- Vercel（正式部署）

## 開發階段

目前包含本屆工作、歷屆交接、共同月曆、跨股協作請求與公告欄。資料庫變更都放在 `supabase/migrations`，部署前請依序套用 migration。

## 開始開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 環境變數

複製 `.env.example` 為 `.env.local`，並在本機填入 Supabase Project 的公開連線資訊。不要提交 `.env.local`。

## 常用指令

```bash
npm run dev
npm run lint
npm run build
```
