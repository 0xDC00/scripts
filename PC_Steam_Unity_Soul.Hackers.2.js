// ==UserScript==
// @name         Soul Hackers 2
// @version      
// @author       Koukdw
// @description  Steam
// * Atlus
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/1777620/Soul_Hackers_2/
// ==/UserScript==
console.log(`
Known bug: If you quit the game without detaching game get stuck so
Please detach before quitting the game
`)
const Mono = require('./libMono.js');
const {
    _module
} = Mono;
const handlerLine = trans.send((s) => s, '250+');

// Subtitle
Mono.setHook("", ".EventSubtitleManager", "Show", -1, {
    onEnter: (args) => {
        console.log("onEnter EventSubtitleManager:Show");
        let text = args[1].readMonoString()
        let s = cleanText2(text);
        handlerLine(s);
    }
})

// Dialogue + Name
Mono.setHook("", ".EventTalkController", "SetMessageText", 5, {
    onEnter: (args) => {
        console.log("onEnter EventTalkController:SetMessageText");
        let text = args[1].readMonoString();
        let name = args[2].readMonoString();
        text = cleanText(text);
        name = cleanText(name);
        handlerLine(name + "\n" + text);
    }
})

// Choices
Mono.setHook("", "Game.UI.Common.UISelectWindow", "SetText", -1, {
    onEnter: function(args){
        console.log("onEnter Game.UI.Common.UISelectWindow:SetText");
        let text = args[2].readMonoString();
        let s = cleanText(text);
        handlerLine(s);
    }
})

// Tips
Mono.setHook("", "Game.Common.TipsManager", "GetNameMessage", -1, {
    onLeave(retValue) {
        console.log("onLeave Game.Common.TipsManager:GetNameMessage");
        let text = retValue.readMonoString();
        let s = cleanText(text);
        handlerLine(s);
    }
})

Mono.setHook("", "Game.Common.TipsManager", "GetTextMessage", -1, {
    onLeave(retValue) {
        console.log("onLeave Game.Common.TipsManager:GetTextMessage");
        let text = retValue.readMonoString();
        let s = cleanText2(text);
        handlerLine(s);
    }
})


// Tutorial
{
    const target = Mono.use('AtLib', 'AtLib.AtText').SetText.address;
    const targetStr = target.toString();
    console.log(`target = ${targetStr}`);
    let setTextAddr = [];

    // find call
    const vmAddress = Mono.use('', 'Game.UI.Common.UISystemHelpView').UpdateView.address;
    let ins = Instruction.parse(vmAddress);
    while (ins.mnemonic !== 'ret') {
        if (ins.mnemonic === 'call') {
            if (ins.operands[0].type === 'imm') {
                if (ins.opStr === targetStr) {
                    setTextAddr.push(ins);
                }
            }
        }
        ins = Instruction.parse(ins.next);
    }
    setTextAddr.forEach((ins, index) => {
        if (index === 0 || index === 2) {
            console.log(`Hooking SetText at ${ins.address.sub(_module.base).add(0x180000000)}`);
            Breakpoint.add(ins.address, function() {
                console.log(`onEnter: SetText at ${ins.address.sub(_module.base).add(0x180000000)}`);
                let text = this.context.rdx.readMonoString();
                let s = cleanText2(text);
                handlerLine(s);
            })
            // Interceptor makes the game crash

            // Interceptor.attach(ins.address, {
            //     onEnter: function (args) {
            //         console.log(`onEnter: SetText at ${ins.address.sub(_module.base).add(0x180000000)}`);
            //         let text = args[1].readMonoString();
            //         let s = cleanText2(text);
            //         handlerLine(s);
            //     }
            // })
        }
    });
}


// Prompt text (Annoying)
// Mono.setHook("", "Game.UI.Common.UICommonDialogBox", "SetText", -1, {
//     onEnter: function(args) {
//         console.log("onEnter Game.UI.Common.UICommonDialogBox:SetText");
//         let text = args[1].readMonoString();
//         handlerLine(text);
//     } 
// })

// Prompt choice (Annoying)
// Mono.setHook("", "Game.UI.Common.UICommonDialogBoxSelector", "SetText", -1, {
//     onEnter: function(args){
//         console.warn("onEnter Game.UI.Common.UICommonDialogBoxSelector:SetText");
//         let text = args[1].readMonoString();
//         let s = text;
//         handlerLine(s);
//     }
// })


// Notification + spell names (Annoying) uncomment if you really want this
// Mono.setHook("", "Game.UI.Battle.BattleActionPanel", "SetText", -1, {
//     onEnter: function(args){
//         console.warn("onEnter Game.UI.Battle.BattleActionPanel:SetText", this.returnAddress.sub(_module.base).add(0x180000000));
//         let text = args[1].readMonoString();
//         let s = text;
//         handlerLine(s);
//     }
// })


// Root hook (get everything)
// Mono.setHook("AtLib", "AtLib.AtText", "SetText", -1, {
//     onEnter: function(args){
//         console.warn("onEnter AtLib.AtText:SetText", this.returnAddress.sub(_module.base).add(0x180000000));
//         let text = args[1].readMonoString();
//         let s = text;
//         console.warn(s);
//     }
// })

function cleanText(s) {
    return s
        .replace(/\n+/g, ' ') // single line
        .replace(/<\/?[^>]*./g, ''); // remove all html tag
}
// keep the newline (better for big text because otherwise it's hard to read)
function cleanText2(s) {
    return s
        .replace(/<\/?[^>]*./g, ''); // remove all html tag
}