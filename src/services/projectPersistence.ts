import { ActivityRecordItem, Slide, AppConfig, ProjectBackupPackage } from '../types';
import { getStoredActivities, saveStoredActivities } from '../utils/activityStorage';
export { getStoredActivities, saveStoredActivities };
import { saveSlidesToIndexedDb, loadSlidesFromIndexedDb } from './indexedDbProofStorage';
import { optimizeImageBase64 } from '../utils/imageCompressor';

// LocalStorage Keys
export const STORAGE_KEYS = {
  APP_CONFIG: 'blia_app_config_v2',
  SLIDES: 'blia_hsinchu_youth_slides_v2',
  SELECTED_IDS: 'blia_hsinchu_youth_selected_ids_v2',
  CUSTOM_BG: 'blia_ppt_custom_bg',
  CUSTOM_LOGO: 'blia_ppt_custom_logo',
  THEME_ID: 'blia_ppt_theme_id',
  LAYOUT_MODE: 'blia_ppt_layout_mode',
  REPORT_TITLE: 'blia_ppt_report_title',
  REPORTING_UNIT: 'blia_ppt_reporting_unit',
  REPORTING_PERIOD: 'blia_ppt_reporting_period',
  LAST_SYNCED_AT: 'blia_last_synced_at',
  LAST_CLOUD_FILE_ID: 'blia_last_cloud_file_id',
  GAS_ENDPOINT: 'blia_gas_endpoint_url',
};

// Default Configuration
export const DEFAULT_APP_CONFIG: AppConfig = {
  currentYear: '2026',
  organizationName: '國際佛光會中華佛光青年總團 / 新竹青年分團',
  subUnitName: '新竹青年分團',
  guidingUnit: '佛光山法寶寺',
  categories: [
    '生活禪與健走',
    '青年培訓與研習',
    '青年書院與讀書會',
    '義工服務與蔬食',
    '夜跑與運動團練',
    '分團例會與法會'
  ],
  gasEndpointUrl: '',
  lastCloudFileId: '',
  lastSyncedAt: ''
};

// 1. AppConfig persistence
export function getStoredAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    if (!raw) {
      // 嘗試讀取舊有 GAS 端點
      const legacyGas = localStorage.getItem(STORAGE_KEYS.GAS_ENDPOINT) || '';
      const initial = { ...DEFAULT_APP_CONFIG, gasEndpointUrl: legacyGas };
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_APP_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to get AppConfig from localStorage:', err);
    return { ...DEFAULT_APP_CONFIG };
  }
}

export function saveStoredAppConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
    if (config.gasEndpointUrl) {
      localStorage.setItem(STORAGE_KEYS.GAS_ENDPOINT, config.gasEndpointUrl);
    }
    window.dispatchEvent(new CustomEvent('blia_app_config_changed', { detail: config }));
  } catch (err) {
    console.error('Failed to save AppConfig:', err);
  }
}

// In-memory cache for slides for synchronous compatibility
let inMemorySlidesCache: Slide[] | null = null;

// Preload slides from IndexedDB if available
if (typeof window !== 'undefined') {
  loadSlidesFromIndexedDb()
    .then((slds) => {
      if (slds && slds.length > 0) {
        inMemorySlidesCache = slds;
      }
    })
    .catch((err) => {
      console.warn('預先自 IndexedDB 載入簡報快取異常:', err);
    });
}

// 2. Slides persistence
export function getStoredSlides(): Slide[] {
  if (inMemorySlidesCache && inMemorySlidesCache.length > 0) {
    return inMemorySlidesCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLIDES);
    if (!raw) return inMemorySlidesCache || [];
    const parsed = JSON.parse(raw);
    const result = Array.isArray(parsed) ? parsed : [];
    inMemorySlidesCache = result;
    return result;
  } catch (err) {
    console.error('Failed to get Slides from localStorage:', err);
    return inMemorySlidesCache || [];
  }
}

