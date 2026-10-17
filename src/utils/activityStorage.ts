import { ActivityRecordItem } from '../types';
import { INITIAL_ACTIVITIES } from '../data/mockActivities';
import { ProofDocumentData } from './proofHtmlGenerator';
import { 
  saveProofDocuments, 
  loadProofDocuments, 
  clearProofDocuments,
  saveActivitiesToIndexedDb,
  loadActivitiesFromIndexedDb,
  saveSlidesToIndexedDb,
  loadSlidesFromIndexedDb,
  normalizeProofDocuments,
  normalizeActivities,
  matchActivityYear,
  extractYearFromDateString,
  filterProofDocumentsByYear
} from '../services/indexedDbProofStorage';

export { 
  saveProofDocuments, 
  loadProofDocuments, 
  clearProofDocuments,
  saveActivitiesToIndexedDb,
  loadActivitiesFromIndexedDb,
  saveSlidesToIndexedDb,
  loadSlidesFromIndexedDb,
  normalizeProofDocuments,
  normalizeActivities,
  matchActivityYear,
  extractYearFromDateString,
  filterProofDocumentsByYear
};

const ACTIVITIES_STORAGE_KEY = 'blia_hsinchu_youth_activity_logs_v1';
const PROOF_DOCUMENTS_STORAGE_KEY = 'blia_hsinchu_youth_saved_proofs_v1';
const PROOF_DOCUMENTS_STORAGE_KEY_V2 = 'blia_hsinchu_youth_proof_docs_v2';

// In-memory memory cache for activities for synchronous compatibility
let inMemoryActivitiesCache: ActivityRecordItem[] | null = null;

// Preload activities from IndexedDB if available
if (typeof window !== 'undefined') {
  loadActivitiesFromIndexedDb()
    .then((acts) => {
      if (acts && acts.length > 0) {
        inMemoryActivitiesCache = acts;
      }
    })
    .catch((err) => {
      console.warn('預先自 IndexedDB 載入活動記錄快取異常:', err);
    });
}

export function getStoredActivities(): ActivityRecordItem[] {
  if (inMemoryActivitiesCache !== null) {
    return inMemoryActivitiesCache;
  }
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw === null) {
      inMemoryActivitiesCache = [];
      return [];
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeActivities(parsed);

    if (normalized.length === 0 && Array.isArray(parsed) && parsed.length === 0) {
      inMemoryActivitiesCache = [];
      return [];
    }

    inMemoryActivitiesCache = normalized;
    return normalized;
  } catch (err) {
    console.error('Failed to load activities from localStorage:', err);
    return inMemoryActivitiesCache || [];
  }
}

export function saveStoredActivities(activities: ActivityRecordItem[]): boolean {
  inMemoryActivitiesCache = activities;

  // 1. Always asynchronously backup to high-capacity IndexedDB (handles 100MB+ without quota issues)
  saveActivitiesToIndexedDb(activities).catch((idbErr) => {
    console.error('IndexedDB 活動備份失敗:', idbErr);
  });

  // 2. Try saving to localStorage (stripping oversized Base64 to prevent QuotaExceededError)
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
    window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: activities }));
    return true;
  } catch (err) {
    console.warn('活動記錄超過 localStorage 5MB 配額，自動啟動瘦身壓縮儲存並以 IndexedDB 為主要儲存:', err);
    try {
      const sanitized = activities.map(act => ({
        ...act,
        photos: act.photos.map(p => ({
          ...p,
          url: p.url.startsWith('data:') && p.url.length > 100000 
            ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80' 
            : p.url
        }))
      }));
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: activities }));
      return true;
    } catch (e) {
      console.warn('localStorage 已徹底滿載，僅保留最小活動索引，完整大檔案由 IndexedDB 安全託管。');
      try {
        // Keep minimal metadata index in localStorage to not crash synchronous callers
        const minimal = activities.map(act => ({
          ...act,
          photos: act.photos.map(p => ({
            id: p.id,
            caption: p.caption,
            url: p.url.startsWith('data:') ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80' : p.url
          }))
        }));
        localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(minimal.slice(0, 15)));
      } catch {}
      window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: activities }));
      return true;
    }
  }
}

