// ==UserScript==
// @name         [01000130150FA000] MUSICUS!
// @version      0.1 - 1.0.0
// @author       Koukdw
// @description  Yuzu
// * OVERDRIVE
// * NxNeXAS
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        0x8462DD4: mainHandler.bind_(null, 0, 1), // x0 - name
        // Dialogue splitted when in NVL mode ?
        0x8462DEC: mainHandler.bind_(null, 0, 0), // x0 - dialogue 1 
        0x8480d4c: mainHandler.bind_(null, 0, 0), // x0 - dialogue 2
        0x84798e0: mainHandler.bind_(null, 0, 0), // x0 - choice

        //0x84bc5b8: mainHandler // x1 - all dialogue, didnt test choice
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset) {
    console.log('onEnter');
    //const index = this.context.pc == 0x8462DD4 ? 0 : 1;
    //const address = regs[index].value;
    const address = regs[index].value.add(offset); // x0

    // let s = address.readUtf8String();
    // // print rubi
    // const rubis = s.matchAll(/(@r)([^@]+).([^\@]+)./g);
    // for (const rubi of rubis) {
    //     console.log('rubi', rubi[3]);
    //     console.log('rube', rubi[2]);
    // }
    // // remove rubi
    // s = s.replace(/(@r)([^@]+).([^\@]+)./g, '$2')
    //     .replace(/(^\x0C|^@v[A-Za-z\d_]+|@k|@p|@h[A-Za-z\d_]+|@t\d+|@s\d+|@m\d|@a|@b|@d)+/g, '')
    //     .replace(/(@n)+/g, ' ');

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = readString(address);
    return s;
}


function readString(address) {
    let s = address.readUtf8String();
    const parts = s.split(/(?=@.)/g);
    s = '';
    let counter = 0;
    while (counter < parts.length) {
        const part = parts[counter];
        if (part.startsWith('@') === false) {
            s += part;
            counter++;
            continue;
        }
        const tag = part.substring(0, 2);
        const content = part.substring(2);
        switch (tag) {
            // @v20372@s5050「くらえっ！　セクシーービーーーーム！！」
            // @v10446「や、や……やっ！　@t0321@hHUBUKI_U101EG2やったあああああああ！！！」@k
            case '@s':
            case '@t':
                s += content.substring(4);
                counter++
                continue;
            // @v01856@m00@a「あと……大切な人と過ごした、忘れられない日々」
            case '@m':
                s += content.substring(2);
                counter++
                continue;

            case '@n':
                s += '\n' + content;
                counter++
                continue;
            // あくあさんの肩の力が抜け、柔らかい笑みを向けてくる。@p@nそれを見た瞬間、僕の心臓が大きく跳ねた。@k
            case '@b':
            case '@a':
            case '@p':
            case '@k':
                s += content;
                counter++
                continue;
            // @v00095「うん、その………@t0242@hAQUA_A102TRあ、ありがとう」
            // @vRYU_01100010「よう、作家先生のお出ましじゃないか」
            case '@v':
            case '@h':
                s += content.replace(/[\w_-]+/g, '');
                counter++
                continue;
            // 差し出された酒を遠慮なく@r呷@あお@る。
            case '@r':
                s += content + parts[counter + 2].substring(1);
                counter += 3;
                continue;
            // @I771418──穢れた生き物を@I@
            // @I771418──@r屠@ほふ@れ@I@
            case '@I':
                if (content == '@' || parts[counter + 1].substring(0, 2) == '@r') {
                    counter++
                    continue;
                }
                s += content.replace(/[\d+─]/g, '');
                counter += 3;
                continue;
            default:
                console.log('Unrecognized dialogue tag: ' + tag);
                s += content;
                counter++
                continue;
        }
    }
    return s;
}