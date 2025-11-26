// @name         Vita3k JIT Hooker
// @version      0.2.0 3742+ -
// @author       [DC]
// @description  windows, linux, macOS (x64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

console.warn('[Compatibility]');
console.warn('Vita3k 0.2.0 3742+');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

const arch = Process.arch;
const buildRegs = createFunction_buildRegs();
const operations = Object.create(null);
//let EmitX64_vftable, EmitX64_handle;

// TODO: Vita3k & Citra
// https://github.com/merryhime/dynarmic/blob/e6f9b08d495449e4ca28882c0cb4f12d83fd4549/src/dynarmic/backend/x64/emit_x64.cpp#L277
// https://github.com/citra-emu/dynarmic/blob/af0d4a7c18ee90d544866a8cf24e6a0d48d3edc4/src/backend/x64/emit_x64.cpp#L267
// EmitX64::BlockDescriptor EmitX64::RegisterBlock(const IR::LocationDescriptor& descriptor, CodePtr entrypoint, CodePtr entrypoint_far, size_t size)
// EmitX64::BlockDescriptor EmitX64::RegisterBlock(const IR::LocationDescriptor& descriptor, CodePtr entrypoint, size_t size)
const isVirtual = arch === 'x64' && Process.platform === 'windows';
let idxDescriptor = isVirtual === true ? 2 : 1;
let idxEntrypoint = idxDescriptor + 1;
const DoJitPtr = getDoJitAddress();
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //EmitX64_vftable = args[0]; // rcx
        //EmitX64_handle = args[1]; // rdx
        const descriptor = args[idxDescriptor]; // r8
        const entrypoint = args[idxEntrypoint]; // r9
        //const entrypoint_far = args[4]; // rsp+28
        //const size = args[5]; // rsp+30

        let em_address;

        if (arch === 'x64') {
            em_address = descriptor.readU32();
        } else if (arch === 'arm64') {
            // em_address = descriptor.and(0xffffffff).toUInt32();
            em_address = descriptor.toUInt32();
        }

        const op = operations[em_address];

        // x64 example
        // descriptor:       0xcf4e85ec30
        // em_address:       0x801de246    
        // entrypoint:       0x29879b99080 

        // arm64 example
        // descriptor:       0x180123d90
        // em_address:       0x80123d90
        // entrypoint:       0x70183263a0

        // console.warn(`descriptor:       ${descriptor.toString()}
        //             \rem_address:       ${ptr(em_address).toString()}
        //             \rentrypoint:       ${ptr(entrypoint.toString())}
        //             `);

        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            jitAttach(em_address, entrypoint, op);
            sessionStorage.setItem('PSVita_' + Date.now(), {
                guest: em_address,
                host: entrypoint
            });
        }
    },
});

function jitAttach(em_address, entrypoint, op) {
    const thiz = Object.create(null);
    thiz.context = Object.create(null);
    thiz.context.pc = em_address;
    Breakpoint.add(entrypoint, function () {
        const regs = buildRegs(this.context, thiz); // x0 x1 x2 ...
        //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
        op.call(thiz, regs);
    });
}

/**
 * @param {Object} settings
 * @param {RangeDetails[]} settings.ranges
 * @param {string} settings.pattern
 * @returns {MemoryScanMatch[]}
 */
function scanRanges({ ranges, pattern }) {
    const allMatches = [];

    for (const range of ranges) {
        const rangeMatches = Memory.scanSync(range.base, range.size, pattern);

        if (rangeMatches.length !== 0) {
            allMatches.push(...rangeMatches);
        }
    }

    return allMatches;
}

/**
 * Scans a pattern in memory and returns a NativePointer.
 * @param {Object} settings
 * @param {string} settings.name
 * @param {string} settings.pattern
 * @param {RangeDetails[]} [settings.ranges]
 * @param {boolean} [settings.getFirst]
 * @returns {NativePointer}
 */
