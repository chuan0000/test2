import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, CheckInRecord, MemberProfile, WishItem, MainNavigationTab, AppConfig, ProjectBackupPackage } from './types';
import { 
  getStoredCheckIns, 
  getStoredWishes, 
  getStoredMembers,
  saveStoredCheckIns, 
  saveStoredWishes, 
  saveStoredMembers,
  calculateMemberStats, 
  resetToInitialData, 
  isAdminAuthenticated, 
  setAdminAuthenticated 
} from './utils/storage';
import { getStoredActivities } from './utils/activityStorage';
import { getStoredAppConfig } from './services/projectPersistence';
import { MainNavbar } from './components/MainNavbar';
import { ActionFreezeGuard } from './components/ActionFreezeGuard';
import { YouthIntroSection } from './components/YouthIntroSection';
import { ActivitiesTabSection } from './components/ActivitiesTabSection';
import { Header } from './components/Header';
import { CheckInForm } from './components/CheckInForm';
import { Leaderboard } from './components/Leaderboard';
import { WishlistWall } from './components/WishlistWall';
import { PersonalHistory } from './components/PersonalHistory';
import { AdminPanel } from './components/AdminPanel';
import { RulesModal } from './components/RulesModal';
import { ProofModal } from './components/ProofModal';
import { SystemConfigModal } from './components/SystemConfigModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { EditableText } from './components/EditableText';
import { Heart, Activity, Shield, Sparkles, Clock, Calendar, MessageCircle, MapPin, Building2, Phone } from 'lucide-react';

