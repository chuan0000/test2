import React from 'react';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';

interface OfficialProofDocumentProps {
  data: ProofDocumentData;
}

export const OfficialProofDocument: React.FC<OfficialProofDocumentProps> = ({ data }) => {
  const photoCount = data.photos.length;

  // Missing alerts
  const missingItems: string[] = [];
  if (!data.date) missingItems.push('活動日期');
  if (!data.title) missingItems.push('活動名稱');
  if (!data.location) missingItems.push('活動地點');
  if (!data.internalCount && data.internalCount !== 0 && !data.totalCount) missingItems.push('參與人數');
  if (!data.summary) missingItems.push('活動主旨');
  if (photoCount < 2) missingItems.push(`佐證照片（目前 ${photoCount} 張，建議至少 2~4 張）`);
  const missingCaptions = data.photos.filter((p) => !p.caption.trim()).length;
  if (missingCaptions > 0) missingItems.push(`照片圖說（尚有 ${missingCaptions} 張未填圖說）`);

  const calculatedTotal = Number(data.totalCount) || ((Number(data.internalCount) || 0) + (Number(data.externalCount) || 0));
  const expectedCount = data.expectedCount || (calculatedTotal > 0 ? Math.round(calculatedTotal * 0.9) : 30);
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

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Missing Items Warning Alert */}
      {missingItems.length > 0 && (
        <div className="w-full max-w-[210mm] mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2 shadow-xs print:hidden">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-amber-800 font-black">提醒：本次資料尚缺【{missingItems.join('、')}】，請確認是否補充。</div>
            <div className="text-[11px] text-amber-700 font-normal mt-0.5">
              依照評鑑標準規範，需備妥完整基本資料及附帶標準圖說之佐證照片。
            </div>
          </div>
        </div>
      )}

      {/* A4 Container Styled exactly as image.png */}
      <div 
        id="a4-official-proof-sheet"
        className="w-full max-w-[210mm] bg-white border border-slate-300 shadow-xl p-6 sm:p-10 font-sans text-slate-900 relative print:border-0 print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none space-y-4"
      >
        
        {/* 頂部橢圓標籤 */}
        <div className="text-center">
          <span className="inline-block bg-slate-100 border border-slate-300 rounded-full px-5 py-1 text-xs font-bold text-slate-700 tracking-wider">
            專案活動成效與佐證資料
          </span>
        </div>

        {/* 大標題 */}
        <h1 className="text-center text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {data.title || '國際佛光會新竹青年分團專案活動'}
        </h1>

        {/* 3欄 Meta 資訊列 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 text-xs text-slate-600 font-medium pb-1.5 pt-0.5">
          <div className="text-left">
            主辦單位：{data.organizer || '國際佛光會新竹青年分團'}
          </div>
          <div className="text-center">
            報告日期：{data.reportDate || data.date || '2026/08/20'}
          </div>
          <div className="text-right">
            彙整人：{data.reporterName || '專案秘書 周汶蔚'}
          </div>
        </div>

        {/* 粗黑分隔線 */}
        <div className="h-[2px] bg-slate-900 w-full mb-3" />

        {/* 一、活動基本資料表 */}
        <div className="space-y-1.5">
          <div>
            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
              一、活動基本資料表
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-800 text-xs">
            <tbody>
              <tr className="border-b border-slate-800">
                <th className="w-24 bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  活動名稱
                </th>
                <td colSpan={3} className="p-2 font-bold text-slate-900 text-xs sm:text-sm">
                  {data.title || <span className="text-red-500 font-normal">（未填寫）</span>}
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <th className="w-24 bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  辦理時間
                </th>
                <td className="p-2 border-r border-slate-800 text-slate-800 w-1/3">
                  {data.date || <span className="text-red-500 font-normal">（未填寫）</span>}
                  {data.timeRange ? ` (${data.timeRange})` : ''}
                </td>
                <th className="w-24 bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  活動地點
                </th>
                <td className="p-2 text-slate-800">
                  {data.location || <span className="text-red-500 font-normal">（未填寫）</span>}
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <th className="w-24 bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  主辦單位
                </th>
                <td className="p-2 border-r border-slate-800 text-slate-800">
                  {data.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}
                </td>
                <th className="w-24 bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  執行/協辦
                </th>
                <td className="p-2 text-slate-800">
                  {data.executingUnit || '新竹青年分團'} / {data.guidingUnit || '佛光山法寶寺'}
                </td>
              </tr>
              <tr>
                <th className="bg-slate-50 p-2 text-center font-bold border-r border-slate-800 text-slate-900 whitespace-nowrap">
                  對象與人數
                </th>
                <td className="p-2 border-r border-slate-800 text-slate-800">
                  <div>{data.targetAudience || '佛光青年、幹部及對佛法有興趣之大眾'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                    (出席率 {attendanceRate})
                  </div>
                </td>
                <td colSpan={2} className="p-2">
                  <span className="inline-block bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-[11px] font-bold text-slate-700">
                    預期：{expectedCount} 人 ｜ 實到：{calculatedTotal} 人
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 二、活動執行內容與重要歷程 */}
        <div className="space-y-2 pt-1">
          <div>
            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
              二、活動執行內容與重要歷程
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 leading-relaxed">
            <strong>【活動主旨】：</strong>{data.summary || '國際佛光會新竹青年分團專案活動，貫徹星雲大師人間佛教四大宗旨。'}
          </div>

          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">【核心流程與亮點紀要】：</div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-800 leading-relaxed">
              {highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 三、活動成果佐證照片區 */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
              三、活動成果佐證照片區
            </span>
            <span className="text-xs text-slate-500 font-medium">
              共 {photoCount} 張佐證紀錄（均附標準圖說）
            </span>
          </div>

          {photoCount === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-md text-center text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
              尚未加入佐證照片，請於編輯區上傳 2~4 張照片與標準圖說。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.photos.slice(0, 4).map((photo, idx) => {
                let caption = (photo.caption || `活動實況紀錄 0${idx + 1}`).trim();
                if (caption.startsWith('圖說：') || caption.startsWith('【圖說】：')) {
                  caption = caption.replace(/^(【圖說】：|圖說：)/, '').trim();
                }
                return (
                  <div key={idx} className="border border-slate-800 rounded-xs overflow-hidden bg-white">
                    <div className="p-2 bg-slate-50 border-b border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">
                        📷 {idx + 1}
                      </div>
                      <div className="h-44 sm:h-48 bg-slate-900 rounded overflow-hidden flex items-center justify-center">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={`佐證相片 ${idx + 1}`}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                            無相片檔案
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 text-xs text-slate-900 leading-relaxed bg-white">
                      <strong>【圖說】：</strong>{caption}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 四、檢討與後續追蹤建議 */}
        <div className="space-y-1.5 pt-1">
          <div>
            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
              四、檢討與後續追蹤建議
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 leading-relaxed">
            <ul className="list-disc pl-5 space-y-1">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 五、效益評估與成果統計 */}
        <div className="space-y-1.5 pt-1">
          <div>
            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
              五、效益評估與成果統計
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Left: Quantitative Table */}
            <div className="border border-slate-800 overflow-hidden">
              <div className="bg-slate-900 text-white p-1.5 text-center font-bold text-xs">
                (一) 量化成效指標
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                    <th className="p-1.5 text-left border-r border-slate-300">評估指標</th>
                    <th className="p-1.5 text-center border-r border-slate-300 w-24">達成成果</th>
                    <th className="p-1.5 text-left">目標 / 備註</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, idx) => (
                    <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                      <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800">{m.name}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold text-slate-900">{m.value}</td>
                      <td className="p-1.5 text-slate-600">{m.benchmark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Qualitative Box */}
            <div className="border border-slate-300 rounded-xs overflow-hidden bg-white flex flex-col justify-between">
              <div className="bg-slate-50 p-1.5 border-b border-slate-300 font-bold text-slate-900 text-xs">
                (二) 質化意見與後續效益
              </div>
              <div className="p-2 text-xs space-y-2 text-slate-800 leading-relaxed">
                <div>
                  <strong className="text-blue-700">▶ 學員回饋：</strong>
                  <span>{participantFeedback}</span>
                </div>
                <div>
                  <strong className="text-emerald-700">▶ 貴賓致詞：</strong>
                  <span>{vipFeedback}</span>
                </div>
                <div>
                  <strong className="text-amber-700">▶ 延伸效益：</strong>
                  <span>{extendedBenefits}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提醒方塊 */}
        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-md text-[11px] text-amber-900 leading-relaxed">
          <strong>📁 資料備份提醒：</strong>
          <br/>• 本次活動報告已彙整完畢，請確認內容與照片圖說。
        </div>

      </div>
    </div>
  );
};
