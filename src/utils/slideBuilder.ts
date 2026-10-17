import { MeetingReportData, PPTActivityItem, PPTCategorySummary } from '../components/MeetingReportSlidesSection';
import { Slide, SlideElement } from '../types';

/**
 * Builds the standard Slide[] array from MeetingReportData.
 * Every slide is populated with structured SlideElement objects, establishing
 * a Single Source of Truth for both presentation preview and the Canva-style editor.
 */
export function buildSlidesFromReportData(
  reportData: MeetingReportData,
  layoutMode: Slide['layoutMode'] = 'quad_photos',
  themeId?: string
): Slide[] {
  const slides: Slide[] = [];

  // ====================================================
  // 1. Cover Slide
  // ====================================================
  slides.push({
    id: 'slide-cover-0',
    type: 'cover',
    title: reportData.reporting_unit || '國際佛光會新竹青年分團',
    subtitle: reportData.reporting_period || '2026年 第三季',
    layoutMode: 'minimal',
    style: {
      bgColor: '#2C3437',
      textColor: '#FFFFFF'
    },
    elements: [
      {
        id: 'elem-cover-header-badge',
        type: 'badge',
        x: 6,
        y: 6,
        w: 42,
        h: 5,
        content: '國際佛光會中華佛光青年總團 • 桃竹苗區 聯團會議',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#E29B27',
        bgColor: 'transparent',
        textAlign: 'left'
      },
      {
        id: 'elem-cover-period-pill',
        type: 'badge',
        x: 74,
        y: 6,
        w: 20,
        h: 5.5,
        content: reportData.reporting_period || '2026年 第三季',
        fontSize: 12,
        fontWeight: 'black',
        color: '#1A2022',
        bgColor: '#E29B27',
        borderRadius: 999,
        textAlign: 'center',
        shadow: true
      },
      {
        id: 'elem-cover-unit-title',
        type: 'heading',
        x: 6,
        y: 27,
        w: 88,
        h: 14,
        content: reportData.reporting_unit || '新竹青年分團',
        fontSize: 44,
        fontWeight: 'black',
        color: '#FFFFFF',
        textAlign: 'left'
      },
      {
        id: 'elem-cover-report-label',
        type: 'heading',
        x: 6,
        y: 43,
        w: 88,
        h: 12,
        content: '團務工作報告',
        fontSize: 34,
        fontWeight: 'black',
        color: '#68D391',
        textAlign: 'left'
      },
      {
        id: 'elem-cover-motto',
        type: 'text',
        x: 6,
        y: 58,
        w: 88,
        h: 8,
        content: '貫徹星雲大師人間佛教四大宗旨 • 熱血發心 信仰傳承',
        fontSize: 15,
        fontWeight: 'bold',
        color: '#CBD5E1',
        textAlign: 'left'
      },
      {
        id: 'elem-cover-footer',
        type: 'text',
        x: 6,
        y: 88,
        w: 88,
        h: 5,
        content: `報告日期：${new Date().toLocaleDateString('zh-TW')} ｜ 指導單位：佛光山法寶寺`,
        fontSize: 11,
        fontWeight: 'normal',
        color: '#94A3B8',
        textAlign: 'left'
      }
    ]
  });

  // ====================================================
  // 2. Agenda / Directory Slide
  // ====================================================
  const agendaElements: SlideElement[] = [
    {
      id: 'elem-agenda-badge',
      type: 'badge',
      x: 6,
      y: 6,
      w: 32,
      h: 4.5,
      content: 'AGENDA / 四大核心架構',
      fontSize: 12,
      fontWeight: 'black',
      color: '#4A7C59',
      textAlign: 'left'
    },
    {
      id: 'elem-agenda-heading',
      type: 'heading',
      x: 6,
      y: 11,
      w: 70,
      h: 8.5,
      content: '工作報告 四大核心範疇',
      fontSize: 28,
      fontWeight: 'black',
      color: '#1C1917',
      textAlign: 'left'
    }
  ];

  // 4 Category Cards
  reportData.categories.forEach((cat, idx) => {
    const startX = 6 + idx * 23.5;
    const cardWidth = 21.5;

    // Card background
    agendaElements.push({
      id: `elem-agenda-card-${idx}`,
      type: 'shape',
      x: startX,
      y: 22,
      w: cardWidth,
      h: 67,
      content: '',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 16,
      shadow: true
    });

    // Badge with index & short name
    agendaElements.push({
      id: `elem-agenda-badge-${idx}`,
      type: 'badge',
      x: startX + 1.5,
      y: 25,
      w: cardWidth - 3,
      h: 5.5,
      content: `0${idx + 1}  ${cat.short_name}`,
      fontSize: 13,
      fontWeight: 'black',
      color: '#FFFFFF',
      bgColor: cat.theme_color || '#4A7C59',
      borderRadius: 10,
      textAlign: 'center'
    });

    // Full name
    agendaElements.push({
      id: `elem-agenda-name-${idx}`,
      type: 'text',
      x: startX + 1.5,
      y: 33,
      w: cardWidth - 3,
      h: 9,
      content: cat.category_name,
      fontSize: 12,
      fontWeight: 'bold',
      color: '#44403C',
      textAlign: 'center'
    });

    // KPI Stat
    agendaElements.push({
      id: `elem-agenda-kpi-${idx}`,
      type: 'number_kpi',
      x: startX + 1.5,
      y: 45,
      w: cardWidth - 3,
      h: 22,
      content: String(cat.summary_stats.activity_count),
      title: '專案活動場次',
      fontSize: 34,
      color: cat.theme_color || '#4A7C59',
      textAlign: 'center'
    });

    // Participants
    agendaElements.push({
      id: `elem-agenda-part-${idx}`,
      type: 'text',
      x: startX + 1.5,
      y: 72,
      w: cardWidth - 3,
      h: 8,
      content: `累計 ${cat.summary_stats.total_participants} 人次`,
      fontSize: 12,
      fontWeight: 'bold',
      color: '#78716C',
      textAlign: 'center'
    });
  });

  agendaElements.push({
    id: 'elem-agenda-footer',
    type: 'text',
    x: 6,
    y: 92,
    w: 88,
    h: 4,
    content: `${reportData.reporting_unit} • ${reportData.meeting_report_title}`,
    fontSize: 10,
    fontWeight: 'normal',
    color: '#A8A29E'
  });

  slides.push({
    id: 'slide-agenda-1',
    type: 'agenda',
    title: '工作報告 四大核心範疇',
    subtitle: '四大宗旨',
    layoutMode: 'text_cards',
    style: {
      bgColor: '#F7F6F2',
      textColor: '#1C1917'
    },
    elements: agendaElements
  });

  // ====================================================
  // 3. Category Divider & Activity Slides
  // ====================================================
  let slideIndexCounter = 2;

  reportData.categories.forEach((cat, cIdx) => {
    if (cat.activities.length === 0) return;

    const catKey = cat.short_name || `cat-${cIdx}`;

    // Category Divider
    slides.push({
      id: `slide-cat-divider-${catKey}`,
      type: 'category_divider',
      title: cat.category_name,
      subtitle: cat.short_name,
      category: cat,
      layoutMode: 'minimal',
      style: {
        bgColor: '#F7F6F2',
        textColor: '#1C1917'
      },
      elements: [
        {
          id: `elem-cat-${catKey}-icon`,
          type: 'sticker',
          x: 45,
          y: 16,
          w: 10,
          h: 14,
          content: cat.icon || '🪷',
          fontSize: 48,
          textAlign: 'center'
        },
        {
          id: `elem-cat-${catKey}-badge`,
          type: 'badge',
          x: 25,
          y: 33,
          w: 50,
          h: 6,
          content: cat.category_name,
          fontSize: 14,
          fontWeight: 'black',
          color: '#FFFFFF',
          bgColor: cat.theme_color || '#4A7C59',
          borderRadius: 999,
          textAlign: 'center'
        },
        {
          id: `elem-cat-${catKey}-title`,
          type: 'heading',
          x: 15,
          y: 42,
          w: 70,
          h: 14,
          content: cat.short_name,
          fontSize: 40,
          fontWeight: 'black',
          color: '#1C1917',
          textAlign: 'center'
        },
        {
          id: `elem-cat-${catKey}-stats`,
          type: 'text',
          x: 20,
          y: 60,
          w: 60,
          h: 8,
          content: `${cat.summary_stats.activity_count} 場專案活動 ｜ 累計 ${cat.summary_stats.total_participants} 人次共襄盛舉`,
          fontSize: 16,
          fontWeight: 'bold',
          color: '#57534E',
          textAlign: 'center'
        },
        {
          id: `elem-cat-${catKey}-quote`,
          type: 'quote',
          x: 25,
          y: 72,
          w: 50,
          h: 12,
          content: '「以教育培養人才，以文化弘揚佛法」',
          fontSize: 15,
          fontStyle: 'italic',
          color: '#78716C',
          textAlign: 'center'
        }
      ]
    });
    slideIndexCounter++;

    // Activity Slides
    cat.activities.forEach((act, aIdx) => {
      const activitySlideId = `slide-act-${catKey}-${act.id || aIdx}`;
      const baseElements: SlideElement[] = [
        {
          id: `elem-${activitySlideId}-catbadge`,
          type: 'badge',
          x: 5,
          y: 4,
          w: 16,
          h: 4.5,
          content: cat.short_name,
          fontSize: 11,
          fontWeight: 'black',
          color: '#FFFFFF',
          bgColor: cat.theme_color || '#4A7C59',
          borderRadius: 8,
          textAlign: 'center'
        },
        {
          id: `elem-${activitySlideId}-dateloc`,
          type: 'text',
          x: 22,
          y: 4,
          w: 42,
          h: 4.5,
          content: act.date_location,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#78716C',
          textAlign: 'left'
        },
        {
          id: `elem-${activitySlideId}-heading`,
          type: 'heading',
          x: 5,
          y: 9.5,
          w: 59,
          h: 8.5,
          content: act.activity_name,
          fontSize: 22,
          fontWeight: 'black',
          color: '#1C1917',
          textAlign: 'left'
        },
        {
          id: `elem-${activitySlideId}-footer`,
          type: 'text',
          x: 5,
          y: 94.5,
          w: 89,
          h: 4,
          content: `${reportData.reporting_unit} • ${reportData.meeting_report_title}`,
          fontSize: 10,
          fontWeight: 'normal',
          color: '#A8A29E'
        }
      ];

      // Build slide skeleton and apply layoutMode
      const slideSkeleton: Slide = {
        id: activitySlideId,
        type: 'activity',
        title: act.activity_name,
        subtitle: act.date_location,
        category: cat,
        activity: act,
        layoutMode: layoutMode,
        style: {
          bgColor: '#F7F6F2',
          textColor: '#1C1917'
        },
        elements: baseElements
      };

      slides.push(recomputeSlideElementsForLayout(slideSkeleton, layoutMode));
      slideIndexCounter++;
    });
  });

  // ====================================================
  // 4. Overall Statistics Summary Slide
  // ====================================================
  slides.push({
    id: 'slide-summary-overall',
    type: 'summary',
    title: '工作報告成效總結',
    layoutMode: 'text_cards',
    style: {
      bgColor: '#F7F6F2',
      textColor: '#1C1917'
    },
    elements: [
      {
        id: 'elem-summary-badge',
        type: 'badge',
        x: 6,
        y: 6,
        w: 32,
        h: 4.5,
        content: '成效綜覽 / PERFORMANCE SUMMARY',
        fontSize: 12,
        fontWeight: 'black',
        color: '#4A7C59',
        textAlign: 'left'
      },
      {
        id: 'elem-summary-heading',
        type: 'heading',
        x: 6,
        y: 11,
        w: 80,
        h: 8.5,
        content: '工作報告 成效數據總結',
        fontSize: 28,
        fontWeight: 'black',
        color: '#1C1917',
        textAlign: 'left'
      },
      {
        id: 'elem-summary-kpi-acts',
        type: 'number_kpi',
        x: 6,
        y: 22,
        w: 42,
        h: 22,
        content: String(reportData.grand_total.total_activities),
        title: '活動舉辦總場次 (場)',
        fontSize: 44,
        color: '#4A7C59',
        bgColor: '#FFFFFF',
        borderColor: '#E7E5E4',
        borderWidth: 1,
        borderRadius: 16,
        shadow: true
      },
      {
        id: 'elem-summary-kpi-parts',
        type: 'number_kpi',
        x: 52,
        y: 22,
        w: 42,
        h: 22,
        content: String(reportData.grand_total.total_participants),
        title: '累計參與總人次 (人)',
        fontSize: 44,
        color: '#E29B27',
        bgColor: '#FFFFFF',
        borderColor: '#E7E5E4',
        borderWidth: 1,
        borderRadius: 16,
        shadow: true
      },
      {
        id: 'elem-summary-breakdown-card',
        type: 'text',
        x: 6,
        y: 48,
        w: 88,
        h: 41,
        content: reportData.categories.map(c => 
          `【${c.short_name}】${c.category_name}：${c.summary_stats.activity_count} 場活動，共計 ${c.summary_stats.total_participants} 人次參與`
        ).join('\n\n'),
        fontSize: 14,
        color: '#334155',
        bgColor: '#FFFFFF',
        borderColor: '#E7E5E4',
        borderWidth: 1,
        borderRadius: 16,
        shadow: true
      },
      {
        id: 'elem-summary-footer',
        type: 'text',
        x: 6,
        y: 92,
        w: 88,
        h: 4,
        content: `${reportData.reporting_unit} • ${reportData.meeting_report_title}`,
        fontSize: 10,
        fontWeight: 'normal',
        color: '#A8A29E'
      }
    ]
  });

  // ====================================================
  // 5. Thank You Slide
  // ====================================================
  slides.push({
    id: 'slide-thankyou-final',
    type: 'thank_you',
    title: '感謝蒞臨指導',
    layoutMode: 'minimal',
    style: {
      bgColor: '#2C3437',
      textColor: '#FFFFFF'
    },
    elements: [
      {
        id: 'elem-thankyou-sticker',
        type: 'sticker',
        x: 45,
        y: 20,
        w: 10,
        h: 14,
        content: '🙏',
        fontSize: 52,
        textAlign: 'center'
      },
      {
        id: 'elem-thankyou-heading',
        type: 'heading',
        x: 10,
        y: 38,
        w: 80,
        h: 14,
        content: '感謝蒞臨指導 • 祈祝吉祥安樂',
        fontSize: 36,
        fontWeight: 'black',
        color: '#FFFFFF',
        textAlign: 'center'
      },
      {
        id: 'elem-thankyou-subtitle',
        type: 'text',
        x: 15,
        y: 54,
        w: 70,
        h: 8,
        content: `${reportData.reporting_unit} 敬呈`,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E29B27',
        textAlign: 'center'
      },
      {
        id: 'elem-thankyou-footer',
        type: 'text',
        x: 10,
        y: 88,
        w: 80,
        h: 5,
        content: '國際佛光會中華佛光青年總團 • 佛光山法寶寺指導',
        fontSize: 12,
        fontWeight: 'normal',
        color: '#94A3B8',
        textAlign: 'center'
      }
    ]
  });

  return slides;
}

