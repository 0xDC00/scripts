// @name         PCSX2 JIT Hooker
// @version      2.2.0 -> 2.3.257
// @author       logantgt, Mansive, based on work from [DC] and koukdw
// @description  windows, linux, mac (x64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const IS_DEBUG = false;
const FORCE_PATTERN_FALLBACK = false;

const __e = Process.mainModule;
__e.size /= 2;

const symbols = __e.enumerateSymbols();
// console.log(JSON.stringify(Process.mainModule.enumerateSymbols(), null, 2));

//#region Find Addresses

/** @type {Object.<string, NativePointer>} */
const addresses = Object.create(null);

/**
 * Scans a pattern in memory and returns a NativePointer.
 * @param {Object} settings
 * @param {string} settings.name
 * @param {string} settings.pattern
 * @param {NativePointer} [settings.base]
 * @param {number} [settings.size]
 * @param {boolean} [settings.getFirst]
 * @returns {NativePointer}
 */
function getPatternAddress({
    name,
    pattern,
    base = __e.base,
    size = __e.size,
    getFirst = true,
}) {
    /** @type {MemoryScanMatch[]} */
    let results = null;

    try {
        results = Memory.scanSync(base, size, pattern);
    } catch (err) {
        throw new Error(`Error ocurred with [${name}]: ${err.message}`, {
            cause: err,
        });
    }

    if (results.length === 0) {
        throw new RangeError(`[${name}] not found!`);
    } else if (results.length > 1) {
        if (IS_DEBUG) console.warn(`${name} has ${results.length} results`);
    }

    const index = getFirst ? 0 : -1;
    const address = results.at(index).address;

    if (IS_DEBUG) console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);

    return address;
}

/**
 * Scans a pattern in memory and returns a NativePointer for the beginning
 * of the function it's in.
 * @param {Object} settings
 * @param {string} settings.name
 * @param {string} settings.pattern
 * @param {number} [settings.lookbackSize]
 * @returns {NativePointer}
 */
function getFunctionAddress({ name, pattern, lookbackSize = 0x100 }) {
    /** @param {MemoryScanMatch[]} candidates */
    function findFunctionStartAddress(candidates) {
        if (candidates === 0) {
            return null;
        }

        for (let i = candidates.length - 1; i >= 0; i--) {
            const address = candidates[i].address.add(1);
            const ins = Instruction.parse(address);

            if (ins.mnemonic === "push") {
                return address;
            }
        }

        return null;
    }

    const address = getPatternAddress({ name, pattern });
    const base = address.sub(lookbackSize);
    const size = lookbackSize;
    const patterns = ["CC 4?", "CC 5?"];

    for (const pattern of patterns) {
        const results = Memory.scanSync(base, size, pattern);
        const startAddress = findFunctionStartAddress(results);

        if (startAddress !== null) {
            if (IS_DEBUG) console.log(`[${name}Prologue] @ ${address}`);

            return startAddress;
        }
    }

    throw new Error(`Couldn't find start of function for ${name}!`);
}

/** @param {string} symbolName */
function findSymbol(symbolName) {
    const symbol = symbols.find((x) => x.name === symbolName);

    if (IS_DEBUG) console.log(`Symbol:[${symbol.name}] @ ${symbol.address}`);

    return symbol;
}

/** @param {Instruction} ins */
function calculateLeaAddress(ins) {
    if (ins.mnemonic !== "lea") {
        throw new Error("Not lea");
    }

    const memOffset = ins.operands[1].value.disp;

    return ins.next.add(memOffset);
}

