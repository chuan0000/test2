import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * UI Text Key Definition & Default Dictionary
 * 儲存於 localStorage:
 * 1. blia_hsinchu_youth_site_content_v1 (全新 In-Place CMS 命名標準)
 * 2. blia_hsinchu_youth_custom_texts_v1 (相容舊版持久化金鑰)
 * 絕不污染 IndexedDB 佐證資料庫與活動物件
 */
export const SITE_CONTENT_STORAGE_KEY = 'blia_hsinchu_youth_site_content_v1';
export const UI_TEXTS_STORAGE_KEY = 'blia_hsinchu_youth_custom_texts_v1';

export interface UiTextItemDefinition {
  key: string;
  category: 'navbar' | 'archives' | 'slides' | 'proof' | 'admin' | 'common';
  categoryLabel: string;
  name: string;
  description: string;
  defaultText: string;
}

export const DEFAULT_UI_TEXTS_CATALOG: UiTextItemDefinition[] = [
  // 1. 頂部導覽列 (Navbar)
  {
    key: 'nav_status_bar_title',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '微狀態列專區標題',
    description: '頂部微狀態列左側專區文字',
    defaultText: '成果評鑑與青年專區'
  },
  {
    key: 'nav_status_guiding_label',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '微狀態列指導道場標籤',
    description: '頂部微狀態列指導道場字樣',
    defaultText: '指導道場：'
  },
  {
    key: 'nav_brand_title',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '品牌大標題',
    description: '導航欄左上方團別名稱',
    defaultText: '國際佛光會中華佛光青年總團 新竹青年分團'
  },
  {
    key: 'nav_brand_slogan',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '品牌精神標語',
    description: '大標題下方理念標語',
    defaultText: '傳承信仰 • 智慧創新 • 跨界健康 • 義工出坡'
  },
  {
    key: 'nav_tab_intro',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '首頁簡介分頁標籤',
    description: '頂部第一分頁按鈕文字',
    defaultText: '分團簡介'
  },
  {
    key: 'nav_tab_activities',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '活動成果分頁標籤',
    description: '頂部第二分頁按鈕文字',
    defaultText: '年度成果 (57項)'
  },
  {
    key: 'nav_tab_health',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '健康計畫分頁標籤',
    description: '頂部第三分頁按鈕文字',
    defaultText: '健康計畫'
  },
  {
    key: 'nav_tab_join',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '加入我們分頁標籤',
    description: '頂部第四分頁按鈕文字',
    defaultText: '加入我們'
  },
  {
    key: 'nav_btn_cloud_save',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '雲端備份按鈕',
    description: '頂端雲端備份存檔按鈕文字',
    defaultText: '💾 雲端備份存檔'
  },
  {
    key: 'nav_btn_cloud_load',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '讀取備份按鈕',
    description: '頂端開啟雲端備份按鈕文字',
    defaultText: '📂 開啟雲端備份'
  },
  {
    key: 'nav_btn_admin_toggle_off',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '管理員模式未開啟標籤',
    description: '頂部右上角未登入管理員時的切換按鈕文字',
    defaultText: '🔒 幹部登入 / 管理員模式'
  },
  {
    key: 'nav_btn_admin_toggle_on',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '管理員模式已開啟標籤',
    description: '頂部右上角已認證管理員時的醒目按鈕文字',
    defaultText: '🔑 管理員模式 (ON)'
  },
  {
    key: 'nav_btn_admin_enter_panel',
    category: 'navbar',
    categoryLabel: '頂部導覽列',
    name: '進入管理後台按鈕',
    description: '頂部管理員已開啟時的後台跳轉按鈕文字',
    defaultText: '進入管理後台'
  },

  // 1.1 新竹青年簡介看板 (Youth Intro Section)
  {
    key: 'intro_hero_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '簡介看板大標題',
    description: '首頁大型橫幅主標題',
    defaultText: '新竹青年分團'
  },
  {
    key: 'intro_hero_desc',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '簡介看板核心願景長文',
    description: '首頁大型橫幅核心理念介紹段落',
    defaultText: '立足新竹科技重鎮，駐點佛光山法寶寺。在常住法師與各界長老慈悲指導下，新竹青年分團以「傳承信仰 ✕ 智慧創新 ✕ 跨界健康」為核心願景，扎根四大宗旨，落實三好四給精神，打造現代化、具凝聚力且充滿活力的人間佛教青年社群。'
  },
  {
    key: 'intro_meta_temple_label',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '道場標籤',
    description: '橫幅元資訊道場標籤',
    defaultText: '道場'
  },
  {
    key: 'intro_meta_temple_value',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '道場名稱',
    description: '橫幅元資訊道場名稱',
    defaultText: '佛光山法寶寺'
  },
  {
    key: 'intro_meta_leader_label',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '團長標籤',
    description: '橫幅元資訊現任團長標籤',
    defaultText: '現任團長'
  },
  {
    key: 'intro_meta_leader_value',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '團長職稱與姓名',
    description: '橫幅元資訊現任團長資訊',
    defaultText: '吳浩君（白象幹部）'
  },
  {
    key: 'intro_meta_reports_label',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '佐證場次標籤',
    description: '橫幅元資訊申報場次標籤',
    defaultText: '申報活動場次'
  },
  {
    key: 'intro_meta_reports_value',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '佐證場次說明',
    description: '橫幅元資訊申報場次數值',
    defaultText: '57 項完整佐證'
  },
  {
    key: 'intro_meta_location_label',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '據點標籤',
    description: '橫幅元資訊據點標籤',
    defaultText: '主要駐點據點'
  },
  {
    key: 'intro_meta_location_value',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '據點地址摘要',
    description: '橫幅元資訊據點摘要',
    defaultText: '新竹市東區民族路'
  },
  {
    key: 'intro_btn_view_evidence',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '檢視佐證庫快捷按鈕',
    description: '橫幅中黃色跳轉佐證庫按鈕',
    defaultText: '檢視 57 項完整活動佐證庫'
  },
  {
    key: 'intro_btn_view_health',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '跨界健康計畫快捷按鈕',
    description: '橫幅中青綠色跳轉健康計畫按鈕',
    defaultText: '跨界青年健康計畫'
  },
  {
    key: 'intro_stats_section_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '看板成果標題',
    description: '官方申請表數據標題',
    defaultText: '新竹青年團看板'
  },
  {
    key: 'intro_stats_section_subtitle',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '看板成果副標題',
    description: '官方申請表數據說明',
    defaultText: '依據官方申請表各項考核指標之具體成果數據展現'
  },
  {
    key: 'intro_cadre_section_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '幹部陣容標題',
    description: '核心幹部區塊主標題',
    defaultText: '新竹青年分團 • 核心幹部服務陣容'
  },
  {
    key: 'intro_cadre_section_subtitle',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '幹部陣容副標題',
    description: '核心幹部區塊副標題說明',
    defaultText: '新竹青年分團幹部群與青年夥伴領銜服務'
  },
  {
    key: 'intro_objectives_section_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '四大宗旨標題',
    description: '四大宗旨活動深耕主標題',
    defaultText: '四大宗旨具體實績 • 57 項活動深度推展'
  },
  {
    key: 'intro_objectives_section_subtitle',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '四大宗旨副標題',
    description: '四大宗旨引言說明',
    defaultText: '落實星雲大師「以文化弘揚佛法、以教育培養人才、以共修淨化人心、以慈善福利社會」理念'
  },
  {
    key: 'intro_objectives_title',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '成果庫四大宗旨標題',
    description: '成果庫手風琴上方大標題',
    defaultText: '四大宗旨核心成果'
  },
  {
    key: 'intro_objectives_subtitle',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '成果庫四大宗旨副標',
    description: '成果庫手風琴上方副標題說明',
    defaultText: '依據總團年度評鑑指標四大宗旨嚴格分類，紮實展現新竹分團全方位弘化成效'
  },
  {
    key: 'objective_culture_title',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '文化宗旨卡片標題',
    description: '四大宗旨文化卡片大標題',
    defaultText: '以文化弘揚佛法'
  },
  {
    key: 'objective_culture_summary',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '文化宗旨卡片摘要',
    description: '文化卡片核心實績摘要',
    defaultText: '以深入淺出、生活美學之方式引領青年體悟經典深意，結合音聲文藝弘法。'
  },
  {
    key: 'objective_education_title',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '教育宗旨卡片標題',
    description: '四大宗旨教育卡片大標題',
    defaultText: '以教育培養人才'
  },
  {
    key: 'objective_education_summary',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '教育宗旨卡片摘要',
    description: '教育卡片核心實績摘要',
    defaultText: '貫徹幹部培訓機制，落實白象幹部考核，接軌全國論壇並參與各項專業研習。'
  },
  {
    key: 'objective_practice_title',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '共修宗旨卡片標題',
    description: '四大宗旨共修卡片大標題',
    defaultText: '以共修淨化人心'
  },
  {
    key: 'objective_practice_summary',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '共修宗旨卡片摘要',
    description: '共修卡片核心實績摘要',
    defaultText: '動靜一如，每週夜跑健走落實動態禪修，每月大悲懺與法會修持精進道業。'
  },
  {
    key: 'objective_charity_title',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '慈善宗旨卡片標題',
    description: '四大宗旨慈善卡片大標題',
    defaultText: '以慈善福利社會'
  },
  {
    key: 'objective_charity_summary',
    category: 'common',
    categoryLabel: '四大宗旨成果',
    name: '慈善宗旨卡片摘要',
    description: '慈善卡片核心實績摘要',
    defaultText: '力行三好四給精神，大寮典座出坡、雲水書車服務偏鄉、社區環保綠色生活。'
  },

  // 1.15 加入我們與交通指南 (Join Us & Transportation)
  {
    key: 'join_us_main_title',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '加入我們主標題',
    description: '加入我們大標題',
    defaultText: '遇見更好的自己 • 歡迎加入新竹佛光青年分團'
  },
  {
    key: 'join_us_main_subtitle',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '加入我們副標題',
    description: '加入我們召集內文引言',
    defaultText: '不論您是新竹科學園區工程師、在職青年、或是大專院校青年學子，新竹青年分團提供知性書院、夜跑運動、法會義工與跨界研習的溫暖舞台。在繁忙步調中找到心靈安定的力量！'
  },
  {
    key: 'join_feature_1_title',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 1 標題',
    description: '特色磚 1 標題',
    defaultText: '📚 知性書院'
  },
  {
    key: 'join_feature_1_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 1 說明',
    description: '特色磚 1 說明',
    defaultText: '經典研讀與生活美學'
  },
  {
    key: 'join_feature_2_title',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 2 標題',
    description: '特色磚 2 標題',
    defaultText: '🏃 雲端夜跑'
  },
  {
    key: 'join_feature_2_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 2 說明',
    description: '特色磚 2 說明',
    defaultText: '二四視訊開鏡與手錶審核'
  },
  {
    key: 'join_feature_3_title',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 3 標題',
    description: '特色磚 3 標題',
    defaultText: '🧘 法會出坡'
  },
  {
    key: 'join_feature_3_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 3 說明',
    description: '特色磚 3 說明',
    defaultText: '大寮行堂與三皈五戒搭衣'
  },
  {
    key: 'join_feature_4_title',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 4 標題',
    description: '特色磚 4 標題',
    defaultText: '🤝 社會公益'
  },
  {
    key: 'join_feature_4_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '特色磚 4 說明',
    description: '特色磚 4 說明',
    defaultText: '雲水書車與偏鄉關懷行'
  },
  {
    key: 'join_btn_register',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '按鈕 1：線上填表報名入團',
    description: '加入我們按鈕 1',
    defaultText: '線上填表報名入團'
  },
  {
    key: 'join_btn_line',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '按鈕 2：官方 LINE 即時社群',
    description: '加入我們按鈕 2',
    defaultText: '官方 LINE 即時社群'
  },
  {
    key: 'join_btn_social',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '按鈕 3：追蹤社群 IG / FB',
    description: '加入我們按鈕 3',
    defaultText: '追蹤社群 IG / FB'
  },
  {
    key: 'join_transit_train_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '交通指引：台鐵與步行',
    description: '台鐵與步行前往說明',
    defaultText: '• 新竹火車站：前站出口沿中華路二段往民族路直行，步行約 15 分鐘。\n• 北新竹火車站：出站經東光路至民族路，步行約 8~10 分鐘即達。'
  },
  {
    key: 'join_transit_bus_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '交通指引：市區公車',
    description: '公車搭乘路線指引',
    defaultText: '搭乘市區公車「藍線」、「世博 3 號」至「東園國小站」或「糧食局站」下車，步行約 3 分鐘即可抵達法寶寺。'
  },
  {
    key: 'join_transit_car_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '交通指引：自行開車',
    description: '自駕與交流道路線說明',
    defaultText: '• 國道一號：新竹交流道（95K）下，直行光復路二段往市區，上東大陸橋轉民族路 241 巷。\n• 國道三號：茄苳交流道下經景觀大道入市區。'
  },
  {
    key: 'join_transit_parking_desc',
    category: 'common',
    categoryLabel: '加入我們專區',
    name: '交通指引：停車指引',
    description: '道場停車場與周邊車位資訊',
    defaultText: '法寶寺備有地下室專屬停車場與戶外訪客車位（大型活動請依青年幹部引導）；鄰近民族路與東光路兩側亦設有公有收費停車格。'
  },

  // 1.16 全站頁尾 (Footer)
  {
    key: 'footer_platform_title',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾平台名稱',
    description: '頁尾左側大標題',
    defaultText: '國際佛光會中華佛光青年總團 • 新竹青年分團'
  },
  {
    key: 'footer_contact_info',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾地址與聯繫資訊',
    description: '頁尾道場地址與電話說明',
    defaultText: '新竹市東區民族路 241 巷 1 號（佛光山法寶寺）• 諮詢專線：(03) 532-5571'
  },
  {
    key: 'footer_copyright_text',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾版權所有字串',
    description: '頁尾最下方版權聲明',
    defaultText: '© 2026 BLIA Hsinchu Youth Branch. All rights reserved. 佛光山法寶寺 指導'
  },
  {
    key: 'footer_nav_intro',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾跳轉：分團簡介',
    description: '頁尾跳轉按鈕 1',
    defaultText: '分團簡介'
  },
  {
    key: 'footer_nav_activities',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾跳轉：年度成果',
    description: '頁尾跳轉按鈕 2',
    defaultText: '年度成果 (57項)'
  },
  {
    key: 'footer_nav_health',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾跳轉：健康計畫',
    description: '頁尾跳轉按鈕 3',
    defaultText: '健康計畫'
  },
  {
    key: 'footer_nav_join',
    category: 'common',
    categoryLabel: '全站頁尾',
    name: '頁尾跳轉：加入我們',
    description: '頁尾跳轉按鈕 4',
    defaultText: '加入我們'
  },
  {
    key: 'intro_calendar_section_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '常態作息標題',
    description: '常態修持與活動時程標題',
    defaultText: '新竹青年分團 • 常態修持與活動時程'
  },
  {
    key: 'intro_calendar_section_subtitle',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '常態作息副標題',
    description: '常態修持副標題說明',
    defaultText: '實踐生活佛法化、佛法生活化，青年聚會多元充實'
  },
  {
    key: 'intro_contact_org_title',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '團部聯絡名稱',
    description: '頁尾團部完整名稱',
    defaultText: '國際佛光會中華佛光青年總團 • 新竹青年分團'
  },
  {
    key: 'intro_contact_org_desc',
    category: 'common',
    categoryLabel: '新竹青年簡介看板',
    name: '團部邀請文字',
    description: '頁尾駐點與青年號召文字',
    defaultText: '常態駐點於佛光山法寶寺。誠摯歡迎大新竹、竹北、竹科園區在職青年與大專院校學子共同加入我們的行列！'
  },

  // 1.2 健康計畫專區 (Health Plan)
  {
    key: 'health_header_title',
    category: 'common',
    categoryLabel: '跨界健康計畫',
    name: '健康計畫主標題',
    description: '健康計畫頂部橫幅大標題',
    defaultText: '2027 跨界青年健康計畫'
  },
  {
    key: 'health_header_slogan',
    category: 'common',
    categoryLabel: '跨界健康計畫',
    name: '健康計畫標語',
    description: '健康計畫標題下方標語',
    defaultText: '步步有你，夜間相聚 • 線上開鏡連線 ✕ 運動數據雙軌認證'
  },
  {
    key: 'health_stat_approved_label',
    category: 'common',
    categoryLabel: '跨界健康計畫',
    name: '有效打卡標籤',
    description: '頂部統計卡片有效打卡標籤',
    defaultText: '年度有效打卡'
  },
  {
    key: 'health_stat_distance_label',
    category: 'common',
    categoryLabel: '跨界健康計畫',
    name: '跑走里程標籤',
    description: '頂部統計卡片累積里程標籤',
    defaultText: '累積跑走里程'
  },
  {
    key: 'health_stat_members_label',
    category: 'common',
    categoryLabel: '跨界健康計畫',
    name: '活躍青年標籤',
    description: '頂部統計卡片活躍青年標籤',
    defaultText: '活躍分團青年'
  },

  // 2. 活動成果子導航 (Activities Sub-Tabs)
  {
    key: 'subtab_proof_generator',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '佐證表子分頁標籤',
    description: '活動成果第一子標籤',
    defaultText: '優秀分團選拔活動佐證資料表'
  },
  {
    key: 'subtab_import_evidence',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '匯入佐證子分頁標籤',
    description: '活動成果第二子標籤',
    defaultText: '匯入活動佐證資料'
  },
  {
    key: 'subtab_all_archives',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '檔案庫子分頁標籤',
    description: '活動成果第三子標籤',
    defaultText: '分團專案活動成果檔案庫'
  },
  {
    key: 'subtab_meeting_slides',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '工作簡報子分頁標籤',
    description: '活動成果第四子標籤',
    defaultText: '聯團會議工作報告簡報'
  },

  // 3. 檔案庫主要按鈕與欄位 (Archives & Logs)
  {
    key: 'btn_add_activity',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '新增活動按鈕',
    description: '檔案庫上方綠色新增活動按鈕',
    defaultText: '新增活動'
  },
  {
    key: 'btn_export_json_backup',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '匯出備份 JSON 按鈕',
    description: '檔案庫全團成果備份打包按鈕',
    defaultText: '匯出全團備份 (JSON)'
  },
  {
    key: 'btn_import_json_backup',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '匯入備份還原按鈕',
    description: '檔案庫匯入還原備份按鈕',
    defaultText: '匯入備份還原'
  },
  {
    key: 'btn_delete_all_activities',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '一鍵刪除按鈕',
    description: '檔案庫紅色一鍵刪除所有檔案按鈕',
    defaultText: '一鍵刪除所有活動檔案'
  },
  {
    key: 'filter_label_date_range',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '日期區間篩選標籤',
    description: '活動清單日期區間提示文字',
    defaultText: '日期區間：'
  },
  {
    key: 'filter_label_nature',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '活動性質篩選標籤',
    description: '活動清單性質標籤（總團/道場/青年團）',
    defaultText: '活動性質：'
  },
  {
    key: 'filter_label_objective',
    category: 'archives',
    categoryLabel: '專案活動成果庫',
    name: '四大宗旨篩選標籤',
    description: '活動清單宗旨篩選標籤',
    defaultText: '四大宗旨：'
  },

  // 4. 聯團會議工作報告與 PPT 簡報 (Slides & Export)
  {
    key: 'slides_header_title',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: '簡報中心大標題',
    description: '簡報頂部彩色橫幅主標題',
    defaultText: '四大宗旨智慧分類 • PPT 自動化生成與 Canva 自由排版微調'
  },
  {
    key: 'slides_header_subtitle',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: '簡報中心副標題說明',
    description: '大標題下方架構說明文字',
    defaultText: '單一資料源架構：先勾選活動自動生成完整 16:9 PPT，隨時透過 Canva 畫布編輯器拖曳相片、修改字體與加入貼圖，儲存即時同步！'
  },
  {
    key: 'btn_slides_preview_tab',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: '簡報播放預覽分頁按鈕',
    description: '切換至 PPT 播放模式按鈕',
    defaultText: '📽️ PPT 簡報播放與預覽'
  },
  {
    key: 'btn_canva_editor_tab',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: 'Canva 畫布編輯器按鈕',
    description: '進入畫布編輯模式之分頁標籤',
    defaultText: '🎨 Canva 畫布編輯器'
  },
  {
    key: 'btn_export_ppt_modal',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: '輸出簡報主按鈕',
    description: '打開 PPT / PDF 匯出彈窗按鈕',
    defaultText: '輸出簡報'
  },
  {
    key: 'slides_step1_instruction',
    category: 'slides',
    categoryLabel: '簡報中心 (PPT)',
    name: '第一步選取活動提示',
    description: '抽屜收合條標題文字',
    defaultText: '第一步：勾選欲納入本次聯團會議 PPT 的活動紀錄：'
  },

  // 5. 管理後台 (Admin Panel)
  {
    key: 'admin_panel_title',
    category: 'admin',
    categoryLabel: '管理員後台',
    name: '管理員後台標題',
    description: '管理員幹部登入後主標題',
    defaultText: '管理員幹部後台'
  },
  {
    key: 'admin_panel_subtitle',
    category: 'admin',
    categoryLabel: '管理員後台',
    name: '後台副標題',
    description: '管理員後台說明文字',
    defaultText: '專供審核小組進行雙軌打卡審核、名單管理與出席報表匯出。'
  },
  {
    key: 'btn_admin_export_csv',
    category: 'admin',
    categoryLabel: '管理員後台',
    name: '匯出出席報表按鈕',
    description: '後台上方匯出 CSV 按鈕文字',
    defaultText: '匯出 CSV 出席報表'
  },
  {
    key: 'btn_admin_sheets_sync',
    category: 'admin',
    categoryLabel: '管理員後台',
    name: 'Google 試算表同步按鈕',
    description: '後台上方 Google 試算表同步按鈕文字',
    defaultText: 'Google 試算表同步'
  },

  // 6. 通用與系統操作 (Common)
  {
    key: 'btn_reset_filters',
    category: 'common',
    categoryLabel: '通用按鈕與提示',
    name: '重設篩選條件按鈕',
    description: '各清單重設為預設全部之文字',
    defaultText: '重設篩選（顯示全部）'
  },
  {
    key: 'label_empty_search',
    category: 'common',
    categoryLabel: '通用按鈕與提示',
    name: '查無活動結果提示',
    description: '篩選或搜尋結果為空時之提示字串',
    defaultText: '未找到符合目前篩選條件的活動'
  }
];

