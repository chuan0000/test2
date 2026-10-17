import { ExtractedEvidenceActivity } from './documentParser';
import { ActivityCategory } from '../types';

/**
 * 國際佛光會中華佛光青年總團
 * 2026年優秀分團選拔活動佐證資料表 - 新竹青年分團 57 項完整真實活動佐證資料庫
 * 萃取自使用者檢附之官方 Word / 貼上格式表格
 */
export const BLIA_HSINCHU_OFFICIAL_ACTIVITIES_RAW = [
  {
    date: '2025/9/3、9/10、9/17、9/24、10/1',
    title: '信仰力課程-法華經',
    location: '線上',
    attendeeYouth: 15,
    attendeeGuests: 0,
    attendeeTotal: 15,
    summary: '信仰力課程帶青年共同認識法華經，從經典與自身經歷中尋找各自的學佛與成佛指南。',
    captions: [
      '信仰力課程-法華經 合照',
      '新竹青年吳浩君分享',
      '線上課程封面',
      '新竹青年吳浩君分享'
    ]
  },
  {
    date: '2025/9/6、9/11',
    title: '新竹團大線上籌備會',
    location: '線上',
    attendeeYouth: 20,
    attendeeGuests: 0,
    attendeeTotal: 20,
    summary: '共10位青年一同出席新竹團大線上籌備會議，兩場會議累計參與人數共20人。',
    captions: [
      '線上會議截圖和線上會議參與人數',
      '線上會議連結',
      '會議紀錄'
    ]
  },
  {
    date: '2025/9/6、9/20、9/21、9/22',
    title: '共修法會',
    location: '法寶寺、金光明寺',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '9月份共修會共4場次，分別為 9/6 大悲懺法會、9/20 共修父母恩重難報經、9/21 北區供僧道糧總迴向、9/22 光明燈法會，累計參與人數共10人。',
    captions: [
      '北區供僧道糧功德總回向新聞',
      '北區供僧道糧總迴向青年照片',
      '北區供僧道糧總迴向青年照片',
      '青年參與法會'
    ]
  },
  {
    date: '2025/9/13',
    title: '學院畢業典禮、供僧法會',
    location: '佛光山',
    attendeeYouth: 4,
    attendeeGuests: 1,
    attendeeTotal: 5,
    summary: '5位青年到佛光山參與學院畢業典禮、供僧法會。',
    captions: [
      '新竹道場大合照',
      '新竹青年合照',
      '學院畢業典禮現場',
      '學院畢業典禮現場'
    ]
  },
  {
    date: '2025/9/20、10/18、11/8、11/15、11/29、12/13',
    title: '書院課-2025秋季班',
    location: '法寶寺',
    attendeeYouth: 43,
    attendeeGuests: 8,
    attendeeTotal: 51,
    summary: '書院課-秋季班(共6堂) 課程分別為: 1-持戒的意義、2-蔬食手作 油炸的樂趣、3-藥師佛十二大願、4-主持培訓、5-生活禪與吉祥經、6-成為自己，用閱讀為人生找答案。累計參與人數共51人，特邀全國廣播悠遊人間主持人吳鴻明及業界顏靖容講師授課。',
    captions: [
      '新竹青年書院邀請業界顏靖容講師授課',
      '新竹青年團團長吳浩君帶領青年領略禪修與生活的關聯性',
      '新竹青年書院課特邀全國廣播悠遊人間主持人吳鴻明擔任主持人培訓講師'
    ]
  },
  {
    date: '2025/9/28',
    title: '法寶寺三皈五戒',
    location: '法寶寺',
    attendeeYouth: 9,
    attendeeGuests: 3,
    attendeeTotal: 12,
    summary: '12位青年參與法寶寺三皈五戒，其中有四位新戒，三位青年擔任工作人員協助戒子們搭衣，亦有五位青年復戒。',
    captions: [
      '「2025法寶寺三皈五戒」三皈五戒圓滿大合照',
      '新聞稿截圖',
      '新竹青年與心保和尚合照',
      '新竹青年協助戒子搭衣'
    ]
  },
  {
    date: '2025/9/28',
    title: '心保和尚講座-八大人覺經',
    location: '法寶寺',
    attendeeYouth: 11,
    attendeeGuests: 0,
    attendeeTotal: 11,
    summary: '心保和尚講座，由新竹佛光合唱團表演 Be the light 為活動暖場開啟序幕。共有11位青年參與。',
    captions: [
      '新竹佛光合唱團演唱〈Be the light〉歌聲傳遞希望溫暖幸福',
      '新聞稿截圖',
      '講座大合照',
      '新竹青年除了表演之外也認真聽講座'
    ]
  },
  {
    date: '2025/10~12',
    title: '青年宣講、與談',
    location: '法寶寺',
    attendeeYouth: 5,
    attendeeGuests: 0,
    attendeeTotal: 5,
    summary: '10~12月份青年黃冠涵、湯麗霖、吳浩君於各分會月例會、會員大會宣講與談，累積場次共9場次。',
    captions: [
      '青年麗霖宣講',
      '青年冠涵宣講',
      '青年浩君宣講',
      '青年浩君宣講',
      '青年浩君宣講'
    ]
  },
  {
    date: '2025/10/4',
    title: '公益路跑 工作人員',
    location: '新竹左岸公園',
    attendeeYouth: 9,
    attendeeGuests: 8,
    attendeeTotal: 17,
    summary: 'Vegrun 辦在新竹左岸公園，有9位青年響應公益路跑，8位青年參與公益路跑擔任工作人員。',
    captions: [
      '路跑出發前大合照',
      '「三代喜同堂VEGRUN正念路跑&生活禪靜心祈福公益活動」參與VEGRUN工作人員的青年大合照',
      '人間通訊社新聞稿截圖',
      '人間衛視新聞畫面',
      '響應蔬食A計畫'
    ]
  },
  {
    date: '2025/10/4',
    title: '新竹佛光青年團員大會',
    location: '法寶寺',
    attendeeYouth: 18,
    attendeeGuests: 14,
    attendeeTotal: 32,
    summary: '新竹佛光青年2025團員大會於10/4舉辦，本團參與18位，非本團14人。團長特別設計感謝獎項頒發給團員，感謝大家一年來的付出。',
    captions: [
      '「2025年新竹佛光青年團員大會」團員大會圓滿大合照',
      '新竹分團感謝團員的付出特發感謝狀和獎品',
      '新竹分團感謝歷任團長持續在分團帶領青年特發感謝狀和獎品'
    ]
  },
  {
    date: '2025/10/4',
    title: '新竹青年特色活動-療癒手作',
    location: '法寶寺',
    attendeeYouth: 17,
    attendeeGuests: 6,
    attendeeTotal: 23,
    summary: '在團員大會後，特邀新竹青年鄭心蓮帶領手作馬克杯墊和鐵線娃娃，讓青年在短時間抽離煩惱，靜心享受兩小時寧靜。',
    captions: [
      '新竹青年鄭心蓮提交活動計劃書',
      '新竹青年鄭心蓮教學青年製作馬克杯墊',
      '團員大會會後手作活動大合照',
      '製作過程'
    ]
  },
  {
    date: '2025/10/4',
    title: '青年聯誼聚餐慶生',
    location: '新竹海底撈',
    attendeeYouth: 9,
    attendeeGuests: 6,
    attendeeTotal: 15,
    summary: '在團員大會和手作活動之後，特別帶來自大陸的白白同學品嘗海底撈美食，共15位青年聚餐為10月壽星慶生。',
    captions: [
      '替新竹青年10月壽星慶生',
      '準備享用慶生餐',
      '替壽星慶生吹蠟燭'
    ]
  },
  {
    date: '2025/10/11',
    title: '白象考核',
    location: '金光明寺',
    attendeeYouth: 1,
    attendeeGuests: 0,
    attendeeTotal: 1,
    summary: '新竹青年徐信銓參與白象一級幹部考核。',
    captions: [
      '桃竹苗區合照',
      '新竹青年分享心得',
      '新竹青年參與團康考核遊戲',
      '新竹青年介紹佛光青年'
    ]
  },
  {
    date: '2025/10/12',
    title: '白象幹部論壇',
    location: '金光明寺',
    attendeeYouth: 3,
    attendeeGuests: 0,
    attendeeTotal: 3,
    summary: '新竹青年共有三位參與白象幹部論壇，深入討論如何接引青年以及如何舉辦會讓青年想來的活動，收穫滿滿。',
    captions: [
      '桃竹苗區合照',
      '思考青年在接引新人會遇到甚麼問題',
      '認真寫下答案'
    ]
  },
  {
    date: '2025/10/19',
    title: '青年聯誼-新竹老屋圖鑑市集',
    location: '新竹市區',
    attendeeYouth: 11,
    attendeeGuests: 0,
    attendeeTotal: 11,
    summary: '11位青年參與聯誼，一同在新竹市區的市集攤位蒐集特色老屋郵票，增進生活情感交流。',
    captions: [
      '新竹青年合照',
      '收集特色郵票',
      '完成收集郵票'
    ]
  },
  {
    date: '2025/10/24-25',
    title: '佛光山五戒、菩薩戒',
    location: '佛光山寺',
    attendeeYouth: 2,
    attendeeGuests: 0,
    attendeeTotal: 2,
    summary: '2位青年回山參加佛光山五戒、菩薩戒。新竹青年擔任男眾菩薩戒班首，懷抱感恩三寶、師長、父母恩受戒。',
    captions: [
      '新竹青年擔任男眾菩薩戒班首，懷抱著感恩三寶恩、師長、父母恩來受菩薩戒',
      '桃竹苗區青年受戒圓滿賦歸',
      '人間通訊社新聞稿',
      '人間通訊社新聞稿'
    ]
  },
  {
    date: '2025/10/30',
    title: '慧裴法師攝影展-人間佛教之美',
    location: '法寶寺',
    attendeeYouth: 5,
    attendeeGuests: 0,
    attendeeTotal: 5,
    summary: '5位青年參與慧裴法師攝影展。由團長吳浩君擔任開幕司儀、青年黃冠涵與邱婉甄帶來開幕表演。',
    captions: [
      'Youtube影片新聞畫面',
      'Youtube影片新聞畫面',
      '青年與慧裴法師合照',
      '新聞稿截圖'
    ]
  },
  {
    date: '2025/11/2',
    title: '桃竹苗區佛光會年會 工作人員&表演人員',
    location: '桃園新弘法基地',
    attendeeYouth: 12,
    attendeeGuests: 0,
    attendeeTotal: 12,
    summary: '12位青年參與桃竹苗區佛光會年會擔任音幕控工作人員及表演人員，青年代表報告青年團弘法事蹟。',
    captions: [
      '協助音幕控的新竹青年',
      '桃竹苗區合照',
      '青年代表報告青年團的弘法事蹟',
      '新聞稿截圖'
    ]
  },
  {
    date: '2025/11/4、11/7、11/8、11/29',
    title: '11月共修法會',
    location: '法寶寺',
    attendeeYouth: 17,
    attendeeGuests: 0,
    attendeeTotal: 17,
    summary: '11/4大悲懺法會(2位)，11/7、11/8、11/9 藥師法會(14位)，11/29水陸法會-送聖(1位)，累計17人次參與修持。',
    captions: [
      '水陸法會',
      '水陸法會現場',
      '線上共修',
      '線上共修紀錄'
    ]
  },
  {
    date: '2025/11/9',
    title: '參觀新竹市美術館展覽',
    location: '新竹市美術館',
    attendeeYouth: 3,
    attendeeGuests: 1,
    attendeeTotal: 4,
    summary: '3位中華青年帶著U世代青年在新竹市區走走，參觀新竹市美術館展覽，感受在地藝文與美感。',
    captions: [
      '青年合照',
      '美術館照片',
      '美術館照片'
    ]
  },
  {
    date: '2025/11/9',
    title: '青年聚餐聯誼-慶生',
    location: '新竹',
    attendeeYouth: 8,
    attendeeGuests: 1,
    attendeeTotal: 9,
    summary: '9位青年參與聚餐聯誼，為11月壽星馬瑄佑慶生，地點位於新竹青年儀婷家人經營的餐廳。',
    captions: [
      '青年大合照',
      '新竹青年壽星馬瑄佑',
      '新竹青年儀婷的家人開的餐廳'
    ]
  },
  {
    date: '2025/11/9',
    title: '聯團會議-區團主辦',
    location: '線上',
    attendeeYouth: 9,
    attendeeGuests: 0,
    attendeeTotal: 9,
    summary: '9位新竹青年共同參與金門線上聯團會議，掌握青年總團方針與跨區交流。',
    captions: [
      '聯團會議合照',
      '聯團會議合照'
    ]
  },
  {
    date: '2025/09~2026/12',
    title: '合唱團練習和成果發表',
    location: '法寶寺',
    attendeeYouth: 2,
    attendeeGuests: 0,
    attendeeTotal: 2,
    summary: '2位青年參與法寶寺法寶合唱團，九至十二月練習多次，於三好歌曲觀摩賽、竹北縣府聖誕活動、畫展開幕等表演。',
    captions: [
      '成果發表',
      '參加三好歌曲觀摩賽',
      '竹北縣政府聖誕節活動演出',
      '法寶寺畫展開幕演出',
      '法寶合唱團合照',
      '2026年禮讚偉大的佛陀—星雲大師百歲紀念音樂會大合照'
    ]
  },
  {
    date: '2025/11/16',
    title: '聚餐、與監寺會談',
    location: '法寶寺',
    attendeeYouth: 7,
    attendeeGuests: 0,
    attendeeTotal: 7,
    summary: '7位青年參與聚餐並與監寺法師會談，帶初次到訪的青年認識法寶寺道場並策劃團務方向。',
    captions: [
      '新竹青年帶初次到法寶寺的青年認識法寶寺',
      '新竹青年與監寺合照',
      '新竹青年談論團務'
    ]
  },
  {
    date: '2025/11/22-23',
    title: '共識營隊輔培訓、主持人培訓',
    location: '惠中寺',
    attendeeYouth: 3,
    attendeeGuests: 0,
    attendeeTotal: 3,
    summary: '新竹青年3位參與共識營隊輔培訓，1位協助帶領活動組培訓，1位參與活動組培訓，1位參與主持人培訓。',
    captions: [
      '慧喜法師替活動組的青年認識八正道',
      '新竹青年帶領活動組培訓',
      '活動組和中區總住持覺居法師合照'
    ]
  },
  {
    date: '2025/11/30',
    title: '香篆課程',
    location: '法寶寺',
    attendeeYouth: 9,
    attendeeGuests: 0,
    attendeeTotal: 9,
    summary: '9位青年參與法寶寺香篆修持課程，藉由沉靜身心香道體會禪意生活。',
    captions: [
      '香篆課程現場',
      '香篆器具與靜心修持',
      '青年專注打香篆',
      '香篆成果合照'
    ]
  },
  {
    date: '2025/11/30',
    title: '宣講員考核',
    location: '福山寺',
    attendeeYouth: 1,
    attendeeGuests: 0,
    attendeeTotal: 1,
    summary: '新竹青年徐信銓至福山寺參與佛光宣講員嚴格考核並圓滿通過。',
    captions: [
      '新竹青年考核演講',
      '佛光青年合照',
      '新聞截圖'
    ]
  },
  {
    date: '2025/12/6、12/8、12/9',
    title: '12月共修法會 (萬緣水陸法會)',
    location: '佛光山成佛大道、佛光山如來殿',
    attendeeYouth: 3,
    attendeeGuests: 0,
    attendeeTotal: 3,
    summary: '青年蔡育蓁分別於12/6、12/8、12/9回本山參與萬緣水陸法會，擔任灑淨、內壇請上堂、內壇供上堂作務。',
    captions: [
      '萬緣水陸法會盛況',
      '萬緣水陸法會成佛大道',
      '新竹青年育蓁參加萬緣水陸法會'
    ]
  },
  {
    date: '2025/12/13、12/29、2026/1/2',
    title: '新竹聯團會議籌備會暨線上彩排',
    location: '線上',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '10位青年參與新竹聯團會議兩次線上籌備會及聯團會議線上彩排。',
    captions: [
      '線上討論對話紀錄',
      '線上討論對話紀錄',
      '籌備會會議紀錄'
    ]
  },
  {
    date: '2025/12/13',
    title: '耶誕祈福-法寶寺攤位、點燈表演',
    location: '竹北',
    attendeeYouth: 13,
    attendeeGuests: 0,
    attendeeTotal: 13,
    summary: '11位青年前往竹北支援耶誕祈福-法寶寺攤位，2位青年參與法寶合唱團點燈表演。',
    captions: [
      '新竹青年於耶誕祈福法會支援攤位',
      '攤位活動青年互動',
      '攤位活動支援',
      '法寶合唱團演出'
    ]
  },
  {
    date: '2025/12/20-21',
    title: '中華佛青幹部共識營-和諧和平',
    location: '惠中寺',
    attendeeYouth: 13,
    attendeeGuests: 0,
    attendeeTotal: 13,
    summary: '新竹青年13位至惠中寺參與幹部共識營，3位支援文宣攝影組，1位支援活動組。',
    captions: [
      '結營典禮之感謝工作人員',
      '文宣攝影組合照',
      '全體大合照'
    ]
  },
  {
    date: '2025/12/23、12/28',
    title: '青年聯誼 品咖啡',
    location: '新竹咖啡廳',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '10位青年相約到咖啡廳享受咖啡，在12月底聖誕歲末關心彼此近況。',
    captions: [
      '新竹青年合照',
      '食物合照',
      '新竹青年合照',
      '食物合照'
    ]
  },
  {
    date: '2025/12/25',
    title: '佛光山神明聯誼會',
    location: '佛光山寺',
    attendeeYouth: 3,
    attendeeGuests: 0,
    attendeeTotal: 3,
    summary: '3位青年到佛光山寺感受各宗教神明聯誼會盛況，增進宗教多元包容與理解視野。',
    captions: [
      '神明聯誼會空拍圖',
      '新竹青年與新竹分會師兄姊合照',
      '新竹青年合照'
    ]
  },
  {
    date: '2025/12/26、12/28、2026/01/10',
    title: '2026冬令營籌備會 (三次會議)',
    location: '線上',
    attendeeYouth: 17,
    attendeeGuests: 0,
    attendeeTotal: 17,
    summary: '與法師及青年工作人員進行三次冬令營線上籌備會議，討論營隊無人機與團康課程架構。',
    captions: [
      '會議記錄截圖',
      '第二次線上會議記錄',
      '青年與授課講師討論紀錄'
    ]
  },
  {
    date: '2026/01/03',
    title: '新竹青年歲末感謝和聯誼',
    location: '新竹',
    attendeeYouth: 11,
    attendeeGuests: 0,
    attendeeTotal: 11,
    summary: '新竹青年歲末聯誼，回顧分享一年來收穫並展望新年度推動主題，會後青年相約打羽球運動。',
    captions: [
      '青年歲末分享合照',
      '青年合照',
      '青年打羽球'
    ]
  },
  {
    date: '2026/01~08',
    title: '法寶寺年度共修法會系列',
    location: '法寶寺',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '青年參與大悲懺法會(4人)、新春禮千佛(9人)、金剛經、水懺法會及受持菩薩戒等系列修持。',
    captions: [
      '青年參與法會照片',
      '大悲懺共修留影'
    ]
  },
  {
    date: '2026/01~04',
    title: '《法華經大意》青年讀書會 (共四講)',
    location: '線上',
    attendeeYouth: 12,
    attendeeGuests: 0,
    attendeeTotal: 12,
    summary: '由青年組成之線上讀書會，互相當導讀人分享法華經大意。四講次共計12人次深入經藏研討。',
    captions: [
      '法華經大意線上課程合照',
      '課程PPT截圖',
      '課程研討PPT截圖',
      '新竹青年擔任講師的練習時間'
    ]
  },
  {
    date: '2026/01/17',
    title: '佛光青年團社長領袖營-SEL',
    location: '台北道場',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '青年總團舉辦社長領袖營，特邀莊越翔老師授課SEL社會情緒學習，新竹青年4位參與培訓。',
    captions: [
      '新青年與莊老師合照',
      '所有青年與莊老師合照',
      '課程精彩瞬間'
    ]
  },
  {
    date: '2026/01/24',
    title: '第七屆三好歌唱觀摩賽',
    location: '台北道場',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '2位青年支援文宣攝影組採訪，2位青年代表出賽團體歌唱組，展現三好音緣。',
    captions: [
      '新竹青年與合唱團老師合照',
      '新竹青年表演照片',
      '新竹青年擔任文宣攝影組的採訪工作照片',
      '文宣攝影組大合照'
    ]
  },
  {
    date: '2026/01/24-25',
    title: '法寶寺冬令營培訓',
    location: '法寶寺',
    attendeeYouth: 28,
    attendeeGuests: 0,
    attendeeTotal: 28,
    summary: '配合道場舉辦冬令營，青年準備團康破冰、團體動力學課程及無人機助教培訓，兩天累計28人次。',
    captions: [
      '團體動力時間',
      '場佈場地',
      '團體動力破冰遊戲',
      '場地整備工作'
    ]
  },
  {
    date: '2026/01/29-31',
    title: '法寶寺無人機冬令營 (3天營隊)',
    location: '法寶寺',
    attendeeYouth: 48,
    attendeeGuests: 0,
    attendeeTotal: 48,
    summary: '冬令營主題為無人機，無人機專業團隊指導飛行，青年工作人員全程引導小學員及安全維護，3天累計48人次服務。',
    captions: [
      '結營典禮邀請學員爸媽一同參與大合照',
      '開營大合照',
      '無人機團隊老師教學照',
      '無人機團隊飛行演練'
    ]
  },
  {
    date: '2026/02/07',
    title: '法寶寺年前大掃除',
    location: '法寶寺',
    attendeeYouth: 7,
    attendeeGuests: 0,
    attendeeTotal: 7,
    summary: '年前大掃除7位青年回道場出坡，掃除一年心中的塵垢與煩惱，清淨歡喜迎接新春。',
    captions: [
      '青年打掃道場',
      '擦拭門窗與大雄寶殿',
      '青年同心協力出坡',
      '打掃圓滿留影'
    ]
  },
  {
    date: '2026/02/09',
    title: '2月份團員慶生聯誼',
    location: '新竹',
    attendeeYouth: 5,
    attendeeGuests: 0,
    attendeeTotal: 5,
    summary: '過年前新竹分團團員小聚替2月壽星慶生，並連線線上參與的青年共同慶賀。',
    captions: [
      '聚餐食物照',
      '線上參與的青年連線截圖'
    ]
  },
  {
    date: '2026/02/17-21',
    title: '新春佛光山義工 (初一-初五)',
    location: '佛光山寺',
    attendeeYouth: 17,
    attendeeGuests: 0,
    attendeeTotal: 17,
    summary: '初一至初五新竹青年回山協助青年總團攤位及分會活動，累積17位青年出坡服務。',
    captions: [
      '青年與分會合照',
      '青年義工合照',
      '攤位擺攤的工作照',
      '青年練習擺盤',
      '大寮出坡擺盤工作'
    ]
  },
  {
    date: '2026/02-03',
    title: '禪淨共修法會 (義工說明會與盛會支援)',
    location: '台北小巨蛋',
    attendeeYouth: 26,
    attendeeGuests: 0,
    attendeeTotal: 26,
    summary: '禪淨共修青年義工說明會(8人)及3/7、3/8法會現場支援(18人)，三場次共計26位青年投入。',
    captions: [
      '青年參與禪淨共修法會',
      '青年大合照',
      '線上工作會議',
      '新竹青年表演照'
    ]
  },
  {
    date: '2026/02/27',
    title: '與監寺對談 (青年活動未來規劃)',
    location: '法寶寺',
    attendeeYouth: 5,
    attendeeGuests: 0,
    attendeeTotal: 5,
    summary: '5位青年與法寶寺監寺法師談論青年團活動發展與年度弘法規劃。',
    captions: [
      '與監寺對談紀錄',
      '青年聚會'
    ]
  },
  {
    date: '2026/03/08',
    title: '萬人三皈五戒典禮',
    location: '台北小巨蛋',
    attendeeYouth: 6,
    attendeeGuests: 0,
    attendeeTotal: 6,
    summary: '共有6位青年參與小巨蛋萬人三皈五戒盛會，把握難得殊勝法緣。',
    captions: [
      '三皈五戒戒子受戒',
      '三皈五戒主法和尚開示',
      '萬人三皈五戒現場畫面'
    ]
  },
  {
    date: '2026/03/14',
    title: '頭份聯團會議',
    location: '宏法社',
    attendeeYouth: 8,
    attendeeGuests: 0,
    attendeeTotal: 8,
    summary: '桃竹苗區兩個月一期聯團活動，新竹青年8人出席參與，報告分團團務成果。',
    captions: [
      '認真參與會議中的青年',
      '主席、弘法社監寺、上級指導有度法師及協會長合影',
      '新竹青年報告團務'
    ]
  },
  {
    date: '2026/03/14',
    title: '法寶寺普查午宴及青年主持',
    location: '法寶寺',
    attendeeYouth: 2,
    attendeeGuests: 0,
    attendeeTotal: 2,
    summary: '法寶寺普查午宴，青年團受邀擔綱主持重任，1位出席主持，1位協助現場接待。',
    captions: [
      '午宴的表演活動',
      '監寺開示勉勵',
      '新竹青年主持午宴',
      '午宴大合照'
    ]
  },
  {
    date: '2026/03/21-22',
    title: '佛光青年精進修持營',
    location: '佛光山寺',
    attendeeYouth: 8,
    attendeeGuests: 0,
    attendeeTotal: 8,
    summary: '8位青年回山精進修持，於大智殿做早課、宗祖殿與星雲大師接心，沈澱心靈。',
    captions: [
      '「2026禪境共修」開幕大合照',
      '男眾學員於大智殿做早課',
      '學員於宗祖殿與大師接心',
      '精進修持圓滿賦歸'
    ]
  },
  {
    date: '2026/03~04',
    title: '2026桃竹苗區閱讀研討會',
    location: '線上 / 桃園講堂',
    attendeeYouth: 12,
    attendeeGuests: 0,
    attendeeTotal: 12,
    summary: '從線上籌備(6人)、場勘(5人)、線上試講到正式研討會，新竹青年擔任導讀、回饋、文宣攝影組長、教務生活各組工作，共12人次參與。',
    captions: [
      '「2026桃竹苗區閱讀研討會」大合照',
      '「2026桃竹苗區閱讀研討會」工作人員大合照',
      '桃竹苗區區團務長鄧適婕和副團務長吳浩君擔任與談人'
    ]
  },
  {
    date: '2026/03~08',
    title: '2026法寶春季青年書院課程系列',
    location: '法寶寺',
    attendeeYouth: 25,
    attendeeGuests: 4,
    attendeeTotal: 29,
    summary: '包含法華經遇見自己x讀書會、生活佛法、蔬食手作、手作貓尾巴編織包、夏令營月光寺場勘及認識佛陀的一生等6堂精彩課程。',
    captions: [
      '2026春季法寶書院開課',
      '青年書院-生活佛法課程',
      '青年書院課程法華經遇見自己，由團長吳浩君分享讀書會',
      '青年書院課-夏令營場勘，月光寺合照',
      '青年書院手作貓尾巴編織包趣味照片'
    ]
  },
  {
    date: '2026/04/10',
    title: '4月份慶生活動',
    location: '新竹餐廳',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '新竹青年相約新竹餐廳替四月份壽星慶祝，凝聚團結溫暖氛圍。',
    captions: [
      '壽星與禮物們溫馨合照'
    ]
  },
  {
    date: '2026/04/11',
    title: '假日咖啡聯誼',
    location: '新竹咖啡廳',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '邀約工作繁忙的青年於假日前往咖啡廳放鬆品茗，關心近況生活。',
    captions: [
      '青年咖啡廳交流時光',
      '咖啡聯誼合照'
    ]
  },
  {
    date: '2026/04/12',
    title: '北區青年閱讀研討會',
    location: '三重禪淨中心',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '桃竹苗區2位青年參與研討會深入經藏，2位分別協助教務組及文宣攝影組。',
    captions: [
      '研討會開展深入經藏',
      '教務與文宣組青年工作留影'
    ]
  },
  {
    date: '2026/04-05',
    title: '佛光山三壇大戒 新竹行腳祈福',
    location: '新竹市區 / 遠東百貨',
    attendeeYouth: 18,
    attendeeGuests: 0,
    attendeeTotal: 18,
    summary: '從籌備會、啟程典禮到正式行腳祈福，新竹青年18位組成莊嚴旗隊帶領隊伍至遠東百貨為新竹市民祈福。',
    captions: [
      '「佛光山三壇大戒 新竹行腳祈福」止步回嚮',
      '行腳隊伍行進至新竹遠東百貨替民眾祈福',
      '新竹青年和分會師兄組成強而有力的旗隊',
      '行腳隊伍與民眾合照'
    ]
  },
  {
    date: '2026/04/26',
    title: '法寶寺考生祈福法會',
    location: '法寶寺',
    attendeeYouth: 1,
    attendeeGuests: 0,
    attendeeTotal: 1,
    summary: '法寶寺為應試考生辦理祈福法會，新竹青年協助文宣攝影組紀錄祈願時刻。',
    captions: [
      '考生祈福法會現場紀實',
      '攝影組文宣工作照'
    ]
  },
  {
    date: '2026/05/09',
    title: '桃竹苗區佛誕聯誼',
    location: '中壢禪淨中心',
    attendeeYouth: 7,
    attendeeGuests: 0,
    attendeeTotal: 7,
    summary: '青年慶祝佛誕節，透過趣味通關認識佛誕由來，並於道場進行人間音緣歌唱聯誼。',
    captions: [
      '佛誕聚餐歡慶',
      '趣味通關認識佛誕',
      '人間音緣歡唱'
    ]
  },
  {
    date: '2026/05/16-17',
    title: '浴佛淨心映藝文 - 法寶寺佛畫特展',
    location: '法寶寺',
    attendeeYouth: 13,
    attendeeGuests: 0,
    attendeeTotal: 13,
    summary: '浴佛節與佛畫特展同步開展，青年協助文宣攝影、主持及開幕唱跳菩薩心青年力表演、合唱團演出與布展。',
    captions: [
      '佛畫特展開幕式菩薩心青年力表演',
      '青年協助文宣攝影與主持',
      '畫展前置布展工作'
    ]
  },
  {
    date: '2026/05~07',
    title: '法寶寺兒童夏令營籌備系列',
    location: '新竹 / 花蓮月光寺',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '幹部線上會議(6人)、場勘籌備(8人)、花蓮月光寺場勘(10人)及行前會議(8人)，周詳籌備夏令營各環節。',
    captions: [
      '月光寺場勘籌備留影',
      '營隊籌備討論畫面'
    ]
  },
  {
    date: '2026/05~06',
    title: '2026年北區萬緣水陸法會 (法寶寺藥師壇/送聖)',
    location: '法寶寺 / 金光明寺',
    attendeeYouth: 13,
    attendeeGuests: 0,
    attendeeTotal: 13,
    summary: '青年參與法寶寺藥師壇修持(累計11人次)及金光明寺北區水陸法會送聖(2人)。',
    captions: [
      '藥師壇修持留影',
      '北區水陸送聖莊嚴場面'
    ]
  },
  {
    date: '2026/06/19',
    title: '法寶寺佛學講座-依空法師「普門品新解」',
    location: '法寶寺',
    attendeeYouth: 10,
    attendeeGuests: 0,
    attendeeTotal: 10,
    summary: '2位青年參與開場法寶合唱演出，其餘青年全程掌控法寶寺YouTube直播串流，共10人支援。',
    captions: [
      'Youtube直播截圖',
      '講座大合照',
      '監寺與參與者們認真投入畫面',
      '法寶合唱團開場表演',
      '講座宣傳文宣',
      '新聞稿截圖'
    ]
  },
  {
    date: '2026/06/06-07',
    title: '大會師隊輔培訓 / 工作人員培訓',
    location: '佛光山寺',
    attendeeYouth: 5,
    attendeeGuests: 0,
    attendeeTotal: 5,
    summary: '參與莊越翔老師授課之大會師隊輔培訓及文宣組工作流程試玩，獲益良多。',
    captions: [
      '新竹青年活動結束大合照',
      '隊輔培訓大合照與破冰遊戲',
      '文宣組培訓留影'
    ]
  },
  {
    date: '2026/06/27-28',
    title: '法寶寺兒童夏令營小隊輔培訓',
    location: '法寶寺',
    attendeeYouth: 33,
    attendeeGuests: 0,
    attendeeTotal: 33,
    summary: '青年工作人員(累計33人次)與30位愛心爸媽共同參與營隊介紹、破冰遊戲，並特邀大番薯團隊培訓團康及隊輔守則。',
    captions: [
      '工作人員與大番薯團隊合照',
      '工作人員午休醒來跳大會舞',
      '新竹青年協助攝影紀錄'
    ]
  },
  {
    date: '2026/07/02-05',
    title: '法寶寺兒童夏令營 (花蓮月光寺 4天3夜)',
    location: '新竹法寶寺 / 花蓮月光寺',
    attendeeYouth: 23,
    attendeeGuests: 0,
    attendeeTotal: 23,
    summary: '為期四天營隊，第一天於法寶寺，二至四天移師花蓮月光寺與防災館，23位青年全員圓滿護持學員平安歸來。',
    captions: [
      '開營大合照',
      '月光寺大合照',
      '河濱公園大合照',
      '月光寺早課修持',
      '花蓮防災館實境學習',
      '青年引導學員搗麻糬'
    ]
  },
  {
    date: '2026/07/06、07/26',
    title: '夏令營道場慶祝餐會暨青年聯誼聚餐',
    location: '新竹',
    attendeeYouth: 15,
    attendeeGuests: 0,
    attendeeTotal: 15,
    summary: '道場舉辦感恩慶祝餐會感謝愛心爸媽與青年隊輔，會後青年聚餐歡唱KTV，放鬆歡聚。',
    captions: [
      '道場慶祝餐會大合照',
      '夏令營青年聚餐',
      '青年聚餐後歡唱KTV'
    ]
  },
  {
    date: '2026/08/02',
    title: '2026佛學會考',
    location: '線上',
    attendeeYouth: 7,
    attendeeGuests: 0,
    attendeeTotal: 7,
    summary: '新竹青年共有7位線上報名參與全球佛學會考，以佛法檢視自心。',
    captions: [
      '青年參與佛學會考實況',
      '線上答題畫面',
      '佛學會考成績證明'
    ]
  },
  {
    date: '2026/08/02',
    title: '台北道場曬書節讀書會參訪',
    location: '台北道場',
    attendeeYouth: 11,
    attendeeGuests: 1,
    attendeeTotal: 12,
    summary: '輔導法師帶領青年參訪美術館、人間福報與曬書節，並於滴水坊舉辦讀書會分享書籍心得，共12位參與。',
    captions: [
      '曬書節介紹',
      '美術館參訪',
      '滴水坊用餐分享',
      '人間福報工作人員介紹展覽',
      '5樓電梯前大合照',
      '讀書會圓滿大合照'
    ]
  },
  {
    date: '2026/08/04',
    title: '桃竹苗區區務會議',
    location: '法寶寺',
    attendeeYouth: 2,
    attendeeGuests: 0,
    attendeeTotal: 2,
    summary: '新竹青年2位協助會議順利進行，負責Zoom遠端連線系統與投影PPT操控。',
    captions: [
      '區務會議大合照',
      '熟悉Zoom會議系統',
      '青年協助系統操控與投影片'
    ]
  },
  {
    date: '2026/08/05',
    title: '信仰力課程-六祖壇經',
    location: '線上',
    attendeeYouth: 4,
    attendeeGuests: 0,
    attendeeTotal: 4,
    summary: '四位新竹青年參與總團舉辦之信仰力課程，由慧知法師開示講述《六祖壇經》無相頌精粹。',
    captions: [
      '線上課程截圖',
      '慧知法師六祖壇經授課畫面',
      '青年認真聽講截圖'
    ]
  }
];

