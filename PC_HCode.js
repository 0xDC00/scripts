// ==UserScript==
// @name         HCODE loader
// @version      GNU GPL v3
// @author       
// @description  Inject or Use as a library.
//  Example:
//
//    const { setHook } = require('./PC_HCode.js');
//
//    setHook(/* hcode */ '/HS8@6E300:PJADVJP.bin', /* options */ {
//        // thread filter (hcode without N char <=> context used)
//        blacklist: false, // bool (blacklist|whitelist(default))
//        threads: {
//            ':$0x15618': true, // name
//            ':$0x15667': true, // dialouge
//            //':$0x6dcad': true // ruby
//        },
//
//        // Linker (default: 500ms, separator = empty)
//        // ex:
//        //    - 200+   => 200ms, separator = \n
//        //    - 200++  => 200ms, separator = empty
//        //    - 200+ + => 200ms, separator = space
//        join: '500+'
//    });
//
//    // setHook('/HS8@6E300:PJADVJP.bin');   // or hook without thread filter
//
//    // trans.replace((s) => { return s; }); // replacer
//
// 
//   // https://discord.com/channels/867944111557201980/888396325345964092/949329264656908348
//   // HCode format: https://code.google.com/archive/p/interactive-text-hooker/wikis/DevGuide.wiki
// ==/UserScript==

// TODO: cleanup
//require('./libSubtitle.js'); // write subtitle

const _mod0 = Process.enumerateModules()[0];
//const mainHandler = trans.send((s) => s, '100+');
const mainHandler = (function () {
    let timer = null;
    const separator = '\n';
    let arr = [];

    const delay = globalThis.HCODE_DELAY ?? 100;
    const isLine = separator === '\n';
    let preLine;
    return function (s) {
        clearTimeout(timer);
        if (s !== null) {
            if (isLine === true) {
                if (s !== preLine) {
                    preLine = s;
                    arr.push(s);
                }
            }
            else {
                arr.push(s);
            }
        }
        timer = setTimeout(function () {
            if (arr.length !== 0) {
                const finalStr = arr.join(separator);
                if (finalStr) trans._copy(finalStr);
                arr = [];
            }
            preLine = null
        }, delay);
    }
})();

// https://github.com/Artikash/Textractor/blob/master/include/const.h#L14
// HookParamType
const USING_STRING = 0x1; // type(data) is char* or wchar_t* and has length
const USING_UNICODE = 0x2; // type(data) is wchar_t or wchar_t*
const BIG_ENDIAN = 0x4; // type(data) is char
const DATA_INDIRECT = 0x8;
const USING_SPLIT = 0x10; // use ctx2 or not
const SPLIT_INDIRECT = 0x20;
const MODULE_OFFSET = 0x40; // address is relative to module
const FUNCTION_OFFSET = 0x80; // address is relative to function
const USING_UTF8 = 0x100;
const NO_CONTEXT = 0x200;
const HOOK_EMPTY = 0x400;
const FIXING_SPLIT = 0x800;
const DIRECT_READ = 0x1000; // /R read code instead of classic /H hook code
const FULL_STRING = 0x2000;
const HEX_DUMP = 0x4000;
const HOOK_ENGINE = 0x8000;
const HOOK_ADDITIONAL = 0x10000;
const KNOWN_UNSTABLE = 0x20000;
const CP_UTF8 = 65001;

if (module.parent === null) {
    setImmediate(() => {
        const hcode = prompt('Enter hook code (H-Code)\nEx: /HS-C*0@DEADC0DE');
        if (hcode) console.log('Result: ' + !!setHook(hcode));
        console.log('Script loaded!');
    });
}

/*
// Polifils nodejs debugging
const Process = {
    pointerSize: 4,
    findModuleByName() { return {}; }
}
const _mod0 = {
    base: {
        add() { return 0x22334455; }
    }
}
const ptr = () => {
    return {
        add() { return 0x22334455; }
    }
};
//setHook('/HW-4*14:-4*0@128648:', {});
//setHook('/HWN-10*-2@12c3a7:', {});
// USING_STRING (readPointer) only for stack?
// TODO: hp.offset >= 0
setHook('/HS-1C@005486:'); // test getAddress => esi
//setHook('/HS0@005484:'); // test getAddress => [esp]
//*/


