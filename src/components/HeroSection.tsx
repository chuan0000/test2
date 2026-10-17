import React from 'react';
import { 
  Award, 
  Users, 
  BadgeCheck, 
  Flame, 
  ArrowRight, 
  BookOpen, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Compass,
  Heart
} from 'lucide-react';
import { MainNavigationTab } from '../types';
import { EditableText } from './EditableText';
import { useUiText } from '../contexts/UiTextContext';

interface HeroSectionProps {
  onNavigateTab: (tab: MainNavigationTab) => void;
  totalActivitiesCount?: number;
  activeYouthCount?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateTab,
  totalActivitiesCount = 57,
  activeYouthCount = 20,
}) => {
  const { getText } = useUiText();

  // Dynamic / fallback stats avoiding empty cold start
  const displayActivities = totalActivitiesCount > 0 ? totalActivitiesCount : 57;
  const displayYouth = activeYouthCount > 0 ? activeYouthCount : 20;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 sm:p-10 lg:p-12 mb-10 text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 via-[#70C1B3]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-gradient-to-tr from-amber-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Grid 2-Cols for Desktop (lg:grid-cols-12) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column (lg:col-span-7): Core Vision & Hierarchical CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* Guiding Unit & Temple Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <EditableText 
              fieldKey="hero_badge_text" 
              defaultText="佛光山法寶寺指導 ✕ 國際佛光會中華佛光青年總團" 
            />
          </div>

          {/* Core Vision Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              <EditableText
                fieldKey="intro_hero_title"
                defaultText="新竹青年分團 • 智慧傳承 ✕ 跨界共好"
              />
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
              <EditableText
                fieldKey="intro_hero_desc"
                multiline={true}
                defaultText="立足新竹科技重鎮，常態駐點佛光山法寶寺。在常住法師慈悲指導下，以「傳承信仰 ✕ 智慧創新 ✕ 跨界健康」為願景，深耕四大宗旨與三好四給精神，打造活力凝聚的人間佛教青年社群。"
                className="text-slate-300"
              />
            </p>
          </div>

          {/* Key Application Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 pb-2 border-y border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">
                <EditableText fieldKey="intro_meta_temple_label" defaultText="指導道場" />
              </span>
              <span className="font-bold text-white text-xs sm:text-sm">
                <EditableText fieldKey="intro_meta_temple_value" defaultText="佛光山法寶寺" />
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                <EditableText fieldKey="intro_meta_leader_label" defaultText="現任團長" />
              </span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                <EditableText fieldKey="intro_meta_leader_value" defaultText="吳浩君（白象幹部）" />
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                <EditableText fieldKey="intro_meta_reports_label" defaultText="年度成果歸檔" />
              </span>
              <span className="font-bold text-amber-400 text-xs sm:text-sm">
                <EditableText fieldKey="intro_meta_reports_value" defaultText={`${displayActivities} 項完整佐證`} />
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                <EditableText fieldKey="intro_meta_location_label" defaultText="主要駐點據點" />
              </span>
              <span className="font-bold text-white text-xs sm:text-sm">
                <EditableText fieldKey="intro_meta_location_value" defaultText="新竹市東區民族路" />
              </span>
            </div>
          </div>

          {/* CTA Buttons: Hierarchical Primary (Glowing Green) + Secondary (Ghost) */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            
            {/* Primary CTA: 綠色呼吸微光「跨界青年健康計畫」 */}
            <button
              type="button"
              onClick={() => onNavigateTab('health')}
              className="group relative px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50 hover:ring-emerald-300 transition-all duration-300 flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </span>
              <span className="text-base group-hover:scale-110 transition-transform">🍃</span>
              <span>
                {getText('intro_btn_view_health', '跨界青年健康計畫')}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary CTA: 幽靈外框「檢視 57 項佐證庫」 */}
            <button
              type="button"
              onClick={() => onNavigateTab('activities')}
              className="px-6 py-3.5 rounded-2xl border border-white/20 hover:border-amber-400/80 bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>
                {getText('intro_btn_view_evidence', `檢視 ${displayActivities} 項佐證庫`)}
              </span>
            </button>

          </div>

        </div>

        {/* Right Column (lg:col-span-5): Bento-Grid Statistics Cards */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Bento Card 1: 佐證成果 */}
            <div className="p-4 rounded-2xl bg-[#1E293B] border border-white/10 shadow-xl shadow-black/40 text-left space-y-2 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">年度佐證成果</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {displayActivities}
                  <span className="text-xs font-bold text-slate-400 ml-1">項</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">涵蓋四大宗旨無缺漏</p>
              </div>
            </div>

            {/* Bento Card 2: 總動員人次 */}
            <div className="p-4 rounded-2xl bg-[#1E293B] border border-white/10 shadow-xl shadow-black/40 text-left space-y-2 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">青年總動員</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  800+
                  <span className="text-xs font-bold text-slate-400 ml-1">人次</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">法會、書院與出坡</p>
              </div>
            </div>

            {/* Bento Card 3: 白象幹部認證 */}
            <div className="p-4 rounded-2xl bg-[#1E293B] border border-white/10 shadow-xl shadow-black/40 text-left space-y-2 hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">白象幹部培訓</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  100%
                  <span className="text-xs font-bold text-slate-400 ml-1">通過</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">白象論壇代表與宣講員</p>
              </div>
            </div>

            {/* Bento Card 4: 常態共修雙軌 */}
            <div className="p-4 rounded-2xl bg-[#1E293B] border border-white/10 shadow-xl shadow-black/40 text-left space-y-2 hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">常態雙軌作息</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  每週
                  <span className="text-xs font-bold text-slate-400 ml-1">二、四</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">夜跑健走 ✕ 青年書院</p>
              </div>
            </div>

          </div>

          {/* Status highlight ribbon underneath */}
          <div className="mt-3.5 p-3 rounded-xl bg-[#1E293B]/70 border border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">評鑑各項成果指標已完全歸檔</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              100% READY
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