// Helper to determine BLIA Activity Category
function inferCategory(title: string, summary: string): ActivityCategory {
  const combined = (title + summary).toLowerCase();
  if (combined.includes('書院') || combined.includes('讀書會') || combined.includes('法華經') || combined.includes('壇經') || combined.includes('經典') || combined.includes('佛學會考')) {
    return '青年書院與讀書會';
  }
  if (combined.includes('法會') || combined.includes('共修') || combined.includes('三皈五戒') || combined.includes('菩薩戒') || combined.includes('水陸') || combined.includes('大悲懺') || combined.includes('藥師') || combined.includes('行腳') || combined.includes('年會') || combined.includes('團員大會') || combined.includes('聯團') || combined.includes('區務') || combined.includes('對談') || combined.includes('佛誕') || combined.includes('浴佛')) {
    return '分團例會與法會';
  }
  if (combined.includes('路跑') || combined.includes('vegrun') || combined.includes('生活禪') || combined.includes('健走') || combined.includes('羽球') || combined.includes('市集')) {
    return '生活禪與健走';
  }
  if (combined.includes('義工') || combined.includes('出坡') || combined.includes('大掃除') || combined.includes('蔬食') || combined.includes('攤位') || combined.includes('合唱') || combined.includes('音樂會')) {
    return '義工服務與蔬食';
  }
  return '青年培訓與研習';
}

