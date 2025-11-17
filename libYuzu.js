// @name         Yuzu JIT Hooker
// @version      1646+
// @author       [DC]
// @description  windows, linux

if (module.parent === null) {
    throw "I'm not a text hooker!";
}
const __e = Process.mainModule ?? Process.enumerateModules()[0];
if (null !== (Process.platform === 'linux' ? Module.findExportByName(null, 'DotNetRuntimeInfo') : __e.findExportByName('DotNetRuntimeInfo'))) {
    return module.exports = exports = require('./libRyujinx.js');
}

console.warn('[Compatibility]');
console.warn('Yuzu 1616+');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

const isFastMem = true;

const isVirtual = Process.arch === 'x64' && Process.platform === 'windows';
let idxDescriptor = isVirtual === true ? 2 : 1;
let idxEntrypoint = idxDescriptor + 1;
const DoJitPtr = getDoJitAddress();
const buildRegs = globalThis.ARM === true ? createFunction_buildRegs32() : createFunction_buildRegs();
const operations = Object.create(null);
let _operations = Object.create(null);
let aslrOffset = 0;

isVirtual === true && tryGetAslrOffset();

// function tryGetAslrOffset() {
//     /** @type {{address: NativePointer, offset: number}} */
//     const { address: LoadFromMetadataAddress, offset: argsOffset } = (() => {
//         // MingW
//         {
//             const LoadFromMetadataSig = "4? 57 4? 56 4? 55 4? 54 55 57 56 53 4? 81 ec ?? ?? ?? ?? 8b 84 ?? ?? ?? ?? ?? 4? 89 cf 4? 89 d1 4? 89 d3 4? 89 c4 4? 89 cd 89 44";
//             const results = Memory.scanSync(__e.base, __e.size, LoadFromMetadataSig);
//             if (results.length !== 0) {
//                 results.length > 1 && console.warn(results.length, "signature matches found?");

//                 const address = results[0].address;
//                 console.warn("MingW LoadFromMetadata", address);
//                 return { address: address, offset: 0 };
//             }
//         }
//         // MSVC
//         {
//             const LoadFromMetadataSig = "33 ?? 4? 89 ?? ?? 4? 8b ?? e8 ?? ?? ?? ?? 4? 89 ?? ?? 4? 8b ?? ?? 4? 8d";
//             const results = Memory.scanSync(__e.base, __e.size, LoadFromMetadataSig);
//             if (results.length !== 0) {
//                 results.length > 1 && console.warn(results.length, "signature matches found?");

//                 const lookbackSize = 0x100;
//                 const subAddress = results[0].address.sub(lookbackSize);
//                 const beginSubSig = "cc 4? 89 ?? ?? ?? 4? 89";
//                 const subs = Memory.scanSync(subAddress, lookbackSize, beginSubSig);

//                 if (subs.length !== 0) {
//                     const address = subs[subs.length - 1].address.add(1);
//                     console.warn("MSVC LoadFromMetadata", address);
//                     return { address: address, offset: 1 };
//                 }
//             }
//         }
//     })();

//     if (LoadFromMetadataAddress.isNull()) {
//         console.log("Couldn't find LoadFromMetadata");
//         return;
//     } 
//     // else if (LoadFromMetadataAddress.compare(0xfff000)) {
//         // console.log("Invalid LoadFromMetadata address");
//         // return;
//     // }

//     const tempHook = Interceptor.attach(LoadFromMetadataAddress, {
//         onEnter(args) {
//             const offset = args[4 + argsOffset];
//             console.warn("Offset applied:", offset);
//             aslrOffset = offset.toUInt32();
//         },
//         onLeave() {
//             // tempHook.detach();
//         },
//     });
// }

