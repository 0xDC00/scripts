// ==UserScript==
// @name         Valkyria Chronicles 4
// @version      1.0
// @author       [Raiko]
// @description  Steam
// * SEGA
//
// https://store.steampowered.com/app/790820/Valkyria_Chronicles_4_Complete_Edition/
// * Hooks:
// * - Story dialogue and speaker names
// * - Tutorials, system prompts, options and controls
// * - Mission information and briefings
// * - Character, personnel, deployment and vehicle information
// * - Equipment, Potentials, Orders and Ship Orders
// * - Battlefield unit names and contextual menu help
// * - Battle results
// * - Book Mode lists and selection text
// * - R&D names and selected infantry weapon/uniform stats
// * - Reference entries and newspaper articles
// *
// * Known issue: The opening narration in a new game is not hooked.
// ==/UserScript==

'use strict';

const __e = Process.enumerateModules()[0];

// Agent output path. Agent handles the normal clipboard/translation pipeline
// for strings sent through trans.send().
const sendToAgent = trans.send((s) => s);


// =============================================================================
// OUTPUT / BATCHING
// =============================================================================
// Grouped fields are combined per UI refresh; cursor-driven text is debounced.
// These delays affect presentation only.
// =============================================================================

const groupedStates = Object.create(null);
const latestStates = Object.create(null);

let lastOutput = '';
let lastOutputTime = 0;

function sendOutput(text) {
    if (!text)
        return;

    const now = Date.now();

    // Suppress only immediate duplicate UI refreshes. Revisiting the same text
    // later still sends it again.
    if (text === lastOutput && (now - lastOutputTime) < 450)
        return;

    lastOutput = text;
    lastOutputTime = now;

    sendToAgent(text);
}

function emitGrouped(key, text, wait = 90) {
    if (!text)
        return;

    let state = groupedStates[key];

    if (!state) {
        state = groupedStates[key] = {
            parts: [],
            timer: null
        };
    }

    // Avoid duplicated fields within the same render burst.
    if (
        state.parts.length === 0 ||
        state.parts[state.parts.length - 1] !== text
    ) {
        state.parts.push(text);
    }

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const out = state.parts.join('\n');

        state.parts = [];
        state.timer = null;

        sendOutput(out);
    }, wait);
}

function emitLatest(key, text, wait = 120) {
    if (!text)
        return;

    let state = latestStates[key];

    if (!state) {
        state = latestStates[key] = {
            text: '',
            timer: null
        };
    }

    state.text = text;

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const out = state.text;

        state.text = '';
        state.timer = null;

        sendOutput(out);
    }, wait);
}


const listStates = Object.create(null);

function emitList(key, text, wait = 180, repeatAfter = 700) {
    if (!text)
        return;

    let state = listStates[key];

    if (!state) {
        state = listStates[key] = {
            items: [],
            seen: new Set(),
            timer: null,
            lastBlock: '',
            lastSentAt: 0
        };
    }

    if (!state.seen.has(text)) {
        state.seen.add(text);
        state.items.push(text);
    }

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const out = state.items.join('\n');
        const now = Date.now();

        state.items = [];
        state.seen.clear();
        state.timer = null;

        if (out.length === 0)
            return;

        // Suppress only an immediate identical redraw. Returning to the same
        // list later should emit it again.
        if (
            out === state.lastBlock &&
            (now - state.lastSentAt) < repeatAfter
        ) {
            return;
        }

        state.lastBlock = out;
        state.lastSentAt = now;

        sendOutput(out);
    }, wait);
}


// =============================================================================
// TEXT HELPERS
// =============================================================================

function readUtf8(ptr) {
    if (!ptr || ptr.isNull())
        return '';

    try {
        return ptr.readUtf8String() || '';
    }
    catch (_) {
        return '';
    }
}

function cleanText(text) {
    if (!text)
        return '';

    return text
        // Character-card / layout presentation codes:
        // [fa2], [lm0], [fs34], [la1], etc.
        .replace(/\[(?:fa|lm|fs|la)\d+\]/gi, '')

        // VC4 inline color codes. Both forms occur:
        // [fc(0000f0] and [fc(655947)]
        .replace(/\[fc\([0-9a-f]+\)?\]/gi, '')

        // Input glyph placeholders can represent buttons, sticks, wheel input,
        // etc., so keep a neutral visible placeholder.
        .replace(/\[ACTION:[^\]]+\]/g, '【ボタン】')

        // Preserve visible contents of simple brace markup.
        .replace(/\{([^{}]+)\}/g, '$1')

        .replace(/\r/g, '')
        .replace(/\0+$/g, '')
        .trim();
}

function getText(ptr) {
    return cleanText(readUtf8(ptr));
}


// =============================================================================
// PATTERN HELPERS
// =============================================================================

function getMatches(name, pattern, expected = 1) {
    const results = Memory.scanSync(__e.base, __e.size, pattern);

    if (results.length === 0) {
        console.error(`[VC4:${name}] hook not found`);
        return [];
    }

    if (results.length !== expected) {
        console.error(
            `[VC4:${name}] expected ${expected} match(es), found ${results.length}; hook disabled`
        );
        return [];
    }

    return results;
}

function hookTextCall(name, pattern, output, expected = 1) {
    const results = getMatches(name, pattern, expected);

    for (const result of results) {
        Interceptor.attach(result.address, function () {
            const text = getText(this.context.rdx);

            if (text.length !== 0)
                output(text);
        });
    }
}

function hookTextCallFromAnchor(name, pattern, callOffset, output) {
    const results = getMatches(name, pattern);

    if (results.length !== 1)
        return;

    const callAddress = results[0].address.add(callOffset);

    try {
        if (Instruction.parse(callAddress).mnemonic !== 'call') {
            console.error(`[VC4:${name}] anchor did not resolve to a call`);
            return;
        }
    }
    catch (_) {
        console.error(`[VC4:${name}] could not decode anchored call`);
        return;
    }

    Interceptor.attach(callAddress, function () {
        const text = getText(this.context.rdx);

        if (text.length !== 0)
            output(text);
    });
}


// =============================================================================
// STORY DIALOGUE / SPEAKER
// =============================================================================
// Speaker and dialogue share a short grouping queue so a newly rendered name is
// paired with the following dialogue box.
// =============================================================================

(function () {
    const results = getMatches(
        'speaker',
        'E8 ?? ?? ?? ?? 48 8B 05 ?? ?? ?? ?? 8B 4F 74 85 C9 0F 88',
        2
    );

    for (const result of results) {
        Interceptor.attach(result.address, function () {
            const text = getText(this.context.rdx);

            if (
                text.length !== 0 &&
                text !== 'invalid char info'
            ) {
                emitGrouped('story', text, 45);
            }
        });
    }
})();

hookTextCall(
    'dialogue',
    'E8 ?? ?? ?? ?? 83 7F 74 01 75 15 E8 ?? ?? ?? ?? 0F 28 D0',
    (text) => emitGrouped('story', text, 45)
);


// =============================================================================
// TUTORIAL / SYSTEM TEXT
// =============================================================================

hookTextCall(
    'tutorial',
    'E8 ?? ?? ?? ?? FF 87 34 0C 00 00 48 89 F8 48 8B 5C 24 30',
    (text) => emitGrouped('tutorial', text, 100)
);

