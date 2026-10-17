import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Activity, 
  BookOpen, 
  Sparkles, 
  HeartHandshake,
  Clock,
  Flame,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  CloudUpload,
  CloudDownload,
  Settings,
  HardDrive,
  Lock,
  Key,
  LogOut,
  ArrowRight,
  X,
  Edit3,
  Menu,
  ChevronDown,
  CheckCircle2,
  Users
} from 'lucide-react';
import { MainNavigationTab, AppConfig } from '../types';
import { useUiText } from '../contexts/UiTextContext';
import { EditableText } from './EditableText';

interface MainNavbarProps {
  mainTab: MainNavigationTab;
  setMainTab: (tab: MainNavigationTab) => void;
  approvedCount: number;
  totalActivitiesCount: number;
  activeYouthCount: number;
  appConfig: AppConfig;
  onOpenCloudSave: () => void;
  onOpenCloudLoad: () => void;
  onOpenSystemConfig: () => void;
  lastSyncedAt?: string;
  isAdminAuth?: boolean;
  onAdminAuthChange?: (auth: boolean) => void;
  onNavigateToAdmin?: () => void;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({
  mainTab,
  setMainTab,
  approvedCount,
  totalActivitiesCount,
  activeYouthCount,
  appConfig,
  onOpenCloudSave,
  onOpenCloudLoad,
  onOpenSystemConfig,
  lastSyncedAt,
  isAdminAuth = false,
  onAdminAuthChange,
  onNavigateToAdmin,
}) => {
  const { getText, isVisualEditModeActive, setIsVisualEditModeActive } = useUiText();

  // Settings dropdown menu state & ref for click-outside
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin password authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleOpenAuthModal = () => {
    setPasswordInput('');
    setAuthError('');
    setIsAuthModalOpen(true);
    setIsSettingsOpen(false);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setPasswordInput('');
    setAuthError('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      onAdminAuthChange?.(true);
      setIsAuthModalOpen(false);
      setPasswordInput('');
      setAuthError('');
    } else {
      setAuthError('密碼錯誤，請重新輸入（預設密碼：1234）');
    }
  };

  const handleToggleAdminClick = () => {
    if (isAdminAuth) {
      onAdminAuthChange?.(false);
      setIsSettingsOpen(false);
    } else {
      handleOpenAuthModal();
    }
  };

  // 冷啟動與訪客模式防呆累積數值
  const displayActivitiesCount = totalActivitiesCount > 0 ? totalActivitiesCount : 57;
  const displayYouthCount = activeYouthCount > 0 ? activeYouthCount : 20;
  const displayApprovedCount = approvedCount > 0 ? approvedCount : 320;

  // 任務一：一級導覽列僅保留對外核心錨點
  const primaryTabs = [
    {
      id: 'intro' as MainNavigationTab,
      key: 'nav_tab_intro',
      defaultText: '分團簡介',
      icon: <Building2 className="w-4 h-4" />,
      badge: undefined
    },
    {
      id: 'activities' as MainNavigationTab,
      key: 'nav_tab_activities',
      defaultText: '年度成果 (57項)',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      badge: `${displayActivitiesCount}項成果`
    },
    {
      id: 'health' as MainNavigationTab,
      key: 'nav_tab_health',
      defaultText: '健康計畫',
      icon: <Activity className="w-4 h-4 text-[#70C1B3]" />,
      badge: `${displayApprovedCount}次打卡`
    },
    {
      id: 'join' as MainNavigationTab,
      key: 'nav_tab_join',
      defaultText: '加入我們',
      icon: <HeartHandshake className="w-4 h-4 text-rose-400" />,
      badge: '招生中'
    }
  ];

  const handleTabClick = (tabId: MainNavigationTab) => {
    setIsMobileMenuOpen(false);
    if (tabId === 'join') {
      setMainTab('intro');
      setTimeout(() => {
        const joinSection = document.getElementById('join-us');
        if (joinSection) {
          joinSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setMainTab(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md text-white border-b border-white/10 shadow-lg">
      
      {/* 1. Top Micro Status Bar (外層嚴格約束 max-w-7xl mx-auto px-4 sm:px-6) */}
      <div className="bg-[#0b1120] border-b border-white/5 text-[11px] text-slate-400 py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Organization & Guiding Temple */}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <span>{appConfig.organizationName}</span>
              <EditableText
                fieldKey="nav_status_bar_title"
                defaultText="成果評鑑與青年專區"
                className="text-slate-300"
              />
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400 items-center gap-1">
              <EditableText
                fieldKey="nav_status_guiding_label"
                defaultText="指導道場："
                className="text-slate-400"
              />
              <span>{appConfig.guidingUnit || '佛光山法寶寺'}</span>
            </span>
          </div>

          {/* Right: Public Cumulative Cold-start Protected Stats */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>年度累積動員：<strong className="text-emerald-400">800+</strong> 人次</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="hidden sm:inline">
              成果歸檔：<strong className="text-amber-400">{displayActivitiesCount}</strong> 項
            </span>

            {/* Auto debounce sync indicator */}
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10">
              <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
              <span>防抖自動存檔</span>
              {lastSyncedAt && (
                <span className="text-slate-400 font-mono">
                  ({lastSyncedAt.slice(11, 16)})
                </span>
              )}
            </span>
          </div>

        </div>
      </div>

      {/* 2. Main Navigation Bar (約束 max-w-7xl mx-auto px-4 sm:px-6) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Brand Slogan */}
          <div 
            onClick={() => handleTabClick('intro')}
            className="flex items-center gap-3 cursor-pointer group shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#70C1B3] to-[#F4A261] flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              佛
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white group-hover:text-[#70C1B3] transition-colors">
                  {appConfig.subUnitName || appConfig.organizationName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                <EditableText
                  fieldKey="nav_brand_slogan"
                  defaultText="傳承信仰 • 智慧創新 • 跨界健康 • 義工出坡"
                  className="text-slate-400"
                />
              </p>
            </div>
          </div>

          {/* Desktop Core Anchor Tabs (4 Items Only) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-800/70 rounded-2xl border border-white/10">
            {primaryTabs.map((tab) => {
              const isActive = mainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap text-xs font-black ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <EditableText
                    fieldKey={tab.key}
                    defaultText={tab.defaultText}
                    className={isActive ? 'text-slate-950' : 'text-slate-300'}
                  />
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-slate-950 text-emerald-300' : 'bg-slate-700/80 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: ⚙️ System Settings Dropdown + Mobile Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* System Settings Dropdown Menu (後台功能全數收納於此) */}
            <div className="relative" ref={settingsDropdownRef} data-freeze-bypass="true">
              <button
                type="button"
                data-freeze-bypass="true"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isSettingsOpen || isAdminAuth
                    ? 'bg-slate-800 text-amber-400 border-amber-500/50 ring-2 ring-amber-400/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/10'
                }`}
                title="系統設定與後台維護選單"
              >
                <Settings className={`w-4 h-4 ${isAdminAuth ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">系統設定</span>
                {isAdminAuth && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Panel */}
              {isSettingsOpen && (
                <div 
                  data-freeze-bypass="true"
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#1E293B] border border-white/15 shadow-2xl p-3 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
                >
                  
                  {/* Section 1: 雲端備份與還原 */}
                  <div className="space-y-1.5 pb-2 border-b border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      雲端備份與存檔
                    </div>
                    
                    <button
                      type="button"
                      data-freeze-bypass="true"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenCloudSave();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-emerald-500/30"
                    >
                      <CloudUpload className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <div>{getText('nav_btn_cloud_save', '💾 雲端備份存檔')}</div>
                        <div className="text-[10px] text-emerald-400/80 font-normal">打包活動與投影片上傳</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      data-freeze-bypass="true"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenCloudLoad();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-blue-500/30"
                    >
                      <CloudDownload className="w-4 h-4 text-blue-400" />
                      <div className="text-left">
                        <div>{getText('nav_btn_cloud_load', '📂 開啟雲端備份')}</div>
                        <div className="text-[10px] text-blue-400/80 font-normal">從雲端或本機讀取備份還原</div>
                      </div>
                    </button>
                  </div>

                  {/* Section 2: 全域參數與年度設定 */}
                  <div className="space-y-1.5 pb-2 border-b border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      系統全域設定
                    </div>

                    <button
                      type="button"
                      data-freeze-bypass="true"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenSystemConfig();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
                    >
                      <Settings className="w-4 h-4 text-slate-300" />
                      <div className="text-left">
                        <div>年度與主辦參數設定</div>
                        <div className="text-[10px] text-slate-400 font-normal">更換年度、單位名稱與 GAS 網址</div>
                      </div>
                    </button>
                  </div>

                  {/* Section 3: 管理員模式與權限 */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      幹部權限與模式
                    </div>

                    {isAdminAuth ? (
                      <div className="space-y-2">
                        {/* Admin status pill */}
                        <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>管理員模式已啟用</span>
                          </span>
                          <button
                            type="button"
                            data-freeze-bypass="true"
                            onClick={handleToggleAdminClick}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 transition-colors cursor-pointer"
                          >
                            登出
                          </button>
                        </div>

                        {/* In-place visual edit toggle */}
                        <button
                          type="button"
                          data-freeze-bypass="true"
                          onClick={() => setIsVisualEditModeActive(!isVisualEditModeActive)}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                            isVisualEditModeActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>就地視覺化編修 (CMS)</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isVisualEditModeActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {isVisualEditModeActive ? 'ON' : 'OFF'}
                          </span>
                        </button>

                        {/* Enter Admin Panel */}
                        <button
                          type="button"
                          data-freeze-bypass="true"
                          onClick={() => {
                            setIsSettingsOpen(false);
                            onNavigateToAdmin?.();
                          }}
                          className="w-full px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-200" />
                          <span>進入幹部審核後台</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-freeze-bypass="true"
                        onClick={handleToggleAdminClick}
                        className="w-full px-2.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-amber-400" />
                        <div className="text-left">
                          <div>幹部登入 / 管理員模式</div>
                          <div className="text-[10px] text-amber-400/70 font-normal">輸入密碼解鎖完整維護功能</div>
                        </div>
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* 3. Mobile Vertical Drawer Navigation (手機版垂直收納) */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-white/10 mt-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150 text-left">
            {primaryTabs.map((tab) => {
              const isActive = mainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <EditableText
                      fieldKey={tab.key}
                      defaultText={tab.defaultText}
                      className={isActive ? 'text-slate-950' : 'text-slate-300'}
                    />
                  </div>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Admin Password Authentication Dialog Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#1E293B] text-slate-100 rounded-3xl p-6 max-w-sm w-full border border-white/15 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">幹部身分驗證</h3>
                  <p className="text-[11px] text-slate-400">切換進入管理員維護模式</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAuthModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  請輸入管理員密碼
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="請輸入密碼（預設：1234）"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
                {authError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {authError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAuthModal}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  驗證並登入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
};
