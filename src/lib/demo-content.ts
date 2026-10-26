export type DemoAnnouncement = {
  id: string;
  title: string;
  summary: string;
  content: string;
  scope: string;
  department: string;
  author_department: string;
  target_department: string;
  announcement_type: string;
  is_pinned: boolean;
  published_on: string;
  created_at: string;
  is_demo: true;
};

function dateString(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

export function createDemoAnnouncements(now = new Date()): DemoAnnouncement[] {
  const content = [
    ["系運籌備會議資料整理", "請體育股與活動股先確認場地、流程和人力需求。", "下次籌備會前，請各組把目前已確認的項目整理到共用資料夾，尚未決定的事項也請一併註記，方便會議時逐項確認。", "體育股", "活動股,器材股"],
    ["迎新活動視覺素材確認", "迎新主視覺初稿完成後，請相關單位協助檢視。", "美宣股整理主視覺與社群貼文尺寸，活動股確認文案和活動資訊，確認後再統一輸出各平台版本。", "美宣股", "活動股,資訊股"],
    ["器材借用清單更新", "請各組回報活動需要的器材與數量。", "請將器材名稱、數量、使用日期和預計歸還時間列在清單中。若有需要外借或維修的設備，也請備註目前狀況。", "器材股", "體育股,活動股"],
    ["社群貼文排程確認", "近期活動資訊請在發布前完成文字與日期校對。", "請各組將已核對的活動名稱、時間、地點和報名方式提供給美宣股，避免不同平台出現不一致的資訊。", "資訊股", "美宣股"],
    ["場地勘查紀錄補充", "勘查後請留下照片、動線與設備備註。", "場地勘查資料請包含入口、電源、桌椅配置和雨天備案。照片可直接上傳資料夾，並在檔名註明場地與日期。", "活動股", "總務,器材股"],
    ["年度預算資料彙整", "請各組整理本學期預估支出與已取得的報價。", "預算資料請列出品項、數量、單價與用途。若尚未取得報價，先註明預估金額和待確認事項。", "總務", "各股"],
    ["系運宣傳需求盤點", "整理宣傳時程、素材規格與現場公告需求。", "此為畫面示範公告。實際活動宣傳內容、日期及規格請以承辦單位後續確認的資訊為準。", "體育股", "美宣股,資訊股"],
    ["會議紀錄上傳提醒", "請將本週會議決議和待辦事項放入共用資料夾。", "紀錄中請標註決議內容、負責單位和預計完成時間。尚未有結論的討論事項可以保留簡短備註。", "執秘", "各股"],
    ["活動當日人力安排", "請承辦組確認報到、場佈與撤場時段的人力。", "請先列出工作時段、工作內容和需要的人數，再與相關單位確認可支援時段。這則內容僅供版面展示。", "活動股", "體育股,器材股"],
    ["交接資料命名整理", "請依活動名稱與年份整理文件名稱，方便後續查找。", "建議檔名包含活動名稱、文件用途和年份；同一活動的流程、預算和成果照片可分資料夾整理。此為展示用公告，不代表正式交辦。", "副會長", "執秘,總務"],
  ] as const;
  return content.map(([title, summary, body, department, target], index) => {
    const published = new Date(now);
    published.setDate(published.getDate() - index);
    const day = dateString(published);
    return {
      id: "demo-announcement-" + String(index + 1).padStart(2, "0"),
      title,
      summary,
      content: body,
      scope: "all",
      department,
      author_department: department,
      target_department: target,
      announcement_type: index === 0 || index === 6 ? "collaboration" : "notice",
      is_pinned: false,
      published_on: day,
      created_at: day + "T09:00:00.000Z",
      is_demo: true,
    };
  });
}

export function createDemoActivity(now = new Date()) {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const activityDate = new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 2, lastDay));
  return {
    id: "demo-activity-department-sports-day",
    name: "系運",
    department: "體育股",
    description: "展示用活動：查看系運籌備、宣傳與器材協作資訊。正式活動日期及內容請以承辦單位公告為準。",
    activity_date: dateString(activityDate),
    activity_end_date: dateString(activityDate),
    status: "planning",
    is_demo: true as const,
  };
}
