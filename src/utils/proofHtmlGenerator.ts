export interface QuantitativeMetricItem {
  id: string;
  name: string;
  value: string;
  benchmark: string;
}

export interface ProofDocumentData {
  id?: string;
  title: string;
  date: string;
  timeRange?: string;
  location: string;
  levelCategory?: string; // '分團活動' | '道場活動' | '總團活動' | '友團活動' | '未歸類'
  natureCategory?: string; // '文化弘揚佛法' | '教育培養人才' | '慈善福利社會' | '共修淨化人心' | '聯誼活動' | '未歸類'
  activityNature?: string; // '總團活動' | '法寶寺道場活動' | '參加友團活動'
  activityObjective?: string; // '文化弘揚佛法' | '教育培養人才' | '慈善福利社會' | '聯誼活動'
  activityObjectives?: string[];
  
  // Units & Organizers
  organizer?: string;
  executingUnit?: string;
  guidingUnit?: string;
  targetAudience?: string;

  // Attendance
  internalCount: number | string;
  externalCount: number | string;
  totalCount: number | string;
  expectedCount?: number | string;
  attendanceRate?: string;

  // Section 2: Objectives & Highlights
  summary: string;
  highlights?: string[];

  // Section 3: Photos
  photos: Array<{
    url: string;
    caption: string;
  }>;

  // Section 4: Follow-up & Reporter
  suggestions?: string[];
  reporterName?: string;
  reportDate?: string;

  // Section 5: Metrics & Feedback
  quantitativeMetrics?: QuantitativeMetricItem[];
  participantFeedback?: string;
  vipFeedback?: string;
  extendedBenefits?: string;

  updatedAt?: string;
}

