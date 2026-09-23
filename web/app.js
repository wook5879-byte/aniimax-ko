// Aniimax Web Application

import {
    FACILITIES, FACILITY_CATEGORIES, FACILITY_CATEGORY_BY_NAME,
    MAX_HOME_LEVEL, COUNTS_CONFIRMED_UP_TO, ANIIMO_MAX, simpleSetup,
    LEVEL_UP_COSTS, LEVEL_UP_CHAINS,
} from './facility-config.js';

let wasmReady = false;

let worker = null;
let nextRequestId = 0;
const pendingWorkerRequests = new Map();

const WORKER_URL = `./worker.js?load=${Date.now()}`;

function initWorker() {
    worker = new Worker(WORKER_URL, { type: 'module' });
    worker.onmessage = (event) => {
        const { id, type, ok, result, error, count } = event.data;
        const pending = pendingWorkerRequests.get(id);
        if (!pending) return;
        if (type === 'progress') {
            if (pending.onProgress) pending.onProgress(count);
            return;
        }
        pendingWorkerRequests.delete(id);
        if (ok) {
            pending.resolve(result);
        } else {
            pending.reject(new Error(error));
        }
    };
    worker.onerror = (event) => {
        console.error('Worker 오류:', event.message || event);
    };
}

function restartWorker() {
    worker.terminate();
    pendingWorkerRequests.forEach(pending => pending.reject(new Error('새로운 연산 요청에 의해 취소되었습니다.')));
    pendingWorkerRequests.clear();
    initWorker();
}

function callWorker(type, payload, onProgress) {
    return new Promise((resolve, reject) => {
        const id = ++nextRequestId;
        pendingWorkerRequests.set(id, { resolve, reject, onProgress });
        worker.postMessage({ id, type, payload });
    });
}

const EARLY_PHASE_TRIALS = 15;
const EARLY_PHASE_PERCENT = 25;
const LATE_PHASE_HALFWAY_TRIALS = 120;
function trialCountToPercent(count) {
    if (count <= EARLY_PHASE_TRIALS) {
        return Math.round((EARLY_PHASE_PERCENT * count) / EARLY_PHASE_TRIALS);
    }
    const trialsIntoLatePhase = count - EARLY_PHASE_TRIALS;
    const latePhasePercentRange = 96 - EARLY_PHASE_PERCENT;
    const latePhaseFraction = trialsIntoLatePhase / (trialsIntoLatePhase + LATE_PHASE_HALFWAY_TRIALS);
    return Math.min(96, Math.round(EARLY_PHASE_PERCENT + latePhasePercentRange * latePhaseFraction));
}

let lastPlan = null;
let plansBySetup = {};
let planRunId = 0;

function selectedAniimoSetup() {
    return document.getElementById('aniimo-minimum').checked ? 'minimum' : 'best';
}

function showSelectedPlan(scroll) {
    const setup = selectedAniimoSetup();
    const plan = plansBySetup[setup];
    const pending = document.getElementById('aniimo-pending');
    if (!plan) {
        pending.style.display = 'block';
        return;
    }
    pending.style.display = 'none';
    lastPlan = plan;
    displayPlan(plan, scroll);
    if (plan.success) runTimeToGoal();
}

let lastGoalResult = null;

const CURRENCY_LABELS = {
    coins: '코인',
};

// 시간 표시 변환 라벨 (한국어)
const RATE_UNIT_SECONDS = {
    second: { multiplier: 1, suffix: '/초' },
    hour: { multiplier: 3600, suffix: '/시간' },
    day: { multiplier: 86400, suffix: '/일' },
};

let facilityTiers = {};

function defaultFacilityTiers() {
    const tiers = {};
    FACILITIES.forEach(f => {
        tiers[f.name] = [{ count: f.defaultCount, level: 1 }];
    });
    return tiers;
}

// 영문 카테고리/시설 이름을 한국어로 표시하기 위한 번역 맵
const CATEGORY_NAMES_KO = {
    'Materials': '기본 자원',
    'Environment': '환경 시설',
    'Aniimo Materials': '애니이모 전용 자원',
    'Materials Processing': '재료 가공 시설'
};

const FACILITY_NAMES_KO = {
    'Farmland': '농지',
    'Woodland': '림야 (수목원)',
    'Mine': '광산',
    'Well': '우물',
    'Tidewhisper Sandcastle': '타이드위스퍼 모래성',
    'Dewy House': '듀이 하우스',
    'Nimbus Bed': '님버스 침대',
    'Starfall Hammock': '별빛 해먹',
    'Floral Windmill': '꽃바람개비',
    'Heat Furnace': '열로',
    'Cooling Unit': '냉각 장치',
    'Sunlamp': '태양등',
    'Carousel Mill': '방아깨비 방앗간',
    'Crafting Table': '제작대',
    'Claw Game Cooker': '인형뽑기 조리기',
    'Jukebox Dryer': '주크박스 건조기',
    'Simmering Pot': '뭉근히 끓이는 냄비',
    'Phonolfactory Table': '조향대',
    'Bouncy Brew Keg': '바운시 양조통',
    'Blazing Stove': '화염 화로',
    'Pickling Jar': '절임 항아리',
    'Joy Wheel Loom': '조이 휠 베틀',
    'Woodworking Bench': '목공 작업대',
    'Chimney Kiln': '굴뚝 가마'
};

function renderTierRows(name) {
    const f = FACILITIES.find(fac => fac.name === name);
    const container = document.querySelector(`.facility-tiers[data-facility="${name}"]`);
    if (!f || !container) return;
    const tiers = facilityTiers[name];
    const showRemove = tiers.length > 1;
    container.innerHTML = tiers.map((tier, i) => `
        <div class="facility-inputs tier-row" data-tier-index="${i}">
            <div class="input-field">
                <label>수량</label>
                <input type="number" class="tier-count" value="${tier.count}" min="0" max="999">
            </div>
            ${f.hasLevels === false ? '' : `
            <div class="input-field">
                <label>레벨</label>
                <input type="number" class="tier-level" value="${tier.level}" min="1" max="10">
            </div>
            `}
            ${showRemove ? '<button type="button" class="tier-remove-btn" title="이 레벨 삭제">&times;</button>' : ''}
        </div>
    `).join('');
}

function renderFacilityCards() {
    const grid = document.getElementById('facilities-grid');
    grid.innerHTML = FACILITY_CATEGORIES.map(category => {
        const cards = FACILITIES.filter(f => f.category === category).map(f => `
            <div class="facility-card">
                <h4>${FACILITY_NAMES_KO[f.name] || f.name} <span class="info-icon" data-tooltip="${f.tooltip}">?</span></h4>
                <div class="facility-tiers" data-facility="${f.name}"></div>
                ${f.hasLevels === false ? '' : '<button type="button" class="add-tier-btn" data-facility="' + f.name + '">+ 레벨 단계 추가</button>'}
            </div>
        `).join('');
        return `
            <div class="facility-category">
                <h4 class="facility-category-title">${CATEGORY_NAMES_KO[category] || category}</h4>
                <div class="facilities-grid">${cards}</div>
            </div>
        `;
    }).join('');
    FACILITIES.forEach(f => renderTierRows(f.name));
}

function attachFacilityTierHandlers() {
    const grid = document.getElementById('facilities-grid');

    grid.addEventListener('input', (e) => {
        const row = e.target.closest('.tier-row');
        if (!row) return;
        const container = e.target.closest('.facility-tiers');
        const name = container.dataset.facility;
        const idx = parseInt(row.dataset.tierIndex, 10);
        const tier = facilityTiers[name][idx];
        if (e.target.classList.contains('tier-count')) {
            tier.count = numberOrDefault(e.target.value, 0);
        } else if (e.target.classList.contains('tier-level')) {
            tier.level = numberOrDefault(e.target.value, 1);
        }
        saveInputsToStorage();
    });

    grid.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-tier-btn');
        if (addBtn) {
            const name = addBtn.dataset.facility;
            const tiers = facilityTiers[name];
            const nextLevel = Math.min(10, Math.max(...tiers.map(t => t.level)) + 1);
            tiers.push({ count: 1, level: nextLevel });
            renderTierRows(name);
            saveInputsToStorage();
            return;
        }
        const removeBtn = e.target.closest('.tier-remove-btn');
        if (removeBtn) {
            const row = removeBtn.closest('.tier-row');
            const container = removeBtn.closest('.facility-tiers');
            const name = container.dataset.facility;
            const idx = parseInt(row.dataset.tierIndex, 10);
            facilityTiers[name].splice(idx, 1);
            renderTierRows(name);
            saveInputsToStorage();
        }
    });

    grid.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            runFindPlan();
        }
    });
}

