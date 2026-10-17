import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Image as ImageIcon,
  Tag,
  Filter,
  X,
  ExternalLink,
  ChevronsUpDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MainNavigationTab, ActivityRecordItem } from '../types';
import { EditableText } from './EditableText';
import { getStoredActivities } from '../utils/activityStorage';
import { getHsinchuOfficial57Activities } from '../utils/bliaOfficialData';
import { ExtractedEvidenceActivity } from '../utils/documentParser';

interface EvidenceSectionProps {
  onNavigateTab: (tab: MainNavigationTab) => void;
  totalActivitiesCount?: number;
}

// Convert ExtractedEvidenceActivity or ActivityRecordItem to a unified display structure
interface UnifiedActivityItem {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  location: string;
  category: string;
  levelCategory: string;
  natureCategory: string;
  attendeeTotal: number;
  attendeeYouth: number;
  attendeeGuests?: number;
  attendeeVolunteers?: number;
  summary: string;
  leadCadres?: string[];
  photos: { id: string; url: string; caption?: string }[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  onNavigateTab,
  totalActivitiesCount = 57,
}) => {
  // 1. Objectives Overview Cards
  const [activeObjectiveTab, setActiveObjectiveTab] = useState<'all' | 'culture' | 'education' | 'practice' | 'charity'>('all');

  // 2. Real-time Search and Filter States for 57 Activities Accordion
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 3. Stored or Official Activities Reactive State
  const [rawActivities, setRawActivities] = useState<UnifiedActivityItem[]>(() => {
    const stored = getStoredActivities();
    if (stored && stored.length > 0) {
      return stored.map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        timeRange: item.timeRange || '',
        location: item.location || '佛光山法寶寺',
        category: item.category || '青年活動',
        levelCategory: item.levelCategory || item.activityNature || '分團專案',
        natureCategory: item.natureCategory || item.activityObjective || '文化弘揚佛法',
        attendeeTotal: item.attendeeTotal || 0,
        attendeeYouth: item.attendeeYouth || 0,
        attendeeGuests: item.attendeeGuests || 0,
        attendeeVolunteers: item.attendeeVolunteers || 0,
        summary: item.summary || '',
        leadCadres: item.leadCadres || [],
        photos: item.photos || []
      }));
    }
    // Fallback to official 57 activities dataset
    const official57 = getHsinchuOfficial57Activities();
    return official57.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      timeRange: item.timeRange || '',
      location: item.location || '佛光山法寶寺',
      category: item.category || '青年活動',
      levelCategory: item.levelCategory || item.activityNature || '分團專案',
      natureCategory: item.natureCategory || item.activityObjective || '文化弘揚佛法',
      attendeeTotal: item.attendeeTotal || 0,
      attendeeYouth: item.attendeeYouth || 0,
      attendeeGuests: item.attendeeGuests || 0,
      attendeeVolunteers: item.attendeeVolunteers || 0,
      summary: item.summary || '',
      leadCadres: item.leadCadres || ['吳浩君', '徐信銓'],
      photos: item.photos || []
    }));
  });

  // Reactive listener to update activities when modified anywhere
  useEffect(() => {
    const handleSync = () => {
      const stored = getStoredActivities();
      if (stored && stored.length > 0) {
        setRawActivities(stored.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          timeRange: item.timeRange || '',
          location: item.location || '佛光山法寶寺',
          category: item.category || '青年活動',
          levelCategory: item.levelCategory || item.activityNature || '分團專案',
          natureCategory: item.natureCategory || item.activityObjective || '文化弘揚佛法',
          attendeeTotal: item.attendeeTotal || 0,
          attendeeYouth: item.attendeeYouth || 0,
          attendeeGuests: item.attendeeGuests || 0,
          attendeeVolunteers: item.attendeeVolunteers || 0,
          summary: item.summary || '',
          leadCadres: item.leadCadres || [],
          photos: item.photos || []
        })));
      }
    };
    window.addEventListener('blia_activities_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('blia_activities_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const displayCount = rawActivities.length > 0 ? rawActivities.length : (totalActivitiesCount > 0 ? totalActivitiesCount : 57);

  // 4 Grand Objectives Reference Highlights
  const objectiveHighlights = [
    {
      id: 'culture',
      category: '以文化弘揚佛法',
      titleKey: 'objective_culture_title',
      summaryKey: 'objective_culture_summary',
      icon: '🎨',
      borderGlow: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      stats: '16 項活動 • 320 人次',
      summary: '以深入淺出、生活美學之方式引領青年體悟經典深意，結合音聲文藝弘法。',
      keyProjects: [
        '【法寶青年書院秋季班】：辦理 6 堂系列課（持戒意義、蔬食手作、藥師佛十二大願等），累計 51 人次深度精進。',
        '【信仰力課程-法華經導讀】：由團長吳浩君帶領青年解析法華奧義，讓佛法成為現代青年安身立命指南。',
        '【慧裴法師攝影展青年代表演出】：青年擔任司儀主持與開幕藝文展演，以青年活力接引社會大眾。',
        '【經典共讀會與大師著作讀書會】：常態於雲水書坊展開六祖壇經與人間佛教生活化探索。'
      ]
    },
    {
      id: 'education',
      category: '以教育培養人才',
      titleKey: 'objective_education_title',
      summaryKey: 'objective_education_summary',
      icon: '🎓',
      borderGlow: 'border-blue-500/30',
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      stats: '14 項活動 • 280 人次',
      summary: '貫徹幹部培訓機制，落實白象幹部考核，接軌全國論壇並參與各項專業研習。',
      keyProjects: [
        '【白象幹部考核與宣講員培訓】：徐信銓順利通過白象一級幹部考核，多位青年幹部取得宣講資格。',
        '【全國佛光青年論壇代表】：青年代表黃冠涵代表新竹分團於全國舞台發聲，探討佛教青年新視野。',
        '【桃竹苗區幹部講習會】：全體幹部參加區域培訓，精進團務運作、企劃撰寫與評鑑資料彙整。',
        '【生命教育與青年自我探索營】：結合職涯規劃、溝通引導與同儕心理支持系列培力工作坊。'
      ]
    },
    {
      id: 'practice',
      category: '以共修淨化人心',
      titleKey: 'objective_practice_title',
      summaryKey: 'objective_practice_summary',
      icon: '🧘',
      borderGlow: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      stats: '15 項活動 • 360 人次',
      summary: '動靜一如，每週夜跑健走落實動態禪修，每月大悲懺與法會修持精進道業。',
      keyProjects: [
        '【每週二四雲端夜跑健走】：結合智慧手錶與視訊開鏡雙軌審核，養成青年規律作息與動態禪修。',
        '【常態大悲懺法會青年共修】：每月定期前往法寶寺大雄寶殿隨喜誦經、清淨自心。',
        '【三皈五戒搭衣護持執事】：青年於法寶寺戒會擔任引贊、協助戒子搭衣，莊嚴佛事盛會。',
        '【戶外生活禪古道正念行】：前往十八尖山與郊山步道，在行走呼吸間實踐大自然正念。'
      ]
    },
    {
      id: 'charity',
      category: '以慈善福利社會',
      titleKey: 'objective_charity_title',
      summaryKey: 'objective_charity_summary',
      icon: '🤝',
      borderGlow: 'border-rose-500/30',
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      stats: '12 項活動 • 240 人次',
      summary: '力行三好四給精神，大寮典座出坡、雲水書車服務偏鄉、社區環保綠色生活。',
      keyProjects: [
        '【法寶寺法會大寮行堂出坡】：青年輪番排班支援廚房典座、洗碗行堂、行堂整理，廣結善緣。',
        '【雲水書車偏鄉校園說故事】：支援巡迴書車至新竹偏鄉小學，陪伴學童閱讀並推廣品格教育。',
        '【綠色生活低碳代步推廣】：鼓勵搭乘大眾運輸與步步減碳，結合健康生活推展蔬食環保。',
        '【臘八粥結緣發送分送社區】：歲末青年挽起袖子協助烹煮臘八粥，分送警消與里民溫暖長者。'
      ]
    }
  ];

  // Map active objective tab to keyword or filter tag
  const objectiveKeyMap: Record<string, string> = {
    culture: '文化',
    education: '教育',
    practice: '共修',
    charity: '慈善'
  };

  // Filter activities based on search query, objective, and level category
  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const objectiveKeyword = activeObjectiveTab !== 'all' ? objectiveKeyMap[activeObjectiveTab] : '';

    return rawActivities.filter((act) => {
      // 1. Objective filter
      if (objectiveKeyword) {
        const matchesObjective = 
          (act.natureCategory && act.natureCategory.includes(objectiveKeyword)) ||
          (act.category && act.category.includes(objectiveKeyword)) ||
          (act.title && act.title.includes(objectiveKeyword)) ||
          (act.summary && act.summary.includes(objectiveKeyword));
        if (!matchesObjective) return false;
      }

      // 2. Level Category filter
      if (levelFilter !== 'all') {
        const matchesLevel = act.levelCategory && act.levelCategory.includes(levelFilter);
        if (!matchesLevel) return false;
      }

      // 3. Keyword Search filter
      if (q) {
        const matchesKeyword = 
          act.title.toLowerCase().includes(q) ||
          act.summary.toLowerCase().includes(q) ||
          act.location.toLowerCase().includes(q) ||
          act.date.toLowerCase().includes(q) ||
          (act.levelCategory && act.levelCategory.toLowerCase().includes(q)) ||
          (act.natureCategory && act.natureCategory.toLowerCase().includes(q)) ||
          (act.category && act.category.toLowerCase().includes(q)) ||
          (act.leadCadres && act.leadCadres.some(c => c.toLowerCase().includes(q)));
        if (!matchesKeyword) return false;
      }

      return true;
    });
  }, [rawActivities, searchQuery, activeObjectiveTab, levelFilter]);

  // Toggle single accordion item
  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand / Collapse all
  const handleToggleExpandAll = () => {
    if (expandedIds.size === filteredActivities.length && filteredActivities.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredActivities.map(a => a.id)));
    }
  };

  return (
    <section className="space-y-8 mb-12">
      {/* 1. Header and Grand Objectives Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <EditableText fieldKey="intro_objectives_title" defaultText={`四大宗旨核心成果（${displayCount} 項佐證）`} />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            <EditableText 
              fieldKey="intro_objectives_subtitle" 
              defaultText="依據總團年度評鑑指標四大宗旨嚴格分類，紮實展現新竹分團全方位弘化成效" 
            />
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1E293B] rounded-2xl border border-white/10 overflow-x-auto no-scrollbar shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveObjectiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeObjectiveTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            全部宗旨 ({rawActivities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveObjectiveTab('culture')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeObjectiveTab === 'culture'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            文化 (16)
          </button>
          <button
            type="button"
            onClick={() => setActiveObjectiveTab('education')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeObjectiveTab === 'education'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            教育 (14)
          </button>
          <button
            type="button"
            onClick={() => setActiveObjectiveTab('practice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeObjectiveTab === 'practice'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            共修 (15)
          </button>
          <button
            type="button"
            onClick={() => setActiveObjectiveTab('charity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeObjectiveTab === 'charity'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            慈善 (12)
          </button>
        </div>
      </div>

      {/* 2. Top Objective Highlights Cards (Four Pillars of BLIA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {objectiveHighlights.map((obj) => {
          const isSelected = activeObjectiveTab === obj.id;
          return (
            <div
              key={obj.id}
              onClick={() => setActiveObjectiveTab(activeObjectiveTab === obj.id ? 'all' : (obj.id as any))}
              className={`p-5 rounded-2xl bg-[#1E293B] border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                isSelected 
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10' 
                  : `border-white/10 ${obj.borderGlow} hover:border-white/20 shadow-md`
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{obj.icon}</span>
                    <h3 className="text-sm font-black text-white">
                      <EditableText
                        fieldKey={obj.titleKey}
                        defaultText={obj.category}
                        className="text-white"
                      />
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${obj.badgeColor}`}>
                    {obj.stats.split('•')[0].trim()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  <EditableText
                    fieldKey={obj.summaryKey}
                    defaultText={obj.summary}
                    multiline={true}
                    className="text-slate-300"
                  />
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                <span>{isSelected ? '✓ 篩選中（點擊取消）' : '點擊快速篩選'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 【任務四核心】：57 項活動佐證庫即時搜尋過濾列與手風琴收折工具列 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg text-left space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* 即時搜尋框 */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="即時搜尋活動名稱、內容、主辦層級、性質或地點..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title="清除搜尋"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 層級篩選 Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-[#1E293B] text-white">全部主辦層級</option>
                <option value="總團" className="bg-[#1E293B] text-white">總團/總會活動</option>
                <option value="道場" className="bg-[#1E293B] text-white">道場活動</option>
                <option value="分團" className="bg-[#1E293B] text-white">分團專案活動</option>
                <option value="友團" className="bg-[#1E293B] text-white">友團活動</option>
              </select>
            </div>

            {/* 一鍵展開 / 收折 */}
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title={expandedIds.size === filteredActivities.length ? '全部收折' : '全部展開'}
            >
              {expandedIds.size === filteredActivities.length && filteredActivities.length > 0 ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>全部收折</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>全部展開</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 搜尋狀態列 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span>
              已篩選符合：<strong className="text-amber-400 font-bold">{filteredActivities.length}</strong> / {rawActivities.length} 項活動佐證
            </span>
            {(searchQuery || activeObjectiveTab !== 'all' || levelFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveObjectiveTab('all');
                  setLevelFilter('all');
                }}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                重設篩選
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            💡 點擊任一項目即可展開詳細摘要、照片圖說與人次分析
          </div>
        </div>
      </div>

      {/* 4. 手風琴收折架構（桌機雙欄排版與手機垂直流暢收合） */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1E293B] border border-white/10 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">查無符合搜尋條件之活動紀錄</h3>
          <p className="text-xs text-slate-400">
            請嘗試更換關鍵字、清除層級過濾，或點擊「重設篩選」檢視完整 57 項佐證。
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveObjectiveTab('all');
              setLevelFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
          >
            重設篩選條件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {filteredActivities.map((act) => {
            const isExpanded = expandedIds.has(act.id);
            const coverPhoto = act.photos[0]?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={act.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? 'bg-[#1E293B] border-amber-400/40 shadow-xl shadow-black/40 ring-1 ring-amber-400/20' 
                    : 'bg-[#1E293B]/90 border-white/10 hover:border-white/20 shadow-md'
                }`}
              >
                {/* Accordion Summary Header (可點擊收折開合) */}
                <div
                  onClick={() => toggleAccordion(act.id)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col justify-between gap-3 select-none group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Date Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#70C1B3]" />
                        {act.date}
                      </span>

                      {/* Level Badge */}
                      {act.levelCategory && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-300">
                          {act.levelCategory}
                        </span>
                      )}

                      {/* Nature / Objective Badge */}
                      {act.natureCategory && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
                          {act.natureCategory}
                        </span>
                      )}
                    </div>

                    {/* Expand / Collapse Icon */}
                    <div className={`w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:bg-white/10 ${
                      isExpanded ? 'rotate-180 text-amber-400' : 'text-slate-400'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Activity Title */}
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {act.title}
                  </h3>

                  {/* Summary Footer Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>參與 {act.attendeeTotal} 人 (青年 {act.attendeeYouth} 人)</span>
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-none text-slate-400">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{act.location}</span>
                      </span>
                    </div>

                    {act.photos.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>{act.photos.length} 張佐證圖</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Accordion Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-2 border-t border-white/10 space-y-4 bg-slate-900/40 text-left animate-in fade-in duration-200">
                    
                    {/* Activity Full Summary */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>活動主旨與具體推展效益：</span>
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-normal bg-white/5 p-3 rounded-xl border border-white/5">
                        {act.summary || '已完整依據國際佛光會中華佛光青年總團評鑑規範，由新竹青年分團策劃推展並建立完整核備佐證。'}
                      </p>
                    </div>

                    {/* Photo Gallery Grid */}
                    {act.photos.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                          <span>活動佐證照片與公文圖說（共 {act.photos.length} 張）：</span>
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {act.photos.map((photo, pIdx) => (
                            <div 
                              key={photo.id || pIdx}
                              className="group/photo relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 aspect-video"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || act.title}
                                className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                              />
                              {photo.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-slate-200 truncate">
                                  {photo.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400 block text-[10px]">青年人次</span>
                        <span className="text-white font-bold">{act.attendeeYouth} 人次</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400 block text-[10px]">總參與人數</span>
                        <span className="text-emerald-400 font-bold">{act.attendeeTotal} 人次</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px]">帶領幹部</span>
                        <span className="text-slate-200 font-medium truncate block">
                          {act.leadCadres && act.leadCadres.length > 0 ? act.leadCadres.join('、') : '新竹青年幹部團隊'}
                        </span>
                      </div>
                    </div>

                    {/* Direct Action Link to Activities / Evidence Editor */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        時間：{act.timeRange || act.date}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab('activities');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>進入佐證資料庫檢視</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Global Callout to full Evidence Library */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>57 項完整佐證庫包含多圖輪播、報備公文與量化參與人次</span>
          </div>
          <p className="text-xs text-slate-400">
            支援線上投影片即時生成、Google 簡報雙軌同步與 PDF 評鑑佐證冊列印。
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('activities')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>進入 57 項活動佐證庫</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
