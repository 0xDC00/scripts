// ==UserScript==
// @name         Granblue Fantasy Relink
// @version      1.3.2
// @author       Mansive (thanks Koukdw)
// @description  Steam
// * Cygames, Inc.
//
// https://store.steampowered.com/app/881020/Granblue_Fantasy_Relink/
// ==/UserScript==

const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];
const size = 0x62da000; // executable size
// const size = 0x3cf2000 + 0x100000; // size of .text plus some headroom; faster scanning

const BACKTRACE = false;
const INSPECT_ARGS = false;

const ASYNC_SCAN = true;
const ON_ENTER = true;
const ON_ENTER_EXTENDED = false;

let shouldConvertToSingleLine = true;

const texts = new Set();
let timer = null;
let dialogueName = "";
let previous = "";
let hooksCount = 0;

let orderedTimer = null;
let topText = "";
let middleText = "";
let bottomText = "";
const bottomTexts = new Set();

//#region Hooks

const hooksStatus = {
  // exampleHookName: { enabled: true, characters: 0 },
};

const hooks = [
  {
    name: "CutsceneDialogueName",
    pattern: "E8 ???????? ?? 8B 8B ????0000 ?? ?? ?? 74 ?? ?? 89",
    handler: mainHandler,
  }, // E8 72744101
  {
    name: "CutsceneDialogueText",
    pattern: "E8 ???????? 8B 8B ????0000 31 C0",
    handler: mainHandler,
  }, // E8 58744101
  {
    name: "CutsceneCenterText",
    pattern: "41 B8 FFFFFFFF E8 ???????? 31 C0",
    handler: mainHandler,
  }, // 8E 94010000
  {
    name: "OverworldDialogueName",
    pattern: "8B 95 ???????? 41 B8 FFFFFFFF E8 ???????? ?? 8B",
    handler: mainHandler,
  }, // E8 D7762000
  {
    name: "OverworldDialogueText",
    pattern: "44 ?? ?? ?? ?? FFFFFFFF E8 ???????? 8B 87",
    handler: mainHandler,
  }, // E8 BD762000
  {
    name: "OverworldDialogueChoice",
    pattern:
      "FF 90 ??000000 ?? 89 ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ???????? 00 ?? ?? ?? ???????? ?? ?? ?? A0",
    handler: mainHandler,
  }, // FF 90 B0000000
  {
    name: "OverworldNPCDialogueText",
    pattern: "41 ?? FFFFFFFF E8 ???????? C6 ?? ????0000 01 8B",
    handler: mainHandler,
  }, // E8 BA928601
  {
    name: "ADVDialogueName",
    pattern: "E8 ???????? 41 89 ?? ?? ????0000 ?? 8B ?? ???????? 89 DA",
    handler: ADVNameHandler,
  }, // E8 6F380100
  {
    name: "ADVDialogueText",
    pattern: "41 ?? FFFFFFFF E8 ???????? 66 C7 83 ????0000 0000",
    handler: ADVTextHandler,
  }, // E8 50370100
  {
    name: "OverworldAreaName",
    pattern: "48 89 F9 41 ?? FFFFFFFF E8 ???????? ???? ?? ????0000 89",
    handler: mainHandler,
  }, // E8 631246FF
  {
    name: "CutsceneChapterTitle",
    pattern: "48 89 D9 41 ?? FFFFFFFF E8 ???????? ???? ?? ????0000 89",
    handler: mainHandler,
  }, // E8 458B4101
  {
    name: "Prompt",
    pattern:
      "41 ?? FFFFFFFF E8 ???????? EB ?? 48 83 C4 20 ?? ?? ?? C3 CC CC CC CC CC CC CC 41 56",
    handler: mainHandler,
  }, // E8 4176ABFF or 4C 89 EA E8 BE1E0000
  {
    name: "DictionaryName1",
    pattern: "E8 ???????? 43 8B 5C 3E",
    handler: scrollHandlerTop1,
  }, // E8 D1347EFE
  {
    name: "DictionaryName2",
    pattern: "E8 ???????? 43 8B 44 3E 14",
    handler: scrollHandlerTop1,
  }, // E8 DD237EFE
  {
    name: "DictionaryInfo1",
    pattern: "48 8B 9E ???????? 48 85 DB ???? ???????? ?? ?? ?? ?? B8 FFFFFFFF",
    handler: infoDumpHandler,
  }, // E8 E32F7EFE, before
  {
    name: "DictionaryInfo2",
    pattern:
      "48 ?? ?? ?? ?? FFFFFFFF E8 ???????? ???????? ?? ?????? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ???????????????? ?? ???? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? C5F????? ?? ??0000",
    handler: infoDumpHandler,
  }, // E8 A01E7EFE
  {
    name: "DictionaryInfo3",
    pattern:
      "8B 55 C4 41 B8 FFFFFFFF E8 ???????? 48 8B 83 ??000000 48 2B 83 ??000000 48 C1 E8 03 C5?????? C5?????? ?? ??0000",
    handler: infoDumpHandler,
  }, // E8 EC2C7EFE
  // {
  //   name: "CenterBanner",
  //   pattern: "E8 BE1E0000 41 8B",
  //   handler: mainHandler,
  // }, // E8 BE1E0000
  {
    name: "PauseSummaryTitle",
    pattern: "48 8B 06 ?? ?? ?? ?? ?? ?? FF ?? ?? 48 8B 4D ?? 48",
    handler: scrollHandlerTop2,
  }, // FF 50 08
  {
    name: "PauseSummaryInfo",
    pattern: "48 89 F2 41 89 D8 E8 ?? ?? ?? ?? 48 8B",
    handler: scrollHandler2,
  }, // E8 FCC3FFFF
  {
    name: "TipScreenTitle",
    pattern: "41 ?? FFFFFFFF E8 ???????? 8B 47 ?? 41",
    handler: mainHandler,
  }, // E8 F7ECB5FF
  {
    name: "TipScreenInfo",
    pattern: "41 ?? FFFFFFFF E8 ???????? 49 8B 84 24 88 ?? 00 00 ?? ?? C0",
    handler: mainHandler,
  }, // E8 38ECB5FF
  {
    name: "LoadingScreenTitle",
    pattern: "41 ?? FFFFFFFF E8 ???????? 48 63 86 ????0000",
    handler: mainHandler,
  }, // E8 E1541E00
  {
    name: "LoadingScreenInfo",
    pattern:
      "E8 ???????? 48 8B ?? ????0000 ?? ?? ?? ?? ?? ?? ?? ?? ?? FFFFFFFF E8 ???????? ?? ?? ?? ????0000 48 85 FF",
    handler: mainHandler,
  }, // E8 1D541E00
  {
    name: "SieroItemName",
    pattern:
      "41 ?? FFFFFFFF E8 ???????? 48 ?? ?? ?? 48 ?? ?? 0F?? ????0000 48 8B 4E 10",
    handler: sieroItemNameHandler,
  }, // 41 B8 FFFFFFFF, before E8 B878BCFE
  {
    name: "SieroItemInfo",
    pattern:
      "E8 ???????? 48 ?? ?? ?? 48 ?? ?? 0F?? ????0000 48 ?? ?? 10 48 ?? ?? ?? ?? 48 ?? ?? 10",
    handler: scrollHandlerNoSingle1,
  }, // E8 B878BCFE
  {
    name: "SieroSigilInfo",
    pattern: "E8 50C197FE",
    handler: scrollHandlerNoSingle1,
  }, // E8 50C197FE
  {
    name: "CrewmateInfo",
    pattern: "41 B8 FFFFFFFF E8 ???????? 80 BD ??000000 00",
    handler: scrollHandler1,
  }, // E8 961AFEFF
  {
    name: "QuestSelectName",
    pattern:
      "66 ?? ???? ?? 00 00 00 00 00 ?? ?? ?? 41 B8 FFFFFFFF E8 ???????? 48 ?? ?? 20",
    handler: questSelectNameHandler,
  }, // E8 62ECD4FE
  {
    name: "ChapterSelectInfo",
    pattern:
      "41 ?? ?? ?? 41 B8 FFFFFFFF E8 ???????? 49 ?? ?? ?? ??000000 48 ?? F6",
    handler: scrollHandler1,
  }, // E8 9627A5FE
  {
    name: "FateEpisodeText",
    pattern: "E8 ???????? ?? ?? ?? ????0000 0000 C7 86 ????0000 00000000 48 8B",
    handler: mainHandler,
  }, // E8 5E392100
  {
    name: "CharacterCommandListSupportSkillName",
    pattern:
      "41 ?? FFFFFFFF E8 ???????? 49 ?? ?? ?? ??000000 ?? ?? ?? ?? ?? 48",
    handler: scrollHandlerMulti1,
  }, // E8 F3B4A4FE
  {
    name: "CharacterCommandListSupportSkillInfo",
    pattern:
      "41 ?? FFFFFFFF E8 ???????? 49 ?? ?? ?? ??000000 ?? ?? ?? ?? ?? F6",
    handler: scrollHandlerMulti1,
  }, // E8 D3B4A4FE
  {
    name: "SkillName1",
    pattern: "C7 45 DC 00000000 48 ?? ?? ?? E8 ???????? 48 8B",
    handler: skillNameHandler,
  }, // E8 E5B68BFF
  {
    name: "SkillName2",
    pattern: "C7 44 24 24 00000000 48 ?? ?? ?? ?? E8 ???????? EB",
    handler: skillNameHandler,
  }, // E8 E8998BFF
  {
    name: "SkillInfo",
    pattern: "41 ?? FFFFFFFF E8 ???????? 8B 56 ?0",
    handler: scrollHandlerMulti1,
  }, // E8 44A8E1FE
  {
    name: "SkillEffect",
    pattern: "41 ?? FFFFFFFF E8 ???????? 48 89 F9 31 D2 45 89 F0",
    handler: scrollHandlerMulti2,
  }, // E8 349E5EFE
  {
    name: "MasteryName",
    pattern: "8B 50 ?? 41 B8 FFFFFFFF E8 ???????? 48 8B 85 ???????? 48 8B",
    handler: scrollHandlerTop1,
  }, // E8 7008CBFE
  {
    name: "MasteryInfo",
    pattern: "8B 50 ?? 41 B8 FFFFFFFF E8 ???????? 48 8B 85 ???????? 83 78",
    handler: masteryInfoHandler,
  }, // E8 4808CBFE
  {
    name: "MasteryStats1",
    pattern: "E8 ???????? 83 BD ????0000 02 0F",
    handler: masteryStatsHandler,
  }, // E8 B091CAFE
  {
    name: "MasteryStats2",
    pattern: "E8 ???????? 31 ?? 44 ?? ?? 0F",
    handler: masteryStatsHandler,
  }, // E8 BA8FCAFE
  {
    name: "MasterySkillInfo",
    pattern: "8B 50 40 41 ?? FFFFFFFF E8 ???????? 49",
    handler: scrollHandler1,
  }, // E8 5BF0CAFE
  // {
  //   name: "InventoryItemName",
  //   pattern: "E8 C709BCFE",
  //   handler: scrollHandlerTop1,
  // }, // E8 C709BCFE; highly unstable
  {
    name: "InventoryItemInfo",
    pattern:
      "4C 8D 45 B0 E8 ???????? ?? ?? ?? ????0000 ?? ?? ?? ???? ????0000 ?? ?? ?? ??000000 ?? ?? ?? ??000000 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? 0F?? ??0000",
    handler: inventoryItemInfoHandler,
  }, // E8 DD22EAFE; edge case galore, but still workable
  {
    name: "InventoryWeaponName",
    pattern:
      "E8 ???????? EB ?? 48 ?? ?? 48 ?? ?? ???????? 48 ?? ?? 75 ?? BA ???????? E8 ???????? 48 ?? 00",
    handler: scrollHandlerTop2,
  }, // E8 9DF19EFF
  {
    name: "InventoryWeaponInfo",
    pattern: "4C ?? ?? ?? E8 ???????? 48 8B 8F ????0000 48 85 C9",
    handler: scrollHandler1,
  }, // E8 74C0E9FE
  {
    name: "SigilMenuName",
    pattern: "48 8B 55 F0 E8 ???????? 48 8B 8E ????0000",
    handler: scrollHandlerTop1,
  }, // E8 7504BFFF
  {
    name: "SigilMenuInfo",
    pattern: "41 B8 FFFFFFFF E8 ???????? 48 8B ?? ???????? 48 ?? ?? ?? 8B",
    handler: scrollHandlerNoSingle1,
  }, // E8 36CB9DFE
  {
    name: "SideQuestName",
    pattern: "89 F2 E8 ???????? 48 ?? ?? ??000000 41",
    handler: scrollHandlerTop2,
  }, // E8 A498C9FF
  {
    name: "SideQuestInfo",
    pattern: "41 B9 FFFFFFFF E8 ???????? ?? ?? ?? ?? ?? BA",
    handler: scrollHandler2,
  }, // E8 CB79D4FE
  {
    name: "LyriaJournalMainStoryChapterName",
    pattern:
      "41 ?? FFFFFFFF E8 ???????? 48 ?? ?? ???????? 48 ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ???????? ?? ???????? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? ???????? ?? ?? ?? ?? ?? ?? ?? ?? 48 ?? ?? ?? ?? ???????? ?? ?? ?? 0F?? ????0000",
    handler: scrollHandlerTop1,
  }, // E8 ADFD90FE
  {
    name: "LyriaJournalMainStoryPartName",
    pattern: "43 ?? ?? ?? ?? 41 B8 FFFFFFFF E8 ???????? C7",
    handler: scrollHandler1,
  }, // E8 081490FE
  {
    name: "LyriaJournalMainStoryPartInfo",
    pattern: "89 EA 41 ?? ????0000 E8 ???????? 48 ?? ?? ??000000",
    handler: scrollHandlerBottom1,
  }, // E8 D31390FE
  {
    name: "LyriaJournalFieldNoteCharacterName",
    pattern: "41 ?? ??000000 E8 ???????? 49 ?? ?? ?? ????0000 ?? ?? ?? 0F",
    handler: scrollHandlerTop1,
  }, // E8 D25A8FFE
  {
    name: "LyriaJournalFieldNoteCharacterInfo",
    pattern: "44 ?? ?? 41 B8 ????0000 E8 ???????? 48 8B ?? ???????? 48 8B",
    handler: infoDumpHandler,
  }, // E8 4B728FFE
  {
    name: "LyriaJournalFieldNoteFoeName",
    pattern: "41 ?? FFFFFFFF E8 ???????? 48 89 74",
    handler: scrollHandlerTop1,
  }, // E8 99708FFE
  {
    name: "LyriaJournalFieldNoteFoeInfo",
    pattern: "8B 57 ?? 41 ?? ????0000 E8 ???????? 4D",
    handler: scrollHandler1,
  }, // E8 7A708FFE
  {
    name: "LyriaJournalFieldNoteWeaponName",
    pattern: "E8 ???????? 49 ?? ?? 8B ?? ?? 4C ?? ?? 41",
    handler: scrollHandlerTop2,
  }, // E8 E1F18EFE
  {
    name: "LyriaJournalFieldNoteWeaponInfo",
    pattern: "4C 89 E1 41 B8 ????0000 E8 ???????? ?? 8B 06",
    handler: scrollHandler1,
  }, // E8 FD618FFE
  {
    name: "LyriaJournalFieldNoteTreasureName",
    pattern: "8B 56 2? 41 B8 FFFFFFFF E8 ???????? 49 8B 8C 24 ????0000",
    handler: scrollHandlerTop1,
  }, // E8 995E8FFE
  {
    name: "LyriaJournalFieldNoteTreasureInfo",
    pattern: "8B 56 2? 41 B8 FFFFFFFF E8 ???????? 49 8B BC",
    handler: scrollHandlerNoSingle1,
  }, // E8 7E5E7FFE
  {
    name: "LyriaJournalFieldNoteWrightstoneName",
    pattern:
      "8B 56 04 41 B8 FFFFFFFF E8 ???????? 49 8B ?? ?? ????0000 48 85 C9",
    handler: scrollHandlerTop1,
  }, // E8 225C8FFE
  {
    name: "LyriaJournalFieldNoteWrightstoneInfo",
    pattern:
      "8B 56 ?? 41 B8 FFFFFFFF E8 ???????? 49 8B ?? ?? ????0000 48 85 FF 74 ?? 41",
    handler: scrollHandler1,
  }, // E8 075C8FFE
  {
    name: "LyriaJournalDocumentName1",
    pattern: "41 89 E8 E8 ???????? 48 ?? ?? ???????? 48 85 FF",
    handler: scrollHandlerTop1,
  }, // E8 7BCB8FFE
  {
    name: "LyriaJournalDocumentInfo1",
    pattern: "41 89 E8 E8 ???????? ???????? ?? ??0000 48 ?? ?? ??000000",
    handler: infoDumpHandler,
  }, // E8 5ECB8FFE
  {
    name: "LyriaJournalDocumentName2",
    pattern: "8B 96 ??000000 41 B8 ??000000 E8 ???????? ?? 8B 3D",
    handler: scrollHandlerTop1,
  }, // E8 306A90FE
  {
    name: "LyriaJournalDocumentInfo2",
    pattern:
      "48 89 ?? ?? B8 ??000000 E8 ???????? ???????? ?? ??0000 ?? 8B ?? ??000000",
    handler: infoDumpHandler,
  }, // E8 F45C90FE
  {
    name: "LyriaJournalDocumentInfo3",
    pattern: "41 8B 97 ??000000 ?? ?? ?? ?? ?? ??000000 E8 ???????? 48 8B 85",
    handler: infoDumpHandler,
  }, // E8 9B5690FE
  {
    name: "LyriaJournalTipName1",
    pattern:
      "8B 53 ?? ?? ?? ?? ?? ?? ??000000 E8 ???????? ?? 8B ?? ??000000 ?? ?? ?? ???????? ?? ?? ?? ?? ?? 90",
    handler: scrollHandlerTop1,
  }, // E8 24CD8EFE
  {
    name: "LyriaJournalTipInfo1",
    pattern:
      "E8 ???????? 48 8B 8? ??000000 48 8B 8? ???????? ?? ?? ?? 74 ?? C5",
    handler: scrollHandler1,
  }, // E8 A2CC8EFE
  {
    name: "LyriaJournalTipName2",
    pattern:
      "E8 ???????? 48 8B ?? ??000000 48 8B ?? ??000000 ?? ?? ?? 74 ?? ???? ?? 00000000 ?? 8B",
    handler: scrollHandlerTop1,
  }, // E8 9ACE8EFE
  {
    name: "LyriaJournalTipInfo2",
    pattern:
      "E8 ???????? 48 8B 87 ???????? 48 8B 8F ???????? ?? 39 ?? ???? ????0000 C5",
    handler: scrollHandler1,
  }, // E8 12CE8EFE
  {
    name: "LyriaJournalTrophyName",
    pattern:
      "89 DA 41 B8 ??000000 E8 ???????? 49 8B ?? ????0000 ?? ?? ?? 74 ?? ?? 8B",
    handler: scrollHandlerTop1,
  }, // E8 D58FBEFF
  {
    name: "LyriaJournalTrophyInfo",
    pattern:
      "41 8B 57 ?? 41 B8 ???????? E8 ???????? ?? 8B ?? ????0000 ?? ?? ?? 74 ?? F6 05",
    handler: scrollHandler1,
  }, // E8 CA2092FE
  {
    name: "LyriaJournalMusic",
    pattern:
      "B2 01 E8 ???????? ?? 8B ?? ????0000 ?? ?? ?? 74 ?? 8B ?? ?? ?? ?? ?? FFFFFFFF",
    handler: scrollHandler1,
  }, // E8 0CD8FEFF
];