// prettier-ignore
function findAddressesThroughDebug() {
    // ?New@BaseBlocks@@QEAAPEAUBASEBLOCKEX@@I_K@Z
    addresses["baseBlocksNew"] = DebugSymbol.findFunctionsNamed("BaseBlocks::New")[0];
    addresses["recRecompile"] = DebugSymbol.findFunctionsNamed("recRecompile")[0];
    addresses["iopRecRecompile"] = DebugSymbol.findFunctionsNamed("iopRecRecompile")[0];
    addresses["recAddBreakpoint"] = DebugSymbol.findFunctionsNamed("CBreakPoints::AddBreakPoint")[0];
    addresses["cpuRegsPtr"] = findSymbol("_cpuRegistersPack").address;
    addresses["eeMem"] = findSymbol("eeMem").address.readPointer();
    addresses["psxRegsPtr"] = findSymbol("psxRegs").address;
    addresses["iopMem"] = findSymbol("iopMem").address.readPointer();
    addresses["dynarecCheckBreakpoint"] = findSymbol("dynarecCheckBreakpoint").address;
    addresses["psxDynarecCheckBreakpoint"] = findSymbol("psxDynarecCheckBreakpoint").address;
}

//prettier-ignore
function findAddressesThroughPattern() {
    addresses["baseBlocksNew"] = getFunctionAddress({
        name: "baseBlocksNew",
        pattern: "4C 8B 40 08 41 80 78 19 00 0F84 ????0000",
        //       "4C 8B 40 08 41 80 78 19 00 0F84 76010000",
    });
    addresses["recRecompile"] = getFunctionAddress({
        name: "recCompile",
        pattern: "48 8B 05 ???????? 48 3B 05 ???????? 72 07",
        //       "48 8B 05 DB0B8303 48 3B 05 DC0B8303 72 07 C6 05 F30B8B03 01",
    });
    addresses["iopRecRecompile"] = getFunctionAddress({
        name: "iopRecRecompile",
        pattern: "81 F9 30160000 0F 84 8A000000 81 FE 90080000",
        //       "81 F9 30160000 0F 84 8A000000 81 FE 90080000",
    });
    addresses["recAddBreakpoint"] = getFunctionAddress({
        name: "recAddBreakpoint",
        lookbackSize: 0x500,
        pattern: "48 83 05 ???????? 50 EB 14 48 8D 0D ???????? 4C 8D 44 24 ?? ?? 89 FA E8",
        //       "48 83 05 4E54460D 50 EB 14 48 8D 0D 3D54460D 4C 8D 44 24 28 48 89 FA E8 98170000"
    });

    {
        // R5900DebugInterface::setRegister
        // could get from DynarecCheckBreakpoint instead
        const cpuRegsLoad = getPatternAddress({
            name: "cpuRegsLoad",
            pattern: "48 8D 15 ???????? 89 84 8A F0030000",
            //       "48 8D 15 4F607A02 89 84 8A F0030000",
        });
        const ins = Instruction.parse(cpuRegsLoad); // lea rdx,[pcsx2-qt._cpuRegistersPack]

        addresses["cpuRegsPtr"] = calculateLeaAddress(ins);
    }
    {
        // R3000DebugInterface::setRegister
        const psxRegsLoad = getPatternAddress({
            name: "psxRegsLoad",
            pattern: "4? ?? ?? 48 8D 15 ???????? 89 04 8A C3",
            //       "41 8B 01 48 8D 15 3E4C7A02 89 04 8A C3",
        });
        let ins = Instruction.parse(psxRegsLoad); // movsxd  rcx,r8d
        ins = Instruction.parse(ins.next); // lea rdx,[pcsx2-qt.psxRegs]

        addresses["psxRegsPtr"] = calculateLeaAddress(ins);
    }

    addresses["eeMem"] = findSymbol("EEmem").address.readPointer();
    addresses["iopMem"] = findSymbol("IOPmem").address.readPointer();

    addresses["dynarecCheckBreakpoint"] = getFunctionAddress({
        name: "dynarecCheckBreakpoint",
        pattern: "8B 35 ???????? 8B 05 ???????? 48 39 05 ???????? 75 0D",
        //       "8B 35 0BA18602 8B 05 1DA28602 48 39 05 8E5B530D 75 0D",
    });
    addresses["psxDynarecCheckBreakpoint"] = getFunctionAddress({
        name: "psxDynarecCheckBreakpoint",
        pattern: "8B 35 ???????? 8B 0D ???????? 31 FF B8 00000000",
        //       "8B 35 6B178802 8B 0D 6D178802 31 FF B8 00000000",
    });
}

