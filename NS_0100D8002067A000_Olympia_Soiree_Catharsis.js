// ==UserScript==
// @name         [0100D8002067A000] Olympia Soiree Catharsis (オランピアソワレ Catharsis)
// @version      1.0.0
// @author       emilybrooks
// @description  Eden
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, "50++");

setHook({
    '1.0.0':{
        [0x8003682c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x80061e14 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";

function handler(regs, index, name)
{
    const address = regs[index].value;
    let text = address.readUtf8String();

    // best dictionary hook runs twice, so filter out the duplicate line
    if (text === previous)
    {
        previous = "";
        return
    }
    previous = text;

    text = text.replace(/\s+/g, ''); // remove whitespace
    text = text.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, "$2"); // remove ruby tags
    text = text.replace(/#Color\[[\d]+\]/g, ""); // remove color tags
    text = text.replace(/#n/g, ""); // remove newline markers
    return text;
}
