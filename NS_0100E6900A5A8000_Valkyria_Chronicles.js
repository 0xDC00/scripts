// ==UserScript==
// @name [0100E6900A5A8000] Valkyria Chronicles
// @version 1.0.0
// @author Raiko
// @description Yuzu
// * SEGA
// *
// ==/UserScript==
//
// Build ID: 982FA5077736F0C28055BB7F122DDB7F
// ARM32 / A32
//
// Coverage includes:
// - Subtitles, speaker nametags and story dialogue
// - Tutorial/System text
// - Book Mode
// - Battle/deployment text, Orders, Potentials and victory/defeat conditions
// - Headquarters Barracks semantic unit/weapon/affinity/Potential/Order text
// - Headquarters Command Room selected-unit summary + Potential description
// - Headquarters Training Ground selected class/unit/Potential description
// - Headquarters R&D development/model text + weapon/vehicle/optional-part stats
// - Headquarters Castlefront Street selected headline + article body
// - Audience Chamber
//
// Direct setHook() addresses (32):
//   0x23D1DC  story dialogue text window
//   0x23D23C  resolved speaker-name path A
//   0x23D2D0  resolved speaker-name path B
//   0x27AE78  cinematic subtitle activation
//   0x1CA54C  SystemWin first visible page
//   0x1CA728  SystemWin next visible page
//   0x32CF54  briefing condition build begin
//   0x32D2F4  briefing win/lose labels
//   0x32D2A8  briefing victory condition
//   0x32D1CC  briefing defeat condition
//   0x338B9C  briefing condition modal open
//   0x3309B0  deployment refresh begin
//   0x336F40  deployment Potential/equipment page entry
//   0x330AEC  deployment refresh end / semantic emit
//   0x1C9440  shared common-text dispatcher
//   0x319958  shared full-detail dispatcher
//   0x319D64  shared R&D numeric dispatcher
//   0x1C9F40  battle-command activation
//   0x30C1C4  shared selection-refresh dispatcher
//   0x30E3DC  shared right-side selection dispatcher
//   0x14E898  battlefield hovered unit/vehicle name
//   0x1422FC  battlefield context / menu path
//   0x15705C  battlefield context / unit-list path
//   0x153AF8  battlefield Order-name resolver return
//   0x154E2C  battlefield selected Order description
//   0x23EBA0  shared message resolver entry
//   0x23EC60  shared message resolver success
//   0x23EC40  shared message resolver failure
//   0x315E8C  War Cemetery taught Order name
//   0x315ED8  War Cemetery taught Order description
//   0x83894   combat Potential activation resolved-name path A
//   0x83E1C   combat Potential activation resolved-name path B
//
globalThis.ARM = true;

const { setHook } = require('./libYuzu.js');


const GUEST_BASE = 0x204000;

function getAslrOffset() {
    try {
        const value = sessionStorage.getItem('ASLR_Offset');

        if (value === null || value === undefined)
            return null;

        if (typeof value === 'number')
            return value >>> 0;

        const s = String(value).trim();
        const n = /^0x/i.test(s) ? parseInt(s, 16) : Number(s);

        return Number.isFinite(n) ? (n >>> 0) : null;
    } catch (_) {
        return null;
    }
}

function normalizedLR(regs) {
    const aslr = getAslrOffset();

    if (aslr === null)
        return null;

    return ((regs[14].vm >>> 0) - aslr - GUEST_BASE) >>> 0;
}

function readNullableU32(host, off) {
    try {
        if (!host || host.isNull())
            return null;

        return host.add(off).readU32() >>> 0;
    } catch (_) {
        return null;
    }
}

function sendText(text) {
    if (text)
        trans.send(text);
}


//#region SHARED HELPERS

function threadId() {
    return Process.getCurrentThreadId();
}

function readU32(host, off) {
    try {
        return host.add(off).readU32() >>> 0;
    } catch (_) {
        return 0;
    }
}

function readS8(host, off) {
    try {
        return host.add(off).readS8();
    } catch (_) {
        return 0;
    }
}

function cleanText(s) {
    if (!s)
        return null;

    s = s
        .replace(/@fc[0-9a-fA-F]+:/g, '')
        .replace(/@fci:/g, '');

    return s.length ? s : null;
}

function readShiftJisPtr(ptr) {
    try {
        if (!ptr || ptr.isNull())
            return null;

        const s = ptr.readShiftJisString();
        return s && s.length ? s : null;
    } catch (_) {
        return null;
    }
}

function readCleanShiftJisPtr(ptr) {
    return cleanText(readShiftJisPtr(ptr));
}

function readCleanShiftJisReg(reg) {
    if (!reg)
        return null;

    return readCleanShiftJisPtr(reg.value);
}


//#endregion

//#region STORY DIALOGUE + SPEAKER NAMES

const speakerNames = new Map();
const pendingTalkByThread = new Map();

function validSpeakerId(id) {
    id >>>= 0;
    return id !== 0xFFFFFFFF && id < 0x10000;
}

function formatTalk(name, text) {
    if (!text)
        return null;

    return name ? `${name}\n${text}` : text;
}

function storyTalkWindow(regs) {
    const tid = threadId();
    const speakerId = regs[2].vm >>> 0;
    const text = readShiftJisPtr(regs[1].value);

    if (!text || !validSpeakerId(speakerId))
        return null;

    const knownName = speakerNames.get(speakerId);

    if (knownName) {
        pendingTalkByThread.delete(tid);
        return formatTalk(knownName, text);
    }

    pendingTalkByThread.set(tid, {
        speakerId,
        text,
    });

    return null;
}

function storySpeakerNameResolved(regs) {
    const tid = threadId();
    const pending = pendingTalkByThread.get(tid);

    if (!pending)
        return null;

    const name = readShiftJisPtr(regs[0].value);

    if (!name)
        return null;

    speakerNames.set(pending.speakerId, name);
    pendingTalkByThread.delete(tid);

    return formatTalk(name, pending.text);
}


//#endregion

//#region CINEMATIC SUBTITLES

function cinematicSubtitle(regs) {
    try {
        const slotHost = regs[5].value;
        const nodeGuest = slotHost.readU32() >>> 0;

        if (nodeGuest === 0)
            return null;

        const fastmemBase = slotHost.sub(regs[5].vm);
        const nodeHost = fastmemBase.add(nodeGuest);

        return readShiftJisPtr(nodeHost);
    } catch (_) {
        return null;
    }
}


//#endregion

//#region TUTORIAL / SYSTEM WINDOWS
//
// SystemWin +0x98 -> paginator
// paginator +0x10 -> current visible page
//
// 0x1CA54C fires twice for the same first page. Suppress only that proven
// duplicate for the same live object + same page.

const systemFirstPageSeen = new Map();

function readSystemCurrentPage(regs, objectRegister) {
    try {
        const objGuest = regs[objectRegister].vm >>> 0;
        const objHost = regs[objectRegister].value;

        if (objGuest === 0 || objHost.isNull())
            return null;

        const fastmemBase = objHost.sub(objGuest);

        const parserGuest = objHost.add(0x98).readU32() >>> 0;
        if (parserGuest === 0)
            return null;

        const parserHost = fastmemBase.add(parserGuest);

        const pageGuest = parserHost.add(0x10).readU32() >>> 0;
        if (pageGuest === 0)
            return null;

        const pageHost = fastmemBase.add(pageGuest);
        const text = readCleanShiftJisPtr(pageHost);

        if (!text)
            return null;

        return {
            objGuest,
            text,
        };
    } catch (_) {
        return null;
    }
}

function systemFirstPage(regs) {
    const info = readSystemCurrentPage(regs, 0);

    if (!info)
        return null;

    if (systemFirstPageSeen.get(info.objGuest) === info.text)
        return null;

    systemFirstPageSeen.set(info.objGuest, info.text);
    return info.text;
}

function systemNextPage(regs) {
    const info = readSystemCurrentPage(regs, 4);

    if (!info)
        return null;

    systemFirstPageSeen.delete(info.objGuest);
    return info.text;
}


//#endregion

//#region BRIEFING VICTORY / DEFEAT CONDITIONS
//
// BIFE builds the condition strings once, then BriefingIFMain reuses them.
// Cache by the owning BriefingIFMain object and emit on every actual
// 「勝利条件確認」 open event.
//
// Note: The automatic objectives popup may not be captured the first time it
// appears after briefing dialogue. Reopening it normally captures the text.

const conditionBuildByThread = new Map();
const conditionCacheByParent = new Map();

function getConditionCache(parentGuest) {
    let cache = conditionCacheByParent.get(parentGuest);

    if (!cache) {
        cache = {
            winLabel: null,
            victory: null,
            loseLabel: null,
            defeats: new Map(),
        };

        conditionCacheByParent.set(parentGuest, cache);
    }

    return cache;
}

function beginConditionBuild(regs) {
    try {
        const bifeHost = regs[0].value;
        const parentGuest = readU32(bifeHost, 0x14);

        if (parentGuest < 0x10000)
            return;

        conditionBuildByThread.set(threadId(), { parentGuest });

        getConditionCache(parentGuest);
    } catch (_) {}
}

function currentConditionCache() {
    const build = conditionBuildByThread.get(threadId());

    if (!build)
        return null;

    return getConditionCache(build.parentGuest);
}

function collectConditionLabel(regs) {
    const cache = currentConditionCache();

    if (!cache)
        return;

    const index = regs[9].vm >>> 0;

    if (index !== 0 && index !== 3)
        return;

    const text = readCleanShiftJisReg(regs[0]);

    if (!text)
        return;

    if (index === 0)
        cache.winLabel = text;
    else
        cache.loseLabel = text;

}

function collectVictoryCondition(regs) {
    const cache = currentConditionCache();

    if (!cache)
        return;

    const text = readCleanShiftJisReg(regs[0]);

    if (text)
        cache.victory = text;
}

function collectDefeatCondition(regs) {
    const cache = currentConditionCache();

    if (!cache)
        return;

    const text = readCleanShiftJisReg(regs[0]);

    if (!text || text === '―')
        return;

    const listIndex = regs[11].vm >>> 0;
    cache.defeats.set(listIndex, text);
}

function formatBriefingConditions(cache) {
    if (!cache.winLabel ||
        !cache.victory ||
        !cache.loseLabel ||
        cache.defeats.size === 0) {
        return null;
    }

    const defeats = [...cache.defeats.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, text]) => text);

    return [
        cache.winLabel,
        cache.victory,
        cache.loseLabel,
        ...defeats,
    ].join('\n');
}

function briefingConditionOpen(regs) {
    try {
        const parentGuest = regs[0].vm >>> 0;
        const parentHost = regs[0].value;
        const eventHost = regs[1].value;

        // Modal/child activation.
        if (readU32(eventHost, 0x00) !== 0x104)
            return null;

        // Stable BriefingIFMain menu state.
        if (readU32(parentHost, 0x68) !== 10)
            return null;

        // Menu index 2 = 勝利条件確認.
        if (readU32(parentHost, 0xA0) !== 2)
            return null;

        const cache = conditionCacheByParent.get(parentGuest);

        if (!cache)
            return null;

        return formatBriefingConditions(cache);
    } catch (_) {
        return null;
    }
}


//#endregion

//#region IN-BATTLE COMMAND MENU / CONDITIONS

// In-battle command menu + repeatable direct current-battle conditions.
//
// 0x1C9EA0 is a shared battle-help caller. Production accepts ONLY the
// runtime-validated exact descriptions below instead of reviving a generic
// battle-help dump.
//
// Selection identity comes from the exact top-level help text. 0x1C9F40 is the
// semantic A-activation callback and fires again when the same item is reopened
// without moving the cursor. Victory/defeat text is reconstructed directly from
// persistent battle state, so no briefing cache or timing window is required.

const COMBAT_CONDITION_HELP = '戦闘の勝利条件、敗北条件を確認します。';

const BATTLE_COMMAND_MENU_HELP = new Map([
    [
        'フェイズを終了して、敵のフェイズに移行します。',
        { id: 1, label: 'フェイズ終了' },
    ],
    [
        'ウェルキンが習得しているオーダーを発令します。',
        { id: 2, label: 'オーダー' },
    ],
    [
        COMBAT_CONDITION_HELP,
        { id: 3, label: '勝利条件確認' },
    ],
    [
        'ゲーム中の設定を変更したり、ゲームの進行状況を保存します。',
        { id: 4, label: 'システム' },
    ],
]);

