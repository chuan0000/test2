import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { MeetingReportData, PPTActivityItem } from '../components/MeetingReportSlidesSection';
import { Slide, SlideElement } from '../types';
import { buildSlidesFromReportData } from './slideBuilder';
import { renderSlideElementHtml, waitForElementImages } from './slidesPdfExportHelper';

export interface SlideCustomOptions {
  themeId?: string;
  customBgUrl?: string;
  customLogoUrl?: string;
  layoutMode?: 'quad_photos' | 'dual_photos' | 'single_hero' | 'text_cards';
  accentColor?: string;
  fontSizeScale?: 'standard' | 'large';
}

// 16:9 Widescreen Presentation Dimensions in Inches (13.333 x 7.5 inches)
// Perfectly matches PowerPoint 16:9 Widescreen standard and pptxgenjs 'LAYOUT_WIDE'
export const PPT_WIDTH_INCH = 13.333333;
export const PPT_HEIGHT_INCH = 7.5;

/**
 * Clean hex color (strip #)
 */
function cleanHex(color: string, fallback = '4A7C59'): string {
  if (!color) return fallback;
  return color.replace('#', '').trim();
}

/**
 * Dynamic Coordinate Converter
 * Converts canvas coordinates (percentages 0-100 or pixels 0-1920 / 0-1080)
 * directly into exact PowerPoint 16:9 widescreen inches (13.333 x 7.5).
 */
export function convertCoordToInches(
  val: number, 
  isXorWidth: boolean, 
  referencePixel?: number
): number {
  const maxInch = isXorWidth ? PPT_WIDTH_INCH : PPT_HEIGHT_INCH;
  const refPx = referencePixel || (isXorWidth ? 1920 : 1080);
  if (val > 100) {
    // If coordinate exceeds 100, treat as pixel value based on reference dimension
    return (val / refPx) * maxInch;
  }
  // Otherwise treat as percentage (0 - 100)
  return (val / 100) * maxInch;
}

/**
 * Safely adds an image to pptx slide.
 * Supports:
 * - Base64 data URLs (data:image/...)
 * - Local blob URLs (blob:...) by converting to data URL
 * - Remote HTTP/HTTPS URLs
 * Applies sizing: { type: 'cover' } to ensure images never warp or distort.
 */
async function safeAddImage(
  slide: pptxgen.Slide,
  options: {
    path: string;
    x: number;
    y: number;
    w: number;
    h: number;
    sizing?: { type: 'cover' | 'contain' | 'crop'; w: number; h: number };
    altText?: string;
  }
): Promise<boolean> {
  try {
    if (!options.path) return false;
    const rawUrl = options.path.trim();
    const sizingOption = options.sizing || { type: 'cover', w: options.w, h: options.h };

    // 1. Base64 Data URL
    if (rawUrl.startsWith('data:')) {
      slide.addImage({
        data: rawUrl,
        x: options.x,
        y: options.y,
        w: options.w,
        h: options.h,
        sizing: sizingOption,
        altText: options.altText || '佐證照片'
      });
      return true;
    }

    // 2. Blob URL: convert to base64 DataURL
    if (rawUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(rawUrl);
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        slide.addImage({
          data: dataUrl,
          x: options.x,
          y: options.y,
          w: options.w,
          h: options.h,
          sizing: sizingOption,
          altText: options.altText || '佐證照片'
        });
        return true;
      } catch (blobErr) {
        console.warn('Could not read blob URL for PPTX image:', blobErr);
      }
    }

    // 3. Standard HTTP / HTTPS URL
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      slide.addImage({
        path: rawUrl,
        x: options.x,
        y: options.y,
        w: options.w,
        h: options.h,
        sizing: sizingOption,
        altText: options.altText || '佐證照片'
      });
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Could not add image to PPTX slide:', err);
    return false;
  }
}

/**
 * Strategy B: Dynamic Photo Layout Engine for Template Mode
 * Computes non-overlapping, balanced coordinates for any number of photos:
 * - 0 photos: empty state card
 * - 1 photo: large hero layout
 * - 2 photos: symmetrical side-by-side layout
 * - 3 photos: 1 featured top + 2 bottom collage
 * - 4 photos: 2x2 grid
 * - 5+ photos: dynamic row/col calculations
 */
interface PhotoCellLayout {
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  imgX: number;
  imgY: number;
  imgW: number;
  imgH: number;
  capX: number;
  capY: number;
  capW: number;
  capH: number;
}