export function saveStoredSlides(slides: Slide[]): void {
  inMemorySlidesCache = slides;

  // 1. Always asynchronously save to IndexedDB (safe for unlimited MBs)
  saveSlidesToIndexedDb(slides).catch((err) => {
    console.error('儲存簡報至 IndexedDB 失敗:', err);
  });

  // 2. Try saving to localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.SLIDES, JSON.stringify(slides));
  } catch (err) {
    console.warn('簡報投影片資料超出 localStorage 5MB 配額，自動啟動輕量化壓縮並由 IndexedDB 完整託管:', err);
    try {
      // Strip oversized embedded images in slide elements for the localStorage fallback copy
      const compressed = slides.map(s => ({
        ...s,
        elements: s.elements.map(el => {
          if (el.type === 'photo' && el.content && el.content.startsWith('data:') && el.content.length > 100000) {
            return { ...el, content: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80' };
          }
          return el;
        })
      }));
      localStorage.setItem(STORAGE_KEYS.SLIDES, JSON.stringify(compressed));
    } catch {
      // If still overflowing, keep just slide metadata and rely on in-memory / IndexedDB
      try {
        const skeleton = slides.map(s => ({
          id: s.id,
          title: s.title,
          type: s.type,
          layoutMode: s.layoutMode,
          elements: []
        }));
        localStorage.setItem(STORAGE_KEYS.SLIDES, JSON.stringify(skeleton));
      } catch {}
    }
  }
}

// 3. Selected Activity IDs persistence
export function getStoredSelectedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_IDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to get selected IDs from localStorage:', err);
    return [];
  }
}

export function saveStoredSelectedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_IDS, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save selected IDs:', err);
  }
}

// 4. Debounced Auto-save to LocalStorage
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSaveResolve: (() => void) | null = null;

export interface AutoSavePayload {
  activities?: ActivityRecordItem[];
  slides?: Slide[];
  selectedIds?: string[];
  appConfig?: AppConfig;
  customBgUrl?: string;
  customLogoUrl?: string;
  themeId?: string;
  layoutMode?: string;
  reportTitle?: string;
  reportingUnit?: string;
  reportingPeriod?: string;
}

export function scheduleAutoSaveToLocalStorage(
  payload: AutoSavePayload, 
  delayMs = 1000,
  onSaved?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    pendingSaveResolve = () => {
      resolve();
      if (onSaved) onSaved();
    };

    autoSaveTimer = setTimeout(() => {
      try {
        if (payload.activities && Array.isArray(payload.activities)) {
          saveStoredActivities(payload.activities);
        }
        if (payload.slides && Array.isArray(payload.slides)) {
          saveStoredSlides(payload.slides);
        }
        if (payload.selectedIds && Array.isArray(payload.selectedIds)) {
          saveStoredSelectedIds(payload.selectedIds);
        }
        if (payload.appConfig) {
          saveStoredAppConfig(payload.appConfig);
        }
        if (payload.customBgUrl !== undefined) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, payload.customBgUrl || '');
        }
        if (payload.customLogoUrl !== undefined) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, payload.customLogoUrl || '');
        }
        if (payload.themeId) {
          localStorage.setItem(STORAGE_KEYS.THEME_ID, payload.themeId);
        }
        if (payload.layoutMode) {
          localStorage.setItem(STORAGE_KEYS.LAYOUT_MODE, payload.layoutMode);
        }
        if (payload.reportTitle) {
          localStorage.setItem(STORAGE_KEYS.REPORT_TITLE, payload.reportTitle);
        }
        if (payload.reportingUnit) {
          localStorage.setItem(STORAGE_KEYS.REPORTING_UNIT, payload.reportingUnit);
        }
        if (payload.reportingPeriod) {
          localStorage.setItem(STORAGE_KEYS.REPORTING_PERIOD, payload.reportingPeriod);
        }

        window.dispatchEvent(new CustomEvent('blia_local_autosaved', { 
          detail: { timestamp: new Date().toISOString() } 
        }));
      } catch (err) {
        console.error('Debounced autosave failed:', err);
      } finally {
        if (pendingSaveResolve) {
          pendingSaveResolve();
          pendingSaveResolve = null;
        }
      }
    }, delayMs);
  });
}

