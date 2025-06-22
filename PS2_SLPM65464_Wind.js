// ==UserScript==
// @name         [SLPM65464] Wind ～a breath of heart～
// @version      0.1
// @author       logantgt
// @description  PCSX2 x64
// * HuneX PS2 Engine
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");
const Encoding = require('./libHelperEncoding.js');
const enc = new Encoding(__dirname + '/charsets/tblSLPM65464WindJP.txt');

let position = 0;

setHookEE({
    0x104934: trans.send(positionHandler),
    0x104A14: trans.send(textHandler)
});

function positionHandler(args) {
    position = this.context.a2(asPsxPtr);
}

function textHandler(args) {
        let s = position.readCustomString(enc);

        s = s.split('($')[0];

        return s;        
}