const STORAGE_KEY = 'aniimax-config-v1';

function getPersistedFieldIds() {
    return [
        'target-amount', 'current-amount',
        'prioritize-byproducts',
        'strategy-level-up', 'strategy-coins', 'level-up-target',
        'mode-simple', 'mode-advanced', 'home-level',
        'ecological-module-level', 'kitchen-module-level',
        'resource-detector-level', 'crafting-module-level',
        'rate-unit'
    ];
}

function readStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? migrateSavedConfig(JSON.parse(raw)) : null;
    } catch (e) {
        console.warn('localStorage에서 저장된 설정값을 읽을 수 없습니다:', e);
        return null;
    }
}

function migrateSavedConfig(data) {
    if (!data || typeof data !== 'object') return data;
    if (data['mode-simple'] === undefined && data.facilityTiers) {
        data['mode-simple'] = false;
        data['mode-advanced'] = true;
    }
    const tiers = data.facilityTiers;
    if (tiers && tiers['Mine'] === undefined && tiers['Mineral Pile'] !== undefined) {
        tiers['Mine'] = tiers['Mineral Pile'];
    }
    if (data['resource-detector-level'] === undefined && data['mineral-detector-level'] !== undefined) {
        data['resource-detector-level'] = data['mineral-detector-level'];
    }
    return data;
}

function initFacilityTiers(data) {
    const defaults = defaultFacilityTiers();
    const saved = (data && data.facilityTiers) || {};
    facilityTiers = {};
    FACILITIES.forEach(f => {
        const tiers = saved[f.name];
        facilityTiers[f.name] = Array.isArray(tiers) && tiers.length > 0
            ? tiers.map(t => ({
                count: numberOrDefault(t.count, 0),
                level: f.hasLevels === false ? 1 : numberOrDefault(t.level, 1)
            }))
            : defaults[f.name];
    });
}

function saveInputsToStorage() {
    const data = { facilityTiers, levelUpStock };
    getPersistedFieldIds().forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        data[id] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
    });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('localStorage에 설정값을 저장하지 못했습니다:', e);
    }
}

function loadInputsFromStorage(data) {
    if (!data) return;
    if (data.levelUpStock && typeof data.levelUpStock === 'object') levelUpStock = { ...data.levelUpStock };
    getPersistedFieldIds().forEach(id => {
        if (!(id in data)) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = !!data[id];
        } else {
            el.value = data[id];
        }
    });
}

function attachAutoSave() {
    getPersistedFieldIds().forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const eventName = (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(eventName, saveInputsToStorage);
    });
}

function clearSavedInputs() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('저장된 설정을 초기화하지 못했습니다:', e);
    }
    window.location.reload();
}

async function initWasm() {
    try {
        initWorker();
        const version = await callWorker('get_version');
        wasmReady = true;

        document.getElementById('version').textContent = version;

        console.log(`Aniimax v${version} 로드 완료`);
    } catch (error) {
        console.error('WASM 초기화 실패:', error);
        showError('최적화 연산 엔진을 로드하지 못했습니다. 페이지를 새로고침 해주세요.');
    }
}

function isSimpleMode() {
    return document.getElementById('mode-simple').checked;
}

function selectedHomeLevel() {
    return numberOrDefault(document.getElementById('home-level').value, MAX_HOME_LEVEL);
}

function populateHomeLevels() {
    const select = document.getElementById('home-level');
    const options = [];
    for (let level = 1; level <= MAX_HOME_LEVEL; level++) {
        options.push(`<option value="${level}">LV.${level}${level === MAX_HOME_LEVEL ? ' (모든 시설 해금)' : ''}</option>`);
    }
    select.innerHTML = options.join('');
    select.value = String(MAX_HOME_LEVEL);
}

function renderSimpleSummary() {
    const homeLevel = selectedHomeLevel();
    const { facilities, modules } = simpleSetup(homeLevel);
    const chip = (count, name, level) => `
        <div class="chip"><span><span class="chip-count">${count}</span> ${FACILITY_NAMES_KO[name] || name}</span>${level ? `<span class="chip-level">${level}</span>` : ''}</div>`;
    const built = FACILITIES
        .map(f => ({ name: f.name, tier: facilities[f.name][0], hasLevels: f.hasLevels !== false }))
        .filter(({ tier }) => tier.count > 0)
        .map(({ name, tier, hasLevels }) => chip(`${tier.count}개`, name, hasLevels ? `Lv.${tier.level}` : ''))
        .join('');
    const moduleChips = [
        ['생태 모듈', modules.ecological_module],
        ['주방 모듈', modules.kitchen_module],
        ['자원 탐지기', modules.resource_detector],
        ['제작 모듈', modules.crafting_module],
    ].map(([name, level]) => chip('', name, level > 0 ? `Lv.${level}` : '미해금')).join('');
    const notes = homeLevel > COUNTS_CONFIRMED_UP_TO
        ? `<ul class="assume-notes">
               <li>건물 배치 수량은 RV ${COUNTS_CONFIRMED_UP_TO} 레벨까지 게임 내 확인되었으며, 그 이상은 추정치입니다.</li>
           </ul>`
        : '';
    document.getElementById('simple-summary').innerHTML = `
        <p class="assume-title">시설 설정 요약</p>
        <div class="chip-grid">${built}</div>
        <p class="assume-title">모듈 레벨 요약</p>
        <div class="chip-grid">${moduleChips}</div>
        ${notes}`;
}

function applyConfigMode() {
    const simple = isSimpleMode();
    document.getElementById('simple-config').style.display = simple ? 'block' : 'none';
    document.getElementById('advanced-config').style.display = simple ? 'none' : 'block';
    if (simple) renderSimpleSummary();
    renderStrategy();
}

function customizeInAdvancedMode() {
    const { facilities, modules } = simpleSetup(selectedHomeLevel());
    FACILITIES.forEach(f => {
        facilityTiers[f.name] = facilities[f.name].map(t => ({ ...t }));
        renderTierRows(f.name);
    });
    document.getElementById('ecological-module-level').value = modules.ecological_module;
    document.getElementById('kitchen-module-level').value = modules.kitchen_module;
    document.getElementById('resource-detector-level').value = modules.resource_detector;
    document.getElementById('crafting-module-level').value = modules.crafting_module;
    document.getElementById('mode-advanced').checked = true;
    applyConfigMode();
    saveInputsToStorage();
    document.getElementById('advanced-config').scrollIntoView({ behavior: 'smooth' });
}

function attachModeHandlers() {
    document.getElementById('mode-simple').addEventListener('change', applyConfigMode);
    document.getElementById('mode-advanced').addEventListener('change', applyConfigMode);
    document.getElementById('home-level').addEventListener('change', () => {
        renderSimpleSummary();
        renderStrategy();
    });
    document.getElementById('customize-btn').addEventListener('click', customizeInAdvancedMode);
}

let levelUpStock = {};

const ITEM_NAMES = {
    coins: '코인',
    wood_block: '통나무',
    mineral_sand: '광산 모래',
    coarse_sifted_ore: '굵게 선별된 광석',
    rough_lumber: '거친 목재',
    standard_planks: '규격 판자',
    laminated_beams: '집성재 보',
    densified_timber_component: '고밀도 목재 부품',
    sintered_ore_brick: '소결 광석 벽돌',
    refined_ore: '정제 광석',
    microcrystalline_ore_plate: '미세결정 광석 판재'
};

function isLevelUpStrategy() {
    return document.getElementById('strategy-level-up').checked;
}

function levelUpTarget() {
    if (isSimpleMode()) return selectedHomeLevel() + 1;
    return numberOrDefault(document.getElementById('level-up-target').value, 7);
}