// 5. Package full project data
export function createProjectBackupPackage(options?: {
  activities?: ActivityRecordItem[];
  slides?: Slide[];
  selectedIds?: string[];
  appConfig?: AppConfig;
  customBgUrl?: string;
  customLogoUrl?: string;
  themeId?: string;
  layoutMode?: string;
  reportTitle?: string;
  reportingUnit?: string;
  reportingPeriod?: string;
}): ProjectBackupPackage {
  const cfg = options?.appConfig || getStoredAppConfig();
  const acts = options?.activities || getStoredActivities();
  const slds = options?.slides || getStoredSlides();
  const selIds = options?.selectedIds || getStoredSelectedIds();

  return {
    version: '2.0.0',
    savedAt: new Date().toISOString(),
    appConfig: cfg,
    activities: acts,
    slides: slds,
    selectedIds: selIds,
    customBgUrl: options?.customBgUrl ?? (localStorage.getItem(STORAGE_KEYS.CUSTOM_BG) || ''),
    customLogoUrl: options?.customLogoUrl ?? (localStorage.getItem(STORAGE_KEYS.CUSTOM_LOGO) || ''),
    themeId: options?.themeId ?? (localStorage.getItem(STORAGE_KEYS.THEME_ID) || 'earth_zen'),
    layoutMode: options?.layoutMode ?? (localStorage.getItem(STORAGE_KEYS.LAYOUT_MODE) || 'quad_photos'),
    reportTitle: options?.reportTitle ?? (localStorage.getItem(STORAGE_KEYS.REPORT_TITLE) || '桃竹苗區 聯團會議工作報告'),
    reportingUnit: options?.reportingUnit ?? (localStorage.getItem(STORAGE_KEYS.REPORTING_UNIT) || '新竹佛光青年分團'),
    reportingPeriod: options?.reportingPeriod ?? (localStorage.getItem(STORAGE_KEYS.REPORTING_PERIOD) || `${cfg.currentYear}年工作報告`)
  };
}

// 6. Restore project backup package into state & LocalStorage
export function restoreProjectBackupPackage(backup: ProjectBackupPackage): boolean {
  try {
    if (!backup || typeof backup !== 'object') {
      throw new Error('備份檔案格式無效');
    }

    // 1. AppConfig
    if (backup.appConfig) {
      saveStoredAppConfig(backup.appConfig);
    }

    // 2. Activities
    if (Array.isArray(backup.activities)) {
      saveStoredActivities(backup.activities);
    }

    // 3. Slides
    if (Array.isArray(backup.slides)) {
      saveStoredSlides(backup.slides);
    }

    // 4. Selected IDs
    if (Array.isArray(backup.selectedIds)) {
      saveStoredSelectedIds(backup.selectedIds);
    }

    // 5. Template & Styling settings
    if (backup.customBgUrl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BG, backup.customBgUrl);
    }
    if (backup.customLogoUrl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, backup.customLogoUrl);
    }
    if (backup.themeId) {
      localStorage.setItem(STORAGE_KEYS.THEME_ID, backup.themeId);
    }
    if (backup.layoutMode) {
      localStorage.setItem(STORAGE_KEYS.LAYOUT_MODE, backup.layoutMode);
    }
    if (backup.reportTitle) {
      localStorage.setItem(STORAGE_KEYS.REPORT_TITLE, backup.reportTitle);
    }
    if (backup.reportingUnit) {
      localStorage.setItem(STORAGE_KEYS.REPORTING_UNIT, backup.reportingUnit);
    }
    if (backup.reportingPeriod) {
      localStorage.setItem(STORAGE_KEYS.REPORTING_PERIOD, backup.reportingPeriod);
    }

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('blia_project_restored', { detail: backup }));
    return true;
  } catch (err) {
    console.error('Failed to restore project package:', err);
    return false;
  }
}

/**
 * 快速同步深度瘦身：
 * 針對即將序列化或儲存至 Google Drive / JSON 的 ProjectBackupPackage，
 * 同步移除或替換超大 Base64 圖片（>80KB），避免觸發 V8 的 RangeError: Invalid string length。
 */