const hotHooks = {
  EARLY: {
    name: "Early",
    pattern: "48 8B 15 ???????? 8B 86 ???????? 8B",
    address: null,
    readString(args) {
      return args[6].readUtf8String();
    },
    readStringFromRegs(regs) {
      return regs.rcx.readUtf8String();
    },
  }, // E8 E0815FFE, after
  LATE: {
    name: "Late",
    pattern: "E8 ???????? 41 ?? ?? ?? 00 8B ?? ?? ?? 44",
    address: null,
    readString(args) {
      return args[1].readUtf8String();
    },
    readStringFromRegs(regs) {
      return regs.rdx.readUtf8String();
    },
  }, // E8 7AAD0102
  SPECIAL: {
    name: "Special",
    pattern: "E8 ???????? ?? 89 ?? ???? 00 84 C0",
    address: null,
    readString(args) {
      return args[1].readUtf8String();
    },
    readStringFromRegs(regs) {
      return regs.rdx.readUtf8String();
    },
  }, // E8 36220000
};

//#endregion

//#region Attach

function getPatternAddress(name, pattern) {
  const results = Memory.scanSync(__e.base, size, pattern);
  if (results.length === 0) {
    throw new Error(`[${name}] Hook not found!`);
  }

  let address = results[0].address;
  console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`${name} has ${results.length} results`);
  }

  return address;
}

