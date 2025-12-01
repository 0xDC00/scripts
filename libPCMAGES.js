// @name         PC MAGES ENGINES
// @version      
// @author       [DC]
// @description  

/*
TODO:
https://github.com/CommitteeOfZero/impacto
compound_chars
https://github.com/CommitteeOfZero/sc3tools
*/
if (module.parent === null) {
    throw "I'm not a text hooker!";
}


const Is4BytesEncoding = globalThis.Is4BytesEncoding;

/**
 * Mail: inbox, outbox, send
 * @param {NativePointer} address 
 * @param {string[]} table
 * @param {boolean} isOut
 * @returns {string}
 */
function readString(address, table, isOut) {
    let s = '', bottom = '', c;
    while ((c = address.readU8()) !== 0xFF) { // terminated
        if (c >= 0xb0) {
            // b4: next page?
            address = address.add(1);
            continue;
        }
        if (c >= 0x80) {  // readChar
            if (!Is4BytesEncoding)
            {
                const charCode = address.readU16();
                address = address.add(2);

                s += mages_decode(charCode, table);
            }
            else {
                const charCode = address.readU32();
                address = address.add(4);
                
                s += mages_decode(charCode, table);
            }
        }
        else { // readControl
            address = address.add(1);
            if (c === 0) { // lineBreak
                s += ' ';
            }
            else if (c === 1) { // speaker
                bottom = '';
                while (true) {
                    let c2 = address.readU8();
                    if (c2 === 2) {
                        address = address.add(1);
                        break;
                    }
                    else if (c2 < 0x80) {
                        address = address.add(1);
                    }
                    else {
                        if (!Is4BytesEncoding)
                        {
                            const charCode = address.readU16();
                            address = address.add(2);

                            bottom += mages_decode(charCode, table);
                        }
                        else {
                            const charCode = address.readU32();
                            address = address.add(4);
                            bottom += mages_decode(charCode, table);
                        }
                    }
                }

                if (bottom.length !== 0) s = s + bottom + ': ';
            }
            else if (c === 2) { // line
                // do nothing -> back to readChar
            }
            else if (c === 4 || c === 0x15) { // SetColor, EvaluateExpression => SKIP
                ////if (c !== 4) console.warn('Warning: ', c, hexdump(address));
                // https://github.com/CommitteeOfZero/SciAdv.Net/blob/32489cd21921079975291dbdce9151ad66f1b06a/src/SciAdvNet.SC3/Text/SC3StringDecoder.cs#L98
                //   https://github.com/CommitteeOfZero/SciAdv.Net/blob/32489cd21921079975291dbdce9151ad66f1b06a/src/SciAdvNet.SC3/Text/StringSegmentCodes.cs#L3
                // https://github.com/shiiion/steinsgate_textractor/blob/master/steinsgatetextractor/sg_text_extractor.cpp#L46
                let token = address.readU8(); // BYTE token = read_single<BYTE>(cur_index);
                if (!token) {
                    address = address.add(1); // return cur_index + 1;
                }
                else {
                    do {
                        if (token & 0x80) {
                            switch (token & 0x60) {
                                case 0:
                                    address = address.add(2); //cur_index += 2;
                                    break;
                                case 0x20:
                                    address = address.add(3); //cur_index += 3;
                                    break;
                                case 0x40:
                                    address = address.add(4); //cur_index += 4;
                                    break;
                                case 0x60:
                                    address = address.add(5); //cur_index += 5;
                                    break;
                                default:
                                    // impossible
                                    break;
                            }
                        } else {
                            address = address.add(2); //cur_index += 2;
                        }
                        token = address.readU8(); //token = read_single<BYTE>(cur_index);
                    } while (token);
                }
            }
            else if (c === 0x0C // SetFontSize
                || c === 0x11 // SetTopMargin
                || c === 0x12 // SetLeftMargin
                || c === 0x13 // STT_GetHardcodedValue: https://github.com/CommitteeOfZero/impacto/blob/master/src/text.cpp#L43
            ) {
                address = address.add(2);
            }
            else if (c === 9) { // ruby (09_text_0A_rubi_0B)
                let rubi = '';
                bottom = '';
                while (true) {
                    let c2 = address.readU8();
                    if (c2 == 0x0A) { // rubi
                        address = address.add(1);
                        while (true) {
                            c2 = address.readU8();
                            if (c2 === 0x0B) { // end rubi
                                // address = address.add(1);
                                break; // break lv2 loop
                            }
                            else if (c2 < 0x20) { // another control
                                address = address.add(1);
                            }
                            else { // rubi
                                if (!Is4BytesEncoding)
                                {
                                    const charCode = address.readU16();
                                    address = address.add(2);

                                    rubi += mages_decode(charCode, table);
                                }
                                else {
                                    const charCode = address.readU32();
                                    address = address.add(4);

                                    rubi += mages_decode(charCode, table);
                                }
                            }
                        } // end while
                    }
                    else if (c2 === 0x0B) { // end rubi
                        address = address.add(1);
                        break; // break lv1 loop
                    }
                    else if (c2 < 0x20) { // another control (color?)
                        address = address.add(1);
                    }
                    else { // char (text)
                        if (!Is4BytesEncoding)
                        {
                            const charCode = address.readU16();
                            address = address.add(2);

                            c = mages_decode(charCode, table);
                        }
                        else {
                            const charCode = address.readU32();
                            address = address.add(4);

                            c = mages_decode(charCode, table);
                        }
                        bottom += c;
                        s += c;
                    }
                }
                if (rubi !== '') {
                    console.log('rubi: ', rubi);
                    console.log('char: ', bottom);
                }
            }
            else if (c === 0x20) {
                s += "LastName";
                address = address.add(1);
            }
            else if (c === 0x21) {
                s += "FirstName";
                address = address.add(1);
            }
            else {
                // do nothing (one byte control)
            }
        }
    }

    return isOut === true ? [s, address.add(1)] : s;
}

