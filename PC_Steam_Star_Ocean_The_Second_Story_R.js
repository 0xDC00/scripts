// ==UserScript==
// @name         STAR OCEAN THE SECOND STORY R 
// @version      0.1
// @author       [Carl-Lw]
// @description  Steam
// * Square-Enix
//
// https://store.steampowered.com/app/2238900/STAR_OCEAN_THE_SECOND_STORY_R/
// ==/UserScript==

const Mono = require('./libMono.js');

// ===== Output =====
function outLine(s) {
  trans.send(String(s));
}

// ===== Options =====
const STABLE_MS = 650;
const SPRITE_MODE = 'token'; // 'token' or 'drop'
const PRINT_ID = false;

const SUPPRESS_SHORT_EN_NEAR_JP = true;
const SHORT_EN_MAXLEN = 22;
const SHORT_EN_WINDOW_MS = 2000;

// ===== Text filering and helpers =====
function hasJapanese(s) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(s || '');
}

function stripTmpTags(s) {
  if (!s) return '';
  s = String(s);

  if (SPRITE_MODE === 'drop') {
    s = s.replace(/<sprite\b[^>]*>/gi, '');
  } else {
    s = s.replace(
      /<sprite\b[^>]*name\s*=\s*("([^"]+)"|([^\s>]+))[^>]*>/gi,
      (m, _q, qname, uname) => `[${qname || uname || 'sprite'}]`
    );
    s = s.replace(/<sprite\b[^>]*>/gi, '[sprite]');
  }

  s = s.replace(/<\/?style(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?(?:b|i|u|s|sup|sub|mark|nobr)>/gi, '');
  s = s.replace(/<\/?color(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?size(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?font(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?material(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?align(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?voffset(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?pos(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?indent(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?line-height(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?alpha(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?cspace(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?mspace(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?width(?:=[^>]+)?>/gi, '');
  s = s.replace(/<\/?link(?:=[^>]+)?>/gi, '');

  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  return s;
}

function normalizeText(s) {
  s = stripTmpTags(s);
  s = String(s || '').replace(/\r\n/g, '\n');
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
  s = s.replace(/[ \t]+/g, ' ').trim();
  s = s.replace(/^["「『]+/, '').replace(/["」』]+$/, '').trim();
  return s;
}

function isUseless(t) {
  if (!t) return true;
  const onlyText = t.replace(/[「」『』（）\(\)\[\]{}"“”'’。、・？！…\s\-—–_:;,.]/g, '');
  return onlyText.length === 0;
}

function isShortEnglishFragment(t) {
  if (t.length > SHORT_EN_MAXLEN) return false;
  if (!/^[\x00-\x7F]+$/.test(t)) return false;
  if (/^[A-Z0-9 _\[\]]+$/.test(t)) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  return true;
}

// ===== Stabilise text output to avoid duplicates =====
const slots = new Map();
let recentJPTime = 0;

function scheduleEmit(key) {
  const slot = slots.get(key);
  if (!slot) return;

  if (slot.timer) clearTimeout(slot.timer);

  slot.timer = setTimeout(() => {
    slot.timer = null;
    const t = slot.text;
    if (!t || isUseless(t)) return;

    if (SUPPRESS_SHORT_EN_NEAR_JP && !hasJapanese(t) && isShortEnglishFragment(t)) {
      if ((Date.now() - recentJPTime) < SHORT_EN_WINDOW_MS) return;
    }

    if (t === slot.lastEmitted) return;
    slot.lastEmitted = t;

    if (PRINT_ID && slot.messageId) outLine(slot.messageId);
    outLine(t);
  }, STABLE_MS);
}

// ===== Hooks =====
function main() {
  const cls = 'Game.GameText';

  Mono.setHook(null, cls, 'set_MessageId', 1, function (args) {
    const key = args[0].toString();
    const id = normalizeText(args[1].readMonoString());
    if (!id) return;

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.messageId = id;
    slots.set(key, slot);
  });

  Mono.setHook(null, cls, 'set_text', 1, function (args) {
    const key = args[0].toString();
    const t = normalizeText(args[1].readMonoString());
    if (!t || isUseless(t)) return;

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.text = t;
    slots.set(key, slot);

    if (hasJapanese(t)) recentJPTime = Date.now();
    scheduleEmit(key);
  });

}

setImmediate(main);