export default function App() {
  // Top Level Navigation: 'intro' | 'health' | 'activities'
  const [mainTab, setMainTab] = useState<MainNavigationTab>('intro');

  // Dynamic Application and Fiscal Year Configuration
  const [appConfig, setAppConfig] = useState<AppConfig>(() => getStoredAppConfig());
  const [isCloudSaveOpen, setIsCloudSaveOpen] = useState<boolean>(false);
  const [isCloudLoadOpen, setIsCloudLoadOpen] = useState<boolean>(false);
  const [isSystemConfigOpen, setIsSystemConfigOpen] = useState<boolean>(false);

  // Main Data States for Tab 1 (Health Plan)
  const [members, setMembers] = useState<MemberProfile[]>(() => getStoredMembers());
  const [records, setRecords] = useState<CheckInRecord[]>(() => getStoredCheckIns());
  const [wishes, setWishes] = useState<WishItem[]>(() => getStoredWishes());
  const [activeTab, setActiveTab] = useState<ActiveTab>('checkin');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => isAdminAuthenticated());

  // Activities Data Count for Tab 2
  const [activitiesCount, setActivitiesCount] = useState<number>(() => getStoredActivities().length);

  // UI / Modal States
  const [selectedMemberName, setSelectedMemberName] = useState<string>(() => {
    const stored = getStoredMembers();
    return stored[0]?.name || '徐信銓';
  });
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [inspectingProofRecord, setInspectingProofRecord] = useState<CheckInRecord | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    saveStoredMembers(members);
  }, [members]);

  useEffect(() => {
    saveStoredCheckIns(records);
  }, [records]);

  useEffect(() => {
    saveStoredWishes(wishes);
  }, [wishes]);

  // Sync activities count & config in real-time
  useEffect(() => {
    const handleActivitiesChange = () => {
      setActivitiesCount(getStoredActivities().length);
    };
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setAppConfig(e.detail);
      } else {
        setAppConfig(getStoredAppConfig());
      }
    };
    const handleProjectRestored = (e: any) => {
      const pkg = e.detail as ProjectBackupPackage;
      if (pkg?.appConfig) {
        setAppConfig(pkg.appConfig);
      }
      setActivitiesCount(getStoredActivities().length);
    };

    const handleAdminAuthChange = (e: any) => {
      if (e?.detail?.auth !== undefined) {
        setIsAdminAuth(e.detail.auth);
      } else {
        setIsAdminAuth(isAdminAuthenticated());
      }
    };

    window.addEventListener('blia_activities_changed', handleActivitiesChange);
    window.addEventListener('blia_app_config_changed', handleConfigChange);
    window.addEventListener('blia_project_restored', handleProjectRestored);
    window.addEventListener('blia_admin_auth_changed', handleAdminAuthChange);
    window.addEventListener('storage', handleActivitiesChange);
    
    return () => {
      window.removeEventListener('blia_activities_changed', handleActivitiesChange);
      window.removeEventListener('blia_app_config_changed', handleConfigChange);
      window.removeEventListener('blia_project_restored', handleProjectRestored);
      window.removeEventListener('blia_admin_auth_changed', handleAdminAuthChange);
      window.removeEventListener('storage', handleActivitiesChange);
    };
  }, []);

  // Aggregated Stats based on dynamic members
  const memberStats = useMemo(() => {
    return calculateMemberStats(records, wishes, members);
  }, [records, wishes, members]);

  const approvedCount = useMemo(() => {
    return records.filter((r) => r.status === 'approved').length;
  }, [records]);

  // Handlers
  const handleCheckInSuccess = (newRecord: CheckInRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    if (!members.some((m) => m.name === newRecord.memberName)) {
      setMembers((prev) => [
        ...prev,
        {
          name: newRecord.memberName,
          identity: newRecord.identity,
          avatarBg: '#70C1B3',
        },
      ]);
    }
  };

  const handleAddOrUpdateWish = (newWish: WishItem) => {
    setWishes((prev) => {
      const existingIdx = prev.findIndex((w) => w.memberName === newWish.memberName);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...newWish };
        return copy;
      }
      return [newWish, ...prev];
    });

    if (!members.some((m) => m.name === newWish.memberName)) {
      setMembers((prev) => [
        ...prev,
        {
          name: newWish.memberName,
          identity: newWish.identity,
          avatarBg: '#F4A261',
        },
      ]);
    }
  };

  const handleLikeWish = (wishId: string) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, likesCount: w.likesCount + 1 } : w))
    );
  };

  const handleApproveRecord = (recordId: string, officerName: string) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'approved',
              reviewedBy: officerName,
              reviewedAt: nowStr,
              adminNote: '雙軌證明審核通過 ✔',
            }
          : r
      )
    );
    if (inspectingProofRecord?.id === recordId) {
      setInspectingProofRecord(null);
    }
  };

  const handleRejectRecord = (recordId: string, officerName: string, reason: string) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'rejected',
              reviewedBy: officerName,
              reviewedAt: nowStr,
              adminNote: reason,
            }
          : r
      )
    );
    if (inspectingProofRecord?.id === recordId) {
      setInspectingProofRecord(null);
    }
  };

  // Member Management Handlers
  const handleDeleteMember = (memberName: string) => {
    setMembers((prev) => prev.filter((m) => m.name !== memberName));
    setRecords((prev) => prev.filter((r) => r.memberName !== memberName));
    setWishes((prev) => prev.filter((w) => w.memberName !== memberName));
    if (selectedMemberName === memberName) {
      const remaining = members.filter((m) => m.name !== memberName);
      setSelectedMemberName(remaining[0]?.name || '');
    }
  };

  const handleAddMember = (newMember: MemberProfile) => {
    setMembers((prev) => [...prev, newMember]);
  };

  const handleResetData = () => {
    resetToInitialData();
    setMembers(getStoredMembers());
    setRecords(getStoredCheckIns());
    setWishes(getStoredWishes());
  };

  const handleAdminAuth = (auth: boolean) => {
    setIsAdminAuth(auth);
    setAdminAuthenticated(auth);
  };

  const handleSelectMemberAndGoToHistory = (memberName: string) => {
    setSelectedMemberName(memberName);
    setActiveTab('personal');
  };

  const handleNavigateToAdmin = () => {
    setMainTab('health');
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      mainTab === 'intro' ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F8F9FA] text-[#2C3437]'
    }`}>
      {/* 0. Action Freeze Guard for Visual Inline CMS */}
      <ActionFreezeGuard />

      {/* 1. Global Top Navigation Header */}
      <MainNavbar
        mainTab={mainTab}
        setMainTab={setMainTab}
        approvedCount={approvedCount}
        totalActivitiesCount={activitiesCount}
        activeYouthCount={members.length}
        appConfig={appConfig}
        onOpenCloudSave={() => setIsCloudSaveOpen(true)}
        onOpenCloudLoad={() => setIsCloudLoadOpen(true)}
        onOpenSystemConfig={() => setIsSystemConfigOpen(true)}
        lastSyncedAt={appConfig.lastSyncedAt}
        isAdminAuth={isAdminAuth}
        onAdminAuthChange={handleAdminAuth}
        onNavigateToAdmin={handleNavigateToAdmin}
      />

      {/* 2. Main Content Views based on mainTab */}
      <main className="flex-1 pb-16">
        {/* Entry View: Introduction to Hsinchu Youth */}
        {mainTab === 'intro' && (
          <YouthIntroSection
            onNavigateTab={(target) => {
              setMainTab(target);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalActivitiesCount={activitiesCount}
            activeYouthCount={members.length}
          />
        )}

        {/* Tab 1 View: 2027 Cross-Boundary Youth Health Project */}
        {mainTab === 'health' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Health Project Sub Header & Navigation */}
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              memberStats={memberStats}
              records={records}
              onOpenRules={() => setIsRulesModalOpen(true)}
            />

            {/* Health Project Modules */}
            <div>
              {activeTab === 'checkin' && (
                <CheckInForm
                  members={members}
                  onCheckInSuccess={handleCheckInSuccess}
                  onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard
                  memberStats={memberStats}
                  records={records}
                  onSelectMember={handleSelectMemberAndGoToHistory}
                  onOpenProofModal={(record) => setInspectingProofRecord(record)}
                />
              )}

              {activeTab === 'wishlist' && (
                <WishlistWall
                  members={members}
                  wishes={wishes}
                  memberStats={memberStats}
                  onAddOrUpdateWish={handleAddOrUpdateWish}
                  onLikeWish={handleLikeWish}
                />
              )}

              {activeTab === 'personal' && (
                <PersonalHistory
                  memberStats={memberStats}
                  records={records}
                  selectedMemberName={selectedMemberName}
                  onSelectMember={setSelectedMemberName}
                  onOpenProofModal={(record) => setInspectingProofRecord(record)}
                  onNavigateToCheckIn={() => setActiveTab('checkin')}
                />
              )}

              {activeTab === 'green' && (
                <div className="max-w-6xl mx-auto px-4 pt-4">
                  <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌱</span>
                      <div>
                        <h2 className="text-sm font-bold text-[#2C3437]">綠色生活步步留 ｜ 日常低碳代步與碳足跡登記專區</h2>
                        <p className="text-[11px] text-stone-500">以雙腳或單車代替短程交通，把每一步化為地球的減碳足跡。</p>
                      </div>
                    </div>
                    <a
                      href="/green-commute.html"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-[#70C1B3] hover:bg-[#5dafa2] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>在新分頁開啟獨立頁</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden h-[800px]">
                    <iframe
                      src="/green-commute.html"
                      title="綠色生活步步留"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <AdminPanel
                  members={members}
                  records={records}
                  memberStats={memberStats}
                  isAuthenticated={isAdminAuth}
                  onAuthenticate={handleAdminAuth}
                  onApproveRecord={handleApproveRecord}
                  onRejectRecord={handleRejectRecord}
                  onDeleteMember={handleDeleteMember}
                  onAddMember={handleAddMember}
                  onResetData={handleResetData}
                  onOpenProofModal={(record) => setInspectingProofRecord(record)}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 2 View: Project Activities Performance & Evidence Compilation */}
        {mainTab === 'activities' && (
          <div className="animate-in fade-in duration-200">
            <ActivitiesTabSection appConfig={appConfig} />
          </div>
        )}
      </main>

      {/* Proof Inspection Modal */}
      <ProofModal
        record={inspectingProofRecord}
        onClose={() => setInspectingProofRecord(null)}
        onApprove={(id) => handleApproveRecord(id, '管理員幹部')}
        onReject={(id) => handleRejectRecord(id, '管理員幹部', '截圖資料不完整，請重新上傳補件')}
        isAdmin={isAdminAuth}
      />

      {/* Activity Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* System & Fiscal Year Configuration Modal */}
      <SystemConfigModal
        isOpen={isSystemConfigOpen}
        onClose={() => setIsSystemConfigOpen(false)}
        onConfigSaved={(updated) => setAppConfig(updated)}
      />

      {/* Cloud Drive Backup & Restore Modal */}
      <CloudSyncModal
        isOpen={isCloudSaveOpen || isCloudLoadOpen}
        onClose={() => {
          setIsCloudSaveOpen(false);
          setIsCloudLoadOpen(false);
        }}
        mode={isCloudSaveOpen ? 'save' : 'load'}
        onOpenSystemConfig={() => {
          setIsCloudSaveOpen(false);
          setIsCloudLoadOpen(false);
          setIsSystemConfigOpen(true);
        }}
        onProjectRestored={(restored) => {
          if (restored.appConfig) setAppConfig(restored.appConfig);
          setActivitiesCount(getStoredActivities().length);
        }}
      />

      {/* Bottom Global Footer (Dark Slate Modern Harmony) */}
      <footer className="bg-[#0B1120] border-t border-white/10 py-8 px-4 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#70C1B3] to-[#F4A261] text-white flex items-center justify-center font-black text-base shadow-md">
              佛
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                <EditableText
                  fieldKey="footer_platform_title"
                  defaultText={`${appConfig.organizationName} 數位成果與評鑑平台`}
                  className="text-white font-bold"
                />
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <EditableText
                  fieldKey="footer_contact_info"
                  defaultText="新竹市東區民族路 241 巷 1 號（佛光山法寶寺）• 諮詢專線：(03) 532-5571"
                  className="text-slate-400"
                />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setMainTab('intro');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <EditableText
                fieldKey="footer_nav_intro"
                defaultText="分團簡介"
                className="text-slate-400 hover:text-white"
              />
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => {
                setMainTab('activities');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <EditableText
                fieldKey="footer_nav_activities"
                defaultText="年度成果 (57項佐證)"
                className="text-slate-400 hover:text-white"
              />
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => {
                setMainTab('health');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <EditableText
                fieldKey="footer_nav_health"
                defaultText="健康打卡計畫"
                className="text-slate-400 hover:text-white"
              />
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => {
                setMainTab('intro');
                setTimeout(() => {
                  const el = document.getElementById('join-us');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <EditableText
                fieldKey="footer_nav_join"
                defaultText="加入我們 / 道場導航"
                className="text-emerald-400 hover:text-emerald-300"
              />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            <EditableText
              fieldKey="footer_copyright_text"
              defaultText={`© ${new Date().getFullYear()} 國際佛光會中華佛光青年總團 新竹青年分團. 版權所有. 佛光山法寶寺 指導`}
              className="text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>評鑑成果與佐證系統已連線就緒</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