function computeDynamicPhotoLayout(
  count: number,
  zone: { x: number; y: number; w: number; h: number }
): PhotoCellLayout[] {
  if (count <= 0) return [];

  // Case 1: Single Hero Photo
  if (count === 1) {
    const cardX = zone.x;
    const cardY = zone.y;
    const cardW = zone.w;
    const cardH = zone.h;
    const capH = 0.5;
    const imgH = cardH - capH - 0.1;
    return [{
      cardX,
      cardY,
      cardW,
      cardH,
      imgX: cardX + 0.08,
      imgY: cardY + 0.08,
      imgW: cardW - 0.16,
      imgH,
      capX: cardX + 0.12,
      capY: cardY + cardH - capH,
      capW: cardW - 0.24,
      capH
    }];
  }

  // Case 2: Dual Photos (Side-by-Side)
  if (count === 2) {
    const gutter = 0.25;
    const cardW = (zone.w - gutter) / 2;
    const cardH = zone.h;
    const capH = 0.5;
    const imgH = cardH - capH - 0.1;
    return [0, 1].map(i => {
      const cardX = zone.x + i * (cardW + gutter);
      const cardY = zone.y;
      return {
        cardX,
        cardY,
        cardW,
        cardH,
        imgX: cardX + 0.08,
        imgY: cardY + 0.08,
        imgW: cardW - 0.16,
        imgH,
        capX: cardX + 0.12,
        capY: cardY + cardH - capH,
        capW: cardW - 0.24,
        capH
      };
    });
  }

  // Case 3: 3-Photo Collage (1 top featured wide + 2 bottom)
  if (count === 3) {
    const gutter = 0.2;
    const topH = (zone.h - gutter) * 0.48;
    const bottomH = (zone.h - gutter) * 0.52;
    const capH = 0.42;

    const cell0: PhotoCellLayout = {
      cardX: zone.x,
      cardY: zone.y,
      cardW: zone.w,
      cardH: topH,
      imgX: zone.x + 0.08,
      imgY: zone.y + 0.08,
      imgW: zone.w - 0.16,
      imgH: topH - capH - 0.1,
      capX: zone.x + 0.12,
      capY: zone.y + topH - capH,
      capW: zone.w - 0.24,
      capH
    };

    const bottomW = (zone.w - gutter) / 2;
    const cell1: PhotoCellLayout = {
      cardX: zone.x,
      cardY: zone.y + topH + gutter,
      cardW: bottomW,
      cardH: bottomH,
      imgX: zone.x + 0.08,
      imgY: zone.y + topH + gutter + 0.08,
      imgW: bottomW - 0.16,
      imgH: bottomH - capH - 0.1,
      capX: zone.x + 0.12,
      capY: zone.y + topH + gutter + bottomH - capH,
      capW: bottomW - 0.24,
      capH
    };

    const cell2: PhotoCellLayout = {
      cardX: zone.x + bottomW + gutter,
      cardY: zone.y + topH + gutter,
      cardW: bottomW,
      cardH: bottomH,
      imgX: zone.x + bottomW + gutter + 0.08,
      imgY: zone.y + topH + gutter + 0.08,
      imgW: bottomW - 0.16,
      imgH: bottomH - capH - 0.1,
      capX: zone.x + bottomW + gutter + 0.12,
      capY: zone.y + topH + gutter + bottomH - capH,
      capW: bottomW - 0.24,
      capH
    };

    return [cell0, cell1, cell2];
  }

  // Case 4: 4 Photos (2x2 Grid)
  if (count === 4) {
    const gutterX = 0.22;
    const gutterY = 0.2;
    const cardW = (zone.w - gutterX) / 2;
    const cardH = (zone.h - gutterY) / 2;
    const capH = 0.42;
    const imgH = cardH - capH - 0.1;

    const layouts: PhotoCellLayout[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const cardX = zone.x + c * (cardW + gutterX);
        const cardY = zone.y + r * (cardH + gutterY);
        layouts.push({
          cardX,
          cardY,
          cardW,
          cardH,
          imgX: cardX + 0.08,
          imgY: cardY + 0.08,
          imgW: cardW - 0.16,
          imgH,
          capX: cardX + 0.1,
          capY: cardY + cardH - capH,
          capW: cardW - 0.2,
          capH
        });
      }
    }
    return layouts;
  }

  // Case 5+: Dynamic Grid (3 cols or 4 cols)
  const cols = count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const gutterX = 0.16;
  const gutterY = 0.16;
  const cardW = (zone.w - (cols - 1) * gutterX) / cols;
  const cardH = (zone.h - (rows - 1) * gutterY) / rows;
  const capH = Math.min(0.38, cardH * 0.22);
  const imgH = Math.max(0.6, cardH - capH - 0.08);

  const layouts: PhotoCellLayout[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const cardX = zone.x + c * (cardW + gutterX);
    const cardY = zone.y + r * (cardH + gutterY);
    layouts.push({
      cardX,
      cardY,
      cardW,
      cardH,
      imgX: cardX + 0.06,
      imgY: cardY + 0.06,
      imgW: cardW - 0.12,
      imgH,
      capX: cardX + 0.08,
      capY: cardY + cardH - capH,
      capW: cardW - 0.16,
      capH
    });
  }
  return layouts;
}

