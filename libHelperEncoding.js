// @name         Custom Encoding
// @version      
// @author       [DC]
// @description  

/**
 * 
 * @param {string} path 
 * @param {undefined | function(Uint8Array, number): boolean | [number, string]} callback true=break | false=pass | [len,str]=processed
 * @param {undefined | function(Uint8Array, number):[number, string]} fallback [len,str]
 * @returns 
 */
function encoding(path, callback, fallback) {
    if (new.target === undefined) {
        return new encoding(path, callback, fallback);
    }

    let _decoder, _encoder, _fallbackDecode;
    const splited = path.split('|', 2);
    if (splited.length === 2) {
        // standard encoding + control + ...
        const label = splited[1];
        path = splited[0];

        _decoder = new TextDecoder(label);
        _encoder = new TextEncoder(label);
    }
    else if (path.endsWith('.txt') == false) {
        // standard encoding
        _decoder = new TextDecoder(path);
        _encoder = new TextEncoder(path);
        /** @type {function(ArrayBuffer,number): boolean} */
        this.decode = _decoder.decode;
        this.encode = _encoder.encode;
        return;
    }

    const tbl = loadTable(path);
    const [table, dyn, maxByteCount, maxDynCount, maxTerCount, isTerminated, isTerminatedCode] = tbl;
    const maxAllCount = Math.max(maxByteCount, maxDynCount, maxTerCount);

    if (_decoder !== undefined) {
        _fallbackDecode = (buf, offset) => {
            const c = _decoder.decode(buf.slice(offset))[0];
            const n = _encoder.encode(c).length;
            return [n, c];
        }

        const buf = new Uint8Array(4);
        const dv = new DataView(buf.buffer);
        /**
         * 
         * @param {number} code big endian codepoint
         * @returns {string}
         */
        this.fromCharCode = (code) => {
            dv.setUint32(0, code);
            const s = _decoder.decode(buf);
            let c = s[0];
            if (c !== '\x00') return c;
            if ((c = s[1]) !== '\x00') return c;
            if ((c = s[2]) !== '\x00') return c;
            return s[3];
        }

        /**
         * 
         * @param {NativePointer} p 
         * @returns {string}
         */
        this.readChar = function (p) {
            const buf = ArrayBuffer.wrap(p, 4);
            return _decoder.decode(buf)[0];
        }
    }
    else {
        _fallbackDecode = fallback !== undefined ? fallback : (buf, offset, remain) => {
            const n = Math.min(remain, maxByteCount);
            const c = '($' + toHexStr(buf, offset, n) + ')';
            return [n, c];
        }

        /**
         * 
         * @param {number} code big endian codepoint
         * @returns {string}
         */
        this.fromCharCode = (code) => {
            const c = table.get(code);
            if (c !== undefined) {
                return c;
            }
            else {
                const h = code.toString(16);
                return '($' + ((h.length & 1) === 0 ? h : '0' + h) + ')';
            }
        }

        /**
         * 
         * @param {NativePointer} p 
         * @returns {string}
         */
        this.readChar = function (p) {
            return this.readString(p, 1);
        }
    }

    /** @type {function(Uint8Array,number): boolean} */
    this.isEnd = isTerminated;
    /** @type {function(number): boolean} */
    this.isEndCode = isTerminatedCode;

    /**
     * 
     * @param {ArrayBuffer} buffer
     * @returns {string}
     */
    this.decode = function (buffer, offset = 0) {
        let s = '';

        const buf = new Uint8Array(buffer);
        const length = buf.length;
        let curHexLength;
        let curHex;
        let remain;

        while ((remain = length - offset) > 0) {
            if (callback !== undefined) {
                const v = callback.call(this, buf, offset);
                if (v === true) {
                    break;
                }
                else if (v !== false) {
                    offset += v[0];
                    s += v[1];
                    continue;
                }
            }

            // bytecode
            if (maxDynCount !== 0) {
                curHexLength = Math.min(remain, maxDynCount);
                curHex = toHexStr(buf, offset, curHexLength);
                while ((curHexLength = curHex.length) !== 0) {
                    const N = dyn.get(curHex);
                    if (N !== undefined) {
                        //s += '($' + toHexStr(buf, offset, N) + ')'; // debug
                        offset += N;
                        break;
                    }
                    curHex = curHex.substring(0, curHex.length - 2);
                }
            }
            else {
                curHexLength = 0;
            }

            // decode char
            if (curHexLength === 0) {
                curHexLength = Math.min(remain, maxByteCount);
                curHex = toHexStr(buf, offset, curHexLength);
                while ((curHexLength = curHex.length) !== 0) {
                    const N = table.get(curHex);
                    if (N !== undefined) {
                        //console.warn(curHex + "=" + N); // debug
                        s += N;
                        offset += curHexLength >> 1;
                        break;
                    }
                    curHex = curHex.substring(0, curHex.length - 2);
                }

                // undefined char
                if (curHexLength === 0) {
                    const [n, c] = _fallbackDecode(buf, offset, remain);
                    s += c;
                    offset += n;
                }
            }
        }

        return s;
    }

    /**
     * 
     * @param {NativePointer} p 
     * @returns {string}
     */
    this.readString = function (p, maxlen = 512) {
        let s = '';

        let v;
        let offset = 0;
        let curHexLength;
        let curHex;

        while (s.length < maxlen) {
            const buf = new Uint8Array(ArrayBuffer.wrap(p, offset + maxAllCount));
            if (isTerminated(buf, offset) === true) break;

            if (callback !== undefined) {
                v = callback.call(p, buf, offset);
                if (v === true) {
                    break;
                }
                else if (v !== false) {
                    offset += v[0];
                    s += v[1];
                    continue;
                }
            }

            // bytecode
            if (maxDynCount !== 0) {
                curHex = toHexStr(buf, offset, maxDynCount);
                while ((curHexLength = curHex.length) !== 0) {
                    const N = dyn.get(curHex);
                    if (N !== undefined) {
                        //s += '($' + toHexStr(buf, offset, N) + ')'; // debug
                        offset += N;
                        break;
                    }
                    curHex = curHex.substring(0, curHex.length - 2);
                }
            }
            else {
                curHexLength = 0;
            }

            // decode char
            if (curHexLength === 0) {
                curHex = toHexStr(buf, offset, maxByteCount);
                while ((curHexLength = curHex.length) !== 0) {
                    const N = table.get(curHex);
                    if (N !== undefined) {
                        //console.warn(curHex + "=" + N); // debug
                        s += N;
                        offset += curHexLength >> 1;
                        break;
                    }
                    curHex = curHex.substring(0, curHex.length - 2);
                }

                // undefined char
                if (curHexLength === 0) {
                    const [n, c] = _fallbackDecode(buf, offset, maxByteCount);
                    s += c;
                    offset += n;
                }
            }
        }

        return s;
    }
}