function levelUpCost() {
    return LEVEL_UP_COSTS[levelUpTarget()] || null;
}

function levelUpUnavailable() {
    const target = levelUpTarget();
    if (target > MAX_HOME_LEVEL) return `RV ${MAX_HOME_LEVEL}가 최고 레벨이므로 더 이상 레벨업 플랜을 계획할 수 없습니다.`;
    if (!LEVEL_UP_COSTS[target]) return `영지 레벨업 비용은 RV 7 이상부터 등록되어 있습니다.`;
    return null;
}

function stockNames(cost) {
    const names = ['coins'];
    cost.items.forEach(([item]) => {
        const chain = LEVEL_UP_CHAINS.find(c => c.includes(item));
        if (chain) names.push(...chain.slice(0, chain.indexOf(item) + 1));
    });
    return names;
}

function stockAmount(name) {
    const amount = Number(levelUpStock[name]);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function populateLevelUpTargets() {
    const select = document.getElementById('level-up-target');
    select.innerHTML = Object.keys(LEVEL_UP_COSTS).map(level => `<option value="${level}">RV ${level}</option>`).join('');
}

function renderStrategy() {
    const levelUp = isLevelUpStrategy();
    document.getElementById('level-up-config').style.display = levelUp ? 'block' : 'none';
    document.getElementById('coins-config').style.display = levelUp ? 'none' : 'block';
    if (!levelUp) return;

    document.getElementById('level-up-target-row').style.display = isSimpleMode() ? 'none' : '';

    const costEl = document.getElementById('level-up-cost');
    const stockDetails = document.getElementById('level-up-stock');
    const unavailable = levelUpUnavailable();
    if (unavailable) {
        costEl.innerHTML = `<p class="level-up-note">${unavailable} 대신 코인 최대화 플랜으로 연산됩니다.</p>`;
        stockDetails.style.display = 'none';
        return;
    }
    const cost = levelUpCost();
    const chip = (amount, name) => `<div class="chip"><span><span class="chip-count">${formatNumber(amount)}</span> ${ITEM_NAMES[name] || prettyItem(name)}</span></div>`;
    costEl.innerHTML = `
        <p class="assume-title">RV ${levelUpTarget()} 레벨업 필요 자원</p>
        <div class="chip-grid">${chip(cost.coins, 'coins')}${cost.items.map(([item, n]) => chip(n, item)).join('')}</div>`;
    stockDetails.style.display = '';
    document.getElementById('level-up-stock-grid').innerHTML = stockNames(cost).map(name => `
        <div class="input-field">
            <label for="stock-${name}">${ITEM_NAMES[name] || prettyItem(name)}</label>
            <input type="number" id="stock-${name}" data-stock="${name}" min="0" value="${stockAmount(name)}">
        </div>`).join('');
}

function attachStrategyHandlers() {
    document.getElementById('strategy-level-up').addEventListener('change', renderStrategy);
    document.getElementById('strategy-coins').addEventListener('change', renderStrategy);
    document.getElementById('level-up-target').addEventListener('change', renderStrategy);
    const grid = document.getElementById('level-up-stock-grid');
    grid.addEventListener('input', (e) => {
        const name = e.target.dataset.stock;
        if (!name) return;
        levelUpStock[name] = Math.max(0, floatOrDefault(e.target.value, 0));
        saveInputsToStorage();
    });
    grid.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) runFindPlan();
    });
}

function levelUpInput() {
    if (!isLevelUpStrategy() || levelUpUnavailable()) return null;
    const cost = levelUpCost();
    return {
        cost: [['coins', cost.coins], ...cost.items],
        stock: stockNames(cost).filter(name => stockAmount(name) > 0).map(name => [name, stockAmount(name)]),
    };
}

function perHour(perSecond) {
    const hourly = perSecond * 3600;
    return hourly < 10 ? hourly.toFixed(1) : formatNumber(Math.round(hourly));
}

