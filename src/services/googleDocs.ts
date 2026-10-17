/**
 * Google Docs API service
 * Handles document creation, batch updates, reading, and listing Google Docs
 */

export interface GoogleDocItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface ActivityForDocExport {
  id?: string;
  title: string;
  category?: string;
  date: string;
  timeRange?: string;
  location: string;
  organizer?: string;
  executingUnit?: string;
  guidingUnit?: string;
  leadCadres?: string[];
  attendeeTotal?: number;
  attendeeYouth?: number;
  attendeeGuests?: number;
  attendeeVolunteers?: number;
  activityNature?: string;
  activityObjective?: string;
  activityObjectives?: string[];
  summary?: string;
  processSchedule?: string;
  highlightsAndOutcomes?: string;
  reviewAndSuggestions?: string;
  budgetNotes?: string;
  tags?: string[];
  photos?: Array<{ id?: string; url: string; caption: string }>;
}

export interface DocExportResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

/**
 * Lists recent Google Docs files from the user's Google Drive
 */
export const listGoogleDocs = async (
  accessToken: string,
  searchQuery?: string
): Promise<GoogleDocItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const fields = encodeURIComponent(
    'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,iconLink)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=${fields}&pageSize=30&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive listDocs error:', errText);
    throw new Error(`無法讀取 Google 文件清單 (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Fetches document structure and metadata from Google Docs API
 */
export const getGoogleDoc = async (
  accessToken: string,
  documentId: string
): Promise<any> => {
  const url = `https://docs.googleapis.com/v1/documents/${documentId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Docs get error:', errText);
    throw new Error(`無法讀取 Google 文件內容 (${response.status})`);
  }

  return await response.json();
};

/**
 * Extracts plain text from Google Docs structuralElements body
 */
export const extractTextFromDoc = (docData: any): string => {
  if (!docData?.body?.content) return '';
  const textPieces: string[] = [];

  const traverse = (element: any) => {
    if (element.paragraph?.elements) {
      for (const el of element.paragraph.elements) {
        if (el.textRun?.content) {
          textPieces.push(el.textRun.content);
        }
      }
    } else if (element.table?.tableRows) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells || []) {
          for (const content of cell.content || []) {
            traverse(content);
          }
        }
      }
    }
  };

  for (const element of docData.body.content) {
    traverse(element);
  }

  return textPieces.join('');
};

/**
 * Creates a brand new empty Google Doc
 */
export const createGoogleDoc = async (
  accessToken: string,
  title: string
): Promise<DocExportResult> => {
  const url = 'https://docs.googleapis.com/v1/documents';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Docs create error:', errText);
    throw new Error(`建立 Google 文件失敗 (${response.status})`);
  }

  const doc = await response.json();
  const documentId = doc.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    documentId,
    documentUrl,
    title: doc.title || title,
  };
};

/**
 * Sends batch update requests to Google Docs
 */
export const batchUpdateGoogleDoc = async (
  accessToken: string,
  documentId: string,
  requests: any[]
): Promise<any> => {
  if (!requests || requests.length === 0) return;

  const url = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Docs batchUpdate error:', errText);
    throw new Error(`更新 Google 文件內容失敗 (${response.status})`);
  }

  return await response.json();
};

/**
 * Exports an Activity Record directly to a beautifully formatted Google Doc
 */
