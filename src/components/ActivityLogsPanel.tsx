import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileDown, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Image as ImageIcon,
  RotateCcw,
  BookOpen,
  HeartHandshake,
  Footprints,
  Flame,
  Award,
  X,
  CheckSquare,
  Square,
  FolderOpen,
  ExternalLink,
  FileText,
  Download,
  FileUp
} from 'lucide-react';
import { ActivityCategory, ActivityPhoto, ActivityRecordItem, ActivityStatus } from '../types';
import { 
  getStoredActivities, 
  saveStoredActivities, 
  resetStoredActivities, 
  clearAllStoredActivities,
  clearProofDocuments,
  deleteStoredActivitiesByIds,
  exportActivitiesToCSV,
  getStoredProofDocuments,
  convertActivityToProofDocument,
  matchActivityYear,
  extractYearFromDateString
} from '../utils/activityStorage';
import { generateWordDocumentBlob, generateBatchWordDocumentBlob } from '../utils/wordExportHelper';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { BatchPrintPdfModal } from './BatchPrintPdfModal';
import { openPrintableDocumentInNewTab } from '../utils/pdfPrintHelper';
import { GoogleDocsModal } from './GoogleDocsModal';
import { useUiText } from '../contexts/UiTextContext';
import { 
  exportProjectBackup, 
  validateBackupFile, 
  restoreProjectBackup, 
  BackupValidationResult, 
  FullProjectBackup 
} from '../services/projectBackupService';
import { Upload, AlertTriangle } from 'lucide-react';

interface ActivityLogsPanelProps {
  activeOfficer?: string;
  onNavigateToProofEditor?: (activity?: ActivityRecordItem) => void;
  onNavigateToImportEvidence?: () => void;
  externalAuditFilter?: 'all' | 'needs_photos' | 'needs_attendees' | 'complete';
  externalObjectiveFilter?: string;
  onClearAuditFilter?: () => void;
}

export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1eNQC2dbPhq6GaEINJ6xsYqOuGtU63gLk?usp=drive_link';

const NATURE_FILTER_OPTIONS = [
  { id: 'all', label: '全部性質' },
  { id: '總團活動', label: '總團/總會活動' },
  { id: '道場活動', label: '道場活動' },
  { id: '青年團活動', label: '青年團活動' }
];

const OBJECTIVE_FILTER_OPTIONS = [
  { id: 'all', label: '全部宗旨' },
  { id: '文化', label: '文化', icon: '🎨' },
  { id: '教育', label: '教育', icon: '🎓' },
  { id: '共修', label: '共修', icon: '🙏' },
  { id: '慈善', label: '慈善', icon: '❤️' },
  { id: '聯誼', label: '聯誼', icon: '🤝' }
];

const CATEGORIES: ActivityCategory[] = [
  '生活禪與健走',
  '青年培訓與研習',
  '青年書院與讀書會',
  '義工服務與蔬食',
  '夜跑與運動團練',
  '分團例會與法會'
];

const CATEGORY_COLORS: Record<ActivityCategory, { bg: string; text: string; border: string; icon: string }> = {
  '生活禪與健走': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🌿' },
  '青年培訓與研習': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🎯' },
  '青年書院與讀書會': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '📖' },
  '義工服務與蔬食': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🍲' },
  '夜跑與運動團練': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🏃' },
  '分團例會與法會': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: '📿' },
};

