// ==UserScript==
// @name         Mononokei Kanojo ~Inkya Desu ga, Koishite Ii Desu ka?~
// @version      
// @author       [DC]
// @description  
// * North Box
// * Unity (il2cpp)
// 
// UTAGE: Unity Text Adventure Game Engine (c) Ryohei Tokimura
// https://github.com/mujyu/Lover/blob/906b1ef27c6d2303335cec1972d19f82cd16f21f/Assets/Utage/Scripts/ADV/Logic/BackLog/AdvBacklog.cs#L81
// old: https://github.com/feiton777/UnityChanTest/blob/master/program/UnityChan/Assets/Utage/Scripts/ADV/Logic/BackLog/AdvBacklog.cs
// 
// https://vndb.org/v27071
// ...
// ==/UserScript==

const {
    setHook,
    findClass
} = require('./libMono.js');

const kclass1 = findClass('' /* Assembly-CSharp */, 'Utage.AdvBacklog');
const method1 = kclass1.findMethod('AddData', 2);
const get_Text = kclass1.findMethod('get_Text');
const get_Name = kclass1.findMethod('get_MainCharacterNameText');
// const kclass2 = findClass('', 'Utage.AdvCharacterInfo');
// const get_LocalizeNameText = kclass2.findMethod('get_LocalizeNameText');

//console.log(JSON.stringify(method1, null, 2));
if (method1 !== null) { // v3
    setHook(method1, {
        onEnter: function (args) {
            console.log('onEnter: Utage.AdvBacklog.AddData');
            // if (args[2].isNull() === false) {
            //     // get_NameText, get_LocalizeNameText
            //     const p = get_LocalizeNameText.invoke(args[2]);
            //     const name = p.readMonoString();
            //     console.log(name);
            // }

            //// test field getValue
            // const field1 = kclass1.findField('dataList');
            // console.log(hexdump(field1.getValue(args[0]).readPointer()));

            this.thiz = args[0];
        },
        onLeave: function() {
            const thiz = this.thiz;

            // get property value
            const n = get_Name.invoke(thiz).readMonoString();
            const t = get_Text.invoke(thiz).readMonoString()
                .replace(/<.+?>/g, '') // htmlTag
                .replace(/\n+/g, ' ');
            
            const s = (n !== '' ? n + '\n' + t : t);
            trans.send(s);
        }
    });
}
else { // older
    const method3 = kclass1.findMethod('AddData', 3);
    if (method3 !== null) {
        setHook(method3, function (args) {
            console.log('onEnter: Utage.AdvBacklog.AddData');
            let n = args[2].readMonoString();
            let t = args[1].readMonoString()
                .replace(/<.+?>/g, '') // htmlTag
                .replace(/\n+/g, ' ');
            ;

            const s = (n !== '' ? n + '\n' + t : t);
            trans.send(s);
        });
    }
    else {
        console.error('[UTAGE] Not found!');
    }
}