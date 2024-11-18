// @name         Citra JIT Hooker
// @version      r608383e - https://github.com/PabloMK7/citra/releases/tag/r608383e
// @author       [DC]
// @description  windows, linux, macOS (x64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const isFastMem = false;
const DoJitPtr = getDoJitAddress();
const buildRegs = createFunction_buildRegs();
const operations = Object.create(null);
//let EmitX64_vftable, EmitX64_handle;

// Vita3k & Citra
// https://github.com/merryhime/dynarmic/blob/e6f9b08d495449e4ca28882c0cb4f12d83fd4549/src/dynarmic/backend/x64/emit_x64.cpp#L277
// https://github.com/citra-emu/dynarmic/blob/af0d4a7c18ee90d544866a8cf24e6a0d48d3edc4/src/backend/x64/emit_x64.cpp#L267
// EmitX64::BlockDescriptor EmitX64::RegisterBlock(const IR::LocationDescriptor& descriptor, CodePtr entrypoint, CodePtr entrypoint_far, size_t size)
// EmitX64::BlockDescriptor EmitX64::RegisterBlock(const IR::LocationDescriptor& descriptor, CodePtr entrypoint, size_t size)

const isVirtual = Process.arch === 'x64' && Process.platform === 'windows';
const idxDescriptor = isVirtual === true ? 2 : 1;
const idxEntrypoint = idxDescriptor + 1;
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //EmitX64_vftable = args[0]; // rcx
        //EmitX64_handle = args[1]; // rdx
        const descriptor = args[idxDescriptor]; // r8
        const entrypoint = args[idxEntrypoint]; // r9
        //const entrypoint_far = args[4]; // rsp+28
        //const size = args[5]; // rsp+30

        const em_address = descriptor.readU32();
        const op = operations[em_address];
        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            Breakpoint.add(entrypoint, function () {
                const thiz = Object.create(null);
                thiz.context = Object.create(null);
                thiz.context.pc = em_address;
                const regs = buildRegs(this.context, thiz); // x0 x1 x2 ...
                //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
                op.call(thiz, regs);
            });
        }
    }
});

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // Unix
        // not _ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvm.cold
        const names = [
            "_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvm", // linux 64 new
            "_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m", // linux x64
            // __ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m
            "Dynarmic::Backend::X64::EmitX64::RegisterBlock(Dynarmic::IR::LocationDescriptor const&, void const*, unsigned long)", // macOS x64 (demangle)
        ];
        for (const name of names) {
            const addresss = DebugSymbol.findFunctionsNamed(name);
            if (addresss.length !== 0) {
                return addresss[0];
            }
        }
    }
    else {
        const __e = Process.enumerateModules()[0];

        console.warn("Find RegisterBlock");
        // Windows MSVC x64 2019 (v996-) + 2022 (v997+)
        const RegisterBlockSig1 =
            "E8 ?? ?? ?? ?? 4? 8B ?? 4? 8B ?? 4? 8B ?? E8 ?? ?? ?? ?? 4? 89?? 4? 8B???? ???????? 4? 89?? ?? 4? 8B?? 4? 89";
        const RegisterBlock = Memory.scanSync(
            __e.base,
            __e.size,
            RegisterBlockSig1
        )[0];
        if (RegisterBlock) {
            const beginSubSig1 = "CC 40 5? 5? 5?";
            const lookbackSize = 0x400;
            const address = RegisterBlock.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                return subs[subs.length - 1].address.add(1);
            }
        }

        console.warn("Find Patch");
        // fallback to Patch when RegisterBlock not found (wrong signature or target inlined)
        const PatchSig1 =
            "4????? 4????? 4????? FF?? ?? 4????? ?? 4????? 75 ?? 4????? ?? 4?";
        const Patch = Memory.scanSync(__e.base, __e.size, PatchSig1)[0];
        if (Patch) {
            const beginSubSig1 = "4883EC ?? 48";
            const lookbackSize = 0x80;
            const address = Patch.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                idxDescriptor = 1;
                idxEntrypoint = 2;
                return subs[subs.length - 1].address;
            }
        }

        console.warn("Sym RegisterBlock");
        // DebugSymbol: RegisterBlock
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX_K@Z <- new
        // ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX1_K@Z
        const symbols = DebugSymbol.findFunctionsMatching(
            "Dynarmic::Backend::X64::EmitX64::RegisterBlock"
        );
        if (symbols.length !== 0) {
            return symbols[0];
        }

        console.warn("Sym Patch");
        // DebugSymbol: Patch
        // ?Patch@EmitX64@X64@Backend@Dynarmic@@IEAAXAEBVLocationDescriptor@IR@4@PEBX@Z
        const patchs = DebugSymbol.findFunctionsMatching(
            "Dynarmic::Backend::X64::EmitX64::Patch"
        );
        if (patchs.length !== 0) {
            idxDescriptor = 1;
            idxEntrypoint = 2;
            return patchs[0];
        }
    }

    throw new Error('RegisterBlock not found!');
}

// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;';

    let getValue = '';
    if (isFastMem === true) {
        /* fastmem */
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L48
        body += 'const base = context.r13;';

        getValue = `get value() { return base.add(this._vm); },`; // host address
    }
    else {
        /* pageTable */
        // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L45
        body += 'const table = context.r14;';

        const page_bits = 12 // 0xC
        const page_mask = (1 << page_bits) - 1; // 0xFFF

        getValue = `get value() {
            const page = table.add((this._vm >>> ${page_bits}) * 8).readPointer();
            return page.isNull() === true ? page : page.add(this._vm & ${page_mask});
        },`; // host address, null <=> invalid
    }

    // arm32: 0->15 (r0->r15)
    // arm64: 0->30 (x0->lr) + sp (x31) + pc (x32)
    body += 'const args = [';
    for (let i = 0; i < 16; i++) {
        let offset = i * 4;
        body += '{';
        body += `_vm: regs.add(${offset}).readU32(),`;
        body += getValue;
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU32(this._vm); return this; }`;
        body += '},';
    }
    body += '];';

    // body += 'thiz.context.pc = regs.add(60).readU32();'; // r15 0x3c 60
    // body += 'thiz.context.sp = regs.add(52).readU32();'; // r13 0x34 52; useless?advThreadFilter
    body += 'thiz.returnAddress = regs.add(56).readU32();'; // r14 0x38 56; lr
    body += 'thiz.context.lr = args[14];';
    body += 'thiz.context.fp = args[11];'; // r11 (FP): Frame pointer.
    body += 'thiz.context.sp = args[13];'; // r13

    body += 'return args;';
    return new Function('context', 'thiz', body);
};

function setHook(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
        }
    }
}

module.exports = exports = {
    setHook
}