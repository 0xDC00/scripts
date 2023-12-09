// ==UserScript==
// @name         Ni no Kuni Wrath of the White Witch™ Remastered
// @version      0.2
// @author       aqui
// @description  Steam
// * Level-5
//
// https://store.steampowered.com/app/798460/Ni_no_Kuni_Wrath_of_the_White_Witch_Remastered/
// ==/UserScript==
const __e = Process.enumerateModules()[0];
const handlerLine = trans.send((s) => s, '250+');

// dialogues and descriptions
(function () {
    const dialogSig1 = '0F?? ?? ?? ???????? 49 ?? ?? 46 ?? ?? ?? 75 ?? 48 ?? ?? ?? E8'; //E8 2EBDF2FF
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    let hookAddress = results[0].address.add(0x15)
    console.log('[DialoguesPattern] ' + hookAddress);

    let lastTwentyStrings = []

    Interceptor.attach(hookAddress, {
        onEnter(args) {
            let newString = args[1].readCString().replace(/<[^>]*>/g, '').replace(/\[(.*?)\/(.*?)\]/g, "$1").replace(/\\n/g, "\n")
            if (!lastTwentyStrings.includes(newString)) {
                handlerLine(newString)
                lastTwentyStrings.push(newString)
                if (lastTwentyStrings.size > 20) {
                    lastTwentyStrings.shift()
                }
            }
        },
    });
})();
