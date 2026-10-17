/**
 * Google Drive & Google Picker API service
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    time?: string;
  };
}

let pickerLoaded = false;

/**
 * Dynamically loads the Google API client script for Picker
 */
export const loadGooglePickerScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (pickerLoaded && window.google?.picker) {
      resolve();
      return;
    }

    if (window.gapi) {
      window.gapi.load('picker', () => {
        pickerLoaded = true;
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.gapi) {
        window.gapi.load('picker', () => {
          pickerLoaded = true;
          resolve();
        });
      } else {
        reject(new Error('Google API (gapi) 載入失敗'));
      }
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

/**
 * Opens Google Picker widget
 */
export const openGooglePicker = async (options: {
  accessToken: string;
  onPicked: (file: { id: string; name: string; url?: string }) => void;
  onCancel?: () => void;
}): Promise<void> => {
  await loadGooglePickerScript();

  if (!window.google?.picker) {
    throw new Error('Google Picker 模組尚未準備就緒');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false);

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(options.accessToken)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const file = data.docs[0];
        options.onPicked({
          id: file.id,
          name: file.name,
          url: file.url || file.thumbnails?.[0]?.url,
        });
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (options.onCancel) options.onCancel();
      }
    })
    .setOrigin(pickerOrigin)
    .build();

  picker.setVisible(true);
};

/**
 * Directly lists recent image files from the user's Google Drive
 */
export const listDrivePhotos = async (accessToken: string): Promise<DriveFileItem[]> => {
  const query = encodeURIComponent("mimeType contains 'image/' and trashed = false");
  const fields = encodeURIComponent(
    'files(id,name,mimeType,thumbnailLink,webContentLink,createdTime,size,imageMediaMetadata)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive API error:', errorText);
    if (response.status === 403) {
      throw new Error('Google 雲端硬碟權限不足 (403)：請確認 Google 帳號已授權 Google Drive 讀取權限，或請登出後重新登入授權。');
    }
    throw new Error(`無法讀取 Google 雲端硬碟檔案 (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Downloads a Google Drive image and converts it to a Base64 data URL
 * so it can be rendered locally and embedded safely in Word/PDF documents.
 */
export const fetchDriveImageAsBase64 = async (
  accessToken: string,
  fileId: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`無法下載雲端照片檔案 (${response.status})`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('圖片轉換 Base64 失敗'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
