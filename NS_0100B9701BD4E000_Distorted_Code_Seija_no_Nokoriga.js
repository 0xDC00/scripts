// ==UserScript==
// @name         [0100B9701BD4E000] Distorted Code Seija no Nokoriga

// @version      1.0.1
// @author       GO123
// @description  Citron
// * TAKUYO
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");
const ui = require('./libUI.js');

const mainHandler = trans.send(handler, "200+");

setHook(
    {
        "1.0.1": {
            [0x800120d8 - 0x80004000]: mainHandler.bind_(null, 0, "textmerge"),

            [0x80011a30 - 0x80004000]: mainHandler.bind_(null, 0, "textsplit"),

        },
    }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);


function handler(regs, index, hookname) {
    const reg = regs[index];

    const address = reg.value;
    
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x100 }));
    /* processString */
    let s = address.readShiftJisString()

    if (hookname === "textmerge" && ui.config.merge === true) {
		console.log('onEnter: ' + hookname);

        if (!s.includes("\\u")) {
            s = s
                .replace(/(\\n)+/g, ' ')
                .replace(/\\d$|^\@[a-z]+|#.*?#|\\u|\$/g, '') // #.*?# <=> #[^#]+.
                .replace(/【.*?】/g, '')
                ;

            return s;


        }

    } else if (hookname === "textsplit" && ui.config.merge === false) {
		console.log('onEnter: ' + hookname);
        s = s
            .replace(/(\\n)+/g, ' ')
            .replace(/\\d$|^\@[a-z]+|#.*?#|\\u|\$/g, '') // #.*?# <=> #[^#]+.	
            ;
        return s;


    }

    ;
}
ui.title = 'Distorted code Settings';
ui.description = `Modify script behavior`;

ui.options = [
    {
        id: 'tag',
        type: 'text',
        label: 'Log Label',
        defaultValue: 'DistortedCode',
        help: 'The label to use in the console log.',
    },
    {
        id: 'merge',
        type: 'checkbox',
        label: 'Mergetext',
        defaultValue: true,
        help: 'The game has a weird System where when the characters speak or sometimes an explanation the game doesnt show the entire sentence, but rather you have click twice when the text is in a new line.'
            + '<br> Now to those who uses a translator it effects the translation because the hook extracts the next line separately rather than just extracting the sentence all at once.'
            + '<br><br> Example: <br> <br> For better translation the sentence :"「2年離れて暮らしていたとはいえ、お兄さんとは14年も一緒に生きてきたのでしょう?" should be extracted all at once but instead the outcome is "「2年離れて暮らしていたとはいえ、お兄さんとは14年も一緒に<br><br> 生きてきたのでしょう?" <br><br> With this option you can either merge it or leave it as it is.',


    }
];
ui.onchange = (id, current, previous) => {
    console.log(`[${ui.config.tag}] "${id}" was changed from "${previous}" to "${current}".`);
};

console.log('Initial configuration values:');
console.log('tag=' + ui.config.tag);
console.log('merge=' + ui.config.merge);

ui.open().then(() => {
    console.log('UI loaded!');
})
    .catch(err => {
        console.error(err);
    });
