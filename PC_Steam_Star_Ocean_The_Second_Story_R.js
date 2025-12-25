// ==UserScript==
// @name         STAR OCEAN THE SECOND STORY R
// @version      0.1
// @author       [Carl-Lw]
// @description  Steam 
//* Square-Enix
//
// https://store.steampowered.com/app/2238900/STAR_OCEAN_THE_SECOND_STORY_R/
// ==/UserScript==

const Mono = require('./libMono.js');

const STABLE_MS = 650;
const PRINT_ID = false;

const SUPPRESS_SHORT_EN_NEAR_JP = true;
const SHORT_EN_MAXLEN = 22;
const SHORT_EN_WINDOW_MS = 2000;

const outLine = s => trans.send(String(s));
const hasJP = s => /[\u3040-\u30ff\u3400-\u9fff]/.test(s || '');

// Replace TMP sprites with placeholder box
const stripTmpTags = s => String(s || '')
  .replace(/<sprite\b[^>]*>/gi, ' ▢ ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/?[^>]+>/g, '');

const norm = s => stripTmpTags(s).replace(/\r\n/g, '\n').trim();

// "Useful" if it contains at least one ascii letter/digit or JP script char
const useful = t => /[0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]/.test(t || '');

const shortEN = t =>
  t && t.length <= SHORT_EN_MAXLEN &&
  /^[\x00-\x7F]+$/.test(t) &&
  /[A-Za-z]/.test(t) &&
  !/^[A-Z0-9 _\[\]]+$/.test(t);

const slots = new Map();
let recentJPTime = 0;

function scheduleEmit(key) {
  const slot = slots.get(key);
  if (!slot) return;
  if (slot.timer) clearTimeout(slot.timer);

  slot.timer = setTimeout(() => {
    slot.timer = null;
    const t = slot.text;
    if (!t || !useful(t)) return;

    if (SUPPRESS_SHORT_EN_NEAR_JP && !hasJP(t) && shortEN(t)) {
      if ((Date.now() - recentJPTime) < SHORT_EN_WINDOW_MS) return;
    }

    if (t === slot.lastEmitted) return;
    slot.lastEmitted = t;

    if (PRINT_ID && slot.messageId) outLine(slot.messageId);
    outLine(t);
  }, STABLE_MS);
}

function main() {
  const cls = 'Game.GameText';

  Mono.setHook(null, cls, 'set_MessageId', 1, args => {
    const key = args[0].toString();
    const id = norm(args[1].readMonoString());
    if (!id) return;

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.messageId = id;
    slots.set(key, slot);
  });

  Mono.setHook(null, cls, 'set_text', 1, args => {
    const key = args[0].toString();
    const t = norm(args[1].readMonoString());
    if (!t || !useful(t)) return;

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.text = t;
    slots.set(key, slot);

    if (hasJP(t)) recentJPTime = Date.now();
    scheduleEmit(key);
  });
}

setImmediate(main);

