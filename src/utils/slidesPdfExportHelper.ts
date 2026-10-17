import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MeetingReportData } from '../components/MeetingReportSlidesSection';
import { Slide, SlideElement } from '../types';
import { SlideCustomOptions } from './pptxExportHelper';
import { buildSlidesFromReportData } from './slideBuilder';

export interface PdfExportProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Safely waits for all images inside an element to load
 */
export function waitForElementImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  const promises = images.map(img => {
    if (img.complete && img.naturalWidth !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // continue even if an image fails to load
      // Fallback timeout in case image hangs
      setTimeout(resolve, 3500);
    });
  });

  return Promise.all(promises).then(() => {});
}

/**
 * Renders HTML for a single slide element at 1920x1080 resolution
 */
export function renderSlideElementHtml(elem: SlideElement): string {
  const xPercent = elem.x > 100 ? (elem.x / 1920) * 100 : elem.x;
  const yPercent = elem.y > 100 ? (elem.y / 1080) * 100 : elem.y;
  const wPercent = elem.w > 100 ? (elem.w / 1920) * 100 : elem.w;
  const hPercent = elem.h > 100 ? (elem.h / 1080) * 100 : elem.h;

  let inner = '';

  if (elem.type === 'photo' || elem.type === 'media') {
    inner = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #18181b; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px -4px rgba(0,0,0,0.18);">
        <img 
          src="${elem.content}" 
          crossorigin="anonymous"
          style="flex: 1; width: 100%; height: 100%; object-fit: cover;" 
          alt="${elem.title || '佐證照片'}"
        />
        ${elem.title ? `
          <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: #f8fafc; padding: 6px 12px; font-size: 13px; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.15); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            📷 ${elem.title}
          </div>
        ` : ''}
      </div>
    `;
  } else if (elem.type === 'number_kpi') {
    inner = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${elem.bgColor || '#ffffff'}; border: 1.5px solid ${elem.borderColor || '#e2e8f0'}; border-radius: ${elem.borderRadius || 16}px; padding: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); box-sizing: border-box;">
        ${elem.title ? `
          <div style="font-size: 13px; font-weight: bold; color: #64748b; margin-bottom: 4px; text-align: center; line-height: 1.3;">
            ${elem.title}
          </div>
        ` : ''}
        <div style="font-size: ${elem.fontSize || 38}px; font-weight: 900; color: ${elem.color || '#E29B27'}; line-height: 1.1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${elem.content}
        </div>
      </div>
    `;
  } else if (elem.type === 'badge') {
    inner = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${elem.bgColor || '#4A7C59'}; color: ${elem.color || '#ffffff'}; font-size: ${elem.fontSize || 14}px; font-weight: 900; border-radius: ${elem.borderRadius || 999}px; padding: 4px 14px; text-align: center; box-sizing: border-box; letter-spacing: 0.5px;">
        ${elem.content}
      </div>
    `;
  } else if (elem.type === 'sticker') {
    inner = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: ${elem.fontSize || 48}px; line-height: 1;">
        ${elem.content}
      </div>
    `;
  } else if (elem.type === 'table' && elem.tableData && elem.tableData.length > 0) {
    const headerBg = elem.tableHeaderBg || '#4A7C59';
    const borderC = elem.tableBorderColor || '#e2e8f0';
    const rowsHtml = elem.tableData.map((row, rIdx) => `
      <tr style="background: ${rIdx === 0 ? headerBg : rIdx % 2 === 0 ? '#f8fafc' : '#ffffff'}; color: ${rIdx === 0 ? '#ffffff' : '#1e293b'}; font-weight: ${rIdx === 0 ? 800 : 500};">
        ${row.map(cell => `
          <td style="padding: 8px 12px; border: 1px solid ${borderC}; text-align: left; font-size: 13px;">${cell}</td>
        `).join('')}
      </tr>
    `).join('');

    inner = `
      <table style="width: 100%; height: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        ${rowsHtml}
      </table>
    `;
  } else {
    // heading, text, quote, shape
    const isBold = elem.fontWeight === 'bold' || elem.fontWeight === 'black';
    inner = `
      <div style="width: 100%; height: 100%; font-size: ${elem.fontSize || 16}px; font-weight: ${isBold ? 800 : 500}; font-style: ${elem.fontStyle || 'normal'}; color: ${elem.color || '#1c1917'}; background: ${elem.bgColor || 'transparent'}; border-radius: ${elem.borderRadius || 0}px; border: ${elem.borderWidth ? `${elem.borderWidth}px solid ${elem.borderColor || '#ccc'}` : 'none'}; padding: ${elem.bgColor && elem.bgColor !== 'transparent' ? '12px 18px' : '0'}; text-align: ${elem.textAlign || 'left'}; white-space: pre-wrap; line-height: 1.45; box-sizing: border-box; font-family: ${elem.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif'};">
        ${elem.content}
      </div>
    `;
  }

  return `
    <div style="position: absolute; left: ${xPercent}%; top: ${yPercent}%; width: ${wPercent}%; height: ${hPercent}%; z-index: ${elem.zIndex || 10}; box-sizing: border-box;">
      ${inner}
    </div>
  `;
}

