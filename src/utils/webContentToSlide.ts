import { Slide, SlideElement } from '../types';

export interface ExtractedWebSlideData {
  title: string;
  sourceUrl: string;
  engine: 'firecrawl' | 'playwright';
  summary: string;
  bulletPoints: string[];
  keywords: string[];
  rawContent: string;
}

/**
 * 將原始 Markdown 或純文字透過規則演算法進行結構化分解
 */
export function parseWebContentLocally(
  rawText: string,
  url: string,
  engine: 'firecrawl' | 'playwright',
  fallbackTitle?: string
): ExtractedWebSlideData {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let title = fallbackTitle || '';
  const bulletPoints: string[] = [];
  const paragraphs: string[] = [];

  // 解析第一條非空的 H1 / 粗體或純文字做為標題
  for (const line of lines) {
    if (!title) {
      if (line.startsWith('# ')) {
        title = line.replace(/^#\s+/, '').trim();
        continue;
      }
      if (line.startsWith('## ')) {
        title = line.replace(/^##\s+/, '').trim();
        continue;
      }
      if (line.length > 5 && line.length < 50 && !line.startsWith('![')) {
        title = line.replace(/^[*_#]+\s*/, '').replace(/[*_#]+$/, '').trim();
        continue;
      }
    }

    // 項目清單辨識
    if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
      const cleanBullet = line.replace(/^[-*•\d.]+\s+/, '').replace(/[*_`]/g, '').trim();
      if (cleanBullet.length > 8 && bulletPoints.length < 6) {
        bulletPoints.push(cleanBullet);
      }
      continue;
    }

    // 段落辨識
    if (line.length > 30 && !line.startsWith('!') && !line.startsWith('[') && !line.startsWith('http')) {
      if (paragraphs.length < 4) {
        paragraphs.push(line.replace(/[*_`#]/g, '').trim());
      }
    }
  }

  if (!title) {
    try {
      const parsedUrl = new URL(url);
      title = `網頁內容摘要 - ${parsedUrl.hostname}`;
    } catch {
      title = '外部網頁擷取重點彙整';
    }
  }

  // 提取關鍵字詞
  const sampleText = `${title} ${paragraphs.join(' ')}`;
  const extractedKeywords = Array.from(
    new Set(
      sampleText
        .split(/[\s,，、。:：\n()（）]+/)
        .filter((w) => w.length >= 3 && w.length <= 10 && !w.includes('http'))
    )
  ).slice(0, 5);

  const summary = paragraphs[0] || (bulletPoints[0] ? `重點彙整：${bulletPoints[0]}` : '已自目標網頁成功擷取純淨內容');

  return {
    title,
    sourceUrl: url,
    engine,
    summary,
    bulletPoints: bulletPoints.length > 0 ? bulletPoints : paragraphs.slice(0, 4),
    keywords: extractedKeywords,
    rawContent: rawText,
  };
}

/**
 * 依據擷取的網頁資料，產生一頁全新的 16:9 投影片
 */
export function createSlideFromWebScrape(
  data: ExtractedWebSlideData,
  themeAccentColor: string = '#E29B27'
): Slide {
  const slideId = `slide_web_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const elements: SlideElement[] = [
    // 頂部來源徽章
    {
      id: `el_badge_${Date.now()}_1`,
      type: 'badge',
      x: 6,
      y: 6,
      w: 24,
      h: 5,
      content: data.engine === 'firecrawl' ? '⚡ Firecrawl 雲端結構化擷取' : '🎭 Playwright 深度動態渲染',
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
      bgColor: data.engine === 'firecrawl' ? '#D97706' : '#2563EB',
      borderRadius: 999,
      textAlign: 'center',
    },

    // 網址小標
    {
      id: `el_url_${Date.now()}_2`,
      type: 'text',
      x: 32,
      y: 7,
      w: 62,
      h: 4,
      content: `來源：${data.sourceUrl.slice(0, 60)}${data.sourceUrl.length > 60 ? '...' : ''}`,
      fontSize: 11,
      color: '#78716C',
      textAlign: 'left',
    },

    // 簡報主標題
    {
      id: `el_title_${Date.now()}_3`,
      type: 'heading',
      x: 6,
      y: 13,
      w: 88,
      h: 12,
      content: data.title,
      fontSize: 26,
      fontWeight: 'black',
      color: '#1C1917',
      textAlign: 'left',
    },

    // 左側核心摘要卡片
    {
      id: `el_card_left_${Date.now()}_4`,
      type: 'text',
      x: 6,
      y: 28,
      w: 42,
      h: 64,
      title: '📌 核心內容提要',
      content: `${data.summary}\n\n${data.keywords.length > 0 ? `🏷️ 關聯核心詞：\n${data.keywords.map((k) => `• ${k}`).join('\n')}` : ''}`,
      fontSize: 14,
      color: '#292524',
      bgColor: '#F5F5F4',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12,
      textAlign: 'left',
      shadow: true,
    },

    // 右側重點條列卡片
    {
      id: `el_card_right_${Date.now()}_5`,
      type: 'text',
      x: 51,
      y: 28,
      w: 43,
      h: 64,
      title: '🎯 關鍵洞察與項目條列',
      content: data.bulletPoints.length > 0
        ? data.bulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join('\n\n')
        : '（無額外條列項目，請參照左側摘要內容）',
      fontSize: 13,
      color: '#1C1917',
      bgColor: '#FFFFFF',
      borderColor: themeAccentColor,
      borderWidth: 2,
      borderRadius: 12,
      textAlign: 'left',
      shadow: true,
    },
  ];

  return {
    id: slideId,
    type: 'summary',
    title: data.title,
    subtitle: `網頁擷取重點 (${data.engine.toUpperCase()})`,
    layoutMode: 'two_columns',
    style: {
      bgType: 'solid',
      bgColor: '#FAFAF9',
    },
    elements,
  };
}

/**
 * 建立一個單一文字方塊或卡片 Element，用於插入使用者目前正檢視的投影片
 */
export function createElementsForCurrentSlide(
  data: ExtractedWebSlideData,
  existingCount: number = 0
): SlideElement {
  const elementId = `el_scraped_text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const contentText = `【${data.title}】\n\n${data.summary}\n\n${data.bulletPoints.slice(0, 3).map((bp) => `• ${bp}`).join('\n')}`;

  return {
    id: elementId,
    type: 'text',
    x: Math.min(10 + (existingCount % 4) * 5, 45),
    y: Math.min(25 + (existingCount % 4) * 6, 45),
    w: 48,
    h: 46,
    title: `網頁萃取內容 (${data.engine.toUpperCase()})`,
    content: contentText,
    fontSize: 14,
    color: '#1C1917',
    bgColor: '#FFFFFF',
    borderColor: data.engine === 'firecrawl' ? '#D97706' : '#2563EB',
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'left',
    shadow: true,
  };
}
