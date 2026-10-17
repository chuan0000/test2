/**
 * Generates aesthetic mock SVG data URIs for LINE Video Meeting proofs and Sports watch proofs
 */

export function generateLineMeetingProof(memberName: string, dateStr: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <rect width="640" height="400" fill="#1E1E24"/>
    
    <!-- Top Bar -->
    <rect width="640" height="42" fill="#111116"/>
    <circle cx="24" cy="21" r="5" fill="#22C55E"/>
    <text x="36" y="25" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">新竹青年分團 2027 夜跑健走線上團練房 (${dateStr} 20:30)</text>
    <rect x="540" y="11" width="76" height="20" rx="10" fill="#22C55E" fill-opacity="0.2"/>
    <text x="554" y="25" fill="#4ADE80" font-family="sans-serif" font-size="11" font-weight="bold">🔴 通話中 18人</text>
    
    <!-- Video Grid (4 tiles) -->
    <!-- Tile 1: Current User (Cam On) -->
    <g transform="translate(20, 56)">
      <rect width="285" height="155" rx="8" fill="#2A2D34" stroke="#70C1B3" stroke-width="2"/>
      <circle cx="142" cy="70" r="32" fill="#70C1B3" fill-opacity="0.25"/>
      <path d="M142 52a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm0 40c-18 0-32 10-32 20h64c0-10-14-20-32-20z" fill="#70C1B3"/>
      <rect x="8" y="125" width="110" height="22" rx="4" fill="#000000" fill-opacity="0.6"/>
      <text x="16" y="140" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="600">${memberName} (鏡頭開啟 🏃)</text>
      <circle cx="265" cy="20" r="8" fill="#22C55E"/>
      <path d="M261 20l3 3 5-5" stroke="#FFFFFF" stroke-width="1.5" fill="none"/>
    </g>

    <!-- Tile 2: 徐信銓 -->
    <g transform="translate(335, 56)">
      <rect width="285" height="155" rx="8" fill="#2A2D34"/>
      <circle cx="142" cy="70" r="32" fill="#F4A261" fill-opacity="0.25"/>
      <path d="M142 52a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm0 40c-18 0-32 10-32 20h64c0-10-14-20-32-20z" fill="#F4A261"/>
      <rect x="8" y="125" width="110" height="22" rx="4" fill="#000000" fill-opacity="0.6"/>
      <text x="16" y="140" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="600">徐信銓 (連線中 🏃‍♂️)</text>
    </g>

    <!-- Tile 3: 周汶蔚 -->
    <g transform="translate(20, 225)">
      <rect width="285" height="155" rx="8" fill="#2A2D34"/>
      <circle cx="142" cy="70" r="32" fill="#3B82F6" fill-opacity="0.25"/>
      <path d="M142 52a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm0 40c-18 0-32 10-32 20h64c0-10-14-20-32-20z" fill="#3B82F6"/>
      <rect x="8" y="125" width="110" height="22" rx="4" fill="#000000" fill-opacity="0.6"/>
      <text x="16" y="140" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="600">周汶蔚 (連線中 🏃‍♀️)</text>
    </g>

    <!-- Tile 4: Dicky -->
    <g transform="translate(335, 225)">
      <rect width="285" height="155" rx="8" fill="#2A2D34"/>
      <circle cx="142" cy="70" r="32" fill="#A855F7" fill-opacity="0.25"/>
      <path d="M142 52a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm0 40c-18 0-32 10-32 20h64c0-10-14-20-32-20z" fill="#A855F7"/>
      <rect x="8" y="125" width="110" height="22" rx="4" fill="#000000" fill-opacity="0.6"/>
      <text x="16" y="140" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="600">Dicky (連線中 🚶)</text>
    </g>

    <!-- Bottom Controls -->
    <rect y="388" width="640" height="12" fill="#111116"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateSportAppProof(type: string, duration: number, distanceKm: number, steps: number, calories: number): string {
  const avgPace = distanceKm > 0 ? (duration / distanceKm).toFixed(2) : '0.00';
  const paceMinutes = Math.floor(parseFloat(avgPace));
  const paceSeconds = Math.round((parseFloat(avgPace) - paceMinutes) * 60);
  const formattedPace = `${paceMinutes}'${paceSeconds < 10 ? '0' : ''}${paceSeconds}"`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181B"/>
        <stop offset="100%" stop-color="#09090B"/>
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#70C1B3"/>
        <stop offset="100%" stop-color="#F4A261"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#grad)"/>
    
    <!-- Top Info -->
    <text x="32" y="44" fill="#A1A1AA" font-family="sans-serif" font-size="13" font-weight="600">NIKE RUN CLUB / STRAVA TRACKER</text>
    <rect x="470" y="24" width="138" height="28" rx="14" fill="#27272A"/>
    <text x="486" y="43" fill="#70C1B3" font-family="sans-serif" font-size="12" font-weight="bold">GPS 訊號已鎖定 ✔</text>

    <!-- Workout Type Tag -->
    <rect x="32" y="60" width="100" height="26" rx="6" fill="#70C1B3" fill-opacity="0.2"/>
    <text x="44" y="77" fill="#70C1B3" font-family="sans-serif" font-size="13" font-weight="bold">${type}</text>
    <text x="142" y="78" fill="#E4E4E7" font-family="sans-serif" font-size="14" font-weight="600">20:30 - 21:30 夜間團練</text>

    <!-- Main Metrics Grid -->
    <!-- Distance -->
    <g transform="translate(32, 105)">
      <text x="0" y="24" fill="#71717A" font-family="sans-serif" font-size="13" font-weight="600">總距離 (KM)</text>
      <text x="0" y="80" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="800">${distanceKm.toFixed(2)}</text>
    </g>

    <!-- Duration -->
    <g transform="translate(320, 105)">
      <text x="0" y="24" fill="#71717A" font-family="sans-serif" font-size="13" font-weight="600">運動時長 (MINS)</text>
      <text x="0" y="80" fill="#70C1B3" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="800">${duration} <tspan font-size="24" fill="#A1A1AA">分</tspan></text>
    </g>

    <!-- Divider -->
    <line x1="32" y1="215" x2="608" y2="215" stroke="#27272A" stroke-width="1.5"/>

    <!-- Sub Metrics: Steps, Pace, Calories -->
    <g transform="translate(32, 235)">
      <!-- Steps -->
      <g transform="translate(0, 0)">
        <text x="0" y="20" fill="#71717A" font-family="sans-serif" font-size="12" font-weight="600">累積步數</text>
        <text x="0" y="55" fill="#FFFFFF" font-family="sans-serif" font-size="26" font-weight="700">${steps.toLocaleString()} <tspan font-size="14" fill="#71717A">步</tspan></text>
      </g>
      <!-- Avg Pace -->
      <g transform="translate(195, 0)">
        <text x="0" y="20" fill="#71717A" font-family="sans-serif" font-size="12" font-weight="600">平均配速</text>
        <text x="0" y="55" fill="#F4A261" font-family="sans-serif" font-size="26" font-weight="700">${formattedPace} <tspan font-size="14" fill="#71717A">/km</tspan></text>
      </g>
      <!-- Calories -->
      <g transform="translate(390, 0)">
        <text x="0" y="20" fill="#71717A" font-family="sans-serif" font-size="12" font-weight="600">消耗熱量</text>
        <text x="0" y="55" fill="#FFFFFF" font-family="sans-serif" font-size="26" font-weight="700">${calories} <tspan font-size="14" fill="#71717A">kcal</tspan></text>
      </g>
    </g>

    <!-- Progress bar at bottom -->
    <rect x="32" y="325" width="576" height="8" rx="4" fill="#27272A"/>
    <rect x="32" y="325" width="460" height="8" rx="4" fill="url(#accentGrad)"/>
    <text x="32" y="358" fill="#71717A" font-family="sans-serif" font-size="12">心率區間：有氧耐力區 (平均 138 bpm)</text>
    <text x="460" y="358" fill="#70C1B3" font-family="sans-serif" font-size="12" font-weight="600">目標達成率 100% ★</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