const BATTLE_SYSTEM_MENU_HELP = new Map([
    [
        'ゲームの進行状況を本体保存メモリーに保存します。',
        'セーブ',
    ],
    [
        'セーブデータを読み込みます。',
        'ロード',
    ],
    [
        'ゲーム中の設定を変更します。',
        'オプション',
    ],
    [
        'タイトル画面へ戻ります。保存していない情報は失われます。',
        'タイトル',
    ],
]);

const COMBAT_CONDITIONS_ID = 3;
const COMBAT_CONDITION_MAIN_GOT_STATIC = 0x951BE4;
const COMBAT_CONDITION_RESOLVER_GOT_STATIC = 0x953248;
const COMBAT_CONDITION_MAX_HASH_PROBES = 512;

let battleCommandMenuLast = '';
let battleCommandMenuLastTime = 0;
let battleSystemMenuArmed = false;
let battleSystemMenuLast = '';
let battleSystemMenuLastTime = 0;

let combatSelectedCommandId = null;
let combatFastmemBase = null;
let combatAslr = null;

function combatGuestU32(base, guest, off = 0) {
    if (!base || base.isNull() || !guest)
        return null;

    try {
        return readNullableU32(base.add(guest >>> 0), off);
    } catch (_) {
        return null;
    }
}

function combatReadGuestShiftJis(base, guest) {
    if (!base || base.isNull() || !guest || guest < 0x10000)
        return null;

    try {
        const s = readCleanShiftJisPtr(base.add(guest >>> 0));
        return s ? s.replace(/\r/g, '').trim() : null;
    } catch (_) {
        return null;
    }
}

function combatModuleGuest(staticOffset, aslr) {
    return (GUEST_BASE + aslr + staticOffset) >>> 0;
}

function combatParseNumericKey(text) {
    if (!text || !/^\d{8}$/.test(text))
        return null;

    const n = Number(text);
    return Number.isFinite(n) ? (n >>> 0) : null;
}

// JS port of the game's 0x398394 / 0x398450 hash lookup for column 0.
function combatResolveNumericKey(base, tableGuest, numericId) {
    if (!tableGuest || tableGuest < 0x10000)
        return null;

    const metaGuest = combatGuestU32(base, tableGuest, 0x04);
    if (!metaGuest)
        return null;

    const bucketCount = combatGuestU32(base, metaGuest, 0x04);

    if (bucketCount === null || bucketCount === 0 || bucketCount > 0x100000)
        return null;

    const slotsGuest = combatGuestU32(base, tableGuest, 0x18);
    if (!slotsGuest)
        return null;

    const probes = Math.min(bucketCount, COMBAT_CONDITION_MAX_HASH_PROBES);

    for (let probe = 0; probe < probes; probe++) {
        const bucket = (numericId + probe) % bucketCount;
        const slotGuest = (slotsGuest + bucket * 8) >>> 0;
        const storedId = combatGuestU32(base, slotGuest, 0x00);

        if (storedId === null || storedId === 0xFFFFFFFF)
            return null;

        if (storedId !== numericId)
            continue;

        const rowIndex = combatGuestU32(base, slotGuest, 0x04);

        if (
            rowIndex === null ||
            rowIndex === 0xFFFFFFFF ||
            rowIndex >= bucketCount
        ) {
            return null;
        }

        const indexArrayGuest = combatGuestU32(base, tableGuest, 0x0C);
        const rowBaseGuest = combatGuestU32(base, tableGuest, 0x10);
        const blobGuest = combatGuestU32(base, tableGuest, 0x14);

        if (!indexArrayGuest || !rowBaseGuest || !blobGuest)
            return null;

        const rowWordIndex = combatGuestU32(
            base,
            indexArrayGuest,
            rowIndex * 4
        );

        if (rowWordIndex === null)
            return null;

        const rowGuest = (rowBaseGuest + rowWordIndex * 4) >>> 0;
        let encodedOffset = combatGuestU32(base, rowGuest, 0x04);

        if (encodedOffset === null)
            return null;

        encodedOffset &= ~3;

        const textGuest = (blobGuest + encodedOffset + 4) >>> 0;
        return combatReadGuestShiftJis(base, textGuest);
    }

    return null;
}

function readCurrentCombatConditionBlock(base, aslr) {
    if (!base || base.isNull() || aslr === null)
        return null;

    const mainGotGuest =
        combatModuleGuest(COMBAT_CONDITION_MAIN_GOT_STATIC, aslr);

    const resolverGotGuest =
        combatModuleGuest(COMBAT_CONDITION_RESOLVER_GOT_STATIC, aslr);

    // Both static locations are relocated GOT entries:
    // GOT -> global slot -> singleton object.
    const mainSlotGuest = combatGuestU32(base, mainGotGuest, 0x00);
    const resolverSlotGuest = combatGuestU32(base, resolverGotGuest, 0x00);

    if (!mainSlotGuest || !resolverSlotGuest)
        return null;

    const mainGuest = combatGuestU32(base, mainSlotGuest, 0x00);
    const resolverGuest = combatGuestU32(base, resolverSlotGuest, 0x00);

    if (!mainGuest || !resolverGuest)
        return null;

    const stateRootGuest = (mainGuest + 0x1140) >>> 0;

    const battleStateGuest =
        combatGuestU32(base, stateRootGuest, 0x04);

    const missionObjGuest =
        combatGuestU32(base, stateRootGuest, 0x294);

    if (!battleStateGuest || !missionObjGuest)
        return null;

    const victoryIndex =
        combatGuestU32(base, battleStateGuest, 0x1C);

    const defeatMask =
        combatGuestU32(base, battleStateGuest, 0x20);

    if (
        victoryIndex === null ||
        victoryIndex > 0x40 ||
        defeatMask === null
    ) {
        return null;
    }

    const condObjGuest =
        combatGuestU32(base, missionObjGuest, 0x6F8);

    if (!condObjGuest)
        return null;

    const keyBaseGuest =
        combatGuestU32(base, condObjGuest, 0x08);

    const tableGuest =
        combatGuestU32(base, resolverGuest, 0x1148);

    if (!keyBaseGuest || !tableGuest)
        return null;

    const victoryKeyGuest = combatGuestU32(
        base,
        keyBaseGuest,
        0x5C + victoryIndex * 4
    );

    const victoryKey = victoryKeyGuest
        ? combatReadGuestShiftJis(base, victoryKeyGuest)
        : null;

    const victoryId = combatParseNumericKey(victoryKey);

    const victory = victoryId === null
        ? null
        : combatResolveNumericKey(base, tableGuest, victoryId);

    if (!victory)
        return null;

    const defeats = [];

    for (let i = 0; i < 5; i++) {
        if ((defeatMask & (1 << i)) === 0)
            continue;

        const keyGuest =
            combatGuestU32(base, keyBaseGuest, 0x68 + i * 4);

        if (!keyGuest)
            continue;

        const key = combatReadGuestShiftJis(base, keyGuest);
        const numericId = combatParseNumericKey(key);

        if (numericId === null)
            continue;

        const resolved =
            combatResolveNumericKey(base, tableGuest, numericId);

        if (resolved && resolved !== '―')
            defeats.push(resolved);
    }

    if (defeats.length === 0)
        return null;

    return [
        '勝利条件',
        victory,
        '敗北条件',
        ...defeats,
    ].join('\n');
}

function rememberCombatFastmem(regs) {
    try {
        const guest = regs[0].vm >>> 0;
        const host = regs[0].value;
        const aslr = getAslrOffset();

        if (
            guest < 0x10000 ||
            !host ||
            host.isNull() ||
            aslr === null
        ) {
            return;
        }

        combatFastmemBase = host.sub(guest);
        combatAslr = aslr;
    } catch (_) {}
}

function battleCommandActivation() {
    if (combatSelectedCommandId !== COMBAT_CONDITIONS_ID)
        return;

    if (!combatFastmemBase || combatAslr === null)
        return;

    const block = readCurrentCombatConditionBlock(
        combatFastmemBase,
        combatAslr
    );

    if (block)
        sendText(block);
}

function routeBattleCommandAndSystemHelp(caller, text, regs) {
    if (caller !== 0x1C9EA0)
        return false;

    const item = BATTLE_COMMAND_MENU_HELP.get(text);

    if (item) {
        // Selection state must update even when the visible help line itself is
        // suppressed as an immediate redraw duplicate.
        combatSelectedCommandId = item.id;
        rememberCombatFastmem(regs);

        // Entering another top-level item leaves the System submenu context.
        battleSystemMenuArmed = item.label === 'システム';

        const out = `【${item.label}】 ${text}`;
        const now = Date.now();

        if (!(
            out === battleCommandMenuLast &&
            (now - battleCommandMenuLastTime) < 180
        )) {
            battleCommandMenuLast = out;
            battleCommandMenuLastTime = now;
            sendText(out);
        }

        return true;
    }

    if (!battleSystemMenuArmed)
        return false;

    const systemItem = BATTLE_SYSTEM_MENU_HELP.get(text);

    if (!systemItem)
        return false;

    const out = `【${systemItem}】 ${text}`;
    const now = Date.now();

    if (!(
        out === battleSystemMenuLast &&
        (now - battleSystemMenuLastTime) < 180
    )) {
        battleSystemMenuLast = out;
        battleSystemMenuLastTime = now;
        sendText(out);
    }

    return true;
}


//#endregion

//#region DEPLOYMENT SELECTED-UNIT INFO
//
// +0xBC page:
//   0 = infantry basic info (LV / HP / AP)
//   1 = Potentials
//   2 = equipment
//   3 = tank-commander basic info (BHP / LHP / AP; Welkin / Zaka)
//
// The selected unit's name is emitted once when recordIndex changes.
// L/R page changes for the same unit do not repeat the name.

const LABEL_LV = 'LV';
const LABEL_HP = 'HP';
const LABEL_BHP = 'BHP';
const LABEL_LHP = 'LHP';
const LABEL_AP = 'AP';
const LABEL_AFFINITY = '相性';

const deploymentCommonByThread = new Map();
const deploymentPageByParent = new Map();
const deploymentLastNamedRecordByParent = new Map();

function deploymentSelectionInfo(parentHost, parentGuest) {
    const selected = readU32(parentHost, 0xA4);
    const mode = readU32(parentHost, 0xBC);

    const slot = parentHost.add(selected * 40);
    const recordIndex = readU32(slot, 0x314);

    return {
        parentGuest: parentGuest >>> 0,
        selected,
        mode,
        recordIndex,
    };
}

function beginDeploymentRefresh(regs) {
    try {
        const info = deploymentSelectionInfo(
            regs[0].value,
            regs[0].vm >>> 0
        );

        deploymentCommonByThread.set(threadId(), {
            ...info,
            texts: [],
        });
    } catch (_) {}
}

function collectDeploymentCommonText(regs) {
    const state = deploymentCommonByThread.get(threadId());

    if (!state)
        return;

    const text = readCleanShiftJisReg(regs[2]);

    // The refresh clears widgets before assigning their real values.
    if (!text)
        return;

    state.texts.push(text);
}

function collectDeploymentPageEntry(regs) {
    try {
        const parentGuest = regs[6].vm >>> 0;
        const parentHost = regs[6].value;
        const info = deploymentSelectionInfo(parentHost, parentGuest);

        if (info.mode !== 1 && info.mode !== 2)
            return;

        const entry = regs[5].vm >>> 0;
        const text = readCleanShiftJisReg(regs[7]);

        if (!text || text === '―')
            return;

        let state = deploymentPageByParent.get(parentGuest);

        if (!state ||
            state.mode !== info.mode ||
            state.recordIndex !== info.recordIndex) {
            state = {
                mode: info.mode,
                recordIndex: info.recordIndex,
                selected: info.selected,
                entries: new Map(),
            };

            deploymentPageByParent.set(parentGuest, state);
        }

        state.entries.set(entry, text);
    } catch (_) {}
}

function deploymentShouldIncludeName(state) {
    return deploymentLastNamedRecordByParent.get(state.parentGuest) !==
        state.recordIndex;
}

function deploymentMarkNameEmitted(state) {
    deploymentLastNamedRecordByParent.set(
        state.parentGuest,
        state.recordIndex
    );
}

function isDeploymentStatValue(text) {
    if (!text)
        return false;

    // Runtime-validated LV / HP / AP and BHP / LHP / AP fields are plain
    // decimal numbers.  Reject partial redraws where affinity/name text shifts
    // into one of these positions.
    return /^[0-9０-９]+$/.test(text);
}

