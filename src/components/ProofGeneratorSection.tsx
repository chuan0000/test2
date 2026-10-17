import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Copy, 
  Sparkles, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  Eye, 
  Edit3, 
  Check, 
  Calendar, 
  MapPin, 
  Users, 
  FileType, 
  Save, 
  UploadCloud, 
  ExternalLink, 
  FolderOpen, 
  Compass, 
  Tag, 
  ArrowRight, 
  RefreshCw, 
  Link2,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Info,
  Building,
  BarChart3,
  MessageSquare,
  ClipboardList,
  PlusCircle,
  Search,
  X
} from 'lucide-react';
import { ProofDocumentData, QuantitativeMetricItem } from '../utils/proofHtmlGenerator';
import { generateWordDocumentBlob, copyFormattedTextForGoogleDocs } from '../utils/wordExportHelper';
import { 
  getStoredActivities, 
  getStoredProofDocuments, 
  getStoredProofDocumentsAsync,
  saveProofToArchives, 
  saveStoredProofDocuments,
  convertActivityToProofDocument,
  matchActivityYear,
  extractYearFromDateString
} from '../utils/activityStorage';
import { compressImageFile, formatGoogleDriveImageUrl } from '../utils/imageCompressor';
import { OfficialProofDocument } from './OfficialProofDocument';
import { openPrintableDocumentInNewTab } from '../utils/pdfPrintHelper';
import { FacebookActivityImportModal } from './FacebookActivityImportModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { GoogleDocsModal } from './GoogleDocsModal';

export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1eNQC2dbPhq6GaEINJ6xsYqOuGtU63gLk?usp=drive_link';
export const GOOGLE_DRIVE_FOLDER_ID = '1eNQC2dbPhq6GaEINJ6xsYqOuGtU63gLk';

const NATURE_OPTIONS = [
  { id: '總團活動', label: '1. 總團/總會活動', desc: '中華佛光青年總團/總會主辦或督導之全國/全區大型專案' },
  { id: '法寶寺道場活動', label: '2. 法寶寺道場活動', desc: '新竹法寶寺常住法會、共修、作務出坡與節慶活動' },
  { id: '參加友團活動', label: '3. 參加友團活動', desc: '跨區聯團、友團例會交流、觀摩參訪或跨界合作' }
];

const OBJECTIVE_OPTIONS = [
  { id: '以文化弘揚佛法 / 以教育培養人才', label: '1. 文化弘揚佛法 / 教育培養人才', icon: '🎨' },
  { id: '以慈善福利社會', label: '2. 慈善福利社會', icon: '❤️' },
  { id: '以共修淨化人心', label: '3. 共修淨化人心', icon: '🙏' },
  { id: '聯誼活動', label: '4. 聯誼活動', icon: '🤝' }
];

const QUICK_CAPTION_TEMPLATES = [
  { id: '報到開場', label: '報到開場', text: '08:45 報到環節：學員陸續抵達現場完成數位簽到與手冊領取，工作人員引導分組入座。' },
  { id: '長官致詞', label: '長官致詞', text: '主辦長官與輔導法師親臨致詞勉勵，期勉全體青年發揮熱忱、精進學習並將佛法融入生活。' },
  { id: '專題授課', label: '專題授課', text: '專業講師進行核心專題講授，運用實務案例與圖解引導學員深入掌握核心要領。' },
  { id: '分組實作', label: '分組實作', text: '青年分組開展實戰演練與個案討論，團隊成員分工合作、激盪創意並互助共學。' },
  { id: '成果發表', label: '成果發表', text: '各組代表上台進行亮點成果簡報與實作示範，現場交流熱烈、收穫豐碩。' },
  { id: '座談問答', label: '座談問答', text: '綜合座談與提問交流時段，講師針對青年實務疑問逐一深入解答與精準點評。' },
  { id: '頒獎受證', label: '頒獎受證', text: '活動尾聲進行優秀成果表揚與結業受證儀式，肯定全體青年積極投入之學習成果。' },
  { id: '圓滿合影', label: '圓滿合影', text: '全體青年團員、授課導師與貴賓輔導法師於活動圓滿之際歡喜比讚大合影。' },
  { id: '心靈茶禪', label: '心靈茶禪', text: '青年團員於法寶寺禪堂開展茶禪一味心靈回饋分享，沉澱思緒並深化同儕凝聚力。' }
];

interface ProofGeneratorSectionProps {
  onNavigateToArchives?: () => void;
  initialData?: ProofDocumentData;
}

