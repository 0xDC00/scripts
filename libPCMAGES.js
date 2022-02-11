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

function readString(address, table) {
    let s = '', bottom = '', c;
    while ((c = address.readU8()) !== 0xFF) { // terminated
        if (c >= 0x80) {  // readChar
            const charCode = address.readU16();
            address = address.add(2);
            s += mages_decode(charCode, table);
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
                    else if (c2 < 0x20) {
                        address = address.add(1);
                    }
                    else {
                        const charCode = address.readU16();
                        address = address.add(2);

                        bottom += mages_decode(charCode, table);
                    }
                }

                s = s + bottom + ': ';
            }
            else if (c === 2) { // line
                // do nothing -> back to readChar
            }
            else if (c === 4 || c === 0x15) { // SetColor, EvaluateExpression => SKIP
                console.log('Warning: ', c);
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
                                const charCode = address.readU16();
                                address = address.add(2);

                                rubi += mages_decode(charCode, table);
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
                        const charCode = address.readU16();
                        address = address.add(2);

                        c = mages_decode(charCode, table);
                        bottom += c;
                        s += c;
                    }
                }
                console.log('rubi: ', rubi);
                console.log('char: ', bottom);
            }
            else {
                // do nothing (one byte control)
            }
        }
    }
    return s;
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
            console.error('[DialoguesPattern] no result!!');
            return null;
        }
    }

    // get hook address
    let pos = results[0].address.add(dialogSigOffset); // skip (test reg,reg)
    let ins = Instruction.parse(pos);    // parse (je 0x431d57)
    let hookAddress = ins.opStr;         // 0x431d57 (mov mem, reg)
    pos = ins.next;

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

    console.log('Attach:', hookAddress, expr);
    Breakpoint.add(ptr(hookAddress), function() {
        callback.call(this, this.context, expr);
    });

    return hookAddress;
}

module.exports = exports = {
    readString,
    setHookDialog
}