// In-memory memory cache for synchronous compatibility
let inMemoryProofCache: ProofDocumentData[] = [];
let isProofCacheLoaded = false;

// Preload cache from IndexedDB as early as possible
if (typeof window !== 'undefined') {
  loadProofDocuments()
    .then((docs) => {
      inMemoryProofCache = docs;
      isProofCacheLoaded = true;
    })
    .catch((err) => {
      console.warn('預先自 IndexedDB 載入佐證快取時發生警告:', err);
    });
}

export function getStoredProofDocuments(): ProofDocumentData[] {
  if (isProofCacheLoaded && inMemoryProofCache.length > 0) {
    return normalizeProofDocuments(inMemoryProofCache);
  }
  try {
    const rawV1 = localStorage.getItem(PROOF_DOCUMENTS_STORAGE_KEY);
    const rawV2 = localStorage.getItem(PROOF_DOCUMENTS_STORAGE_KEY_V2);
    const raw = rawV1 || rawV2;
    if (!raw) return normalizeProofDocuments(inMemoryProofCache);
    
    const parsed = JSON.parse(raw);
    const normalized = normalizeProofDocuments(parsed);
    if (normalized.length > 0) {
      inMemoryProofCache = normalized;
      return normalized;
    }
    return normalizeProofDocuments(inMemoryProofCache);
  } catch (err) {
    console.error('Failed to load proof documents:', err);
    return normalizeProofDocuments(inMemoryProofCache);
  }
}

export async function getStoredProofDocumentsAsync(): Promise<ProofDocumentData[]> {
  try {
    const docs = await loadProofDocuments();
    const normalized = normalizeProofDocuments(docs);
    inMemoryProofCache = normalized;
    isProofCacheLoaded = true;
    return normalized;
  } catch (err) {
    console.error('非同步載入 IndexedDB 佐證資料失敗:', err);
    return getStoredProofDocuments();
  }
}

export function saveStoredProofDocuments(docs: ProofDocumentData[] | any): void {
  const normalized = normalizeProofDocuments(docs);
  inMemoryProofCache = normalized;
  isProofCacheLoaded = true;
  
  // Persist directly to high-capacity IndexedDB
  saveProofDocuments(normalized).catch(err => {
    console.error('儲存至 IndexedDB 失敗:', err);
  });

  // Notify listeners across modules
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blia_proofs_changed', { detail: normalized }));
  }
}

export async function saveStoredProofDocumentsAsync(docs: ProofDocumentData[] | any): Promise<void> {
  const normalized = normalizeProofDocuments(docs);
  inMemoryProofCache = normalized;
  isProofCacheLoaded = true;
  await saveProofDocuments(normalized);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blia_proofs_changed', { detail: normalized }));
  }
}

/**
 * Saves or updates a proof document and synchronizes it directly into the Activity Logs Archive (分團專案活動成果檔案庫).
 */
