// ==UserScript==
// @name         Marco & The Galaxy Dragon
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * TOKYOTOON
// * KiriKiriZ
// * tested on ver1.10
//
// https://store.steampowered.com/app/1202540/Marco__The_Galaxy_Dragon/
// ==/UserScript==

const engine = require('./libPCKiriKiriZ.js');
const handler = trans.send((s) => s.trim(), '200+');
engine.hookTextrenderDll(handler);