function getPatternAddressAsync(name, pattern) {
  const results = [];

  return new Promise((resolve, reject) => {
    Memory.scan(__e.base, size, pattern, {
      onMatch(address) {
        results.push(address);
      },
      onError(reason) {
        reject(reason);
      },
      onComplete() {
        if (results.length === 0) {
          console.error(`[${name}] Hook not found!`);
          reject(new Error("Hook not found"));
          return null;
        }

        let address = results[0];
        console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);

        if (results.length > 1) {
          console.warn(`[${name}] has ${results.length} results`);
        }

        resolve(address);
      },
    });
  });
}

function attachHooks() {
  for (const hook in hotHooks) {
    hotHooks[hook].address = getPatternAddress(hook, hotHooks[hook].pattern);
  }

  let count = 0;
  for (const hook of hooks) {
    const address = getPatternAddress(hook.name, hook.pattern);

    try {
      const skippedMessage = `\x1b[2mskipped: ${hook.name}\x1b[0m`;
      if (ON_ENTER === true) {
        let onEnterMessage = `onEnter: ${hook.name}`;

        if (ON_ENTER_EXTENDED === true) {
          onEnterMessage += ` -> ${hook.handler.name}`;
        }

        Interceptor.attach(address, function () {
          if (hooksStatus[hook.name].enabled === false) {
            console.log(skippedMessage);
            return null;
          }

          console.log(onEnterMessage);
          hook.handler.call(this, hook.name);
        });
      } else if (ON_ENTER === false) {
        Interceptor.attach(address, function () {
          if (hooksStatus[hook.name].enabled === false) {
            console.log(skippedMessage);
            return null;
          }

          hook.handler.call(this, hook.name);
        });
      } else {
        console.error("Something weird occurred?");
        return null;
      }
      hooksStatus[hook.name] = { enabled: true, characters: 0 };
      count += 1;
    } catch (err) {
      console.error(err.stack);
      return null;
    }
  }

  console.log(`${count}/${hooks.length} hooks attached`);
  hooksCount = count;

  return true;
}

