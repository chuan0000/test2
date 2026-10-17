import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  X, 
  Search, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Sparkles,
  AlertCircle,
  LogOut,
  ImageIcon
} from 'lucide-react';
import { 
  googleSignIn, 
  getAccessToken, 
  logoutGoogle, 
  initAuth 
} from '../services/googleAuth';
import { 
  listDrivePhotos, 
  fetchDriveImageAsBase64, 
  openGooglePicker, 
  DriveFileItem 
} from '../services/googleDrive';
import { User } from 'firebase/auth';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosImported: (photos: Array<{ url: string; caption: string }>) => void;
  defaultActivityTitle?: string;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onPhotosImported,
  defaultActivityTitle = '青年健康運動活動',
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [drivePhotos, setDrivePhotos] = useState<DriveFileItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        loadPhotos(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When modal opens, if we already have a token, load photos
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((token) => {
        if (token) {
          setAccessToken(token);
          loadPhotos(token);
        }
      });
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await loadPhotos(res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google 登入或授權失敗，請再試一次');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setAccessToken(null);
    setDrivePhotos([]);
    setSelectedFileIds([]);
  };

  const loadPhotos = async (token: string) => {
    setIsLoadingPhotos(true);
    setErrorMsg(null);
    try {
      const files = await listDrivePhotos(token);
      setDrivePhotos(files);
    } catch (err: any) {
      setErrorMsg(err.message || '無法自 Google 雲端硬碟讀取相片列表');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const toggleSelectPhoto = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === filteredPhotos.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleLaunchNativePicker = async () => {
    if (!accessToken) {
      await handleSignIn();
      return;
    }

    try {
      await openGooglePicker({
        accessToken,
        onPicked: async (file) => {
          setIsImporting(true);
          try {
            const base64 = await fetchDriveImageAsBase64(accessToken, file.id);
            onPhotosImported([
              {
                url: base64,
                caption: `【活動現場實況】：${file.name.replace(/\.[^/.]+$/, '')}。參與青年齊聚投入，落實青年健康促進理念。`,
              },
            ]);
            onClose();
          } catch (err: any) {
            setErrorMsg(err.message || '下載雲端照片失敗');
          } finally {
            setIsImporting(false);
          }
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || '無法開啟 Google 原生 Picker 視窗，建議使用下方站內照片瀏覽器');
    }
  };

  const handleImportSelected = async () => {
    if (selectedFileIds.length === 0 || !accessToken) return;

    setIsImporting(true);
    setErrorMsg(null);
    try {
      const imported: Array<{ url: string; caption: string }> = [];

      for (const fileId of selectedFileIds) {
        const fileItem = drivePhotos.find((p) => p.id === fileId);
        const base64 = await fetchDriveImageAsBase64(
          accessToken,
          fileId,
          fileItem?.mimeType || 'image/jpeg'
        );

        const cleanName = fileItem ? fileItem.name.replace(/\.[^/.]+$/, '') : '活動照片';
        imported.push({
          url: base64,
          caption: `【活動現場紀錄】：${defaultActivityTitle}現場（${cleanName}）。團員精神抖擻，發揮團隊合作與健康運動精神。`,
        });
      }

      onPhotosImported(imported);
      setSelectedFileIds([]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '匯入照片時發生錯誤');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const filteredPhotos = drivePhotos.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Google 雲端硬碟活動相片選取
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Official Google Workspace
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                直接選取 Google 雲端相片並自動下載嵌入為標準公務活動佐證
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Auth Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {currentUser && accessToken ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-10 h-10 rounded-full border border-blue-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {currentUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Google 帳號已連結'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>請先登入 Google 帳號以讀取您的雲端硬碟活動相片</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {currentUser && accessToken ? (
                <>
                  <button
                    type="button"
                    onClick={() => loadPhotos(accessToken)}
                    disabled={isLoadingPhotos}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPhotos ? 'animate-spin' : ''}`} />
                    <span>重新整理</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchNativePicker}
                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>開啟 Google 原生選擇視窗</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="登出 Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>使用 Google 帳號授權登入</span>
                </button>
              )}
            </div>
          </div>

          {/* Photo Browser Area */}
          {currentUser && accessToken && (
            <div className="space-y-3.5">
              {/* Filter and select-all bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋相片檔名..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    共找到 <strong>{filteredPhotos.length}</strong> 張相片，已勾選{' '}
                    <strong className="text-blue-600">{selectedFileIds.length}</strong> 張
                  </span>

                  {filteredPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                    >
                      {selectedFileIds.length === filteredPhotos.length ? '取消全選' : '全選'}
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Grid */}
              {isLoadingPhotos ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">正在安全連線至您的 Google 雲端硬碟讀取相片...</p>
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">未找到相片檔案</div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    您的雲端硬碟中目前沒有符合條件的圖片，您也可以點擊上方「開啟 Google 原生選擇視窗」瀏覽特定資料夾。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                  {filteredPhotos.map((photo) => {
                    const isSelected = selectedFileIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => toggleSelectPhoto(photo.id)}
                        className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-100 shadow-md scale-[0.98]'
                            : 'border-slate-200 hover:border-blue-400 bg-slate-100'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-slate-900 relative">
                          <img
                            src={photo.thumbnailLink ? (photo.thumbnailLink.replace(/=s\d+/, '=s400') || photo.thumbnailLink) : 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80'}
                            alt={photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80';
                            }}
                          />

                          {/* Selected Checkmark Badge */}
                          <div
                            className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-black/40 text-transparent border border-white/60 group-hover:border-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="p-2.5 bg-white">
                          <div className="text-xs font-bold text-slate-800 truncate" title={photo.name}>
                            {photo.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {photo.createdTime ? new Date(photo.createdTime).toLocaleDateString('zh-TW') : '雲端檔案'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedFileIds.length > 0 ? (
              <span>
                已選取 <strong className="text-blue-600">{selectedFileIds.length}</strong> 張照片，將自動轉換並嵌入本文件
              </span>
            ) : (
              <span>點選照片以加入目前活動佐證紀錄</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              disabled={selectedFileIds.length === 0 || isImporting}
              onClick={handleImportSelected}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>下載處理中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>匯入所選 {selectedFileIds.length} 張相片</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
