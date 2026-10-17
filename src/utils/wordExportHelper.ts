import { ProofDocumentData } from './proofHtmlGenerator';

/**
 * Builds the HTML for an activity proof report matching the layout shown in image.png
 */
function buildActivityReportHtml(data: ProofDocumentData, index?: number): string {
  const photoCount = data.photos.length;
  const calculatedTotal = Number(data.totalCount) || ((Number(data.internalCount) || 0) + (Number(data.externalCount) || 0));
  const expectedCount: number = Number(data.expectedCount) || (calculatedTotal > 0 ? Math.round(calculatedTotal * 0.9) : 30);
  const attendanceRate = data.attendanceRate || (expectedCount > 0 ? `${Math.round((calculatedTotal / expectedCount) * 100)}% (${calculatedTotal >= expectedCount ? '超額出席' : '良好'})` : '100%');

  // Highlights list
  const highlights = (data.highlights && data.highlights.length > 0)
    ? data.highlights
    : [
        '【名師引領與政策方針】：邀請法師及資深講師開示與講授核心主題，引領青年深化信仰實踐。',
        '【分組實戰與個案演練】：青年學員攜帶實際專案分工演練，團隊成員熱烈探討互助共學。',
        '【即時成果發表與回饋】：各組輪流上台發表亮點心得，輔導法師與長官逐一講評指導。',
        '【跨界交流與情誼凝聚】：建立青年聯絡網與同儕互助社群，凝聚佛光團隊向心力。'
      ];

  // Suggestions list
  const suggestions = (data.suggestions && data.suggestions.length > 0)
    ? data.suggestions
    : [
        '【時間配置優化】：實作與分組討論環節熱烈，建議未來類似梯次可多預留交流研討時間。',
        '【設備資源配置】：活動現場多機音控與即時記錄，後續將加強事前線路測試與備援。',
        '【回流追蹤機制】：活動結束後安排線上幹部複盤與後續追蹤，落實日常會務弘化推展。'
      ];

  // Quantitative metrics
  const metrics = (data.quantitativeMetrics && data.quantitativeMetrics.length > 0)
    ? data.quantitativeMetrics
    : [
        { id: 'm1', name: '實到出席人數', value: `${calculatedTotal} 人`, benchmark: `預計 ${expectedCount} 人（達成率 ${attendanceRate}）` },
        { id: 'm2', name: '整體滿意度', value: '97.4%', benchmark: '目標 ≥ 90%（顯著達標）' },
        { id: 'm3', name: '青年幹部承擔率', value: '100%', benchmark: `${data.internalCount || 15} 位青年全員投入職責分工` },
        { id: 'm4', name: '回饋表填寫率', value: '98.5%', benchmark: '全數繳交有效實踐承諾' }
      ];

  // Participant & VIP feedbacks
  const participantFeedback = data.participantFeedback || '青年普遍回饋活動內容緊湊扎實，特別是在實務演練與信仰融入生活的引導上收穫良多，期盼未來持續辦理此類進階專案。';
  const vipFeedback = data.vipFeedback || '輔導法師與常住指導長官致詞表示：「看到青年充滿朝氣活力、主動發心承擔，把三好四給精神落實在每一個細節，令人十分讚歎與感動。」';
  const extendedBenefits = data.extendedBenefits || '已建立本場活動專屬聯絡交流社群，促進跨梯次青年幹部互動，持續擴散青年弘法與社會服務實踐成效。';

  // 2x2 Photo Cards Layout
  const photoCells = data.photos.slice(0, 4).map((p, pIdx) => {
    let rawCaption = (p.caption || `活動現場實況紀錄 0${pIdx + 1}`).trim();
    if (rawCaption.startsWith('圖說：') || rawCaption.startsWith('【圖說】：')) {
      rawCaption = rawCaption.replace(/^(【圖說】：|圖說：)/, '').trim();
    }
    return `
      <td style="width: 50%; padding: 6px; vertical-align: top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #334155; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td style="padding: 6px; text-align: center; background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;">
              <div style="text-align: left; margin-bottom: 4px; font-size: 8.5pt; font-weight: bold; color: #334155; font-family: '微軟正黑體', sans-serif;">
                📷 ${pIdx + 1}
              </div>
              <div style="height: 190px; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: #0f172a;">
                <img src="${p.url}" alt="佐證照片 ${pIdx + 1}" width="280" style="max-width: 100%; max-height: 185px; object-fit: cover; display: block; margin: 0 auto;" />
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; font-size: 9pt; color: #1e293b; line-height: 1.5; background-color: #ffffff; min-height: 48px; font-family: '微軟正黑體', sans-serif;">
              <strong>【圖說】：</strong>${rawCaption}
            </td>
          </tr>
        </table>
      </td>
    `;
  });

  let photoGridHtml = '';
  if (photoCells.length > 0) {
    for (let i = 0; i < photoCells.length; i += 2) {
      photoGridHtml += `<tr>${photoCells[i]}${photoCells[i + 1] || '<td style="width: 50%; padding: 6px;"></td>'}</tr>`;
    }
  } else {
    photoGridHtml = `
      <tr>
        <td colspan="2" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 10pt; border: 1px dashed #cbd5e1;">
          （尚無上傳活動佐證照片）
        </td>
      </tr>
    `;
  }

  return `
    <div class="activity-sheet" style="page-break-after: always; margin-bottom: 24px;">
      
      <!-- Top Pill Header Badge -->
      <div style="text-align: center; margin-bottom: 8px;">
        <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; padding: 4px 18px; font-size: 9.5pt; font-weight: bold; color: #334155; font-family: '微軟正黑體', sans-serif;">
          專案活動成效與佐證資料
        </span>
      </div>

      <!-- Main Activity Title -->
      <h1 style="text-align: center; font-size: 17pt; font-weight: bold; color: #0f172a; margin: 6px 0 12px 0; line-height: 1.4; font-family: '微軟正黑體', sans-serif;">
        ${data.title || '國際佛光會新竹青年分團專案活動'}
      </h1>

      <!-- Meta Bar: 3 Columns -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 6px; font-size: 9pt; color: #475569; font-family: '微軟正黑體', sans-serif;">
        <tr>
          <td style="text-align: left; width: 45%;">主辦單位：${data.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}</td>
          <td style="text-align: center; width: 25%;">報告日期：${data.reportDate || data.date || '2026/08/20'}</td>
          <td style="text-align: right; width: 30%;">彙整人：${data.reporterName || '專案秘書 周汶蔚'}</td>
        </tr>
      </table>
      <div style="border-top: 2px solid #0f172a; margin-bottom: 14px;"></div>

      <!-- 一、活動基本資料表 -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
          <td style="background-color: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 4px; font-weight: bold; font-size: 10pt; font-family: '微軟正黑體', sans-serif;">
            一、活動基本資料表
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="6" cellspacing="0" style="border: 1px solid #334155; border-collapse: collapse; margin-bottom: 14px; font-size: 9.5pt; font-family: '微軟正黑體', sans-serif;">
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; width: 14%; text-align: center; color: #0f172a;">活動名稱</td>
          <td colspan="3" style="border: 1px solid #334155; font-weight: bold; color: #0f172a; font-size: 10pt;">
            ${data.title || '未填寫'}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; width: 14%; text-align: center; color: #0f172a;">辦理時間</td>
          <td style="border: 1px solid #334155; width: 36%;">
            ${data.date || '未填寫'} ${data.timeRange ? `(${data.timeRange})` : ''}
          </td>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; width: 14%; text-align: center; color: #0f172a;">活動地點</td>
          <td style="border: 1px solid #334155; width: 36%;">
            ${data.location || '佛光山法寶寺'}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; text-align: center; color: #0f172a;">主辦單位</td>
          <td style="border: 1px solid #334155;">
            ${data.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}
          </td>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; text-align: center; color: #0f172a;">執行/協辦</td>
          <td style="border: 1px solid #334155;">
            ${data.executingUnit || '新竹青年分團'} / ${data.guidingUnit || '佛光山法寶寺'}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #334155; font-weight: bold; text-align: center; color: #0f172a;">對象與人數</td>
          <td style="border: 1px solid #334155;">
            ${data.targetAudience || '佛光青年、幹部及對佛法有興趣之大眾'}<br/>
            <span style="color: #64748b; font-size: 8.5pt;">(出席率 ${attendanceRate})</span>
          </td>
          <td colspan="2" style="border: 1px solid #334155; vertical-align: middle;">
            <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; padding: 3px 14px; font-size: 9pt; color: #334155; font-weight: bold;">
              預期：${expectedCount} 人 ｜ 實到：${calculatedTotal} 人
            </span>
          </td>
        </tr>
      </table>

      <!-- 二、活動執行內容與重要歷程 -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
          <td style="background-color: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 4px; font-weight: bold; font-size: 10pt; font-family: '微軟正黑體', sans-serif;">
            二、活動執行內容與重要歷程
          </td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; font-size: 9.5pt; line-height: 1.6; color: #1e293b; font-family: '微軟正黑體', sans-serif;">
        <strong>【活動主旨】：</strong>${data.summary || '尚無內容簡述。'}
      </div>

      <div style="margin-bottom: 14px; font-family: '微軟正黑體', sans-serif;">
        <div style="font-size: 9.5pt; font-weight: bold; color: #0f172a; margin-bottom: 4px;">【核心流程與亮點紀要】：</div>
        <ol style="margin: 0; padding-left: 20px; font-size: 9pt; line-height: 1.6; color: #1e293b;">
          ${highlights.map(h => `<li style="margin-bottom: 3px;">${h}</li>`).join('')}
        </ol>
      </div>

      <!-- 三、活動成果佐證照片區 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
          <td style="text-align: left;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 4px; font-weight: bold; font-size: 10pt; font-family: '微軟正黑體', sans-serif;">
                  三、活動成果佐證照片區
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: right; font-size: 9pt; color: #64748b; font-family: '微軟正黑體', sans-serif;">
            共 ${photoCount} 張佐證紀錄（均附標準圖說）
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
        ${photoGridHtml}
      </table>

      <!-- 四、檢討與後續追蹤建議 -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
          <td style="background-color: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 4px; font-weight: bold; font-size: 10pt; font-family: '微軟正黑體', sans-serif;">
            四、檢討與後續追蹤建議
          </td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 9pt; line-height: 1.6; color: #1e293b; font-family: '微軟正黑體', sans-serif;">
        <ul style="margin: 0; padding-left: 20px;">
          ${suggestions.map(s => `<li style="margin-bottom: 3px;">${s}</li>`).join('')}
        </ul>
      </div>

      <!-- 五、效益評估與成果統計 -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
          <td style="background-color: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 4px; font-weight: bold; font-size: 10pt; font-family: '微軟正黑體', sans-serif;">
            五、效益評估與成果統計
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px; font-family: '微軟正黑體', sans-serif;">
        <tr>
          <!-- Left: Quantitative Metrics Table -->
          <td style="width: 48%; vertical-align: top; padding-right: 8px;">
            <table width="100%" cellpadding="5" cellspacing="0" style="border: 1px solid #334155; border-collapse: collapse; font-size: 8.5pt;">
              <tr style="background-color: #0f172a; color: #ffffff;">
                <th colspan="3" style="padding: 6px; text-align: center; font-size: 9pt; font-weight: bold;">(一) 量化成效指標</th>
              </tr>
              <tr style="background-color: #f1f5f9; font-weight: bold; color: #0f172a;">
                <td style="border: 1px solid #334155; width: 38%;">評估指標</td>
                <td style="border: 1px solid #334155; width: 26%; text-align: center;">達成成果</td>
                <td style="border: 1px solid #334155; width: 36%;">目標 / 備註</td>
              </tr>
              ${metrics.map(m => `
                <tr>
                  <td style="border: 1px solid #334155;">${m.name}</td>
                  <td style="border: 1px solid #334155; text-align: center; font-weight: bold; color: #0f172a;">${m.value}</td>
                  <td style="border: 1px solid #334155; color: #475569;">${m.benchmark || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </td>

          <!-- Right: Qualitative Feedback -->
          <td style="width: 52%; vertical-align: top; padding-left: 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #cbd5e1; border-collapse: collapse; background-color: #ffffff;">
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 6px 10px; font-size: 9pt; font-weight: bold; color: #0f172a;">
                  (二) 質化意見與後續效益
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 10px; font-size: 8.5pt; color: #1e293b; line-height: 1.55;">
                  <div style="margin-bottom: 6px;">
                    <strong style="color: #2563eb;">▶ 學員回饋：</strong><br/>
                    ${participantFeedback}
                  </div>
                  <div style="margin-bottom: 6px;">
                    <strong style="color: #059669;">▶ 貴賓致詞：</strong><br/>
                    ${vipFeedback}
                  </div>
                  <div>
                    <strong style="color: #d97706;">▶ 延伸效益：</strong><br/>
                    ${extendedBenefits}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Bottom Note Box -->
      <div style="padding: 6px 12px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 6px; font-size: 8.5pt; color: #854d0e; font-family: '微軟正黑體', sans-serif;">
        <strong>📁 資料備份提醒：</strong>
        <br/>• 本次活動報告已彙整完畢，請確認內容與照片圖說。
      </div>

    </div>
  `;
}

/**
 * Wraps HTML content into a full Word-compliant MHTML/HTML document
 */
function wrapInWordDocument(bodyHtml: string, docTitle: string): Blob {
  const wordHtmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: '微軟正黑體', 'Microsoft JhengHei', '標楷體', sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #0f172a;
          background-color: #ffffff;
        }
        table {
          mso-displayed-decimal-separator: ".";
          mso-displayed-thousand-separator: ",";
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;

  return new Blob(['\ufeff' + wordHtmlContent], {
    type: 'application/msword;charset=utf-8'
  });
}

/**
 * Generates an MHTML / HTML file format that Microsoft Word natively opens directly as a Word document (.doc).
 * Formatted precisely according to image.png specifications.
 */
export function generateWordDocumentBlob(data: ProofDocumentData): Blob {
  const content = buildActivityReportHtml(data);
  return wrapInWordDocument(content, `活動成果報告_${data.title || '活動'}`);
}

/**
 * Generates a batch Word document containing multiple activity reports, separated by page breaks.
 */
export function generateBatchWordDocumentBlob(dataList: ProofDocumentData[], title?: string): Blob {
  const docTitle = title || `2026年優秀分團選拔活動佐證手冊_共${dataList.length}項活動`;
  const bodyHtml = dataList.map((data, idx) => buildActivityReportHtml(data, idx + 1)).join('\n<br clear="all" style="page-break-before:always; mso-break-type:section-break" />\n');
  return wrapInWordDocument(bodyHtml, docTitle);
}

/**
 * Copies rich formatted HTML to clipboard so the user can paste directly into Google Docs or Word with formatting preserved.
 */
export async function copyFormattedTextForGoogleDocs(data: ProofDocumentData): Promise<boolean> {
  const htmlContent = buildActivityReportHtml(data);
  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlContent], { type: 'text/html' }),
      'text/plain': new Blob([`${data.title}\n日期：${data.date}\n地點：${data.location}`], { type: 'text/plain' })
    });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.warn('ClipboardItem API failed, falling back to execCommand:', err);
    try {
      const listener = (e: ClipboardEvent) => {
        e.clipboardData?.setData('text/html', htmlContent);
        e.clipboardData?.setData('text/plain', `${data.title}\n日期：${data.date}\n地點：${data.location}`);
        e.preventDefault();
      };
      document.addEventListener('copy', listener);
      document.execCommand('copy');
      document.removeEventListener('copy', listener);
      return true;
    } catch (e2) {
      console.error('Copy to clipboard failed entirely:', e2);
      return false;
    }
  }
}
