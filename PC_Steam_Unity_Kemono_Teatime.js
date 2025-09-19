// ==UserScript==
// @name         Kemono Teatime
// @version      0.1
// @author       ptkyr
// @description  Steam
// * Studio Lalala
// * Kotoneiro
// * WHO YOU
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/2698470/Kemono_Teatime/
// ==/UserScript==

const { setHook } = require('./libMono.js')

const handler = trans.send((s) => s, '250+');

const hookInfo = [
    // Dialogue windows and radio
    { className: 'ART_TMProTextSystem', argCount: 4, textArg: 1 },
    // UI tooltips, Material descriptions, newspaper, menu, etc
    // known issue: tooltips for everything in the 茶葉 menu only appear after
    //  _releasing a hover_ and are also duplicated a dozen times for some reason
    { className: 'ART_TMProText', argCount: 1, textArg: 1 },
]

hookInfo.forEach(({className, argCount, textArg}) => {
    setHook('Assembly-CSharp', className, 'SetText', argCount, {
        onEnter(args) {
            const plaintext = args[textArg].readMonoString();
            // for some reason the raw strings have the current speaker designator
            // (e.g. 【マシュ】) at the _end_ of the string and not the start, which 
            // is a bit strange as it's counter to the UI, but for efficiency we 
            // won't bother parsing it out here
            handler(plaintext);
        }
    })
})