// /**
//  * This callback is displayed as a global member.
//  * @callback filterCallback
//  * @param {string} s - result string
//  * @return {string}
//  */

/**
 * hcode advance config
 * @typedef {Object} hcodeOptions
 * @property {boolean} reorder - default: false, reoder thread (index priority)
 * @property {boolean} blacklist - default: false (whitelist)
 * @property {Object.<string, boolean>} threads - Thread filter <threadId, whiteList>
 * @property {Object.<string, function(this:string[],string,Object.<string,string[]>,Object.<string,string[]>):string>} filters - Final string from a thread <threadId, callback> this=threadDatas
 * @property {string} join - Thread Linker (default: 500ms, separator = empty)
 * @property {function(this:InvocationContext):string} split - Thread spliter
 * @property {function(this:InvocationContext):NativePointer} getTextAddress - custom text address
 * @property {function(this:InvocationContext,NativePointer):string} readString - custom string reader
 * 
 */

/**
 * 
 * @param {string} hcode 
 * @param {hcodeOptions} options - {@link hcodeOptions} objects
 * @returns {Object}
 */
function setHook(hcode, options) {
    console.log('HCODE: ' + hcode);
    try {
        const hp = parse(hcode);
        if (Object.keys(hp).length === 0) {
            console.error('HCODE_ERROR: ' + hcode);
            return false;
        }

        return insertHookCmd(hp, options ?? {});
    }
    catch (e) {
        console.error(e.stack ?? e);
        return false;
    }
}

const threads = {};
// https://github.com/Artikash/Textractor/blob/e83579ed7cee61d39b94a9c550a8bbd6554b4774/texthook/texthook.cc#L102
// https://github.com/Artikash/Textractor/blob/e83579ed7cee61d39b94a9c550a8bbd6554b4774/texthook/texthook.cc#L209
function insertHookCmd(hp, options) {
    hp.options = options; // exten hook params

    let address = ptr(hp.address);
    if (hp.type & USING_UTF8) hp.codepage = CP_UTF8;
    if (hp.type & MODULE_OFFSET) {
        let mod = hp.module === '' ? _mod0 : Process.findModuleByName(hp.module);
        if (mod === null) {
            mod = _mod0;
            console.warn('MODULE_MISSING: ' + hp.module);
            console.warn('Fallback to ' + mod.name);
        }

        if (hp.type & FUNCTION_OFFSET) {
            const fn = mod.findExportByName(hp.function);
            if (fn !== null) {
                address = address.add(fn);
            }
            else {
                console.error('FUNC_MISSING');
                return false;
            }
        }
        else {
            address = address.add(mod.base);
        }
    }
    const _address = address.toString(16);
    const useContext = !(hp.type & NO_CONTEXT);
    console.log('  Context:     ' + useContext);
    console.log('  HookAddress: 0x' + _address);

    const getTextAddress = options.getTextAddress ?? genGetTextAddress(hp);
    const readString = options.readString ?? genReadString(hp);
    const processString = genProcessString(options, readString, useContext);
    const fnSplit = options.split;
    const split = fnSplit === undefined ? () => '' : function () { return ':' + fnSplit.call(this) };

    return Breakpoint.add(address, function () {
        //const splitThread = fnSplit !== undefined ? (':' + fnSplit.call(this)) : '';
        const splitThread = split.call(this);

        this.returnAddress = this.context.sp.readPointer();
        const thread = this.returnAddress + splitThread;
        let threadContext = threads[thread];
        if (threadContext === undefined) {
            // try rva instead (aslr)
            const caller = Process.findModuleByAddress(this.returnAddress);
            if (caller !== null) {
                const name = caller.path === _mod0.path ? '' : caller.name;
                threadContext = name + ':$' + this.returnAddress.sub(caller.base);
            }
            else {
                // TODO: trace... first return?
                threadContext = this.returnAddress.toString(16);
            }

            threadContext += splitThread;
            threads[thread] = threadContext;
        }

        const msg = `[onEnter] Thread: ${this.threadId.toString(16)}:${_address}:${thread}  ${threadContext}`;
        processString.call(this, getTextAddress.call(this), useContext === true ? threadContext : '0' + splitThread, msg);
    });
}