export function generateStandaloneProofHtml(data: ProofDocumentData): string {
  const photoCount = data.photos.length;
  const isSinglePage = photoCount <= 3;
  
  // Nature and Objective display
  const natureOptions = ['總團/總會活動', '法寶寺道場活動', '參加友團活動'];
  const natureDisplay = natureOptions.map(opt => {
    const isChecked = data.activityNature === opt || 
      (opt === '總團/總會活動' && (data.activityNature === '總團活動' || data.activityNature === '總團/總會活動')) ||
      (opt.includes('法寶寺') && data.activityNature?.includes('法寶寺'));
    return `${isChecked ? '☑' : '☐'} ${opt}`;
  }).join('&nbsp;&nbsp;');

  const objectiveOptions = ['文化弘揚佛法', '教育培養人才', '慈善福利社會', '聯誼活動'];
  const currentObjectives = data.activityObjectives || (data.activityObjective ? [data.activityObjective] : []);
  const objectiveDisplay = objectiveOptions.map(opt => {
    const isChecked = currentObjectives.includes(opt) || data.activityObjective === opt;
    return `${isChecked ? '☑' : '☐'} ${opt}`;
  }).join('&nbsp;&nbsp;');

  // Missing fields check
  const missingItems: string[] = [];
  if (!data.date) missingItems.push('活動日期');
  if (!data.title) missingItems.push('活動名稱');
  if (!data.location) missingItems.push('活動地點');
  if (!data.activityNature) missingItems.push('活動性質');
  if (!data.activityObjective && (!data.activityObjectives || data.activityObjectives.length === 0)) missingItems.push('活動宗旨');
  if (!data.internalCount && data.internalCount !== 0) missingItems.push('本團參與人數');
  if (!data.summary) missingItems.push('活動內容簡述');
  if (photoCount < 3) missingItems.push(`活動照片（目前 ${photoCount} 張，標準規範至少 3 張）`);
  const missingCaptions = data.photos.filter((p, i) => !p.caption.trim()).length;
  if (missingCaptions > 0) missingItems.push(`照片圖說（尚有 ${missingCaptions} 張未填寫圖說）`);

  const warningBannerHtml = missingItems.length > 0 ? `
  <div class="warning-box no-print">
    <strong>⚠️ 提醒：本次資料尚缺【${missingItems.join('、')}】，請確認是否補充。</strong>
  </div>` : '';

  // Generate photos HTML
  const photosHtml = data.photos.map((p, idx) => {
    const captionText = p.caption.trim().startsWith('圖說：') ? p.caption.trim() : `圖說：${p.caption.trim() || `活動佐證相片 ${idx + 1}`}`;
    return `
      <div class="photo-card">
        <div class="photo-wrapper">
          <img src="${p.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'}" alt="佐證照片 ${idx + 1}" crossorigin="anonymous" />
        </div>
        <div class="photo-caption">${captionText}</div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>國際佛光會中華佛光青年總團 2026年優秀分團選拔活動佐證資料表 - ${data.title || '活動名稱'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=Noto+Sans+TC:wght@400;500;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f1f3f5;
      font-family: 'Noto Sans TC', sans-serif;
      color: #222;
      line-height: 1.5;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }

    .warning-box {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      padding: 12px 18px;
      background-color: #fff3cd;
      border: 1.5px solid #ffeeba;
      border-radius: 8px;
      color: #856404;
      font-size: 14px;
      font-weight: bold;
    }

    .a4-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 24px auto;
      background: #ffffff;
      padding: 16mm 18mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      position: relative;
    }

    /* Print styles */
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }

    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .a4-container {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
        padding-top: 8mm;
      }
    }

    .header-section {
      text-align: center;
      margin-bottom: 14px;
      border-bottom: 2px solid #2C3437;
      padding-bottom: 10px;
    }

    .org-title {
      font-family: 'Noto Serif TC', serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #444;
      margin-bottom: 4px;
    }

    .doc-main-title {
      font-family: 'Noto Serif TC', serif;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: #1a1a1a;
    }

    /* Table layout */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 13.5px;
    }

    .info-table th, 
    .info-table td {
      border: 1px solid #444;
      padding: 7px 10px;
      vertical-align: middle;
    }

    .info-table th {
      background-color: #f7f8f9;
      font-weight: 700;
      text-align: center;
      width: 18%;
      color: #222;
      white-space: nowrap;
    }

    .info-table td {
      color: #333;
    }

    .summary-box {
      border: 1px solid #444;
      padding: 10px 14px;
      margin-bottom: 14px;
      background-color: #fafbfc;
    }

    .summary-title {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 6px;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .summary-text {
      font-size: 13px;
      line-height: 1.65;
      color: #333;
      text-align: justify;
    }

    /* Photo Grid Styles */
    .photo-section-title {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 8px;
      color: #1a1a1a;
    }

    .photo-grid {
      display: grid;
      gap: 12px;
    }

    /* 1~3 photos: 1 page */
    .grid-1 {
      grid-template-columns: 1fr;
    }
    .grid-2 {
      grid-template-columns: 1fr 1fr;
    }
    .grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    /* 4~6 photos: 2 pages */
    .grid-4 {
      grid-template-columns: 1fr 1fr;
    }
    .grid-5, .grid-6 {
      grid-template-columns: 1fr 1fr;
    }

    .photo-card {
      border: 1px solid #ccc;
      padding: 6px;
      background-color: #fff;
      display: flex;
      flex-direction: column;
    }

    .photo-wrapper {
      width: 100%;
      height: 145px;
      background-color: #f0f0f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Adjust photo height based on count for strict 1-page fit */
    ${isSinglePage ? `
      .grid-1 .photo-wrapper { height: 260px; }
      .grid-2 .photo-wrapper { height: 180px; }
      .grid-3 .photo-wrapper { height: 155px; }
    ` : `
      .photo-wrapper { height: 165px; }
    `}

    .photo-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-caption {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #222;
      text-align: center;
      line-height: 1.35;
      padding: 2px 4px;
      background-color: #fdfdfd;
    }

    .footer-stamp {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px dashed #aaa;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>

  ${warningBannerHtml}

  <div class="a4-container">
    <div class="header-section">
      <div class="org-title">國際佛光會中華佛光青年總團</div>
      <h1 class="doc-main-title">2026年優秀分團選拔活動佐證資料表</h1>
    </div>

    <table class="info-table">
      <tr>
        <th>活動日期</th>
        <td style="width: 32%;">${data.date || '未指定日期'}</td>
        <th>活動名稱</th>
        <td><strong>${data.title || '未命名活動'}</strong></td>
      </tr>
      <tr>
        <th>活動性質</th>
        <td style="font-size: 12.5px;">${natureDisplay}</td>
        <th>活動宗旨</th>
        <td style="font-size: 12.5px;">${objectiveDisplay}</td>
      </tr>
      <tr>
        <th>活動地點</th>
        <td>${data.location || '未填寫地點'}</td>
        <th>人數統計</th>
        <td>
          本團參與 <strong>${data.internalCount || 0}</strong> 人 ｜ 
          非本團參與 <strong>${data.externalCount || 0}</strong> 人 ｜ 
          <strong>總共 ${data.totalCount || ((Number(data.internalCount) || 0) + (Number(data.externalCount) || 0))} 人</strong>
        </td>
      </tr>
    </table>

    <div class="summary-box">
      <div class="summary-title">
        <span>【活動內容簡述】</span>
        <span style="font-size: 11px; font-weight: normal; color: #666;">（字數：${data.summary ? data.summary.length : 0} 字）</span>
      </div>
      <div class="summary-text">
        ${data.summary || '尚無活動內容簡述。'}
      </div>
    </div>

    <div class="photo-section">
      <div class="photo-section-title">【活動照片與佐證資料】（共 ${photoCount} 張）</div>
      <div class="photo-grid grid-${Math.min(photoCount, 6) || 1}">
        ${photosHtml}
      </div>
    </div>

    <div class="footer-stamp">
      <span>填報單位：國際佛光會新竹青年分團</span>
      <span>規範頁數：${isSinglePage ? '1 頁 A4' : '2 頁 A4'}（嚴格無溢出）</span>
      <span>佛光青年 • 信仰傳承 • 熱血奉獻</span>
    </div>
  </div>

</body>
</html>`;
}
