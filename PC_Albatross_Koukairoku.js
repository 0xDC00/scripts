// ==UserScript==
// @name         Albatross Koukairoku (信天翁航海録)
// @version      0.1
// @author       Mansive
// @description
// * raiL-soft
// * Business Partner
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send((s) => s, "200+");

const DEBUG_LOGS = false;

let previous = "";

/**
 * A monad is just a monoid in the category of endofunctors.
 * @template T The type of the value held by the Identity instance.
 */
class Identity {
  /** @type {T} */
  _value;

  /** @param {T} value The initial value to wrap. */
  constructor(value) {
    this._value = value;
  }

  /**
   * @template U The type of the value returned by the transformer.
   * @param {(value: T) => U} transformer
   * @returns {Identity<U>}
   */
  map(transformer) {
    const value = transformer(this._value);
    DEBUG_LOGS && console.warn(JSON.stringify(value));
    return new Identity(value);
  }

  /**
   * @param {(value: T) => void} callback
   * @returns {this}
   */
  tap(callback) {
    callback(this._value);
    return this;
  }

  value() {
    return this._value;
  }
}

// idk how i found this hook
// edi -> line number
attach("DialogueHook", "e8 ?? ?? ?? ?? 8b b4", "eax");

function attach(name, pattern, register) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    console.error(`[${name}] Hook not found!`);
    return null;
  } else if (results.length > 1) {
    console.warn(`[${name}] has ${results.length} results`);
    return null;
  }

  const address = results[0].address;
  console.log(`[${name}] @ ${address}`);

  Interceptor.attach(address, function (args) {
    /** @type {NativePointer} */
    const clue = this.context.ebp;
    if (!clue.isNull()) {
      DEBUG_LOGS && console.warn("Scrolling detected, skipping text...");
      return null;
    }

    /** @type {string} */
    const text = this.context[register].readShiftJisString();

    handler(text);
  });
}

trans.replace((/**@type {string}*/ s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  DEBUG_LOGS && console.warn(JSON.stringify(s));

  const cleanedText = new Identity(s)
    .map((text) => text.replace(/\^?d[\d]+?/g, ""))
    .map((text) => text.replace(/\^n\s*/g, "\n"))
    .tap((text) => text.match(/\[.+?\]/g)?.forEach((thing) => console.log("ruby:", thing)))
    .map((text) => text.replace(/\||\[.+?\]/g, ""))
    .map((text) => text.trim())
    .value();

  return cleanedText;
});
