// ==UserScript==
// @name         Cursed Futanari - Ring (封呪姫 / Fuuju Hime)
// @version      3.41A
// @author       Tom (tomrock645) 
// @description  Booth
// @developer & publisher: Mofuland (もふりる)
//
// https://tempoko.booth.pm/items/378803
// ==/UserScript== 


const Mono = require('./libMono.js');
const mainHandler = trans.send(s => s, 200);
const secondaryHandler = trans.send(s => s, '200+');


let name = '';
Mono.setHook('', 'TM', 'SetNameText', -1,
    {
        onEnter(args) {
            // console.warn("In: name");
            name = args[1].readMonoString();
        }
    });


Mono.setHook('', 'TM', 'SetNewText', -1,
    {
        onEnter(args) {
            // console.warn("In: text");
            let text = args[1].readMonoString();

            text = text.replace(/￥/g, '');

            if (name !== '') {
                mainHandler(name + "\n" + text);
                name = '';
            }

            else
                mainHandler(text);
        }
    });


// Choices
Mono.setHook('', 'TM', 'Select_SetText', -1,
    {
        onEnter(args) {
            // console.warn("In: Select_SetText");
            let text = args[3].readMonoString();
            secondaryHandler(text);
        }
    });


Mono.setHook('', 'TM', 'BattleText', -1,
    {
        onEnter(args) {
            // console.warn("In: BattleText");
            let text = args[1].readMonoString();

            if (text.startsWith("ROUND"))
                return;

            mainHandler(text);
        }
    });


let skillName = '';
Mono.setHook('', 'GMain', 'SklName', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: skill name");
            skillName = retVal.readMonoString();
        }
    });


Mono.setHook('', 'GMain', 'SklText', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: skill text");
            let text = retVal.readMonoString();
            mainHandler(skillName + "\n" + text);
        }
    });
// Unfortunately I don't know how to extract passive skills. 
// The text is at GMain.GetPSkillStr but I really have no clue how to make it work.


let stageName = '';
Mono.setHook('', 'GMain', 'GetStageName', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: stage name");
            stageName = retVal.readMonoString();
        }
    });


Mono.setHook('', 'GMain', 'GetStageText', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: stage text");
            let text = retVal.readMonoString();
            mainHandler(stageName + "\n" + text);
        }
    });


let itemName = '';
Mono.setHook('', 'GMain', 'ItemName', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: item name");
            itemName = retVal.readMonoString();
        }
    });


Mono.setHook('', 'GMain', 'ItemExplain', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: item text");
            let text = retVal.readMonoString();
            mainHandler(itemName + "\n" + text);
        }
    });


let wantedName = '';
Mono.setHook('', 'GMain', 'WantedName', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: wanted name");
            wantedName = retVal.readMonoString();
        }
    });



// Even if the player completes a bounty the text will be the original instead of the completion one. At least it's nothing to worry about as it's a general 'bounty cleared' message.
Mono.setHook('', 'GMain', 'WantedExplain', -1,
    {
        onLeave(retVal) {
            // console.warn("leave: wanted text");
            let text = retVal.readMonoString();
            mainHandler(wantedName + "\n---------------\n" + text);
        }
    });


Mono.setHook('', 'TM', 'YesNo_Show', -1,
    {
        onEnter(args) {
            // console.warn("enter: YesNo_Show");
            let text = args[1].readMonoString();
            mainHandler(text);
        }
    });


console.warn("The game can be played uncensored. The guide is near the bottom of this doc https://docs.google.com/document/d/1RURQG0_8fPcl-UV23cqJ8uu5bTg2B7L2uPEWzK-NwRQ/edit?tab=t.0");