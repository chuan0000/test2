import React, { useState } from 'react';
import { 
  HeartHandshake, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageCircle, 
  Share2, 
  Send, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Train, 
  Bus, 
  Car, 
  Navigation,
  CheckCircle2,
  FileText,
  Building2,
  Compass
} from 'lucide-react';
import { MainNavigationTab } from '../types';
import { EditableText } from './EditableText';

interface JoinUsSectionProps {
  onNavigateTab?: (tab: MainNavigationTab) => void;
}

export const JoinUsSection: React.FC<JoinUsSectionProps> = ({ onNavigateTab }) => {
  // Modal states for 3 actions
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // Copy status feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    identity: '在職青年',
    organization: '',
    interests: [] as string[],
    note: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available activities to tick
  const interestOptions = [
    '法寶青年書院（經典美學研習）',
    '每週二四雲端夜跑與健走（健康打卡）',
    '法會共修與壇場行儀（大悲懺、三皈五戒）',
    '偏鄉公益與雲水書車服務',
    '佛光青年幹部培訓與白象認證',
    '戶外生活禪古道正念行'
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const handleInterestToggle = (item: string) => {
    setFormData(prev => {
      const exists = prev.interests.includes(item);
      return {
        ...prev,
        interests: exists 
          ? prev.interests.filter(i => i !== item)
          : [...prev.interests, item]
      };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('請填寫姓名與聯絡電話！');
      return;
    }
    // Store in localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('blia_hsinchu_youth_registrations') || '[]');
      existing.push({
        ...formData,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('blia_hsinchu_youth_registrations', JSON.stringify(existing));
    } catch (err) {
      console.warn('Failed to save registration locally:', err);
    }
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      identity: '在職青年',
      organization: '',
      interests: [],
      note: ''
    });
    setIsSubmitted(false);
    setIsRegisterModalOpen(false);
  };

  return (
    <section id="join-us" className="scroll-mt-24 space-y-8 mb-16 text-left">
      
      {/* 1. 獨立行動召集旗艦橫幅 (Heroic Call to Action Banner) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-emerald-950/40 border-2 border-emerald-500/30 shadow-2xl p-6 sm:p-8 lg:p-10 text-left">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              <EditableText fieldKey="join_us_badge" defaultText="國際佛光會中華佛光青年總團 • 新竹分團誠摯號召" />
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-bold">
                科技新貴 ✕ 大專青年 ✕ 信仰扎根
              </span>
            </div>
          </div>

          {/* Slogan & Intro Heading */}
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              <EditableText 
                fieldKey="join_us_main_title" 
                defaultText="讓信仰成為創新的力量，遇見志同道合的同行善知識" 
              />
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <EditableText 
                fieldKey="join_us_main_subtitle" 
                multiline={true}
                defaultText="不論您是新竹科學園區工程師、在職青年、或是大專院校青年學子，新竹青年分團提供知性書院、夜跑運動、法會義工與跨界研習的溫暖舞台。在繁忙步調中找到心靈安定的力量！" 
              />
            </p>
          </div>

          {/* Feature Highlights Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-amber-400 font-black text-xs">
                <EditableText fieldKey="join_feature_1_title" defaultText="📚 知性書院" className="text-amber-400" />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                <EditableText fieldKey="join_feature_1_desc" defaultText="經典研讀與生活美學" className="text-slate-300" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-emerald-400 font-black text-xs">
                <EditableText fieldKey="join_feature_2_title" defaultText="🏃 雲端夜跑" className="text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                <EditableText fieldKey="join_feature_2_desc" defaultText="二四視訊開鏡與手錶審核" className="text-slate-300" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-blue-400 font-black text-xs">
                <EditableText fieldKey="join_feature_3_title" defaultText="🧘 法會出坡" className="text-blue-400" />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                <EditableText fieldKey="join_feature_3_desc" defaultText="大寮行堂與三皈五戒搭衣" className="text-slate-300" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-purple-400 font-black text-xs">
                <EditableText fieldKey="join_feature_4_title" defaultText="🤝 社會公益" className="text-purple-400" />
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                <EditableText fieldKey="join_feature_4_desc" defaultText="雲水書車與偏鄉關懷行" className="text-slate-300" />
              </div>
            </div>
          </div>

          {/* 2. 【核心三大醒目操作按鈕】 */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            
            {/* 按鈕 1：線上報名表單 */}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <EditableText
                fieldKey="join_btn_register"
                defaultText="線上填表報名入團"
                className="text-slate-950"
              />
              <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-bold ml-1">
                推薦首選
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 按鈕 2：官方 LINE / 社群 */}
            <button
              type="button"
              onClick={() => setIsLineModalOpen(true)}
              className="flex-1 px-5 py-3.5 rounded-2xl bg-[#06C755] hover:bg-[#05B34C] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#06C755]/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <MessageCircle className="w-4 h-4 text-white fill-current" />
              <EditableText
                fieldKey="join_btn_line"
                defaultText="官方 LINE 即時社群"
                className="text-white"
              />
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                加入群聊
              </span>
            </button>

            {/* 按鈕 3：追蹤 IG / FB */}
            <button
              type="button"
              onClick={() => setIsSocialModalOpen(true)}
              className="flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-pink-500/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Share2 className="w-4 h-4 text-white" />
              <EditableText
                fieldKey="join_btn_social"
                defaultText="追蹤社群 IG / FB"
                className="text-white"
              />
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                精彩花絮
              </span>
            </button>

          </div>

        </div>
      </div>

      {/* 3. 新竹法寶寺（新竹市東區民族路 241 巷 1 號）地圖導航提示與交通指南 */}
      <div className="rounded-3xl bg-[#1E293B] border border-white/10 p-6 sm:p-8 lg:p-9 shadow-xl space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                法
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <EditableText fieldKey="temple_guide_title" defaultText="駐點道場 • 佛光山法寶寺導航與交通指南" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <EditableText fieldKey="temple_guide_subtitle" defaultText="大新竹青年聚會、經典研讀、健康夜跑集合與實體共修基地" />
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=%E4%BD%9B%E5%85%89%E5%B1%B1%E6%B3%95%E5%AF%B6%E5%AF%BA"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Google Maps 一鍵導航</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            <button
              type="button"
              onClick={() => handleCopy('新竹市東區民族路241巷1號', 'address')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedText === 'address' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">已複製地址！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>複製地址</span>
                </>
              )}
            </button>

            <a
              href="tel:035325571"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>(03) 532-5571</span>
            </a>
          </div>
        </div>

        {/* 雙欄展示：左側即時互動地圖，右側道場核心資訊與聯絡 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 左側：Google Maps 嵌入式動態地圖 (佔 7 欄) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-slate-900 aspect-video sm:h-[340px] w-full">
              <iframe
                title="佛光山法寶寺地圖導航"
                src="https://maps.google.com/maps?q=%E4%BD%9B%E5%85%89%E5%B1%B1%E6%B3%95%E5%AF%B6%E5%AF%BA%20%E6%96%B0%E7%AB%B9%E5%B8%82%E6%9D%B1%E5%8D%80%E6%B0%91%E6%97%8F%E8%B7%AF241%E5%87%BD1%E8%99%9F&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale-[15%] contrast-[1.05]"
              />
              {/* Overlay Badge */}
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-md flex items-center gap-1.5 pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>佛光山法寶寺 • 新竹青年分團駐點</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>📍 新竹市東區民族路 241 巷 1 號（鄰近三民儒林、東園國小）</span>
              <a
                href="https://www.google.com/maps/place/%E4%BD%9B%E5%85%89%E5%B1%B1%E6%B3%95%E5%AF%B6%E5%AF%BA/@24.8088924,120.9786968,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>在 Google 地圖中查看全螢幕</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 右側：道場開放時間與秘書處資訊 (佔 5 欄) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>道場開放與青年聚會時段</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">週二至週日</span>
                  <span className="font-bold text-white">08:30 ~ 21:00</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">每週一</span>
                  <span className="text-amber-300 font-medium">全日休館整備</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">每週二、四</span>
                  <span className="text-teal-300 font-bold">20:30 雲端夜跑集合</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">雙週日下午</span>
                  <span className="text-emerald-300 font-bold">法寶青年書院上課</span>
                </div>
              </div>
            </div>

            {/* 幹部窗口 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-teal-400 tracking-wide uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>青年分團評鑑秘書處與幹部窗口</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">分團團長</span>
                  <span className="font-bold text-white">吳浩君（白象幹部 / 宣講員）</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">專案長 / 副團長</span>
                  <span className="font-bold text-white">徐信銓（白象一級幹部考核）</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">行政與評鑑秘書</span>
                  <span className="font-bold text-white">蔡育蓁 / 周汶蔚</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 4 大交通指南（RWD 響應式 4 欄或 2x2 網格） */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>詳細交通路線與抵達指南</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* 方式 1: 鐵路/步行 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 transition-all space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Train className="w-4 h-4" />
                <span>台鐵 / 步行</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <EditableText
                  fieldKey="join_transit_train_desc"
                  multiline={true}
                  defaultText={'• 新竹火車站：前站出口沿中華路二段往民族路直行，步行約 15 分鐘。\n• 北新竹火車站：出站經東光路至民族路，步行約 8~10 分鐘即達。'}
                  className="text-slate-300 whitespace-pre-line"
                />
              </p>
            </div>

            {/* 方式 2: 市區公車 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-teal-500/30 transition-all space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <Bus className="w-4 h-4" />
                <span>新竹市區公車</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <EditableText
                  fieldKey="join_transit_bus_desc"
                  multiline={true}
                  defaultText="搭乘市區公車「藍線」、「世博 3 號」至「東園國小站」或「糧食局站」下車，步行約 3 分鐘即可抵達法寶寺。"
                  className="text-slate-300"
                />
              </p>
            </div>

            {/* 方式 3: 自行開車 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-amber-500/30 transition-all space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Car className="w-4 h-4" />
                <span>自行開車 / 交流道</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <EditableText
                  fieldKey="join_transit_car_desc"
                  multiline={true}
                  defaultText={'• 國道一號：新竹交流道（95K）下，直行光復路二段往市區，上東大陸橋轉民族路 241 巷。\n• 國道三號：茄苳交流道下經景觀大道入市區。'}
                  className="text-slate-300 whitespace-pre-line"
                />
              </p>
            </div>

            {/* 方式 4: 停車資訊 */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Building2 className="w-4 h-4" />
                <span>停車指引</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <EditableText
                  fieldKey="join_transit_parking_desc"
                  multiline={true}
                  defaultText="法寶寺備有地下室專屬停車場與戶外訪客車位（大型活動請依青年幹部引導）；鄰近民族路與東光路兩側亦設有公有收費停車格。"
                  className="text-slate-300"
                />
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 彈窗 1：線上填表報名與入團預約 Modal */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#1E293B] border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={resetForm}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!isSubmitted ? (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>入團與活動參與線上預約</span>
                  </div>
                  <h3 className="text-xl font-black text-white">新竹佛光青年分團 • 歡迎您的加入</h3>
                  <p className="text-xs text-slate-400">
                    填寫後我們將有白象幹部專人與您聯繫，邀請您參加青年書院與各項精彩活動！
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        真實姓名 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="例如：王小明"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        聯絡電話 / 手機 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="例如：0912-345678"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Email & Identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        電子信箱 Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        目前身分類別
                      </label>
                      <select
                        value={formData.identity}
                        onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-hidden focus:border-emerald-400 cursor-pointer"
                      >
                        <option value="在職青年">在職青年 / 科技工程師</option>
                        <option value="大專院校學生">大專院校 / 研究所學生</option>
                        <option value="社會人士">一般社會人士 / 青年佛子</option>
                        <option value="高中生">高中 / 高職生</option>
                        <option value="其他">其他類別</option>
                      </select>
                    </div>
                  </div>

                  {/* Company / School */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      服務公司 / 就讀學校與科系
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="例如：台積電 / 清華大學 / 陽明交通大學"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                    />
                  </div>

                  {/* Interested Activities */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-bold">
                      感興趣的活動與修持（可複選）
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {interestOptions.map((opt) => {
                        const checked = formData.interests.includes(opt);
                        return (
                          <div
                            key={opt}
                            onClick={() => handleInterestToggle(opt)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2 ${
                              checked 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold' 
                                : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              checked ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600'
                            }`}>
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note / Message */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      想對分團幹部說的話 / 提問（選填）
                    </label>
                    <textarea
                      rows={3}
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="歡迎寫下您的想法、平時方便參加活動的時間或期待..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 resize-none"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>確認送出預約</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success confirmation */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">報名資料已順利送出！</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    感恩您的熱忱！新竹佛光青年分團秘書處幹部已收到您的預約資訊，將於 24 小時內透過電話或 LINE 與您確認近期的聚會資訊。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 text-left space-y-2 max-w-md mx-auto">
                  <div className="font-bold text-emerald-400">💡 溫馨提醒：</div>
                  <div>• 您也可以直接加入新竹分團官方 LINE 社群，第一時間掌握活動快訊。</div>
                  <div>• 常態雲端夜跑：每週二、四 20:30 線上開鏡運動。</div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsLineModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>前往加入官方 LINE</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    完成關閉
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 彈窗 2：官方 LINE 社群引導 Modal */}
      {/* ========================================================================= */}
      {isLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#1E293B] border border-white/10 shadow-2xl p-6 sm:p-8 text-center space-y-5">
            
            <button
              type="button"
              onClick={() => setIsLineModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#06C755]/20 text-[#06C755] flex items-center justify-center mx-auto border border-[#06C755]/30">
              <MessageCircle className="w-8 h-8 fill-current" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">新竹佛光青年 • 官方 LINE 社群</h3>
              <p className="text-xs text-slate-400">
                加入社群獲得第一手活動快訊、夜跑通知與青年書院報名通知
              </p>
            </div>

            {/* LINE ID Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">官方 LINE ID：</span>
                <span className="font-mono font-bold text-white text-sm">@blia_hsinchu_youth</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('@blia_hsinchu_youth', 'lineId')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedText === 'lineId' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製官方 LINE ID！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>複製官方 LINE ID</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="https://line.me/R/ti/p/@blia_hsinchu_youth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-black text-xs shadow-lg shadow-[#06C755]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>一鍵前往 LINE 加入官方好友</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[11px] text-slate-500">
                （若點擊未自動跳轉，請開啟 LINE 搜尋 ID：@blia_hsinchu_youth）
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 彈窗 3：追蹤 IG / FB 社群引導 Modal */}
      {/* ========================================================================= */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#1E293B] border border-white/10 shadow-2xl p-6 sm:p-8 text-center space-y-5">
            
            <button
              type="button"
              onClick={() => setIsSocialModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Share2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">追蹤新竹佛光青年社群平台</h3>
              <p className="text-xs text-slate-400">
                即時掌握青年影音花絮、Reels 短片、活動相簿與年度成果
              </p>
            </div>

            <div className="space-y-3">
              {/* Instagram Card */}
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-slate-900 border border-purple-500/30 hover:border-pink-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="space-y-0.5">
                  <div className="font-black text-white text-sm flex items-center gap-1.5">
                    <span>Instagram 官方專頁</span>
                  </div>
                  <div className="text-xs text-pink-300 font-mono">@blia_hsinchu_youth</div>
                  <div className="text-[11px] text-slate-400">活動日常短片、青年限動精選與花絮</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>

              {/* Facebook Card */}
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 hover:border-blue-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="space-y-0.5">
                  <div className="font-black text-white text-sm flex items-center gap-1.5">
                    <span>Facebook 官方粉絲專頁</span>
                  </div>
                  <div className="text-xs text-blue-300">新竹佛光青年分團 (法寶寺)</div>
                  <div className="text-[11px] text-slate-400">年度盛會相簿、活動公告與公文報備</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                關閉視窗
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
