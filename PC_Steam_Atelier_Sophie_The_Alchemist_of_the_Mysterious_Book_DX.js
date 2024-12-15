// ==UserScript==
// @name         Atelier Sophie: The Alchemist of the Mysterious Book DX (ソフィーのアトリエ ～不思議な本の錬金術士～ DX)
// @version      1.02
// @author       Mansive
// @description  Steam
// * Gust
// * KOEI TECMO GAMES CO., LTD.
//
// https://store.steampowered.com/app/1502970/Atelier_Sophie_The_Alchemist_of_the_Mysterious_Book_DX/
// ==/UserScript==

const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

let convertToSingleLine = true;
let hooksCount = 0;

let timer1 = null;
let timer2 = null;
let timer3 = null;

let previous = "";

const texts1 = new Set();
const texts2 = new Set();

let topText = "";
let middleText = "";
const bottomTexts = new Set();

//#region Hooks

const hooksStatus = {
  // exampleHookName: { enabled: true, characters: 0 },
};

const hooks = [
  // main
  ["DialogueName", "E8 629A2700", "rdx", mainHandler],
  ["DialogueText", "E8 ADC32700", "rdx", mainHandler],
  ["Choice", "E8 E9AFFDFF", "rdx", choiceHandler],
  // overworld
  ["NotificationBanner", "E8 FAEB2600", "rdx", mainHandler2],
  ["AreaNameBanner", "E8 1EBA1900", "rdx", mainHandler2],
  ["SideDialogue", "E8 53730B00", "rdx", mainHandler2],
  ["BattleEnemyName", "E8 0D67FBFF", "rdx", mainHandler2],
  ["BattleSkillInfo1", "E8 7B1DF4FF", "rdx", scrollHandler], // first skill on menu open
  ["BattleSkillInfo2", "E8 0163FBFF", "rbx", scrollHandler], // rbx; scrolling through menu
  ["BattleAction", "E8 8A3CF4FF", "rdx", mainHandler2],
  ["SkillObtained", "E8 4768F4FF", "rdx", mainHandler2],
  ["WorldMapAreaName", "E8 63FEF3FF", "rdx", mainHandler2],
  ["TownMapAreaName", "E8 93311E00", "rdx", mainHandler2],
  // menu, synthesis
  ["MainMenuDialogue", "E8 C1A90000", "rdx", mainMenuDialogueHandler],
  ["EventName", "E8 F4692800", "rdx", scrollHandler2],
  ["EventInfo", "E8 C4692800", "rdx", scrollHandler],
  ["QuestName", "E8 960DD3FF", "rdx", questNameHandler], // pointer
  ["QuestEnemyName", "E8 7BF9F1FF", "rdx", scrollHandler2],
  ["QuestItemName", "E8 08FBF1FF", "rdx", scrollHandler2],
  ["QuestInfo", "E8 A1E42200", "rdx", questRumorInfoHandler],
  ["RumorName", "E8 12B92200", "rdx", rumorNameHandler],
  ["RumorTypeName", "E8 D6E12200 EB 16", "rdx", scrollHandler2],
  ["RumorKnownInfo", "E8 BAE22200", "rdx", questRumorInfoHandler],
  ["RumorUnknownInfo", "E8 25E32200", "rdx", questRumorInfoHandler],
  ["EventObjective", "E8 C66A2800", "rdx", scrollHandler3],
  ["StatusSkillName", "E8 A5E6F6FF", "rdx", mainHandler2],
  ["StatusSkillInfo", "E8 50EAF6FF", "rdx", scrollHandler],
  ["ItemName", "E8 AA760900", "rdx", scrollHandler],
  ["RecipeName", "E8 D4E8F5FF", "rdx", scrollHandler],
  ["RecipeObtainedName", "E8 18792100", "rdx", scrollHandler2],
  ["RecipeMaterial1", "E8 93E3F5FF", "rdx", scrollHandler3],
  ["RecipeMaterial2", "E8 46E5F5FF", "rdx", scrollHandler3],
  ["MaterialQuality", "E8 E55C0900", "rdx", scrollHandler3],
  ["MaterialEffect", "E8 75690900", "rdx", scrollHandler3],
  ["MaterialTrait", "E8 99680900", "rdx", scrollHandler3],
  ["MaterialCategory", "E8 9C6D0900", "rdx", scrollHandler3],
  ["RelatedRecipe", "E8 876F0900", "rdx", scrollHandler3],
  ["SynthesisTransferTraitInfo", "5F E9 05FEF5FF", "rdx", scrollHandler], // E8 E7CB0F00
  ["CraftTransferTraitInfo", "5F E9 855B2300", "rdx", scrollHandler], // E8 154F0100
  ["CraftRecipeName", "E8 B4582300", "rdx", scrollHandler],
  ["CraftRecipeMaterial1", "E8 26562300", "rdx", scrollHandler3],
  ["CraftRecipeMaterial2", "E8 69572300", "rdx", scrollHandler3],
  ["DMakerMaterialCategory", "E8 CC650900", "rdx", scrollHandler3],
  ["DMakerMaterialTrait", "E8 AD640900", "rdx", scrollHandler3],
  // encyclopedia
  ["EncyclopediaItemName", "E8 B9723100", "rdx", scrollHandler2],
  ["EncyclopediaFacilityName", "E8 A0A03100", "rdx", scrollHandler2],
  ["EncyclopediaFieldName", "E8 FF483100", "rdx", scrollHandler2],
  ["EncyclopediaEnemyName", "E8 B1E2FFFF", "r8", scrollHandler2], // r8
  ["EncyclopediaDialogue", "E8 656E2900", "rdx", encyclopediaDialogueHandler],
  ["EncyclopediaEffectName", "E8 57653000", "rdx", scrollHandler2],
  ["EncyclopediaEffectInfo", "E8 32653000", "rdx", scrollHandler],
  ["EncyclopediaTraitName", "E8 04563000", "rdx", scrollHandler2],
  ["EncyclopediaTraitInfo", "E8 DF553000", "rdx", scrollHandler],
  ["EncyclopediaHelpName", "E8 858F3100", "rdx", scrollHandler2],
  ["EncyclopediaHelpInfo", "E8 BCF43000", "rbx", encyclopediaHelpInfoHandler], // rbx
  ["EncyclopediaRecipeCompleteName", "E8 B80B2200", "rdx", scrollHandler2],
  ["EncyclopediaRecipeIncompleteName", "E8 5F012200", "rdx", scrollHandler2],
  ["EncyclopediaRecipeCondition", "E8 5B062200", "rdx", scrollHandler3],
  ["EncyclopediaRecipeCategory", "E8 5D0B2200", "rdx", scrollHandler3],
  ["EncyclopediaRecipeMaterial1", "E8 87022200", "rdx", scrollHandler3],
  ["EncyclopediaRecipeMaterial2", "E8 64032200", "rdx", scrollHandler3],
];