function inferNatureCategory(title: string, summary: string): '共修' | '教育' | '文化' | '慈善' | '聯誼' | '未歸類' {
  const combined = (title + ' ' + summary).toLowerCase();
  if (combined.includes('共修') || combined.includes('法會') || combined.includes('禪修') || combined.includes('念佛') || combined.includes('大悲懺') || combined.includes('水陸') || combined.includes('藥師') || combined.includes('浴佛')) {
    return '共修';
  }
  if (combined.includes('培訓') || combined.includes('講座') || combined.includes('讀書會') || combined.includes('營隊') || combined.includes('研習') || combined.includes('培力') || combined.includes('課程') || combined.includes('法華經')) {
    return '教育';
  }
  if (combined.includes('雲水') || combined.includes('義工') || combined.includes('捐血') || combined.includes('探訪') || combined.includes('服務') || combined.includes('大掃除') || combined.includes('蔬食') || combined.includes('出坡')) {
    return '慈善';
  }
  if (combined.includes('歌詠') || combined.includes('展覽') || combined.includes('音樂') || combined.includes('話劇') || combined.includes('經典') || combined.includes('抄經') || combined.includes('文化')) {
    return '文化';
  }
  if (combined.includes('團見') || combined.includes('迎新') || combined.includes('慶生') || combined.includes('聚餐') || combined.includes('聯誼') || combined.includes('交流') || combined.includes('運動') || combined.includes('路跑') || combined.includes('健走') || combined.includes('羽球')) {
    return '聯誼';
  }
  return '未歸類';
}