hookTextCall(
    'systemPrompt',
    'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8F 18 02 00 00 E8 ?? ?? ?? ?? 48 85 C0 74 26',
    (text) => emitLatest('systemPrompt', text, 70)
);



// =============================================================================
// OPTIONS CONFIRMATION DIALOGS
// =============================================================================
// The prompt has a clean semantic text path. The fixed はい / いいえ labels only
// appear on a noisy generic conversion path, so reconstruct them with the prompt.
// =============================================================================

hookTextCallFromAnchor(
    'optionsConfirmPrompt',
    '31 D2 E8 ?? ?? ?? ?? 48 89 C2 41 B8 01 00 00 00 48 89 F9 E8',
    0x13,
    (text) => sendOutput(`${text}\nはい\nいいえ`)
);


// =============================================================================
// KEY / CONTROLLER ASSIGNMENT SELECTED DESCRIPTION
// =============================================================================
// Ignore the bulk row renderer and emit only the selected bottom description.
// The routine is cloned elsewhere, so a unique local anchor reaches the call.
// =============================================================================

(function () {
    const results = getMatches(
        'controlsSelectedDescription',
        '48 89 D9 E8 ?? ?? ?? ?? 48 8B 5C 24 40 48 8B 74 24 48 48 83 C4 20 5F C3',
        1
    );

    if (results.length === 0)
        return;

    const callAddress = results[0].address.add(3);

    Interceptor.attach(callAddress, function () {
        const text = getText(this.context.rdx);

        if (text.length !== 0)
            emitLatest('controlsSelectedDescription', text, 80);
    });
})();


// =============================================================================
// MISSION INFORMATION
// =============================================================================
// Both mission-info pages are populated in one refresh and no reliable active-tab
// discriminator was found. Collect the fields semantically and emit conditions
// first, followed by mission/place metadata and the explanation.
// =============================================================================

const missionState = {
    name: '',
    place: '',
    info: '',
    victory: '',
    defeats: [],
    defeatSeen: new Set(),
    timer: null
};

function queueMissionField(kind, text) {
    if (!text)
        return;

    if (kind === 'defeat') {
        if (!missionState.defeatSeen.has(text)) {
            missionState.defeatSeen.add(text);
            missionState.defeats.push(text);
        }
    }
    else {
        missionState[kind] = text;
    }

    if (missionState.timer !== null)
        clearTimeout(missionState.timer);

    missionState.timer = setTimeout(function () {
        missionState.timer = null;

        const sections = [];

        if (missionState.victory)
            sections.push(`【勝利条件】\n${missionState.victory}`);

        if (missionState.defeats.length !== 0) {
            sections.push(
                `【敗北条件】\n${missionState.defeats.join('\n')}`
            );
        }

        if (missionState.name || missionState.place) {
            let missionLine = '';

            if (missionState.name)
                missionLine += `【ミッション】${missionState.name}`;

            if (missionState.place) {
                if (missionLine)
                    missionLine += '　　';

                missionLine += `【場所】${missionState.place}`;
            }

            sections.push(missionLine);
        }

        if (missionState.info)
            sections.push(`【説明】\n${missionState.info}`);

        if (sections.length !== 0)
            sendOutput(sections.join('\n'));

        missionState.name = '';
        missionState.place = '';
        missionState.info = '';
        missionState.victory = '';
        missionState.defeats = [];
        missionState.defeatSeen.clear();
    }, 180);
}

hookTextCall(
    'missionVictory',
    'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8B F0 01 00 00 E8 ?? ?? ?? ?? 48 85 C0 74 15',
    (text) => queueMissionField('victory', text)
);

hookTextCall(
    'missionDefeat',
    'E8 ?? ?? ?? ?? 41 FF C4 49 83 C6 08 FF C6 48 D1 C7 83 FE 05 7C AC',
    (text) => queueMissionField('defeat', text)
);

hookTextCall(
    'missionName',
    'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8B F0 01 00 00 E8 ?? ?? ?? ?? 48 8B F8 48 85 C0 74 19',
    (text) => queueMissionField('name', text)
);

hookTextCall(
    'missionInfo',
    'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8B F0 01 00 00 E8 ?? ?? ?? ?? 48 8B F8 48 85 C0 74 1B',
    (text) => queueMissionField('info', text)
);

hookTextCall(
    'missionPlace',
    'E8 ?? ?? ?? ?? 48 8B BC 24 90 00 00 00 33 ED 4C 8B 6C 24 60',
    (text) => queueMissionField('place', text)
);


// =============================================================================
// MAIN CHARACTER / EQUIPMENT PANEL
// =============================================================================
// Header-only redraws occur while changing subpages, so emit the panel only when
// at least one equipment/detail field is present.
// =============================================================================

const characterPanelState = {
    parts: [],
    seen: new Set(),
    hasDetail: false,
    timer: null
};

function emitCharacterPanel(text, isDetail = false, wait = 110) {
    if (!text)
        return;

    const state = characterPanelState;

    if (!state.seen.has(text)) {
        state.seen.add(text);
        state.parts.push(text);
    }

    if (isDetail)
        state.hasDetail = true;

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const out = state.parts.join('\n');
        const shouldEmit = state.hasDetail && out.length !== 0;

        state.parts = [];
        state.seen.clear();
        state.hasDetail = false;
        state.timer = null;

        if (shouldEmit)
            sendOutput(out);
    }, wait);
}

hookTextCallFromAnchor(
    'characterFullName',
    '48 8B 93 40 02 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitCharacterPanel(text, false)
);

hookTextCallFromAnchor(
    'characterClass',
    '48 8B 93 70 02 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitCharacterPanel(text, false)
);

hookTextCallFromAnchor(
    'characterWeapon',
    '41 B8 01 00 00 00 48 89 C1 48 8B 12 E8',
    0x0C,
    (text) => emitCharacterPanel(text, true)
);

hookTextCall(
    'characterArmor',
    'E8 ?? ?? ?? ?? 44 8B 83 50',
    (text) => emitCharacterPanel(text, true)
);

hookTextCallFromAnchor(
    'characterAccessory',
    '48 8B 93 58 01 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitCharacterPanel(text, true)
);

hookTextCallFromAnchor(
    'characterAccessoryEffect',
    '48 8B 93 60 01 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitCharacterPanel(text, true)
);

hookTextCall(
    'characterMisc',
    'E8 ?? ?? ?? ?? F3 0F 10 15 ?? ?? ?? ?? EB ?? 0F 57 D2 48 8B 15 ?? ?? ?? ?? 48 8B 8B 70 0B 00 00',
    (text) => emitCharacterPanel(text, false)
);


// =============================================================================
// PERSONNEL / PROFILE PANEL
// =============================================================================
// This summary may be preloaded before the detail pane opens. Preserve the
// game's refresh lifecycle instead of inferring subpage state.
// =============================================================================

const profilePanelState = {
    name: '',
    unitClass: '',
    rank: '',
    related: [],
    relatedSeen: new Set(),
    traits: [],
    traitSeen: new Set(),
    timer: null
};