function getInitializeAddress() {
    let InitializeStartAddress = NULL;
    let CreateProcessParameterArg = 1;

    MingW: {
        // const InitializeSig = "4? 5? 4? 5? 4? 5? 4? 5? 5? 5? 5? 5? 4? 81 e? ?? ?? ?? ?? 0f 11 ?? ?? ?? ?? ?? ?? f3 4? 0f 6f ?? 4? 89";
        const InitializeSig = "6F 30 4? 89 CB 4? 89 D6 4? 8D ?? ?? ?? 01 00 00 4? 89 8C ?? ?? ?? ?? ?? E8";
        const InitializeSigResults = Memory.scanSync(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            console.warn("Couldn't find MingW Initialize");
        } else {
            const InitializeAddress = InitializeSigResults[0].address;
            console.warn("MingW KPRocess Initialize:", InitializeAddress);
            const lookbackSize = 0x50;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = Memory.scanSync(subAddress, lookbackSize, "4? 5? 4? 5?");
            if (subResults.length === 0) {
                console.warn("Couldn't find MingW Initialize start");
            } else {
                InitializeStartAddress = subResults[subResults.length - 1].address;
                CreateProcessParameterArg = 1;
                return { InitializeStartAddress, CreateProcessParameterArg };
            }
        }
    }

    MSVC: {
        const InitializeSig = "4? 8b 4? ?? 4? 89 4c ?? ?? 4? 89 ?? ?? ?? 4? 8b 4? ?? 4? 89 4c ?? ?? 4? 8b 8?";
        const InitializeSigResults = Memory.scanSync(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            console.warn("Couldn't find MSVC Initialize");
        } else {
            const InitializeAddress = InitializeSigResults[0].address;
            console.warn("MSVC KPRocess Initialize:", InitializeAddress);

            const lookbackSize = 0x400;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = Memory.scanSync(subAddress, lookbackSize, "cc cc cc");
            if (subResults.length === 0) {
                console.warn("Couldn't find MSVC Initialize start");
            } else {
                let purgatoryAddress = subResults[subResults.length - 1].address;
                while (true) {
                    if (purgatoryAddress.readU8() === 0xcc) {
                        purgatoryAddress = purgatoryAddress.add(1);
                    } else {
                        break;
                    }
                }
                InitializeStartAddress = purgatoryAddress;
                CreateProcessParameterArg = 2;
                return { InitializeStartAddress, CreateProcessParameterArg };
            }
        }
    }

    throw new Error("Couldn't find Initialize");
}

function tryGetAslrOffset() {
    const IS_32 = globalThis.ARM === true;
    const veryBaseAddress = IS_32 ? ptr(0x200000) : ptr(0x80000000);
    const { InitializeStartAddress, CreateProcessParameterArg } = getInitializeAddress();

    if (InitializeStartAddress.isNull()) {
        throw new Error("Couldn't find Initialize start");
    }
    console.warn("Final KPRocess Initialize start:", InitializeStartAddress);

    Interceptor.attach(InitializeStartAddress, {
        onEnter(args) {
            // const selectedArg = args[1]; // MingW
            // const selectedArg = args[2]; // MSVC
            const selectedArg = args[CreateProcessParameterArg];
            
            // Application
            const results = Memory.scanSync(selectedArg, 0x15, "41 70 70 6c 69 63 61 74 69 6f 6e 00");
            if (results.length !== 0) {
                const address = results[0].address.add(0x18);
                console.warn(address.readPointer());
                console.warn(veryBaseAddress);
                console.warn(address.readPointer().sub(veryBaseAddress));
                aslrOffset = address.readPointer().sub(veryBaseAddress).toUInt32();
            } else {
                throw new Error("Missing string?");
            }
        }
    });
}


