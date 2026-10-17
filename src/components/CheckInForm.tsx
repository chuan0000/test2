import React, { useState } from 'react';
import { 
  Flame, 
  Video, 
  Activity, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight,
  Camera,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CheckInRecord, IdentityType, MemberProfile, WorkoutType } from '../types';
import { INITIAL_MEMBERS } from '../mockData';
import { compressImageFile } from '../utils/imageCompressor';

interface CheckInFormProps {
  members?: MemberProfile[];
  onCheckInSuccess: (record: CheckInRecord) => void;
  onNavigateToLeaderboard: () => void;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({
  members,
  onCheckInSuccess,
  onNavigateToLeaderboard,
}) => {
  const currentMembers = members || [];

  // Form state
  const [selectedMember, setSelectedMember] = useState<string>(currentMembers[0]?.name || '');
  const [customName, setCustomName] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(currentMembers.length === 0);
  const [identity, setIdentity] = useState<IdentityType>('在職青年');
  
  // Workout details
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('20:30');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('戶外慢跑');
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [distanceKm, setDistanceKm] = useState<number>(5.5);
  const [steps, setSteps] = useState<number>(6800);
  const [note, setNote] = useState<string>('');

  // Dual Proof images (Base64 data or SVG string)
  const [lineProofUrl, setLineProofUrl] = useState<string>('');
  const [sportProofUrl, setSportProofUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success Modal
  const [successRecord, setSuccessRecord] = useState<CheckInRecord | null>(null);

  // Handle member select change
  const handleMemberChange = (name: string) => {
    if (name === '__custom__') {
      setIsCustomName(true);
      setSelectedMember('');
    } else {
      setIsCustomName(false);
      setSelectedMember(name);
      const found = currentMembers.find((m) => m.name === name);
      if (found) {
        setIdentity(found.identity as IdentityType);
      }
    }
  };

  // Calculate estimated calories
  const effectiveCalories = Math.round(
    workoutType === '戶外慢跑' 
      ? durationMinutes * 8.5 
      : workoutType === '跑步機'
      ? durationMinutes * 8.0
      : durationMinutes * 4.8
  );

  // Auto update steps estimate when distance changes
  const handleDistanceChange = (val: number) => {
    setDistanceKm(val);
    setSteps(Math.round(val * 1250));
  };

  // Handle image file upload for Line Proof with automatic compression
  const handleLineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 1200, 0.82);
        setLineProofUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setLineProofUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle image file upload for Sports Proof with automatic compression
  const handleSportImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 1200, 0.82);
        setSportProofUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSportProofUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCustomName ? customName.trim() : selectedMember;
    if (!finalName) {
      alert('請填寫打卡者姓名或暱稱！');
      return;
    }

    if (!lineProofUrl || !sportProofUrl) {
      alert('請務必上傳「視訊連線證明」與「運動數據證明」雙軌截圖！');
      return;
    }

    setIsSubmitting(true);

    const newRecord: CheckInRecord = {
      id: `chk-${Date.now()}`,
      memberName: finalName,
      identity,
      date,
      time,
      workoutType,
      durationMinutes,
      distanceKm: Number(distanceKm),
      steps: Number(steps),
      calories: effectiveCalories,
      lineProofUrl,
      sportProofUrl,
      note: note.trim() || '完成今日夜間團練，感謝大家相伴！',
      status: 'pending', // Pending admin review
      createdAt: `${date} ${time}`,
    };

