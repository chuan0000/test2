import React from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Check,
  Palette,
  Layout,
  Edit3
} from 'lucide-react';
import { SlideElement } from '../types';

export const TOOLBAR_FONT_FAMILIES = [
  { name: '現代黑體', value: 'sans-serif' },
  { name: '微軟正黑體', value: '"Microsoft JhengHei", sans-serif' },
  { name: '典雅宋體', value: '"Songti TC", "Noto Serif TC", serif' },
  { name: '楷體 / 書法體', value: '"Kaiti TC", "BiauKai", serif' },
  { name: '俐落圓體', value: '"Rounded Mplus 1c", "PingFang TC", sans-serif' },
  { name: '等寬字體', value: 'monospace' }
];

export const TOOLBAR_PRESET_COLORS = [
  { name: '石墨黑', hex: '#1C1917' },
  { name: '深灰', hex: '#44403C' },
  { name: '純白', hex: '#FFFFFF' },
  { name: '佛光綠', hex: '#4A7C59' },
  { name: '大地金', hex: '#E29B27' },
  { name: '科技藍', hex: '#2563EB' },
  { name: '法寶紅', hex: '#B91C1C' }
];

interface StudioContextualToolbarProps {
  selectedElement: SlideElement | undefined;
  isTextSelected: boolean;
  isPhotoSelected: boolean;
  isTableSelected: boolean;
  isTextFormattingActive: boolean;
  currentSlideIndex: number;
  totalSlides: number;
  currentSlideTitle: string;
  elementCount: number;
  currentThemeAccent?: string;
  onUpdateSelectedElement: (updates: Partial<SlideElement>) => void;
  onReorderLayer: (direction: 'front' | 'back') => void;
  onDuplicateSelectedElement: () => void;
  onDeleteSelectedElement: () => void;
  onDeselect: () => void;
  onOpenBackground: () => void;
  onOpenLayouts: () => void;
  onTriggerReplacePhoto: () => void;
  onAddTableRow?: () => void;
  onDeleteTableRow?: () => void;
  onAddTableCol?: () => void;
  onDeleteTableCol?: () => void;
  onEditText?: () => void;
}

