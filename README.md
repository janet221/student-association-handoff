# 系學會跨屆工作交接系統

讓上一屆留下的活動工作流程，能直接成為本屆可執行、可修改並可再次傳承的起點。

## 技術架構

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase（後續階段設定）
- Vercel（完成核心流程後部署）

## 開發階段

目前完成專案初始化。下一階段將建立 Supabase Project、版本化資料庫 Migration 與 Email／Password Authentication。

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
