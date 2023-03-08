
// @name         Unreal Engine 4
// @version      
// @author       [DC]
// @description  WIP
NativePointer.prototype.readFTextString = function () { return readFTextString(this) };
const POINTER_SIZE = Process.pointerSize;
const [OFFSET_ID, OFFSET_CLASS, OFFSET_NAME, OFFSET_OUTER] = [0xC, 0x10, 0x18, 0x20];
const __e = Process.enumerateModules()[0];

const cacheObjectName = [];
const cacheObjectFullName = [];
const [FNamePool, GUObjectArray, getNameByIndex] = getGUObjectArrayAndFNamePool();
const [OFFSET_FUNCTION, GUObjectItemSize] = getUnrealOffsetAndSize();

/** @type {Object.<string, NativePointer>} */
const cacheFunctions = getAllFunctions();
//console.log(JSON.stringify(cacheFunctions, null, 2));
let pmemmove = __e.enumerateImports().find(x => x.name === 'memmove').address; // for unknown format
let getStr = null; // for unknown format (try reuse)

/**
 * 
 * @param {string} fullName 
 * @param {{(this: InvocationContext, thiz: NativePointer, getText: {():string})): void} | InvocationListenerCallbacks} cb 
 * @returns {InvocationListener}
 */
function setHookSetText(fullName, cb) {
    if (cb instanceof Function === false) {
        return setHookSetTextRaw(fullName, cb);
    }

    const address = cacheFunctions[fullName];
    if (address === undefined) {
        return console.error("Function not found: " + fullName);
    }
    console.log('VM: ' + address + ' | ' + fullName);

    // find native function (after restore rcx; only if VM function >0 param)
    let ins, nextAddress = address;
    function InstructionWake(cb) {
        ins = Instruction.parse(nextAddress);
        console.log(ins.address + ' ' + ins.toString());
        while (cb(ins) === false) {
            if (ins.mnemonic[0] !== 'j') {
                nextAddress = ins.next;
            }
            else {
                if (ins.operands[0].type !== 'imm') {
                    nextAddress = ins.next;
                }
                else {
                    nextAddress = ptr(ins.opStr);
                }
            }
            ins = Instruction.parse(nextAddress);
            console.log(ins.address + ' ' + ins.toString());
        }
        nextAddress = ins.next;
    }

    InstructionWake(x => x.mnemonic === 'mov'
        && x.operands[0].type === 'reg'
        && x.operands[1].value === 'rcx'
    );

    const targetReg = ins.operands[0].value;
    InstructionWake(x => x.mnemonic === 'mov'
        && x.operands[0].value === 'rcx'
        && x.operands[1].value === targetReg
    );

    InstructionWake(x => x.mnemonic === 'call');

    if (ins.operands[0].type === 'imm') {
        const newAddress = ptr(ins.opStr);
        console.warn('Attach imm: ' + address + ' -> ' + newAddress + ' ' + fullName);
        return Interceptor.attach(newAddress, cb);
    }
    else {
        const newAddress = ptr(ins.address);
        console.warn('Attach debug: ' + address + ' -> ' + newAddress + ' ' + fullName);

        // FText or FText|unknown (Problem! => after memmove or getstr)
        let listener = {};
        const bp = Breakpoint.add(newAddress, function () {
            Breakpoint.remove(bp);

            const memValue = ins.operands[0].value;
            const address = this.context[memValue.base].add(memValue.disp * memValue.scale).readPointer();

            //// Find memmove call
            const memmoveStr = pmemmove.toString();
            let haveMemMove;
            ins = Instruction.parse(address);
            while (ins.mnemonic !== 'ret') {
                if (ins.mnemonic === 'call') {
                    if (ins.operands[0].type === 'imm') {
                        if (ins.opStr === memmoveStr) {
                            haveMemMove = true;
                            break;
                        }

                        let ins2 = Instruction.parse(ptr(ins.opStr));
                        if (ins2.mnemonic[0] === 'j') {
                            const op = ins2.operands[0];
                            if (op.type === 'imm') {
                                if (ins2.opStr === memmoveStr) {
                                    haveMemMove = true;
                                    break;
                                }
                            }
                            else {
                                const address = ins2.next.add(op.value.disp * op.value.scale).readPointer();
                                if (address.toString() === memmoveStr) {
                                    haveMemMove = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                ins = Instruction.parse(ins.next);
            }

            if (haveMemMove !== true) {
                // normal hook (may error)
                console.warn('ReAttach: ' + this.context.pc + ' -> ' + address + ' ' + fullName);
                if (getStr === null) {
                    listener = Interceptor.attach(address, function (args) {
                        const read = readFTextString.bind(null, args[1]);
                        cb.call(this, args[0], read)
                    });
                }
                else {
                    listener = Interceptor.attach(address, function (args) {
                        const hook = Interceptor.attach(getStr, {
                            onLeave(retVal) {
                                hook.detach();
                                const read = () => retVal.readPointer().readUtf16String();
                                cb.call(this, thiz, read);
                            }
                        });
                    });
                }
            }
            else {
                // dual break (getStr call)
                ins = Instruction.parse(address);
                console.log(ins.address + ' ' + ins.toString());
                while (ins.mnemonic !== 'call') {
                    ins = Instruction.parse(ins.next);
                    console.log(ins.address + ' ' + ins.toString());
                }
                //getStr = ptr(ins.opStr);

                const address2 = ins.next;
                console.warn('Attach imm: ' + address + ' ' + fullName);
                console.warn('Attach ret: ' + address2 + ' ' + fullName);

                let thiz;
                const bp1 = Breakpoint.add(address, function () {
                    thiz = this.context.rcx;
                });
                const bp2 = Breakpoint.add(address2, function () {
                    const read = () => this.context.rax.readPointer().readUtf16String();
                    cb.call(this, thiz, read);
                })

                listener.detach = () => {
                    Breakpoint.remove(bp1);
                    Breakpoint.remove(bp2);
                };
            }
        });
        return { detach: () => listener.detach() };
    }
}

/**
 * 
 * @param {string} fullName 
 * @param {InvocationListenerCallbacks} callbackOrProbe 
 * @returns {InvocationListener}
 */
function setHookSetTextRaw(fullName, callbackOrProbe) {
    const address = cacheFunctions[fullName];
    if (address === undefined) {
        return console.error("Function not found: " + fullName);
    }
    console.log('VM: ' + address + ' | ' + fullName);

    // find native function (after restore rcx; only if VM function >0 param)
    let ins, nextAddress = address;
    function InstructionWake(cb) {
        ins = Instruction.parse(nextAddress);
        console.log(ins.address + ' ' + ins.toString());
        while (cb(ins) === false) {
            if (ins.mnemonic[0] !== 'j') {
                nextAddress = ins.next;
            }
            else {
                if (ins.operands[0].type !== 'imm') {
                    nextAddress = ins.next;
                }
                else {
                    nextAddress = ptr(ins.opStr);
                }
            }
            ins = Instruction.parse(nextAddress);
            console.log(ins.address + ' ' + ins.toString());
        }
        nextAddress = ins.next;
    }

    InstructionWake(x => x.mnemonic === 'mov'
        && x.operands[0].type === 'reg'
        && x.operands[1].value === 'rcx'
    );

    const targetReg = ins.operands[0].value;
    InstructionWake(x => x.mnemonic === 'mov'
        && x.operands[0].value === 'rcx'
        && x.operands[1].value === targetReg
    );

    InstructionWake(x => x.mnemonic === 'call');

    if (ins.operands[0].type === 'imm') {
        const newAddress = ptr(ins.opStr);
        console.warn('Attach imm: ' + address + ' -> ' + newAddress + ' ' + fullName);
        return Interceptor.attach(newAddress, callbackOrProbe);
    }
    else {
        const newAddress = ptr(ins.address);
        console.warn('Attach debug: ' + address + ' -> ' + newAddress + ' ' + fullName);

        let listener;
        const bp = Breakpoint.add(newAddress, function () {
            Breakpoint.remove(bp);

            const memValue = ins.operands[0].value;
            const address = this.context[memValue.base].add(memValue.disp * memValue.scale).readPointer();

            listener = Interceptor.attach(address, callbackOrProbe);
        });
        return { detach: () => listener.detach() };
    }
}

/**
 * 
 * @param {string} fullName 
 * @param {InvocationListenerCallbacks} callbackOrProbe 
 * @returns {InvocationListener}
 */
function setHook(fullName, callbackOrProbe) {
    const address = cacheFunctions[fullName];
    if (address === undefined) {
        return console.error("Function not found: " + fullName);
    }

    try {
        console.warn('Attach VM: ' + fullName + ' ' + address);
        return Interceptor.attach(address, callbackOrProbe);
    }
    catch {
        followJmp(address);

        function followJmp2(newAddress) {
            try {
                console.warn('Attach VM imm: ' + fullName + ' ' + address + ' -> ' + newAddress);
                return Interceptor.attach(newAddress, callbackOrProbe);
            }
            catch {
                let ins = Instruction.parse(newAddress);
                let size = 0;
                while (true) {
                    size += ins.size;
                    if (size >= 14) break;
                    if (ins.mnemonic === 'jmp') {
                        const op = ins.operands[0];
                        if (op.type === 'imm') {
                            return followJmp2(ptr(ins.opStr));
                        }
                        else {
                            throw new Error('Error');
                        }
                    }
                    ins = Instruction.parse(ins.next);
                }
                throw new Error('Error');
            }
        }

        function followJmp(address) {
            const ins = Instruction.parse(address);
            if (ins.mnemonic === 'jmp') {
                const op = ins.operands[0];
                if (op.type === 'imm') {
                    followJmp2(ptr(ins.opStr));
                }
                else {
                    throw new Error('Error');
                }
            }
            else {
                throw new Error('Error');
            }
        }
    }
}

function readFTextString(address) {
    const data = address.readPointer();
    //console.log(hexdump(data));

    let length;
    let value;
    const ptr1 = data.add(POINTER_SIZE).readPointer();
    if (ptr1.isNull() !== true) {
        try {
            if (data.add(0x30).readPointer().isNull() === true)
                return ''; // force empty

            const data2 = data.add(0x18).readPointer().add(0x38).readPointer().add(0x20).readPointer();
            value = data2.readPointer();
            length = data2.add(POINTER_SIZE).readU32();
        }
        catch {
            console.error("ERROR: " + address + ' ' + data);
            console.error(hexdump(data));
            value = data.add(0x28).readPointer();
            length = data.add(0x30).readU32();
        }
    }
    else {
        length = data.add(0x30).readU32();
        const len = data.add(0x40).readU32();
        if (length === len) {
            value = data.add(0x28).readPointer();
        }
        else {
            value = data.add(0x48).readPointer();
            length = data.add(0x50).readU32();
        }

    }

    if (length === 0) return '';
    return value.readUtf16String(length - 1);
}

/**
 * 
 * @param {string} fullName 
 * @returns {NativePointer}
 */
function findFunction(fullName) {
    const fn = cacheFunctions[fullName];
    return fn === undefined ? null : fn;
}

/**
 * 
 * @param {NativePointer} uObject 
 * @returns {number}
 */
function getObjectId(uObject) {
    return uObject.add(OFFSET_ID).readU32();
}

/**
 * 
 * @param {NativePointer} uObject 
 * @returns {string}
 */
function getObjectClassName(uObject) {
    return getNameByIndex(uObject.add(OFFSET_CLASS).readPointer().add(OFFSET_NAME).readU32());
}

/**
 * 
 * @param {NativePointer} uObject 
 * @returns {string}
 */
function getObjectFullName(uObject) {
    const internalIndex = uObject.add(OFFSET_ID).readU32();
    const cache = cacheObjectFullName[internalIndex];
    if (cache !== undefined) return cache;

    const className = getObjectClassName(uObject);
    const split = className === 'Function' ? ':' : '.';

    const outerObject = uObject.add(OFFSET_OUTER).readPointer();
    let _outerObject = outerObject;
    const outers = [];
    while (_outerObject.isNull() === false) {
        const NamePrivate = _outerObject.add(OFFSET_NAME).readU32();
        const TempString = getNameByIndex(NamePrivate);
        outers.unshift(TempString);

        _outerObject = _outerObject.add(OFFSET_OUTER).readPointer();
    }
    const outerName = outers.join('.');

    const nameIndex = uObject.add(OFFSET_NAME).readU32();
    const objectName = getNameByIndex(nameIndex);

    const fullName = outerName.length === 0 ? objectName : outerName + split + objectName;
    cacheObjectFullName[internalIndex] = fullName;
    return fullName;
}

function _getNameByIndex_below423(nameIndex) {
    const cache = cacheObjectName[nameIndex];
    if (cache !== undefined) return cache;

    const FNameEntryArr = FNamePool.add((nameIndex >> 14) * POINTER_SIZE).readPointer();
    const FNameEntry = FNameEntryArr.add((nameIndex % 0x4000) * POINTER_SIZE).readPointer();
    const name = FNameEntry.add(0x10).readCString();

    cacheObjectName[nameIndex] = name;
    return name;
}

function _getNameByIndex(nameIndex) {
    const cache = cacheObjectName[nameIndex];
    if (cache !== undefined) return cache;

    const blockIndex = nameIndex >> 0x10;
    const offset = (nameIndex & 0xFFFF) << 1;

    const address = FNamePool.add(blockIndex * POINTER_SIZE).readPointer().add(offset);
    const FName = address.readU16();
    const length = FName >> 6;
    const isWide = FName & 1;

    let name;
    if (length > 0 && length < 250) {
        if (isWide === 1) {
            name = address.add(2).readUtf16String(length);
        }
        else {
            name = address.add(2).readCString(length);
        }
    }
    else {
        name = 'None';
    }

    cacheObjectName[nameIndex] = name;
    return name;
}

function getAllFunctions() {
    const f = Object.create(null);
    let numFunc = 0, total = 0;

    const pointers = GUObjectArray.readPointer();
    for (let j = 0; ; j++) {
        const GUObjectArray0 = pointers.add(j * POINTER_SIZE).readPointer();
        if (GUObjectArray0.isNull() === true) {
            break;
        }

        const range = Process.getRangeByAddress(GUObjectArray0);
        const stop = range.base.add(range.size);
        console.log('GUObjectArray page' + j + ' ' + range.base + ' ' + ptr(range.size));

        for (let i = 0; ; i++) {
            const pUObject = GUObjectArray0.add(i * GUObjectItemSize);
            if (pUObject.compare(stop) >= 0) {
                total += i;
                break;
            }
            const uObject = pUObject.readPointer();
            if (uObject.isNull() === true) {
                continue;
            }

            const classObject = uObject.add(OFFSET_CLASS).readPointer();
            const classNameIndex = classObject.add(OFFSET_NAME).readU32();
            const className = getNameByIndex(classNameIndex);
            if (className !== 'Function') {
                continue;
            }

            numFunc++;
            const fullName = getObjectFullName(uObject); //console.log(uObject, uObject.add(OFFSET_FUNCTION).readPointer() + ' ' + fullName);
            f[fullName] = uObject.add(OFFSET_FUNCTION).readPointer();
        }
    }
    console.log('Found: ' + numFunc + '/' + total);

    return f;
}

function getUnrealOffsetAndSize() {
    const GUObjectArray0 = GUObjectArray.readPointer().readPointer();
    const GUObjectItemSize = (function () {
        // begin at 0x10
        for (let i = 2; ; i++) {
            const ptr1 = GUObjectArray0.add(i * POINTER_SIZE);
            try {
                ptr1.readPointer().readPointer().readPointer(); // P->ObjectItem->VTable->Func
                return ptr1.sub(GUObjectArray0).toInt32();
            }
            catch { };
        }
    })();
    console.log('GUObjectItemSize:  ' + GUObjectItemSize.toString(16));
    console.log(hexdump(GUObjectArray0.add(GUObjectItemSize).readPointer()));

    let uObject;
    const OFFSET_FUNCTION = (function () {
        let index = 0;
        for (let i = 0; ; i++) {
            uObject = GUObjectArray0.add(i * GUObjectItemSize).readPointer();
            if (uObject.isNull() === true) {
                break;
            }

            const classObject = uObject.add(OFFSET_CLASS).readPointer();
            const classNameIndex = classObject.add(OFFSET_NAME).readU32();
            const className = getNameByIndex(classNameIndex);
            if (className !== 'Function') {
                continue;
            }
            if (index++ !== 3) {
                continue;
            }
            for (let i = POINTER_SIZE * 3 + 0x10; i < 0x100; i += POINTER_SIZE) {
                try {
                    const func = uObject.add(i).readPointer();
                    if (func.isNull() === true) {
                        continue;
                    }
                    const range = Process.getRangeByAddress(func);
                    if (range.protection.includes('x') === true) {
                        return i;
                    }
                }
                catch { }
            }

            console.warn('use default');
            return _getNameByIndex === getNameByIndex ? 0xD8 /* 4.23+ */ : 0xB0;
        }
    })();
    console.log('OFFSET_FUNCTION:  ' + OFFSET_FUNCTION.toString(16));
    console.log(hexdump(uObject));

    return [OFFSET_FUNCTION, GUObjectItemSize];
}

/**
 * <4.23
 * @param {RangeDetails[]} ranges 
 */
function getGUObjectArrayAndFNamePool_below423(ranges, GUObjectArray) {
    let FNamePool = null;
    const N = ranges.length;
    for (let i = 0; i < N; i++) {
        const address = ranges[i].base;
        try {
            const addressIntProp = address.add(0x48);
            const sig = addressIntProp.readU64().toNumber();
            if (FNamePool === null && sig === 0x65706f7250746e49 /* 49 6e 74 50 72 6f 70 65 */) {
                console.log('FNamePool page0: ' + address); // FNameEntry
                let luckyFNameEntryArr = null;
                for (let i = 1; i < 7; i++) {
                    let maybe = address.sub(i * 0x10000);
                    try {
                        if (maybe.readPointer().equals(address) === true) {
                            luckyFNameEntryArr = maybe;
                            console.log('luckyFNameEntryArr: ' + maybe);
                            break;
                        }
                    } catch { }; // maybe may invalid pointer
                }

                if (luckyFNameEntryArr !== null) {
                    for (let i = 1; i < 7; i++) {
                        let maybe = luckyFNameEntryArr.sub(i * 0x10000);
                        try {
                            for (let j = 0; j < 20; j++) {
                                const address = maybe.add(j * POINTER_SIZE);
                                if (address.readPointer().equals(luckyFNameEntryArr) === true) {
                                    FNamePool = address;
                                    console.log('luckyFNamePool: ' + address);
                                    break;
                                }
                            }

                        } catch { }; // maybe may invalid pointer
                    }
                }

                if (FNamePool === null) {
                    if (luckyFNameEntryArr === null) {
                        luckyFNameEntryArr = (() => {
                            for (let i = 0; i < N; i++) {
                                const range = ranges[i].base;
                                if (range.readPointer().equals(address) === true) {
                                    console.log('FNameEntryArr: ' + range);
                                    return range;
                                }
                            }
                            throw new Error("FNameEntryArr not found!");
                        })();
                    }

                    FNamePool = (() => {
                        for (let i = 0; i < N; i++) {
                            const range = ranges[i].base;
                            for (let j = 0; j < 20; j++) {
                                const tmp = range.add(j * POINTER_SIZE);
                                if (tmp.readPointer().equals(luckyFNameEntryArr) === true) {
                                    console.log('FNamePool: ' + tmp);
                                    return tmp;
                                }
                            }
                        }
                        throw new Error("FNameEntryArrArr not found!");
                    })();
                }
            }
            else if (GUObjectArray === null) {
                try {
                    if (address.readPointer().add(POINTER_SIZE).readU32() === 1 /* ObjectFlags */) {
                        try {
                            address.readPointer().readPointer().readPointer();
                            if (address.add(POINTER_SIZE).readS32() === -1) {
                                continue;
                            }
                            GUObjectArray = address;
                            console.log('GUObjectArray page0:  ' + GUObjectArray);
                            console.log(hexdump(GUObjectArray, { length: 0x60 }));
                        }
                        catch { }
                    }
                }
                catch { };
            }
            else if (FNamePool !== null && GUObjectArray !== null) {
                break;
            }
        }
        catch { }
    }

    if (FNamePool !== null && GUObjectArray !== null) {
        console.log('Scan...');
        const readPointer = new NativeCallback(p => {
            try {
                return p.readPointer();
            }
            catch { return NULL; }
        }, 'pointer', ['pointer']);

        const c = new CModule(`
#include <glib.h>
extern const char* readPointer(const char* address);

char* scan(char* begin, const int size, const char* v) {
    char* end = begin + size;
    while (begin < end) {
        const char* p = *(char**)begin;
        if (((gsize)p & 0xF) == 0 && readPointer(p) == v) {
            return begin;
        }
        begin += 0x10; // sizeof(gsize)
    }
    return (void*)0;
}
`, { readPointer: readPointer });

        const scan = new NativeFunction(c.scan, 'pointer', ['pointer', 'uint', 'pointer']);

        const localRanges = __e.enumerateRanges('rw-');
        const N = localRanges.length;
        for (let i = 0; i < N; i++) {
            const range = localRanges[i];
            const pGUObjectArray = scan(range.base, range.size, GUObjectArray);
            if (pGUObjectArray.isNull() === false) {
                console.log('GUObjectArray: ' + pGUObjectArray, pGUObjectArray.readPointer());
                return [FNamePool, pGUObjectArray, _getNameByIndex_below423];
            }
        }

        const pGUObjectArray = Memory.alloc(Process.pageSize);
        const _GUObjectArrayItems = pGUObjectArray.add(8);
        pGUObjectArray.writePointer(_GUObjectArrayItems);
        console.warn('Fake GUObjectArray: ' + pGUObjectArray);

        _GUObjectArrayItems.writePointer(GUObjectArray); // TODO: scan...

        globalThis.GUObjectArray = pGUObjectArray;
        return [FNamePool, pGUObjectArray, _getNameByIndex_below423];
    }

    throw new Error("[Init Error] GUObjectArray: " + GUObjectArray + ' FNamePool: ' + FNamePool);
}

function getGUObjectArrayAndFNamePool() {
    let FNamePool = null;
    let GUObjectArray = null;
    const c = new CModule(`
#include <glib.h>

char* scan(char* begin, const int size, const char* v) {
    char* end = begin + size;
    while (begin < end) {
        if (*(char**)begin == v) {
            return begin;
        }
        begin += sizeof(gsize);
    }
    return (void*)0;
}
`);
    let rangeFNamePool;
    const scan = new NativeFunction(c.scan, 'pointer', ['pointer', 'uint', 'pointer']);
    const ranges = Process.enumerateRanges('rw-');
    for (let i = 0; i < ranges.length; i++) {
        try {
            const address = ranges[i].base;
            const sig = address.readU64().toNumber();
            if (FNamePool === null
                && sig === 0x310656e6f4e011e /* 1e 01 4e 6f 6e 65 10 03 */) {
                console.log('FNamePool page0: ' + address);
                const localRanges = __e.enumerateRanges('rw-');
                for (let i = 0; i < localRanges.length; i++) {
                    rangeFNamePool = localRanges[i];
                    let begin = rangeFNamePool.base;
                    let size = rangeFNamePool.size;
                    while (size > 0) {
                        const found = scan(begin, size, address);
                        if (found.isNull() === false) {
                            const max = found.sub(4).readS32();
                            const len = found.sub(8).readS32();
                            if (len <= 0 || max <= 0 || max < len) {
                                const next = found.add(POINTER_SIZE);
                                size -= next.sub(begin).toInt32();
                                begin = next;
                                continue;
                            }

                            FNamePool = found;
                            console.log(hexdump(address, { length: 0x40 }));
                            console.log('FNamePool: ' + FNamePool);
                            console.log(hexdump(FNamePool, { length: 0x40 }));
                        }

                        break;
                    }
                    if (FNamePool !== null) break;
                }
            }
            else if (GUObjectArray === null && sig === 0x10000) {
                const temp = address.add(POINTER_SIZE);
                try {
                    if (temp.readPointer().add(POINTER_SIZE).readU32() === 1 /* ObjectFlags */) {
                        GUObjectArray = temp;
                        console.log('GUObjectArray page0:  ' + GUObjectArray);
                        console.log(hexdump(GUObjectArray, { length: 0x60 }));
                    }
                }
                catch { }
            }
            else if (FNamePool !== null && GUObjectArray !== null) {
                break;
            }
        }
        catch { }
    }

    if (FNamePool !== null && GUObjectArray !== null) {
        console.log('Scan...');
        const readPointer = new NativeCallback(p => {
            try {
                return p.readPointer();
            }
            catch { return NULL; }
        }, 'pointer', ['pointer']);

        const c = new CModule(`
#include <glib.h>
extern const char* readPointer(const char* address);

char* scan(char* begin, const int size, const char* v) {
    char* end = begin + size;
    while (begin < end) {
        const char* p = *(char**)begin;
        if (((gsize)p & 0xF) == 0 && readPointer(p) == v) {
            return begin;
        }
        begin += 0x10;
    }
    return (void*)0;
}
`, { readPointer: readPointer });

        const scan = new NativeFunction(c.scan, 'pointer', ['pointer', 'uint', 'pointer']);
        let pGUObjectArray = scan(rangeFNamePool.base, rangeFNamePool.size, GUObjectArray);
        if (pGUObjectArray.isNull() === false) {
            console.log('GUObjectArray: ' + pGUObjectArray, pGUObjectArray.readPointer());
            return [FNamePool, pGUObjectArray, _getNameByIndex];
        }

        pGUObjectArray = Memory.alloc(Process.pageSize);
        const _GUObjectArrayItems = pGUObjectArray.add(8);
        pGUObjectArray.writePointer(_GUObjectArrayItems);
        console.warn('Fake GUObjectArray: ' + pGUObjectArray);

        let found = 0;
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const address = range.base;
            const sig = address.readU64().toNumber();
            if (sig === 0x10000) {
                const temp = address.add(POINTER_SIZE);
                try {
                    temp.readPointer().readPointer().readPointer()
                    _GUObjectArrayItems.add(found++ * POINTER_SIZE).writePointer(temp);
                }
                catch { }
            }
        }

        globalThis.GUObjectArray = pGUObjectArray;
        return [FNamePool, pGUObjectArray, _getNameByIndex];
    }
    else if (FNamePool === null) {
        return getGUObjectArrayAndFNamePool_below423(ranges, GUObjectArray);
    }
    throw new Error("[Init Error] GUObjectArray: " + GUObjectArray + ' FNamePool: ' + FNamePool);
}

module.exports = exports = {
    findFunction,
    setHook,
    setHookSetText,
    getObjectClassName,
    getObjectFullName,
    getObjectId,
    functions: cacheFunctions
}