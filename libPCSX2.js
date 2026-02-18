// @name         PCSX2 JIT Hooker
// @version      2.2.0 -> 2.6.2
// @author       logantgt, Mansive, based on work from [DC] and koukdw
// @description  windows, linux, mac (x64), android (arm64)

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const IS_DEBUG = false;
const FORCE_PATTERN_FALLBACK = false;
const IGNORE_SETUP_CACHE = false;

const isAndroid = Process.platform === "linux" && Process.arch === "arm64"
const __e =
    isAndroid
        ? Process.getModuleByName("libemucore.so")
        : Process.mainModule ?? Process.enumerateModules()[0];

console.warn("[Compatibility]");
console.warn("PCSX2 2.2.0 -> 2.6.2");
console.warn("ARMSX2 1.0.7");
console.log("[Mirror] Download: https://github.com/koukdw/emulators/releases");

// #region Find Addresses

/** @type {Object.<string, NativePointer>} */
const addresses = Object.create(null);

/** @type {ModuleSymbolDetails[]|null} */
let symbols = null;

const __ranges = isAndroid ? [] : __e.enumerateRanges("r-x");

/**
 * @param {Object} settings
 * @param {RangeDetails[]} settings.ranges
 * @param {string} settings.pattern
 * @param {string} settings.protection
 * @returns {MemoryScanMatch[]}
 */
