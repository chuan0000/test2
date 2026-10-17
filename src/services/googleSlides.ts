/**
 * Google Slides API service
 * Handles Google Slides presentation creation, batch updates, reading, and exporting
 */

import { Slide, SlideElement } from '../types';

export interface GooglePresentationItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface SlideExportResult {
  presentationId: string;
  presentationUrl: string;
  title: string;
  slideCount: number;
}

/**
 * Converts a hex color string (#RRGGBB) to Google Slides RGB float (0.0 - 1.0)
 */
export const hexToRgbFloat = (hex?: string) => {
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return { red: 0.1, green: 0.1, blue: 0.1 };
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { red: r, green: g, blue: b };
};

/**
 * Generates a valid Google Slides object ID
 * Must start with [a-zA-Z0-9_] and contain only [a-zA-Z0-9_:-], length 5-50.
 */
const makeSlideObjectId = (prefix: string, index: number, subIndex?: number): string => {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 10);
  const rand = Math.random().toString(36).substring(2, 6);
  const sub = subIndex !== undefined ? `_${subIndex}` : '';
  return `${cleanPrefix}_${index}${sub}_${rand}`.slice(0, 48);
};

/**
 * Sanitizes text content to ensure Google Slides API does NOT crash with 500.
 * Strips Base64 data URIs, binary text, and non-printable control characters.
 */
const sanitizeTextForSlides = (text?: string, maxLen = 3000): string => {
  if (!text) return '';
  // Strictly prevent inserting Base64 data URIs or binary dumps as text
  if (text.startsWith('data:image') || text.startsWith('data:application')) {
    return '';
  }
  // Strip non-printable ASCII control characters (keep newlines and tabs)
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLen);
};

/**
 * Lists Google Slides presentations from user's Drive
 */
export const listGoogleSlides = async (
  accessToken: string,
  searchQuery?: string
): Promise<GooglePresentationItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.presentation' and trashed = false";
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const fields = encodeURIComponent(
    'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,thumbnailLink)'
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
    console.error('Google Drive listSlides error:', errText);
    throw new Error(`無法讀取 Google 簡報清單 (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Gets presentation structure from Google Slides API
 */
export const getGooglePresentation = async (
  accessToken: string,
  presentationId: string
): Promise<any> => {
  const url = `https://slides.googleapis.com/v1/presentations/${presentationId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Slides get error:', errText);
    throw new Error(`無法讀取 Google 簡報檔案 (${response.status})`);
  }

  return await response.json();
};

/**
 * Creates a brand new empty Google Slides presentation with retry on 503/500/429
 */
export const createGooglePresentation = async (
  accessToken: string,
  title: string,
  retries = 3
): Promise<{ presentationId: string; initialSlideId?: string }> => {
  const url = 'https://slides.googleapis.com/v1/presentations';
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff delay (1s, 2s, 3s)
        await new Promise((res) => setTimeout(res, attempt * 1000));
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        const initialSlideId = data.slides?.[0]?.objectId;
        return {
          presentationId: data.presentationId,
          initialSlideId,
        };
      }

      const errText = await response.text();
      let parsedMsg = '';
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.error?.message || '';
      } catch {}

      console.warn(`Google Slides create attempt ${attempt + 1} failed (${response.status}):`, parsedMsg || errText);
      lastError = new Error(
        parsedMsg
          ? `建立 Google 簡報失敗 (${response.status}): ${parsedMsg}`
          : `建立 Google 簡報失敗 (${response.status})`
      );

      // Only retry on transient errors (503, 500, 429)
      if (response.status !== 503 && response.status !== 500 && response.status !== 429) {
        throw lastError;
      }
    } catch (err: any) {
      lastError = err;
      if (attempt === retries) throw err;
    }
  }

  throw lastError;
};

/**
 * Sends a single batch update request to Google Slides API with retry mechanism & smart 429 backoff
 */