//#endregion

//#region Attach

for (const hook of hooks) {
  const result = attach(...hook);

  if (result === true) {
    hooksStatus[hook[0]] = { enabled: true, characters: 0 };
    hooksCount += 1;
  }
}
console.log(`${hooksCount}/${hooks.length} hooks attached`);

function attach(name, pattern, register, handler) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    console.error(`[${name}] Hook not found!`);
    return false;
  }

  let address = results[0].address;
  console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`[${name}] has ${results.length} results`);
  }

  Interceptor.attach(address, function (args) {
    if (hooksStatus[name].enabled === false) {
      console.log("skipped: " + name);
      return null;
    }

    console.log("onEnter:", name);
    const text = handler(this.context, register, name);
    // inspectArgs(args)
    setHookCharacterCount(name, text);
  });

  return true;
}

function attachFast(name, pattern, register, handler) {
  // pointlessly faster attach with async scan
  Memory.scan(__e.base, __e.size, pattern, {
    onMatch(address) {
      hooksCount += 1;
      console.log(
        `\x1b[32m${hooksCount}:[${name}] Found hook ${address}\x1b[0m`
      );

      Interceptor.attach(address, function () {
        if (hooksStatus[name].enabled === false) {
          console.log("skipped: " + name);
          return null;
        }

        console.log("onEnter: ", name);
        const text = handler(this.context, register, name);

        setHookCharacterCount(name, text);
      });
    },
    onError(reason) {
      console.error(reason);
    },
  });
}

//#endregion

//#region Miscellaneous

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

function genericHandler(text) {
  texts1.add(text);

  clearTimeout(timer1);
  timer1 = setTimeout(() => {
    trans.send([...texts1].join("\r\n"));
    texts1.clear();
  }, 200);
}