function emitProfilePanel(field, text, wait = 110) {
    if (!text)
        return;

    const state = profilePanelState;

    if (field === 'related') {
        if (!state.relatedSeen.has(text)) {
            state.relatedSeen.add(text);
            state.related.push(text);
        }
    }
    else if (field === 'trait') {
        if (!state.traitSeen.has(text)) {
            state.traitSeen.add(text);
            state.traits.push(text);
        }
    }
    else {
        state[field] = text;
    }

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const lines = [];

        if (state.name || state.rank) {
            if (state.name && state.rank)
                lines.push(`${state.name}     ${state.rank}`);
            else
                lines.push(state.name || state.rank);
        }

        if (state.unitClass)
            lines.push(state.unitClass);

        if (state.related.length !== 0)
            lines.push(`【相性】${state.related.join('、')}`);

        for (const trait of state.traits)
            lines.push(trait);

        const out = lines.join('\n');

        state.name = '';
        state.unitClass = '';
        state.rank = '';
        state.related = [];
        state.relatedSeen.clear();
        state.traits = [];
        state.traitSeen.clear();
        state.timer = null;

        if (out)
            sendOutput(out);
    }, wait);
}

hookTextCall(
    'profileName',
    'E8 ?? ?? ?? ?? 48 8B BC 24 88 00 00 00 B8 01 00 00 00 48 8B B4',
    (text) => emitProfilePanel('name', text)
);

hookTextCallFromAnchor(
    'profileFieldA',
    '48 85 C0 75 ?? 31 FF 48 8B 15 ?? ?? ?? ?? 48 8B 8B 40 11 00 00 E8 ?? ?? ?? ?? 48 85 C0 74 ?? 41 B8 01 00 00 00 48 89 FA 48 89 C1 E8',
    0x2B,
    (text) => emitProfilePanel('unitClass', text)
);

hookTextCallFromAnchor(
    'profileFieldB',
    '48 8B 07 8B 50 10 E8 ?? ?? ?? ?? 48 89 C7 48 8B 15 ?? ?? ?? ?? 48 8B 8B 40 11 00 00 E8 ?? ?? ?? ?? 48 85 C0 74 ?? 41 B8 01 00 00 00 48 89 FA 48 89 C1 E8',
    0x32,
    (text) => emitProfilePanel('rank', text)
);

hookTextCall(
    'profileRelated',
    'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 8B 5C 24 48 B8 01 00 00 00 48 8B 6C 24 50 48 83 C4 20 41 5E 5F',
    (text) => emitProfilePanel('related', text)
);

hookTextCall(
    'profileTrait',
    'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 8B 5C 24 38 B8 01 00 00 00 48 8B 6C 24 40 48 8B 74 24 48 48 83 C4 20',
    (text) => emitProfilePanel('trait', text)
);


// =============================================================================
// SQUAD-FORMATION PROFILE POTENTIAL DESCRIPTION
// =============================================================================
// This is separate from the normal character-info/briefing Potential path. The
// call is shared by similar routines, so a unique local anchor reaches it.
// =============================================================================

hookTextCallFromAnchor(
    'profilePotentialDescription',
    '48 8B 15 ?? ?? ?? ?? 48 8B 8B 20 02 00 00 E8 ?? ?? ?? ?? 48 85 C0 74 ?? 41 B8 01 00 00 00 48 89 FA 48 89 C1 E8',
    0x24,
    (text) => emitLatest('profilePotentialDescription', text, 80)
);


// =============================================================================
// DEPLOYMENT UNIT DETAIL
// =============================================================================
// The header redraws on all three subpages, so emit it only on Info. Two mirrored
// controller fields at +0x214/+0x218 hold 0/1/2 for Info/Potentials/Equipment;
// both must agree before the page value is trusted.
// =============================================================================

const DEPLOY_PAGE_INFO = 0;
const DEPLOY_PAGE_POTENTIALS = 1;
const DEPLOY_PAGE_EQUIPMENT = 2;

const deployDetailState = {
    name: '',
    rank: '',
    unitClass: '',
    related: [],
    relatedSeen: new Set(),
    timer: null,
    controller: null,
    page: DEPLOY_PAGE_INFO
};

function noteDeployPageContent(context) {
    const state = deployDetailState;

    if (context.rsi && !context.rsi.isNull())
        state.controller = context.rsi;

    const tag = context.r9.toInt32();

    if (tag === 0x74)
        state.page = DEPLOY_PAGE_POTENTIALS;
    else if (tag === 0x7C)
        state.page = DEPLOY_PAGE_EQUIPMENT;
}

function getDeployPage() {
    const state = deployDetailState;

    if (state.controller !== null && !state.controller.isNull()) {
        try {
            const pageA = state.controller.add(0x214).readU32();
            const pageB = state.controller.add(0x218).readU32();

            if (pageA === pageB && pageA <= DEPLOY_PAGE_EQUIPMENT) {
                state.page = pageA;
                return pageA;
            }
        }
        catch (_) {
            state.controller = null;
            state.page = DEPLOY_PAGE_INFO;
        }
    }

    return state.page;
}

function emitDeployDetail(field, text, wait = 120) {
    if (!text)
        return;

    const state = deployDetailState;

    if (field === 'related') {
        if (!state.relatedSeen.has(text)) {
            state.relatedSeen.add(text);
            state.related.push(text);
        }
    }
    else {
        state[field] = text;
    }

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const lines = [];

        if (state.name || state.rank) {
            if (state.name && state.rank)
                lines.push(`${state.name}     ${state.rank}`);
            else
                lines.push(state.name || state.rank);
        }

        if (state.unitClass)
            lines.push(state.unitClass);

        if (state.related.length !== 0)
            lines.push(`【相性】${state.related.join('、')}`);

        const out = lines.join('\n');

        state.name = '';
        state.rank = '';
        state.unitClass = '';
        state.related = [];
        state.relatedSeen.clear();
        state.timer = null;

        if (out && getDeployPage() === DEPLOY_PAGE_INFO)
            sendOutput(out);
    }, wait);
}

hookTextCallFromAnchor(
    'deployFullName',
    '4C 8B 74 24 30 48 8B 74 24 60 48 8D 53 0C 48 85 DB 75 ?? 48 8B 15 ?? ?? ?? ?? 41 B8 01 00 00 00 48 89 E9 E8',
    0x23,
    (text) => emitDeployDetail('name', text)
);

hookTextCallFromAnchor(
    'deployRank',
    '41 B8 01 00 00 00 48 89 F2 48 89 F9 E8',
    0x0C,
    (text) => emitDeployDetail('rank', text)
);

hookTextCallFromAnchor(
    'deployClass',
    '41 B8 01 00 00 00 48 89 FA 48 89 F1 E8',
    0x0C,
    (text) => emitDeployDetail('unitClass', text)
);

hookTextCall(
    'deployRelated',
    'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? FF C7 48 FF C6 83 FF 03',
    (text) => emitDeployDetail('related', text)
);



// =============================================================================
// DEPLOYMENT POTENTIAL LIST
// =============================================================================
// Potentials and Equipment share an eight-slot renderer. Potentials use the
// visible order 0|2, 1|3, 4|5, 6|7; Equipment remains vertical. Only a complete
// eight-Potential render is reconstructed as a grid, otherwise preserve render
// order vertically.
// =============================================================================

const deployPotentialState = {
    slots: [],
    timer: null,
    lastBlock: '',
    lastSentAt: 0
};

