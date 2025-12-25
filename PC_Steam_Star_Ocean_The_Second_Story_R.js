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

// ---------- output ----------
function outLine(s) {
  try {
    if (typeof trans !== 'undefined' && trans && typeof trans.send === 'function') {
      trans.send(String(s));
      return;
    }
  } catch (_) {}
  try { console.log(String(s)); } catch (_) {}
}

// ---------- options ----------
const SPRITE_MODE = 'token';          // 'token' or 'drop'
const STABLE_MS = 650;               // debounce window (increase if needed)
const MAX_CACHE = 500;
const PRINT_ID = false;

// Keep menus but suppress 'short' English fragments when JP is actively streaming
const SUPPRESS_SHORT_EN_NEAR_JP = true;
const SHORT_EN_MAXLEN = 22;
const SHORT_EN_WINDOW_MS = 2000;

// ---------- helpers ----------
function hasJapanese(s) { return /[\u3040-\u30ff\u3400-\u9fff]/.test(s || ''); }

function stripTmpTags(s) {
  if (!s) return '';
  s = String(s);

  // TMP sprites
  if (SPRITE_MODE === 'drop') {
    s = s.replace(/<sprite\b[^>]*>/gi, '');
  } else {
    s = s.replace(/<sprite\b[^>]*name\s*=\s*("([^"]+)"|([^\s>]+))[^>]*>/gi, (m, _q, qname, uname) => {
      const name = qname || uname || 'sprite';
      return `[${name}]`;
    });
    s = s.replace(/<sprite\b[^>]*>/gi, '[sprite]');
  }

  // style wrapper
  s = s.replace(/<\/?style(?:=[^>]+)?>/gi, '');

  // TMP tags
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

  // remove remaining tags
  s = s.replace(/<[^>]+>/g, '');
  return s;
}

function normalizeText(s) {
  s = stripTmpTags(s);
  s = String(s || '').replace(/\r\n/g, '\n');
  // keep newlines (multi-line dialogue), but normalize spaces around them
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.trim();
  // strip wrapping quotes if the whole string is wrapped
  s = s.replace(/^["「『]+/, '').replace(/["」』]+$/, '').trim();
  return s;
}

function isUseless(t) {
  if (!t) return true;
  const onlyText = t.replace(/[「」『』（）\(\)\[\]{}"“”'’。、・？！…\s\-—–_:;,.]/g, '');
  return onlyText.length === 0;
}

function isShortEnglishFragment(t) {
  // Clean-up of short english fragments
  if (t.length > SHORT_EN_MAXLEN) return false;
  if (!/^[\x00-\x7F]+$/.test(t)) return false;          // ASCII only
  if (/^[A-Z0-9 _\[\]]+$/.test(t)) return false;       // allow menu-like ALLCAPS and tokens
  if (!/[A-Za-z]/.test(t)) return false;
  return true;
}

// ---------- per-object stabilization ----------
const slots = new Map(); // key -> { text, lastEmitted, timer, messageId, lastSeen }
let recentJPTime = 0;

function trimSlotsIfNeeded() {
  if (slots.size <= MAX_CACHE) return;
  let oldestKey = null;
  let oldestT = Infinity;
  for (const [k, v] of slots.entries()) {
    if (v.lastSeen < oldestT) { oldestT = v.lastSeen; oldestKey = k; }
  }
  if (oldestKey) slots.delete(oldestKey);
}

function getKeyFromThis(args) {
  try { return args[0].toString(); } catch (_) { return 'unknown'; }
}

function scheduleEmit(key) {
  const slot = slots.get(key);
  if (!slot) return;

  if (slot.timer) clearTimeout(slot.timer);

  slot.timer = setTimeout(() => {
    slot.timer = null;

    const t = slot.text;
    if (!t || isUseless(t)) return;

    // suppress short EN fragments if JP has been active recently
    if (SUPPRESS_SHORT_EN_NEAR_JP) {
      if (!hasJapanese(t) && isShortEnglishFragment(t)) {
        if ((Date.now() - recentJPTime) < SHORT_EN_WINDOW_MS) return;
      }
    }

    if (t === slot.lastEmitted) return;
    slot.lastEmitted = t;

    if (PRINT_ID && slot.messageId) outLine(`[Id] : ${slot.messageId}`);
    outLine(t);
  }, STABLE_MS);
}

// ---------- hook helper ----------
const IMAGE_TRIES = [null, true, '', 'Assembly-CSharp'];

function trySetHook(className, methodName, argCount, cb) {
  for (const img of IMAGE_TRIES) {
    try {
      Mono.setHook(img, className, methodName, argCount, cb);
      outLine(`[Hook] ${String(img)} :: ${className}.${methodName}/${argCount}`);
      return true;
    } catch (_) {}
  }
  outLine(`[HookFail] ${className}.${methodName}/${argCount}`);
  return false;
}

// ---------- main ----------
function main() {
  const CLS = 'Game.GameText';

  trySetHook(CLS, 'set_MessageId', 1, function (args) {
    const key = getKeyFromThis(args);
    const id = normalizeText(args[1].readMonoString());
    if (!id) return;

    trimSlotsIfNeeded();
    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '', lastSeen: 0 };
    slot.messageId = id;
    slot.lastSeen = Date.now();
    slots.set(key, slot);
  });

  trySetHook(CLS, 'set_text', 1, function (args) {
    const key = getKeyFromThis(args);
    const raw = args[1].readMonoString();
    const t = normalizeText(raw);
    if (!t || isUseless(t)) return;

    trimSlotsIfNeeded();
    const slot = slots.get(key) || { text: '', lastEmitted: '', timer: null, messageId: '', lastSeen: 0 };

    // Update latest text and debounce emit
    slot.text = t;
    slot.lastSeen = Date.now();
    slots.set(key, slot);

    if (hasJapanese(t)) recentJPTime = Date.now();

    // Schedule emit to prevent prefix spamming
    scheduleEmit(key);
  });

  outLine('[Status] Game.GameText set_text stabilized (debounced emit).');
}

setImmediate(main);