/**
 * Generates a full native 16:9 Landscape PDF using jsPDF and html2canvas.
 * Guarantees 100% 16:9 landscape ratio, zero rotation (no 90-degree tilt), zero black borders.
 */
export async function exportSlidesToPdfFile(
  reportData: MeetingReportData,
  options?: SlideCustomOptions,
  slidesInput?: Slide[],
  onProgress?: PdfExportProgressCallback
): Promise<void> {
  const slides = (slidesInput && slidesInput.length > 0)
    ? slidesInput
    : buildSlidesFromReportData(reportData, options?.layoutMode, options?.themeId);

  if (slides.length === 0) {
    throw new Error('No slides available to export');
  }

  // 1. Initialize jsPDF with explicit 16:9 Landscape parameters
  // 1920x1080 px format ensures 1:1 crispness and 100% fill without letterboxing or rotation
  const PDF_WIDTH = 1920;
  const PDF_HEIGHT = 1080;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [PDF_WIDTH, PDF_HEIGHT],
    compress: true
  });

  // 2. Prepare offscreen DOM render container
  const container = document.createElement('div');
  container.id = 'pdf-render-offscreen-stage';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = `${PDF_WIDTH}px`;
  container.style.height = `${PDF_HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif';
  document.body.appendChild(container);

  try {
    const totalSlides = slides.length;

    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i];
      if (onProgress) {
        onProgress(i + 1, totalSlides, `正在繪製第 ${i + 1} / ${totalSlides} 頁：${slide.title || '投影片'}...`);
      }

      // Determine slide background
      const bgColor = slide.style?.bgColor || (slide.type === 'cover' || slide.type === 'thank_you' ? '#2C3437' : '#F7F6F2');
      const bgImage = slide.style?.bgImageUrl || options?.customBgUrl;
      const bgStyle = bgImage
        ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;`
        : `background-color: ${bgColor};`;

      // Sort elements by zIndex
      const sortedElements = [...slide.elements].sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));
      const elementsHtml = sortedElements.map(elem => renderSlideElementHtml(elem)).join('\n');

      // Populate stage container
      container.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; ${bgStyle} overflow: hidden; box-sizing: border-box;">
          ${elementsHtml}
        </div>
      `;

      // Wait for all image assets to be ready
      await waitForElementImages(container);

      // Render to canvas using html2canvas locked to 1920x1080
      const canvas = await html2canvas(container, {
        width: PDF_WIDTH,
        height: PDF_HEIGHT,
        scale: 1, // 1:1 pixel mapping ensures exact match
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        logging: false,
        imageTimeout: 5000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Explicitly tear down canvas buffer to release GPU/RAM memory
      canvas.width = 0;
      canvas.height = 0;
      container.innerHTML = '';

      // Add to PDF
      if (i > 0) {
        pdf.addPage([PDF_WIDTH, PDF_HEIGHT], 'landscape');
      }

      // Add image with 0, 0, PDF_WIDTH, PDF_HEIGHT (100% full bleed, zero black bars, no distortion)
      pdf.addImage(imgData, 'JPEG', 0, 0, PDF_WIDTH, PDF_HEIGHT, undefined, 'FAST');

      // Small async delay between pages to allow browser garbage collector to reclaim heap
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    if (onProgress) {
      onProgress(totalSlides, totalSlides, 'PDF 轉換完成，正在下載...');
    }

    // Save PDF
    const filename = `${reportData.reporting_unit || '新竹青年分團'}_工作報告_16x9_${(reportData.reporting_period || '2026').replace(/\s+/g, '')}.pdf`;
    pdf.save(filename);

  } finally {
    // Always clean up offscreen container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