export const executeSingleBatchUpdate = async (
  accessToken: string,
  presentationId: string,
  requests: any[],
  retries = 4
): Promise<any> => {
  if (!requests || requests.length === 0) return;

  const url = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Generous exponential backoff delay for rate limits: 2s, 5s, 10s, 20s
        const backoffMs = attempt === 1 ? 2000 : attempt === 2 ? 5000 : attempt === 3 ? 10000 : 20000;
        console.warn(`[Google Slides] Retrying after backoff (${backoffMs}ms)... attempt ${attempt + 1}/${retries + 1}`);
        await new Promise((res) => setTimeout(res, backoffMs));
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (response.ok) {
        return await response.json();
      }

      const errText = await response.text();
      let parsedMessage = '';
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.error?.message || '';
      } catch {}

      console.warn(`Google Slides batchUpdate attempt ${attempt + 1} failed (${response.status}):`, parsedMessage || errText);
      lastError = new Error(
        parsedMessage
          ? `更新 Google 簡報內容失敗 (${response.status}): ${parsedMessage}`
          : `更新 Google 簡報內容失敗 (${response.status})`
      );

      // Only retry on 500, 503, 429
      if (response.status !== 500 && response.status !== 503 && response.status !== 429) {
        throw lastError;
      }

      // If it's a 429 Rate Limit, ensure extra sleep on the first detection
      if (response.status === 429 && attempt < retries) {
        console.warn(`[Google Slides] Hit 429 Quota Exceeded. Entering backoff window before retry ${attempt + 1}`);
      }
    } catch (fetchErr: any) {
      lastError = fetchErr;
      if (attempt === retries) throw fetchErr;
    }
  }

  throw lastError;
};

/**
 * Sends batch update requests chunked into optimal batches (50-80 requests each)
 * to respect Google Slides API quotas (60 write requests/min/user) while keeping payload sizes safe.
 */
export const batchUpdateGoogleSlides = async (
  accessToken: string,
  presentationId: string,
  requests: any[],
  onChunkProgress?: (completedChunks: number, totalChunks: number) => void
): Promise<any> => {
  if (!requests || requests.length === 0) return;

  // Batch size: 60 requests per batch strikes the ideal balance between
  // reducing HTTP round-trips and staying well below the 500 internal payload limits.
  const CHUNK_SIZE = 60;
  const chunks: any[][] = [];
  for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
    chunks.push(requests.slice(i, i + CHUNK_SIZE));
  }

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    try {
      await executeSingleBatchUpdate(accessToken, presentationId, chunk);
    } catch (err: any) {
      console.warn(`Chunk ${cIdx + 1}/${chunks.length} 遭遇錯誤，嘗試以微批次 (15 筆) 分割執行...`, err);
      // Fallback: subdivide into smaller sub-batches of 15 requests
      const subChunks: any[][] = [];
      for (let s = 0; s < chunk.length; s += 15) {
        subChunks.push(chunk.slice(s, s + 15));
      }
      for (const sub of subChunks) {
        try {
          await executeSingleBatchUpdate(accessToken, presentationId, sub, 3);
          // Rate-limiting buffer
          await new Promise((r) => setTimeout(r, 400));
        } catch (subErr) {
          console.error('Sub-chunk execution failed:', subErr);
          // Ignore non-fatal styling failures so whole export does not fail
        }
      }
    }

    if (onChunkProgress) {
      onChunkProgress(cIdx + 1, chunks.length);
    }

    // Gentle pacing between batches to respect the 60 writes/min quota
    if (cIdx < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
};

/**
 * Exports Canva Studio slides into a new Google Slides presentation
 * Built with multi-phase chunking and safe image/text parsing to avoid 500 server crashes.
 */