async function attachHooksAsync() {
  const hotNames = []; // object property order paranoia
  const addressPromises = { hot: [], normal: [] };

  for (const hook in hotHooks) {
    hotNames.push(hook);
    addressPromises.hot.push(
      getPatternAddressAsync(hook, hotHooks[hook].pattern)
    );
  }

  for (const hook of hooks) {
    addressPromises.normal.push(
      getPatternAddressAsync(hook.name, hook.pattern)
    );
  }

  const addresses = { hot: [], normal: [] };
  try {
    addresses.hot = await Promise.all(addressPromises.hot);
    addresses.normal = await Promise.all(addressPromises.normal);
  } catch (err) {
    throw err;
  }

  // assign addresses to hot hooks for later use; don't attach these yet
  let i = 0;
  for (const name of hotNames) {
    hotHooks[name].address = addresses.hot[i];
    i += 1;
  }

  // attach normal hooks
  let count = 0;
  for (const [i, address] of addresses.normal.entries()) {
    const hook = hooks[i];

    try {
      const skippedMessage = `\x1b[2mskipped: ${hook.name}\x1b[0m`;
      if (ON_ENTER === true) {
        let onEnterMessage = `onEnter: ${hook.name}`;

        if (ON_ENTER_EXTENDED === true) {
          onEnterMessage += ` -> ${hook.handler.name}`;
        }

        Interceptor.attach(address, function () {
          if (hooksStatus[hook.name].enabled === false) {
            console.log(skippedMessage);
            return null;
          }

          console.log(onEnterMessage);
          hook.handler.call(this, hook.name);
        });
      } else if (ON_ENTER === false) {
        Interceptor.attach(address, function () {
          if (hooksStatus[hook.name].enabled === false) {
            console.log(skippedMessage);
            return null;
          }

          hook.handler.call(this, hook.name);
        });
      } else {
        throw new Error("Something weird occurred?");
      }

      hooksStatus[hook.name] = { enabled: true, characters: 0 };
      count += 1;
    } catch (err) {
      throw err;
    }
  }

  console.log(`\x1b[30m\x1b[47m${count}/${hooks.length} hooks attached\x1b[0m`);
  hooksCount = count;

  return true;
}

