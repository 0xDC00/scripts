// ==UserScript==
// @name         [01000200194AE000] マジェスティック☆マジョリカル Majestic☆Majolical
// @version      1.0.0
// @author       GO123
// @description  Yuzu
// * ENTERGRAM
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x80557408 - 0x80004000]: mainHandler.bind_(null, 0), // x0 - name
        [0x8059ee94 - 0x80004000]: mainHandler.bind_(null, 3), // x3 - player name
        [0x80557420 - 0x80004000]: mainHandler.bind_(null, 0), // x0 - dialogue
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    //console.log('onEnter');
    const address = regs[index].value; // x0
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = readString(address);
    if(s === "") return null;
    return s;
}


function readString(address) {
    // Initialization of static variables
    if (readString.savedSentence === undefined) {
        readString.savedSentence = "";
        readString.playerNameFlag = false;
        //Default name, it will get replaced by custom name as soon as it can
        readString.playerName = "ラピス";
    }
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
            //@vCHA_a01_01_018「@*name@01@*@おい@」
            case '@*':
                if(content.startsWith("name")) {
                    // For default name
                    if(readString.playerName == "ラピス") {
                        s += content.replace("name", "") + readString.playerName + parts[counter+4].substring(1);
                    }
                    // for custom name (the game will use generic sentence instead of calling you ラピス)
                    else {
                        s += content.replace("name", "") + parts[counter+3].substring(1) + parts[counter+4].substring(1);
                    }
                    counter+=5;
                    continue;
                }
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
            // @u01
            case '@u':
                // Player name detected
                readString.playerNameFlag = true;
                readString.savedSentence = "";
                counter++;
                return "";
            case '@n':
                s += content;
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
    // STEP 1:
    // No player name detected, we just return the string.
    if(!readString.playerNameFlag) {
        return s;
    }
    // STEP 2:
    // Above check didn't return, meaning playerNameFlag is true, 
    // if savedSentence is empty it means we are at the sentence hook
    // We return an empty string so that handler return null and save the sentence for later use
    if(readString.savedSentence == "") {
        readString.savedSentence = s;
        return "";
    }
    // STEP 3:
    // We reach the player name hook, append the savedSentence to the player name and return that
    else {
        const savedSentence = readString.savedSentence
        readString.playerNameFlag = false;
        readString.savedSentence = "";
        readString.playerName = s;
        return s + "\n" + savedSentence;
    }
}
