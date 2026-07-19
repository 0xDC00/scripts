// ==UserScript==
// @name         The Silver Case
// @version      5.4.1.1285548
// @author       Musi
// @description  Steam
// * GRASSHOPPER MANUFACTURE INC.
//
// https://store.steampowered.com/app/476650/The_Silver_Case/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');

let buffer = '';
let flushTimer = null;
const strings = new Map();

function dedupe(s) {
    const half = s.length / 2;
    if (Number.isInteger(half) && s.slice(0, half).replace(/、|。/g, '\u3000') === s.slice(half).replace(/、|。/g, '\u3000')) {
        return s.slice(0, half);
    }
    return s;
}

function flush() {
    if (buffer) {
        handler(dedupe(buffer));
        buffer = '';
    }
}

Mono.setHook('', 'SilverMessage.SilverString', 'SetData', ['System.String'], {
    onEnter(args) {
        strings.set(args[0].toString(), args[1].readMonoString());
    }
});

Mono.setHook('', 'SilverMessage.SilverString', 'Draw', [], {
    onEnter(args) {
        const key = args[0].toString();
        const text = strings.get(key);
        if (text === undefined) return;
        strings.delete(key);
        buffer += text;
        clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 250);
    }
});

Mono.setHook('', 'SilverMessage.SilverScrollMail', 'SetText', -1, {
    onEnter(args) {
        let text = args[1].readMonoString().replace(/\\k(\\c)?|＄/g, "");
        handler(text);
    }
});