//let EmitX64_vftable;
/*
https://github.com/merryhime/dynarmic/blob/e6f9b08d495449e4ca28882c0cb4f12d83fd4549/src/dynarmic/backend/x64/emit_x64.cpp
EmitX64::BlockDescriptor EmitX64::RegisterBlock(
    const IR::LocationDescriptor& descriptor,
    CodePtr entrypoint,
    CodePtr entrypoint_far,
    size_t size
    )
=> Win32
EmitX64::BlockDescriptor *__fastcall EmitX64::RegisterBlock(
    EmitX64 *this, // rcx (vftable)
    EmitX64::BlockDescriptor *result, // rdx
    const LocationDescriptor *descriptor, // r8 <== 2
    const void *entrypoint, // r9 <== 3
    const void *entrypoint_far, // [rsp+230]
    unsigned __int64 size) // [rsp+238]
=> Linux, macOS
EmitX64::BlockDescriptor *__fastcall EmitX64::RegisterBlock(
    X64::BlockOfCode **a1_code, // rdi 0
    void **a2_descriptor, // rsi <==   1
    __int64 a3_entrypoint, // rdx <==  2
    __int64 a4_entrypoint_far, // rcx
    __int64 a5_size) // r8

TODO:
Arm64? https://github.com/merryhime/dynarmic/blob/arm64/src/dynarmic/backend/arm64/a32_address_space.cpp#L104
*/
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //EmitX64_vftable = args[0]; // rcx
        //EmitX64_result = args[1]; // rdx
        const descriptor = args[idxDescriptor]; // r8
        const entrypoint = args[idxEntrypoint]; // r9

        //const entrypoint_far = args[4];
        //const size = args[5];

        const em_address = descriptor.readU64().and(0xFFFFFFFF).sub(aslrOffset).toNumber();
        // console.warn(descriptor, em_address.toString(16));
        // console.warn(entrypoint);
        // for (let i  = 0; i < 4; i++) {
        //     // try{
        //         // console.warn(`1arg[${i}]: ${args[i]}`);
        //     // } catch(e) {
        //         // 
        //     // }
        //     try{
        //         console.warn(`2arg[${i}]: ${args[i].readU32().toString(16)}`);
        //     } catch(e) {
                
        //     }
        //     try{
        //         console.warn(`4arg[${i}]: ${args[i].readU64().toString(16)}`);
        //     } catch(e) {
                
        //     }
        // }

        const op = operations[em_address];
        if (op !== undefined && entrypoint.isNull() === false) {
            console.log('Attach:', ptr(em_address), entrypoint);
            jitAttach(em_address, entrypoint, op);
            sessionStorage.setItem('Yuzu_' + Date.now(), {
                guest: em_address,
                host: entrypoint
            });
        }
    }
});