function formatDeployPotentialSlots(slots) {
    const placeholder = (s) => !s || s === '―' || s === '－－－';
    const realItems = slots.filter((s) => !placeholder(s));

    // Only a complete eight-Potential page is reconstructed as a 4x2 grid.
    // Equipment always remains a vertical list even if it happens to fill all
    // eight slots.
    if (
        getDeployPage() !== DEPLOY_PAGE_POTENTIALS ||
        realItems.length !== 8
    ) {
        return realItems.join('\n');
    }

    const rows = [
        [0, 2],
        [1, 3],
        [4, 5],
        [6, 7]
    ];

    const lines = [];

    for (const [leftIndex, rightIndex] of rows) {
        const left = slots[leftIndex] || '';
        const right = slots[rightIndex] || '';

        if (placeholder(left) || placeholder(right))
            return realItems.join('\n');

        lines.push(`${left}　｜　${right}`);
    }

    return lines.join('\n');
}

function flushDeployPotentialSlots() {
    const state = deployPotentialState;

    if (state.timer !== null) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    if (state.slots.length === 0)
        return;

    // Pad partial/unexpected renders rather than changing slot positions.
    while (state.slots.length < 8)
        state.slots.push('');

    const out = formatDeployPotentialSlots(state.slots.slice(0, 8));
    const now = Date.now();

    state.slots = [];

    if (!out)
        return;

    if (
        out === state.lastBlock &&
        (now - state.lastSentAt) < 700
    ) {
        return;
    }

    state.lastBlock = out;
    state.lastSentAt = now;
    sendOutput(out);
}

function queueDeployPotentialSlot(text, context) {
    const state = deployPotentialState;

    // R9 identifies which subpage is rendering (0x74 Potentials, 0x7C Equipment)
    // and RSI points to the deployment controller holding the 0/1/2 page index.
    noteDeployPageContent(context);

    state.slots.push(text || '');

    if (state.timer !== null)
        clearTimeout(state.timer);

    // The renderer is an eight-slot loop, so normally flush exactly at slot 8.
    if (state.slots.length >= 8) {
        flushDeployPotentialSlots();
        return;
    }

    // Fallback only for an interrupted/partial UI render.
    state.timer = setTimeout(flushDeployPotentialSlots, 180);
}

(function () {
    const results = getMatches(
        'deployPotentialList',
        'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? FF C7 48 D1 C5 49 83 C7 08',
        1
    );

    if (results.length !== 1)
        return;

    Interceptor.attach(results[0].address, function () {
        // Preserve blank slots; slot position matters for the 4x2 layout.
        queueDeployPotentialSlot(getText(this.context.rdx), this.context);
    });
})();


// =============================================================================
// TANK / VEHICLE EQUIPMENT PANEL
// =============================================================================

hookTextCallFromAnchor(
    'tankName',
    '48 8B 93 08 02 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitGrouped('tankPanel', text, 110)
);

hookTextCall(
    'tankCommander',
    'E8 ?? ?? ?? ?? 44 8B 83 34 02 00 00',
    (text) => emitGrouped('tankPanel', text, 110)
);

hookTextCallFromAnchor(
    'tankWeapon',
    '4A 8B 94 F7 60 02 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x11,
    (text) => emitGrouped('tankPanel', text, 110)
);

hookTextCall(
    'tankMiscA',
    'E8 ?? ?? ?? ?? 83 BF 30 02 00 00 00',
    (text) => emitGrouped('tankPanel', text, 110)
);

hookTextCall(
    'tankMiscB',
    'E8 ?? ?? ?? ?? 48 81 C4 A8 00 00 00 5F 5D',
    (text) => emitGrouped('tankPanel', text, 110)
);

hookTextCallFromAnchor(
    'tankSelectedPart',
    '48 8B 97 C0 00 00 00 41 B8 01 00 00 00 48 89 C1 E8',
    0x10,
    (text) => emitLatest('tankPart', text, 110)
);



// =============================================================================
// BATTLE RESULTS
// =============================================================================
// Emit the report title and mission name only. Detailed result labels are omitted
// because their numeric values are rendered separately.
// =============================================================================

hookTextCall(
    'resultMissionTitle',
    'E8 ?? ?? ?? ?? 48 8B 07 44 8B 50 10 44 89 93 0C 02 00 00',
    (text) => sendOutput(`戦績報告書\n${text}`)
);


// =============================================================================
// ORDERS
// =============================================================================
// The selected description has a reliable hook, but the name path redraws the
// whole list. Pair descriptions with known names instead of tracking selection.
// In briefing, page changes alone do not refresh the description; selection does.
// NFKC normalization makes full-width/ASCII typography equivalent for lookup.
// =============================================================================

function normalizeOrderDescription(text) {
    let s = text || '';

    try {
        s = s.normalize('NFKC');
    }
    catch (_) {}

    return s.replace(/\s+/g, '').trim();
}

const orderByDescription = new Map();

function addOrder(name, ...descriptions) {
    for (const description of descriptions) {
        orderByDescription.set(
            normalizeOrderDescription(description),
            name
        );
    }
}

addOrder(
    '即時出撃要請',
    '自軍拠点から味方1人を即時出撃させる。'
);

addOrder(
    '全力回避',
    '味方1人の回避能力がアップする。'
);

addOrder(
    '一斉回避',
    '部隊全員の回避能力がアップする。'
);

addOrder(
    '全力攻撃',
    '味方1人の対人攻撃力がアップする。'
);

addOrder(
    '一斉攻撃',
    '味方全体の対人攻撃力がアップする。'
);

addOrder(
    '全力破壊',
    '味方1人の対戦車攻撃力がアップする。'
);

addOrder(
    '一斉全力破壊',
    '味方全体の対戦車攻撃力がアップする。'
);

addOrder(
    '精密狙撃',
    '味方1人の射撃能力がアップする。'
);

addOrder(
    '一斉精密狙撃',
    '味方全体の射撃能力がアップする。'
);

addOrder(
    '全力防御',
    '味方歩兵1人の防御力がアップする。'
);

addOrder(
    '一斉防御',
    '味方歩兵全体の防御力がアップする。'
);

addOrder(
    '集中射撃',
    '味方1人の射撃能力がアップして一点に弾が集中する。'
);

addOrder(
    '貫通射撃',
    '味方1人の攻撃が、敵の防御力の影響を受けなくなる。'
);

addOrder(
    '急所攻撃',
    '味方1人の攻撃が全て致命傷となる。'
);

addOrder(
    '無効化攻撃',
    '対象の味方1人は、攻撃後でも反撃を受けなくなる。'
);

addOrder(
    '鼓舞',
    '味方1人を高揚状態にする。'
);

addOrder(
    '治療要請',
    '味方歩兵1人のHPをある程度回復する。',
    // Alternate wording.
    '味方歩兵1人のHPがある程度回復する。'
);

addOrder(
    '応急処置',
    '味方歩兵1人のHPが全回復する。'
);

addOrder(
    '解毒処置',
    '味方1人の状態異常が解除される。'
);

addOrder(
    '衛生兵要請',
    '味方1人を負傷退避させる。'
);

addOrder(
    '支援物資要請',
    '味方1人の弾薬が補給される。'
);

addOrder(
    '一斉補給要請',
    '味方全体の弾薬を最大回復する。'
);

addOrder(
    '回復リミット解除',
    '味方1人のラグナエイド使用時の回復量が2倍になる。'
);

addOrder(
    '爆発リミット解除',
    '味方1人の手榴弾の攻撃力がアップする。'
);

addOrder(
    '爆発耐性強化',
    '味方一人の榴弾（範囲攻撃）で受けるダメージを半減する。',
    '味方1人の榴弾（範囲攻撃）で受けるダメージを半減する。'
);

