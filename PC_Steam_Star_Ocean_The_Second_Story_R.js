// ==UserScript==
// @name         STAR OCEAN THE SECOND STORY R
// @version      0.1
// @author       [Carl-Lw]
// @description  Steam
//* Square-Enix
//
// https://store.steampowered.com/app/2238900/STAR_OCEAN_THE_SECOND STORY R/
// ==/UserScript==

const Mono = require('./libMono.js');

const STABLE_MS = 650;
const PRINT_ID = false;

const SUPPRESS_SHORT_EN_NEAR_JP = true;
const SHORT_EN_MAXLEN = 22;
const SHORT_EN_WINDOW_MS = 2000;

// Toggle: suppress number-heavy / numeric-only spam (battle damage, stats, etc.)
const SUPPRESS_NUMERIC_SPAM = true;

// Strictness: true = drop only numeric-like strings; false = drop mostly-numeric strings too
const DROP_ONLY_PURE_NUMERIC = true;
const NUMERIC_RATIO_THRESHOLD = 0.70;

const outLine = s => trans.send(String(s));

/* ===============================
   Regex list
   =============================== */
const RX = {
  JP: /[\u3040-\u30ff\u3400-\u9fff]/,

  TMP_SPRITE: /<sprite\b[^>]*>/gi,
  BR: /<br\s*\/?>/gi,
  TAGS: /<\/?[^>]+>/g,

  // ASCII-only + contains at least one Latin letter
  ASCII_AND_LATIN: /^(?=.*[A-Za-z])[\x00-\x7F]+$/,
  ALLCAPS_NUM: /^[A-Z0-9 _\[\]]+$/,

  PURE_NUMERIC_LIKE: /^[0-9\s+\-.,:%/×x＊*()［\[\]］]+$/,

  DIGITS: /[0-9]/g,

  // removes everything except [0-9A-Za-zJP]
  NON_SIGNAL: /[^0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]/g
};
/* =============================== */

const hasJP = s => RX.JP.test(s || '');

// Replace TMP sprites with placeholder box and strip TMP/HTML tags
const stripTmpTags = s => String(s || '')
  .replace(RX.TMP_SPRITE, ' ▢ ')
  .replace(RX.BR, '\n')
  .replace(RX.TAGS, '');

const norm = s => stripTmpTags(s).replace(/\r\n/g, '\n').trim();

// Keep only strings that contain at least one ascii letter/digit or JP script char
const useful = t => !!t && t.replace(RX.NON_SIGNAL, '').length > 0;

const shortEN = t =>
  t &&
  t.length <= SHORT_EN_MAXLEN &&
  RX.ASCII_AND_LATIN.test(t) &&
  !RX.ALLCAPS_NUM.test(t);

// === Numeric spam suppression ===
const isPureNumericLike = t => RX.PURE_NUMERIC_LIKE.test(t);

function isMostlyNumeric(t) {
  const sig = t.replace(RX.NON_SIGNAL, '').length;
  if (!sig) return true;

  const digs = (t.match(RX.DIGITS) || []).length;
  return (digs / sig) >= NUMERIC_RATIO_THRESHOLD;
}

function shouldDropNumericSpam(t) {
  if (!SUPPRESS_NUMERIC_SPAM) return false;
  if (!t) return true;
  return DROP_ONLY_PURE_NUMERIC ? isPureNumericLike(t) : isMostlyNumeric(t);
}
// ========================================

// === Safe Mono reads ===
function safeToString(x) {
  try {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (x?.isNull?.() || x?.handle?.isNull?.()) return '';
    return x?.toString ? x.toString() : String(x);
  } catch {
    return '';
  }
}

function safeReadMonoString(x) {
  try {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (x?.isNull?.() || x?.handle?.isNull?.()) return '';
    return x?.readMonoString ? x.readMonoString() : safeToString(x);
  } catch {
    return '';
  }
}
// ========================

const slots = new Map();
let recentJPTime = 0;

const newSlot = () => ({
  text: '',
  lastEmitted: '',
  timer: null,
  messageId: ''
});

function scheduleEmit(key) {
  const slot = slots.get(key);
  if (!slot) return;

  if (slot.timer) clearTimeout(slot.timer);

  slot.timer = setTimeout(() => {
    slot.timer = null;

    const t = slot.text;
    if (!t || !useful(t)) return;
    if (shouldDropNumericSpam(t)) return;

    if (SUPPRESS_SHORT_EN_NEAR_JP && !hasJP(t) && shortEN(t)) {
      if ((Date.now() - recentJPTime) < SHORT_EN_WINDOW_MS) return;
    }

    if (t === slot.lastEmitted) return;
    slot.lastEmitted = t;

    if (PRINT_ID && slot.messageId) outLine(slot.messageId);
    outLine(t);
  }, STABLE_MS);
}

// ==== Hooks ====
function main() {
  const cls = 'Game.GameText';

  Mono.setHook(null, cls, 'set_MessageId', 1, args => {
    const key = safeToString(args[0]);
    if (!key) return;

    const id = norm(safeReadMonoString(args[1]));
    if (!id) return;

    const slot = slots.get(key) || newSlot();
    slot.messageId = id;
    slots.set(key, slot);
  });

  Mono.setHook(null, cls, 'set_text', 1, args => {
    const key = safeToString(args[0]);
    if (!key) return;

    const t = norm(safeReadMonoString(args[1]));
    if (!t || !useful(t)) return;

    const slot = slots.get(key) || newSlot();
    slot.text = t;
    slots.set(key, slot);

    if (hasJP(t)) recentJPTime = Date.now();
    scheduleEmit(key);
  });
}

setImmediate(main);