export function saveProofToArchives(proof: ProofDocumentData): ActivityRecordItem {
  const allActivities = getStoredActivities();
  const allProofs = getStoredProofDocuments();

  const proofId = proof.id || `act-proof-${Date.now()}`;
  const updatedProof: ProofDocumentData = {
    ...proof,
    id: proofId,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };

  // 1. Save to Proof Documents list via IndexedDB
  const existingProofIdx = allProofs.findIndex(p => p.id === proofId || (p.title === proof.title && p.date === proof.date));
  let newProofsList = [...allProofs];
  if (existingProofIdx >= 0) {
    newProofsList[existingProofIdx] = updatedProof;
  } else {
    newProofsList.unshift(updatedProof);
  }
  saveStoredProofDocuments(newProofsList);

  // 2. Synchronize to Activity Logs (分團專案活動成果檔案庫)
  const existingActIdx = allActivities.findIndex(a => a.id === proofId || (a.title === proof.title && a.date === proof.date));
  
  const total = Number(proof.totalCount) || ((Number(proof.internalCount) || 0) + (Number(proof.externalCount) || 0));
  const youthCount = Number(proof.internalCount) || Math.round(total * 0.75);
  const guestCount = Number(proof.externalCount) || (total - youthCount);

  const matchedActivity: ActivityRecordItem = existingActIdx >= 0 
    ? {
        ...allActivities[existingActIdx],
        title: proof.title || allActivities[existingActIdx].title,
        date: proof.date || allActivities[existingActIdx].date,
        location: proof.location || allActivities[existingActIdx].location,
        activityNature: proof.activityNature || allActivities[existingActIdx].activityNature || '總團活動',
        levelCategory: proof.levelCategory || allActivities[existingActIdx].levelCategory,
        natureCategory: proof.natureCategory || allActivities[existingActIdx].natureCategory,
        activityObjective: proof.activityObjective || allActivities[existingActIdx].activityObjective || '文化弘揚佛法',
        activityObjectives: proof.activityObjectives || (proof.activityObjective ? [proof.activityObjective] : allActivities[existingActIdx].activityObjectives || ['文化弘揚佛法']),
        summary: proof.summary || allActivities[existingActIdx].summary,
        attendeeTotal: total,
        attendeeYouth: youthCount,
        attendeeGuests: guestCount,
        photos: proof.photos.map((p, idx) => ({
          id: `p-${idx + 1}-${Date.now()}`,
          url: p.url,
          caption: p.caption
        })),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    : {
        id: proofId,
        title: proof.title || '新竹青年分團專案活動',
        category: '生活禪與健走',
        levelCategory: proof.levelCategory,
        natureCategory: proof.natureCategory,
        activityNature: proof.activityNature || '總團活動',
        activityObjective: proof.activityObjective || '文化弘揚佛法',
        activityObjectives: proof.activityObjectives || (proof.activityObjective ? [proof.activityObjective] : ['文化弘揚佛法']),
        date: proof.date || new Date().toISOString().slice(0, 10),
        timeRange: '09:00 ~ 16:30',
        location: proof.location || '佛光山法寶寺',
        organizer: '國際佛光會新竹青年分團',
        guidingUnit: '佛光山法寶寺',
        leadCadres: ['周汶蔚', '徐信銓'],
        attendeeTotal: total,
        attendeeYouth: youthCount,
        attendeeGuests: guestCount,
        attendeeVolunteers: 3,
        summary: proof.summary || '國際佛光會新竹青年分團專案活動紀錄。',
        processSchedule: '依照活動規範圓滿推動各項議程與心靈研習。',
        highlightsAndOutcomes: '分團幹部與青年齊心協力，圓滿達成活動目標與佛法弘揚之效益。',
        reviewAndSuggestions: '活動推行順利，已完整建立佐證資料與圖說紀錄。',
        status: 'completed',
        budgetNotes: '已完成經費核銷與成果彙整。',
        photos: proof.photos.map((p, idx) => ({
          id: `p-${idx + 1}-${Date.now()}`,
          url: p.url,
          caption: p.caption
        })),
        tags: ['新竹青年分團', '佐證資料表', proof.activityNature || '總團活動'],
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

  let newActivitiesList = [...allActivities];
  if (existingActIdx >= 0) {
    newActivitiesList[existingActIdx] = matchedActivity;
  } else {
    newActivitiesList.unshift(matchedActivity);
  }
  saveStoredActivities(newActivitiesList);

  return matchedActivity;
}

/**
 * Asynchronously saves or updates a proof document directly into native IndexedDB and Activity Logs.
 */
export async function saveProofToArchivesAsync(proof: ProofDocumentData): Promise<ActivityRecordItem> {
  const allActivities = getStoredActivities();
  const allProofs = await getStoredProofDocumentsAsync();

  const proofId = proof.id || `act-proof-${Date.now()}`;
  const updatedProof: ProofDocumentData = {
    ...proof,
    id: proofId,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };

  // 1. Save to Proof Documents list in IndexedDB
  const existingProofIdx = allProofs.findIndex(p => p.id === proofId || (p.title === proof.title && p.date === proof.date));
  let newProofsList = [...allProofs];
  if (existingProofIdx >= 0) {
    newProofsList[existingProofIdx] = updatedProof;
  } else {
    newProofsList.unshift(updatedProof);
  }
  await saveStoredProofDocumentsAsync(newProofsList);

  // 2. Synchronize to Activity Logs (分團專案活動成果檔案庫)
  const existingActIdx = allActivities.findIndex(a => a.id === proofId || (a.title === proof.title && a.date === proof.date));
  
  const total = Number(proof.totalCount) || ((Number(proof.internalCount) || 0) + (Number(proof.externalCount) || 0));
  const youthCount = Number(proof.internalCount) || Math.round(total * 0.75);
  const guestCount = Number(proof.externalCount) || (total - youthCount);

  const matchedActivity: ActivityRecordItem = existingActIdx >= 0 
    ? {
        ...allActivities[existingActIdx],
        title: proof.title || allActivities[existingActIdx].title,
        date: proof.date || allActivities[existingActIdx].date,
        location: proof.location || allActivities[existingActIdx].location,
        activityNature: proof.activityNature || allActivities[existingActIdx].activityNature || '總團活動',
        levelCategory: proof.levelCategory || allActivities[existingActIdx].levelCategory,
        natureCategory: proof.natureCategory || allActivities[existingActIdx].natureCategory,
        activityObjective: proof.activityObjective || allActivities[existingActIdx].activityObjective || '文化弘揚佛法',
        activityObjectives: proof.activityObjectives || (proof.activityObjective ? [proof.activityObjective] : allActivities[existingActIdx].activityObjectives || ['文化弘揚佛法']),
        summary: proof.summary || allActivities[existingActIdx].summary,
        attendeeTotal: total,
        attendeeYouth: youthCount,
        attendeeGuests: guestCount,
        photos: proof.photos.map((p, idx) => ({
          id: `p-${idx + 1}-${Date.now()}`,
          url: p.url,
          caption: p.caption
        })),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    : {
        id: proofId,
        title: proof.title || '新竹青年分團專案活動',
        category: '生活禪與健走',
        levelCategory: proof.levelCategory,
        natureCategory: proof.natureCategory,
        activityNature: proof.activityNature || '總團活動',
        activityObjective: proof.activityObjective || '文化弘揚佛法',
        activityObjectives: proof.activityObjectives || (proof.activityObjective ? [proof.activityObjective] : ['文化弘揚佛法']),
        date: proof.date || new Date().toISOString().slice(0, 10),
        timeRange: proof.timeRange || '09:00 ~ 16:30',
        location: proof.location || '佛光山法寶寺',
        organizer: proof.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團',
        guidingUnit: proof.guidingUnit || '佛光山法寶寺',
        leadCadres: [proof.reporterName || '新竹分團幹部'],
        attendeeTotal: total,
        attendeeYouth: youthCount,
        attendeeGuests: guestCount,
        attendeeVolunteers: 3,
        summary: proof.summary || '活動成果圓滿，落實三好四給精神。',
        processSchedule: '依照活動規範圓滿推動各項議程與心靈研習。',
        highlightsAndOutcomes: '分團幹部與青年齊心協力，圓滿達成活動目標與佛法弘揚之效益。',
        reviewAndSuggestions: '活動推行順利，已完整建立佐證資料與圖說紀錄。',
        status: 'completed',
        budgetNotes: '已完成經費核銷與成果彙整。',
        photos: proof.photos.map((p, idx) => ({
          id: `p-${idx + 1}-${Date.now()}`,
          url: p.url,
          caption: p.caption
        })),
        tags: ['新竹青年分團', '佐證資料表', proof.activityNature || '總團活動'],
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

  let newActivitiesList = [...allActivities];
  if (existingActIdx >= 0) {
    newActivitiesList[existingActIdx] = matchedActivity;
  } else {
    newActivitiesList.unshift(matchedActivity);
  }
  saveStoredActivities(newActivitiesList);

  return matchedActivity;
}

export function clearAllStoredActivities(): ActivityRecordItem[] {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem(PROOF_DOCUMENTS_STORAGE_KEY);
    // Asynchronously clear IndexedDB high-capacity binary documents
    clearProofDocuments().catch(err => {
      console.error('清空 IndexedDB 佐證資料庫時發生異常:', err);
    });
    window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: [] }));
    return [];
  } catch (err) {
    console.error('Failed to clear all activities:', err);
    return [];
  }
}

