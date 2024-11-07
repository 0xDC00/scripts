// @name         PCSX2 JIT Hooker
// @version      2.2.0
// @author       logantgt, based on work from [DC] and koukdw 
// @description  windows, linux, mac (x64)

// ?New@BaseBlocks@@QEAAPEAUBASEBLOCKEX@@I_K@Z
const BaseBlocks$New = DebugSymbol.findFunctionsNamed('BaseBlocks::New')[0];
const recRecompile = DebugSymbol.findFunctionsNamed('recRecompile')[0];
const iopRecRecompile = DebugSymbol.findFunctionsNamed('iopRecRecompile')[0];
const recAddBreakpoint = DebugSymbol.findFunctionsNamed('CBreakPoints::AddBreakPoint')[0];

const operations = Object.create(null);

const cache = new Map();
Interceptor.attach(BaseBlocks$New, function (args) {
    const startpc = args[1].toUInt32();
    const recPtr = args[2];
    cache.set(startpc, recPtr);
    //console.warn('New 0x' + startpc.toString(16) + ' ' + recPtr);
});

Interceptor.attach(recRecompile, {
    onEnter(args) {
        this.startpc = args[0].toUInt32();
    },
    onLeave() {
        const startpc = this.startpc;
        const recPtr = cache.get(startpc);

        const op = operations[startpc];
        if (op !== undefined) {
            console.log('Attach EE:', ptr(startpc));
            jitAttachEE(startpc, recPtr, op);
        }

        // console.log('recRecompile: 0x' + startpc.toString(16) + ' -> ' + recPtr);
    }
});

function jitAttachEE(startpc, recPtr, op)
{
    const thiz = Object.create(null, {});
    thiz.context = eeContext;

    Breakpoint.add(recPtr, () => {
        op.call(thiz, op[0]);
        sessionStorage.setItem('PCSX2_EE_' + Date.now(), {
            guest: startpc,
            host: recPtr
        });
    });
}

Interceptor.attach(iopRecRecompile, {
    onEnter(args) {
        this.startpc = args[0].toUInt32();
    },
    onLeave() {
        const startpc = this.startpc;
        const recPtr = cache.get(startpc);

        const op = operations[startpc];
        if (op !== undefined) {
            console.log('Attach IOP:', ptr(startpc));
            jitAttachIOP(startpc, recPtr, op);
        }
        // console.log('iopRecRecompile: 0x' + startpc.toString(16) + ' -> ' + recPtr);
    }
});

function jitAttachIOP(startpc, recPtr, op)
{
    const thiz = Object.create(null, {});
    thiz.context = iopContext;

    Breakpoint.add(recPtr, () => {
        op.call(thiz, op[0]);
        sessionStorage.setItem('PCSX2_IOP_' + Date.now(), {
            guest: startpc,
            host: recPtr
        });
    });
}

const symbols = Process.mainModule.enumerateSymbols();

const cpuRegsPtr = symbols.find(x => x.name === '_cpuRegistersPack').address;
const eeMem = symbols.find(x => x.name === 'eeMem').address.readPointer();
const psxRegsPtr = symbols.find(x => x.name === 'psxRegs').address;
const iopMem = symbols.find(x => x.name ===  'iopMem').address.readPointer();