export const exportSlidesToGoogleSlides = async (
  accessToken: string,
  presentationTitle: string,
  slides: Slide[],
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<SlideExportResult> => {
  if (!slides || slides.length === 0) {
    throw new Error('目前沒有任何投影片可供匯出');
  }

  const totalSteps = slides.length + 3;

  // Step 1: Create the presentation file
  if (onProgress) onProgress('正在建立 Google 簡報檔案...', 1, totalSteps);
  const { presentationId, initialSlideId } = await createGooglePresentation(
    accessToken,
    presentationTitle
  );

  // Canvas standard 16:9 dimensions in Google Slides (points: 720 x 405)
  const SLIDE_WIDTH_PT = 720;
  const SLIDE_HEIGHT_PT = 405;
  const FALLBACK_PUBLIC_IMAGE = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';

  // Step 2: Create all blank slides in Phase 1
  if (onProgress) onProgress('正在初始化投影片版面架構...', 2, totalSteps);

  const slideObjectIds: string[] = [];
  const createSlideRequests: any[] = [];

  for (let idx = 0; idx < slides.length; idx++) {
    const slideObjId = makeSlideObjectId('gslide', idx);
    slideObjectIds.push(slideObjId);

    createSlideRequests.push({
      createSlide: {
        objectId: slideObjId,
        insertionIndex: idx,
        slideLayoutReference: {
          predefinedLayout: 'BLANK',
        },
      },
    });
  }

  // Create all slides in safe structural batches (20 per request)
  for (let i = 0; i < createSlideRequests.length; i += 20) {
    const chunk = createSlideRequests.slice(i, i + 20);
    await executeSingleBatchUpdate(accessToken, presentationId, chunk, 3);
  }

  // Step 3: Delete initial default template slide if present
  if (initialSlideId) {
    try {
      await executeSingleBatchUpdate(accessToken, presentationId, [
        {
          deleteObject: {
            objectId: initialSlideId,
          },
        },
      ]);
    } catch (delErr) {
      console.warn('Initial slide deletion skipped or already cleaned up:', delErr);
    }
  }

  // Step 4: Collect all styling, text, background, and shape updates across all slides
  const allContentRequests: any[] = [];

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const slideObjId = slideObjectIds[idx];

    // A. Page Background Color
    if (slide.style?.bgColor) {
      const rgb = hexToRgbFloat(slide.style.bgColor);
      allContentRequests.push({
        updatePageProperties: {
          objectId: slideObjId,
          pageProperties: {
            pageBackgroundFill: {
              solidFill: {
                color: { rgbColor: rgb },
              },
            },
          },
          fields: 'pageBackgroundFill.solidFill.color',
        },
      });
    }

    // B. Title text box
    const titleObjId = makeSlideObjectId(`ttl_${idx}`, 0);
    allContentRequests.push({
      createShape: {
        objectId: titleObjId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideObjId,
          size: {
            width: { magnitude: SLIDE_WIDTH_PT - 80, unit: 'PT' },
            height: { magnitude: 45, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 40,
            translateY: 25,
            unit: 'PT',
          },
        },
      },
    });

    const rawTitle = slide.title || `第 ${idx + 1} 頁 成果報告`;
    const cleanTitle = sanitizeTextForSlides(rawTitle, 200) || `第 ${idx + 1} 頁`;

    allContentRequests.push({
      insertText: {
        objectId: titleObjId,
        insertionIndex: 0,
        text: cleanTitle,
      },
    });

    allContentRequests.push({
      updateTextStyle: {
        objectId: titleObjId,
        textRange: { type: 'ALL' },
        style: {
          bold: true,
          fontSize: { magnitude: 22, unit: 'PT' },
          foregroundColor: {
            opaqueColor: {
              rgbColor: slide.style?.bgColor === '#1C1917' ? { red: 0.95, green: 0.95, blue: 0.95 } : { red: 0.15, green: 0.2, blue: 0.2 },
            },
          },
        },
        fields: 'bold,fontSize,foregroundColor',
      },
    });

    // C. Subtitle text box if present
    if (slide.subtitle || slide.category) {
      const subObjId = makeSlideObjectId(`sub_${idx}`, 1);
      allContentRequests.push({
        createShape: {
          objectId: subObjId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjId,
            size: {
              width: { magnitude: SLIDE_WIDTH_PT - 80, unit: 'PT' },
              height: { magnitude: 25, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 40,
              translateY: 72,
              unit: 'PT',
            },
          },
        },
      });

      const rawSub = slide.subtitle || `類別：${slide.category || '佛光青年活動'}`;
      const cleanSub = sanitizeTextForSlides(rawSub, 300);

      if (cleanSub) {
        allContentRequests.push({
          insertText: {
            objectId: subObjId,
            insertionIndex: 0,
            text: cleanSub,
          },
        });

        allContentRequests.push({
          updateTextStyle: {
            objectId: subObjId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 12, unit: 'PT' },
              foregroundColor: {
                opaqueColor: {
                  rgbColor: { red: 0.45, green: 0.5, blue: 0.5 },
                },
              },
            },
            fields: 'fontSize,foregroundColor',
          },
        });
      }
    }

    // D. Slide Elements
    if (slide.elements && slide.elements.length > 0) {
      slide.elements.forEach((el, elIdx) => {
        const elObjId = makeSlideObjectId(`el_${idx}`, elIdx);

        // Coordinate conversion (percentage -> points)
        const posX = Math.max(10, Math.min(SLIDE_WIDTH_PT - 40, Math.round((el.x / 100) * SLIDE_WIDTH_PT)));
        const posY = Math.max(10, Math.min(SLIDE_HEIGHT_PT - 40, Math.round((el.y / 100) * SLIDE_HEIGHT_PT)));
        const posW = Math.max(40, Math.min(SLIDE_WIDTH_PT - posX, Math.round((el.w / 100) * SLIDE_WIDTH_PT)));
        const posH = Math.max(25, Math.min(SLIDE_HEIGHT_PT - posY, Math.round((el.h / 100) * SLIDE_HEIGHT_PT)));

        // Handle Photo / Media elements safely
        if (el.type === 'photo' || el.type === 'media') {
          const isHttpUrl = el.content && (el.content.startsWith('http://') || el.content.startsWith('https://'));
          const imageUrl = isHttpUrl ? el.content : FALLBACK_PUBLIC_IMAGE;

          // Add image to slide
          allContentRequests.push({
            createImage: {
              objectId: elObjId,
              url: imageUrl,
              elementProperties: {
                pageObjectId: slideObjId,
                size: {
                  width: { magnitude: posW, unit: 'PT' },
                  height: { magnitude: posH, unit: 'PT' },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: posX,
                  translateY: posY,
                  unit: 'PT',
                },
              },
            },
          });

          // If photo has a title/caption, add a small caption tag below the photo
          if (el.title && el.title.trim()) {
            const capObjId = makeSlideObjectId(`cap_${idx}`, elIdx);
            const capY = Math.min(SLIDE_HEIGHT_PT - 20, posY + posH + 2);
            allContentRequests.push({
              createShape: {
                objectId: capObjId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideObjId,
                  size: {
                    width: { magnitude: posW, unit: 'PT' },
                    height: { magnitude: 20, unit: 'PT' },
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: posX,
                    translateY: capY,
                    unit: 'PT',
                  },
                },
              },
            });

            const cleanCap = sanitizeTextForSlides(el.title, 100);
            if (cleanCap) {
              allContentRequests.push({
                insertText: {
                  objectId: capObjId,
                  insertionIndex: 0,
                  text: cleanCap,
                },
              });
              allContentRequests.push({
                updateTextStyle: {
                  objectId: capObjId,
                  textRange: { type: 'ALL' },
                  style: {
                    fontSize: { magnitude: 10, unit: 'PT' },
                    foregroundColor: {
                      opaqueColor: { rgbColor: { red: 0.45, green: 0.45, blue: 0.45 } },
                    },
                  },
                  fields: 'fontSize,foregroundColor',
                },
              });
            }
          }
          return;
        }

        // Standard Shapes & Text Boxes
        const shapeType = el.type === 'badge' ? 'ROUND_RECTANGLE' : (el.type === 'shape' ? 'RECTANGLE' : 'TEXT_BOX');

        allContentRequests.push({
          createShape: {
            objectId: elObjId,
            shapeType: shapeType,
            elementProperties: {
              pageObjectId: slideObjId,
              size: {
                width: { magnitude: posW, unit: 'PT' },
                height: { magnitude: posH, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: posX,
                translateY: posY,
                unit: 'PT',
              },
            },
          },
        });

        // Set background color if present
        if (el.bgColor) {
          const bgRgb = hexToRgbFloat(el.bgColor);
          allContentRequests.push({
            updateShapeProperties: {
              objectId: elObjId,
              shapeProperties: {
                shapeBackgroundFill: {
                  solidFill: {
                    color: { rgbColor: bgRgb },
                  },
                },
              },
              fields: 'shapeBackgroundFill.solidFill.color',
            },
          });
        }

        // Format Text Content (Handles text, KPI, quote, tables)
        let textToInsert = '';
        if (el.type === 'number_kpi') {
          const num = sanitizeTextForSlides(el.content, 50);
          const label = sanitizeTextForSlides(el.title, 100);
          textToInsert = `${num}\n${label}`.trim();
        } else if (el.type === 'table' && el.tableData && el.tableData.length > 0) {
          textToInsert = el.tableData
            .map((row) => row.join('  |  '))
            .join('\n')
            .slice(0, 1500);
        } else {
          const raw = el.content || el.title || '';
          textToInsert = sanitizeTextForSlides(raw, 2500);
        }

        if (textToInsert.trim()) {
          allContentRequests.push({
            insertText: {
              objectId: elObjId,
              insertionIndex: 0,
              text: textToInsert,
            },
          });

          // Style text
          const fontPt = el.fontSize ? Math.min(36, Math.max(9, Math.round(el.fontSize * 0.75))) : 12;
          const textRgb = hexToRgbFloat(el.color || '#2C3437');

          allContentRequests.push({
            updateTextStyle: {
              objectId: elObjId,
              textRange: { type: 'ALL' },
              style: {
                fontSize: { magnitude: fontPt, unit: 'PT' },
                bold: el.fontWeight === 'bold' || el.fontWeight === 'black' || el.type === 'number_kpi',
                foregroundColor: {
                  opaqueColor: { rgbColor: textRgb },
                },
              },
              fields: 'fontSize,bold,foregroundColor',
            },
          });
        }
      });
    }
  }

  // Execute all accumulated content requests in optimized chunks (60 requests per chunk)
  // This drastically reduces total HTTP calls (e.g. from 50 calls down to 3-5 calls),
  // preventing user write quota exhaustion (60 writes/min/user limit).
  if (allContentRequests.length > 0) {
    await batchUpdateGoogleSlides(
      accessToken,
      presentationId,
      allContentRequests,
      (done, total) => {
        if (onProgress) {
          onProgress(`正在同步投影片內容至 Google 簡報 (進度 ${done}/${total})...`, 2 + done, 2 + total);
        }
      }
    );
  }

  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  if (onProgress) onProgress('Google 簡報匯出完成！', totalSteps, totalSteps);

  return {
    presentationId,
    presentationUrl,
    title: presentationTitle,
    slideCount: slides.length,
  };
};