function loadTable(path) {
    /** @type {string[]} */
    const lines = fs_readFileSync(path, 'utf8').split(/\r?\n/);
    const table = new Map();
    const dyn = new Map();
    let maxByteCount = 0;
    let maxDynCount = 0;
    let maxTerCount = 0;
    let terminated = null;
    let terminateds = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length === 0) continue;

        const splited = line.split('=', 2);
        const key = splited[0].trim();
        const magic = key[0];
        if (magic === '#') continue; // comment
        if (magic === '@') continue; // @TableIDString TODO
        if (magic === '!') continue; // table switch TODO
        if (magic === '/') {
            const [hexstr, _] = key.substring(1).split('=', 2);
            terminated = parseInt(hexstr, 16);
            const count = hexstr.length >> 1;
            dyn.set(hexstr.toLowerCase(), count);
            dyn.set(terminated, count);

            terminateds.push([count, terminated]);
            maxTerCount = Math.max(maxTerCount, count);
            continue;
        }
        if (key.includes('+') === true) {
            const [hexstr, scount] = key.split('+', 2);
            const count = parseInt(scount) + (hexstr.length >> 1);
            dyn.set(hexstr.toLowerCase(), count);
            dyn.set(parseInt(hexstr, 16), count);

            maxDynCount = Math.max(maxDynCount, count);
            continue;
        }
        if (splited.length !== 2) continue;

        // mormal entry
        const value = splited[1];
        const hexstr = key.toLowerCase();
        table.set(hexstr, value);
        table.set(parseInt(hexstr, 16), value);

        maxByteCount = Math.max(maxByteCount, hexstr.length >> 1);
    }

    return [table, dyn, maxByteCount, maxDynCount, maxTerCount, createFuncIsTerminated(terminateds), createFuncIsTerminatedCode(terminateds)];
}

