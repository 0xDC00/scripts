// ==UserScript==
// @name         Wushu Chronicles
// @version      
// @author       [DC]
// @description  Steam
// * JiangHu Studio
// * 
//
// https://store.steampowered.com/app/921390/Wushu_Chronicles/
// ==/UserScript==
const __l = Process.getModuleByName('fm_main.dll');
const handlerLine = trans.send((s) => s, '250+');

(function () {
    const dialogSig1 = 'E8 ???????? 85C0 7D?? 8????? 10 5? 5? E8';
    const results = Memory.scanSync(__l.base, __l.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const address = results[0].address;

    // choice + ...
    let ins = Instruction.parse(address);
    while (ins.mnemonic !== 'ret') {
        ins = Instruction.parse(ins.next);
    }
    console.log('[DialoguesPattern Choice] ' + ins.address);
    Breakpoint.add(ins.address, function () {
        const retVal = this.context.eax;
        const s = readStdWString(retVal).replace(/<.*?>/g, '');
        setTimeout(() => handlerLine('- ' + s), 100);
    });

    // name + text + ...
    ins = Instruction.parse(ins.next);
    while (ins.mnemonic !== 'ret') {
        ins = Instruction.parse(ins.next);
    }
    console.log('[DialoguesPattern Main]   ' + ins.address);
    Breakpoint.add(ins.address, function () {
        const retVal = this.context.eax;
        const s = readStdWString(retVal).replace(/<.*?>/g, '');
        handlerLine(s);
    });
})();

/**
 * ?c_str@?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@QBEPBDXZ
 * @param {NativePointer} address 
 */
function readStdWString(address) {
    const numChar = address.add(0x14).readU32();  // 0x18 len+terminated
    if (numChar < 8) {
        return address.add(4).readUtf16String(numChar);
    }
    return address.add(4).readPointer().readUtf16String(numChar);
}