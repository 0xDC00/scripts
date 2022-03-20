// @name         Unity
// @version      
// @author       
// @description  JIT & IL2CPP (emulator is not supported!)
// TODO: refactor, ....

/*
TODO:
- cleanup
- method.invoke vs method.createFunction
   (no-param invoke better)
- libFlash like: asm|namspace.class|method: onEnter | {}

Ex:
const kclass2 = findClass(imageName, className);            //
const method2 = findMethod(kclass2, methodName, argsCount=-1); // or kclass2.findMethod('getString');
const field2 = findField(kclass2, fieldName);               // or kclass2.findField('field1');
if (method2 !== null) {
    setHook(method2, function (args) {
        const val = field2.getValue(); // static
        const val = field2.getValie(args[0]); // this field value, virtual|private|protected field
        
        const fn = method2.createFunction('pointer');
        const vl = fn(args[0]);
        
        const ret = method2.invoke(args[0]); // thiz call, no arg
    });
}
*/

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

class ExNativeFunction extends NativeFunction {
    constructor(address, retType = 'void', argTypes = [], abiOrOptions = 'default') {
        super(address, retType, argTypes, abiOrOptions);
        this.abi = 'default';
        this.address = address;
        this.retType = retType;
        this.argTypes = argTypes;
        if (typeof abiOrOptions === 'string') {
            this.abi = abiOrOptions;
        }
        else if (typeof abiOrOptions === 'object') {
            this.abi = abiOrOptions.abi || 'default';
            this.options = abiOrOptions;
        }
    }
    nativeCallback(callback) {
        return new NativeCallback(callback, this.retType, this.argTypes, this.abi);
    }
    intercept(callbacksOrProbe, data) {
        return Interceptor.attach(this.address, callbacksOrProbe, data);
    }
    replace(replacement, data) {
        return Interceptor.replace(this.address, replacement, data);
    }
    toString() {
        return `ExNativeFunction[address=${this.address}, retType=${this.retType}, argTypes=[${this.argTypes}], abi=${this.abi}]`;
    }
}

const { _mod, _isAot } = (() => {
    let _isAot = false; // aot ? jit
    let _mod = null;

    const KNOWN_RUNTIMES = ['mono.dll', 'libmono.so', 'libmonosgen-2.0.so', 'mono-2.0-bdwgc.dll']; // UnityPlayer.dll
    // JIT: [TODO] use export instead module name
    // https://github.com/NorthwaveSecurity/fridax/blob/ab3e15aa8a785d1475ca0da768f9325b72484bbd/vendors/frida-mono-api/mono-module.js
    for (const x of KNOWN_RUNTIMES) {
        _mod = Process.findModuleByName(x);
        if (_mod !== null) {
            return { _mod, _isAot };
        }
    }

    // try again
    if (_mod === null) {
        const mods = Process.enumerateModules();
        for (const mod of mods) {
            const exps = Module.enumerateExports(mod.name);
            for (const exp of exps) {
                if (exp.name.includes('mono_thread_attach') === true) {
                    _mod = mod;
                    return { _mod, _isAot };
                }
                else if (exp.name.includes('il2cpp_thread_attach') === true) {
                    _mod = mod;
                    _isAot = true;
                    return { _mod, _isAot };
                }
            }
        }

        throw new Error("Untiy?");
    }
})();

console.log('Module: ' + _mod.name)
console.log('AOT:    ' + _isAot);

function createNativeFunction(name, retType, argTypes, abiOrOptions = 'default') {
    const address = Module.findExportByName(_mod.name, name);
    if (address === null) {
        console.warn('Warning! Native mono export not found! Expected export: ' + name);
        return null;
    }
    return new ExNativeFunction(address, retType, argTypes, abiOrOptions);
}

