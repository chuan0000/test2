import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  Clock, 
  Activity, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowUpRight,
  TrendingUp,
  Gift
} from 'lucide-react';
import { CheckInRecord, IdentityType, MemberStats } from '../types';

interface LeaderboardProps {
  memberStats: MemberStats[];
  records: CheckInRecord[];
  onSelectMember: (memberName: string) => void;
  onOpenProofModal: (record: CheckInRecord) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  memberStats,
  records,
  onSelectMember,
  onOpenProofModal,
}) => {
  const [filterIdentity, setFilterIdentity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'checkins' | 'duration' | 'distance'>('checkins');

  // Filter & sort
  const filteredStats = memberStats
    .filter((stat) => {
      const matchIdentity = filterIdentity === 'all' || stat.identity === filterIdentity;
      const matchSearch = stat.memberName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchIdentity && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'checkins') {
        if (b.totalValidCheckIns !== a.totalValidCheckIns) return b.totalValidCheckIns - a.totalValidCheckIns;
        return b.totalDistanceKm - a.totalDistanceKm;
      }
      if (sortBy === 'duration') return b.totalDurationMinutes - a.totalDurationMinutes;
      return b.totalDistanceKm - a.totalDistanceKm;
    });

  // Top 3 Podium (from overall list)
  const top1 = memberStats[0];
  const top2 = memberStats[1];
  const top3 = memberStats[2];

  // Helper for member's latest approved record
  const getLatestRecord = (memberName: string) => {
    return records
      .filter((r) => r.memberName === memberName && r.status === 'approved')
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Top 3 Podium Section */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>2027 榮譽激勵排行 ｜ 前三名獨享個人專屬許願金</span>
          </div>
          <h2 className="text-2xl font-black text-[#2C3437] tracking-tight">
            即時榮譽排行榜
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            統計年度累計「有效打卡次數」，週週相聚線上開鏡，期末前三名由分團實現許願清單！
          </p>
        </div>

        {/* Podium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
          {/* Top 2 - Silver */}
          {top2 && (
            <div 
              onClick={() => onSelectMember(top2.memberName)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer relative order-2 md:order-1 group"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-600 text-white px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs">
                <Medal className="w-3.5 h-3.5" /> 🥈 亞軍 $500
              </div>
              <div className="text-center pt-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-xl text-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                  {top2.memberName.charAt(0)}
                </div>
                <h3 className="text-base font-bold text-[#2C3437] mt-2 flex items-center justify-center gap-1">
                  <span>{top2.memberName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-normal">
                    {top2.identity}
                  </span>
                </h3>

                <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <div className="text-2xl font-black text-[#70C1B3]">
                    {top2.totalValidCheckIns} <span className="text-xs font-normal text-stone-500">次打卡</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 flex justify-around">
                    <span>{top2.totalDurationMinutes} 分鐘</span>
                    <span>•</span>
                    <span>{top2.totalDistanceKm.toFixed(1)} km</span>
                  </div>
                </div>

                {top2.wish && (
                  <div className="mt-3 text-left p-2 rounded-lg bg-orange-50/70 border border-orange-200/60 text-[11px]">
                    <div className="font-bold text-[#F4A261] flex items-center gap-1">
                      <Gift className="w-3 h-3" /> 期末心儀願望：
                    </div>
                    <div className="text-stone-700 truncate font-medium mt-0.5">{top2.wish.wishName}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 1 - Gold (Center & Elevated) */}
          {top1 && (
            <div 
              onClick={() => onSelectMember(top1.memberName)}
              className="bg-gradient-to-b from-amber-50/60 via-white to-white rounded-2xl p-6 border-2 border-amber-300 shadow-md hover:shadow-lg transition-all cursor-pointer relative order-1 md:order-2 group -translate-y-0 md:-translate-y-3"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
                <Crown className="w-4 h-4 text-amber-200" /> 🥇 冠軍 $1,000 許願金
              </div>
              <div className="text-center pt-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-white flex items-center justify-center font-black text-2xl text-amber-900 shadow-md group-hover:scale-105 transition-transform">
                  {top1.memberName.charAt(0)}
                </div>
                <h3 className="text-lg font-black text-[#2C3437] mt-2.5 flex items-center justify-center gap-1.5">
                  <span>{top1.memberName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    {top1.identity}
                  </span>
                </h3>

                <div className="mt-3 bg-amber-500/10 rounded-xl p-3.5 border border-amber-500/20">
                  <div className="text-3xl font-black text-amber-700">
                    {top1.totalValidCheckIns} <span className="text-sm font-normal text-stone-600">次打卡</span>
                  </div>
                  <div className="text-xs font-medium text-stone-600 mt-1 flex justify-around">
                    <span>{top1.totalDurationMinutes} 分鐘</span>
                    <span>•</span>
                    <span>{top1.totalDistanceKm.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{top1.totalSteps.toLocaleString()} 步</span>
                  </div>
                </div>

                {top1.wish && (
                  <div className="mt-3 text-left p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                    <div className="font-bold text-amber-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 冠軍專屬許願禮：
                    </div>
                    <div className="text-stone-800 font-bold mt-0.5 truncate">{top1.wish.wishName}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 3 - Bronze */}
          {top3 && (
            <div 
              onClick={() => onSelectMember(top3.memberName)}
              className="bg-white rounded-2xl p-5 border border-amber-800/20 shadow-xs hover:shadow-md transition-all cursor-pointer relative order-3 group"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 to-amber-900 text-white px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs">
                <Medal className="w-3.5 h-3.5" /> 🥉 季軍 $500
              </div>
              <div className="text-center pt-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-900/10 border-2 border-amber-800/30 flex items-center justify-center font-black text-xl text-amber-900 shadow-inner group-hover:scale-105 transition-transform">
                  {top3.memberName.charAt(0)}
                </div>
                <h3 className="text-base font-bold text-[#2C3437] mt-2 flex items-center justify-center gap-1">
                  <span>{top3.memberName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-normal">
                    {top3.identity}
                  </span>
                </h3>

                <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <div className="text-2xl font-black text-[#70C1B3]">
                    {top3.totalValidCheckIns} <span className="text-xs font-normal text-stone-500">次打卡</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 flex justify-around">
                    <span>{top3.totalDurationMinutes} 分鐘</span>
                    <span>•</span>
                    <span>{top3.totalDistanceKm.toFixed(1)} km</span>
                  </div>
                </div>

                {top3.wish && (
                  <div className="mt-3 text-left p-2 rounded-lg bg-orange-50/70 border border-orange-200/60 text-[11px]">
                    <div className="font-bold text-[#F4A261] flex items-center gap-1">
                      <Gift className="w-3 h-3" /> 期末心儀願望：
                    </div>
                    <div className="text-stone-700 truncate font-medium mt-0.5">{top3.wish.wishName}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard Table Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#70C1B3]" />
            <h3 className="font-bold text-base text-[#2C3437]">全體團員累計數據榜</h3>
            <span className="text-xs text-stone-400">（共 {memberStats.length} 位青年）</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Identity Filter */}
            <div className="flex items-center rounded-xl bg-stone-100 p-1 text-xs">
              <button
                onClick={() => setFilterIdentity('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterIdentity === 'all' ? 'bg-white shadow-2xs text-[#2C3437] font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                全部對象
              </button>
              <button
                onClick={() => setFilterIdentity('在職青年')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterIdentity === '職青年' || filterIdentity === '在職青年' ? 'bg-white shadow-2xs text-[#2C3437] font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                在職青年
              </button>
              <button
                onClick={() => setFilterIdentity('在學學生')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterIdentity === '在學學生' ? 'bg-white shadow-2xs text-[#2C3437] font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                在學學生
              </button>
            </div>

            {/* Sort Toggles */}
            <div className="flex items-center rounded-xl bg-stone-100 p-1 text-xs">
              <button
                onClick={() => setSortBy('checkins')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'checkins' ? 'bg-[#70C1B3] text-white font-bold' : 'text-stone-500'
                }`}
              >
                依打卡次數
              </button>
              <button
                onClick={() => setSortBy('distance')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'distance' ? 'bg-[#70C1B3] text-white font-bold' : 'text-stone-500'
                }`}
              >
                依總里程
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="搜尋姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-[#2C3437] focus:outline-hidden focus:ring-1 focus:ring-[#70C1B3]"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2C3437]">
            <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center w-16">名次</th>
                <th className="px-4 py-3">團員姓名</th>
                <th className="px-4 py-3">身分</th>
                <th className="px-4 py-3 text-center">有效打卡天數</th>
                <th className="px-4 py-3 text-center">總運動時長</th>
                <th className="px-4 py-3 text-center">累積里程 / 步數</th>
                <th className="px-4 py-3">年度目標達成率</th>
                <th className="px-4 py-3 text-right">操作 / 紀錄</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredStats.map((stat, idx) => {
                const latest = getLatestRecord(stat.memberName);
                const targetRate = Math.min(100, Math.round((stat.totalValidCheckIns / 60) * 100));

                return (
                  <tr 
                    key={stat.memberName}
                    className="hover:bg-[#70C1B3]/5 transition-colors cursor-pointer"
                    onClick={() => onSelectMember(stat.memberName)}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-sm">
                          🥇
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-black text-sm">
                          🥈
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-900/10 text-amber-900 font-black text-sm">
                          🥉
                        </span>
                      ) : (
                        <span className="font-bold text-stone-500">{idx + 1}</span>
                      )}
                    </td>

                    {/* Member */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-2xs shrink-0"
                          style={{ backgroundColor: stat.avatarBg }}
                        >
                          {stat.memberName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#2C3437]">{stat.memberName}</div>
                          {stat.wish && (
                            <div className="text-[10px] text-stone-400 truncate max-w-[140px]">
                              願望: {stat.wish.wishName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Identity */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-600 font-medium">
                        {stat.identity}
                      </span>
                    </td>

                    {/* Check-ins */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-black text-base text-[#70C1B3]">
                        {stat.totalValidCheckIns}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-0.5">次</span>
                      {stat.totalPendingCheckIns > 0 && (
                        <span className="ml-1 text-[10px] text-amber-600 font-normal">
                          (+{stat.totalPendingCheckIns} 審核中)
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3.5 text-center font-semibold text-stone-700">
                      {stat.totalDurationMinutes} <span className="text-[10px] text-stone-400 font-normal">分</span>
                    </td>

                    {/* Distance & Steps */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="font-bold text-stone-800">{stat.totalDistanceKm.toFixed(1)} km</div>
                      <div className="text-[10px] text-stone-400">{stat.totalSteps.toLocaleString()} 步</div>
                    </td>

                    {/* Target Progress */}
                    <td className="px-4 py-3.5 min-w-[120px]">
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                        <span>進度 {targetRate}%</span>
                        <span>{stat.totalValidCheckIns}/60</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#70C1B3] to-[#F4A261] h-full rounded-full"
                          style={{ width: `${targetRate}%` }}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {latest && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProofModal(latest);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#70C1B3]/20 hover:text-[#70C1B3] text-stone-600 text-[11px] font-medium transition-colors"
                            title="查看最新運動雙軌截圖"
                          >
                            看最新證明
                          </button>
                        )}
                        <button
                          onClick={() => onSelectMember(stat.memberName)}
                          className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                          title="查看個人所有紀錄"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