function formatDeploymentBasic(state, includeName) {
    // Runtime-validated first-page layouts:
    //
    // Infantry (mode 0):
    //   name, class, LV, HP, AP, affinity...
    //
    // Tank commanders Welkin / Zaka (mode 3):
    //   name, class, BHP, LHP, AP, affinity...
    //
    // Both layouts use the same text-write callers and ordering.  The
    // difference is the page mode and the meaning of numeric fields 2/3.
    if (state.texts.length < 5)
        return null;

    const name = state.texts[0];
    const className = state.texts[1];
    const valueA = state.texts[2];
    const valueB = state.texts[3];
    const ap = state.texts[4];
    const affinities = state.texts.slice(5);

    // A partial redraw can begin at class instead of name.  Without this
    // guard the fields shift left, producing garbage such as:
    //   20  LV300 HP900 APテッド
    // Suppress that redraw and wait for the next complete semantic refresh.
    if (!isDeploymentStatValue(valueA) ||
        !isDeploymentStatValue(valueB) ||
        !isDeploymentStatValue(ap)) {
        return null;
    }

    const lines = [];

    if (includeName && name)
        lines.push(name);

    if (state.mode === 3) {
        lines.push(
            `${className}  ${LABEL_BHP}${valueA} ${LABEL_LHP}${valueB} ${LABEL_AP}${ap}`
        );
    }
    else {
        lines.push(
            `${className}  ${LABEL_LV}${valueA} ${LABEL_HP}${valueB} ${LABEL_AP}${ap}`
        );
    }

    if (affinities.length > 0)
        lines.push(`${LABEL_AFFINITY} ${affinities.join(', ')}`);

    return lines.join('\n');
}

function endDeploymentRefresh() {
    const tid = threadId();
    const state = deploymentCommonByThread.get(tid);

    if (!state)
        return null;

    deploymentCommonByThread.delete(tid);

    const includeName = deploymentShouldIncludeName(state);
    const name = state.texts.length ? state.texts[0] : null;

    if (state.mode === 0 || state.mode === 3) {
        const output = formatDeploymentBasic(state, includeName);

        if (!output)
            return null;

        if (includeName)
            deploymentMarkNameEmitted(state);

        return output;
    }

    if (state.mode !== 1 && state.mode !== 2)
        return null;

    const page = deploymentPageByParent.get(state.parentGuest);

    if (!page ||
        page.mode !== state.mode ||
        page.recordIndex !== state.recordIndex ||
        page.entries.size === 0) {
        return null;
    }

    deploymentPageByParent.delete(state.parentGuest);

    const entries = [...page.entries.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, text]) => text);

    const lines = [];

    if (includeName && name)
        lines.push(name);

    lines.push(...entries);

    if (lines.length === 0)
        return null;

    if (includeName)
        deploymentMarkNameEmitted(state);

    return lines.join('\n');
}


//#endregion

//#region ORDERS
//
// 0x153AF8 caches each resolved Order name silently.
// 0x154E2C fires with the currently selected Order description.
// wrapper +0x00 -> Order record
// record  +0x24 -> signed 8-bit CP cost

const orderNameByWrapper = new Map();

function cacheOrderName(regs) {
    try {
        const name = readCleanShiftJisReg(regs[0]);

        if (!name)
            return;

        const wrapperGuest = regs[7].vm >>> 0;

        if (wrapperGuest < 0x10000)
            return;

        orderNameByWrapper.set(wrapperGuest, name);
    } catch (_) {}
}

function selectedOrder(regs) {
    try {
        const description = readCleanShiftJisReg(regs[0]);

        if (!description)
            return null;

        const wrapperGuest = regs[4].vm >>> 0;
        const wrapperHost = regs[4].value;

        if (wrapperGuest < 0x10000)
            return null;

        const name = orderNameByWrapper.get(wrapperGuest);

        if (!name)
            return null;

        const recordGuest = readU32(wrapperHost, 0x00);

        if (recordGuest < 0x10000)
            return null;

        const fastmemBase = wrapperHost.sub(wrapperGuest);
        const recordHost = fastmemBase.add(recordGuest);
        const cp = readS8(recordHost, 0x24);

        return `${name}  CP${cp}\n${description}`;
    } catch (_) {
        return null;
    }
}



//#endregion

//#region WAR CEMETERY / 戦没者墓地 — TAUGHT ORDER
//
// Ordinary Cemetery conversation is handled by the normal story/speaker hooks.
//
// Cemetery-specific resolver returns:
//   0x315E8C -> taught Order name
//   0x315ED8 -> taught Order description
//
// Validated example:
//   支援狙撃要請
//   選択した「敵歩兵」１人にダメージを与える。
//
// The later learn/confirm window reuses the already-resolved Order name through
// its ^w20^ substitution token, so it does not need a second text hook.

let cemeteryOrderName = '';

function cacheCemeteryOrderName(regs) {
    const name = readCleanShiftJisReg(regs[0]);

    if (!name)
        return;

    cemeteryOrderName = name;
}

function cemeteryOrderDescription(regs) {
    const description = readCleanShiftJisReg(regs[0]);

    if (!description)
        return null;

    if (!cemeteryOrderName)
        return description;

    return `${cemeteryOrderName}\n${description}`;
}


//#endregion

//#region CONTEXT / SHARED DISPATCH
//
// 0x1C9440, 0x319958, and 0x319D64 are shared by many systems. The final
// script keeps exactly one hook at each address and routes by caller + known UI
// context so independent features cannot overwrite one another.

const HQ_AREAS = new Set([
    '第７小隊宿舎',
    '作戦指令室',
    '訓練場',
    '研究開発所',
    '城前大通り',
    '戦没者墓地',
    '謁見の間',
    'ブックモード',
]);

const HQ_AREA_TRACK_CALLERS = new Set([
    0x2C1FB0,
    0x2C20D8,
    0x2C21AC,
    0x319580,
]);

let currentHqArea = null;
let lastHqDestinationHelp = '';
let lastHqDestinationHelpTime = 0;

function resetContextForArea(area) {
    if (area === '第７小隊宿舎')
        resetBarracksState();
    else if (area === '作戦指令室')
        resetCommandRoomState();
    else if (area === '訓練場')
        resetTrainingState();
    else if (area === '研究開発所')
        resetRdState();
    else if (area === '城前大通り')
        resetStreetState();
    else if (area === 'ブックモード')
        resetBookStates();
}

function setHqArea(area) {
    if (currentHqArea === area)
        return;

    const previous = currentHqArea;

    if (previous !== null)
        resetContextForArea(previous);
    else if (area !== null)
        resetBattlePotentialState();

    currentHqArea = area;

    if (area !== null)
        resetContextForArea(area);
    else
        resetBattlePotentialState();
}

function updateHqArea(caller, text) {
    if (HQ_AREA_TRACK_CALLERS.has(caller) && HQ_AREAS.has(text)) {
        setHqArea(text);
        return;
    }

    // Book reference callers are unique, so opening the global Book UI does
    // not forcibly discard the current HQ-area context.  Entering Book Mode
    // from the HQ destination list is tracked normally by its exact title.
}

const HQ_DESTINATION_HELP = new Map([
    ['第７小隊隊員の情報を確認して、隊員の兵装を変更します。', '第７小隊宿舎'],
    ['第７小隊の中から戦闘に参加する隊員を編成します。', '作戦指令室'],
    ['訓練して隊員を鍛えます。', '訓練場'],
    ['新兵器を開発して兵装を強化します。', '研究開発所'],
    ['定期的に発行される、壁新聞を読みに行きます。', '城前大通り'],
    ['戦死者の魂が眠る、戦没者墓地へ足を運びます。', '戦没者墓地'],
    ['ランドグリーズ城へ参向し、コーデリア姫と謁見します。', '謁見の間'],
    ['ブックモードへ戻ります。', 'ブックモード'],
]);

function routeHqDestinationHelp(caller, text) {
    if (caller !== 0x31219C)
        return false;

    const area = HQ_DESTINATION_HELP.get(text);
    if (!area)
        return false;

    const out = `【${area}】 ${text}`;
    const now = Date.now();

    // Menu construction can render the default selection, then render it again
    // during the selected-item refresh.  HQ context tracking also changes during
    // construction, so do not tie this dedupe state to setHqArea().
    //
    // Suppress only the same consecutive semantic value for a short window.
    // A -> B -> A always works because B changes the state, while a later menu
    // visit can emit the same initial entry again after the window expires.
    if (
        out === lastHqDestinationHelp &&
        (now - lastHqDestinationHelpTime) < 1000
    ) {
        return true;
    }

    lastHqDestinationHelp = out;
    lastHqDestinationHelpTime = now;
    sendText(out);
    return true;
}

function noteBattlefieldContext() {
    setHqArea(null);
}


//#endregion

//#region BOOK MODE

function makeReferenceState() {
    return {
        name: '',
        lines: [],
        timer: null,
        lastOutput: '',
        lastTime: 0,
    };
}

const personnelRef = makeReferenceState();
const weaponRef = makeReferenceState();
const museumRef = makeReferenceState();
const medalRef = makeReferenceState();

const BOOK_MAIN_MENU_HELP = new Map([
    ['見たいエピソードがある章を選び物語を読み進めます。', '章選択'],
    ['タグを切り替えてブックモードを閲覧します。', 'タグ選択'],
    ['ゲームの進行状況を本体保存メモリーに保存します。', 'セーブ'],
    ['ゲーム中の設定を変更します。', 'オプション'],
    ['タイトル画面へ戻ります。保存していない情報は失われます。', 'タイトル'],
    ['メニューを閉じます。', '閉じる'],
]);

let bookMainMenuLastHelp = '';

const BOOK_TAG_LABELS = [
    'エピソード選択',
    '訓練開発',
    '遊撃戦闘',
    '人物総覧',
    '兵器総覧',
    '博物総覧',
    '勲章閲覧',
    '戦闘評価',
    '楽曲集',
];

let bookTagLastSelectedIndex = null;

const bookEpisodeState = {
    lastScene: '',
    lastSceneTime: 0,
    lastConfirm: '',
    lastConfirmTime: 0,
};

const bookSkirmishState = {
    selectedTitle: '',
    selectedIndex: null,
    selectedTitleTime: 0,
    lastDifficultyDescription: '',
    lastDifficultyTime: 0,
};

function resetReferenceState(state) {
    if (state.timer !== null) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    state.name = '';
    state.lines = [];
    state.lastOutput = '';
    state.lastTime = 0;
}

function resetBookStates() {
    bookMainMenuLastHelp = '';
    bookTagLastSelectedIndex = null;

    resetReferenceState(personnelRef);
    resetReferenceState(weaponRef);
    resetReferenceState(museumRef);
    resetReferenceState(medalRef);

    bookEpisodeState.lastScene = '';
    bookEpisodeState.lastSceneTime = 0;
    bookEpisodeState.lastConfirm = '';
    bookEpisodeState.lastConfirmTime = 0;

    bookSkirmishState.selectedTitle = '';
    bookSkirmishState.selectedIndex = null;
    bookSkirmishState.selectedTitleTime = 0;
    bookSkirmishState.lastDifficultyDescription = '';
    bookSkirmishState.lastDifficultyTime = 0;
}

function routeBookMainMenuHelp(caller, text) {
    if (caller !== 0x1F9B28)
        return false;

    const item = BOOK_MAIN_MENU_HELP.get(text);
    if (!item)
        return false;

    // Highlighting タグ選択 is the deterministic boundary before entering the
    // Tag Selection screen. Re-arm its first selected label for each visit.
    if (item === 'タグ選択')
        bookTagLastSelectedIndex = null;

    const out = `【${item}】 ${text}`;

    // Opening the left Book menu renders its default selection twice.  Treat
    // only a real semantic change as a new selection so the construction redraw
    // is silent, while A -> B -> A still emits A again.
    if (out === bookMainMenuLastHelp)
        return true;

    bookMainMenuLastHelp = out;
    sendText(out);
    return true;
}

