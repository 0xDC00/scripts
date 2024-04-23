// @name         Unity
// @version      
// @author       [DC]
// @description  JIT & IL2CPP (emulator is not supported!)

/*
TODO:
- Cleanup, refactor....
- libFlash like: asm|namspace.class|method: onEnter | {}
- Static field address
- async
*/

/**
* @typedef {Object} _NativePointerMono
* @property {function():string} readMonoString
* @property {function():MonoObjectWrapper} wrap
* @property {function():NativePointer} unbox Return data pointer (skip MonoObject header)
* @property {ArrayBuffer | string } value Mono <-> Javascript
* ```cs
* Read-Write data without affect target pointer
* Supported types:
* - number:
*   +  System.SByte, System.Byte
*   +  System.Int16, System.UInt16
*   +  System.Int32, System.UInt32
*   +  System.Int64, System.UInt64
*   +  System.Single
*   +  System.Double
* 
* - Uint8Array: System.Byte[]
* - Int32Array: System.Int32[]
* - string[]:   System.String[]
* - string:     System.String
*
* - T[]       List<T>
* - Object    Dictionary<TKey,TValue>
*
* - default: MonoObjectWrapper
* ```
* 
* @typedef {NativePointer & _NativePointerMono} NativePointerMono
*
* @typedef {NativePointerMono[]} InvocationArgumentsMono
* @typedef {InvocationReturnValue & NativePointerMono} InvocationReturnValueMono
* 
* @typedef {Object} ScriptInvocationListenerCallbacksMono
* @property {{(this: InvocationContext, args: InvocationArgumentsMono): void}} [onEnter]
* @property {{(this: InvocationContext, retval: InvocationReturnValueMono): void}} [onLeave]
* 
* @typedef {ScriptInvocationListenerCallbacksMono | NativeInvocationListenerCallbacks} InvocationListenerCallbacksMono
* @typedef {{(this: InvocationContext, args: NativePointerMono[]): void}} InstructionProbeCallbackMono
*/

/**
* @typedef {Object} _MonoFunction custom call, apply
* @property {{(thisArgs: NativePointer | MonoObjectWrapper, ...arg: NativePointer[]): NativePointerMono;}} call
* @property {{(thisArgs: NativePointer | MonoObjectWrapper, argArray?: NativePointer[]): NativePointerMono;}} apply
*/

/**
* @typedef {Object.<string, ?MethodWrapper>} __ClassWrapper proxy
* @typedef {{(...arg: NativePointer[]): NativePointerMono;}} __MethodWrapper invoke
*
* @typedef {Object.<string, ?MethodWrapperObject>} __ClassWrapperObject object proxy
* @typedef {__ClassWrapperObject & _ClassWrapper} ClassWrapperObject
* 
* @typedef {{
*  (args?: NativePointer[]): NativePointerMono;
*  (args?: NativePointer): NativePointerMono;
* }} __MethodWrapperObject
* @typedef {__MethodWrapperObject & _MonoFunction & _MethodWrapper} MethodWrapperObject
*/

// /**
//  * @typedef {{
//  *   (...args: string[]): MethodWrapper;
//  *   (args: string[]): MethodWrapper;
//  *   (args: string): MethodWrapper;
//  * }} MethodOverLoad
//  */

/**
 * MethodWrapper
* @typedef {Object} _MethodWrapper
* @property {NativePointer} handle MonoMethod
* @property {NativePointer} value object MethodInfo | instance value
* @property {ClassWrapper} class To what class does this method belong.
* @property {NativePointer} address virtual address
* @property {string} fullName
* @property {string[]} args
* @property {string} return
* @property {TypeWrapper[]} argumentTypes
* @property {TypeWrapper} returnType
* @property {boolean} generic
* @property {boolean} inflated
* @property {boolean} instance
* @property {function(...string):MethodWrapper} inflate Generic
* @property {{(...args: string[]): MethodWrapper}} overload Signature of the overload to obtain.
*
* For example: `'System.String', 'System.Int32'`.
* @property {MethodWrapper[]} overloads
* @property {function():void} $dump
* @property {NativeFunction} implementation Interceptor.replace | MonoObject* NativeFunction (this?, args...)
* @property {__MethodWrapper} _invoke MonoObject* mono_runtime_invoke  (void *obj, void *params...);
* @property {{(thiz: NativePointer, params?: NativePointer): NativePointerMono;}} invoke MonoObject* mono_runtime_invoke  (void *obj, void **params);
* @property {{(callbacksOrProbe: InvocationListenerCallbacks|InstructionProbeCallbackMono, data?: NativePointerValue): InvocationListener; }} attach Interceptor.attach | MonoObject* NativeFunction (this?, args...)
* @property {function():MonoObjectWrapper} wrap FieldValue <-> ObjectWrapper
* @typedef {_MethodWrapper & _MonoFunction & __MethodWrapper} MethodWrapper
*/

/**
 *
* @typedef {Object} FieldWrapper
* @property {NativePointer} handle MonoClassField
* @property {TypeWrapper} type- {@link TypeWrapper} object TypeInfo wrap
* @property {ClassWrapper} class - {@link ClassWrapper}
* @property {number} offset
* @property {boolean} static
* @property {boolean} valuetype
* @property {NativePointerMono} address Field value handle
* @property {*} value Mono <-> Javascript, short-hand of .address.value
* @property {{(holder: NativePointerMono):NativePointerMono}} getValue
* @property {{(v: NativePointerMono, holder: NativePointerMono):void}} setValue
* 
* A pointer that point to valuetype or boxed (instance only)
*
* Use wrap() to create a ObjectWrapper
* @property {TypeWrapper} type - {@link TypeWrapper} object TypeInfo wrap
* @property {ClassWrapper} class - {@link ClassWrapper}
* @property {NativePointerMono=} thiz static, instance
* @property {NativePointerMono | null} value Mono <-> Javascript
* @property {function():MonoObjectWrapper} wrap Value <-> ObjectWrapper
*/

/**
* 
* @typedef {Object} TypeWrapper
* @property {NativePointer} handle MonoType
* @property {ClassWrapper} class - {@link ClassWrapper}
* @property {NativePointer} value object TypeInfo <=> typeof
* @property {boolean} valuetype
* @property {boolean} byref
* @property {boolean} ptr
*/

// @property {NativePointer} value object TypeInfo <=> typeof
/**
 * ClassWrapper
* @typedef {Object} _ClassWrapper
* @property {NativePointer} handle MonoClass
* @property {TypeWrapper} type - {@link TypeWrapper} object TypeInfo wrap
* @property {ClassWrapper} arrayClass - {@link ClassWrapper}
* @property {string} fullName
* @property {string} [imageName]
* @property {boolean} inflated
* @property {boolean} generic
* @property {boolean} valuetype
* @property {boolean} enum
* @property {string[]} $ownMembers Method and field names.
* @property {MethodWrapper[]} methods - {@link MethodWrapper}
* @property {{ (name: string): ?FieldWrapper; }} findField - {@link FieldWrapper}
* @property {{ (name: string, argCnt?: number | -1): ?MethodWrapper; }} findMethod - {@link MethodWrapper}
* @property {{ (name: string): MethodWrapper; }} method - {@link MethodWrapper}
* @property {{ (...param: MonoObjectWrapper[]|NativePointer[]): MonoObjectWrapper;}} $new Allocates and initializes a new instance of the given class.
* @property {function():MonoObjectWrapper} alloc Allocates a new instance without initializing it.
* @property {MethodWrapper} $init 
* @property {function(...ClassWrapper):ClassWrapper} inflate - {@link ClassWrapper}
* @property {function():void} $dump
* @typedef {__ClassWrapper & _ClassWrapper} ClassWrapper
*/

/**
* MonoObjectWrapper
* @typedef {Object} _MonoObjectWrapper
* @property {NativePointer} handle MonoObject instance (<=> thiz MonoVTable).
* @property {NativePointer} thiz MonoObject instance.
* @property {ClassWrapper} class - {@link ClassWrapper}
* @property { string | []  } value
* @property {function():_NativePointerMono} unwrap Return object handle.
* @typedef {ClassWrapperObject & _MonoObjectWrapper} MonoObjectWrapper
*/

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

const POINTER_SIZE = Process.pointerSize;
const POINTER_ARRAY = POINTER_SIZE === 4 ? Uint32Array : BigUint64Array;
const OFFSET_ARRAY_DATA = POINTER_SIZE === 4 ? 0x10 : 0x20;  // 0xC, 0x18=len

/** image => handle */
const cacheLookImage = {};
/** image::namespace.class => wrap */
const cacheLookClass = {};
/** kclass.method_sig => wrap */
const cacheLookMethod = {};

/** handle => wrap */
const cacheObjects = {};
/** kclass => wrap */
const cacheClasss = {};
/** htype => wrap */
const cacheTypes = {};
/** htype => bool */
const cacheValueType = {};

/** adress => imp */
const cacheImpl = {};

/** kclass => get set */
const cacheKnownType = {};

const cacheIsPrimes = { // invoke unbox need (same value type?)
    'System.Boolean': true,
    'System.Byte': true,  // uint8
    'System.Char': true,
    'System.SByte': true, // int8
    'System.Int16': true,
    'System.UInt16': true,
    'System.Int32': true,
    'System.UInt32': true,
    'System.Int64': true,
    'System.UInt64': true,
    'System.Single': true,
    'System.Double': true,
};
var cachedApi = null;
var _api, _mod, _isAot, _thread;

/* backward compatibility */
/**
* @type {{
*   (imageName: string, className: string, methodName: string, argCount: number, callbacks: InvocationListenerCallbacksMono|InstructionProbeCallbackMono): InvocationListener;
*   (imageName: string, className: string, methodName: string, params: string[], callbacks: InvocationListenerCallbacksMono|InstructionProbeCallbackMono): InvocationListener;
*   (method: MethodWrapper, callbacks: InvocationListenerCallbacksMono|InstructionProbeCallbackMono): InvocationListener;
* }}
*/
const setHook = function () {
    return _api.setHook.apply(_api, arguments);
}

/**
 * @type {{
 *   (imageName: string | null, className: string): ?ClassWrapper;
 *   (imageName_className: string): ?ClassWrapper;
 * }}
 */
const findClass = function () {
    return _api.findClass.apply(_api, arguments);
}

/**
 * @type {{
 *   (imageName: string, className: string, methodName: string, argCount: int | -1): ?MethodWrapper;
 *   (imageName: string, className: string, methodName: string, params: string[]): ?MethodWrapper;
 *   (clazz: ClassWrapper, methodname: string, argCount: int | -1): ?MethodWrapper;
 *   (clazz: ClassWrapper, methodname: string, params: string[]): ?MethodWrapper;
 * }}
 */
const findMethod = function () {
    return _api.findMethod.apply(_api, arguments);
}

/** 
 * @type {{
 *   (imageName: string, className: string, fieldName: string): ?FieldWrapper;
 *   (clazz: ClassWrapper, fieldName: string): ?FieldWrapper;
 * }}
 */
const findField = function () {
    return _api.findField.apply(_api, arguments);
}

function createFunction(imageName, className, methodName, argCnt = -1, retType = 'void', argTypes = [], abiOrOptions = 'default') {
    const m = findMethod(imageName, className, methodName, argCnt);
    return m === null ? null : new NativeFunction(m.address, retType, argTypes, abiOrOptions);
}

function isMonoLoaded() {
    return isMono().module !== null;
}

function perform(f, m) {
    const { isAot, module } = isMono();
    _isAot = isAot;
    if (module) {
        _mod = module;
        const api = monoInit(isAot);
        const mod = module.base;
        _api = api;

        f.call({ isAot, mod });
    }
    else {
        console.log('Wait');
        let hooked = false;
        let waitModName = '';
        const onLeave = function (ret) {
            if (ret.isNull() === true) {
                if (hooked === true) {
                    const curModName = this.path.substring(this.path.lastIndexOf('/') + 1);
                    console.log('curModName', curModName, waitModName);
                    if (curModName.startsWith(waitModName) === true) {
                        console.log('target');
                        h1.detach();
                        Interceptor.flush();
                        perform(f, m);
                    }
                }

                console.log('load: NULL'); // link_map
                return;
            }
            // aot
            if (hooked === false) {
                var name = this.path.substring(this.path.lastIndexOf('/') + 1);
                var mod = Process.findModuleByName(name);
                if (mod === null) return;
                let api1 = mod.findExportByName('il2cpp_thread_attach');
                if (api1 === null) {
                    api1 = mod.findExportByName('mono_thread_attach');

                    if (api1 === null)
                        return;
                    else {
                        console.log('Mono');
                        hooked = true;

                        // Assembly-CSharp.dll.so
                        // System.Core.dll.so
                        // Mono.Security.dll.so
                        // System.Xml.dll.so
                        // SharpZipLib.dll.so
                        waitModName = 'System.Core.dll';
                    }
                }
                else {
                    console.log('il2cpp');
                    hooked = true;
                    const addressInit = mod.findExportByName('il2cpp_runtime_class_init');
                    let ins = Instruction.parse(addressInit);
                    const splitc = Process.arch === "x64" ? ' ' : '#';
                    const hookInit = Interceptor.attach(ptr(ins.toString().split(splitc)[1]), {
                        onEnter: function () {
                            hookInit.detach();
                            Interceptor.flush();
                            console.log('perform il2cpp trigged');
                            setTimeout(() => {
                                perform(f, m);
                            }, 2000);
                        }
                    });
                }
            }
        };
        let h1;
        if (Process.platform === "windows") {
            h1 = Interceptor.attach(Module.findExportByName('kernel32.dll', "LoadLibraryExW"), {
                onEnter: function (args) {
                    this.path = args[0].readUtf16String();
                    console.log('***LoadLibraryExW', this.path);
                },
                onLeave
            });
        }
        else {
            h1 = Interceptor.attach(Module.findExportByName(null, "dlopen"), {
                onEnter: function (args) {
                    this.path = args[0].readCString();
                    console.log('***dlopen', this.path);
                },
                onLeave
            });
            Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"), {
                onEnter: function (args) {
                    this.path = args[0].readCString();
                    console.log('***android_dlopen_ext', this.path);
                },
                onLeave
            });
        }
    }
}