function formatDuration(seconds) {
    const minutes = Math.ceil(seconds / 60);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${mins}분`;
    return `${mins}분`;
}

let planContext = null;

function renderLevelUp(plan) {
    const card = document.getElementById('level-up-card');
    const context = planContext;
    if (!context || !context.levelUp) {
        card.style.display = 'none';
        return;
    }
    card.style.display = 'block';
    const label = document.getElementById('level-up-label');
    const time = document.getElementById('level-up-time');
    const lines = document.getElementById('level-up-lines');
    label.textContent = `RV ${context.target} 레벨업 달성 시간`;
    const report = plan.level_up;
    if (context.unavailable) {
        time.textContent = '-';
        lines.innerHTML = `<p class="level-up-note">${context.unavailable} 이 플랜은 코인 생산을 최적화합니다.</p>`;
        return;
    }
    if (context.ready) {
        time.textContent = '즉시 달성 가능';
        lines.innerHTML = `<p class="level-up-note">이미 레벨업에 필요한 자원을 모두 보유 중입니다. 남은 자원으로 코인을 최대로 생산합니다.</p>`;
        return;
    }
    if (!report) {
        const why = plan.level_up_note === 'unreachable'
            ? `현재 설정된 시설로는 레벨업 필요 재료를 생산할 수 없습니다.`
            : `레벨업 플랜을 계산할 수 없습니다.`;
        time.textContent = '-';
        lines.innerHTML = `<p class="level-up-note">${why} 대신 코인 생산 최적화 플랜을 안내합니다.</p>`;
        return;
    }
    time.textContent = `${formatDuration(report.seconds)} 후 달성`;
    const slowest = Math.max(...report.requirements.map(r => r.seconds ?? Infinity));
    const rows = report.requirements.map(r => {
        const ready = r.seconds === null ? '생산 불가' : r.seconds === 0 ? '충족됨' : formatDuration(r.seconds);
        const isSlowest = r.seconds !== null && r.seconds > 0 && r.seconds >= slowest * (1 - 1e-6);
        return `<tr${isSlowest ? ' class="slowest"' : ''}>
            <td>${ITEM_NAMES[r.name] || prettyItem(r.name)}</td>
            <td>${formatNumber(r.need)}</td>
            <td>${formatNumber(r.have)}</td>
            <td>${perHour(r.per_second)}</td>
            <td>${ready}</td>
        </tr>`;
    }).join('');

    const surplus = report.requirements
        .map(r => ({ name: r.name, spare: Math.floor(r.have + r.per_second * report.seconds - r.need) }))
        .concat((report.leftovers || []).map(([name, amount]) => ({ name, spare: Math.floor(amount) })))
        .filter(r => r.spare >= 1)
        .map(r => `${formatNumber(r.spare)} ${r.name === 'coins' ? '코인' : ITEM_NAMES[r.name] || prettyItem(r.name)}`);
    const coinsNote = surplus.length
        ? `<p class="level-up-coins"><span>잉여 생산 자원:</span> <strong>${surplus.join(', ')}</strong></p>`
        : '';
    lines.innerHTML = `
        <table class="level-up-lines">
            <thead><tr><th>필요 자원</th><th>필요 수량</th><th>보유 수량</th><th>시간당 생산</th><th>완료 소요 시간</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        ${coinsNote}`;
}

function renderProfitBreakdown(plan) {
    const card = document.getElementById('profit-card');
    const report = plan.level_up;
    const streams = (plan.income_streams || []).filter(s => s.units_per_second > 0);
    if (!report || streams.length === 0) {
        card.style.display = 'none';
        return;
    }
    card.style.display = 'block';
    const total = streams.reduce((sum, s) => sum + s.rate_per_second, 0);
    const rows = [...streams]
        .sort((a, b) => b.rate_per_second - a.rate_per_second)
        .map(s => `<tr>
            <td data-label="Product">${prettyItem(s.item_name)}</td>
            <td data-label="Facility">${FACILITY_NAMES_KO[s.facility] || s.facility}</td>
            <td data-label="Sold per hour">${perHour(s.units_per_second)}</td>
            <td data-label="Profit per hour">${formatNumber(Math.round(s.rate_per_second * 3600))} 코인</td>
            <td data-label="Share">${total > 0 ? Math.round(s.rate_per_second / total * 100) : 0}%</td>
            <td data-label="By the level-up">${formatNumber(Math.floor(s.rate_per_second * report.seconds))} 코인</td>
        </tr>`).join('');
    document.getElementById('profit-breakdown').innerHTML = `
        <div class="table-wrapper">
            <table class="facility-plan-table">
                <thead><tr><th>생산품</th><th>시설</th><th>시간당 판매량</th><th>시간당 이익</th><th>비중</th><th>레벨업 달성 시 총이익</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

function getPlanInputValues() {
    if (isSimpleMode()) {
        const { facilities, modules } = simpleSetup(selectedHomeLevel());
        return {
            currency: 'coins',
            prioritize_byproducts: !isLevelUpStrategy() && document.getElementById('prioritize-byproducts').checked,
            level_up: levelUpInput(),
            facilities,
            modules
        };
    }

    const facilities = {};
    FACILITIES.forEach(f => {
        facilities[f.name] = facilityTiers[f.name].map(t => ({
            count: t.count,
            level: f.hasLevels === false ? 1 : t.level
        }));
    });

    const modules = {
        ecological_module: numberOrDefault(document.getElementById('ecological-module-level').value, 0),
        kitchen_module: numberOrDefault(document.getElementById('kitchen-module-level').value, 0),
        resource_detector: numberOrDefault(document.getElementById('resource-detector-level').value, 0),
        crafting_module: numberOrDefault(document.getElementById('crafting-module-level').value, 0)
    };

    return {
        currency: 'coins',
        prioritize_byproducts: !isLevelUpStrategy() && document.getElementById('prioritize-byproducts').checked,
        level_up: levelUpInput(),
        facilities,
        modules
    };
}

function prettyItem(name) {
    if (!name) return name;
    if (ITEM_NAMES[name]) return ITEM_NAMES[name];
    return name.split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function prettyReason(reason) {
    if (!reason) return reason;
    const names = list => list.split(', ').map(prettyItem).join(', ');
    return reason
        .replace(/^Used for ([^;]+)/, (_, list) => '다음 재료로 사용: ' + names(list))
        .replace(/takes turns with ([^;]+)$/, (_, list) => '다음 품목과 교대 생산: ' + names(list));
}

let unverifiedRowKeys = new Set();

function numberOrDefault(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function floatOrDefault(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function formatNumber(num) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    const resultsContent = document.getElementById('results-content');
    const resultsSection = document.getElementById('results-section');

    errorEl.textContent = message;
    errorEl.style.display = 'block';
    resultsContent.style.display = 'none';
    resultsSection.style.display = 'block';
}

function updateCurrencyLabels(currency) {
    const label = CURRENCY_LABELS[currency] || '코인';
    document.getElementById('target-amount-label').textContent = `목표 ${label}`;
    document.getElementById('current-amount-label').textContent = `현재 보유 ${label}`;
    document.getElementById('amount-produced-label').textContent = `총 생산 ${label}`;
}

function renderProductBreakdown(goalResult) {
    const section = document.getElementById('product-breakdown-section');
    const tbody = document.getElementById('product-breakdown-tbody');

    const products = goalResult.products || [];
    const byproducts = (goalResult.byproducts || []).filter(([, amount]) => Math.floor(amount) > 0);
    if (products.length === 0 && byproducts.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    const unit = document.getElementById('rate-unit').value;
    const { multiplier, suffix } = RATE_UNIT_SECONDS[unit] || RATE_UNIT_SECONDS.second;
    document.getElementById('product-breakdown-rate-header').textContent = `수익${suffix}`;

    tbody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        const wholeAmount = Math.floor(p.total_units);
        const worth = wholeAmount * p.sell_value;
        row.innerHTML = `
            <td>${prettyItem(p.item_name)}</td>
            <td>${FACILITY_NAMES_KO[p.facility] || p.facility}</td>
            <td>${wholeAmount.toLocaleString()}개</td>
            <td>${formatNumber(p.rate_per_second * multiplier)} 코인</td>
            <td>${formatNumber(worth)} 코인</td>
        `;
        tbody.appendChild(row);
    });

    byproducts.forEach(([name, amount]) => {
        const row = document.createElement('tr');
        row.className = 'byproduct-row';
        row.innerHTML = `
            <td>${ITEM_NAMES[name] || name} <span class="hint small">(보너스 부산물)</span></td>
            <td>&mdash;</td>
            <td>${Math.floor(amount).toLocaleString()}개</td>
            <td>&mdash;</td>
            <td>판매하지 않음</td>
        `;
        tbody.appendChild(row);
    });
}

function renderSeedsNeeded(goalResult) {
    const section = document.getElementById('seeds-needed-section');
    const tbody = document.getElementById('seeds-needed-tbody');

    const requirements = goalResult.seed_requirements || [];
    if (requirements.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    tbody.innerHTML = requirements.map(r => `
        <tr>
            <td>${prettyItem(r.item_name)}</td>
            <td>${FACILITY_NAMES_KO[r.facility] || r.facility}</td>
            <td>${r.facility_count.toLocaleString()}개</td>
            <td>${r.seeds_per_plot.toLocaleString()}회</td>
            <td>${r.total_seeds.toLocaleString()}개</td>
        </tr>
    `).join('');
}

const ENVIRONMENT_MODE_ORDER = ['Warm', 'Scorching', 'Cool', 'Freeze', 'Adequate'];

const ABILITIES = [
    { name: 'Fire', color: '#e5484d', about: '조리, 제련, 가열' },
    { name: 'Grass', color: '#3fa36b', about: '씨앗 심기 및 채집' },
    { name: 'Water', color: '#2b8fe8', about: '양조, 물汲기, 물주기' },
    { name: 'Earth', color: '#b39a74', about: '개간 및 채광' },
    { name: 'Lightning', color: '#e6c317', about: '전기 발생', dark: true },
    { name: 'Ice', color: '#45c4de', about: '영지 냉각' },
    { name: 'Wind', color: '#2fbfa5', about: '풍력 가공' },
    { name: 'Dark', color: '#7d4bb3', about: '수확, 건조 및 절임' },
    { name: 'Light', color: '#f5a524', about: '영지 조명', dark: true },
    { name: 'Hauling', color: '#5f7fd1', about: '창고 운반' },
    { name: 'Artisanship', color: '#5fb14f', about: '수공예품 제작' },
    { name: 'Leisure', color: '#e8678a', about: '휴식 및 취미 제작' },
    { name: 'Perfumery', color: '#b877d9', about: '조향 및 향초' },
];
const ABILITY_BY_NAME = new Map(ABILITIES.map(a => [a.name, a]));

const ENVIRONMENT_BUILDING_ABILITY = {
    'Heat Furnace': 'Fire',
    'Cooling Unit': 'Ice',
    'Sunlamp': 'Light',
};

function abilityTag(name) {
    const a = ABILITY_BY_NAME.get(name);
    if (!a) return name;
    return `<span class="ability${a.dark ? ' dark' : ''}" style="--ability:${a.color}" title="${a.about}">${name}</span>`;
}

function abilityDot(name, level, note) {
    const a = ABILITY_BY_NAME.get(name);
    const color = a ? a.color : '#888888';
    const tip = `${name} Lv.${level}${note ? ` · ${note}` : ''}`;
    return `<span class="ability-dot${a && a.dark ? ' dark' : ''}${note ? ' bonus' : ''}" style="--ability:${color}" title="${tip}" aria-label="${tip}">${level}</span>`;
}

function aniimoLabel(step) {
    const a = step.aniimo;
    if (!a) {
        const tasks = step.aniimo_tasks || [];
        if (tasks.length === 0) return '-';
        return `<span class="ability-dots">${tasks.map(t => abilityDot(t.ability, t.level)).join('')}</span>`;
    }
    let note = '';
    if (a.personality_bonus) {
        const personality = FACILITIES.find(f => f.name === step.facility)?.personality;
        note = `${personality ? `${personality} 성격` : '일치하는 성격'} (+20% 속도 보너스)`;
    }
    return `<span class="ability-dots">${abilityDot(a.ability, a.level, note)}</span>`;
}

function taskLabel(task, facility, tagged = false) {
    const ability = tagged ? abilityTag(task.ability) : task.ability;
    if (!task.personality_bonus) return `${ability} Lv.${task.level}`;
    const personality = FACILITIES.find(f => f.name === facility)?.personality;
    return `${ability} Lv.${task.level} · ${personality || '일치하는 성격'}`;
}

function facilityPlanTable(rows) {
    return `
        <div class="table-wrapper">
            <table class="facility-plan-table">
                <thead>
                    <tr>
                        <th>시설명</th>
                        <th>수량</th>
                        <th>생산 품목</th>
                        <th>애니이모</th>
                        <th>지정 사유</th>
                    </tr>
                </thead>
                <tbody>${rows.map(step => `
                    <tr class="status-${step.status}">
                        <td data-label="Facility">${FACILITY_NAMES_KO[step.facility] || step.facility}</td>
                        <td data-label="Count">${step.facility_count}</td>
                        <td data-label="Producing">${step.item_name ? prettyItem(step.item_name) : '-'}${unverifiedRowKeys.has(`${step.facility}|${step.item_name}`) ? '<span class="tag unverified" title="게임 내 미검증 레시피">미검증</span>' : ''}</td>
                        <td data-label="Aniimo">${aniimoLabel(step)}</td>
                        <td data-label="Why">${prettyReason(step.reason)}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

function renderAniimoSummary(plan) {
    const container = document.getElementById('aniimo-summary');
    const groups = new Map();
    (plan.coin_items || []).forEach(step => {
        (step.aniimo_tasks || []).forEach(task => {
            const key = taskLabel(task, step.facility);
            if (!groups.has(key)) {
                groups.set(key, { label: key, ability: task.ability, level: task.level, bonus: task.personality_bonus, busy: 0, where: new Map() });
            }
            const g = groups.get(key);
            g.busy += task.busy;
            const place = `${FACILITY_NAMES_KO[step.facility] || step.facility} (${prettyItem(step.item_name)})`;
            g.where.set(place, (g.where.get(place) || 0) + step.facility_count);
        });
    });
    (plan.environment_assignments || []).forEach(a => {
        const ability = ENVIRONMENT_BUILDING_ABILITY[a.building];
        if (!ability || !a.units) return;
        const key = `${ability} (환경 조절)`;
        if (!groups.has(key)) {
            groups.set(key, { label: `${ability} 전 레벨`, ability, level: 1, bonus: false, busy: 0, where: new Map(), environment: true });
        }
        const g = groups.get(key);
        g.busy += a.units;
        const place = `${FACILITY_NAMES_KO[a.building] || a.building} (${a.mode})`;
        g.where.set(place, (g.where.get(place) || 0) + a.units);
    });
    const collapsedSummary = document.getElementById('aniimo-collapsed-summary');
    if (groups.size === 0) {
        container.innerHTML = '<p class="hint">이 생산 계획에는 배치할 애니이모가 필요하지 않습니다.</p>';
        collapsedSummary.textContent = '애니이모 필요 없음.';
        document.getElementById('aniimo-abilities').innerHTML = '';
        return;
    }
    const sorted = [...groups.values()].sort((a, b) => b.level - a.level || Number(b.bonus) - Number(a.bonus) || a.label.localeCompare(b.label));
    const kept = [];
    sorted.forEach(g => {
        const host = g.bonus || g.environment ? null : kept.find(k => k.ability === g.ability && k.level >= g.level && k.spare >= g.busy - 1e-6);
        if (host) {
            host.spare -= g.busy;
            host.busy += g.busy;
            g.where.forEach((n, place) => host.where.set(place, (host.where.get(place) || 0) + n));
            return;
        }
        g.count = Math.max(1, Math.ceil(g.busy - 1e-6));
        g.spare = g.count - g.busy;
        kept.push(g);
    });
    let total = 1;
    const rows = kept
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(g => {
            total += g.count;
            const where = [...g.where.entries()].map(([place, n]) => `${n > 1 ? n + '× ' : ''}${place}`).join(', ');
            const rest = g.label.slice(g.ability.length).trim();
            return `<tr><td data-label="Aniimo">${abilityTag(g.ability)} ${rest}</td><td data-label="How many">${g.count}명</td><td data-label="Busy on average">${g.busy.toFixed(1)}명</td><td data-label="Where">${where}</td></tr>`;
        })
        .join('');
    const haulingRow = `<tr><td data-label="Aniimo">${abilityTag('Hauling')} 전 레벨</td><td data-label="How many">1명+</td><td data-label="Busy on average">-</td><td data-label="Where">생산품을 창고로 운반합니다. 작업량이 밀릴 경우 수송 담당 인원을 추가하세요.</td></tr>`;

    let capNote = '';
    const cap = isSimpleMode() ? ANIIMO_MAX[selectedHomeLevel() - 1] : null;
    if (cap && total > cap) {
        capNote = `<p class="hint small">총 ${total}명의 애니이모가 필요하며, RV ${selectedHomeLevel()} 영지의 최대 수용 인원(${cap}명)을 초과합니다. 2개 이상의 능력을 가진 애니이모를 활용하세요.</p>`;
    } else if (cap) {
        capNote = `<p class="hint small">총 ${total}명의 애니이모가 필요합니다. (RV ${selectedHomeLevel()} 영지 최대 수용: ${cap}명)</p>`;
    } else {
        capNote = `<p class="hint small">최대 필요 인원은 ${total}명이며, 다중 능력을 가진 애니이모 배치를 권장합니다.</p>`;
    }
    collapsedSummary.textContent = cap
        ? `총 ${total}명 필요 · 영지 수용 인원: ${cap}명${total > cap ? ' (초과됨 - 목록 확인)' : ''}`
        : `최대 ${total}명 필요`;
    const needed = new Map(ABILITIES.map(a => [a.name, 0]));
    kept.forEach(g => needed.set(g.ability, (needed.get(g.ability) || 0) + g.count));
    const dot = (ability, text, bonus, tip) => {
        const a = ABILITY_BY_NAME.get(ability);
        return `<span class="ability-dot small${a && a.dark ? ' dark' : ''}${bonus ? ' bonus' : ''}" style="--ability:${a ? a.color : '#888888'}" title="${tip}" aria-label="${tip}">${text}</span>`;
    };
    const teamDots = g => {
        const where = [...g.where.entries()].map(([place, n]) => `${n > 1 ? n + '× ' : ''}${place}`).join(', ');
        const tip = `${g.count > 1 ? `${g.count}× ` : ''}${g.label}${g.bonus ? ' (+20% 속도 보너스)' : ''} · ${where}`;
        const times = g.count > 1 ? `<span class="ability-times">×${g.count}</span>` : '';
        return `<span class="ability-kind">${dot(g.ability, g.environment ? '·' : g.level, g.bonus, tip)}${times}</span>`;
    };
    document.getElementById('aniimo-abilities').innerHTML = ABILITIES.map(a => {
        const n = a.name === 'Hauling' ? `${needed.get(a.name) + 1}+` : needed.get(a.name);
        const zero = n === 0;
        const dots = kept
            .filter(g => g.ability === a.name)
            .sort((x, y) => y.level - x.level || Number(y.bonus) - Number(x.bonus))
            .map(teamDots);
        if (a.name === 'Hauling') {
            dots.push(`<span class="ability-kind">${dot('Hauling', '·', false, '운반담당 애니이모')}</span>`);
        }
        const stack = dots.length ? `<div class="ability-stack">${dots.join('')}</div>` : '';
        return `<div class="ability-col" style="--ability:${a.color}">
            <div class="ability-cell${zero ? ' zero' : ''}" title="${a.name}: ${a.about}">
                <span class="ability-count">${n}</span><span class="ability-name">${a.name}</span>
            </div>${stack}</div>`;
    }).join('');
    container.innerHTML = `
        <div class="table-wrapper">
            <table class="facility-plan-table">
                <thead><tr><th>필요 능력치</th><th>인원수</th><th>평균 작업 인원</th><th>배치 장소</th></tr></thead>
                <tbody>${rows}${haulingRow}</tbody>
            </table>
        </div>
        ${capNote}
    `;
}

function splitByEnvironmentUnit(rows, assignmentsForMode) {
    const units = [];
    assignmentsForMode.forEach(a => {
        (a.layouts || []).forEach(layout => {
            const remaining = {};
            layout.forEach(p => {
                remaining[p.facility] = (remaining[p.facility] || 0) + 1;
            });
            units.push({ building: a.building, remaining, rows: [], layout });
        });
    });

    rows.forEach(step => {
        let remaining = step.facility_count;
        for (const unit of units) {
            if (remaining <= 0) break;
            const available = unit.remaining[step.facility] || 0;
            const take = Math.min(remaining, available);
            if (take <= 0) continue;
            unit.remaining[step.facility] -= take;
            unit.rows.push({ ...step, facility_count: take });
            remaining -= take;
        }
    });

    units.forEach(unit => {
        const totalByFacility = {};
        unit.layout.forEach(p => {
            totalByFacility[p.facility] = (totalByFacility[p.facility] || 0) + 1;
        });
        const takenSoFar = {};
        unit.layout = unit.layout.filter(p => {
            const unused = unit.remaining[p.facility] || 0;
            const used = (totalByFacility[p.facility] || 0) - unused;
            takenSoFar[p.facility] = takenSoFar[p.facility] || 0;
            if (takenSoFar[p.facility] < used) {
                takenSoFar[p.facility]++;
                return true;
            }
            return false;
        });
    });

    return units.filter(u => u.rows.length > 0);
}

const ENVIRONMENT_FACILITY_COLORS = {
    'Farmland': '#c9a24d',
    'Woodland': '#4caf50',
    'Starfall Hammock': '#42a5f5',
    'Tidewhisper Sandcastle': '#26c6da',
    'Floral Windmill': '#ab47bc',
    'Dewy House': '#ef8a80',
};

const ENVIRONMENT_BUILDING_SIZE = 2.0;
const ENVIRONMENT_COVERAGE_RADIUS = 4.5;

const ENVIRONMENT_MODE_COLORS = {
    Warm: '#f59e0b',
    Scorching: '#ef4444',
    Cool: '#60a5fa',
    Freeze: '#67e8f9',
    Adequate: '#facc15',
};

// 환경 조절 번역
const ENV_MODE_KO = {
    Warm: '따뜻함',
    Scorching: '뜨거움',
    Cool: '서늘함',
    Freeze: '추움',
    Adequate: '적정'
};

function renderEnvironmentDiagram(layout, mode, building, rows = []) {
    if (!layout || layout.length === 0) return '';
    const margin = 5;
    const half = ENVIRONMENT_COVERAGE_RADIUS + margin;
    const buildingCenter = ENVIRONMENT_BUILDING_SIZE / 2;
    const viewMin = buildingCenter - half;
    const viewSize = half * 2;
    const coverageMin = buildingCenter - ENVIRONMENT_COVERAGE_RADIUS;
    const coverageSize = ENVIRONMENT_COVERAGE_RADIUS * 2;
    const tint = ENVIRONMENT_MODE_COLORS[mode] || '#9aa0a8';

    const gridLines = [];
    for (let t = Math.ceil(viewMin * 4) / 4; t <= viewMin + viewSize; t += 0.25) {
        const cls = Number.isInteger(t) ? 'tile' : 'quarter';
        gridLines.push(`<line class="${cls}" x1="${t}" y1="${viewMin}" x2="${t}" y2="${viewMin + viewSize}" />`);
        gridLines.push(`<line class="${cls}" x1="${viewMin}" y1="${t}" x2="${viewMin + viewSize}" y2="${t}" />`);
    }

    const distance = p => Math.hypot(p.x + p.size / 2 - buildingCenter, p.y + p.size / 2 - buildingCenter);
    const plots = [...layout].sort((a, b) => distance(a) - distance(b));
    const queue = {};
    rows.forEach(r => {
        if (!r.item_name) return;
        (queue[r.facility] = queue[r.facility] || []).push({ item: r.item_name, left: r.facility_count });
    });
    const cropOf = p => {
        const q = queue[p.facility];
        while (q && q.length && q[0].left <= 0) q.shift();
        if (!q || !q.length) return null;
        q[0].left--;
        return q[0].item;
    };
    const assigned = plots.map(p => ({ ...p, crop: cropOf(p) }));
    const crops = [...new Set(assigned.map(p => `${p.facility}|${p.crop}`))];
    const cropsPerFacility = {};
    crops.forEach(key => {
        const facility = key.split('|')[0];
        cropsPerFacility[facility] = (cropsPerFacility[facility] || 0) + 1;
    });
    const numbered = Object.values(cropsPerFacility).some(n => n > 1);
    const numberOf = key => crops.indexOf(key) + 1;

    const inset = 0.08;
    const rects = assigned.map(p => {
        const color = ENVIRONMENT_FACILITY_COLORS[p.facility] || '#888888';
        const size = p.size - inset * 2;
        const facKo = FACILITY_NAMES_KO[p.facility] || p.facility;
        const label = p.crop ? `${facKo}: ${prettyItem(p.crop)}` : facKo;
        const initials = numbered && p.crop
            ? `<text x="${p.x + p.size / 2}" y="${p.y + p.size / 2}" font-size="${Math.min(0.9, p.size * 0.4)}">${numberOf(`${p.facility}\vert{}${p.crop}`)}</text>`
            : '';
        return `<g class="env-plot"><title>${label}</title>
            <rect x="${p.x + inset}" y="${p.y + inset}" width="${size}" height="${size}" rx="0.25" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.06" />${initials}</g>`;
    }).join('');

    const counts = {};
    assigned.forEach(p => {
        const key = `${p.facility}|${p.crop}`;
        counts[key] = (counts[key] || 0) + 1;
    });
    const legend = [`
        <span class="env-legend-item">
            <span class="env-legend-swatch coverage" style="background:${tint}33;border-color:${tint}"></span>${ENV_MODE_KO[mode] || mode} 범위
        </span>`].concat(Object.entries(counts).map(([key, n]) => {
        const [facility, crop] = key.split('|');
        const facKo = FACILITY_NAMES_KO[facility] || facility;
        const name = crop && crop !== 'null' ? `${facKo}: ${prettyItem(crop)}` : facKo;
        return `
        <span class="env-legend-item">
            <span class="env-legend-swatch" style="background:${ENVIRONMENT_FACILITY_COLORS[facility] || '#888888'}"></span>${numbered ? `<b>${numberOf(key)}</b> ` : ''}${name} ×${n}
        </span>`;
    })).join('');

    return `
        <div class="env-diagram">
            <svg viewBox="${viewMin} ${viewMin} ${viewSize} ${viewSize}" role="img" aria-label="${FACILITY_NAMES_KO[building] || building} 배치, ${ENV_MODE_KO[mode] || mode} 범위">
                <g class="env-grid">${gridLines.join('')}</g>
                <rect x="${coverageMin}" y="${coverageMin}" width="${coverageSize}" height="${coverageSize}"
                      fill="${tint}" fill-opacity="0.12" stroke="${tint}" stroke-opacity="0.8" stroke-dasharray="0.35,0.25" stroke-width="0.08" />
                ${rects}
                <g class="env-building"><title>${FACILITY_NAMES_KO[building] || building} (${ENV_MODE_KO[mode] || mode})</title>
                    <rect x="0.05" y="0.05" width="${ENVIRONMENT_BUILDING_SIZE - 0.1}" height="${ENVIRONMENT_BUILDING_SIZE - 0.1}" rx="0.3" fill="${tint}" stroke="currentColor" stroke-opacity="0.6" stroke-width="0.08" />
                </g>
            </svg>
            <div class="env-legend">${legend}</div>
            <p class="env-note">점선 범위 내에 배치된 밭은 해당 환경 조절 효과를 적용받습니다.</p>
        </div>
    `;
}

function renderFacilityPlan(plan) {
    const container = document.getElementById('facility-plan-container');
    const steps = plan.coin_items || [];

    if (steps.length === 0) {
        container.innerHTML = '<p class="hint">현재 설정된 시설로는 수익을 낼 수 있는 아이템이 없습니다.</p>';
        return;
    }

    const envGroups = new Map();
    const ungatedSteps = [];
    steps.forEach(step => {
        if (step.environment) {
            if (!envGroups.has(step.environment)) envGroups.set(step.environment, []);
            envGroups.get(step.environment).push(step);
        } else {
            ungatedSteps.push(step);
        }
    });

    const assignments = plan.environment_assignments || [];
    const environmentSections = ENVIRONMENT_MODE_ORDER.filter(mode => envGroups.has(mode)).map(mode => {
        const assignmentsForMode = assignments.filter(a => a.mode === mode);
        const units = splitByEnvironmentUnit(envGroups.get(mode), assignmentsForMode);

        const unitTables = units.length === 0
            ? facilityPlanTable(envGroups.get(mode))
            : units.map((unit, i) => `
                ${units.length > 1 ? `<p class="hint small">${FACILITY_NAMES_KO[unit.building] \vert{}\vert{} unit.building}${i + 1}호기</p>` : ''}
                <div class="env-unit">
                    ${renderEnvironmentDiagram(unit.layout, mode, unit.building, unit.rows)}
                    <div class="env-unit-table">${facilityPlanTable(unit.rows)}</div>
                </div>
            `).join('');

        return `
            <div class="facility-category">
                <h4 class="facility-category-title">환경 설정: ${ENV_MODE_KO[mode] || mode}</h4>
                ${unitTables}
            </div>
        `;
    }).join('');

    const byCategory = new Map(FACILITY_CATEGORIES.map(c => [c, []]));
    ungatedSteps.forEach(step => {
        const category = FACILITY_CATEGORY_BY_NAME.get(step.facility) || 'Materials Processing';
        byCategory.get(category).push(step);
    });

    const categorySections = FACILITY_CATEGORIES.map(category => {
        const categorySteps = byCategory.get(category);
        if (categorySteps.length === 0) return '';
        return `
            <div class="facility-category">
                <h4 class="facility-category-title">${CATEGORY_NAMES_KO[category] || category}</h4>
                ${facilityPlanTable(categorySteps)}
            </div>
        `;
    }).join('');

    container.innerHTML = environmentSections + categorySections;
}

function updateRateDisplay() {
    if (!lastPlan || !lastPlan.success) return;
    const unit = document.getElementById('rate-unit').value;
    const { multiplier, suffix } = RATE_UNIT_SECONDS[unit] || RATE_UNIT_SECONDS.second;
    const label = CURRENCY_LABELS[lastPlan.currency] || '코인';
    document.getElementById('plan-rate').textContent =
        `${formatNumber(lastPlan.rate_per_second * multiplier)} ${label}${suffix}`;
}

function updateRateUnitDisplays() {
    updateRateDisplay();
    if (lastGoalResult) {
        renderProductBreakdown(lastGoalResult);
    }
}

function displayPlan(plan, scroll = true) {
    const resultsSection = document.getElementById('results-section');
    const errorEl = document.getElementById('error-message');
    const resultsContent = document.getElementById('results-content');
    const goalSection = document.getElementById('goal-section');

    resultsSection.style.display = 'block';

    if (!plan.success) {
        goalSection.style.display = 'none';
        showError(plan.error || '알 수 없는 오류가 발생했습니다.');
        return;
    }

    errorEl.style.display = 'none';
    resultsContent.style.display = 'block';
    goalSection.style.display = plan.level_up ? 'none' : 'block';

    updateRateDisplay();
    updateCurrencyLabels(plan.currency);

    const explored = document.getElementById('plan-explored-hint');
    if (plan.proven_optimal === true && plan.level_up) {
        explored.innerHTML = `<span class="badge">✓ 검증된 최적의 플랜</span> 현재 수집된 데이터 기준, RV ${planContext.target} 달성 시간이 가장 빠른 플랜입니다.`;
    } else if (plan.proven_optimal === true) {
        explored.innerHTML = '<span class="badge">✓ 검증된 최적의 플랜</span> 현재 보유한 시설 조합에서 낼 수 있는 이론상 최대 수익 플랜입니다.';
    } else if (plan.proven_optimal === false && plan.upper_bound > 0) {
        const gap = Math.max(0, (plan.upper_bound - plan.rate_per_second) / plan.upper_bound * 100);
        explored.textContent = `제한 시간 내 탐색된 최상의 플랜입니다. (이론상 최대치와의 오차: ${gap.toFixed(1)}% 이내)`;
    } else {
        const reason = plan.fallback_reason ? ` (${plan.fallback_reason})` : '';
        explored.textContent = `정밀 최적화 연산을 완료하지 못해 백업 계산기가 적용되었습니다${reason}.`;
    }

    const unverifiedEl = document.getElementById('plan-unverified');
    const unverified = plan.unverified || [];
    unverifiedRowKeys = new Set(unverified.map(u => `${u.facility}|${u.item_name}`));
    if (unverified.length) {
        unverifiedEl.textContent = `플랜 내 ${unverified.length}개의 레시피가 아직 게임 내에서 검증되지 않은 데이터입니다 (아래 표에 표시됨).`;
        unverifiedEl.style.display = 'block';
    } else {
        unverifiedEl.style.display = 'none';
    }

    renderLevelUp(plan);
    renderProfitBreakdown(plan);
    renderFacilityPlan(plan);
    renderAniimoSummary(plan);

    if (scroll) resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayGoal(goalResult) {
    if (!goalResult.success) {
        lastGoalResult = null;
        document.getElementById('total-time').textContent = '-';
        document.getElementById('amount-produced').textContent = '-';
        document.getElementById('product-breakdown-section').style.display = 'none';
        document.getElementById('seeds-needed-section').style.display = 'none';
        console.warn('목표 계산 실패:', goalResult.error);
        return;
    }

    lastGoalResult = goalResult;
    document.getElementById('total-time').textContent = goalResult.total_time_formatted;
    document.getElementById('amount-produced').textContent = formatNumber(goalResult.amount_produced);

    renderProductBreakdown(goalResult);
    renderSeedsNeeded(goalResult);
}

async function runFindPlan() {
    if (!wasmReady) {
        showError('최적화 연산 엔진이 아직 준비되지 않았습니다. 잠시만 기다려주세요...');
        return;
    }

    const btn = document.getElementById('optimize-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const progressBar = document.getElementById('progress-bar-container');
    const progressFill = document.getElementById('progress-bar-fill');
    const progressCaption = document.getElementById('progress-bar-caption');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    progressBar.style.display = 'block';
    progressCaption.style.display = 'block';
    progressFill.style.width = '';
    progressFill.classList.add('indeterminate');
    progressCaption.textContent = '최적의 플랜을 탐색하는 중입니다...';

    const runId = ++planRunId;
    plansBySetup = {};
    if (pendingWorkerRequests.size > 0) restartWorker();
    try {
        const input = getPlanInputValues();
        planContext = {
            levelUp: isLevelUpStrategy(),
            target: levelUpTarget(),
            unavailable: levelUpUnavailable(),
            ready: !!(input.level_up && input.level_up.cost.every(([name, need]) => stockAmount(name) >= need)),
        };

        const bestJson = await callWorker('find_plan', JSON.stringify({ ...input, aniimo: 'best' }), (count) => {
            progressFill.classList.remove('indeterminate');
            progressFill.style.width = `${trialCountToPercent(count)}%`;
            progressCaption.textContent = `백업 연산 진행 중... (시도 ${count})`;
        });
        progressFill.style.width = '100%';
        if (runId !== planRunId) return;
        plansBySetup.best = JSON.parse(bestJson);
        showSelectedPlan(true);

        callWorker('find_plan', JSON.stringify({ ...input, aniimo: 'minimum' }))
            .then(json => {
                if (runId !== planRunId) return;
                plansBySetup.minimum = JSON.parse(json);
                if (selectedAniimoSetup() === 'minimum') showSelectedPlan(false);
            })
            .catch(error => {
                if (runId === planRunId) console.error('최소 애니이모 연산 실패:', error);
            });
    } catch (error) {
        console.error('플랜 계산 오류:', error);
        lastPlan = null;
        showError(`플랜 계산 오류: ${error.message}`);
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        progressBar.style.display = 'none';
        progressCaption.style.display = 'none';
        progressFill.classList.remove('indeterminate');
    }
}

async function runTimeToGoal() {
    if (!lastPlan || !lastPlan.success) return;

    const target = floatOrDefault(document.getElementById('target-amount').value, 0);
    const current = floatOrDefault(document.getElementById('current-amount').value, 0);

    try {
        const resultJson = await callWorker('time_to_reach', JSON.stringify({ plan: lastPlan, target, current }));
        displayGoal(JSON.parse(resultJson));
    } catch (error) {
        console.error('목표 계산 오류:', error);
    }
}

const RECIPE_MODULE_LABELS = {
    ecological_module: '생태 모듈',
    kitchen_module: '주방 모듈',
    resource_detector: '자원 탐지기',
    crafting_module: '제작 모듈',
};

let recipesRendered = false;

function formatRecipeTime(seconds) {
    const total = Math.round(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${hours}시간 ${minutes}분 ${secs}초`;
    if (minutes > 0) return `${minutes}분 ${secs}초`;
    return `${secs}초`;
}

function formatRecipeInputs(recipe) {
    if (recipe.raw_materials && recipe.raw_materials.length > 0) {
        const amounts = recipe.required_amount || [];
        return recipe.raw_materials
            .map((mat, i) => `${amounts[i] ?? '?'}개 × ${prettyItem(mat)}`)
            .join(', ');
    }
    if (recipe.cost && recipe.cost > 0) {
        return `씨앗 비용: ${recipe.cost} 코인`;
    }
    return '-';
}

function formatRecipeYield(recipe) {
    let text = `${recipe.yield_amount}개`;
    if (recipe.byproduct) {
        const [name, amount] = recipe.byproduct;
        text += ` <span class="hint small">(+${amount} ${ITEM_NAMES[name] || name})</span>`;
    }
    return text;
}

function formatRecipeAniimo(recipe, facility) {
    if (!recipe.aniimo) {
        const jobs = recipe.jobs || [];
        if (jobs.length === 0) return '-';
        return `<span class="job-list">${jobs.map(([step, ability, level]) =>
            `<span class="job"><span class="job-step">${step}</span> ${abilityTag(ability)}${level > 1 ? ` Lv.${level}+` : ''}</span>`).join('')}</span>`;
    }
    const [ability, minLevel] = recipe.aniimo;
    const best = `권장: Lv.3${facility.personality ? ' ' + facility.personality : ''}`;
    return `<span>${abilityTag(ability)} Lv.${minLevel}+<span class="recipe-best">${best}</span></span>`;
}

function formatRecipeSell(recipe) {
    if (recipe.sell_currency === 'none') return '<span class="hint small">영지 레벨업 재료</span>';
    return `${formatNumber(recipe.sell_value)} 코인`;
}

function formatRecipeModule(recipe) {
    if (!recipe.module_requirement) return '-';
    const [name, level] = recipe.module_requirement;
    const label = RECIPE_MODULE_LABELS[name] || name;
    return `${label} Lv.${level}`;
}

function renderRecipeTables(recipes) {
    const container = document.getElementById('facilities-modal-container');

    const byFacility = new Map();
    recipes.forEach(r => {
        if (!byFacility.has(r.facility)) byFacility.set(r.facility, []);
        byFacility.get(r.facility).push(r);
    });
    byFacility.forEach(list => {
        list.sort((a, b) => a.facility_level - b.facility_level || a.name.localeCompare(b.name));
    });

    container.innerHTML = FACILITY_CATEGORIES.map(category => {
        const facilitiesInCategory = FACILITIES.filter(f => f.category === category && byFacility.has(f.name));
        if (facilitiesInCategory.length === 0) return '';

        const tables = facilitiesInCategory.map(f => {
            const cell = (label, value) => `<td data-label="${label}"${value === '-' ? ' class="empty"' : ''}>${value}</td>`;
            const rows = byFacility.get(f.name).map(r => `
                <tr${r.verified === false ? ' class="unverified"' : ''}>
                    <td class="recipe-name">${prettyItem(r.name)}${r.verified === false ? ' <span class="info-icon" data-tooltip="게임 내 미검증 데이터">?</span>' : ''}</td>
                    ${cell('레벨', r.facility_level)}
                    ${cell('재료', formatRecipeInputs(r))}
                    ${cell('생산량', formatRecipeYield(r))}
                    ${cell('소요 시간', r.workload ? `작업량 ${r.workload}` : formatRecipeTime(r.production_time))}
                    ${cell('판매가', formatRecipeSell(r))}
                    ${cell('모듈', formatRecipeModule(r))}
                    ${cell('애니이모', formatRecipeAniimo(r, f))}
                </tr>
            `).join('');

            return `
                <div class="facility-recipe-table">
                    <h4>${FACILITY_NAMES_KO[f.name] || f.name}</h4>
                    <div class="table-wrapper">
                        <table class="recipe-table">
                            <thead>
                                <tr>
                                    <th>아이템</th>
                                    <th>레벨</th>
                                    <th>재료</th>
                                    <th>생산량</th>
                                    <th>소요 시간 <span class="info-icon" data-tooltip="작물은 성장 시간, 가공품은 작업량이 표시됩니다. 작업량은 애니이모 레벨에 따라 속도가 달라집니다.">?</span></th>
                                    <th>판매가</th>
                                    <th>모듈</th>
                                    <th>애니이모 <span class="info-icon" data-tooltip="레시피 요구 최소 능력 레벨과 성격 보너스가 적용되는 최적 레벨입니다.">?</span></th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="facility-category">
                <h4 class="facility-category-title">${CATEGORY_NAMES_KO[category] || category}</h4>
                ${tables}
            </div>
        `;
    }).join('');
}

window.showFacilities = async function() {
    document.getElementById('facilitiesModal').classList.add('show');
    if (recipesRendered) return;
    if (!wasmReady) {
        document.getElementById('facilities-loading-hint').textContent = '연산 엔진이 준비되지 않았습니다. 잠시만 기다려주세요...';
        return;
    }
    try {
        const recipesJson = await callWorker('get_all_items');
        const recipes = JSON.parse(recipesJson);
        renderRecipeTables(recipes);
        recipesRendered = true;
        document.getElementById('facilities-loading-hint').style.display = 'none';
    } catch (error) {
        console.error('레시피 데이터를 로드하지 못했습니다:', error);
        document.getElementById('facilities-loading-hint').textContent = '레시피 데이터를 불러오지 못했습니다. 페이지를 새로고침 해주세요.';
    }
}

window.closeFacilities = function() {
    document.getElementById('facilitiesModal').classList.remove('show');
}

window.closeFacilitiesOnBackdrop = function(event) {
    if (event.target.id === 'facilitiesModal') {
        closeFacilities();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedData = readStorage();
    initFacilityTiers(savedData);
    renderFacilityCards();
    populateHomeLevels();
    populateLevelUpTargets();
    loadInputsFromStorage(savedData);
    attachAutoSave();
    attachFacilityTierHandlers();
    attachModeHandlers();
    attachStrategyHandlers();
    applyConfigMode();
    initWasm();

    document.getElementById('optimize-btn').addEventListener('click', runFindPlan);
    document.getElementById('clear-saved-btn').addEventListener('click', clearSavedInputs);
    document.getElementById('rate-unit').addEventListener('change', updateRateUnitDisplays);
    document.getElementById('aniimo-best').addEventListener('change', () => showSelectedPlan(false));
    document.getElementById('aniimo-toggle').addEventListener('click', () => {
        const toggle = document.getElementById('aniimo-toggle');
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        document.getElementById('aniimo-body').hidden = !expanded;
    });
    document.getElementById('aniimo-minimum').addEventListener('change', () => showSelectedPlan(false));

    document.getElementById('target-amount').addEventListener('input', runTimeToGoal);
    document.getElementById('current-amount').addEventListener('input', runTimeToGoal);

    document.querySelectorAll('input').forEach(input => {
        if (input.id === 'target-amount' || input.id === 'current-amount') return;
        if (input.closest('#facilities-grid') || input.closest('#level-up-stock-grid')) return;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runFindPlan();
            }
        });
    });
});
