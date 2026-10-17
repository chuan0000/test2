/**
 * Project Backup & Restore Service
 * Handles full JSON backup export & restore for:
 * 1. High-Capacity IndexedDB Proof Documents (with embedded photos)
 * 2. LocalStorage Activity Summaries & Metadata
 * 3. App Configuration (Organization, currentYear, etc.)
 */

import { AppConfig, ActivityRecordItem } from '../types';
import { getStoredAppConfig, saveStoredAppConfig } from './projectPersistence';
import { 
  getStoredActivities, 
  saveStoredActivities 
} from '../utils/activityStorage';
import { 
  loadProofDocuments, 
  saveProofDocuments, 
  clearProofDocuments,
  normalizeProofDocuments,
  normalizeActivities
} from './indexedDbProofStorage';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { getStoredUiTexts, saveStoredUiTexts, UiTextMap } from '../contexts/UiTextContext';

export interface FullProjectBackup {
  version: string;
  exportedAt: string;
  appConfig: AppConfig;
  activitiesSummary: ActivityRecordItem[];
  proofDocuments: ProofDocumentData[];
  customUiTexts?: UiTextMap;
  siteContent?: UiTextMap;
  metadata?: {
    totalActivities: number;
    totalProofs: number;
    exportedBy?: string;
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  errorMessage?: string;
  data?: FullProjectBackup;
  summary?: {
    version: string;
    exportedAt: string;
    totalActivities: number;
    totalProofs: number;
    organizationName: string;
    currentYear: string;
  };
}

/**
 * 1. Export entire database (IndexedDB + LocalStorage) into a downloadable JSON file
 */
export async function exportProjectBackup(customConfig?: AppConfig): Promise<void> {
  const cfg = customConfig || getStoredAppConfig();
  const activities = getStoredActivities();
  
  // Fetch high-capacity proof documents from IndexedDB
  const proofDocuments = await loadProofDocuments();
  const customTexts = getStoredUiTexts();

  const backupData: FullProjectBackup = {
    version: '2.5.0',
    exportedAt: new Date().toISOString(),
    appConfig: cfg,
    activitiesSummary: activities,
    proofDocuments: proofDocuments,
    customUiTexts: customTexts,
    siteContent: customTexts,
    metadata: {
      totalActivities: activities.length,
      totalProofs: proofDocuments.length,
      exportedBy: cfg.subUnitName || cfg.organizationName
    }
  };

  let jsonString: string;
  try {
    jsonString = JSON.stringify(backupData, null, 2);
  } catch (err) {
    console.warn('exportProjectBackup JSON.stringify 超出字串長度，啟用自動瘦身保護:', err);
    try {
      const slimmedData = {
        ...backupData,
        activitiesSummary: (backupData.activitiesSummary || []).map(act => ({
          ...act,
          photos: (act.photos || []).map(p => ({
            ...p,
            url: p.url && p.url.startsWith('data:') && p.url.length > 50000 
              ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80' 
              : p.url
          }))
        })),
        proofDocuments: (backupData.proofDocuments || []).map(doc => ({
          ...doc,
          photos: (doc.photos || []).map(p => ({
            ...p,
            url: p.url && p.url.startsWith('data:') && p.url.length > 50000 
              ? 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80' 
              : p.url
          }))
        }))
      };
      jsonString = JSON.stringify(slimmedData, null, 2);
    } catch {
      jsonString = JSON.stringify(backupData, (k, v) => {
        if (typeof v === 'string' && v.startsWith('data:image') && v.length > 30000) {
          return 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';
        }
        return v;
      }, 2);
    }
  }

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Format date: YYYYMMDD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const yearTag = cfg.currentYear || `${yyyy}`;
  const fileName = `新竹青年分團成果資料庫備份_${yearTag}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Validate parsed JSON content for schema correctness & security
 */
export function validateBackupFile(jsonString: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, errorMessage: '無效的 JSON 檔案格式。' };
    }

    // Check essential fields with schema tolerance & automatic normalization
    const normalizedProofs = normalizeProofDocuments(parsed.proofDocuments);
    const normalizedActivities = normalizeActivities(parsed.activitiesSummary);

    if (normalizedProofs.length === 0 && Array.isArray(parsed.proofDocuments) && parsed.proofDocuments.length === 0) {
      // Empty array is valid
    } else if (normalizedProofs.length === 0 && !parsed.proofDocuments) {
      return { isValid: false, errorMessage: '備份檔缺少 proofDocuments (佐證資料庫) 內容。' };
    }

    if (normalizedActivities.length === 0 && Array.isArray(parsed.activitiesSummary) && parsed.activitiesSummary.length === 0) {
      // Empty array is valid
    } else if (normalizedActivities.length === 0 && !parsed.activitiesSummary) {
      return { isValid: false, errorMessage: '備份檔缺少 activitiesSummary (活動索引) 內容。' };
    }

    parsed.proofDocuments = normalizedProofs;
    parsed.activitiesSummary = normalizedActivities;

    const cfg = parsed.appConfig || {};

    return {
      isValid: true,
      data: parsed as FullProjectBackup,
      summary: {
        version: parsed.version || '未知版本',
        exportedAt: parsed.exportedAt || '未知時間',
        totalActivities: normalizedActivities.length,
        totalProofs: normalizedProofs.length,
        organizationName: cfg.organizationName || '佛光青年分團',
        currentYear: cfg.currentYear || '2026'
      }
    };
  } catch (err: any) {
    return {
      isValid: false,
      errorMessage: `JSON 解析失敗：${err?.message || '檔案可能已損毀'}`
    };
  }
}

/**
 * 3. Restore project backup: Clears existing IndexedDB & LocalStorage, then writes fresh data
 */
export async function restoreProjectBackup(backupData: FullProjectBackup): Promise<{
  success: boolean;
  restoredActivitiesCount: number;
  restoredProofsCount: number;
}> {
  try {
    // 1. Wipe existing IndexedDB proof store
    await clearProofDocuments();

    // 2. Write new proof documents into IndexedDB
    if (backupData.proofDocuments && backupData.proofDocuments.length > 0) {
      await saveProofDocuments(backupData.proofDocuments);
    }

    // 3. Write activities to LocalStorage
    if (Array.isArray(backupData.activitiesSummary)) {
      saveStoredActivities(backupData.activitiesSummary);
    }

    // 4. Update AppConfig if present
    if (backupData.appConfig) {
      saveStoredAppConfig(backupData.appConfig);
    }

    // 4.1 Update customUiTexts / siteContent if present
    const incomingTexts = backupData.siteContent || backupData.customUiTexts;
    if (incomingTexts && typeof incomingTexts === 'object') {
      saveStoredUiTexts(incomingTexts);
    }

    // 5. Trigger global notification event
    window.dispatchEvent(new CustomEvent('blia_project_restored', { detail: backupData }));
    window.dispatchEvent(new CustomEvent('blia_activities_changed', { detail: backupData.activitiesSummary }));

    return {
      success: true,
      restoredActivitiesCount: backupData.activitiesSummary?.length || 0,
      restoredProofsCount: backupData.proofDocuments?.length || 0
    };
  } catch (err) {
    console.error('執行專案備份還原失敗:', err);
    throw err;
  }
}
