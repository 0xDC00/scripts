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

// Toggle numeric output: suppress number-heavy / numeric-only spam (battle damage, stats, etc.)
const SUPPRESS_NUMERIC_SPAM = true;

// Strictness: true = drop only numeric-like strings; false = drop mostly-numeric strings too
const DROP_ONLY_PURE_NUMERIC = true;
const NUMERIC_RATIO_THRESHOLD = 0.70; // used only when DROP_ONLY_PURE_NUMERIC === false

const outLine = s => trans.send(String(s));
const hasJP = s => /[\u3040-\u30ff\u3400-\u9fff]/.test(s || '');

// Replace TMP sprites with placeholder box and strip other tags
const stripTmpTags = s => String(s || '')
  .replace(/<sprite\b[^>]*>/gi, ' ▢ ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/?[^>]+>/g, '');

const norm = s => stripTmpTags(s).replace(/\r\n/g, '\n').trim();

// Keep only strings that contain at least one ascii letter/digit or JP script char
const useful = t => /[0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]/.test(t || '');

const shortEN = t =>
  t && t.length <= SHORT_EN_MAXLEN &&
  /^[\x00-\x7F]+$/.test(t) &&
  /[A-Za-z]/.test(t) &&
  !/^[A-Z0-9 _\[\]]+$/.test(t);

// === Numeric spam suppression helpers ===
function isPureNumericLike(t) {
  // Digits + common numeric punctuation/symbols/spaces only
  return /^[0-9\s+\-.,:%/×x＊*()［\[\]］]+$/.test(t);
}
function isMostlyNumeric(t) {
  const sig = (t.match(/[0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  if (!sig) return true;
  const digs = (t.match(/[0-9]/g) || []).length;
  return (digs / sig) >= NUMERIC_RATIO_THRESHOLD;
}
function shouldDropNumericSpam(t) {
  if (!SUPPRESS_NUMERIC_SPAM) return false;
  if (!t) return true;
  return DROP_ONLY_PURE_NUMERIC ? isPureNumericLike(t) : isMostlyNumeric(t);
}
// =========================================

// === Safe Mono reads ===
function safeToString(x) {
  try {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (x.isNull && x.isNull()) return '';
    if (x.handle && x.handle.isNull && x.handle.isNull()) return '';
    return x.toString ? x.toString() : String(x);
  } catch (_e) {
    return '';
  }
}

function safeReadMonoString(x) {
  try {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (x.isNull && x.isNull()) return '';
    if (x.handle && x.handle.isNull && x.handle.isNull()) return '';
    if (x.readMonoString) return x.readMonoString();
    return safeToString(x);
  } catch (_e) {
    return '';
  }
}
// ========================

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

    // suppress numeric spam (battle/status)
    if (shouldDropNumericSpam(t)) return;

    // suppress short EN fragments right after JP lines
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

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.messageId = id;
    slots.set(key, slot);
  });

  Mono.setHook(null, cls, 'set_text', 1, args => {
    const key = safeToString(args[0]);
    if (!key) return;

    const t = norm(safeReadMonoString(args[1])); // <- fixed: safe read
    if (!t || !useful(t)) return;

    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '' };
    slot.text = t;
    slots.set(key, slot);

    if (hasJP(t)) recentJPTime = Date.now();
    scheduleEmit(key);
  });
}

setImmediate(main);
