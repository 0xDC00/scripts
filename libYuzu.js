// @name         Yuzu JIT Hooker
// @version      
// @author       [DC]
// @description  TODO: linux

const __e = Process.enumerateModules()[0];
if (Process.platform !== 'windows') {
    throw 'TODO: ' + Process.platform + ' ' + Process.arch;
}

 // MSVC
const RegisterBlockSig1 = '40 55 53 56 57 41 54 41 56 41 57 48 8D 6C 24 E9 48 81 EC ?? 00 00 00 48 ?? ?? ?? ?? ?? ?? 48';
const DoJitMatch = Memory.scanSync(__e.base, __e.size, RegisterBlockSig1)[0];
if (!DoJitMatch)
    throw new Error('RegisterBlock not found!');

const DoJitPtr = DoJitMatch.address;
const operations = Object.create(null);
const buildRegs = createFunction_buildRegs();
//let EmitX64_vftable;
/*
https://github.com/merryhime/dynarmic/blob/e6f9b08d495449e4ca28882c0cb4f12d83fd4549/src/dynarmic/backend/x64/emit_x64.cpp
EmitX64::BlockDescriptor EmitX64::RegisterBlock(
    const IR::LocationDescriptor& descriptor,
    CodePtr entrypoint,
    CodePtr entrypoint_far,
    size_t size
    )
=>
EmitX64::BlockDescriptor *__fastcall EmitX64::RegisterBlock(
    EmitX64 *this, // rcx (vftable)
    EmitX64::BlockDescriptor *result, // rdx
    const LocationDescriptor *descriptor, // r8
    const void *entrypoint, // r9
    const void *entrypoint_far, // [rsp+230]
    unsigned __int64 size) // [rsp+238]
*/
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //EmitX64_vftable = args[0]; // rcx
        //EmitX64_result = args[1]; // rdx
        const descriptor = args[2]; // r8
        const entrypoint = args[3]; // r9
        //const entrypoint_far = args[4];
        //const size = args[5];

        const em_address = descriptor.readU64().toNumber();
        const op = operations[em_address];
        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            Breakpoint.add(entrypoint, function () {
                const thiz = Object.create(null);
                thiz.returnAddress = this.context.r15.add(0xF0).readU64().toNumber(); // SP
                thiz.context = Object.create(null);
                thiz.context.pc = em_address;
                const regs = buildRegs(this.context); // x0 x1 x2 ...

                op.call(thiz, regs);
            });
        }
    }
});

// https://en.wikipedia.org/wiki/Calling_convention#ARM_(A64)
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_jitstate.h
// https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a32_jitstate.h
function createFunction_buildRegs() {
    let body = '';

    /* fasemem */
    // https://github.com/merryhime/dynarmic/blob/master/src/dynarmic/backend/x64/a64_interface.cpp#L43
    body += 'const base = context.r13;';

    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L481
    body += 'const regs = context.r15;';

    /* TODO: pagetable */
    // https://github.com/merryhime/dynarmic/blob/0c12614d1a7a72d778609920dde96a4c63074ece/src/dynarmic/backend/x64/a64_emit_x64.cpp#L831

    // arm32: 0->15 (r0->r15) + TODO...
    // arm64: 0->30 (x0->lr) + sp + pc
    body += 'const args = [';
    for (let i = 0; i < 16; i++) {
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