function routeBookTagSelection(caller, text, regs) {
    if (caller !== 0x1E16E0)
        return false;

    // 0x1E16E0 rebuilds all nine static labels every sweep.  r4 is the label
    // slot 0..8, while r5+0x78 is the runtime-selected slot.  Consume only the
    // exact proven label family so the static construction writes stay silent.
    const labelSlot = regs[4].vm >>> 0;
    if (labelSlot >= BOOK_TAG_LABELS.length || BOOK_TAG_LABELS[labelSlot] !== text)
        return false;

    // Row 0 is one deterministic boundary per complete static-label sweep.
    // Read the live selection there and emit only when the semantic index changes.
    if (labelSlot === 0) {
        const selectedIndex = readNullableU32(regs[5].value, 0x78);

        if (selectedIndex !== null && selectedIndex < BOOK_TAG_LABELS.length) {
            if (selectedIndex !== bookTagLastSelectedIndex) {
                bookTagLastSelectedIndex = selectedIndex;
                sendText(BOOK_TAG_LABELS[selectedIndex]);
            }
        }
    }

    return true;
}

function formatBookEpisodeScene(text) {
    if (!text)
        return null;

    // VC1 pads the chapter heading and episode title with a large gap.
    // Preserve the original strings, but put the two semantic pieces on
    // separate lines for cleaner clipboard/translation output.
    return text.replace(/[ 　]{2,}(?=『)/, '\n');
}

function routeBookEpisodeText(caller, text) {
    if (caller === 0x1D7774) {
        // This scene render is a reliable boundary between visits to the left
        // Book menu in runtime traces. Re-arm the first menu item for the next
        // open without relying on an arbitrary timeout.
        bookMainMenuLastHelp = '';

        const out = formatBookEpisodeScene(text);
        if (!out)
            return true;

        const now = Date.now();

        // Immediate redraw suppression only; A -> B -> A remains valid.
        if (
            out === bookEpisodeState.lastScene &&
            (now - bookEpisodeState.lastSceneTime) < 120
        ) {
            return true;
        }

        bookEpisodeState.lastScene = out;
        bookEpisodeState.lastSceneTime = now;
        sendText(out);
        return true;
    }

    // 0x1DCCFC is a generic Yes/No prompt renderer, so gate on the exact
    // Book-episode prompt.  The separate 0x1DCE88 / 0x1DCEAC writes are just
    // static label construction ("はい", "いいえ"), not live cursor selection.
    // Emit one compact semantic block instead of three clipboard events.
    if (caller === 0x1DCCFC && text === 'エピソードを見ますか？') {
        const out = `${text}\nはい／いいえ`;
        const now = Date.now();

        if (
            out === bookEpisodeState.lastConfirm &&
            (now - bookEpisodeState.lastConfirmTime) < 120
        ) {
            return true;
        }

        bookEpisodeState.lastConfirm = out;
        bookEpisodeState.lastConfirmTime = now;
        sendText(out);
        return true;
    }

    return false;
}

function routeBookSkirmishText(caller, text, regs) {
    // Selected skirmish/challenge title on the Book Mode skirmish grid.
    // Runtime-confirmed: r6 is the selected index (0, 1, 2, ...).
    // There is no separate hover description on this screen; the visible
    // semantic text is the selected mission title itself.
    if (caller === 0x1EF170) {
        const now = Date.now();

        // Collapse only immediate redraws. A -> B -> A remains valid.
        if (
            text === bookSkirmishState.selectedTitle &&
            (now - bookSkirmishState.selectedTitleTime) < 120
        ) {
            return true;
        }

        bookSkirmishState.selectedTitle = text;
        bookSkirmishState.selectedIndex = regs ? (regs[6].vm >>> 0) : null;
        bookSkirmishState.selectedTitleTime = now;
        sendText(text);
        return true;
    }

    // EASY / NORMAL / HARD / HARD-EX bottom description.
    // Confirmed examples:
    //   戦闘に慣れていないプレイヤー向けです。
    //   戦闘に慣れてきたプレイヤー向けです。
    //   戦闘に熟練したプレイヤー向けです。
    //   戦闘をやりこんだプレイヤーに贈る、チャレンジステージです。
    if (caller === 0x1F543C) {
        const now = Date.now();

        // Collapse only immediate redraws. EASY -> NORMAL -> EASY remains valid.
        if (
            text === bookSkirmishState.lastDifficultyDescription &&
            (now - bookSkirmishState.lastDifficultyTime) < 120
        ) {
            return true;
        }

        bookSkirmishState.lastDifficultyDescription = text;
        bookSkirmishState.lastDifficultyTime = now;
        sendText(text);
        return true;
    }

    return false;
}

function flushReferenceState(state) {
    state.timer = null;

    if (!state.name || state.lines.length === 0)
        return;

    const out = `${state.name}\n${state.lines.join('\n')}`;
    const now = Date.now();

    // Only collapse an immediate redraw burst.  A -> B -> A remains valid.
    if (!(out === state.lastOutput && (now - state.lastTime) < 180)) {
        state.lastOutput = out;
        state.lastTime = now;
        sendText(out);
    }

    state.lines = [];
}

function scheduleReferenceFlush(state) {
    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(() => flushReferenceState(state), 140);
}

function routeReferenceText(state, caller, nameCaller, detailCaller, text) {
    if (caller === nameCaller) {
        if (state.name && state.lines.length !== 0)
            flushReferenceState(state);

        state.name = text;
        state.lines = [];
        return true;
    }

    if (caller !== detailCaller)
        return false;

    if (
        state.lines.length === 0 ||
        state.lines[state.lines.length - 1] !== text
    ) {
        state.lines.push(text);
    }

    scheduleReferenceFlush(state);
    return true;
}

function routeBookText(caller, text) {
    if (routeReferenceText(personnelRef, caller, 0x1EBFC8, 0x1EC1CC, text))
        return true;

    if (routeReferenceText(weaponRef, caller, 0x1FF444, 0x1FF600, text))
        return true;

    if (routeReferenceText(museumRef, caller, 0x1DFCB4, 0x1DFE5C, text))
        return true;

    return routeReferenceText(medalRef, caller, 0x1D5730, 0x1D56F8, text);
}


//#endregion

//#region COMMAND ROOM / 作戦指令室

const CR_FULL_NAME = 0x2CD890;
const CR_CLASS = 0x2CDB60;
const CR_AFFINITY = 0x2CE460;
const CR_POTENTIAL = 0x2CE748;
const CR_VOLUNTEER_LIST = 0x2CE900;
const CR_SQUAD_LIST = 0x2CEF38;

function makeCommandRoomState() {
    return {
        name: '',
        affinity: [],
        affinitySeen: new Set(),
        potentials: [],
        potentialSeen: new Set(),
    };
}

let commandRoomState = makeCommandRoomState();
let commandRoomLastOutput = '';
let commandRoomLastTime = 0;
let commandRoomLastPotentialDesc = '';
let commandRoomLastPotentialDescTime = 0;

function resetCommandRoomState() {
    commandRoomState = makeCommandRoomState();
    commandRoomLastOutput = '';
    commandRoomLastTime = 0;
    commandRoomLastPotentialDesc = '';
    commandRoomLastPotentialDescTime = 0;
}

function formatCommandRoomPotentials(items) {
    const real = items.filter((x) => x && x !== '―');

    if (real.length === 0)
        return [];

    if (real.length === 4) {
        return [
            `${real[0]}     ${real[1]}`,
            `${real[2]}     ${real[3]}`,
        ];
    }

    return [real.join('、')];
}

function flushCommandRoomState() {
    if (!commandRoomState.name)
        return;

    const lines = [commandRoomState.name];

    if (commandRoomState.affinity.length !== 0)
        lines.push(`【相性】${commandRoomState.affinity.join('、')}`);

    for (const line of formatCommandRoomPotentials(commandRoomState.potentials))
        lines.push(line);

    const out = lines.join('\n');
    const now = Date.now();

    if (!(out === commandRoomLastOutput && (now - commandRoomLastTime) < 120)) {
        commandRoomLastOutput = out;
        commandRoomLastTime = now;
        sendText(out);
    }

    commandRoomState = makeCommandRoomState();
}