/**
 * Recomputes and repositions slide layout elements for a specific layout mode
 */
export function recomputeSlideElementsForLayout(slide: Slide, newLayout: Slide['layoutMode']): Slide {
  if (slide.type !== 'activity' || !slide.activity) {
    return { ...slide, layoutMode: newLayout };
  }

  const act: PPTActivityItem = slide.activity;
  const cat: PPTCategorySummary | undefined = slide.category;
  const photos = act.photos || [];

  // Filter out layout-specific elements, preserving headers, footers, custom stickers, etc.
  const nonLayoutElements = slide.elements.filter(
    el => el.type !== 'photo' && el.id !== 'elem-kpi-total' && el.id !== 'elem-highlights-box' && el.id !== 'elem-kpi-internal' && el.id !== 'elem-kpi-external'
  );

  const layoutElements: SlideElement[] = [];

  if (newLayout === 'quad_photos') {
    layoutElements.push({
      id: 'elem-kpi-total',
      type: 'number_kpi',
      x: 66,
      y: 4,
      w: 29,
      h: 15,
      content: String(act.participants?.total || 0),
      title: `參與總人數 (青年 ${act.participants?.internal || 0} • 貴賓 ${act.participants?.external || 0})`,
      color: cat?.theme_color || '#4A7C59',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12,
      shadow: true,
      fontSize: 28
    });

    layoutElements.push({
      id: 'elem-highlights-box',
      type: 'text',
      x: 66,
      y: 21,
      w: 29,
      h: 71,
      content: (act.key_highlights || []).map((h: string) => '● ' + h).join('\n\n'),
      fontSize: 12,
      fontWeight: 'normal',
      color: '#334155',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12,
      shadow: true
    });

    const photoPositions = [
      { x: 5, y: 19, w: 28.5, h: 35.5 },
      { x: 35.5, y: 19, w: 28.5, h: 35.5 },
      { x: 5, y: 56.5, w: 28.5, h: 35.5 },
      { x: 35.5, y: 56.5, w: 28.5, h: 35.5 }
    ];

    photoPositions.forEach((pos, idx) => {
      const p = photos[idx];
      layoutElements.push({
        id: `elem-photo-${idx}`,
        type: 'photo',
        ...pos,
        content: p?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
        title: p?.caption || `實況花絮 ${idx + 1}`
      });
    });
  } else if (newLayout === 'dual_photos') {
    layoutElements.push({
      id: 'elem-photo-0',
      type: 'photo',
      x: 5,
      y: 19,
      w: 58.5,
      h: 36,
      content: photos[0]?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      title: photos[0]?.caption || '全景實況照 1'
    });

    layoutElements.push({
      id: 'elem-photo-1',
      type: 'photo',
      x: 5,
      y: 57,
      w: 58.5,
      h: 36,
      content: photos[1]?.url || photos[0]?.url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      title: photos[1]?.caption || '全景實況照 2'
    });

    layoutElements.push({
      id: 'elem-kpi-total',
      type: 'number_kpi',
      x: 66,
      y: 19,
      w: 29,
      h: 22,
      content: String(act.participants?.total || 0),
      title: '總參與人數 (人次)',
      color: cat?.theme_color || '#4A7C59',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 14,
      shadow: true,
      fontSize: 34
    });

    layoutElements.push({
      id: 'elem-highlights-box',
      type: 'text',
      x: 66,
      y: 43,
      w: 29,
      h: 50,
      content: (act.key_highlights || []).map((h: string) => '★ ' + h).join('\n\n'),
      fontSize: 13,
      color: '#334155',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 14,
      shadow: true
    });
  } else if (newLayout === 'single_hero') {
    layoutElements.push({
      id: 'elem-photo-0',
      type: 'photo',
      x: 5,
      y: 19,
      w: 58.5,
      h: 74,
      content: photos[0]?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      title: photos[0]?.caption || '焦點特寫相片'
    });

    layoutElements.push({
      id: 'elem-kpi-total',
      type: 'number_kpi',
      x: 66,
      y: 19,
      w: 29,
      h: 22,
      content: String(act.participants?.total || 0),
      title: '參與人次',
      color: cat?.theme_color || '#4A7C59',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 14,
      fontSize: 34
    });

    layoutElements.push({
      id: 'elem-highlights-box',
      type: 'text',
      x: 66,
      y: 43,
      w: 29,
      h: 50,
      content: (act.key_highlights || []).map((h: string) => '★ ' + h).join('\n\n'),
      fontSize: 13,
      color: '#334155',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 14
    });
  } else {
    // text_cards
    layoutElements.push({
      id: 'elem-kpi-total',
      type: 'number_kpi',
      x: 5,
      y: 20,
      w: 18,
      h: 16,
      content: String(act.participants?.total || 0),
      title: '總參與人數',
      color: cat?.theme_color || '#4A7C59',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12
    });

    layoutElements.push({
      id: 'elem-kpi-internal',
      type: 'number_kpi',
      x: 25,
      y: 20,
      w: 18,
      h: 16,
      content: String(act.participants?.internal || 0),
      title: '青年幹部',
      color: '#2563EB',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12
    });

    layoutElements.push({
      id: 'elem-kpi-external',
      type: 'number_kpi',
      x: 45,
      y: 20,
      w: 18,
      h: 16,
      content: String(act.participants?.external || 0),
      title: '貴賓大眾',
      color: '#E29B27',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12
    });

    layoutElements.push({
      id: 'elem-highlights-box',
      type: 'text',
      x: 5,
      y: 39,
      w: 58,
      h: 54,
      content: (act.key_highlights || []).map((h: string) => '● ' + h).join('\n\n'),
      fontSize: 13,
      color: '#334155',
      bgColor: '#FFFFFF',
      borderColor: '#E7E5E4',
      borderWidth: 1,
      borderRadius: 12
    });

    layoutElements.push({
      id: 'elem-photo-0',
      type: 'photo',
      x: 65,
      y: 20,
      w: 30,
      h: 73,
      content: photos[0]?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      title: photos[0]?.caption || '精選活動照片'
    });
  }

  return {
    ...slide,
    layoutMode: newLayout,
    elements: [...nonLayoutElements, ...layoutElements]
  };
}