/**
 * 
 * @param {hcodeOptions} options 
 * @param {function} readString 
 * @param {string} context 
 * @returns {function}
 */
function genProcessString(options, readString, context) {
    options = options ?? {};

    const oldthreads = options.threads ?? {};
    const threadKeys = Object.keys(oldthreads);
    const threads = options.blacklist === null ? {} : oldthreads;

    const flag = (Object.keys(threads).length !== 0
        && options.blacklist !== true)
        ? true /* whitelist */ : undefined /* blacklist */;

    const { time, separator } = (() => {
        let t = 500;
        let s = '';
        const j = options.join;
        if (j) {
            t = parseInt(j);
            const m = j.match(/(^\d+\+)(.*)(\+$)/s);
            s = m !== null ? m[2] : '\n'; // switch to \n
        }

        return { time: t, separator: s };
    })();
    const isLine = separator === '\n';  // remove duplicate line

    const filters = options.filters ?? {};
    const threadSeparator = options.threadSeparator ?? '\n';
    const isReOrder = options.reorder === true;

    console.log('  Blacklist:   ' + (flag === undefined));
    console.log('  Separator:   ' + JSON.stringify(separator));

    // let attachAt = Date.now(), beginAt = 0, endAt = 0;
    let timer;
    let pre = null, count = 1;

    if (context) {
        let result = {};
        let skipped = {};

        return function (address, thread, msg) {
            if (pre === msg) {
                console.log('\x1b[A' + msg + ' x' + ++count);
            }
            else {
                console.log(msg);
                pre = msg; count = 1;
            }

            // if (beginAt === 0) beginAt = Date.now() - attachAt;
            // clearTimeout(timer);
            // mainHandler(null); // dirty fix: hcode linker

            const target = (threads[thread] === flag || module.parent === null) ? result : skipped;
            let array = target[thread];
            if (array === undefined) {
                array = [];
                target[thread] = array;
            }

            try {
                const s = readString.call(this, address);
                array.push(s);
            }
            catch (e) {
                console.error(e);
                pre = null;
            }

            timer = setTimeout(() => {
                // print list (debug ? skipped)
                let finalStr;
                if (isLine === true) {
                    console.log('\x1b[2;37m' + JSON.stringify(module.parent === null ? result : skipped, null, 2) + '\x1B[0m');

                    // TODO: test line reorder
                    if (isReOrder === true) {
                        const keys = Object.keys(result);
                        const entries = keys.sort(function (a, b) {
                            const idx1 = threadKeys.indexOf(a);
                            const idx2 = threadKeys.indexOf(b);
                            return (idx1 > -1 ? idx1 : Infinity) - (idx2 > -1 ? idx2 : Infinity);
                        }).map(k => [k, result[k]]);
                        result = Object.fromEntries(entries);
                    }

                    const set = new Set();
                    for (const key in result) {
                        const array = result[key];
                        const arraz = [...new Set(array)];
                        let str = arraz.join(separator); // \n

                        // TODO: filter support
                        const filter = filters[key];
                        if (filter !== undefined) {
                            str = filter.call(array, str, result, skipped);
                        }

                        set.add(str);
                    }
                    finalStr = [...set].join(threadSeparator);
                }
                else {
                    console.log('\x1b[2;37m' + JSON.stringify(module.parent === null ? result : skipped) + '\x1B[0m');

                    if (isReOrder === true) {
                        const keys = Object.keys(result);
                        const entries = keys.sort(function (a, b) {
                            const idx1 = threadKeys.indexOf(a);
                            const idx2 = threadKeys.indexOf(b);
                            return (idx1 > -1 ? idx1 : Infinity) - (idx2 > -1 ? idx2 : Infinity);
                        }).map(k => [k, result[k]]);
                        result = Object.fromEntries(entries);
                    }

                    const arr = [];
                    for (const key in result) {
                        const array = result[key];
                        let str = array.join(separator); // space

                        const filter = filters[key];
                        if (filter !== undefined) {
                            str = filter.call(array, str, result, skipped);
                        }

                        arr.push(str);
                    }
                    finalStr = arr.join(threadSeparator);
                }

                if (finalStr !== '') {
                    // // TODO: multiple hook, multiple block
                    // endAt = Date.now() - attachAt;
                    // globalThis.currentBlock = {
                    //     beginAt: beginAt,
                    //     endAt: endAt,
                    //     result: result
                    // };
                    // beginAt = 0;

                    mainHandler(finalStr);
                }
                result = {}; skipped = {};
                pre = null; count = 1;
            }, time);
        }
    }
    else {
        let array = [];
        let skipped = [];
        const filter = filters[Object.keys(filters)[0]];
        return function (address, thread, msg) {
            // if (pre === msg) {
            //     console.log('\x1b[A' + msg + ' x' + ++count);
            // }
            // else {
            //     console.log(msg);
            //     pre = msg; count = 1;
            // }

            // if (beginAt === 0) beginAt = Date.now() - attachAt;
            // clearTimeout(timer);
            // mainHandler(null); // dirty fix: hcode linker

            // black list => push skiped ? array
            // white list => push array ? skipped
            const target = (threads[thread] === flag || module.parent === null) ? array : skipped;

            const s = readString.call(this, address);
            target.push(s);

            console.log(msg + ' \x1b[2;37m`' + s + '`\x1B[0m'); // debug

            timer = setTimeout(() => {
                //console.log('\x1b[2;37m' + JSON.stringify(array, null, 2) + '\x1B[0m');
                console.log('\x1b[2;37m{}\x1B[0m'); // print skiped

                if (isLine === true) {
                    // remove duplicate line
                    array = [...new Set(array)];
                }
                let finalStr = array.join(separator); // default = ''

                if (finalStr !== '') {
                    if (filter !== undefined) {
                        finalStr = filter.call(array, finalStr, skipped);
                    }

                    // endAt = Date.now() - attachAt;
                    // globalThis.currentBlock = {
                    //     beginAt: beginAt,
                    //     endAt: endAt,
                    //     result: array
                    // };
                    // beginAt = 0;

                    mainHandler(finalStr);
                }

                array = []; skipped = [];
                //pre = null; count = 1;
            }, time);
        }
    }
}