function startTrace() {
  console.warn("Tracing!!");

  const traceTarget = hotHooks.EARLY;
  const traceAddress = getPatternAddress(traceTarget.name, traceTarget.pattern);
  const previousTexts = new Set();

  Interceptor.attach(traceAddress, function (args) {
    const text = traceTarget.readString(args);

    if (previousTexts.has(text)) {
      return null;
    }
    previousTexts.add(text);

    const callstack = Thread.backtrace(this.context, Backtracer.FUZZY);

    console.log(`
    \rONENTER: ${traceTarget.name}
    \r${text}
    \rCallstack: ${callstack.splice(0, 8)}`);

    if (INSPECT_ARGS === true) {
      inspectArgs(args);
    }
  });
}

/**Wrapper around Interceptor.attach; quickly detach */
function hotAttach(address, callback) {
  const hook = Interceptor.attach(address, function (args) {
    hook.detach();

    if (INSPECT_ARGS === true) {
      inspectArgs(args);
      // return null;
    }

    callback.call(this, args);
  });
}

//#endregion

//#region Misc

function toSingleLine(text) {
  if (shouldConvertToSingleLine === false) {
    return text;
  }

  return text.replace(/([^。！？」』）])\n([^・])/g, "$1$2");
}

function setHookCharacterCount(name, text) {
  if (text === null) {
    return null;
  }

  const cleanedText = text.replace(
    /[。…、？！「」―ー・]|<[^>]+>|\r|\n|\u3000/gu,
    ""
  );
  hooksStatus[name].characters += cleanedText.length;
}

function inspectArgs(args) {
  const argsTexts = [];

  for (let i = 0; i <= 40; i++) {
    let type = "";
    let text = "";

    // yeehaw
    try {
      type = "S";
      text = args[i].readUtf8String();
    } catch (err) {
      try {
        type = "P";
        text = args[i].readPointer().readUtf8String();
      } catch (err) {
        try {
          type = "PP";
          text = args[i].readPointer().readPointer().readUtf8String();
        } catch (err) {
          continue;
        }
      }
    }

    if (text === "" || text === null) {
      continue;
    }

    argsTexts.push(`${type}|args[${i}]=${text}`);
    // argsTexts.push(`args[${i}]=${args[i]}`);
  }

  for (const text of argsTexts) {
    console.log(`\x1b[45m${text}\x1b[0m`);
  }
  argsTexts.length = 0;
}

//#endregion

//#region Handlers

function genericHandler(name, text, delay = 200) {
  texts.add(text);
  setHookCharacterCount(name, text);

  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send([...texts].join("\r\n"));
    texts.clear();
  }, delay);
}

function orderedHandler(name, text, delay = 600) {
  // text parameter is only used for character count
  setHookCharacterCount(name, text);

  clearTimeout(orderedTimer);
  orderedTimer = setTimeout(() => {
    trans.send(
      topText + middleText + bottomText + [...bottomTexts].join("\r\n")
    );
    topText = "";
    middleText = "";
    bottomText = "";
    bottomTexts.clear();
  }, delay);
}

function mainHandler(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    genericHandler(name, toSingleLine(target.readString(args)));
  });
}

function scrollHandler1(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    middleText = toSingleLine(text) + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandler2(name) {
  const target = hotHooks.SPECIAL;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    middleText = toSingleLine(text) + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerTop1(name) {
  const target = hotHooks.EARLY;

  bottomTexts.clear();

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    topText = text + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerTop2(name) {
  const target = hotHooks.SPECIAL;

  bottomTexts.clear();

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    topText = text + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerBottom1(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    bottomText = toSingleLine(text) + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerBottom2(name) {
  const target = hotHooks.SPECIAL;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    bottomText = toSingleLine(text) + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerMulti1(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    bottomTexts.add(text);
    orderedHandler(name, text);
  });
}

function scrollHandlerMulti2(name) {
  const target = hotHooks.SPECIAL;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    bottomTexts.add(text);
    orderedHandler(name, text);
  });
}

function ADVNameHandler(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    dialogueName = target.readString(args);
  });
}

function ADVTextHandler(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    let text = toSingleLine(target.readString(args));

    text = dialogueName + "\n" + text;

    genericHandler(name, text);
  });
}

function skillNameHandler(name) {
  const target = hotHooks.EARLY;

  bottomTexts.clear();

  hotAttach(target.address, function (args) {
    const text = args[22].readUtf8String();

    if (text !== null) {
      topText = text + "\r\n";
      orderedHandler(name, text);
    }
  });
}

function sieroItemNameHandler(name) {
  const target = hotHooks.EARLY;

  bottomTexts.clear();

  hotAttach(target.address, function (args) {
    const text = args[33].readUtf8String();
    topText = text + "\r\n";
    orderedHandler(name, text);
  });
}

function scrollHandlerNoSingle1(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    middleText = text + "\r\n";
    orderedHandler(name, text);
  });
}

function questSelectNameHandler(name) {
  const target = hotHooks.EARLY;

  bottomTexts.clear();

  hotAttach(target.address, function (args) {
    let text = "";

    try {
      text = args[21].readUtf8String();
    } catch (err) {
      text = target.readString(args);
    }

    topText = text + "\r\n";
    orderedHandler(name, text);
  });
}

function inventoryItemInfoHandler(name) {
  // const target = hotHooks.EARLY;
  const target = hotHooks.LATE;

  hotAttach(target.address, function (args) {
    let text = "";

    try {
      text = target.readString(args);
    } catch (err) {}

    if (text.length > 1 && text.startsWith("絞り込み") === false) {
      middleText = text;
      orderedHandler(name, text);
    }
  });
}

function masteryStatsHandler(name) {
  const target = hotHooks.SPECIAL;

  hotAttach(target.address, function (args) {
    const text = target.readString(args) + "\r\n";
    const firstChar = text.at(0);

    if (
      (firstChar < "0" || firstChar > "9") &&
      firstChar !== "縮" &&
      text.startsWith("おまかせ取得") === false &&
      text !== topText &&
      text !== middleText
    ) {
      bottomText = text;
      orderedHandler(name, text);
    }
  });
}

