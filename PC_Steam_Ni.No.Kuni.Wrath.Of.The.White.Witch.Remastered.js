// ==UserScript==
// @name         Ni no Kuni Wrath of the White Witch™ Remastered
// @version      0.3
// @author       aqui, robbert-vdh
// @description  Steam
// * Level-5
//
// https://store.steampowered.com/app/798460/Ni_no_Kuni_Wrath_of_the_White_Witch_Remastered/
// ==/UserScript==
const __e = Process.enumerateModules()[0];
const handlerLine = trans.send((s) => s, "250+");

const hooks = [
  {
    // Dialogue and descriptions
    name: "Dialogue",
    signature: "0F?? ?? ?? ???????? 49 ?? ?? 46 ?? ?? ?? 75 ?? 48 ?? ?? ?? E8", // E8 2EBDF2FF
    argIndex: 1,
    address: null,
  },
  {
    // Item and character names
    name: "Names",
    signature: "48 ?? ?? 74 1D C6 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? CB E8", // E8 371FADFF
    argIndex: 1,
    address: null,
  },
  {
    // Popup messages
    name: "Popups",
    signature: "8B 8E ???????? E8 ???????? 48 ?? ?? E8", // E8 0044B4FF
    argIndex: 0,
    address: null,
  },
];

(function () {
  for (const hook of hooks) {
    const results = Memory.scanSync(__e.base, __e.size, hook.signature);
    if (results.length === 0) {
      console.error(`Could not find the signature for '${hook.name}'`);
      return;
    } else if (results.length > 1) {
      console.error(`Multiple signatures for '${hook.name}' found (${results.length} results)`);
      return;
    } else {
      // `results[0].address` points to the start of the signature, and we want
      // the address of the `call` (0xE8) instruction, so we need to count the
      // number of bytes up until that point
      if (!hook.signature.match(/^([0-9A-F?]{2} *)+E8$/)) {
        console.error(`The signature for '${hook.name}' does not match the expected format, this is an issue with the script`);
        return;
      }

      const prefixHexBytes = hook.signature
        .slice(0, hook.signature.length - 2)
        .replaceAll(" ", "");
      const address = results[0].address.add(prefixHexBytes.length / 2);

      console.log(`[${hook.name}]: ${address}`);
      hook.address = address;
    }
  }

  for (const hook of hooks) {
    const lastTwentyStrings = [];
    Interceptor.attach(hook.address, {
      onEnter(args) {
        const newString = args[hook.argIndex]
          .readCString()
          .replace(/<[^>]*>/g, "")
          .replace(/\[(.*?)\/(.*?)\]/g, "$1")
          .replace(/\\n/g, "\n");

        if (!lastTwentyStrings.includes(newString)) {
          handlerLine(newString);
          lastTwentyStrings.push(newString);
          if (lastTwentyStrings.size > 20) {
            lastTwentyStrings.shift();
          }
        }
      },
    });
  }
})();