// regs functions take a Typed Array View and run the constructor
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
const eeContext = {
    mem: eeMem,
    r0: function(view) {
        return new view(cpuRegsPtr.readByteArray(16))
    },
    at: function(view) {
        return new view(cpuRegsPtr.add(16).readByteArray(16))
    },
    v0: function(view) {
        return new view(cpuRegsPtr.add(32).readByteArray(16))
    },
    v1: function(view) {
        return new view(cpuRegsPtr.add(48).readByteArray(16))
    },
    a0: function(view) {
        return new view(cpuRegsPtr.add(64).readByteArray(16))
    },
    a1: function(view) {
        return new view(cpuRegsPtr.add(80).readByteArray(16))
    },
    a2: function(view) {
        return new view(cpuRegsPtr.add(96).readByteArray(16))
    },
    a3: function(view) {
        return new view(cpuRegsPtr.add(112).readByteArray(16))
    },
    t0: function(view) {
        return new view(cpuRegsPtr.add(128).readByteArray(16))
    },
    t1: function(view) {
        return new view(cpuRegsPtr.add(144).readByteArray(16))
    },
    t2: function(view) {
        return new view(cpuRegsPtr.add(160).readByteArray(16))
    },
    t3: function(view) {
        return new view(cpuRegsPtr.add(176).readByteArray(16))
    },
    t4: function(view) {
        return new view(cpuRegsPtr.add(192).readByteArray(16))
    },
    t5: function(view) {
        return new view(cpuRegsPtr.add(208).readByteArray(16))
    },
    t6: function(view) {
        return new view(cpuRegsPtr.add(224).readByteArray(16))
    },
    t7: function(view) {
        return new view(cpuRegsPtr.add(240).readByteArray(16))
    },
    s0: function(view) {
        return new view(cpuRegsPtr.add(256).readByteArray(16))
    },
    s1: function(view) {
        return new view(cpuRegsPtr.add(272).readByteArray(16))
    },
    s2: function(view) {
        return new view(cpuRegsPtr.add(288).readByteArray(16))
    },
    s3: function(view) {
        return new view(cpuRegsPtr.add(304).readByteArray(16))
    },
    s4: function(view) {
        return new view(cpuRegsPtr.add(320).readByteArray(16))
    },
    s5: function(view) {
        return new view(cpuRegsPtr.add(336).readByteArray(16))
    },
    s6: function(view) {
        return new view(cpuRegsPtr.add(352).readByteArray(16))
    },
    s7: function(view) {
        return new view(cpuRegsPtr.add(368).readByteArray(16))
    },
    t8: function(view) {
        return new view(cpuRegsPtr.add(384).readByteArray(16))
    },
    t9: function(view) {
        return new view(cpuRegsPtr.add(400).readByteArray(16))
    },
    k0: function(view) {
        return new view(cpuRegsPtr.add(416).readByteArray(16))
    },
    k1: function(view) {
        return new view(cpuRegsPtr.add(432).readByteArray(16))
    },
    gp: function(view) {
        return new view(cpuRegsPtr.add(448).readByteArray(16))
    },
    sp: function(view) {
        return new view(cpuRegsPtr.add(464).readByteArray(16))
    },
    s8: function(view) {
        return new view(cpuRegsPtr.add(480).readByteArray(16))
    },
    ra: function(view) {
        return new view(cpuRegsPtr.add(496).readByteArray(16))
    }
}

