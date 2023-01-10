// ==UserScript==
// @name         Ken ga Kimi | Ken ga Kimi: Momoyo Tsuzuri
// @version      
// @author       [DC]
// @description  Steam
// * Rejet | Beijing Happy Entertainment Technology
// * Unity (JIT), engine MV_?
//
// https://store.steampowered.com/app/1162650/Ken_ga_Kimi/
// https://store.steampowered.com/app/1387350/Ken_ga_Kimi_Momoyo_Tsuzuri/
// ==/UserScript==
const Mono = require('./libMono.js');
const {
    setHook,
    findClass,
    // findMethod,
    // findFunction,
    // findField,
    // createFunction
} = Mono;

const handlerChar = trans.send((s) => s, '200++');

// const kclass1 = findClass('', 'Objects.TextBox');
// const field1 = kclass1.findField('scenarioFile');
// console.log(JSON.stringify(kclass1, null, 2));
// console.log(JSON.stringify(field1, null, 2));
// console.log(field1.getValue(args[0]).readPointer().readMonoString());

// const kclass1 = findClass('', 'Objects.TextBox');
// const md1 = kclass1.findMethod('SetNameText');
// setHook(md1, (args) => {
//     console.log('onEnter: Objects.TextBox.SetNameText');
//     readString(args[1]);
// })

////// Multiple-hooks (port from ZDTL dll)

//// public void SetNameText(string src)
setHook('' /* Assembly-CSharp */, 'Objects.TextBox' /* NameSpace.Class */, 'SetNameText' /* Method */, -1 /* argCnt */, {
    onEnter: (args) => {
        console.log('onEnter: Objects.TextBox.SetNameText');
        readString(args[1]);
    }
});

//// public override void AddString(string character, string fontName, uint fontColor, uint withShadow, uint withLine, uint foreColor, uint shadowColor, uint lineColor)
setHook('', 'Objects.DecorativeText', 'AddString', -1, {
    onEnter: (args) => {
        console.log('onEnter: Objects.DecorativeText.AddLetter');
        readString(args[1]);
    }
});

//// public virtual void AddString(string character, string fontName, uint fontColor, uint withShadow, uint withLine, uint foreColor, uint shadowColor, uint lineColor)
setHook('', 'Objects.Text', 'AddString', -1, {
    onEnter: (args) => {
        console.log('onEnter: Objects.Text.AddString');
        readString(args[1]);
    }
});

//// public virtual void AddLetter(char character, string fontName, uint fontColor, uint withShadow, uint withLine, uint foreColor, uint shadowColor, uint lineColor)
let sp = 0; // thread filter
let timer1 = null;
const pBuf = Memory.alloc(8);
//const Text_GetSrcText = createFunction('', 'Objects.Text', 'GetSrcText', -1, 'pointer', ['pointer']); // on-screen text
setHook('', 'Objects.Text', 'AddLetter', 8, {
    onEnter: function (args) {
        //// problem (rubi), fix => once sp (chars => ruby)
        if (sp === 0) {
            sp = this.context.sp;
            console.log('onEnter: Objects.Text.AddLetter'); // on-screen text
        }
        if (this.context.sp.equals(sp) === false) return;

        clearTimeout(timer1);
        timer1 = setTimeout(() => { sp = 0 }, 250); // reset sp

        pBuf.writePointer(args[1]);
        const c = pBuf.readUtf16String(2)[0];
        handlerChar(c);

        //// onLeave => call (problem: rubi - same object)
        //this.thiz = args[0];
    },
    // onLeave: function () {
    //     const address = Text_GetSrcText(this.thiz);
    //     // problem: multiple time
    //     // <tips name="辞書127"><ruby value="ちっきょ">蟄居</ruby></tips>されてから<br>
    //     const s = address.readMonoString()
    //         //.replaceAll('<br>', ' ') // \n => <br>
    //         .replace(/<.+?>/g, '');
    //         ;
    //     singleHandler(s);
    // }
});

//// public override ScenarioDeclaration.State Execute(Scene scene, Element element)
const Element_GetAttribute = Mono.use('', 'Scenario.Element').GetAttribute.implementation;
console.log('Element_GetAttribute', Element_GetAttribute);
setHook('', 'Scenario.CaseCommand', 'Execute', -1, {
    onEnter: (args) => {
        console.log('onEnter: Scenario.CaseCommand.Execute');
        // string attribute = element.GetAttribute("value"); // first call
        const address = getElementAttribute(args[2], 'value');
        readString(address);
    }
});

function getElementAttribute(thiz, attribute) {
    const att = Memory.allocMonoString(attribute); // mono_gc
    return Element_GetAttribute(thiz, att);
}

function readString(address) {
    const s = address.readMonoString()
        //.replace(/<.+?>|^\s+/g, '')
        ;
    if (s !== '') handlerChar(s + '\r\n');
}

// Replacer
trans.replace((s) => {
    return s
        .replace(/<.+?>|^\s+|\r?\n+$/g, '') // htmlTag | trimBeginSpace | trimEndNewLine
        ;
});