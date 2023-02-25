
// @name         Unreal Engine 4.25+
// @version      
// @author       [DC]
// @description  WIP

const POINTER_SIZE = Process.pointerSize;
const [OFFSET_ID, OFFSET_CLASS, OFFSET_NAME, OFFSET_OUTER] = [0xC, 0x10, 0x18, 0x20];
const __e = Process.enumerateModules()[0];

const cacheObjectName = [];
const cacheObjectFullName = [];
const [FNamePool, GUObjectArray] = getGUObjectArrayAndFNamePool();
const [OFFSET_FUNCTION, GUObjectItemSize] = getUnrealOffsetAndSize();

/** @type {Object.<string, NativePointer>} */
const cacheFunctions = getAllFunctions();

let pmemmove = __e.enumerateImports().find(x => x.name === 'memmove').address; // for unknown format
let getStr = null; // for unknown format (2)

if (module.parent === null) {
    setHookSetText('/Script/UMG.RichTextBlock:SetText', function (thiz, s) {
        const ctx = getObjectFullName(thiz);
        const ctxId = thiz.add(OFFSET_ID).readU32();
        const className = getNameByIndex(thiz.add(OFFSET_CLASS).readPointer().add(OFFSET_NAME).readU32());
        console.warn('---' + thiz + ' ' + ctxId + ' ' + className);
        console.warn(ctx);

        console.log(s);
    });

    // setHookSetText('/Script/UMG.TextBlock:SetText', function (thiz, s) {
    //     const ctx = getFullName(thiz);
    //     const ctxId = thiz.add(OFFSET_ID).readU32();
    //     const className = getNameByIndex(thiz.add(OFFSET_CLASS).readPointer().add(OFFSET_NAME).readU32());
    //     console.warn('---' + ctxId + ' ' + className);
    //     console.warn(ctx);

    //     console.log(s);
    // });
}

/**
 * 
 * @param {string} fullName 
 * @param {{(this: InvocationContext, thiz: NativePointer, s: string): void}} cb 
 * @returns {InvocationListener}
 */
function setHookSetText(fullName, cb) {
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
        console.log('Attach imm: ' + address + ' -> ' + newAddress + ' ' + fullName);
        return Interceptor.attach(newAddress, function () {
            console.log('onEnter');
        });
    }
    else {
        const newAddress = ptr(ins.address);
        console.log('Attach debug: ' + address + ' -> ' + newAddress + ' ' + fullName);

        // FText or FText|unknown (Problem! => after memmove or getstr)
        let listener;
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
                console.log('ReAttach: ' + this.context.pc + ' -> ' + address + ' ' + fullName);
                if (getStr === null) {
                    listener = Interceptor.attach(address, function (args) {
                        cb.call(this, args[0], readFTextString(args[1]))
                    });
                }
                else {
                    listener = Interceptor.attach(address, function (args) {
                        const hook = Interceptor.attach(getStr, {
                            onLeave(retVal) {
                                hook.detach();
                                cb.call(this, thiz, retVal.readPointer().readUtf16String());
                            }
                        })
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
                console.log('Attach imm: ' + address + ' ' + fullName);
                console.log('Attach ret: ' + address2 + ' ' + fullName);

                let thiz;
                const bp1 = Breakpoint.add(address, function () {
                    thiz = this.context.rcx;
                });
                const bp2 = Breakpoint.add(address2, function () {
                    cb.call(this, thiz, this.context.rax.readPointer().readUtf16String());
                })

                listener = {
                    detach: () => {
                        Breakpoint.remove(bp1);
                        Breakpoint.remove(bp2);
                    }
                }
            }
        });
        return { detach: () => listener.detach() };
    }
}

function setHook(fullName, callbackOrProbe) {
    const address = cacheFunctions[fullName];
    if (address === undefined) {
        return console.error("Function not found: " + fullName);
    }

    return Interceptor.attach(address, callbackOrProbe);
}

