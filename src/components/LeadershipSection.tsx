import React from 'react';
import { Users, Award, ShieldCheck, Sparkles, ChevronRight, Crown } from 'lucide-react';
import { EditableText } from './EditableText';

export const LeadershipSection: React.FC = () => {
  // 1 Group Leader (團長專屬資料)
  const groupLeader = {
    id: 'leader_1',
    name: '吳浩君',
    certification: '白象幹部 / 宣講員',
    role: '分團團長',
    badgeLabel: '白象幹部認證',
    intro: '統籌新竹分團全般團務運作、法寶青年書院經典導讀、全團向心力凝聚與各項大型盛會司儀主持。',
    avatarColor: 'from-amber-400 via-amber-500 to-orange-500'
  };

  // 6 Leadership Team Members (下方 6 位幹部，排列為 3 欄 2 排)
  const remainingOfficers = [
    {
      id: 'leader_2',
      name: '徐信銓',
      certification: '白象一級幹部考核',
      role: '副團長 / 專案長',
      badgeLabel: '白象一級',
      intro: '推動跨界青年健康計畫、每週二四雲端夜跑健走雙軌審核、綠色蔬食減碳推廣與宣講。',
      avatarColor: 'from-teal-400 to-emerald-600'
    },
    {
      id: 'leader_3',
      name: '黃冠涵',
      certification: '佛光青年代表',
      role: '論壇代表 / 影音企劃',
      badgeLabel: '總團代表',
      intro: '全國佛光青年論壇新竹代表發聲、慧裴法師攝影展開幕表演與法會現場開場統籌。',
      avatarColor: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'leader_4',
      name: '邱婉甄',
      certification: '分團活動策劃',
      role: '活動策劃 / 總務幹部',
      badgeLabel: '分團幹部',
      intro: '慧裴法師攝影展青年代表演出、法會行儀與三皈五戒搭衣護持、分團社群文宣影像企劃。',
      avatarColor: 'from-purple-500 to-pink-500'
    },
    {
      id: 'leader_5',
      name: '鄭心蓮',
      certification: '生活美學講師',
      role: '書院美學 / 茶禪講師',
      badgeLabel: '專案講師',
      intro: '法寶青年書院課程講師、健康蔬食手作烘焙研習、茶禪美學帶領與經典生活化探索。',
      avatarColor: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'leader_6',
      name: '蔡育蓁',
      certification: '行政評鑑秘書',
      role: '行政秘書 / 評鑑統籌',
      badgeLabel: '評鑑統籌',
      intro: '分團年度佐證報告彙整、總團報備公文系統化建檔、活動成效量化統計追蹤。',
      avatarColor: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'leader_7',
      name: '周汶蔚',
      certification: '資深團員諮詢',
      role: '資深諮詢 / 典座支援',
      badgeLabel: '分團諮詢',
      intro: '分團歷史傳承與幹部經驗諮詢、大寮典座物資整備協調、桃竹苗跨團聯誼事務支援。',
      avatarColor: 'from-slate-600 to-slate-800'
    }
  ];

  return (
    <section className="space-y-8 mb-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#70C1B3]" />
            <EditableText fieldKey="intro_leadership_title" defaultText="核心幹部陣容與白象幹部認證" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            <EditableText 
              fieldKey="intro_leadership_subtitle" 
              defaultText="以信仰傳承為核心，秉持三好四給精神，扎根新竹科技城青年人才培訓" 
            />
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>白象幹部制度完整落實</span>
          </span>
        </div>
      </div>

      {/* 1. 破解 7 人網格殺手：最上方第一排獨立置中展示「團長（吳浩君）」專屬卡片 */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-2xl p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-amber-950/20 border-2 border-amber-500/30 shadow-xl shadow-amber-500/5 text-left relative overflow-hidden group hover:border-amber-400/50 transition-all">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
            <div className="flex items-center gap-4">
              {/* Leader Avatar with Crown */}
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${groupLeader.avatarColor} text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {groupLeader.name.slice(0, 1)}
                </div>
                <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>

              <div className="space-y-1.5 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-white text-lg sm:text-xl tracking-wide">
                    <EditableText fieldKey={`leader_${groupLeader.id}_name`} defaultText={groupLeader.name} />
                  </span>
                  {/* Badges */}
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 font-black flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{groupLeader.role}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs text-slate-200 font-bold">
                    {groupLeader.badgeLabel}
                  </span>
                </div>

                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <EditableText fieldKey={`leader_${groupLeader.id}_cert`} defaultText={groupLeader.certification} />
                  </span>
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-black self-start sm:self-center shrink-0">
              分團最高領導與團務統籌
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10">
            <EditableText 
              fieldKey={`leader_${groupLeader.id}_intro`} 
              multiline={true} 
              defaultText={groupLeader.intro} 
            />
          </div>
        </div>
      </div>

      {/* 2. 下方 6 位幹部排成整齊的 3 欄 2 排（grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {remainingOfficers.map((leader) => (
          <div
            key={leader.id}
            className="p-5 sm:p-6 rounded-2xl bg-[#1E293B] border border-white/10 shadow-lg shadow-black/20 hover:border-[#70C1B3]/50 transition-all duration-300 flex flex-col justify-between h-full group"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                {/* Officer Avatar */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${leader.avatarColor} text-white font-black text-base flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {leader.name.slice(0, 1)}
                </div>

                <div className="space-y-1.5 overflow-hidden flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-white text-base">
                      <EditableText fieldKey={`leader_${leader.id}_name`} defaultText={leader.name} />
                    </span>
                    {/* Badge 1: 扁平風格職稱膠囊徽章 */}
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-[11px] text-teal-300 font-bold whitespace-nowrap">
                      {leader.role.split('/')[0].trim()}
                    </span>
                    {/* Badge 2: 資格/考核標籤 */}
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-medium whitespace-nowrap">
                      {leader.badgeLabel}
                    </span>
                  </div>

                  <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      <EditableText fieldKey={`leader_${leader.id}_cert`} defaultText={leader.certification} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Description with equal height flex grow */}
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                <EditableText 
                  fieldKey={`leader_${leader.id}_intro`} 
                  multiline={true} 
                  defaultText={leader.intro} 
                />
              </p>
            </div>

            {/* Bottom Accent / Sub role */}
            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium truncate">{leader.role}</span>
              <span className="text-emerald-400 text-xs font-bold">幹部認證</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

