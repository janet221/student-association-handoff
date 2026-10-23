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

## Prisma 視覺風格

入口 `/login` 使用 `src/components/ui/prisma-hero.tsx`，沿用 Supabase 的登入、註冊與當屆交接資訊。`src/components/ui/demo.tsx` 提供元件使用範例，並未新增公開預覽路由。

- React 元件：`src/components/`；可重用 UI：`src/components/ui/`。
- 全域樣式及 Tailwind v4 主題：`src/app/globals.css`。
- TypeScript 路徑 `@/*` 對應 `src/*`，所以附件中的 `/components/ui` 在本專案應放在 `src/components/ui`。集中 UI 元件可維持 shadcn CLI、路徑別名與後續擴充的一致性。
- `components.json` 已設定 shadcn 的路徑；`src/lib/utils.ts` 提供標準 `cn()` 工具。
- 已有 TypeScript、Tailwind，無須重新初始化。取得程式後執行 `npm ci`，再以 `.env.example` 建立 `.env.local` 並填寫 Supabase 設定，執行 `npm run dev`。
- 新增依賴：`framer-motion`、`lucide-react`、`clsx`、`tailwind-merge`。日後新增 shadcn 元件可用 `npx shadcn@latest add button`。
- Hero 使用附件影片 URL，以及 Unsplash 的靜態背景。外部素材無法載入時保留綠色背景；減少動態效果模式停用影片，使用者也可手動暫停影片。對外發布前應確認素材持續可用及使用授權。
- Hero 的 `handoverLabel`、`error`、`message` 均由伺服器傳入，不需要額外 context 或全域狀態；登入與註冊沿用原本的 server actions。
