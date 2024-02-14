// ==UserScript==
// @name         Paranormasight
// @version      
// @author       Owlie
// @description  Steam
// * Square Enix
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/2106840/PARANORMASIGHT_The_Seven_Mysteries_of_Honjo/
// ==/UserScript==
const Mono = require('./libMono.js');
const handlerLine = trans.send((s) => s, '200+');


Mono.setHook('', 'Misty.MainMenu', 'ReserveLogData', -1, {
    onEnter(args) {
        const s = args[2].readMonoString().replace(/\[[^\]]*\]/g, '');
        handlerLine(s)
    }
  });  

Mono.setHook('', 'Misty.WindowMessage', 'SetTextParam', 4, {
    onEnter(args) {       
        const s = args[1].readMonoString().replace(/\[[^\]]*\]|<[^>]*>/g, ''); 
        handlerLine(s)
    }

});