function genReadString(hp) {
    // padding (added from genGetTextAddress)

    // length_offset (??? skip; with/without USING_STRING, hcode alway1)

    // USING_UTF8 => codepage = 65001 (CP_UTF8)
    // USING_UNICODE => utf16le

    if (hp.type & USING_STRING) {
        // S Q V M
        // string
        // FULL_STRING ?
        // null_length ? (default: 0)
        // *** TODO: M, FULL_STRING, null_length, more codepage
        if (hp.type & FULL_STRING) console.warn('FULL_STRING: ');
        if (hp.null_length !== 0) console.warn('null_length: ' + hp.null_length);

        if (hp.type & USING_UNICODE) {
            if (hp.type & HEX_DUMP) {
                throw new Error("TODO: M (HEX_DUMP)")
            }
            else {
                return (address) => address.readUtf16StringLE(); // Q
            }
        }
        else if (hp.codepage === CP_UTF8) return (address) => address.readUtf8String2(); // V
        else if (hp.codepage === 932) {
            return (address) => address.readShiftJisString(); // S
        }
        else {
            throw new Error("TODO: codepage1: " + hp.codepage); // S + codepage
        }
    }
    else {
        // A B W H
        // single char (most hcode), BIG_ENDIAN vs LE
        if (hp.type & USING_UNICODE) {
            if (hp.type & HEX_DUMP) {
                // H
                throw new Error("TODO: H (HEX_DUMP)")
            }
            else {
                // W
                return (address) => address.readUtf16StringLE(2); // 1char=2byte
            }
        }
        else {
            if (hp.codepage === CP_UTF8) return (address) => address.readUtf8String2(4)[0]; // 1->4byte (LE only)

            if (hp.type & BIG_ENDIAN) {
                // A - BE & codepage
                if (hp.codepage === 932) {
                    return (address) => {
                        const buf = new Uint8Array(ArrayBuffer.wrap(address, 2));
                        const bufR = new Uint8Array([buf[1], buf[0]]).buffer;
                        return bufR.unwrap().readShiftJisString(2)[0];
                    }
                }
                else {
                    throw new Error("TODO: codepage2: " + hp.codepage);
                }
            }
            else {
                // B - LE & codepage
                if (hp.codepage === 932) {
                    return (address) => address.readShiftJisString(2)[0]; // 1->2 byte
                    // return (address) => {
                    //     console.log(address, address.readU32().toString(16));
                    //     return address.readShiftJisString(2)[0];
                    // }
                }
                else {
                    throw new Error("TODO: codepage3: " + hp.codepage);
                }
            }
        }
    }
}