if (
    DebugSymbol.findFunctionsNamed("BaseBlocks::New").length >= 1 &&
    FORCE_PATTERN_FALLBACK === false
) {
    console.warn("Using debug symbols");
    findAddressesThroughDebug();
} else {
    console.warn("Using pattern scanning");

    try {
        findAddressesThroughPattern();
    } catch (err) {
        console.error(`
            \rFailed pattern scanning!
            \rInstall debug symbols to make PCSX2 hooking work,
            \ror wait for someone to fix the patterns.
        `);

        throw err;
    }
}

//#endregion

if (IS_DEBUG === true) {
    console.log("\nAddresses:");
    for (const [name, address] of Object.entries(addresses)) {
        console.log(`[${name}] @ ${address}`);
    }
}

const baseBlocksNew = addresses.baseBlocksNew;
const recRecompile = addresses.recRecompile;
const iopRecRecompile = addresses.iopRecRecompile;
const recAddBreakpoint = addresses.recAddBreakpoint;
const cpuRegsPtr = addresses.cpuRegsPtr;
const eeMem = addresses.eeMem;
const psxRegsPtr = addresses.psxRegsPtr;
const iopMem = addresses.iopMem;
const dynarecCheckBreakpoint = addresses.dynarecCheckBreakpoint;
const psxDynarecCheckBreakpoint = addresses.psxDynarecCheckBreakpoint;

const operations = Object.create(null);

const cache = new Map();
Interceptor.attach(baseBlocksNew, function (args) {
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
            console.log("Attach EE:", ptr(startpc));
            jitAttachEE(startpc, recPtr, op);
        }

        // console.log('recRecompile: 0x' + startpc.toString(16) + ' -> ' + recPtr);
    },
});