function masteryInfoHandler(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);

    if (text !== "アビリティが使用できるようになる") {
      middleText = text + "\r\n";
      orderedHandler(name, text);
    }
  });
}

function infoDumpHandler(name) {
  const target = hotHooks.EARLY;

  hotAttach(target.address, function (args) {
    const text = target.readString(args);
    bottomTexts.add(toSingleLine(text) + "\r\n");
    orderedHandler(name, text);
  });
}

trans.replace((s) => {
  if (s === previous || s === "" || s.at(0) === "ー" || s.at(0) === "—") {
    return null;
  }
  previous = s;

  return s.trim();
});

//#endregion

//#region UI Config

function getHookOptions() {
  const hookNames = [];
  for (const hook of hooks) {
    // hookNames.push({ value: hook.name, text: hook.name });
    console.log(JSON.stringify({ value: hook.name, text: hook.name }) + ",");
  }
  return hookNames;
}
// getHookOptions();

ui.title = "Granblue Fantasy Relink";

ui.description = `
Configure hooks and text output.
<p>
  Hold the <code>Ctrl</code> key while clicking hooks to enable or disable individually.
  <br>Press <code>Ctrl + A</code> after clicking on a hooks box to enable all hooks in it.
  <br>Check Agent's console output to see each text's corresponding hook.
</p>`;