addOrder(
    '爆発範囲強化',
    '味方1人の爆発系範囲攻撃の範囲をアップする。'
);

addOrder(
    '装甲強化',
    '味方戦車1台の装甲をアップする。'
);

addOrder(
    '一斉装甲強化',
    '全ての味方戦車の装甲をアップする。'
);

addOrder(
    '応急修理',
    '味方車輌1台のHPをある程度回復する。',
    '味方車両1台のHPをある程度回復する。'
);

addOrder(
    '履帯強化',
    '味方車輌1台の擲弾砲の迎撃によるAP減少を無効化する。',
    '味方車両1台の擲弾砲の迎撃によるAP減少を無効化する。'
);


// -----------------------------------------------------------------------------
// SHIP ORDERS
// -----------------------------------------------------------------------------
// Ship Order names do not pass through the normal Order-name path, so pair their
// descriptions the same way. Generic Ship Order menu help keeps its context tag.
// -----------------------------------------------------------------------------

const shipOrderByDescription = new Map();

function addShipOrder(name, ...descriptions) {
    for (const description of descriptions) {
        shipOrderByDescription.set(
            normalizeOrderDescription(description),
            name
        );
    }
}

addShipOrder(
    'レーダー',
    '指定地点周辺の敵を発見します。'
);

addShipOrder(
    '艦砲射撃',
    '指定地点に対し、艦砲射撃による攻撃を行います。'
);

addShipOrder(
    '救護部隊',
    '味方歩兵全体を回復し、瀕死の歩兵の救助を行います。'
);

addShipOrder(
    '車輌応急修理',
    '撤退中の車輌を戦場に復帰させます。',
    // Harmless orthographic alias in case another path normalizes 車輌 -> 車両.
    '撤退中の車両を戦場に復帰させます。'
);

const shipOrderMenuHelp = new Set([
    normalizeOrderDescription('センチュリオンに支援要請を行います。')
]);


// -----------------------------------------------------------------------------
// COMBAT COMMAND MENU HELP
// -----------------------------------------------------------------------------
//
// These are fixed descriptions for the top-level combat command menu.
// Exact-match tagging gives the description its visible menu-item context
// without changing unrelated contextual-help strings.
//
// Output example:
//   【ミッション情報】戦闘の勝利条件、敗北条件、各種情報を確認します。
// -----------------------------------------------------------------------------

const combatMenuHelpByDescription = new Map([
    [
        normalizeOrderDescription(
            '戦闘の勝利条件、敗北条件、各種情報を確認します。'
        ),
        'ミッション情報'
    ],
    [
        normalizeOrderDescription(
            'ゲーム中の設定を変更したり、ゲームの進行状況を保存します。'
        ),
        'システム'
    ],
    [
        normalizeOrderDescription(
            '現在の戦闘をリタイアします。'
        ),
        'リタイア'
    ],
    [
        normalizeOrderDescription(
            'フェイズを終了して、敵のフェイズに移行します。'
        ),
        'フェイズ終了'
    ],
    [
        normalizeOrderDescription(
            '習得しているオーダーを発令します。'
        ),
        'オーダー'
    ]
]);

function emitCombatMenuHelp(text) {
    const tag = combatMenuHelpByDescription.get(
        normalizeOrderDescription(text)
    );

    if (!tag)
        return false;

    sendOutput(`【${tag}】${text}`);
    return true;
}


function emitShipOrderDescription(text) {
    const normalized = normalizeOrderDescription(text);

    if (shipOrderMenuHelp.has(normalized)) {
        sendOutput(`【シップオーダー】${text}`);
        return true;
    }

    const name = shipOrderByDescription.get(normalized);

    if (!name)
        return false;

    sendOutput(`${name}: ${text}`);
    return true;
}


function emitOrderDescription(text) {
    const name = orderByDescription.get(
        normalizeOrderDescription(text)
    );

    if (!name)
        return false;

    sendOutput(`${name}: ${text}`);
    return true;
}



// =============================================================================
// NORMAL CHARACTER-INFO POTENTIAL GRID
// =============================================================================
// This view is row-major (0|1, 2|3, 4|5, 6|7), unlike deployment. Because locked
// cells are omitted, only complete eight-entry lists are reconstructed as a grid;
// shorter lists stay vertical to avoid inventing pairings.
// =============================================================================

const characterPotentialGridState = {
    items: [],
    seen: new Set(),
    timer: null,
    lastBlock: '',
    lastSentAt: 0
};

function emitCharacterPotentialGrid(text, wait = 180, repeatAfter = 700) {
    if (!text)
        return;

    const state = characterPotentialGridState;

    if (!state.seen.has(text)) {
        state.seen.add(text);
        state.items.push(text);
    }

    if (state.timer !== null)
        clearTimeout(state.timer);

    state.timer = setTimeout(function () {
        const items = state.items.slice();
        const now = Date.now();

        state.items = [];
        state.seen.clear();
        state.timer = null;

        if (items.length === 0)
            return;

        let out = '';

        // The normal detailed character renderer omits blank/locked cells
        // entirely. With all eight entries present, row-major pairing is
        // proven. With fewer than eight, slot gaps cannot be reconstructed
        // reliably from text alone, so preserve the raw visual/render order
        // vertically rather than inventing pairings.
        if (items.length === 8) {
            const lines = [];

            for (let i = 0; i < 8; i += 2)
                lines.push(`${items[i]}　｜　${items[i + 1]}`);

            out = lines.join('\n');
        }
        else {
            out = items.join('\n');
        }

        if (!out)
            return;

        if (
            out === state.lastBlock &&
            (now - state.lastSentAt) < repeatAfter
        ) {
            return;
        }

        state.lastBlock = out;
        state.lastSentAt = now;

        sendOutput(out);
    }, wait);
}



// -----------------------------------------------------------------------------
// POST-DEFEAT MENU HELP
// -----------------------------------------------------------------------------
//
// Exact mappings for the five visible post-defeat menu commands.
// This helper is called only from the dedicated post-defeat mouse/controller
// description callers, so identical wording elsewhere is left untouched.
// -----------------------------------------------------------------------------

const defeatMenuHelpByDescription = new Map([
    [
        normalizeOrderDescription(
            '現在の戦闘を初めからやり直します。'
        ),
        '再戦'
    ],
    [
        normalizeOrderDescription(
            '現在の戦闘を出撃隊員の配置からやり直します。'
        ),
        'ブリーフィング'
    ],
    [
        normalizeOrderDescription(
            'ブックモードへ戻ります。'
        ),
        'ブックモード'
    ],
    [
        normalizeOrderDescription(
            'セーブデータを読み込みます。'
        ),
        'ロード'
    ],
    [
        normalizeOrderDescription(
            'タイトル画面へ戻ります。保存していない情報は失われます。'
        ),
        'タイトル'
    ]
]);

function emitDefeatMenuHelp(text) {
    const tag = defeatMenuHelpByDescription.get(
        normalizeOrderDescription(text)
    );

    if (!tag)
        return false;

    sendOutput(`【${tag}】${text}`);
    return true;
}



// -----------------------------------------------------------------------------
// COMBAT POTENTIAL ACTIVATION
// -----------------------------------------------------------------------------
// Battle and cut-in Personal Potentials use separate text paths. Strip their
// local [dt(...)] presentation markup without broadening global text cleanup.
// -----------------------------------------------------------------------------