//var setTimeout_ = setTimeout; // TODO: setTimeout like Java.scheduleOnMainThread
var MonoApiHelper = null;
if (_isAot === false) {
    // https://github.com/NorthwaveSecurity/fridax/blob/master/vendors/frida-mono-api/mono-api.js
    const MonoApi = {
        //mono_domain_get: createNativeFunction('mono_domain_get', 'pointer'),
        mono_get_root_domain: createNativeFunction('mono_get_root_domain', 'pointer'),
        //mono_domain_foreach: createNativeFunction('mono_domain_foreach', 'void', ['pointer', 'pointer']),
        mono_thread_attach: createNativeFunction('mono_thread_attach', 'pointer', ['pointer']),
        mono_thread_detach: createNativeFunction('mono_thread_detach', 'pointer', ['pointer']),
        mono_security_set_mode: createNativeFunction('mono_security_set_mode', 'void', ['int']),
        mono_assembly_get_image: createNativeFunction('mono_assembly_get_image', 'pointer', ['pointer']),
        mono_assembly_foreach: createNativeFunction('mono_assembly_foreach', 'int', ['pointer', 'pointer']),
        mono_class_from_name: createNativeFunction('mono_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']),
        mono_class_get_method_from_name: createNativeFunction('mono_class_get_method_from_name', 'pointer', ['pointer', 'pointer', 'int']),
        mono_compile_method: createNativeFunction('mono_compile_method', 'pointer', ['pointer']), // gpointer  mono_compile_method (MonoMethod *method)
        // http://web.mit.edu/kolya/.f/root/net.mit.edu/athena.mit.edu/software/mono_v4.9/arch/amd64_linux26/mono/docs/html/mono-api-object.html
        // mono_field_get_name: createNativeFunction('mono_field_get_name', 'pointer', ['pointer']),
        // mono_field_get_value_object: createNativeFunction('mono_field_get_value_object', 'pointer', ['pointer', 'pointer', 'pointer']),
        // mono_field_get_value: createNativeFunction('mono_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
        // mono_field_set_value: createNativeFunction('mono_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
        mono_image_get_name: createNativeFunction('mono_image_get_name', 'pointer', ['pointer']),
        // call Getter?
        // MonoObject* mono_runtime_invoke (MonoMethod *method, void *obj, void **params, MonoObject **exc);
        // https://www.mono-project.com/docs/advanced/embedding/
        // let n = *(int*)mono_object_unbox(monoObject)
        mono_runtime_invoke: createNativeFunction('mono_runtime_invoke', 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']),
        mono_object_unbox: createNativeFunction('mono_object_unbox', 'pointer', ['pointer']),
        mono_string_new_utf16: createNativeFunction('mono_string_new_utf16', 'pointer', ['pointer', 'pointer', 'int']), // g_free?
        //mono_free: createNativeFunction('mono_free', 'void', ['pointer']),
        mono_class_get_field_from_name: createNativeFunction('mono_class_get_field_from_name', 'pointer', ['pointer', 'pointer']),
        mono_field_get_value: createNativeFunction('mono_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
        mono_field_get_offset: createNativeFunction('mono_field_get_offset', 'int', ['pointer']),
    }
    const mono_class_from_name_case = Module.findExportByName(_mod.name, 'mono_class_from_name_case');
    if (mono_class_from_name_case !== null) {
        MonoApi.mono_class_from_name = new ExNativeFunction(mono_class_from_name_case, 'pointer', ['pointer', 'pointer', 'pointer']);
    }

    // prefer, mono_class_from_name_case

    // https://www.unknowncheats.me/forum/c-and-c-/165754-run-time-error-mono-dll-caused-access-violation-inject.html
    MonoApi.mono_security_set_mode(0); // MONO_SECURITY_MODE_NONE, MONO_SECURITY_MODE_CORE_CLR 

    const domain = MonoApi.mono_get_root_domain();
    const m = MonoApi.mono_thread_attach(domain);
    Script.bindWeak(globalThis, () => {
        MonoApi.mono_thread_detach(m);
    });

    Memory.createMonoString = function (s) {
        const v = Memory.allocUtf16String(s);
        const p = MonoApi.mono_string_new_utf16(domain, v, s.length); // mono_gc_alloc_handle_string
        //Script.bindWeak(p, () => { MonoApi.mono_free(p); });
        return p;
    }

    NativePointer.prototype.unbox = function () {
        return MonoApi.mono_object_unbox(this);
    }

    function ShowMethodInfo() {

    }

    //// https://github.com/frida/frida-java-bridge/blob/da1287c0ed1bd7d5a34ab8a9c7572df1b1a51fc7/index.js
    // setTimeout_ = function (func) {
    //     const fn = func;
    //     const fn_ = function () { // ES6 => args= {"1":500}
    //         console.log('attach', Process.getCurrentThreadId());
    //         const t = MonoApi.mono_thread_attach(domain);
    //         console.log('call from', t);
    //         fn.apply(this, arguments);
    //         console.log('detach');
    //         MonoApi.mono_thread_detach(t);
    //     }
    //     arguments[0] = fn_;
    //     return setTimeout(...arguments);
    // } // ES6 => args=mod



    // TODO: CE like: https://wiki.cheatengine.org/index.php?title=Mono:Lua
    // mono_findClass(namespace, className) : integer


    MonoApiHelper = {
        ClassGetMethodFromName: (mono_class, name, argCnt = -1) => {
            return MonoApi.mono_class_get_method_from_name(mono_class, Memory.allocUtf8String(name), argCnt);
        },
        AssemblyForeach(cb) {
            return MonoApi.mono_assembly_foreach(MonoApi.mono_assembly_foreach.nativeCallback(cb), NULL)
        },
        findClassByName2: (image_name, class_name) => {
            const kl = MonoApiHelper.findClassByName(class_name, image_name);
            if (kl === null) return kl;

            return {
                info: kl,
                name: class_name.substring(class_name.lastIndexOf('.') + 1),
                findMethod(methodName, argCnt = -1) {
                    return MonoApiHelper.findMethod2(kl, methodName, argCnt);
                },
                findField(fieldName) {
                    return MonoApiHelper.findField2(kl, fieldName);
                }
            }
        },
        findField2(kl, fieldName) {
            const fd = MonoApi.mono_class_get_field_from_name(kl, Memory.allocUtf8String(fieldName));
            if (fd.isNull() === true) return null;

            // TODO: static field address, object field address
            return {
                info: fd,
                name: fieldName,
                get value() {
                    return this.getValue();
                },
                get offset() {
                    if (this._offset === undefined)
                        this._offset = MonoApi.mono_field_get_offset(fd);
                    return this._offset;
                },
                getValue(thiz = NULL, output) {
                    try {
                        if (output === undefined) {
                            if (this._buf === undefined)
                                this._buf = Memory.alloc(Process.pageSize);
                            output = this._buf;
                        }
                        MonoApi.mono_field_get_value(thiz, fd, output);
                        return output;
                    }
                    catch { return null; }
                }
            }
        },
        findClassByName: (class_name, image_name) => {
            let result = null

            const indexOfLastDot = class_name.lastIndexOf('.');
            const className = Memory.allocUtf8String(class_name.substring(indexOfLastDot + 1));
            const namespace = Memory.allocUtf8String(class_name.substring(0, indexOfLastDot));

            image_name = image_name ?? null;
            if (image_name === '') image_name = 'Assembly-CSharp';
            if (image_name !== null) image_name = image_name.toUpperCase().replace(/\.DLL$/g, '');

            MonoApiHelper.AssemblyForeach(function (assembly) {
                if (result !== null) return 1;
                const image = MonoApi.mono_assembly_get_image(assembly);

                if (image_name !== null) {
                    const imageName = MonoApi.mono_image_get_name(image).readUtf8String()
                        .toUpperCase()
                        .replace(/\.DLL$/g, '');
                    ;
                    if (imageName !== image_name) {
                        return 0;
                    }
                }

                const pointer = MonoApi.mono_class_from_name(image, namespace, className);
                //console.log(MonoApi.mono_image_get_name(image).readUtf8String());
                if (pointer.isNull() === false) {
                    result = pointer;

                    if (image_name === null) {
                        const imageName = MonoApi.mono_image_get_name(image).readUtf8String();
                        console.log(imageName);
                    }

                    return 1;
                }
                return 0;
            }, NULL);

            return result
        },
        findMethod2: (image_name, className, methodName, argCnt = -1) => {
            const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);
            if (md === null) return md;

            return {
                info: md,
                name: image_name instanceof NativePointer === true ? className : methodName,
                get address() {
                    if (this._address === undefined) {
                        const ptr = MonoApi.mono_compile_method(md);
                        this._address = ptr;
                        return ptr;
                    }
                    return this._address;
                },
                createFunction(retType = 'void', argTypes = [], abiOrOptions = 'default') {
                    if (this._function === undefined) {
                        const ptr = new NativeFunction(this.address, retType, argTypes, abiOrOptions);
                        this._function = ptr;
                        this._retType = retType;
                        this._argTypes = argTypes;
                        this._abiOrOptions = abiOrOptions;
                        return ptr;
                    }
                    return this._function;
                },
                invoke(thiz = NULL /* static method */, args = NULL) {
                    return MonoApi.mono_runtime_invoke(md, thiz, args, NULL);
                }
            }
        },
        findMethod: (image_name, className, methodName, argCnt = -1) => {
            let kclass = image_name;
            if (image_name instanceof NativePointer === true) {
                argCnt = methodName;
                methodName = className;
            }
            else if (Object.keys(image_name).length !== 0) {
                kclass = image_name.info; // kclass object
            }
            else {
                kclass = MonoApiHelper.findClassByName(className, image_name); // ClassHelper
            }
            if (kclass === null) return null;

            const md = MonoApi.mono_class_get_method_from_name(kclass, Memory.allocUtf8String(methodName), argCnt);

            if (md.isNull() === true) return null;

            return md;
        },
        findFunction: (image_name, className, methodName, argCnt = -1) => {
            const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);
            if (md === null) return md;

            const impl = MonoApi.mono_compile_method(md);
            return impl;
        },
        createFunction: (image_name, className, methodName, argCnt = -1, retType = 'void', argTypes = [], abiOrOptions = 'default') => {
            const impl = MonoApiHelper.findFunction(image_name, className, methodName, argCnt);
            if (impl === null) return null;
            return new NativeFunction(impl, retType, argTypes, abiOrOptions);
        },
        Intercept: hookManagedMethod
    }

    // https://github.com/NorthwaveSecurity/fridax/blob/ab3e15aa8a785d1475ca0da768f9325b72484bbd/vendors/frida-mono-api/mono-api-helper.js#L100
    function hookManagedMethod(image_name, className, methodName, argCnt, callbacks, leave) {
        if (image_name === null) return console.warn('Skip');

        let isPtr = false;
        if ((isPtr = image_name instanceof NativePointer) === true || Object.keys(image_name).length !== 0) {
            if (isPtr === false) {
                ShowMethodInfo(image_name.info);
                image_name = image_name.address;
            }

            console.log(`Attach: ${image_name}`);

            const _onEnter = className instanceof Function === true ? className : undefined;
            const _onLeave = methodName instanceof Function === true ? methodName : undefined;
            if (_onEnter !== undefined || _onLeave !== undefined) {
                return Interceptor.attach(image_name, {
                    onEnter: _onEnter,
                    onLeave: _onLeave
                });
            }

            return Interceptor.attach(image_name, { ...className });
        }

        const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);
        if (!md) return console.error('MonoMethod not found! ' + methodName);

        // mono_getJitInfo
        // JITs a method if it isn't compiled yet. Returns the address of JITted code.
        // TODO: mono_class_is_generic
        //    https://github.com/cheat-engine/cheat-engine/blob/4c67ec488c788cec9fe723eccc94ed1bb0d94d03/Cheat%20Engine/MonoDataCollector/MonoDataCollector/PipeServer.cpp#L1095
        const impl = MonoApi.mono_compile_method(md);
        console.log(`Attach: ${className}.${methodName} at ${impl}`);
        ShowMethodInfo(md);

        const _onEnter = callbacks instanceof Function === true ? callbacks : undefined;
        const _onLeave = leave instanceof Function === true ? leave : undefined;
        if (_onEnter !== undefined || _onLeave !== undefined) {
            return Interceptor.attach(impl, {
                onEnter: _onEnter,
                onLeave: _onLeave
            });
        }

        return Interceptor.attach(impl, { ...callbacks });
    }
}
else {
    // not exits: il2cpp_assembly_foreach=>il2cpp_domain_get_assemblies, il2cpp_class_get, il2cpp_get_root_domain
    const MonoApi = {
        mono_domain_get: createNativeFunction('il2cpp_domain_get', 'pointer'), // same: mono_get_root_domain?
        //mono_get_root_domain: createNativeFunction('mono_get_root_domain', 'pointer'),
        //mono_domain_foreach: createNativeFunction('mono_domain_foreach', 'void', ['pointer', 'pointer']),
        il2cpp_domain_get_assemblies: createNativeFunction('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']),
        mono_thread_attach: createNativeFunction('il2cpp_thread_attach', 'pointer', ['pointer']),
        mono_thread_detach: createNativeFunction('il2cpp_thread_detach', 'pointer', ['pointer']),
        //mono_security_set_mode: createNativeFunction('mono_security_set_mode', 'void', ['int']),
        mono_assembly_get_image: createNativeFunction('il2cpp_assembly_get_image', 'pointer', ['pointer']),
        //mono_assembly_foreach: createNativeFunction('il2cpp_assembly_foreach', 'int', ['pointer', 'pointer']),
        mono_class_from_name: createNativeFunction('il2cpp_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']),
        mono_class_get_method_from_name: createNativeFunction('il2cpp_class_get_method_from_name', 'pointer', ['pointer', 'pointer', 'int']),
        //mono_compile_method: createNativeFunction('il2cpp_compile_method', 'pointer', ['pointer']), // gpointer  mono_compile_method (MonoMethod *method)
        // mono_field_get_name: createNativeFunction('il2cpp_field_get_name', 'pointer', ['pointer']),
        // mono_field_get_value_object: createNativeFunction('il2cpp_field_get_value_object', 'pointer', ['pointer', 'pointer', 'pointer']),
        // mono_field_get_value: createNativeFunction('il2cpp_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
        // mono_field_set_value: createNativeFunction('il2cpp_field_set_value', 'void', ['pointer', 'pointer', 'pointer']),
        mono_image_get_name: createNativeFunction('il2cpp_image_get_name', 'pointer', ['pointer']),
        // call Getter?
        // Il2CppObject* il2cpp_runtime_invoke(const MethodInfo *method, void *obj, void **params, Il2CppException **exc)
        // let n = *(int*)il2cpp_object_unbox(il2cppObject)
        mono_runtime_invoke: createNativeFunction('il2cpp_runtime_invoke', 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']),
        mono_object_unbox: createNativeFunction('il2cpp_object_unbox', 'pointer', ['pointer']),
        mono_string_new_utf16: createNativeFunction('il2cpp_string_new_utf16', 'pointer', ['pointer', 'pointer', 'int']),
        mono_class_get_field_from_name: createNativeFunction('il2cpp_class_get_field_from_name', 'pointer', ['pointer', 'pointer']),
        mono_field_get_value: createNativeFunction('il2cpp_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
        mono_field_get_offset: createNativeFunction('il2cpp_field_get_offset', 'int', ['pointer']),
    }

    const mono_class_from_name_case = Module.findExportByName(_mod.name, 'il2cpp_class_from_name_case');
    if (mono_class_from_name_case !== null) {
        MonoApi.mono_class_from_name = new ExNativeFunction(mono_class_from_name_case, 'pointer', ['pointer', 'pointer', 'pointer']);
    }
    // mono_class_get_method_from_name_case ?

    // https://github.com/knah/Il2CppAssemblyUnhollower
    // il2cpp_thread_attach
    const domain = MonoApi.mono_domain_get();
    const m = MonoApi.mono_thread_attach(domain);
    Script.bindWeak(globalThis, () => {
        MonoApi.mono_thread_detach(m);
    });

    Memory.createMonoString = function (s) {
        const p = Memory.allocUtf16String(s);
        return MonoApi.mono_string_new_utf16(domain, p, s.length);
    }

    NativePointer.prototype.unbox = function () {
        return MonoApi.mono_object_unbox(this);
    }

    const p_size = Process.pointerSize;
    function ShowMethodInfo(methodInfo) {
        try {
            console.warn("-------------------------------------------")
            console.log("\x1b[36mFunctionName\t\t===>\t " + methodInfo.add(p_size * 2).readPointer().readCString() + "\x1b[0m")
            console.log("Il2CppMethodPointer\t===>\t", methodInfo.readPointer())
            console.log("InvokerMethod\t\t===>\t", methodInfo.add(p_size).readPointer())
            // console.log("Il2CppClass\t\t===>\t", methodInfo.add(p_size * 3).readPointer())
            // console.log("Il2CppType\t\t===>\t", methodInfo.add(p_size * 4).readPointer())
            // var parameters_count = methodInfo.add(p_size * 10).add(2).readU8()
            // var arr_args = new Array()
            // for (var i = 0; i < parameters_count; i++) {
            //     var ParameterInfo = methodInfo.add(p_size * 5).readPointer().add(p_size * i * 4)
            //     arr_args.push(ParameterInfo.readPointer().readCString())
            // }
            // console.log("ParameterInfo\t\t===>\t", methodInfo.add(p_size * 5).readPointer())
            // console.log("parameters_count\t===>\t", parameters_count, "\t", JSON.stringify(arr_args))
            console.warn("-------------------------------------------")
        }
        catch {

        }
    }

    MonoApiHelper = {
        findClassByName2: (image_name, class_name) => {
            const kl = MonoApiHelper.findClassByName(class_name, image_name);
            if (kl === null) return kl;

            return {
                info: kl,
                name: class_name.substring(class_name.lastIndexOf('.') + 1),
                findMethod(methodName, argCnt = -1) {
                    return MonoApiHelper.findMethod2(kl, methodName, argCnt);
                },
                findField(fieldName) {
                    return MonoApiHelper.findField2(kl, fieldName);
                }
            }
        },
        findField2(kl, fieldName) {
            const fd = MonoApi.mono_class_get_field_from_name(kl, Memory.allocUtf8String(fieldName));
            if (fd.isNull() === true) return null;

            // TODO: static field address, object field address
            return {
                info: fd,
                name: fieldName,
                get value() {
                    return this.getValue();
                },
                get offset() {
                    if (this._offset === undefined)
                        this._offset = MonoApi.mono_field_get_offset(fd);
                    return this._offset;
                },
                getValue(thiz = NULL, output) {
                    try {
                        if (output === undefined) {
                            if (this._buf === undefined)
                                this._buf = Memory.alloc(Process.pageSize);
                            output = this._buf;
                        }
                        MonoApi.mono_field_get_value(thiz, fd, output);
                        return output;
                    }
                    catch { return null; }
                }
            }
        },
        findClassByName: (class_name, image_name) => {
            let result = null

            const indexOfLastDot = class_name.lastIndexOf('.');
            const className = Memory.allocUtf8String(class_name.substring(indexOfLastDot + 1));
            const namespace = Memory.allocUtf8String(class_name.substring(0, indexOfLastDot));

            image_name = image_name ?? null;
            if (image_name === '') image_name = 'Assembly-CSharp';
            if (image_name !== null) image_name = image_name.toUpperCase().replace(/\.DLL$/g, '');

            const buf = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
            const ptr = buf.buffer.unwrap();
            const asms = MonoApi.il2cpp_domain_get_assemblies(domain, ptr);
            const size = ptr.readU32();
            for (let i = 0; i < size; i++) {
                const assembly = asms.add(i * Process.pointerSize).readPointer();
                const image = MonoApi.mono_assembly_get_image(assembly);

                if (image_name !== null) {
                    const imageName = MonoApi.mono_image_get_name(image).readUtf8String()
                        .toUpperCase()
                        .replace(/\.DLL$/g, '');
                    if (imageName !== image_name) {
                        continue;
                    }
                }

                const pointer = MonoApi.mono_class_from_name(image, namespace, className);
                if (pointer.isNull() === false) {
                    if (image_name === null) {
                        const imageName = MonoApi.mono_image_get_name(image).readUtf8String();
                        console.log(imageName);
                    }

                    result = pointer;
                    break;
                }
            }

            return result;
        },
        findMethod2: (image_name, className, methodName, argCnt = -1) => {
            const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);

            if (md === null) return null;
            return {
                info: md,
                name: image_name instanceof NativePointer === true ? className : methodName,
                get address() {
                    if (this._address === undefined) {
                        const ptr = md.readPointer();
                        this._address = ptr;
                        return ptr;
                    }
                    return this._address;
                },
                createFunction(retType = 'void', argTypes = [], abiOrOptions = 'default') {
                    if (this._function === undefined) {
                        const ptr = new NativeFunction(this.address, retType, argTypes, abiOrOptions);
                        this._function = ptr;
                        this._retType = retType;
                        this._argTypes = argTypes;
                        this._abiOrOptions = abiOrOptions;
                        return ptr;
                    }
                    return this._function;
                },
                invoke(thiz = NULL /* static method */, args = NULL) {
                    return MonoApi.mono_runtime_invoke(md, thiz, args, NULL);
                }
            }
        },
        findMethod: (image_name, className, methodName, argCnt = -1) => {
            let kclass = image_name;
            if (image_name instanceof NativePointer === true) {
                argCnt = methodName;
                methodName = className;
            }
            else if (Object.keys(image_name).length !== 0) {
                kclass = image_name.info; // kclass object
            }
            else {
                kclass = MonoApiHelper.findClassByName(className, image_name); // ClassHelper
            }
            if (kclass === null) return null;

            const md = MonoApi.mono_class_get_method_from_name(kclass, Memory.allocUtf8String(methodName), argCnt);

            if (md.isNull() === true) return null;

            return md;
        },
        findFunction: (image_name, className, methodName, argCnt = -1) => {
            const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);
            if (md === null) return null;

            const impl = md.readPointer();
            return impl;
        },
        createFunction: (image_name, className, methodName, argCnt = -1, retType = 'void', argTypes = [], abiOrOptions = 'default') => {
            const impl = MonoApiHelper.findFunction(image_name, className, methodName, argCnt);
            if (impl === null) return null;
            return new NativeFunction(impl, retType, argTypes, abiOrOptions);
        },
        Intercept: hookAotMethod
    }

    function hookAotMethod(image_name, className, methodName, argCnt, callbacks, leave) {
        if (image_name === null) return console.warn('Skip');

        let isPtr = false;
        if ((isPtr = image_name instanceof NativePointer) === true || Object.keys(image_name).length !== 0) {
            if (isPtr === false) {
                ShowMethodInfo(image_name.info);
                image_name = image_name.address;
            }

            console.log(`Attach: ${image_name} => ${image_name.sub(_mod.base)}`);

            const _onEnter = className instanceof Function === true ? className : undefined;
            const _onLeave = methodName instanceof Function === true ? methodName : undefined;
            if (_onEnter !== undefined || _onLeave !== undefined) {
                return Interceptor.attach(image_name, {
                    onEnter: _onEnter,
                    onLeave: _onLeave
                });
            }

            return Interceptor.attach(image_name, { ...className });
        }

        const md = MonoApiHelper.findMethod(image_name, className, methodName, argCnt);
        if (!md) return console.error('MonoMethod not found! ' + methodName);

        //const impl = MonoApi.mono_compile_method(md); // not exits
        // https://bbs.pediy.com/thread-264813.htm
        // https://github.com/axhlzy/Il2CppHookScripts/blob/862b39b695540008ff06ed2b15e1a1ec98b44fa3/Others/UnityFunctionHook.js#L254
        const impl = md.readPointer();
        console.log(`Attach: ${className}.${methodName} at ${impl} => ${impl.sub(_mod.base)}`);
        ShowMethodInfo(md);

        const _onEnter = callbacks instanceof Function === true ? callbacks : undefined;
        const _onLeave = leave instanceof Function === true ? leave : undefined;
        if (_onEnter !== undefined || _onLeave !== undefined) {
            return Interceptor.attach(impl, {
                onEnter: _onEnter,
                onLeave: _onLeave
            });
        }

        return Interceptor.attach(impl, { ...callbacks });
    }
}