function jitAttachEE(startpc, recPtr, op) {
    const thiz = Object.create(null, {});
    thiz.context = eeContext;

    Breakpoint.add(recPtr, () => {
        op.call(thiz, op[0]);
        sessionStorage.setItem("PCSX2_EE_" + Date.now(), {
            guest: startpc,
            host: recPtr,
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
            console.log("Attach IOP:", ptr(startpc));
            jitAttachIOP(startpc, recPtr, op);
        }
        // console.log('iopRecRecompile: 0x' + startpc.toString(16) + ' -> ' + recPtr);
    },
});

function jitAttachIOP(startpc, recPtr, op) {
    const thiz = Object.create(null, {});
    thiz.context = iopContext;

    Breakpoint.add(recPtr, () => {
        op.call(thiz, op[0]);
        sessionStorage.setItem("PCSX2_IOP_" + Date.now(), {
            guest: startpc,
            host: recPtr,
        });
    });
}

//#region Contexts

// regs functions take a Typed Array View and run the constructor
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
const eeContext = {
    mem: eeMem,
    r0: function (view) {
        return new view(cpuRegsPtr.readByteArray(16));
    },
    at: function (view) {
        return new view(cpuRegsPtr.add(16).readByteArray(16));
    },
    v0: function (view) {
        return new view(cpuRegsPtr.add(32).readByteArray(16));
    },
    v1: function (view) {
        return new view(cpuRegsPtr.add(48).readByteArray(16));
    },
    a0: function (view) {
        return new view(cpuRegsPtr.add(64).readByteArray(16));
    },
    a1: function (view) {
        return new view(cpuRegsPtr.add(80).readByteArray(16));
    },
    a2: function (view) {
        return new view(cpuRegsPtr.add(96).readByteArray(16));
    },
    a3: function (view) {
        return new view(cpuRegsPtr.add(112).readByteArray(16));
    },
    t0: function (view) {
        return new view(cpuRegsPtr.add(128).readByteArray(16));
    },
    t1: function (view) {
        return new view(cpuRegsPtr.add(144).readByteArray(16));
    },
    t2: function (view) {
        return new view(cpuRegsPtr.add(160).readByteArray(16));
    },
    t3: function (view) {
        return new view(cpuRegsPtr.add(176).readByteArray(16));
    },
    t4: function (view) {
        return new view(cpuRegsPtr.add(192).readByteArray(16));
    },
    t5: function (view) {
        return new view(cpuRegsPtr.add(208).readByteArray(16));
    },
    t6: function (view) {
        return new view(cpuRegsPtr.add(224).readByteArray(16));
    },
    t7: function (view) {
        return new view(cpuRegsPtr.add(240).readByteArray(16));
    },
    s0: function (view) {
        return new view(cpuRegsPtr.add(256).readByteArray(16));
    },
    s1: function (view) {
        return new view(cpuRegsPtr.add(272).readByteArray(16));
    },
    s2: function (view) {
        return new view(cpuRegsPtr.add(288).readByteArray(16));
    },
    s3: function (view) {
        return new view(cpuRegsPtr.add(304).readByteArray(16));
    },
    s4: function (view) {
        return new view(cpuRegsPtr.add(320).readByteArray(16));
    },
    s5: function (view) {
        return new view(cpuRegsPtr.add(336).readByteArray(16));
    },
    s6: function (view) {
        return new view(cpuRegsPtr.add(352).readByteArray(16));
    },
    s7: function (view) {
        return new view(cpuRegsPtr.add(368).readByteArray(16));
    },
    t8: function (view) {
        return new view(cpuRegsPtr.add(384).readByteArray(16));
    },
    t9: function (view) {
        return new view(cpuRegsPtr.add(400).readByteArray(16));
    },
    k0: function (view) {
        return new view(cpuRegsPtr.add(416).readByteArray(16));
    },
    k1: function (view) {
        return new view(cpuRegsPtr.add(432).readByteArray(16));
    },
    gp: function (view) {
        return new view(cpuRegsPtr.add(448).readByteArray(16));
    },
    sp: function (view) {
        return new view(cpuRegsPtr.add(464).readByteArray(16));
    },
    s8: function (view) {
        return new view(cpuRegsPtr.add(480).readByteArray(16));
    },
    ra: function (view) {
        return new view(cpuRegsPtr.add(496).readByteArray(16));
    },
};

const iopContext = {
    mem: iopMem,
    r0: function (view) {
        return new view(psxRegsPtr.readByteArray(4));
    },
    at: function (view) {
        return new view(psxRegsPtr.add(4).readByteArray(4));
    },
    v0: function (view) {
        return new view(psxRegsPtr.add(8).readByteArray(4));
    },
    v1: function (view) {
        return new view(psxRegsPtr.add(12).readByteArray(4));
    },
    a0: function (view) {
        return new view(psxRegsPtr.add(16).readByteArray(4));
    },
    a1: function (view) {
        return new view(psxRegsPtr.add(20).readByteArray(4));
    },
    a2: function (view) {
        return new view(psxRegsPtr.add(24).readByteArray(4));
    },
    a3: function (view) {
        return new view(psxRegsPtr.add(28).readByteArray(4));
    },
    t0: function (view) {
        return new view(psxRegsPtr.add(32).readByteArray(4));
    },
    t1: function (view) {
        return new view(psxRegsPtr.add(36).readByteArray(4));
    },
    t2: function (view) {
        return new view(psxRegsPtr.add(40).readByteArray(4));
    },
    t3: function (view) {
        return new view(psxRegsPtr.add(44).readByteArray(4));
    },
    t4: function (view) {
        return new view(psxRegsPtr.add(48).readByteArray(4));
    },
    t5: function (view) {
        return new view(psxRegsPtr.add(52).readByteArray(4));
    },
    t6: function (view) {
        return new view(psxRegsPtr.add(56).readByteArray(4));
    },
    t7: function (view) {
        return new view(psxRegsPtr.add(60).readByteArray(4));
    },
    s0: function (view) {
        return new view(psxRegsPtr.add(64).readByteArray(4));
    },
    s1: function (view) {
        return new view(psxRegsPtr.add(68).readByteArray(4));
    },
    s2: function (view) {
        return new view(psxRegsPtr.add(72).readByteArray(4));
    },
    s3: function (view) {
        return new view(psxRegsPtr.add(76).readByteArray(4));
    },
    s4: function (view) {
        return new view(psxRegsPtr.add(80).readByteArray(4));
    },
    s5: function (view) {
        return new view(psxRegsPtr.add(84).readByteArray(4));
    },
    s6: function (view) {
        return new view(psxRegsPtr.add(88).readByteArray(4));
    },
    s7: function (view) {
        return new view(psxRegsPtr.add(92).readByteArray(4));
    },
    t8: function (view) {
        return new view(psxRegsPtr.add(96).readByteArray(4));
    },
    t9: function (view) {
        return new view(psxRegsPtr.add(100).readByteArray(4));
    },
    k0: function (view) {
        return new view(psxRegsPtr.add(104).readByteArray(4));
    },
    k1: function (view) {
        return new view(psxRegsPtr.add(108).readByteArray(4));
    },
    gp: function (view) {
        return new view(psxRegsPtr.add(112).readByteArray(4));
    },
    sp: function (view) {
        return new view(psxRegsPtr.add(116).readByteArray(4));
    },
    s8: function (view) {
        return new view(psxRegsPtr.add(120).readByteArray(4));
    },
    ra: function (view) {
        return new view(psxRegsPtr.add(124).readByteArray(4));
    },
};

//#endregion

//prettier-ignore
{
    // replace dynarecCheckBreakpoint (for EE)
    // This results in the same outcome as creating a breakpoint with an unsatisfiable condition in the UI (like 1 < 0)
    Interceptor.replace(dynarecCheckBreakpoint, new NativeCallback(() => { return; }, "void", []));

    // replace psxDynarecCheckBreakpoint (for IOP)
    Interceptor.replace(psxDynarecCheckBreakpoint, new NativeCallback(() => { return; }, "void", []));
}

//prettier-ignore
async function setHookEE(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            var addBp = new NativeFunction(recAddBreakpoint, "void", ["uint8", "uint32", "bool", "bool",]);
            addBp(0x01, parseInt(key), 0x00, 0x01);
        }
    }

    Object.keys(sessionStorage).map((key) => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith("PCSX2_EE_") === true) {
            try {
                const startpc = value.guest;
                const recPtr = ptr(value.host);
                const op = operations[startpc.toString()];
                jitAttachEE(startpc, recPtr, op);
            } catch (e) {
                console.error(e);
            }
        }
    });
}

//prettier-ignore
async function setHookIOP(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            var addBp = new NativeFunction(recAddBreakpoint, "void", ["uint8", "uint32", "bool", "bool"]);
            addBp(0x02, parseInt(key), 0x00, 0x01);
        }
    }

    Object.keys(sessionStorage).map((key) => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith("PCSX2_IOP_") === true) {
            try {
                const startpc = value.guest;
                const recPtr = ptr(value.host);
                const op = operations[startpc.toString()];
                jitAttachIOP(startpc, recPtr, op);
            } catch (e) {
                console.error(e);
            }
        }
    });
}

function asPsxPtr(bytes) {
    return eeContext.mem.add(ptr(new Uint32Array(bytes)[0]));
}

module.exports = exports = {
    setHookEE,
    setHookIOP,
    asPsxPtr,
};

// #endregion
