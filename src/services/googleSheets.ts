import { CheckInRecord } from '../types';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: string[];
}

const HEADERS = [
  '打卡編號',
  '姓名',
  '青年身份',
  '打卡日期',
  '打卡時間',
  '運動類型',
  '運動時長(分鐘)',
  '運動里程(km)',
  '運動步數(步)',
  '燃燒熱量(kcal)',
  '審核狀態',
  '審核人員',
  '審核時間',
  '打卡心得/備註',
  '管理員註記',
  '建立時間'
];

/**
 * Maps a CheckInRecord to row values
 */
export const mapRecordToRow = (record: CheckInRecord): (string | number)[] => {
  const statusLabel = 
    record.status === 'approved' ? '通過 (Approved)' :
    record.status === 'rejected' ? '退回 (Rejected)' : '待審核 (Pending)';

  return [
    record.id,
    record.memberName,
    record.identity,
    record.date,
    record.time || '',
    record.workoutType,
    record.durationMinutes || 0,
    record.distanceKm || 0,
    record.steps || 0,
    record.calories || 0,
    statusLabel,
    record.reviewedBy || '',
    record.reviewedAt || '',
    record.note || '',
    record.adminNote || '',
    record.createdAt || ''
  ];
};

/**
 * Creates a brand new Google Spreadsheet for Punch-In tracking
 */
export const createPunchInSpreadsheet = async (
  accessToken: string,
  customTitle?: string
): Promise<SpreadsheetInfo> => {
  const title = customTitle || `2027 跨界青年健康計畫 - 運動打卡審核資料表 (${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')})`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: '打卡審核總表',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Create Spreadsheet error:', errorText);
    throw new Error(`無法建立 Google 試算表 (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Insert Header Row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'打卡審核總表'!A1:P1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'打卡審核總表'!A1:P1",
        majorDimension: 'ROWS',
        values: [HEADERS],
      }),
    }
  );

  return {
    id: spreadsheetId,
    title: data.properties?.title || title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheets: (data.sheets || []).map((s: any) => s.properties?.title || '打卡審核總表'),
  };
};

/**
 * Appends one or more check-in records to an existing Google Spreadsheet
 */
export const appendRecordsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  records: CheckInRecord[],
  sheetName: string = '打卡審核總表'
): Promise<{ updatedRows: number }> => {
  if (records.length === 0) return { updatedRows: 0 };

  const rows = records.map(mapRecordToRow);
  const encodedSheet = encodeURIComponent(sheetName);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheet}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName}'!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Append rows error:', err);
    throw new Error(`寫入 Google 試算表失敗 (${response.status})`);
  }

  const resData = await response.json();
  return { updatedRows: resData.updates?.updatedRows || rows.length };
};

/**
 * Completely syncs all records (re-writes header and all records)
 */
export const syncAllRecordsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  records: CheckInRecord[],
  sheetName: string = '打卡審核總表'
): Promise<number> => {
  const allRows = [HEADERS, ...records.map(mapRecordToRow)];
  const encodedSheet = encodeURIComponent(sheetName);

  // Clear first
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheet}'!A1:Z5000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write all rows
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheet}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName}'!A1`,
        majorDimension: 'ROWS',
        values: allRows,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Sync all rows error:', err);
    throw new Error(`同步至 Google 試算表失敗 (${response.status})`);
  }

  return records.length;
};

/**
 * Validates and retrieves metadata for an existing Google Spreadsheet ID
 */
export const getSpreadsheetMetadata = async (
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> => {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`無法存取該試算表，請確認試算表 ID 是否正確且具有存取權限 (${response.status})`);
  }

  const data = await response.json();
  return {
    id: spreadsheetId,
    title: data.properties?.title || '未命名試算表',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheets: (data.sheets || []).map((s: any) => s.properties?.title),
  };
};

const STORAGE_KEY_SHEET = 'hsinchu_youth_spreadsheet_info';
const STORAGE_KEY_AUTO_SYNC = 'hsinchu_youth_sheets_auto_sync';

export const getStoredSheetInfo = (): SpreadsheetInfo | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEET);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredSheetInfo = (info: SpreadsheetInfo | null) => {
  try {
    if (info) {
      localStorage.setItem(STORAGE_KEY_SHEET, JSON.stringify(info));
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEET);
    }
  } catch (e) {
    console.error('Failed to persist spreadsheet info', e);
  }
};

export const getStoredAutoSyncSetting = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTO_SYNC) === 'true';
  } catch {
    return false;
  }
};

export const saveStoredAutoSyncSetting = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to persist auto-sync setting', e);
  }
};

