// ==UserScript==
// @name         Touhou Hero of Ice Fairy / 东方冰之勇者记
// @version      0.1
// @author       Mansive
// @description  Steam
// * GAMEPULSE 游戏脉冲
// * Unity (Mono)
//
// https://store.steampowered.com/app/1955830/Touhou_Hero_of_Ice_Fairy/
// ==/UserScript==
const Mono = require("./libMono.js");

const handler = trans.send((s) => s, "200+");

Mono.setHook("", "DialogueMgr", "UpdateContent", 2, {
    onEnter(args) {
        console.log("onEnter: DialogueMgr.UpdateContent");
        const text = args[1].readMonoString();
        // console.warn(JSON.stringify(text));
        handler(text);
    },
});

trans.replace((s) => {
    s = s.replace(/【[^】]+】/g, "");
    s = s.replace(/\<\/?color[^>]*>|KKK|\|/g, ""); // I said before, I'm |<color=#e92988>KKKClownpieceKKK</color>|.
    return s;
});