function scanRanges({ ranges, pattern, protection }) {
    const allMatches = [];

    const perms = protection.split("-");
    for (const range of ranges) {
        if (perms.every((p) => range.protection.includes(p)) === false) {
            continue;
        }
        let rangeMatches = [];
        try {
            rangeMatches = Memory.scanSync(range.base, range.size, pattern);
        } catch (err) {
            continue;
        }

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
 * @param {string} [settings.protection]
 * @returns {NativePointer}
 */
function getPatternAddress({
    name,
    pattern,
    ranges = __ranges,
    getFirst = true,
    protection = "r-x",
}) {
    /** @type {MemoryScanMatch[]} */
    let results = null;

    try {
        results = scanRanges({ ranges: ranges, pattern: pattern, protection: protection });
    } catch (err) {
        throw new Error(`Error occurred with [${name}]: ${err.message}`, {
            cause: err,
        });
    }

    if (results.length === 0) {
        throw new RangeError(`[${name}] not found!`);
    } else if (results.length > 1) {
        if (IS_DEBUG) console.warn(`[${name}] has ${results.length} results`);
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
 * @param {string} [settings.protection]
 * @returns {NativePointer}
 */
function getFunctionAddress({ name, pattern, lookbackSize = 0x100, protection = "r-x" }) {
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

    const address = getPatternAddress({ name, pattern, protection });
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

    throw new Error(`Couldn't find start of function for [${name}]`);
}

/** @param {string} symbolName */
function findSymbol(symbolName) {
    if (symbols === null) {
        symbols = __e.enumerateSymbols();
    }
    const symbol = symbols.find((x) => x.name === symbolName);

    if (IS_DEBUG) console.log(`[${symbol.name}Symbol] @ ${symbol.address}`);

    return symbol;
}

/** @param {Instruction} ins */
function calculateLeaAddress(ins) {
    const mnemonic = ins.mnemonic;

    if (mnemonic !== "lea") {
        throw new Error(`Not lea, got ${mnemonic} instead`);
    }

    const memOffset = ins.operands[1].value.disp;

    return ins.next.add(memOffset);
}

function setupAddressesThroughCache() {
    /** @type {Object.<string, NativePointer>|null} */
    const cachedAddresses = sessionStorage.getItem("PCSX2_ADDRESSES");

    if (cachedAddresses === null) {
        throw new Error("PCSX2_ADDRESSES is missing from SessionStorage");
    }

    for (const [name, address] of Object.entries(cachedAddresses)) {
        addresses[name] = ptr(address);
    }
}

function setupAddressesThroughDebugAndroid() {
    addresses.baseBlocksNew = findSymbol("_ZN10BaseBlocks3NewEjm").address;
    addresses.recRecompile = findSymbol("_ZL12recRecompilej").address;
    addresses.iopRecRecompile = findSymbol("_ZL15iopRecRecompilej").address;
    addresses.recAddBreakpoint = findSymbol("_ZN12CBreakPoints13AddBreakPointE13BreakPointCpujbbb").address;
    addresses.cpuRegs = findSymbol("g_cpuRegistersPack").address;
    addresses.eeMem = findSymbol("EEmem").address;
    addresses.psxRegs = addresses.cpuRegs.add(0x500); // what
    addresses.iopMem = findSymbol("IOPmem").address;
    addresses.dynarecCheckBreakpoint = findSymbol("_Z22dynarecCheckBreakpointv").address;
    addresses.psxDynarecCheckBreakpoint = findSymbol("_ZL25psxDynarecCheckBreakpointv").address;
}

function setupAddressesThroughPatternAndroid() {
    throw new Error("Android pattern scanning isn't implemented yet!");
}

// prettier-ignore
function setupAddressesThroughDebug() {
    // ?New@BaseBlocks@@QEAAPEAUBASEBLOCKEX@@I_K@Z
    addresses.baseBlocksNew = DebugSymbol.findFunctionsNamed("BaseBlocks::New")[0];
    addresses.recRecompile = DebugSymbol.findFunctionsNamed("recRecompile")[0];
    addresses.iopRecRecompile = DebugSymbol.findFunctionsNamed("iopRecRecompile")[0];
    addresses.recAddBreakpoint = DebugSymbol.findFunctionsNamed("CBreakPoints::AddBreakPoint")[0];
    addresses.cpuRegs = findSymbol("_cpuRegistersPack").address;
    addresses.eeMem = findSymbol("eeMem").address;
    addresses.psxRegs = findSymbol("psxRegs").address;
    addresses.iopMem = findSymbol("iopMem").address;
    addresses.dynarecCheckBreakpoint = findSymbol("dynarecCheckBreakpoint").address;
    addresses.psxDynarecCheckBreakpoint = findSymbol("psxDynarecCheckBreakpoint").address;
}

// prettier-ignore
function setupAddressesThroughPattern() {
    addresses.baseBlocksNew = getFunctionAddress({
        name: "baseBlocksNew",
        pattern: "4C 8B 40 08 41 80 78 19 00 0F84 ????0000",
        //       "4C 8B 40 08 41 80 78 19 00 0F84 76010000" v2.2.0
    });
    addresses.recRecompile = getFunctionAddress({
        name: "recCompile",
        pattern: "48 8B 05 ???????? 48 3B 05 ???????? 72 07",
        //       "48 8B 05 DB0B8303 48 3B 05 DC0B8303 72 07 C6 05 F30B8B03 01" v2.2.0
    });
    addresses.iopRecRecompile = getFunctionAddress({
        name: "iopRecRecompile",
        pattern: "81 F9 30160000 0F 84 8A000000 81 FE 90080000",
        //       "81 F9 30160000 0F 84 8A000000 81 FE 90080000" v2.2.0
    });
    addresses.recAddBreakpoint = getFunctionAddress({
        name: "recAddBreakpoint",
        lookbackSize: 0x500,
        pattern: "48 83 05 ???????? ?? EB 14 48 8D 0D ???????? 4C 8D 44 24 ?? ?? 89 ?? E8",
        //       "48 83 05 4E54460D 50 EB 14 48 8D 0D 3D54460D 4C 8D 44 24 28 48 89 FA E8 98170000" v2.2.0
        //       "48 83 05 BAB34F0D 70 EB 14 48 8D 0D A9B34F0D 4C 8D 44 24 20 48 89 C2 E8 C41E0000" v2.3.313
    });

    {
        // R5900DebugInterface::setRegister
        // could get from DynarecCheckBreakpoint instead
        const cpuRegsLoad = getPatternAddress({
            name: "cpuRegsLoad",
            pattern: "48 8D 15 ???????? 89 84 8A F0030000",
            //       "48 8D 15 4F607A02 89 84 8A F0030000" v2.2.0
        });
        const ins = Instruction.parse(cpuRegsLoad); // lea rdx,[pcsx2-qt._cpuRegistersPack]

        addresses.cpuRegs = calculateLeaAddress(ins);
    }

    {
        // R3000DebugInterface::setRegister
        const psxRegsLoad = getPatternAddress({
            name: "psxRegsLoad",
            pattern: "4? ?? ?? 48 8D 15 ???????? 89 04 8A C3",
            //       "41 8B 01 48 8D 15 3E4C7A02 89 04 8A C3" v2.2.0
        });
        let ins = Instruction.parse(psxRegsLoad); // movsxd  rcx,r8d
        ins = Instruction.parse(ins.next); // lea rdx,[pcsx2-qt.psxRegs]

        addresses.psxRegs = calculateLeaAddress(ins);
    }

    addresses.eeMem = findSymbol("EEmem").address;
    addresses.iopMem = findSymbol("IOPmem").address;

    addresses.dynarecCheckBreakpoint = getFunctionAddress({
        name: "dynarecCheckBreakpoint",
        pattern: "8B 40 14 3D 18040000 74 25 3D 20040000 74 1E A9 00040000 74 17 8D 56 04 B9 01000000",
        //       "8B 40 14 3D 18040000 74 25 3D 20040000 74 1E A9 00040000 74 17 8D 56 04 B9 01000000 E8 06030D00 8D 4F 02" v2.2.0
        //       "8B 40 14 3D 18040000 74 25 3D 20040000 74 1E A9 00040000 74 17 8D 56 04 B9 01000000 E8 46F30C00 8D 4F 02" v2.6.0
    });
    addresses.psxDynarecCheckBreakpoint = getFunctionAddress({
        name: "psxDynarecCheckBreakpoint",
        pattern: "B9 03000000 E8 ???????? 48 8B 05 ???????? FF 50 28 40 B7",
        //       "83 C0 FE 83 F8 02 77 16 48 8D 0D DE489400 E8 4126BFFF B9 03000000 E8 9761DBFF 48 8B 05 88CC9E02 FF 50 28 40 B7 01 EB 02 31 FF 89 F8 48 83 C4 58 5B"; // v2.6.0
        //       "83 C0 FE 83 F8 02 77 16 48 8D 0D AD197F00 E8 5D3FC0FF B9 03000000 E8 137DDBFF 48 8B 05 F4178802 FF 50 28 40 B7 01 EB 02 31 FF 89 F8 48 83 C4 30 5B"; // v2.2.0
        lookbackSize: 0x300,
    });
}

// Setup priority:
// 1. Cache
// 2. Debug Symbols
// 3. Pattern Scanning
if (sessionStorage.getItem("PCSX2_ADDRESSES") && IGNORE_SETUP_CACHE === false) {
    console.warn("Using cached addresses");

    setupAddressesThroughCache();
} else {
    const setup = {};
    if (isAndroid) {
        setup.hasSymbols = !!findSymbol("_ZN10BaseBlocks3NewEjm");
        setup.setupAddressesThroughDebug = setupAddressesThroughDebugAndroid;
        setup.setupAddressesThroughPattern = setupAddressesThroughPatternAndroid;
    } else {
        // windows, linux, mac?
        setup.hasSymbols = DebugSymbol.findFunctionsNamed("BaseBlocks::New").length >= 1;
        setup.setupAddressesThroughDebug = setupAddressesThroughDebug;
        setup.setupAddressesThroughPattern = setupAddressesThroughPattern;
    }

    if (setup.hasSymbols && !FORCE_PATTERN_FALLBACK ) {
        console.warn("Using debug symbols");
        setup.setupAddressesThroughDebug();
    } else {
        console.warn("Using pattern scanning");
        try {
            setup.setupAddressesThroughPattern();
        } catch (err) {
            console.error(`
                \rFailed pattern scanning!
                \rInstall debug symbols to make hooking work,
                \ror wait for someone to fix the patterns.
            `);
            throw err;
        }
    }
}

// #endregion

// validate addresses before caching them
for (const [name, address] of Object.entries(addresses)) {
    if (
        address instanceof NativePointer === false ||
        address.isNull() === true
    ) {
        throw new Error(`Invalid address for [${name}]`);
    }
}
sessionStorage.setItem("PCSX2_ADDRESSES", addresses);

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
const cpuRegs = addresses.cpuRegs;
const eeMem = addresses.eeMem;
const psxRegs = addresses.psxRegs;
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
    const thiz = Object.create(null);
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
    const thiz = Object.create(null);
    thiz.context = iopContext;

    Breakpoint.add(recPtr, () => {
        op.call(thiz, op[0]);
        sessionStorage.setItem("PCSX2_IOP_" + Date.now(), {
            guest: startpc,
            host: recPtr,
        });
    });
}

// #region Contexts

// regs functions take a Typed Array View and run the constructor
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
const eeContext = {
    mem: eeMem,
    r0(view) {
        return view(cpuRegs.readByteArray(16));
    },
    at(view) {
        return view(cpuRegs.add(16).readByteArray(16));
    },
    v0(view) {
        return view(cpuRegs.add(32).readByteArray(16));
    },
    v1(view) {
        return view(cpuRegs.add(48).readByteArray(16));
    },
    a0(view) {
        return view(cpuRegs.add(64).readByteArray(16));
    },
    a1(view) {
        return view(cpuRegs.add(80).readByteArray(16));
    },
    a2(view) {
        return view(cpuRegs.add(96).readByteArray(16));
    },
    a3(view) {
        return view(cpuRegs.add(112).readByteArray(16));
    },
    t0(view) {
        return view(cpuRegs.add(128).readByteArray(16));
    },
    t1(view) {
        return view(cpuRegs.add(144).readByteArray(16));
    },
    t2(view) {
        return view(cpuRegs.add(160).readByteArray(16));
    },
    t3(view) {
        return view(cpuRegs.add(176).readByteArray(16));
    },
    t4(view) {
        return view(cpuRegs.add(192).readByteArray(16));
    },
    t5(view) {
        return view(cpuRegs.add(208).readByteArray(16));
    },
    t6(view) {
        return view(cpuRegs.add(224).readByteArray(16));
    },
    t7(view) {
        return view(cpuRegs.add(240).readByteArray(16));
    },
    s0(view) {
        return view(cpuRegs.add(256).readByteArray(16));
    },
    s1(view) {
        return view(cpuRegs.add(272).readByteArray(16));
    },
    s2(view) {
        return view(cpuRegs.add(288).readByteArray(16));
    },
    s3(view) {
        return view(cpuRegs.add(304).readByteArray(16));
    },
    s4(view) {
        return view(cpuRegs.add(320).readByteArray(16));
    },
    s5(view) {
        return view(cpuRegs.add(336).readByteArray(16));
    },
    s6(view) {
        return view(cpuRegs.add(352).readByteArray(16));
    },
    s7(view) {
        return view(cpuRegs.add(368).readByteArray(16));
    },
    t8(view) {
        return view(cpuRegs.add(384).readByteArray(16));
    },
    t9(view) {
        return view(cpuRegs.add(400).readByteArray(16));
    },
    k0(view) {
        return view(cpuRegs.add(416).readByteArray(16));
    },
    k1(view) {
        return view(cpuRegs.add(432).readByteArray(16));
    },
    gp(view) {
        return view(cpuRegs.add(448).readByteArray(16));
    },
    sp(view) {
        return view(cpuRegs.add(464).readByteArray(16));
    },
    s8(view) {
        return view(cpuRegs.add(480).readByteArray(16));
    },
    ra(view) {
        return view(cpuRegs.add(496).readByteArray(16));
    },
};

const iopContext = {
    mem: iopMem,
    r0(view) {
        return view(psxRegs.readByteArray(4));
    },
    at(view) {
        return view(psxRegs.add(4).readByteArray(4));
    },
    v0(view) {
        return view(psxRegs.add(8).readByteArray(4));
    },
    v1(view) {
        return view(psxRegs.add(12).readByteArray(4));
    },
    a0(view) {
        return view(psxRegs.add(16).readByteArray(4));
    },
    a1(view) {
        return view(psxRegs.add(20).readByteArray(4));
    },
    a2(view) {
        return view(psxRegs.add(24).readByteArray(4));
    },
    a3(view) {
        return view(psxRegs.add(28).readByteArray(4));
    },
    t0(view) {
        return view(psxRegs.add(32).readByteArray(4));
    },
    t1(view) {
        return view(psxRegs.add(36).readByteArray(4));
    },
    t2(view) {
        return view(psxRegs.add(40).readByteArray(4));
    },
    t3(view) {
        return view(psxRegs.add(44).readByteArray(4));
    },
    t4(view) {
        return view(psxRegs.add(48).readByteArray(4));
    },
    t5(view) {
        return view(psxRegs.add(52).readByteArray(4));
    },
    t6(view) {
        return view(psxRegs.add(56).readByteArray(4));
    },
    t7(view) {
        return view(psxRegs.add(60).readByteArray(4));
    },
    s0(view) {
        return view(psxRegs.add(64).readByteArray(4));
    },
    s1(view) {
        return view(psxRegs.add(68).readByteArray(4));
    },
    s2(view) {
        return view(psxRegs.add(72).readByteArray(4));
    },
    s3(view) {
        return view(psxRegs.add(76).readByteArray(4));
    },
    s4(view) {
        return view(psxRegs.add(80).readByteArray(4));
    },
    s5(view) {
        return view(psxRegs.add(84).readByteArray(4));
    },
    s6(view) {
        return view(psxRegs.add(88).readByteArray(4));
    },
    s7(view) {
        return view(psxRegs.add(92).readByteArray(4));
    },
    t8(view) {
        return view(psxRegs.add(96).readByteArray(4));
    },
    t9(view) {
        return view(psxRegs.add(100).readByteArray(4));
    },
    k0(view) {
        return view(psxRegs.add(104).readByteArray(4));
    },
    k1(view) {
        return view(psxRegs.add(108).readByteArray(4));
    },
    gp(view) {
        return view(psxRegs.add(112).readByteArray(4));
    },
    sp(view) {
        return view(psxRegs.add(116).readByteArray(4));
    },
    s8(view) {
        return view(psxRegs.add(120).readByteArray(4));
    },
    ra(view) {
        return view(psxRegs.add(124).readByteArray(4));
    },
};

// #endregion

// prettier-ignore
{
    // replace dynarecCheckBreakpoint (for EE)
    // This results in the same outcome as creating a breakpoint with an unsatisfiable condition in the UI (like 1 < 0)
    Interceptor.replace(dynarecCheckBreakpoint, new NativeCallback(() => { return; }, "void", []));

    // replace psxDynarecCheckBreakpoint (for IOP)
    Interceptor.replace(psxDynarecCheckBreakpoint, new NativeCallback(() => { return; }, "void", []));
}

const addBp = new NativeFunction(recAddBreakpoint, "void", ["uint8", "uint32", "bool", "bool"]);
function addBreakpoint(cpu, temp, enabled, stepping) {
    try{
        addBp(cpu, temp, enabled, stepping)
    } catch (e) {
        if (e.message.includes("access violation")) {
            // safe
        } else {
            console.error(e.stack);
        }
    }
}

// prettier-ignore
function setHookEE(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            addBreakpoint(0x01, parseInt(key), 0x00, 0x01);
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

// prettier-ignore
function setHookIOP(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
            addBreakpoint(0x02, parseInt(key), 0x00, 0x01);
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
    return eeContext.mem.readPointer().add(ptr(new Uint32Array(bytes)[0]));
}

function asRawPtr(bytes) {
    return ptr(new Uint32Array(bytes)[0]);
}

module.exports = exports = {
    setHookEE,
    setHookIOP,
    asPsxPtr,
    asRawPtr,
};

// #endregion