export type UiTextMap = Record<string, string>;

interface UiTextContextType {
  customTexts: UiTextMap;
  getText: (key: string, defaultFallbackText?: string) => string;
  updateText: (key: string, newText: string) => void;
  updateMultipleTexts: (updates: UiTextMap) => void;
  resetText: (key: string) => void;
  resetAllToDefault: () => void;
  catalog: UiTextItemDefinition[];
  // Inline Visual Edit Mode (Alt + Click)
  isVisualEditModeActive: boolean;
  setIsVisualEditModeActive: (active: boolean) => void;
  openInlineEditor: (key: string, defaultText: string) => void;
}

const UiTextContext = createContext<UiTextContextType | undefined>(undefined);

/**
 * 全域預設網站內容字典 (Default Site Content SSOT)
 */
export const defaultSiteContent: UiTextMap = DEFAULT_UI_TEXTS_CATALOG.reduce((acc, item) => {
  acc[item.key] = item.defaultText;
  return acc;
}, {} as UiTextMap);

export function getStoredUiTexts(): UiTextMap {
  try {
    // 優先讀取全新 site_content 儲存庫，若無則降級讀取相容庫
    const raw = localStorage.getItem(SITE_CONTENT_STORAGE_KEY) || localStorage.getItem(UI_TEXTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to load custom UI texts from localStorage:', e);
    return {};
  }
}

let textChangeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveStoredUiTexts(texts: UiTextMap): void {
  try {
    const json = JSON.stringify(texts);
    localStorage.setItem(SITE_CONTENT_STORAGE_KEY, json);
    localStorage.setItem(UI_TEXTS_STORAGE_KEY, json);
    
    // Debounce CustomEvent dispatch by 200ms to avoid high-frequency re-renders during fast typing
    if (textChangeDebounceTimer) {
      clearTimeout(textChangeDebounceTimer);
    }
    textChangeDebounceTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('blia_ui_texts_changed', { detail: texts }));
    }, 200);
  } catch (e) {
    console.error('Failed to save custom UI texts to localStorage:', e);
  }
}