ui.options = [
  {
    id: "singleSentence",
    type: "checkbox",
    label: "Single-line sentences",
    help: `Attempt to convert sentences that span multiple lines into a single line.
  Useful for external apps that need to parse sentences.
  Disable if you want to retain the text's original formatting.`,
    defaultValue: true,
  },
  {
    id: "hooksEnabledCount",
    type: "text",
    label: "Number of hooks enabled",
    readOnly: true,
    defaultValue: "0 out of 0",
    ephemeral: true,
  },
  {
    id: "selectedHook",
    type: "select",
    label: "Display character count from...",
    help: "Select a hook to display its character count.",
    options: [
      { value: "ADVDialogueName", text: "ADVDialogueName" },
      { value: "ADVDialogueText", text: "ADVDialogueText" },
      { value: "ChapterSelectInfo", text: "ChapterSelectInfo" },
      {
        value: "CharacterCommandListSupportSkillInfo",
        text: "CharacterCommandListSupportSkillInfo",
      },
      {
        value: "CharacterCommandListSupportSkillName",
        text: "CharacterCommandListSupportSkillName",
      },
      { value: "CrewmateInfo", text: "CrewmateInfo" },
      { value: "CutsceneCenterText", text: "CutsceneCenterText" },
      { value: "CutsceneChapterTitle", text: "CutsceneChapterTitle" },
      { value: "CutsceneDialogueName", text: "CutsceneDialogueName" },
      { value: "CutsceneDialogueText", text: "CutsceneDialogueText" },
      { value: "DictionaryInfo1", text: "DictionaryInfo1" },
      { value: "DictionaryInfo2", text: "DictionaryInfo2" },
      { value: "DictionaryInfo3", text: "DictionaryInfo3" },
      { value: "DictionaryName1", text: "DictionaryName1" },
      { value: "DictionaryName2", text: "DictionaryName2" },
      { value: "FateEpisodeText", text: "FateEpisodeText" },
      { value: "InventoryItemInfo", text: "InventoryItemInfo" },
      { value: "InventoryWeaponInfo", text: "InventoryWeaponInfo" },
      { value: "InventoryWeaponName", text: "InventoryWeaponName" },
      { value: "LoadingScreenInfo", text: "LoadingScreenInfo" },
      { value: "LoadingScreenTitle", text: "LoadingScreenTitle" },
      { value: "LyriaJournalDocumentInfo1", text: "LyriaJournalDocumentInfo1" },
      { value: "LyriaJournalDocumentInfo2", text: "LyriaJournalDocumentInfo2" },
      { value: "LyriaJournalDocumentInfo3", text: "LyriaJournalDocumentInfo3" },
      { value: "LyriaJournalDocumentName1", text: "LyriaJournalDocumentName1" },
      { value: "LyriaJournalDocumentName2", text: "LyriaJournalDocumentName2" },
      {
        value: "LyriaJournalFieldNoteCharacterInfo",
        text: "LyriaJournalFieldNoteCharacterInfo",
      },
      {
        value: "LyriaJournalFieldNoteCharacterName",
        text: "LyriaJournalFieldNoteCharacterName",
      },
      {
        value: "LyriaJournalFieldNoteFoeInfo",
        text: "LyriaJournalFieldNoteFoeInfo",
      },
      {
        value: "LyriaJournalFieldNoteFoeName",
        text: "LyriaJournalFieldNoteFoeName",
      },
      {
        value: "LyriaJournalFieldNoteTreasureInfo",
        text: "LyriaJournalFieldNoteTreasureInfo",
      },
      {
        value: "LyriaJournalFieldNoteTreasureName",
        text: "LyriaJournalFieldNoteTreasureName",
      },
      {
        value: "LyriaJournalFieldNoteWeaponInfo",
        text: "LyriaJournalFieldNoteWeaponInfo",
      },
      {
        value: "LyriaJournalFieldNoteWeaponName",
        text: "LyriaJournalFieldNoteWeaponName",
      },
      {
        value: "LyriaJournalFieldNoteWrightstoneInfo",
        text: "LyriaJournalFieldNoteWrightstoneInfo",
      },
      {
        value: "LyriaJournalFieldNoteWrightstoneName",
        text: "LyriaJournalFieldNoteWrightstoneName",
      },
      {
        value: "LyriaJournalMainStoryChapterName",
        text: "LyriaJournalMainStoryChapterName",
      },
      {
        value: "LyriaJournalMainStoryPartInfo",
        text: "LyriaJournalMainStoryPartInfo",
      },
      {
        value: "LyriaJournalMainStoryPartName",
        text: "LyriaJournalMainStoryPartName",
      },
      { value: "LyriaJournalMusic", text: "LyriaJournalMusic" },
      { value: "LyriaJournalTipInfo1", text: "LyriaJournalTipInfo1" },
      { value: "LyriaJournalTipInfo2", text: "LyriaJournalTipInfo2" },
      { value: "LyriaJournalTipName1", text: "LyriaJournalTipName1" },
      { value: "LyriaJournalTipName2", text: "LyriaJournalTipName2" },
      { value: "LyriaJournalTrophyInfo", text: "LyriaJournalTrophyInfo" },
      { value: "LyriaJournalTrophyName", text: "LyriaJournalTrophyName" },
      { value: "MasteryInfo", text: "MasteryInfo" },
      { value: "MasteryName", text: "MasteryName" },
      { value: "MasterySkillInfo", text: "MasterySkillInfo" },
      { value: "MasteryStats1", text: "MasteryStats1" },
      { value: "MasteryStats2", text: "MasteryStats2" },
      { value: "OverworldAreaName", text: "OverworldAreaName" },
      { value: "OverworldDialogueChoice", text: "OverworldDialogueChoice" },
      { value: "OverworldDialogueName", text: "OverworldDialogueName" },
      { value: "OverworldDialogueText", text: "OverworldDialogueText" },
      { value: "OverworldNPCDialogueText", text: "OverworldNPCDialogueText" },
      { value: "PauseSummaryInfo", text: "PauseSummaryInfo" },
      { value: "PauseSummaryTitle", text: "PauseSummaryTitle" },
      { value: "Prompt", text: "Prompt" },
      { value: "QuestSelectName", text: "QuestSelectName" },
      { value: "SideQuestInfo", text: "SideQuestInfo" },
      { value: "SideQuestName", text: "SideQuestName" },
      { value: "SieroItemInfo", text: "SieroItemInfo" },
      { value: "SieroItemName", text: "SieroItemName" },
      { value: "SieroSigilInfo", text: "SieroSigilInfo" },
      { value: "SigilMenuInfo", text: "SigilMenuInfo" },
      { value: "SigilMenuName", text: "SigilMenuName" },
      { value: "SkillEffect", text: "SkillEffect" },
      { value: "SkillInfo", text: "SkillInfo" },
      { value: "SkillName1", text: "SkillName1" },
      { value: "SkillName2", text: "SkillName2" },
      { value: "TipScreenInfo", text: "TipScreenInfo" },
      { value: "TipScreenTitle", text: "TipScreenTitle" },
    ],
    defaultValue: "CutsceneDialogueText",
  },
  {
    id: "selectedHookCharacterCount",
    type: "number",
    label: "Character count for selected hook",
    help: `Displays the total number of characters outputted by the selected hook.
    <br><em>Resets with each session.</em>`,
    readOnly: true,
    defaultValue: 0,
    ephemeral: true,
  },
  {
    id: "hooksMain",
    type: "select",
    label: "Main Hooks",
    help: "Important dialogue during cutscenes and exploration.",
    multiple: true,
    options: [
      {
        value: "CutsceneChapterTitle",
        text: "CutsceneChapterTitle",
        selected: true,
      },
      {
        value: "CutsceneDialogueName",
        text: "CutsceneDialogueName",
        selected: true,
      },
      {
        value: "CutsceneDialogueText",
        text: "CutsceneDialogueText",
        selected: true,
      },
      {
        value: "CutsceneCenterText",
        text: "CutsceneCenterText",
        selected: true,
      },
      { value: "OverworldAreaName", text: "OverworldAreaName", selected: true },
      {
        value: "OverworldDialogueName",
        text: "OverworldDialogueName",
        selected: true,
      },
      {
        value: "OverworldDialogueText",
        text: "OverworldDialogueText",
        selected: true,
      },
      {
        value: "OverworldDialogueChoice",
        text: "OverworldDialogueChoice",
        selected: true,
      },
      { value: "ADVDialogueName", text: "ADVDialogueName", selected: true },
      { value: "ADVDialogueText", text: "ADVDialogueText", selected: true },
    ],
  },
  {
    id: "hooksMisc",
    type: "select",
    label: "Miscellaneous Hooks",
    help: "Trivial text in popup windows, loading screens, random NPC dialogue, etc.",
    multiple: true,
    options: [
      {
        value: "OverworldNPCDialogueText",
        text: "OverworldNPCDialogueText",
        selected: true,
      },
      { value: "Prompt", text: "Prompt", selected: true },
      { value: "PauseSummaryTitle", text: "PauseSummaryTitle", selected: true },
      { value: "PauseSummaryInfo", text: "PauseSummaryInfo", selected: true },
      { value: "DictionaryName1", text: "DictionaryName1", selected: true },
      { value: "DictionaryName2", text: "DictionaryName2", selected: true },
      { value: "DictionaryInfo1", text: "DictionaryInfo1", selected: true },
      { value: "DictionaryInfo2", text: "DictionaryInfo2", selected: true },
      { value: "DictionaryInfo3", text: "DictionaryInfo3", selected: true },
      { value: "SideQuestName", text: "SideQuestName", selected: true },
      { value: "SideQuestInfo", text: "SideQuestInfo", selected: true },
      { value: "TipScreenTitle", text: "TipScreenTitle", selected: true },
      { value: "TipScreenInfo", text: "TipScreenInfo", selected: true },
      {
        value: "LoadingScreenTitle",
        text: "LoadingScreenTitle",
        selected: true,
      },
      { value: "LoadingScreenInfo", text: "LoadingScreenInfo", selected: true },
    ],
  },
  {
    id: "hooksMenu",
    type: "select",
    label: "Menu Hooks",
    help: "Text across the many menus.",
    multiple: true,
    options: [
      { value: "SieroItemName", text: "SieroItemName", selected: true },
      { value: "SieroItemInfo", text: "SieroItemInfo", selected: true },
      { value: "SieroSigilInfo", text: "SieroSigilInfo", selected: true },
      { value: "CrewmateInfo", text: "CrewmateInfo", selected: true },
      { value: "QuestSelectName", text: "QuestSelectName", selected: true },
      { value: "ChapterSelectInfo", text: "ChapterSelectInfo", selected: true },
      { value: "FateEpisodeText", text: "FateEpisodeText", selected: true },
      {
        value: "CharacterCommandListSupportSkillName",
        text: "CharacterCommandListSupportSkillName",
        selected: true,
      },
      {
        value: "CharacterCommandListSupportSkillInfo",
        text: "CharacterCommandListSupportSkillInfo",
        selected: true,
      },
      { value: "SkillName1", text: "SkillName1", selected: true },
      { value: "SkillName2", text: "SkillName2", selected: true },
      { value: "SkillInfo", text: "SkillInfo", selected: true },
      { value: "SkillEffect", text: "SkillEffect", selected: true },
      { value: "MasteryName", text: "MasteryName", selected: true },
      { value: "MasteryInfo", text: "MasteryInfo", selected: true },
      { value: "MasteryStats1", text: "MasteryStats1", selected: true },
      { value: "MasteryStats2", text: "MasteryStats2", selected: true },
      {
        value: "MasterySkillInfo",
        text: "MasterySkillInfo",
        selected: true,
      },
      {
        value: "InventoryItemInfo",
        text: "InventoryItemInfo",
        selected: true,
      },
      {
        value: "InventoryWeaponName",
        text: "InventoryWeaponName",
        selected: true,
      },
      {
        value: "InventoryWeaponInfo",
        text: "InventoryWeaponInfo",
        selected: true,
      },
      { value: "SigilMenuName", text: "SigilMenuName", selected: true },
      { value: "SigilMenuInfo", text: "SigilMenuInfo", selected: true },
    ],
  },
  {
    id: "hooksLyria",
    type: "select",
    label: "Lyria's Journal Hooks",
    help: "Entries within Lyria's Journal.",
    multiple: true,
    options: [
      {
        value: "LyriaJournalMainStoryChapterName",
        text: "LyriaJournalMainStoryChapterName",
        selected: true,
      },
      {
        value: "LyriaJournalMainStoryPartName",
        text: "LyriaJournalMainStoryPartName",
        selected: true,
      },
      {
        value: "LyriaJournalMainStoryPartInfo",
        text: "LyriaJournalMainStoryPartInfo",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteCharacterName",
        text: "LyriaJournalFieldNoteCharacterName",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteCharacterInfo",
        text: "LyriaJournalFieldNoteCharacterInfo",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteFoeName",
        text: "LyriaJournalFieldNoteFoeName",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteFoeInfo",
        text: "LyriaJournalFieldNoteFoeInfo",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteWeaponName",
        text: "LyriaJournalFieldNoteWeaponName",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteWeaponInfo",
        text: "LyriaJournalFieldNoteWeaponInfo",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteTreasureName",
        text: "LyriaJournalFieldNoteTreasureName",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteTreasureInfo",
        text: "LyriaJournalFieldNoteTreasureInfo",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteWrightstoneName",
        text: "LyriaJournalFieldNoteWrightstoneName",
        selected: true,
      },
      {
        value: "LyriaJournalFieldNoteWrightstoneInfo",
        text: "LyriaJournalFieldNoteWrightstoneInfo",
        selected: true,
      },
      {
        value: "LyriaJournalDocumentName1",
        text: "LyriaJournalDocumentName1",
        selected: true,
      },
      {
        value: "LyriaJournalDocumentInfo1",
        text: "LyriaJournalDocumentInfo1",
        selected: true,
      },
      {
        value: "LyriaJournalDocumentName2",
        text: "LyriaJournalDocumentName2",
        selected: true,
      },
      {
        value: "LyriaJournalDocumentInfo2",
        text: "LyriaJournalDocumentInfo2",
        selected: true,
      },
      {
        value: "LyriaJournalDocumentInfo3",
        text: "LyriaJournalDocumentInfo3",
        selected: true,
      },
      {
        value: "LyriaJournalTipName1",
        text: "LyriaJournalTipName1",
        selected: true,
      },
      {
        value: "LyriaJournalTipInfo1",
        text: "LyriaJournalTipInfo1",
        selected: true,
      },
      {
        value: "LyriaJournalTipName2",
        text: "LyriaJournalTipName2",
        selected: true,
      },
      {
        value: "LyriaJournalTipInfo2",
        text: "LyriaJournalTipInfo2",
        selected: true,
      },
      {
        value: "LyriaJournalTrophyName",
        text: "LyriaJournalTrophyName",
        selected: true,
      },
      {
        value: "LyriaJournalTrophyInfo",
        text: "LyriaJournalTrophyInfo",
        selected: true,
      },
      { value: "LyriaJournalMusic", text: "LyriaJournalMusic", selected: true },
    ],
  },
];