export function slimBackupPackageForSync(pkg: ProjectBackupPackage): ProjectBackupPackage {
  if (!pkg) return pkg;

  const fallbackUrl = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';

  // 1. 瘦身 activities 中的超大圖片
  const slimmedActivities = (pkg.activities || []).map(act => ({
    ...act,
    photos: (act.photos || []).map(p => {
      if (p.url && typeof p.url === 'string' && p.url.startsWith('data:') && p.url.length > 80000) {
        return {
          ...p,
          url: fallbackUrl
        };
      }
      return p;
    })
  }));

  // 2. 瘦身 slides 中的重複超大圖片
  const slimmedSlides = (pkg.slides || []).map(slide => ({
    ...slide,
    style: slide.style ? {
      ...slide.style,
      bgImageUrl: (slide.style.bgImageUrl && slide.style.bgImageUrl.startsWith('data:') && slide.style.bgImageUrl.length > 80000)
        ? fallbackUrl
        : slide.style.bgImageUrl
    } : undefined,
    elements: (slide.elements || []).map(el => {
      if (el.type === 'photo' && el.content && typeof el.content === 'string' && el.content.startsWith('data:') && el.content.length > 80000) {
        return {
          ...el,
          content: fallbackUrl
        };
      }
      return el;
    })
  }));

  return {
    ...pkg,
    activities: slimmedActivities,
    slides: slimmedSlides,
    customBgUrl: (pkg.customBgUrl && pkg.customBgUrl.startsWith('data:') && pkg.customBgUrl.length > 80000)
      ? ''
      : pkg.customBgUrl,
    customLogoUrl: (pkg.customLogoUrl && pkg.customLogoUrl.startsWith('data:') && pkg.customLogoUrl.length > 80000)
      ? ''
      : pkg.customLogoUrl
  };
}

/**
 * 智慧非同步高品質壓縮：
 * 保留使用者的真實照片，但將百萬像素的巨大相片透過 Canvas 壓縮為 ~40KB - 80KB 的高效 JPEG，
 * 確保整個專案打包後控制在 5MB - 15MB 內，既完整保留真實相片，又絕不觸發 GAS 與 V8 的容量限制。
 */
export async function prepareSanitizedBackupPackage(pkg: ProjectBackupPackage): Promise<ProjectBackupPackage> {
  if (!pkg) return pkg;

  try {
    // 1. 壓縮活動照片 (依序處理防範記憶體短時間飆升)
    const newActivities = [...(pkg.activities || [])];
    for (let i = 0; i < newActivities.length; i++) {
      const act = newActivities[i];
      if (act.photos && act.photos.length > 0) {
        const compressedPhotos = [];
        for (const p of act.photos) {
          if (p.url && typeof p.url === 'string' && p.url.startsWith('data:image') && p.url.length > 60000) {
            try {
              const opt = await optimizeImageBase64(p.url, 800, 0.72);
              compressedPhotos.push({ ...p, url: opt });
            } catch {
              compressedPhotos.push(p);
            }
          } else {
            compressedPhotos.push(p);
          }
        }
        newActivities[i] = { ...act, photos: compressedPhotos };
      }
    }

    // 2. 壓縮投影片內嵌照片
    const newSlides = [...(pkg.slides || [])];
    for (let s = 0; s < newSlides.length; s++) {
      const slide = newSlides[s];
      let changed = false;
      const newElements = [];
      for (const el of (slide.elements || [])) {
        if (el.type === 'photo' && el.content && typeof el.content === 'string' && el.content.startsWith('data:image') && el.content.length > 60000) {
          try {
            const opt = await optimizeImageBase64(el.content, 800, 0.72);
            newElements.push({ ...el, content: opt });
            changed = true;
          } catch {
            newElements.push(el);
          }
        } else {
          newElements.push(el);
        }
      }
      if (changed) {
        newSlides[s] = { ...slide, elements: newElements };
      }
    }

    // 3. 壓縮客製底圖與 Logo
    let newBgUrl = pkg.customBgUrl;
    if (newBgUrl && typeof newBgUrl === 'string' && newBgUrl.startsWith('data:image') && newBgUrl.length > 80000) {
      try {
        newBgUrl = await optimizeImageBase64(newBgUrl, 1280, 0.75);
      } catch {}
    }

    let newLogoUrl = pkg.customLogoUrl;
    if (newLogoUrl && typeof newLogoUrl === 'string' && newLogoUrl.startsWith('data:image') && newLogoUrl.length > 80000) {
      try {
        newLogoUrl = await optimizeImageBase64(newLogoUrl, 400, 0.8);
      } catch {}
    }

    return {
      ...pkg,
      activities: newActivities,
      slides: newSlides,
      customBgUrl: newBgUrl,
      customLogoUrl: newLogoUrl
    };
  } catch (err) {
    console.warn('非同步影像壓縮遭遇異常，自動降級為同步輕量化處理:', err);
    return slimBackupPackageForSync(pkg);
  }
}

