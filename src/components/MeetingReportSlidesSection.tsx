import React, { useState, useMemo, useEffect } from 'react';
import { 
  Presentation, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  FileCode, 
  FileText, 
  Users, 
  Calendar, 
  FolderOpen,
  Printer,
  RefreshCw,
  Palette,
  Sliders,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { ActivityRecordItem, Slide, SlideElement, ProjectBackupPackage } from '../types';
import { getStoredActivities, matchActivityYear } from '../utils/activityStorage';
import { 
  getStoredSlides, 
  getStoredSelectedIds, 
  getStoredAppConfig, 
  scheduleAutoSaveToLocalStorage,
  STORAGE_KEYS
} from '../services/projectPersistence';
import { PPTExportModal } from './PPTExportModal';
import { SlideCanvaStudio } from './SlideCanvaStudio';
import { buildSlidesFromReportData, recomputeSlideElementsForLayout } from '../utils/slideBuilder';
import { GoogleSlidesModal } from './GoogleSlidesModal';
import { useUiText } from '../contexts/UiTextContext';

// Step 0: Four Objectives definition & matcher
export interface PPTCategorySummary {
  category_name: string;
  short_name: string;
  theme_color: string;
  bg_gradient: string;
  icon: string;
  summary_stats: {
    activity_count: number;
    total_participants: number;
  };
  activities: PPTActivityItem[];
}

export interface PPTActivityItem {
  id: string;
  activity_name: string;
  date_location: string;
  raw_date: string;
  location: string;
  participants: {
    internal: number;
    external: number;
    total: number;
  };
  key_highlights: string[];
  slides_layout: string;
  photos: Array<{
    url: string;
    caption: string;
  }>;
}

export interface MeetingReportData {
  meeting_report_title: string;
  reporting_unit: string;
  reporting_period: string;
  categories: PPTCategorySummary[];
  grand_total: {
    total_activities: number;
    total_participants: number;
  };
}

export const OBJECTIVES_CONFIG: Record<string, {
  category_name: string;
  short_name: string;
  theme_color: string;
  bg_gradient: string;
  icon: string;
  keywords: string[];
}> = {
  edu: {
    category_name: '以文化教育弘揚佛法',
    short_name: '文化教育',
    theme_color: '#4A7C59', // Earth Green
    bg_gradient: 'from-[#4A7C59]/10 to-[#4A7C59]/5',
    icon: '📚',
    keywords: ['共學', '讀書會', '培訓', '營隊', '講座', '論壇', '研習', '工作坊', '抄經', '白話佛法', '書香', '教育', '雲水書坊', '徵文', '攝影']
  },
  charity: {
    category_name: '以慈善福利普及社會',
    short_name: '慈善福利',
    theme_color: '#E29B27', // Compassion Gold
    bg_gradient: 'from-[#E29B27]/10 to-[#E29B27]/5',
    icon: '🤝',
    keywords: ['捐血', '義剪', '關懷', '慰問', '偏鄉', '公益', '淨灘', '掃街', '急難救助', '二手', '臘八粥', '重陽', '敬老', '義工', '愛心', '善行']
  },
  spiritual: {
    category_name: '以共修淨化社會人心',
    short_name: '共修淨化',
    theme_color: '#B91C1C', // Dharma Vermilion
    bg_gradient: 'from-[#B91C1C]/10 to-[#B91C1C]/5',
    icon: '🏮',
    keywords: ['法會', '祈福', '禪修', '朝山', '浴佛', '普渡', '念佛', '水懺', '梁皇', '皈依', '光明燈', '大悲懺', '燄口', '三時繫念', '修持', '八關齋戒']
  },
  harmony: {
    category_name: '以組織結緣推展團務',
    short_name: '組織結緣',
    theme_color: '#2563EB', // Tech Sapphire
    bg_gradient: 'from-[#2563EB]/10 to-[#2563EB]/5',
    icon: '🌐',
    keywords: ['聯誼', '月例會', '團務', '幹部', '參訪', '會員大會', '交接', '聯團', '接待', '總團', '茶會', '走讀', '團體動力', '成團', '幹訓']
  }
};

export function classifyActivityObjective(act: ActivityRecordItem): string {
  if (act.activityObjective) {
    if (act.activityObjective.includes('文化') || act.activityObjective.includes('教育')) return '文化教育';
    if (act.activityObjective.includes('慈善') || act.activityObjective.includes('福利')) return '慈善福利';
    if (act.activityObjective.includes('共修') || act.activityObjective.includes('淨化')) return '共修淨化';
    if (act.activityObjective.includes('組織') || act.activityObjective.includes('結緣') || act.activityObjective.includes('聯誼')) return '組織結緣';
  }

  const textToSearch = `${act.title || ''} ${act.category || ''} ${act.location || ''} ${act.summary || ''} ${act.highlightsAndOutcomes || ''}`.toLowerCase();
  
  for (const [, cfg] of Object.entries(OBJECTIVES_CONFIG)) {
    for (const kw of cfg.keywords) {
      if (textToSearch.includes(kw.toLowerCase())) {
        return cfg.short_name;
      }
    }
  }

  if (act.category?.includes('修持') || act.category?.includes('法會')) return '共修淨化';
  if (act.category?.includes('教育') || act.category?.includes('文化')) return '文化教育';
  if (act.category?.includes('慈善') || act.category?.includes('公益')) return '慈善福利';
  return '組織結緣';
}

export function transformToPPTActivityItem(act: ActivityRecordItem): PPTActivityItem {
  let cleanTitle = (act.title || '').trim();
  cleanTitle = cleanTitle.replace(/^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2})\s*[-_—–~]?\s*/, '');
  cleanTitle = cleanTitle.replace(/^【.*?】\s*/, '');
  cleanTitle = cleanTitle.replace(/^\[.*?\]\s*/, '');
  cleanTitle = cleanTitle.replace(/^（.*?）\s*/, '');
  cleanTitle = cleanTitle.replace(/^\(.*?\)\s*/, '');

  let dateLocation = '';
  if (act.date && act.location) {
    dateLocation = `${act.date} ｜ ${act.location}`;
  } else if (act.date) {
    dateLocation = act.date;
  } else if (act.location) {
    dateLocation = act.location;
  } else {
    dateLocation = '活動日期地點確認中';
  }

  const total = act.attendeeTotal || ((act.attendeeYouth || 0) + (act.attendeeGuests || 0)) || 10;
  const internal = act.attendeeYouth || Math.max(1, Math.round(total * 0.4));
  const external = act.attendeeGuests || Math.max(0, total - internal);

  const selectedPhotos: Array<{ url: string; caption: string }> = [];
  if (act.photos && act.photos.length > 0) {
    act.photos.slice(0, 4).forEach((p, idx) => {
      selectedPhotos.push({
        url: p.url,
        caption: p.caption || `${cleanTitle} 活動實況紀要 (${idx + 1})`
      });
    });
  }

  if (selectedPhotos.length === 0) {
    const fallbackSamples = [
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
    ];
    selectedPhotos.push({
      url: fallbackSamples[0],
      caption: `${cleanTitle} 全體大合照`
    });
    selectedPhotos.push({
      url: fallbackSamples[1],
      caption: `${cleanTitle} 青年幹部專案策劃執行`
    });
    selectedPhotos.push({
      url: fallbackSamples[2],
      caption: `${cleanTitle} 佛法研討與共學交流`
    });
    selectedPhotos.push({
      url: fallbackSamples[3],
      caption: `${cleanTitle} 大眾熱烈迴響盛況`
    });
  }

  const highlights: string[] = [];
  const rawHighlightsText = `${act.highlightsAndOutcomes || ''}\n${act.summary || ''}`;
  if (rawHighlightsText.trim()) {
    const lines = rawHighlightsText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      const cleaned = line.replace(/^[•\-\*#\d\.\s]+/, '').trim();
      if (cleaned.length > 6 && !highlights.includes(cleaned)) {
        highlights.push(cleaned.slice(0, 48));
      }
      if (highlights.length >= 3) break;
    }
  }

  if (highlights.length === 0) {
    highlights.push(`圓滿推動青年參與，實到共計 ${total} 人次`);
    highlights.push('幹部發揮佛光青年精神，展現集體創作力量');
    highlights.push('深化佛法生活實踐，凝聚團隊情誼');
  }

  return {
    id: act.id,
    activity_name: cleanTitle,
    date_location: dateLocation,
    raw_date: act.date,
    location: act.location,
    participants: {
      internal,
      external,
      total
    },
    key_highlights: highlights,
    slides_layout: 'photo_grid_with_right_info',
    photos: selectedPhotos
  };
}