ui.onchange = (id, current, previous) => {
  if (id.startsWith("hooks") === true) {
    console.log("\x1b[2mReconfiguring hooks\x1b[0m");
    for (const hookName of previous) {
      if (current.includes(hookName) === false) {
        console.log(`\x1b[2m[${hookName}] has been disabled\x1b[0m`);
        hooksStatus[hookName].enabled = false;
        hooksCount -= 1;
      }
    }
    for (const hookName of current) {
      if (previous.includes(hookName) === false) {
        console.log(`\x1b[2m[${hookName}] has been enabled\x1b[0m`);
        hooksStatus[hookName].enabled = true;
        hooksCount += 1;
      }
    }
    ui.config.hooksEnabledCount = `${hooksCount} / ${hooks.length}`;
  } else if (id === "selectedHook") {
    console.log("\x1b[2mUpdating character count\x1b[0m");
    ui.config.selectedHookCharacterCount = hooksStatus[current].characters;
  } else if (id === "singleSentence") {
    console.log(`\x1b[2mSingle-line sentences set to ${current}\x1b[0m`);
    shouldConvertToSingleLine = current;
  }
};

function uiStart() {
  // update character count in intervals
  setInterval(() => {
    ui.config.selectedHookCharacterCount =
      hooksStatus[ui.config.selectedHook].characters;
  }, 5000);

  // start up the ui
  ui.open()
    .then(() => {
      ui.config.hooksEnabledCount = `${hooksCount} / ${hooks.length}`;
      console.log("UI loaded!");
    })
    .catch((err) => {
      console.error("UI error\n" + err.stack);
    });
}

//#endregion

//#region Start

async function start() {
  if (BACKTRACE === true) {
    startTrace();
    return true;
  }

  if (ASYNC_SCAN === false) {
    attachHooks();
    uiStart();
    return true;
  } else if (ASYNC_SCAN === true) {
    try {
      await attachHooksAsync();
      uiStart();
      return true;
    } catch (err) {
      throw err;
    }
  }
}
start().catch((err) => {
  console.error(err.stack);
});

//#endregion
