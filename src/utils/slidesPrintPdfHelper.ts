import { MeetingReportData, PPTActivityItem, PPTCategorySummary } from '../components/MeetingReportSlidesSection';
import { Slide } from '../types';

/**
 * Builds the standalone 16:9 Presentation HTML document that guarantees ZERO layout shifting when saving as PDF
 */
export function generatePrintableSlidesHtml(
  reportData: MeetingReportData,
  options?: {
    accentColor?: string;
    customBgUrl?: string;
    customLogoUrl?: string;
  },
  slides?: Slide[]
): string {
  const accentColor = options?.accentColor || '#4A7C59';
  const customBgStyle = options?.customBgUrl
    ? `background-image: url('${options.customBgUrl}'); background-size: cover; background-position: center;`
    : '';

  // If slides array with elements is provided, render dynamic elements
  if (slides && slides.length > 0) {
    const dynamicSlidesHtml = slides.map((slide, sIdx) => {
      const bg = slide.style?.bgColor || (slide.type === 'cover' ? '#2C3437' : '#F7F6F2');
      const textColor = slide.style?.textColor || (slide.type === 'cover' ? '#FFFFFF' : '#1C1917');
      
      const elementsHtml = slide.elements.map(elem => {
        let inner = '';
        if (elem.type === 'photo') {
          inner = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #000; border-radius: 8px; overflow: hidden;">
              <img src="${elem.content}" style="flex: 1; width: 100%; object-fit: cover;" />
              ${elem.title ? `<div style="background: rgba(0,0,0,0.7); color: #fff; padding: 4px 8px; font-size: 11px; font-weight: bold;">📷 ${elem.title}</div>` : ''}
            </div>
          `;
        } else if (elem.type === 'number_kpi') {
          inner = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${elem.bgColor || '#fff'}; border: 1px solid ${elem.borderColor || '#e2e8f0'}; border-radius: ${elem.borderRadius || 12}px; padding: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              ${elem.title ? `<div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 2px;">${elem.title}</div>` : ''}
              <div style="font-size: ${elem.fontSize || 32}px; font-weight: 900; color: ${elem.color || '#E29B27'}; line-height: 1;">${elem.content}</div>
            </div>
          `;
        } else if (elem.type === 'badge') {
          inner = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${elem.bgColor || '#4A7C59'}; color: ${elem.color || '#fff'}; font-size: ${elem.fontSize || 12}px; font-weight: bold; border-radius: ${elem.borderRadius || 999}px; padding: 2px 8px; text-align: center;">
              ${elem.content}
            </div>
          `;
        } else if (elem.type === 'sticker') {
          inner = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: ${elem.fontSize || 40}px;">
              ${elem.content}
            </div>
          `;
        } else {
          inner = `
            <div style="width: 100%; height: 100%; font-size: ${elem.fontSize || 14}px; font-weight: ${elem.fontWeight === 'black' ? 900 : elem.fontWeight === 'bold' ? 700 : 400}; font-style: ${elem.fontStyle || 'normal'}; color: ${elem.color || '#1C1917'}; background: ${elem.bgColor || 'transparent'}; border-radius: ${elem.borderRadius || 0}px; border: ${elem.borderWidth ? `${elem.borderWidth}px solid ${elem.borderColor || '#ccc'}` : 'none'}; padding: ${elem.bgColor && elem.bgColor !== 'transparent' ? '8px 12px' : '0'}; text-align: ${elem.textAlign || 'left'}; white-space: pre-wrap; line-height: 1.4;">
              ${elem.content}
            </div>
          `;
        }

        return `
          <div style="position: absolute; left: ${elem.x}%; top: ${elem.y}%; width: ${elem.w}%; height: ${elem.h}%; z-index: ${elem.zIndex || 10}; box-sizing: border-box;">
            ${inner}
          </div>
        `;
      }).join('');

      return `
        <div class="slide-page" style="background: ${bg}; color: ${textColor}; ${customBgStyle}">
          <div class="slide-inner" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
            ${elementsHtml}
          </div>
        </div>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>${reportData.reporting_unit} - 桃竹苗區聯團會議工作報告 (16:9 PDF)</title>
  <style>
    @page { 
      size: 297mm 167.06mm; 
      margin: 0; 
    }
    * { 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    html, body { 
      margin: 0; 
      padding: 0; 
      background: #e2e8f0; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif; 
    }
    .slide-page { 
      width: 297mm; 
      height: 167.06mm; 
      page-break-after: always; 
      page-break-inside: avoid;
      break-after: page;
      position: relative; 
      margin: 10mm auto; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
      overflow: hidden; 
    }
    @media print { 
      body { 
        background: none !important; 
        margin: 0 !important;
        padding: 0 !important;
      } 
      .slide-page { 
        margin: 0 !important; 
        box-shadow: none !important; 
        width: 297mm !important; 
        height: 167.06mm !important; 
        min-width: 297mm !important;
        min-height: 167.06mm !important;
        page-break-inside: avoid !important;
        page-break-after: always !important; 
        break-after: page !important;
      } 
    }
  </style>
</head>
<body>
  ${dynamicSlidesHtml}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch(e) { console.warn(e); }
      }, 500);
    });
  </script>
</body>
</html>`;
  }

  // 1. Cover Slide
  const coverHtml = `
    <div class="slide-page cover-slide" style="${customBgStyle}">
      <div class="slide-inner flex flex-col justify-between p-12 bg-gradient-to-br from-[#2C3437] via-[#374449] to-[#1E2528] text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            ${options?.customLogoUrl ? `<img src="${options.customLogoUrl}" class="h-10 w-10 object-contain rounded-full bg-white p-1" />` : `<div class="logo-circle">BLIA</div>`}
            <div>
              <div class="text-xs font-bold text-amber-400 tracking-widest uppercase">國際佛光會中華佛光青年總團</div>
              <div class="text-sm font-black text-white">桃竹苗區 聯團會議工作報告</div>
            </div>
          </div>
          <div class="pill-badge">${reportData.reporting_period || '2026年 第三季'}</div>
        </div>

        <div class="my-auto space-y-3">
          <h1 class="text-5xl font-black text-white leading-tight">
            ${reportData.reporting_unit || '新竹青年分團'}<br/>
            <span style="color: #68D391;">團務工作報告</span>
          </h1>
          <p class="text-base text-stone-300 font-bold tracking-wide">
            貫徹星雲大師人間佛教四大宗旨 • 熱血發心 信仰傳承
          </p>
        </div>

        <div class="pt-4 border-t border-stone-600 flex items-center justify-between text-xs text-stone-400 font-bold">
          <span>報告日期：${new Date().toLocaleDateString('zh-TW')}</span>
          <span>指導單位：佛光山法寶寺</span>
        </div>
      </div>
    </div>
  `;

  // 2. Agenda Slide
  const agendaHtml = `
    <div class="slide-page" style="${customBgStyle}">
      <div class="slide-inner flex flex-col justify-between p-10 bg-[#F7F6F2] text-stone-900">
        <div>
          <span class="text-xs font-black tracking-widest uppercase" style="color: ${accentColor}">AGENDA / 四大核心架構</span>
          <h2 class="text-3xl font-black text-stone-900 mt-1">工作報告 四大核心範疇</h2>
        </div>

        <div class="grid grid-cols-4 gap-5 my-auto">
          ${reportData.categories.map((cat, idx) => `
            <div class="p-6 rounded-3xl bg-white border border-stone-200 shadow-md flex flex-col items-center text-center justify-between space-y-3">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white font-black shadow-md" style="background-color: ${cat.theme_color || accentColor};">
                ${cat.icon}
              </div>
              <div>
                <div class="text-xs font-black text-stone-400">0${idx + 1}</div>
                <h3 class="text-base font-black text-stone-900 mt-0.5">${cat.short_name}</h3>
                <p class="text-xs text-stone-500 font-semibold mt-1">${cat.category_name}</p>
              </div>
              <div class="w-full pt-2 border-t border-stone-100 flex items-center justify-around text-xs font-bold text-stone-700">
                <span>${cat.summary_stats.activity_count} 場活動</span>
                <span>${cat.summary_stats.total_participants} 人次</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="text-right text-xs font-bold text-stone-400">
          ${reportData.reporting_unit} • 聯團會議簡報
        </div>
      </div>
    </div>
  `;

  // 3. Category Groups & Activity Slides
  let bodySlidesHtml = '';
  reportData.categories.forEach(cat => {
    if (cat.activities.length === 0) return;

    // Divider
    bodySlidesHtml += `
      <div class="slide-page">
        <div class="slide-inner flex flex-col justify-between p-12 text-white" style="background-color: ${cat.theme_color || accentColor};">
          <div class="flex items-center justify-between">
            <div class="px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black">
              佛光山四大宗旨工作提報
            </div>
            <div class="text-xs font-bold text-white/80">${reportData.reporting_unit}</div>
          </div>

          <div class="my-auto space-y-4 max-w-2xl">
            <div class="text-5xl font-black">${cat.icon}</div>
            <h1 class="text-4xl font-black tracking-tight leading-tight">${cat.category_name}</h1>
            <p class="text-lg font-bold text-white/90">
              累計推動 ${cat.summary_stats.activity_count} 場專案活動 ｜ 觸及青年與大眾 ${cat.summary_stats.total_participants} 人次
            </p>
          </div>

          <div class="pt-4 border-t border-white/20 text-xs font-medium text-white/80">
            下一頁呈現本範疇之各專案活動成效與佐證相片
          </div>
        </div>
      </div>
    `;

    // Activity Slides
    cat.activities.forEach(act => {
      const photos = act.photos.slice(0, 4);
      const photoGridCards = photos.map((p, pIdx) => `
        <div class="bg-white rounded-xl overflow-hidden border border-stone-300 shadow-xs flex flex-col p-1">
          <div class="w-full h-[140px] bg-stone-900 rounded-lg overflow-hidden relative flex items-center justify-center">
            <img src="${p.url}" alt="佐證照片" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'" />
            <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
              📷 0${pIdx + 1}
            </div>
          </div>
          <div class="p-1 text-[10px] font-bold text-stone-800 leading-tight truncate">
            ${p.caption || `佐證紀錄 0${pIdx + 1}`}
          </div>
        </div>
      `).join('');

      bodySlidesHtml += `
        <div class="slide-page">
          <div class="slide-inner flex flex-col justify-between p-6 bg-[#F7F6F2] text-stone-900">
            
            <!-- Top Bar -->
            <div class="flex items-center justify-between border-b border-stone-200 pb-2">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-white text-[11px] font-black" style="background-color: ${cat.theme_color || accentColor}">
                  ${cat.short_name}
                </span>
                <span class="text-xs font-black text-stone-800">${act.date_location}</span>
              </div>
              <span class="text-[11px] font-bold text-stone-400">${reportData.reporting_unit}</span>
            </div>

            <!-- Content Grid: Left Photos 65% + Right Info 35% -->
            <div class="grid grid-cols-12 gap-4 my-auto h-[82%]">
              
              <!-- Photos Grid -->
              <div class="col-span-8 h-full flex flex-col justify-between">
                <div class="grid grid-cols-2 gap-2 h-full">
                  ${photoGridCards || `
                    <div class="col-span-2 h-full flex items-center justify-center bg-white border border-dashed border-stone-300 rounded-2xl text-stone-400 text-xs font-bold">
                      （本活動現場紀錄照片已妥善保存在法寶寺雲端）
                    </div>
                  `}
                </div>
              </div>

              <!-- Right Info Column -->
              <div class="col-span-4 h-full bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <div class="text-[11px] font-black" style="color: ${cat.theme_color || accentColor}">
                    ${act.date_location}
                  </div>
                  <h3 class="text-base font-black text-stone-900 mt-1 leading-snug">
                    ${act.activity_name}
                  </h3>
                </div>

                <!-- Big Number -->
                <div class="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center my-1.5">
                  <div class="text-[11px] font-bold text-stone-500">累計參與總人數</div>
                  <div class="text-4xl font-black my-0.5" style="color: ${cat.theme_color || accentColor}">
                    ${act.participants.total}
                  </div>
                  <div class="text-[10px] font-bold text-stone-600">
                    青年 ${act.participants.internal} 人 • 大眾 ${act.participants.external} 人
                  </div>
                </div>

                <!-- Highlights -->
                <div class="space-y-1">
                  <div class="text-xs font-black text-stone-900">活動亮點與成效：</div>
                  <ul class="space-y-1 text-xs text-stone-700 leading-tight">
                    ${act.key_highlights.slice(0, 4).map(h => `
                      <li class="flex items-start gap-1">
                        <span style="color: ${cat.theme_color || accentColor}; font-weight: bold;">✓</span>
                        <span>${h}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold text-stone-400">
                  <span>新竹青年分團專案</span>
                  <span>信仰傳承 • 熱血奉獻</span>
                </div>
              </div>

            </div>

            <!-- Status Bar -->
            <div class="flex items-center justify-between text-[11px] font-bold text-stone-400 pt-1">
              <span>${reportData.meeting_report_title}</span>
              <span>佛光山法寶寺指導</span>
            </div>

          </div>
        </div>
      `;
    });
  });

  // 4. Summary Slide
  const summaryHtml = `
    <div class="slide-page">
      <div class="slide-inner flex flex-col justify-between p-10 bg-[#F7F6F2] text-stone-900">
        <div>
          <span class="text-xs font-black tracking-widest uppercase" style="color: ${accentColor}">
            SUMMARY STATISTICS / 成果總結
          </span>
          <h2 class="text-3xl font-black text-stone-900 mt-1">
            ${reportData.reporting_period} 成果數據統計
          </h2>
        </div>

        <div class="grid grid-cols-4 gap-5 my-auto">
          ${reportData.categories.map(cat => `
            <div class="rounded-3xl p-5 text-white flex flex-col justify-between shadow-lg" style="background-color: ${cat.theme_color || accentColor};">
              <div>
                <div class="text-2xl">${cat.icon}</div>
                <h4 class="font-black text-base mt-1">${cat.short_name}</h4>
                <div class="text-xs text-white/80 mt-0.5">${cat.category_name}</div>
              </div>
              <div class="my-4">
                <div class="text-4xl font-black">
                  ${cat.summary_stats.activity_count}
                  <span class="text-xs font-normal ml-1">場</span>
                </div>
                <div class="text-sm font-bold mt-1 text-white/90">
                  累計 ${cat.summary_stats.total_participants} 人次
                </div>
              </div>
              <div class="text-[10px] text-white/70 pt-2 border-t border-white/20">
                成效顯著 • 圓滿推展
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-between text-xs font-black text-stone-900">
          <span>全期成果總計：</span>
          <div class="flex items-center gap-6">
            <div>共計舉辦：<strong class="text-blue-600 text-base">${reportData.grand_total.total_activities}</strong> 場</div>
            <div>累計參與人次：<strong class="text-emerald-600 text-base">${reportData.grand_total.total_participants}</strong> 人次</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 5. Thank You Slide
  const thankYouHtml = `
    <div class="slide-page">
      <div class="slide-inner flex flex-col justify-between items-center text-center p-12 bg-gradient-to-br from-[#2C3437] to-[#1A2022] text-white">
        <div class="text-xs font-bold text-amber-400 tracking-widest uppercase">BLIA YOUTH MOVEMENT</div>
        <div class="my-auto space-y-4 max-w-xl">
          <h1 class="text-5xl font-black tracking-tight text-white">謝謝大家</h1>
          <p class="text-base text-stone-300 font-bold">
            國際佛光會中華佛光青年總團 • 新竹佛光青年分團<br/>
            祈願青年同心 同道同修 • 人間佛教 廣度有情
          </p>
        </div>
        <div class="flex items-center gap-4 text-xs text-stone-400 font-medium">
          <span>指導單位：佛光山法寶寺</span>
          <span>•</span>
          <span>粉絲專頁：@bliayad_hsinchu</span>
        </div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportData.meeting_report_title || '桃竹苗區聯團會議工作報告簡報'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", "微軟正黑體", "Noto Sans TC", sans-serif;
      color: #1e293b;
      line-height: 1.4;
      padding: 24px 0 60px 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Fixed 16:9 Presentation Slide Canvas */
    .slide-page {
      width: 297mm;
      height: 167.06mm;
      margin: 0 auto 24px auto;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      position: relative;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      border-radius: 8px;
    }

    .slide-inner {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    /* Navigation / Floating Action Bar for Web View */
    .no-print-bar {
      position: sticky;
      top: 12px;
      z-index: 9999;
      max-width: 297mm;
      margin: 0 auto 16px auto;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .btn-action {
      border: none;
      outline: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-print { background: #2563eb; color: #ffffff; }
    .btn-print:hover { background: #1d4ed8; }
    .btn-download { background: #059669; color: #ffffff; }
    .btn-download:hover { background: #047857; }
    .btn-close { background: #475569; color: #ffffff; }
    .btn-close:hover { background: #334155; }

    .tip-box {
      max-width: 297mm;
      margin: 0 auto 16px auto;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 13px;
      color: #1e40af;
    }

    .logo-circle {
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      background: #4A7C59;
      color: #ffffff;
      font-weight: 900;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pill-badge {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 9999px;
      background: #0f172a;
      color: #fbbf24;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 1px;
    }

    /* Helper utility classes inside slide */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .my-auto { margin-top: auto; margin-bottom: auto; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .gap-5 { gap: 20px; }
    .gap-6 { gap: 24px; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
    .col-span-2 { grid-column: span 2 / span 2; }
    .col-span-4 { grid-column: span 4 / span 4; }
    .col-span-8 { grid-column: span 8 / span 8; }
    .rounded-xl { border-radius: 12px; }
    .rounded-2xl { border-radius: 16px; }
    .rounded-3xl { border-radius: 24px; }
    .p-1 { padding: 4px; }
    .p-3 { padding: 12px; }
    .p-4 { padding: 16px; }
    .p-5 { padding: 20px; }
    .p-6 { padding: 24px; }
    .p-10 { padding: 40px; }
    .p-12 { padding: 48px; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Strict 16:9 Landscape PDF Output Rules */
    @page {
      size: 297mm 167.06mm;
      margin: 0;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .no-print,
      .no-print-bar,
      .tip-box {
        display: none !important;
      }

      .slide-page {
        width: 297mm !important;
        height: 167.06mm !important;
        max-height: 167.06mm !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
      }

      .slide-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Bar for Web View -->
  <div class="no-print-bar">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">🖥️</span>
      <span style="font-size: 14px; font-weight: bold;">
        ${reportData.meeting_report_title || '桃竹苗區聯團會議工作報告簡報'}（16:9 投影片無損防跑版預覽）
      </span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-action btn-print" onclick="window.print()">
        🖨️ 立即列印 / 存為 16:9 PDF
      </button>
      <button class="btn-action btn-download" onclick="downloadThisHtml()">
        📥 下載此簡報檔 (.html)
      </button>
      <button class="btn-action btn-close" onclick="window.close()">
        ✕ 關閉
      </button>
    </div>
  </div>

  <div class="tip-box">
    <span>💡 <strong>防跑版設定小秘訣：</strong>點擊「立即列印 / 存為 16:9 PDF」後，在印表機選項中「目的地」選擇「<strong>另存為 PDF</strong>」，「方向」確認為「<strong>橫向 (Landscape)</strong>」，「邊界」選為「<strong>無 (None)</strong>」，並勾選「<strong>背景圖形</strong>」，即可輸出精確 16:9 橫向無損 PDF！</span>
  </div>

  <!-- All Sequentially Paginated Slides -->
  ${coverHtml}
  ${agendaHtml}
  ${bodySlidesHtml}
  ${summaryHtml}
  ${thankYouHtml}

  <script>
    function downloadThisHtml() {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${reportData.reporting_unit || '新竹青年分團'}_工作報告16比9簡報.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Auto-prompt print after images are ready if opened in new tab
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print cancelled or blocked:', e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Opens 16:9 presentation in a fresh new tab and auto-triggers print
 */
export function openSlidesPrintInNewTab(
  reportData: MeetingReportData,
  options?: {
    accentColor?: string;
    customBgUrl?: string;
    customLogoUrl?: string;
  },
  slides?: Slide[]
): boolean {
  try {
    const html = generatePrintableSlidesHtml(reportData, options, slides);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    // Revoke Object URL after tab has loaded to prevent memory leak
    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 60000);
    return true;
  } catch (err) {
    console.error('Failed to open slides print in new tab:', err);
    return false;
  }
}
