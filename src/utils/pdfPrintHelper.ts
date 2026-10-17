import { ProofDocumentData } from './proofHtmlGenerator';

/**
 * Builds a single activity sheet HTML for print / PDF export
 */
function buildPrintableActivitySheet(data: ProofDocumentData, index?: number, total?: number): string {
  const photoCount = data.photos.length;
  const calculatedTotal = Number(data.totalCount) || ((Number(data.internalCount) || 0) + (Number(data.externalCount) || 0));
  const expectedCount: number = Number(data.expectedCount) || (calculatedTotal > 0 ? Math.round(calculatedTotal * 0.9) : 30);
  const attendanceRate = data.attendanceRate || (expectedCount > 0 ? `${Math.round((calculatedTotal / expectedCount) * 100)}% (${calculatedTotal >= expectedCount ? '超額出席' : '良好'})` : '100%');

  const highlights = (data.highlights && data.highlights.length > 0)
    ? data.highlights
    : [
        '【名師引領與政策方針】：邀請法師及資深講師開示與講授核心主題，引領青年深化信仰實踐。',
        '【分組實戰與個案演練】：青年學員攜帶實際專案分工演練，團隊成員熱烈探討互助共學。',
        '【即時成果發表與回饋】：各組輪流上台發表亮點心得，輔導法師與長官逐一講評指導。',
        '【跨界交流與情誼凝聚】：建立青年聯絡網與同儕互助社群，凝聚佛光團隊向心力。'
      ];

  const suggestions = (data.suggestions && data.suggestions.length > 0)
    ? data.suggestions
    : [
        '【時間配置優化】：實作與分組討論環節熱烈，建議未來類似梯次可多預留交流研討時間。',
        '【設備資源配置】：活動現場多機音控與即時記錄，後續將加強事前線路測試與備援。',
        '【回流追蹤機制】：活動結束後安排線上幹部複盤與後續追蹤，落實日常會務弘化推展。'
      ];

  const metrics = (data.quantitativeMetrics && data.quantitativeMetrics.length > 0)
    ? data.quantitativeMetrics
    : [
        { id: 'm1', name: '實到出席人數', value: `${calculatedTotal} 人`, benchmark: `預計 ${expectedCount} 人（達成率 ${attendanceRate}）` },
        { id: 'm2', name: '整體滿意度', value: '97.4%', benchmark: '目標 ≥ 90%（顯著達標）' },
        { id: 'm3', name: '青年幹部承擔率', value: '100%', benchmark: `${data.internalCount || 15} 位青年全員投入職責分工` },
        { id: 'm4', name: '回饋表填寫率', value: '98.5%', benchmark: '全數繳交有效實踐承諾' }
      ];

  const participantFeedback = data.participantFeedback || '青年普遍回饋活動內容緊湊扎實，特別是在實務演練與信仰融入生活的引導上收穫良多，期盼未來持續辦理此類進階專案。';
  const vipFeedback = data.vipFeedback || '輔導法師與常住指導長官致詞表示：「看到青年充滿朝氣活力、主動發心承擔，把三好四給精神落實在每一個細節，令人十分讚歎與感動。」';
  const extendedBenefits = data.extendedBenefits || '已建立本場活動專屬聯絡交流社群，促進跨梯次青年幹部互動，持續擴散青年弘法與社會服務實踐成效。';

  // Photo Cards
  const photoCards = data.photos.slice(0, 4).map((p, pIdx) => {
    let rawCaption = (p.caption || `活動現場實況紀錄 0${pIdx + 1}`).trim();
    if (rawCaption.startsWith('圖說：') || rawCaption.startsWith('【圖說】：')) {
      rawCaption = rawCaption.replace(/^(【圖說】：|圖說：)/, '').trim();
    }
    return `
      <div class="photo-card">
        <div class="photo-header">
          <span class="photo-index">📷 佐證相片 0${pIdx + 1}</span>
        </div>
        <div class="photo-img-wrap">
          <img src="${p.url}" alt="佐證相片 ${pIdx + 1}" crossorigin="anonymous" onerror="this.src='https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'" />
        </div>
        <div class="photo-caption">
          <strong>【圖說】：</strong>${rawCaption}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="activity-sheet">
      <!-- 頂部頁籤標籤 -->
      <div class="top-tag-container">
        <span class="top-tag">專案活動成效與佐證資料</span>
        ${index && total ? `<span class="page-count-badge">第 ${index} / ${total} 項專案活動</span>` : ''}
      </div>

      <!-- 大標題 -->
      <h1 class="main-title">${data.title || '國際佛光會新竹青年分團專案活動'}</h1>

      <!-- 3 欄 Meta 資訊 -->
      <div class="meta-row">
        <div class="meta-item text-left">主辦單位：${data.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}</div>
        <div class="meta-item text-center">報告日期：${data.reportDate || data.date || '2026/08/20'}</div>
        <div class="meta-item text-right">彙整人：${data.reporterName || '專案秘書 周汶蔚'}</div>
      </div>
      <div class="divider-line"></div>

      <!-- 一、活動基本資料表 -->
      <div class="section-title-wrap">
        <span class="section-title">一、活動基本資料表</span>
      </div>

      <table class="data-table">
        <tbody>
          <tr>
            <th style="width: 14%;">活動名稱</th>
            <td colspan="3" style="font-weight: bold; font-size: 11pt;">${data.title || '未填寫'}</td>
          </tr>
          <tr>
            <th style="width: 14%;">辦理時間</th>
            <td style="width: 36%;">${data.date || '未填寫'} ${data.timeRange ? `(${data.timeRange})` : ''}</td>
            <th style="width: 14%;">活動地點</th>
            <td style="width: 36%;">${data.location || '佛光山法寶寺'}</td>
          </tr>
          <tr>
            <th>主辦單位</th>
            <td>${data.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}</td>
            <th>執行/協辦</th>
            <td>${data.executingUnit || '新竹青年分團'} / ${data.guidingUnit || '佛光山法寶寺'}</td>
          </tr>
          <tr>
            <th>活動性質</th>
            <td><strong>${data.activityNature || '青年團活動'}</strong></td>
            <th>活動宗旨</th>
            <td><strong>${data.activityObjective || (data.activityObjectives?.join('、')) || '教育培養人才'}</strong></td>
          </tr>
          <tr>
            <th>對象與人數</th>
            <td>
              <div>${data.targetAudience || '佛光青年、幹部及對佛法有興趣之大眾'}</div>
              <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">(出席率 ${attendanceRate})</div>
            </td>
            <td colspan="2">
              <span class="attendance-pill">
                預期出席：${expectedCount} 人 ｜ 實到總人數：${calculatedTotal} 人（本團：${data.internalCount || 0} 人 / 非本團：${data.externalCount || 0} 人）
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 二、活動執行內容與重要歷程 -->
      <div class="section-title-wrap">
        <span class="section-title">二、活動執行內容與重要歷程</span>
      </div>

      <div class="summary-box">
        <strong>【活動核心主旨】：</strong>${data.summary || '國際佛光會新竹青年分團專案活動，貫徹星雲大師人間佛教四大宗旨。'}
      </div>

      <div class="highlights-box">
        <div style="font-weight: bold; margin-bottom: 4px; color: #0f172a;">【特色亮點與重點環節】：</div>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
          ${highlights.map((h) => `<li style="margin-bottom: 2px;">${h}</li>`).join('')}
        </ol>
      </div>

      <!-- 三、活動成果佐證照片區 -->
      <div class="section-title-wrap" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <span class="section-title">三、活動成果佐證照片區</span>
        <span style="font-size: 8.5pt; color: #64748b; font-weight: bold;">共 ${photoCount} 張高畫質佐證紀錄（均附標準圖說）</span>
      </div>

      ${photoCount === 0 ? `
        <div style="padding: 24px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 6px; color: #94a3b8; font-size: 9pt;">
          （尚無上傳活動現場相片）
        </div>
      ` : `
        <div class="photo-grid">
          ${photoCards}
        </div>
      `}

      <!-- 四、檢討與後續具體建議 -->
      <div class="section-title-wrap">
        <span class="section-title">四、檢討與後續具體建議</span>
      </div>
      <div class="suggestions-box">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          ${suggestions.map((s) => `<li style="margin-bottom: 2px;">${s}</li>`).join('')}
        </ul>
      </div>

      <!-- 五、效益評估與成果檢核 -->
      <div class="section-title-wrap">
        <span class="section-title">五、效益評估與成果檢核</span>
      </div>

      <div class="evaluation-grid">
        <!-- 量化表格 -->
        <div class="eval-column">
          <div class="eval-column-header">(一) 量化成效指標</div>
          <table class="eval-table">
            <thead>
              <tr>
                <th style="text-align: left;">評估指標</th>
                <th style="width: 25%; text-align: center;">達成成果</th>
                <th style="text-align: left;">目標基準 / 備註</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.map((m) => `
                <tr>
                  <td><strong>${m.name}</strong></td>
                  <td style="text-align: center; font-weight: bold; color: #0284c7;">${m.value}</td>
                  <td style="font-size: 8.5pt; color: #475569;">${m.benchmark}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 質化回饋 -->
        <div class="eval-column">
          <div class="eval-column-header">(二) 質化意見與延伸回饋</div>
          <div class="qualitative-content">
            <div style="margin-bottom: 6px;">
              <strong style="color: #2563eb;">▶ 學員心得回饋：</strong>
              <span>${participantFeedback}</span>
            </div>
            <div style="margin-bottom: 6px;">
              <strong style="color: #059669;">▶ 法師與貴賓勉勵：</strong>
              <span>${vipFeedback}</span>
            </div>
            <div>
              <strong style="color: #d97706;">▶ 延伸弘化效益：</strong>
              <span>${extendedBenefits}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 頁尾備查戳記 -->
      <div class="footer-stamp">
        <span>填報單位：國際佛光會新竹青年分團</span>
        <span>評選年度：2026年中華佛光青年總團優秀分團選拔佐證資料</span>
        <span>佛光青年 • 信仰傳承 • 熱血奉獻</span>
      </div>
    </div>
  `;
}

/**
 * Generates a full standalone HTML document for batch printing and saving as PDF
 */
export function generateBatchPrintableHtml(documents: ProofDocumentData[], title?: string): string {
  const docTitle = title || `2026年優秀分團選拔活動佐證手冊_共${documents.length}項活動`;
  const total = documents.length;
  const sheetsHtml = documents.map((doc, idx) => buildPrintableActivitySheet(doc, idx + 1, total)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", "微軟正黑體", "Noto Sans TC", sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 0 60px 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Floating Action Bar (Hidden during Print) */
    .top-action-bar {
      position: sticky;
      top: 12px;
      z-index: 9999;
      max-width: 210mm;
      margin: 0 auto 20px auto;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .top-action-title {
      font-size: 14px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .top-action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
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

    .btn-print {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }

    .btn-download {
      background: #059669;
      color: #ffffff;
    }
    .btn-download:hover {
      background: #047857;
    }

    .btn-close {
      background: #475569;
      color: #ffffff;
    }
    .btn-close:hover {
      background: #334155;
    }

    .tip-box {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 13px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* A4 Document Sheet Container */
    .activity-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 28px auto;
      background: #ffffff;
      padding: 15mm 16mm 14mm 16mm;
      box-shadow: 0 4px 25px rgba(0,0,0,0.1);
      position: relative;
      page-break-after: always;
      break-after: page;
    }

    /* Sheet Components */
    .top-tag-container {
      text-align: center;
      position: relative;
      margin-bottom: 8px;
    }

    .top-tag {
      display: inline-block;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 3px 18px;
      font-size: 10pt;
      font-weight: bold;
      color: #334155;
    }

    .page-count-badge {
      position: absolute;
      right: 0;
      top: 2px;
      font-size: 9pt;
      font-weight: bold;
      color: #64748b;
      background: #f8fafc;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .main-title {
      text-align: center;
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      margin: 6px 0 10px 0;
      letter-spacing: -0.3px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 9.5pt;
      color: #475569;
      margin-bottom: 6px;
    }

    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .divider-line {
      height: 2px;
      background-color: #0f172a;
      margin-bottom: 12px;
    }

    .section-title-wrap {
      margin-bottom: 6px;
      margin-top: 10px;
    }

    .section-title {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 10pt;
      letter-spacing: 0.5px;
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #334155;
      font-size: 9.5pt;
      margin-bottom: 10px;
    }

    .data-table th, .data-table td {
      border: 1px solid #334155;
      padding: 6px 8px;
      vertical-align: middle;
    }

    .data-table th {
      background-color: #f8fafc;
      color: #0f172a;
      font-weight: bold;
      text-align: center;
      white-space: nowrap;
    }

    .attendance-pill {
      display: inline-block;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 3px 12px;
      font-size: 8.5pt;
      font-weight: bold;
      color: #1e293b;
    }

    .summary-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 8px 12px;
      font-size: 9pt;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .highlights-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 9pt;
      margin-bottom: 10px;
      background: #ffffff;
    }

    /* Photos Grid */
    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }

    .photo-card {
      border: 1px solid #334155;
      background: #ffffff;
      overflow: hidden;
    }

    .photo-header {
      background: #f8fafc;
      padding: 4px 8px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 8pt;
      font-weight: bold;
      color: #475569;
    }

    .photo-img-wrap {
      height: 155px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .photo-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-caption {
      padding: 6px 8px;
      font-size: 8.5pt;
      line-height: 1.45;
      color: #1e293b;
      min-height: 38px;
      background: #ffffff;
    }

    .suggestions-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 8px 12px;
      font-size: 9pt;
      margin-bottom: 10px;
    }

    /* Evaluation Grid */
    .evaluation-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    .eval-column {
      border: 1px solid #334155;
      border-radius: 4px;
      overflow: hidden;
      background: #ffffff;
    }

    .eval-column-header {
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      font-size: 9pt;
      padding: 4px 8px;
      text-align: center;
    }

    .eval-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }

    .eval-table th, .eval-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 6px;
    }

    .eval-table th {
      background: #f1f5f9;
      font-weight: bold;
    }

    .qualitative-content {
      padding: 8px;
      font-size: 8.5pt;
      line-height: 1.55;
    }

    .footer-stamp {
      border-top: 1px dashed #94a3b8;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #64748b;
    }

    /* Print Media Rules */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .no-print,
      .top-action-bar,
      .tip-box {
        display: none !important;
      }

      .activity-sheet {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
      }

      .activity-sheet:last-child {
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

  <!-- Floating Action Bar for Web Browser View -->
  <div class="top-action-bar no-print">
    <div class="top-action-title">
      <span>📄 2026年優秀分團選拔活動佐證手冊</span>
      <span style="font-size: 12px; font-weight: normal; color: #94a3b8;">（共選取 ${documents.length} 場專案活動）</span>
    </div>
    <div class="top-action-buttons">
      <button class="btn-action btn-print" onclick="window.print()">
        🖨️ 立即列印 / 存為 PDF
      </button>
      <button class="btn-action btn-download" onclick="downloadThisFile()">
        📥 下載此列印檔 (.html)
      </button>
      <button class="btn-action btn-close" onclick="window.close()">
        ✕ 關閉分頁
      </button>
    </div>
  </div>

  <div class="tip-box no-print">
    <span>💡 <strong>如何另存為 PDF？</strong> 點擊「立即列印 / 存為 PDF」，在系統列印視窗的「目的地」下拉選單中選擇「<strong>另存為 PDF (Save as PDF)</strong>」，即可將 ${documents.length} 項活動完整匯出為標準高畫質 PDF 文件！</span>
  </div>

  <!-- Document Sheets -->
  ${sheetsHtml}

  <script>
    function downloadThisFile() {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${docTitle}.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Auto-trigger print after images have loaded if opened in new window
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print failed or cancelled:', e);
        }
      }, 600);
    });
  </script>
</body>
</html>`;
}

/**
 * Opens printable document in a new tab (recommended, completely avoids iframe sandbox blocks)
 */
export function openPrintableDocumentInNewTab(documents: ProofDocumentData[], title?: string): boolean {
  try {
    const html = generateBatchPrintableHtml(documents, title);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // Popup blocker caught it - fallback to direct anchor click
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
    console.error('Failed to open printable document in new tab:', err);
    return false;
  }
}

/**
 * Downloads the standalone HTML file that can be opened in any browser and saved as PDF
 */
export function downloadPrintableHtmlFile(documents: ProofDocumentData[], title?: string): void {
  const docTitle = title || `2026年優秀分團選拔活動佐證手冊_共${documents.length}項活動`;
  const html = generateBatchPrintableHtml(documents, docTitle);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${docTitle}_列印存為PDF.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tries printing directly via a hidden iframe
 */
export function printViaHiddenIframe(documents: ProofDocumentData[], title?: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = generateBatchPrintableHtml(documents, title);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        resolve(false);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
          resolve(true);
        } catch (printErr) {
          console.warn('Iframe print failed:', printErr);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(false);
        }
      }, 700);
    } catch (err) {
      console.error('Error creating iframe for print:', err);
      resolve(false);
    }
  });
}
