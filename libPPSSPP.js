// @name         PPSSPP JIT Hooker
// @version      1.12.3-867+
// @author       [DC]
// @description  windows, linux, mac (x64, arm64), android (arm64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const DoJitPtr = getDoJitAddress();
const buildRegs = createFunction_buildRegs();
const operations = Object.create(null);

// https://github.com/hrydgard/ppsspp/blob/714578a3ad7f9fa670a45281734166077341fa00/Core/MIPS/x86/Jit.cpp#L331
// const u8 *Jit::DoJit(
//    u32 em_address,
//    JitBlock *b
//    )
const breakpoints = {};  // Fix Interceptor freeze (rejit same address)
Interceptor.attach(DoJitPtr, {
    onEnter: function (args) {
        //const Jit_handle = args[0]; // rcx | rdi | x0
        this.em_address = args[1].toInt32(); // rdx | rsi | x1
    },
    onLeave: function (entrypoint) {
        const em_address = this.em_address;
        const op = operations[em_address];
        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            if (breakpoints[entrypoint] !== undefined) return console.log('Skip');
            breakpoints[entrypoint] = em_address;
            Breakpoint.add(entrypoint, function () {
                const thiz = Object.create(null);
                thiz.context = Object.create(null);
                thiz.context.pc = em_address;
                const regs = buildRegs(this.context, thiz); // a0 a1 a2 ...
                //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
                op.call(thiz, regs);
            });
        }
    }
});

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // Unix
        // not __ZN8MIPSComp10IRFrontend5DoJitEjRNSt3__16vectorI6IRInstNS1_9allocatorIS3_EEEERjb
        const names = [
            '_ZN8MIPSComp3Jit5DoJitEjP8JitBlock', // linux x64
            '__ZN8MIPSComp3Jit5DoJitEjP8JitBlock', // macOS x64
            '_ZN8MIPSComp8Arm64Jit5DoJitEjP8JitBlock', // android arm64
            '__ZN8MIPSComp8Arm64Jit5DoJitEjP8JitBlock' // macOS arm64
        ];
        for (const name of names) {
            const addresss = DebugSymbol.findFunctionsNamed(name);
            if (addresss.length !== 0) {
                return addresss[0];
            }
        }
    }
    else {
        // Windows MSVC x64
        // TODO: retroarch, DebugSymbol.fromName?
        const __e = Process.enumerateModules()[0];
        const DoJitSig1 = '48 89 5C 24 10 48 89 74 24 18 48 89 7C 24 20 55 41 54 41 55 41 56 41 57 48 8D AC 24 E0 F5 FF FF 48 81 EC 20 0B 00 00 48 8B 81 30 2A 00 00';
        const first = Memory.scanSync(__e.base, __e.size, DoJitSig1)[0];
        if (first) return first.address;
    }

    throw new Error('RegisterBlock not found!');
}

function createFunction_buildRegs() {
    let body = '';

    // https://github.com/hrydgard/ppsspp/blob/master/Core/MIPS/ARM/ArmRegCache.h
    // https://github.com/hrydgard/ppsspp/blob/master/Core/MIPS/ARM64/Arm64RegCache.h
    // https://github.com/hrydgard/ppsspp/blob/master/Core/MIPS/x86/RegCache.h

    const arch = Process.arch;
    let offR;
    if (arch === 'x64') {
        body += 'const base = context.rbx;'; // MEMBASEREG
        body += 'const regs = context.r14;'; // CTXREG
        offR = -0x80;
    }
    else if (arch === 'arm64') {
        body += 'const base = context.x28;';
        body += 'const regs = context.x27;';
        offR = 0; // state vs x19=sp+base, x20=v0, x21=a0, x22=v1 x23=ra

        body += 'const args = [';

        // a0: ppsspp not update mipstate(regs)?
        body += `
{
    _vm: context.x21,
    get value() { return base.add(this._vm) },
    set vm(val) { this._vm = val; },
    get vm() { return this._vm },
},`;
        // a1 => a3
        for (let i = 1; i < 4; i++) {
            let offset = offR + 0x10 + i * 4;
            body += '{';
            body += `_vm: regs.add(${offset}).readU32(),`;
            body += `get value() { return base.add(this._vm); },`;
            body += `set vm(val) { this._vm = val; },`;
            body += `get vm() { return this._vm },`;
            body += `save() {regs.add(${offset}).writeU32(this._vm); return this; }`;
            body += '},';
        }

        body += '];';


        body += `thiz.returnAddress = context.x23;`;  // ra

        body += 'thiz.context.fp = ';
        body += '{';
        body += `_vm: regs.add(${offR + 4 * 30}).readU32(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offR + 4 * 30}).writeU32(this._vm); return this; }`;
        body += '};';

        body += 'thiz.context.sp = ';
        body += '{';
        body += `_vm: regs.add(${offR + 4 * 29}).readU32(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offR + 4 * 29}).writeU32(this._vm); return this; }`;
        body += '};';

        body += 'return args;';

        return new Function('context', 'thiz', body);
    }
    else if (arch === 'arm') {
        body += 'const base = context.r11;';
        body += 'const regs = context.r10;';
        offR = 0;
    }
    else {
        throw new Error('CTXREG: ' + arch);
    }

    // mips: 0->3 (a0->a3), t0...t7, s0...s7, t8, t9
    body += 'const args = [';
    for (let i = 0; i < 4; i++) {
        // https://github.com/hrydgard/ppsspp/blob/0c40e918c92b897f745abee0d09cf033a1572337/Core/MIPS/MIPS.h#L190
        let offset = offR + 0x10 + i * 4; // skip: zero, at, v0, v1 = 0x10
        body += '{';
        body += `_vm: regs.add(${offset}).readU32(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU32(this._vm); return this; }`;
        body += '},';
    }
    body += '];';

    // https://github.com/hrydgard/ppsspp/blob/0c40e918c92b897f745abee0d09cf033a1572337/Core/MIPS/MIPS.h#L53
    body += `thiz.returnAddress = regs.add(${offR + 4 * 31}).readU32();`; // ra=31
    //body += 'thiz.context.ra = args[30];'; // ra=31 (far) <=> lr
    //body += 'thiz.context.fp = args[30];'; // fp=30 (far)
    body += 'thiz.context.fp = ';
    body += '{';
    body += `_vm: regs.add(${offR + 4 * 30}).readU32(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${offR + 4 * 30}).writeU32(this._vm); return this; }`;
    body += '};';
    //body += 'thiz.context.sp = args[29];'; // sp=29 (far)
    body += 'thiz.context.sp = ';
    body += '{';
    body += `_vm: regs.add(${offR + 4 * 29}).readU32(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${offR + 4 * 29}).writeU32(this._vm); return this; }`;
    body += '};';

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