function mages_decode(charCode, table) {
    const c = table[charCode]; // index = ((b1 & 0x7F) * 256) + b2;
    if (c) return c;
    return '[' + ptr(charCode) + ']';
}

const __e = Process.enumerateModules()[0];
function setHookDialog(callback) {
    // https://discord.com/channels/867944111557201980/867944111557201983/889822721242972200
    let dialogSigOffset = 2;
    const dialogSig1 = '85?? 74?? 83??01 74?? 83??04 74?? C705 ???????? 01000000';
    let results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        dialogSigOffset = 3;
        const dialogSig2 = '57 85?? 74?? 83??01 74?? 83??04'; // it's same but need debounce; test & merge with dialogSig1?
        results = Memory.scanSync(__e.base, __e.size, dialogSig2);
        if (results.length === 0) {
            console.error('[DialoguesPattern] no result!');
            return null;
        }
    }

    // get hook address
    let pos = results[0].address.add(dialogSigOffset); // skip (test reg,reg)
    let ins = Instruction.parse(pos);    // parse (je 0x431d57)
    let hookAddress = ins.opStr;         // 0x431d57 (mov mem, reg)
    pos = ins.next;

    let nextAddress = pos;
    let argx = -1;

    // find expressions: mov al, byte ptr ds:[reg] => reg
    let expr = '';
    for (let index = 0; index < 200; index++) {
        ins = Instruction.parse(pos);
        //console.log(index, JSON.stringify(ins, null, 2));
        if (ins.mnemonic === 'mov' && ins.size === 2
            && ins.operands[0].type === 'reg' && ins.operands[0].value === 'al'
            && ins.operands[1].type === 'mem') {
            expr = ins.operands[1].value.base;
            break;
        }
        pos = ins.next;
    }

    if (expr === '') {
        console.error('[DialoguesPattern] error!');
        return null;
    }

    // check expr: mov reg, dword ptr ss:[esp+0x14]; 8B5C24 14
    while (nextAddress.compare(pos) !== 0) {
        ins = Instruction.parse(nextAddress);
        if (ins.mnemonic === 'mov' && ins.size === 4
            && ins.operands[0].type === 'reg' && ins.operands[0].value === expr
            && ins.operands[1].type === 'mem') {
            console.log(JSON.stringify(ins, null, 2));
            if (ins.operands[1].value.base === 'esp') {
                argx = ins.operands[1].value.disp >> 2; // div by 4
            }
        }
        nextAddress = ins.next;
    }

    if (argx === -1) {
        console.log('Attach Dialog:', hookAddress, expr);
        Breakpoint.add(ptr(hookAddress), function () {
            callback.call(this, this.context, expr);
        });
    }
    else {
        console.log('Attach Dialog:', hookAddress, expr, argx);
        const disp = argx << 2;
        Breakpoint.add(ptr(hookAddress), function () {
            const ctx = this.context;
            Object.defineProperty(ctx, argx, {
                get() {
                    return ctx.esp.add(disp).readPointer();
                }
            });
            callback.call(this, ctx, argx);
        });
    }

    return hookAddress;
}