if (Process.pointerSize === 4) {
    NativePointer.prototype.readMonoString = function () {
        const len = this.add(8).readU32();
        return len === 0 ? '' : this.add(0xC).readUtf16String(len * 2);
    }
}
else {
    NativePointer.prototype.readMonoString = function () {
        const len = this.add(0x10).readU32();
        return len === 0 ? '' : this.add(0x14).readUtf16String(len * 2);
    }
}

NativePointer.prototype.readMonoStringUnbox = function () {
    const len = this.readU32();
    return len === 0 ? '' : this.add(4).readUtf16String(len * 2);
}

console.log();
module.exports = exports = {
    // (imageName, className) -> classInfo_NativePointer
    // TODO: (classToken)
    findClass: MonoApiHelper.findClassByName2,

    // (kclass, methodName, argsCount) -> methodInfo_NativePointer; .address => fnPtr, .fn => NativeFunction
    // (imageName, className, methodName, argsCount) -> methodInfo_NativePointer
    // TODO: (mdToken)
    findMethod: MonoApiHelper.findMethod2,

    // (kclass, fieldName) -> field.getValue(thiz), field.getValue() // static
    // TODO: (fieldToken) -> field.getValue(thiz)
    findField: MonoApiHelper.findField2,

    // (mdObj, callbacks)
    // (ptr, callbacks)
    // (imageName, className, methodName, argsCount, callbacks)
    setHook: MonoApiHelper.Intercept,

    // (imageName, className, methodName, argsCount) -> fnNativePointer
    findFunction: MonoApiHelper.findFunction,

    // (imageName, className, methodName, argsCount) -> cbNativeCallback
    createFunction: MonoApiHelper.createFunction
}