function jitAttach(em_address, entrypoint, op) {
    const thiz = Object.create(null);
    //thiz.returnAddress = 0;
    thiz.context = Object.create(null);
    thiz.context.pc = em_address;

    // Breakpoint.add (slower)
    Breakpoint.add(entrypoint, function () {
        //thiz.context.sp = 0;
        const regs = buildRegs(this.context, thiz); // x0 x1 x2 ...
        //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
        op.call(thiz, regs);
    });

    // // Interceptor.attach (detach = hook removed, but freeze)
    // Interceptor.attach(entrypoint, {
    //     onEnter: function () {
    //         const thiz = Object.create(null);
    //         //thiz.returnAddress = 0;
    //         thiz.context = Object.create(null);
    //         thiz.context.pc = em_address;
    //         //thiz.context.sp = 0;
    //         const regs = buildRegs(this.context, thiz); // x0 x1 x2 ...
    //         //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
    //         op.call(thiz, regs);
    //     }
    // });
}

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // Unix
        // not _ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m.cold
        const names = [
            '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvm', // linux 64 new
            '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m', // linux x64
            // __ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m
            'Dynarmic::Backend::X64::EmitX64::RegisterBlock(Dynarmic::IR::LocationDescriptor const&, void const*, unsigned long)' // macOS x64 (demangle)
        ];
        for (const name of names) {
            const addresss = DebugSymbol.findFunctionsNamed(name);
            if (addresss.length !== 0) {
                return addresss[0];
            }
        }
    }
    else {
        // Windows MinGW GCC
        //	e8 f9 fc ff ff 48 8b 6e 20 4c 8b 7e 28 4c 89 2b 4c 89 73 08 48 8b 3f 4c 39 fd 0f 84 8e 01 00 00 
        const RegisterBlockSig2 = "e8 ?? ?? ?? ?? 4? 8b ?? ?? 4? 8b ?? ?? 4? 89 ?? 4? 89 ?? ?? 4? 8b ?? 4? 39";
        const RegisterBlockMatches = Memory.scanSync(__e.base, __e.size, RegisterBlockSig2);

        if (RegisterBlockMatches.length > 1) {
            console.warn(RegisterBlockMatches.length, "signature matches found?");
        }

        const RegisterBlock2 = RegisterBlockMatches[0];
        if (RegisterBlock2) {
            console.warn("MingW RegisterBlock", RegisterBlock2.address);
            const beginSubSig1 = "41 5? 41 5? 41 5?";
            const lookbackSize = 0x100;
            const address = RegisterBlock2.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                return subs[subs.length - 1].address;
            }
        }

        // Windows MSVC x64 2019 (v996-) + 2022 (v997+)
        const RegisterBlockSig1 = 'E8 ?? ?? ?? ?? 4? 8B ?? 4? 8B ?? 4? 8B ?? E8 ?? ?? ?? ?? 4? 89?? 4? 8B???? ???????? 4? 89?? ?? 4? 8B?? 4? 89';
        const RegisterBlock = Memory.scanSync(__e.base, __e.size, RegisterBlockSig1)[0];
        if (RegisterBlock) {
            console.warn("MSVC RegisterBlock", RegisterBlock.address);
            const beginSubSig1 = 'CC 40 5? 5? 5?';
            const lookbackSize = 0x400;
            const address = RegisterBlock.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                return subs[subs.length - 1].address.add(1);
            }
        }

        // fallback to Patch when RegisterBlock not found (wrong signature or target inlined)
        const PatchSig1 = '4????? 4????? 4????? FF?? ?? 4????? ?? 4????? 75 ?? 4????? ?? 4????? ?? 4?';
        const Patch = Memory.scanSync(__e.base, __e.size, PatchSig1)[0];
        if (Patch) {
            console.warn("Patch");
            const beginSubSig1 = '4883EC ?? 48';
            const lookbackSize = 0x80;
            const address = Patch.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                idxDescriptor = 1;
                idxEntrypoint = 2;
                return subs[subs.length - 1].address;
            }
        }

        // DebugSymbol: RegisterBlock
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX_K@Z <- new
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX1_K@Z
        const symbols = DebugSymbol.findFunctionsMatching('Dynarmic::Backend::X64::EmitX64::RegisterBlock');
        if (symbols.length !== 0) {
            return symbols[0];
        }

        // DebugSymbol: Patch
        // ?Patch@EmitX64@X64@Backend@Dynarmic@@IEAAXAEBVLocationDescriptor@IR@4@PEBX@Z
        const patchs = DebugSymbol.findFunctionsMatching('Dynarmic::Backend::X64::EmitX64::Patch');
        if (patchs.length !== 0) {
            idxDescriptor = 1;
            idxEntrypoint = 2;
            return patchs[0];
        }
    }

    throw new Error('RegisterBlock not found!');
}