function setHookDialog64(callback) {
    // same 32bit (rcx <=> arg0 <=> expr)
    let dialogSigOffset = 2;
    const dialogSig1 = '85?? 74?? 4183??01 74?? 4183??04 74?? 41';
    let results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return null;
    }

    // get hook address
    let pos = results[0].address.add(dialogSigOffset); // skip (test reg,reg)
    let ins = Instruction.parse(pos);    // parse (je 0x431d57)
    pos = ins.next;
    let hookAddress = ins.opStr;         // 0x431d57 (mov mem, reg)

    //// 2nd je have more (computer-system; but include previous dialogue too; check r10=0?unableFilter?)
    //// like hook at top function 
    // ins = Instruction.parse(pos); // cmp reg, 1
    // pos = ins.next;
    // ins = Instruction.parse(pos); // jp 0xAD
    // pos = ins.next;
    // let hookAddress = ins.opStr;  // 0xAD

    // find expressions: movzx edx, byte ptr ds:[reg] => reg
    let expr = '';
    for (let index = 0; index < 200; index++) {
        ins = Instruction.parse(pos);
        //console.log(index, JSON.stringify(ins, null, 2));
        if (ins.mnemonic.startsWith('mov') === true && ins.size === 3
            && ins.operands[0].type === 'reg'
            && ins.operands[1].type === 'mem' && ins.operands[1].size === 1) {
            expr = ins.operands[1].value.base;
            break;
        }
        pos = ins.next;
    }

    if (expr === '') {
        console.error('[DialoguesPattern] error!');
        return null;
    }

    console.log('Attach Dialog:', hookAddress, expr);
    Breakpoint.add(ptr(hookAddress), function () {
        callback.call(this, this.context, expr);

    });

    return hookAddress;
}

/**
 * Mail: inbox, outbox, send,...
 * @param {string[]} table 
 * @param {Function} cb 
 * @returns 
 */
function setHookMail(table, cb) {
    const sig1 = 'E8 ??????00 6A18 50 68 ??010000 E8 ???????? 8B'; // sghd, darling, linear
    let results = Memory.scanSync(__e.base, __e.size, sig1);
    if (results.length === 0) {
        const sig2 = 'E8 ??????00 6A18 ???? B9 ??010000 E8 ???????? 8B'; // sg ellie (calling convention)
        results = Memory.scanSync(__e.base, __e.size, sig2);
        if (results.length === 0) {
            console.warn('[MailPattern] no result!');
            return null;
        }
    }

    results.forEach(result => {
        const pBody = result.address.add(result.size - 6);
        const target = Instruction.parse(pBody);

        console.log('Attach Mail.Body:   ' + pBody);
        let body;
        Breakpoint.add(pBody, function () {
            body = readString(this.context.eax, table);
        });

        let next = target.next;
        while (true) {
            const ins = Instruction.parse(next);
            if (ins.opStr === target.opStr) {
                console.log('Attach Mail.Header: ' + ins.address);
                Breakpoint.add(ins.address, function () {
                    const [subject, nextAddress] = readString(this.context.eax, table, true);
                    const sender = readString(nextAddress, table);
                    const s = 'From: ' + sender + '\r\nSubject: ' + subject + '\r\n' + body;
                    body = '';
                    cb.call(trans, s);
                });
                break;
            }
            next = ins.next;
        }
    });

    return true;
}

module.exports = exports = {
    readString,
    setHookDialog: Process.arch === 'x64' ? setHookDialog64 : setHookDialog,
    setHookMail
}