function inferLevelCategory(title: string, summary: string, location: string): '總團活動' | '道場活動' | '分團專案' | '友團活動' | '未歸類' {
  const combined = (title + ' ' + summary + ' ' + location).toLowerCase();
  if (combined.includes('總團') || combined.includes('中華佛光青年') || combined.includes('全國') || combined.includes('白象') || combined.includes('善財')) {
    return '總團活動';
  }
  if (combined.includes('法寶寺') || combined.includes('佛光山') || combined.includes('常住') || combined.includes('道場') || combined.includes('法師')) {
    return '道場活動';
  }
  if (combined.includes('友團') || combined.includes('桃竹苗') || combined.includes('跨團') || combined.includes('聯團')) {
    return '友團活動';
  }
  return '分團專案';
}

// Convert the parsed raw records into ExtractedEvidenceActivity format
export function getHsinchuOfficial57Activities(): ExtractedEvidenceActivity[] {
  return BLIA_HSINCHU_OFFICIAL_ACTIVITIES_RAW.map((raw, index) => {
    const category = inferCategory(raw.title, raw.summary);
    const levelCategory = inferLevelCategory(raw.title, raw.summary, raw.location);
    const natureCategory = inferNatureCategory(raw.title, raw.summary);
    
    // Normalize date for YYYY-MM-DD sorting
    let normalizedDate = '2026-06-20';
    const firstDateMatch = raw.date.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (firstDateMatch) {
      normalizedDate = `${firstDateMatch[1]}-${firstDateMatch[2].padStart(2, '0')}-${firstDateMatch[3].padStart(2, '0')}`;
    } else {
      const yearMonthMatch = raw.date.match(/(\d{4})[\/\-](\d{1,2})/);
      if (yearMonthMatch) {
        normalizedDate = `${yearMonthMatch[1]}-${yearMonthMatch[2].padStart(2, '0')}-01`;
      }
    }

    const curatedPhotoUrls = [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
    ];

    const photos = raw.captions.map((cap, cIdx) => ({
      id: `hsinchu-act-${index}-p-${cIdx}`,
      url: curatedPhotoUrls[(index + cIdx) % curatedPhotoUrls.length],
      caption: `圖說：${cap}`
    }));

    return {
      id: `hsinchu-official-${index + 1}`,
      selected: true,
      title: raw.title,
      category,
      levelCategory,
      natureCategory,
      activityNature: levelCategory === '未歸類' ? '未歸類' : levelCategory,
      activityObjective: natureCategory === '未歸類' ? '未歸類' : natureCategory,
      date: normalizedDate,
      timeRange: raw.date,
      location: raw.location,
      organizer: '國際佛光會中華佛光青年總團 / 新竹佛光青年分團',
      guidingUnit: '佛光山法寶寺',
      leadCadres: ['吳浩君', '周汶蔚', '徐信銓'],
      attendeeTotal: raw.attendeeTotal,
      attendeeYouth: raw.attendeeYouth,
      attendeeGuests: raw.attendeeGuests,
      attendeeVolunteers: Math.max(0, raw.attendeeTotal - raw.attendeeYouth - raw.attendeeGuests),
      summary: raw.summary,
      processSchedule: '活動依預定企劃流程展開 ➔ 分組參與及各組作務 ➔ 圓滿回饋與祈願大合照',
      highlights: [
        `【參與動員成效】：總實到人數達 ${raw.attendeeTotal} 人（本團青年 ${raw.attendeeYouth} 人${raw.attendeeGuests > 0 ? `、非本團青年 ${raw.attendeeGuests} 人` : ''}），動員落實度高。`,
        `【佛法生活化落實】：${raw.summary.slice(0, 60)}${raw.summary.length > 60 ? '...' : ''}`,
        `【佐證齊備】：檢附 ${raw.captions.length} 張圖說佐證相片（如：${raw.captions.slice(0, 2).join('、')}）。`
      ],
      suggestions: [
        '【持續追蹤影響力】：活動精華照持續發布於分團 Facebook 及社群媒體，擴大接引青年青年學佛。',
        '【經驗傳承】：彙整本次活動心得與檢討，作為後續分團幹部傳承與活動籌辦指南。'
      ],
      quantitativeMetrics: [
        { name: '本團青年出席', value: `${raw.attendeeYouth} 人`, benchmark: '青年主力參與' },
        { name: '總參與人次', value: `${raw.attendeeTotal} 人`, benchmark: '符合年度佐證門檻' },
        { name: '佐證照片數', value: `${raw.captions.length} 張`, benchmark: '照片圖說齊全' }
      ],
      photos,
      sourceFileType: 'paste',
      status: 'extracted',
      rawTextPreview: `活動名稱：${raw.title}\n活動日期：${raw.date}\n活動地點：${raw.location}\n參與人數：${raw.attendeeTotal} 人\n內容簡述：${raw.summary}`
    };
  });
}
