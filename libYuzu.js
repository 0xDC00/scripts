// @name         Yuzu JIT Hooker
// @version      1646+
// @author       [DC]
// @description  windows, linux

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const arch = Process.arch;

const __e =
  Process.platform === "linux" && arch === "arm64"
    ? Process.getModuleByName("libyuzu-android.so")
    : Process.mainModule ?? Process.enumerateModules()[0];
if (null !== (Process.platform === 'linux' ? Module.findExportByName(null, 'DotNetRuntimeInfo') : __e.findExportByName('DotNetRuntimeInfo'))) {
    return (module.exports = exports = require('./libRyujinx.js'));
}

console.warn('[Compatibility]');
console.warn('Yuzu 1616+');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

if (arch === 'arm64') {
    console.warn(`
This script requires you to use Dyarnmic in the emulator!
To use Dynarmic:
    1. Go to Settings
    2. Click on "Advanced settings"
    3. Click on "Debug"
    4. Click on "CPU backend"
    5. Switch from "Native code execution" to "Dynarmic"
`);
}

const isFastMem = true;

const isVirtual = arch === 'x64' && Process.platform === 'windows';
let idxDescriptor = isVirtual === true ? 2 : 1;
let idxEntrypoint = idxDescriptor + 1;
const DoJitPtr = getDoJitAddress();
const IS_32 = globalThis.ARM === true;
const buildRegs = IS_32 ? createFunction_buildRegs32() : createFunction_buildRegs();
const operations = Object.create(null);
let _operations = Object.create(null);
let aslrOffset = 0;

tryGetAslrOffset();