// https://en.wikipedia.org/wiki/Calling_convention#ARM_(A64)
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_jitstate.h
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;'; // x28

    let getValue = '';
    if (isFastMem === true) {
        /* fastmem (host MMU) */
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_interface.cpp#L43
        body += 'const base = context.r13;';

        getValue = `get value() { return base.add(this._vm); },`; // host address
    }
    else {
        /* pagetable */
        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831
        body += 'const table = context.r14;';

        const page_bits = 12 // 0xC
        // const page_mask = (1 << page_bits) - 1; // 0xFFF
        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L869
        const page_table_pointer_mask_bits = 2;
        body += `const mask_bits = NULL.not().shl(${page_table_pointer_mask_bits});`; // 0xFFFFFFFFFFFFFFFC

        // const page = table.add((this._vm >>> ${page_bits}) * 8).readPointer(); // JS limitation (32bit only)
        // page.add(this._vm & ${page_mask});
        // const page = [table + (vaddr >> C)*8];
        // const addr = (page+vaddr) & mask_bits
        getValue = `get value() {
            const page = table.add(ptr(this._vm).shr(${page_bits}).shl(3)).readPointer();
            return page.isNull() === true ? page : page.add(this._vm).and(mask_bits);
        },`; // host address, 0xFFFFFFFFF8000000 <=> invalid
    }

    // arm32: 0->15 (r0->r15)
    // arm64: 0->30 (x0->lr) + sp (x31) + pc (x32)
    body += 'const args = [';
    for (let i = 0; i < 33; i++) {
        let offset = i * 8;
        body += '{';
        body += `_vm: regs.add(${offset}).readU64().toNumber(),`;
        body += getValue;
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU64(this._vm); return this; }`;
        body += '},';
    }
    body += '];';

    //body += 'thiz.context.pc = regs.add(256).readU64().toNumber();' // x32 0x100 256 - where you are
    //body += 'thiz.context.sp = regs.add(248).readU64().toNumber();'; // x31 0xF8 248; useless?
    body += 'thiz.returnAddress = regs.add(240).readU64().toNumber();'; // x30 0xF0 240, lr - where you were
    body += 'thiz.context.lr = args[30];';
    body += 'thiz.context.fp = args[29];'; // x29 (FP): Frame pointer.
    body += 'thiz.context.sp = args[31];'; // x31

    body += 'return args;';

    return new Function('context', 'thiz', body);
};

// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs32() {
    let body = '';

    /* fastmem */
    // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L48
    body += 'const base = context.r13;';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;';

    /* pagetable */
    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831

    // arm32: 0->15 (r0->r15)
    // arm64: 0->30 (x0->lr) + sp (x31) + pc (x32)
    body += 'const args = [';
    for (let i = 0; i < 16; i++) {
        let offset = i * 4;
        body += '{';
        body += `_vm: regs.add(${offset}).readU32(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU32(this._vm); return this; }`;
        body += '},';
    }
    body += '];';

    //body += 'thiz.context.pc = regs.add(60).readU32();'; // r15 0x3c 60
    //body += 'thiz.context.sp = regs.add(52).readU32();'; // r13 0x34 52; useless?
    body += 'thiz.returnAddress = regs.add(56).readU32();'; // r14 0x38 56; lr
    body += 'thiz.context.lr = args[14];';
    body += 'thiz.context.fp = args[11];'; // r11 (FP): Frame pointer.
    body += 'thiz.context.sp = args[13];'; // r13

    body += 'return args;';
    return new Function('context', 'thiz', body);
}

/**
 * 
 * @param {EmulatorHook} object
 */
function setHook(object, dfVer) {
    if (dfVer !== undefined) {
        _operations = object;
        object = object[dfVer];
    }
    else {
        _operations = {
            [globalThis.gameVer]: object
        };
    }

    //console.log(JSON.stringify(object, null, 2));
    const IS_32 = globalThis.ARM === true;
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            if (key.startsWith('H')) {
                console.error("Skip: " + key + ', this hashCode is not implementd, try Ryujinx.');
                continue;
            }
            const element = object[key];
            const address = IS_32 === true ? uint64(key).add(0x204000) : uint64(key).add(0x80004000);
            operations[address.toString(10)] = element;
        }
    }

    if (globalThis.gameVer) console.warn('Game version: ' + globalThis.gameVer);

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('Yuzu_') === true) {
            try {
                const em_address = value.guest;
                const entrypoint = ptr(value.host);
                const op = operations[em_address.toString(10)];
                jitAttach(em_address, entrypoint, op);
            }
            catch (e) {
                console.error(e);
            }
        }
    });
}

module.exports = exports = {
    setHook
}