function getRegName(hp_offset) {
    if (Process.pointerSize === 4) {
        const regs32 = [
            // -4  -8  -C ...
            'eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'
        ];
        const offset = hp_offset + 4; // correct (offset by 4)
        const index = ((-offset) / 4) - 1;
        return regs32[index];
    }
    else {
        const regs64 = [
            // -C -14 -1C ...
            'rax', 'rbx', 'rcx', 'rdx', 'rsp', 'rbp', 'rsi', 'rdi',
            'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'
        ]
        const offset = hp_offset + 4 + 4; // correct + shift
        const index = (-offset) / 8 - 1;
        return regs64[index];
    }
}

// https://github.com/Artikash/Textractor/blob/e83579ed7cee61d39b94a9c550a8bbd6554b4774/texthook/texthook.cc#L137
function genGetTextAddress(hp) {
    let body = 'const address = this.context.';
    let exps = ''; // debug
    if (hp.offset >= 0) {
        // body += `sp.add(${hp.offset}).readPointer()`;
        // const idx = hp.offset === 0 ? '' : `${hp.offset > 0 ? '+' : '-'}0x${hp.offset.toString(16)}`;
        // exps = `[${Process.pointerSize === 4 ? 'esp' : 'rsp'}${idx}]`; // esp+4<=>args[0], esp+8<=>args[1]
        //// || TODO: *1+
        // address instead address<=>rawData
        body += hp.offset === 0 ? 'sp' : `sp.add(${hp.offset})`;
        const idx = hp.offset === 0 ? '' : `+0x${hp.offset.toString(16)}`;
        exps = `${Process.pointerSize === 4 ? 'esp' : 'rsp'}${idx}`;
    }
    else {
        const reg = getRegName(hp.offset);
        body += reg;
        exps = reg;
    }

    if (hp.type & DATA_INDIRECT) {
        if (hp.index !== 0) {
            body += `.add(${hp.index})`;
            exps += (hp.index > 0 ? '+0x' : '-0x') + Math.abs(hp.index).toString(16);
        }

        // move outside
        // if (hp.type & USING_STRING){
        //     body += '.readPointer()';
        //     exps = '[' + exps + ']';
        // }
        //// || TODO: (*1)+ (data offset)
        if (hp.offset >= 0) {
            body += '.readPointer()';
            exps = '[' + exps + ']';
        }
    }
    //// || TODO: (*1), TODO: wrong? esp only?
    if (hp.type & USING_STRING && hp.offset >= 0) {
        body += '.readPointer()';
        exps = '[' + exps + ']';
    }
    if (hp.padding !== 0) {
        body += `.add(${hp.padding})`;
        exps += (hp.padding > 0 ? '+' : '-') + hp.padding.toString(16);
    }
    body += ';\nreturn address;';

    console.log('  DataAddress: ' + exps);
    console.log('  DataType:    ' + ((hp.type & USING_UNICODE) ? 'wchar' : 'char') + (hp.type & USING_STRING ? '*' : ''));

    //if (hp.type & USING_SPLIT) console.warn("TODO: USING_SPLIT");
    ////// TODO: two address (split<=>offset, split_index<=>index, SPLIT_INDIRECT<=>DATA_INDIRECT)
    if (hp.type & USING_SPLIT && hp.options.split === undefined) {
        let body2 = 'return this.context.';
        let exps2 = '';
        if (hp.split >= 0) {
            body2 += hp.split === 0 ? 'sp' : `sp.add(${hp.split})`;
            const idx = hp.split === 0 ? '' : `+0x${hp.split.toString(16)}`;
            exps2 = `${Process.pointerSize === 4 ? 'esp' : 'rsp'}${idx}`;

            // TODO: sp readPointer ? (*2)
        }
        else {
            const reg = getRegName(hp.split);
            body2 += reg;
            exps2 = reg;
        }

        if (hp.type & SPLIT_INDIRECT) {
            if (hp.split_index !== 0) {
                body2 += `.add(${hp.split_index})`;
                exps2 += (hp.split_index > 0 ? '+0x' : '-0x') + Math.abs(hp.split_index).toString(16);
            }

            // split does not support offset like data
            // TODO: is USING_STRING affect split?  (*2)
            body2 += '.readPointer()';
            exps2 = '[' + exps2 + ']';
        }

        body2 += ';';

        console.log('  SplitAddress: ' + exps2);

        hp.options.split = new Function(body2);
    }

    return new Function(body);
}