export const StudioContextualToolbar: React.FC<StudioContextualToolbarProps> = ({
  selectedElement,
  isTextSelected,
  isPhotoSelected,
  isTableSelected,
  isTextFormattingActive,
  currentThemeAccent = '#4A7C59',
  onUpdateSelectedElement,
  onReorderLayer,
  onDuplicateSelectedElement,
  onDeleteSelectedElement,
  onDeselect,
  onOpenBackground,
  onOpenLayouts,
  onTriggerReplacePhoto,
  onAddTableRow,
  onDeleteTableRow,
  onAddTableCol,
  onDeleteTableCol,
  onEditText
}) => {
  return (
    <div className="w-full h-12 min-h-[48px] bg-stone-900 text-white px-4 border-b border-stone-800 flex items-center justify-between gap-3 shadow-md z-20 shrink-0 flex-nowrap overflow-x-auto no-scrollbar select-none">
      
      {/* -------------------------------------------------------- */}
      {/* Left: Element Indicator Badge */}
      {/* -------------------------------------------------------- */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedElement ? (
          <span
            className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs whitespace-nowrap ${
              isTextSelected
                ? 'bg-amber-500 text-stone-950'
                : isPhotoSelected
                ? 'bg-blue-500 text-white'
                : isTableSelected
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-purple-500 text-white'
            }`}
          >
            {isTextSelected
              ? '📝 文字'
              : isPhotoSelected
              ? '🖼️ 圖片'
              : isTableSelected
              ? '📊 表格'
              : '🎨 物件'}
          </span>
        ) : (
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-stone-800 text-stone-400 flex items-center gap-1 border border-stone-700 whitespace-nowrap">
            💡 點選畫布物件
          </span>
        )}
      </div>

      {/* -------------------------------------------------------- */}
      {/* Center: Always Docked 3 Zones (Text, Media, Layer/Action) */}
      {/* -------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1">
        
        {/* ====================================================== */}
        {/* Zone 1: 文字格式區 (常駐顯示) */}
        {/* ====================================================== */}
        <div
          className={`flex items-center gap-1.5 shrink-0 transition-opacity ${
            !isTextFormattingActive ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <span className="text-[10px] font-black text-amber-400 px-1 border-r border-stone-800 mr-0.5 whitespace-nowrap hidden lg:inline">
            文字
          </span>

          {/* 字體下拉選單 */}
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-stone-400" />
            <select
              disabled={!isTextFormattingActive}
              value={selectedElement?.fontFamily || 'sans-serif'}
              onChange={(e) => onUpdateSelectedElement({ fontFamily: e.target.value })}
              className="bg-stone-800 text-white text-xs rounded-lg px-2 py-1 border border-stone-700 outline-none cursor-pointer disabled:cursor-not-allowed"
              title="字體選擇"
            >
              {TOOLBAR_FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 字級 (+ / - / 下拉) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <button
              disabled={!isTextFormattingActive}
              onClick={() =>
                onUpdateSelectedElement({
                  fontSize: Math.max(10, (selectedElement?.fontSize || 16) - 2)
                })
              }
              className="px-2 py-1 hover:bg-stone-700 text-xs font-bold text-stone-300 cursor-pointer disabled:cursor-not-allowed"
              title="縮小字級"
            >
              -
            </button>
            <select
              disabled={!isTextFormattingActive}
              value={selectedElement?.fontSize || 16}
              onChange={(e) => onUpdateSelectedElement({ fontSize: Number(e.target.value) })}
              className="bg-stone-800 text-amber-400 text-xs font-black px-1.5 py-1 outline-none cursor-pointer border-x border-stone-700 disabled:cursor-not-allowed"
              title="選擇字級"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} pt
                </option>
              ))}
            </select>
            <button
              disabled={!isTextFormattingActive}
              onClick={() =>
                onUpdateSelectedElement({
                  fontSize: Math.min(72, (selectedElement?.fontSize || 16) + 2)
                })
              }
              className="px-2 py-1 hover:bg-stone-700 text-xs font-bold text-stone-300 cursor-pointer disabled:cursor-not-allowed"
              title="放大字級"
            >
              +
            </button>
          </div>

          {/* 粗體(B)、斜體(I)、下底線(U) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <button
              disabled={!isTextFormattingActive}
              onClick={() =>
                onUpdateSelectedElement({
                  fontWeight: selectedElement?.fontWeight === 'black' ? 'normal' : 'black'
                })
              }
              className={`p-1.5 text-xs font-bold cursor-pointer transition-colors ${
                selectedElement?.fontWeight === 'black'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="粗體 (B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!isTextFormattingActive}
              onClick={() =>
                onUpdateSelectedElement({
                  fontStyle: selectedElement?.fontStyle === 'italic' ? 'normal' : 'italic'
                })
              }
              className={`p-1.5 text-xs font-bold cursor-pointer transition-colors ${
                selectedElement?.fontStyle === 'italic'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="斜體 (I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!isTextFormattingActive}
              onClick={() =>
                onUpdateSelectedElement({
                  textDecoration:
                    selectedElement?.textDecoration === 'underline' ? 'none' : 'underline'
                })
              }
              className={`p-1.5 text-xs font-bold cursor-pointer transition-colors ${
                selectedElement?.textDecoration === 'underline'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="下底線 (U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 對齊方式 (靠左 / 置中 / 靠右) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <button
              disabled={!isTextFormattingActive}
              onClick={() => onUpdateSelectedElement({ textAlign: 'left' })}
              className={`p-1.5 text-xs cursor-pointer ${
                selectedElement?.textAlign === 'left' || !selectedElement?.textAlign
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="靠左對齊"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!isTextFormattingActive}
              onClick={() => onUpdateSelectedElement({ textAlign: 'center' })}
              className={`p-1.5 text-xs cursor-pointer ${
                selectedElement?.textAlign === 'center'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="置中對齊"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!isTextFormattingActive}
              onClick={() => onUpdateSelectedElement({ textAlign: 'right' })}
              className={`p-1.5 text-xs cursor-pointer ${
                selectedElement?.textAlign === 'right'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed`}
              title="靠右對齊"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 文字顏色選擇器 */}
          <div
            className="flex items-center gap-1 bg-stone-800 px-2 py-1 rounded-lg border border-stone-700"
            title="文字顏色"
          >
            <div
              className="w-4 h-4 rounded-full border border-stone-600 shadow-xs relative overflow-hidden cursor-pointer shrink-0"
              style={{ backgroundColor: selectedElement?.color || '#FFFFFF' }}
            >
              <input
                disabled={!isTextFormattingActive}
                type="color"
                value={selectedElement?.color || '#FFFFFF'}
                onChange={(e) => onUpdateSelectedElement({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-1 pl-1">
              {TOOLBAR_PRESET_COLORS.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  disabled={!isTextFormattingActive}
                  onClick={() => onUpdateSelectedElement({ color: c.hex })}
                  className="w-3.5 h-3.5 rounded-full border border-stone-600 hover:scale-125 transition-transform cursor-pointer disabled:cursor-not-allowed"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* 編輯文字按鈕 */}
          {onEditText && (
            <button
              disabled={!isTextFormattingActive}
              onClick={onEditText}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1"
              title="進入文字編輯模式"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">內文</span>
            </button>
          )}
        </div>

        {/* Section Divider */}
        <div className="h-6 w-px bg-stone-800 shrink-0 mx-1" />

        {/* ====================================================== */}
        {/* Zone 2: 圖片與多媒體區 (常駐顯示) */}
        {/* ====================================================== */}
        <div
          className={`flex items-center gap-1.5 shrink-0 transition-opacity ${
            !isPhotoSelected ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <span className="text-[10px] font-black text-blue-400 px-1 border-r border-stone-800 mr-0.5 whitespace-nowrap hidden lg:inline">
            圖片
          </span>

          {/* 更換本機檔案按鈕 */}
          <button
            disabled={!isPhotoSelected}
            onClick={onTriggerReplacePhoto}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed whitespace-nowrap"
            title="更換此圖片為電腦本機的新相片或影片"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>更換本機檔案</span>
          </button>

          {/* 比例模式 (填滿/完整/拉伸) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <button
              disabled={!isPhotoSelected}
              onClick={() => onUpdateSelectedElement({ objectFit: 'cover' })}
              className={`px-2 py-1 text-xs font-bold cursor-pointer ${
                (selectedElement?.objectFit || 'cover') === 'cover'
                  ? 'bg-blue-600 text-white font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed whitespace-nowrap`}
              title="填滿裁切 (Cover)"
            >
              填滿
            </button>
            <button
              disabled={!isPhotoSelected}
              onClick={() => onUpdateSelectedElement({ objectFit: 'contain' })}
              className={`px-2 py-1 text-xs font-bold cursor-pointer ${
                selectedElement?.objectFit === 'contain'
                  ? 'bg-blue-600 text-white font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed whitespace-nowrap`}
              title="完整相片 (Contain)"
            >
              完整
            </button>
            <button
              disabled={!isPhotoSelected}
              onClick={() => onUpdateSelectedElement({ objectFit: 'fill' })}
              className={`px-2 py-1 text-xs font-bold cursor-pointer ${
                selectedElement?.objectFit === 'fill'
                  ? 'bg-blue-600 text-white font-black'
                  : 'hover:bg-stone-700 text-stone-300'
              } disabled:cursor-not-allowed whitespace-nowrap`}
              title="拉伸滿版 (Fill)"
            >
              拉伸
            </button>
          </div>

          {/* 透明度數值/按鈕 (100%, 80%, 50%, 30%) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <span className="text-[10px] text-stone-400 pl-2 pr-1 select-none whitespace-nowrap">
              透明
            </span>
            {[1, 0.8, 0.5, 0.3].map((op) => {
              const currentOp =
                selectedElement?.opacity !== undefined ? selectedElement.opacity : 1;
              const isAct = Math.abs(currentOp - op) < 0.05;
              return (
                <button
                  key={op}
                  disabled={!isPhotoSelected}
                  onClick={() => onUpdateSelectedElement({ opacity: op })}
                  className={`px-1.5 py-1 text-[11px] font-bold cursor-pointer ${
                    isAct ? 'bg-blue-600 text-white font-black' : 'hover:bg-stone-700 text-stone-300'
                  } disabled:cursor-not-allowed`}
                  title={`透明度 ${Math.round(op * 100)}%`}
                >
                  {Math.round(op * 100)}%
                </button>
              );
            })}
          </div>

          {/* 圓角調整 (直角, 12, 24, 圓) */}
          <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
            <span className="text-[10px] text-stone-400 pl-2 pr-1 select-none whitespace-nowrap">
              圓角
            </span>
            {[0, 12, 24, 999].map((r) => {
              const currentR = selectedElement?.borderRadius || 0;
              const isAct = (r === 999 && currentR >= 99) || (r !== 999 && currentR === r);
              return (
                <button
                  key={r}
                  disabled={!isPhotoSelected}
                  onClick={() => onUpdateSelectedElement({ borderRadius: r })}
                  className={`px-1.5 py-1 text-[11px] font-bold cursor-pointer ${
                    isAct ? 'bg-blue-600 text-white font-black' : 'hover:bg-stone-700 text-stone-300'
                  } disabled:cursor-not-allowed`}
                  title={`圓角 ${r === 999 ? '圓形/膠囊' : r + 'px'}`}
                >
                  {r === 0 ? '直角' : r === 999 ? '圓' : `${r}`}
                </button>
              );
            })}
          </div>

          {/* 修改圖說 */}
          <button
            disabled={!isPhotoSelected}
            onClick={() => {
              if (!selectedElement) return;
              const newTitle = prompt(
                '請輸入相片圖說標籤（留空即隱藏）：',
                selectedElement.title || ''
              );
              if (newTitle !== null) {
                onUpdateSelectedElement({ title: newTitle.trim() });
              }
            }}
            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            title="修改相片圖說標籤"
          >
            圖說
          </button>
        </div>

        {/* If Table Selected: Extra Table Mutation Bar */}
        {isTableSelected && onAddTableRow && onDeleteTableRow && onAddTableCol && onDeleteTableCol && (
          <>
            <div className="h-6 w-px bg-stone-800 shrink-0 mx-1" />
            <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg shrink-0">
              <span className="text-[10px] font-black text-emerald-400 mr-1">表格</span>
              <button
                onClick={onAddTableRow}
                className="px-1.5 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                title="增加一列 (Row)"
              >
                +列
              </button>
              <button
                onClick={onDeleteTableRow}
                className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-red-900/80 text-red-300 text-[11px] font-bold cursor-pointer"
                title="減少一列 (Row)"
              >
                -列
              </button>
              <button
                onClick={onAddTableCol}
                className="px-1.5 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                title="增加一欄 (Column)"
              >
                +欄
              </button>
              <button
                onClick={onDeleteTableCol}
                className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-red-900/80 text-red-300 text-[11px] font-bold cursor-pointer"
                title="減少一欄 (Column)"
              >
                -欄
              </button>
              <div className="flex items-center gap-1 pl-1 ml-1 border-l border-emerald-800">
                <input
                  type="color"
                  value={selectedElement?.tableHeaderBg || currentThemeAccent}
                  onChange={(e) => onUpdateSelectedElement({ tableHeaderBg: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                  title="表頭色彩"
                />
              </div>
            </div>
          </>
        )}

        {/* Section Divider */}
        <div className="h-6 w-px bg-stone-800 shrink-0 mx-1" />

        {/* ====================================================== */}
        {/* Zone 3: 圖層與操作區 (常駐顯示) */}
        {/* ====================================================== */}
        <div
          className={`flex items-center gap-1 shrink-0 transition-opacity ${
            !selectedElement ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <span className="text-[10px] font-black text-purple-400 px-1 border-r border-stone-800 mr-0.5 whitespace-nowrap hidden lg:inline">
            操作
          </span>

          {/* 圖層上移 */}
          <button
            disabled={!selectedElement}
            onClick={() => onReorderLayer('front')}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer border border-stone-700 disabled:cursor-not-allowed"
            title="移至最前層 (Z-Index +1)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* 圖層下移 */}
          <button
            disabled={!selectedElement}
            onClick={() => onReorderLayer('back')}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer border border-stone-700 disabled:cursor-not-allowed"
            title="移至最後層 (Z-Index -1)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* 複製物件 */}
          <button
            disabled={!selectedElement}
            onClick={onDuplicateSelectedElement}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer border border-stone-700 disabled:cursor-not-allowed"
            title="複製此物件"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* 刪除物件 */}
          <button
            disabled={!selectedElement}
            onClick={onDeleteSelectedElement}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-red-400 cursor-pointer border border-stone-700 disabled:cursor-not-allowed"
            title="刪除此物件"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* 取消選取 / 完成 */}
          {selectedElement && (
            <button
              onClick={onDeselect}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs font-bold border border-stone-700 cursor-pointer flex items-center gap-1 whitespace-nowrap"
              title="完成編輯並取消選取"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>完成</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Right: Quick Access to Background & Layouts */}
      {/* -------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-stone-800">
        <button
          onClick={onOpenBackground}
          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1 cursor-pointer border border-stone-700 transition-colors whitespace-nowrap"
          title="調整當前頁面底圖與透明度"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>底圖</span>
        </button>
        <button
          onClick={onOpenLayouts}
          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1 cursor-pointer border border-stone-700 transition-colors whitespace-nowrap"
          title="套用版面配置"
        >
          <Layout className="w-3.5 h-3.5 text-blue-400" />
          <span>版面</span>
        </button>
      </div>
    </div>
  );
};
