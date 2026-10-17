import React from 'react';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import { MainNavigationTab } from '../types';
import { HeroSection } from './HeroSection';
import { LeadershipSection } from './LeadershipSection';
import { EvidenceSection } from './EvidenceSection';
import { JoinUsSection } from './JoinUsSection';
import { EditableText } from './EditableText';

interface YouthIntroSectionProps {
  onNavigateTab: (tab: MainNavigationTab) => void;
  totalActivitiesCount?: number;
  activeYouthCount?: number;
}

export const YouthIntroSection: React.FC<YouthIntroSectionProps> = ({ 
  onNavigateTab,
  totalActivitiesCount = 57,
  activeYouthCount = 20,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-slate-100">
      
      {/* 1. Hero 2-Columns Section */}
      <HeroSection 
        onNavigateTab={onNavigateTab}
        totalActivitiesCount={totalActivitiesCount}
        activeYouthCount={activeYouthCount}
      />

      {/* 2. Four Grand Objectives & 57 Evidence Section */}
      <EvidenceSection 
        onNavigateTab={onNavigateTab}
        totalActivitiesCount={totalActivitiesCount}
      />

      {/* 3. Leadership Team Section */}
      <LeadershipSection />

      {/* 4. Regular Activity Calendar (常態作息行事曆) */}
      <section className="space-y-6 mb-12 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <EditableText fieldKey="intro_calendar_section_title" defaultText="常態聚會與精進作息" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              <EditableText fieldKey="intro_calendar_section_subtitle" defaultText="實踐生活佛法化、佛法生活化，青年聚會多元充實" />
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold self-start sm:self-auto">
            動靜一如 • 雙軌精進
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Calendar Card 1 */}
          <div className="p-5 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg shadow-black/30 space-y-2 hover:border-[#70C1B3]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                <EditableText fieldKey="intro_cal_1_days" defaultText="每週二、四" />
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                健康運動
              </span>
            </div>
            <div className="text-xs font-bold text-[#70C1B3]">
              <EditableText fieldKey="intro_cal_1_time" defaultText="20:30 ~ 21:30" />
            </div>
            <h4 className="font-bold text-sm text-white">
              <EditableText fieldKey="intro_cal_1_title" defaultText="雲端夜跑與健走" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <EditableText fieldKey="intro_cal_1_desc" multiline={true} defaultText="新竹護城河 / 法寶寺周邊 / 視訊開鏡與手錶雙軌審核打卡。" />
            </p>
          </div>

          {/* Calendar Card 2 */}
          <div className="p-5 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg shadow-black/30 space-y-2 hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                <EditableText fieldKey="intro_cal_2_days" defaultText="每月雙週日" />
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                知性共讀
              </span>
            </div>
            <div className="text-xs font-bold text-amber-400">
              <EditableText fieldKey="intro_cal_2_time" defaultText="14:00 ~ 16:30" />
            </div>
            <h4 className="font-bold text-sm text-white">
              <EditableText fieldKey="intro_cal_2_title" defaultText="法寶青年書院秋季班" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <EditableText fieldKey="intro_cal_2_desc" multiline={true} defaultText="法寶寺二樓雲水書坊，特邀各界名師與經典研讀、茶禪生活美學。" />
            </p>
          </div>

          {/* Calendar Card 3 */}
          <div className="p-5 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg shadow-black/30 space-y-2 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                <EditableText fieldKey="intro_cal_3_days" defaultText="每月特定週末" />
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                法會共修
              </span>
            </div>
            <div className="text-xs font-bold text-emerald-400">
              <EditableText fieldKey="intro_cal_3_time" defaultText="09:00 ~ 12:00" />
            </div>
            <h4 className="font-bold text-sm text-white">
              <EditableText fieldKey="intro_cal_3_title" defaultText="大悲懺 / 光明燈法會" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <EditableText fieldKey="intro_cal_3_desc" multiline={true} defaultText="佛光山法寶寺大雄寶殿，青年梵唄誦經共修、協助戒子搭衣與壇場執事。" />
            </p>
          </div>

          {/* Calendar Card 4 */}
          <div className="p-5 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg shadow-black/30 space-y-2 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                <EditableText fieldKey="intro_cal_4_days" defaultText="每季常態" />
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                戶外生活禪
              </span>
            </div>
            <div className="text-xs font-bold text-indigo-400">
              <EditableText fieldKey="intro_cal_4_time" defaultText="08:30 ~ 15:30" />
            </div>
            <h4 className="font-bold text-sm text-white">
              <EditableText fieldKey="intro_cal_4_title" defaultText="新竹生活禪古道行" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <EditableText fieldKey="intro_cal_4_desc" multiline={true} defaultText="新竹十八尖山、飛鳳山或步道，動態生活禪結合青年同儕聯誼與大自然正念。" />
            </p>
          </div>

        </div>
      </section>

      {/* 5. 獨立行動召集區與新竹法寶寺地圖導航指南 */}
      <JoinUsSection onNavigateTab={onNavigateTab} />

    </div>
  );
};
