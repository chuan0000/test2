import React, { useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Activity, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Video, 
  Gift, 
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { CheckInRecord, MemberStats } from '../types';
import { INITIAL_MEMBERS } from '../mockData';

interface PersonalHistoryProps {
  memberStats: MemberStats[];
  records: CheckInRecord[];
  selectedMemberName: string;
  onSelectMember: (name: string) => void;
  onOpenProofModal: (record: CheckInRecord) => void;
  onNavigateToCheckIn: () => void;
}

export const PersonalHistory: React.FC<PersonalHistoryProps> = ({
  memberStats,
  records,
  selectedMemberName,
  onSelectMember,
  onOpenProofModal,
  onNavigateToCheckIn,
}) => {
  const currentMember = selectedMemberName || INITIAL_MEMBERS[0].name;

  // Filter records for this member
  const memberRecords = records
    .filter((r) => r.memberName === currentMember)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const stats = memberStats.find((s) => s.memberName === currentMember);
  const rank = stats?.rank;
  const approvedCount = stats?.totalValidCheckIns || 0;
  const pendingCount = stats?.totalPendingCheckIns || 0;
  const totalMinutes = stats?.totalDurationMinutes || 0;
  const totalKm = stats?.totalDistanceKm || 0;
  const targetRate = Math.min(100, Math.round((approvedCount / 60) * 100));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Search & Member Selector Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2C3437] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#70C1B3]" /> 團員個人運動紀錄歷程
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            選擇團員姓名即可檢視個人累計運動里程、雙軌打卡審核狀態與歷史截圖。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-600 shrink-0">切換團員：</label>
          <select
            value={currentMember}
            onChange={(e) => onSelectMember(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
          >
            {memberStats.map((m) => (
              <option key={m.memberName} value={m.memberName}>
                {m.memberName} ({m.identity} - {m.totalValidCheckIns}次)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Profile Dashboard Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#70C1B3]/15 via-[#F4A261]/10 to-stone-50 p-6 border-b border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0"
                style={{ backgroundColor: stats?.avatarBg || '#70C1B3' }}
              >
                {currentMember.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#2C3437]">{currentMember}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700 font-medium">
                    {stats?.identity || '青年分團'}
                  </span>
                  {rank && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-600" />
                      {rank <= 3 ? `第 ${rank} 名 (入選前三名!)` : `目前排名第 ${rank} 名`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  2027 健走夜跑健康計畫 • 連續運動活力紀錄
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToCheckIn}
              className="px-4 py-2.5 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Flame className="w-4 h-4" /> 我要打卡
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center">
              <div className="text-[11px] text-stone-500 font-medium">有效打卡天數</div>
              <div className="text-2xl font-black text-[#70C1B3] mt-0.5">
                {approvedCount} <span className="text-xs font-normal text-stone-400">次</span>
              </div>
              {pendingCount > 0 && (
                <div className="text-[10px] text-amber-600 mt-0.5 font-medium">
                  {pendingCount} 筆審核中
                </div>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center">
              <div className="text-[11px] text-stone-500 font-medium">總運動時長</div>
              <div className="text-2xl font-black text-[#2C3437] mt-0.5">
                {totalMinutes} <span className="text-xs font-normal text-stone-400">分鐘</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                約 {(totalMinutes / 60).toFixed(1)} 小時
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center">
              <div className="text-[11px] text-stone-500 font-medium">累積跑走里程</div>
              <div className="text-2xl font-black text-[#F4A261] mt-0.5">
                {totalKm.toFixed(1)} <span className="text-xs font-normal text-stone-400">km</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {(stats?.totalSteps || 0).toLocaleString()} 步
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center">
              <div className="text-[11px] text-stone-500 font-medium">年度目標達成率</div>
              <div className="text-2xl font-black text-stone-800 mt-0.5">
                {targetRate}%
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                以 60 次為榮譽門檻
              </div>
            </div>
          </div>

          {/* Member Wish Banner */}
          {stats?.wish && (
            <div className="mt-4 bg-white/80 p-3.5 rounded-xl border border-[#F4A261]/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#F4A261] shrink-0" />
                <div>
                  <span className="font-bold text-[#2C3437]">個人期末許願禮：</span>
                  <span className="text-stone-700 font-semibold">{stats.wish.wishName}</span>
                  <span className="text-stone-400 text-[11px] ml-2">({stats.wish.category} • 市價約 NT$ {stats.wish.estimatedPrice})</span>
                </div>
              </div>
              <span className="text-[11px] text-[#F4A261] font-bold shrink-0">
                加油數：{stats.wish.likesCount} ❤️
              </span>
            </div>
          )}
        </div>

        {/* Workout History Timeline */}
        <div className="p-6">
          <h4 className="text-sm font-bold text-[#2C3437] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#70C1B3]" /> 運動打卡詳細紀錄清單 ({memberRecords.length} 筆)
          </h4>

          {memberRecords.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-xl border border-stone-200/60">
              <Activity className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs font-semibold text-stone-500">目前尚無任何打卡紀錄</p>
              <button
                onClick={onNavigateToCheckIn}
                className="mt-3 px-4 py-1.5 rounded-lg bg-[#70C1B3] text-white text-xs font-medium hover:bg-[#5db2a3] transition-colors"
              >
                立即填寫第一筆打卡
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {memberRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onOpenProofModal(record)}
                  className="bg-stone-50 hover:bg-[#70C1B3]/5 rounded-xl p-4 border border-stone-200/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-[#70C1B3] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#2C3437]">{record.workoutType}</span>
                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-xs font-medium text-stone-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {record.date} {record.time}
                        </span>
                        
                        {record.status === 'approved' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 已通過審核
                          </span>
                        )}
                        {record.status === 'pending' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 待審核
                          </span>
                        )}
                        {record.status === 'rejected' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> 退回補件
                          </span>
                        )}
                      </div>

                      {/* Workout stats metrics */}
                      <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
                        <span>時長：<strong className="text-[#70C1B3]">{record.durationMinutes} 分鐘</strong></span>
                        <span>里程：<strong>{record.distanceKm} km</strong> ({record.steps} 步)</span>
                        <span>熱量：<strong>{record.calories} kcal</strong></span>
                      </div>

                      {/* Note */}
                      {record.note && (
                        <p className="text-xs text-stone-500 italic mt-1">
                          「{record.note}」
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dual proof thumbnails & view button */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="flex -space-x-2 overflow-hidden">
                      {record.lineProofUrl ? (
                        <img
                          src={record.lineProofUrl}
                          alt="LINE"
                          className="w-8 h-8 rounded-lg object-cover border-2 border-white"
                          title="LINE 視訊截圖"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-lg bg-stone-200 border-2 border-white flex items-center justify-center text-[10px] text-stone-400 font-bold" 
                          title="無視訊截圖"
                        >
                          無
                        </div>
                      )}
                      {record.sportProofUrl ? (
                        <img
                          src={record.sportProofUrl}
                          alt="Sports"
                          className="w-8 h-8 rounded-lg object-cover border-2 border-white"
                          title="運動數據截圖"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-lg bg-stone-200 border-2 border-white flex items-center justify-center text-[10px] text-stone-400 font-bold" 
                          title="無運動截圖"
                        >
                          無
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenProofModal(record)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-[#2C3437] text-xs font-semibold group-hover:bg-[#70C1B3] group-hover:text-white group-hover:border-[#70C1B3] transition-colors cursor-pointer"
                    >
                      檢視雙軌截圖
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
