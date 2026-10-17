/**
 * IndexedDB Storage Service for High-Capacity Proof Documents & Binary Assets
 * Database: blia_hsinchu_youth_db
 * Version: 2
 * Object Stores:
 *   - proof_documents (keyPath: 'id')
 *   - activities (keyPath: 'id')
 *   - slides (keyPath: 'id')
 */

import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { ActivityRecordItem, Slide } from '../types';

const DB_NAME = 'blia_hsinchu_youth_db';
const DB_VERSION = 2;
const STORE_NAME = 'proof_documents';
const ACTIVITIES_STORE_NAME = 'activities';
const SLIDES_STORE_NAME = 'slides';
const LEGACY_STORAGE_KEY = 'blia_hsinchu_youth_saved_proofs_v1';
const PROOF_DOCUMENTS_STORAGE_KEY = 'blia_hsinchu_youth_proof_docs_v2';

/**
 * Extracts a 4-digit Gregorian year string from various date formats:
 * - '2026-08-20' -> '2026'
 * - '2026/08/20' -> '2026'
 * - '2026年08月20日' -> '2026'
 * - '民國115年08月20日' -> '2026'
 * - '115/08/20' -> '2026'
 */
export function extractYearFromDateString(dateStr?: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  
  // 1. Direct 4-digit Gregorian year match (e.g. 2026, 2025, 1999)
  const match = trimmed.match(/(?:19|20)\d{2}/);
  if (match) return match[0];
  
  // 2. ROC Year match: 民國115年 / 115年
  const rocMatch = trimmed.match(/(?:民國)?\s*(1\d{2})\s*年/);
  if (rocMatch) {
    const rocYear = parseInt(rocMatch[1], 10);
    return (rocYear + 1911).toString();
  }

  // 3. Slash format for ROC: 115/08/20
  const rocSlashMatch = trimmed.match(/^(\d{2,3})[/-]\d{1,2}[/-]\d{1,2}/);
  if (rocSlashMatch) {
    const val = parseInt(rocSlashMatch[1], 10);
    if (val > 100 && val < 200) {
      return (val + 1911).toString();
    }
  }

  return null;
}

/**
 * Robust check if an item belongs to a target year.
 * Handles 'all', explicit year attributes, date strings, or year substrings.
 */
export function matchActivityYear(
  item: { date?: string; year?: string; updatedAt?: string }, 
  targetYear: string | 'all'
): boolean {
  if (!targetYear || targetYear === 'all') return true;
  if (item.year && String(item.year) === targetYear) return true;
  if (!item.date) {
    if (item.updatedAt) {
      const yearFromUpdated = extractYearFromDateString(item.updatedAt);
      if (yearFromUpdated === targetYear) return true;
    }
    return false;
  }

  const extracted = extractYearFromDateString(item.date);
  if (extracted) {
    return extracted === targetYear;
  }
  return item.date.includes(targetYear);
}

/**
 * Normalizes and flattens any input data into a clean ProofDocumentData[] array.
 * Solves Schema Mismatch when data is stored as:
 * - Flat array: ProofDocumentData[]
 * - Year-keyed object: { "2026": [...], "2025": [...] }
 * - Wrapped objects: [{ year: '2026', documents: [...] }, ...]
 * - Object dictionaries: { [id: string]: ProofDocumentData }
 */