function toHexStr(buf, i, count) {
    let s = '';
    const N = i + count;
    for (; i < N; i++) {
        const b = buf[i];
        const h = b.toString(16);
        s += b < 16 ? '0' + h : h;
    }
    return s;
}

function createFuncIsTerminatedCode(terminateds) {
    if (terminateds.length === 0) return () => false;

    let terminated = terminateds[0][1];
    let bodyTerminated = `return c === ${terminated}`;
    for (let i = 1; i < terminateds.length; i++) {
        terminated = terminateds[i][1];
        bodyTerminated += ` || c === ${terminated}`;
    }
    bodyTerminated += ';';
    return new Function('c', bodyTerminated);
}

function createFuncIsTerminated(terminateds) {
    if (terminateds.length === 0) return () => false;

    terminateds = terminateds.sort((a, b) => a[0] - b[0]);
    let bodyTerminated = 'const b1 = buf[i];\n';
    let b2Added = false;
    let b3Added = false;
    let b4Added = false;
    for (let i = 0; i < terminateds.length; i++) {
        const [len, terminated] = terminateds[i];
        if (len === 1) {
            bodyTerminated += `if (b1 === ${terminated}) return true;\n`;
        }
        else if (len === 2) {
            if (b2Added === false) {
                b2Added = true;
                bodyTerminated += 'const b2 = b1 << 8 | buf[i+1];\n';
            }
            bodyTerminated += `if (b2 === ${terminated}) return true;\n`;
        }
        else if (len === 3) {
            if (b3Added === false) {
                if (b2Added === false) {
                    b2Added = true;
                    bodyTerminated += 'const b2 = b1 << 8 | buf[i+1];\n';
                }
                b3Added = true;
                bodyTerminated += 'const b3 = b2 << 8 | buf[i+2];\n';
            }
            bodyTerminated += `if (b3 === ${terminated}) return true;\n`;
        }
        else if (len === 4) {
            if (b4Added === false) {
                if (b2Added === false) {
                    b2Added = true;
                    bodyTerminated += 'const b2 = b1 << 8 | buf[i+1];\n';
                }
                if (b3Added === false) {
                    b3Added = true;
                    bodyTerminated += 'const b3 = b2 << 8 | buf[i+2];\n';
                }
                b4Added = true;
                bodyTerminated += 'const b4 = b3 << 8 | buf[i+3];\n';
            }
            bodyTerminated += `if (b4 === ${terminated}) return true;\n`;
        }
    }
    bodyTerminated += 'return false;';
    return new Function('buf', 'i', bodyTerminated);
}

/**
 * 
 * @param {encoding} encoding 
 * @param {number} length 
 * @returns {string}
 */
NativePointer.prototype.readCustomString = function (encoding, length = -1) {
    if (length !== -1) {
        return encoding.decode(ArrayBuffer.wrap(this, length));
    }

    return encoding.readString(this);
}

module.exports = exports = encoding;