function genericHandler2(text) {
  texts2.add(text);

  clearTimeout(timer2);
  timer2 = setTimeout(() => {
    trans.send([...texts2].join("\r\n"));
    texts2.clear();
  }, 250);
}

function orderedHandler() {
  clearTimeout(timer3);
  timer3 = setTimeout(() => {
    trans.send(topText + middleText + [...bottomTexts].join("\r\n"));
    topText = middleText = "";
    bottomTexts.clear();
  }, 600);
}

function mainHandler(regs, index, name) {
  const address = regs[index];
  let text = address.readUtf8String();

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])<CR>/g, "$1");
  }

  genericHandler(text);
  return text;
}

function mainHandler2(regs, index, name) {
  const address = regs[index];
  const text = address.readUtf8String();

  genericHandler(text);
  return text;
}

function choiceHandler(regs, index, name) {
  const address = regs[index];
  const text = address.readUtf8String().trimEnd();

  // skip sort choices and はい/いいえ spam
  if (
    text.at(-1) === "順" ||
    text === "はい" ||
    text === "いいえ" ||
    text === "？？？？" ||
    text === null
  ) {
    return null;
  }

  genericHandler(text);
  return text;
}

function mainMenuDialogueHandler(regs, index, name) {
  const address = regs[index];
  let text = address.readUtf8String();

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])\n/g, "$1");
  }

  genericHandler(text);
  return text;
}

function rumorNameHandler(regs, index, name) {
  const address = regs[index];
  const text = address.readUtf8String();

  genericHandler2(text);
  return text;
}

function questNameHandler(regs, index, name) {
  const address = regs[index];
  const text = address.readPointer().readUtf8String();

  genericHandler2(text);
  return text;
}

function questRumorInfoHandler(regs, index, name) {
  bottomTexts.clear();

  const address = regs[index];
  let text = address.readUtf8String();

  if (convertToSingleLine === true) {
    // convert to single line if next line doesn't start with whitespace
    text = text.replace(/\n([^\u3000])/gu, "$1");
  }

  middleText = text;

  orderedHandler();
  return text;
}

function encyclopediaDialogueHandler(regs, index, name) {
  bottomTexts.clear();

  const address = regs[index];
  let text = address.readUtf8String();

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])\n\u3000/gu, "$1") + "\r\n";
  }

  middleText = text;

  orderedHandler();
  return text;
}

function encyclopediaHelpInfoHandler(regs, index, name) {
  bottomTexts.clear();

  const address = regs[index];
  let text = address.readUtf8String();

  // turn subheadings into newlines
  text = text.replace(/<CLNR><CR>|<CR><CLGR>/g, "\r\n");

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])<CR>/g, "$1") + "\r\n";
  }

  middleText = text;

  orderedHandler();
  return text;
}