function cleanCombatPotentialText(text) {
    if (!text)
        return '';

    return text
        .replace(/\[dt\([^)]+\)\]/gi, '')
        .replace(/\r/g, '')
        .replace(/\0+$/g, '')
        .trim();
}

function emitBattlePotentialActivation(text) {
    const out = cleanCombatPotentialText(text);

    if (!out)
        return;

    emitGrouped('battlePotentialActivation', out, 90);
}

function emitPersonalPotentialEffect(text) {
    const out = cleanCombatPotentialText(text);

    if (!out)
        return;

    // Keep the title/effect presentation together when they arrive in the
    // same cut-in burst, while allowing either line to survive independently.
    emitGrouped('personalPotentialActivation', out, 220);
}



// =============================================================================
// R&D SELECTED STAT PANEL
// =============================================================================
//
// The selected weapon panel writes its four numeric stats through four nearby
// formatter calls. R8 contains the value before each call. Each call is
// resolved from a short unique signature beginning at the call instruction.
//
// Uniform defense uses its separately resolved SetText caller; its RDX text is
// formatted as [f1N] and is emitted as 防御 N.
//
// Ammo is omitted because it does not have a clean dedicated extraction path.
// Accuracy remains omitted because its rank glyph does not use these numeric
// text paths. Tank and ship equipment stats are also omitted because their
// numeric callers are positional slots whose meanings vary by equipment type.
// =============================================================================

const rndSelectedStatState = {
    generation: 0,
    range: null,
    antiPersonnel: null,
    antiArmor: null,
    shots: null,
    defense: null,
    timer: null
};

function resetRndSelectedStats() {
    rndSelectedStatState.generation++;
    rndSelectedStatState.range = null;
    rndSelectedStatState.antiPersonnel = null;
    rndSelectedStatState.antiArmor = null;
    rndSelectedStatState.shots = null;
    rndSelectedStatState.defense = null;

    if (rndSelectedStatState.timer !== null) {
        clearTimeout(rndSelectedStatState.timer);
        rndSelectedStatState.timer = null;
    }
}

function scheduleRndSelectedStats() {
    if (rndSelectedStatState.timer !== null)
        clearTimeout(rndSelectedStatState.timer);

    const generation = rndSelectedStatState.generation;

    rndSelectedStatState.timer = setTimeout(function () {
        rndSelectedStatState.timer = null;

        if (generation !== rndSelectedStatState.generation)
            return;

        let out = '';

        if (
            rndSelectedStatState.range !== null ||
            rndSelectedStatState.antiPersonnel !== null ||
            rndSelectedStatState.antiArmor !== null ||
            rndSelectedStatState.shots !== null
        ) {
            const parts = [];

            if (rndSelectedStatState.range !== null)
                parts.push('射程 ' + rndSelectedStatState.range);

            if (rndSelectedStatState.antiPersonnel !== null)
                parts.push('対人 ' + rndSelectedStatState.antiPersonnel);

            if (rndSelectedStatState.antiArmor !== null)
                parts.push('対甲 ' + rndSelectedStatState.antiArmor);

            if (rndSelectedStatState.shots !== null)
                parts.push('発射数 ' + rndSelectedStatState.shots);

            out = parts.join('　');
        }
        else if (rndSelectedStatState.defense !== null) {
            out = '防御 ' + rndSelectedStatState.defense;
        }

        if (out)
            sendOutput(out);
    }, 170);
}

function noteRndWeaponStat(field, value) {
    if (!Number.isFinite(value))
        return;

    rndSelectedStatState[field] = value;
    scheduleRndSelectedStats();
}

function parseRndFormattedInteger(text) {
    if (!text)
        return null;

    const match = /^\[f1(-?\d+)\]$/i.exec(text.trim());

    if (!match)
        return null;

    const value = Number(match[1]);

    return Number.isFinite(value) ? value : null;
}

function noteRndUniformDefense(text) {
    const value = parseRndFormattedInteger(text);

    if (value === null)
        return;

    rndSelectedStatState.defense = value;
    scheduleRndSelectedStats();
}


// =============================================================================
// COMMON UI SETTEXT DISPATCH
// =============================================================================
//
// Resolve the verified semantic callers by pattern, then hook the common
// text-setter once and dispatch by the resolved return address.
// =============================================================================

