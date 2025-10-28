// ==UserScript==
// @name         Ni no Kuni Wrath of the White Witch™ Remastered
// @version      0.4
// @author       aqui, robbert-vdh
// @description  Steam
// * Level-5
//
// https://store.steampowered.com/app/798460/Ni_no_Kuni_Wrath_of_the_White_Witch_Remastered/
// ==/UserScript==

// The time span in milliseconds during which:
// - Text events are merged into a single message (for agent)
// - Text is deduplicated (text will not be emitted over the websocket if it has
//   been less than this many milliseconds since the text was last seen)
const debounceMs = 250;

// Strings that should not be sent to agent. The pause menu text otherwise shows
// up every time you alt-tab away from the game, which is a bit much.
const ignoredText = [
  "つづける",
  "タイトルにもどる",
  "スキップ"
];

const hooks = [
  {
    // This covers pretty much all text shown in screen. If you want just the
    // dialogue text and item descriptions, then you can comment this hook out
    // and uncomment the other hooks instead.
    name: "Text",
    signature: "EB ?? ?? ?? ?? ?? ?? ?? ?? 42 ?? ?? ?? 75 ?? 48 ?? ?? ?? ?? ?? ?? E8", // E8 C8DEF2FF
    argIndex: 1,
    address: null,
  },
  // {
  //   // Dialogue and descriptions
  //   name: "Dialogue",
  //   signature: "0F?? ?? ?? ???????? 49 ?? ?? 46 ?? ?? ?? 75 ?? 48 ?? ?? ?? E8", // E8 2EBDF2FF
  //   argIndex: 1,
  //   address: null,
  // },
  // {
  //   // Item and character names
  //   name: "Names",
  //   signature: "48 ?? ?? 74 1D C6 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? CB E8", // E8 371FADFF
  //   argIndex: 1,
  //   address: null,
  // },
  // {
  //   // Popup messages
  //   name: "Popups",
  //   signature: "8B 8E ???????? E8 ???????? 48 ?? ?? E8", // E8 0044B4FF
  //   argIndex: 0,
  //   address: null,
  // },
];

const __e = Process.enumerateModules()[0];
const handlerLine = trans.send((s) => s, `${debounceMs}+`);

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
    // This stores the timestamp a string was last seen. Needed because the
    // hooked function is called with the same text for every frame. This
    // approach is much less aggressive than simply keeping track of a list of
    // recently seen strings, which also filters out repeat visits of the same
    // menu page.
    const lastSeenTimestamps = new Map();
    // Needed to work around `Date.now()` not being monotonic, see below
    let lastTimestamp = Date.now();

    Interceptor.attach(hook.address, {
      onEnter(args) {
        const string = args[hook.argIndex].readCString();

        // The help text hook also gets triggered when drawing some icons or
        // when displaying things like last saved times. Most ASCII-only strings
        // aren't particularly useful anyways, so we'll just filter them all
        // out.
        if (string.match(/^[\x00-\x7F]+$/)) {
          return;
        }

        // We also need to get rid of:
        const cleaned = string
          // The HTML-like markup (e.g. `<color:#5>ＭＰ</color>`)
          .replace(/<[^>]*>/g, "")
          // Icons and other graphics (e.g. `[menu][btn_sta]セーブ`)
          .replace(/\[[\x00-\x5A\x5C-\x7F]+\]/g, "")
          // Furigana (e.g. `[商会/しょうかい] => 商会`)
          .replace(/\[([^/\]]+)\/[^/\]]+\]/g, "$1")
          // And literal line feeds
          .replace(/\\n/g, "\n")
          .trim();

        // Some of these hooks are called every frame with the same value(s), so
        // duplicate values need to be filtered out
        if (cleaned === "" || ignoredText.includes(cleaned)) {
          return;
        }

        // NOTE: `Date.now()` is not a good way to measure time here because
        //       it's not monotonic, but the `performance` API doesn't seem to
        //       exist in QuickJS and `os.now()` does not seem to be available
        //       either. This check at least prevents the script from breaking
        //       if time suddenly goes backwards.
        const now = Date.now();
        if (lastTimestamp > now) {
          lastSeenTimestamps.clear();
        }
        lastTimestamp = now;

        const lastSeen = lastSeenTimestamps.get(cleaned);
        lastSeenTimestamps.set(cleaned, now);

        const hideRepeatsSince = now - debounceMs;
        if (lastSeen !== undefined && lastSeen >= hideRepeatsSince) {
          return;
        }

        handlerLine(cleaned);

        // This map needs to be occasionally pruned so we don't store a whole
        // game's worth of strings
        if (lastSeenTimestamps.size > 50) {
          for (const [key, lastSeen] of lastSeenTimestamps) {
            if (lastSeen < hideRepeatsSince) {
              lastSeenTimestamps.delete(key);
            }
          }
        }
      },
    });
  }
})();
