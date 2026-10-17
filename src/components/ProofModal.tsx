import React from 'react';
import { X, Video, Activity, CheckCircle2, Clock, Calendar, User, MessageSquare, AlertCircle } from 'lucide-react';
import { CheckInRecord } from '../types';

interface ProofModalProps {
  record: CheckInRecord | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAdmin?: boolean;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  record,
  onClose,
  onApprove,
  onReject,
  isAdmin = false,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#70C1B3]/20 flex items-center justify-center font-bold text-[#70C1B3]">
              {record.memberName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2C3437]">{record.memberName} 的運動打卡證明</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
                  {record.identity}
                </span>
                {record.status === 'approved' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 已通過
                  </span>
                )}
                {record.status === 'pending' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 待審核
                  </span>
                )}
                {record.status === 'rejected' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 已退回
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> {record.date} {record.time}
                <span>•</span>
                <Activity className="w-3.5 h-3.5" /> {record.workoutType} {record.durationMinutes}分鐘 ({record.distanceKm} km)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Dual Screenshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. LINE Meeting proof */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5 text-[#2C3437]">
                  <Video className="w-4 h-4 text-[#70C1B3]" /> 證明一：LINE 視訊開鏡頭連線截圖
                </span>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  即時連線認證
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-stone-200 shadow-xs bg-stone-900 group relative aspect-16/10">
                {record.lineProofUrl ? (
                  <img
                    src={record.lineProofUrl}
                    alt="LINE 視訊開鏡頭截圖"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 bg-stone-800">
                    <Video className="w-8 h-8 text-stone-500" />
                    <span className="text-xs">未檢附視訊截圖</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Sports App proof */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5 text-[#2C3437]">
                  <Activity className="w-4 h-4 text-[#F4A261]" /> 證明二：手錶 / 運動 APP 數據截圖
                </span>
                <span className="text-[11px] text-[#F4A261] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  運動軌跡與時長
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-stone-200 shadow-xs bg-stone-900 group relative aspect-16/10">
                {record.sportProofUrl ? (
                  <img
                    src={record.sportProofUrl}
                    alt="運動數據截圖"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 bg-stone-800">
                    <Activity className="w-8 h-8 text-stone-500" />
                    <span className="text-xs">未檢附運動數據截圖</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
            <div>
              <div className="text-xs text-stone-500">運動型態</div>
              <div className="font-bold text-[#2C3437] mt-0.5">{record.workoutType}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">運動時長</div>
              <div className="font-bold text-[#70C1B3] mt-0.5">{record.durationMinutes} 分鐘</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">累積里程 / 步數</div>
              <div className="font-bold text-[#2C3437] mt-0.5">
                {record.distanceKm > 0 ? `${record.distanceKm} km` : `${record.steps} 步`}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">估計消耗熱量</div>
              <div className="font-bold text-[#F4A261] mt-0.5">{record.calories} kcal</div>
            </div>
          </div>

          {/* Workout takeaway note */}
          {record.note && (
            <div className="p-4 rounded-xl bg-[#70C1B3]/5 border border-[#70C1B3]/20 space-y-1">
              <div className="text-xs font-bold text-[#70C1B3] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>團員運動心得與體會</span>
              </div>
              <p className="text-sm text-stone-700 italic">「{record.note}」</p>
            </div>
          )}

          {/* Admin feedback if any */}
          {record.adminNote && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>審核幹部備註（{record.reviewedBy || '幹部'} - {record.reviewedAt}）</span>
              </div>
              <p className="text-amber-900">{record.adminNote}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            送出時間：{record.createdAt}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && record.status === 'pending' && onReject && onApprove && (
              <>
                <button
                  onClick={() => onReject(record.id)}
                  className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  退回補件
                </button>
                <button
                  onClick={() => onApprove(record.id)}
                  className="px-4 py-2 rounded-lg bg-[#70C1B3] text-white text-xs font-semibold hover:bg-[#5db2a3] transition-colors shadow-xs"
                >
                  通過雙軌驗證
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-300 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