/**
 * Imports slides from a Google Slides presentation into Canva Studio format
 */
export const importGooglePresentationToSlides = (presentationData: any): Slide[] => {
  if (!presentationData?.slides || presentationData.slides.length === 0) {
    return [];
  }

  return presentationData.slides.map((gSlide: any, index: number) => {
    let title = `Google 簡報第 ${index + 1} 頁`;
    const elements: SlideElement[] = [];

    // Traverse pageElements
    if (gSlide.pageElements) {
      gSlide.pageElements.forEach((pe: any, peIdx: number) => {
        if (pe.shape?.text) {
          const textPieces: string[] = [];
          for (const textElem of pe.shape.text.textElements || []) {
            if (textElem.textRun?.content) {
              textPieces.push(textElem.textRun.content);
            }
          }
          const text = textPieces.join('').trim();
          if (text) {
            // First prominent text or placeholder could be title
            if (peIdx === 0 || pe.shape.placeholder?.type === 'TITLE') {
              title = text;
            } else {
              elements.push({
                id: `elem-gslide-${index}-${peIdx}`,
                type: 'text',
                x: 10 + (peIdx % 3) * 28,
                y: 25 + Math.floor(peIdx / 3) * 22,
                w: 26,
                h: 18,
                content: text,
                fontSize: 14,
                color: '#2C3437',
              });
            }
          }
        }
      });
    }

    return {
      id: `imported-gslide-${index}-${Date.now()}`,
      title,
      category: 'Google 簡報匯入',
      layoutMode: 'freeform',
      style: {
        bgType: 'solid',
        bgColor: '#FDFBF7',
      },
      elements,
    };
  });
};