function getInitializeAddress() {
    function scanAttempt(address, size, pattern) {
        try {
            return Memory.scanSync(address, size, pattern);
        } catch (e) {
            console.log('Scan error:', e);
        }
        return [];
    }

    let InitializeStartAddress = NULL;
    let CreateProcessParameterArg = 1;

    if (Process.platform !== 'windows') {
        let address;
        if (arch === 'arm64') {
            console.log('Looking for ARM64 Initialize...');
            const name = Process.platform !== 'darwin'
                ? '_ZN6Kernel8KProcess10InitializeERKNS_3Svc22CreateProcessParameterENSt6__ndk14spanIKjLm18446744073709551615EEEPNS_14KResourceLimitENS_14KMemoryManager4PoolEN6Common12TypedAddressILb1ENSD_17ProcessAddressTagEEE' // android arm64
                : '__ZN6Kernel8KProcess10InitializeERKNS_3Svc22CreateProcessParameterEPNS_14KResourceLimitEb'; // macOS arm64?
            address = __e.getExportByName(name);
        } else {
            console.log('Looking for Unix Initialize...');
            address = DebugSymbol.getFunctionByName('_ZN6Kernel8KProcess10InitializeERKNS_3Svc22CreateProcessParameterESt4spanIKjLm18446744073709551615EEPNS_14KResourceLimitENS_14KMemoryManager4PoolEN6Common12TypedAddressILb1ENSC_17ProcessAddressTagEEE');
        }

        if (address) {
            console.log('Unix KProcess Initialize:', address);
            InitializeStartAddress = address;
            CreateProcessParameterArg = 1;
        }

        return { InitializeStartAddress, CreateProcessParameterArg };
    }

    console.log('Looking for MSVC Initialize (TEST)...');
    MSVC2: {
        //                     41 57 48 8D 6C 24 E9 48 81 EC E0 00 00 00 4D 8B E8 4C 8B F2 48 8B F9 48 8D 45 77 48 89 45 CF 48 8D 4D CF E8 EB 05 00 00  // yuzu 1616
        //                     41 57 48 8D 6C 24 F1 48 81 EC F0 00 00 00 49 8B F8 4C 8B F2 48 8B D9 48 8D 45 6F 48 89 45 E7 48 8D 4D E7 E8 1B 07 00 00  // yuzu 1734
        //                     41 57 48 8d 6c 24 f1 48 81 ec e0 00 00 00 4d 8b e8 4c 8b f2 48 8b d9 48 8d 45 6f 48 89 45 5f 48 8d 4d 5f e8 c5 c6 ff ff  // eden
        //                     41 57 48 8d 6c 24 e9 48 81 ec e0 00 00 00 4d 8b e8 4c 8b f2 48 8b f9 48 8d 45 77 48 89 45 cf 48 8d 4d cf e8 eb 05 00 00  // eden
        //                     41 57 48 8D 6C 24 F9 48 81 EC D8 00 00 00 4D 8B E8 4C 8B FA 48 8B D9 48 8D 45 6F 48 89 45 A7 48 8D 4D A7 E8 DB 06 00 00  // eden 0.0.3
        //                     41 57 48 8D 6C 24 F9 48 81 EC E8 00 00 00 4D 8B E8 4C 8B F2 4C 8B F9 48 8D 45 6F 48 89 45 9F 48 8D 4D 9F E8 FB DD FF FF  // eden 0.0.3 nightly
        //                     41 57 48 8d ?? 24 ?? 48 81 ec ?? 00 00 00 4? 8b ?8 4c 8b ?? ?? 8b ?? 48 8d 45 ?? 48 89 45 ?? 48 8d 4d                    // sig of yuzu + yuzu + eden + eden + eden + eden
        // FALSE PATTERN       41 57 48 8D 6C 24 E1 48 81 EC B8 00 00 00 4D 8B F8 4C 8B F2 4C 8B E9 48 8D 45 A7 48 89 45 A7 48 8D 45 A7 48 89 45 AF 48  // FALSE PATTERN
        const InitializeSig = '4? 57 4? 8D 6C 24 ?? 4? 81 EC ?? 00 00 00 ?? 8B ?8 4C 8B F? 4? 8B ?9 48 8D 45 ?? 48 89 45 ?? 48 8D 4D';
        const InitializeSigResults = scanAttempt(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            // console.log('Failed to find MSVC Initialize');
        } else {
            if (InitializeSigResults.length > 1) {
                console.warn(InitializeSigResults.length, 'signature matches found?');
                // console.warn(JSON.stringify(InitializeSigResults, null, 2));
            }
            const InitializeAddress = InitializeSigResults[0].address;
            console.log('MSVC KPRocess Initialize:', InitializeAddress);
            const lookbackSize = 0x50;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = scanAttempt(subAddress, lookbackSize, 'cc cc cc');
            if (subResults.length === 0) {
                console.warn('Failed to find MSVC Initialize start');
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

    console.log('Looking for MSVC Initialize...');
    // doesnt support 1616
    MSVC: {
        const InitializeSig = '4? 8b 4? ?? 4? 89 4c ?? ?? 4? 89 ?? ?? ?? 4? 8b 4? ?? 4? 89 4c ?? ?? 4? 8b 8?'
        const InitializeSigResults = scanAttempt(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            // console.log('Failed to find MSVC Initialize');
        } else {
            InitializeSigResults.length > 1 && console.warn(InitializeSigResults.length, 'signature matches found?');
            const InitializeAddress = InitializeSigResults[0].address;
            console.log('MSVC KPRocess Initialize:', InitializeAddress);
            const lookbackSize = 0x400;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = scanAttempt(subAddress, lookbackSize, 'cc cc cc');
            if (subResults.length === 0) {
                console.warn('Failed to find MSVC Initialize start');
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

    console.log('Looking for MingW GCC Initialize...');
    MingW: {
        // const InitializeSig = '4? 5? 4? 5? 4? 5? 4? 5? 5? 5? 5? 5? 4? 81 e? ?? ?? ?? ?? 0f 11 ?? ?? ?? ?? ?? ?? f3 4? 0f 6f ?? 4? 89';
        const InitializeSig = '6F 30 4? 89 CB 4? 89 D6 4? 8D ?? ?? ?? 01 00 00 4? 89 8C ?? ?? ?? ?? ?? E8';
        const InitializeSigResults = scanAttempt(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            // console.log('Failed to find MingW Initialize');
        } else {
            const InitializeAddress = InitializeSigResults[0].address;
            console.log('MingW KPRocess Initialize:', InitializeAddress);
            const lookbackSize = 0x50;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = scanAttempt(subAddress, lookbackSize, '4? 5? 4? 5?');
            if (subResults.length === 0) {
                console.warn('Failed to find MingW Initialize start');
            } else {
                InitializeStartAddress = subResults[subResults.length - 1].address;
                CreateProcessParameterArg = 1;
                return { InitializeStartAddress, CreateProcessParameterArg };
            }
        }
    }


    console.log('Looking for MingW Clang initialize...');
    MingWClang: {
        const InitializeSig = 'BD 01 08 01 00'; // what
        const InitializeSigResults = scanAttempt(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            // console.log('Failed to find MingW Clang Initialize');
        } else {
            // InitializeSigResults.length > 1 && console.warn(InitializeSigResults.length, 'signature matches found?');
            // if (InitializeSigResults.length > 1) {
                // console.warn(JSON.stringify(InitializeSigResults, null, 2));
            // }
            const InitializeAddress = InitializeSigResults[0].address;
            console.log('MingW Clang KPRocess Initialize:', InitializeAddress);
            const lookbackSize = 0x100;
            const subAddress = InitializeAddress.sub(lookbackSize);
            const subResults = scanAttempt(subAddress, lookbackSize, '4? 5? 4? 5? 4?');
            if (subResults.length === 0) {
                console.warn('Failed to find MingW Clang Initialize start');
            } else {
                InitializeStartAddress = subResults[subResults.length - 1].address;
                CreateProcessParameterArg = 1;
                return { InitializeStartAddress, CreateProcessParameterArg };
            }
        }
    }

    // throw new Error('Failed to find Initialize');
    return { InitializeStartAddress, CreateProcessParameterArg };
}

/*
struct CreateProcessParameter {
    std::array<char, 12> name;  0x0,  12 bytes
    u32 version;                0xc,  4 bytes
    u64 program_id;             0x10, 8 bytes
    u64 code_address;           0x18, 8 bytes
    s32 code_num_pages;
    CreateProcessFlag flags;
    Handle reslimit;
    s32 system_resource_num_pages;
};
*/
function tryGetAslrOffset() {
    aslrOffset = sessionStorage.getItem('YUZU_ASLR_OFFSET') ?? aslrOffset;

    const { InitializeStartAddress, CreateProcessParameterArg } = getInitializeAddress();
    if (InitializeStartAddress.isNull()) {
        // throw new Error('Failed to find Initialize start');
        console.log('Failed to find Initialize, using fallback offset', aslrOffset);
        return;
    }

    Interceptor.attach(InitializeStartAddress, {
        onEnter(args) {
            // 1 for MingW, 2 for MSVC
            const CreateProcessParameter = args[CreateProcessParameterArg];

            const textBytes = '41 70 70 6c 69 63 61 74 69 6f 6e 00'; // Application
            const results = Memory.scanSync(CreateProcessParameter, 0x15, textBytes);
            if (results.length !== 0) {
                // codeAddress already has applied offset
                const codeAddress = results[0].address.add(0x18).readPointer();

                const baseAddress = IS_32 ? ptr(0x200000) : ptr(0x80000000);
                const aslrOffsetHex = codeAddress.sub(baseAddress);

                if (aslrOffsetHex.compare(ptr(0x80000000)) > 0) {
                    console.error('Code address too high, are you on NCE?', codeAddress);
                }

                console.log('ASLR Offset:', aslrOffsetHex);
                aslrOffset = aslrOffsetHex.toUInt32();
                sessionStorage.setItem('YUZU_ASLR_OFFSET', aslrOffset);
            } else {
                throw new Error('Missing string?');
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

        let em_address;

        if (arch === 'x64') {
            em_address = descriptor.readU64().and(0xffffffff).sub(aslrOffset).toNumber();
        } else if (arch === 'arm64') {
            em_address = descriptor.and(0xffffffff).sub(aslrOffset).toUInt32();
        } 

        const op = operations[em_address];

        // x64 example
        // descriptor:       0x1c983e9f2e8
        // em_address:       0x8601a150
        // em_address (num): 2248253776
        // entrypoint:       0x1c9342cd440

        // arm64 example
        // descriptor:       0x86346818 <- already emulation address
        // em_address:       0x86346818
        // em_address (num): 2251581464
        // entrypoint:       0x6ad985bcc8

        // console.warn(`descriptor:       ${descriptor.toString()}
        //             \rem_address:       ${ptr(em_address).toString()}
        //             \rem_address (num): ${em_address}
        //             \rentrypoint:       ${ptr(entrypoint.toString())}
        //             `);

        if (op !== undefined && entrypoint.isNull() === false) {
            console.log('Attach:', ptr(em_address), entrypoint);

            jitAttach(em_address, entrypoint, op);
            sessionStorage.setItem('Yuzu_' + Date.now(), {
                guest: em_address,
                host: entrypoint,
            });
        }
    },
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
        // console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
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
        if (arch === 'x64') {
            // not _ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m.cold
            const names = [
                '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvm', // linux 64 new
                '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m', // linux x64
                // __ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m
                'Dynarmic::Backend::X64::EmitX64::RegisterBlock(Dynarmic::IR::LocationDescriptor const&, void const*, unsigned long)', // macOS x64 (demangle)
            ];

            for (const name of names) {
                const addresses = DebugSymbol.findFunctionsNamed(name);
                if (addresses.length !== 0) {
                    console.log('X64 RegisterBlock:', addresses[0]);
                    return addresses[0];
                }
            }
        } else if (arch === 'arm64') {
            const name = 
                Process.platform !== 'darwin' 
                    ? '_ZN8Dynarmic7Backend5Arm6412AddressSpace19RelinkForDescriptorENS_2IR18LocationDescriptorEPSt4byte'   // android arm64
                    : '__ZN8Dynarmic7Backend5Arm6412AddressSpace19RelinkForDescriptorENS_2IR18LocationDescriptorEPSt4byte'; // macOS arm64
            const address = __e.getExportByName(name);
            console.log('ARM64 RelinkForDescriptor:', address);
            return address;
        } else {
            console.warn("Unknown architecture?:", arch)
        }
    }
    else {
        // Windows MingW Clang
        // 41 57 41 56 56 57 53 48 83 ec 50 4d 89 ce 4c 89 c3 48 89 d7 48 89 ce 4c 8b bc 24 a0 00 00 00 48 8b 02 48 8d 4c 24 20 ff 50 18
        // e8 ba 94 2f 00 48 89 f9 48 89 da 4d 89 f0 e8 54 00 00 00 4c 8936 4c 897e08 4883c718 48 8b03 48 89 44 24 20 48 8b 06 48 89 44 24 28 48 8b 46 08 48 89 44 24 30 48 8d 4c 24 40 4c 8d 44 24 20 48 89 fa e8 de 97 4a 00 // clang 0.0.4-rc3
        // e8 ?? ?? ?? ?? 4? 89 f9 4? 89 da 4? 89 f0 e8 ?? ?? ?? ?? 4? 8936 4? 897e08 4?83c7?? 4? 8b03 4? 89 44 ?? ?? 4? 8b 06 4? 89 44 ?? ?? 4? 8b 46 08 4? 89 44 ?? ?? 4? 8d ?? ?4 40 4? 8d ?? ?4 20 4? 89 fa e8 // cland 0.0.4-rc3 frida
        const RegisterBlockSig3 = 'e8 ?? ?? ?? ?? 4? 89 ?? 4? 89 ?? 4? 89 ?? e8 ?? ?? ?? ?? 4? 8936 4? 89???? ???????? 4? 8b?? 4? 89 44';
        const RegisterBlockMatches3 = Memory.scanSync(__e.base, __e.size, RegisterBlockSig3);
        if (RegisterBlockMatches3.length > 1) {
            console.warn(RegisterBlockMatches3.length, 'signature matches found?');
        }
        const RegisterBlock3 = RegisterBlockMatches3[0];
        if (RegisterBlock3) {
            console.log('MingW Clang RegisterBlock:', RegisterBlock3.address);
            const beginSubSig1 = '41 5? 41 5? 5?';
            const lookbackSize = 0x50;
            const address = RegisterBlock3.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                return subs[subs.length - 1].address;
            }
        }

        // Windows MinGW GCC
        //	e8 f9 fc ff ff 48 8b 6e 20 4c 8b 7e 28 4c 89 2b 4c 89 73 08 48 8b 3f 4c 39 fd 0f 84 8e 01 00 00 
        const RegisterBlockSig2 = 'e8 ?? ?? ?? ?? 4? 8b ?? ?? 4? 8b ?? ?? 4? 89 ?? 4? 89 ?? ?? 4? 8b ?? 4? 39';
        const RegisterBlockMatches = Memory.scanSync(__e.base, __e.size, RegisterBlockSig2);
        if (RegisterBlockMatches.length > 1) {
            console.warn(RegisterBlockMatches.length, 'signature matches found?');
        }
        const RegisterBlock2 = RegisterBlockMatches[0];
        if (RegisterBlock2) {
            console.log('MingW RegisterBlock:', RegisterBlock2.address);
            const beginSubSig1 = '41 5? 41 5? 41 5?';
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
            console.log('MSVC RegisterBlock:', RegisterBlock.address);
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
            console.log('Patch', Patch.address);
            // const beginSubSig1 = '4883EC ?? 48';
            const beginSubSig1 = 'CC 4? 8?';
            const lookbackSize = 0x90;
            const address = Patch.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                idxDescriptor = 1;
                idxEntrypoint = 2;
                return subs[subs.length - 1].address.add(1);
            }
        }

        // DebugSymbol: RegisterBlock
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX_K@Z <- new
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX1_K@Z
        const symbols = DebugSymbol.findFunctionsMatching('Dynarmic::Backend::X64::EmitX64::RegisterBlock');
        if (symbols.length !== 0) {
            console.log('RegisterBlock symbol:', symbols[0]);
            return symbols[0];
        }

        // DebugSymbol: Patch
        // ?Patch@EmitX64@X64@Backend@Dynarmic@@IEAAXAEBVLocationDescriptor@IR@4@PEBX@Z
        const patchs = DebugSymbol.findFunctionsMatching('Dynarmic::Backend::X64::EmitX64::Patch');
        if (patchs.length !== 0) {
            console.log('Patch symbol: ', patchs[0]);
            idxDescriptor = 1;
            idxEntrypoint = 2;
            return patchs[0];
        }
    }

    throw new Error('RegisterBlock not found!');
}

function createFunctionBody_findBaseAndRegs() {
    let body = '';

    if (arch === 'x64') {
        body += `const theRegs = ["rax", "rcx", "rdx", "rbx", "rsp", "rbp", "rsi", "rdi", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15"];`;
    } else if (arch === 'arm64') {
        body += `const theRegs = ["pc", "sp", "x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "x10", "x11", "x12", "x13", "x14", "x15", "x16", "x17", "x18", "x19", "x20", "x21", "x22", "x23", "x24", "x25", "x26", "x27", "x28", "fp", "lr"];`;
    } 

    let vm = '';
    if (globalThis.ARM === true) {
        vm = `context[regs].readU32();`;
    } else {
        vm = `context[regs].readU64();`;
    }

    // change this according to the game
    const text = 'address.readShiftJisString();';
    // const text = "address.add(0x14).readUtf16String();"

    body += `for (const regs of theRegs) {
                for (const base of theRegs) {
                    if (regs === base) {
                        continue;
                    }

                    try {
                        const vm = ${vm}
                        const address = context[base].add(vm);
                        const text = ${text}
                        if (text === null || text === "") {
                            continue;
                        }
                        console.warn("regs: " + regs + " | base: " + base + " | " + text);
                    } catch (err) {}
                }
            };`;
    // body += `console.log(JSON.stringify(context, null, 2));`;

    // body += `console.warn(JSON.stringify(regs + " " + base, null, 2));`;

    return body;
}

// https://en.wikipedia.org/wiki/Calling_convention#ARM_(A64)
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_jitstate.h
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    // body += createFunctionBody_findBaseAndRegs();

    if (arch === 'x64') {
        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
        body += 'const regs = context.r15;'; // x28
    } else if (arch === 'arm64') {
        body += 'const regs = context.x28;';
    } 

    let getValue = '';
    if (isFastMem === true) {
        /* fastmem (host MMU) */
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_interface.cpp#L43

        if (arch === 'x64') {
            body += 'const base = context.r13;';
        } else if (arch === 'arm64') {
            body += 'const base = context.x25;';
        } 

        getValue = `get value() { return base.add(this._vm); },`; // host address
    } else {
        /* pagetable */
        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831
        body += 'const table = context.r14;';

        const page_bits = 12; // 0xC
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
}

// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs32() {
    let body = '';

    // body += createFunctionBody_findBaseAndRegs();

    /* fastmem */
    if (arch === 'x64') {
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L48
        body += 'const base = context.r13;';

        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
        body += 'const regs = context.r15;';
    } else if (arch === 'arm64') {
        body += 'const base = context.x25;';
        body += 'const regs = context.x28.add(24);'; // 6 u32
    }

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

    // probably incorrect on arm64?
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
    } else {
        _operations = {
            [globalThis.gameVer]: object,
        };
    }

    //console.log(JSON.stringify(object, null, 2));
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            if (key.startsWith('H')) {
                console.error('Skip: ' + key + ', this hashCode is not implemented, try Ryujinx.');
                continue;
            }
            const element = object[key];
            const address = IS_32 === true ? uint64(key).add(0x204000) : uint64(key).add(0x80004000);
            operations[address.toString(10)] = element;
        }
    }

    if (globalThis.gameVer) console.warn('Game version: ' + globalThis.gameVer);

    Object.keys(sessionStorage).map((key) => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('Yuzu_') === true) {
            try {
                const em_address = value.guest;
                const entrypoint = ptr(value.host);
                const op = operations[em_address.toString(10)];
                jitAttach(em_address, entrypoint, op);
            } catch (e) {
                console.error(e);
            }
        }
    });
}

module.exports = exports = {
    setHook,
};