export function deleteStoredActivitiesByIds(idsToDelete: string[]): ActivityRecordItem[] {
  try {
    const current = getStoredActivities();
    const idSet = new Set(idsToDelete);
    const updated = current.filter(a => !idSet.has(a.id));
    saveStoredActivities(updated);
    return updated;
  } catch (err) {
    console.error('Failed to delete activities by ids:', err);
    return getStoredActivities();
  }
}

export function resetStoredActivities(): ActivityRecordItem[] {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify([]));
    inMemoryActivitiesCache = [];
    saveActivitiesToIndexedDb([]).catch(() => {});
    window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: [] }));
    return [];
  } catch (err) {
    console.error('Failed to reset activities to empty:', err);
    inMemoryActivitiesCache = [];
    return [];
  }
}

/**
 * 手動載入示範活動資料（僅供使用者主動點擊載入範本時調用，絕不在系統啟動或為空時自動載入）
 */
export function loadSampleActivities(): ActivityRecordItem[] {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
    inMemoryActivitiesCache = [...INITIAL_ACTIVITIES];
    saveActivitiesToIndexedDb(INITIAL_ACTIVITIES).catch(() => {});
    window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: INITIAL_ACTIVITIES }));
    return [...INITIAL_ACTIVITIES];
  } catch (err) {
    console.error('Failed to load sample activities:', err);
    return [];
  }
}

