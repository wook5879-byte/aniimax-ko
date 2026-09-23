// Shared facility configuration, used by app.js for both the facility input cards and the
// facility recipe reference modal, so the two stay in sync automatically.

export const FACILITIES = [
    {
        name: 'Farmland', slug: 'farmland', defaultCount: 1, category: 'Materials',
        unlocks: { 1: 1, 2: 2, 3: 5, 4: 7, 5: 9, 6: 12, 7: 16 },
        counts: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42],
        tooltip: "Lv.1: 밀&#10;Lv.2: 감자, 속성 밀&#10;Lv.3: 쌀, 대두&#10;Lv.4: 장미, 목화, 속성 감자&#10;Lv.5: 딸기, 라벤더, 사탕수수&#10;Lv.6: 인삼, 포도, 최고급 밀, 속성 쌀&#10;Lv.7: 크랜베리, 용설란, 속성 딸기"
    },
    {
        name: 'Woodland', slug: 'woodland', defaultCount: 1, category: 'Materials',
        unlocks: { 1: 2, 2: 4, 3: 7, 4: 11, 5: 14, 6: 18 },
        counts: [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        tooltip: "Lv.1: 버드나무 목재&#10;Lv.2: 대나무, 레몬&#10;Lv.3: 벚꽃, 사과, 메이플 시럽, 속성 대나무&#10;Lv.4: 야자나무 껍질, 밤, 호두, 속성 레몬&#10;Lv.5: 천연 고무, 코코넛, 속성 메이플 시럽&#10;Lv.6: 카카오, 오렌지 꽃, 속성 코코넛&#10;부산물: 통나무"
    },
    {
        name: 'Mine', slug: 'mine', defaultCount: 1, category: 'Materials', hasWorker: true, ability: 'Earth', personality: 'Playful',
        unlocks: { 1: 3, 2: 6, 3: 9, 4: 12, 5: 15, 6: 18 },
        counts: [0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
        tooltip: "Lv.1: 암석&#10;Lv.2: 점토&#10;Lv.3: 조개껍데기&#10;Lv.4: 구리 광석&#10;Lv.5: 석영 광석&#10;Lv.6: 보석&#10;부산물: 광산 모래"
    },
    {
        name: 'Well', slug: 'well', defaultCount: 0, category: 'Materials', hasWorker: true, ability: 'Water', personality: 'Faithful',
        unlocks: { 1: 4, 2: 8, 3: 11, 4: 13, 5: 17 },
        counts: [0, 0, 0, 1, 1, 1, 1, 2],
        tooltip: "Lv.1: 우물물, 속성 우물물&#10;Lv.2: 깨끗한 물&#10;Lv.3: 속성 깨끗한 물&#10;Lv.4: 암반수, 속성 암반수&#10;Lv.5: 천연 광천수, 속성 천연 광천수"
    },
    {
        name: 'Tidewhisper Sandcastle', slug: 'tidewhisper-sandcastle', defaultCount: 0, category: 'Aniimo Materials', hasWorker: true, ability: 'Leisure', personality: 'Judicious',
        unlocks: { 1: 5, 2: 8, 3: 13 },
        counts: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 천일염&#10;Lv.2: 속성 천일염&#10;Lv.3: 진주 (따뜻함 필요)"
    },
    {
        name: 'Dewy House', slug: 'dewy-house', defaultCount: 0, category: 'Aniimo Materials', hasWorker: true, ability: 'Leisure', personality: 'Instinctive',
        unlocks: { 1: 6, 2: 11 },
        counts: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 자수정 정수&#10;Lv.2: 속성 자수정 정수"
    },
    {
        name: 'Nimbus Bed', slug: 'nimbus-bed', defaultCount: 0, category: 'Aniimo Materials', hasWorker: true, ability: 'Leisure', personality: 'Judicious',
        unlocks: { 1: 10, 2: 13, 3: 16 },
        counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 양털&#10;Lv.2: 속성 양털&#10;Lv.3: 꽃잎&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Starfall Hammock', slug: 'starfall-hammock', defaultCount: 0, category: 'Aniimo Materials', hasLevels: false, hasWorker: true, ability: 'Leisure', personality: 'Faithful',
        unlocks: { 1: 12 },
        counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "별 (서늘함 필요)&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Floral Windmill', slug: 'floral-windmill', defaultCount: 0, category: 'Aniimo Materials', hasLevels: false, hasWorker: true, ability: 'Leisure', personality: 'Nimble',
        unlocks: { 1: 18 },
        counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        tooltip: "비늘, 속성 비늘 (적정 환경 필요)&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Heat Furnace', slug: 'heat-furnace', defaultCount: 0, category: 'Environment', hasLevels: false,
        unlocks: { 1: 7 },
        counts: [0, 0, 0, 0, 0, 0, 1],
        tooltip: "작물에 따뜻함 또는 뜨거움 환경 조건을 제공합니다.&#10;계산기가 수익성이 높은 모드를 자동 선택합니다.&#10;주변 9x9 범위를 커버합니다."
    },
    {
        name: 'Cooling Unit', slug: 'cooling-unit', defaultCount: 0, category: 'Environment', hasLevels: false,
        unlocks: { 1: 7 },
        counts: [0, 0, 0, 0, 0, 0, 1],
        tooltip: "작물에 서늘함 또는 추움 환경 조건을 제공합니다.&#10;계산기가 수익성이 높은 모드를 자동 선택합니다.&#10;주변 9x9 범위를 커버합니다."
    },
    {
        name: 'Sunlamp', slug: 'sunlamp', defaultCount: 0, category: 'Environment', hasLevels: false,
        unlocks: { 1: 9 },
        counts: [0, 0, 0, 0, 0, 0, 0, 0, 1],
        tooltip: "작물에 적정 환경 조건을 제공합니다.&#10;주변 9x9 범위를 커버합니다."
    },
    {
        name: 'Carousel Mill', slug: 'carousel-mill', defaultCount: 1, category: 'Materials Processing', hasWorker: true, ability: 'Wind', personality: 'Tenacious',
        unlocks: { 1: 2, 2: 5, 3: 9, 4: 13, 5: 16, 6: 18 },
        counts: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 밀가루&#10;Lv.2: 두부, 쌀가루&#10;Lv.3: 라벤더 가루&#10;Lv.4: 쌀음료, 인삼 가루&#10;Lv.5: 박력분, 코코넛 오일&#10;Lv.6: 카카오 가루, 코코넛 밀크"
    },
    {
        name: 'Crafting Table', slug: 'crafting-table', defaultCount: 1, category: 'Materials Processing', hasWorker: true, ability: 'Artisanship', personality: 'Judicious',
        unlocks: { 1: 3, 2: 5, 3: 7, 4: 9, 5: 12, 6: 15, 7: 18, 8: 20 },
        counts: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 목조각&#10;Lv.2: 대나무 용기, 강돌 조각, 고급 강돌 조각&#10;Lv.3: 장미 디퓨저, 도자기, 고급 장미 디퓨저&#10;Lv.4: 꽃다발, 조개 장식, 라벤더 방향제&#10;Lv.5: 풍경, 별빛 등불, 드림캐처, 고급 풍경&#10;Lv.6: 고무오리, 진주 목걸이, 직조 인형, 백자&#10;Lv.7: 염료, 보석 가루, 보틀 플라워, 고급 보석 가루&#10;Lv.8: 인형"
    },
    {
        name: 'Claw Game Cooker', slug: 'claw-game-cooker', defaultCount: 1, category: 'Materials Processing', hasWorker: true, ability: 'Fire', personality: 'Practical',
        unlocks: { 1: 4, 2: 5, 3: 7, 4: 9, 5: 12, 6: 16, 7: 19 },
        counts: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 빵, 고급 빵&#10;Lv.2: 볶은 대두&#10;Lv.3: 메이플 맛탕, 사과 타르트, 장미 쇼트브레드&#10;Lv.4: 라벤더 쿠키, 탕후루 사과&#10;Lv.5: 포도 탕후루, 카라멜 견과류 칩&#10;Lv.6: 메이플 별사탕, 코코넛 쿠키&#10;Lv.7: 꽃빵, 베리 초코 코코넛 푸딩, 고급 베리 초코 코코넛 푸딩"
    },
    {
        name: 'Jukebox Dryer', slug: 'jukebox-dryer', defaultCount: 1, category: 'Materials Processing', hasWorker: true, ability: 'Dark', personality: 'Nimble',
        unlocks: { 1: 4, 2: 5, 3: 7, 4: 10, 5: 12, 6: 14, 7: 18 },
        counts: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 감자칩&#10;Lv.2: 건조 레몬 슬라이스&#10;Lv.3: 말린 벚꽃, 건두부&#10;Lv.4: 건조 사과 슬라이스, 건조 딸기&#10;Lv.5: 견과류, 건조 인삼&#10;Lv.6: 건포도, 코코넛 채&#10;Lv.7: 건조 크랜베리, 말린 꽃"
    },
    {
        name: 'Simmering Pot', slug: 'simmering-pot', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Fire', personality: 'Tenacious',
        unlocks: { 1: 5, 2: 7, 3: 9, 4: 12, 5: 15, 6: 18 },
        counts: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 쌀죽&#10;Lv.2: 장미 농축액&#10;Lv.3: 얼음사탕, 딸기잼, 메이플 사과잼&#10;Lv.4: 밤 퓌레, 포도잼, 인삼죽&#10;Lv.5: 메이플 덩어리당, 엿기름&#10;Lv.6: 코코넛 스프레드, 크랜베리잼, 용설란 시럽"
    },
    {
        name: 'Phonolfactory Table', slug: 'phonolfactory-table', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Perfumery', personality: 'Instinctive',
        unlocks: { 1: 6, 2: 7, 3: 10, 4: 14, 5: 17, 6: 19 },
        counts: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 대나무 선향&#10;Lv.2: 장미 향초, 벚꽃 향초&#10;Lv.3: 라벤더 향초, 레몬 향초, 고급 레몬 향초&#10;Lv.4: 한방 인삼 디퓨저&#10;Lv.5: 비누, 고급 비누&#10;Lv.6: 오렌지 꽃 향초, 조합 향수, 로션, 고급 조합 향수"
    },
    {
        name: 'Bouncy Brew Keg', slug: 'bouncy-brew-keg', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Water', personality: 'Energetic',
        unlocks: { 1: 6, 2: 9, 3: 13, 4: 17, 5: 19 },
        counts: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 보리차, 현미녹차&#10;Lv.2: 감자 크바스, 딸기주스, 사과주스, 사탕수수 즙&#10;Lv.3: 포도주스, 인삼차, 포도 레몬 에이드, 호두유&#10;Lv.4: 크랜베리주스, 코코넛 음료&#10;Lv.5: 용설란 음료, 핫코코아, 코코넛 코코아, 오렌지 꽃 이슬"
    },
    {
        name: 'Blazing Stove', slug: 'blazing-stove', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Fire', personality: 'Nimble',
        unlocks: { 1: 8, 2: 10, 3: 13, 4: 16, 5: 18 },
        counts: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 간장 볶음밥, 크림 감자 스프, 벚꽃 주먹밥, 고급 감자 스프&#10;Lv.2: 탕후루, 두부 간장 조림, 군밤&#10;Lv.3: 창펀, 인삼 밤빵, 호두과자&#10;Lv.4: 젤리, 딸기 사탕, 진한 포도 컴포트, 고급 젤리&#10;Lv.5: 딸기 슈크림, 크랜베리 초콜릿&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Pickling Jar', slug: 'pickling-jar', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Dark', personality: 'Playful',
        unlocks: { 1: 8, 2: 10, 3: 13, 4: 16, 5: 19 },
        counts: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 간장, 벚꽃 소금 절임&#10;Lv.2: 식혜, 사과 식초, 고급 단술&#10;Lv.3: 쌀식초, 소금 꿀레몬, 고급 소금 꿀레몬&#10;Lv.4: 딸기 정과&#10;Lv.5: 오렌지 꽃 정과&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Joy Wheel Loom', slug: 'joy-wheel-loom', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Wind', personality: 'Faithful',
        unlocks: { 1: 7, 2: 10, 3: 15, 4: 19 },
        counts: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        tooltip: "Lv.1: 면실&#10;Lv.2: 모사, 면직물&#10;Lv.3: 야자 밧줄, 모직물&#10;Lv.4: 염색 면직물&#10;게임 내 미검증 데이터"
    },
    {
        name: 'Woodworking Bench', slug: 'woodworking-bench', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Artisanship', personality: 'Energetic',
        unlocks: { 1: 6, 2: 10, 3: 14, 4: 18 },
        counts: [0, 0, 0, 0, 0, 1],
        tooltip: "Lv.1: 거친 목재&#10;Lv.2: 규격 판자&#10;Lv.3: 집성재 보&#10;Lv.4: 고밀도 목재 부품&#10;통나무를 영지 레벨업 재료로 가공합니다."
    },
    {
        name: 'Chimney Kiln', slug: 'chimney-kiln', defaultCount: 0, category: 'Materials Processing', hasWorker: true, ability: 'Fire', personality: 'Practical',
        unlocks: { 1: 6, 2: 10, 3: 14, 4: 18 },
        counts: [0, 0, 0, 0, 0, 1],
        tooltip: "Lv.1: 굵게 선별된 광석&#10;Lv.2: 소결 광석 벽돌&#10;Lv.3: 정제 광석&#10;Lv.4: 미세결정 광석 판재&#10;광산 모래를 영지 레벨업 재료로 가공합니다."
    },
];

export const LEVEL_UP_COSTS = {
    7: { coins: 69000, items: [['rough_lumber', 290], ['coarse_sifted_ore', 360]] },
    8: { coins: 180000, items: [['rough_lumber', 1100], ['coarse_sifted_ore', 640]] },
    9: { coins: 260000, items: [['rough_lumber', 1520], ['coarse_sifted_ore', 800]] },
    10: { coins: 510000, items: [['rough_lumber', 2000], ['coarse_sifted_ore', 2400]] },
    11: { coins: 680000, items: [['standard_planks', 320], ['sintered_ore_brick', 350]] },
    12: { coins: 1060000, items: [['standard_planks', 910], ['sintered_ore_brick', 480]] },
    13: { coins: 1930000, items: [['standard_planks', 1230], ['sintered_ore_brick', 760]] },
    14: { coins: 2620000, items: [['standard_planks', 1590], ['sintered_ore_brick', 1060]] },
    15: { coins: 3760000, items: [['laminated_beams', 390], ['refined_ore', 150]] },
    16: { coins: 4900000, items: [['laminated_beams', 480], ['refined_ore', 310]] },
    17: { coins: 8630000, items: [['laminated_beams', 630], ['refined_ore', 380]] },
    18: { coins: 11600000, items: [['laminated_beams', 800], ['refined_ore', 520]] },
    19: { coins: 17100000, items: [['densified_timber_component', 400], ['microcrystalline_ore_plate', 220]] },
    20: { coins: 20800000, items: [['densified_timber_component', 490], ['microcrystalline_ore_plate', 270]] },
};

export const LEVEL_UP_CHAINS = [
    ['wood_block', 'rough_lumber', 'standard_planks', 'laminated_beams', 'densified_timber_component'],
    ['mineral_sand', 'coarse_sifted_ore', 'sintered_ore_brick', 'refined_ore', 'microcrystalline_ore_plate'],
];

export const FACILITY_CATEGORIES = ['Materials', 'Environment', 'Aniimo Materials', 'Materials Processing'];

export const FACILITY_CATEGORY_BY_NAME = new Map(FACILITIES.map(f => [f.name, f.category]));

export const MAX_HOME_LEVEL = 20;

export const MODULE_MAX_LEVELS = {
    ecological_module: [0, 0, 1, 1, 1, 1, 2, 3, 3, 3, 4, 5, 5, 6, 6, 6, 7, 8, 8, 8],
    kitchen_module: [0, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7],
    resource_detector: [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8],
    crafting_module: [0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4, 5, 6, 7, 7],
};

function atHomeLevel(list, homeLevel) {
    return list[Math.min(homeLevel, list.length) - 1];
}

export const ANIIMO_MAX = [null, 8, 11, 14, 17, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 43, 44, 45];

export const COUNTS_CONFIRMED_UP_TO = 8;

export function simpleSetup(homeLevel) {
    const facilities = {};
    FACILITIES.forEach(f => {
        const unlocked = Object.entries(f.unlocks || {})
            .filter(([, need]) => need <= homeLevel)
            .map(([level]) => Number(level));
        if (unlocked.length === 0) {
            facilities[f.name] = [{ count: 0, level: 1 }];
            return;
        }
        facilities[f.name] = [{ count: atHomeLevel(f.counts, homeLevel), level: Math.max(...unlocked) }];
    });
    const modules = Object.fromEntries(
        Object.entries(MODULE_MAX_LEVELS).map(([module, caps]) => [module, atHomeLevel(caps, homeLevel)])
    );
    return { facilities, modules };
}
