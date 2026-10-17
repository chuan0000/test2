import { ActivityRecordItem } from '../types';

export const INITIAL_ACTIVITIES: ActivityRecordItem[] = [
  {
    id: 'act-2026-001',
    title: '新竹區青年團戶外生活禪古道行 ✕ 森林正念步道',
    category: '生活禪與健走',
    date: '2026-07-18',
    timeRange: '08:30 ~ 15:30',
    location: '新竹十八尖山森林步道 ✕ 佛光山法寶寺禪堂',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', '徐信銓'],
    attendeeTotal: 32,
    attendeeYouth: 24,
    attendeeGuests: 4,
    attendeeVolunteers: 4,
    summary: '透過戶外生活禪古道行，引導青年放下手機與都市忙碌步伐，在山林漫步中結合觀呼吸與正念步伐，達到身心紓壓、降低焦慮並體驗茶禪一味。',
    processSchedule: '08:30 法寶寺集合出發 ➔ 09:00 十八尖山登山口起走（行禪慢步）➔ 10:30 山頂觀景平台「森林正念坐禪」➔ 12:00 戶外健康素齋野餐 ➔ 13:30 茶禪一味心靈座談 ➔ 15:00 圓滿祈願與大合照',
    highlightsAndOutcomes: '1. 青年全體完成 5.8 公里山林行禪與正念健走。\n2. 透過法師引導「步步分明、步步安心」禪修心法，青年反饋在日常工作與學業緊繃中獲得深度放鬆。\n3. 活動滿意度達 98.5%，多位初次參與青年表達加入分團意願。',
    reviewAndSuggestions: '1. 下次可提早發放防蚊防曬用品清單。\n2. 茶禪分享時間可再延長 20 分鐘，讓更多在職青年有充裕時間抒發心靈心得。',
    status: 'completed',
    budgetNotes: '活動總支出 NT$ 4,850（包含素食輕食餐盒、茶席物料與大眾保險）',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        caption: '十八尖山森林步道中進行正念行禪與觀呼吸'
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
        caption: '法寶寺禪堂進行茶禪一味心得回饋座談'
      },
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
        caption: '全體青年團員與輔導法師於綠意森林中圓滿大合照'
      }
    ],
    tags: ['生活禪', '十八尖山', '正念健走', '茶禪一味'],
    createdAt: '2026-07-19 10:00',
    updatedAt: '2026-07-19 10:00'
  },
  {
    id: 'act-2026-002',
    title: '「佛光心．主持力」青年口語表達與司儀主持培訓營',
    category: '青年培訓與研習',
    date: '2026-05-23',
    timeRange: '09:00 ~ 17:00',
    location: '佛光山法寶寺 三樓多功能會議廳',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', 'Dicky'],
    attendeeTotal: 28,
    attendeeYouth: 22,
    attendeeGuests: 3,
    attendeeVolunteers: 3,
    summary: '邀請廣播電台資深知名 DJ 與資深團務幹部，針對活動主持結構、台風應變、現場突發狀況化解及聲音表情等核心技能，進行全方位實戰培訓。',
    processSchedule: '09:00 報到相見歡 ➔ 09:30 主持人的內功心法：佛光精神與親和力 ➔ 11:00 廣播 DJ 實戰口語表達拆解 ➔ 12:00 齋堂創意午餐 ➔ 13:30 分組模擬主持演練（法會司儀/營隊晚會/座談對談）➔ 15:30 導師一對一點評 ➔ 16:30 頒發結業證書',
    highlightsAndOutcomes: '1. 22 位青年學員全數上台完成 3 分鐘即席模擬主持，有效克服上台緊張心理。\n2. 成功建立新竹青年主持人才庫，培育出 8 位具備大型活動與讀書會主持能力之種子幹部。\n3. 錄製青年上台影音作為個人自我覆盤教材，成效深獲法師肯定。',
    reviewAndSuggestions: '1. 模擬主持錄影設備收音可再加強麥克風配置。\n2. 可於下半年安排進階「活動企劃與即興對談」專題延續學習力道。',
    status: 'completed',
    budgetNotes: '活動總支出 NT$ 6,200（包含講師車馬費、結業手冊與茶點）',
    photos: [
      {
        id: 'p-4',
        url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
        caption: '專業講師指導青年聲音表情與台風站姿'
      },
      {
        id: 'p-5',
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        caption: '青年分組進行現場即席主持模擬演練'
      }
    ],
    tags: ['主持力', '口語表達', '青年培訓', '法寶寺'],
    createdAt: '2026-05-24 11:20',
    updatedAt: '2026-05-24 11:20'
  },
  {
    id: 'act-2026-003',
    title: '孝道月創意蔬食推廣 ✕ 青年手作植物肉漢堡結緣服務',
    category: '義工服務與蔬食',
    date: '2026-08-15',
    timeRange: '10:00 ~ 14:30',
    location: '佛光山法寶寺 大寮 ✕ 滴水坊前廣場',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['徐信銓', '林雅婷'],
    attendeeTotal: 45,
    attendeeYouth: 20,
    attendeeGuests: 5,
    attendeeVolunteers: 20,
    summary: '藉由農曆七月孝道月，青年分團以創新視角翻轉傳統素食印象，親手研發植物肉蔬食漢堡、無酒精特調水果氣泡飲，供養信眾並推動環保低碳愛地球。',
    processSchedule: '10:00 大寮備料與烹飪分工 ➔ 11:30 現煎植物肉漢堡組裝與包裝 ➔ 12:00 供養大眾與法寶寺信眾結緣 ➔ 13:00 青年蔬食心得交流 ➔ 14:00 大寮環境出坡善後',
    highlightsAndOutcomes: '1. 共製作並發放 180 份手作特色蔬食漢堡套餐，現場迴響極為熱烈，半小時內全數結緣完畢。\n2. 融入碳足跡宣導看板，說明一份植物肉漢堡比傳統牛肉漢堡減少約 89% 溫室氣體排放。\n3. 增進青年烹飪技能與在大寮出坡作務之團結默契。',
    reviewAndSuggestions: '1. 出餐動線可增設一條快速領取通道，縮短排隊等待時間。\n2. 備料份數下次可擴增至 220 份以因應踴躍索取需求。',
    status: 'featured',
    budgetNotes: '活動總支出 NT$ 7,500（材料費由青年團務基金及信徒發心贊助）',
    photos: [
      {
        id: 'p-6',
        url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        caption: '青年親手研發之特色手作植物肉蔬食漢堡'
      },
      {
        id: 'p-7',
        url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
        caption: '青年於法寶寺大寮熱情投入出坡與備料製作'
      }
    ],
    tags: ['創意蔬食', '孝道月', '結緣供養', '低碳減碳'],
    createdAt: '2026-08-16 09:30',
    updatedAt: '2026-08-16 09:30'
  },
  {
    id: 'act-2026-004',
    title: '法寶青年書院秋季班開學典禮 ✕ 生活美學與經典導讀',
    category: '青年書院與讀書會',
    date: '2026-10-12',
    timeRange: '14:00 ~ 17:30',
    location: '佛光山法寶寺 二樓雲水書坊',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', '曾芳瑜'],
    attendeeTotal: 35,
    attendeeYouth: 28,
    attendeeGuests: 4,
    attendeeVolunteers: 3,
    summary: '法寶青年書院秋季班正式啟航，結合生活美學、花藝心靈覺察與《金剛經》的生活實踐智慧，提供青年在緊湊步調中充電沈澱的知性成長場域。',
    processSchedule: '14:00 始業式與住持法師開示 ➔ 14:30 正念插花與生活美學手作 ➔ 15:45 經典導讀：在工作中安住身心的智慧 ➔ 16:45 青年分組座談與共讀反思 ➔ 17:30 賦歸',
    highlightsAndOutcomes: '1. 秋季班共吸引 28 位青年正式註冊就讀，出席率達 100%。\n2. 融合手作美學與佛學對話，創造活潑無壓力的學習氛圍，深獲年輕世代共鳴。\n3. 成立線上共讀 LINE 班群，定期分享每日正念法語與生活實踐。',
    reviewAndSuggestions: '1. 花藝素材可備用多套以供現場旁聽學員體驗。\n2. 分組討論時間建議固定指定小組長帶領發言，引導害羞學員分享。',
    status: 'completed',
    budgetNotes: '活動支出 NT$ 5,300（花藝教材、經典講義與茶點）',
    photos: [
      {
        id: 'p-8',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        caption: '青年書院學員專注進行生活美學與經典共讀交流'
      },
      {
        id: 'p-9',
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
        caption: '透過生活美學手作體會專注與平靜心境'
      }
    ],
    tags: ['法寶青年書院', '生活美學', '金剛經', '心靈讀書會'],
    createdAt: '2026-10-13 14:00',
    updatedAt: '2026-10-13 14:00'
  },
  {
    id: 'act-2026-005',
    title: '2027 青年健走跑步健康打卡誓師大會 ✕ 雲端夜跑啟動會',
    category: '夜跑與運動團練',
    date: '2026-11-05',
    timeRange: '19:30 ~ 21:30',
    location: '佛光山法寶寺前廣場 ✕ 新竹護城河親水公園',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['徐信銓', '周汶蔚', 'Dicky'],
    attendeeTotal: 42,
    attendeeYouth: 34,
    attendeeGuests: 4,
    attendeeVolunteers: 4,
    summary: '為凝聚分團健康運動風氣與推動地球減碳，舉辦 2027 健走跑步打卡計畫誓師大會，現場實測 Google Meet 雲端開鏡視訊與智慧手錶雙軌打卡系統，帶領青年夜跑護城河。',
    processSchedule: '19:30 誓師集結與暖身拉筋操 ➔ 19:50 說明每週二四夜跑機制與許願池激勵辦法 ➔ 20:10 新竹護城河 3.5km 夜跑團練啟程 ➔ 20:50 抵達終點法寶寺廣場與雙軌打卡連線實測 ➔ 21:15 圓滿回向與發放運動能量補給',
    highlightsAndOutcomes: '1. 現場 34 位青年全數完成 3.5 km 夜跑，點燃團結運動熱情。\n2. 成功宣導「綠色生活步步留」低碳代步理念，每人當日減碳 0.192 kg CO₂e。\n3. 正式啟動線上許願池與即時排行榜，團員設定年度運動目標意願高昂。',
    reviewAndSuggestions: '1. 夜跑路線轉角處應增派配速與交管志工引導。\n2. 提供反光手環給所有夜跑團員，提升夜間道路識別安全性。',
    status: 'featured',
    budgetNotes: '活動支出 NT$ 3,600（夜跑反光手環、運動飲料與香蕉能量補給）',
    photos: [
      {
        id: 'p-10',
        url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
        caption: '青年團員於護城河畔熱血展開 3.5km 夜跑團練'
      },
      {
        id: 'p-11',
        url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80',
        caption: '現場測試智慧手錶與視訊連線雙軌核驗打卡'
      }
    ],
    tags: ['2027打卡計畫', '夜跑團練', '護城河', '綠色減碳'],
    createdAt: '2026-11-06 09:00',
    updatedAt: '2026-11-06 09:00'
  },
  {
    id: 'act-2025-001',
    title: '2025年新竹佛光青年分團幹部交接授證典禮 ✕ 青年幹部共識營',
    category: '分團例會與法會',
    date: '2025-01-18',
    timeRange: '09:30 ~ 16:30',
    location: '佛光山法寶寺 大雄寶殿 ✕ 三樓會議廳',
    organizer: '國際佛光會中華佛光青年總團 / 新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', '徐信銓', '林雅婷'],
    attendeeTotal: 38,
    attendeeYouth: 30,
    attendeeGuests: 5,
    attendeeVolunteers: 3,
    summary: '2025年度新任幹部團隊正式宣誓就職，法寶寺監寺法師親臨授證並開示「做自己的貴人」，凝聚分團青年向心力，並規劃全年度五大核心專案發展藍圖。',
    processSchedule: '09:30 報到相見歡 ➔ 10:00 授證宣誓典禮與法師開示 ➔ 11:30 幹部感恩交接與薪火相傳 ➔ 12:00 養生素齋午宴 ➔ 13:30 2025年度專案策略激盪工作坊 ➔ 15:30 團隊凝聚破冰與圓滿大合照',
    highlightsAndOutcomes: '1. 完成新舊任幹部交接，確立 2025 年度活動主軸「三好實踐．青年跨界」。\n2. 幹部全員簽署「三好青年承諾書」，確立團務分工機制。\n3. 會後滿意度調查達 99%，青年幹部士氣高昂。',
    reviewAndSuggestions: '1. 工作坊時間略顯緊湊，後續可規劃兩天一夜深化凝聚。\n2. 可提前建立年度活動行事曆共享行事曆。',
    status: 'completed',
    budgetNotes: '活動支出 NT$ 5,600（授證聘書、共識手冊、茶點物料）',
    photos: [
      {
        id: 'p-2025-1',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        caption: '全體新任幹部與輔導法師於大雄寶殿前圓滿授證合影'
      },
      {
        id: 'p-2025-2',
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        caption: '幹部共識營分組研討年度專案與執行期程'
      }
    ],
    tags: ['幹部授證', '共識營', '法寶寺', '交接典禮'],
    createdAt: '2025-01-19 10:00',
    updatedAt: '2025-01-19 10:00'
  },
  {
    id: 'act-2025-002',
    title: '2025年三好兒童冬令營青年隊輔培訓營 ✕ 團康帶領與活動引導',
    category: '青年培訓與研習',
    date: '2025-02-08',
    timeRange: '08:30 ~ 17:30',
    location: '佛光山法寶寺 二樓雲水書坊',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', '曾芳瑜'],
    attendeeTotal: 26,
    attendeeYouth: 22,
    attendeeGuests: 2,
    attendeeVolunteers: 2,
    summary: '為即將登場的三好兒童冬令營培育優質青年隊輔，課程涵蓋兒童心理溝通、三好故事引導、安全防護守則及生動活潑的團康歌曲律動。',
    processSchedule: '08:30 報到相見歡 ➔ 09:00 隊輔的第一堂課：兒童身心特質與溝通 ➔ 10:30 破冰團康實戰教唱 ➔ 12:00 營隊午餐 ➔ 13:30 突發狀況演練與急救常識 ➔ 15:30 隊輔驗收實測 ➔ 17:00 總講評與受證',
    highlightsAndOutcomes: '1. 22 位青年隊輔全數通過營隊帶領驗收，取得合格隊輔證書。\n2. 演練了 6 套自創兒童情境互動劇，提升營隊臨場應變力。\n3. 有效接引 5 位初次接觸佛光青年之大專學生加入隊輔團隊。',
    reviewAndSuggestions: '1. 音響教具設備可增加手持無線麥克風數量。\n2. 建議建立隊輔互助小組，活動期間輪流休息保持充沛體力。',
    status: 'completed',
    budgetNotes: '活動支出 NT$ 4,200（培訓講義、教具物料與便當）',
    photos: [
      {
        id: 'p-2025-3',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        caption: '青年隊輔進行兒童團康活動律動與情境引導演練'
      },
      {
        id: 'p-2025-4',
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
        caption: '青年隊輔結業受證與法師加油打氣合照'
      }
    ],
    tags: ['三好冬令營', '隊輔培訓', '團康技能', '青年接引'],
    createdAt: '2025-02-09 11:00',
    updatedAt: '2025-02-09 11:00'
  },
  {
    id: 'act-2025-003',
    title: '2025年國定佛誕節浴佛祈福 ✕ 青年蔬食市集與環保減碳倡議',
    category: '義工服務與蔬食',
    date: '2025-05-10',
    timeRange: '09:00 ~ 15:30',
    location: '新竹市巨城購物中心戶外廣場 ✕ 佛光山法寶寺雲水浴佛車',
    organizer: '佛光山法寶寺 / 國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['徐信銓', '周汶蔚', '林雅婷'],
    attendeeTotal: 68,
    attendeeYouth: 32,
    attendeeGuests: 16,
    attendeeVolunteers: 20,
    summary: '走入新竹熱鬧商圈設立行動浴佛亭與青年創意蔬食推廣站，接引社會大眾與年輕世代認識佛誕節意涵，以「做好事、說好話、存好心」三好精神淨化心靈，同時推廣日常少肉多蔬減碳行動。',
    processSchedule: '09:00 浴佛亭與青年攤位佈置 ➔ 10:00 啟動儀式與法師帶領祈福 ➔ 10:30 雲水浴佛導覽服務與蔬食試吃 ➔ 13:30 青年街頭三好快閃表演 ➔ 15:00 圓滿收拾善後與心得分享',
    highlightsAndOutcomes: '1. 當日引導超過 850 位民眾參與行動浴佛，發送 300 份青年手作素食點心。\n2. 青年志工發揮親和力主動解說，成功打破宗教刻板印象，吸引年輕族群目光。\n3. 新竹各大校園共 32 位青年投身全天志工服務，展現活力。',
    reviewAndSuggestions: '1. 戶外廣場風勢較大，未來佈展帳篷需增強沙包固定。\n2. 可提前印製掃描 QR Code 即可填寫願望之電子祈福卡。',
    status: 'featured',
    budgetNotes: '活動支出 NT$ 8,500（佈置花材、蔬食試吃食材、文宣紀念品）',
    photos: [
      {
        id: 'p-2025-5',
        url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        caption: '青年親手調製健康蔬食點心與市民結緣'
      },
      {
        id: 'p-2025-6',
        url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
        caption: '青年引導市民與家庭進行三好浴佛淨心'
      }
    ],
    tags: ['國定佛誕節', '雲水浴佛', '蔬食市集', '環保愛地球'],
    createdAt: '2025-05-11 14:00',
    updatedAt: '2025-05-11 14:00'
  },
  {
    id: 'act-2025-004',
    title: '2025年法寶青年書院春季班 ✕ 《星雲大師全集》經典人生智慧共讀會',
    category: '青年書院與讀書會',
    date: '2025-06-21',
    timeRange: '14:00 ~ 17:00',
    location: '佛光山法寶寺 二樓雲水書坊',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', 'Dicky'],
    attendeeTotal: 25,
    attendeeYouth: 20,
    attendeeGuests: 3,
    attendeeVolunteers: 2,
    summary: '青年書院春季班以「人間佛教的生活實踐」為研討核心，結合青年職場人際關係、情緒管理與身心安頓課題，透過閱讀星雲大師法語與個案研討，體悟處世無礙的佛法智慧。',
    processSchedule: '14:00 經典導讀與精選篇章朗讀 ➔ 14:40 個案生活情境討論（職場轉念與同理心）➔ 15:40 心靈茶席沉澱交流 ➔ 16:30 法師總結開示 ➔ 17:00 賦歸',
    highlightsAndOutcomes: '1. 20 位青年學員出席率達 95%，每人皆完成 1 篇生活行佛心得隨筆。\n2. 建立專屬書院共學筆記，將佛法落實於每週工作人際應對中。\n3. 深化團員法情，增進青年同儕間深刻理解與正向支持。',
    reviewAndSuggestions: '1. 可於課前預先發送 1 頁精華摘要，方便在職青年預習。\n2. 安排每季 1 次學員輪值擔任引言人，訓練青年表達力。',
    status: 'completed',
    budgetNotes: '活動支出 NT$ 2,800（教材印製、茶席茶食與場地清潔）',
    photos: [
      {
        id: 'p-2025-7',
        url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
        caption: '青年書院學員於茶席中分享經典閱讀生活心得'
      }
    ],
    tags: ['法寶青年書院', '星雲大師全集', '人間佛教', '經典讀書會'],
    createdAt: '2025-06-22 09:30',
    updatedAt: '2025-06-22 09:30'
  },
  {
    id: 'act-2025-005',
    title: '2025年歲末三好義工感恩茶會 ✕ 青年年度團務成果覆盤大會',
    category: '分團例會與法會',
    date: '2025-12-20',
    timeRange: '18:30 ~ 21:00',
    location: '佛光山法寶寺 五樓滴水坊 ✕ 大會議室',
    organizer: '國際佛光會新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    leadCadres: ['周汶蔚', '徐信銓', '林雅婷', '曾芳瑜'],
    attendeeTotal: 40,
    attendeeYouth: 30,
    attendeeGuests: 5,
    attendeeVolunteers: 5,
    summary: '歲末年終之際，全體青年幹部與發心義工歡聚法寶寺，共同回顧 2025 全年度 12 場重大活動點滴與豐碩成果，頒發年度三好青年之星獎勵，並啟動 2026 年度專案前瞻計畫。',
    processSchedule: '18:30 感恩蔬食圍爐共饗 ➔ 19:15 2025 年度活動精彩影音回顧 ➔ 19:45 各組成果匯報與覆盤精進 ➔ 20:15 優秀青年表揚與法師勉勵 ➔ 20:45 點燈祈願與 2026 迎新啟航',
    highlightsAndOutcomes: '1. 表揚 8 位全勤傑出青年義工，肯定其護持常住與熱心服務之奉獻。\n2. 產出 2025 年度活動成果白皮書，總結 5 大向度關鍵亮點指標。\n3. 共同許下「2026 優秀分團選拔」奪魁之集體創作願景。',
    reviewAndSuggestions: '1. 回顧影音可上傳分團 YouTube/FB 擴大社群傳播效益。\n2. 表揚獎盃可改為實用之三好紀念文創品，青年更具收藏紀念價值。',
    status: 'completed',
    budgetNotes: '活動支出 NT$ 6,800（歲末圍爐食材、表揚獎狀文創禮品）',
    photos: [
      {
        id: 'p-2025-8',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        caption: '青年團員與常住法師於歲末感恩茶會溫馨大合照'
      }
    ],
    tags: ['歲末感恩', '成果覆盤', '義工表揚', '2026展望'],
    createdAt: '2025-12-21 10:00',
    updatedAt: '2025-12-21 10:00'
  }
];
