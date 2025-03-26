// @name         PPSSPP JIT Hooker
// @version      1.12.3-867 -> 1.18.1-1464
// @author       [DC]
// @description  windows, linux, mac (x64, arm64), android (arm64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}
console.warn('[Compatibility]');
console.warn('PPSSPP v1.12.3-867 -> v1.18.1-1464');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

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
        this.em_address = args[1].toUInt32(); // rdx | rsi | x1
    },
    onLeave: function (entrypoint) {
        const em_address = this.em_address;
        const op = operations[em_address];
        if (op !== undefined) {
            console.log('Attach:', ptr(em_address), entrypoint);
            if (jitAttach(em_address, entrypoint, op) === true) {
                sessionStorage.setItem('PSP_' + Date.now(), {
                    guest: em_address,
                    host: entrypoint
                });
            }
        }
    }
});

function jitAttach(em_address, entrypoint, op) {
    if (breakpoints[entrypoint] !== undefined) return console.log('Skip');
    breakpoints[entrypoint] = em_address;

    const thiz = Object.create(null);
    thiz.context = Object.create(null);
    thiz.context.pc = em_address;
    Breakpoint.add(entrypoint, function () {
        const regs = buildRegs(this.context, thiz); // a0 a1 a2 ...
        //console.log(JSON.stringify(thiz, (_, value) => { return typeof value === 'number' ? '0x' + value.toString(16) : value; }, 2));
        op.call(thiz, regs);
    });

    return true;
}

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // Unix
        // not __ZN8MIPSComp10IRFrontend5DoJitEjRNSt3__16vectorI6IRInstNS1_9allocatorIS3_EEEERjb
        const names = [
            '_ZN8MIPSComp3Jit5DoJitEjP8JitBlock', // linux x64
            // __ZN8MIPSComp3Jit5DoJitEjP8JitBlock
            'MIPSComp::Jit::DoJit(unsigned int, JitBlock*)', // macOS x64 (demangle)
            '_ZN8MIPSComp8Arm64Jit5DoJitEjP8JitBlock', // android arm64
            // __ZN8MIPSComp8Arm64Jit5DoJitEjP8JitBlock
            'MIPSComp::Arm64Jit::DoJit(unsigned int, JitBlock*)' // macOS arm64 (demangle)
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
        // const DoJitSig1 = 'C7 83 ?? 0? 00 00 11 00 00 00 F6 83 ?? 0? 00 00 01 C7 83 ?? 0? 00 00 E4 00 00 00';
        const DoJitSig1 = 'C7 83 ?? 0? 00 00 11 00 00 00 F6 83 ?? 0? 00 00 01';
        const first = Memory.scanSync(__e.base, __e.size, DoJitSig1)[0];

        if (first) {
            // const beginSubSig1 = '55 41 ?? 41 ?? 41';
            const beginSubSig1 = "CC 4? 89 ?? 24";
            const lookbackSize = 0x100;
            const address = first.address.sub(lookbackSize);
            const subs = Memory.scanSync(address, lookbackSize, beginSubSig1);
            if (subs.length !== 0) {
                return subs[subs.length - 1].address.add(1);
            }
        };
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

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('PSP_') === true) {
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