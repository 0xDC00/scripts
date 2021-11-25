// ==UserScript==
// @name         9-nine-:Episode *
// @version      
// @author       [DC]
// @description  [PC] https://store.steampowered.com/app/976390/9nineEpisode_1/
// * KiriKiriZ Engine
// ==/UserScript==
const engine = require('./libPCKiriKiriZ.js');

engine.hookTextrenderDll(function(s) {
    trans.send(s);
    return s;
});