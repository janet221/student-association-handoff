import { archiveFolderLinks } from "@/lib/archive-folders";

export type WorkGroup = {
  id: string;
  name: string;
  icon: string;
  activities: { ordinal: number; name: string; driveUrl: string | null }[];
};

export const workGroups: WorkGroup[] = [
  { id: "president", name: "會長", icon: "✦", activities: [
    { ordinal: 0, name: "新生家長日", driveUrl: null },
    { ordinal: 2, name: "新生線上茶會", driveUrl: null },
    { ordinal: 3, name: "抽家族活動", driveUrl: null },
  ] },
  { id: "vice-president", name: "副會長", icon: "◇", activities: [] },
  { id: "secretary", name: "執秘", icon: "⌁", activities: [] },
  { id: "general-affairs", name: "總務", icon: "○", activities: [] },
  { id: "sports", name: "體育股", icon: "◌", activities: [
    { ordinal: 4, name: "系運", driveUrl: archiveFolderLinks["系運"] },
    { ordinal: 8, name: "商管盃", driveUrl: archiveFolderLinks["商管盃"] },
  ] },
  { id: "design", name: "美宣股", icon: "✿", activities: [] },
  { id: "equipment", name: "器材股", icon: "◇", activities: [] },
  { id: "activities", name: "活動股", icon: "♡", activities: [
    { ordinal: 1, name: "迎新", driveUrl: null },
    { ordinal: 5, name: "商管K", driveUrl: null },
    { ordinal: 6, name: "制服趴", driveUrl: null },
    { ordinal: 7, name: "聖誕趴", driveUrl: null },
  ] },
  { id: "information", name: "資訊股", icon: "⌁", activities: [
    { ordinal: 9, name: "電競週", driveUrl: null },
  ] },
];
