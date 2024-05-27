// @name         RPCS3 LLVM Hooker
// @version      0.0.20-13234+ - https://github.com/RPCS3/rpcs3-binaries-win/releases?q=0.0.20&expanded=true
// @author       [DC]
// @description  windows, TODO: linux, mac (arm64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}
console.warn('RPCS3 0.0.20-13234+');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

const __e = Process.enumerateModules()[0];
if (Process.platform !== 'windows') {
    throw 'TODO: ' + Process.platform + ' ' + Process.arch;
}

const installFunctionPatt1 = '0F8? ???????? 488D?? ?00?0000 E8 ???????? 4883C? 68'; // MSVC
let DoJitMatch = Memory.scanSync(__e.base, __e.size, installFunctionPatt1)[0];
if (!DoJitMatch) {
    const installFunctionPatt2 = '660F 1F440000 488D?? ?00?0000 E8 ???????? 4883C? 68'; // patched
    DoJitMatch = Memory.scanSync(__e.base, __e.size, installFunctionPatt2)[0];
    if (!DoJitMatch) throw new Error('DoJit not found!');
}

const DoJitPtr = DoJitMatch.address;
const operations = Object.create(null);
const buildRegs = createFunction_buildRegs();

// https://github.com/RPCS3/rpcs3/blob/ab50e5483ed428d79bccf0a37b58415f9c8456fd/rpcs3/Emu/Cell/PPUThread.cpp#L3405
const { _emReg, _jitReg } = (function () {
    let p = Instruction.parse(DoJitPtr); // jbe 0x00 ; long jump
    p = Instruction.parse(p.next);       // lea r?x, ss:[rbp+0x1?0]
    p = Instruction.parse(p.next);       // call 0x00
    p = Instruction.parse(p.next);       // add r?x, 0x68
    const _emReg = p.operands[0].value;

    // nop jbe & je:
    let isPPUDebugIfPtr = Memory.scanSync(DoJitPtr.sub(0x40), 0x40, '84C0 ???? 8B')[0]; // je
    if (!isPPUDebugIfPtr) throw new Error('DoJit not found 2!');
    isPPUDebugIfPtr = isPPUDebugIfPtr.address.add(2);
    p = Instruction.parse(isPPUDebugIfPtr.add(0xB)); // lea rdx, ds:[rax+rcx*2]
    const _jitReg = p.operands[0].value;

    Memory.protect(isPPUDebugIfPtr, 0x40, 'rwx');
    DoJitPtr.writeByteArray([0x66, 0x0F, 0x1F, 0x44, 0x00, 0x00]); // 6bytes nop
    isPPUDebugIfPtr.writeByteArray([0x66, 0x90]); // 2bytes nop

    return { _emReg, _jitReg };
})();
console.warn("DoJit: " + DoJitPtr.add(6) + " " + _emReg + " " + _jitReg);
Interceptor.attach(DoJitPtr.add(6), {
    onEnter: function (args) {
        const em_address = this.context[_emReg].readU32(); // func_addr
        const op = operations[em_address];
        if (op !== undefined) {
            const entrypoint = this.context[_jitReg].readPointer().and(0x0000FFFFFFFFFFFF); // ppu_ref
            console.log('Attach:', ptr(em_address), entrypoint, this.context[_jitReg].readPointer());
            jitAttach(em_address, entrypoint, op);
            sessionStorage.setItem('PS3_' + Date.now(), {
                guest: em_address,
                host: entrypoint
            });
        }
    }
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

function createFunction_buildRegs() {
    let body = '';

    body += 'const base = context.rbx;'; // 0x0000000300000000
    body += 'const regs = context.rbp.add(0x18);'; // 0x18 24

    // ppc64: https://www.ibm.com/docs/en/aix/7.1?topic=overview-register-usage-conventions
    // r0: In function prologs.
    // r1: Stack pointer.
    // r2: Table of Contents (TOC) pointer.
    // r3: First word of a function's argument list; first word of a scalar function return.
    // r4: Second word of a function's argument list; second word of a scalar function return.
    // ... r12 (glink)
    body += 'const args = [';
    for (let i = 3; i < 32; i++) { // skip r0 r1 r2
        let offset = i * 8;
        body += '{';
        body += `_vm: regs.add(${offset}).readU64().toNumber(),`;
        body += `get value() { return base.add(this._vm); },`; // host address
        body += `set vm(val) { this._vm = val; },`;
        body += `get vm() { return this._vm },`;
        body += `save() {regs.add(${offset}).writeU64(this._vm); return this; }`;
        body += '},';
    }
    body += '];';
    // r0 r1 r2
    body += 'args[-3]={';
    body += `_vm: regs.add(${0}).readU64().toNumber(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${0}).writeU64(this._vm); return this; }`;
    body += '};';
    body += 'args[-2]={';
    body += `_vm: regs.add(${8}).readU64().toNumber(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${8}).writeU64(this._vm); return this; }`;
    body += '};';
    body += 'args[-1]={';
    body += `_vm: regs.add(${16}).readU64().toNumber(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${16}).writeU64(this._vm); return this; }`;
    body += '};';

    // https://github.com/RPCS3/rpcs3/blob/dcfd29c2d9e911d96b1da5d6dced5443c525de52/rpcs3/Emu/Cell/lv2/sys_ppu_thread.h#L33
    body += `thiz.cr = regs.add(${0x460 - 0x18 - 8 - 4 - 4}).readU32();`; // cr
    body += `thiz.cr1 = regs.add(${0x100}).readU32();`; // cr
    body += `thiz.returnAddress = regs.add(${0x460 - 0x18}).readU64().toNumber();`; // lr
    //body += `thiz.context.ctr = regs.add(${0x468-0x18}).readU64().toNumber();`; // ctr
    //body += `thiz.context.pc = regs.add(${0x474-0x18}).readU64().toNumber();`; // pc (0x470 = VRSAVE 4byte)
    // fp?
    //body += 'thiz.context.sp = args[1];'; // r1 = sp (skiped)
    body += 'thiz.context.sp = ';
    body += '{';
    body += `_vm: regs.add(${1 * 8}).readU64().toNumber(),`;
    body += `get value() { return base.add(this._vm); },`; // host address
    body += `set vm(val) { this._vm = val; },`;
    body += `get vm() { return this._vm },`;
    body += `save() {regs.add(${1 * 8}).writeU64(this._vm); return this; }`;
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
        if (key.startsWith('PS3_') === true) {
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