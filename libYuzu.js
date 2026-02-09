// @name         Yuzu JIT/NCE Hooker
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
    const ryujinx = require('./libRyujinx.js');
    const ryujinx_setHook = ryujinx.setHook;
    ryujinx.setHook = function(object, dfVer) {
        for (const [key, value] of Object.entries(object)) {
            if (key.startsWith('0100')) {
                // flatten object by getting rid of title ids to match what libRyujinx expects
                Object.assign(object, value);
                delete object[key];
            }
        }
        return ryujinx_setHook(object, dfVer);
    }
    return (module.exports = exports = ryujinx);
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
const titleIdToHooks = new Map();

tryGetAslrOffset();

function getInitializeAddress() {
    function scanAttempt(address, size, pattern) {
        try {
            return Memory.scanSync(address, size, pattern);
        } catch (e) {
            console.log('Scan attempt error:', e.message);
        }
        return [];
    }

    let InitializeStartAddress = NULL;
    let CreateProcessParameterArg = 1;

    if (Process.platform !== 'windows') {
        /** @type {NativePointer[]=} */
        let addresses;
        if (arch === 'arm64') {
            console.log('Looking for ARM64 Initialize...');
            addresses = [__e.getExportByName('_ZN6Kernel8KProcess10InitializeERKNS_3Svc22CreateProcessParameterENSt6__ndk14spanIKjLm18446744073709551615EEEPNS_14KResourceLimitENS_14KMemoryManager4PoolEN6Common12TypedAddressILb1ENSD_17ProcessAddressTagEEE')];
        } else {
            console.log('Looking for Unix Initialize...');
            addresses = DebugSymbol.findFunctionsNamed('_ZN6Kernel8KProcess10InitializeERKNS_3Svc22CreateProcessParameterESt4spanIKjLm18446744073709551615EEPNS_14KResourceLimitENS_14KMemoryManager4PoolEN6Common12TypedAddressILb1ENSC_17ProcessAddressTagEEE');
        }

        if (addresses?.length !== 0) {
            const address = addresses[0];
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
        const InitializeSig = '4? 57 4? 8D 6C 24 ?? 4? 81 EC ?? 00 00 00 ?? 8B ?8 4C 8B F? 4? 8B ?? 48 8D 45 ?? 48 89 45 ?? 48 8D 4D';
        const InitializeSigResults = scanAttempt(__e.base, __e.size, InitializeSig);
        if (InitializeSigResults.length === 0) {
            // console.log('Failed to find MSVC Initialize');
        } else {
            if (InitializeSigResults.length > 1) {
                console.warn(InitializeSigResults.length, 'signature matches found?');
                console.warn(JSON.stringify(InitializeSigResults, null, 2));
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

// e.g. 1.0.0, 1.0.2...
// mainly needed for NCE to avoid setting hooks for one version on a different version,
// doing so would is more likely to crash NCE than Dynarmic
/** Check if game version matches with script version and warn if it doesn't */
function checkVersionMatch() {
    let GetVersionStringAddress = NULL;
    if (Process.platform === "linux" && arch === "arm64") {
        GetVersionStringAddress = __e.findExportByName('_ZNK7FileSys4NACP16GetVersionStringEv');
    } else {
        // other platforms
        return;
    }

    if (GetVersionStringAddress.isNull()) {
        console.warn('Failed to find GetVersionString address');
        return;
    }

    const hook = Interceptor.attach(GetVersionStringAddress, {
        onLeave(retval) {
            hook.detach();
            const DisplayVersion = retval.readUtf8String(); // from nn::oe::DisplayVersion
            const scriptVersion = globalThis.gameVer;
            if (DisplayVersion !== scriptVersion) {
                console.error(`
                    \rScript version '${scriptVersion}' does not match game version '${DisplayVersion}'.
                    \rThe game may crash, or the script may not work as intended!
                `);
            }
        }
    });
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
    aslrOffset = sessionStorage.getItem('ASLR_Offset') ?? aslrOffset;

    const { InitializeStartAddress, CreateProcessParameterArg } = getInitializeAddress();
    if (InitializeStartAddress.isNull()) {
        // throw new Error('Failed to find Initialize start');
        console.log('Failed to find Initialize, using fallback offset', aslrOffset);
        return;
    }

    Interceptor.attach(InitializeStartAddress, {
        onEnter(args) {
            // GetVersionString() is called multiple times when the emulator opens,
            // so putting it inside this Interceptor makes it easier to get the correct
            // version for the game
            checkVersionMatch();

            // 1 for MingW, 2 for MSVC
            const CreateProcessParameter = args[CreateProcessParameterArg];

            const textBytes = '41 70 70 6c 69 63 61 74 69 6f 6e 00'; // Application
            const results = Memory.scanSync(CreateProcessParameter, 0x15, textBytes);
            if (results.length !== 0) {
                const safeAddress = results[0].address;
                const titleId = "0" + safeAddress.add(0x10).readU64().toString(16).toUpperCase();
                const codeAddress = safeAddress.add(0x18).readPointer(); // already has applied offset

                // only used for reattaching NCE for now
                sessionStorage.setItem('Initialize_Params', {
                    codeAddress: codeAddress.toString(10),
                    titleId: titleId,
                });

                const baseAddress = IS_32 ? ptr(0x200000) : ptr(0x80000000);
                const aslrOffsetHex = codeAddress.sub(baseAddress);

                // codeAddress on Dynarmic is around 0x80004000,
                // but on NCE it's like 0x18be72fbd4
                if (aslrOffsetHex.compare(ptr(0x80000000)) > 0) {
                    console.warn(`High code address ${codeAddress}, using NCE hooks...`);
                    sessionStorage.setItem('NCE', true);
                    
                    const RunAddress = __e.getExportByName('_ZN6Kernel8KProcess3RunEim');
                    const runHook = Interceptor.attach(RunAddress, {
                        onLeave() {
                            runHook.detach();
                            hookNce(codeAddress, titleId);
                        }
                    })

                    // doesn't need ASLR calculations
                    return true;
                }

                console.log('ASLR Offset:', aslrOffsetHex);
                aslrOffset = aslrOffsetHex.toUInt32();
                sessionStorage.setItem('ASLR_Offset', aslrOffset);
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
        // entrypoint:       0x1c9342cd440

        // arm64 example
        // descriptor:       0x86346818 <- already emulation address
        // em_address:       0x86346818
        // entrypoint:       0x6ad985bcc8

        // console.warn(`descriptor:       ${descriptor.toString()}
        //             \rem_address:       ${ptr(em_address).toString()}
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
            const name = '_ZN8Dynarmic7Backend5Arm6412AddressSpace19RelinkForDescriptorENS_2IR18LocationDescriptorEPSt4byte'; // android arm64
            const address = __e.getExportByName(name);
            console.log('ARM64 RelinkForDescriptor:', address);
            return address;
        } else {
            console.warn("Unknown architecture?:", arch)
        }
    }
    else {
        // Windows MingW Clang
        //          e8 ba 94 2f 00 48 89 f9 48 89 da 4d 89 f0 e8 54 00 00 00 4c 89 36 4c 89 7e 08 48 83 c7 18 48 8b 03 48 89 44 24 20 48 8b 06 48 89 44 24 28 48 8b 46 08 48 89 44 24 30 48 8d 4c 24 40 4c 8d 44 24 20 48 89 fa e8 de 97 4a 00 // clang 0.0.4-rc3
        //          E8 E2 6F E5 01 48 89 F9 48 89 DA 4D 89 F0 E8 54 00 00 00 4C 89 36 4C 89 7E 08 48 83 C7 18 48 8B 03 48 89 44 24 20 48 8B 06 48 89 44 24 28 48 8B 46 08 48 89 44 24 30 48 8D 4C 24 40 4C 8D 44 24 20 48 89 FA E8 1E 07 00 00 48 89 F0 48 83 C4 50 5B 5F 5E 41 5E 41 5F C3 // clang 0.0.4
        //          24 B0 00 00 00 48 89 F9 48 89 DA 4D 89 F0 E8 6B 00 00 00 4C 89 36 4C 89 7E 08 48 83 C7 18 48 8B 03 48 89 44 24 30 48 8B 06 48 89 44 24 38 48 8B 46 08 48 89 44 24 40 48 8D 54 24 50 4C 8D 44 24 30 48 89 F9 E8 45 09 00 00 48 89 F0 48 83 C4 60 5B 5F 5E 41 5E 41 5F C3 // clang 0.1.0 truncated
        //          e8 ?? ?? ?? ?? 4? 89 f9 4? 89 da 4? 89 f0 e8 ?? ?? ?? ?? 4? 89 36 4? 89 7e 08 4? 83 c7 ?? 4? 8b 03 4? 89 44 ?? ?? 4? 8b 06 4? 89 44 ?? ?? 4? 8b 46 08 4? 89 44 ?? ?? 4? 8d ?? ?4 40 4? 8d ?? ?4 20 4? 89 fa e8 // clang 0.0.4-rc3 frida
        const RegisterBlockSig3 = '4? 89 ?? 4? 89 ?? 4? 89 ?? e8 ?? ?? ?? ?? 4? 89 36 4? 89 ?? ?? ?? ?? ?? ?? 4? 8b ?? 4? 89 44';
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

            let address = NULL;

            if (key.startsWith('0100')) {
                const titleId = key.toUpperCase();
                titleIdToHooks.set(titleId, {});
                for (const addressOffset in object[key]) {
                    const element = object[key][addressOffset];
                    address = IS_32 === true ? uint64(addressOffset).add(0x204000) : uint64(addressOffset).add(0x80004000);
                    operations[address.toString(10)] = element;
                    titleIdToHooks.get(titleId)[address.toString(10)] = element;
                }
                // {
                //     0100A460141B8001: {
                //         [0x80013f20 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
                //     },
            } else {
                const element = object[key];
                address = IS_32 === true ? uint64(key).add(0x204000) : uint64(key).add(0x80004000);
                operations[address.toString(10)] = element;
            }
        }
    }

    if (globalThis.gameVer) console.warn('Game version: ' + globalThis.gameVer);

    Object.keys(sessionStorage).map((key) => {
        const value = sessionStorage.getItem(key);
        // a key will only have this suffix on dynarmic
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

    const isNce = sessionStorage.getItem('NCE');
    if (isNce) {
        const initializeParams = sessionStorage.getItem('Initialize_Params');
        if (initializeParams) {
            const { codeAddress, titleId } = initializeParams;
            hookNce(ptr(codeAddress), titleId);
        } else {
            // first time attaching, not a reattach scenario
            console.warn('No Initialize_Params found in sessionStorage');
        }
    }
}

// separate map for host addresses to operations
const nceOperations = Object.create(null);
let nceTrampolineHook = null;

/**
 * Hooks NCE backend. Requires a custom build of Eden to better expose the
 * emulator to Agent.
 * @param {NativePointer} codeAddress
 * @param {string} titleId
 */
function hookNce(codeAddress, titleId) {
    try {
        ncePullEmulatorLogs();
    } catch (e) {
        throw new Error('Failed to setup NCE logging. Unsupported emulator?\n' + e.stack);
    }

    const NceInstallExternalHook = new NativeFunction(__e.getExportByName('NceInstallExternalHook'), 'bool', ['uint64', 'uint32']);
    const NceClearAllHooks = new NativeFunction(__e.getExportByName('NceClearAllHooks'), 'void', []);
    const nceTrampoline = __e.getExportByName('NceTrampoline');

    // clear previous hooks to handle scenarios where a game loads another game
    NceClearAllHooks();
    for (const key in nceOperations) {
        delete nceOperations[key];
    }

    // https://switchbrew.org/wiki/Rtld
    const magicPattern = '00 00 00 00 08 00 00 00 4d 4f 44 30';
    const magicResults = Memory.scanSync(codeAddress, 0x10000, magicPattern);
    if (magicResults.length === 0) {
        throw new Error('Failed to find MOD0 magic pattern');
    }

    const baseAddress = magicResults.at(-1).address;
    console.warn('NCE Base Address:', baseAddress, codeAddress.sub(baseAddress));

    const titleOperations = Object.create(null);
    if (titleIdToHooks.has(titleId)) {
        const length = Object.keys(titleIdToHooks.get(titleId)).length;
        console.log(`Applying ${length} hooks for titleId ${titleId}`);
        Object.assign(titleOperations, titleIdToHooks.get(titleId));
    } else {
        console.log(`No specific hooks found for titleId ${titleId}, applying global hooks`);
        Object.assign(titleOperations, operations);
    }

    for (const key of titleIdToHooks.keys()) {
        console.log('Known titleId:', key);
    }

    for (const [key, value] of Object.entries(titleOperations)) {
        const em_address = ptr(key); // e.g. 0x80013f94
        const hostAddress = baseAddress.add(em_address.sub(0x80004000)); // pc reg, e.g. 0x18bec83f94
        console.warn(`${em_address} => ${hostAddress}`);

        const op = value;
        if (op === undefined) {
            throw new Error('Missing operation for ' + key);
        }
        nceOperations[hostAddress.toString(10)] = op;

        // see the next few instructions
        console.log(hexdump(hostAddress.sub(0x100), { header: false, ansi: false, length: 0x200 }));

        const expectedInstruction = 0; // skip verification
        const installStatus = NceInstallExternalHook(uint64(hostAddress.toString(10)), expectedInstruction);
        if (installStatus === false) {
            throw new Error('Failed to install NCE hook for ' + hostAddress);
        }

    }

    // NceTrampoline already hooked from multi title game
    if (nceTrampolineHook !== null) {
        console.log("Detaching previous NCE hooks");
        nceTrampolineHook.detach();
        nceTrampolineHook = null;
    } 

    console.log("Hooking nceTrampoline:", nceTrampoline);

    nceTrampolineHook = Interceptor.attach(nceTrampoline, {
        onEnter(args) {
            // console.warn("onEnter: NceTrampoline");
            
            const hostAddress = args[0]; // e.g. 0x18bec83f94
            const context = args[1];
            const op = nceOperations[hostAddress.toString(10)];

            if (op === undefined) {
                console.error('No handler for address: ' + hostAddress);
                return;
            }

            const regs = Object.create(null);
            for (let i = 0; i < 33; i++) {
                regs[i] = { value: context.add(i * 8).readPointer() };
            }
            regs.pc = hostAddress;

            op.call(context, regs);
        }
    });
}

/**
 * Pull emulator logs when the backend is set to NCE. Requires a custom build
 * of Eden to better expose the emulator to Agent.
 * 0 = DEBUG (all logs), 1 = INFO, 2 = WARNING, 3 = ERROR
 * @param {number} minLogLevel
 */
function ncePullEmulatorLogs(minLogLevel = 0) {        
    // Interceptor.attach doesn't work because the NCE logging function is called
    // from within a NativeFunction call context
    const nceRegisterLogCallback = __e.getExportByName('NceRegisterLogCallback');
    if (nceRegisterLogCallback) {
        const levelNames = ["DEBUG", "INFO", "WARNING", "ERROR"];

        // Create callback that the emulator will call directly
        const logCallback = new NativeCallback((level, messagePtr) => {
            if (level >= minLogLevel) {
                const message = messagePtr.readUtf8String();
                const levelStr = levelNames[level] || "UNKNOWN";
                const result = `[Emu ${levelStr}] ${message}`;
                if (level <= 1) {
                    console.info(result);
                }
                else if (level === 2) {
                    console.warn(result);
                }
                else if (level === 3) {
                    console.error(result);
                } else {
                    console.error(`Unknown log level from NCE: ${result}`);
                }
            }
        }, 'void', ['int', 'pointer']);
        
        // Keep reference to prevent GC from collecting the callback?
        globalThis._nceLogCallback = logCallback;
        
        const registerFn = new NativeFunction(nceRegisterLogCallback, 'void', ['pointer']);
        registerFn(logCallback);
    }
}

module.exports = exports = {
    setHook,
};
