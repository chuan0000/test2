import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Users, 
  PlusCircle, 
  Activity,
  Layers,
  UserX,
  BookOpen,
  FileSpreadsheet,
  Sparkles,
  Type
} from 'lucide-react';
import { CheckInRecord, IdentityType, MemberProfile, MemberStats } from '../types';
import { exportCheckInsToCSV } from '../utils/storage';
import { ActivityLogsPanel } from './ActivityLogsPanel';
import { AdminGoogleSheetsSyncModal } from './AdminGoogleSheetsSyncModal';
import { AdminUiTextEditor } from './AdminUiTextEditor';
import { useUiText } from '../contexts/UiTextContext';
import { EditableText } from './EditableText';
import { 
  getStoredSheetInfo, 
  getStoredAutoSyncSetting, 
  appendRecordsToSheet, 
  SpreadsheetInfo 
} from '../services/googleSheets';
import { getAccessToken } from '../services/googleAuth';

interface AdminPanelProps {
  members: MemberProfile[];
  records: CheckInRecord[];
  memberStats: MemberStats[];
  isAuthenticated: boolean;
  onAuthenticate: (success: boolean) => void;
  onApproveRecord: (recordId: string, officerName: string) => void;
  onRejectRecord: (recordId: string, officerName: string, reason: string) => void;
  onDeleteMember: (memberName: string) => void;
  onAddMember: (member: MemberProfile) => void;
  onResetData: () => void;
  onOpenProofModal: (record: CheckInRecord) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  members,
  records,
  memberStats,
  isAuthenticated,
  onAuthenticate,
  onApproveRecord,
  onRejectRecord,
  onDeleteMember,
  onAddMember,
  onResetData,
  onOpenProofModal,
}) => {
  const { getText } = useUiText();
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeOfficer, setActiveOfficer] = useState<string>('周汶蔚');

  // Sub tab inside Admin Panel: 'reviews' | 'members' | 'activities' | 'ui_texts'
  const [adminTab, setAdminTab] = useState<'reviews' | 'members' | 'activities' | 'ui_texts'>('reviews');

  // Filter & Search for records
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Member Management state
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberIdentity, setNewMemberIdentity] = useState<IdentityType>('在職青年');

  // Rejection modal
  const [rejectingRecord, setRejectingRecord] = useState<CheckInRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('視訊開鏡畫面未見本人或運動手錶數據不清晰，請重新補件');

  // Google Sheets integration state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [currentSheet, setCurrentSheet] = useState<SpreadsheetInfo | null>(() => getStoredSheetInfo());
  const [autoSync, setAutoSync] = useState<boolean>(() => getStoredAutoSyncSetting());
  const [isSyncingApproved, setIsSyncingApproved] = useState<boolean>(false);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      onAuthenticate(true);
      setAuthError('');
    } else {
      setAuthError('密碼錯誤，請重新輸入。');
    }
  };

  // Metrics
  const pendingRecords = records.filter((r) => r.status === 'pending');
  const approvedRecords = records.filter((r) => r.status === 'approved');
  const rejectedRecords = records.filter((r) => r.status === 'rejected');

  const filteredRecords = records
    .filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchSearch = r.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.workoutType.includes(searchTerm);
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      // Pending first, then date descending
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return (b.date + b.time).localeCompare(a.date + a.time);
    });

  // Export CSV Action
  const handleExportCSV = () => {
    exportCheckInsToCSV(records, memberStats);
  };

  // Single Record Approve with Auto-Sync
  const handleApproveRecordWithSync = async (recordId: string) => {
    onApproveRecord(recordId, activeOfficer);

    // If auto-sync to Google Sheets is enabled, append this record
    if (autoSync && currentSheet) {
      try {
        const token = await getAccessToken();
        const targetRec = records.find((r) => r.id === recordId);
        if (token && targetRec) {
          const updatedRec: CheckInRecord = {
            ...targetRec,
            status: 'approved',
            reviewedBy: activeOfficer,
            reviewedAt: new Date().toLocaleString('zh-TW'),
          };
          await appendRecordsToSheet(token, currentSheet.id, [updatedRec]);
        }
      } catch (err) {
        console.error('Auto-sync to Google Sheets failed:', err);
      }
    }
  };

  // Batch Approve All Pending with Auto-Sync
  const handleBatchApproveAll = async () => {
    if (pendingRecords.length === 0) return;
    if (!confirm(`確定要將全部 ${pendingRecords.length} 筆待審核打卡紀錄一鍵標記為「通過」嗎？`)) {
      return;
    }

    const officer = activeOfficer;
    const nowStr = new Date().toLocaleString('zh-TW');

    // Approve each
    pendingRecords.forEach((r) => {
      onApproveRecord(r.id, officer);
    });

    // If auto-sync enabled, write them to sheet in batch
    if (autoSync && currentSheet) {
      setIsSyncingApproved(true);
      try {
        const token = await getAccessToken();
        if (token) {
          const approvedBatch: CheckInRecord[] = pendingRecords.map((r) => ({
            ...r,
            status: 'approved',
            reviewedBy: officer,
            reviewedAt: nowStr,
          }));
          await appendRecordsToSheet(token, currentSheet.id, approvedBatch);
        }
      } catch (err) {
        console.error('Batch sync to Google Sheets failed:', err);
      } finally {
        setIsSyncingApproved(false);
      }
    }
  };

  // Rejection submit
  const handleConfirmReject = () => {
    if (!rejectingRecord) return;
    onRejectRecord(rejectingRecord.id, activeOfficer, rejectReason);
    setRejectingRecord(null);
  };

  // Member Add Submit
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberName.trim();
    if (!cleanName) {
      alert('請輸入團員姓名');
      return;
    }
    if (members.some((m) => m.name === cleanName)) {
      alert('該團員姓名已存在名單中！');
      return;
    }
    const colors = ['#70C1B3', '#F4A261', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#06B6D4'];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];
    onAddMember({
      name: cleanName,
      identity: newMemberIdentity,
      avatarBg: randomBg,
    });
    setNewMemberName('');
    setIsAddModalOpen(false);
  };

  // Confirm Delete Member
  const handleConfirmDeleteMember = () => {
    if (!deletingMember) return;
    onDeleteMember(deletingMember);
    setDeletingMember(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-md text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#70C1B3]/20 text-[#70C1B3] flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3437]">管理員幹部後台</h2>
            <p className="text-xs text-stone-500 mt-1">
              專供審核小組進行雙軌打卡審核、名單管理與出席報表匯出。
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#2C3437] mb-1">
                請輸入管理員密碼
              </label>
              <input
                type="password"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
              />
              {authError && (
                <p className="text-xs text-rose-500 mt-1.5 font-medium">{authError}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                解鎖進入管理後台
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const filteredMemberList = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.identity.includes(memberSearch)
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Officer Selector */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#70C1B3]/20 text-[#70C1B3]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#2C3437]">
              <EditableText
                fieldKey="admin_panel_title"
                defaultText="管理員審核中心 ＆ 團員名單後台"
                className="text-[#2C3437]"
              />
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            <EditableText
              fieldKey="admin_panel_subtitle"
              defaultText="審核雙軌截圖、管理團員名單、一鍵匯出全團出席報表。"
              className="text-stone-500"
            />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Officer Toggle */}
          <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-stone-500 font-medium">當前審核幹部：</span>
            <select
              value={activeOfficer}
              onChange={(e) => setActiveOfficer(e.target.value)}
              className="bg-transparent font-bold text-[#2C3437] focus:outline-hidden cursor-pointer"
            >
              <option value="周汶蔚">周汶蔚</option>
              <option value="徐信銓">徐信銓</option>
              <option value="審核小組">審核小組</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#2C3437] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#70C1B3]" />
            <span>{getText('btn_admin_export_csv', '匯出 CSV 出席報表')}</span>
          </button>

          {/* Google Sheets Sync */}
          <button
            type="button"
            onClick={() => setIsSheetsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{getText('btn_admin_sheets_sync', 'Google 試算表同步')}</span>
            {currentSheet && (
              <span className="w-2 h-2 rounded-full bg-emerald-200" title={`已綁定：${currentSheet.title}`}></span>
            )}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('確定要重置所有打卡、團員名單與許願資料回預設值嗎？')) {
                onResetData();
              }
            }}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
            title="重置回預設範例資料"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={() => onAuthenticate(false)}
            className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors"
            title="登出管理員"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setAdminTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'reviews'
              ? 'bg-[#70C1B3] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          打卡截圖審核
          {pendingRecords.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${adminTab === 'reviews' ? 'bg-white text-[#70C1B3]' : 'bg-amber-500 text-white'}`}>
              {pendingRecords.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'members'
              ? 'bg-[#70C1B3] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          團員名單管理
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${adminTab === 'members' ? 'bg-white text-[#70C1B3]' : 'bg-stone-200 text-stone-700'}`}>
            {members.length} 人
          </span>
        </button>

        <button
          onClick={() => setAdminTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'activities'
              ? 'bg-[#70C1B3] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          活動紀錄
        </button>

        <button
          onClick={() => setAdminTab('ui_texts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'ui_texts'
              ? 'bg-[#70C1B3] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Type className="w-4 h-4 text-amber-500" />
          全站顯示文字管理
        </button>
      </div>

      {adminTab === 'reviews' && (
        <>
          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>待審核紀錄</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {pendingRecords.length} <span className="text-xs font-normal text-stone-400">筆</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">需幹部儘速複核</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>已驗證通過</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {approvedRecords.length} <span className="text-xs font-normal text-stone-400">筆</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">已計入榮譽排行榜</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>已退回補件</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {rejectedRecords.length} <span className="text-xs font-normal text-stone-400">筆</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">待團員補傳截圖</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>總累積打卡</span>
                <Activity className="w-4 h-4 text-[#70C1B3]" />
              </div>
              <div className="text-2xl font-black text-[#2C3437] mt-1">
                {records.length} <span className="text-xs font-normal text-stone-400">筆</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">全體團員運動熱力</div>
            </div>
          </div>

          {/* Review Queue & Records Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2C3437]">打卡審核清單</h3>
                <span className="text-xs text-stone-400">（共 {filteredRecords.length} 筆）</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter */}
                <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'all' ? 'bg-white shadow-2xs text-[#2C3437] font-bold' : 'text-stone-500'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer ${
                      filterStatus === 'pending' ? 'bg-white shadow-2xs text-amber-700 font-bold' : 'text-stone-500'
                    }`}
                  >
                    待審核
                    {pendingRecords.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setFilterStatus('approved')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'approved' ? 'bg-white shadow-2xs text-emerald-700 font-bold' : 'text-stone-500'
                    }`}
                  >
                    已通過
                  </button>
                  <button
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'rejected' ? 'bg-white shadow-2xs text-rose-700 font-bold' : 'text-stone-500'
                    }`}
                  >
                    已退回
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋團員姓名或項目..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 w-48"
                  />
                </div>

                {/* Batch Approve All Pending Button */}
                {pendingRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchApproveAll}
                    disabled={isSyncingApproved}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-102"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>一鍵全部通過 ({pendingRecords.length} 筆)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 font-bold border-b border-stone-200">
                    <th className="py-3 px-4">團員</th>
                    <th className="py-3 px-3">日期時間</th>
                    <th className="py-3 px-3">項目與數據</th>
                    <th className="py-3 px-3">雙軌截圖證明</th>
                    <th className="py-3 px-3">心得筆記</th>
                    <th className="py-3 px-3">狀態</th>
                    <th className="py-3 px-4 text-right">審核操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        查無符合條件的打卡紀錄
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-stone-50/80 transition-colors ${
                          r.status === 'pending' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Member */}
                        <td className="py-3 px-4 font-bold text-[#2C3437]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#70C1B3]/20 text-[#70C1B3] flex items-center justify-center font-bold text-xs">
                              {r.memberName.charAt(0)}
                            </div>
                            <div>
                              <div>{r.memberName}</div>
                              <span className="text-[10px] text-stone-400 font-normal">{r.identity}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-3 text-stone-600">
                          <div className="font-medium">{r.date}</div>
                          <div className="text-[10px] text-stone-400">{r.time}</div>
                        </td>

                        {/* Workout Stats */}
                        <td className="py-3 px-3 text-stone-700">
                          <div className="font-bold text-[#2C3437]">{r.workoutType}</div>
                          <div className="text-[11px] text-stone-500">
                            {r.durationMinutes} 分鐘 • {r.distanceKm} km • {r.steps} 步
                          </div>
                        </td>

                        {/* Dual Proof Thumbnails */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {/* Line Proof */}
                            <button
                              type="button"
                              onClick={() => onOpenProofModal(r)}
                              className="w-10 h-8 rounded border border-stone-300 overflow-hidden bg-stone-900 shrink-0 hover:scale-105 transition-transform cursor-pointer"
                              title="檢視視訊開鏡證明"
                            >
                              {r.lineProofUrl ? (
                                <img
                                  src={r.lineProofUrl}
                                  alt="視訊"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                  無
                                </div>
                              )}
                            </button>

                            {/* Sports App Proof */}
                            <button
                              type="button"
                              onClick={() => onOpenProofModal(r)}
                              className="w-10 h-8 rounded border border-stone-300 overflow-hidden bg-stone-900 shrink-0 hover:scale-105 transition-transform cursor-pointer"
                              title="檢視手錶數據證明"
                            >
                              {r.sportProofUrl ? (
                                <img
                                  src={r.sportProofUrl}
                                  alt="手錶數據"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                  無
                                </div>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenProofModal(r)}
                              className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Note */}
                        <td className="py-3 px-3 max-w-[180px]">
                          <p className="text-stone-600 truncate" title={r.note}>
                            {r.note || '—'}
                          </p>
                          {r.adminNote && (
                            <p className="text-[10px] text-rose-500 truncate" title={r.adminNote}>
                              幹部註記：{r.adminNote}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {r.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> 已通過
                            </span>
                          )}
                          {r.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                              <Clock className="w-3 h-3" /> 待審核
                            </span>
                          )}
                          {r.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                              <XCircle className="w-3 h-3" /> 已退回
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status !== 'approved' && (
                              <button
                                onClick={() => handleApproveRecordWithSync(r.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                                title="通過此筆打卡並同步至 Google 試算表"
                              >
                                通過
                              </button>
                            )}

                            {r.status !== 'rejected' && (
                              <button
                                onClick={() => {
                                  setRejectingRecord(r);
                                  setRejectReason('截圖資料不完整或視訊未見本人，請重新補件');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="退回補件"
                              >
                                退回
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {adminTab === 'members' && (
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[#2C3437] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#70C1B3]" /> 團員名單管理
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                可在此刪除預設範例名單或不需留存的姓名，亦可隨時手動新增新青年團員。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋團員姓名..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 w-44"
                />
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#70C1B3] hover:bg-[#5db2a3] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> 新增團員姓名
              </button>
            </div>
          </div>

          {/* Members List Table */}
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-400 font-bold border-b border-stone-200">
                  <th className="py-3 px-4">姓名</th>
                  <th className="py-3 px-3">身分類別</th>
                  <th className="py-3 px-3">有效打卡數</th>
                  <th className="py-3 px-3">累積里程</th>
                  <th className="py-3 px-3">已登記許願</th>
                  <th className="py-3 px-4 text-right">刪除管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMemberList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      查無團員名單
                    </td>
                  </tr>
                ) : (
                  filteredMemberList.map((m) => {
                    const stats = memberStats.find((s) => s.memberName === m.name);
                    const checkinCount = stats?.totalValidCheckIns || 0;
                    const distance = stats?.totalDistanceKm?.toFixed(1) || '0.0';
                    const wish = stats?.wish?.wishName;

                    return (
                      <tr key={m.name} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#2C3437]">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-2xs shrink-0"
                              style={{ backgroundColor: m.avatarBg || '#70C1B3' }}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <span className="text-sm text-[#2C3437]">{m.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] text-stone-600 font-medium">
                            {m.identity}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-semibold text-[#2C3437]">
                          {checkinCount} 次
                        </td>

                        <td className="py-3 px-3 font-semibold text-[#F4A261]">
                          {distance} km
                        </td>

                        <td className="py-3 px-3 max-w-[200px] truncate text-stone-600" title={wish}>
                          {wish ? `🎁 ${wish}` : <span className="text-stone-300">尚未登記</span>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeletingMember(m.name)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`刪除團員「${m.name}」`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'activities' && (
        <ActivityLogsPanel activeOfficer={activeOfficer} />
      )}

      {adminTab === 'ui_texts' && (
        <AdminUiTextEditor />
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <UserX className="w-5 h-5" />
              <span>確定要刪除「{deletingMember}」嗎？</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              刪除後，「{deletingMember}」將自所有打卡下拉選單、許願池名單及個人歷程中完全移除，同時清除相關打卡紀錄。
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeleteMember}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                確定刪除團員
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#2C3437] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#70C1B3]" /> 新增青年團員
            </h3>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2C3437] mb-1">
                  團員姓名 / 暱稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="請輸入姓名"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C3437] mb-1">身分類別</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['在職青年', '在學學生'] as IdentityType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewMemberIdentity(type)}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        newMemberIdentity === type
                          ? 'border-[#70C1B3] bg-[#70C1B3]/10 text-[#70C1B3]'
                          : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#70C1B3] text-white text-xs font-bold hover:bg-[#5db2a3] transition-colors shadow-xs cursor-pointer"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>退回 {rejectingRecord.memberName} 的打卡紀錄</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              請填寫退回原因或補件要求，團員將能於個人紀錄頁面查看此說明：
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-200 text-xs text-[#2C3437] focus:outline-hidden focus:ring-2 focus:ring-rose-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingRecord(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                確定退回補件
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Modal */}
      <AdminGoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        records={records}
        onAutoSyncChanged={(enabled, sheet) => {
          setAutoSync(enabled);
          setCurrentSheet(sheet);
        }}
      />
    </div>
  );
};
