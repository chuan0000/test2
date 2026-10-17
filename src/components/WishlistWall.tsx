import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Gift, 
  Plus, 
  Trophy, 
  Tag, 
  User, 
  X, 
  CheckCircle2, 
  Flame,
  Clock,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IdentityType, MemberProfile, MemberStats, WishItem } from '../types';
import { INITIAL_MEMBERS } from '../mockData';

interface WishlistWallProps {
  members?: MemberProfile[];
  wishes: WishItem[];
  memberStats: MemberStats[];
  onAddOrUpdateWish: (wish: WishItem) => void;
  onLikeWish: (wishId: string) => void;
}

export const WishlistWall: React.FC<WishlistWallProps> = ({
  members,
  wishes,
  memberStats,
  onAddOrUpdateWish,
  onLikeWish,
}) => {
  const currentMembers = members && members.length > 0 ? members : [...INITIAL_MEMBERS];
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [memberName, setMemberName] = useState<string>(currentMembers[0]?.name || '');
  const [isCustomMember, setIsCustomMember] = useState<boolean>(false);
  const [customMemberName, setCustomMemberName] = useState<string>('');
  const [identity, setIdentity] = useState<IdentityType>('在職青年');
  const [wishName, setWishName] = useState<string>('');
  const [category, setCategory] = useState<'運動裝備' | '生活質感' | '數位3C' | '精神食糧' | '健康舒壓'>('運動裝備');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(3000);
  const [reason, setReason] = useState<string>('');

  const categories = ['all', '運動裝備', '生活質感', '數位3C', '精神食糧', '健康舒壓'];

  const filteredWishes = wishes.filter(
    (w) => selectedCategory === 'all' || w.category === selectedCategory
  );

  // Helper to find member stats
  const getMemberStat = (name: string) => {
    return memberStats.find((s) => s.memberName === name);
  };

  const handleOpenAdd = (existingWish?: WishItem) => {
    if (existingWish) {
      setMemberName(existingWish.memberName);
      setIsCustomMember(false);
      setIdentity(existingWish.identity);
      setWishName(existingWish.wishName);
      setCategory(existingWish.category);
      setEstimatedPrice(existingWish.estimatedPrice);
      setReason(existingWish.reason);
    } else {
      setMemberName(currentMembers[0]?.name || '');
      setIsCustomMember(false);
      setCustomMemberName('');
      setWishName('');
      setReason('');
      setEstimatedPrice(3000);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCustomMember ? customMemberName.trim() : memberName;
    if (!finalName || !wishName.trim()) {
      alert('請填寫姓名與願望名稱！');
      return;
    }

    const newWish: WishItem = {
      id: `wish-${Date.now()}`,
      memberName: finalName,
      identity,
      wishName: wishName.trim(),
      category,
      estimatedPrice: Number(estimatedPrice) || 0,
      reason: reason.trim() || '保持健康活力，每週打卡全力以赴！',
      likesCount: 1,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onAddOrUpdateWish(newWish);
    setIsModalOpen(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Motivational Header Card */}
      <div className="bg-gradient-to-r from-[#F4A261]/15 via-[#70C1B3]/15 to-[#F8F9FA] rounded-2xl p-6 border border-stone-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4A261]/20 text-[#2C3437] text-xs font-bold">
            <Gift className="w-3.5 h-3.5 text-[#F4A261]" />
            <span>2027 青年專屬期末心願獎勵</span>
          </div>
          <h2 className="text-2xl font-black text-[#2C3437] tracking-tight">
            青年許願池牆 🌟
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            每位參加計畫的團員皆可在此登記期末最想獲得的「許願清單」！
            年度打卡前 3 名者（第 1 名 $1,000、第 2/3 名各 $500），分團幹部將親自實現心願！
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="px-5 py-3 rounded-xl bg-[#F4A261] hover:bg-[#e7924d] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 登記 / 更新我的許願
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#2C3437] text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat === 'all' ? '全部願望' : cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-400">
          已登記 {filteredWishes.length} 個激勵心願
        </div>
      </div>

      {/* Wishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWishes.map((wish) => {
          const stat = getMemberStat(wish.memberName);
          const rank = stat?.rank;
          const isTop3 = rank && rank <= 3;

          return (
            <div
              key={wish.id}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                isTop3
                  ? 'border-amber-300 ring-2 ring-amber-100/80 bg-gradient-to-b from-amber-50/20 to-white'
                  : 'border-stone-200'
              }`}
            >
              {/* Top Tag & Rank */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-sm text-[#2C3437]">
                      {wish.memberName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#2C3437] flex items-center gap-1">
                        <span>{wish.memberName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-normal">
                          {wish.identity}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#70C1B3]" /> 累計打卡：
                        <strong className="text-[#70C1B3]">{stat?.totalValidCheckIns || 0} 次</strong>
                      </div>
                    </div>
                  </div>

                  {rank && (
                    <div
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : rank === 2
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : rank === 3
                          ? 'bg-amber-900/10 text-amber-900 border border-amber-800/20'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {rank === 1 ? '🥇 第 1 名' : rank === 2 ? '🥈 第 2 名' : rank === 3 ? '🥉 第 3 名' : `第 ${rank} 名`}
                    </div>
                  )}
                </div>

                {/* Wish Content */}
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#70C1B3]/15 text-[#70C1B3] font-bold">
                      {wish.category}
                    </span>
                    {wish.estimatedPrice > 0 && (
                      <span className="text-[11px] text-stone-400">
                        預估 NT$ {wish.estimatedPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#2C3437] leading-snug">
                    {wish.wishName}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 italic">
                    「{wish.reason}」
                  </p>
                </div>
              </div>

              {/* Card Footer: Cheer Button */}
              <div className="pt-4 border-t border-stone-100 mt-2 flex items-center justify-between">
                <span className="text-[10px] text-stone-400">
                  {wish.createdAt}
                </span>

                <button
                  onClick={() => onLikeWish(wish.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>為他加油 ({wish.likesCount})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wish Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#F4A261]/10">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#F4A261]" />
                <h3 className="font-bold text-base text-[#2C3437]">登記 / 更新我的專屬期末願望</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Member Selection */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  團員姓名 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={isCustomMember ? '__custom__' : memberName}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomMember(true);
                      setMemberName('');
                    } else {
                      setIsCustomMember(false);
                      setMemberName(e.target.value);
                      const found = currentMembers.find((m) => m.name === e.target.value);
                      if (found) setIdentity(found.identity as IdentityType);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#F4A261]/30"
                >
                  {currentMembers.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  <option value="__custom__">➕ 其他青年團員</option>
                </select>

                {isCustomMember && (
                  <input
                    type="text"
                    placeholder="請輸入姓名"
                    value={customMemberName}
                    onChange={(e) => setCustomMemberName(e.target.value)}
                    required
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437]"
                  />
                )}
              </div>

              {/* Wish Title */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  期末許願禮物名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：Nike Pegasus 專業慢跑鞋 / 運動降噪耳機 / 筋膜槍"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#F4A261]/30"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">願望類別</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437]"
                  >
                    <option value="運動裝備">運動裝備</option>
                    <option value="數位3C">數位3C</option>
                    <option value="生活質感">生活質感</option>
                    <option value="精神食糧">精神食糧</option>
                    <option value="健康舒壓">健康舒壓</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">預估市價 (NTD)</label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437]"
                  />
                </div>
              </div>

              {/* Reason / Motivation */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  許願原因或激勵自己一句話
                </label>
                <textarea
                  rows={3}
                  placeholder="例如：希望能在這 10 個月維持運動紀律，拿到前三名許願金來補貼入手心儀裝備！"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4A261] text-white font-bold hover:bg-[#e7924d] transition-colors"
                >
                  確認登記許願
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
