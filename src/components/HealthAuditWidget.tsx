import React, { useMemo } from 'react';
import { 
  ActivityRecordItem 
} from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Users, 
  BarChart3, 
  Sparkles, 
  Filter, 
  X,
  Palette,
  Heart,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { classifyActivityObjective } from './MeetingReportSlidesSection';

export interface HealthAuditStats {
  totalCount: number;
  completeCount: number;
  missingPhotosCount: number;
  missingAttendeesCount: number;
  completionRate: number;
  objectives: {
    culture: number;
    charity: number;
    cultivation: number;
    affinity: number;
  };
}

interface HealthAuditWidgetProps {
  activities: ActivityRecordItem[];
  currentAuditFilter: 'all' | 'needs_photos' | 'needs_attendees' | 'complete';
  selectedObjective: string;
  onSelectAuditFilter: (filter: 'all' | 'needs_photos' | 'needs_attendees' | 'complete') => void;
  onSelectObjective: (objective: string) => void;
  onResetFilters: () => void;
}

export const HealthAuditWidget: React.FC<HealthAuditWidgetProps> = ({
  activities,
  currentAuditFilter,
  selectedObjective,
  onSelectAuditFilter,
  onSelectObjective,
  onResetFilters
}) => {
  const stats: HealthAuditStats = useMemo(() => {
    const totalCount = activities.length;
    let completeCount = 0;
    let missingPhotosCount = 0;
    let missingAttendeesCount = 0;

    let culture = 0;
    let charity = 0;
    let cultivation = 0;
    let affinity = 0;

    for (const act of activities) {
      const hasPhotos = Boolean(act.photos && act.photos.length >= 2);
      const hasAttendees = Boolean(act.attendeeTotal && act.attendeeTotal > 0);

      if (hasPhotos && hasAttendees) {
        completeCount++;
      }
      if (!hasPhotos) {
        missingPhotosCount++;
      }
      if (!hasAttendees) {
        missingAttendeesCount++;
      }

      // Objective classification
      const obj = classifyActivityObjective(act);
      if (obj === '文化教育') culture++;
      else if (obj === '慈善福利') charity++;
      else if (obj === '共修淨化') cultivation++;
      else affinity++;
    }

    const completionRate = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

    return {
      totalCount,
      completeCount,
      missingPhotosCount,
      missingAttendeesCount,
      completionRate,
      objectives: {
        culture,
        charity,
        cultivation,
        affinity
      }
    };
  }, [activities]);

  const hasActiveFilter = currentAuditFilter !== 'all' || selectedObjective !== 'all';

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
      
      {/* Top Title & Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center font-bold shadow-xs">
            <BarChart3 className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                評鑑指標達成率與缺件防呆儀表板
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
                共 {stats.totalCount} 場活動
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              自動稽核佐證相片數量（需滿2張）與出席人次，保障分團評鑑佐證完整無漏。
            </p>
          </div>
        </div>

        {/* Completion Rate Pill & Reset */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">總歸檔完整率</span>
            <span className={`font-mono font-bold text-sm ${
              stats.completionRate >= 90 ? 'text-emerald-600' : stats.completionRate >= 75 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {stats.completionRate}%
            </span>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="清除目前所有篩選條件"
            >
              <X className="w-3.5 h-3.5" />
              <span>清除篩選</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Metric Cards (Click to Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Metric 1: Fully Archived */}
        <button
          type="button"
          onClick={() => onSelectAuditFilter(currentAuditFilter === 'complete' ? 'all' : 'complete')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group flex items-center justify-between ${
            currentAuditFilter === 'complete'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-stone-50/70 hover:bg-emerald-50/40 border-stone-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-600 font-medium group-hover:text-emerald-900 transition-colors">
                已完整歸檔
              </div>
              <div className="text-lg font-black text-stone-900 font-mono">
                {stats.completeCount} <span className="text-xs font-normal text-stone-500">場</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            {stats.totalCount > 0 ? Math.round((stats.completeCount / stats.totalCount) * 100) : 0}%
          </span>
        </button>

        {/* Metric 2: Missing Photos (Needs attention) */}
        <button
          type="button"
          onClick={() => onSelectAuditFilter(currentAuditFilter === 'needs_photos' ? 'all' : 'needs_photos')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group flex items-center justify-between ${
            currentAuditFilter === 'needs_photos'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : stats.missingPhotosCount > 0
              ? 'bg-amber-50/40 hover:bg-amber-50 border-amber-200 hover:border-amber-400'
              : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              stats.missingPhotosCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'
            }`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-600 font-medium group-hover:text-amber-950 transition-colors">
                待補相片（少於2張）
              </div>
              <div className={`text-lg font-black font-mono ${
                stats.missingPhotosCount > 0 ? 'text-amber-700' : 'text-stone-900'
              }`}>
                {stats.missingPhotosCount} <span className="text-xs font-normal text-stone-500">場</span>
              </div>
            </div>
          </div>
          {stats.missingPhotosCount > 0 ? (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              點擊補件
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              全數齊全
            </span>
          )}
        </button>

        {/* Metric 3: Missing Attendees */}
        <button
          type="button"
          onClick={() => onSelectAuditFilter(currentAuditFilter === 'needs_attendees' ? 'all' : 'needs_attendees')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group flex items-center justify-between ${
            currentAuditFilter === 'needs_attendees'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
              : stats.missingAttendeesCount > 0
              ? 'bg-rose-50/40 hover:bg-rose-50 border-rose-200 hover:border-rose-400'
              : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              stats.missingAttendeesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-600 font-medium group-hover:text-rose-950 transition-colors">
                待填人次（未填人數）
              </div>
              <div className={`text-lg font-black font-mono ${
                stats.missingAttendeesCount > 0 ? 'text-rose-600' : 'text-stone-900'
              }`}>
                {stats.missingAttendeesCount} <span className="text-xs font-normal text-stone-500">場</span>
              </div>
            </div>
          </div>
          {stats.missingAttendeesCount > 0 ? (
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              點擊補件
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              全數齊全
            </span>
          )}
        </button>

      </div>

      {/* Four Grand Objectives Distribution Bar */}
      <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">四大宗旨活動分佈與均衡度：</span>
            <span className="text-stone-500 text-[11px] hidden sm:inline">（點擊任一宗旨可快速篩選活動）</span>
          </div>
          {selectedObjective !== 'all' && (
            <span className="text-amber-800 text-xs font-bold flex items-center gap-1">
              已篩選：{selectedObjective}
              <button 
                type="button" 
                onClick={() => onSelectObjective('all')} 
                className="hover:text-stone-900 ml-1"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${stats.totalCount > 0 ? (stats.objectives.culture / stats.totalCount) * 100 : 25}%` }}
            className="h-full bg-blue-600 transition-all duration-300 hover:opacity-90"
            title={`文化教育: ${stats.objectives.culture} 場`}
          />
          <div 
            style={{ width: `${stats.totalCount > 0 ? (stats.objectives.charity / stats.totalCount) * 100 : 25}%` }}
            className="h-full bg-emerald-600 transition-all duration-300 hover:opacity-90"
            title={`慈善福利: ${stats.objectives.charity} 場`}
          />
          <div 
            style={{ width: `${stats.totalCount > 0 ? (stats.objectives.cultivation / stats.totalCount) * 100 : 25}%` }}
            className="h-full bg-amber-600 transition-all duration-300 hover:opacity-90"
            title={`共修淨化: ${stats.objectives.cultivation} 場`}
          />
          <div 
            style={{ width: `${stats.totalCount > 0 ? (stats.objectives.affinity / stats.totalCount) * 100 : 25}%` }}
            className="h-full bg-purple-600 transition-all duration-300 hover:opacity-90"
            title={`組織結緣: ${stats.objectives.affinity} 場`}
          />
        </div>

        {/* Interactive Legend Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Culture */}
          <button
            type="button"
            onClick={() => onSelectObjective(selectedObjective === '文化' ? 'all' : '文化')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              selectedObjective === '文化'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${selectedObjective === '文化' ? 'bg-white' : 'bg-blue-600'}`} />
              <span>文化教育</span>
            </div>
            <span className="font-mono font-bold">
              {stats.objectives.culture} <span className="text-[10px] opacity-75">({stats.totalCount > 0 ? Math.round((stats.objectives.culture / stats.totalCount) * 100) : 0}%)</span>
            </span>
          </button>

          {/* Charity */}
          <button
            type="button"
            onClick={() => onSelectObjective(selectedObjective === '慈善' ? 'all' : '慈善')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              selectedObjective === '慈善'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${selectedObjective === '慈善' ? 'bg-white' : 'bg-emerald-600'}`} />
              <span>慈善福利</span>
            </div>
            <span className="font-mono font-bold">
              {stats.objectives.charity} <span className="text-[10px] opacity-75">({stats.totalCount > 0 ? Math.round((stats.objectives.charity / stats.totalCount) * 100) : 0}%)</span>
            </span>
          </button>

          {/* Cultivation */}
          <button
            type="button"
            onClick={() => onSelectObjective(selectedObjective === '共修' ? 'all' : '共修')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              selectedObjective === '共修'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${selectedObjective === '共修' ? 'bg-white' : 'bg-amber-600'}`} />
              <span>共修淨化</span>
            </div>
            <span className="font-mono font-bold">
              {stats.objectives.cultivation} <span className="text-[10px] opacity-75">({stats.totalCount > 0 ? Math.round((stats.objectives.cultivation / stats.totalCount) * 100) : 0}%)</span>
            </span>
          </button>

          {/* Affinity */}
          <button
            type="button"
            onClick={() => onSelectObjective(selectedObjective === '聯誼' ? 'all' : '聯誼')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              selectedObjective === '聯誼'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${selectedObjective === '聯誼' ? 'bg-white' : 'bg-purple-600'}`} />
              <span>組織結緣</span>
            </div>
            <span className="font-mono font-bold">
              {stats.objectives.affinity} <span className="text-[10px] opacity-75">({stats.totalCount > 0 ? Math.round((stats.objectives.affinity / stats.totalCount) * 100) : 0}%)</span>
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