function monoInit(isAot) {
    const MonoApi = loadMonoApi(isAot);

    const domain = MonoApi.mono_get_root_domain();
    _thread = MonoApi.mono_thread_attach(domain);
    // Script.bindWeak(globalThis, () => {
    //     MonoApi.mono_thread_detach(_thread);
    // });

    if (isAot === true) {
        Memory.allocMonoString = function (s) {
            const v = Memory.allocUtf16String(s);
            const p = MonoApi.mono_string_new_utf16(v, s.length);
            return p;
        }
    }
    else {
        Memory.allocMonoString = function (s) {
            const v = Memory.allocUtf16String(s);
            const p = MonoApi.mono_string_new_utf16(domain, v, s.length);
            return p;
        }
    }

    if (POINTER_SIZE === 4) {
        NativePointer.prototype.readMonoString = function () {
            const len = this.add(8).readU32();
            return len === 0 ? '' : this.add(0xC).readUtf16String(len);
        }
    }
    else {
        NativePointer.prototype.readMonoString = function () {
            const len = this.add(0x10).readU32();
            return len === 0 ? '' : this.add(0x14).readUtf16String(len);
        }
    }

    NativePointer.prototype.readMonoStringUnbox = function () {
        const len = this.readU32();
        return len === 0 ? '' : this.add(4).readUtf16String(len);
    }

    const MonoApiHelper = {
        get _entrypointAssembly() {
            const clazz = findClass('UnityEngine', 'UnityEngine.Debug');
            const name = clazz !== null ? 'UnityEngine' : 'UnityEngine.CoreModule';
            delete this._entrypointAssembly;
            this._entrypointAssembly = name;
            return name;
        },
        /** @returns {ClassWrapper} */
        findClass: function (imageName, className) {
            if (className === undefined) {
                var index = imageName.indexOf('::');
                if (index !== -1) {
                    className = imageName.substring(index + 2);
                    imageName = imageName.substring(0, index);
                }
                else {
                    className = imageName;
                    imageName = 'mscorlib';
                }
            }

            imageName = imageName ?? null;
            if (imageName !== null) {
                if (imageName === true) {
                    imageName = this._entrypointAssembly;
                }
                else if (imageName === '') {
                    imageName = 'Assembly-CSharp';
                }
                imageName = imageName.toUpperCase().replace(/\.DLL$/g, '');
            }

            const signature = imageName + '::' + className;
            const wrapCache = cacheLookClass[signature];
            if (wrapCache !== undefined) {
                return wrapCache;
            }
            const lastIndexOf = className.lastIndexOf('.');
            const _namespace = lastIndexOf === - 1 ? '' : className.substring(0, lastIndexOf);
            const nests = className.substring(lastIndexOf + 1).split('$');
            let _className = nests.shift();

            const imageSignature = imageName ?? null;
            if (imageSignature !== null) {
                const hImage = cacheLookImage[imageSignature];
                if (hImage !== undefined) {
                    const pNamespace = Memory.allocUtf8String(_namespace); // first part
                    const pClassName = Memory.allocUtf8String(_className); // last part
                    let hClass = MonoApi.mono_class_from_name(hImage, pNamespace, pClassName);
                    if (hClass.isNull() === false) {
                        while (nests.length !== 0) {
                            const sub = nests.shift();
                            const iter = Memory.alloc(POINTER_SIZE);
                            while (true) {
                                const sClass = MonoApi.mono_class_get_nested_types(hClass, iter);
                                if (sClass.isNull() === true) {
                                    return null;
                                }

                                const s = MonoApi.mono_class_get_name(sClass).readCString();
                                if (s === sub) {
                                    hClass = sClass;
                                    _className += '$' + s;
                                    break;
                                }
                            }
                        }

                        let wrap = cacheClasss[hClass];
                        if (wrap !== undefined) return wrap;
                        wrap = _classWrap({
                            handle: hClass,
                            name: _className,
                            namespace: _namespace,
                            fullName: className,
                            imageName: imageName
                        });
                        cacheLookClass[signature] = wrap;
                        return wrap;
                    }
                }
            }
            const pNamespace = Memory.allocUtf8String(_namespace); // first part
            const pClassName = Memory.allocUtf8String(_className); // last part
            let hClass = null;
            MonoApi.AssemblyForeach(function (assembly) {
                const hImage = MonoApi.mono_assembly_get_image(assembly);
                // compare name if not null
                if (imageName !== null) {
                    const currentImageName = MonoApi.mono_image_get_name(hImage).readCString();
                    const currentImageNameSig = currentImageName.toUpperCase().replace(/\.DLL$/g, '');
                    cacheLookImage[currentImageNameSig] = hImage;
                    if (imageName !== currentImageNameSig) {
                        //console.log('SkipImage: ' + currentImageName);
                        return 0;
                    }
                    else {
                        //console.log('Image: ' + currentImageName);
                        imageName = currentImageName; // restore case
                    }
                }

                // try find class from image
                const kclass = MonoApi.mono_class_from_name(hImage, pNamespace, pClassName);
                if (kclass.isNull() === false) {
                    hClass = kclass;
                    if (imageName === null) {
                        imageName = MonoApi.mono_image_get_name(hImage).readCString();
                        cacheLookImage[imageName.toUpperCase()] = hImage;
                    }

                    return 1;
                }
                return 0;
            });

            if (hClass === null) return null;

            while (nests.length !== 0) {
                const sub = nests.shift();
                const iter = Memory.alloc(POINTER_SIZE);
                while (true) {
                    const sClass = MonoApi.mono_class_get_nested_types(hClass, iter);
                    if (sClass.isNull() === true) {
                        return null;
                    }

                    const s = MonoApi.mono_class_get_name(sClass).readCString();
                    if (s === sub) {
                        hClass = sClass;
                        _className += '$' + s;
                        break;
                    }
                }
            }

            const wrap = _classWrap({
                handle: hClass,
                name: _className,
                namespace: _namespace,
                fullName: className,
                imageName: imageName
            });
            cacheLookClass[signature] = wrap;
            return wrap;
        },
        findMethod: (imageName, className, methodName, numArg = -1) => {
            /** @type {ClassWrapper} */
            let classObj = null;
            if (imageName !== null && imageName.handle !== undefined) {
                classObj = imageName;
                numArg = methodName ?? numArg;
                methodName = className;
                //console.log('  findMethod.fromClass:', classObj.fullName);
            }
            else {
                classObj = MonoApiHelper.findClass(imageName, className);
                //console.log('  findMethod.findClass:', imageName, className);
            }
            if (classObj === null) {
                console.warn('Class not found! ' + imageName + " " + className);
                //console.error(new Error().stack);
                return null;
            }

            const handle = classObj.handle;
            const signature = handle + '.' + methodName + '_' + numArg;
            const wrap = cacheLookMethod[signature];
            if (wrap !== undefined) {
                // thiz => clone, each overload have it own handle
                console.log('cloneMethod:' + signature);
                return _methodWrap({
                    handle: wrap.handle,
                    name: methodName,
                    class: classObj
                });
            }

            let hMethod = NULL, mn;
            if (typeof numArg === 'number') {
                console.log(classObj.fullName + ' ' + methodName + '|' + numArg);
                mn = Memory.allocUtf8String(methodName);
                hMethod = MonoApi.mono_class_get_method_from_name(handle, mn, numArg);
            }
            else {
                numArg = numArg.toString();
                console.log('    methods|sign: ' + methodName + '|' + numArg);
                const methods = classObj.methods[methodName];
                if (methods !== undefined) {
                    const method = methods[numArg];
                    if (method !== undefined)
                        return method;
                }
            }
            if (hMethod.isNull() === true) {
                const argCnt = typeof numArg === 'number' ? numArg : -1;
                let current = handle;
                while (true) {
                    let parrent = MonoApi.mono_class_get_parent(current);
                    if (parrent.isNull() === true) {
                        console.warn('  Metthod signature ' + numArg + ' not found! ' + methodName);
                        return null;
                    }

                    hMethod = MonoApi.mono_class_get_method_from_name(parrent, mn, argCnt);
                    if (hMethod.isNull() !== true) {
                        const ktype = MonoApi.mono_class_get_type(parrent);
                        const fname = MonoApi.mono_type_get_name(ktype).readCString();
                        classObj = _classWrap({
                            handle: parrent,
                            fullName: fname
                        });
                        break;
                    }
                    current = parrent;
                }
            }

            const result = _methodWrap({
                handle: hMethod,
                name: methodName,
                class: classObj
            });
            cacheLookMethod[signature] = result;

            console.log('    ' + methodName + '(' + result.args + ') => ' + result.return + '\r\n');
            return result;
        },
        findField: (imageName, className, fieldName) => {
            /** @type {ClassWrapper} */
            let classObj = null;
            if (imageName.handle !== undefined) {
                classObj = imageName;
                fieldName = className;
            }
            else {
                classObj = MonoApiHelper.findClass(imageName, className);
            }
            if (classObj === null) return null;
            console.log('  findField ' + fieldName);
            const fn = Memory.allocUtf8String(fieldName);
            const hfield = MonoApi.mono_class_get_field_from_name(classObj.handle, fn);
            if (hfield.isNull() === true) return null;

            return _fieldWrap(hfield, fieldName);
        },
        method: (classObj, methodName, argCnt = -1) => {
            const handle = classObj.handle;
            const signature = handle + '.' + methodName + '_' + argCnt;
            const wrap = cacheLookMethod[signature];
            if (wrap !== undefined)
                return wrap;

            const mn = Memory.allocUtf8String(methodName);
            let hMethod = MonoApi.mono_class_get_method_from_name(handle, mn, argCnt);
            if (hMethod.isNull() === true) {
                let current = handle;
                while (true) {
                    let parrent = MonoApi.mono_class_get_parent(current);
                    if (parrent.isNull() === true) {
                        return null;
                    }

                    hMethod = MonoApi.mono_class_get_method_from_name(parrent, mn, argCnt);
                    if (hMethod.isNull() !== true) {
                        const ktype = MonoApi.mono_class_get_type(parrent);
                        const fname = MonoApi.mono_type_get_name(ktype).readCString();
                        classObj = _classWrap({
                            handle: parrent,
                            fullName: fname
                        });
                        break;
                    }
                    current = parrent;
                }
            }

            const result = _methodWrap({
                handle: hMethod,
                name: methodName,
                class: classObj
            });
            cacheLookMethod[signature] = result;
            return result;
        },
        field: (classObj, fieldName) => {
            const fn = Memory.allocUtf8String(fieldName);
            const hfield = MonoApi.mono_class_get_field_from_name(classObj.handle, fn);
            if (hfield.isNull() === true) return null;
            return _fieldWrap(hfield, fieldName);
        },
        setHook: (imageName, className, methodName, numArg, callbacks, leave) => {
            /** @type {MethodWrapper} */
            let methodObj;
            let address;
            if (imageName !== null && imageName.handle !== undefined) {
                methodObj = imageName;
                address = imageName.address;
                callbacks = className;
                leave = methodName;
            }
            else {
                methodObj = MonoApiHelper.findMethod(imageName, className, methodName, numArg);
                if (methodObj === null)
                    return console.warn('Hook not found! ' + imageName + ' ' + className + '.' + methodName);
                address = methodObj.address;
            }

            if (address.isNull() === true) {
                return console.warn("setHook.SkipNullAddress: " + JSON.stringify(methodObj, null, 2));
            }

            console.warn(isAot === false ? `Attach: ${address}` : `Attach: ${address} => ${address.sub(_mod.base)}`);
            const _onEnter = callbacks instanceof Function === true ? callbacks : undefined;
            const _onLeave = leave instanceof Function === true ? leave : undefined;
            if (_onEnter !== undefined || _onLeave !== undefined) {
                return Interceptor.attach(address, {
                    onEnter: _onEnter,
                    onLeave: _onLeave
                });
            }

            return Interceptor.attach(address, callbacks);
        }
    }

    //const Emum = MonoApiHelper.findClass('System.Enum');
    const SByte = MonoApiHelper.findClass('System.SByte');
    const Byte = MonoApiHelper.findClass('System.Byte');
    const Boolean = MonoApiHelper.findClass('System.Boolean');
    const Int16 = MonoApiHelper.findClass('System.Int16');
    const UInt16 = MonoApiHelper.findClass('System.UInt16');
    const Int32 = MonoApiHelper.findClass('System.Int32');
    const UInt32 = MonoApiHelper.findClass('System.UInt32');
    const Int64 = MonoApiHelper.findClass('System.Int64');
    const UInt64 = MonoApiHelper.findClass('System.UInt64');
    const Single = MonoApiHelper.findClass('System.Single');
    const Double = MonoApiHelper.findClass('System.Double');
    const IntPtr = MonoApiHelper.findClass('System.IntPtr');

    const mString = MonoApiHelper.findClass('System.String');
    const ArrayByte = MonoApi.mono_array_class_get(Byte.handle, 1);
    const ArrayInt32 = MonoApi.mono_array_class_get(Int32.handle, 1);
    const ArrayString = MonoApi.mono_array_class_get(mString.handle, 1);

    cacheKnownType[IntPtr.handle] = {
        get() { return this.unbox().readPointer(); },
        set(v) { this.unbox().writePointer(v); }
    }
    cacheKnownType[SByte.handle] = {
        get() { return this.unbox().readS8(); },
        set(v) { this.unbox().writeS8(v); }
    }
    cacheKnownType[Byte.handle] = {
        get() { return this.unbox().readU8(); },
        set(v) { this.unbox().writeU8(v); }
    }
    cacheKnownType[Boolean.handle] = {
        get() { return this.unbox().readU8() === 1; },
        set(v) { this.unbox().writeU8(v === true ? 1 : 0); }
    }
    cacheKnownType[Int16.handle] = {
        get() { return this.unbox().readS16(); },
        set(v) { this.unbox().writeS16(v); }
    }
    cacheKnownType[UInt16.handle] = {
        get() { return this.unbox().readU16(); },
        set(v) { this.unbox().writeU16(v); }
    }
    cacheKnownType[Int32.handle] = {
        get() { return this.unbox().readS32(); },
        set(v) { this.unbox().writeS32(v); }
    }
    cacheKnownType[UInt32.handle] = {
        get() { return this.unbox().readU32(); },
        set(v) { this.unbox().writeU32(v); }
    }
    cacheKnownType[Int64.handle] = {
        get() { return this.unbox().readS64(); },
        set(v) { this.unbox().writeS64(v); }
    }
    cacheKnownType[UInt64.handle] = {
        get() { return this.unbox().readU64(); },
        set(v) { this.unbox().readDouble(v); }
    }
    cacheKnownType[Single.handle] = {
        get() { return this.unbox().readFloat(); },
        set(v) { this.unbox().writeFloat(v); }
    }
    cacheKnownType[Double.handle] = {
        get() { return this.unbox().readDouble(); },
        set(v) { this.unbox().writeDouble(v); }
    }

    // TODO: NativePointer: assign internal value to not supported (.replace)
    cacheKnownType[mString.handle] = {
        get() {
            return this.readMonoString();
        },
        set(v) {
            this.replace(v instanceof NativePointer ? v : Memory.allocMonoString(v));
        }
    }
    cacheKnownType[ArrayByte] = {
        get() {
            const p = this.add(OFFSET_ARRAY_DATA);
            const s = this.add(OFFSET_ARRAY_DATA - POINTER_SIZE).readU32();
            return new Uint8Array(ArrayBuffer.wrap(p, s));
        },
        set(v) {
            this.replace(v instanceof NativePointer ? v : v.buffer.unwrap());
        }
    }
    cacheKnownType[ArrayInt32] = {
        get() {
            const p = this.add(OFFSET_ARRAY_DATA);
            const s = this.add(OFFSET_ARRAY_DATA - POINTER_SIZE).readU32();
            return new Int32Array(ArrayBuffer.wrap(p, s * 4));
        },
        set(v) {
            this.replace(v instanceof NativePointer ? v : v.buffer.unwrap());
        }
    }
    cacheKnownType[ArrayString] = {
        get() {
            const p = this.add(OFFSET_ARRAY_DATA);
            const s = this.add(OFFSET_ARRAY_DATA - POINTER_SIZE).readU32();
            let len = s;
            var pz = new Proxy({
                length: len,
                toString: () => { '[ArrayString ' + this + ']' },
                valueOf: () => { this }
            }, {
                get(target, prop) {
                    if (prop === Symbol.iterator) {
                        return function* () {
                            for (let i = 0; i < len; i++) {
                                yield p.add(i * POINTER_SIZE).readPointer().readMonoString();
                            }
                        }
                    }
                    if (prop === 'length') {
                        return len;
                    }

                    const index = parseInt(prop);
                    return p.add(index * POINTER_SIZE).readPointer().readMonoString();
                },
                set(target, prop, value) {
                    //console.log('String[] set', typeof prop);
                    //console.log(prop);
                    if (prop === 'length') {
                        len = value;
                        return true;
                    }
                    const index = parseInt(prop);
                    if (index === NaN) return false;
                    const str = Memory.allocMonoString(value);
                    p.add(index * POINTER_SIZE).writePointer(str);
                    return true;
                }
            });

            return pz;
        },
        set(v) {
            this.replace(v);
        }
    }

    NativePointer.prototype.unbox = function () {
        return MonoApi.mono_object_unbox(this);
    }

    NativePointer.prototype.cast = function (clazz) {
        return _objectWrap(clazz, this);
    }

    NativePointer.prototype.wrap = function () {
        const kclass = MonoApi.mono_object_get_class(this);
        const ktype = MonoApi.mono_class_get_type(kclass);
        const fname = MonoApi.mono_type_get_name(ktype).readCString();
        return _objectWrap(_classWrap({
            handle: kclass,
            fullName: fname
        }), this);
    }

    function processKnownReader(kclass, isValue) {
        //console.warn('processKnownReadeer', kclass, !!isValue);
        const prop = cacheKnownType[kclass];
        if (prop !== undefined) {
            // re-assign (current object)
            // called from value getter => return value too
            Object.defineProperty(this, 'value', prop);

            //console.log('found', prop);

            return this.value;
        }

        // Generic
        const ktype = MonoApi.mono_class_get_type(kclass);
        const fname = MonoApi.mono_type_get_name(ktype).readCString();
        //console.warn('GenericValue', fname, !!isValue);
        if (fname.startsWith('System.Collections.Generic.List<') === true) {
            const list1 = _objectWrap(_classWrap({
                handle: kclass,
                fullName: fname
            }), this);

            // try fallback to T[]
            const v = list1._items.getValue().value;
            //const v = list1._items.address.value;

            // set real length
            let s = list1._size.value;
            Object.defineProperty(v, 'length', {
                enumerable: true,
                configurable: true,
                get() {
                    return s;
                },
                set(v) {
                    s = v;
                    return true;
                }
            });
            if (v.length !== s) {
                v.length = s;
            }

            // no cache (may re-alloc)
            return v;
        }
        else if (fname.startsWith('System.Collections.Generic.Dictionary<') === true) {
            const dict2 = _objectWrap(_classWrap({
                handle: kclass,
                fullName: fname
            }), this);

            //const get_Keys = dict2['System.Collections.Generic.IDictionary<TKey,TValue>.get_Keys'].bind(dict2.handle);
            //const get_Count = dict2.get_Count.bind(dict2.handle);
            //const get_Item = dict2.get_Item.bind(dict2.handle);
            const TryGetValue = dict2.TryGetValue.bind(dict2.handle);
            const set_Item = dict2.set_Item.bind(dict2.handle);

            //const itemtype = set_Item.argumentTypes[1].handle; // QuickJS bind loss argumentTypes
            const itemtype = dict2.set_Item.argumentTypes[1].handle;
            let valuetype = cacheValueType[itemtype];
            if (valuetype === undefined) {
                cacheValueType[itemtype] = valuetype = MonoApi.type_is_valuetype(itemtype);
            }

            // out => write pointer or value
            const itemOut = Memory.alloc(POINTER_SIZE);
            const r = valuetype
                ? () => {
                    //console.error('value type');
                    const clazz = MonoApi.mono_class_from_mono_type(itemtype);

                    //// fake unbox: issue, this call (enum.ToString need boxing this)
                    // itemOut.unbox = () => itemOut;
                    // itemOut.wrap = () =>  _objectWrap(_classWrap( { handle: clazz }), itemOut);
                    // return processKnownReader.call(itemOut, clazz, true);

                    ////stable
                    return MonoApi.mono_value_box(clazz, itemOut).value;
                }
                : () => {
                    //console.error('boxing type');
                    return itemOut.readPointer().value; // return value
                    //return itemOut.readPointer(); // return ptr (wrong, it clone)
                };

            const proxy = new Proxy(dict2, {
                get(t, k) {
                    const have = TryGetValue(k, itemOut);
                    if (have.value === true) {
                        return r();
                    }
                    console.error('keyNotFound', k);

                    // Object methods + field
                    return dict2[k];
                },
                set(t, k, v) {
                    set_Item(k, v);
                    return true;
                },
                ownKeys() {
                    return get_Keys().value;
                },
                getOwnPropertyDescriptor(t, k) {
                    return { value: this.get(t, k), enumerable: true, configurable: true };
                }
            });

            return proxy;
        }
        else if (fname.endsWith('[]') === true) {
            // T[]
            const p = this.add(OFFSET_ARRAY_DATA);
            const s = this.add(OFFSET_ARRAY_DATA - POINTER_SIZE).readU32();
            const b = ArrayBuffer.wrap(p, s * POINTER_SIZE);
            const a = new POINTER_ARRAY(b);

            var pz = new Proxy(a, {
                get(target, prop) {
                    try {
                        const index = parseInt(prop);
                        const item = target[index];
                        const p = ptr(item.toString());
                        return p; // need .value
                    }
                    catch {
                        // length, toJSON, ...?
                        if (prop === 'length')
                            return s;
                    }
                },
                set(target, prop, value) {
                    const index = parseInt(prop);
                    p.add(index * POINTER_SIZE).writePointer(value);
                    return true;
                }
            });

            return pz;
        }

        return _objectWrap(_classWrap({
            handle: kclass,
            fullName: fname
        }), this);
    }

    Object.defineProperty(NativePointer.prototype, 'value', {
        configurable: true,
        enumerable: false,
        get() {
            // invoke return valuetype? possible?
            // invoke will need re-assign value prop
            // 
            // can't detect void* (=> get class fail)
            // can't assign voi* too, NativePointer inot support that feature
            //console.warn('PointerType_LookupGet', this);
            const kclass = MonoApi.mono_object_get_class(this);
            return processKnownReader.call(this, kclass);
        },
        set(v) {
            //console.warn('PointerType_LookupSet', this);
            const kclass = MonoApi.mono_object_get_class(this);
            const prop = cacheKnownType[kclass];
            if (prop !== undefined) {
                delete this.value;
                Object.defineProperty(this, 'value', prop);
                this.value = v;
            }
        }
    });

    /**
     *  ReadOnly
     * @param {Object} o 
     * @param {NativePointer} o.handle
     * @param {ClassWrapper} o.class
     * @returns { TypeWrapper }
     */
    function _typeWrap(o) {
        const handle = o.handle;
        const c = cacheTypes[handle];
        if (c !== undefined) return c;

        const t = {
            handle: handle,
            get class() {
                if (o.class !== undefined) {
                    // wrap from class
                    delete this.class;
                    return this.class = o.class;
                }
                else {
                    // wrap from args
                    const kclass = MonoApi.mono_class_from_mono_type(handle);
                    let clazz = cacheClasss[kclass];
                    if (clazz === undefined) {
                        clazz = _classWrap({
                            handle: kclass,
                            fullName: MonoApi.mono_type_get_name(handle).readCString()
                        });
                    }
                    delete this.class;
                    return this.class = clazz;
                }
            },
            get value() {
                const obj = MonoApi.mono_type_get_object(o.handle);
                delete this.value;
                return this.value = obj;
            },
            get valuetype() {
                delete this.valuetype;
                return this.valuetype = MonoApi.type_is_valuetype(handle) === 1;
            },
            get enum() {
                delete this.enum;
                return this.enum = this.class.enum;
            },
            get byref() {
                delete this.valuetype;
                return this.valuetype = MonoApi.mono_type_is_byref(handle) === 1;
            },
            get ptr() {
                delete this.ptr;
                return this.ptr = this.class.fullName.endsWith('*');
            },
            [Symbol.toPrimitive](hint) {
                if (hint === 'number') {
                    return uint64(handle.toString()).toNumber();
                }
                return '[TypeWrapper ' + t.class.fullName + ' ' + handle + ']';
            },
        }

        cacheTypes[handle] = t;
        return t;
    }

    /** No cache */
    function _fieldWrap(handle, name) {
        const type = MonoApi.mono_field_get_type(handle);
        let valuetype = cacheValueType[type];
        if (valuetype === undefined) {
            cacheValueType[type] = valuetype = MonoApi.type_is_valuetype(type);
        }

        const f = {
            handle: handle,
            /** @type {NativePointerMono} ObjectWrap handle */
            thiz: undefined,
            name,
            valuetype: valuetype,
            /** @type {TypeWrapper} field type */
            get type() {
                delete this.type;
                return this.type = _typeWrap({ handle: type })
            },
            get class() {
                delete this.class;
                return this.class = this.type.class;
            },
            get _classHandle() {
                delete this._classHandle;
                return this._classHandle = this.class.handle;
            },
            get _classVTable() {
                delete this._classVTable;
                return this._classVTable = MonoApi.mono_class_vtable(this._classHandle);
            },
            getValue(holder = undefined) {
                // .value will write to return instead
                const buf = Memory.alloc(POINTER_SIZE);
                function bufDataValue() {
                    const support = cacheKnownType[f._classHandle];
                    if (support !== undefined) {
                        Object.defineProperty(buf, 'value', support);
                    }
                    else {
                        Object.defineProperty(buf, 'value', {
                            get() {
                                return _objectWrap(f._classHandle, this);
                            },
                            set(v) {
                                if (v.handle) {
                                    buf.writePointer(v.handle.readPointer());
                                }
                                else buf.writePointer(v.readPointer());
                            }
                        })
                    }
                }

                if (f.static === true) {
                    if (f.valuetype === true) {
                        f.getValue = function () {
                            MonoApi.mono_field_static_get_value.call(f, f.handle, buf);
                            return buf;
                        }

                        buf.unbox = () => buf;
                        bufDataValue();
                    }
                    else {
                        f.getValue = function () {
                            MonoApi.mono_field_static_get_value.call(f, f.handle, buf);
                            return buf.readPointer();
                        }
                    }

                    return f.getValue();
                }
                else {
                    if (f.valuetype === true) {
                        f.getValue = function (holder) {
                            const thiz = holder ?? f.thiz; // use current if no holder provided
                            MonoApi.mono_field_get_value(thiz, f.handle, buf);
                            buf.handle = thiz;
                            return buf;
                        }

                        buf.unbox = () => buf;
                        bufDataValue();
                    }
                    else {
                        f.getValue = function (holder) {
                            const thiz = holder ?? f.thiz; // use current if no holder provided
                            MonoApi.mono_field_get_value(thiz, f.handle, buf);
                            buf.handle = thiz;
                            return buf.readPointer();
                        }
                    }
                    return f.getValue(holder);
                }
            },
            setValue(v, holder = undefined) {
                if (f.static === true) {
                    f.setValue = function (v) {
                        MonoApi.mono_field_static_set_value.call(f, f.handle, v);
                    }
                    f.setValue(v);
                }
                else {
                    f.setValue = function (v, holder) {
                        const thiz = holder ?? f.thiz; // use current if no holder provided
                        MonoApi.mono_field_set_value(thiz, f.handle, v);
                    }
                    f.setValue(v, holder);
                }
            },
            get value() {
                return this.address.value;
            },
            set value(v) {
                return this.address.value = v;
            },
            // fake static adress but allow modify value
            // TODO: real static address; merge get-setValue
            get address() {
                if (this.static === true) {
                    const buf = Memory.alloc(POINTER_SIZE);
                    if (valuetype === true) {
                        const address = ptr(-1);

                        const support = cacheKnownType[f._classHandle];
                        let get;
                        buf.unbox = () => buf;
                        if (support !== undefined) {
                            get = function () {
                                MonoApi.mono_field_static_get_value.call(f, f.handle, buf);
                                return support.get.call(buf);
                            }
                        }
                        else {
                            get = function () {
                                const tmp = Memory.alloc(Process.pageSize);
                                MonoApi.mono_field_static_get_value.call(f, f.handle, tmp);
                                return _objectWrap(f.class, tmp);
                            }
                        }
                        Object.defineProperty(address, 'value', {
                            get,
                            set(v) {
                                let adr;
                                if (v instanceof NativePointer) {
                                    adr = v;
                                }
                                else if (v.handle !== undefined) {
                                    adr = v.handle; // object wrapper
                                }
                                else {
                                    support.set.call(buf, v);
                                    adr = buf;
                                }
                                MonoApi.mono_field_static_set_value.call(f, f.handle, adr);
                            }
                        });

                        delete this.address;
                        return this.address = address;
                    }

                    MonoApi.mono_field_static_get_value.call(f, f.handle, buf);
                    const address = buf.readPointer();
                    Object.defineProperty(address, 'value', {
                        get() {
                            // address my change, we need stable
                            MonoApi.mono_field_static_get_value.call(f, f.handle, buf);
                            const adr = buf.readPointer();
                            adr.pointer = buf; // fake
                            setValueProp(adr);

                            return adr.value;
                        },
                        set(v) {
                            let adr;
                            if (v instanceof NativePointer) {
                                adr = v;
                            }
                            else if (v.handle !== undefined) {
                                adr = v.handle; // object wrapper
                            }
                            else {
                                const t = typeof v;
                                if (t === 'string') {
                                    adr = Memory.allocMonoString(v);
                                }
                                else {
                                    return console.error('not implemented');
                                }
                            }

                            MonoApi.mono_field_static_set_value(f._classVTable, f.handle, adr);
                        }
                    });

                    delete this.address;
                    return this.address = address;
                }
                else {
                    const pointer = this.thiz.add(this.offset);
                    if (valuetype === true) {
                        setValuePropUnboxed(pointer);
                        delete this.address;
                        return this.address = pointer;
                    }

                    const address = pointer.readPointer();
                    if (f.type.ptr === true) {
                        Object.defineProperty(address, 'value', {
                            get() { return pointer.readPointer(); },
                            set(v) { pointer.writePointer(v); }
                        });
                    }
                    else {
                        address.pointer = pointer;
                        setValueProp(address);
                    }
                    delete this.address;
                    return this.address = address;
                }
            },
            get offset() {
                delete this.offset;
                return this.offset = MonoApi.mono_field_get_offset(this.handle);
            },
            get static() {
                const flags = MonoApi.mono_field_get_flags(this.handle);
                const v = (flags & 0x0010) !== 0;
                delete this.static;
                return this.static = v;
            },
            wrap() {
                // void* = 0x11223344
                let v = this.getValue();
                if (f.valuetype === true) {
                    v = MonoApi.mono_value_box(this._classHandle, v);
                }
                return _objectWrap(this.class, v);
            },
            toString() {
                return this.handle.toString();
            },
            valueOf() {
                return handle;
            },
            [Symbol.toPrimitive](hint) {
                if (hint === 'number') {
                    return uint64(handle.toString()).toNumber();
                }
                return '[FieldWrapper ' + f.class.fullName + ' ' + name + '; ' + handle + ']';
            },
        }

        // valuetype
        function setValuePropUnboxed(address) {
            const clazz = f._classHandle;
            const support = cacheKnownType[clazz];
            address.unbox = () => address;
            if (support !== undefined) {
                Object.defineProperty(address, 'value', support);
            }
            else {
                Object.defineProperty(address, 'value', {
                    get() {
                        return _objectWrap(clazz, address);
                    },
                    set(v) {
                        let adr;
                        if (v instanceof NativePointer) {
                            v = adr;
                        }
                        else if (v.handle !== undefined) {
                            v = v.handle;
                        }
                        else {
                            return console.error('not implemented');
                        }

                        MonoApi.mono_field_set_value(f.thiz, f.handle, adr);
                    }
                });
            }
        }
        // boxing
        function setValueProp(address) {
            const clazz = f._classHandle;
            Object.defineProperty(address, 'value', {
                configurable: true,
                get() {
                    // Knowntype will replace new getter (okay)
                    // and new setter (okay, need replace chain)
                    // TODO: may unstable
                    address.replace = function (v) {
                        this.pointer.writePointer(v);
                        v.pointer = this.pointer;
                        v.replace = this.replace;
                        delete f.address;
                        f.address = v;

                        setValueProp(v);
                    }
                    return processKnownReader.call(address, clazz);
                },
                set(v) {
                    let adr;
                    if (v instanceof NativePointer) {
                        adr = v;
                    }
                    else if (v.handle !== undefined) {
                        adr = v.handle; // object wrapper
                    }
                    else {
                        const t = typeof v;
                        if (t === 'string') {
                            adr = Memory.allocMonoString(v);
                        }
                        else {
                            return console.error('not implemented');
                        }
                    }
                    address.pointer.writePointer(adr);
                    v.pointer = address.pointer;
                    delete f.address;
                    f.address = v;

                    setValueProp(v);
                }
            });
        }

        return f;
    }

    /**
     * Method & Overload
     * @param {Object} o 
     * @param {NativePointer} o.handle
     * @param {string} o.fullName
     * @returns {MethodWrapper}
     */
    function _methodWrap(o) {
        const m = makeMethodCallable();
        const fp = Object.create(Function.prototype, {
            handle: {
                enumerable: true,
                configurable: true,
                get() {
                    delete fp.handle;
                    return fp.handle = o.handle;
                }
            },
            fullName: {
                enumerable: true,
                configurable: true,
                get() {
                    delete fp.fullName;
                    return fp.fullName = o.name !== undefined ? fp.fullName = o.name
                        : MonoApi.mono_method_get_name(fp.handle).readCString();
                }
            },
            /** @type {ClassWrapper} */
            class: {
                configurable: true,
                get() {
                    delete fp.class;
                    return fp.class = o.class;
                }
            },
            /** @type {string[]} */
            args: {
                enumerable: true,
                configurable: true,
                get() {
                    o._args = [];
                    o._argsType = [];
                    if (isAot === true) {
                        const argCnt = MonoApi.mono_method_get_param_count(this.handle);
                        for (let i = 0; i < argCnt; i++) {
                            const ptype = MonoApi.mono_method_get_param(this.handle, i);
                            const ptypeName = MonoApi.mono_type_get_name(ptype).readCString();
                            o._args.push(ptypeName);
                            o._argsType.push(_typeWrap({
                                handle: ptype
                            }));
                        }

                        const retType = MonoApi.il2cpp_method_get_return_type(this.handle);
                        o._ret = MonoApi.mono_type_get_name(retType).readCString();
                        o._retType = _typeWrap({
                            handle: retType
                        });
                    }
                    else {
                        const sig = MonoApi.mono_method_signature(this.handle);
                        if (sig.isNull() === false) {
                            const argCnt = MonoApi.mono_signature_get_param_count(sig);
                            const iter = Memory.alloc(POINTER_SIZE);
                            for (let i = 0; i < argCnt; i++) {
                                const ptype = MonoApi.mono_signature_get_params(sig, iter);
                                const ptypeName = MonoApi.mono_type_get_name(ptype).readCString();
                                o._args.push(ptypeName);
                                o._argsType.push(_typeWrap({
                                    handle: ptype
                                }));
                            }

                            const retType = MonoApi.mono_signature_get_return_type(sig);
                            o._ret = MonoApi.mono_type_get_name(retType).readCString();
                            o._retType = _typeWrap({
                                handle: retType
                            });
                        }
                    }
                    delete fp.args;
                    return fp.args = o._args;
                }
            },
            /** @type {TypeWrapper[]} */
            argumentTypes: {
                configurable: true,
                get() {
                    const _ = fp.args;
                    delete fp.argumentTypes;
                    return fp.argumentTypes = o._argsType;
                }
            },
            /** @type {string} */
            return: {
                enumerable: true,
                configurable: true,
                get() {
                    const _ = fp.args;
                    delete fp.return;
                    return fp.return = o._ret;
                }
            },
            /** @type {TypeWrapper} */
            returnType: {
                configurable: true,
                get() {
                    const _ = fp.args;
                    delete fp.return;
                    return fp.return = o._retType;
                }
            },
            /** @type {NativePointer} */
            address: {
                enumerable: true,
                configurable: true,
                get() {
                    if (fp.generic === true)
                        return NULL;
                    const ptr = isAot === true
                        ? fp.handle.readPointer()
                        : MonoApi.mono_compile_method(fp.handle);
                    delete fp.address;
                    return fp.address = ptr;
                }
            },
            /** @type {boolean} */
            generic: {
                enumerable: true,
                configurable: true,
                get() {
                    delete fp.generic;
                    return fp.generic = MonoApi.mono_method_is_generic(fp.handle) === 1;
                }
            },
            /** @type {boolean} */
            inflated: {
                enumerable: true,
                configurable: true,
                get() {
                    delete fp.inflated;
                    return fp.inflated = MonoApi.mono_method_is_inflated(fp.handle) === 1;
                }
            },
            /** @type {boolean} */
            instance: {
                enumerable: true,
                configurable: true,
                get() {
                    delete fp.instance;
                    return fp.instance = MonoApi.mono_method_is_instance(fp.handle) === 1; // frida bug bool 1
                }
            },
            _instanceEnum: {
                configurable: true,
                get() {
                    delete fp._instanceEnum;
                    return fp._instanceEnum = fp.class.enum;
                }
            },
            _instanceValue: {
                configurable: true,
                get() {
                    delete fp._instanceValue;
                    return fp._instanceValue = fp.class.valuetype;
                }
            },
            // get MethodInfo
            value: {
                configurable: true,
                get() {
                    delete fp.value;
                    return fp.value = MonoApi.mono_method_get_object(fp.handle, fp.class.handle);
                }
            },
            /** @type {MethodWrapper[]} */
            overloads: {
                configurable: true,
                configurable: true,
                get() {
                    // { argSign: method, argSign: method}
                    // fridaJava return like: [method, method, ...]
                    const obj = fp.class.methods[fp.fullName];
                    const overloads = Object.keys(obj).map((key) => obj[key]);
                    delete fp.overloads;
                    return fp.overloads = overloads;
                }
            },
            /* Functionn */
            // clone
            overload: {
                value(args = []) {
                    if (typeof args === 'string') {
                        if (arguments.length > 1) {
                            args = Object.keys(arguments).map(i => normalizeType(arguments[i]));
                        }
                        else {
                            args = normalizeType(args);
                        }
                    }
                    const overloads = this.class.methods[this.fullName];

                    let msg = this.fullName + '(): specified argument types do not match any of:';
                    if (overloads === undefined) {
                        const types = this.args.length === 0 ? '' : "" + this.args + "'";
                        throw new Error(msg + "\r\n        .overload(" + types + ")");
                    }

                    const sigs = args.toString();
                    const overload = overloads[sigs];
                    if (overload !== undefined) {
                        // skip same overload (current)
                        if (this.address === overload.address) {
                            // we in instance
                            if (this.thiz !== undefined) {
                                // another instance?
                                if (this.thiz === overload.thiz)
                                    return this;

                                return _methodWrap({
                                    handle: this.handle,
                                    class: this.class,
                                    thiz: this.thiz
                                });
                            }
                        }

                        // we in instance + not same overload
                        if (this.thiz !== undefined) {
                            return _methodWrap({
                                handle: overload.handle,
                                class: this.class,
                                thiz: this.thiz
                            });
                        }

                        // no instance + not same overload
                        return overload;
                    }

                    for (let key of Object.keys(overloads)) {
                        if (key === '') msg += "\r\n        .overload()";
                        else msg += "\r\n        .overload('" + key.replaceAll(',', "', '") + "')";
                    }
                    throw new Error(msg);
                }
            },
            attach: {
                value(callbacksOrProbe) {
                    return Interceptor.attach(this.address, callbacksOrProbe);
                }
            },
            // only support raw mono pointer
            // not support direct invoke (outside implementation)
            // set <=> replace with another hook
            implementation: {
                get() {
                    const adr = this.address;
                    let impl = cacheImpl[adr];
                    if (impl === undefined) {
                        const { retType, argTypes } = _methodGetImp.call(this);
                        cacheImpl[adr] = impl = new NativeFunction(adr, retType, argTypes);
                    }
                    return impl;
                },
                set(v) {
                    const adr = this.address;
                    Interceptor.revert(adr);
                    if (v instanceof Function) {
                        const { retType, argTypes } = _methodGetImp.call(this);
                        Interceptor.replace(adr, new NativeCallback(v, retType, argTypes));
                        o._replace = true;
                    }
                    else {
                        o._replace = false;
                    }
                }
            },
            // suport raw number and mono number (auto unwrap)
            // support call, apply with another instance
            // problem: - boxing: valuetype, enum, primes
            // TODO: switch to invoke array or direct invoke
            _invoke: {
                value(...params) {
                    let thiz = NULL;
                    if (fp.instance === true) {
                        if (this instanceof NativePointer === true) {
                            thiz = this;
                        }
                        else if (this == null) { // null or undefinded
                            //thiz = m.thiz; // wrong function behaviour (detached)
                            throw new Error(m.fullName + ': cannot call instance method without an instance');
                        }
                        else {//console.log('from wrapper');
                            thiz = this.thiz;
                        }
                    }

                    const N = params.length;
                    if (N !== 0) {
                        const offset = N * POINTER_SIZE;
                        const _args = Memory.alloc(offset * 2);
                        let argx = _args.add(offset);
                        for (let i = 0; i < N; i++) {
                            let paramHandle = params[i];
                            const t = typeof paramHandle;
                            if (t === 'string') {
                                paramHandle = Memory.allocMonoString(paramHandle);
                                params[i] = paramHandle; // pin
                            }
                            else if (t === 'number') {
                                const format = m.args[i];
                                if (format === 'System.Single') {
                                    argx.writeFloat(paramHandle);
                                }
                                else if (format === 'System.Double') {
                                    argx.writeDouble(paramHandle);
                                }
                                else {
                                    argx.writeInt(paramHandle);
                                }

                                paramHandle = argx;
                                argx = argx.add(POINTER_SIZE);
                            }
                            else if (t === 'boolean') {
                                argx.writeInt(paramHandle === true ? 1 : 0);
                                paramHandle = argx;
                                argx = argx.add(POINTER_SIZE);
                            }
                            else {
                                if (paramHandle instanceof NativePointer === false) {
                                    paramHandle = paramHandle.handle; // wrap, need unbox too
                                }
                                /** @type {TypeWrapper} */
                                const argType = m.argumentTypes[i];

                                //console.error(m.args[i], argType.byref, argType.valuetype, argType.class.enum);
                                if (argType.byref === false) {
                                    if (cacheIsPrimes[m.args[i]] !== undefined || argType.enum === true) {
                                        paramHandle = paramHandle.unbox();
                                    }
                                }

                            }
                            _args.add(i * POINTER_SIZE).writePointer(paramHandle);
                        }
                        params = _args;
                    }
                    else {
                        params = NULL;
                    }

                    return m.invoke(thiz, params);
                }
            },
            // raw invoke; return boxed + valuetype?
            invoke: {
                value(thiz = NULL, args = NULL) {
                    // console.log('invoke__', m.class.fullName + '.' + m.fullName + ' - ' + args + ' ' + thiz);
                    const exception = Memory.alloc(16);

                    const monoObj = MonoApi.mono_runtime_invoke(
                        m.handle /* MethodInfo* */,
                        thiz, /* MonoOpject* */
                        args /* void** */,
                        exception /* MonoException** <=> System.Exception* */
                    );  // MonoObject*
                    const e = exception.readPointer();
                    if (e.isNull() === false) {
                        let expStr = cacheImpl._expStr;
                        if (expStr === undefined) {
                            expStr = findClass('mscorlib', 'System.Exception').ToString.implementation;
                            cacheImpl._expStr = expStr;
                        }
                        //console.error('MonoError:\r\n' + e.add(0x20).readPointer().readMonoString());
                        console.error('MonoError:\r\n' + expStr(e).readMonoString());
                        throw new Error();
                        //console.error(new Error().stack);
                    }
                    return monoObj;
                }
            },
            // get new inflated method
            inflate: {
                value(...classes) {
                    const N = classes.length;
                    // let MakeGenericMethod, setItem, hArrType, get_MethodHandle;
                    if (cacheImpl.MakeGenericMethod === undefined) {
                        const log = console.log; console.log = () => { };
                        const Activator = MonoApiHelper.findClass('System.Activator');
                        cacheImpl.CreateInstance = Activator.CreateInstance.overload('System.Type');
                        // also init inflate class
                        const Type = MonoApiHelper.findClass('System.Type');
                        cacheImpl.hArrType = Type.handle;

                        const RuntimeType = MonoApiHelper.findClass('System.RuntimeType') ?? Type; // 2019 -> 2017
                        cacheImpl.MakeGenericType = RuntimeType.MakeGenericType.overload('System.Type[]');

                        const MethodInfo = MonoApiHelper.findClass('System.Reflection.MonoMethod')
                            ?? MonoApiHelper.findClass('System.Reflection.MethodInfo');
                        cacheImpl.MakeGenericMethod = MethodInfo.MakeGenericMethod.overload('System.Type[]');
                        cacheImpl.get_MethodHandle = MethodInfo.get_MethodHandle.overload();

                        const types = MonoApi.mono_array_new(cacheImpl.hArrType, 1);
                        cacheImpl.setItem = types.wrap()
                        ['System.Collections.Generic.IList`1.set_Item']
                            .overload('System.Int32', 'System.Type');
                        console.log = log;
                    }
                    const types = MonoApi.mono_array_new(cacheImpl.hArrType, N);

                    //// unsafe
                    // const offset = types.add(OFFSET_ARRAY_DATA);
                    // for (let i = 0; i < N; i++) {
                    //     offset.add(i * POINTER_SIZE).writePointer(classes[i].type.value);
                    // }

                    //// unboxNumber error
                    // const index = Memory.alloc(4);
                    // for (let i = 0; i < N; i++) {
                    //     index.writeInt(i);
                    //     cacheImpl.setItem.call(types, index, classes[i].type.value);
                    // }

                    const index = Memory.alloc(4);
                    const args = Memory.alloc(POINTER_SIZE * 2);
                    args.writePointer(index);
                    for (let i = 0; i < N; i++) {
                        index.writeInt(i);
                        args.add(POINTER_SIZE).writePointer(classes[i].type.value);
                        cacheImpl.setItem.invoke(types, args);
                    }

                    const mi = cacheImpl.MakeGenericMethod.call(fp.value, types);
                    const mh = cacheImpl.get_MethodHandle.invoke(mi);
                    return _methodWrap({
                        handle: mh.unbox().readPointer(),
                        thiz: m.thiz, // allow detached function inflate
                        class: fp.class
                    });
                }
            },
            toString: {
                value() {
                    return '[MethodWrapper ' + fp.return + ' ' + fp.fullName + '(' + fp.args + ')' + ' ' + fp.handle + ']';
                }
            },
            [Symbol.toPrimitive]: {
                value(hint) {
                    if (hint === 'number') {
                        return uint64(fp.handle.toString()).toNumber();
                    }
                    return fp.toString();
                }
            },
            $dump: {
                value() {
                    const overloads = this.class.methods[this.fullName];
                    console.log(this.fullName + '(' + this.args + ') => ' + this.return);
                    console.log(overloads ? JSON.stringify(Object.keys(overloads), null, 2) : ' * Inheritance: ' + this.args);
                }
            }
        });
        Object.setPrototypeOf(m, fp);
        m.thiz = o.thiz;

        return m;
    }

    function makeMethodCallable() {
        const m = function () {
            return m._invoke.apply(this, arguments);
        };
        return m;
    }

    function _methodGetImp() {
        const argTypes = [];
        let retType;

        // first = this
        if (this.instance === true) {
            argTypes.push('pointer');
        }

        const N = this.args.length;
        for (let i = 0; i < N; i++) {
            argTypes.push('pointer');
        }

        retType = this.return === 'System.Void' ? 'void' : 'pointer';

        return { retType, argTypes };
    }

    /** MonoObject Instance
     * @param {ClassWrapper} clazz
     * @returns {MonoObjectWrapper}
     */
    function _objectWrap(clazz, handle) {
        let c = cacheObjects[handle];
        if (c !== undefined) return c;

        const findMethod = MonoApiHelper.method.bind(MonoApiHelper, clazz);
        const findField = MonoApiHelper.field.bind(MonoApiHelper, clazz);

        const obj = {
            class: clazz,
            thiz: handle,
            handle,
            fullName: clazz.fullName,
            // like a NativePointer object
            unbox() {
                return handle.unbox();
            },
            wrap() {
                return c;
            },
            unwrap() {
                return handle;
            },
            valueOf() {
                return handle;
            },
            toString() {
                const ToString = findMethod('ToString', 0);
                if (ToString !== null) {
                    obj.toString = () => ToString.call(handle).readMonoString();
                }
                else {
                    obj.toString = () => '[ObjectWrapper ' + clazz.fullName + ' ' + handle + ']';
                }
                return obj.toString();
            },
            [Symbol.toPrimitive](hint) {
                if (hint === 'number') {
                    return uint64(handle.toString()).toNumber();
                }
                return '[ObjectWrapper ' + clazz.fullName + ' ' + handle + ']';
            },
            [Symbol.iterator]: function* () {
                const iter = findMethod('GetEnumerator').call(handle).wrap();
                while (iter.MoveNext().unbox().readU8() === 1) {
                    yield iter.get_Current();
                }
            },
            $dump() {
                clazz.$dump();
            },
        }

        if (clazz.type.ptr === true) {
            Object.defineProperty(obj, 'value', {
                configurable: true,
                get() { return handle },
                set(v) { handle = v; }
            });
        }
        else {
            Object.defineProperty(obj, 'value', {
                configurable: true,
                get() { return handle.value },
                set(v) { handle.value = v; }
            });
        }

        const wrapperHandler = {
            get(x, property) {
                const cache = x[property];
                if (cache !== undefined) {
                    return cache;
                }

                const field = findField(property);
                if (field !== null) {
                    x[property] = field;
                    // allway return new field (no cache)
                    field.thiz = handle;
                    return field;
                }

                const method = findMethod(property);
                if (method !== null) {
                    x[property] = method;
                    method.thiz = handle;
                    return method;
                }

                // TOOD: realProp
                const propGet = findMethod('get_' + property, 0);
                if (propGet !== null) {
                    const propSet = findMethod('set_' + property, 1);
                    const prop = {
                        get() { return propGet.invoke(handle); },
                        set(v) { return propSet.call(handle, v); }
                    }
                    Object.defineProperty(x, property, prop);
                    return x[property];
                }


                // pass to classwrapper proxy
                return clazz[property];
            }
        };
        c = new Proxy(obj, wrapperHandler);
        cacheObjects[handle] = c;

        return c;
    }

    /**
     * ReadOnly
     * @param {Object} o 
     * @param {NativePointer} o.handle
     * @param {string} o.fullName
     * @param {string} o.name
     * @param {string} o.namespace
     * @param {string} o.imageName
     * @returns {ClassWrapper}
     */
    function _classWrap(o) {
        const c = cacheClasss[o.handle];
        if (c !== undefined) return c;

        const v = MonoApi.mono_class_is_valuetype(o.handle);
        const htype = MonoApi.mono_class_get_type(o.handle);
        cacheValueType[htype] = v;

        // this = proxy
        const thix = {
            handle: o.handle,
            fullName: o.fullName,
            name: o.name,
            namespace: o.namespace,
            imageName: o.imageName,
            /** backward compatibility */
            findMethod: function (name, cndOrSig) {
                return MonoApiHelper.findMethod(thix, name, cndOrSig);
            },
            findField: function (name) {
                return MonoApiHelper.findField(thix, name);
            },
            // ownMethods
            get methods() {
                const _methods = Object.create(null);
                const iter = Memory.alloc(POINTER_SIZE);
                while (true) {
                    const mi = MonoApi.mono_class_get_methods(o.handle, iter);
                    if (mi.isNull() === true) {
                        break;
                    }
                    const wrap = _methodWrap({
                        handle: mi,
                        class: this // proxy
                    });
                    const key1 = wrap.fullName;
                    const key2 = wrap.args.toString();

                    if (_methods[key1] === undefined) {
                        _methods[key1] = Object.create(null);
                    }
                    _methods[key1][key2] = wrap;
                }
                delete thix.methods;
                thix.methods = _methods;
                o.methods = _methods; // for method()
                return _methods;
            },
            // may removed
            method: function (name, overload = -1) {
                const methods = o.methods;
                if (methods === undefined) {
                    return MonoApiHelper.findMethod(thix, name, overload); // fast lookup
                }
                const method = methods[name];
                if (method !== undefined) {
                    if (overload) {
                        let r = method[overload];
                        return r !== undefined ? r : null;
                    }
                    const overloads = Object.values(method);
                    return overloads[0];
                }
                return null;
            },
            get $ownMembers() {
                const methods = Object.keys(thix.methods);
                // TODO: fields

                delete thix.$ownMembers;
                thix.$ownMembers = methods;
                return methods;
            },
            /** @type {MonoObjectWrapper} */
            alloc() {
                const m = MonoApi.mono_object_new(thix.handle);
                return _objectWrap(this, m);
            },
            $new: function (...params) {
                const STR = { fullName: 'System.String' };
                const NUM = { fullName: 'System.Int32' };
                const BOOL = { fullName: 'System.Boolean' };
                const m = MonoApi.mono_object_new(thix.handle);
                const monoObjWrap = _objectWrap(this, m);
                const N = params.length;
                if (N === 0) {
                    MonoApi.mono_runtime_object_init(m); // call .ctor() - may crash
                }
                else {
                    const args = []; // pin
                    const sigs = []; // overload, build overload using paramWrap
                    const offset = N * POINTER_SIZE;
                    const _args = Memory.alloc(offset * 2);
                    let argx = _args.add(offset);
                    let paramHandle;
                    let paramWrap; // jsValue+ptr | monoValue (ptr) | wrap
                    for (let i = 0; i < N; i++) {
                        paramHandle = params[i];
                        paramWrap = paramHandle; // NativePointer
                        const t = typeof paramHandle;
                        if (t === 'string') {
                            paramHandle = Memory.allocMonoString(paramHandle);
                            params[i] = paramHandle; // pin
                            paramWrap = STR;
                        }
                        else if (t === 'number') {
                            argx.writeInt(paramHandle);
                            paramHandle = argx;
                            argx = argx.add(8);
                            paramWrap = NUM;
                        }
                        else if (t === 'boolean') {
                            argx.writeInt(paramHandle === true ? 1 : 0);
                            paramHandle = argx;
                            argx = argx.add(8);
                            paramWrap = BOOL;
                        }
                        else if (paramHandle instanceof NativePointer === false) {
                            paramHandle = paramWrap.handle; // objWrap.this
                        }
                        else {
                            // only mono obj
                            // TODO: Void*, detect param type?
                            paramWrap = paramHandle.wrap();
                            const t = paramWrap.fullName;
                            paramHandle = cacheIsPrimes[t] !== undefined ? paramHandle.unbox() : paramHandle;
                        }
                        args.push(paramWrap); // pin
                        sigs.push(paramWrap.fullName);
                        _args.add(i * POINTER_SIZE).writePointer(paramHandle);
                    }
                    //thix.method('.ctor', sigs.toString()).invoke(m, _args); // _invoke
                    thix.$init.overload(sigs.toString()).invoke(m, _args); // _invoke
                    //thix.$init.overload(sigs.toString()).implementation(m, ...args);
                }
                return monoObjWrap;
            },
            get $init() {
                const ctor = thix.method('.ctor');
                delete thix.$init;
                thix.$init = ctor;
                return ctor;
            },
            /** @type {boolean} */
            get inflated() {
                const v = !!MonoApi.mono_class_is_inflated(thix.handle);
                delete thix.inflated;
                return thix.inflated = v;
            },
            /** @type {boolean} */
            get generic() {
                const v = !!MonoApi.mono_class_is_generic(thix.handle);
                delete thix.generic;
                return thix.generic = v;
            },
            get type() {
                const type = _typeWrap({
                    handle: htype,
                    class: this
                })
                delete thix.type;
                return thix.type = type;
            },
            /** @see {TypeWrapper} */
            get value() {
                return thix.type.value;
            },
            /** @see {ClassWrapper} */
            get arrayClass() {
                delete thix.arrayClass;
                return thix.arrayClass = _classWrap({
                    handle: MonoApi.mono_array_class_get(thix.handle),
                    fullName: thix.fullName + '[]'
                });
            },
            /** @type {boolean} */
            get enum() {
                delete thix.enum;
                return thix.enum = MonoApi.mono_class_is_enum(o.handle) === 1;
            },
            /** @type {boolean} */
            valuetype: v === 1,
            inflate(...classes) {
                const N = classes.length;
                // CreateInstance, MakeGenericType, setItem, hArrType
                if (cacheImpl.setItem === undefined) {
                    const log = console.log; console.log = () => { };
                    const Activator = MonoApiHelper.findClass('System.Activator');
                    cacheImpl.CreateInstance = Activator.CreateInstance.overload('System.Type');

                    const Type = MonoApiHelper.findClass('System.Type');
                    cacheImpl.hArrType = Type.handle;

                    const RuntimeType = MonoApiHelper.findClass('System.RuntimeType') ?? Type; // 2019 -> 2017
                    cacheImpl.MakeGenericType = RuntimeType.MakeGenericType.overload('System.Type[]');

                    const MethodInfo = MonoApiHelper.findClass('System.Reflection.MonoMethod') ?? MonoApiHelper.findClass('System.Reflection.MethodInfo');
                    cacheImpl.MakeGenericMethod = MethodInfo.MakeGenericMethod.overload('System.Type[]');
                    cacheImpl.get_MethodHandle = MethodInfo.get_MethodHandle.overload();

                    const types = MonoApi.mono_array_new(cacheImpl.hArrType, 1);
                    cacheImpl.setItem = types.wrap()
                    ['System.Collections.Generic.IList`1.set_Item']
                        .overload('System.Int32', 'System.Type');
                    console.log = log;
                }
                const types = MonoApi.mono_array_new(cacheImpl.hArrType, N);

                //// unboxNumber error
                // const index = Memory.alloc(4);
                // for (let i = 0; i < N; i++) {
                //     index.writeInt(i);
                //     setItem.call(types, index, classes[i].type.value);
                // }

                const index = Memory.alloc(4);
                const args = Memory.alloc(POINTER_SIZE * 2);
                args.writePointer(index);
                for (let i = 0; i < N; i++) {
                    index.writeInt(i);
                    args.add(POINTER_SIZE).writePointer(classes[i].type.value);
                    cacheImpl.setItem.invoke(types, args);
                }

                const t = cacheImpl.MakeGenericType.call(thix.type.value, types);
                const m = cacheImpl.CreateInstance(t).wrap();
                return m.class;
            },
            toString() {
                return '[ClassWrapper ' + thix.fullName + ' ' + thix.handle + ']';
            },
            [Symbol.toPrimitive](hint) {
                if (hint === 'number') {
                    return uint64(thix.handle.toString()).toNumber();
                }
                return thix.toString();
            },
            $dump() {
                console.log('---');
                console.log('class ' + thix.fullName);
                console.log('  Generic: ' + thix.generic);
                console.log('  Inflated: ' + thix.inflated);
                console.log('  ValueType: ' + thix.valuetype);
                // include props
                console.log('\r\nMethods:');
                const methods = thix.methods;
                for (const methodName in methods) {
                    const method = methods[methodName];

                    console.log('  ' + methodName);
                    for (const sig in method) {
                        const overload = method[sig];

                        if (sig.length === 0) {
                            console.log('    - .overload()');
                        }
                        else {
                            console.log('    - .overload(\'' + sig.replaceAll(',', "', '") + "')");
                        }

                        console.log('      ' + overload.return);
                        console.log('      Generic : ' + overload.generic);
                        console.log('      Inflated: ' + overload.inflated);
                        console.log('      Instance: ' + overload.instance);
                        console.log('      handle  : ' + overload.handle);
                    }
                }

                console.log('\r\nFeilds:');
                const iter = Memory.alloc(POINTER_SIZE);
                while (true) {
                    const hfield = MonoApi.mono_class_get_fields(thix.handle, iter);
                    if (hfield.isNull() === true) {
                        break;
                    }

                    const ftype = MonoApi.mono_field_get_type(hfield);
                    const tname = MonoApi.mono_type_get_name(ftype).readCString();
                    const fname = MonoApi.mono_field_get_name(hfield).readCString();
                    const offset = MonoApi.mono_field_get_offset(hfield);
                    const valuetype = MonoApi.type_is_valuetype(ftype);

                    const msg = '  ' + tname + ' ' + fname + '; // 0x' + offset.toString(16) + ', valuetype: ' + valuetype;
                    console.log(msg);
                }
                console.log('---');
            }
        };

        const wrapperHandler = {
            get(target, property) {
                //if (typeof property === 'symbol')
                //    return () => '[ClassWrapper] - ' + target.fullName;
                let r = target[property];
                if (r !== undefined)
                    return r;
                r = MonoApiHelper.method(target, property);
                if (r !== null) {
                    // unsafe cache? (no, overload will return another function)
                    // how abouw set back: target.func = target.func.overload('System.String');
                    // will break another wrap (cached), but need only one right?
                    target[property] = r;
                }
                else {
                    r = MonoApiHelper.field(target, property);
                    if (r !== null) {
                        target[property] = r;
                    }
                }
                return r; // null?
            },
            // construct(_, args, proxy) {
            //     return thix.$new.apply(proxy, args);
            // },
        };

        // proxy vs get all field + method overload
        const z = new Proxy(thix, wrapperHandler);
        cacheClasss[o.handle] = z;
        return z;
    }

    return MonoApiHelper;
}

