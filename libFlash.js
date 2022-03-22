// @name         Flash JIT Hooker
// @version      Flash Player projector content debugger 32.0.0.465 (latest)
// @author       [DC]
// @description  windows (x86), linux (x64), macOS (x64)
// 
// Git: https://github.com/adobe-flash/avmplus/
// Download: https://www.adobe.com/support/flashplayer/debug_downloads.html

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

console.log(`Warning: Only Flash Player projector content debugger 32.0.0.465 is supported!
Discord: https://discord.gg/cdmSkXR7j8
Repack engine: https://discord.com/channels/867944111557201980/940962653533265950/941342552295112764`);

// TODO: pattern? (No, we repack with latest engine: 32.0.0.465)
//  => nothing todo; pre-patched rvaAnti? (linux, macOs) <-- need test first
const { rvaSetJit, rvaGetMethodName, rvaAnti } = (() => {
    if (Process.platform === 'windows') {
        return {
            rvaSetJit: 0xDBF90, // key: `execpolicy jit (`
            rvaGetMethodName: 0xACC70, // key: `MethodInfo-`, `$init` => first caller (2 params)
            rvaAnti: 0x84600 // key: invalid multiname index  => find 0xDEADBEEF call
        }
    }
    else if (Process.platform === 'linux') {
        return {
            rvaSetJit: 0x69B050, // 0xA9B050-0x400000
            rvaGetMethodName: 0x60E3E0, // 0xA0E3E0-0x400000 <- need test
            rvaAnti: 0x643C40 // key: 0xA43C40-0x400000 <- need test
        }
    }
    else if (Process.platform === 'darwin') {
        return {
            rvaSetJit: 0x94E850, // 0x10094E850-0x100000000
            rvaGetMethodName: 0x8B67F0, // 0x1008B67F0-0x100000000 <- need test
            rvaAnti: 0x967720 // key: 0x100967720-0x100000000 <- need test
        }
    }
    else throw 'Not supported: ' + Process.platform;
})();

const mod = Process.enumerateModules()[0];
const vaSetJit = mod.base.add(rvaSetJit);
const vaGetMethodName = mod.base.add(rvaGetMethodName);
const getMethodName = new NativeFunction(vaGetMethodName, 'pointer', ['pointer', 'int'], 'thiscall');
init();

const operations = Object.create(null);
const ilMain = Interceptor.attach(vaSetJit, {
    onEnter: function (args) {
        const methodInfo = args[0];
        const jitAddress = args[1];

        const fnName = getMethodName(methodInfo, 1).readFlashStringUtf8();

        //// jit trace
        // console.log('setJit   ', methodInfo, jitAddress.toString(16).padStart(8, '0'), '`' + fnName + '`');

        const op = operations[fnName];
        if (op !== undefined) {
            console.log('Attach:  ' + fnName, jitAddress);
            // env, argc, args
            Interceptor.attach(jitAddress, op);

            // faster
            delete operations[fnName];
            if (Object.keys(operations).length === 0) {
                ilMain.detach();
                Interceptor.flush();
            }
        }
    }
});

function setHook(object, fn) {
    if (typeof object === 'string') {
        object = {
            object: fn // fn_name: callback
        };
    }

    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element instanceof Function !== true ? element : {
                onEnter: element
            };
        }
    }
}

function init() {
    // Patch1: AntiHooking
    // call dword ptr ds:[<&DebugBreak>] <== ret
    // mov dword ptr ds:[0], 0xDEADBEEF
    // ret
    Memory.patchCode(mod.base.add(rvaAnti), 64, code => {
        const cw = new X86Writer(code);
        cw.putRet();
        cw.flush();
        //console.log('Patched!');
    });

    if (Process.pointerSize === 4) {
        NativePointer.prototype.readFlashStringUtf8 = function (len = -1) {
            let fnName = '';
            if (this.isNull() === false) {
                //console.log('---', hexdump(stringp));
                let ptr = this.add(8).readPointer();
                if (len === -1) len = this.add(0x10).readU32();
                if (ptr.isNull() === false) {
                    // console.log('---', hexdump(ptr));
                    fnName = ptr.readUtf8String2(len);
                }
                else {
                    ptr = this.add(0xC).readPointer();

                    return ptr.readFlashStringUtf8(len);
                }
            }

            return fnName;
        }

        NativePointer.prototype.readFlashString = function (len = -1) {
            let fnName = '';
            if (this.isNull() === false) {
                let ptr = this.add(8).readPointer();
                if (len === -1) len = this.add(0x10).readU32() * 2;
                if (ptr.isNull() === false) {
                    fnName = ptr.readUtf16StringLE(len);
                }
                else {
                    ptr = this.add(0xC).readPointer();

                    return ptr.readFlashString(len);
                }
            }

            return fnName;
        }
    }
    else {
        NativePointer.prototype.readFlashStringUtf8 = function (len = -1) {
            let fnName = '';
            if (this.isNull() === false) {
                //console.log('---', hexdump(stringp));
                let ptr = this.add(0xC).readPointer(); // void, int 8+4
                if (len === -1) len = this.add(0x1C).readU32(); // void int void void
                if (ptr.isNull() === false) {
                    // console.log('---', hexdump(ptr));
                    fnName = ptr.readUtf8String2(len);
                }
                else {
                    ptr = this.add(0x14).readPointer(); // void, int, void

                    return ptr.readFlashStringUtf8(len);
                }
            }

            return fnName;
        }

        NativePointer.prototype.readFlashString = function (len = -1) {
            let fnName = '';
            if (this.isNull() === false) {
                let ptr = this.add(0xC).readPointer();
                if (len === -1) len = this.add(0x1C).readU32() * 2;
                if (ptr.isNull() === false) {
                    fnName = ptr.readUtf16StringLE(len);
                }
                else {
                    ptr = this.add(0x14).readPointer();

                    return ptr.readFlashString(len);
                }
            }

            return fnName;
        }
    }
}

module.exports = exports = {
    setHook
}