/**
 * Generates a full native PowerPoint (.pptx) file using pptxgenjs.
 * Guarantees zero layout shift, dynamic layout adaptability, and 16:9 widescreen presentation.
 */
export async function exportToPowerPointFile(
  reportData: MeetingReportData,
  options?: SlideCustomOptions,
  slides?: Slide[]
): Promise<void> {
  const pres = new pptxgen();

  // Explicit 16:9 widescreen layout (13.333 x 7.5 inches)
  pres.layout = 'LAYOUT_WIDE';
  pres.title = reportData.meeting_report_title || '桃竹苗區聯團會議工作報告';
  pres.author = reportData.reporting_unit || '國際佛光會新竹青年分團';
  pres.company = '國際佛光會中華佛光青年總團';

  // =========================================================================
  // Strategy A: Direct Canvas 1:1 Mirroring
  // When customized slides exist, map all elements directly to 16:9 coordinates
  // =========================================================================
  if (slides && slides.length > 0) {
    for (const slideData of slides) {
      const pSlide = pres.addSlide();
      const slideBg = cleanHex(slideData.style?.bgColor || (slideData.type === 'cover' ? '2C3437' : 'F7F6F2'));
      pSlide.background = { color: slideBg };

      if (slideData.style?.bgImageUrl || options?.customBgUrl) {
        const bgUrl = slideData.style?.bgImageUrl || options?.customBgUrl;
        if (bgUrl) {
          await safeAddImage(pSlide, {
            path: bgUrl,
            x: 0,
            y: 0,
            w: PPT_WIDTH_INCH,
            h: PPT_HEIGHT_INCH,
            sizing: { type: 'cover', w: PPT_WIDTH_INCH, h: PPT_HEIGHT_INCH }
          });
        }
      }

      // Sort elements by zIndex to preserve exact stacking order
      const sortedElements = [...slideData.elements].sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));

      for (const elem of sortedElements) {
        const x = convertCoordToInches(elem.x, true);
        const y = convertCoordToInches(elem.y, false);
        const w = convertCoordToInches(elem.w, true);
        const h = convertCoordToInches(elem.h, false);

        if (elem.type === 'table' && elem.tableData && elem.tableData.length > 0) {
          const headerBg = cleanHex(elem.tableHeaderBg || '4A7C59');
          const borderC = cleanHex(elem.tableBorderColor || 'E2E8F0');
          const tableRows = elem.tableData.map((row, rIdx) => 
            row.map(cell => ({
              text: cell,
              options: {
                fill: { color: rIdx === 0 ? headerBg : rIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
                color: rIdx === 0 ? 'FFFFFF' : '1C1917',
                bold: rIdx === 0,
                fontSize: 9.5,
                border: { pt: 1, color: borderC },
                wrap: true,
                margin: 0
              }
            }))
          );
          pSlide.addTable(tableRows, {
            x,
            y,
            w,
            h,
            fontFace: 'Microsoft JhengHei'
          });
        } else if (elem.type === 'photo' || elem.type === 'media') {
          const capHeight = elem.title ? Math.min(0.42, h * 0.2) : 0;
          const imgHeight = h - capHeight;

          await safeAddImage(pSlide, {
            path: elem.content,
            x,
            y,
            w,
            h: imgHeight,
            sizing: { type: 'cover', w, h: imgHeight },
            altText: elem.title || '活動照片'
          });

          if (elem.title) {
            pSlide.addText(`📷 ${elem.title}`, {
              x,
              y: y + imgHeight,
              w,
              h: capHeight,
              fontSize: 9,
              bold: true,
              color: '44403C',
              align: 'left',
              wrap: true,
              margin: 0,
              fit: 'shrink',
              fontFace: 'Microsoft JhengHei'
            });
          }
        } else if (elem.type === 'number_kpi') {
          // KPI background container box
          pSlide.addShape(pres.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            fill: { color: cleanHex(elem.bgColor || 'FFFFFF') },
            line: { color: cleanHex(elem.borderColor || 'E2E8F0'), width: elem.borderWidth || 1 }
          });

          const titleH = elem.title ? Math.min(0.4, h * 0.35) : 0;
          if (elem.title) {
            pSlide.addText(elem.title, {
              x: x + 0.1,
              y: y + 0.08,
              w: w - 0.2,
              h: titleH,
              fontSize: 9.5,
              bold: true,
              color: '64748B',
              align: 'center',
              wrap: true,
              margin: 0,
              fit: 'shrink',
              fontFace: 'Microsoft JhengHei'
            });
          }

          pSlide.addText(elem.content, {
            x: x + 0.1,
            y: y + titleH + 0.05,
            w: w - 0.2,
            h: h - titleH - 0.15,
            fontSize: elem.fontSize || 28,
            bold: true,
            color: cleanHex(elem.color || 'E29B27'),
            align: 'center',
            wrap: true,
            margin: 0,
            fit: 'shrink',
            fontFace: 'Arial'
          });
        } else if (elem.type === 'shape') {
          pSlide.addShape(pres.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            fill: { color: cleanHex(elem.bgColor || 'FFFFFF') },
            line: { color: cleanHex(elem.borderColor || 'E2E8F0'), width: elem.borderWidth || 1 }
          });
        } else {
          // heading, text, badge, quote, sticker
          const isBold = elem.fontWeight === 'bold' || elem.fontWeight === 'black';
          const isCenter = elem.textAlign === 'center';
          const isRight = elem.textAlign === 'right';
          const align = isCenter ? 'center' : isRight ? 'right' : 'left';

          if (elem.bgColor && elem.bgColor !== 'transparent') {
            pSlide.addShape(pres.ShapeType.roundRect, {
              x,
              y,
              w,
              h,
              fill: { color: cleanHex(elem.bgColor) },
              line: elem.borderColor ? { color: cleanHex(elem.borderColor), width: elem.borderWidth || 1 } : undefined
            });
          }

          pSlide.addText(elem.content, {
            x,
            y,
            w,
            h,
            fontSize: elem.fontSize ? Math.max(9, Math.round(elem.fontSize * 0.72)) : 12,
            bold: isBold,
            italic: elem.fontStyle === 'italic',
            color: cleanHex(elem.color || (slideData.type === 'cover' ? 'FFFFFF' : '1C1917')),
            align,
            wrap: true,
            margin: 0,
            fit: 'shrink',
            fontFace: elem.fontFamily || 'Microsoft JhengHei'
          });
        }
      }
    }

    const filename = `${reportData.reporting_unit || '佛光青年分團'}_工作報告_${new Date().toISOString().slice(0, 10)}.pptx`;
    await pres.writeFile({ fileName: filename });
    return;
  }

  // =========================================================================
  // Strategy B: Adaptive Template Engine
  // Dynamic layout calculation for activity slides when raw data is passed
  // =========================================================================
  const defaultThemeColor = cleanHex(options?.accentColor || '4A7C59');
  const bgIvory = 'F7F6F2';
  const bgCard = 'FFFFFF';
  const textDark = '1E293B';
  const textMuted = '64748B';

  // 1. Cover Slide
  const coverSlide = pres.addSlide();
  coverSlide.background = { color: '2C3437' };

  coverSlide.addText('國際佛光會中華佛光青年總團 • 桃竹苗區 聯團會議', {
    x: 0.8,
    y: 0.8,
    w: 8.5,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: 'E29B27',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  coverSlide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.5,
    w: 2.8,
    h: 0.45,
    fill: { color: 'E29B27' },
    line: { color: 'E29B27' }
  });
  coverSlide.addText(reportData.reporting_period || '2026年 第三季', {
    x: 0.8,
    y: 1.5,
    w: 2.8,
    h: 0.45,
    fontSize: 12,
    bold: true,
    color: '1A2022',
    align: 'center',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  coverSlide.addText(reportData.reporting_unit || '新竹青年分團', {
    x: 0.8,
    y: 2.3,
    w: 11.0,
    h: 0.9,
    fontSize: 40,
    bold: true,
    color: 'FFFFFF',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  coverSlide.addText('團務工作報告', {
    x: 0.8,
    y: 3.3,
    w: 11.0,
    h: 0.8,
    fontSize: 34,
    bold: true,
    color: '68D391',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  coverSlide.addText('貫徹星雲大師人間佛教四大宗旨 • 熱血發心 信仰傳承', {
    x: 0.8,
    y: 4.3,
    w: 11.0,
    h: 0.5,
    fontSize: 14,
    color: 'CBD5E1',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  coverSlide.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 6.2,
    w: 11.5,
    h: 0,
    line: { color: '4A5568', width: 1 }
  });

  coverSlide.addText(`報告日期：${new Date().toLocaleDateString('zh-TW')}  ｜  指導單位：佛光山法寶寺`, {
    x: 0.8,
    y: 6.3,
    w: 11.5,
    h: 0.4,
    fontSize: 11,
    color: '94A3B8',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  // 2. Agenda Slide
  const agendaSlide = pres.addSlide();
  agendaSlide.background = { color: bgIvory };

  agendaSlide.addText('AGENDA / 工作報告綱要', {
    x: 0.8,
    y: 0.6,
    w: 6.0,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: defaultThemeColor,
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Arial'
  });

  agendaSlide.addText('四大宗旨 工作成果彙整', {
    x: 0.8,
    y: 0.9,
    w: 8.0,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: textDark,
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  const cardW = 2.65;
  const gapX = 0.3;
  const startX = 0.8;

  reportData.categories.forEach((cat, idx) => {
    const cx = startX + idx * (cardW + gapX);
    const catColor = cleanHex(cat.theme_color, defaultThemeColor);

    agendaSlide.addShape(pres.ShapeType.roundRect, {
      x: cx,
      y: 1.8,
      w: cardW,
      h: 4.5,
      fill: { color: bgCard },
      line: { color: 'CBD5E1', width: 1 }
    });

    agendaSlide.addShape(pres.ShapeType.roundRect, {
      x: cx + 0.3,
      y: 2.1,
      w: 0.8,
      h: 0.8,
      fill: { color: catColor }
    });

    agendaSlide.addText(`0${idx + 1}`, {
      x: cx + 0.3,
      y: 2.1,
      w: 0.8,
      h: 0.8,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Arial'
    });

    agendaSlide.addText(cat.short_name, {
      x: cx + 0.3,
      y: 3.1,
      w: cardW - 0.6,
      h: 0.4,
      fontSize: 15,
      bold: true,
      color: textDark,
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    agendaSlide.addText(cat.category_name, {
      x: cx + 0.3,
      y: 3.5,
      w: cardW - 0.6,
      h: 0.6,
      fontSize: 10,
      color: textMuted,
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    agendaSlide.addShape(pres.ShapeType.line, {
      x: cx + 0.3,
      y: 4.2,
      w: cardW - 0.6,
      h: 0,
      line: { color: 'E2E8F0', width: 1 }
    });

    agendaSlide.addText(`${cat.summary_stats.activity_count}`, {
      x: cx + 0.3,
      y: 4.4,
      w: cardW - 0.6,
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: catColor,
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Arial'
    });

    agendaSlide.addText('場次專案活動', {
      x: cx + 0.3,
      y: 5.1,
      w: cardW - 0.6,
      h: 0.3,
      fontSize: 10,
      color: textMuted,
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    agendaSlide.addText(`累計 ${cat.summary_stats.total_participants} 人次`, {
      x: cx + 0.3,
      y: 5.5,
      w: cardW - 0.6,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: textDark,
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });
  });

  // 3. Category Divider & Activity Slides
  for (const cat of reportData.categories) {
    if (cat.activities.length === 0) continue;
    const catColor = cleanHex(cat.theme_color, defaultThemeColor);

    // Section Divider Slide
    const divSlide = pres.addSlide();
    divSlide.background = { color: catColor };

    divSlide.addText('CHAPTER / 宗旨範疇', {
      x: 1.0,
      y: 1.6,
      w: 6.0,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: 'FFFFFF',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Arial'
    });

    divSlide.addText(cat.category_name, {
      x: 1.0,
      y: 2.2,
      w: 11.0,
      h: 1.2,
      fontSize: 38,
      bold: true,
      color: 'FFFFFF',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    divSlide.addText(
      `累計推動 ${cat.summary_stats.activity_count} 場專案活動 ｜ 觸及青年與大眾 ${cat.summary_stats.total_participants} 人次`,
      {
        x: 1.0,
        y: 3.6,
        w: 11.0,
        h: 0.6,
        fontSize: 16,
        color: 'F1F5F9',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      }
    );

    // Activity Slides with Dynamic Photo Layout
    for (const act of cat.activities) {
      const actSlide = pres.addSlide();
      actSlide.background = { color: bgIvory };

      // Top Bar: Category badge & Location
      actSlide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: 0.4,
        w: 1.8,
        h: 0.4,
        fill: { color: catColor }
      });
      actSlide.addText(cat.short_name, {
        x: 0.6,
        y: 0.4,
        w: 1.8,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      actSlide.addText(`${act.date_location}`, {
        x: 2.6,
        y: 0.4,
        w: 6.0,
        h: 0.4,
        fontSize: 11,
        bold: true,
        color: textDark,
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      actSlide.addText(reportData.reporting_unit, {
        x: 8.5,
        y: 0.4,
        w: 4.2,
        h: 0.4,
        fontSize: 10,
        color: textMuted,
        align: 'right',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      // Left Zone: Dynamic Photo Grid
      const photoZone = { x: 0.6, y: 1.0, w: 7.3, h: 5.5 };
      const rawPhotos = act.photos || [];

      if (rawPhotos.length === 0) {
        // Zero photo empty card
        actSlide.addShape(pres.ShapeType.roundRect, {
          x: photoZone.x,
          y: photoZone.y,
          w: photoZone.w,
          h: photoZone.h,
          fill: { color: bgCard },
          line: { color: 'CBD5E1', width: 1 }
        });
        actSlide.addText('（本活動現場紀錄照片保存於法寶寺青年雲端）', {
          x: photoZone.x + 0.5,
          y: 3.3,
          w: photoZone.w - 1.0,
          h: 0.5,
          fontSize: 12,
          color: textMuted,
          align: 'center',
          wrap: true,
          margin: 0,
          fit: 'shrink',
          fontFace: 'Microsoft JhengHei'
        });
      } else {
        const photoLayouts = computeDynamicPhotoLayout(rawPhotos.length, photoZone);
        for (let pIdx = 0; pIdx < photoLayouts.length; pIdx++) {
          const p = rawPhotos[pIdx];
          const layout = photoLayouts[pIdx];

          // Photo card container
          actSlide.addShape(pres.ShapeType.roundRect, {
            x: layout.cardX,
            y: layout.cardY,
            w: layout.cardW,
            h: layout.cardH,
            fill: { color: bgCard },
            line: { color: 'CBD5E1', width: 1 }
          });

          // Safe image insertion with sizing: cover
          await safeAddImage(actSlide, {
            path: p.url,
            x: layout.imgX,
            y: layout.imgY,
            w: layout.imgW,
            h: layout.imgH,
            sizing: { type: 'cover', w: layout.imgW, h: layout.imgH },
            altText: p.caption || `佐證相片 ${pIdx + 1}`
          });

          // Non-overlapping caption
          actSlide.addText(p.caption || `佐證紀錄 0${pIdx + 1}`, {
            x: layout.capX,
            y: layout.capY,
            w: layout.capW,
            h: layout.capH,
            fontSize: 8.5,
            bold: true,
            color: textDark,
            wrap: true,
            margin: 0,
            fit: 'shrink',
            fontFace: 'Microsoft JhengHei'
          });
        }
      }

      // Right Column: Info Panel
      const rightX = 8.15;
      const rightW = 4.55;

      actSlide.addShape(pres.ShapeType.roundRect, {
        x: rightX,
        y: 1.0,
        w: rightW,
        h: 5.5,
        fill: { color: bgCard },
        line: { color: 'CBD5E1', width: 1 }
      });

      // Activity Name
      actSlide.addText(act.activity_name, {
        x: rightX + 0.25,
        y: 1.2,
        w: rightW - 0.5,
        h: 0.7,
        fontSize: 15,
        bold: true,
        color: textDark,
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      // Attendance Counter Card
      actSlide.addShape(pres.ShapeType.roundRect, {
        x: rightX + 0.25,
        y: 2.0,
        w: rightW - 0.5,
        h: 1.3,
        fill: { color: 'F8FAFC' },
        line: { color: 'E2E8F0', width: 1 }
      });

      actSlide.addText('累計參與總人次', {
        x: rightX + 0.25,
        y: 2.08,
        w: rightW - 0.5,
        h: 0.3,
        fontSize: 9,
        color: textMuted,
        align: 'center',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      actSlide.addText(`${act.participants.total}`, {
        x: rightX + 0.25,
        y: 2.32,
        w: rightW - 0.5,
        h: 0.6,
        fontSize: 26,
        bold: true,
        color: catColor,
        align: 'center',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Arial'
      });

      actSlide.addText(`青年 ${act.participants.internal} 人  •  大眾/貴賓 ${act.participants.external} 人`, {
        x: rightX + 0.25,
        y: 2.92,
        w: rightW - 0.5,
        h: 0.3,
        fontSize: 8.5,
        bold: true,
        color: textDark,
        align: 'center',
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      // Highlights List
      actSlide.addText('活動亮點與成效紀要：', {
        x: rightX + 0.25,
        y: 3.45,
        w: rightW - 0.5,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: textDark,
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      const bullets = act.key_highlights.length > 0
        ? act.key_highlights.slice(0, 4).map(h => ({ 
            text: h, 
            options: { bullet: true, fontSize: 9, color: textDark, wrap: true, margin: 0, fit: 'shrink' } 
          }))
        : [{ 
            text: '貫徹星雲大師人間佛教精神與三好四給精神。', 
            options: { bullet: true, fontSize: 9, color: textDark, wrap: true, margin: 0, fit: 'shrink' } 
          }];

      actSlide.addText(bullets as any, {
        x: rightX + 0.25,
        y: 3.8,
        w: rightW - 0.5,
        h: 2.5,
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });

      // Bottom Status bar
      actSlide.addText(`${reportData.meeting_report_title} ｜ 佛光山法寶寺指導`, {
        x: 0.6,
        y: 6.7,
        w: 12.0,
        h: 0.3,
        fontSize: 8.5,
        color: textMuted,
        wrap: true,
        margin: 0,
        fit: 'shrink',
        fontFace: 'Microsoft JhengHei'
      });
    }
  }

  // 4. Statistical Summary (4 Pillars)
  const sumSlide = pres.addSlide();
  sumSlide.background = { color: bgIvory };

  sumSlide.addText('SUMMARY STATISTICS / 成果總結', {
    x: 0.8,
    y: 0.6,
    w: 6.0,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: defaultThemeColor,
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Arial'
  });

  sumSlide.addText(`${reportData.reporting_period} 成果數據統計`, {
    x: 0.8,
    y: 0.9,
    w: 8.0,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: textDark,
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  reportData.categories.forEach((cat, idx) => {
    const cx = startX + idx * (cardW + gapX);
    const catColor = cleanHex(cat.theme_color, defaultThemeColor);

    sumSlide.addShape(pres.ShapeType.roundRect, {
      x: cx,
      y: 1.7,
      w: cardW,
      h: 3.8,
      fill: { color: catColor }
    });

    sumSlide.addText(cat.short_name, {
      x: cx + 0.2,
      y: 1.9,
      w: cardW - 0.4,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    sumSlide.addText(cat.category_name, {
      x: cx + 0.2,
      y: 2.3,
      w: cardW - 0.4,
      h: 0.3,
      fontSize: 9.5,
      color: 'F1F5F9',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    sumSlide.addText(`${cat.summary_stats.activity_count}`, {
      x: cx + 0.2,
      y: 2.8,
      w: cardW - 0.4,
      h: 0.8,
      fontSize: 34,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Arial'
    });

    sumSlide.addText('場次活動', {
      x: cx + 0.2,
      y: 3.6,
      w: cardW - 0.4,
      h: 0.3,
      fontSize: 10,
      color: 'FFFFFF',
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });

    sumSlide.addText(`累計 ${cat.summary_stats.total_participants} 人次`, {
      x: cx + 0.2,
      y: 4.2,
      w: cardW - 0.4,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    });
  });

  // Grand total bar
  sumSlide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 5.7,
    w: 11.5,
    h: 0.7,
    fill: { color: bgCard },
    line: { color: 'CBD5E1', width: 1 }
  });

  sumSlide.addText(
    `全期工作成果總結算：共計舉辦 ${reportData.grand_total.total_activities} 場次  ｜  累計總參與 ${reportData.grand_total.total_participants} 人次`,
    {
      x: 1.0,
      y: 5.7,
      w: 11.1,
      h: 0.7,
      fontSize: 13,
      bold: true,
      color: textDark,
      align: 'center',
      wrap: true,
      margin: 0,
      fit: 'shrink',
      fontFace: 'Microsoft JhengHei'
    }
  );

  // 5. Thank You Slide
  const tySlide = pres.addSlide();
  tySlide.background = { color: '2C3437' };

  tySlide.addText('BLIA YOUTH MOVEMENT', {
    x: 1.0,
    y: 1.8,
    w: 11.0,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: 'E29B27',
    align: 'center',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Arial'
  });

  tySlide.addText('謝謝大家', {
    x: 1.0,
    y: 2.4,
    w: 11.0,
    h: 1.0,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  tySlide.addText('國際佛光會中華佛光青年總團 • 新竹佛光青年分團\n青年同心 同道同修 • 人間佛教 廣度有情', {
    x: 1.0,
    y: 3.6,
    w: 11.0,
    h: 0.8,
    fontSize: 14,
    color: 'CBD5E1',
    align: 'center',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  tySlide.addText('指導單位：佛光山法寶寺', {
    x: 1.0,
    y: 5.5,
    w: 11.0,
    h: 0.4,
    fontSize: 11,
    color: '94A3B8',
    align: 'center',
    wrap: true,
    margin: 0,
    fit: 'shrink',
    fontFace: 'Microsoft JhengHei'
  });

  // Write file to user's machine
  const filename = `${reportData.reporting_unit || '新竹青年分團'}_工作報告簡報_${(reportData.reporting_period || '2026').replace(/\s+/g, '')}.pptx`;
  await pres.writeFile({ fileName: filename });
}

/**
 * Phase 2: WYSIWYG High-Resolution Image-Based PPTX Export (WYSIWYG 100% 滿版無損簡報)
 * Renders each slide at 1920x1080 resolution using html2canvas and embeds it as a
 * full-bleed 16:9 slide image in PowerPoint.
 * Guarantees zero layout shift, zero font mismatch, and exact pixel-perfect fidelity.
 */
export async function exportSlidesAsImagePptxFile(
  reportData: MeetingReportData,
  options?: SlideCustomOptions,
  slidesInput?: Slide[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<void> {
  const slides = (slidesInput && slidesInput.length > 0)
    ? slidesInput
    : buildSlidesFromReportData(reportData, options?.layoutMode, options?.themeId);

  if (slides.length === 0) {
    throw new Error('No slides available to export');
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9 widescreen)
  pres.title = reportData.meeting_report_title || '工作報告簡報';
  pres.author = reportData.reporting_unit || '國際佛光會青年分團';

  const RENDER_WIDTH = 1920;
  const RENDER_HEIGHT = 1080;

  const container = document.createElement('div');
  container.id = 'pptx-image-offscreen-stage';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = `${RENDER_WIDTH}px`;
  container.style.height = `${RENDER_HEIGHT}px`;
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

      const bgColor = slide.style?.bgColor || (slide.type === 'cover' || slide.type === 'thank_you' ? '#2C3437' : '#F7F6F2');
      const bgImage = slide.style?.bgImageUrl || options?.customBgUrl;
      const bgStyle = bgImage
        ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;`
        : `background-color: ${bgColor};`;

      const sortedElements = [...slide.elements].sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));
      const elementsHtml = sortedElements.map(elem => renderSlideElementHtml(elem)).join('\n');

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
        imageTimeout: 5000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Explicitly release canvas memory buffer
      canvas.width = 0;
      canvas.height = 0;
      container.innerHTML = '';

      const pSlide = pres.addSlide();
      pSlide.background = { color: cleanHex(bgColor) };

      pSlide.addImage({
        data: imgData,
        x: 0,
        y: 0,
        w: PPT_WIDTH_INCH,
        h: PPT_HEIGHT_INCH,
        sizing: { type: 'cover', w: PPT_WIDTH_INCH, h: PPT_HEIGHT_INCH }
      });

      // Small async delay between slides to allow GC
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    if (onProgress) {
      onProgress(totalSlides, totalSlides, 'PPTX 封裝完成，正在下載...');
    }

    const filename = `${reportData.reporting_unit || '新竹青年分團'}_工作報告_高畫質16x9_${(reportData.reporting_period || '2026').replace(/\s+/g, '')}.pptx`;
    await pres.writeFile({ fileName: filename });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