export const ProofGeneratorSection: React.FC<ProofGeneratorSectionProps> = ({ 
  onNavigateToArchives,
  initialData 
}) => {
  // Preset demo activities aligned with screenshot style
  const presetActivities: ProofDocumentData[] = useMemo(() => {
    return [
      {
        id: 'preset-ai-workshop',
        title: '115年度前瞻數位轉型：生成式 AI 實務應用與工作效率躍升研習營',
        date: '2026年08月18日 (二)',
        timeRange: '09:00 - 16:30',
        location: '國家文官學院 菁英講堂（台北市南港區忠孝東路七段576號）',
        activityNature: '總團活動',
        activityObjective: '教育培養人才',
        activityObjectives: ['教育培養人才', '文化弘揚佛法'],
        organizer: '數位發展推動小組 / 綜合規劃司',
        executingUnit: '前瞻科技培訓中心',
        guidingUnit: '台灣人工智慧應用研究學會',
        targetAudience: '各部會資訊、企劃、研發主管及專案核心承辦同仁',
        internalCount: 45,
        externalCount: 20,
        totalCount: 65,
        expectedCount: 60,
        attendanceRate: '108.3% (超額出席)',
        summary: '響應政府數位永續轉型政策，深化公務同仁對生成式 AI 輔助文書彙整、數據視覺化與行政流程自動化之實戰能力，全面提升行政效能與專案管考精準度。',
        highlights: [
          '【名師引領與政策方針】：邀請產學權威專家剖析最新 AI 科技趨勢與資訊安全合規指引。',
          '【分組實戰與個案演練】：學員攜帶實際專案案例，完成 4 類行政任務自動化 Prompt 模組設計。',
          '【即時競賽與成果產出】：6 組學員於 90 分鐘內完成活動結案報告與儀表板自動產製示範。',
          '【跨部會交流與資源共享】：建立即時交流社群，凝聚跨單位資訊共享共識。'
        ],
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
            caption: '08:45 報到環節：學員陸續抵達現場完成數位簽到與手冊領取，工作人員引導分組入座。'
          },
          {
            url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
            caption: '【專題授課】：資深講師深入剖析最新生成式 AI 提示詞工程架構與行政自動化流程。'
          },
          {
            url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
            caption: '【分組實作】：各組學員熱烈研討並現場演練自動化 Prompt 模組與結案報表生成。'
          },
          {
            url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
            caption: '【圓滿合影】：全體學員與授課專家導師於研習營結業之際歡喜大合照。'
          }
        ],
        suggestions: [
          '【時間配置優化】：實作環節討論熱烈，建議未來進階班可延長分組競賽時間 30 分鐘，深化個案打磨。',
          '【設備網路頻寬】：現場多機同時進行大型模型計算，建議後續場次預先配置專屬企業級 Wi-Fi 頻寬。',
          '【回流追蹤機制】：建議於培訓後 1 個月安排線上回流諮詢輔導，落實日常業務應用成效。'
        ],
        reporterName: '專案經理 陳建宏',
        reportDate: '2026/08/20',
        quantitativeMetrics: [
          { id: 'm1', name: '實到出席人數', value: '65 人', benchmark: '預計 60 人（達成率 108.3%）' },
          { id: 'm2', name: '整體課程滿意度', value: '97.4%', benchmark: '目標 ≥ 90%（顯著達標）' },
          { id: 'm3', name: '實作成效產出率', value: '100%', benchmark: '6 組全數完成專案任務模組' },
          { id: 'm4', name: '課後行動方案填寫率', value: '98.5%', benchmark: '64 份有效實踐承諾表' }
        ],
        participantFeedback: '學員普遍反映「課程內容高度契合實務痛點，尤其是圖說自動生成與公務表格萃取技巧，能大幅縮短每日文書處理時間達 40% 以上，強烈建議納入常態性年度培訓」。',
        vipFeedback: '數位司指導長官致詞表示：「本次培訓展現各單位積極擁抱新科技的熱忱，實作產出的成果非常亮眼，值得在全機關推廣擴散。」',
        extendedBenefits: '已建立專屬跨單位實踐交流群組，預計於下季度召開第一階段成果追蹤分享會，持續擴散實踐效益。'
      },
      {
        id: 'preset-buddha-zen',
        title: '新竹區青年團戶外生活禪古道行 ✕ 森林正念步道',
        date: '2026年07月18日 (六)',
        timeRange: '08:30 - 16:00',
        location: '新竹十八尖山森林步道 ✕ 佛光山法寶寺禪堂',
        activityNature: '法寶寺道場活動',
        activityObjective: '文化弘揚佛法',
        activityObjectives: ['文化弘揚佛法', '聯誼活動'],
        organizer: '國際佛光會中華佛光青年總團 / 新竹青年分團',
        executingUnit: '新竹青年分團活動企劃組',
        guidingUnit: '佛光山法寶寺',
        targetAudience: '新竹地區大專與社會青年、幹部及對禪修有興趣之大眾',
        internalCount: 24,
        externalCount: 8,
        totalCount: 32,
        expectedCount: 30,
        attendanceRate: '106.7% (超額出席)',
        summary: '國際佛光會新竹青年分團舉辦戶外生活禪古道行，引領 32 位青年放下都市喧囂與手機束縛。透過正念行禪、森林觀呼吸與茶禪一味心靈回饋，將人間佛教禪法化為青年日常紓壓妙方，深化青年對佛法的體悟與同儕凝聚力。',
        highlights: [
          '【正念森林行禪】：引領青年於十八尖山古道進行沈浸式觀呼吸與身心覺察。',
          '【茶禪一味座談】：於法寶寺禪堂由輔導法師帶領茶席品茗與法義心靈交流。',
          '【無常與生活智慧分享】：青年幹部分組探討如何運用佛法觀念排解職場壓力與人際困擾。'
        ],
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
            caption: '圖說：新竹青年於十八尖山步道中進行正念行禪與觀呼吸修持'
          },
          {
            url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
            caption: '圖說：青年團員於法寶寺禪堂開展茶禪一味心靈回饋分享'
          },
          {
            url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
            caption: '圖說：全體青年團員與輔導法師於綠意森林中歡喜大合照'
          }
        ],
        suggestions: [
          '【場地交通接駁】：戶外集合點較為分散，未來可安排統一於法寶寺接駁發車。',
          '【常態修持延續】：建議每季固定舉辦一次半日生活禪，維持青年修持習慣。'
        ],
        reporterName: '秘書 周汶蔚',
        reportDate: '2026/07/20',
        quantitativeMetrics: [
          { id: 'm1', name: '實到出席人數', value: '32 人', benchmark: '預計 30 人（達成率 106.7%）' },
          { id: 'm2', name: '活動整體滿意度', value: '98.2%', benchmark: '目標 ≥ 95%' },
          { id: 'm3', name: '新加入青年比例', value: '25%', benchmark: '8 位首次接觸佛光青年活動' }
        ],
        participantFeedback: '青年分享在森林中赤足接觸大地行禪，徹底洗滌了平時工作的緊繃焦慮，非常歡喜能認識一群正向善良的佛光夥伴。',
        vipFeedback: '法寶寺住持勉勵青年「把禪法落實在行住坐臥，在動中磨練定力，在靜中涵養智慧」。',
        extendedBenefits: '其中 5 位新青年主動報名下半年度青年書院課程，展現優秀接引成效。'
      }
    ];
  }, []);

  // Saved proof documents from storage
  const [savedProofs, setSavedProofs] = useState<ProofDocumentData[]>(() => getStoredProofDocuments());

  // Form draft persistence key
  const CURRENT_PROOF_DRAFT_KEY = 'blia_proof_form_draft_v2';

  // Helper to create a truly clean blank proof document
  const createCleanBlankProof = (): ProofDocumentData => ({
    id: `act-${Date.now()}`,
    title: '',
    date: new Date().toISOString().slice(0, 10),
    timeRange: '09:00 ~ 12:00',
    location: '',
    activityNature: '青年團活動',
    activityObjective: '以文化弘揚佛法',
    activityObjectives: ['以文化弘揚佛法'],
    organizer: '中華佛光青年總團',
    executingUnit: '新竹青年分團',
    guidingUnit: '佛光山法寶寺',
    targetAudience: '佛光青年、幹部及社會大眾',
    internalCount: 0,
    externalCount: 0,
    totalCount: 0,
    expectedCount: 0,
    attendanceRate: '100%',
    summary: '',
    highlights: [],
    suggestions: [],
    quantitativeMetrics: [],
    participantFeedback: '',
    vipFeedback: '',
    extendedBenefits: '',
    reporterName: '新竹青年分團幹部',
    reportDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    photos: []
  });

  // Form State initialized from props, local draft, archives, or clean blank template
  const [formData, setFormData] = useState<ProofDocumentData>(() => {
    if (initialData) return initialData;
    try {
      const draft = localStorage.getItem(CURRENT_PROOF_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.id || parsed.title !== undefined)) {
          return parsed;
        }
      }
    } catch {}
    const stored = getStoredProofDocuments();
    if (stored.length > 0) return stored[0];
    return createCleanBlankProof();
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(formData.id || '');

  // Synchronize when initialData prop changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedTemplateId(initialData.id || 'imported-activity');
    }
  }, [initialData]);

  // Persist form draft on change so switching tabs or reloading retains current input
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_PROOF_DRAFT_KEY, JSON.stringify(formData));
    } catch (err) {
      try {
        const lightweight = {
          ...formData,
          photos: formData.photos.map(p => ({
            ...p,
            url: p.url.length > 500 ? '' : p.url
          }))
        };
        localStorage.setItem(CURRENT_PROOF_DRAFT_KEY, JSON.stringify(lightweight));
      } catch {}
    }
  }, [formData]);

  // Asynchronous sync with high-capacity IndexedDB on mount & listen to changes
  useEffect(() => {
    let isMounted = true;
    getStoredProofDocumentsAsync().then((docs) => {
      if (isMounted && docs && docs.length > 0) {
        setSavedProofs(docs);
      }
    });

    const handleProofsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSavedProofs(e.detail);
      }
    };

    window.addEventListener('blia_proofs_changed', handleProofsChanged);
    return () => {
      isMounted = false;
      window.removeEventListener('blia_proofs_changed', handleProofsChanged);
    };
  }, []);

  // Collapsible section toggle states (default all open)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true,
    sec5: true
  });

  const toggleSection = (secKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey]
    }));
  };

  // View state: 'editor' (default) or 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Status & Modal states
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<{ title: string; id: string } | null>(null);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState<boolean>(false);
  const [showLoadFromArchivesModal, setShowLoadFromArchivesModal] = useState<boolean>(false);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [showFacebookModal, setShowFacebookModal] = useState<boolean>(false);
  const [archivesSearchKeyword, setArchivesSearchKeyword] = useState<string>('');
  const [archiveSelectedYear, setArchiveSelectedYear] = useState<string | 'all'>('all');
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);
  const [customDriveUrlInput, setCustomDriveUrlInput] = useState<string>('');

  // All stored activities for loading
  const allStoredActivities = useMemo(() => getStoredActivities(), [showLoadFromArchivesModal]);

  const filteredStoredActivities = useMemo(() => {
    let list = allStoredActivities;
    if (archiveSelectedYear !== 'all') {
      list = list.filter(a => matchActivityYear(a, archiveSelectedYear));
    }
    if (!archivesSearchKeyword.trim()) return list;
    const kw = archivesSearchKeyword.toLowerCase();
    return list.filter(a => 
      a.title.toLowerCase().includes(kw) ||
      a.location.toLowerCase().includes(kw) ||
      a.date.toLowerCase().includes(kw) ||
      (a.activityNature && a.activityNature.toLowerCase().includes(kw)) ||
      (a.activityObjective && a.activityObjective.toLowerCase().includes(kw))
    );
  }, [allStoredActivities, archivesSearchKeyword, archiveSelectedYear]);

  // Create clean blank activity template
  const handleCreateNewBlankActivity = () => {
    const blank = createCleanBlankProof();
    setFormData(blank);
    setSelectedTemplateId(blank.id || '');
    setActiveTab('editor');
    setSaveSuccessNotice({
      title: '已建立全新空白活動表單！儲存時會成為獨立新紀錄，絕不覆蓋現有活動！',
      id: blank.id || ''
    });
  };

  // User-initiated load of official preset template
  const handleLoadPresetActivity = (preset: ProofDocumentData) => {
    const loadedDoc: ProofDocumentData = {
      ...preset,
      id: `act-${Date.now()}`
    };
    setFormData(loadedDoc);
    setSelectedTemplateId(preset.id);
    setShowPresetModal(false);
    setActiveTab('editor');
    setSaveSuccessNotice({
      title: `已成功載入示範範本「${preset.title}」！您可以修改佐證資料、替換照片並隨時儲存或輸出 Word！`,
      id: loadedDoc.id
    });
  };

  // Load activity from archives into form
  const handleLoadActivityFromArchives = (act: any) => {
    const proofDoc = convertActivityToProofDocument(act);
    setFormData(proofDoc);
    setSelectedTemplateId(proofDoc.id || act.id);
    setShowLoadFromArchivesModal(false);
    setActiveTab('editor');
    setSaveSuccessNotice({
      title: `已成功載入活動「${act.title}」！您可以修改佐證資料、替換照片並隨時儲存或輸出 Word！`,
      id: act.id
    });
  };

  // File input ref for uploading local photos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacePhotoIdxRef = useRef<number | null>(null);

  // Sync saved list
  const refreshSavedList = () => {
    setSavedProofs(getStoredProofDocuments());
  };

  // 1. SAVE FEATURE: Save into Archives & Local Proof List with reliable confirmation
  const handleSaveToArchives = () => {
    const matchedActivity = saveProofToArchives(formData);
    refreshSavedList();
    setSaveSuccessNotice({
      title: matchedActivity.title,
      id: matchedActivity.id
    });
  };

  // 2. PHOTO UPLOAD FEATURE: Handle local image selection with smart canvas compression
  const handleTriggerAddLocalPhoto = () => {
    replacePhotoIdxRef.current = null;
    fileInputRef.current?.click();
  };

  const handleTriggerReplacePhoto = (index: number) => {
    replacePhotoIdxRef.current = index;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    const fileList = Array.from(files) as File[];
    const newLoadedPhotos: Array<{ url: string; caption: string }> = [];

    for (let fIdx = 0; fIdx < fileList.length; fIdx++) {
      const file = fileList[fIdx];
      try {
        const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.82);
        const defaultCaption = `【佐證照片 ${formData.photos.length + fIdx + 1}】：${formData.title || '活動'}現場實況紀錄。`;
        newLoadedPhotos.push({
          url: compressedDataUrl,
          caption: defaultCaption
        });
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    if (replacePhotoIdxRef.current !== null) {
      const targetIdx = replacePhotoIdxRef.current;
      setFormData((prev) => {
        const updated = [...prev.photos];
        if (updated[targetIdx] && newLoadedPhotos[0]) {
          updated[targetIdx] = {
            ...updated[targetIdx],
            url: newLoadedPhotos[0].url
          };
        }
        return { ...prev, photos: updated };
      });
    } else {
      setFormData((prev) => {
        const merged = [...prev.photos, ...newLoadedPhotos].slice(0, 8);
        return { ...prev, photos: merged };
      });
    }

    setIsProcessingPhotos(false);
    setShowDriveModal(true);

    if (e.target) {
      e.target.value = '';
    }
  };

  // Open Google Drive Folder
  const handleOpenGoogleDriveFolder = () => {
    window.open(GOOGLE_DRIVE_FOLDER_URL, '_blank', 'noopener,noreferrer');
  };

  // Add photo via Google Drive Sharing Link
  const handleAddFromDriveLink = () => {
    if (!customDriveUrlInput.trim()) return;
    const directUrl = formatGoogleDriveImageUrl(customDriveUrlInput.trim());
    setFormData((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          url: directUrl,
          caption: `【佐證照片 ${prev.photos.length + 1}】：${prev.title || '活動佐證照片'}（已連結 Google 雲端相簿）`
        }
      ].slice(0, 8)
    }));
    setCustomDriveUrlInput('');
    setShowDriveModal(false);
  };

  // Reorder photos
  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const photos = [...prev.photos];
      if (direction === 'up' && index > 0) {
        const temp = photos[index];
        photos[index] = photos[index - 1];
        photos[index - 1] = temp;
      } else if (direction === 'down' && index < photos.length - 1) {
        const temp = photos[index];
        photos[index] = photos[index + 1];
        photos[index + 1] = temp;
      }
      return { ...prev, photos };
    });
  };

  // Apply Quick Template to Caption
  const handleApplyCaptionTemplate = (photoIdx: number, templateText: string) => {
    setFormData((prev) => {
      const updated = [...prev.photos];
      if (updated[photoIdx]) {
        updated[photoIdx] = {
          ...updated[photoIdx],
          caption: templateText
        };
      }
      return { ...prev, photos: updated };
    });
  };

  // Generate All Captions
  const handleGenerateAllCaptions = () => {
    setFormData((prev) => {
      const updated = prev.photos.map((p, idx) => {
        const template = QUICK_CAPTION_TEMPLATES[idx % QUICK_CAPTION_TEMPLATES.length];
        return {
          ...p,
          caption: `【${template.label}】：${prev.title || '活動'}現場，${template.text}`
        };
      });
      return { ...prev, photos: updated };
    });
  };

  // Highlights handlers
  const handleAddHighlight = () => {
    setFormData((prev) => ({
      ...prev,
      highlights: [...(prev.highlights || []), '【新增亮點項目】：請輸入該流程重點與成效說明...']
    }));
  };

  const handleUpdateHighlight = (index: number, value: string) => {
    setFormData((prev) => {
      const list = [...(prev.highlights || [])];
      list[index] = value;
      return { ...prev, highlights: list };
    });
  };

  const handleDeleteHighlight = (index: number) => {
    setFormData((prev) => {
      const list = (prev.highlights || []).filter((_, i) => i !== index);
      return { ...prev, highlights: list };
    });
  };

  // Suggestions handlers
  const handleAddSuggestion = () => {
    setFormData((prev) => ({
      ...prev,
      suggestions: [...(prev.suggestions || []), '【後續精進建議】：請輸入具體改善方向與追蹤期程...']
    }));
  };

  const handleUpdateSuggestion = (index: number, value: string) => {
    setFormData((prev) => {
      const list = [...(prev.suggestions || [])];
      list[index] = value;
      return { ...prev, suggestions: list };
    });
  };

  const handleDeleteSuggestion = (index: number) => {
    setFormData((prev) => {
      const list = (prev.suggestions || []).filter((_, i) => i !== index);
      return { ...prev, suggestions: list };
    });
  };

  // Quantitative Metrics handlers
  const handleAddMetric = () => {
    setFormData((prev) => ({
      ...prev,
      quantitativeMetrics: [
        ...(prev.quantitativeMetrics || []),
        {
          id: `m-${Date.now()}`,
          name: '新成效指標',
          value: '100%',
          benchmark: '達標備註說明'
        }
      ]
    }));
  };

  const handleUpdateMetric = (index: number, field: keyof QuantitativeMetricItem, val: string) => {
    setFormData((prev) => {
      const list = [...(prev.quantitativeMetrics || [])];
      if (list[index]) {
        list[index] = { ...list[index], [field]: val };
      }
      return { ...prev, quantitativeMetrics: list };
    });
  };

  const handleDeleteMetric = (index: number) => {
    setFormData((prev) => {
      const list = (prev.quantitativeMetrics || []).filter((_, i) => i !== index);
      return { ...prev, quantitativeMetrics: list };
    });
  };

  // Download Word
  const handleDownloadWord = () => {
    const blob = generateWordDocumentBlob(formData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanDate = (formData.date || '活動').replace(/[\/\-\.\s]/g, '');
    const cleanTitle = (formData.title || '佐證資料表').replace(/[\s\/:*?"<>|]/g, '_');
    a.download = `活動佐證報告_${cleanDate}_${cleanTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setCopyStatus('word_downloaded');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // Copy for Google Docs
  const handleCopyForGoogleDocs = async () => {
    const success = await copyFormattedTextForGoogleDocs(formData);
    if (success) {
      setCopyStatus('docs_copied');
      setTimeout(() => setCopyStatus(''), 3500);
    } else {
      alert('複製失敗，建議直接點擊「下載 Word 檔」開啟即可。');
    }
  };

  // Auto calculate Attendance Rate
  const calcAttendanceRate = useMemo(() => {
    const total = Number(formData.totalCount) || ((Number(formData.internalCount) || 0) + (Number(formData.externalCount) || 0));
    const expected = Number(formData.expectedCount) || 0;
    if (expected > 0) {
      const rate = ((total / expected) * 100).toFixed(1);
      if (total >= expected) {
        return `${rate}% (超額出席)`;
      }
      return `${rate}% (出席率)`;
    }
    return formData.attendanceRate || '100% (全額出席)';
  }, [formData.totalCount, formData.internalCount, formData.externalCount, formData.expectedCount, formData.attendanceRate]);

  const photoCount = formData.photos.length;
  const currentObjectives = formData.activityObjectives || (formData.activityObjective ? [formData.activityObjective] : ['文化弘揚佛法']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Main Navigation & Export Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 print:hidden">
        
        {/* Upper Row: Title, Current Status & Fast Source Creation Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>優秀分團選拔活動佐證資料表</span>
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                標準五大欄位佐證
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>當前編輯：</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-200 max-w-xs truncate">
                {formData.title || '（全新空白活動）'}
              </span>
            </div>
          </div>

          {/* Activity Creation & Import Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCreateNewBlankActivity}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-sm hover:shadow cursor-pointer transition-all active:scale-95"
              title="開啟全新空白活動表格（指派全新專屬 ID，儲存時絕不覆蓋現有活動）"
            >
              <PlusCircle className="w-4 h-4 text-blue-200" />
              <span>＋ 新增空白活動</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLoadFromArchivesModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="從分團專案活動成果檔案庫載入既有活動進行修改"
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>📂 從檔案庫載入修改</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFacebookModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="貼上 Facebook 連結或活動內容，快速輸入 facebook 活動"
            >
              <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-black text-[11px] leading-none">f</span>
              <span>🔗 貼上 FB 連結匯入</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPresetModal(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="選擇載入官方示範活動範本進行參考或排版練習"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>🌟 載入示範範本</span>
            </button>
          </div>
        </div>

        {/* Lower Row: View Switcher & Core Output Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* View Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>表單編輯</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>A4 報表預覽</span>
            </button>
          </div>

          {/* Export & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveToArchives}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>儲存至活動檔案庫</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="下載 Microsoft Word 檔案"
            >
              <FileType className="w-3.5 h-3.5 text-blue-400" />
              <span>{copyStatus === 'word_downloaded' ? '✅ 已下載' : '下載 Word (.doc)'}</span>
            </button>

            <button
              onClick={() => setShowGoogleDocsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="一鍵同步並在 Google 雲端硬碟建立官方 Google 文件"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>匯出至 Google 文件</span>
            </button>

            <button
              onClick={handleCopyForGoogleDocs}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="複製排版內容至 Google 文件"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copyStatus === 'docs_copied' ? '✅ 已複製！' : '複製到 Google 文件'}</span>
            </button>

            <button
              onClick={() => openPrintableDocumentInNewTab([formData])}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
              title="在新分頁開啟列印並另存為 PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Save Success Notice Banner */}
      {saveSuccessNotice && (
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm">已成功儲存至「分團專案活動成果檔案庫」！</div>
              <div className="text-xs text-white/90">
                活動名稱：<strong>{saveSuccessNotice.title}</strong>（五大區塊欄位與佐證相片皆已完整入庫）
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToArchives && (
              <button
                onClick={onNavigateToArchives}
                className="px-4 py-2 bg-white text-blue-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
              >
                <span>前往成果檔案庫</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSaveSuccessNotice(null)}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Google Docs Copy Notification */}
      {copyStatus === 'docs_copied' && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs print:hidden animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <strong>已成功複製至剪貼簿！</strong> 請打開您的 <a href="https://docs.google.com/document/u/0/create" target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-700 hover:text-emerald-900">Google 文件 (點此開啟空白文件)</a>，直接按 <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold">Ctrl + V</kbd> 貼上即可。
          </div>
        </div>
      )}

      {/* Google Drive & Google Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        defaultActivityTitle={formData.title}
        onPhotosImported={(newPhotos) => {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos],
          }));
        }}
      />

      {/* Load Activity From Archives Modal Dialog */}
      {showLoadFromArchivesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    從分團專案活動成果檔案庫載入活動
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    選取活動後將自動套入完整表單，可修改佐證資料、更換照片並下載 Word 報告
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoadFromArchivesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar & Year Filter */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜尋活動名稱、日期、地點或活動性質..."
                  value={archivesSearchKeyword}
                  onChange={(e) => setArchivesSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Year Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', '2026', '2025', '2024'] as const).map((yr) => {
                  const count = yr === 'all' 
                    ? allStoredActivities.length 
                    : allStoredActivities.filter(a => matchActivityYear(a, yr)).length;
                  const isSelected = archiveSelectedYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setArchiveSelectedYear(yr)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                      }`}
                    >
                      <span>{yr === 'all' ? '全部年度' : `${yr} 年度`}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {filteredStoredActivities.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  查無符合「{archivesSearchKeyword}」的活動紀錄
                </div>
              ) : (
                filteredStoredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {act.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {act.activityNature === '總團活動' ? '總團/總會活動' : (act.activityNature || '總團/總會活動')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" /> {act.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" /> {act.location || '佛光山法寶寺'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" /> 出席 {act.attendeeTotal || 30} 人
                        </span>
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> {act.photos?.length || 0} 張相片
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoadActivityFromArchives(act)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>載入此活動編輯</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                共 {filteredStoredActivities.length} 項檔案庫紀錄
              </span>
              <button
                type="button"
                onClick={() => setShowLoadFromArchivesModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                關閉
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Facebook Activity Import Modal */}
      <FacebookActivityImportModal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        onApplyData={(parsedData) => {
          setFormData(parsedData);
          setSaveSuccessNotice({ title: parsedData.title, id: parsedData.id });
        }}
      />

      {/* Preset Demo Activities Selection Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    載入官方示範活動範本
                  </h3>
                  <p className="text-xs text-slate-500">
                    點選範本即可將完整標準五大欄位、圖說與成效指標載入表單進行參考
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {presetActivities.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                        {preset.activityNature || '青年活動'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {preset.date}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-amber-900 transition-colors">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.summary}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>地點：{preset.location}</span>
                      <span>•</span>
                      <span>實到人數：{preset.totalCount} 人</span>
                      <span>•</span>
                      <span>佐證相片：{preset.photos.length} 張</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadPresetActivity(preset)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>載入此範本</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                取消關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FORM EDITOR: 5 Collapsible Sections Matching User Screenshots */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-5 print:hidden">

          {/* ----------------------------------------------------------------------- */}
          {/* [ 一 ] 活動基本資料表 (Screenshot 2) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('sec1')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  一
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  活動基本資料表
                </h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('sec1');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="展開或收合活動基本資料表"
              >
                {openSections.sec1 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Section Body */}
            {openSections.sec1 && (
              <div className="p-5 sm:p-6 space-y-4">
                {/* 1. 活動名稱 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    活動名稱 <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="請輸入活動完整名稱..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-slate-800 transition-all"
                  />
                </div>

                {/* 2. 辦理日期與時間 & 活動地點 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      辦理日期與時間 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.date + (formData.timeRange ? ` ${formData.timeRange}` : '')}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="例如：2026年08月18日 (二) 09:00 - 16:30"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      活動地點 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="例如：國家文官學院 菁英講堂 / 佛光山法寶寺"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>
                </div>

                {/* 3. 主辦單位 / 承辦單位 / 指導單位 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      主辦單位 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團'}
                      onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                      placeholder="例如：新竹青年分團"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      承辦 / 執行單位
                    </label>
                    <input
                      type="text"
                      value={formData.executingUnit || '新竹青年分團活動企劃組'}
                      onChange={(e) => setFormData({ ...formData, executingUnit: e.target.value })}
                      placeholder="例如：活動企劃組"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      協辦 / 指導單位
                    </label>
                    <input
                      type="text"
                      value={formData.guidingUnit || '佛光山法寶寺'}
                      onChange={(e) => setFormData({ ...formData, guidingUnit: e.target.value })}
                      placeholder="例如：佛光山法寶寺"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>
                </div>

                {/* 4. 參加對象 & 人數統計卡片 (完整保留本團、非本團、預期、實到合計與出席率) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                  {/* 參加對象 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      參加對象與身分 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.targetAudience || '佛光青年、幹部及對佛法有興趣之青年大眾'}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      placeholder="請輸入參加對象與身分..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all"
                    />
                  </div>

                  {/* 人數統計細項網格 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                        人數統計明細（即時自動連動合計與出席率）
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        公式：本團 + 非本團 = 實到總計
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* 1. 本團人數 */}
                      <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs space-y-1">
                        <label className="block text-[11px] font-bold text-blue-900">
                          本團青年/幹部
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={formData.internalCount ?? 0}
                            onChange={(e) => {
                              const internal = Math.max(0, parseInt(e.target.value) || 0);
                              const external = Number(formData.externalCount) || 0;
                              setFormData({
                                ...formData,
                                internalCount: internal,
                                totalCount: internal + external
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-black text-sm text-blue-900 text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-medium">人</span>
                        </div>
                      </div>

                      {/* 2. 非本團人數 */}
                      <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs space-y-1">
                        <label className="block text-[11px] font-bold text-emerald-900">
                          非本團 / 青年大眾
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={formData.externalCount ?? 0}
                            onChange={(e) => {
                              const external = Math.max(0, parseInt(e.target.value) || 0);
                              const internal = Number(formData.internalCount) || 0;
                              setFormData({
                                ...formData,
                                externalCount: external,
                                totalCount: internal + external
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-black text-sm text-emerald-900 text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-medium">人</span>
                        </div>
                      </div>

                      {/* 3. 預期人數 */}
                      <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-xs space-y-1">
                        <label className="block text-[11px] font-bold text-amber-900">
                          預期招募人數
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={formData.expectedCount ?? 30}
                            onChange={(e) => {
                              const expected = Math.max(0, parseInt(e.target.value) || 0);
                              setFormData({
                                ...formData,
                                expectedCount: expected
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-black text-sm text-amber-900 text-center outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-medium">人</span>
                        </div>
                      </div>

                      {/* 4. 實到總人數 */}
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40 shadow-xs space-y-1">
                        <label className="block text-[11px] font-bold text-indigo-950">
                          實到總人數 (合計)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={formData.totalCount ?? ((Number(formData.internalCount) || 0) + (Number(formData.externalCount) || 0))}
                            onChange={(e) => {
                              const total = Math.max(0, parseInt(e.target.value) || 0);
                              setFormData({
                                ...formData,
                                totalCount: total
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 font-black text-sm text-indigo-900 text-center outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                          />
                          <span className="text-xs text-slate-500 shrink-0 font-medium">人</span>
                        </div>
                      </div>
                    </div>

                    {/* 出席率評鑑徽章 */}
                    <div className="mt-3 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-950">📈 出席達成率分析：</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs">
                          {calcAttendanceRate}
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-800 hidden sm:inline">
                        （實到 {formData.totalCount || ((Number(formData.internalCount) || 0) + (Number(formData.externalCount) || 0))} 人 / 預期 {formData.expectedCount || 30} 人）
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. 活動性質 & 宗旨 (Selectable Badges) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* 性質 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      活動性質（點選切換）：
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NATURE_OPTIONS.map((nat) => {
                        const isSelected = formData.activityNature === nat.id || (nat.id.includes('法寶寺') && formData.activityNature?.includes('法寶寺'));
                        return (
                          <button
                            key={nat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, activityNature: nat.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '•'}</span>
                            <span>{nat.id === '總團活動' ? '總團/總會活動' : nat.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 宗旨 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      活動宗旨（四大宗旨）：
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OBJECTIVE_OPTIONS.map((obj) => {
                        const isSelected = currentObjectives.includes(obj.id);
                        return (
                          <button
                            key={obj.id}
                            type="button"
                            onClick={() => {
                              const updated = isSelected 
                                ? currentObjectives.filter(o => o !== obj.id)
                                : [...currentObjectives, obj.id];
                              setFormData({
                                ...formData,
                                activityObjective: updated[0] || obj.id,
                                activityObjectives: updated
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{obj.icon}</span>
                            <span>{obj.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* [ 二 ] 活動目標與內容摘要 (Screenshot 1) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('sec2')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  二
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  活動目標與內容摘要
                </h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('sec2');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="展開或收合活動目標與內容摘要"
              >
                {openSections.sec2 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Section Body */}
            {openSections.sec2 && (
              <div className="p-5 sm:p-6 space-y-5">
                {/* 活動主旨與目的 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    活動主旨與目的（建議精簡 1~2 句話） <span className="text-red-500 font-bold">*</span>
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={3}
                    placeholder="請簡述活動核心目標與預期效益..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 leading-relaxed transition-all"
                  />
                </div>

                {/* 活動核心流程與亮點 */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      活動核心流程與亮點（條列 3 至 5 點為佳）
                    </label>
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新增亮點</span>
                    </button>
                  </div>

                  {/* Highlight Items List */}
                  <div className="space-y-2.5">
                    {(formData.highlights || []).map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2.5">
                        {/* Number badge [ 1 ] */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {hIdx + 1}
                        </div>
                        {/* Input */}
                        <input
                          type="text"
                          value={hl}
                          onChange={(e) => handleUpdateHighlight(hIdx, e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 transition-all font-medium"
                        />
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteHighlight(hIdx)}
                          className="text-slate-400 hover:text-red-500 p-2 transition-colors cursor-pointer"
                          title="刪除此項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* [ 三 ] 活動佐證照片與圖說管理 (Screenshot 3) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('sec3')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  三
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                    活動佐證照片與圖說管理
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                    目前 {photoCount} 張 (建議 2~4 張最佳)
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('sec3');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="展開或收合活動佐證照片與圖說管理"
              >
                {openSections.sec3 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Section Body */}
            {openSections.sec3 && (
              <div className="p-5 sm:p-6 space-y-5">
                
                {/* Section Sub-Header with AI / Quick Template button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="text-xs text-slate-500">
                    依公務規範：每張佐證照片均需具備完整圖說（包含時間、場景、人物動作與互動焦點）。
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAllCaptions}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>一鍵生成全部圖說建議</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDriveModal(true)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google 雲端相簿</span>
                    </button>
                  </div>
                </div>

                {/* Big Dashed Upload Dropzone */}
                <div 
                  onClick={handleTriggerAddLocalPhoto}
                  className="p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isProcessingPhotos ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    點擊此處或將活動照片拖曳至此上傳
                  </div>
                  <p className="text-xs text-slate-500">
                    支援 JPG、PNG、WebP。上傳後可直接套用標準公務圖說範本或自動產製圖說。
                  </p>
                </div>

                {/* Photo Items List */}
                <div className="space-y-4 pt-2">
                  {formData.photos.map((photo, pIdx) => {
                    const captionLen = photo.caption ? photo.caption.length : 0;
                    return (
                      <div 
                        key={pIdx}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3.5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          
                          {/* Photo Thumbnail on Left with "照片 1" badge */}
                          <div className="md:col-span-3">
                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 relative border border-slate-200 group">
                              {photo.url ? (
                                <img
                                  src={photo.url}
                                  alt={`照片 ${pIdx + 1}`}
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                  無相片
                                </div>
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-bold text-[11px] backdrop-blur-xs">
                                照片 {pIdx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTriggerReplacePhoto(pIdx)}
                                className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 hover:bg-black text-white text-[10px] font-bold backdrop-blur-xs cursor-pointer opacity-90 hover:opacity-100"
                              >
                                更換相片
                              </button>
                            </div>
                          </div>

                          {/* Caption Controls on Right */}
                          <div className="md:col-span-9 space-y-2.5">
                            {/* Header row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                  照片 {pIdx + 1} 圖說
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  已確認圖說
                                </span>
                              </div>

                              {/* Action tools: Up, Down, Delete */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(pIdx, 'up')}
                                  disabled={pIdx === 0}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  title="往上移"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(pIdx, 'down')}
                                  disabled={pIdx === formData.photos.length - 1}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  title="往下移"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      photos: prev.photos.filter((_, i) => i !== pIdx)
                                    }));
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                                  title="刪除此照片"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Caption Textarea */}
                            <textarea
                              value={photo.caption}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => {
                                  const updated = [...prev.photos];
                                  if (updated[pIdx]) updated[pIdx].caption = val;
                                  return { ...prev, photos: updated };
                                });
                              }}
                              rows={2}
                              placeholder="請輸入此照片的時間、場景、人物動作與互動焦點..."
                              className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 leading-relaxed transition-all font-medium"
                            />

                            {/* Quick Template Chips (公務範本速套) */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                                📋 公務範本速套：
                              </span>
                              {QUICK_CAPTION_TEMPLATES.map((tmpl) => (
                                <button
                                  key={tmpl.id}
                                  type="button"
                                  onClick={() => handleApplyCaptionTemplate(pIdx, tmpl.text)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  {tmpl.label}
                                </button>
                              ))}
                            </div>

                            {/* Bottom row: Regenerate single & Word count */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const tmpl = QUICK_CAPTION_TEMPLATES[pIdx % QUICK_CAPTION_TEMPLATES.length];
                                  handleApplyCaptionTemplate(pIdx, `【${tmpl.label}】：${formData.title || '活動'}現場，${tmpl.text}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                                <span>重新生成圖說</span>
                              </button>

                              <span className="text-slate-400 font-mono">
                                {captionLen} 字
                              </span>
                            </div>

                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* [ 四 ] 檢討與後續追蹤建議 (Screenshot 4) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('sec4')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  四
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  檢討與後續追蹤建議
                </h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('sec4');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="展開或收合檢討與後續追蹤建議"
              >
                {openSections.sec4 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Section Body */}
            {openSections.sec4 && (
              <div className="p-5 sm:p-6 space-y-5">
                
                {/* Suggestions List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      條列 2 至 4 點具體改善或後續追蹤建議：
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSuggestion}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新增建議</span>
                    </button>
                  </div>

                  {/* Suggestion Item Rows */}
                  <div className="space-y-2.5">
                    {(formData.suggestions || []).map((sug, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {sIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={sug}
                          onChange={(e) => handleUpdateSuggestion(sIdx, e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSuggestion(sIdx)}
                          className="text-slate-400 hover:text-red-500 p-2 transition-colors cursor-pointer"
                          title="刪除此項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: 填表 / 報告彙整人 & 報告日期 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      填表 / 報告彙整人
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName || '專案經理 陳建宏'}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      placeholder="例如：專案經理 陳建宏 / 秘書 周汶蔚"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      報告日期
                    </label>
                    <input
                      type="text"
                      value={formData.reportDate || '2026/08/20'}
                      onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                      placeholder="例如：2026/08/20"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 transition-all font-medium"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* [ 五 ] 活動成效與數據佐證（量化與質化指標） (Screenshot 5) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('sec5')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  五
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  活動成效與數據佐證（量化與質化指標）
                </h3>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('sec5');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                aria-label="展開或收合活動成效與數據佐證"
              >
                {openSections.sec5 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Section Body */}
            {openSections.sec5 && (
              <div className="p-5 sm:p-6 space-y-5">
                
                {/* Information Callout Banner from Screenshot 5 */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>填表備註：</strong>可自行依據手邊現有的資料自由增加或減少項目，如無特定指標可直接留空或刪除，請勿捏造需要的資料。
                  </div>
                </div>

                {/* 1. 量化成效指標 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>1. 量化成效指標（出席率、滿意度、發放份數、產出率等）</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMetric}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新增量化項目</span>
                    </button>
                  </div>

                  {/* Quantitative Items Grid */}
                  <div className="space-y-2.5">
                    {(formData.quantitativeMetrics || []).map((m, mIdx) => (
                      <div key={m.id || mIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* 指標名稱 */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => handleUpdateMetric(mIdx, 'name', e.target.value)}
                            placeholder="指標名稱"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 outline-none text-xs sm:text-sm font-bold text-slate-800"
                          />
                        </div>

                        {/* 達成數值 */}
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={m.value}
                            onChange={(e) => handleUpdateMetric(mIdx, 'value', e.target.value)}
                            placeholder="達成數值 (例：65 人)"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 outline-none text-xs sm:text-sm font-bold text-slate-800 text-center"
                          />
                        </div>

                        {/* 備註與基準 */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={m.benchmark}
                            onChange={(e) => handleUpdateMetric(mIdx, 'benchmark', e.target.value)}
                            placeholder="目標/基準備註"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 outline-none text-xs sm:text-sm text-slate-600"
                          />
                        </div>

                        {/* Delete */}
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteMetric(mIdx)}
                            className="text-slate-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. 質化回饋 */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>2. 質化回饋（學員反饋、貴賓致詞重點、後續效益）</span>
                  </label>

                  {/* 學員心得反饋 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      學員 / 參與者心得反饋：
                    </label>
                    <textarea
                      value={formData.participantFeedback || ''}
                      onChange={(e) => setFormData({ ...formData, participantFeedback: e.target.value })}
                      rows={3}
                      placeholder="請輸入學員問卷或口頭心得反饋精華..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 leading-relaxed transition-all font-medium"
                    />
                  </div>

                  {/* 2 Columns: 貴賓致詞 & 延伸效益 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        貴賓致詞 / 指導長官回饋（選填）：
                      </label>
                      <textarea
                        value={formData.vipFeedback || ''}
                        onChange={(e) => setFormData({ ...formData, vipFeedback: e.target.value })}
                        rows={3}
                        placeholder="請輸入指導法師或貴賓致詞要點..."
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 leading-relaxed transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        延伸效益與後續連鎖影響：
                      </label>
                      <textarea
                        value={formData.extendedBenefits || ''}
                        onChange={(e) => setFormData({ ...formData, extendedBenefits: e.target.value })}
                        rows={3}
                        placeholder="請輸入後續專案進展或擴散效益..."
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 leading-relaxed transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Bottom Fixed-style Action Footer */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              💡 編輯完成後，請點擊「儲存至活動檔案庫」長期保存，或匯出為 Word / Google 文件 / PDF。
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToArchives}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>儲存至活動檔案庫</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <FileType className="w-4 h-4" />
                <span>下載 Word 檔</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGoogleDocsModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>匯出至 Google 文件</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. A4 OFFICIAL PROOF DOCUMENT PREVIEW TAB */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="text-xs text-slate-600">
              📄 <strong>A4 實體列印排版預覽</strong>：完全符合公務/優秀分團佐證規範，可直接列印或匯出 PDF。
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('editor')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
              >
                返回表單編輯
              </button>
              <button
                onClick={() => openPrintableDocumentInNewTab([formData])}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                title="在新分頁開啟列印並另存為 PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>列印 / 存為 PDF</span>
              </button>
            </div>
          </div>

          <OfficialProofDocument data={formData} />
        </div>
      )}

      {/* Google Docs Integration Modal */}
      <GoogleDocsModal
        isOpen={showGoogleDocsModal}
        onClose={() => setShowGoogleDocsModal(false)}
        targetActivity={{
          id: formData.id,
          title: formData.title,
          category: formData.activityNature || '青年團活動',
          date: formData.date,
          timeRange: `${formData.startTime} ~ ${formData.endTime}`,
          location: formData.location,
          organizer: formData.organizer,
          guidingUnit: formData.guidingUnit,
          leadCadres: formData.leadCadres,
          attendeeTotal: formData.attendeeTotal,
          attendeeYouth: formData.attendeeYouth,
          attendeeGuests: formData.attendeeGuests,
          attendeeVolunteers: formData.attendeeVolunteers,
          summary: formData.summary,
          processSchedule: formData.processSchedule,
          highlightsAndOutcomes: formData.highlightsAndOutcomes,
          reviewAndSuggestions: formData.reviewAndSuggestions,
          budgetNotes: formData.budgetNotes,
          status: 'completed',
          tags: formData.activityNature ? [formData.activityNature] : [],
          photos: formData.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        onImportDocText={(text, title) => {
          if (text) {
            setFormData(prev => ({
              ...prev,
              title: title ? title.replace(/^【成果佐證】\d{4}-\d{2}-\d{2}_/, '') : prev.title,
              summary: text.slice(0, 500),
              highlightsAndOutcomes: text.slice(500, 1500) || prev.highlightsAndOutcomes,
            }));
          }
        }}
      />

    </div>
  );
};
