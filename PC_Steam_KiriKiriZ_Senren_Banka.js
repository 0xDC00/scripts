// ==UserScript==
// @name         Senren＊Banka / 千恋＊万花
// @version
// @author       Tree-ro
// @description  Steam
// * Yuzu Soft
// * HIKARI FIELD, NekoNyan Ltd. 
// * KiriKiriZ
// * Tested on Version 1.12
//
// https://store.steampowered.com/app/1144400/SenrenBanka/
// ==/UserScript==

const engine = require("./libPCKiriKiriZ.js");
const handler = trans.send((text) => text.trim(), '200+');
engine.hookTextrenderDll(handler);