export function exportActivitiesToCSV(activities: ActivityRecordItem[]): void {
  const headers = [
    '活動編號',
    '活動名稱',
    '活動類別',
    '活動日期',
    '活動時間',
    '活動地點',
    '主辦單位',
    '指導單位',
    '帶領幹部',
    '出席總人數',
    '青年人數',
    '法師貴賓人數',
    '義工人數',
    '活動主旨',
    '流程紀要',
    '活動成效與亮點',
    '檢討與後續建議',
    '狀態',
    '經費備註'
  ];

  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = activities.map((a) => [
    escapeCSV(a.id),
    escapeCSV(a.title),
    escapeCSV(a.category),
    escapeCSV(a.date),
    escapeCSV(a.timeRange),
    escapeCSV(a.location),
    escapeCSV(a.organizer),
    escapeCSV(a.guidingUnit),
    escapeCSV(a.leadCadres.join('、')),
    escapeCSV(a.attendeeTotal),
    escapeCSV(a.attendeeYouth),
    escapeCSV(a.attendeeGuests),
    escapeCSV(a.attendeeVolunteers),
    escapeCSV(a.summary),
    escapeCSV(a.processSchedule),
    escapeCSV(a.highlightsAndOutcomes),
    escapeCSV(a.reviewAndSuggestions),
    escapeCSV(a.status === 'completed' ? '已圓滿' : a.status === 'upcoming' ? '籌備中' : '年度精選'),
    escapeCSV(a.budgetNotes || '')
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `國際佛光會新竹青年分團_活動紀錄總表_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function convertActivityToProofDocument(act: ActivityRecordItem): ProofDocumentData {
  // Try to find if a saved proof document already exists for this activity
  const proofs = getStoredProofDocuments();
  const existing = proofs.find(p => p.id === act.id || (p.title === act.title && p.date === act.date));
  if (existing) {
    return existing;
  }

  const total = act.attendeeTotal || (act.attendeeYouth + act.attendeeGuests) || 30;
  const expected = Math.max(30, Math.round(total * 0.9));
  const rate = `${Math.round((total / expected) * 100)}% (${total >= expected ? '超額出席' : '良好'})`;

  return {
    id: act.id,
    title: act.title,
    date: act.date,
    timeRange: act.timeRange || '09:00 - 16:30',
    location: act.location || '佛光山法寶寺',
    activityNature: act.activityNature || '總團活動',
    activityObjective: act.activityObjective || '以文化弘揚佛法 / 以教育培養人才',
    activityObjectives: act.activityObjectives || (act.activityObjective ? [act.activityObjective] : ['以文化弘揚佛法 / 以教育培養人才']),
    organizer: act.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團',
    executingUnit: act.executingUnit || '新竹青年分團',
    guidingUnit: act.guidingUnit || '佛光山法寶寺',
    targetAudience: '佛光青年、幹部及對佛法有興趣之大眾',
    internalCount: act.attendeeYouth || 0,
    externalCount: act.attendeeGuests || 0,
    totalCount: total,
    expectedCount: expected,
    attendanceRate: rate,
    summary: act.summary || '國際佛光會新竹青年分團專案活動紀錄。',
    highlights: act.highlightsAndOutcomes ? [
      act.highlightsAndOutcomes,
      '【分組實戰與個案演練】：青年學員攜帶實際專案分工演練，團隊成員熱烈探討互助共學。',
      '【即時成果發表與回饋】：各組輪流上台發表亮點心得，輔導法師與長官逐一講評指導。',
      '【跨界交流與情誼凝聚】：建立青年聯絡網與同儕互助社群，凝聚佛光團隊向心力。'
    ] : [
      '【名師引領與政策方針】：邀請法師及資深講師開示核心主題，深化信仰實踐。',
      '【分組實戰與個案演練】：團隊成員熱烈探討互助共學。',
      '【即時成果發表與回饋】：亮點發表與講師逐一指導。',
      '【跨界交流與情誼凝聚】：凝聚佛光團隊向心力。'
    ],
    suggestions: act.reviewAndSuggestions ? [
      act.reviewAndSuggestions,
      '【設備資源配置】：現場即時記錄，後續將加強事前線路測試與備援。',
      '【回流追蹤機制】：活動結束後安排線上幹部複盤與後續追蹤。'
    ] : [
      '【時間配置優化】：實作與分組討論熱烈，未來多預留交流研討時間。',
      '【設備資源配置】：加強事前線路測試與備援。',
      '【回流追蹤機制】：活動結束後安排線上幹部複盤。'
    ],
    quantitativeMetrics: [
      { id: 'm1', name: '實到出席人數', value: `${total} 人`, benchmark: `預期 ${expected} 人（達成率 ${rate}）` },
      { id: 'm2', name: '青年幹部承擔率', value: '100%', benchmark: `${act.attendeeYouth} 位青年全員投入` },
      { id: 'm3', name: '活動整體滿意度', value: '98%', benchmark: '目標 ≥ 90%' }
    ],
    participantFeedback: '青年普遍回饋活動內容緊湊扎實，特別是在實務演練與信仰融入生活的引導上收穫良多。',
    vipFeedback: '輔導法師致詞表示：「看到青年充滿朝氣活力、主動發心承擔，把三好四給精神落實在每一個細節，令人十分讚歎。」',
    extendedBenefits: '持續擴散青年弘法與社會服務實踐成效。',
    reporterName: '專案秘書 周汶蔚',
    reportDate: act.date ? act.date.replace(/-/g, '/') : '2026/08/20',
    photos: act.photos.map(p => ({
      url: p.url,
      caption: p.caption || '活動現場實況紀錄'
    }))
  };
}

