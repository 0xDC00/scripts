// ==UserScript==
// @name         [0100086005EDC000] NARUTO SHIPPUDEN: Ultimate Ninja Storm Trilogy
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * BANDAI NAMCO
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.0.0': {
        // Storm 1
        "Hd61940cce6e369df": mainHandler.bind_(null, 1, "Text ST1"),
        "H9a633d873b8734c2": mainHandler.bind_(null, 0, "Cutscene ST1"),
        "Hba33e1cdeae2fd13": mainHandler.bind_(null, 2, "Info ST1"),
        "Hf1914b62b3f617d1": mainHandler.bind_(null, 1, "Menu ST1"),
        "Heab9cf18a83c9552": mainHandler.bind_(null, 0, "Tutorial Description ST1"),
        "Hdddc8e939d7e2d45": mainHandler.bind_(null, 1, "Mission Description ST1"),

        //Storm 2
        "H341a877be3696c23": mainHandler.bind_(null, 1, "Cutscene ST2"),
        "H9b5df99cc24584b0": mainHandler.bind_(null, 1, "Name ST2"),
        "He0cae6fadca8f154": mainHandler.bind_(null, 1, "Text ST2"),
        "Hc05b5a517ac432d8": mainHandler.bind_(null, 0, "Ptc Text ST2"),
        "H9a9b1a9b22d25bf5": mainHandler.bind_(null, 0, "Tutorial h1 ST2"),
        "H798217883172dc85": mainHandler.bind_(null, 0, "Tutorial h2 ST2"),
        "Hf10263954928d3e1": mainHandler.bind_(null, 1, "Tutorial Description ST2"),
        "Hd84d13ccc2c365d1": mainHandler.bind_(null, 0, "Info ST2"),
        "H33c142f4fb00e2bf": mainHandler.bind_(null, 0, "Menu ST2"),
        "H986d9498d333f4f6": mainHandler2.bind_(null, 0, "Objective ST2"),

        // Storm 3
        "He0a0a5b7c955cb75": mainHandler.bind_(null, 1, "All Text ST3"),
    }
}, globalThis.gameVer = globalThis.gameVer ?? gameVer);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
        .replace(/<ruby([^|>]+)\|[^>]+>/g, '$1')
        .replace(/<([^>]+)ruby([^>]+)>/g, '$1$2')
        .replace(/<[^>]*>/g, '')

    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}