function scrollHandler(regs, index, name) {
  bottomTexts.clear();

  const address = regs[index];
  const text = address.readUtf8String();

  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

function scrollHandler2(regs, index, name) {
  bottomTexts.clear();

  const address = regs[index];
  const text = address.readUtf8String();

  topText = text + "\r\n";

  orderedHandler();
  return text;
}

function scrollHandler3(regs, index, name) {
  const address = regs[index];
  const text = address.readUtf8String();

  bottomTexts.add(text);

  orderedHandler();
  return text;
}

trans.replace((s) => {
  if (s === previous || s === "") {
    return null;
  }
  previous = s;

  return s
    .replace(/<CR>/g, "\r\n") // replace with actual newline
    .replace(/<IM\d+>/g, "▢") // supposed to be a button on controller/keyboard
    .replace(/<[^>]+>/g, "") // deal with everything else
    .trimEnd();
});

//#endregion

//#region UI Configuration

function getHookOptions() {
  const hookNames = [];
  for (const hook of hooks) {
    hookNames.push({ value: hook[0], text: hook[0] });
    // console.log(JSON.stringify({ value: hook[0], text: hook[0] }) + ",");
  }
  return hookNames;
}

ui.title = "Atelier Sophie";
ui.description = `Configure text output and which hooks are enabled.
<br>Hold the <code>Ctrl</code> key while clicking on hooks to enable or disable them individually.
<br>Press <code>Ctrl + A</code> after clicking on a hooks box to enable all hooks in it.
<br>Check Agent's console output to see each text's corresponding hook.`;

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
    defaultValue: "0",
    ephemeral: true,
  },
  {
    id: "selectedHook",
    type: "select",
    label: "Display character count from...",
    help: "Select a hook to display its character count.",
    options: [
      { value: "DialogueName", text: "DialogueName" },
      { value: "DialogueText", text: "DialogueText" },
      { value: "Choice", text: "Choice" },
      { value: "NotificationBanner", text: "NotificationBanner" },
      { value: "AreaNameBanner", text: "AreaNameBanner" },
      { value: "SideDialogue", text: "SideDialogue" },
      { value: "BattleEnemyName", text: "BattleEnemyName" },
      { value: "BattleSkillInfo1", text: "BattleSkillInfo1" },
      { value: "BattleSkillInfo2", text: "BattleSkillInfo2" },
      { value: "BattleAction", text: "BattleAction" },
      { value: "SkillObtained", text: "SkillObtained" },
      { value: "WorldMapAreaName", text: "WorldMapAreaName" },
      { value: "TownMapAreaName", text: "TownMapAreaName" },
      { value: "MainMenuDialogue", text: "MainMenuDialogue" },
      { value: "EventName", text: "EventName" },
      { value: "EventInfo", text: "EventInfo" },
      { value: "QuestName", text: "QuestName" },
      { value: "QuestEnemyName", text: "QuestEnemyName" },
      { value: "QuestItemName", text: "QuestItemName" },
      { value: "QuestInfo", text: "QuestInfo" },
      { value: "RumorName", text: "RumorName" },
      { value: "RumorTypeName", text: "RumorTypeName" },
      { value: "RumorKnownInfo", text: "RumorKnownInfo" },
      { value: "RumorUnknownInfo", text: "RumorUnknownInfo" },
      { value: "EventObjective", text: "EventObjective" },
      { value: "StatusSkillName", text: "StatusSkillName" },
      { value: "StatusSkillInfo", text: "StatusSkillInfo" },
      { value: "ItemName", text: "ItemName" },
      { value: "RecipeName", text: "RecipeName" },
      { value: "RecipeObtainedName", text: "RecipeObtainedName" },
      { value: "RecipeMaterial1", text: "RecipeMaterial1" },
      { value: "RecipeMaterial2", text: "RecipeMaterial2" },
      { value: "MaterialQuality", text: "MaterialQuality" },
      { value: "MaterialEffect", text: "MaterialEffect" },
      { value: "MaterialTrait", text: "MaterialTrait" },
      { value: "MaterialCategory", text: "MaterialCategory" },
      { value: "RelatedRecipe", text: "RelatedRecipe" },
      {
        value: "SynthesisTransferTraitInfo",
        text: "SynthesisTransferTraitInfo",
      },
      { value: "CraftTransferTraitInfo", text: "CraftTransferTraitInfo" },
      { value: "CraftRecipeName", text: "CraftRecipeName" },
      { value: "CraftRecipeMaterial1", text: "CraftRecipeMaterial1" },
      { value: "CraftRecipeMaterial2", text: "CraftRecipeMaterial2" },
      { value: "DMakerMaterialCategory", text: "DMakerMaterialCategory" },
      { value: "DMakerMaterialTrait", text: "DMakerMaterialTrait" },
      { value: "EncyclopediaItemName", text: "EncyclopediaItemName" },
      { value: "EncyclopediaFacilityName", text: "EncyclopediaFacilityName" },
      { value: "EncyclopediaFieldName", text: "EncyclopediaFieldName" },
      { value: "EncyclopediaEnemyName", text: "EncyclopediaEnemyName" },
      { value: "EncyclopediaDialogue", text: "EncyclopediaDialogue" },
      { value: "EncyclopediaEffectName", text: "EncyclopediaEffectName" },
      { value: "EncyclopediaEffectInfo", text: "EncyclopediaEffectInfo" },
      { value: "EncyclopediaTraitName", text: "EncyclopediaTraitName" },
      { value: "EncyclopediaTraitInfo", text: "EncyclopediaTraitInfo" },
      { value: "EncyclopediaHelpName", text: "EncyclopediaHelpName" },
      { value: "EncyclopediaHelpInfo", text: "EncyclopediaHelpInfo" },
      {
        value: "EncyclopediaRecipeCompleteName",
        text: "EncyclopediaRecipeCompleteName",
      },
      {
        value: "EncyclopediaRecipeIncompleteName",
        text: "EncyclopediaRecipeIncompleteName",
      },
      {
        value: "EncyclopediaRecipeCondition",
        text: "EncyclopediaRecipeCondition",
      },
      {
        value: "EncyclopediaRecipeCategory",
        text: "EncyclopediaRecipeCategory",
      },
      {
        value: "EncyclopediaRecipeMaterial1",
        text: "EncyclopediaRecipeMaterial1",
      },
      {
        value: "EncyclopediaRecipeMaterial2",
        text: "EncyclopediaRecipeMaterial2",
      },
    ],
    defaultValue: "DialogueText",
  },
  {
    id: "selectedHookCharacterCount",
    type: "number",
    label: "Character count for selected hook",
    help: `Displays the total number of characters outputted by the selected hook.
    <br>Resets with each session.`,
    readOnly: true,
    defaultValue: 0,
    ephemeral: true,
  },
  {
    id: "hooksMain",
    type: "select",
    label: "Main Hooks",
    help: "Dialogue during cutscenes and choices.",
    multiple: true,
    options: [
      { value: "DialogueName", text: "DialogueName", selected: true },
      { value: "DialogueText", text: "DialogueText", selected: true },
      { value: "Choice", text: "Choice", selected: true },
    ],
  },
  {
    id: "hooksOverworld",
    type: "select",
    label: "Overworld Hooks",
    help: "Texts that occur in the overworld, such as enemy skill names and area banners.",
    multiple: true,
    options: [
      {
        value: "NotificationBanner",
        text: "NotificationBanner",
        selected: true,
      },
      { value: "AreaNameBanner", text: "AreaNameBanner", selected: true },
      { value: "SideDialogue", text: "SideDialogue", selected: true },
      { value: "BattleEnemyName", text: "BattleEnemyName", selected: true },
      { value: "BattleSkillInfo1", text: "BattleSkillInfo1", selected: true },
      { value: "BattleSkillInfo2", text: "BattleSkillInfo2", selected: true },
      { value: "BattleAction", text: "BattleAction", selected: true },
      { value: "SkillObtained", text: "SkillObtained", selected: true },
    ],
  },
  {
    id: "hooksMenu",
    type: "select",
    label: "Menu Hooks",
    help: "Menu texts such as recipes, quests, and more.",
    multiple: true,
    options: [
      { value: "WorldMapAreaName", text: "WorldMapAreaName", selected: true },
      { value: "TownMapAreaName", text: "TownMapAreaName", selected: true },
      { value: "MainMenuDialogue", text: "MainMenuDialogue", selected: true },
      { value: "EventName", text: "EventName", selected: true },
      { value: "EventInfo", text: "EventInfo", selected: true },
      { value: "QuestName", text: "QuestName", selected: true },
      { value: "QuestEnemyName", text: "QuestEnemyName", selected: true },
      { value: "QuestItemName", text: "QuestItemName", selected: true },
      { value: "QuestInfo", text: "QuestInfo", selected: true },
      { value: "RumorName", text: "RumorName", selected: true },
      { value: "RumorTypeName", text: "RumorTypeName", selected: true },
      { value: "RumorKnownInfo", text: "RumorKnownInfo", selected: true },
      { value: "RumorUnknownInfo", text: "RumorUnknownInfo", selected: true },
      { value: "EventObjective", text: "EventObjective", selected: true },
      { value: "StatusSkillName", text: "StatusSkillName", selected: true },
      { value: "StatusSkillInfo", text: "StatusSkillInfo", selected: true },
      { value: "ItemName", text: "ItemName", selected: true },
      { value: "RecipeName", text: "RecipeName", selected: true },
      {
        value: "RecipeObtainedName",
        text: "RecipeObtainedName",
        selected: true,
      },
      { value: "RecipeMaterial1", text: "RecipeMaterial1", selected: true },
      { value: "RecipeMaterial2", text: "RecipeMaterial2", selected: true },
      { value: "MaterialQuality", text: "MaterialQuality", selected: true },
      { value: "MaterialEffect", text: "MaterialEffect", selected: true },
      { value: "MaterialTrait", text: "MaterialTrait", selected: true },
      { value: "MaterialCategory", text: "MaterialCategory", selected: true },
      { value: "RelatedRecipe", text: "RelatedRecipe", selected: true },
      {
        value: "SynthesisTransferTraitInfo",
        text: "SynthesisTransferTraitInfo",
        selected: true,
      },
      {
        value: "CraftTransferTraitInfo",
        text: "CraftTransferTraitInfo",
        selected: true,
      },
      { value: "CraftRecipeName", text: "CraftRecipeName", selected: true },
      {
        value: "CraftRecipeMaterial1",
        text: "CraftRecipeMaterial1",
        selected: true,
      },
      {
        value: "CraftRecipeMaterial2",
        text: "CraftRecipeMaterial2",
        selected: true,
      },
      {
        value: "DMakerMaterialCategory",
        text: "DMakerMaterialCategory",
        selected: true,
      },
      {
        value: "DMakerMaterialTrait",
        text: "DMakerMaterialTrait",
        selected: true,
      },
    ],
  },
  {
    id: "hooksEncyclopedia",
    type: "select",
    label: "Encyclopedia Hooks",
    help: "Encyclopedia texts.",
    multiple: true,
    options: [
      {
        value: "EncyclopediaItemName",
        text: "EncyclopediaItemName",
        selected: true,
      },
      {
        value: "EncyclopediaFacilityName",
        text: "EncyclopediaFacilityName",
        selected: true,
      },
      {
        value: "EncyclopediaFieldName",
        text: "EncyclopediaFieldName",
        selected: true,
      },
      {
        value: "EncyclopediaEnemyName",
        text: "EncyclopediaEnemyName",
        selected: true,
      },
      {
        value: "EncyclopediaDialogue",
        text: "EncyclopediaDialogue",
        selected: true,
      },
      {
        value: "EncyclopediaEffectName",
        text: "EncyclopediaEffectName",
        selected: true,
      },
      {
        value: "EncyclopediaEffectInfo",
        text: "EncyclopediaEffectInfo",
        selected: true,
      },
      {
        value: "EncyclopediaTraitName",
        text: "EncyclopediaTraitName",
        selected: true,
      },
      {
        value: "EncyclopediaTraitInfo",
        text: "EncyclopediaTraitInfo",
        selected: true,
      },
      {
        value: "EncyclopediaHelpName",
        text: "EncyclopediaHelpName",
        selected: true,
      },
      {
        value: "EncyclopediaHelpInfo",
        text: "EncyclopediaHelpInfo",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeCompleteName",
        text: "EncyclopediaRecipeCompleteName",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeIncompleteName",
        text: "EncyclopediaRecipeIncompleteName",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeCondition",
        text: "EncyclopediaRecipeCondition",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeCategory",
        text: "EncyclopediaRecipeCategory",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeMaterial1",
        text: "EncyclopediaRecipeMaterial1",
        selected: true,
      },
      {
        value: "EncyclopediaRecipeMaterial2",
        text: "EncyclopediaRecipeMaterial2",
        selected: true,
      },
    ],
  },
];

