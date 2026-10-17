import React from 'react';
import { 
  Flame, 
  Trophy, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  Calendar, 
  Activity, 
  Clock,
  HeartHandshake,
  Leaf
} from 'lucide-react';
import { ActiveTab, CheckInRecord, MemberStats } from '../types';
import { EditableText } from './EditableText';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  memberStats: MemberStats[];
  records: CheckInRecord[];
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  memberStats,
  records,
  onOpenRules,
}) => {
  const approvedCount = records.filter((r) => r.status === 'approved').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const totalKm = memberStats.reduce((acc, curr) => acc + curr.totalDistanceKm, 0);
  const activeMembersCount = memberStats.filter((m) => m.totalValidCheckIns > 0).length;

  // Annual target goal (e.g. 200 total team sessions milestone)
  const annualGoal = 200;
  const progressPercent = Math.min(100, Math.round((approvedCount / annualGoal) * 100));

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'checkin', label: '我要打卡', icon: <Flame className="w-4 h-4" /> },
    { id: 'leaderboard', label: '即時排行榜', icon: <Trophy className="w-4 h-4" /> },
    { id: 'green', label: '🌱 綠色生活步步留', icon: <Leaf className="w-4 h-4 text-emerald-500" /> },
    { id: 'wishlist', label: '許願池牆', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'personal', label: '個人紀錄查詢', icon: <UserCheck className="w-4 h-4" /> },
    { 
      id: 'admin', 
      label: '管理員後台', 
      icon: <ShieldCheck className="w-4 h-4" />, 
      badge: pendingCount > 0 ? pendingCount : undefined 
    },
  ];

  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Bar */}
      <div className="bg-[#2C3437] text-stone-200 px-4 py-1.5 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#70C1B3] animate-pulse"></span>
            <span className="font-medium text-stone-300">
              國際佛光會新竹青年分團 ｜ 2027 青年健走跑步健康打卡計畫
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#F4A261]" /> 固定每週2天夜間 20:30-21:30
            </span>
            <button
              onClick={onOpenRules}
              className="text-[#70C1B3] hover:text-[#8ee4d5] underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3 h-3" /> 活動章程與獎金說明
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand & Hero Title */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#70C1B3] to-[#599e92] flex items-center justify-center text-white shadow-xs">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#2C3437] tracking-tight">
                  <EditableText fieldKey="health_header_title" defaultText="2027 跨界青年健康計畫" />
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 font-medium flex items-center gap-1.5">
                  <EditableText fieldKey="health_header_slogan" defaultText="步步有你，夜間相聚 • 線上開鏡連線 ✕ 運動數據雙軌認證" />
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-[#F8F9FA] px-3 py-2 rounded-xl border border-stone-200/80 text-center min-w-[90px]">
              <div className="text-[11px] text-stone-500 font-medium">
                <EditableText fieldKey="health_stat_approved_label" defaultText="年度有效打卡" />
              </div>
              <div className="text-lg font-black text-[#70C1B3] leading-tight">
                {approvedCount} <span className="text-xs font-normal text-stone-500">次</span>
              </div>
            </div>

            <div className="bg-[#F8F9FA] px-3 py-2 rounded-xl border border-stone-200/80 text-center min-w-[90px]">
              <div className="text-[11px] text-stone-500 font-medium">
                <EditableText fieldKey="health_stat_distance_label" defaultText="累積跑走里程" />
              </div>
              <div className="text-lg font-black text-[#F4A261] leading-tight">
                {totalKm.toFixed(1)} <span className="text-xs font-normal text-stone-500">km</span>
              </div>
            </div>

            <div className="bg-[#F8F9FA] px-3 py-2 rounded-xl border border-stone-200/80 text-center min-w-[90px]">
              <div className="text-[11px] text-stone-500 font-medium">
                <EditableText fieldKey="health_stat_members_label" defaultText="活躍分團青年" />
              </div>
              <div className="text-lg font-black text-[#2C3437] leading-tight">
                {activeMembersCount} <span className="text-xs font-normal text-stone-500">人</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-3 pt-2 border-t border-stone-100 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-stone-500 shrink-0 flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-[#70C1B3]" /> 2027 年度分團共修進度 ({approvedCount}/{annualGoal} 次)
          </span>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#70C1B3] to-[#F4A261] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-stone-600 shrink-0">{progressPercent}%</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-stone-100 pt-1 pb-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#70C1B3] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#2C3437] hover:bg-stone-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#70C1B3]' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
