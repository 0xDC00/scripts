// ==UserScript==
// @name         Touhou Koumakyou: New Classic - the Embodiment of Scarlet Devil / 東方紅魔郷：New Classic　～ the Embodiment of Scarlet Devil.
// @version      0.1
// @author       Mansive
// @description  Steam
// * 上海アリス幻樂団, 上海アリスReprise
// * Alliance Arts
//
// https://store.steampowered.com/app/4659620/Touhou_Koumakyou_New_Classic__the_Embodiment_of_Scarlet_Devil/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, "200+");

attach('Dialogue', 'E8 ?? ?? ?? ?? 89 B7 ?? ?? ?? ?? 41 B8', 'rbx');

function attach(name, pattern, register) {
    const results = Memory.scanSync(__e.base, __e.size, pattern);
    if (results.length === 0) {
        console.error(`[${name}] Hook not found!`);
        return;
    }
    const address = results[0].address;
    console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);
    if (results.length > 1) {
        console.warn(`${name} has ${results.length} results`);
    }

    Interceptor.attach(address, function (args) {
        const text = this.context[register].readUtf8String();

        // console.warn(hexdump(this.context.r14, {length: 0x20}))
        /**@type {NativePointer}*/
        const metadata = this.context.r14;
        // const mysteryNumber = metadata.add(2).readU16();
        const messageName = metadata.add(8).readUtf8String();
        // console.warn(mysteryNumber, messageName);
        
        // ST_MSG1_INTRO_1_1
        if (messageName.includes('INTRO')) {
            console.warn(`Skipped character intro: ${text}`);
            return;
        }
        
        handler(text.trim());
    });
}
