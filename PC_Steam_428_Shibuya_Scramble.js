// ==UserScript==
// @name         428: Shibuya Scramble (428 〜封鎖された渋谷で〜)
// @version      1.0.0
// @author       Mansive, AuroraWright
// @description  Steam
// * Spike Chunsoft Co., Ltd.
// * Abstraction Games
//
// https://store.steampowered.com/app/648590/428_Shibuya_Scramble/
// ==/UserScript==

const __e = Process.enumerateModules()[0];

console.warn("For the Japanese version of the game, not the English one.");
console.warn("Known issue: Guide hook prints all the text at once");

const handler1 = trans.send((s) => s, "600++");
const handler2 = trans.send((s) => s, "800+"); // appear after

const decoder = new TextDecoder("utf-8");

// attach("Dialogue1", "8A 0F 83 E8 00 74 2B 83 E8 02 BB 02 00 00 00 80", "edi", handler);
attach("Dialogue2", "0F B6 08 8D 50 01 8B C1 89 57 14 83 E8 00 74 ED", "eax", handler1, perChar);
attach("Guide", "8B CA 8D 79 01 8A 01 41 84 C0 75 F9 2B CF 8D 44 24", "edx", handler2, once);

function getPatternAddress(name, pattern) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    throw new Error(`[${name}] Hook not found!`);
  }

  let address = results[0].address;
  console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`${name} has ${results.length} results`);
  }

  return address;
}

function once(address, name, register, handler) {
  Interceptor.attach(address, {
    onEnter() {
      const text = this.context[register].readUtf8String();
      handler(text);
    },
  });
}

function perChar(address, name, register, handler) {
  let previousAddress = NULL;
  let skipNewLine = false;
  Interceptor.attach(address, function (args) {
    // console.log("onEnter:", name);
    // 02 1b 00 1E 00 01 | new line?
    // 02 1B 00 1E 00 2D | text remaining cursor on new line
    // 02 1B 00 1E 00 01 | text remaining cursor on new line
    // 02 1b 00 01 | new line? text remaining?
    // 02 1f 00 | end of line
    // 02 1b 00 | text remaining...
    // 02 1e 00 01 | text remaining, inline
    // 02 2D 04 | midline pause
    // 02 06 00 10 | new line?
    // 0x2 0x74 0x19 0x0 | separator in bad end screens after "No. XX"
    // 0x2 0x18 0x0 0x1b | newline in hint screens after "ヒント"

    // choice sequences (the engine seems to add a newline *if not already present in the previous sentence*):
    // e3 80 80 02
    // 02 0e 01 00
    // e3 80 80 02
    // 02 2d 04 00

    // dots
    // E3 80 8C 02 43 02 01 00 43 02 01 00 0F 01 08 01 E7 AC B9
    // E3 81 A8 02 43 02 01 00 43 02 01 00 0F 01 08 2D 04 00 00 00 1E 01 EF BC 91
    //          02 43 02 01 00 43 02 01 00 0F 01 08 1F 00 25 00

    /** @type {NativePointer} */
    const address = this.context[register];
    if (address.equals(previousAddress)) {
      return;
    }
    previousAddress = address;

    const byte1 = address.readU8();
    const byte2 = address.add(1).readU8();
    const byte3 = address.add(2).readU8();
    const byte4 = address.add(3).readU8();

    if (byte1 === 0x02 && (byte2 === 0x06 || byte2 === 0x1b || byte2 === 0x25 || byte2 === 0x18)) {
      handler("\n");
      skipNewLine = true;
      return;
    } else if (byte1 === 0x02 && byte2 === 0x43 /* byte3 === 0x02 */) {
      handler("……");
      skipNewLine = false;
      return;
    } else if (byte1 === 0x02 && byte2 === 0x2b && byte3 === 0x01) {
      handler("——");
      skipNewLine = false;
      return;
    } else if (byte1 === 0x02 && byte2 === 0x74) {
      handler(" ");
      skipNewLine = false;
      return;
    } else if (byte1 === 0x02 && byte2 === 0xe && byte3 === 0x01) {
      if (skipNewLine) {
        handler("(?) ");
      } else {
        handler("\n(?) ");
      }
      skipNewLine = false;
      return;
    } else if (byte1 === 0xe3 && byte2 === 0x80 && byte3 === 0x80 && byte4 === 0x02) {
      return;
    } else if (byte1 === 0xe4 && byte2 === 0xbb && byte3 === 0x9d) {
      // "E4 BB 9D" is "仝" but gets rendered as full-width whitespace ingame
      handler("　");
      skipNewLine = false;
      return;
    } else if (byte1 === 0x2) { // other engine control characters we don't care about
      skipNewLine = false;
      //console.warn(ptr(byte1), ptr(byte2), ptr(byte3), ptr(byte4));
      return;
    }

    const char = decoder.decode(Uint8Array.from([byte1, byte2, byte3, byte4]))[0];
    skipNewLine = false;
    //console.warn(ptr(byte1), ptr(byte2), ptr(byte3), ptr(byte4), char);

    handler(char);
  });
}

function attach(name, pattern, register, handler, strategy) {
  const address = getPatternAddress(name, pattern);
  strategy(address, name, register, handler);
}

trans.replace((s) => {
  return s.trim();
});