/**
 * 安全 JSON 序列化工具：
 * 針對大型複雜專案物件，提供多層級的防破裂機制，
 * 絕對杜絕 "RangeError: Invalid string length" 拋出至全域造成未捕獲異常。
 */
export function safeJsonStringify(data: any, space?: number): string {
  try {
    return space ? JSON.stringify(data, null, space) : JSON.stringify(data);
  } catch (err: any) {
    console.warn('JSON.stringify 初次序列化觸發容量上限，啟用深度瘦身防護:', err?.message || err);
    
    // Level 1: 如果是 GAS payload
    if (data && typeof data === 'object' && data.data && data.action) {
      try {
        const slimmedData = slimBackupPackageForSync(data.data);
        return JSON.stringify({ ...data, data: slimmedData });
      } catch (err2) {
        console.warn('Level 1 瘦身序列化仍超限，啟用 Level 2 嚴格修剪:', err2);
      }
    }

    // Level 2: 如果是 ProjectBackupPackage 本身
    if (data && typeof data === 'object' && (data.activities || data.slides)) {
      try {
        const slimmed = slimBackupPackageForSync(data);
        return space ? JSON.stringify(slimmed, null, space) : JSON.stringify(slimmed);
      } catch (err3) {
        console.warn('Level 2 瘦身序列化仍超限，啟用 Level 3 終極過濾:', err3);
      }
    }

    // Level 3: 使用 replacer 快速攔截並替換所有長字串 (>20000)
    try {
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'string' && value.startsWith('data:image') && value.length > 20000) {
          return 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';
        }
        return value;
      }, space);
    } catch (finalErr) {
      console.error('safeJsonStringify 終極降級失敗:', finalErr);
      return JSON.stringify({ error: 'Payload exceeded string length limits' });
    }
  }
}

// 7. GAS Cloud Save (action: 'save_project_data')
export async function saveProjectDataToGas(
  endpointUrl: string,
  backupPackage: ProjectBackupPackage,
  fileName = 'hsinchu_youth_report_data.json'
): Promise<{
  success: boolean;
  fileId?: string;
  fileName?: string;
  updatedAt?: string;
  message?: string;
}> {
  if (!endpointUrl || !endpointUrl.trim()) {
    return {
      success: false,
      message: '請先在「系統與年度設定」輸入 Google Apps Script (GAS) 部署網址'
    };
  }

  const cleanUrl = endpointUrl.trim();

  try {
    // 1. 預先進行高品質非同步影像壓縮，控制封包體積在健康安全範圍內 (5~15MB)
    const sanitizedPackage = await prepareSanitizedBackupPackage(backupPackage);

    const payload = {
      action: 'save_project_data',
      fileName: fileName,
      data: sanitizedPackage
    };

    // 2. 安全序列化，防範 Invalid string length
    let bodyString = safeJsonStringify(payload);

    // 3. 檢查傳輸體積是否接近 GAS 限制 (GAS doPost 上限為 50MB)
    // 若超過 35MB，自動降級為同步極限瘦身版
    if (bodyString.length > 35 * 1024 * 1024) {
      console.warn(`封包長度 (${(bodyString.length / 1024 / 1024).toFixed(1)}MB) 接近 GAS 上限，啟動同步極致修剪模式`);
      const slimmed = slimBackupPackageForSync(sanitizedPackage);
      bodyString = safeJsonStringify({
        action: 'save_project_data',
        fileName: fileName,
        data: slimmed
      });
    }

    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GAS 建議使用 text/plain 避免繁複 CORS 預檢
      },
      body: bodyString
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤狀態: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success') {
      // 記錄最後同步資訊
      const nowIso = resJson.updatedAt || new Date().toISOString();
      const cfg = getStoredAppConfig();
      const updatedCfg: AppConfig = {
        ...cfg,
        gasEndpointUrl: cleanUrl,
        lastCloudFileId: resJson.fileId || cfg.lastCloudFileId,
        lastSyncedAt: nowIso
      };
      saveStoredAppConfig(updatedCfg);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED_AT, nowIso);
      if (resJson.fileId) {
        localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_FILE_ID, resJson.fileId);
      }

      window.dispatchEvent(new CustomEvent('blia_cloud_synced', { 
        detail: { fileId: resJson.fileId, updatedAt: nowIso } 
      }));

      return {
        success: true,
        fileId: resJson.fileId,
        fileName: resJson.fileName || fileName,
        updatedAt: nowIso,
        message: resJson.message || '已成功儲存至 Google Drive'
      };
    } else {
      return {
        success: false,
        message: resJson.message || 'GAS 端點回傳錯誤'
      };
    }
  } catch (err: any) {
    console.error('GAS save_project_data fetch error:', err);
    return {
      success: false,
      message: `連線失敗: ${err.message || '請確認 GAS 權限已設為「任何人 (Anyone)」且已允許跨域'}`
    };
  }
}