export const ActivityLogsPanel: React.FC<ActivityLogsPanelProps> = ({ 
  activeOfficer = '周汶蔚',
  onNavigateToProofEditor,
  onNavigateToImportEvidence,
  externalAuditFilter = 'all',
  externalObjectiveFilter = 'all',
  onClearAuditFilter
}) => {
  const { getText } = useUiText();
  const [activities, setActivities] = useState<ActivityRecordItem[]>(() => getStoredActivities());
  
  // Real-time synchronization when activities are updated from Proof Generator or storage
  useEffect(() => {
    const handleSync = () => {
      setActivities(getStoredActivities());
    };
    window.addEventListener('blia_activities_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('blia_activities_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sync external objective filter into local state when changed
  useEffect(() => {
    if (externalObjectiveFilter) {
      setSelectedObjectiveFilter(externalObjectiveFilter);
    }
  }, [externalObjectiveFilter]);
  
  // Filters & Search
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025' | '2024' | 'all' | string>('2026');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNatureFilter, setSelectedNatureFilter] = useState<string>('all');
  const [selectedObjectiveFilter, setSelectedObjectiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Year counts computed robustly with matchActivityYear
  const yearCounts = useMemo(() => {
    const y2026 = activities.filter((a) => matchActivityYear(a, '2026')).length;
    const y2025 = activities.filter((a) => matchActivityYear(a, '2025')).length;
    const y2024 = activities.filter((a) => matchActivityYear(a, '2024')).length;
    return { y2026, y2025, y2024, total: activities.length };
  }, [activities]);

  // Multi-Selection for Batch Export
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState<boolean>(false);
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [isBatchPrintPdfModalOpen, setIsBatchPrintPdfModalOpen] = useState<boolean>(false);

  // Modals
  const [viewingActivity, setViewingActivity] = useState<ActivityRecordItem | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRecordItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isGoogleDocsModalOpen, setIsGoogleDocsModalOpen] = useState<boolean>(false);
  const [docsTargetActivity, setDocsTargetActivity] = useState<ActivityRecordItem | null>(null);
  const [docsSelectedActivities, setDocsSelectedActivities] = useState<ActivityRecordItem[]>([]);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; caption?: string } | null>(null);
  const [wordDownloadNotice, setWordDownloadNotice] = useState<string>('');

  // Full Project JSON Backup & Restore States
  const [isExportingBackup, setIsExportingBackup] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [backupValidation, setBackupValidation] = useState<BackupValidationResult | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const [backupSuccessNotice, setBackupSuccessNotice] = useState<string>('');

  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('生活禪與健走');
  const [formDate, setFormDate] = useState<string>('');
  const [formTimeRange, setFormTimeRange] = useState<string>('09:00 ~ 16:00');
  const [formLocation, setFormLocation] = useState<string>('佛光山法寶寺');
  const [formLeadCadres, setFormLeadCadres] = useState<string>('周汶蔚、徐信銓');
  const [formYouthCount, setFormYouthCount] = useState<number>(20);
  const [formGuestsCount, setFormGuestsCount] = useState<number>(3);
  const [formVolunteersCount, setFormVolunteersCount] = useState<number>(3);
  const [formSummary, setFormSummary] = useState<string>('');
  const [formProcess, setFormProcess] = useState<string>('');
  const [formHighlights, setFormHighlights] = useState<string>('');
  const [formReview, setFormReview] = useState<string>('');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('completed');
  const [formBudget, setFormBudget] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('新竹青年分團, 法寶寺');
  const [formPhotos, setFormPhotos] = useState<ActivityPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');

  // Persist whenever activities change
  const handleUpdateActivities = (newActivities: ActivityRecordItem[]) => {
    setActivities(newActivities);
    saveStoredActivities(newActivities);
  };

  // Filtered list based on Year, Search, Nature Filter, and Objective Filter
  const filteredActivities = useMemo(() => {
    return activities
      .filter((a) => {
        // Year filter: 2026 / 2025 / 2024 / all / custom
        if (selectedYear !== 'all') {
          if (!matchActivityYear(a, selectedYear)) {
            return false;
          }
        }

        // Date range filter: startDate & endDate
        if (startDate || endDate) {
          // Normalize activity date to YYYY-MM-DD
          const rawDate = (a.date || '').trim();
          // Match YYYY-MM-DD or YYYY/MM/DD
          let actDateStr = '';
          const ymdMatch = rawDate.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
          if (ymdMatch) {
            const y = ymdMatch[1];
            const m = ymdMatch[2].padStart(2, '0');
            const d = ymdMatch[3].padStart(2, '0');
            actDateStr = `${y}-${m}-${d}`;
          } else if (rawDate.length >= 10) {
            actDateStr = rawDate.slice(0, 10);
          } else {
            actDateStr = rawDate;
          }

          if (startDate && actDateStr && actDateStr < startDate) {
            return false;
          }
          if (endDate && actDateStr && actDateStr > endDate) {
            return false;
          }
        }

        // Nature filter: 總團活動 / 道場活動 / 青年團活動
        let matchesNature = true;
        if (selectedNatureFilter !== 'all') {
          if (selectedNatureFilter === '總團活動') {
            matchesNature = a.activityNature === '總團活動' || a.title.includes('總團') || a.summary.includes('總團');
          } else if (selectedNatureFilter === '道場活動') {
            matchesNature = a.activityNature === '法寶寺道場活動' || a.activityNature === '道場活動' || a.title.includes('道場') || a.location.includes('法寶寺') || a.title.includes('法寶寺');
          } else if (selectedNatureFilter === '青年團活動') {
            matchesNature = a.activityNature === '青年團活動' || a.activityNature === '參加友團活動' || a.title.includes('青年') || a.title.includes('分團');
          }
        }

        // Objective filter: 文化 / 教育 / 共修 / 慈善 / 聯誼
        let matchesObjective = true;
        if (selectedObjectiveFilter !== 'all') {
          const kw = selectedObjectiveFilter;
          matchesObjective = 
            Boolean(a.activityObjective && a.activityObjective.includes(kw)) ||
            Boolean(a.activityObjectives && a.activityObjectives.some(o => o.includes(kw))) ||
            a.title.includes(kw) ||
            a.summary.includes(kw) ||
            (kw === '文化' && (a.category.includes('文化') || a.category.includes('讀書會'))) ||
            (kw === '教育' && (a.category.includes('培訓') || a.category.includes('書院'))) ||
            (kw === '共修' && (a.category.includes('法會') || a.category.includes('生活禪'))) ||
            (kw === '慈善' && (a.category.includes('義工') || a.category.includes('蔬食'))) ||
            (kw === '聯誼' && (a.category.includes('健走') || a.category.includes('夜跑')));
        }

        const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
        const matchesSearch = 
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.leadCadres.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
          a.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

        // External Audit Filter (from HealthAuditWidget)
        let matchesAudit = true;
        if (externalAuditFilter && externalAuditFilter !== 'all') {
          const hasPhotos = Boolean(a.photos && a.photos.length >= 2);
          const hasAttendees = Boolean(a.attendeeTotal && a.attendeeTotal > 0);

          if (externalAuditFilter === 'needs_photos') {
            matchesAudit = !hasPhotos;
          } else if (externalAuditFilter === 'needs_attendees') {
            matchesAudit = !hasAttendees;
          } else if (externalAuditFilter === 'complete') {
            matchesAudit = hasPhotos && hasAttendees;
          }
        }

        return matchesNature && matchesObjective && matchesCategory && matchesSearch && matchesAudit;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activities, selectedYear, selectedCategory, searchTerm, selectedNatureFilter, selectedObjectiveFilter, startDate, endDate, externalAuditFilter]);

  // Dynamic KPI Calculations based on currently filtered activities
  const stats = useMemo(() => {
    const totalCount = filteredActivities.length;
    const totalAttendees = filteredActivities.reduce((sum, a) => sum + (a.attendeeTotal || 0), 0);
    const totalYouth = filteredActivities.reduce((sum, a) => sum + (a.attendeeYouth || 0), 0);
    const completedCount = filteredActivities.filter((a) => a.status === 'completed' || a.status === 'featured').length;
    return { totalCount, totalAttendees, totalYouth, completedCount };
  }, [filteredActivities]);

  // Toggle single activity selection
  const toggleSelectActivity = (id: string) => {
    setSelectedActivityIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered
  const toggleSelectAllFiltered = () => {
    if (selectedActivityIds.length === filteredActivities.length) {
      setSelectedActivityIds([]);
    } else {
      setSelectedActivityIds(filteredActivities.map((a) => a.id));
    }
  };

  // Execute Batch Export to Word
  const handleBatchExportWord = () => {
    if (selectedActivityIds.length === 0) return;
    setIsBatchExporting(true);
    try {
      const selectedActs = activities.filter((a) => selectedActivityIds.includes(a.id));
      const proofDocs = selectedActs.map((act) => convertActivityToProofDocument(act));
      const blob = generateBatchWordDocumentBlob(proofDocs, `優秀分團選拔佐證手冊_${proofDocs.length}項活動`);
      
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `優秀分團選拔活動佐證手冊_共${proofDocs.length}項活動_${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setWordDownloadNotice(`已成功匯出「優秀分團選拔佐證手冊」Word 檔案（包含 ${proofDocs.length} 項活動完整佐證）！`);
      setIsBatchExportModalOpen(false);
    } catch (err) {
      console.error('Batch Word export error:', err);
    } finally {
      setIsBatchExporting(false);
    }
  };

  // Selected proof documents for export / print
  const selectedProofDocuments = useMemo(() => {
    return activities
      .filter((a) => selectedActivityIds.includes(a.id))
      .map((act) => convertActivityToProofDocument(act));
  }, [activities, selectedActivityIds]);

  // Execute Batch Export / Print PDF (Opens interactive Modal)
  const handleBatchExportPDF = () => {
    if (selectedActivityIds.length === 0) return;
    setIsBatchPrintPdfModalOpen(true);
  };

  // Direct open in new tab (bypasses iframe sandbox)
  const handleDirectOpenPdfInNewTab = () => {
    if (selectedProofDocuments.length === 0) return;
    openPrintableDocumentInNewTab(selectedProofDocuments);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormCategory('生活禪與健走');
    const defaultDate = selectedYear === '2025' ? '2025-06-15' : (selectedYear === '2026' ? '2026-06-15' : new Date().toISOString().slice(0, 10));
    setFormDate(defaultDate);
    setFormTimeRange('09:00 ~ 16:30');
    setFormLocation('佛光山法寶寺');
    setFormLeadCadres(activeOfficer);
    setFormYouthCount(20);
    setFormGuestsCount(3);
    setFormVolunteersCount(3);
    setFormSummary('');
    setFormProcess('');
    setFormHighlights('');
    setFormReview('');
    setFormStatus('completed');
    setFormBudget('');
    setFormTags('新竹青年分團, 法寶寺');
    setFormPhotos([
      {
        id: 'p-default',
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
        caption: '活動現場大合照'
      }
    ]);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (activity: ActivityRecordItem) => {
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormCategory(activity.category);
    setFormDate(activity.date);
    setFormTimeRange(activity.timeRange);
    setFormLocation(activity.location);
    setFormLeadCadres(activity.leadCadres.join('、'));
    setFormYouthCount(activity.attendeeYouth);
    setFormGuestsCount(activity.attendeeGuests);
    setFormVolunteersCount(activity.attendeeVolunteers);
    setFormSummary(activity.summary);
    setFormProcess(activity.processSchedule);
    setFormHighlights(activity.highlightsAndOutcomes);
    setFormReview(activity.reviewAndSuggestions);
    setFormStatus(activity.status);
    setFormBudget(activity.budgetNotes || '');
    setFormTags(activity.tags.join(', '));
    setFormPhotos(activity.photos || []);
    setIsCreateModalOpen(true);
  };

  // Handle Submit Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('請輸入活動名稱');
      return;
    }
    if (!formDate) {
      alert('請選擇活動日期');
      return;
    }

    const totalCount = Number(formYouthCount) + Number(formGuestsCount) + Number(formVolunteersCount);
    const cadresList = formLeadCadres.split(/[、,，\s]+/).filter(Boolean);
    const tagsList = formTags.split(/[、,，\s]+/).filter(Boolean);

    if (editingActivity) {
      // Update
      const updatedList = activities.map((item) => {
        if (item.id === editingActivity.id) {
          return {
            ...item,
            title: formTitle.trim(),
            category: formCategory,
            date: formDate,
            timeRange: formTimeRange,
            location: formLocation.trim(),
            leadCadres: cadresList,
            attendeeTotal: totalCount,
            attendeeYouth: Number(formYouthCount),
            attendeeGuests: Number(formGuestsCount),
            attendeeVolunteers: Number(formVolunteersCount),
            summary: formSummary.trim(),
            processSchedule: formProcess.trim(),
            highlightsAndOutcomes: formHighlights.trim(),
            reviewAndSuggestions: formReview.trim(),
            status: formStatus,
            budgetNotes: formBudget.trim(),
            tags: tagsList,
            photos: formPhotos,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      handleUpdateActivities(updatedList);
      if (viewingActivity && viewingActivity.id === editingActivity.id) {
        setViewingActivity(updatedList.find((a) => a.id === editingActivity.id) || null);
      }
    } else {
      // Create new
      const newRecord: ActivityRecordItem = {
        id: `act-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        date: formDate,
        timeRange: formTimeRange,
        location: formLocation.trim(),
        organizer: '國際佛光會新竹青年分團',
        guidingUnit: '佛光山法寶寺',
        leadCadres: cadresList,
        attendeeTotal: totalCount,
        attendeeYouth: Number(formYouthCount),
        attendeeGuests: Number(formGuestsCount),
        attendeeVolunteers: Number(formVolunteersCount),
        summary: formSummary.trim(),
        processSchedule: formProcess.trim(),
        highlightsAndOutcomes: formHighlights.trim(),
        reviewAndSuggestions: formReview.trim(),
        status: formStatus,
        budgetNotes: formBudget.trim(),
        tags: tagsList,
        photos: formPhotos,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      handleUpdateActivities([newRecord, ...activities]);
    }

    setIsCreateModalOpen(false);
  };

  // Delete Record
  const handleConfirmDelete = () => {
    if (!deletingActivityId) return;
    const updated = activities.filter((a) => a.id !== deletingActivityId);
    handleUpdateActivities(updated);
    if (viewingActivity?.id === deletingActivityId) {
      setViewingActivity(null);
    }
    setDeletingActivityId(null);
  };

  // Export Full Project JSON Backup (IndexedDB + LocalStorage)
  const handleExportFullBackup = async () => {
    setIsExportingBackup(true);
    try {
      await exportProjectBackup();
      setBackupSuccessNotice('全團活動成果備份檔已成功匯出並下載！');
      setTimeout(() => setBackupSuccessNotice(''), 6000);
    } catch (err: any) {
      console.error('匯出備份失敗:', err);
      alert(`匯出失敗：${err?.message || '未知錯誤'}`);
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Handle Select & Validate Backup JSON File
  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupFile(content);
      setBackupValidation(validation);
      setIsImportModalOpen(true);
    };
    reader.onerror = () => {
      alert('讀取備份檔案失敗，請重新選取。');
    };
    reader.readAsText(file);
    // Reset file input value so user can pick the same file again if needed
    e.target.value = '';
  };

  // Confirm Restore from Backup
  const handleConfirmRestoreBackup = async () => {
    if (!backupValidation?.isValid || !backupValidation.data) return;

    setIsRestoringBackup(true);
    try {
      const result = await restoreProjectBackup(backupValidation.data);
      setActivities(getStoredActivities());
      setSelectedActivityIds([]);
      setViewingActivity(null);
      setEditingActivity(null);
      setIsImportModalOpen(false);
      setBackupValidation(null);

      setBackupSuccessNotice(
        `備份還原成功！已完整載入 ${result.restoredActivitiesCount} 場活動索引及 ${result.restoredProofsCount} 份佐證檔案庫。`
      );
      setTimeout(() => setBackupSuccessNotice(''), 6000);
    } catch (err: any) {
      console.error('還原備份失敗:', err);
      alert(`還原失敗：${err?.message || '未知錯誤'}`);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // One-click delete all activities
  const handleConfirmClearAll = async () => {
    try {
      await clearProofDocuments();
    } catch (err) {
      console.error('清空 IndexedDB 佐證資料庫時發生異常:', err);
    }
    clearAllStoredActivities();
    setActivities([]);
    setSelectedActivityIds([]);
    setViewingActivity(null);
    setEditingActivity(null);
    setIsClearAllModalOpen(false);
  };

  // Batch delete selected activities
  const handleConfirmBatchDelete = () => {
    if (selectedActivityIds.length === 0) return;
    const updated = deleteStoredActivitiesByIds(selectedActivityIds);
    setActivities(updated);
    setSelectedActivityIds([]);
    if (viewingActivity && selectedActivityIds.includes(viewingActivity.id)) {
      setViewingActivity(null);
    }
    setIsBatchDeleteModalOpen(false);
  };

  // Reset to initial mock
  const handleReset = () => {
    if (confirm('確定要還原活動紀錄為預設展示資料嗎？')) {
      const resetData = resetStoredActivities();
      setActivities(resetData);
      setViewingActivity(null);
    }
  };

  // Add photo to form
  const handleAddPhotoToForm = () => {
    if (!newPhotoUrl.trim()) return;
    setFormPhotos([
      ...formPhotos,
      {
        id: `p-${Date.now()}`,
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim() || '活動紀實照片'
      }
    ]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  const handleRemovePhotoFromForm = (photoId: string) => {
    setFormPhotos(formPhotos.filter((p) => p.id !== photoId));
  };

  // Export Word (.doc) Function
  const handleExportWord = (act: ActivityRecordItem) => {
    try {
      const storedProofs = getStoredProofDocuments();
      const matched = storedProofs.find((p) => p.id === act.id || (p.title === act.title && p.date === act.date));
      
      const proofData: ProofDocumentData = matched || {
        id: act.id,
        title: act.title,
        date: act.date,
        timeRange: act.timeRange || '09:00 ~ 16:30',
        location: act.location,
        organizer: act.organizer || '國際佛光會中華佛光青年總團 / 新竹青年分團',
        executingUnit: act.executingUnit || '新竹青年分團',
        guidingUnit: act.guidingUnit || '佛光山法寶寺',
        activityNature: act.activityNature || '總團活動',
        activityObjective: act.activityObjective || '文化弘揚佛法',
        activityObjectives: act.activityObjectives || (act.activityObjective ? [act.activityObjective] : ['文化弘揚佛法']),
        targetAudience: '佛光青年、幹部及對佛法有興趣之青年大眾',
        expectedCount: act.attendeeTotal ? Math.round(act.attendeeTotal * 0.9) : 30,
        totalCount: act.attendeeTotal || 0,
        internalCount: act.attendeeYouth || Math.round((act.attendeeTotal || 0) * 0.7),
        externalCount: Math.max(0, (act.attendeeTotal || 0) - (act.attendeeYouth || Math.round((act.attendeeTotal || 0) * 0.7))),
        attendanceRate: '100% (全額出席)',
        summary: act.summary || '',
        highlights: act.highlightsAndOutcomes ? act.highlightsAndOutcomes.split('\n').filter(Boolean) : [
          '幹部青年落實三好四給精神，團隊合作成效優異',
          '圓滿達成活動預期指標，展現佛光青年熱忱活力'
        ],
        quantitativeMetrics: [
          { id: 'm1', name: '實到出席總人數', value: `${act.attendeeTotal || 0} 人`, benchmark: '符合目標' },
          { id: 'm2', name: '青年幹部培訓', value: `${act.attendeeYouth || 0} 人次`, benchmark: '青年比率高' }
        ],
        participantFeedback: '青年夥伴踴躍投入，收穫滿滿，深獲大家熱烈回響。',
        vipFeedback: '法寶寺住持與常住法師勉勵青年在動中磨練定力、在靜中涵養智慧。',
        extendedBenefits: '增進分團青年情誼與團隊凝聚力，為年度弘法專案奠定堅實基礎。',
        suggestions: act.reviewAndSuggestions ? act.reviewAndSuggestions.split('\n').filter(Boolean) : [
          '持續擴大社群平台宣導，廣邀更多在地大專青年參與',
          '精進活動流程引導演練與分組交流互動環節'
        ],
        reporterName: act.leadCadres?.[0] || '國際佛光會新竹青年分團幹部',
        reportDate: act.date || new Date().toISOString().slice(0, 10),
        photos: (act.photos || []).map((p) => ({
          url: p.url,
          caption: p.caption || act.title
        }))
      };

      const blob = generateWordDocumentBlob(proofData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanDate = (act.date || '活動').replace(/[\/\-\.\s]/g, '');
      const cleanTitle = (act.title || '活動佐證報告').replace(/[\s\/:*?"<>|]/g, '_');
      a.download = `活動成果報告_${cleanDate}_${cleanTitle}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setWordDownloadNotice(`已成功輸出「${act.title}」Word 報告檔案！`);
      setTimeout(() => setWordDownloadNotice(''), 3500);
    } catch (err) {
      console.error('Word export failed:', err);
    }
  };

  // Print function
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Print error:', e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice for Word Export */}
      {wordDownloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#2C3437] text-white shadow-2xl border border-[#70C1B3]/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-[#70C1B3] text-[#2C3437] flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-xs text-white">{wordDownloadNotice}</div>
            <div className="text-[11px] text-stone-300">檔案已成功下載至您的電腦，請使用 Microsoft Word 或 WPS 開啟。</div>
          </div>
          <button 
            onClick={() => setWordDownloadNotice('')}
            className="ml-2 text-stone-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notice for Project Backup & Restore */}
      {backupSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#2C3437] text-white shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-xs text-white">{backupSuccessNotice}</div>
            <div className="text-[11px] text-stone-300">資料已同步至瀏覽器 IndexedDB 高容量資料庫與本機快取。</div>
          </div>
          <button 
            onClick={() => setBackupSuccessNotice('')}
            className="ml-2 text-stone-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Year-based Tabs (以年份為主的分頁選項：2026 / 2025 / 歷年全彙整) */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl flex-1 max-w-2xl">
          <button
            type="button"
            onClick={() => setSelectedYear('2026')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedYear === '2026'
                ? 'bg-white text-[#2C3437] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className={`w-4 h-4 ${selectedYear === '2026' ? 'text-[#70C1B3]' : 'text-stone-400'}`} />
            <span>2026 年度活動</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              selectedYear === '2026' ? 'bg-[#70C1B3]/15 text-[#1b6155]' : 'bg-stone-200/60 text-stone-500'
            }`}>
              {yearCounts.y2026} 場
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedYear('2025')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedYear === '2025'
                ? 'bg-white text-[#2C3437] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className={`w-4 h-4 ${selectedYear === '2025' ? 'text-[#F4A261]' : 'text-stone-400'}`} />
            <span>2025 年度活動</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              selectedYear === '2025' ? 'bg-[#F4A261]/20 text-[#a3561a]' : 'bg-stone-200/60 text-stone-500'
            }`}>
              {yearCounts.y2025} 場
            </span>
          </button>

          {yearCounts.y2024 > 0 && (
            <button
              type="button"
              onClick={() => setSelectedYear('2024')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                selectedYear === '2024'
                  ? 'bg-white text-[#2C3437] shadow-xs border border-stone-200/60'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Calendar className={`w-4 h-4 ${selectedYear === '2024' ? 'text-indigo-500' : 'text-stone-400'}`} />
              <span>2024 年度活動</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                selectedYear === '2024' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-200/60 text-stone-500'
              }`}>
                {yearCounts.y2024} 場
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedYear === 'all'
                ? 'bg-white text-[#2C3437] shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>歷年全彙整</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              selectedYear === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200/60 text-stone-500'
            }`}>
              {yearCounts.total}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#70C1B3] hover:bg-[#5fa89c] text-[#2C3437] font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{getText('btn_create_activity', '新增活動')}</span>
          </button>
        </div>
      </div>

      {/* 1. Header Banner & KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>累計舉辦活動</span>
            <div className="w-7 h-7 rounded-lg bg-[#70C1B3]/15 text-[#70C1B3] flex items-center justify-center font-bold">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#2C3437]">
            {stats.totalCount} <span className="text-xs font-bold text-stone-400">場次</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>累計參與總人次</span>
            <div className="w-7 h-7 rounded-lg bg-[#F4A261]/15 text-[#F4A261] flex items-center justify-center font-bold">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#F4A261]">
            {stats.totalAttendees} <span className="text-xs font-bold text-stone-400">人次</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>青年團員培訓與參與</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600">
            {stats.totalYouth} <span className="text-xs font-bold text-stone-400">人次</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>已圓滿歸檔活動</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {stats.completedCount} <span className="text-xs font-bold text-stone-400">場</span>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar (Search, Filter, Create, Export) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋活動名稱、地點、帶領幹部或關鍵字..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3] focus:bg-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
            >
              <option value="all">全活動類別 ({activities.length})</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({activities.filter((a) => a.category === c).length})
                </option>
              ))}
            </select>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'cards' ? 'bg-white text-[#2C3437] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                卡片
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#2C3437] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                列表
              </button>
            </div>

            {/* One-Click Delete All Activities Button */}
            {activities.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="一鍵刪除分團專案活動成果檔案庫中的所有成果檔案"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{getText('btn_delete_all_activities', '一鍵刪除所有活動檔案')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="還原為預設範本活動成果檔案"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>{getText('btn_reset_activities_demo', '還原預設範本資料')}</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={() => exportActivitiesToCSV(activities)}
              disabled={activities.length === 0}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#2C3437] font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="匯出歷年活動清單 CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-500" />
              <span>CSV</span>
            </button>

            {/* Export JSON Full Project Backup */}
            <button
              type="button"
              onClick={handleExportFullBackup}
              disabled={isExportingBackup}
              className="px-3.5 py-2 rounded-xl border border-[#70C1B3]/60 bg-[#70C1B3]/10 hover:bg-[#70C1B3]/20 text-[#155e52] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="完整打包下載 IndexedDB 佐證資料庫（含圖檔）與 LocalStorage 索引為 .json 備份檔"
            >
              <Download className={`w-3.5 h-3.5 text-[#70C1B3] ${isExportingBackup ? 'animate-bounce' : ''}`} />
              <span>{isExportingBackup ? '備份打包中...' : getText('btn_export_full_backup', '匯出全團備份 (JSON)')}</span>
            </button>

            {/* Import JSON Backup */}
            <label
              className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-[#2C3437] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="選取並還原 .json 格式之全團成果備份檔"
            >
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>{getText('btn_import_full_backup', '匯入備份還原')}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleBackupFileSelect}
                className="hidden"
              />
            </label>

            {/* Create Activity Button */}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {getText('btn_create_activity', '新增活動紀錄')}
            </button>
          </div>
        </div>

        {/* Nature & Objective Filters (Screenshot 2026-09-03 213435.png Requirement) */}
        <div className="pt-3 border-t border-stone-100 space-y-2.5">
          
          {/* Row 0: 日期區間篩選器 (起始日期 ~ 結束日期) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-600 shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#70C1B3]" /> 日期區間：
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                title="起始日期"
              />
              <span className="text-stone-400 font-bold px-0.5">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                title="結束日期"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="清除日期篩選條件"
                >
                  <X className="w-3 h-3 text-stone-500" />
                  <span>清除日期</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 1: 活動性質 (總團/總會活動、道場活動、青年團活動) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-600 shrink-0 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#70C1B3]" /> 活動性質：
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {NATURE_FILTER_OPTIONS.map((nat) => {
                const isSelected = selectedNatureFilter === nat.id;
                const matchCount = activities.filter((a) => {
                  if (nat.id === 'all') return true;
                  if (nat.id === '總團活動') return a.activityNature === '總團活動' || a.title.includes('總團') || a.summary.includes('總團');
                  if (nat.id === '道場活動') return a.activityNature === '法寶寺道場活動' || a.activityNature === '道場活動' || a.title.includes('道場') || a.location.includes('法寶寺') || a.title.includes('法寶寺');
                  if (nat.id === '青年團活動') return a.activityNature === '青年團活動' || a.activityNature === '參加友團活動' || a.title.includes('青年') || a.title.includes('分團');
                  return true;
                }).length;

                return (
                  <button
                    key={nat.id}
                    type="button"
                    onClick={() => setSelectedNatureFilter(nat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#2C3437] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{nat.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                      ({matchCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: 宗旨類別 (文化、教育、共修、慈善、聯誼) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-600 shrink-0 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> 四大宗旨：
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {OBJECTIVE_FILTER_OPTIONS.map((obj) => {
                const isSelected = selectedObjectiveFilter === obj.id;
                const matchCount = activities.filter((a) => {
                  if (obj.id === 'all') return true;
                  const kw = obj.id;
                  return Boolean(a.activityObjective && a.activityObjective.includes(kw)) ||
                    Boolean(a.activityObjectives && a.activityObjectives.some(o => o.includes(kw))) ||
                    a.title.includes(kw) ||
                    a.summary.includes(kw) ||
                    (kw === '文化' && (a.category.includes('文化') || a.category.includes('讀書會'))) ||
                    (kw === '教育' && (a.category.includes('培訓') || a.category.includes('書院'))) ||
                    (kw === '共修' && (a.category.includes('法會') || a.category.includes('生活禪'))) ||
                    (kw === '慈善' && (a.category.includes('義工') || a.category.includes('蔬食'))) ||
                    (kw === '聯誼' && (a.category.includes('健走') || a.category.includes('夜跑')));
                }).length;

                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setSelectedObjectiveFilter(obj.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {obj.icon && <span>{obj.icon}</span>}
                    <span>{obj.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-stone-400'}`}>
                      ({matchCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Filter Summary Bar & Clear Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 bg-stone-50/60 p-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-3 text-stone-700 font-semibold">
              <span>
                🎯 篩選結果：共 <strong className="text-[#2C3437] font-black text-sm">{stats.totalCount}</strong> 場活動
              </span>
              <span className="text-stone-300">|</span>
              <span>
                👥 累計參與：<strong className="text-[#F4A261] font-black text-sm">{stats.totalAttendees}</strong> 人次
              </span>
              <span className="text-stone-300">|</span>
              <span>
                ✨ 青年培訓：<strong className="text-blue-600 font-black text-sm">{stats.totalYouth}</strong> 人次
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(selectedNatureFilter !== 'all' || selectedObjectiveFilter !== 'all' || selectedCategory !== 'all' || searchTerm || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNatureFilter('all');
                    setSelectedObjectiveFilter('all');
                    setSelectedCategory('all');
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置篩選（顯示全部）
                </button>
              )}

              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                title="開啟分團活動相簿 Google 雲端硬碟備份資料夾"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>分團雲端相簿</span>
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </a>
            </div>
          </div>

          {/* Row 4: Multi-Select Batch Export Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 bg-blue-50/70 border border-blue-200 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-950 hover:text-blue-700 cursor-pointer"
              >
                {selectedActivityIds.length === filteredActivities.length && filteredActivities.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>全選本篩選清單 ({filteredActivities.length})</span>
              </button>

              <span className="text-xs font-semibold text-blue-800">
                已選取 <strong className="text-blue-950 font-black">{selectedActivityIds.length}</strong> 項活動
              </span>
            </div>

            {selectedActivityIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchExportWord}
                  disabled={isBatchExporting}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📄 匯出選取活動 Word (.doc 美化佐證)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const acts = activities.filter(a => selectedActivityIds.includes(a.id));
                    setDocsSelectedActivities(acts);
                    setDocsTargetActivity(null);
                    setIsGoogleDocsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  title="將選取的活動匯出為 Google 文件佐證手冊"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span>📝 匯出至 Google 文件</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchExportPDF}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  title="開啟選取活動之 PDF 匯出與列印預覽面板"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>🖨️ 匯出 / 列印 PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectOpenPdfInNewTab}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  title="在新分頁開啟完整佐證手冊並喚起列印對話框（存為 PDF，免受預覽 iframe 限制）"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>在新分頁列印 PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  title="批次刪除選取的活動紀錄"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>刪除選取 ({selectedActivityIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActivityIds([])}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 font-bold text-xs cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <span className="text-xs text-blue-700 font-medium">
                💡 勾選上方或各活動卡片，即可一鍵將多個活動匯出為 Word 佐證手冊或 PDF
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Active Audit Filter Notice Banner */}
      {externalAuditFilter && externalAuditFilter !== 'all' && (
        <div className="p-3.5 px-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              評鑑指標防呆篩選已啟用：
              {externalAuditFilter === 'needs_photos' && '待補相片活動（少於 2 張）'}
              {externalAuditFilter === 'needs_attendees' && '待補出席人次活動（未填寫人數）'}
              {externalAuditFilter === 'complete' && '已完整歸檔活動'}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 font-mono text-xs font-bold">
                共符合 {filteredActivities.length} 場
              </span>
            </span>
          </div>
          {onClearAuditFilter && (
            <button
              type="button"
              onClick={onClearAuditFilter}
              className="px-3 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>解除篩選，顯示全部</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Activity Display: Card View or Table View */}
      {activities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-stone-300 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8 text-stone-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-black text-base text-[#2C3437]">分團專案活動成果檔案庫目前為空</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              所有專案活動成果檔案已成功清空。您可以直接匯入 Word / PDF 佐證資料、手動新增活動紀錄，或是隨時還原預設範本資料。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateToImportEvidence && (
              <button
                type="button"
                onClick={onNavigateToImportEvidence}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                <span>匯入活動佐證資料</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#70C1B3] hover:bg-[#5fa89c] text-[#2C3437] font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>手動新增活動紀錄</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-stone-500" />
              <span>還原預設範本資料</span>
            </button>
          </div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-[#2C3437]">查無符合篩選條件的活動紀錄</h3>
          <p className="text-xs text-stone-400">目前活動庫中共有 {activities.length} 筆活動，但在目前設定的條件下無符合結果。</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedNatureFilter('all');
              setSelectedObjectiveFilter('all');
            }}
            className="px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            重置篩選條件
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map((act) => {
            const catStyle = CATEGORY_COLORS[act.category] || {
              bg: 'bg-stone-100',
              text: 'text-stone-700',
              border: 'border-stone-200',
              icon: '📌'
            };
            const coverPhoto = act.photos[0]?.url || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#70C1B3]/50 hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Photo & Category Header */}
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={() => setViewingActivity(act)}>
                  <img
                    src={coverPhoto}
                    alt={act.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                    {/* Category & Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-xs ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                        {catStyle.icon} {act.category}
                      </span>
                      {act.activityNature && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#2C3437]/85 text-white backdrop-blur-xs">
                          {act.activityNature === '總團活動' ? '總團/總會活動' : act.activityNature}
                        </span>
                      )}
                      {act.status === 'featured' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-400 text-amber-950 shadow-xs">
                          ⭐ 精選
                        </span>
                      )}
                    </div>

                    {/* Checkbox for batch selection */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectActivity(act.id);
                      }}
                      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-xl flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                        selectedActivityIds.includes(act.id)
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-white'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      title={selectedActivityIds.includes(act.id) ? '已選取（點擊取消）' : '勾選此活動以批次匯出佐證'}
                    >
                      {selectedActivityIds.includes(act.id) ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-white/80" />
                      )}
                    </button>

                    {/* Photo count indicator */}
                    {act.photos.length > 1 && (
                      <div className="absolute top-12 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {act.photos.length} 張
                      </div>
                    )}

                  {/* Date on image */}
                  <div className="absolute bottom-2.5 left-3 text-white text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#70C1B3]" />
                    <span>{act.date}</span>
                    <span className="text-stone-300 text-[10px]">({act.timeRange})</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h3 
                      onClick={() => setViewingActivity(act)}
                      className="font-bold text-sm text-[#2C3437] group-hover:text-[#70C1B3] transition-colors line-clamp-2 cursor-pointer"
                    >
                      {act.title}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#F4A261] shrink-0" />
                      <span className="truncate">{act.location}</span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {act.summary}
                    </p>
                  </div>

                  {/* Metadata & Stats Foot */}
                  <div className="pt-3 border-t border-stone-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-bold text-[#2C3437]">{act.attendeeTotal} 人</span>
                        <span className="text-stone-400 text-[10px]">(青年 {act.attendeeYouth} 人)</span>
                      </div>
                      <div className="text-stone-400 text-[10px]">
                        帶領：{act.leadCadres.join('、')}
                      </div>
                    </div>

                    {/* Tags */}
                    {act.tags && act.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {act.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[10px]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <button
                        onClick={() => setViewingActivity(act)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#70C1B3]/15 hover:bg-[#70C1B3]/25 text-[#70C1B3] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        檢視報告
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(act)}
                        className="p-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                        title="編輯此活動紀錄"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingActivityId(act.id)}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="刪除此活動紀錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="cursor-pointer"
                      title="全選 / 取消全選"
                    >
                      {selectedActivityIds.length === filteredActivities.length && filteredActivities.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">活動日期</th>
                  <th className="py-3 px-3">活動名稱</th>
                  <th className="py-3 px-3">性質 / 類別</th>
                  <th className="py-3 px-3">地點</th>
                  <th className="py-3 px-3">出席人數</th>
                  <th className="py-3 px-3">帶領幹部</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredActivities.map((act) => {
                  const catStyle = CATEGORY_COLORS[act.category];
                  const isSelected = selectedActivityIds.includes(act.id);
                  return (
                    <tr key={act.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-stone-50'}`}>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectActivity(act.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-500 whitespace-nowrap">
                        {act.date}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#2C3437] max-w-xs truncate">
                        <button
                          onClick={() => setViewingActivity(act)}
                          className="hover:text-[#70C1B3] text-left truncate block"
                        >
                          {act.title}
                        </button>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {act.activityNature && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white">
                              {act.activityNature === '總團活動' ? '總團/總會' : act.activityNature.slice(0, 4)}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                            {act.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-600 max-w-[150px] truncate">
                        {act.location}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#2C3437] whitespace-nowrap">
                        {act.attendeeTotal} 人
                        <span className="text-[10px] text-stone-400 ml-1">(青 {act.attendeeYouth})</span>
                      </td>
                      <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                        {act.leadCadres.join('、')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingActivity(act)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#70C1B3] hover:text-white text-stone-600 text-xs font-bold transition-all"
                          >
                            詳情
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(act)}
                            className="p-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                            title="編輯紀錄"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingActivityId(act.id)}
                            className="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Official Activity Report View Modal */}
      {viewingActivity && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingActivity(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#2C3437] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#70C1B3] text-white flex items-center justify-center font-bold">
                  佛
                </div>
                <div>
                  <h3 className="font-bold text-sm">國際佛光會中華佛光青年總團 • 新竹青年分團</h3>
                  <p className="text-[11px] text-stone-300">活動紀錄報告書 ｜ 成果歸檔與成效備忘</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportWord(viewingActivity)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="輸出符合標準公務格式之 Word (.doc) 檔案"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  輸出 Word
                </button>
                <button
                  onClick={() => {
                    setDocsTargetActivity(viewingActivity);
                    setDocsSelectedActivities([]);
                    setIsGoogleDocsModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="將此活動直接發布至 Google 文件 (Google Docs)"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  Google 文件
                </button>
                <button
                  onClick={() => openPrintableDocumentInNewTab([convertActivityToProofDocument(viewingActivity)])}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="在新分頁開啟列印並另存為高畫質 PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  列印 / 存為 PDF
                </button>
                <button
                  onClick={() => {
                    handleOpenEditModal(viewingActivity);
                    setViewingActivity(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  編輯
                </button>
                <button
                  onClick={() => setViewingActivity(null)}
                  className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Printable Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#2C3437]">
              
              {/* Title Header */}
              <div className="border-b border-stone-200 pb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${CATEGORY_COLORS[viewingActivity.category]?.bg} ${CATEGORY_COLORS[viewingActivity.category]?.text} ${CATEGORY_COLORS[viewingActivity.category]?.border}`}>
                    {viewingActivity.category}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">編號：{viewingActivity.id}</span>
                </div>
                <h2 className="text-xl font-black text-[#2C3437] tracking-tight">
                  {viewingActivity.title}
                </h2>
              </div>

              {/* Standard Form Table Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[11px] text-stone-400 block">活動日期與時間</span>
                  <span className="font-bold text-xs text-[#2C3437]">{viewingActivity.date} ({viewingActivity.timeRange})</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block">活動地點</span>
                  <span className="font-bold text-xs text-[#2C3437]">{viewingActivity.location}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block">帶領幹部</span>
                  <span className="font-bold text-xs text-[#2C3437]">{viewingActivity.leadCadres.join('、')}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block">主辦單位</span>
                  <span className="font-semibold text-xs text-[#2C3437]">{viewingActivity.organizer}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block">指導單位</span>
                  <span className="font-semibold text-xs text-[#2C3437]">{viewingActivity.guidingUnit}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block">出席總規模</span>
                  <span className="font-black text-xs text-[#70C1B3]">
                    共 {viewingActivity.attendeeTotal} 人（青年 {viewingActivity.attendeeYouth} 人 ｜ 貴賓 {viewingActivity.attendeeGuests} 人 ｜ 義工 {viewingActivity.attendeeVolunteers} 人）
                  </span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-[#2C3437] flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded-full bg-[#70C1B3]"></span>
                  一、活動主旨與目標
                </h4>
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 leading-relaxed text-stone-700 whitespace-pre-line">
                  {viewingActivity.summary}
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-[#2C3437] flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded-full bg-[#F4A261]"></span>
                  二、活動流程與內容紀要
                </h4>
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 leading-relaxed text-stone-700 whitespace-pre-line">
                  {viewingActivity.processSchedule}
                </div>
              </div>

              {/* Highlights & Outcomes */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-[#2C3437] flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded-full bg-blue-500"></span>
                  三、活動成效與亮點花絮
                </h4>
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/60 leading-relaxed text-emerald-950 whitespace-pre-line">
                  {viewingActivity.highlightsAndOutcomes}
                </div>
              </div>

              {/* Review and Suggestions */}
              {viewingActivity.reviewAndSuggestions && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-[#2C3437] flex items-center gap-1.5">
                    <span className="w-1.5 h-3 rounded-full bg-purple-500"></span>
                    四、活動檢討與後續建議 (PDCA)
                  </h4>
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 leading-relaxed text-stone-700 whitespace-pre-line">
                    {viewingActivity.reviewAndSuggestions}
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {viewingActivity.photos && viewingActivity.photos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#2C3437] flex items-center gap-1.5">
                    <span className="w-1.5 h-3 rounded-full bg-amber-500"></span>
                    五、活動成果與花絮照片
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {viewingActivity.photos.map((p) => (
                      <div 
                        key={p.id} 
                        className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50 cursor-pointer group"
                        onClick={() => setActivePhotoModal({ url: p.url, caption: p.caption })}
                      >
                        <div className="h-40 overflow-hidden">
                          {p.url ? (
                            <img 
                              src={p.url} 
                              alt={p.caption || '活動照片'} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs bg-stone-100">
                              無相片
                            </div>
                          )}
                        </div>
                        {p.caption && (
                          <div className="p-2 text-[11px] text-stone-600 font-medium text-center bg-white border-t border-stone-100">
                            {p.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Notes */}
              {viewingActivity.budgetNotes && (
                <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700">經費與資源摘要：</span> {viewingActivity.budgetNotes}
                </div>
              )}

              {/* Footer Sign-off box & Actions */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-stone-500">
                  <span>紀錄幹部：<strong>{viewingActivity.leadCadres[0] || '分團幹部'}</strong> • 國際佛光會新竹青年分團</span>
                  <span className="mx-2 text-stone-300">|</span>
                  <span>建檔時間：{viewingActivity.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportWord(viewingActivity)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-white" />
                    輸出 Word 成果報告
                  </button>
                  <button
                    onClick={() => setViewingActivity(null)}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    關閉
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. Create / Edit Activity Modal Form */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#2C3437] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#70C1B3]" />
                <h3 className="font-bold text-sm">
                  {editingActivity ? '編輯活動紀錄' : '新增活動紀錄表'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Activity Name */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  活動名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例：新竹區青年團戶外生活禪古道行 ✕ 森林正念步道"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3] focus:bg-white"
                />
              </div>

              {/* Category, Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    活動類別 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    活動日期 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      const match = val.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
                      if (match) {
                        setFormDate(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
                      }
                    }}
                    placeholder="YYYY-MM-DD 或 2026/06/20"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    時間區間
                  </label>
                  <input
                    type="text"
                    value={formTimeRange}
                    onChange={(e) => setFormTimeRange(e.target.value)}
                    placeholder="09:00 ~ 16:30"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                  />
                </div>
              </div>

              {/* Location & Cadres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    活動地點 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="例：佛光山法寶寺 ✕ 新竹十八尖山"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    帶領幹部 / 召集人
                  </label>
                  <input
                    type="text"
                    value={formLeadCadres}
                    onChange={(e) => setFormLeadCadres(e.target.value)}
                    placeholder="周汶蔚、徐信銓"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                  />
                </div>
              </div>

              {/* Attendee Count breakdown */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  出席人數統計（系統自動加總）
                </label>
                <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">青年團員 (人)</span>
                    <input
                      type="number"
                      min="0"
                      value={formYouthCount}
                      onChange={(e) => setFormYouthCount(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-xs text-[#2C3437]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">法師與貴賓 (人)</span>
                    <input
                      type="number"
                      min="0"
                      value={formGuestsCount}
                      onChange={(e) => setFormGuestsCount(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-xs text-[#2C3437]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">義工與工作人員 (人)</span>
                    <input
                      type="number"
                      min="0"
                      value={formVolunteersCount}
                      onChange={(e) => setFormVolunteersCount(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-xs text-[#2C3437]"
                    />
                  </div>
                </div>
                <div className="text-right text-[11px] font-bold text-[#70C1B3] mt-1">
                  總出席規模：{Number(formYouthCount) + Number(formGuestsCount) + Number(formVolunteersCount)} 人
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  活動主旨與目標
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="簡述活動目標、核心意義與主旨..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  活動流程與內容紀要
                </label>
                <textarea
                  rows={2}
                  value={formProcess}
                  onChange={(e) => setFormProcess(e.target.value)}
                  placeholder="例：09:00 集合相見歡 ➔ 10:00 專題課程 ➔ 12:00 午齋 ➔ 14:00 分組討論 ➔ 16:30 圓滿"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  活動成效與亮點花絮
                </label>
                <textarea
                  rows={2}
                  value={formHighlights}
                  onChange={(e) => setFormHighlights(e.target.value)}
                  placeholder="條列活動成果、青年回饋反思、問卷滿意度或減碳數據..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                />
              </div>

              {/* Review */}
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  活動檢討與後續建議 (PDCA)
                </label>
                <textarea
                  rows={2}
                  value={formReview}
                  onChange={(e) => setFormReview(e.target.value)}
                  placeholder="備註下次改善重點與精進方針..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                />
              </div>

              {/* Photos Management */}
              <div className="space-y-2 border-t border-stone-200 pt-3">
                <label className="block font-bold text-[#2C3437]">
                  活動照片管理
                </label>
                
                {/* Photo List */}
                {formPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {formPhotos.map((photo) => (
                      <div key={photo.id} className="relative rounded-lg overflow-hidden border border-stone-200 group">
                        {photo.url ? (
                          <img src={photo.url} alt={photo.caption} className="h-24 w-full object-cover" />
                        ) : (
                          <div className="h-24 w-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs">無相片</div>
                        )}
                        <div className="p-1 text-[10px] text-stone-600 bg-white truncate">
                          {photo.caption || '活動照片'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhotoFromForm(photo.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new photo input */}
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="輸入圖片 URL 網址..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs"
                  />
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="圖說標籤"
                    className="w-32 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoToForm}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-white font-bold text-xs shrink-0"
                  >
                    + 加入照片
                  </button>
                </div>
              </div>

              {/* Tags & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-stone-200 pt-3">
                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    標籤 Tags (逗號分隔)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="生活禪, 十八尖山, 青年書院"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2C3437] mb-1">
                    經費與備註
                  </label>
                  <input
                    type="text"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="支出 NT$ 5,000"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#2C3437]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white font-bold text-xs shadow-xs"
                >
                  {editingActivity ? '儲存修改' : '確認新增'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingActivityId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeletingActivityId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2C3437]">確定要刪除此活動紀錄嗎？</h3>
              <p className="text-xs text-stone-500 mt-1">
                刪除後該活動資料將自系統與活動總表中移除。
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingActivityId(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 font-bold text-xs text-stone-600 hover:bg-stone-100"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Activities Confirmation Modal */}
      {isClearAllModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsClearAllModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-2 text-left">
              <h3 className="font-black text-lg text-[#2C3437] text-center">
                確定要一鍵刪除所有活動成果檔案嗎？
              </h3>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  將清空檔案庫中全部 <strong>{activities.length}</strong> 個專案活動成果檔案
                </p>
                <p className="text-rose-700/90 text-[11px] leading-relaxed">
                  包含所有活動佐證資料表、活動照片、出席人次統計與檢討紀錄。清空後成果檔案庫將重設為空。
                </p>
              </div>
              <p className="text-xs text-stone-500 text-center pt-1">
                💡 清空後，您仍可隨時點擊「匯入活動佐證資料」重新匯入，或是點擊「還原預設範本資料」載入範本。
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 font-bold text-xs text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                取消返回
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95"
              >
                確認清空全部 ({activities.length} 項)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Backup Confirmation & Preview Modal */}
      {isImportModalOpen && backupValidation && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isRestoringBackup) {
              setIsImportModalOpen(false);
              setBackupValidation(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                backupValidation.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {backupValidation.isValid ? (
                  <Upload className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2C3437]">
                  {backupValidation.isValid ? '匯入全團成果備份檔' : '備份檔案驗證失敗'}
                </h3>
                <p className="text-xs text-stone-500">
                  {backupValidation.isValid 
                    ? '已通過 JSON 結構與佐證資料校驗，請檢視備份內容後確認還原。' 
                    : '請檢查檔案是否損毀或非本系統專用備份格式。'}
                </p>
              </div>
            </div>

            {/* Content Display */}
            {backupValidation.isValid && backupValidation.summary ? (
              <div className="space-y-4">
                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-[#2C3437] flex items-center justify-between border-b border-stone-200/60 pb-2">
                    <span>備份檔基本資訊</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      版本 {backupValidation.summary.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">組織單位</span>
                      <span className="font-bold text-[#2C3437] truncate block">
                        {backupValidation.summary.organizationName}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">年度設定</span>
                      <span className="font-bold text-[#2C3437]">
                        {backupValidation.summary.currentYear} 年度
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">活動紀錄筆數</span>
                      <span className="font-black text-emerald-600 text-sm">
                        {backupValidation.summary.totalActivities} 場
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">佐證成果資料庫</span>
                      <span className="font-black text-emerald-600 text-sm">
                        {backupValidation.summary.totalProofs} 份 (含圖檔)
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-stone-400">
                    匯出時間：{new Date(backupValidation.summary.exportedAt).toLocaleString('zh-TW')}
                  </div>
                </div>

                {/* Overwrite Warning */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    注意：此操作將覆蓋本機當前的資料庫
                  </p>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    還原後，現有瀏覽器 IndexedDB 佐證資料庫與 LocalStorage 活動索引將被此備份檔徹底替換。
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  錯誤原因
                </p>
                <p className="text-rose-700 text-[11px] leading-relaxed font-mono">
                  {backupValidation.errorMessage || '未知錯誤'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isRestoringBackup}
                onClick={() => {
                  setIsImportModalOpen(false);
                  setBackupValidation(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 font-bold text-xs text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors disabled:opacity-50"
              >
                取消
              </button>

              {backupValidation.isValid && (
                <button
                  type="button"
                  disabled={isRestoringBackup}
                  onClick={handleConfirmRestoreBackup}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isRestoringBackup ? '正在還原資料庫...' : '確認覆蓋還原'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Selected Activities Modal */}
      {isBatchDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBatchDeleteModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2C3437]">確定要刪除選取的活動紀錄嗎？</h3>
              <p className="text-xs text-stone-500 mt-1">
                將從活動庫中刪除已選取的 <strong>{selectedActivityIds.length}</strong> 個活動項目。
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-stone-200 font-bold text-xs text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                確認刪除 ({selectedActivityIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Photo Lightbox Modal */}
      {activePhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center font-bold hover:bg-black"
            >
              ✕
            </button>
            {activePhotoModal.url ? (
              <img src={activePhotoModal.url} alt="放大照片" className="w-full max-h-[75vh] object-contain rounded-xl" />
            ) : null}
            {activePhotoModal.caption && (
              <div className="p-3 text-xs text-stone-700 font-medium text-center">
                {activePhotoModal.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Bottom Administrative Maintenance Footer */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-600">
          <BookOpen className="w-4 h-4 text-[#70C1B3]" />
          <span>國際佛光會新竹青年分團 • 分團活動申報與活動紀錄管理系統</span>
        </div>
      </div>

      {/* 9. Batch Print PDF Modal */}
      <BatchPrintPdfModal
        isOpen={isBatchPrintPdfModalOpen}
        onClose={() => setIsBatchPrintPdfModalOpen(false)}
        proofDocuments={selectedProofDocuments}
      />

      {/* 10. Google Docs Integration Modal */}
      <GoogleDocsModal
        isOpen={isGoogleDocsModalOpen}
        onClose={() => setIsGoogleDocsModalOpen(false)}
        targetActivity={docsTargetActivity}
        selectedActivities={docsSelectedActivities}
      />

    </div>
  );
};