ui.onchange = (id, current, previous) => {
  if (id.startsWith("hooks") === true) {
    console.log("Reconfiguring hooks");

    for (const hookName of previous) {
      if (current.includes(hookName) === false) {
        console.log(`[${hookName}] has been disabled`);
        hooksStatus[hookName].enabled = false;
        hooksCount -= 1;
      }
    }

    for (const hookName of current) {
      if (previous.includes(hookName) === false) {
        console.log(`[${hookName}] has been enabled`);
        hooksStatus[hookName].enabled = true;
        hooksCount += 1;
      }
    }

    ui.config.hooksEnabledCount = `${hooksCount} / ${hooks.length}`;
  } else if (id === "selectedHook") {
    console.log("Updating character count");
    ui.config.selectedHookCharacterCount = hooksStatus[current].characters;
  } else if (id === "singleSentence") {
    console.log("Single-line sentences set to " + current);
    convertToSingleLine = current;
  }
};

// Update character count in intervals
setInterval(() => {
  ui.config.selectedHookCharacterCount =
    hooksStatus[ui.config.selectedHook].characters;
}, 5000);

ui.open()
  .then(() => {
    ui.config.hooksEnabledCount = `${hooksCount} / ${hooks.length}`;
    console.log("UI loaded!");
  })
  .catch((err) => {
    console.log(err);
  });

// #endregion