function routeCommandRoomText(caller, text) {
    // X-button ポテンシャル説明 popup.
    //
    // Runtime-confirmed exact caller:
    //   0x2C5BA8
    //
    // The game uses literal "//" as the visible popup line-break marker.
    // Every hit is a real X-button popup action, so do NOT same-text-dedupe:
    // pressing X again on the same Potential must emit again.
    if (caller === 0x2C5BA8) {
        sendText(text.replace(/\/\//g, '\n'));
        return;
    }

    if (caller === CR_FULL_NAME) {
        if (commandRoomState.name)
            flushCommandRoomState();

        commandRoomState.name = text;
        return;
    }

    if (!commandRoomState.name)
        return;

    // Known, intentionally omitted from presentation.
    if (caller === CR_CLASS)
        return;

    if (caller === CR_AFFINITY) {
        if (!commandRoomState.affinitySeen.has(text)) {
            commandRoomState.affinitySeen.add(text);
            commandRoomState.affinity.push(text);
        }
        return;
    }

    if (caller === CR_POTENTIAL) {
        if (!commandRoomState.potentialSeen.has(text)) {
            commandRoomState.potentialSeen.add(text);
            commandRoomState.potentials.push(text);
        }
        return;
    }

    if (caller === CR_VOLUNTEER_LIST || caller === CR_SQUAD_LIST)
        flushCommandRoomState();
}

function commandRoomPotentialDescription(arg, caller, text) {
    // This lower-panel path was behaviorally validated in Command Room and
    // shares the same selected-Potential description helper used by the other
    // unit-detail views.
    if (arg !== 88 || caller !== 0x304180 || text.length < 8)
        return;

    const now = Date.now();

    if (
        text === commandRoomLastPotentialDesc &&
        (now - commandRoomLastPotentialDescTime) < 80
    ) {
        return;
    }

    commandRoomLastPotentialDesc = text;
    commandRoomLastPotentialDescTime = now;
    sendText(text);
}


//#endregion

//#region TRAINING GROUND / 訓練場

const TRAIN_FULL_NAME = 0x3033E0;
const TRAIN_POT_DESC = 0x304180;

let trainingLastClass = '';
let trainingCurrentUnit = '';
let trainingDetailKind = 'unknown';
let trainingPending = false;
let trainingPendingRaw = null;
let trainingDescriptions = new Array(8).fill(null);
let trainingLastDescKey = '';
let trainingLastDescTime = 0;

function resetTrainingState() {
    trainingLastClass = '';
    trainingCurrentUnit = '';
    trainingDetailKind = 'unknown';
    trainingPending = false;
    trainingPendingRaw = null;
    trainingDescriptions = new Array(8).fill(null);
    trainingLastDescKey = '';
    trainingLastDescTime = 0;
}

function routeTrainingCommon(caller, text, regs) {
    if (caller !== 0x319A34 || (regs[6].vm >>> 0) !== 0x15)
        return;

    if (text === trainingLastClass)
        return;

    trainingLastClass = text;
    sendText(text);
}

function trainingClearPending() {
    trainingPending = false;
    trainingPendingRaw = null;
}

function trainingResetPotentialForUnit() {
    trainingClearPending();
    trainingDescriptions = new Array(8).fill(null);
    trainingLastDescKey = '';
    trainingLastDescTime = 0;
}

function trainingEmitDescription(raw, text) {
    const key = `${trainingCurrentUnit}\n${raw}\n${text}`;
    const now = Date.now();

    if (key === trainingLastDescKey && (now - trainingLastDescTime) < 120)
        return;

    trainingLastDescKey = key;
    trainingLastDescTime = now;
    sendText(text);
}

function trainingDetailText(regs, caller, arg, text) {
    if (arg === 2 && caller === TRAIN_FULL_NAME) {
        if (text !== trainingCurrentUnit) {
            trainingCurrentUnit = text;
            trainingResetPotentialForUnit();
            sendText(text);
        }
        return;
    }

    if (arg === 86 || arg === 88)
        trainingDetailKind = 'potentials';
    else if (arg === 46)
        trainingDetailKind = 'equipment';
    else if (arg === 84 || arg === 90)
        trainingDetailKind = 'orders';

    if (
        trainingDetailKind !== 'potentials' ||
        arg !== 88 ||
        caller !== TRAIN_POT_DESC
    ) {
        return;
    }

    const parent = regs[4].value;
    const parentGuest = regs[4].vm >>> 0;

    if (!parent || parent.isNull() || parentGuest < 0x10000)
        return;

    const raw = readNullableU32(parent, 0x1E90);

    if (raw === null || raw < 120 || raw > 127)
        return;

    trainingDescriptions[raw - 120] = text;

    // Description preload alone is never a semantic cursor selection.
    if (trainingPending && trainingPendingRaw === raw) {
        trainingClearPending();
        trainingEmitDescription(raw, text);
    }
}

function trainingSelectionRefresh(regs) {
    try {
        const parent = regs[0].value;

        if (!parent || parent.isNull())
            return;

        const raw = readNullableU32(parent, 0x1E90);

        if (raw === null || raw < 120 || raw > 127) {
            trainingClearPending();
            return;
        }

        // LEFT unit-list redraw.
        if ((regs[3].vm >>> 0) === 0x13) {
            trainingClearPending();
            return;
        }

        if (trainingDetailKind !== 'potentials')
            return;

        trainingPending = true;
        trainingPendingRaw = raw;

        const text = trainingDescriptions[raw - 120];
        if (text) {
            trainingClearPending();
            trainingEmitDescription(raw, text);
        }
    } catch (_) {}
}

function trainingRightSelectionChanged(regs) {
    try {
        if (trainingDetailKind !== 'potentials')
            return;

        const parent = regs[4].value;
        if (!parent || parent.isNull())
            return;

        const raw = readNullableU32(parent, 0x1E90);
        if (raw === null || raw < 120 || raw > 127)
            return;

        trainingPending = true;
        trainingPendingRaw = raw;

        const text = trainingDescriptions[raw - 120];
        if (text) {
            trainingClearPending();
            trainingEmitDescription(raw, text);
        }
    } catch (_) {}
}


//#endregion

//#region R&D / 研究開発所
//
// 0x2E472C  selected top-level menu bottom help:
//   兵器開発 / 車輌整備
//
// 0x319B60:
//   ordinary pass -> current/resulting weapon model
//   r6 == 0x29   -> selected vehicle development / optional-part name
//
// 0x319D64 numeric helper:
//   weapon stat callers -> complete four-line stat block
//   0x2DB744          -> variable 1..4 vehicle-development effects
//   0x2DB8CC          -> optional-part effect type/value


const RD_MENU_HELP_CALLER = 0x2E472C;

const RD_MENU_HELP = new Map([
    [
        'ライフルやマシンガン、車輌に関する開発を行います。',
        '兵器開発',
    ],
    [
        '車輌のオプションパーツの変更、状態の確認を行います。',
        '車輌整備',
    ],
]);

const RD_WEAPON_STAT_CALLERS = new Map([
    [0x2DB400, '射程'],
    [0x2DB410, '対人'],
    [0x2DB420, '対甲'],
    [0x2DB438, '発射数'],
]);

const RD_WEAPON_STAT_ORDER = [
    '射程',
    '対人',
    '対甲',
    '発射数',
];

const RD_VEHICLE_EFFECT_CALLER = 0x2DB744;
const RD_OPTIONAL_EFFECT_CALLER = 0x2DB8CC;

const RD_VEHICLE_EFFECT_TYPES = new Map([
    [1, '射程'],
    [2, '対人'],
    [3, '対甲'],
    [4, '範囲'],
    [5, '車体防御力'],
    [6, '履帯防御力'],
    [7, '車体HP'],
    [8, '履帯HP'],
    [12, 'AP'],
]);

const RD_OPTIONAL_EFFECT_TYPES = new Map([
    [0x06, '履帯防御力'],
    [0x08, '履帯HP'],
    [0x09, '弱点耐性'],
    [0x0A, '射撃'],
    [0x0B, '弾数'],
]);

let rdLastSelected = null;
let rdLastCategory = null;
let rdLastModel = null;
let rdLastPart = null;
let rdLastMenuHelp = '';
let rdLastMenuHelpTime = 0;

let rdVehicleSelectedName = null;
let rdVehicleEffectPass = [];
let rdVehicleEffectPassName = null;
let rdLastVehicleEffectSignature = '';
let rdLastOptionalOutput = '';

const rdWeaponStats = new Map();
let rdLastWeaponStatsSignature = '';

function routeRdMenuHelp(caller, text) {
    if (caller !== RD_MENU_HELP_CALLER)
        return false;

    const tag = RD_MENU_HELP.get(text);
    if (!tag)
        return false;

    const out = `【${tag}】${text}`;
    const now = Date.now();

    // Collapse only immediate redraw duplicates.
    // A -> B -> A still emits A again.
    if (out === rdLastMenuHelp && (now - rdLastMenuHelpTime) < 120)
        return true;

    rdLastMenuHelp = out;
    rdLastMenuHelpTime = now;
    sendText(out);
    return true;
}

function clearRdWeaponStats() {
    rdWeaponStats.clear();
    rdLastWeaponStatsSignature = '';
}

function resetRdState() {
    rdLastSelected = null;
    rdLastCategory = null;
    rdLastModel = null;
    rdLastPart = null;
    rdLastMenuHelp = '';
    rdLastMenuHelpTime = 0;

    rdVehicleSelectedName = null;
    rdVehicleEffectPass = [];
    rdVehicleEffectPassName = null;
    rdLastVehicleEffectSignature = '';
    rdLastOptionalOutput = '';

    clearRdWeaponStats();
}

function finishRdVehicleEffectPass() {
    if (rdVehicleEffectPass.length === 0)
        return;

    const ordered = rdVehicleEffectPass
        .slice()
        .sort((a, b) => a.slot - b.slot);

    const passName = rdVehicleEffectPassName;
    const signature = [
        passName || '',
        ...ordered.map(x => `${x.slot}:${x.type}:${x.value}`),
    ].join('|');

    rdVehicleEffectPass = [];
    rdVehicleEffectPassName = null;

    if (signature === rdLastVehicleEffectSignature)
        return;

    const lines = [];

    for (const effect of ordered) {
        const label = RD_VEHICLE_EFFECT_TYPES.get(effect.type);

        if (label)
            lines.push(`${label} +${effect.value}`);
    }

    if (lines.length === 0)
        return;

    rdLastVehicleEffectSignature = signature;

    if (passName)
        lines.unshift(passName);

    sendText(lines.join('\n'));
}

function setRdVehicleSelectedName(text) {
    if (text === rdVehicleSelectedName)
        return;

    // A name change is a semantic boundary for the previous effect pass.
    finishRdVehicleEffectPass();

    rdVehicleSelectedName = text;
    rdLastOptionalOutput = '';

    // Returning from vehicle development to weapons must not inherit the old
    // weapon-model/stat dedupe state.
    rdLastModel = null;
    clearRdWeaponStats();
}

function routeRdCommon(caller, text, regs) {
    if (caller === 0x319A34) {
        // 兵器開発 highlighted row. 車輌整備 bulk rows are r6=0x2F.
        if ((regs[6].vm >>> 0) !== 0x15 || text === rdLastSelected)
            return;

        rdLastSelected = text;
        sendText(text);
        return;
    }

    if (caller === 0x319AB8) {
        if (text === rdLastCategory)
            return;

        rdLastCategory = text;
        sendText(text);
        return;
    }

    if (caller !== 0x319B60)
        return;

    if ((regs[6].vm >>> 0) === 0x29) {
        setRdVehicleSelectedName(text);
        return;
    }

    // State-change dedupe is required because this field redraws forever while
    // the cursor rests on one weapon.
    if (text === rdLastModel)
        return;

    finishRdVehicleEffectPass();
    rdVehicleSelectedName = null;
    rdLastOptionalOutput = '';

    rdLastModel = text;
    clearRdWeaponStats();
    sendText(text);
}

function routeRdWeaponStat(caller, value) {
    const label = RD_WEAPON_STAT_CALLERS.get(caller);

    if (!label)
        return false;

    rdWeaponStats.set(label, value);

    // 0x2DB438 is the final call in the fixed four-stat renderer.
    if (caller !== 0x2DB438)
        return true;

    if (rdWeaponStats.size !== RD_WEAPON_STAT_ORDER.length)
        return true;

    const values = RD_WEAPON_STAT_ORDER.map(
        stat => rdWeaponStats.get(stat)
    );

    if (values.some(value => value === undefined))
        return true;

    const signature = `${rdLastModel || ''}|${values.join('|')}`;

    if (signature === rdLastWeaponStatsSignature)
        return true;

    rdLastWeaponStatsSignature = signature;

    sendText(
        RD_WEAPON_STAT_ORDER
            .map((stat, i) => `${stat} ${values[i]}`)
            .join('\n')
    );

    return true;
}

function routeRdVehicleEffect(regs, value) {
    const slot = regs[8].vm >>> 0;
    const type = regs[10].vm >>> 0;

    if (slot > 3)
        return;

    if (
        rdVehicleEffectPass.length > 0 &&
        (
            slot === 0 ||
            slot <= rdVehicleEffectPass[
                rdVehicleEffectPass.length - 1
            ].slot
        )
    ) {
        finishRdVehicleEffectPass();
    }

    if (rdVehicleEffectPass.length === 0)
        rdVehicleEffectPassName = rdVehicleSelectedName;

    rdVehicleEffectPass.push({
        slot,
        type,
        value,
    });
}

function routeRdOptionalEffect(regs, value) {
    if (!rdVehicleSelectedName)
        return;

    const type = regs[7].vm >>> 0;
    const label = RD_OPTIONAL_EFFECT_TYPES.get(type);

    if (!label)
        return;

    finishRdVehicleEffectPass();

    const out = `${rdVehicleSelectedName}\n${label} +${value}`;

    if (out === rdLastOptionalOutput)
        return;

    rdLastOptionalOutput = out;
    sendText(out);
}

function routeRdNumeric(regs, caller) {
    const value = regs[2].vm | 0;

    if (routeRdWeaponStat(caller, value))
        return;

    if (caller === RD_VEHICLE_EFFECT_CALLER) {
        routeRdVehicleEffect(regs, value);
        return;
    }

    if (caller === RD_OPTIONAL_EFFECT_CALLER)
        routeRdOptionalEffect(regs, value);
}

function rdDetailText(caller, arg, text) {
    if (arg !== 14 || caller !== 0x2E7B04 || text === rdLastPart)
        return;

    rdLastPart = text;
    sendText(text);
}


//#endregion

//#region SHARED MESSAGE RESOLVER / BATTLE START + CASTLEFRONT STREET

const BATTLE_START_RESOLVER_CALLER = 0x27B8C4;

const messagePendingResolver = new Map();

let streetCurrentHeadline = null;
let streetResolverBudget = 0;
let streetLastBody = '';
let streetLastBodyTime = 0;

function resetStreetState() {
    for (const [tid, pending] of messagePendingResolver) {
        if (pending.kind === 'street')
            messagePendingResolver.delete(tid);
    }

    streetCurrentHeadline = null;
    streetResolverBudget = 0;
    streetLastBody = '';
    streetLastBodyTime = 0;
}

function routeStreetCommon(caller, text, regs) {
    if (caller !== 0x319A34)
        return;

    // Only the current/highlighted newspaper row.
    if ((regs[3].vm >>> 0) !== 0)
        return;

    if (text === streetCurrentHeadline)
        return;

    streetCurrentHeadline = text;
    streetResolverBudget = 160;
    sendText(text);
}

function streetLooksLikeBody(text) {
    if (!text || text.length < 18 || text.length > 3000)
        return false;

    if (streetCurrentHeadline && text === streetCurrentHeadline)
        return false;

    const jp = text.match(/[\u3040-\u30ff\u3400-\u9fff]/g);
    if (!jp || jp.length < 8)
        return false;

    return (
        /[。、「」！？]/.test(text) ||
        text.includes('\n') ||
        text.length >= 40
    );
}

function messageResolverEnter(regs) {
    const tid = threadId();
    const aslr = getAslrOffset();
    let caller = null;

    // Runtime validation identified the resolver caller from the hook's actual
    // return address. Keep that exact method here rather than assuming the LR
    // register view is equivalent at this internal resolver entry.
    try {
        if (aslr !== null) {
            caller = (
                (this.returnAddress >>> 0) -
                aslr -
                GUEST_BASE
            ) >>> 0;
        }
    } catch (_) {}

    if (caller === BATTLE_START_RESOLVER_CALLER) {
        messagePendingResolver.set(tid, {
            kind: 'battleStart',
        });
        return;
    }

    if (
        currentHqArea === '城前大通り' &&
        streetCurrentHeadline &&
        streetResolverBudget > 0
    ) {
        streetResolverBudget--;

        messagePendingResolver.set(tid, {
            kind: 'street',
        });
        return;
    }

    messagePendingResolver.delete(tid);
}

function messageResolverSuccess(regs) {
    const tid = threadId();
    const pending = messagePendingResolver.get(tid);

    if (!pending)
        return;

    messagePendingResolver.delete(tid);

    const text = readCleanShiftJisReg(regs[4]);

    if (!text)
        return;

    if (pending.kind === 'battleStart') {
        sendText(text);
        return;
    }

    if (pending.kind !== 'street' || currentHqArea !== '城前大通り')
        return;

    if (!streetLooksLikeBody(text))
        return;

    const now = Date.now();

    if (text === streetLastBody && (now - streetLastBodyTime) < 120)
        return;

    streetLastBody = text;
    streetLastBodyTime = now;
    sendText(text);
}

function messageResolverFailure() {
    messagePendingResolver.delete(threadId());
}


//#endregion

//#region BARRACKS / 第７小隊宿舎

const BARRACKS_FULL_NAME = 0x3033E0;
const BARRACKS_WEAPON_ROW = 0x3036D0;
const BARRACKS_POT_DESC = 0x304180;

const BARRACKS_POTENTIAL_NAME_CALLERS = new Map([
    [0x3047C0, 0],
    [0x3047D8, 1],
    [0x30482C, 4],
    [0x304844, 5],
    [0x3048B4, 2],
    [0x3048E8, 3],
    [0x304900, 4],
    [0x304918, 5],
    [0x304950, 6],
    [0x30913C, 7],
]);

const BARRACKS_AFFINITY_CALLERS = new Set([
    0x3040D4,
    0x3040EC,
    0x303178,
    0x30BB7C,
]);

const BARRACKS_ORDER_NAME_CALLERS = new Map([
    [0x304A4C, 0],
    [0x304A74, 1],
    [0x304A9C, 2],
    [0x304AC4, 3],
    [0x304AEC, 4],
    [0x304B14, 5],
    [0x304B3C, 6],
    [0x304B64, 7],
    [0x304B8C, 8],
    [0x304BB4, 9],
]);

const barracksWeapon = {
    currentUnit: '',
    lastUnit: '',
    rows: [],
    parent: null,
    pending: false,
    timer: null,
    lastKey: '',
};

const barracksPotential = {
    currentUnit: '',
    kind: 'unknown',
    names: new Array(8).fill(null),
    descriptions: new Array(8).fill(null),
    parent: null,
    pending: false,
    raw: null,
    timer: null,
    lastKey: '',
    lastTime: 0,
};

const barracksAffinity = {
    currentUnit: '',
    armed: false,
    names: [],
    seen: new Set(),
    timer: null,
    lastKey: '',
    lastTime: 0,
};

const barracksOrders = {
    currentUnit: '',
    names: new Array(10).fill(null),
    lastKey: '',
};

function resetBarracksState() {
    if (barracksWeapon.timer !== null)
        clearTimeout(barracksWeapon.timer);
    if (barracksPotential.timer !== null)
        clearTimeout(barracksPotential.timer);
    if (barracksAffinity.timer !== null)
        clearTimeout(barracksAffinity.timer);

    barracksWeapon.currentUnit = '';
    barracksWeapon.lastUnit = '';
    barracksWeapon.rows = [];
    barracksWeapon.parent = null;
    barracksWeapon.pending = false;
    barracksWeapon.timer = null;
    barracksWeapon.lastKey = '';

    barracksPotential.currentUnit = '';
    barracksPotential.kind = 'unknown';
    barracksPotential.names = new Array(8).fill(null);
    barracksPotential.descriptions = new Array(8).fill(null);
    barracksPotential.parent = null;
    barracksPotential.pending = false;
    barracksPotential.raw = null;
    barracksPotential.timer = null;
    barracksPotential.lastKey = '';
    barracksPotential.lastTime = 0;

    barracksAffinity.currentUnit = '';
    barracksAffinity.armed = false;
    barracksAffinity.names = [];
    barracksAffinity.seen.clear();
    barracksAffinity.timer = null;
    barracksAffinity.lastKey = '';
    barracksAffinity.lastTime = 0;

    barracksOrders.currentUnit = '';
    barracksOrders.names = new Array(10).fill(null);
    barracksOrders.lastKey = '';
}

function barracksCancelWeaponTimer() {
    if (barracksWeapon.timer !== null) {
        clearTimeout(barracksWeapon.timer);
        barracksWeapon.timer = null;
    }
}

function barracksScheduleWeaponResolve(wait) {
    barracksCancelWeaponTimer();
    barracksWeapon.timer = setTimeout(barracksResolveWeapon, wait);
}

function barracksResolveWeapon() {
    barracksWeapon.timer = null;

    if (!barracksWeapon.pending || !barracksWeapon.parent || barracksWeapon.parent.isNull())
        return;

    const page = readNullableU32(barracksWeapon.parent, 0x3328);
    const raw = readNullableU32(barracksWeapon.parent, 0x1E90);

    if (page !== 0 || raw === null || raw < 120 || raw > 139)
        return;

    const slot = raw - 120;
    if (slot < 0 || slot >= barracksWeapon.rows.length)
        return;

    const selected = barracksWeapon.rows[slot];
    barracksWeapon.pending = false;

    const key = `${barracksWeapon.currentUnit}\n${raw}\n${selected}`;
    if (key === barracksWeapon.lastKey)
        return;

    barracksWeapon.lastKey = key;
    sendText(selected);
}

function barracksClearPotentialPending() {
    barracksPotential.pending = false;
    barracksPotential.raw = null;

    if (barracksPotential.timer !== null) {
        clearTimeout(barracksPotential.timer);
        barracksPotential.timer = null;
    }
}

function barracksSchedulePotentialResolve(wait) {
    if (barracksPotential.timer !== null)
        clearTimeout(barracksPotential.timer);

    barracksPotential.timer = setTimeout(barracksResolvePotential, wait);
}

function barracksResolvePotential() {
    barracksPotential.timer = null;

    if (!barracksPotential.pending || barracksPotential.raw === null)
        return;

    if (barracksPotential.kind !== 'potentials') {
        barracksClearPotentialPending();
        return;
    }

    const raw = barracksPotential.raw;
    if (raw < 120 || raw > 127) {
        barracksClearPotentialPending();
        return;
    }

    const slot = raw - 120;
    const name = barracksPotential.names[slot];
    const desc = barracksPotential.descriptions[slot];

    if (!name || !desc)
        return;

    barracksPotential.pending = false;
    barracksPotential.raw = null;

    const key = `${barracksPotential.currentUnit}\n${raw}\n${name}\n${desc}`;
    const now = Date.now();

    if (key === barracksPotential.lastKey && (now - barracksPotential.lastTime) < 120)
        return;

    barracksPotential.lastKey = key;
    barracksPotential.lastTime = now;
    sendText(`${name}\n${desc}`);
}

function barracksCancelAffinityTimer() {
    if (barracksAffinity.timer !== null) {
        clearTimeout(barracksAffinity.timer);
        barracksAffinity.timer = null;
    }
}

function barracksBeginAffinity(unit) {
    barracksCancelAffinityTimer();
    barracksAffinity.currentUnit = unit;
    barracksAffinity.armed = true;
    barracksAffinity.names = [];
    barracksAffinity.seen.clear();
    barracksAffinity.timer = setTimeout(barracksFlushAffinity, 180);
}

function barracksQueueAffinity(text) {
    if (!barracksAffinity.armed)
        return;

    if (!barracksAffinity.seen.has(text)) {
        barracksAffinity.seen.add(text);
        barracksAffinity.names.push(text);
    }

    barracksCancelAffinityTimer();
    barracksAffinity.timer = setTimeout(barracksFlushAffinity, 55);
}

function barracksFlushAffinity() {
    barracksAffinity.timer = null;

    if (!barracksAffinity.armed)
        return;

    barracksAffinity.armed = false;

    if (!barracksAffinity.currentUnit || barracksAffinity.names.length === 0) {
        barracksAffinity.names = [];
        barracksAffinity.seen.clear();
        return;
    }

    const line = `【相性】${barracksAffinity.names.join('、')}`;
    const key = `${barracksAffinity.currentUnit}\n${line}`;
    const now = Date.now();

    barracksAffinity.names = [];
    barracksAffinity.seen.clear();

    if (key === barracksAffinity.lastKey && (now - barracksAffinity.lastTime) < 250)
        return;

    barracksAffinity.lastKey = key;
    barracksAffinity.lastTime = now;
    sendText(`${barracksAffinity.currentUnit}\n${line}`);
}

function barracksDetailText(regs, caller, arg, text) {
    // ------------------------------------------------------------------
    // Selected unit + selected weapon.
    // ------------------------------------------------------------------
    if (arg === 2 && caller === BARRACKS_FULL_NAME) {
        const changed = text !== barracksWeapon.currentUnit;

        if (changed) {
            barracksWeapon.currentUnit = text;
            barracksWeapon.rows = [];
            barracksWeapon.pending = false;
            barracksCancelWeaponTimer();
            barracksWeapon.lastKey = '';
        }

        if (text !== barracksWeapon.lastUnit) {
            barracksWeapon.lastUnit = text;
            sendText(text);
        }
    }
    else if (arg === 46 && caller === BARRACKS_WEAPON_ROW) {
        if (
            barracksWeapon.rows.length === 0 ||
            barracksWeapon.rows[barracksWeapon.rows.length - 1] !== text
        ) {
            barracksWeapon.rows.push(text);
        }

        if (barracksWeapon.pending)
            barracksScheduleWeaponResolve(45);
    }

    // ------------------------------------------------------------------
    // Selected Potential.
    // ------------------------------------------------------------------
    if (arg === 2 && caller === BARRACKS_FULL_NAME) {
        if (text !== barracksPotential.currentUnit) {
            barracksPotential.currentUnit = text;
            barracksPotential.names = new Array(8).fill(null);
            barracksPotential.descriptions = new Array(8).fill(null);
            barracksClearPotentialPending();
            barracksPotential.lastKey = '';
            barracksPotential.lastTime = 0;
        }
    }

    if (arg === 46)
        barracksPotential.kind = 'equipment';
    else if (arg === 84 || arg === 90)
        barracksPotential.kind = 'orders';
    else if (arg === 86 || arg === 88)
        barracksPotential.kind = 'potentials';

    if (arg === 86) {
        const slot = BARRACKS_POTENTIAL_NAME_CALLERS.get(caller);

        if (slot !== undefined) {
            barracksPotential.names[slot] = text;

            if (
                barracksPotential.pending &&
                barracksPotential.raw === 120 + slot
            ) {
                barracksSchedulePotentialResolve(10);
            }
        }
    }
    else if (arg === 88 && caller === BARRACKS_POT_DESC) {
        const parent = regs[4].value;
        const parentGuest = regs[4].vm >>> 0;

        if (parent && !parent.isNull() && parentGuest >= 0x10000) {
            const raw = readNullableU32(parent, 0x1E90);

            if (raw !== null && raw >= 120 && raw <= 127) {
                barracksPotential.parent = parent;
                barracksPotential.descriptions[raw - 120] = text;

                if (
                    barracksPotential.pending &&
                    barracksPotential.raw === raw
                ) {
                    barracksSchedulePotentialResolve(10);
                }
            }
        }
    }

    // ------------------------------------------------------------------
    // Affinity metadata belonging to the newly selected LEFT-roster unit.
    // ------------------------------------------------------------------
    if (arg === 2 && caller === BARRACKS_FULL_NAME) {
        if (text !== barracksAffinity.currentUnit)
            barracksBeginAffinity(text);
    }
    else if (arg === 76 && BARRACKS_AFFINITY_CALLERS.has(caller)) {
        barracksQueueAffinity(text);
    }

    // ------------------------------------------------------------------
    // Welkin selected Order.
    // ------------------------------------------------------------------
    if (arg === 2 && caller === BARRACKS_FULL_NAME) {
        if (text !== barracksOrders.currentUnit) {
            barracksOrders.currentUnit = text;
            barracksOrders.names = new Array(10).fill(null);
            barracksOrders.lastKey = '';
        }
    }

    if (arg === 84) {
        const slot = BARRACKS_ORDER_NAME_CALLERS.get(caller);
        if (slot !== undefined)
            barracksOrders.names[slot] = text;
    }
    else if (arg === 90 && caller === 0x304270) {
        try {
            const parentGuest = regs[4].vm >>> 0;
            const parentHost = regs[4].value;

            if (parentGuest < 0x10000 || !parentHost || parentHost.isNull())
                return;

            const raw = parentHost.add(0x1E90).readU32() >>> 0;
            if (raw < 120 || raw > 129)
                return;

            const slot = raw - 120;
            const name = barracksOrders.names[slot];
            if (!name)
                return;

            const key = `${raw}\n${name}\n${text}`;
            if (key === barracksOrders.lastKey)
                return;

            barracksOrders.lastKey = key;
            sendText(`${name}\n${text}`);
        } catch (_) {}
    }
}

function barracksSelectionRefresh(regs) {
    // Weapon LEFT -> RIGHT main-weapon focus.
    try {
        const parent = regs[0].value;

        if (parent && !parent.isNull()) {
            const page = readNullableU32(parent, 0x3328);
            const raw = readNullableU32(parent, 0x1E90);

            if (page === 0 && raw !== null && raw >= 120 && raw <= 139) {
                const r1 = regs[1].vm >>> 0;
                const r2 = regs[2].vm >>> 0;
                const r3 = regs[3].vm >>> 0;

                if (r1 === 0x202 && r2 === 0x11 && r3 === 0x11) {
                    barracksWeapon.parent = parent;
                    barracksWeapon.pending = true;
                    barracksScheduleWeaponResolve(20);
                }
            }
        }
    } catch (_) {}

    // Potential focus gate.
    try {
        const parent = regs[0].value;
        if (!parent || parent.isNull())
            return;

        barracksPotential.parent = parent;
        const raw = readNullableU32(parent, 0x1E90);

        if (raw === null || raw < 120 || raw > 127) {
            barracksClearPotentialPending();
            return;
        }

        if ((regs[3].vm >>> 0) === 0x13) {
            barracksClearPotentialPending();
            return;
        }

        if (barracksPotential.kind === 'potentials') {
            barracksPotential.pending = true;
            barracksPotential.raw = raw;
            barracksSchedulePotentialResolve(15);
        }
    } catch (_) {}
}

function barracksRightSelectionChanged(regs) {
    // Weapon movement within RIGHT equipment.
    try {
        const parent = regs[4].value;

        if (parent && !parent.isNull()) {
            const page = readNullableU32(parent, 0x3328);
            const raw = readNullableU32(parent, 0x1E90);

            if (page === 0 && raw !== null && raw >= 120 && raw <= 139) {
                barracksWeapon.parent = parent;
                barracksWeapon.pending = true;
                barracksScheduleWeaponResolve(15);
            }
        }
    } catch (_) {}

    // Potential movement within RIGHT grid.
    try {
        if (barracksPotential.kind !== 'potentials')
            return;

        const parent = regs[4].value;
        if (!parent || parent.isNull())
            return;

        const raw = readNullableU32(parent, 0x1E90);
        if (raw === null || raw < 120 || raw > 127)
            return;

        barracksPotential.parent = parent;
        barracksPotential.pending = true;
        barracksPotential.raw = raw;
        barracksSchedulePotentialResolve(10);
    } catch (_) {}
}


//#endregion

//#region BATTLEFIELD FIELD INFO + POTENTIALS + ORDERS + VEHICLE PARTS

const BATTLE_FIELD_FULL_NAME = 0x3033E0;
const BATTLE_FIELD_WEAPON_ROW = 0x3036D0;
const BATTLE_FIELD_POT_DESC = 0x304180;
const BATTLE_FIELD_ORDER_DESC = 0x304270;
const BATTLE_FIELD_TANK_EFFECT_LABEL = 0x304378;
const BATTLE_FIELD_TANK_DIGIT_CALLER = 0x318218;

const BATTLE_FIELD_AFFINITY_CALLERS = new Set([
    0x3040D4,
    0x3040EC,
    0x303178,
    0x30BB7C,
]);

const BATTLE_POTENTIAL_NAME_CALLERS = new Map([
    [0x3047C0, 0],
    [0x3047D8, 1],
    [0x30482C, 4],
    [0x304844, 5],
    [0x3048B4, 2],
    [0x3048E8, 3],
    [0x304900, 4],
    [0x304918, 5],
    [0x304950, 6],
    [0x30913C, 7],
]);

const BATTLE_FIELD_ORDER_NAME_CALLERS = new Map([
    [0x304A4C, 0],
    [0x304A74, 1],
    [0x304A9C, 2],
    [0x304AC4, 3],
    [0x304AEC, 4],
    [0x304B14, 5],
    [0x304B3C, 6],
    [0x304B64, 7],
    [0x304B8C, 8],
    [0x304BB4, 9],
]);

// Static sequence 0x304D70..0x304ED8 contains ten consecutive calls to
// 0x319958 (arg 84), one per vehicle-part slot. Filled slots were also
// runtime-validated on both command- and action-mode vehicle cards.
const BATTLE_FIELD_TANK_PART_CALLERS = new Map([
    [0x304D74, 0],
    [0x304D9C, 1],
    [0x304DC4, 2],
    [0x304DEC, 3],
    [0x304E14, 4],
    [0x304E3C, 5],
    [0x304E64, 6],
    [0x304E8C, 7],
    [0x304EB4, 8],
    [0x304EDC, 9],
]);

let battlePotentialNames = new Array(8).fill(null);
let battlePotentialLastKey = '';
let battlePotentialLastTime = 0;
let battleHoverLast = '';

let battleFieldLastName = '';
let battleFieldLastWeaponKey = '';
let battleFieldLastWeaponTime = 0;

const battleFieldAffinity = {
    names: [],
    seen: new Set(),
    timer: null,
    lastKey: '',
    lastTime: 0,
};

const battleFieldOrders = {
    currentUnit: '',
    names: new Array(10).fill(null),
    lastKey: '',
    lastTime: 0,
};

let battleTankLastPartKey = '';
let battleTankLastPartTime = 0;
let battleTankPendingEffectLabel = null;
let battleTankPendingDigits = [];
let battleTankDigitTimer = null;
let battleTankLastEffectKey = '';
let battleTankLastEffectTime = 0;

let battlePotentialActivationLast = '';
let battlePotentialActivationLastTime = 0;

function battleFieldCancelAffinityTimer() {
    if (battleFieldAffinity.timer !== null) {
        clearTimeout(battleFieldAffinity.timer);
        battleFieldAffinity.timer = null;
    }
}

function battleFieldFlushAffinity() {
    battleFieldAffinity.timer = null;

    if (battleFieldAffinity.names.length === 0)
        return;

    const out = `【相性】${battleFieldAffinity.names.join('、')}`;
    const now = Date.now();

    battleFieldAffinity.names = [];
    battleFieldAffinity.seen.clear();

    if (
        out === battleFieldAffinity.lastKey &&
        (now - battleFieldAffinity.lastTime) < 180
    ) {
        return;
    }

    battleFieldAffinity.lastKey = out;
    battleFieldAffinity.lastTime = now;
    sendText(out);
}

function battleFieldQueueAffinity(text) {
    if (!battleFieldAffinity.seen.has(text)) {
        battleFieldAffinity.seen.add(text);
        battleFieldAffinity.names.push(text);
    }

    battleFieldCancelAffinityTimer();
    battleFieldAffinity.timer =
        setTimeout(battleFieldFlushAffinity, 55);
}

function battleTankResetPendingEffect() {
    battleTankPendingEffectLabel = null;
    battleTankPendingDigits = [];

    if (battleTankDigitTimer !== null) {
        clearTimeout(battleTankDigitTimer);
        battleTankDigitTimer = null;
    }
}

function battleTankFlushEffect() {
    if (
        battleTankPendingEffectLabel &&
        battleTankPendingDigits.length > 0
    ) {
        // Runtime-confirmed: decimal glyphs arrive least-significant first.
        const numberText =
            battleTankPendingDigits.slice().reverse().join('');

        const out =
            `${battleTankPendingEffectLabel} +${numberText}`;

        const now = Date.now();

        if (!(
            out === battleTankLastEffectKey &&
            (now - battleTankLastEffectTime) < 120
        )) {
            battleTankLastEffectKey = out;
            battleTankLastEffectTime = now;
            sendText(out);
        }
    }

    battleTankResetPendingEffect();
}

function battleTankScheduleEffectFlush() {
    if (battleTankDigitTimer !== null)
        clearTimeout(battleTankDigitTimer);

    // Narrow redraw grouping only, never action-state inference.
    battleTankDigitTimer =
        setTimeout(battleTankFlushEffect, 35);
}

function normalizeBattleDigit(text) {
    const map = {
        '０': '0',
        '１': '1',
        '２': '2',
        '３': '3',
        '４': '4',
        '５': '5',
        '６': '6',
        '７': '7',
        '８': '8',
        '９': '9',
    };

    return map[text] || text;
}

function routeBattlefieldTankEffectDigit(caller, text) {
    if (!battleTankPendingEffectLabel)
        return false;

    if (
        caller === BATTLE_FIELD_TANK_DIGIT_CALLER &&
        /^[0-9０-９]$/.test(text)
    ) {
        battleTankPendingDigits.push(normalizeBattleDigit(text));
        battleTankScheduleEffectFlush();
        return true;
    }

    // 0x31999C immediately mirrors the semantic effect label through the
    // common setter before the digit glyphs. Any other intervening text means
    // this effect render did not produce a value, so do not leave stale state.
    if (!(caller === 0x31999C && text === battleTankPendingEffectLabel))
        battleTankResetPendingEffect();

    return false;
}

function resetBattlePotentialState() {
    battlePotentialNames = new Array(8).fill(null);
    battlePotentialLastKey = '';
    battlePotentialLastTime = 0;
    battleHoverLast = '';

    battleFieldLastName = '';
    battleFieldLastWeaponKey = '';
    battleFieldLastWeaponTime = 0;

    battleFieldCancelAffinityTimer();
    battleFieldAffinity.names = [];
    battleFieldAffinity.seen.clear();
    battleFieldAffinity.lastKey = '';
    battleFieldAffinity.lastTime = 0;

    battleFieldOrders.currentUnit = '';
    battleFieldOrders.names = new Array(10).fill(null);
    battleFieldOrders.lastKey = '';
    battleFieldOrders.lastTime = 0;

    battleTankLastPartKey = '';
    battleTankLastPartTime = 0;
    battleTankResetPendingEffect();
    battleTankLastEffectKey = '';
    battleTankLastEffectTime = 0;
}

function battlefieldFieldDetail(regs, caller, arg, text) {
    // Full unit / vehicle name.
    if (caller === BATTLE_FIELD_FULL_NAME && arg === 2) {
        if (text !== battleFieldLastName) {
            battleFieldLastName = text;
            sendText(text);
        }

        if (text !== battleFieldOrders.currentUnit) {
            battleFieldOrders.currentUnit = text;
            battleFieldOrders.names = new Array(10).fill(null);
            battleFieldOrders.lastKey = '';
            battleFieldOrders.lastTime = 0;
        }

        return;
    }

    // Weapon/equipment rows useful on the field card. Intentionally excludes
    // class, LV/HP/AP, armor/item and the status/stat page.
    if (caller === BATTLE_FIELD_WEAPON_ROW && arg === 46) {
        const key = `${caller}\n${text}`;
        const now = Date.now();

        if (!(
            key === battleFieldLastWeaponKey &&
            (now - battleFieldLastWeaponTime) < 100
        )) {
            battleFieldLastWeaponKey = key;
            battleFieldLastWeaponTime = now;
            sendText(text);
        }

        return;
    }

    // Compatibility / affinity names.
    if (arg === 76 && BATTLE_FIELD_AFFINITY_CALLERS.has(caller)) {
        battleFieldQueueAffinity(text);
        return;
    }

    // Potential names are cached only so the selected description can be
    // emitted with its semantic title.
    if (arg === 86) {
        const slot = BATTLE_POTENTIAL_NAME_CALLERS.get(caller);

        if (slot !== undefined)
            battlePotentialNames[slot] = text;

        return;
    }

    if (arg === 88 && caller === BATTLE_FIELD_POT_DESC) {
        try {
            const parent = regs[4].value;
            const raw = readNullableU32(parent, 0x1E90);

            if (raw === null || raw < 120 || raw > 127)
                return;

            const slot = raw - 120;
            const name = battlePotentialNames[slot];

            const out = name
                ? `${name}\n${text}`
                : text;

            const key = `${raw}\n${out}`;
            const now = Date.now();

            if (
                key === battlePotentialLastKey &&
                (now - battlePotentialLastTime) < 120
            ) {
                return;
            }

            battlePotentialLastKey = key;
            battlePotentialLastTime = now;
            sendText(out);
        } catch (_) {}

        return;
    }

    // Welkin field-card Orders.
    if (arg === 84) {
        const orderSlot =
            BATTLE_FIELD_ORDER_NAME_CALLERS.get(caller);

        if (orderSlot !== undefined) {
            battleFieldOrders.names[orderSlot] = text;
            return;
        }

        const partSlot =
            BATTLE_FIELD_TANK_PART_CALLERS.get(caller);

        if (partSlot !== undefined) {
            if (
                text === '―' ||
                text === '-' ||
                text === '－' ||
                text === 'ー'
            ) {
                return;
            }

            const key = `${partSlot}\n${text}`;
            const now = Date.now();

            if (!(
                key === battleTankLastPartKey &&
                (now - battleTankLastPartTime) < 100
            )) {
                battleTankLastPartKey = key;
                battleTankLastPartTime = now;
                sendText(text);
            }

            return;
        }
    }

    if (arg === 90 && caller === BATTLE_FIELD_ORDER_DESC) {
        try {
            const parent = regs[4].value;

            if (!parent || parent.isNull())
                return;

            const raw = parent.add(0x1E90).readU32() >>> 0;

            if (raw < 120 || raw > 129)
                return;

            const slot = raw - 120;
            const name = battleFieldOrders.names[slot];

            if (!name)
                return;

            const out = `${name}\n${text}`;
            const key = `${raw}\n${out}`;
            const now = Date.now();

            if (
                key === battleFieldOrders.lastKey &&
                (now - battleFieldOrders.lastTime) < 100
            ) {
                return;
            }

            battleFieldOrders.lastKey = key;
            battleFieldOrders.lastTime = now;
            sendText(out);
        } catch (_) {}

        return;
    }

    // Vehicle/tank resulting-effect label. Its numeric value is drawn later
    // one glyph at a time through common caller 0x318218.
    if (arg === 90 && caller === BATTLE_FIELD_TANK_EFFECT_LABEL) {
        battleTankFlushEffect();
        battleTankPendingEffectLabel = text;
        battleTankPendingDigits = [];
    }
}

function combatPotentialActivation(regs) {
    const text = readCleanShiftJisReg(regs[0]);

    if (!text)
        return null;

    const now = Date.now();

    if (
        text === battlePotentialActivationLast &&
        (now - battlePotentialActivationLastTime) < 100
    ) {
        return null;
    }

    battlePotentialActivationLast = text;
    battlePotentialActivationLastTime = now;
    return text;
}

function readGuestString(base, guest) {
    guest >>>= 0;

    if (guest < 0x10000)
        return null;

    try {
        return readCleanShiftJisPtr(base.add(guest));
    } catch (_) {
        return null;
    }
}

function readWidgetText(widgetReg) {
    try {
        const widgetGuest = widgetReg.vm >>> 0;
        const widgetHost = widgetReg.value;

        if (widgetGuest < 0x10000 || !widgetHost || widgetHost.isNull())
            return null;

        const base = widgetHost.sub(widgetGuest);
        const textGuest = widgetHost.add(0x3C).readU32() >>> 0;

        return readGuestString(base, textGuest);
    } catch (_) {
        return null;
    }
}

function battlefieldHoverName(regs) {
    noteBattlefieldContext();

    const text = readWidgetText(regs[5]);
    if (!text || text === battleHoverLast)
        return null;

    battleHoverLast = text;
    return text;
}

function battlefieldUnitListContext() {
    noteBattlefieldContext();
}


//#endregion

//#region PROGRESSION / UNLOCK NOTIFICATIONS

// Feature/update notification callers through the shared 0x1C9440 setter.
//
// Runtime-validated render-pass discriminator:
//   0x1D7680 -> r7 == 0 first/semantic write, r7 == 1 redraw
//   0x1DA960 -> r6 == 0 first/semantic write, r6 == 1 redraw
//
// New-chapter splash callers:
//   0x1D3114 -> Japanese chapter title, first/semantic write
//   0x1D330C -> English subtitle, first/semantic write
//
// Intentionally ignored redraw/other paths:
//   0x1D3210 -> Japanese chapter-title redraw
//   0x1D33F8 -> English subtitle redraw
//   0x1D7774 -> ordinary Book Mode chapter/episode text

const PROGRESSION_FEATURE_BOOK = 0x1D7680;
const PROGRESSION_FEATURE_UPDATE = 0x1DA960;
const PROGRESSION_CHAPTER_JP = 0x1D3114;
const PROGRESSION_CHAPTER_EN = 0x1D330C;

let progressionChapterJP = null;
let progressionChapterEN = null;

function routeProgressionText(caller, text, regs) {
    if (caller === PROGRESSION_FEATURE_BOOK) {
        // The game's second pass redraws the same visible notification with r7=1.
        if ((regs[7].vm >>> 0) === 0)
            sendText(text);

        return true;
    }

    if (caller === PROGRESSION_FEATURE_UPDATE) {
        // The game's second pass redraws the same visible notification with r6=1.
        if ((regs[6].vm >>> 0) === 0)
            sendText(text);

        return true;
    }

    if (caller === PROGRESSION_CHAPTER_JP) {
        // A new JP title begins a fresh chapter-splash pair.
        progressionChapterJP = text;
        progressionChapterEN = null;
        return true;
    }

    if (caller === PROGRESSION_CHAPTER_EN) {
        progressionChapterEN = text;

        if (progressionChapterJP) {
            sendText(`${progressionChapterJP}\n${progressionChapterEN}`);
            progressionChapterJP = null;
            progressionChapterEN = null;
        }

        return true;
    }

    return false;
}


//#endregion

//#region SHARED COMMON-TEXT / DETAIL DISPATCHERS

function numericDispatcher(regs) {
    if (currentHqArea !== '研究開発所')
        return;

    const caller = normalizedLR(regs);

    if (caller !== null)
        routeRdNumeric(regs, caller);
}


function commonTextDispatcher(regs) {
    // Deployment uses the common setter only while its own refresh state is
    // active, so feeding it first is safe for every other UI.
    collectDeploymentCommonText(regs);

    const text = readCleanShiftJisReg(regs[2]);
    if (!text)
        return;

    const caller = normalizedLR(regs);
    if (caller === null)
        return;

    // Vehicle/tank effect digits are only meaningful immediately after the
    // semantic effect-label caller has armed a narrow redraw group.
    if (routeBattlefieldTankEffectDigit(caller, text))
        return;

    // Exact validated battle command/System help only. 勝利条件確認 also emits
    // the direct current-battle condition block once per Agent session.
    if (routeBattleCommandAndSystemHelp(caller, text, regs))
        return;

    // Progression/unlock messages use unique semantic callers and must be
    // handled before HQ/Book routing. Returning here also prevents ordinary
    // UI context from seeing their redraw passes.
    if (routeProgressionText(caller, text, regs))
        return;

    updateHqArea(caller, text);

    // Headquarters destination list: emit only the bottom explanatory sentence
    // and prefix it with the corresponding left-menu destination tag.
    if (routeHqDestinationHelp(caller, text))
        return;

    // Book main-menu bottom help: exact-match the six semantic descriptions
    // and tag them with the selected left-menu item.
    if (routeBookMainMenuHelp(caller, text))
        return;

    // Tag Selection: 0x1E16E0 itself is a static nine-label sweep.  Use its
    // owner object's live index to emit only the actually selected tag.
    if (routeBookTagSelection(caller, text, regs))
        return;

    // Book skirmish selection/difficulty callers are semantic and should not
    // fall through into whichever HQ context happened to be active previously.
    if (routeBookSkirmishText(caller, text, regs))
        return;

    // Book episode selection / confirmation is semantic and should not fall
    // through into whichever HQ context happened to be active previously.
    if (routeBookEpisodeText(caller, text))
        return;

    // Book reference callers are unique and need no HQ-area gate.  Return on
    // a match so Book text cannot accidentally fall through to an HQ router if
    // the previous area context is still active.
    if (routeBookText(caller, text))
        return;

    if (currentHqArea === '作戦指令室') {
        routeCommandRoomText(caller, text);
        return;
    }

    if (currentHqArea === '訓練場') {
        routeTrainingCommon(caller, text, regs);
        return;
    }

    if (currentHqArea === '研究開発所') {
        if (routeRdMenuHelp(caller, text))
            return;

        routeRdCommon(caller, text, regs);
        return;
    }

    if (currentHqArea === '城前大通り')
        routeStreetCommon(caller, text, regs);
}

function detailTextDispatcher(regs) {
    const text = readCleanShiftJisReg(regs[3]);
    if (!text)
        return;

    const caller = normalizedLR(regs);
    if (caller === null)
        return;

    const arg = regs[2].vm >>> 0;

    if (currentHqArea === '第７小隊宿舎') {
        barracksDetailText(regs, caller, arg, text);
        return;
    }

    if (currentHqArea === '作戦指令室') {
        commandRoomPotentialDescription(arg, caller, text);
        return;
    }

    if (currentHqArea === '訓練場') {
        trainingDetailText(regs, caller, arg, text);
        return;
    }

    if (currentHqArea === '研究開発所') {
        rdDetailText(caller, arg, text);
        return;
    }

    // Outside a known HQ detail context this is the battlefield field/detail
    // card path: name, weapon, compatibility, selected Potential, Welkin Orders
    // and vehicle/tank parts/effects. Hover/unit-list hooks clear stale HQ
    // context on entry.
    if (currentHqArea === null)
        battlefieldFieldDetail(regs, caller, arg, text);
}

function selectionRefreshDispatcher(regs) {
    if (currentHqArea === '第７小隊宿舎') {
        barracksSelectionRefresh(regs);
        return;
    }

    if (currentHqArea === '訓練場')
        trainingSelectionRefresh(regs);
}

function rightSelectionDispatcher(regs) {
    if (currentHqArea === '第７小隊宿舎') {
        barracksRightSelectionChanged(regs);
        return;
    }

    if (currentHqArea === '訓練場')
        trainingRightSelectionChanged(regs);
}

//#endregion

//#region HOOK TABLE

setHook({
    '0100E6900A5A8000': {
        // Story dialogue + speaker names.
        [0x23D1DC]: trans.send(storyTalkWindow),
        [0x23D23C]: trans.send(storySpeakerNameResolved),
        [0x23D2D0]: trans.send(storySpeakerNameResolved),

        // Cinematic subtitle activation.
        [0x27AE78]: trans.send(cinematicSubtitle),

        // Tutorial/system current visible page.  This also cleanly covers
        // Cemetery acquisition messages and Audience Chamber reward popups.
        [0x1CA54C]: trans.send(systemFirstPage),
        [0x1CA728]: trans.send(systemNextPage),

        // Briefing victory/defeat condition cache + visible reopen event.
        [0x32CF54]: beginConditionBuild,
        [0x32D2F4]: collectConditionLabel,
        [0x32D2A8]: collectVictoryCondition,
        [0x32D1CC]: collectDefeatCondition,
        [0x338B9C]: trans.send(briefingConditionOpen),

        // Deployment selected-unit info.
        [0x3309B0]: beginDeploymentRefresh,
        [0x336F40]: collectDeploymentPageEntry,
        [0x330AEC]: trans.send(endDeploymentRefresh),

        // Shared UI dispatchers.  Do not split these into independent hooks.
        [0x1C9440]: commonTextDispatcher,
        [0x319958]: detailTextDispatcher,
        [0x319D64]: numericDispatcher,
        [0x1C9F40]: battleCommandActivation,
        [0x30C1C4]: selectionRefreshDispatcher,
        [0x30E3DC]: rightSelectionDispatcher,

        // Combat Potential activation resolved-name paths.
        // 0x83894 is runtime-confirmed; 0x83E1C is the statically equivalent
        // SlgPotentialBasicEffectCommand path feeding the same cut-in producer.
        [0x83894]: trans.send(combatPotentialActivation),
        [0x83E1C]: trans.send(combatPotentialActivation),

        // Battlefield context + clean hovered unit/vehicle name.
        [0x14E898]: trans.send(battlefieldHoverName),
        [0x1422FC]: battlefieldUnitListContext,
        [0x15705C]: battlefieldUnitListContext,

        // Selected battlefield Orders.
        [0x153AF8]: function (regs) {
            noteBattlefieldContext();
            cacheOrderName(regs);
        },
        [0x154E2C]: trans.send(selectedOrder),

        // Shared resolver: battle-start narration + Castlefront Street.
        [0x23EBA0]: messageResolverEnter,
        [0x23EC60]: messageResolverSuccess,
        [0x23EC40]: messageResolverFailure,

        // War Cemetery taught Order.
        [0x315E8C]: cacheCemeteryOrderName,
        [0x315ED8]: trans.send(cemeteryOrderDescription),
    }
});

//#endregion