export const exportActivityToGoogleDoc = async (
  accessToken: string,
  activity: ActivityForDocExport
): Promise<DocExportResult> => {
  const docTitle = `【成果佐證】${activity.date}_${activity.title}`;
  const created = await createGoogleDoc(accessToken, docTitle);

  const leadCadresText = activity.leadCadres && activity.leadCadres.length > 0
    ? activity.leadCadres.join('、')
    : '周汶蔚、幹部團隊';

  const objectivesText = activity.activityObjectives && activity.activityObjectives.length > 0
    ? activity.activityObjectives.join('、')
    : (activity.activityObjective || '弘揚人間佛教、促進青年交流、培育佛教青年人才');

  const photoList = activity.photos && activity.photos.length > 0
    ? activity.photos.map((p, idx) => `  [相片 ${idx + 1}] ${p.caption || '活動紀實'} (圖檔連結: ${p.url})`).join('\n')
    : '  暫無附件相片';

  // Build structured document content text
  const docBody = 
`國際佛光會中華佛光青年總團 ｜ 新竹青年分團
活動成效與佐證公文報告

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【基本資料一覽表】
・活動名稱：${activity.title}
・活動日期：${activity.date}
・活動時間：${activity.timeRange || '09:00 ~ 16:30'}
・活動地點：${activity.location}
・主辦單位：${activity.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}
・承辦單位：${activity.executingUnit || '新竹青年分團'}
・指導單位：${activity.guidingUnit || '佛光山法寶寺'}
・帶領幹部：${leadCadresText}
・活動性質：${activity.activityNature || '青年團活動'}
・核心類別：${activity.category || '生活禪與健走 / 專案活動'}
・出席人數：總計 ${activity.attendeeTotal || 0} 人（青年：${activity.attendeeYouth || 0} 人 ｜ 貴賓：${activity.attendeeGuests || 0} 人 ｜ 義工：${activity.attendeeVolunteers || 0} 人）
・標籤分類：${activity.tags && activity.tags.length > 0 ? activity.tags.join(', ') : '新竹青年分團, 法寶寺'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【壹、活動宗旨與目標】
${objectivesText}

【貳、活動內容與流程摘要】
${activity.summary || '全體青年齊聚參與，透過團練、座談與實作學習，落實三好四給精神。'}

【參、活動流程與詳細安排】
${activity.processSchedule || '09:00~09:30 報到相見歡\n09:30~12:00 主題實作與團練學習\n12:00~13:30 蔬食午齋與交流\n13:30~16:00 深度座談與實踐\n16:00~16:30 祈願祝禱與大合照'}

【肆、活動效益與成果亮點】
${activity.highlightsAndOutcomes || '1. 增進青年同儕情誼與團隊凝聚力。\n2. 將人間佛教佛法智慧落實於日常生活實踐。\n3. 出席率達標且大眾反響熱烈。'}

【伍、檢討改進與策進建議】
${activity.reviewAndSuggestions || '幹部溝通順暢，未來可進一步擴大宣傳範疇，引進更多校園與社區青年參與。'}

【陸、經費與備註說明】
${activity.budgetNotes || '經費由分團公款與常年會費支應，收支平衡。'}

【柒、活動紀實照片佐證】
${photoList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本報告由 國際佛光會新竹青年分團 數位系統自動生成
同步時間：${new Date().toLocaleString('zh-TW')}
`;

  // Insert the structured text at index 1
  await batchUpdateGoogleDoc(accessToken, created.documentId, [
    {
      insertText: {
        location: { index: 1 },
        text: docBody,
      },
    },
  ]);

  return created;
};

/**
 * Compiles multiple activities into a comprehensive Google Doc report
 */
export const exportMultipleActivitiesToGoogleDoc = async (
  accessToken: string,
  activities: ActivityForDocExport[],
  customTitle?: string
): Promise<DocExportResult> => {
  const docTitle = customTitle || `【優秀分團選拔佐證手冊】共${activities.length}項活動完整佐證_${new Date().toISOString().slice(0, 10)}`;
  const created = await createGoogleDoc(accessToken, docTitle);

  let fullContent = 
`國際佛光會中華佛光青年總團
優秀分團選拔活動佐證手冊（完整彙整版）
所屬分團：新竹青年分團 ｜ 輔導道場：佛光山法寶寺
產出時間：${new Date().toLocaleString('zh-TW')}
彙總活動數：共 ${activities.length} 項專案活動

================================================================================
目 錄 與 摘 要
================================================================================
${activities.map((a, i) => `${i + 1}. [${a.date}] ${a.title} (${a.category || '活動'}) - 出席 ${a.attendeeTotal || 0} 人`).join('\n')}

================================================================================
分 項 完 整 活 動 佐 證 詳 述
================================================================================

`;

  activities.forEach((act, index) => {
    fullContent += 
`--------------------------------------------------------------------------------
第 ${index + 1} 案：${act.title}
--------------------------------------------------------------------------------
・日期時間：${act.date} ${act.timeRange || ''}
・地點：${act.location}
・主辦/指導：${act.organizer || '新竹青年分團'} ｜ 指導：${act.guidingUnit || '法寶寺'}
・帶領幹部：${act.leadCadres ? act.leadCadres.join('、') : '周汶蔚'}
・出席人數：總計 ${act.attendeeTotal || 0} 人 (青年 ${act.attendeeYouth || 0} 人)
・活動宗旨：${act.activityObjective || '推廣人間佛教與青年全人發展'}

【活動摘要與流程】
${act.summary || '暫無摘要'}

【成果亮點與效益】
${act.highlightsAndOutcomes || '落實三好四給精神，提升青年生命素養。'}

【檢討與策進方向】
${act.reviewAndSuggestions || '圓滿達成活動目標。'}

`;
  });

  await batchUpdateGoogleDoc(accessToken, created.documentId, [
    {
      insertText: {
        location: { index: 1 },
        text: fullContent,
      },
    },
  ]);

  return created;
};
