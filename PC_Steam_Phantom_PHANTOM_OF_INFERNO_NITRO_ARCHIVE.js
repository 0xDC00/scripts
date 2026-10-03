// ==UserScript==
// @name         Phantom PHANTOM OF INFERNO NITRO ARCHIVE
// @version      1.0.0
// @author       Mansive
// @description  Steam
// * NITRO PLUS, NITRO ORIGIN
//
// https://store.steampowered.com/app/3639590/Phantom_PHANTOM_OF_INFERNO_NITRO_ARCHIVE/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send((s) => s, "200+");

const colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m",

    MutedBgGray: "\x1b[48;2;115;115;115m",
    MutedBgRed: "\x1b[48;2;145;95;90m",
    MutedBgGreen: "\x1b[48;2;95;125;95m",
    MutedBgYellow: "\x1b[48;2;125;115;80m",
    MutedBgBlue: "\x1b[48;2;90;110;145m",
    MutedBgPurple: "\x1b[48;2;125;95;135m",
    MutedBgTeal: "\x1b[48;2;85;120;125m",
};
const colorKeys = Object.keys(colors);
let count = 0;
const nextColor = () => {
    count++;
    return colors[colorKeys[(count % 6) + 26]];
};

attach("Dialogue", "FF D3 4C 8D 35 ?? ?? ?? ?? 4C 89 74 24 40 0F 10 48 08", "rdx");

function attach(name, pattern, register) {
    const results = Memory.scanSync(__e.base, __e.size, pattern);
    if (results.length === 0) {
        console.error(`[${name}] Hook not found!`);
        return;
    }
    const address = results[0].address;
    console.log(`${colors.FgGreen}[${name}] @ ${address}${colors.Reset}`);
    if (results.length > 1) {
        console.warn(`${name} has ${results.length} results`);
    }

    Interceptor.attach(address, function (args) {
        const color = nextColor();
        console.log(`${colors.Bright}${color}onEnter: ${name}`);

        const text = this.context[register].readUtf8String();
        console.log(`${JSON.stringify(text)}`);

        // 0x1f -> center text from intro?
        // 0x28 -> skip message?
        // 0x16, 0x19, 0x20, 0x30, 0x37, 0x39... -> dialogue box
        // 0x30 -> clean dialogue
        // 0x2c -> choice?
        /**@type {NativePointer} */
        const mysteriousValue = this.context.r12;
        console.log(`${mysteriousValue}${colors.Reset}`);

        if (mysteriousValue.equals(0x30) || mysteriousValue.equals(0x2c)) {
            console.log(`${color}${colors.Bright}${colors.FgGreen}Passed checks${colors.Reset}`);
            handler(text);
        }
    });
}

let previous = "";
trans.replace((text) => {
    console.warn(JSON.stringify(text));
    if (text === previous) {
        return null;
    }
    previous = text;
    return text.trim();
});