function parse(code) {
    if (code[0] === '/') {
        code = code.substring(1); // legacy/AGTH compatibility
    }
    if (code[0] === 'H') {
        code = code.substring(1);
        return parseHCode(code);
    }

    return {};
}

// https://github.com/Artikash/Textractor/blob/15db478e62eb955d2299484dbf2c9c7e707bb4cb/host/hookcode.cpp#L51
// https://github.com/Artikash/Textractor/blob/acc85f3a8624c1ae2573d0b26d3414cd09176e75/include/types.h#L25
function parseHCode(HCode) {
    const hp = {
        address: 0, // absolute or relative address
        offset: 0,  // offset of the data in the memory
        index: 0, // deref_offset1
        split: 0, // offset of the split character
        split_index: 0, // deref_offset2
        null_length: 0,
        module: '',
        function: '',
        type: 0, // flags
        codepage: 932, // text encoding
        length_offset: 0, // index of the string length
        padding: 0, // padding before string
        user_value: 0, // 7/20/2014: jichi additional parameters for PSP games
        // text_fun: null,
        // filter_fun: null,
        // hook_fun: null,
        // length_fun: null, // no AGTH equivalent
        name: ''
    };

    // {A|B|W|H|S|Q|V|M}
    switch (HCode[0]) {
        case 'A':
            hp.type |= BIG_ENDIAN;
            hp.length_offset = 1;
            break;
        case 'B':
            hp.length_offset = 1;
            break;
        case 'W':
            hp.type |= USING_UNICODE;
            hp.length_offset = 1;
            break;
        case 'H':
            hp.type |= USING_UNICODE | HEX_DUMP;
            hp.length_offset = 1;
            break;
        case 'S':
            hp.type |= USING_STRING;
            hp.length_offset = 1;
            break;
        case 'Q':
            hp.type |= USING_STRING | USING_UNICODE;
            break;
        case 'V':
            hp.type |= USING_STRING | USING_UTF8;
            break;
        case 'M':
            hp.type |= USING_STRING | USING_UNICODE | HEX_DUMP;
            break;
        default:
            return {};
    }
    HCode = HCode.substring(1); // HCode.erase(0, 1);

    let match = null;
    if (hp.type & USING_STRING) {
        if (HCode[0] === 'F') {
            hp.type |= FULL_STRING;
            HCode = HCode.substring(1); // HCode.erase(0, 1);
        }

        // [null_length<]
        //if (std::regex_search(HCode, match, std::wregex(L"^([0-9]+)<")))
        if ((match = HCode.match(/^([0-9]+)</)) !== null) {
            hp.null_length = parseInt(match[1]); // std::stoi(match[1]);
            HCode = HCode.substring(match[0].length); // HCode.erase(0, match[0].length());
        }
    }

    // [N]
    if (HCode[0] === 'N') {
        hp.type |= NO_CONTEXT;
        HCode = HCode.substring(1); // HCode.erase(0, 1);
    }

    // [codepage#]
    //if (std::regex_search(HCode, match, std::wregex(L"^([0-9]+)#")))
    if ((match = HCode.match(/^([0-9]+)#/)) !== null) {
        hp.codepage = parseInt(match[1]);   // std::stoi(match[1]);
        HCode = HCode.substring(match[0].length); // HCode.erase(0, match[0].length());
    }

    // [padding+]
    //if (std::regex_search(HCode, match, std::wregex(L"^([[:xdigit:]]+)\\+")))
    if ((match = HCode.match(/^([0-9a-fA-F]+)\+/)) !== null) {
        hp.padding = parseInt(match[1], 16); //std::stoull(match[1], nullptr, 16);
        HCode = HCode.substring(match[0].length); //HCode.erase(0, match[0].length());
    }

    function ConsumeHexInt() {
        //let size = 0;
        //let value = 0;
        // try { value = std::stoi(HCode, &size, 16); } catch (std::invalid_argument) {}
        let value = parseInt(HCode, 16);
        if (isNaN(value) === false) {
            HCode = HCode.substring(value.toString(16).length); // HCode.erase(0, size);
        } else value = 0;

        return value;
    }

    // data_offset
    hp.offset = ConsumeHexInt();

    // [*deref_offset1]
    if (HCode[0] === '*') {
        hp.type |= DATA_INDIRECT;
        HCode = HCode.substring(1); // HCode.erase(0, 1);
        hp.index = ConsumeHexInt();
    }

    // [:split_offset[*deref_offset2]]
    if (HCode[0] === ':') {
        hp.type |= USING_SPLIT;
        HCode = HCode.substring(1); // HCode.erase(0, 1);
        hp.split = ConsumeHexInt();

        if (HCode[0] === '*') {
            hp.type |= SPLIT_INDIRECT;
            HCode = HCode.substring(1); // HCode.erase(0, 1);
            hp.split_index = ConsumeHexInt();
        }
    }

    // @addr[:module[:func]]

    //if (!std::regex_match(HCode, match, std::wregex(L"^@([[:xdigit:]]+)(:.+?)?(:.+)?"))) return {};
    //if (match = HCode.match(/^@([0-9a-fA-F]+)(:.+?)?(:.+)?/) === null) return {};
    if ((match = HCode.match(/^@([0-9a-fA-F]+)(:[^:]*)?(:.+)?/)) === null) return {}; // [^:]* = empty module name = main module

    hp.address = parseInt(match[1], 16); //std::stoull(match[1], nullptr, 16);
    if (match[2] !== undefined) {
        hp.type |= MODULE_OFFSET;
        //wcsncpy_s(hp.module, match[2].str().erase(0, 1).c_str(), MAX_MODULE_SIZE - 1);
        hp.module = match[2].substring(1);
    }
    if (match[3] !== undefined) {
        hp.type |= FUNCTION_OFFSET;
        //std::wstring func = match[3];
        //strncpy_s(hp.function, std::string(func.begin(), func.end()).erase(0, 1).c_str(), MAX_MODULE_SIZE - 1);
        hp.function = match[3].substring(1);
    }

    // ITH has registers offset by 4 vs AGTH: need this to correct
    if (hp.offset < 0) hp.offset -= 4;
    if (hp.split < 0) hp.split -= 4;

    return hp;
}

module.exports = exports = {
    setHook
}