    setTimeout(() => {
      onCheckInSuccess(newRecord);
      setSuccessRecord(newRecord);
      setIsSubmitting(false);

      // Trigger colorful celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#70C1B3', '#F4A261', '#3B82F6', '#10B981'],
      });
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Form Title & Guide Box */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#70C1B3]/15 to-[#F4A261]/15 px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#2C3437] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#F4A261]" /> 青年線上運動打卡登記
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              請依活動規定上傳「LINE開鏡截圖」與「運動APP數據」，完成雙軌驗證後即計入榮譽榜！
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Member Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">1. 基本資料</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member Name */}
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1.5">
                  打卡者姓名 / 暱稱 <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={isCustomName ? '__custom__' : selectedMember}
                    onChange={(e) => handleMemberChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 focus:border-[#70C1B3]"
                  >
                    {currentMembers.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    <option value="__custom__">➕ 自行輸入姓名</option>
                  </select>

                  {isCustomName && (
                    <input
                      type="text"
                      placeholder="請輸入您的姓名或暱稱"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-sm text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 focus:border-[#70C1B3]"
                    />
                  )}
                </div>
              </div>

              {/* Identity Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1.5">
                  身分類別 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['在職青年', '在學學生'] as IdentityType[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIdentity(cat)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        identity === cat
                          ? 'border-[#70C1B3] bg-[#70C1B3]/10 text-[#70C1B3]'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {cat === '在職青年' ? '💼 在職青年' : '🎓 在學學生'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Workout Details */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">2. 運動紀錄與數據</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" /> 運動日期
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    const match = val.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
                    if (match) {
                      setDate(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" /> 團練時間 (20:30~21:30)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
                  required
                />
              </div>

              {/* Workout Type */}
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1.5">運動型態</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
                >
                  <option value="戶外慢跑">🏃‍♂️ 戶外慢跑 (Outdoor Running)</option>
                  <option value="健走">🚶‍♀️ 健走 (Brisk Walking)</option>
                  <option value="跑步機">🏃 跑步機 (Treadmill)</option>
                  <option value="其他">🤸 其他有氧運動 (Other)</option>
                </select>
              </div>
            </div>

            {/* Metrics: Duration & Distance & Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1">
                  運動時長 (分鐘)
                </label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm font-semibold text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
                  required
                />
                <span className="text-[10px] text-stone-400">建議每次達 45~60 分鐘</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1">
                  總距離 (公里 KM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="50"
                  value={distanceKm}
                  onChange={(e) => handleDistanceChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm font-semibold text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
                  required
                />
                <span className="text-[10px] text-stone-400">約 {steps} 步</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3437] mb-1">
                  估算消耗熱量
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-white border border-stone-200 text-sm font-bold text-[#F4A261]">
                  約 {effectiveCalories} kcal
                </div>
                <span className="text-[10px] text-stone-400">依時長與強度自動換算</span>
              </div>
            </div>
          </div>

          {/* Section 3: Dual Verification Uploads */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                3. 雙軌證明截圖上傳 <span className="text-rose-500">*</span>
              </h3>
              <span className="text-[11px] text-stone-500">
                請上傳清晰之開鏡與數據截圖
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proof 1: LINE Video Call */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C3437]">
                    <Video className="w-4 h-4 text-[#70C1B3]" /> 證明一：LINE視訊開鏡截圖
                  </div>
                  {lineProofUrl && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> 已上傳
                    </span>
                  )}
                </div>

                {lineProofUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-stone-300 aspect-16/10 bg-stone-900 group">
                    <img
                      src={lineProofUrl}
                      alt="LINE 視訊證明"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLineProofUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] rounded font-medium transition-colors"
                    >
                      重新選擇
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-[#70C1B3] rounded-xl p-4 bg-white cursor-pointer transition-all aspect-16/10">
                    <Camera className="w-7 h-7 text-stone-400 mb-1" />
                    <span className="text-xs font-semibold text-stone-600">點擊上傳 LINE 截圖</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">需顯示開啟視訊鏡頭畫面</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLineImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Proof 2: Sports App / Watch */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C3437]">
                    <Activity className="w-4 h-4 text-[#F4A261]" /> 證明二：運動APP / 跑錶截圖
                  </div>
                  {sportProofUrl && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> 已上傳
                    </span>
                  )}
                </div>

                {sportProofUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-stone-300 aspect-16/10 bg-stone-900 group">
                    <img
                      src={sportProofUrl}
                      alt="運動數據證明"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSportProofUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] rounded font-medium transition-colors"
                    >
                      重新選擇
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-[#F4A261] rounded-xl p-4 bg-white cursor-pointer transition-all aspect-16/10">
                    <ImageIcon className="w-7 h-7 text-stone-400 mb-1" />
                    <span className="text-xs font-semibold text-stone-600">點擊上傳手錶/APP數據</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">Garmin / Strava / Apple Watch</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSportImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Workout Takeaway (Optional) */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <label className="block text-xs font-bold text-[#2C3437] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" /> 今日運動心得一句話（選填）
              </span>
              <span className="text-[10px] text-stone-400">寫下一句話勉勵大家</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：今天和大家在線上相聚跑了 5K，流汗非常暢快，步步有你！"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-[#2C3437] placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#70C1B3] to-[#5db2a3] text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-[#5db2a3] hover:to-[#4e9f90] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>資料儲存中...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>立即送出運動打卡紀錄</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-stone-400 mt-2">
              送出後紀錄將即時存入本地 LocalStorage，並等待幹部線上審核。
            </p>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {successRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-[#70C1B3] flex items-center justify-center shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#2C3437]">打卡成功！步步有你 🎉</h3>
              <p className="text-xs text-stone-500 mt-1">
                恭喜 <strong>{successRecord.memberName}</strong> 完成今日夜間運動打卡！
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-stone-500">運動項目：</span>
                <span className="font-bold text-[#2C3437]">{successRecord.workoutType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">運動時長：</span>
                <span className="font-bold text-[#70C1B3]">{successRecord.durationMinutes} 分鐘</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">累積里程：</span>
                <span className="font-bold text-[#2C3437]">{successRecord.distanceKm} KM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">審核狀態：</span>
                <span className="font-bold text-amber-600">雙軌證明待審核中</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSuccessRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
              >
                再打一筆
              </button>
              <button
                onClick={() => {
                  setSuccessRecord(null);
                  onNavigateToLeaderboard();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#70C1B3] text-white text-xs font-semibold hover:bg-[#5db2a3] transition-colors flex items-center justify-center gap-1"
              >
                <span>查看排行榜</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