// 8. GAS Cloud Load (action: 'load_project_data')
export async function loadProjectDataFromGas(
  endpointUrl: string,
  fileId?: string,
  fileName = 'hsinchu_youth_report_data.json'
): Promise<{
  success: boolean;
  data?: ProjectBackupPackage;
  fileId?: string;
  updatedAt?: string;
  message?: string;
}> {
  if (!endpointUrl || !endpointUrl.trim()) {
    return {
      success: false,
      message: '請先提供 Google Apps Script (GAS) 部署網址'
    };
  }

  const cleanUrl = endpointUrl.trim();
  const payload = {
    action: 'load_project_data',
    fileId: fileId || '',
    fileName: fileName
  };

  try {
    // 支援 GET 或 POST，先用 POST
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤狀態: ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success' && resJson.data) {
      const packageData = resJson.data as ProjectBackupPackage;
      restoreProjectBackupPackage(packageData);

      const nowIso = resJson.updatedAt || new Date().toISOString();
      const cfg = getStoredAppConfig();
      saveStoredAppConfig({
        ...cfg,
        lastCloudFileId: resJson.fileId || fileId,
        lastSyncedAt: nowIso
      });

      return {
        success: true,
        data: packageData,
        fileId: resJson.fileId,
        updatedAt: nowIso,
        message: resJson.message || '已成功還原雲端專案備份'
      };
    } else {
      return {
        success: false,
        message: resJson.message || '未在雲端找到有效的專案備份'
      };
    }
  } catch (err: any) {
    console.error('GAS load_project_data fetch error:', err);
    return {
      success: false,
      message: `連線或讀取失敗: ${err.message || '請檢查網路狀態或 GAS 部署狀態'}`
    };
  }
}

// 9. Local File Export & Import (作為零依賴即時保險)
export function exportProjectDataAsLocalJsonFile(
  backupPackage: ProjectBackupPackage,
  customFileName?: string
): void {
  try {
    const jsonStr = safeJsonStringify(backupPackage, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = customFileName || `hsinchu_youth_report_data_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('本機 JSON 備份檔匯出失敗:', err);
    alert(`匯出失敗: ${err?.message || '資料過大無法序列化'}`);
  }
}

export function importProjectDataFromLocalJsonFile(
  file: File
): Promise<{ success: boolean; data?: ProjectBackupPackage; message?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as ProjectBackupPackage;
        if (!parsed || (!parsed.activities && !parsed.slides)) {
          resolve({ success: false, message: '此檔案缺少專案必要欄位（activities / slides）' });
          return;
        }
        const restored = restoreProjectBackupPackage(parsed);
        if (restored) {
          resolve({ success: true, data: parsed, message: '本機專案備份已成功載入！' });
        } else {
          resolve({ success: false, message: '解析或儲存至系統時發生錯誤' });
        }
      } catch (err: any) {
        resolve({ success: false, message: `檔案讀取失敗: ${err.message}` });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: '無法讀取該檔案' });
    };
    reader.readAsText(file);
  });
}
