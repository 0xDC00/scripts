// @name         Yuzu JIT Hooker
// @version      908+
// @author       [DC]
// @description  

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const DoJitPtr = getDoJitAddress();
const buildRegs = createFunction_buildRegs();
const operations = Object.create(null);

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
const isVirtual = Process.arch === 'x64' && Process.platform === 'windows';
const idxDescriptor = isVirtual === true ? 2 : 1;
const idxEntrypoint = idxDescriptor + 1;
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //EmitX64_vftable = args[0]; // rcx
        //EmitX64_result = args[1]; // rdx
        const descriptor = args[idxDescriptor]; // r8
        const entrypoint = args[idxEntrypoint]; // r9
        //const entrypoint_far = args[4];
        //const size = args[5];

        const em_address = descriptor.readU64().toNumber();
        const op = operations[em_address];
        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            Breakpoint.add(entrypoint, function () {
                const thiz = Object.create(null);
                //thiz.returnAddress = this.context.r15.add(0xF0).readU64().toNumber(); // SP (useless?)
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
        // Windows MSVC x64
        // TODO: DebugSymbol.fromName?
        // yuzu win msvc  ?RegisterBlock@EmitX64@X64@Backend@Dynarmic@@IEAA?AUBlockDescriptor@1234@AEBVLocationDescriptor@IR@4@PEBX1_K@Z
        const RegisterBlockSig1 = 'E8 ?? ?? ?? ?? 48 8B ?? 08 E8 ?? ?? ?? ?? 4? 8B ?? 4? 8B ?? 4? 8B ?? E8 ?? ?? ?? ?? 4?';
        const first = Memory.scanSync(__e.base, __e.size, RegisterBlockSig1)[0];
        if (first) {
            const beginSubSig1 = 'CC CC 40 5? 5? 5?';
            const lookbackSize = 0x400;
            const address = first.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length > 0) {
                return subs[subs.length-1].address.add(2);
            }
        }
    }

    throw new Error('RegisterBlock not found!');
}

// https://en.wikipedia.org/wiki/Calling_convention#ARM_(A64)
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_jitstate.h
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    /* fasemem */
    // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_interface.cpp#L43
    body += 'const base = context.r13;';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;'; // x28

    /* TODO: pagetable */
    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831

    // arm32: 0->15 (r0->r15) + TODO...
    // arm64: 0->30 (x0->lr) + sp + pc
    body += 'const args = [';
    for (let i = 0; i < 31; i++) {
        let offset = i * 8;
        body += '{';
        body += `_vm: regs.add(${offset}).readU64().toNumber(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU64(this._vm); return this; }`
        body += '},';
    }
    body += '];'
    body += 'return args;';
    
    return new Function ('context', body);
};

function setHook(object) {
    //console.log(JSON.stringify(object, null, 2));
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