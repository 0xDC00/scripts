// ==UserScript==
// @name         Dies irae ~Acta est Fabula~ HD
// @version      
// @author       Koukdw
// @description  
// * +18 and ALL AGE
// * Malie
//
// ==/UserScript==
const __e = Process.enumerateModules()[0];
const handlerLine = trans.send((s) => s, -250);

(function () {
    const dialogSig1 = '0f?????? 89???? 8d???? 89???? 8d????00000000';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const hookAddress = results[0].address; // 0x0069977C
    console.log('[DialoguesPattern] ' + hookAddress);

    Breakpoint.add(hookAddress, function () {
        let strBuffer = this.context.ecx;
        let strPointer = this.context.edx.shl(1);
        let str = readString(strBuffer.add(strPointer));
        handlerLine(str);
    })
})();

function readString(address) {
    let s = "", c;
    //console.log(hexdump(address))
    while ((c = address.readU16()) !== 0) {
        // utf-16 characters
        if (c >= 0x20) {
            s += String.fromCharCode(c);
            address = address.add(2);
        }
        else {
            // start command
            if (c === 0x7) {
                address = address.add(2);
                let cmd = address.readU16();
                address = address.add(2); // skip cmd
                // voice id --> skip
                if (cmd === 0x8) {
                    while ((c = address.readU16()) !== 0) {
                        address = address.add(2);
                    }
                    address = address.add(2);
                }
                // end line --> return string
                if (cmd === 0x6) {
                    return s;
                }
                // ruby
                if (cmd === 0x1) {
                    while ((c = address.readU16()) !== 0) {
                        // when we reach 0xa we have the kanji part
                        if (c === 0xa) {
                            address = address.add(2);
                            let rubi = '';
                            while ((c = address.readU16()) !== 0) {
                                rubi += String.fromCharCode(c);
                                address = address.add(2);
                            }
                            console.log('rubi: ' + rubi);
                            break;
                        }
                        else {
                            s += String.fromCharCode(c);
                            address = address.add(2);
                        }
                    }
                    address = address.add(2);
                }
            }
            else {
                address = address.add(2);
            }
        }
    }
}