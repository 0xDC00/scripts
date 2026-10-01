// ==UserScript==
// @name         NEKOPARA Vol. 1 / ネコぱら Vol.1
// @version
// @author       Mansive
// @description  Steam
// * NEKO WORKs
// * Sekai Project
// * KiriKiri
//
// https://store.steampowered.com/app/333600/NEKOPARA_Vol_1/
// ==/UserScript==

const engine = require("./libPCKiriKiriZ.js");

engine.hookTextrenderDll(trans.send((s) => s, "200+"));