export const UiTextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customTexts, setCustomTexts] = useState<UiTextMap>(() => getStoredUiTexts());
  const [isVisualEditModeActive, setIsVisualEditModeActive] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<{ key: string; defaultText: string; currentText: string } | null>(null);

  // Sync when changed from other components or tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SITE_CONTENT_STORAGE_KEY || e.key === UI_TEXTS_STORAGE_KEY) {
        setCustomTexts(getStoredUiTexts());
      }
    };
    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setCustomTexts(e.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('blia_ui_texts_changed', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('blia_ui_texts_changed', handleCustomEvent);
    };
  }, []);

  /**
   * 純字串替換函式，絕不傳回包含事件或覆蓋 DOM 的結構
   */
  const getText = (key: string, defaultFallbackText?: string): string => {
    if (customTexts[key] !== undefined && customTexts[key].trim() !== '') {
      return customTexts[key];
    }
    if (defaultFallbackText !== undefined) {
      return defaultFallbackText;
    }
    const def = DEFAULT_UI_TEXTS_CATALOG.find(item => item.key === key);
    return def ? def.defaultText : key;
  };

  const updateText = (key: string, newText: string) => {
    setCustomTexts(prev => {
      const next = { ...prev, [key]: newText };
      saveStoredUiTexts(next);
      return next;
    });
  };

  const updateMultipleTexts = (updates: UiTextMap) => {
    setCustomTexts(prev => {
      const next = { ...prev, ...updates };
      saveStoredUiTexts(next);
      return next;
    });
  };

  const resetText = (key: string) => {
    setCustomTexts(prev => {
      const next = { ...prev };
      delete next[key];
      saveStoredUiTexts(next);
      return next;
    });
  };

  const resetAllToDefault = () => {
    setCustomTexts({});
    saveStoredUiTexts({});
  };

  const openInlineEditor = (key: string, defaultText: string) => {
    const currentText = customTexts[key] !== undefined ? customTexts[key] : defaultText;
    setEditingTarget({ key, defaultText, currentText });
  };

  return (
    <UiTextContext.Provider
      value={{
        customTexts,
        getText,
        updateText,
        updateMultipleTexts,
        resetText,
        resetAllToDefault,
        catalog: DEFAULT_UI_TEXTS_CATALOG,
        isVisualEditModeActive,
        setIsVisualEditModeActive,
        openInlineEditor
      }}
    >
      {children}

      {/* 管理者就地編輯文字微型彈窗（僅修改文案字串，完全與原按鈕 onClick 解耦） */}
      {editingTarget && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEditingTarget(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-stone-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h4 className="text-sm font-black text-stone-800">
                  修改介面文案：<code className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">{editingTarget.key}</code>
                </h4>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTarget(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-500">
                原廠預設文字：
              </label>
              <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 select-all">
                {editingTarget.defaultText}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-700">
                自訂顯示文字：
              </label>
              <textarea
                rows={2}
                value={editingTarget.currentText}
                onChange={(e) => setEditingTarget({ ...editingTarget, currentText: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                placeholder="請輸入欲呈現的介面文案..."
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  resetText(editingTarget.key);
                  setEditingTarget(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold cursor-pointer"
              >
                還原預設
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-3.5 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateText(editingTarget.key, editingTarget.currentText);
                    setEditingTarget(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black cursor-pointer shadow-xs"
                >
                  儲存生效
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UiTextContext.Provider>
  );
};

export const useUiText = (): UiTextContextType => {
  const context = useContext(UiTextContext);
  if (!context) {
    throw new Error('useUiText must be used within a UiTextProvider');
  }
  return context;
};

/**
 * 簡易 Hook: 供元件直接取得純字串文字
 * 絕無副作用，絕不干擾按鈕 onClick 行為
 */
export function useText(key: string, defaultText: string): string {
  const { getText } = useUiText();
  return getText(key, defaultText);
}
