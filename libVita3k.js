// @name         Vita3k JIT Hooker
// @version      0.1.3.2285+ - 
// @author       [DC]
// @description  

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const DoJitPtr = getDoJitAddress();
const buildRegs = createFunction_buildRegs();
const operations = Object.create(null);
//let EmitX64_vftable, EmitX64_handle;

// TODO: Vita3k & Citra
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
                const regs = buildRegs(this.context); // x0 x1 x2 ...

                op.call(thiz, regs);
            });
        }
    }
});

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // Unix
        // not _ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m.cold
        const names = [
            '_ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m', // linux x64
            '__ZN8Dynarmic7Backend3X647EmitX6413RegisterBlockERKNS_2IR18LocationDescriptorEPKvS8_m' // macOS x64
        ];
        for (const name of names) {
            const sym = DebugSymbol.fromName(name);
            if (sym.name !== null) {
                return sym.address;
            }
        }
    }
    else {
        const __e = Process.enumerateModules()[0];
        // Windows MSVC x64 vita3k
        const RegisterBlockSig1 = '40 55 53 56 57 41 54 41 56 41 57 48 8D 6C 24 E9 48 81 EC 90 00 00 00 48 8B ?? ?? ?? ?? ?? 48 33 C4 48 89 45 07 4D 8B F1 49 8B F0 48 8B FA 48 8B D9 4C 8B 7D 77 48 8B 01 48 8D 55 C7 FF 50 10';
        const first = Memory.scanSync(__e.base, __e.size, RegisterBlockSig1)[0];
        if (first) return first.address;
    }

    throw new Error('RegisterBlock not found!');
}

// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    /* fasemem */
    // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_interface.cpp#L48
    body += 'const base = context.r13;';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;';

    /* TODO: pagetable */
    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831

    // arm32: 0->15 (r0->r15) + TODO...
    // arm64: 0->30 (x0->lr) + sp + pc
    body += 'const args = [';
    for (let i = 0; i < 16; i++) {
        let offset = i * 4;
        body += '{';
        body += `_vm: regs.add(${offset}).readU32(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU32(this._vm); return this; }`
        body += '},';
    }
    body += '];'
    body += 'return args;';
    return new Function('context', body);
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