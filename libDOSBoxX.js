// @name         DOSBox-X JIT Hooker
// @version      
// @author       [DC]
// @description  PC98

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

console.warn('[Compatibility]');
console.warn('dosbox-x-vsbuild-win-x86_x64-20240122181452 (SDL2; pc98; dynamic)');
console.log('[Mirror] Download: https://github.com/koukdw/emulators/releases');

const operations = Object.create(null);
const max_opcode = ptr(1);

// https://github.com/joncampbell123/dosbox-x/blob/0c88e5f8d81ffb457a7cff2ef342ff9249caec55/src/cpu/core_dyn_x86/decoder.h#L2487
// https://github.com/joncampbell123/dosbox-x/blob/0c88e5f8d81ffb457a7cff2ef342ff9249caec55/src/cpu/core_dyn_x86/cache.h#L21
const pCreateCacheBlock = getDoJitAddress();
Interceptor.attach(pCreateCacheBlock, {
    onEnter(args) {
        const ip_point = args[1].toString(10);
        this.ip_point = ip_point;

        args[2] = max_opcode; // force single step
    },
    onLeave(retVal) {
        const ip_point = this.ip_point;
        const op = operations[ip_point];
        if (op !== undefined) {
            const blockStart = retVal.add(0x10).readPointer();
            console.log('Attach: ' + ptr(ip_point) + ' ' + blockStart);
            jitAttach(blockStart, op);
            sessionStorage.setItem("dbx_" + Date.now(), {
                guest: ip_point,
                host: blockStart
            });
        }
    }
});

function jitAttach(blockStart, op) {
    Interceptor.attach(blockStart, function () {
        /** @type {NativePointer} */
        const cpu_regs = this.context.rbp;
        const pageTable = cpu_regs.add(0x118);

        // (8 + 1 + 3         + 8                   + 16) * 4 = 0x90
        // eax->eip,0,flags,0 + es,0,cs,0,ss,0,ds,0 + ?,?,?,?,?,?,?,?,(0x70: es<<4)es,cs,ss,ds,0,0
        const dv = new Uint32Array(ArrayBuffer.wrap(cpu_regs, 0x80));
        //console.error(hexdump(cpu_regs, { length: 0x80 }));

        const ctx = Object.create(null, {
            eax: {
                enumerable: true,
                get() { return dv[0]; }
            },
            ecx: {
                enumerable: true,
                get() { return dv[1]; }
            },
            edx: {
                enumerable: true,
                get() { return dv[2]; }
            },
            ebx: {
                enumerable: true,
                get() { return dv[3]; }
            },
            esp: {
                enumerable: true,
                get() { return dv[4]; }
            },
            ebp: {
                enumerable: true,
                get() { return dv[5]; }
            },
            esi: {
                enumerable: true,
                get() { return dv[6]; }
            },
            edi: {
                enumerable: true,
                get() { return dv[7]; }
            },
            eip: {
                enumerable: true,
                get() { return dv[8]; } // ip_point
            },
            pc: {
                get() { return dv[14].toString(16).padStart(4, '0') + ':' + dv[8].toString(16).padStart(4, '0'); }
            },
            ax: {
                get() { return dv[0] & 0xFFFF; }
            },
            cx: {
                get() { return dv[1] & 0xFFFF; }
            },
            dx: {
                get() { return dv[2] & 0xFFFF; }
            },
            bx: {
                get() { return dv[3] & 0xFFFF; }
            },
            sp: {
                get() { return dv[4]; } // TODO: NativePointerLike?
            },
            bp: {
                get() { return dv[5] & 0xFFFF; }
            },
            si: {
                get() { return dv[6] & 0xFFFF; }
            },
            di: {
                get() { return dv[7] & 0xFFFF; }
            },
            ip: {
                enumerable: true,
                get() { return dv[8]; }
            },
            // NativePointerLike
            es: {
                get() {
                    const v = createVMPointer(dv[0x70 >> 2]);
                    v.vm = dv[12];
                    return v;
                }
            },
            cs: {
                get() {
                    const v = createVMPointer(dv[0x74 >> 2]);
                    v.vm = dv[14];
                    return v;
                }
            },
            ss: {
                get() {
                    const v = createVMPointer(dv[0x78 >> 2]);
                    v.vm = dv[16];
                    return v;
                }
            },
            ds: {
                get() {
                    const v = createVMPointer(dv[0x7c >> 2]);
                    v.vm = dv[18];
                    return v;
                }
            }
        });
        const thiz = Object.create(null, {
            returnAddress: {
                get() { return dv[14].toString(16).padStart(4, '0') + ':' + ctx.ss.add(dv[4]).readU16(); }
            },
        });
        thiz.context = ctx;
        thiz.getAddress = (segment, offset) => {
            if (segment.vm !== undefined) {
                return segment.add(offset);
            }
            const p = (segment << 4) + offset;
            return createVMPointer(p);
        }
        thiz.stack = (index) => {
            return ctx.ss.add(dv[4] + (index << 1)).readU16(); // same args[index]
        }

        function createVMPointer(p) {
            const i = (p >> 12) << 3; // *8
            const o = pageTable.add(i).readPointer().add(p);
            //o.add = (v) => createVMPointer(p + v); // no need recalculate

            return o;
        }

        const args = new Proxy(Object.create(null), {
            get(_, prop) {
                // use prop string as int
                return ctx.ss.add(dv[4] + (prop << 1)).readU16();
            }
        });

        op.call(thiz, args);
    });
}

function getDoJitAddress() {
    if (Process.platform !== 'windows') {
        // no debug symbols
        throw new Error('TODO: macOS, linux,..')
    }
    else {
        const __e = Process.enumerateModules()[0];
        return __e.base.add(0x15e3b0); // dynamic_x86, TODO: use pattern instead
    }
}

function setHook(object) {
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            operations[key] = element;
        }
    }

    Object.keys(sessionStorage).map(key => {
        const value = sessionStorage.getItem(key);
        if (key.startsWith('dbx_') === true) {
            try {
                const ip_point = value.guest;
                const blockStart = ptr(value.host);
                const op = operations[ip_point];
                console.warn('Re-Attach: ' + ptr(ip_point) + ' ' + value.host);
                jitAttach(blockStart, op);
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