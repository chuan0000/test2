import { CheckInRecord, MemberProfile, MemberStats, WishItem } from '../types';
import { INITIAL_CHECKINS, INITIAL_MEMBERS, INITIAL_WISHES } from '../mockData';

const CHECKINS_KEY = 'blia_hsinchu_youth_2027_checkins';
const WISHES_KEY = 'blia_hsinchu_youth_2027_wishes';
const MEMBERS_KEY = 'blia_hsinchu_youth_2027_members';
const ADMIN_AUTH_KEY = 'blia_hsinchu_youth_2027_admin_auth';

export function getStoredMembers(): MemberProfile[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load members from localStorage:', err);
    return [];
  }
}

export function saveStoredMembers(members: MemberProfile[]): void {
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Failed to save members to localStorage:', err);
  }
}

export function getStoredCheckIns(): CheckInRecord[] {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load checkins from localStorage:', err);
    return [];
  }
}

export function saveStoredCheckIns(records: CheckInRecord[]): void {
  try {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save checkins to localStorage:', err);
  }
}

export function getStoredWishes(): WishItem[] {
  try {
    const raw = localStorage.getItem(WISHES_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load wishes from localStorage:', err);
    return [];
  }
}

export function saveStoredWishes(wishes: WishItem[]): void {
  try {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
  } catch (err) {
    console.error('Failed to save wishes to localStorage:', err);
  }
}

export function resetToInitialData(): void {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(INITIAL_CHECKINS));
  localStorage.setItem(WISHES_KEY, JSON.stringify(INITIAL_WISHES));
}

export function clearStoredHealthData(): void {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify([]));
  localStorage.setItem(CHECKINS_KEY, JSON.stringify([]));
  localStorage.setItem(WISHES_KEY, JSON.stringify([]));
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function setAdminAuthenticated(auth: boolean): void {
  if (auth) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blia_admin_auth_changed', { detail: { auth } }));
  }
}

/**
 * Calculates aggregated member statistics and rankings based on approved check-in records
 */
export function calculateMemberStats(
  records: CheckInRecord[], 
  wishes: WishItem[], 
  membersList?: MemberProfile[]
): MemberStats[] {
  const memberMap = new Map<string, MemberStats>();
  const activeMembers = membersList && membersList.length > 0 ? membersList : getStoredMembers();

  // Initialize with all known members
  activeMembers.forEach((m) => {
    memberMap.set(m.name, {
      memberName: m.name,
      identity: m.identity as '在職青年' | '在學學生',
      avatarBg: m.avatarBg || '#70C1B3',
      totalValidCheckIns: 0,
      totalPendingCheckIns: 0,
      totalDurationMinutes: 0,
      totalDistanceKm: 0,
      totalSteps: 0,
      streakDays: 0,
    });
  });

  // Also include any dynamic members who checked in
  records.forEach((r) => {
    if (!memberMap.has(r.memberName)) {
      memberMap.set(r.memberName, {
        memberName: r.memberName,
        identity: r.identity,
        avatarBg: '#70C1B3',
        totalValidCheckIns: 0,
        totalPendingCheckIns: 0,
        totalDurationMinutes: 0,
        totalDistanceKm: 0,
        totalSteps: 0,
        streakDays: 0,
      });
    }
  });

  // Group approved and pending
  records.forEach((record) => {
    const member = memberMap.get(record.memberName);
    if (!member) return;

    if (record.status === 'approved') {
      member.totalValidCheckIns += 1;
      member.totalDurationMinutes += record.durationMinutes;
      member.totalDistanceKm += record.distanceKm;
      member.totalSteps += record.steps;

      if (!member.lastCheckInDate || record.date > member.lastCheckInDate) {
        member.lastCheckInDate = record.date;
      }
    } else if (record.status === 'pending') {
      member.totalPendingCheckIns += 1;
    }
  });

  // Attach wishes
  const wishMap = new Map<string, WishItem>();
  wishes.forEach((w) => wishMap.set(w.memberName, w));

  const statsList = Array.from(memberMap.values()).map((member) => {
    member.wish = wishMap.get(member.memberName);
    // Approximate streak based on check-ins count
    member.streakDays = Math.min(member.totalValidCheckIns, Math.max(1, member.totalValidCheckIns));
    return member;
  });

  // Sort primarily by total valid check-ins descending, then by total distance descending
  statsList.sort((a, b) => {
    if (b.totalValidCheckIns !== a.totalValidCheckIns) {
      return b.totalValidCheckIns - a.totalValidCheckIns;
    }
    return b.totalDistanceKm - a.totalDistanceKm;
  });

  // Assign ranks
  statsList.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return statsList;
}

/**
 * Exports all check-in records and statistics to an Excel-friendly CSV with UTF-8 BOM
 */
export function exportCheckInsToCSV(records: CheckInRecord[], memberStats: MemberStats[]): void {
  const BOM = '\uFEFF';
  let csvContent = BOM;

  // Header 1: Summary Sheet
  csvContent += '【國際佛光會新竹青年分團 2027 青年健走跑步健康打卡計畫 統計報表】\r\n';
  csvContent += `匯出時間：,${new Date().toLocaleString('zh-TW')}\r\n`;
  csvContent += `活動期程：,2027年1月～10月 (每週2天夜間 20:30-21:30)\r\n\r\n`;

  csvContent += '【團員榮譽總榜】\r\n';
  csvContent += '名次,姓名,身分類別,有效打卡次數,待審核次數,總運動時長(分鐘),總累積里程(KM),總步數,年度目標達成率(以60次為基準),許願清單禮物\r\n';

  memberStats.forEach((stat) => {
    const rate = Math.min(100, Math.round((stat.totalValidCheckIns / 60) * 100));
    const wishName = stat.wish ? `"${stat.wish.wishName.replace(/"/g, '""')}"` : '尚未登記';
    csvContent += `${stat.rank},"${stat.memberName}","${stat.identity}",${stat.totalValidCheckIns},${stat.totalPendingCheckIns},${stat.totalDurationMinutes},${stat.totalDistanceKm.toFixed(2)},${stat.totalSteps},${rate}%,${wishName}\r\n`;
  });

  csvContent += '\r\n\r\n【全部打卡詳細清單】\r\n';
  csvContent += '紀錄ID,姓名,身分類別,運動日期,時間,運動型態,時長(分鐘),里程(KM),步數,消耗熱量(kcal),審核狀態,審核人,審核時間,心得筆記\r\n';

  records.forEach((r) => {
    const statusText = r.status === 'approved' ? '已通過' : r.status === 'pending' ? '待審核' : '退回補件';
    const noteClean = r.note ? `"${r.note.replace(/"/g, '""')}"` : '""';
    csvContent += `"${r.id}","${r.memberName}","${r.identity}","${r.date}","${r.time}","${r.workoutType}",${r.durationMinutes},${r.distanceKm},${r.steps},${r.calories},"${statusText}","${r.reviewedBy || ''}","${r.reviewedAt || ''}",${noteClean}\r\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `新竹青年分團2027健走夜跑打卡統計報表_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