export const MeetingReportSlidesSection: React.FC = () => {
  const { getText } = useUiText();
  const initialConfig = getStoredAppConfig();
  const [activities, setActivities] = useState<ActivityRecordItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => getStoredSelectedIds());
  const [reportTitle, setReportTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.REPORT_TITLE) || '桃竹苗區 聯團會議工作報告';
  });
  const [reportingUnit, setReportingUnit] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.REPORTING_UNIT) || initialConfig.subUnitName || initialConfig.organizationName;
  });
  const [reportingPeriod, setReportingPeriod] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.REPORTING_PERIOD) || `${initialConfig.currentYear}年工作報告`;
  });
  
  // UI View Tab: 'slides' | 'canva_studio' | 'json' | 'markdown'
  const [activeTab, setActiveTab] = useState<'slides' | 'canva_studio' | 'json' | 'markdown'>('slides');
  
  // Single Source of Truth (SSOT): Slides Array (Prioritize stored slides to prevent data loss)
  const [slides, setSlides] = useState<Slide[]>(() => getStoredSlides());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedState, setCopiedState] = useState<string>('');

  // PPT Custom Template & Styling States
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isGoogleSlidesModalOpen, setIsGoogleSlidesModalOpen] = useState<boolean>(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState<boolean>(false);
  const [themeId, setThemeId] = useState<'earth_zen' | 'modern_tech' | 'temple_heritage' | 'graphite_jade' | 'custom'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_ID) as any;
    return saved || 'earth_zen';
  });
  const [layoutMode, setLayoutMode] = useState<'quad_photos' | 'dual_photos' | 'single_hero' | 'text_cards'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_MODE) as any;
    return saved || 'quad_photos';
  });
  const [fontSizeScale, setFontSizeScale] = useState<'standard' | 'large'>('standard');
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(true);
  const [activityDrawerYear, setActivityDrawerYear] = useState<string | 'all'>('all');
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_BG) || '';
    } catch {
      return '';
    }
  });
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_LOGO) || '';
    } catch {
      return '';
    }
  });

  // Upload custom template background
  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCustomBgUrl(dataUrl);
        setThemeId('custom');
        try {
          localStorage.setItem('blia_ppt_custom_bg', dataUrl);
        } catch (err) {
          console.warn('Could not save to localStorage', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearBg = () => {
    setCustomBgUrl('');
    try {
      localStorage.removeItem('blia_ppt_custom_bg');
    } catch {}
    if (themeId === 'custom') {
      setThemeId('earth_zen');
    }
  };

  // Upload custom unit logo
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCustomLogoUrl(dataUrl);
        try {
          localStorage.setItem('blia_ppt_custom_logo', dataUrl);
        } catch (err) {
          console.warn('Could not save to localStorage', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setCustomLogoUrl('');
    try {
      localStorage.removeItem('blia_ppt_custom_logo');
    } catch {}
  };

  // Theme styling definitions
  const currentTheme = useMemo(() => {
    const configs = {
      earth_zen: {
        id: 'earth_zen',
        name: '人間佛教大地禪風',
        tag: '原創經典',
        coverBg: '#2C3437',
        contentBg: '#F8F7F4',
        accentColor: '#4A7C59',
        accentText: 'text-[#4A7C59]',
        badgeBg: 'bg-[#4A7C59]',
        borderStyle: 'border-stone-200'
      },
      modern_tech: {
        id: 'modern_tech',
        name: '現代商務科技海軍藍',
        tag: '精準專業',
        coverBg: '#0F172A',
        contentBg: '#F8FAFC',
        accentColor: '#2563EB',
        accentText: 'text-blue-600',
        badgeBg: 'bg-blue-600',
        borderStyle: 'border-slate-200'
      },
      temple_heritage: {
        id: 'temple_heritage',
        name: '法寶寺莊嚴朱紅金',
        tag: '大會典範',
        coverBg: '#450A0A',
        contentBg: '#FFFDF9',
        accentColor: '#B91C1C',
        accentText: 'text-red-700',
        badgeBg: 'bg-red-700',
        borderStyle: 'border-amber-200'
      },
      graphite_jade: {
        id: 'graphite_jade',
        name: '青年極簡曜黑翡翠',
        tag: '高對比潮流',
        coverBg: '#18181B',
        contentBg: '#F4F4F5',
        accentColor: '#059669',
        accentText: 'text-emerald-600',
        badgeBg: 'bg-emerald-600',
        borderStyle: 'border-zinc-200'
      },
      custom: {
        id: 'custom',
        name: '自訂上傳模板母片',
        tag: '專屬底圖',
        coverBg: '#1E293B',
        contentBg: '#F7F6F2',
        accentColor: '#4A7C59',
        accentText: 'text-amber-600',
        badgeBg: 'bg-amber-600',
        borderStyle: 'border-stone-300'
      }
    };
    return configs[themeId] || configs.earth_zen;
  }, [themeId]);

  // Load activities from storage
  useEffect(() => {
    const loaded = getStoredActivities();
    setActivities(loaded);
    const storedIds = getStoredSelectedIds();
    if (storedIds.length > 0) {
      setSelectedIds(storedIds);
    } else if (loaded.length > 0) {
      setSelectedIds(loaded.slice(0, 8).map(a => a.id));
    }
  }, []);

  // Debounce Auto-save: Whenever slides, selectedIds, or template settings change, auto-save to LocalStorage
  useEffect(() => {
    scheduleAutoSaveToLocalStorage({
      slides,
      selectedIds,
      themeId,
      layoutMode,
      reportTitle,
      reportingUnit,
      reportingPeriod,
      customBgUrl,
      customLogoUrl
    }, 1000);
  }, [slides, selectedIds, themeId, layoutMode, reportTitle, reportingUnit, reportingPeriod, customBgUrl, customLogoUrl]);

  // Listen to cross-component project restore & activity changes
  useEffect(() => {
    const handleProjectRestored = (e: any) => {
      const pkg = e.detail as ProjectBackupPackage;
      if (!pkg) return;
      if (pkg.activities) setActivities(pkg.activities);
      if (pkg.slides) setSlides(pkg.slides);
      if (pkg.selectedIds) setSelectedIds(pkg.selectedIds);
      if (pkg.themeId) setThemeId(pkg.themeId as any);
      if (pkg.layoutMode) setLayoutMode(pkg.layoutMode as any);
      if (pkg.customBgUrl !== undefined) setCustomBgUrl(pkg.customBgUrl);
      if (pkg.customLogoUrl !== undefined) setCustomLogoUrl(pkg.customLogoUrl);
      if (pkg.reportTitle) setReportTitle(pkg.reportTitle);
      if (pkg.reportingUnit) setReportingUnit(pkg.reportingUnit);
      if (pkg.reportingPeriod) setReportingPeriod(pkg.reportingPeriod);
      setToastMessage('📦 專案資料已成功還原並同步至畫面！');
      setTimeout(() => setToastMessage(''), 3000);
    };

    const handleActivitiesChanged = (e: any) => {
      if (Array.isArray(e.detail)) {
        setActivities(e.detail);
      }
    };

    const handleConfigChanged = (e: any) => {
      const cfg = e.detail;
      if (cfg) {
        setReportingUnit(cfg.subUnitName || cfg.organizationName);
        setReportingPeriod(`${cfg.currentYear}年工作報告`);
      }
    };

    window.addEventListener('blia_project_restored', handleProjectRestored);
    window.addEventListener('blia_activities_changed', handleActivitiesChanged);
    window.addEventListener('blia_app_config_changed', handleConfigChanged);

    return () => {
      window.removeEventListener('blia_project_restored', handleProjectRestored);
      window.removeEventListener('blia_activities_changed', handleActivitiesChanged);
      window.removeEventListener('blia_app_config_changed', handleConfigChanged);
    };
  }, []);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map(a => a.id));
    }
  };

  // Structured Report Data computation
  const reportData = useMemo<MeetingReportData>(() => {
    const selectedActivities = activities.filter(a => selectedIds.includes(a.id));

    const groups: Record<string, ActivityRecordItem[]> = {
      文化教育: [],
      慈善福利: [],
      共修淨化: [],
      組織結緣: []
    };

    selectedActivities.forEach(act => {
      const catName = classifyActivityObjective(act);
      if (groups[catName]) {
        groups[catName].push(act);
      } else {
        groups['組織結緣'].push(act);
      }
    });

    const categoryKeys: Array<keyof typeof OBJECTIVES_CONFIG> = ['edu', 'charity', 'spiritual', 'harmony'];
    const categories: PPTCategorySummary[] = categoryKeys.map(key => {
      const cfg = OBJECTIVES_CONFIG[key];
      const actsInGroup = groups[cfg.short_name] || [];
      const transformedActs = actsInGroup.map(transformToPPTActivityItem);

      const totalParticipants = transformedActs.reduce((sum, item) => sum + item.participants.total, 0);

      return {
        category_name: cfg.category_name,
        short_name: cfg.short_name,
        theme_color: cfg.theme_color,
        bg_gradient: cfg.bg_gradient,
        icon: cfg.icon,
        summary_stats: {
          activity_count: transformedActs.length,
          total_participants: totalParticipants
        },
        activities: transformedActs
      };
    });

    const grandTotalActivities = categories.reduce((sum, c) => sum + c.summary_stats.activity_count, 0);
    const grandTotalParticipants = categories.reduce((sum, c) => sum + c.summary_stats.total_participants, 0);

    return {
      meeting_report_title: reportTitle,
      reporting_unit: reportingUnit,
      reporting_period: reportingPeriod,
      categories,
      grand_total: {
        total_activities: grandTotalActivities,
        total_participants: grandTotalParticipants
      }
    };
  }, [activities, selectedIds, reportTitle, reportingUnit, reportingPeriod]);

  // Generate initial PPT slides automatically on first load or when selection changes
  useEffect(() => {
    if (slides.length === 0 && reportData.categories.length > 0) {
      const generated = buildSlidesFromReportData(reportData, layoutMode, themeId);
      setSlides(generated);
    }
  }, [reportData, layoutMode, themeId, slides.length]);

  // Core Generator Action: Rebuild PPT Slides from current activity selection
  const handleGenerateSlides = (targetTab: 'slides' | 'canva_studio' = 'slides') => {
    const generated = buildSlidesFromReportData(reportData, layoutMode, themeId);
    setSlides(generated);
    setCurrentSlideIndex(0);
    setActiveTab(targetTab);
    setToastMessage(
      targetTab === 'canva_studio' 
        ? `🚀 已根據勾選的 ${selectedIds.length} 筆活動生成 PPT，並載入 Canva 畫布編輯器！`
        : `📽️ 已成功生成 ${generated.length} 頁 PPT 投影片並載入播放預覽！`
    );
    setTimeout(() => setToastMessage(''), 4000);
  };

  // SSOT Mutators for Canva Studio
  const updateSlideElement = (slideIndex: number, elementId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => {
      const next = [...prev];
      if (!next[slideIndex]) return prev;
      const targetSlide = { ...next[slideIndex] };
      targetSlide.elements = targetSlide.elements.map(el => el.id === elementId ? { ...el, ...updates } : el);
      next[slideIndex] = targetSlide;
      return next;
    });
  };

  const addSlideElement = (slideIndex: number, newElement: SlideElement) => {
    setSlides(prev => {
      const next = [...prev];
      if (!next[slideIndex]) return prev;
      const targetSlide = { ...next[slideIndex] };
      targetSlide.elements = [...targetSlide.elements, newElement];
      next[slideIndex] = targetSlide;
      return next;
    });
  };

  const deleteSlideElement = (slideIndex: number, elementId: string) => {
    setSlides(prev => {
      const next = [...prev];
      if (!next[slideIndex]) return prev;
      const targetSlide = { ...next[slideIndex] };
      targetSlide.elements = targetSlide.elements.filter(el => el.id !== elementId);
      next[slideIndex] = targetSlide;
      return next;
    });
  };

  const updateSlide = (slideIndex: number, updates: Partial<Slide>) => {
    setSlides(prev => {
      const next = [...prev];
      if (!next[slideIndex]) return prev;
      next[slideIndex] = { ...next[slideIndex], ...updates };
      return next;
    });
  };

  const updateSlideLayout = (slideIndex: number, newLayout: Slide['layoutMode']) => {
    setSlides(prev => {
      const next = [...prev];
      if (!next[slideIndex]) return prev;
      next[slideIndex] = recomputeSlideElementsForLayout(next[slideIndex], newLayout);
      return next;
    });
  };

  // Navigation handlers
  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'slides') return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, activeTab]);

  // JSON stringified output
  const jsonOutput = useMemo(() => {
    try {
      return JSON.stringify(reportData, null, 2);
    } catch (err) {
      console.warn('報表 JSON 序列化長度超限，啟用輕量化輸出:', err);
      try {
        const slimmedReport = {
          ...reportData,
          categories: reportData.categories.map(cat => ({
            ...cat,
            activities: cat.activities.map(act => ({
              ...act,
              photos: (act.photos || []).map(p => ({
                ...p,
                url: p.url && p.url.startsWith('data:') && p.url.length > 30000 ? '[Base64 圖片已略過以加速顯示]' : p.url
              }))
            }))
          }))
        };
        return JSON.stringify(slimmedReport, null, 2);
      } catch {
        return '{\n  "error": "報表資料過大，無法以完整 JSON 字串輸出"\n}';
      }
    }
  }, [reportData]);

  // Markdown output
  const markdownOutput = useMemo(() => {
    let md = `# ${reportData.meeting_report_title}\n`;
    md += `**報告單位**：${reportData.reporting_unit} ｜ **報告期程**：${reportData.reporting_period}\n`;
    md += `**總計場次**：${reportData.grand_total.total_activities} 場 ｜ **累計參與總人次**：${reportData.grand_total.total_participants} 人次\n\n`;

    reportData.categories.forEach(cat => {
      if (cat.activities.length === 0) return;
      md += `## ${cat.icon} ${cat.category_name}（共 ${cat.summary_stats.activity_count} 場、${cat.summary_stats.total_participants} 人次）\n\n`;
      cat.activities.forEach((act, idx) => {
        md += `### ${idx + 1}. ${act.activity_name}\n`;
        md += `- **時間地點**：${act.date_location}\n`;
        md += `- **參與人次**：實到 ${act.participants.total} 人（本團青年 ${act.participants.internal} 人 / 大眾貴賓 ${act.participants.external} 人）\n`;
        if (act.key_highlights.length > 0) {
          md += `- **活動亮點**：${act.key_highlights.join('、')}\n`;
        }
        md += `- **精選佐證照片**：\n`;
        act.photos.forEach((p, pIdx) => {
          md += `  - 📷 照片 ${pIdx + 1}：${p.caption}\n`;
        });
        md += `\n`;
      });
    });

    return md;
  }, [reportData]);

  // Copy to clipboard
  const handleCopyContent = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(''), 2500);
  };

  // Download JSON
  const handleDownloadJSON = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `聯團工作報告_${reportingPeriod.replace(/\s+/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#2C3437] via-[#374449] to-[#222B2E] text-white p-5 sm:p-7 rounded-3xl shadow-sm border border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1 tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>聯團會議工作報告簡報</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            四大宗旨智慧分類 • PPT 自動化生成與 Canva 自由排版微調
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
            單一資料源架構：先勾選活動自動生成完整 16:9 PPT，隨時透過 Canva 畫布編輯器拖曳相片、修改字體與加入貼圖，儲存即時同步！
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'slides'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{getText('slides_tab_preview', '📽️ PPT 簡報播放與預覽')}</span>
          </button>

          <button
            onClick={() => setActiveTab('canva_studio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'canva_studio'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{getText('slides_tab_canva', '🎨 Canva 畫布編輯器')}</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{getText('slides_tab_json', '結構化 JSON')}</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{getText('slides_tab_markdown', '文字報告 (MD)')}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage('')}
            className="text-white/80 hover:text-white text-xs cursor-pointer px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Activity Selection Drawer & Dual Generation Buttons */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>第一步：勾選欲納入本次聯團會議 PPT 的活動紀錄：</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
              已選 {selectedIds.length} / {activities.length} 筆活動
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
              共計 {slides.length} 頁投影片
            </span>
            <button
              onClick={() => setIsActivityDrawerOpen(!isActivityDrawerOpen)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold ml-1 cursor-pointer"
            >
              {isActivityDrawerOpen ? '▲ 收合活動選單' : '▼ 展開勾選活動'}
            </button>
          </div>

          {/* Core Action Buttons: Generate PPT directly or Launch Canva Studio */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              {selectedIds.length === activities.length ? '取消全選' : '全部選取'}
            </button>

            <button
              onClick={() => handleGenerateSlides('slides')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="根據勾選活動自動生成 PPT 大概樣式，並進入播放預覽"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{getText('btn_generate_slides', '自動生成 PPT 簡報')}</span>
            </button>

            <button
              onClick={() => handleGenerateSlides('canva_studio')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              title="生成 PPT 投影片並直接載入 Canva 畫布編輯器微調排版細節"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getText('btn_generate_and_canva', '🚀 生成 PPT 並載入 Canva 編輯器')}</span>
            </button>
          </div>
        </div>

        {isActivityDrawerOpen && (
          <>
            {/* Year Filter Pills for Activity Drawer */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-100 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['all', '2026', '2025', '2024'] as const).map((yr) => {
                  const count = yr === 'all' 
                    ? activities.length 
                    : activities.filter(a => matchActivityYear(a, yr)).length;
                  const isSelected = activityDrawerYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setActivityDrawerYear(yr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>{yr === 'all' ? '全部年度' : `${yr} 年度`}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activityDrawerYear !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    const yearActIds = activities.filter(a => matchActivityYear(a, activityDrawerYear)).map(a => a.id);
                    const allYearSelected = yearActIds.every(id => selectedIds.includes(id));
                    if (allYearSelected) {
                      setSelectedIds(prev => prev.filter(id => !yearActIds.includes(id)));
                    } else {
                      setSelectedIds(prev => Array.from(new Set([...prev, ...yearActIds])));
                    }
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {activities.filter(a => matchActivityYear(a, activityDrawerYear)).every(a => selectedIds.includes(a.id))
                    ? `取消選取 ${activityDrawerYear} 全年度`
                    : `選取 ${activityDrawerYear} 全年度 (${activities.filter(a => matchActivityYear(a, activityDrawerYear)).length} 場)`}
                </button>
              )}
            </div>

            {/* Selected activities pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {activities
                .filter(act => activityDrawerYear === 'all' || matchActivityYear(act, activityDrawerYear))
                .map(act => {
                const isChecked = selectedIds.includes(act.id);
                const cat = classifyActivityObjective(act);
                const badgeColor = 
                  cat === '文化教育' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  cat === '慈善福利' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  cat === '共修淨化' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div
                    key={act.id}
                    onClick={() => handleToggleSelect(act.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isChecked 
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs' 
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} 
                      className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 truncate">
                        {act.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
                        <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${badgeColor}`}>
                          {cat}
                        </span>
                        <span>{act.date || '無日期'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">會議工作報告主標題：</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">匯報青年分團單位：</label>
                <input
                  type="text"
                  value={reportingUnit}
                  onChange={(e) => setReportingUnit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">報告期程 / 季別：</label>
                <input
                  type="text"
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-semibold"
                />
              </div>
            </div>
          </>
        )}

      </div>

      {/* 3. Main Display Area: Slides Presentation Mode */}
      {activeTab === 'slides' && (
        <div className="space-y-4">

          {/* PPT Template Customizer Drawer & Styling Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                    <span>PPT 投影片套版與風格設定</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      目前主題：{currentTheme.name}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    支援自訂上傳 PPT 母片底圖、團徽 Logo、5 款經典主題風格，與 4 種多元版面配置
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('canva_studio')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  title="進入 Canva 自由排版工作台，可拖曳移動元素、個別微調版型與貼圖，儲存後直接同步回此簡報"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>🎨 進入 Canva 自由排版微調</span>
                </button>

                <button
                  onClick={() => setIsTemplatePanelOpen(!isTemplatePanelOpen)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isTemplatePanelOpen ? '收合設定' : '母片上傳'}</span>
                </button>
              </div>
            </div>

            {/* Quick Theme Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs font-bold text-stone-500 shrink-0">🎨 主題風格：</span>
              {(['earth_zen', 'modern_tech', 'temple_heritage', 'graphite_jade', 'custom'] as const).map((tKey) => {
                const isSelected = themeId === tKey;
                const themeLabels = {
                  earth_zen: '🍃 人間佛教大地禪風',
                  modern_tech: '🔷 現代商務科技海軍藍',
                  temple_heritage: '🏮 法寶寺莊嚴朱金',
                  graphite_jade: '⚡ 青年極簡曜黑翡翠',
                  custom: customBgUrl ? '🎨 自訂上傳模板 (已套用)' : '🎨 自訂上傳模板'
                };
                return (
                  <button
                    key={tKey}
                    onClick={() => {
                      setThemeId(tKey);
                      const updated = buildSlidesFromReportData(reportData, layoutMode, tKey);
                      setSlides(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {themeLabels[tKey]}
                  </button>
                );
              })}
            </div>

            {/* Quick Layout Mode Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs font-bold text-stone-500 shrink-0">📐 活動版面樣式：</span>
              {(['quad_photos', 'dual_photos', 'single_hero', 'text_cards'] as const).map((lKey) => {
                const isSelected = layoutMode === lKey;
                const layoutLabels = {
                  quad_photos: '🖼️ 四宮格照片 + 數據亮點 (經典)',
                  dual_photos: '🌁 全景雙大圖對比',
                  single_hero: '🎯 單一焦點主圖 + 深度亮點',
                  text_cards: '📊 大數據成效指標卡'
                };
                return (
                  <button
                    key={lKey}
                    onClick={() => {
                      setLayoutMode(lKey);
                      const updated = buildSlidesFromReportData(reportData, lKey, themeId);
                      setSlides(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {layoutLabels[lKey]}
                  </button>
                );
              })}

              {/* Font Scale Toggle */}
              <div className="ml-auto pl-2 shrink-0 flex items-center gap-1">
                <span className="text-xs font-bold text-stone-500">字體：</span>
                <button
                  onClick={() => setFontSizeScale(fontSizeScale === 'standard' ? 'large' : 'standard')}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold hover:bg-stone-50 text-stone-700 cursor-pointer"
                  title="切換投影用放大字體"
                >
                  {fontSizeScale === 'large' ? '🔍 放大版 (投影適配)' : '標準版'}
                </button>
              </div>
            </div>

            {/* Upload Background / Logo collapsible panel */}
            {isTemplatePanelOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-xs font-black text-stone-700 mb-1">上傳自訂 PPT 母片底圖：</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBg}
                      className="text-xs text-stone-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 cursor-pointer"
                    />
                    {customBgUrl && (
                      <button
                        onClick={handleClearBg}
                        className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        清除底圖
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 mb-1">上傳青年團徽 / 單位 Logo：</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="text-xs text-stone-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 cursor-pointer"
                    />
                    {customLogoUrl && (
                      <button
                        onClick={handleClearLogo}
                        className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        清除 Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Slide Player Controller Bar */}
          <div className="bg-stone-900 text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-300">
                投影片 {currentSlideIndex + 1} / {slides.length}
              </span>
              <span className="hidden sm:inline text-xs text-stone-400">
                （支援鍵盤 ◀ ▶ 方向鍵或空白鍵切換）
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </button>

              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Enter Canva Studio directly for this slide */}
              <button
                onClick={() => setActiveTab('canva_studio')}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-black flex items-center gap-1.5 border border-stone-700 cursor-pointer"
                title="進入 Canva 編輯此頁之相片、標題、貼圖或徽章"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{getText('btn_fine_tune_slide', '微調此頁細節')}</span>
              </button>

              {/* Direct Google Slides Sync Button */}
              <button
                onClick={() => setIsGoogleSlidesModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                title="一鍵將此套簡報發布至 Google 簡報 (Google Slides)"
              >
                <Presentation className="w-4 h-4 text-stone-950" />
                <span>{getText('btn_google_slides_sync', 'Google 簡報')}</span>
              </button>

              {/* Export / Print Button */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                title="輸出成微軟 PPT 檔案、Google 簡報、或 16:9 PDF（包含 Canva 畫布所有修改成果）"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{getText('btn_export_slides', '輸出簡報')}</span>
                <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-bold">PPT / PDF</span>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* 16:9 Aspect Ratio Slide Stage (Single Source of Truth) */}
          {/* ---------------------------------------------------- */}
          <div 
            className="w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-stone-300 relative select-none"
            style={{
              backgroundColor: currentSlide?.style?.bgColor || (currentSlide?.type === 'cover' ? currentTheme.coverBg : currentTheme.contentBg),
              color: currentSlide?.style?.textColor || (currentSlide?.type === 'cover' ? '#FFFFFF' : '#1C1917'),
            }}
          >
            {/* Dedicated Background Image Layer with Pure White Fade Blend */}
            {(currentSlide?.style?.bgImageUrl || (customBgUrl && themeId === 'custom')) && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-white">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-opacity"
                  style={{
                    backgroundImage: `url("${currentSlide?.style?.bgImageUrl || customBgUrl}")`,
                    opacity: (currentSlide?.style?.bgOpacity ?? (currentSlide as any)?.backgroundOpacity ?? 1)
                  }}
                />
                {/* Explicit Pure White Layer: guarantees smooth, clean fade-to-white effect */}
                <div 
                  className="absolute inset-0 bg-white pointer-events-none transition-opacity"
                  style={{
                    opacity: Math.max(0, 1 - (currentSlide?.style?.bgOpacity ?? (currentSlide as any)?.backgroundOpacity ?? 1))
                  }}
                />
              </div>
            )}

            {/* Background Overlay (Dark / Light) */}
            {currentSlide?.style?.bgOverlay === 'dark' && (
              <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
            )}
            {currentSlide?.style?.bgOverlay === 'light' && (
              <div className="absolute inset-0 bg-white/40 pointer-events-none z-0" />
            )}

            {/* Custom Logo watermark */}
            {Boolean(customLogoUrl && customLogoUrl.trim()) && (
              <img
                src={customLogoUrl}
                alt="Logo"
                className="h-7 w-auto object-contain absolute top-4 right-5 opacity-80 pointer-events-none z-20"
              />
            )}

            {/* Dynamic Rendering of Slide Elements */}
            {currentSlide?.elements && currentSlide.elements.map(elem => (
              <div
                key={elem.id}
                style={{
                  position: 'absolute',
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  width: `${elem.w}%`,
                  height: `${elem.h}%`,
                  backgroundColor: elem.bgColor || 'transparent',
                  color: elem.color || (currentSlide.type === 'cover' ? '#FFFFFF' : '#1C1917'),
                  fontFamily: elem.fontFamily || 'inherit',
                  fontSize: `${elem.fontSize || 16}px`,
                  fontWeight: elem.fontWeight === 'black' ? 900 : elem.fontWeight === 'bold' ? 700 : 400,
                  fontStyle: elem.fontStyle || 'normal',
                  textDecoration: elem.textDecoration || 'none',
                  textAlign: elem.textAlign || 'left',
                  borderRadius: `${elem.borderRadius || 0}px`,
                  borderColor: elem.borderColor,
                  borderWidth: elem.borderWidth ? `${elem.borderWidth}px` : undefined,
                  zIndex: elem.zIndex || 10,
                  boxShadow: elem.shadow ? '0 10px 25px -5px rgba(0,0,0,0.1)' : undefined,
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {elem.type === 'photo' || elem.type === 'media' ? (
                  <div className="w-full h-full flex flex-col rounded-xl overflow-hidden bg-stone-900 border border-stone-200/80 shadow-xs">
                    <div className="flex-1 w-full overflow-hidden relative">
                      {elem.mediaType === 'video' ? (
                        elem.content ? (
                          <video
                            src={elem.content}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400 text-xs">無影片內容</div>
                        )
                      ) : (
                        elem.content ? (
                          <img
                            src={elem.content}
                            alt={elem.title || 'Photo'}
                            className="w-full h-full"
                            style={{ objectFit: elem.objectFit || 'cover' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400 text-xs">無相片內容</div>
                        )
                      )}
                    </div>
                    {elem.title && (
                      <div className="p-1.5 bg-white/95 text-xs font-bold text-stone-800 truncate border-t border-stone-100 flex items-center justify-between">
                        <span className="truncate">📷 {elem.title}</span>
                      </div>
                    )}
                  </div>
                ) : elem.type === 'table' ? (
                  <div className="w-full h-full overflow-hidden flex flex-col bg-white rounded-xl shadow-xs border" style={{ borderColor: elem.tableBorderColor || '#E7E5E4' }}>
                    {elem.tableData && elem.tableData.length > 0 && (
                      <table className="w-full h-full text-left border-collapse" style={{ fontSize: `${elem.fontSize || 12}px` }}>
                        <thead>
                          <tr style={{ backgroundColor: elem.tableHeaderBg || '#4A7C59', color: '#FFFFFF' }}>
                            {elem.tableData[0]?.map((colHeader, cIdx) => (
                              <th key={cIdx} className="px-2.5 py-1.5 font-bold border-b text-xs" style={{ borderColor: elem.tableBorderColor || 'rgba(255,255,255,0.2)' }}>
                                {colHeader}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {elem.tableData.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-stone-50/50' : 'bg-white'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-2.5 py-1 border-b" style={{ borderColor: elem.tableBorderColor || '#E7E5E4' }}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : elem.type === 'number_kpi' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded-xl text-center shadow-xs">
                    {elem.title && (
                      <div className="text-xs font-bold text-stone-500 mb-0.5">{elem.title}</div>
                    )}
                    <div className="text-3xl sm:text-4xl font-black leading-none" style={{ color: elem.color || currentTheme.accentColor }}>
                      {elem.content}
                    </div>
                  </div>
                ) : elem.type === 'badge' ? (
                  <div className="w-full h-full flex items-center justify-center font-black text-xs shadow-xs">
                    {elem.content}
                  </div>
                ) : elem.type === 'sticker' ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ fontSize: `${elem.fontSize || 44}px` }}>
                    {elem.content}
                  </div>
                ) : elem.type === 'shape' ? (
                  <div className="w-full h-full" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center"
                    style={{
                      padding: elem.bgColor && elem.bgColor !== 'transparent' ? '12px 16px' : '0',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.45
                    }}
                  >
                    {elem.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Slide Thumbnails Filmstrip Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  currentSlideIndex === idx
                    ? 'bg-amber-500 text-stone-950 border-amber-500 font-black shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                P.{idx + 1} {
                  s.type === 'cover' ? '封面' :
                  s.type === 'agenda' ? '四大核心目錄' :
                  s.type === 'category_divider' ? `章節：${s.category?.short_name || '分類'}` :
                  s.type === 'activity' ? `${(s.title || '活動簡報').slice(0, 8)}...` :
                  s.type === 'summary' ? '數據總結' :
                  s.type === 'thank_you' ? '感謝頁' : (s.title || '自訂頁')
                }
              </button>
            ))}
          </div>

        </div>
      )}

      {/* 4. Canva Interactive Studio Tab */}
      {activeTab === 'canva_studio' && (
        <SlideCanvaStudio
          reportData={reportData}
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onSelectSlide={setCurrentSlideIndex}
          onUpdateSlides={setSlides}
          onUpdateSlideElement={updateSlideElement}
          onAddSlideElement={addSlideElement}
          onDeleteSlideElement={deleteSlideElement}
          onUpdateSlide={updateSlide}
          onUpdateSlideLayout={updateSlideLayout}
          currentTheme={currentTheme}
          customBgUrl={customBgUrl}
          customLogoUrl={customLogoUrl}
          onSwitchToPreview={() => {
            setActiveTab('slides');
            setToastMessage('✅ 已保存自訂設定並返回簡報播放頁面！');
            setTimeout(() => setToastMessage(''), 3500);
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          activities={activities}
          selectedIds={selectedIds}
          onToggleSelectActivity={handleToggleSelect}
          onSelectAllActivities={handleSelectAll}
          onRegenerateSlides={() => handleGenerateSlides('canva_studio')}
        />
      )}

      {/* Structured Output: JSON Mode */}
      {activeTab === 'json' && (
        <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl shadow-md border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm text-white">
                乾淨 JSON 輸出 (Structured Output)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyContent(jsonOutput, 'json')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedState === 'json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedState === 'json' ? '已複製 JSON！' : '一鍵複製 JSON'}</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-stone-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載 JSON 檔</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[550px] leading-relaxed">
            {jsonOutput}
          </pre>
        </div>
      )}

      {/* Structured Output: Markdown Mode */}
      {activeTab === 'markdown' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-sm text-stone-900">
                條列式文字報告 (易於複製套版至簡報講稿與會議記錄)
              </span>
            </div>

            <button
              onClick={() => handleCopyContent(markdownOutput, 'md')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedState === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedState === 'md' ? '已複製 Markdown！' : '一鍵複製文字報告'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-mono text-xs overflow-x-auto max-h-[550px] leading-relaxed whitespace-pre-wrap">
            {markdownOutput}
          </pre>
        </div>
      )}

      {/* PPT / PDF / Google Slides Export Modal */}
      <PPTExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportData={reportData}
        slides={slides}
        themeId={themeId}
        layoutMode={layoutMode}
        fontSizeScale={fontSizeScale}
        customBgUrl={customBgUrl}
        customLogoUrl={customLogoUrl}
        onOpenGoogleSlidesModal={() => {
          setIsExportModalOpen(false);
          setIsGoogleSlidesModalOpen(true);
        }}
      />

      {/* Direct Google Slides Modal */}
      <GoogleSlidesModal
        isOpen={isGoogleSlidesModalOpen}
        onClose={() => setIsGoogleSlidesModalOpen(false)}
        slides={slides}
        defaultTitle={reportData?.title || '【聯團會議簡報】新竹佛光青年工作成果與工作報告'}
        onImportSlides={(imported) => {
          setSlides(imported);
          setCurrentSlideIndex(0);
        }}
      />

    </div>
  );
};
