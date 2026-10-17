import html2canvas from 'html2canvas';
import { Slide } from '../types';
import { renderSlideElementHtml, waitForElementImages } from '../utils/slidesPdfExportHelper';
import { GAS_DRIVE_BACKUP_URL } from '../components/SlideCanvaStudio';

export interface GasSlideExportItem {
  index: number;
  title: string;
  imageData: string; // Base64 JPEG data URL
}

export interface GasSlideExportResult {
  status: 'success' | 'error';
  action: 'export_to_google_slides';
  presentationId?: string;
  presentationUrl?: string;
  totalSlides?: number;
  message?: string;
}

/**
 * Captures all slides as 16:9 1920x1080 JPEG snapshots (quality: 0.85)
 * and sends them directly to Google Apps Script (GAS) to be converted to native Blobs
 * and inserted into a brand new Google Slides presentation.
 */
export async function exportSlidesToGoogleSlidesViaGas(
  slides: Slide[],
  presentationTitle: string,
  gasEndpointUrl?: string,
  onProgress?: (stepMessage: string, current: number, total: number) => void
): Promise<GasSlideExportResult> {
  if (!slides || slides.length === 0) {
    throw new Error('未接收到任何投影片可供匯出');
  }

  // Retrieve GAS Endpoint: argument > localStorage > built-in fallback
  const rawEndpoint =
    gasEndpointUrl ||
    localStorage.getItem('blia_gas_endpoint_url') ||
    localStorage.getItem('gasEndpointUrl') ||
    GAS_DRIVE_BACKUP_URL;

  if (!rawEndpoint || !rawEndpoint.startsWith('http')) {
    throw new Error('未設定 Google Apps Script Web App 端點網址，請先至系統設定中填寫');
  }

  // Double routing guarantee: append ?action=export_to_google_slides to the request URL
  let targetUrl = rawEndpoint;
  try {
    const urlObj = new URL(rawEndpoint);
    urlObj.searchParams.set('action', 'export_to_google_slides');
    targetUrl = urlObj.toString();
  } catch (_urlErr) {
    targetUrl = rawEndpoint.includes('?')
      ? `${rawEndpoint}&action=export_to_google_slides`
      : `${rawEndpoint}?action=export_to_google_slides`;
  }

  const RENDER_WIDTH = 1920;
  const RENDER_HEIGHT = 1080;
  const totalSlides = slides.length;
  const slidesPayload: GasSlideExportItem[] = [];

  // Create isolated off-screen rendering container
  const container = document.createElement('div');
  container.id = 'gas-slides-export-offscreen-stage';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = `${RENDER_WIDTH}px`;
  container.style.height = `${RENDER_HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif';
  document.body.appendChild(container);

  try {
    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i];
      if (onProgress) {
        onProgress(`正在截圖處理第 ${i + 1} / ${totalSlides} 頁...`, i + 1, totalSlides + 2);
      }

      const bgColor =
        slide.style?.bgColor ||
        (slide.type === 'cover' || slide.type === 'thank_you' ? '#2C3437' : '#F7F6F2');
      const bgImage = slide.style?.bgImageUrl;
      const bgStyle = bgImage
        ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;`
        : `background-color: ${bgColor};`;

      const sortedElements = [...(slide.elements || [])].sort(
        (a, b) => (a.zIndex || 10) - (b.zIndex || 10)
      );
      const elementsHtml = sortedElements.map((elem) => renderSlideElementHtml(elem)).join('\n');

      container.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; ${bgStyle} overflow: hidden; box-sizing: border-box;">
          ${elementsHtml}
        </div>
      `;

      await waitForElementImages(container);

      const canvas = await html2canvas(container, {
        width: RENDER_WIDTH,
        height: RENDER_HEIGHT,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        logging: false,
        imageTimeout: 5000,
      });

      // Compress snapshot to JPEG 0.85 to maintain crisp quality while keeping payload ~200KB-400KB per slide
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Memory sanitization: release canvas memory buffer to avoid browser OOM
      canvas.width = 0;
      canvas.height = 0;
      container.innerHTML = '';

      slidesPayload.push({
        index: i,
        title: slide.title || `第 ${i + 1} 頁`,
        imageData: compressedDataUrl,
      });

      // 60ms pacing delay between slides to allow Garbage Collection
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    if (onProgress) {
      onProgress('正在將高畫質影像寫入 Google 簡報...', totalSlides + 1, totalSlides + 2);
    }

    const requestPayload = {
      action: 'export_to_google_slides',
      title: presentationTitle || '新竹青年分團工作報告簡報',
      slides: slidesPayload,
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script 連線失敗 (HTTP ${response.status})`);
    }

    const resJson = await response.json();

    if (resJson.status === 'error') {
      throw new Error(resJson.message || '生成 Google 簡報失敗');
    }

    if (onProgress) {
      onProgress(`成功生成 Google 簡報，共寫入 ${totalSlides} 頁！`, totalSlides + 2, totalSlides + 2);
    }

    return resJson as GasSlideExportResult;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