export function normalizeProofDocuments(rawData: any): ProofDocumentData[] {
  if (!rawData) return [];
  const results: ProofDocumentData[] = [];

  const extractItem = (item: any) => {
    if (!item || typeof item !== 'object') return;

    // Direct ProofDocumentData signature: has title or (date & location) or photos
    if (
      item.title !== undefined ||
      (Array.isArray(item.photos) && item.photos.length > 0) ||
      (item.date && item.location) ||
      item.summary !== undefined
    ) {
      const normalizedDoc: ProofDocumentData = {
        ...item,
        id: item.id || `proof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.title || item.activityName || '未命名活動佐證',
        date: item.date || item.activityDate || '',
        location: item.location || '佛光山法寶寺',
        internalCount: item.internalCount ?? item.youthCount ?? 0,
        externalCount: item.externalCount ?? item.generalCount ?? 0,
        totalCount: item.totalCount ?? ((Number(item.internalCount) || 0) + (Number(item.externalCount) || 0)),
        summary: item.summary || item.description || '',
        photos: Array.isArray(item.photos)
          ? item.photos.map((p: any) => typeof p === 'string' ? { url: p, caption: '' } : { url: p.url || '', caption: p.caption || '' })
          : []
      };
      results.push(normalizedDoc);
      return;
    }

    // Unpack known nested container properties
    if (Array.isArray(item.documents)) {
      item.documents.forEach(extractItem);
      return;
    }
    if (Array.isArray(item.proofs)) {
      item.proofs.forEach(extractItem);
      return;
    }
    if (Array.isArray(item.items)) {
      item.items.forEach(extractItem);
      return;
    }
    if (Array.isArray(item.data)) {
      item.data.forEach(extractItem);
      return;
    }

    // Otherwise, iterate over all key-values (e.g. year keys { '2026': [...], '2025': [...] })
    const values = Object.values(item);
    for (const val of values) {
      if (Array.isArray(val)) {
        val.forEach(extractItem);
      } else if (val && typeof val === 'object') {
        extractItem(val);
      }
    }
  };

  if (Array.isArray(rawData)) {
    rawData.forEach(extractItem);
  } else if (typeof rawData === 'object') {
    extractItem(rawData);
  }

  // Deduplicate by ID and (title + date)
  const seenIds = new Set<string>();
  const deduplicated: ProofDocumentData[] = [];
  for (const doc of results) {
    const uniqueKey = doc.id || `${doc.title}_${doc.date}`;
    if (!seenIds.has(uniqueKey)) {
      seenIds.add(uniqueKey);
      deduplicated.push(doc);
    }
  }

  return deduplicated;
}

/**
 * Filters ProofDocumentData array by target year with full fallback support.
 */
export function filterProofDocumentsByYear(
  docs: ProofDocumentData[], 
  year: string | 'all'
): ProofDocumentData[] {
  if (!year || year === 'all') return docs;
  return docs.filter(doc => matchActivityYear(doc, year));
}

/**
 * Normalizes and flattens any activity records input data into a clean ActivityRecordItem[] array.
 */
export function normalizeActivities(rawData: any): ActivityRecordItem[] {
  if (!rawData) return [];
  const results: ActivityRecordItem[] = [];

  const extractItem = (item: any) => {
    if (!item || typeof item !== 'object') return;

    if (item.title || item.activityName) {
      const act: ActivityRecordItem = {
        id: item.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.title || item.activityName || '未命名活動',
        date: item.date || item.activityDate || '',
        timeRange: item.timeRange || '09:00 ~ 16:30',
        location: item.location || '佛光山法寶寺',
        organizer: item.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團',
        executingUnit: item.executingUnit || '新竹青年分團',
        guidingUnit: item.guidingUnit || '佛光山法寶寺',
        category: item.category || '文化弘法',
        activityNature: item.activityNature || '總團活動',
        activityObjective: item.activityObjective || '文化弘揚佛法',
        activityObjectives: item.activityObjectives || (item.activityObjective ? [item.activityObjective] : []),
        leadCadres: Array.isArray(item.leadCadres) ? item.leadCadres : [],
        attendeeYouth: item.attendeeYouth ?? item.youthCount ?? 0,
        attendeeGuests: item.attendeeGuests ?? item.generalCount ?? 0,
        attendeeVolunteers: item.attendeeVolunteers ?? 0,
        attendeeTotal: item.attendeeTotal ?? ((Number(item.attendeeYouth ?? item.youthCount ?? 0)) + (Number(item.attendeeGuests ?? item.generalCount ?? 0))),
        status: item.status || 'completed',
        summary: item.summary || item.description || '',
        processSchedule: item.processSchedule || '',
        highlightsAndOutcomes: item.highlightsAndOutcomes || '',
        reviewAndSuggestions: item.reviewAndSuggestions || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        photos: Array.isArray(item.photos)
          ? item.photos.map((p: any, pIdx: number) => ({
              id: p.id || `p-${pIdx}`,
              url: typeof p === 'string' ? p : (p.url || ''),
              caption: typeof p === 'string' ? '' : (p.caption || '')
            }))
          : [],
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      };
      results.push(act);
      return;
    }

    if (Array.isArray(item.activities)) {
      item.activities.forEach(extractItem);
      return;
    }
    if (Array.isArray(item.items)) {
      item.items.forEach(extractItem);
      return;
    }
    if (Array.isArray(item.data)) {
      item.data.forEach(extractItem);
      return;
    }

    const values = Object.values(item);
    for (const val of values) {
      if (Array.isArray(val)) {
        val.forEach(extractItem);
      } else if (val && typeof val === 'object') {
        extractItem(val);
      }
    }
  };

  if (Array.isArray(rawData)) {
    rawData.forEach(extractItem);
  } else if (typeof rawData === 'object') {
    extractItem(rawData);
  }

  const seenIds = new Set<string>();
  const deduplicated: ActivityRecordItem[] = [];
  for (const act of results) {
    const uniqueKey = act.id || `${act.title}_${act.date}`;
    if (!seenIds.has(uniqueKey)) {
      seenIds.add(uniqueKey);
      deduplicated.push(act);
    }
  }

  return deduplicated;
}

/**
 * Opens or initializes the native IndexedDB database instance.
 */
export function openProofDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('當前環境不支援 IndexedDB 原生資料庫'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ACTIVITIES_STORE_NAME)) {
        db.createObjectStore(ACTIVITIES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SLIDES_STORE_NAME)) {
        db.createObjectStore(SLIDES_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB 開啟失敗:', error);
      reject(error || new Error('無法開啟 IndexedDB 資料庫'));
    };
  });
}

/**
 * Migrates legacy localStorage data to IndexedDB if present.
 */
async function migrateLegacyLocalStorageIfPresent(db: IDBDatabase): Promise<ProofDocumentData[]> {
  try {
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const rawV2 = localStorage.getItem(PROOF_DOCUMENTS_STORAGE_KEY);
    const raw = rawLegacy || rawV2;
    if (!raw) return [];
    
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    const normalized = normalizeProofDocuments(parsed);
    if (normalized.length === 0) return [];

    console.info(`檢測到舊版 localStorage 佐證資料 (${normalized.length} 筆)，正在無縫平鋪遷移至 IndexedDB...`);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const item of normalized) {
      store.put(item);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    // Successfully migrated -> remove legacy key to free 5MB quota
    if (rawLegacy) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    console.info('舊版 localStorage 佐證資料已全數遷移至 IndexedDB，並已清空釋放空間。');
    return normalized;
  } catch (err) {
    console.warn('舊版佐證資料遷移過程發生警告:', err);
    return [];
  }
}

/**
 * Saves or updates proof document(s) into IndexedDB.
 * Supports passing an array of documents, a year-keyed object, or a single document.
 * Automatically flattens and normalizes all inputs to ensure flat ProofDocumentData[] storage.
 */
export async function saveProofDocuments(data: ProofDocumentData[] | ProofDocumentData | any): Promise<void> {
  const db = await openProofDatabase();
  const normalizedDocs = normalizeProofDocuments(data);

  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const doc of normalizedDocs) {
        store.put(doc);
      }

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        console.error('儲存至 IndexedDB 失敗:', tx.error);
        reject(tx.error || new Error('寫入 IndexedDB 失敗'));
      };

      tx.onabort = () => {
        console.error('IndexedDB 事務被中斷:', tx.error);
        reject(tx.error || new Error('IndexedDB 事務中斷'));
      };
    } catch (err) {
      console.error('saveProofDocuments 執行異常:', err);
      reject(err);
    }
  });
}

/**
 * Loads all proof documents from IndexedDB.
 * Automatically checks and triggers legacy migration on initial fetch.
 * Guarantees a flat ProofDocumentData[] return even if previously stored as year-keyed objects.
 */
export async function loadProofDocuments(): Promise<ProofDocumentData[]> {
  const db = await openProofDatabase();

  return new Promise<ProofDocumentData[]>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const rawResults = (request.result || []) as any[];
        let results = normalizeProofDocuments(rawResults);

        // If IndexedDB is empty, check if legacy localStorage exists for migration
        if (results.length === 0) {
          const migrated = await migrateLegacyLocalStorageIfPresent(db);
          if (migrated.length > 0) {
            results = migrated;
          }
        } else if (rawResults.some(r => !r.title && (r['2026'] || r['2025'] || r.documents || r.proofs))) {
          // If we detected legacy nested objects in the DB store, rewrite with cleanly normalized items
          try {
            const cleanTx = db.transaction(STORE_NAME, 'readwrite');
            const cleanStore = cleanTx.objectStore(STORE_NAME);
            cleanStore.clear();
            for (const doc of results) {
              cleanStore.put(doc);
            }
          } catch (cleanErr) {
            console.warn('自動校準 IndexedDB 巢狀佐證資料時發生警告:', cleanErr);
          }
        }

        resolve(results);
      };

      request.onerror = () => {
        console.error('自 IndexedDB 讀取佐證資料失敗:', request.error);
        reject(request.error || new Error('讀取 IndexedDB 失敗'));
      };
    } catch (err) {
      console.error('loadProofDocuments 執行異常:', err);
      reject(err);
    }
  });
}

/**
 * Clears all proof documents stored in IndexedDB.
 */
export async function clearProofDocuments(): Promise<void> {
  const db = await openProofDatabase();

  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        // Also clear legacy key if still present
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {}
        resolve();
      };

      request.onerror = () => {
        console.error('清空 IndexedDB 失敗:', request.error);
        reject(request.error || new Error('清空 IndexedDB 失敗'));
      };
    } catch (err) {
      console.error('clearProofDocuments 執行異常:', err);
      reject(err);
    }
  });
}

/**
 * Saves all activities into IndexedDB.
 */
export async function saveActivitiesToIndexedDb(activities: ActivityRecordItem[] | any): Promise<void> {
  const db = await openProofDatabase();
  const normalized = normalizeActivities(activities);
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(ACTIVITIES_STORE_NAME, 'readwrite');
      const store = tx.objectStore(ACTIVITIES_STORE_NAME);
      store.clear();
      for (const act of normalized) {
        store.put(act);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('儲存活動記錄至 IndexedDB 失敗:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      console.error('saveActivitiesToIndexedDb 異常:', err);
      reject(err);
    }
  });
}

/**
 * Loads all activities from IndexedDB.
 */
export async function loadActivitiesFromIndexedDb(): Promise<ActivityRecordItem[]> {
  const db = await openProofDatabase();
  return new Promise<ActivityRecordItem[]>((resolve, reject) => {
    try {
      const tx = db.transaction(ACTIVITIES_STORE_NAME, 'readonly');
      const store = tx.objectStore(ACTIVITIES_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const raw = request.result || [];
        resolve(normalizeActivities(raw));
      };
      request.onerror = () => {
        console.error('從 IndexedDB 載入活動記錄失敗:', request.error);
        reject(request.error);
      };
    } catch (err) {
      console.error('loadActivitiesFromIndexedDb 異常:', err);
      reject(err);
    }
  });
}

/**
 * Saves all slides into IndexedDB.
 */
export async function saveSlidesToIndexedDb(slides: Slide[]): Promise<void> {
  const db = await openProofDatabase();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(SLIDES_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SLIDES_STORE_NAME);
      store.clear();
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (!slide.id) {
          slide.id = `slide-${Date.now()}-${i}`;
        }
        store.put(slide);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('儲存簡報投影片至 IndexedDB 失敗:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      console.error('saveSlidesToIndexedDb 異常:', err);
      reject(err);
    }
  });
}

/**
 * Loads all slides from IndexedDB.
 */
export async function loadSlidesFromIndexedDb(): Promise<Slide[]> {
  const db = await openProofDatabase();
  return new Promise<Slide[]>((resolve, reject) => {
    try {
      const tx = db.transaction(SLIDES_STORE_NAME, 'readonly');
      const store = tx.objectStore(SLIDES_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve((request.result || []) as Slide[]);
      };
      request.onerror = () => {
        console.error('從 IndexedDB 載入簡報投影片失敗:', request.error);
        reject(request.error);
      };
    } catch (err) {
      console.error('loadSlidesFromIndexedDb 異常:', err);
      reject(err);
    }
  });
}
