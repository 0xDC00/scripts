// ==UserScript==
// @name         Albatross Koukairoku (信天翁航海録)
// @version      0.1
// @author       Mansive
// @description
// * raiL-soft
// * Business Partner
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send((s) => s, -100);

const DEBUG_LOGS = false;

let previous = "";

// A monad is just a monoid in the category of endofunctors
class Identity {
  constructor(value) {
    this._value = value;
  }

  map(transformer) {
    const value = transformer(this._value);
    DEBUG_LOGS && console.warn(JSON.stringify(value));
    return new Identity(value);
  }

  value() {
    return this._value;
  }
}

attach("DialogueHook", "0f 85 ?? ?? ?? ?? 8b c6 5f 5e c6 03", "ebp");

console.log("\nMight be missing some brackets\n");

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
    let text = this.context[register].readShiftJisString();

    handler(text);
  });
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  DEBUG_LOGS && console.warn(JSON.stringify(s));

  const cleanedText = new Identity(s)
    .map((text) => text.replace(/\^?d[\d]+?/g, ""))
    .map((text) => text.replace(/\^n\s*/g, "\n"))
    .map((text) => text.replace(/\||\[.+?\]/g, ""))
    .map((text) => text.trim())
    .value();

  return cleanedText;
});