function loadMonoApi(isAot) {
    if (cachedApi === null) {
        cachedApi = _loadMonoApi(isAot);
        globalThis.MonoApi = cachedApi;
    }
    return cachedApi;
}

function _loadMonoApi(isAot) {
    if (isAot) {
        const MonoApi = {
            mono_thread_current: createNativeFunction('il2cpp_thread_current', 'pointer'),
            //mono_thread_get_main: createNativeFunction('il2cpp_thread_get_main', 'pointer'),
            mono_get_root_domain: createNativeFunction('il2cpp_domain_get', 'pointer'), // mono_domain_get <=> mono_get_root_domain?
            mono_thread_attach: createNativeFunction('il2cpp_thread_attach', 'pointer', ['pointer']),
            mono_thread_detach: createNativeFunction('il2cpp_thread_detach', 'pointer', ['pointer']),
            mono_assembly_get_image: createNativeFunction('il2cpp_assembly_get_image', 'pointer', ['pointer']),
            //il2cpp_domain_get_assemblies: createNativeFunction('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']),
            mono_class_from_name: createNativeFunction('il2cpp_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']),
            mono_class_get_method_from_name: createNativeFunction('il2cpp_class_get_method_from_name', 'pointer', ['pointer', 'pointer', 'int']),
            mono_image_get_name: createNativeFunction('il2cpp_image_get_name', 'pointer', ['pointer']),
            mono_runtime_invoke: createNativeFunction('il2cpp_runtime_invoke', 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']),
            mono_value_box: createNativeFunction('il2cpp_value_box', 'pointer', ['pointer', 'pointer']),
            mono_object_unbox: createNativeFunction('il2cpp_object_unbox', 'pointer', ['pointer']),
            mono_string_new_utf16: createNativeFunction('il2cpp_string_new_utf16', 'pointer', ['pointer', 'int']),
            mono_class_get_field_from_name: createNativeFunction('il2cpp_class_get_field_from_name', 'pointer', ['pointer', 'pointer']),
            mono_class_get_fields: createNativeFunction('il2cpp_class_get_fields', 'pointer', ['pointer', 'pointer']),
            //
            mono_field_set_value: createNativeFunction('il2cpp_field_set_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_get_value: createNativeFunction('il2cpp_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_static_set_value_: createNativeFunction('il2cpp_field_static_set_value', 'void', ['pointer', 'pointer']),
            mono_field_static_get_value: createNativeFunction('il2cpp_field_static_get_value', 'void', ['pointer', 'pointer']),
            mono_field_get_offset: createNativeFunction('il2cpp_field_get_offset', 'int', ['pointer']),
            mono_field_get_name: createNativeFunction('il2cpp_field_get_name', 'pointer', ['pointer']),
            mono_field_get_type: createNativeFunction('il2cpp_field_get_type', 'pointer', ['pointer']),
            mono_field_get_flags: createNativeFunction('il2cpp_field_get_flags', 'int', ['pointer']),
            //
            mono_class_is_enum: createNativeFunction('il2cpp_class_is_enum', 'int', ['pointer']),
            mono_class_get_parent: createNativeFunction('il2cpp_class_get_parent', 'pointer', ['pointer']),
            mono_class_is_subclass_of: createNativeFunction('il2cpp_class_is_subclass_of', 'int', ['pointer', 'pointer', 'int']), // 2bool=>2int frida bug
            mono_class_get_type: createNativeFunction('il2cpp_class_get_type', 'pointer', ['pointer']),
            mono_class_get_name: createNativeFunction('il2cpp_class_get_name', 'pointer', ['pointer']),
            mono_class_get_methods: createNativeFunction('il2cpp_class_get_methods', 'pointer', ['pointer', 'pointer']),
            mono_class_get_nested_types: createNativeFunction('il2cpp_class_get_nested_types', 'pointer', ['pointer', 'pointer']),
            mono_method_get_name: createNativeFunction('il2cpp_method_get_name', 'pointer', ['pointer']),
            mono_method_get_param_count: createNativeFunction('il2cpp_method_get_param_count', 'int', ['pointer']),
            mono_method_get_param: createNativeFunction('il2cpp_method_get_param', 'pointer', ['pointer', 'int']),
            mono_type_get_name: createNativeFunction('il2cpp_type_get_name', 'pointer', ['pointer']),
            mono_type_get_class: createNativeFunction('il2cpp_type_get_class_or_element_class', 'pointer', ['pointer']),
            mono_class_is_generic: createNativeFunction('il2cpp_class_is_generic', 'int', ['pointer']),
            mono_class_is_valuetype: createNativeFunction('il2cpp_class_is_valuetype', 'int', ['pointer']),
            mono_class_is_inflated: createNativeFunction('il2cpp_class_is_inflated', 'int', ['pointer']),
            mono_method_is_generic: createNativeFunction('il2cpp_method_is_generic', 'int', ['pointer']),
            mono_method_is_inflated: createNativeFunction('il2cpp_method_is_inflated', 'int', ['pointer']),
            mono_method_is_instance: createNativeFunction('il2cpp_method_is_instance', 'int', ['pointer']),
            mono_type_is_byref: createNativeFunction('il2cpp_type_is_byref', 'int', ['pointer']),
            //mono_type_is_reference: createNativeFunction('il2cpp_type_is_reference', 'int', ['pointer']),
            //
            //mono_method_signature: createNativeFunction('il2cpp_method_signature', 'pointer', ['pointer']),
            //mono_signature_get_param_count: createNativeFunction('il2cpp_signature_get_param_count', 'int', ['pointer']),
            //mono_signature_get_params: createNativeFunction('il2cpp_signature_get_params', 'pointer', ['pointer', 'pointer']),
            //mono_signature_get_return_type: createNativeFunction('il2cpp_signature_get_return_type', 'pointer', ['pointer']),
            //
            il2cpp_method_get_return_type: createNativeFunction('il2cpp_method_get_return_type', 'pointer', ['pointer']),
            //
            mono_array_class_get: createNativeFunction('il2cpp_array_class_get', 'pointer', ['pointer', 'int']),
            mono_array_new: createNativeFunction('il2cpp_array_new', 'pointer', ['pointer', 'int']),
            mono_object_new: createNativeFunction('il2cpp_object_new', 'pointer', ['pointer']),
            mono_runtime_object_init: createNativeFunction('il2cpp_runtime_object_init', 'void', ['pointer']),
            //
            mono_class_get_type: createNativeFunction('il2cpp_class_get_type', 'pointer', ['pointer']),
            mono_type_get_object: createNativeFunction('il2cpp_type_get_object', 'pointer', ['pointer']),
            mono_method_get_object: createNativeFunction('il2cpp_method_get_object', 'pointer', ['pointer', 'pointer']),
            mono_object_get_class: createNativeFunction('il2cpp_object_get_class', 'pointer', ['pointer']),
            //mono_array_set: createNativeFunction('il2cpp_array_set', 'pointer', ['pointer', "pointer", 'int', 'pointer']),
            //mono_array_get_elements: createNativeFunction('il2cpp_array_get_elements', 'pointer', ['pointer']),
            mono_class_from_mono_type: createNativeFunction('il2cpp_class_from_il2cpp_type', 'pointer', ['pointer']),
            //mono_class_value_size: createNativeFunction('il2cpp_class_value_size', 'int', ['pointer', 'pointer'])
        }

        const mono_class_from_name_case = _mod.findExportByName('il2cpp_class_from_name_case');
        if (mono_class_from_name_case !== null) {
            MonoApi.mono_class_from_name = new NativeFunction(mono_class_from_name_case, 'pointer', ['pointer', 'pointer', 'pointer']);
        }

        const il2cpp_domain_get_assemblies = createNativeFunction('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']);
        MonoApi.AssemblyForeach = function (cb) {
            const domain = MonoApi.mono_get_root_domain();
            const ptr = Memory.alloc(8);
            const asms = il2cpp_domain_get_assemblies(domain, ptr);
            const size = ptr.readU32();
            for (let i = 0; i < size; i++) {
                const assembly = asms.add(i * POINTER_SIZE).readPointer();
                if (cb(assembly) === 1) break;
            }
        }

        MonoApi.type_is_valuetype = function (type) {
            const clazz = MonoApi.mono_class_from_mono_type(type);
            const valuetype = MonoApi.mono_class_is_valuetype(clazz);
            return valuetype === 1;
        }

        MonoApi.mono_class_vtable = () => NULL;

        return MonoApi;
    } {
        const MonoApi = {
            mono_thread_current: createNativeFunction('mono_thread_current', 'pointer'),
            mono_thread_get_main: createNativeFunction('mono_thread_get_main', 'pointer'),
            mono_get_root_domain: createNativeFunction('mono_get_root_domain', 'pointer'), // mono_domain_get, mono_get_root_domain
            mono_domain_get: createNativeFunction('mono_domain_get', 'pointer'), // mono_domain_get, mono_get_root_domain 
            mono_thread_attach: createNativeFunction('mono_thread_attach', 'pointer', ['pointer']),
            mono_thread_detach: createNativeFunction('mono_thread_detach', 'pointer', ['pointer']),
            mono_assembly_get_image: createNativeFunction('mono_assembly_get_image', 'pointer', ['pointer']),
            //mono_assembly_foreach: createNativeFunction('mono_assembly_foreach', 'int', ['pointer', 'pointer']),
            mono_class_from_name: createNativeFunction('mono_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']),
            mono_class_get_method_from_name: createNativeFunction('mono_class_get_method_from_name', 'pointer', ['pointer', 'pointer', 'int']),
            mono_compile_method: createNativeFunction('mono_compile_method', 'pointer', ['pointer']),
            mono_image_get_name: createNativeFunction('mono_image_get_name', 'pointer', ['pointer']),
            mono_runtime_invoke: createNativeFunction('mono_runtime_invoke', 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']),
            mono_object_unbox: createNativeFunction('mono_object_unbox', 'pointer', ['pointer']),
            mono_string_new_utf16: createNativeFunction('mono_string_new_utf16', 'pointer', ['pointer', 'pointer', 'int']),
            mono_class_get_field_from_name: createNativeFunction('mono_class_get_field_from_name', 'pointer', ['pointer', 'pointer']),
            mono_class_get_fields: createNativeFunction('mono_class_get_fields', 'pointer', ['pointer', 'pointer']),
            //
            mono_field_set_value: createNativeFunction('mono_field_set_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_get_value: createNativeFunction('mono_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
            //mono_field_static_set_value_: createNativeFunction('mono_field_static_set_value', 'void', ['pointer', 'pointer', 'pointer']),
            //mono_field_static_get_value_: createNativeFunction('mono_field_static_get_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_get_offset: createNativeFunction('mono_field_get_offset', 'int', ['pointer']),
            mono_field_get_name: createNativeFunction('mono_field_get_name', 'pointer', ['pointer']),
            mono_field_get_type: createNativeFunction('mono_field_get_type', 'pointer', ['pointer']),
            mono_field_get_flags: createNativeFunction('mono_field_get_flags', 'int', ['pointer']),
            //
            mono_class_is_enum: createNativeFunction('mono_class_is_enum', 'int', ['pointer']),
            mono_class_get_parent: createNativeFunction('mono_class_get_parent', 'pointer', ['pointer']),
            mono_class_is_subclass_of: createNativeFunction('mono_class_is_subclass_of', 'int', ['pointer', 'pointer', 'int']), // 2bool=>2int frida bug
            mono_class_get_name: createNativeFunction('mono_class_get_name', 'pointer', ['pointer']),
            mono_class_get_type: createNativeFunction('mono_class_get_type', 'pointer', ['pointer']),
            mono_class_get_methods: createNativeFunction('mono_class_get_methods', 'pointer', ['pointer', 'pointer']),
            mono_class_get_nested_types: createNativeFunction('mono_class_get_nested_types', 'pointer', ['pointer', 'pointer']),
            mono_method_get_name: createNativeFunction('mono_method_get_name', 'pointer', ['pointer']),
            //mono_method_get_param_count: createNativeFunction('mono_method_get_param_count', 'int', ['pointer']),
            //mono_method_get_param: createNativeFunction('mono_method_get_param', 'pointer', ['pointer', 'int']),
            mono_type_get_name: createNativeFunction('mono_type_get_name', 'pointer', ['pointer']),
            mono_type_get_class: createNativeFunction('mono_type_get_class', 'pointer', ['pointer']),
            mono_class_is_generic: createNativeFunction('mono_class_is_generic', 'int', ['pointer']),
            mono_class_is_inflated: createNativeFunction('mono_class_is_inflated', 'int', ['pointer']),
            mono_class_is_valuetype: createNativeFunction('mono_class_is_valuetype', 'int', ['pointer']),
            mono_method_is_generic: createNativeFunction('unity_mono_method_is_generic', 'int', ['pointer']),
            mono_method_is_inflated: createNativeFunction('unity_mono_method_is_inflated', 'int', ['pointer']),
            //mono_method_is_instance: createNativeFunction('mono_method_is_instance', 'int', ['pointer']),
            mono_type_is_byref: createNativeFunction('mono_type_is_byref', 'int', ['pointer']),
            //mono_type_is_reference: createNativeFunction('mono_type_is_reference', 'int', ['pointer']),
            //
            mono_signature_is_instance: createNativeFunction('mono_signature_is_instance', 'int', ['pointer']),
            mono_method_signature: createNativeFunction('mono_method_signature', 'pointer', ['pointer']),
            //
            mono_signature_get_param_count: createNativeFunction('mono_signature_get_param_count', 'int', ['pointer']),
            mono_signature_get_params: createNativeFunction('mono_signature_get_params', 'pointer', ['pointer', 'pointer']),
            mono_signature_get_return_type: createNativeFunction('mono_signature_get_return_type', 'pointer', ['pointer']),
            //
            mono_array_class_get: createNativeFunction('mono_array_class_get', 'pointer', ['pointer', 'int']),
            mono_array_new_: createNativeFunction('mono_array_new', 'pointer', ['pointer', 'pointer', 'int']),
            mono_object_new_: createNativeFunction('mono_object_new', 'pointer', ['pointer', 'pointer']),
            mono_runtime_object_init: createNativeFunction('mono_runtime_object_init', 'void', ['pointer']),
            //mono_security_set_mode: createNativeFunction('mono_security_set_mode', 'void', ['int']),
            //mono_trace_set_level_string: createNativeFunction('mono_trace_set_level_string', 'void', ['pointer']),
            //
            mono_class_get_type: createNativeFunction('mono_class_get_type', 'pointer', ['pointer']),
            mono_type_get_object_: createNativeFunction('mono_type_get_object', 'pointer', ['pointer', 'pointer']),
            mono_method_get_object_: createNativeFunction('mono_method_get_object', 'pointer', ['pointer', 'pointer', 'pointer']),
            mono_object_get_class: createNativeFunction('mono_object_get_class', 'pointer', ['pointer']),
            //mono_array_set: createNativeFunction('mono_array_set', 'pointer', ['pointer', 'pointer', 'int', 'pointer']),
            //mono_array_get_elements: createNativeFunction('mono_array_get_elements', 'pointer', ['pointer']),
            mono_class_from_mono_type: createNativeFunction('mono_class_from_mono_type', 'pointer', ['pointer']),
            //mono_class_value_size: createNativeFunction('mono_class_value_size', 'int', ['pointer', 'pointer']),
            //mono_class_vtable_: createNativeFunction('mono_class_vtable', 'pointer', ['pointer'])
        };
        MonoApi.mono_method_is_instance = function (md) {
            const sig = MonoApi.mono_method_signature(md);
            return MonoApi.mono_signature_is_instance(sig);
        }
        MonoApi.mono_object_new = function (kclass) {
            return MonoApi.mono_object_new_(MonoApi.mono_domain_get(), kclass);
        }
        MonoApi.mono_array_new = function (kclass, n) {
            return MonoApi.mono_array_new_(MonoApi.mono_domain_get(), kclass, n);
        }
        MonoApi.mono_type_get_object = function (ktype) {
            return MonoApi.mono_type_get_object_(MonoApi.mono_domain_get(), ktype);
        }
        MonoApi.mono_method_get_object = function (kmethod, kclass) {
            return MonoApi.mono_method_get_object_(MonoApi.mono_domain_get(), kmethod, kclass);
        }

        const mono_class_from_name_case = _mod.findExportByName('mono_class_from_name_case');
        if (mono_class_from_name_case !== null) {
            MonoApi.mono_class_from_name = new NativeFunction(mono_class_from_name_case, 'pointer', ['pointer', 'pointer', 'pointer']);
        }
        const mono_security_set_mode = createNativeFunction('mono_security_set_mode', 'void', ['int']);
        mono_security_set_mode(0);

        const mono_assembly_foreach = createNativeFunction('mono_assembly_foreach', 'int', ['pointer', 'pointer']);
        MonoApi.AssemblyForeach = function (cb) {
            const c = new NativeCallback(cb, 'int', ['pointer', 'pointer']);
            return mono_assembly_foreach(c, NULL)
        }

        MonoApi.type_is_valuetype = function (type) {
            const clazz = MonoApi.mono_class_from_mono_type(type);
            return MonoApi.mono_class_is_valuetype(clazz) === 1;
        }

        const mono_value_box = createNativeFunction('mono_value_box', 'pointer', ['pointer', 'pointer', 'pointer']);
        MonoApi.mono_value_box = function (kclass, v) {
            return mono_value_box(MonoApi.mono_domain_get(), kclass, v);
        }

        const mono_field_static_get_value = createNativeFunction('mono_field_static_get_value', 'void', ['pointer', 'pointer', 'pointer']);
        MonoApi.mono_field_static_get_value = function (kclass, v) {
            return mono_field_static_get_value(this._classVTable, kclass, v);
        }

        const mono_field_static_set_value = createNativeFunction('mono_field_static_set_value', 'void', ['pointer', 'pointer', 'pointer']);
        MonoApi.mono_field_static_set_value = function (kclass, v) {
            return mono_field_static_set_value(this._classVTable, kclass, v);
        }

        const mono_class_vtable = createNativeFunction('mono_class_vtable', 'pointer', ['pointer']);
        MonoApi.mono_class_vtable = function (kclass) {
            return mono_class_vtable(MonoApi.mono_domain_get(), kclass);
        }

        return MonoApi;
    }
}

function isMono() {
    const functions = [
        { name: 'il2cpp_thread_attach',      module: 'GameAssembly', isAot: true  },
        { name: 'il2cpp_runtime_class_init', module: 'GameAssembly', isAot: true  },
        { name: 'mono_thread_attach',        module: 'mono',         isAot: false },
    ];

    // attempt to find the export using its respective module
    for (const func of functions) {
        const address = Module.findExportByName(func.module, func.name);
        if (address === null) continue;

        const module = Process.getModuleByAddress(address);
        return { isAot: func.isAot, module };
    }

    // fallback to searching all exports
    const modules = Process.enumerateModules();

    // move the main module to the end
    modules.push(modules.shift());

    for (const module of modules) {
        const exports = module.enumerateExports()
        for (const exp of exports) {
            for (const func of functions) {
                if (!exp.name.includes(func.name)) continue;
                return { isAot: func.isAot, module };
            }
        }
    }

    console.warn('Error: Mono not found!');
    return { isAot: false, mod: null };
}

function createNativeFunction(name, retType, argTypes = [], abiOrOptions = 'default') {
    const address = _mod.findExportByName(name);
    if (address === null) {
        console.warn('Warning! Native mono export not found! Expected export: ' + name);
        return () => { console.warn('DUMMY_FUNCTION: ' + name); return NULL; };
    }
    return new NativeFunction(address, retType, argTypes, abiOrOptions);
}

function normalizeType(t) {
    switch (t) {
        case 'string':
            return 'System.String';
        case 'uint8':
        case 'byte':
            return 'System.Byte';
        case 'char':
            return 'System.Char'; // C# wide char
        case 'short':
        case 'int16':
            return 'System.Int16';
        case 'ushort':
        case 'uint16':
            return 'System.Unt16';
        case 'int':
        case 'int32':
            return 'System.Int32';
        case 'uint':
        case 'uint32':
            return 'System.Byte';
        case 'long':
        case 'int64':
            return 'System.Int64';
        case 'ulong':
        case 'uint64':
            return 'System.UInt64';
        case 'double':
            return 'System.Double';
        case 'float':
            return 'System.Single';
        default: return t;
    }
}

const tid = Process.getCurrentThreadId();
let counter = 1;
module.exports = exports = {
    perform,
    setHook,
    findClass,
    findMethod,
    findField,
    use: findClass,
    /**
     * Schedules a callback on the current thread.
     * @param {function():void} callback 
     * @param {number} [ms] 
     * @param  {...any} [params] 
     */
    schedule(callback, ms, ...params) {
        const n = () => { };
        const log = console.log; console.log = n;
        const warn = console.warn; console.warn = n;
        const SynchronizationContext =
            findClass(this._entrypointAssembly, 'UnityEngine.UnitySynchronizationContext')
            ?? findClass('System.Threading.SynchronizationContext');
        const syncCtxCurrent = SynchronizationContext.get_Current;
        const syncCtxPost = SynchronizationContext.Post;

        const GetDisplayName = findClass('Mono.Runtime').GetDisplayName;
        const pGetDisplayName = GetDisplayName.address;

        const IntPtr = findClass('System.IntPtr');
        const IntPtr_ctor = IntPtr['.ctor'].overload('System.Void*');

        const pMethod = IntPtr.alloc();
        IntPtr_ctor.call(pMethod, GetDisplayName.handle);

        const SendOrPostCallback = findClass('System.Threading.SendOrPostCallback');
        const SendOrPostCallback_ctor = SendOrPostCallback['.ctor'];

        const newSendOrPostCallback = function (ctx) {
            const cb = SendOrPostCallback.alloc();
            SendOrPostCallback_ctor.call(cb, ctx /* object state */, pMethod /* IntPtr method */);
            return cb;
        }

        const Thread = findClass('System.Threading.Thread');
        const get_ExecutionContext = Thread.GetMutableExecutionContext ?? Thread.get_ExecutionContext;
        const ExecutionContext = findClass('System.Threading.ExecutionContext');
        const get_SynchronizationContext = ExecutionContext.get_SynchronizationContext;
        const mono_thread_current = cachedApi.mono_thread_current;
        console.log = log;
        console.warn = warn;

        function findSyncCtxCurrent(targetThread) {
            try {
                const ctxExec = get_ExecutionContext.invoke(targetThread);
                if (ctx.isNull() === false) {
                    let CURRENT = get_SynchronizationContext(ctxExec);
                    return CURRENT;
                }
            } catch { }
            return NULL;
        }

        // fallback any (sys)
        function _schedule(thiz, targetThread, callback, ms, params) {
            setTimeout(() => {
                const listener = Interceptor.attach(mono_thread_current, {
                    onLeave: function (thread) {
                        if (targetThread.equals(thread) === true) {
                            listener.detach();
                            callback.apply(thiz, params);
                        }
                    }
                });
            }, ms);
        }

        // native
        function _scheduleCtx(callback, ms, ...params) {
            const threadId = Process.getCurrentThreadId();
            if (threadId === tid) {
                return setTimeout(callback, ms, ...params);
            }

            let CURRENT = syncCtxCurrent();
            if (CURRENT.isNull() === true) {
                const targetThread = mono_thread_current();
                if (get_SynchronizationContext === null ||
                    (CURRENT = findSyncCtxCurrent(targetThread)).isNull() === true) {
                    return _schedule(this, targetThread, callback, ms, params);
                }
            }
            const CALLBACK = newSendOrPostCallback(CURRENT);
            setTimeout(() => {
                const DATA = ptr(++counter);
                const listener = Interceptor.attach(pGetDisplayName, {
                    onEnter: function (args) {
                        if (DATA.equals(args[1]) === true) {
                            listener.detach();
                            callback.apply(this, params);
                        }
                    }
                });
                syncCtxPost.call(CURRENT,
                    CALLBACK /* System.Threading.SendOrPostCallback callback */,
                    DATA /* System.Object state */);
            }, ms);
        }
        this.schedule = _scheduleCtx;
        _scheduleCtx.apply(this, arguments);
    },
    /**
     * Schedules a callback on the main thread.
     * @param {function():void} callback 
     * @param {number} [ms] 
     * @param  {...any} [params] 
     */
    scheduleOnMainThread(callback, ms, ...params) {
        const thiz = this;
        const n = () => { };
        const log = console.log; console.log = n;
        const warn = console.warn; console.warn = n;
        const SynchronizationContext =
            findClass(this._entrypointAssembly, 'UnityEngine.UnitySynchronizationContext')
            ?? findClass('System.Threading.SynchronizationContext');
        const syncCtxCurrent = SynchronizationContext.get_Current;
        const syncCtxPost = SynchronizationContext.Post;

        const GetDisplayName = findClass('Mono.Runtime').GetDisplayName;
        const pGetDisplayName = GetDisplayName.address;

        const IntPtr = findClass('System.IntPtr');
        const IntPtr_ctor = IntPtr['.ctor'].overload('System.Void*');

        const pMethod = IntPtr.alloc();
        IntPtr_ctor.call(pMethod, GetDisplayName.handle);

        const SendOrPostCallback = findClass('System.Threading.SendOrPostCallback');
        const SendOrPostCallback_ctor = SendOrPostCallback['.ctor'];

        const newSendOrPostCallback = function (o) {
            const cb = SendOrPostCallback.alloc();
            SendOrPostCallback_ctor.call(cb, o /* object state */, pMethod /* IntPtr method */);
            return cb;
        }

        const mono_thread_current = cachedApi.mono_thread_current;
        const UnitySetActive = findClass(this._entrypointAssembly, 'UnityEngine.GameObject')
            .SetActive.overload('System.Boolean');
        console.log = log;
        console.warn = warn;

        let mainThreadCtx = null, mainThread;
        // native
        function _scheduleOnMainThreadCtx(callback, ms, ...params) {
            if (tid === Process.getCurrentThreadId()) {
                // frida->main POST crash?
                return _scheduleOnMainThread.apply(this, arguments);
            }
            let CURRENT = syncCtxCurrent();
            if (CURRENT.isNull() === true) {
                SynchronizationContext.SetSynchronizationContext(mainThreadCtx);
                CURRENT = mainThreadCtx;
            }
            else if (CURRENT.equals(mainThreadCtx) === false) {
                return _scheduleOnMainThread.apply(this, arguments);
            }

            const CALLBACK = newSendOrPostCallback(CURRENT);
            setTimeout(() => {
                const DATA = ptr(++counter);
                const listener = Interceptor.attach(pGetDisplayName, {
                    onEnter: function (args) {
                        if (DATA.equals(args[1]) === true) {
                            listener.detach();
                            callback.apply(this, params);
                        }
                    }
                });
                syncCtxPost.call(CURRENT,
                    CALLBACK /* System.Threading.SendOrPostCallback callback */,
                    DATA /* System.Object state */);
            }, ms);
        }

        // fallback any (sys)
        function _scheduleOnMainThread(callback, ms, ...params) {
            setTimeout(() => {
                const listener = Interceptor.attach(mono_thread_current, {
                    onLeave: function (thread) {
                        if (thread.equals(mainThread) === true) {
                            listener.detach();
                            if (mainThreadCtx === null) {
                                mainThreadCtx = syncCtxCurrent();
                                if (mainThreadCtx.isNull() === false) {
                                    thiz.scheduleOnMainThread = _scheduleOnMainThreadCtx;
                                }
                            }
                            callback.apply(this, params);
                        }
                    }
                });
            }, ms)
        }

        // fallback main (user)
        function _scheduleOnMainThreadUnity(callback, ms, ...params) {
            setTimeout(_ => {
                const listener = UnitySetActive.attach({
                    onEnter: function () {
                        listener.detach();
                        callback.apply(this, params);
                        mainThread = mono_thread_current();
                        const ctx = syncCtxCurrent();
                        if (ctx.isNull() == false) {
                            mainThreadCtx = ctx;
                            thiz.scheduleOnMainThread = _scheduleOnMainThreadCtx;
                        }
                        else {
                            thiz.scheduleOnMainThread = _scheduleOnMainThread;
                        }
                    }
                });
            }, ms);
        }

        if (_isAot === false) {
            mainThread = cachedApi.mono_thread_get_main();
            this.scheduleOnMainThread = _scheduleOnMainThread;
            _scheduleOnMainThread.apply(this, arguments);
        }
        else {
            _scheduleOnMainThreadUnity.apply(this, arguments);
        }
    },
    /** deprecated: use implementation instead */
    createFunction,
    get available() {
        return isMonoLoaded();
    },
    /** ver < 2017 ? `UnityEngine` : `UnityEngine.CoreModule` */
    get _entrypointAssembly() {
        const name = _api._entrypointAssembly;
        delete this._entrypointAssembly;
        return this._entrypointAssembly = name;
    },
    /** ver < 5 ? `MonoBehaviour` : `Application` */
    get _entrypointType() {
        const clazz = findClass(this._entrypointAssembly, 'UnityEngine.Application');
        const name = clazz !== null ? 'UnityEngine.Application' : 'UnityEngine.MonoBehaviour';
        delete this._entrypointType;
        return this._entrypointType = name;
    },
    get entrypoint() {
        const clazz = findClass(this._entrypointAssembly, this._entrypointType);
        delete this.entrypoint;
        return this.entrypoint = clazz;
    },
    /** @returns {string} */
    get unityVersion() {
        try {
            let version;
            if (_isAot === true) {
                const resolve_icall = _mod.findExportByName('il2cpp_resolve_icall');
                if (resolve_icall.isNull() === true) return;

                let fn = new NativeFunction(resolve_icall, 'pointer', ['pointer']);
                fn = fn(Memory.allocUtf8String('UnityEngine.Application::get_unityVersion'));
                if (fn.isNull() === true) return;

                version = new NativeFunction(fn, 'pointer', [])();
            }
            else {
                version = this.entrypoint.get_unityVersion();
            }
            delete this.unityVersion;
            return this.unityVersion = version.readMonoString();;
        }
        catch {
            return 'unknown';
        }
    },
    get _corlibAssembly() {
        return 'mscorlib';
    },
    get _mainAssembly() {
        return 'Assembly-CSharp';
    },
    get _module() {
        if (!_mod) return null;
        delete this._module;
        return this._module = _mod;
    },
    /**  @returns {function():string} */
    get extractStackTrace() {
        // <2019
        // TODO: stack walk
        const log = console.log; console.log = () => { };
        const UnityEngine = findClass(this._entrypointAssembly, 'UnityEngine.StackTraceUtility');
        const f = UnityEngine.ExtractStackTrace;
        const ExtractStackTrace = f.overload();
        const fn = () => ExtractStackTrace.invoke().readMonoString();
        delete this.extractStackTrace;
        this.extractStackTrace = fn;
        console.log = log;
        return fn;
    },
    /**
     * MonoObject to ObjectWrapper
     * @param {NativePointer} handle
     * @param {ClassWrapper} object 
     * @returns {MonoObjectWrapper}
     */
    cast(handle, object) {
        return handle.cast(object);
    },
    /**
     * MonoObject to ObjectWrapper
     * @param {NativePointer} handle
     * @returns {MonoObjectWrapper}
     */
    wrap(handle) {
        return handle.wrap();
    },
    /**
     * Create MonoArray
     * @param {string} type byte,int,...
     * @param {ArrayBuffer|*[]} arr 
     * @return {NativePointerMono}
     */
    array(type, arr) {
        /** @type {NativePointer} */
        let result;
        type = normalizeType(type);
        const t = findClass(type);
        if (arr instanceof ArrayBuffer) {
            result = cachedApi.mono_array_new(t, arr.byteLength);
            result.add(OFFSET_ARRAY_DATA).writeByteArray(arr);
        }
        else {
            result = cachedApi.mono_array_new(t, arr.length);
            const ptr = result.add(OFFSET_ARRAY_DATA);
            if (type === 'System.Char') {
                const s = arr.join('');
                const p = Memory.allocUtf16String(s);
                const buf = ArrayBuffer.wrap(p, arr.length * 2);
                ptr.writeByteArray(buf);
            }
            else if (type === 'System.Byte') {
                ptr.writeByteArray(new Uint8Array(arr).buffer);
            }
            else if (type === 'System.Int16') {
                ptr.writeByteArray(new Int16Array(arr).buffer);
            }
            else if (type === 'System.Unt16') {
                ptr.writeByteArray(new Uint16Array(arr).buffer);
            }
            else if (type === 'System.Int32') {
                ptr.writeByteArray(new Int32Array(arr).buffer);
            }
            else if (type === 'System.Unt32') {
                ptr.writeByteArray(new Uint32Array(arr).buffer);
            }
            else {
                if (typeof arr[0] === 'string') {
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i];
                        ptr.add(POINTER_SIZE * i).writePointer(Memory.allocMonoString(item));
                    }
                }
                else {
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i];
                        ptr.add(POINTER_SIZE * i).writePointer(item);
                    }
                }
            }
        }

        return result;
    },
    /**
     * Create MonoString
     * @param {string} s
     * @return {NativePointerMono}
     */
    string(s) {
        return Memory.allocMonoString(s);
    }
};

if (isMonoLoaded() === true) {
    perform(() => {
        try {
            console.warn(findClass('Mono.Runtime').GetDisplayName().readMonoString());
            console.warn(module.exports.unityVersion);
        }
        catch { }
    }); // AutoInit
}