function readFTextString(address) {
    const data = address.readPointer();
    const length = data.add(0x30).readU32();
    const value = data.add(0x28).readPointer();
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
 * @returns {string}
 */
function getObjectFullName(uObject) {
    const internalIndex = uObject.add(OFFSET_ID).readU32();
    const cache = cacheObjectFullName[internalIndex];
    if (cache !== undefined) return cache;

    const classObject = uObject.add(OFFSET_CLASS).readPointer();
    const nameIndex = uObject.add(OFFSET_NAME).readU32();
    const outerObject = uObject.add(OFFSET_OUTER).readPointer();

    const classNameIndex = classObject.add(OFFSET_NAME).readU32();
    const className = getNameByIndex(classNameIndex);
    const split = className === 'Function' ? ':' : '.';

    let _outerObject = outerObject;
    const outers = [];
    while (_outerObject.isNull() === false) {
        const NamePrivate = _outerObject.add(OFFSET_NAME).readU32();
        const TempString = getNameByIndex(NamePrivate);
        outers.unshift(TempString);

        _outerObject = _outerObject.add(OFFSET_OUTER).readPointer();
    }
    const outerName = outers.join('.');

    const objectName = getNameByIndex(nameIndex);
    const fullName = outerName.length === 0 ? objectName : outerName + split + objectName;
    cacheObjectFullName[internalIndex] = fullName;
    return fullName;
}

function getNameByIndex(nameIndex) {
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
    let j = 0;
    for (let i = 0; ; i++) {
        const uObject = GUObjectArray.add(i * GUObjectItemSize).readPointer();
        if (uObject.isNull() === true) {
            console.log('Found: ' + j + '/' + i);
            break;
        }

        const classObject = uObject.add(OFFSET_CLASS).readPointer();
        const classNameIndex = classObject.add(OFFSET_NAME).readU32();
        const className = getNameByIndex(classNameIndex);
        if (className !== 'Function') {
            continue;
        }

        j++;
        const fullName = getObjectFullName(uObject);
        f[fullName] = uObject.add(OFFSET_FUNCTION).readPointer();
    }

    return f;
}

function getGUObjectArrayAndFNamePool() {
    let FNamePool = null;
    let GUObjectArray = null;
    const c = new CModule(`
char* scan(char* begin, int size, char* v) {
    char* end = begin + size;
    while (begin < end) {
        if (*(char**)begin == v) {
            return begin;
        }
        begin += 8;
    }
    return (void*)0;
}
`);
    const scan = new NativeFunction(c.scan, 'pointer', ['pointer', 'uint', 'pointer']);
    const ranges = Process.enumerateRanges('rw-');
    for (let i = 0; i < ranges.length; i++) {
        try {
            const address = ranges[i].base;
            const sig = address.readU64().toNumber();
            if (FNamePool === null
                && sig === 0x310656e6f4e011e /* 1e 01 4e 6f 6e 65 10 03 */) {
                console.log('Found page0: ' + address);
                const localRanges = __e.enumerateRanges('rw-');
                for (let i = 0; i < localRanges.length; i++) {
                    const range = localRanges[i];
                    let begin = range.base;
                    let size = range.size;
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
                        console.log('GUObjectArray:  ' + GUObjectArray);
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
    if (FNamePool === null || GUObjectArray === null)
        throw new Error("Init Error");

    return [FNamePool, GUObjectArray];
}

function getUnrealOffsetAndSize() {
    const GUObjectItemSize = (function () {
        // begin at 0x20
        for (let i = 4; ; i++) {
            const ptr1 = GUObjectArray.add(i * POINTER_SIZE);
            try {
                ptr1.readPointer().readPointer().readPointer(); // P->ObjectItem->VTable->Func
                return ptr1.sub(GUObjectArray).toInt32();
            }
            catch { };
        }
    })();
    console.log('GUObjectItemSize:  ' + GUObjectItemSize.toString(16));
    console.log(hexdump(GUObjectArray.add(GUObjectItemSize).readPointer()));

    let uObject;
    const OFFSET_FUNCTION = (function () {
        for (let i = 0; ; i++) {
            uObject = GUObjectArray.add(i * GUObjectItemSize).readPointer();
            if (uObject.isNull() === true) {
                break;
            }

            const classObject = uObject.add(OFFSET_CLASS).readPointer();
            const classNameIndex = classObject.add(OFFSET_NAME).readU32();
            const className = getNameByIndex(classNameIndex);
            if (className !== 'Function') {
                continue;
            }

            for (let i = POINTER_SIZE * 3 + 0x10; i < 0x100; i += POINTER_SIZE) {
                try {
                    const func = uObject.add(i * POINTER_SIZE).readPointer();
                    const range = Process.getRangeByAddress(func);
                    if (range.protection.includes('x') === true) {
                        return i;
                    }
                }
                catch { }
            }

            return 0xD8;
        }
    })();
    console.log('OFFSET_FUNCTION:  ' + OFFSET_FUNCTION.toString(16));
    console.log(hexdump(uObject));

    return [OFFSET_FUNCTION, GUObjectItemSize];
}

/**
 * 
 * @param {NativePointer} uObject 
 * @returns {number}
 */
function getObjectId(uObject) {
    return uObject.add(OFFSET_ID).readU32();
}

module.exports = exports = {
    findFunction,
    setHook,
    setHookSetText,
    getObjectFullName,
    getObjectId,
    functions: cacheFunctions
}