// ==UserScript==
// @name         OCTOPATH TRAVELER 0
// @version      1.0.3.0
// @author       Mansive / Musi
// @description  Steam
// * Square Enix
// * DOKIDOKI GROOVE WORKS
//
// https://store.steampowered.com/app/3014320/OCTOPATH_TRAVELER_0/
// ==/UserScript==
const UE = require("./libUnrealEngine.js");
const { getObjectFullName } = UE;

const handlerLine = trans.send((s) => s, "250+");

// store last sent text for each context to avoid duplicates
const lastSent = {};
// store character name
let lastCharacterName = "";

UE.setHook("/Script/Kingship.KSTextBlock:SetText", {
  onEnter(args) {
    const thiz = args[0];
    this.thiz = thiz;
    // 304; 0x130
    // this.text = thiz.add(0x1A0).readPointer();
    // console.log("onEnter", this.text);
  },
  onLeave(retVal) {
    const thiz = this.thiz; // args[0]
    // console.warn(hexdump(thiz, { header: true, ansi: true, length: 0x150 }));
    const ptext = thiz.add(0x1A0);

    // no idea what this is for
    // const text = ptext.readPointer();
    // if (text.equals(this.text) === true) {
    //   console.warn("HIT");
    //   return;
    // }

    // find the offset for `ptext`
    // for (let i = 0; i < 60; i++) {
    //   const offset = 0x8 * i;
    //   console.warn("offset: ", offset);
    //   try {
    //     // console.warn("adding offset...");
    //     const testptext = thiz.add(offset);
    //     // console.warn("reading string...");
    //     console.warn(offset, JSON.stringify(testptext.readFTextString()));
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }

    const ctx = getObjectFullName(thiz);
    let s = ptext.readFTextString();

    // enable this log to discover all the calls to SetText
    // console.warn("ctx:" + JSON.stringify(ctx));
    // console.warn("ctxStr:" + JSON.stringify(s) + "\n");

    // capture name
    if (ctx === "/Engine/Transient.GameEngine.KSGameInstance.BalloonManagerBP_C.WidgetTree.Balloon_03.WidgetTree.NameTextBlock") {
      lastCharacterName = s;
    }

    // paste in only the calls you want to get text from
    if (
      ctx === "/Engine/Transient.GameEngine.KSGameInstance.BalloonManagerBP_C.WidgetTree.Balloon_03.WidgetTree.TalkText_Balloon.WidgetTree.Balloon" || // capture dialogue
      ctx === "/Engine/Transient.GameEngine.KSGameInstance.NarrationWidget_C.WidgetTree.NarrationMessageWidget.WidgetTree.KSTextBlock" // capture fullscreen text
    ) {
      if (s !== "") {
        // only send if text is different from the last sent text 
        if (!lastSent[ctx] || s.length > lastSent[ctx].length || !s.startsWith(lastSent[ctx].substring(0, s.length))) {
          lastSent[ctx] = s;
          
          // clear name if this is a narration block to avoid carryover
          if (ctx.includes("NarrationWidget")) {
            lastCharacterName = "";
          }

          // combine name and text with a newline
          const output = lastCharacterName ? `${lastCharacterName}\n\n${s}` : s;
          handlerLine(output);

          // clear the name after sending so it doesnt stick to the next line
          if (ctx.includes("TalkText_Balloon")) {
            lastCharacterName = "";
          }
        }
      }
    }
    // uncomment to show all text not handled by our if-statements (to create filters)
    else {
      // console.warn("ctx:" + JSON.stringify(ctx));
      // console.warn("ctxStr:" + JSON.stringify(s) + "\n");
    }
  },
});
