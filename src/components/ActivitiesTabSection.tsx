import React, { useState, useEffect } from 'react';
import { ProofGeneratorSection } from './ProofGeneratorSection';
import { ActivityLogsPanel } from './ActivityLogsPanel';
import { MeetingReportSlidesSection } from './MeetingReportSlidesSection';
import { EvidenceFileImportSection } from './EvidenceFileImportSection';
import { HealthAuditWidget } from './HealthAuditWidget';
import { BookOpen, Sparkles, Award, FileText, CheckCircle2, Layers, Presentation, FileUp } from 'lucide-react';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { AppConfig, ActivityRecordItem } from '../types';
import { getStoredAppConfig, getStoredActivities } from '../services/projectPersistence';
import { useUiText } from '../contexts/UiTextContext';

interface ActivitiesTabSectionProps {
  appConfig?: AppConfig;
}

const SUBTAB_STORAGE_KEY = 'blia_activities_active_subtab_v1';

export const ActivitiesTabSection: React.FC<ActivitiesTabSectionProps> = ({ appConfig: propConfig }) => {
  const { getText } = useUiText();
  const [subTab, setSubTab] = useState<'proof_generator' | 'import_evidence' | 'all_archives' | 'meeting_slides'>(() => {
    try {
      const saved = localStorage.getItem(SUBTAB_STORAGE_KEY);
      if (saved && ['proof_generator', 'import_evidence', 'all_archives', 'meeting_slides'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'proof_generator';
  });
  const [activeProofData, setActiveProofData] = useState<ProofDocumentData | undefined>(undefined);
  const appConfig = propConfig || getStoredAppConfig();

  // Activities for Health Audit Widget
  const [activities, setActivities] = useState<ActivityRecordItem[]>(() => getStoredActivities());

  // Health Audit Filter States
  const [auditFilter, setAuditFilter] = useState<'all' | 'needs_photos' | 'needs_attendees' | 'complete'>('all');
  const [auditObjective, setAuditObjective] = useState<string>('all');

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

  const handleSubTabChange = (tab: 'proof_generator' | 'import_evidence' | 'all_archives' | 'meeting_slides') => {
    setSubTab(tab);
    try {
      localStorage.setItem(SUBTAB_STORAGE_KEY, tab);
    } catch {}
  };

  const handleApplyToProofGenerator = (data: ProofDocumentData) => {
    setActiveProofData(data);
    handleSubTabChange('proof_generator');
  };

  // When clicking an audit filter in the HealthAuditWidget, switch to all_archives so the user immediately sees the filtered items
  const handleSelectAuditFilter = (filter: 'all' | 'needs_photos' | 'needs_attendees' | 'complete') => {
    setAuditFilter(filter);
    if (filter !== 'all') {
      handleSubTabChange('all_archives');
    }
  };

  const handleSelectObjective = (objective: string) => {
    setAuditObjective(objective);
    if (objective !== 'all') {
      handleSubTabChange('all_archives');
    }
  };

  const handleResetAuditFilters = () => {
    setAuditFilter('all');
    setAuditObjective('all');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* 評鑑指標達成率與缺件防呆儀表板 (Health Audit Widget) */}
      <HealthAuditWidget 
        activities={activities}
        currentAuditFilter={auditFilter}
        selectedObjective={auditObjective}
        onSelectAuditFilter={handleSelectAuditFilter}
        onSelectObjective={handleSelectObjective}
        onResetFilters={handleResetAuditFilters}
      />

      {/* Sub Tab Switcher */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs print:hidden overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* 1. 優秀分團選拔活動佐證資料表 */}
          <button
            onClick={() => handleSubTabChange('proof_generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'proof_generator'
                ? 'bg-gradient-to-r from-[#2C3437] to-[#3a4549] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Award className="w-4 h-4 text-[#F4A261]" />
            <span>{getText('subtab_proof_generator', '優秀分團選拔活動佐證資料表')}</span>
          </button>

          {/* 2. 匯入活動佐證資料 */}
          <button
            onClick={() => handleSubTabChange('import_evidence')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'import_evidence'
                ? 'bg-gradient-to-r from-[#2C3437] to-[#3a4549] text-white shadow-sm ring-2 ring-emerald-400/50'
                : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 font-bold'
            }`}
          >
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>{getText('subtab_import_evidence', '匯入活動佐證資料')}</span>
          </button>

          {/* 3. 分團專案活動成果檔案庫 */}
          <button
            onClick={() => handleSubTabChange('all_archives')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'all_archives'
                ? 'bg-gradient-to-r from-[#2C3437] to-[#3a4549] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4 text-[#70C1B3]" />
            <span>{getText('subtab_all_archives', '分團專案活動成果檔案庫')}</span>
            {auditFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* 4. 聯團會議工作報告簡報 */}
          <button
            onClick={() => handleSubTabChange('meeting_slides')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'meeting_slides'
                ? 'bg-gradient-to-r from-[#2C3437] to-[#3a4549] text-white shadow-sm ring-2 ring-amber-400/40'
                : 'text-stone-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-bold'
            }`}
          >
            <Presentation className="w-4 h-4 text-amber-500" />
            <span>{getText('subtab_meeting_slides', '聯團會議工作報告簡報')}</span>
          </button>
        </div>
      </div>

      {/* View Content - Preserved in DOM across sub-tab switches */}
      <div className={subTab === 'proof_generator' ? 'block' : 'hidden'}>
        <ProofGeneratorSection 
          initialData={activeProofData}
          onNavigateToArchives={() => handleSubTabChange('all_archives')} 
        />
      </div>

      <div className={subTab === 'import_evidence' ? 'block' : 'hidden'}>
        <EvidenceFileImportSection 
          onNavigateToArchives={() => handleSubTabChange('all_archives')}
          onApplyToProofGenerator={handleApplyToProofGenerator}
        />
      </div>

      <div className={subTab === 'all_archives' ? 'block' : 'hidden'}>
        <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-xs">
          <ActivityLogsPanel 
            activeOfficer="周汶蔚" 
            onNavigateToImportEvidence={() => handleSubTabChange('import_evidence')}
            externalAuditFilter={auditFilter}
            externalObjectiveFilter={auditObjective}
            onClearAuditFilter={handleResetAuditFilters}
          />
        </div>
      </div>

      <div className={subTab === 'meeting_slides' ? 'block' : 'hidden'}>
        <MeetingReportSlidesSection />
      </div>

    </div>
  );
};