(function () {
    const dispatch = new Map();
    let resolvedCount = 0;

    function resolveUniqueCall(name, pattern) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);

        if (results.length !== 1) {
            console.error(
                `[VC4:${name}] expected 1 match, found ${results.length}`
            );
            return null;
        }

        const address = results[0].address;

        try {
            if (address.readU8() !== 0xE8)
                throw new Error('target is not a direct call');
        }
        catch (e) {
            console.error(`[VC4:${name}] ${e.message}`);
            return null;
        }

        return address;
    }

    function resolveAnchoredCall(name, pattern, callOffset) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);

        if (results.length !== 1) {
            console.error(
                `[VC4:${name}] expected 1 anchor, found ${results.length}`
            );
            return null;
        }

        const address = results[0].address.add(callOffset);

        try {
            if (address.readU8() !== 0xE8)
                throw new Error('resolved instruction is not a direct call');
        }
        catch (e) {
            console.error(`[VC4:${name}] ${e.message}`);
            return null;
        }

        return address;
    }

    function resolveNearbyCall(
        name,
        pattern,
        anchor,
        minDelta,
        maxDelta
    ) {
        if (!anchor)
            return null;

        const results = Memory.scanSync(__e.base, __e.size, pattern);
        const matches = [];

        for (const result of results) {
            const delta = result.address.sub(anchor).toInt32();

            if (delta >= minDelta && delta <= maxDelta)
                matches.push(result.address);
        }

        if (matches.length !== 1) {
            console.error(
                `[VC4:${name}] expected 1 nearby match, found ${matches.length}`
            );
            return null;
        }

        try {
            if (matches[0].readU8() !== 0xE8)
                throw new Error('resolved instruction is not a direct call');
        }
        catch (e) {
            console.error(`[VC4:${name}] ${e.message}`);
            return null;
        }

        return matches[0];
    }

    function directCallTarget(address) {
        try {
            if (!address || address.readU8() !== 0xE8)
                return null;

            return address.add(5).add(address.add(1).readS32());
        }
        catch (_) {
            return null;
        }
    }

    function followJumpChain(address) {
        let current = address;

        for (let i = 0; i < 6; i++) {
            try {
                const opcode = current.readU8();

                if (opcode === 0xE9) {
                    current = current.add(5).add(current.add(1).readS32());
                    continue;
                }

                if (opcode === 0xEB) {
                    current = current.add(2).add(current.add(1).readS8());
                    continue;
                }
            }
            catch (_) {
                return current;
            }

            break;
        }

        return current;
    }

    function addDispatch(name, callAddress, output) {
        if (!callAddress)
            return null;

        dispatch.set(callAddress.add(5).toString(), output);
        resolvedCount++;
        return callAddress;
    }

    // Battle infantry names call the common text-setter directly, so use this
    // verified caller to resolve the shared endpoint itself.
    const battleUnitCall = resolveUniqueCall(
        'setTextBattleUnitName',
        'E8 ?? ?? ?? ?? B9 40 00 00 00 48 8D 43 50 45 85 F6 48 0F 45 C1 48 8B 00 48 8B 08 8B 49 04 E8'
    );

    const setTextAddress = followJumpChain(directCallTarget(battleUnitCall));

    if (!setTextAddress) {
        console.error('[VC4:setTextDispatch] common text-setter not resolved');
        return;
    }

    // Briefing character-info bottom description. Shared by Claude's
    // Order pages and normal character Potential pages.
    addDispatch(
        'briefingDescription',
        resolveUniqueCall(
            'setTextBriefingDescription',
            'E8 ?? ?? ?? ?? F3 0F 10 0D ?? ?? ?? ?? 0F 57 DB C7 44 24 28 00 00 00 00 0F 57 D2 B9 07 00 00 00 89 74 24 20 E8 ?? ?? ?? ?? 48 8B 74 24 40 4C 8B 74 24 50'
        ),
        function (text) {
            if (emitOrderDescription(text))
                return;

            emitLatest('briefingDescription', text, 100);
        }
    );

    addDispatch(
        'battleUnitName',
        battleUnitCall,
        function (text) {
            emitLatest('battleUnitName', text, 80);
        }
    );

    // Vehicle names use a nearby unique anchor; the call itself is shared by
    // several closely related render paths.
    addDispatch(
        'battleVehicleName',
        resolveAnchoredCall(
            'setTextBattleVehicleName',
            'BA 02 00 00 00 E8 ?? ?? ?? ?? 41 B8 01 00 00 00 48 8B D0 48 8B CD E8',
            0x16
        ),
        function (text) {
            emitLatest('battleVehicleName', text, 80);
        }
    );

    addDispatch(
        'characterPotentialList',
        resolveUniqueCall(
            'setTextCharacterPotentialList',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? FF C5 48 FF C6 49 83 C6 08'
        ),
        function (text) {
            emitCharacterPotentialGrid(text, 180, 700);
        }
    );

    addDispatch(
        'potentialDescription',
        resolveUniqueCall(
            'setTextPotentialDescription',
            'E8 ?? ?? ?? ?? F3 0F 10 0D ?? ?? ?? ?? 0F 57 DB 0F 57 D2 C7 44 24 28 00 00 00 00 B9 07 00 00 00 C7 44 24 20 01 00 00 00 E8 ?? ?? ?? ?? 31 C0 48 83 C4 30'
        ),
        function (text) {
            emitLatest('potentialDescription', text, 110);
        }
    );

    const battlePotentialA = addDispatch(
        'battlePotentialActivationA',
        resolveUniqueCall(
            'setTextBattlePotentialActivationA',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 83 BF 50 01 00 00 00'
        ),
        function (text) {
            emitBattlePotentialActivation(text);
        }
    );

    addDispatch(
        'battlePotentialActivationB',
        resolveNearbyCall(
            'setTextBattlePotentialActivationB',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 8B 8C 24 C0 00 00 00 48 31 E1 E8 ?? ?? ?? ?? 4C 8D 9C 24 D0 00 00 00',
            battlePotentialA,
            0x20,
            0x120
        ),
        function (text) {
            emitBattlePotentialActivation(text);
        }
    );

    addDispatch(
        'personalPotentialEffect',
        resolveAnchoredCall(
            'setTextPersonalPotentialEffect',
            '41 B8 01 00 00 00 4C 89 F2 48 89 C1 E8',
            0x0C
        ),
        function (text) {
            emitPersonalPotentialEffect(text);
        }
    );

    const newspaperPage1 = addDispatch(
        'newspaperArticlePage1',
        resolveUniqueCall(
            'setTextNewspaperArticlePage1',
            'E8 ?? ?? ?? ?? F3 0F 10 0D ?? ?? ?? ?? 0F 57 DB C7 44 24 28 00 00 00 00 0F 57 D2 B9 CB 86 01 00'
        ),
        function (text) {
            emitLatest('newspaperArticleBody', text, 80);
        }
    );

    addDispatch(
        'newspaperArticlePageN',
        resolveNearbyCall(
            'setTextNewspaperArticlePageN',
            'E8 ?? ?? ?? ?? F3 0F 10 0D ?? ?? ?? ?? 0F 57 DB C7 44 24 28 00 00 00 00 0F 57 D2 B9 05 00 00 00 C7 44 24 20 01 00 00 00 E8 ?? ?? ?? ?? B8 01 00 00 00',
            newspaperPage1,
            0x80,
            0x220
        ),
        function (text) {
            emitLatest('newspaperArticleBody', text, 80);
        }
    );

    addDispatch(
        'contextHelpBattle',
        resolveUniqueCall(
            'setTextContextHelpBattle',
            'E8 ?? ?? ?? ?? F7 43 0C 00 00 00 10 75 ?? 48 8B 03 BA 01 00 00 00 48 89 D9 FF 90 F8 00 00 00 48 8B 5C 24 30'
        ),
        function (text) {
            if (emitCombatMenuHelp(text))
                return;

            if (emitShipOrderDescription(text))
                return;

            if (emitOrderDescription(text))
                return;

            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'contextHelpB2C',
        resolveUniqueCall(
            'setTextContextHelpB2C',
            'E8 ?? ?? ?? ?? C7 83 A4 00 00 00 01 00 00 00 48 8B 5C 24 30 48 83 C4 20 5F C3'
        ),
        function (text) {
            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'contextHelpB7A',
        resolveUniqueCall(
            'setTextContextHelpB7A',
            'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8B 18 02 00 00 E8 ?? ?? ?? ?? 48 8B 7C 24 60 C7 83 DC 01 00 00 04 00 00 00'
        ),
        function (text) {
            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'defeatHelpController',
        resolveUniqueCall(
            'setTextDefeatHelpController',
            'E8 ?? ?? ?? ?? B8 01 00 00 00 48 8B 7C 24 40 48 83 C4 30 5B C3'
        ),
        function (text) {
            if (emitDefeatMenuHelp(text))
                return;

            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'defeatHelpMouse',
        resolveAnchoredCall(
            'setTextDefeatHelpMouse',
            '48 8D 15 ?? ?? ?? ?? 41 89 F8 48 89 F1 E8',
            0x0D
        ),
        function (text) {
            if (emitDefeatMenuHelp(text))
                return;

            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'contextHelp535',
        resolveAnchoredCall(
            'setTextContextHelp535',
            '41 B8 01 00 00 00 48 89 F1 48 89 C2 E8',
            0x0C
        ),
        function (text) {
            emitLatest('contextHelp', text, 100);
        }
    );

    addDispatch(
        'bookSelectionText',
        resolveUniqueCall(
            'setTextBookSelectionText',
            'E8 ?? ?? ?? ?? 48 8B 74 24 30 48 8B 7C 24 38 48 89 D9 C7 83 A4 00 00 00 01 00 00 00 48 8B 5C 24 40'
        ),
        function (text) {
            emitLatest('bookSelectionText', text, 110);
        }
    );

    addDispatch(
        'bookMissionList',
        resolveUniqueCall(
            'setTextBookMissionList',
            'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8D 4C 24 68 8B 37 41 89 E8 E8 ?? ?? ?? ?? 85 F6 7E ?? 0F 28 D6'
        ),
        function (text) {
            emitList('bookMissionList', text, 190);
        }
    );

    addDispatch(
        'bookSquadStoryList',
        resolveUniqueCall(
            'setTextBookSquadStoryList',
            'E8 ?? ?? ?? ?? BF 01 00 00 00 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 41 FF C6'
        ),
        function (text) {
            emitList('bookSquadStoryList', text, 190);
        }
    );

    addDispatch(
        'bookCategoryList',
        resolveUniqueCall(
            'setTextBookCategoryList',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? FF C6 48 83 C7 20 48 83 ED 01 0F 85 ?? ?? ?? ?? 48 8B 5C 24 50 48 8B 6C 24 60'
        ),
        function (text) {
            emitList('bookCategoryList', text, 190);
        }
    );

    addDispatch(
        'rndSelectedName',
        resolveUniqueCall(
            'setTextRndSelectedName',
            'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8B 20 02 00 00 E8 ?? ?? ?? ?? 48 89 C7 48 85 C0 74'
        ),
        function (text) {
            resetRndSelectedStats();
            emitLatest('workshop', text, 120);
        }
    );

    addDispatch(
        'workshopB491',
        resolveUniqueCall(
            'setTextWorkshopB491',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 63 86 A8 44 00 00'
        ),
        function (text) {
            emitLatest('workshop', text, 120);
        }
    );

    addDispatch(
        'workshop6BB2F',
        resolveUniqueCall(
            'setTextWorkshop6BB2F',
            'E8 ?? ?? ?? ?? F3 0F 10 3D ?? ?? ?? ?? 48 8D 3D ?? ?? ?? ?? 45 31 E4 4C 8D 15 ?? ?? ?? ?? 45 31 ED'
        ),
        function (text) {
            emitLatest('workshop', text, 120);
        }
    );

    addDispatch(
        'workshop6BB30',
        resolveUniqueCall(
            'setTextWorkshop6BB30',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 63 86 B0 24 00 00'
        ),
        function (text) {
            emitLatest('workshop', text, 120);
        }
    );

    addDispatch(
        'rndUniformDefense',
        resolveUniqueCall(
            'setTextRndUniformDefense',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 8B 5C 24 38 83 BF F0 00 00 00 00'
        ),
        function (text) {
            noteRndUniformDefense(text);
        }
    );

    const referenceEntryA = addDispatch(
        'referenceEntryA',
        resolveUniqueCall(
            'setTextReferenceEntryA',
            'E8 ?? ?? ?? ?? 48 63 93 EC 01 00 00 48 8B 8B 58 04 00 00 49 8B 94 D7 C0 61 02 01 E8'
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    const referenceEntryB = addDispatch(
        'referenceEntryB',
        resolveUniqueCall(
            'setTextReferenceEntryB',
            'E8 ?? ?? ?? ?? 48 85 DB 74 ?? 83 6B 08 01 75 ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? 48 8B 7C 24 58 4C 8B 7C 24 20'
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    // The location and weapon detail routines are near-identical clones.
    // Resolve them relative to the unique Reference entry callers.
    addDispatch(
        'referenceLocationName',
        resolveNearbyCall(
            'setTextReferenceLocationName',
            'E8 ?? ?? ?? ?? 48 63 93 EC 01 00 00 48 8B 8B 58 04 00 00 49 8B 94 D6 C0 61 02 01 E8 ?? ?? ?? ?? 4C 8B 74 24 40 48 89 C3 48 8B 6C 24 30 48 85 C0',
            referenceEntryA,
            -0x5000,
            -0x100
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    const referenceDescriptionPattern =
        'E8 ?? ?? ?? ?? 48 8B 74 24 38 48 8B 5C 24 48 48 83 C4 20 5F C3';

    addDispatch(
        'referenceLocationDesc',
        resolveNearbyCall(
            'setTextReferenceLocationDesc',
            referenceDescriptionPattern,
            referenceEntryA,
            -0x5000,
            -0x100
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    addDispatch(
        'referenceWeaponDescription',
        resolveNearbyCall(
            'setTextReferenceWeaponDescription',
            referenceDescriptionPattern,
            referenceEntryB,
            0x100,
            0x1200
        ),
        function (text) {
            emitLatest('referenceDescription', text, 120);
        }
    );

    addDispatch(
        'referenceMedalName',
        resolveUniqueCall(
            'setTextReferenceMedalName',
            'E8 ?? ?? ?? ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8F C0 01 00 00 E8 ?? ?? ?? ?? 49 89 C7 48 85 C0 0F 84'
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    addDispatch(
        'referenceMedalDesc',
        resolveUniqueCall(
            'setTextReferenceMedalDesc',
            'E8 ?? ?? ?? ?? 48 85 DB 0F 84 ?? ?? ?? ?? 83 6B 08 01 0F 85 ?? ?? ?? ?? 31 D2 48 89 D9 E8 ?? ?? ?? ?? EB ?? 48 8B 15 ?? ?? ?? ?? 48 8B 8F C0 01 00 00'
        ),
        function (text) {
            emitGrouped('referenceEntry', text, 120);
        }
    );

    console.log(
        `[VC4:setTextDispatch] resolved ${resolvedCount}/32 callers`
    );

    Interceptor.attach(setTextAddress, {
        onEnter() {
            const output = dispatch.get(this.returnAddress.toString());

            if (!output)
                return;

            const text = getText(this.context.rdx);

            if (text.length !== 0)
                output(text, this.context);
        }
    });
})();


// -----------------------------------------------------------------------------
// R&D WEAPON STATS
// -----------------------------------------------------------------------------

(function () {
    const sites = [
        [
            'rndWeaponRange',
            'E8 ?? ?? ?? ?? 44 8B 83 D0 00 00 00',
            'range'
        ],
        [
            'rndWeaponAntiPersonnel',
            'E8 ?? ?? ?? ?? 44 8B 83 D4 00 00 00',
            'antiPersonnel'
        ],
        [
            'rndWeaponAntiArmor',
            'E8 ?? ?? ?? ?? 44 8B 83 D8 00 00 00',
            'antiArmor'
        ],
        [
            'rndWeaponShots',
            'E8 ?? ?? ?? ?? 44 8B 83 DC 00 00 00 48 8D 4C 24 30',
            'shots'
        ]
    ];

    for (const [name, pattern, field] of sites) {
        const results = getMatches(name, pattern);

        if (results.length !== 1)
            continue;

        Interceptor.attach(results[0].address, {
            onEnter() {
                let value = 0;

                try {
                    value = this.context.r8.toInt32();
                }
                catch (_) {
                    return;
                }

                noteRndWeaponStat(field, value);
            }
        });
    }
})();


// -----------------------------------------------------------------------------
// CUT-IN PERSONAL POTENTIAL TITLE
// -----------------------------------------------------------------------------
// The title is in RDX at this bounded string-copy call.
// -----------------------------------------------------------------------------

(function () {
    const results = getMatches(
        'personalPotentialTitle',
        'E8 ?? ?? ?? ?? 48 8B 74 24 68 C7 83 B0 00 00 00 05 00 00 00'
    );

    if (results.length !== 1)
        return;

    Interceptor.attach(results[0].address, {
        onEnter(args) {
            const p = this.context.rdx;

            if (!p || p.isNull())
                return;

            let raw = '';

            try {
                raw = p.readUtf8String() || '';
            }
            catch (_) {
                return;
            }

            const out = cleanCombatPotentialText(raw);

            if (!out)
                return;

            emitGrouped('personalPotentialActivation', out, 220);
        }
    });
})();


console.log('[VC4] v1.0 stable hooks loaded');
