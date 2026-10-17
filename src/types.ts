export type IdentityType = '在職青年' | '在學學生';

export type WorkoutType = '健走' | '戶外慢跑' | '跑步機' | '其他';

export type VerificationStatus = 'approved' | 'pending' | 'rejected';

export interface CheckInRecord {
  id: string;
  memberName: string;
  identity: IdentityType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (e.g. "20:30")
  workoutType: WorkoutType;
  durationMinutes: number;
  distanceKm: number;
  steps: number;
  calories: number;
  lineProofUrl: string; // Screenshot of LINE video meeting with camera on
  sportProofUrl: string; // Screenshot of Apple Watch / Garmin / Strava / Treadmill
  note: string; // Workout takeaway / feeling
  status: VerificationStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface WishItem {
  id: string;
  memberName: string;
  identity: IdentityType;
  wishName: string;
  category: '運動裝備' | '生活質感' | '數位3C' | '精神食糧' | '健康舒壓';
  estimatedPrice: number;
  reason: string;
  likesCount: number;
  createdAt: string;
}

export interface MemberStats {
  memberName: string;
  identity: IdentityType;
  avatarBg: string;
  totalValidCheckIns: number;
  totalPendingCheckIns: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  totalSteps: number;
  lastCheckInDate?: string;
  streakDays: number;
  rank?: number;
  wish?: WishItem;
}

export interface MemberProfile {
  name: string;
  identity: IdentityType;
  avatarBg: string;
}

export type MainNavigationTab = 'intro' | 'health' | 'activities' | 'join';

export type ActiveTab = 'checkin' | 'leaderboard' | 'wishlist' | 'personal' | 'admin' | 'green';

export type ActivityCategory = 
  | '生活禪與健走'
  | '青年培訓與研習'
  | '青年書院與讀書會'
  | '義工服務與蔬食'
  | '夜跑與運動團練'
  | '分團例會與法會';

export type ActivityNatureType = '總團活動' | '法寶寺道場活動' | '參加友團活動';

export type ActivityObjectiveType = 
  | '以文化弘揚佛法 / 以教育培養人才'
  | '以慈善福利社會'
  | '以共修淨化人心'
  | '聯誼活動'
  | '文化弘揚佛法'
  | '教育培養人才'
  | '慈善福利社會'
  | string;

export type ActivityLevelCategory =
  | '總團活動'
  | '道場活動'
  | '分團專案'
  | '友團活動'
  | '未歸類'
  | string;

export type ActivityNatureCategory =
  | '教育'
  | '文化'
  | '共修'
  | '慈善'
  | '聯誼'
  | '未歸類'
  | string;

export type ActivityObjectiveCategory =
  | '文化弘揚佛法'
  | '教育培養人才'
  | '慈善福利社會'
  | '共修淨化人心'
  | '聯誼活動'
  | '未歸類'
  | string;

export type ActivityStatus = 'completed' | 'upcoming' | 'featured';

export interface ActivityPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface ActivityRecordItem {
  id: string;
  title: string;
  category: ActivityCategory;
  levelCategory?: ActivityLevelCategory; // '分團活動' | '道場活動' | '總團活動' | '友團活動' | '未歸類'
  natureCategory?: ActivityObjectiveCategory; // '文化弘揚佛法' | '教育培養人才' | '慈善福利社會' | '共修淨化人心' | '聯誼活動' | '未歸類'
  activityNature?: string; // '總團活動' | '法寶寺道場活動' | '參加友團活動'
  activityObjective?: string; // '文化弘揚佛法' | '教育培養人才' | '慈善福利社會' | '聯誼活動'
  activityObjectives?: string[];
  date: string; // YYYY-MM-DD
  timeRange: string; // e.g. "09:00 ~ 16:30"
  location: string; // e.g. "佛光山法寶寺 / 新竹十八尖山"
  organizer: string; // "國際佛光會新竹青年分團"
  executingUnit?: string; // "新竹青年分團"
  guidingUnit: string; // "佛光山法寶寺"
  leadCadres: string[]; // e.g. ["周汶蔚", "徐信銓"]
  attendeeTotal: number;
  attendeeYouth: number;
  attendeeGuests: number;
  attendeeVolunteers: number;
  summary: string; // 活動主旨與目標
  processSchedule: string; // 流程紀要
  highlightsAndOutcomes: string; // 活動成效與亮點花絮
  reviewAndSuggestions: string; // PDCA 檢討與後續建議
  status: ActivityStatus;
  budgetNotes?: string;
  photos: ActivityPhoto[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  currentYear: string; // 例如 '2026'
  organizationName: string; // 例如 '國際佛光會中華佛光青年總團 / 新竹青年分團'
  subUnitName?: string; // 例如 '新竹青年歌詠隊'
  guidingUnit?: string; // 例如 '佛光山法寶寺'
  categories: string[]; // 活動分類自訂清單
  gasEndpointUrl?: string; // Google Apps Script Web App 端點
  lastCloudFileId?: string; // 最近儲存的 Google Drive 檔案 ID
  lastSyncedAt?: string; // 最後同步時間
}

export interface ProjectBackupPackage {
  version: string;
  savedAt: string;
  appConfig: AppConfig;
  activities: ActivityRecordItem[];
  slides: Slide[];
  selectedIds: string[];
  customBgUrl?: string;
  customLogoUrl?: string;
  themeId?: string;
  layoutMode?: string;
  reportTitle?: string;
  reportingUnit?: string;
  reportingPeriod?: string;
}

// ----------------------------------------------------
// Unified Single Source of Truth for PPT & Canva Studio
// ----------------------------------------------------
export interface SlideElement {
  id: string;
  type: 'text' | 'heading' | 'number_kpi' | 'shape' | 'badge' | 'sticker' | 'photo' | 'quote' | 'table' | 'media';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  w: number; // percentage 5 - 100
  h: number; // percentage 5 - 100
  content: string; // text content, emoji, photo/video url, or table summary
  title?: string; // secondary label (e.g. for stat card or photo caption)
  fontSize?: number; // 10 - 72
  fontFamily?: string; // font family name
  fontWeight?: 'normal' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
  shadow?: boolean;
  opacity?: number; // 0.1 to 1
  objectFit?: 'cover' | 'contain' | 'fill';
  mediaType?: 'image' | 'video';
  tableData?: string[][]; // Rows and columns for table element
  tableHeaderBg?: string;
  tableBorderColor?: string;
}

export interface SlideStyle {
  bgType?: 'solid' | 'gradient' | 'image';
  bgColor?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  bgOpacity?: number; // 0 to 1
  bgOverlay?: 'none' | 'dark' | 'light';
  textColor?: string;
  accentColor?: string;
}

export interface Slide {
  id: string;
  type: 'cover' | 'agenda' | 'category_divider' | 'activity' | 'summary' | 'thank_you' | 'custom_blank';
  title?: string;
  subtitle?: string;
  content?: string;
  category?: any;
  activity?: any;
  layoutMode: 'quad_photos' | 'dual_photos' | 'single_hero' | 'text_cards' | 'two_columns' | 'quote' | 'minimal';
  style?: SlideStyle;
  elements: SlideElement[];
}
