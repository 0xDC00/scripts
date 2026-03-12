// ==UserScript==
// @name         The Liar Princess and the Blind Prince (嘘つき姫と盲目王子)
// @version      0.1
// @author       Mansive
// @description  Steam
// * Nippon Ichi Software, Inc., Systemsoft beta, Inc.
// * NIS America, Inc.
//
// https://store.steampowered.com/app/3901910/The_Liar_Princess_and_the_Blind_Prince/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send((s) => s, "200+");

attach("DialogueHot", "E8 5D 81 FE FF"); // tied to framerate
// attach("DialogueEnd", "E8 6A 31 FE FF"); // unreliable, doesn't work sometimes

let previousText = "";

function attach(name, pattern, register) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    console.error(`[${name}] Hook not found!`);
    return;
  }
  const address = results[0].address;
  console.log(`[${name}] @ ${address}`);

  Interceptor.attach(address, function (args) {
    // console.log("onEnter:", name);

    /** @type {NativePointer} */
    const length = this.context.r8;

    // game's button check?
    // PrincessAndPrince.exe+9A92 - 49 83 F8 0F           - cmp r8,0F
    if (length.compare(0x0f) <= 0) {
      return;
    }

    const text = this.context.rdx.readUtf8String();
    if (text === previousText) {
      return;
    }
    previousText = text;

    handler(text);
  });
}