function getPatternAddress({
    name,
    pattern,
    ranges = __ranges,
    getFirst = true,
}) {
    /** @type {MemoryScanMatch[]} */
    let results = null;

    try {
        results = scanRanges({ ranges: ranges, pattern: pattern });
    } catch (err) {
        throw new Error(`Error occurred with [${name}]: ${err.message}`, {
            cause: err,
        });
    }

    if (results.length === 0) {
        throw new RangeError(`[${name}] not found!`);
    } else if (results.length > 1) {
        console.warn(`[${name}] has ${results.length} results`);
    }

    const index = getFirst ? 0 : -1;
    const address = results.at(index).address;

    return address;
}

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        if (Process.arch === 'x64') {
            // Unix
            // not _ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m.cold
            const names = [
                '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvm', // linux 64 new
                '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m', // linux x64
                // __ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m
                'Dynarmic::Backend::X64::EmitX64::RegisterBlock(Dynarmic::IR::LocationDescriptor const&, void const*, void const*, unsigned long)', // macOS x64 (demangle)
            ];
            for (const name of names) {
                const addresss = DebugSymbol.findFunctionsNamed(name);
                if (addresss.length !== 0) {
                    return addresss[0];
                }
            }
        } else if (Process.arch === 'arm64') {
            // Android
            const RelinkForDescriptorSig = "6c 05 c1 78 9f ?? ?? 31 ?1 ?? ?? 54 ?? 0? 00 91 ?f 0? ?? eb 61 ff ff 54 03 00 00 14 ?f 0? ?? eb ?1 ?? ?? 54 e8 03 40 f9 08 15 40 f9";
            const __e = Process.findModuleByName("libVita3K.so");
            const ranges = __e.enumerateRanges("r-x");
            ranges.forEach(range => console.warn(JSON.stringify(range, null, 2)));
            const address = getPatternAddress({
                name: "RelinkForDescriptor",
                pattern: RelinkForDescriptorSig,
                ranges: ranges,
            });
            if (address.isNull() === false) {
                const lookbackSize = 0x80
                const subAddress = address.sub(lookbackSize);
                const subResults = Memory.scanSync(subAddress, lookbackSize, "f? ?? ?? a9 f? ?? ?? a9");
                if (subResults.length !== 0) {
                    return subResults.at(-1).address;
                }
            }
        }
    } else {
        const __e = Process.enumerateModules()[0];
        // Windows MSVC x64 vita3k
        const RegisterBlockSig1 =
            '40 55 53 56 57 41 54 41 56 41 57 48 8D 6C 24 E9 48 81 EC 90 00 00 00 48 8B ?? ?? ?? ?? ?? 48 33 C4 48 89 45 07 4D 8B F1 49 8B F0 48 8B FA 48 8B D9 4C 8B 7D 77 48 8B 01 48 8D 55 C7 FF 50 10';
        let first = Memory.scanSync(__e.base, __e.size, RegisterBlockSig1)[0];
        if (first) return first.address;

        // DebugSymbol: RegisterBlock
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX_K@Z <- new
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX1_K@Z
        const symbols = DebugSymbol.findFunctionsMatching(
            'Dynarmic::Backend::X64::EmitX64::RegisterBlock'
        );
        if (symbols.length !== 0) {
            console.warn('Sym RegisterBlock');
            return symbols[0];
        }

        const PatchBlockSig1 = '4C 8B DC 49 89 5B ?? 49 89 6B ?? 56 57 41 54 41 56 41 57 48 83';
        first = Memory.scanSync(__e.base, __e.size, PatchBlockSig1)[0];
        if (first) {
            console.warn('Sig Patch');
            idxDescriptor = 1;
            idxEntrypoint = 2;
            return first.address;
        }
    }

    throw new Error('RegisterBlock not found!');
}

// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    if (arch === 'x64') {
        /* fastmem */
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L48
        body += 'const base = context.r13;';

        // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
        body += 'const regs = context.r15;';
    } else if (arch === 'arm64') {
        body += 'const base = context.x25;'
        body += 'const regs = context.x28.add(24);'
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

    //body += 'thiz.context.pc = regs.add(60).readU32();'; // r15 0x3c 60
    //body += 'thiz.context.sp = regs.add(52).readU32();'; // r13 0x34 52; useless?
    body += 'thiz.returnAddress = regs.add(56).readU32();'; // r14 0x38 56; lr
    body += 'thiz.context.lr = args[14];';
    body += 'thiz.context.fp = args[11];'; // r11 (FP): Frame pointer.
    body += 'thiz.context.sp = args[13];'; // r13

    body += 'return args;';
    return new Function('context', 'thiz', body);
}

function setHook(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
        }
    }

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('PSVita_') === true) {
            try {
                const em_address = value.guest;
                const entrypoint = ptr(value.host);
                const op = operations[em_address.toString(10)];
                console.warn('Re-Attach: ' + ptr(em_address) + ' ' + entrypoint);
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

