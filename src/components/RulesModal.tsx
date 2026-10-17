import React from 'react';
import { X, Calendar, Users, ShieldCheck, Trophy, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#70C1B3]/10">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#70C1B3]" />
            <h2 className="text-lg font-bold text-[#2C3437]">活動章程與雙軌打卡規則</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#2C3437] leading-relaxed">
          {/* Main info card */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
            <h3 className="font-bold text-base text-[#2C3437] flex items-center gap-2">
              <span>國際佛光會新竹青年分團</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#70C1B3] text-white font-medium">2027 年度計畫</span>
            </h3>
            <p className="text-stone-600">
              「步步有你，夜間相聚」—— 凝聚新竹在職青年與在學青年，養成規律運動習慣，透過線上連線相伴，跑出健康與活力！
            </p>
          </div>

          {/* Grid rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Period */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[#70C1B3] font-semibold">
                <Calendar className="w-4 h-4" />
                <span>活動期程與時間</span>
              </div>
              <p className="text-stone-600 text-xs leading-5">
                • <strong>期間：</strong>2027 年 1 月 ～ 10 月<br />
                • <strong>時間：</strong>每週固定 2 天夜間（20:30 - 21:30）<br />
                • 建議週二、週四固定開鏡相聚。
              </p>
            </div>

            {/* Participants */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[#F4A261] font-semibold">
                <Users className="w-4 h-4" />
                <span>參與對象</span>
              </div>
              <p className="text-stone-600 text-xs leading-5">
                • 新竹青年分團全體團員（約 20 人）<br />
                • 包含在職青年與在學學生<br />
                • 互相勉勵、跨界交流分享。
              </p>
            </div>
          </div>

          {/* Dual Verification Rule */}
          <div className="p-4 rounded-xl border border-[#70C1B3]/30 bg-[#70C1B3]/5 space-y-3">
            <div className="flex items-center gap-2 text-[#2C3437] font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-[#70C1B3]" />
              <span>打卡雙軌驗證機制（需同時滿足）</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-[#2C3437] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#70C1B3]" />
                  <span>1. 視訊連線證明</span>
                </div>
                <p className="text-stone-500">LINE 會議通話中開啟鏡頭運動之現場螢幕截圖（確認本人參與）。</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-[#2C3437] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#70C1B3]" />
                  <span>2. 運動數據證明</span>
                </div>
                <p className="text-stone-500">Apple Watch / Garmin 跑錶、Nike Run Club / Strava APP 或跑步機儀表板之數據截圖。</p>
              </div>
            </div>
          </div>

          {/* Incentive Awards */}
          <div className="p-4 rounded-xl border border-[#F4A261]/30 bg-[#F4A261]/5 space-y-3">
            <div className="flex items-center gap-2 text-[#2C3437] font-bold text-base">
              <Trophy className="w-5 h-5 text-[#F4A261]" />
              <span>激勵機制與期末許願金</span>
            </div>
            <p className="text-xs text-stone-600">
              統計整年度累計「有效打卡次數」，排名前 3 名者可獲得個人專屬「許願清單」獎品：
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-lg font-bold">🥇 冠軍</div>
                <div className="font-bold text-amber-700 mt-0.5">$1,000</div>
                <div className="text-[11px] text-stone-500">個人專屬願望禮品</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-lg font-bold">🥈 亞軍</div>
                <div className="font-bold text-slate-700 mt-0.5">$500</div>
                <div className="text-[11px] text-stone-500">個人專屬願望禮品</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-900/10 border border-amber-800/20">
                <div className="text-lg font-bold">🥉 季軍</div>
                <div className="font-bold text-amber-800 mt-0.5">$500</div>
                <div className="text-[11px] text-stone-500">個人專屬願望禮品</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <span>審核小組（周汶蔚、徐信銓）將於管理員後台每週定期審核截圖，並定期匯出出席統計報表。請大家每次運動後記得及時送出打卡喔！</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#70C1B3] text-white font-medium text-sm hover:bg-[#5db2a3] transition-colors shadow-xs"
          >
            我瞭解了，開始運動！
          </button>
        </div>
      </div>
    </div>
  );
};