const iopContext = {
    mem: iopMem,
    r0: function(view) {
        return new view(psxRegsPtr.readByteArray(4))
    },
    at: function(view) {
        return new view(psxRegsPtr.add(4).readByteArray(4))
    },
    v0: function(view) {
        return new view(psxRegsPtr.add(8).readByteArray(4))
    },
    v1: function(view) {
        return new view(psxRegsPtr.add(12).readByteArray(4))
    },
    a0: function(view) {
        return new view(psxRegsPtr.add(16).readByteArray(4))
    },
    a1: function(view) {
        return new view(psxRegsPtr.add(20).readByteArray(4))
    },
    a2: function(view) {
        return new view(psxRegsPtr.add(24).readByteArray(4))
    },
    a3: function(view) {
        return new view(psxRegsPtr.add(28).readByteArray(4))
    },
    t0: function(view) {
        return new view(psxRegsPtr.add(32).readByteArray(4))
    },
    t1: function(view) {
        return new view(psxRegsPtr.add(36).readByteArray(4))
    },
    t2: function(view) {
        return new view(psxRegsPtr.add(40).readByteArray(4))
    },
    t3: function(view) {
        return new view(psxRegsPtr.add(44).readByteArray(4))
    },
    t4: function(view) {
        return new view(psxRegsPtr.add(48).readByteArray(4))
    },
    t5: function(view) {
        return new view(psxRegsPtr.add(52).readByteArray(4))
    },
    t6: function(view) {
        return new view(psxRegsPtr.add(56).readByteArray(4))
    },
    t7: function(view) {
        return new view(psxRegsPtr.add(60).readByteArray(4))
    },
    s0: function(view) {
        return new view(psxRegsPtr.add(64).readByteArray(4))
    },
    s1: function(view) {
        return new view(psxRegsPtr.add(68).readByteArray(4))
    },
    s2: function(view) {
        return new view(psxRegsPtr.add(72).readByteArray(4))
    },
    s3: function(view) {
        return new view(psxRegsPtr.add(76).readByteArray(4))
    },
    s4: function(view) {
        return new view(psxRegsPtr.add(80).readByteArray(4))
    },
    s5: function(view) {
        return new view(psxRegsPtr.add(84).readByteArray(4))
    },
    s6: function(view) {
        return new view(psxRegsPtr.add(88).readByteArray(4))
    },
    s7: function(view) {
        return new view(psxRegsPtr.add(92).readByteArray(4))
    },
    t8: function(view) {
        return new view(psxRegsPtr.add(96).readByteArray(4))
    },
    t9: function(view) {
        return new view(psxRegsPtr.add(100).readByteArray(4))
    },
    k0: function(view) {
        return new view(psxRegsPtr.add(104).readByteArray(4))
    },
    k1: function(view) {
        return new view(psxRegsPtr.add(108).readByteArray(4))
    },
    gp: function(view) {
        return new view(psxRegsPtr.add(112).readByteArray(4))
    },
    sp: function(view) {
        return new view(psxRegsPtr.add(116).readByteArray(4))
    },
    s8: function(view) {
        return new view(psxRegsPtr.add(120).readByteArray(4))
    },
    ra: function(view) {
        return new view(psxRegsPtr.add(124).readByteArray(4))
    }
}

// replace dynarecCheckBreakpoint (for EE)
// This results in the same outcome as creating a breakpoint with an unsatisfiable condition in the UI (like 1 < 0)
const dynarecCheckBreakpoint = symbols.find(x => x.name === 'dynarecCheckBreakpoint');
Interceptor.replace(dynarecCheckBreakpoint.address, new NativeCallback(() => { return; }, 'void', []));

// replace psxDynarecCheckBreakpoint (for IOP)
const psxDynarecCheckBreakpoint = symbols.find(x => x.name === 'psxDynarecCheckBreakpoint');
Interceptor.replace(psxDynarecCheckBreakpoint.address, new NativeCallback(() => { return; }, 'void', []));

async function setHookEE(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            var addBp = new NativeFunction(recAddBreakpoint, 'void', ['uint8', 'uint32', 'bool', 'bool']);
            addBp(0x01, parseInt(key), 0x00, 0x01);
        }
    }

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('PCSX2_EE_') === true) {
            try {
                const startpc = value.guest;
                const recPtr = ptr(value.host);
                const op = operations[startpc.toString()];
                jitAttachEE(startpc, recPtr, op);
            }
            catch (e) {
                console.error(e);
            }
        }
    });
}

async function setHookIOP(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            var addBp = new NativeFunction(recAddBreakpoint, 'void', ['uint8', 'uint32', 'bool', 'bool']);
            addBp(0x02, parseInt(key), 0x00, 0x01);
        }
    }

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('PCSX2_IOP_') === true) {
            try {
                const startpc = value.guest;
                const recPtr = ptr(value.host);
                const op = operations[startpc.toString()];
                jitAttachIOP(startpc, recPtr, op);
            }
            catch (e) {
                console.error(e);
            }
        }
    });
}

function asPsxPtr(bytes)
{
    return eeContext.mem.add(ptr(new Uint32Array(bytes)[0]));
}

module.exports = exports = {
    setHookEE,
    setHookIOP,
    asPsxPtr
}