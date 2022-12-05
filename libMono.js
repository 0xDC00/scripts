// @name         Unity
// @version      
// @author       [DC]
// @description  JIT & IL2CPP (emulator is not supported!)
// TODO: refactor, betterWrap, generic inflate, schedule,....

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

Ex:
const IntPtr = Mono.use('mscorlib', 'System.IntPtr');
const IntPtr_ctor = IntPtr['.ctor'].overload(['System.Void*']);
IntPtr.$dump(); // print methods

const IntPtr1 = IntPtr.alloc();
IntPtr_ctor(IntPtr1.thiz, [ptr(0xDEADBEAF)]);
console.log(IntPtr1.ToString(IntPtr1.thiz).readMonoString());
*/

if (module.parent === null) {
    throw "I'm not a text hooker!";
}

let cachedApi = null;
var _mod, _api, isAot;

/* backward compatibility */
function setHook(imageName, className, methodName, argCount, callbacks) {
    return _api.setHook.apply(null, arguments);
}
function findClass(imageName, className) {
    return _api.findClass.apply(null, arguments);
}
function findMethod(imageName, className, methodName, argCount) {
    return _api.findMethod.apply(null, arguments);
}
function findField(imageName, className, fieldName) {
    return _api.findField.apply(null, arguments);
}
function createFunction(imageName, className, methodName, argCnt = -1, retType = 'void', argTypes = [], abiOrOptions = 'default') {
    const m = findMethod(imageName, className, methodName, argCnt);
    return m === null ? null : new NativeFunction(m.address, retType, argTypes, abiOrOptions);
}
// END

function isMonoLoaded() {
    return isMono().module !== null;
}

if (isMonoLoaded() === true) {
    perform(() => {});
}
function perform(f, m) {
    const { isAot, module } = isMono();
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
    const m = MonoApi.mono_thread_attach(domain);
    Script.bindWeak(globalThis, () => {
        MonoApi.mono_thread_detach(m);
    });

    Memory.allocMonoString = function (s) {
        const v = Memory.allocUtf16String(s);
        const p = MonoApi.mono_string_new_utf16(domain, v, s.length);
        return p;
    }

    if (Process.pointerSize === 4) {
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

    NativePointer.prototype.unbox = function () {
        return MonoApi.mono_object_unbox(this);
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

    const MonoApiHelper = {
        findClass: function (imageName, className) {
            let hClass = null;
            if (className === undefined) {
                var index = imageName.indexOf(':');
                className = imageName.substring(index + 1);
                imageName = imageName.substring(0, index);
            }

            const _namespace = className.substring(0, className.lastIndexOf('.'));
            const _className = className.substring(_namespace.length + 1);
            
            const pNamespace = Memory.allocUtf8String(_namespace); // first part
            const pClassName = Memory.allocUtf8String(_className); // last part

            imageName = imageName ?? null;
            if (imageName !== null) {
                if (imageName === '') {
                    imageName = 'Assembly-CSharp';
                }
                imageName = imageName.toUpperCase().replace(/\.DLL$/g, '');
            }

            MonoApi.AssemblyForeach(function (assembly) {
                if (hClass !== null) return 1;

                const hImage = MonoApi.mono_assembly_get_image(assembly);
                if (imageName !== null) {
                    const currentImageName = MonoApi.mono_image_get_name(hImage).readCString();
                    if (imageName !== currentImageName.toUpperCase().replace(/\.DLL$/g, '')) {
                        //console.log('SkipImage: ' + currentImageName);
                        return 0;
                    }
                    else {
                        console.log('Image: ' + currentImageName);
                        imageName = currentImageName;
                    }
                }

                const kclass = MonoApi.mono_class_from_name(hImage, pNamespace, pClassName);
                if (kclass.isNull() === false) {
                    hClass = kclass;
                    if (imageName === null)
                        imageName = MonoApi.mono_image_get_name(hImage).readCString();

                    return 1;
                }
                return 0;
            });

            if (hClass === null) return null;

            return _classWrap({
                handle: hClass,
                name: _className,
                namespace: _namespace,
                fullName: className,
                imageName: imageName
            });
        },
        findMethod: (imageName, className, methodName, numArg = -1) => {
            let classObj = null;
            if (imageName.handle !== undefined) {
                classObj = imageName;
                numArg = methodName ?? numArg;
                methodName = className;
                console.log('  findMethod.fromClass:', classObj.fullName, classObj.handle);
            }
            else {
                classObj = MonoApiHelper.findClass(imageName, className);
                console.log('  findMethod.findClass:', imageName, className);
            }
            if (classObj === null) return null;

            var hMethod = NULL;
            if (typeof numArg === 'number') {
                console.log('    findMethod name|argCount: ' + methodName + '|' + numArg);
                const mn = Memory.allocUtf8String(methodName);
                hMethod = MonoApi.mono_class_get_method_from_name(classObj.handle, mn, numArg);
            }
            else {
                console.log('    findMethod methods|sign: ' + methodName + '|' + numArg);
                const methods = classObj.methods[methodName];
                if (methods !== undefined) {
                    const method = methods[numArg.toString()];
                    return method == undefined ? null : method;
                }
            }
            if (hMethod.isNull() === true) return null;
            
            const result = _methodWrap({
                handle: hMethod,
                name: methodName,
                class: classObj
            });
            console.log('    FoundMethod: ', classObj.fullName, methodName, '(' + result.args + ') -> ' + result.return, JSON.stringify(hMethod));
            return result;
        },
        findField: (imageName, className, fieldName) => {
            let classObj = null;
            if (imageName.handle !== undefined) {
                classObj = imageName;
                fieldName = className;
            }
            else {
                classObj = MonoApiHelper.findClass(imageName, className);
            }
            if (classObj === null) return null;

            const fn = Memory.allocUtf8String(fieldName);
            const hfield = MonoApi.mono_class_get_field_from_name(classObj.handle, fn);
            if (hfield.isNull() === true) return null;

            return {
                handle: hfield,
                name: fieldName,
                get value() {
                    return this.getValue();
                },
                get offset() {
                    if (this._offset === undefined)
                        this._offset = MonoApi.mono_field_get_offset(this.handle);
                    return this._offset;
                },
                getValue(thiz = null, output) {
                    try {
                        if (output === undefined) {
                            if (this._buf === undefined)
                                this._buf = Memory.alloc(Process.pageSize);
                            output = this._buf;
                        }
                        if (thiz === null)
                            MonoApi.mono_field_static_get_value(this.handle, output);
                        else
                            MonoApi.mono_field_get_value(thiz, this.handle, output);

                        return output;
                    }
                    catch { return null; }
                }
            }
        },
        setHook: (imageName, className, methodName, numArg, callbacks, leave) => {
            let address, methodObj;
            if (imageName.handle !== undefined) {
                methodObj = imageName;
                address = imageName.address;
                callbacks = className;
                leave = methodName;
            }
            else {
                methodObj = MonoApiHelper.findMethod(imageName, className, methodName, numArg);
                if (methodObj === null)
                    return console.warn('MonoMethod not found! ' + imageName + ' ' + className + '.' + methodName);
                address = methodObj.address;
            }

            if (address.isNull() === true) {
                return console.warn("setHook.SkipNullAddress: " + JSON.stringify(methodObj, null, 2));
            }

            isAot === true && ShowMethodInfo(methodObj.handle);
            console.log(isAot === false ? `Attach: ${address}` : `Attach: ${address} => ${address.sub(_mod.base)}`);

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
    
    function makeMethodCallable () {
        const m = function (thiz, args) {
            // // this = undefined
            // if (new.target !== undefined) {
            //     // this = {}
            //     const thix = m.class.alloc();
            //     m.invoke(thix.thiz, [...arguments]);
            //     return thix;
            // }
            return m.invoke(thiz, args); // call invoke(thiz, args)
        };
        return m;
    }

    const typesCache = {};
    function _typeWrap(o) {
        const c = typesCache[o.handle];
        if (c !== undefined) return c;

        const t = {
            handle: o.handle,
            get clazz() {
                if (o.clazz === undefined) {
                    const kclass = MonoApi.mono_type_get_class(o.handle);
                    o.clazz = _classWrap({
                        handle: kclass,
                        fullName: MonoApi.mono_type_get_name(o.handle).readCString()
                    });
                }
                return o.clazz;
            }
        }
        typesCache[o.handle] = t;
        return t;
    }

    function _methodWrap(o) {
        o = o ?? {};
        const f = Object.create(Function.prototype, {
            handle: {
                enumerable: true,
                get() {
                    return o.handle;
                }
            },
            fullName: {
                enumerable: true,
                get() {
                    if (o._name === undefined) {
                        o._name = MonoApi.mono_method_get_name(f.handle).readCString();
                    }
                    return o._name;
                }
            },
            //class->type
            class: {
                enumerable: false, // prevent JSON (default=false)
                get() {
                    return o.class;
                },
                set(v) {
                    o.class = v;
                }
            },
            args: {
                enumerable: true,
                get() {
                    if (o._args === undefined) {
                        o._args = [];
                        o._argsType = [];
                        if (isAot === true) {
                            var argCnt = MonoApi.mono_method_get_param_count(this.handle);
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
                                const iter = Memory.alloc(Process.pageSize);
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
                    }
                    return o._args;
                }
            },
            argumentTypes: {
                enumerable: true,
                get() {
                    const _ = this.args;
                    return o._argsType;
                }
            },
            return: {
                enumerable: true,
                get() {
                    const _ = this.args;
                    return o._ret;
                }
            },
            returnType: {
                enumerable: true,
                get() {
                    const _ = this.args;
                    return o._retType;
                }
            },
            address: {
                get() {
                    if (o._address === undefined) {
                        const ptr = isAot ? this.handle.readPointer() : MonoApi.mono_compile_method(this.handle);
                        // if (ptr.isNull() === true) {} // TODO
                        o._address = ptr;
                    }

                    return o._address;
                }
            },
            generic: {
                enumerable: true,
                get() {
                    if (o._generic === undefined) {
                        o._generic = MonoApi.mono_method_is_generic(this.handle);
                    }
                    return o._generic;
                }
            },
            inflated: {
                enumerable: true,
                get() {
                    if (o._generic === undefined) {
                        o._generic = MonoApi.mono_method_is_inflated(this.handle);
                    }
                    return o._generic;
                }
            },
            instance: {
                enumerable: true,
                get() {
                    if (o._instance === undefined) {
                        o._instance = MonoApi.mono_method_is_instance(this.handle);
                    }
                    return o._instance;
                }
            },
            overloads: {
                get() {
                    // { argSign: method, argSign: method}
                    const obj = this.class.methods[this.fullName];
                    // fridaJava return like: [method, method, ...]
                    return Object.keys(obj).map((key) => obj[key]);
                }
            },
            $dump: {
                value() {
                    const obj = this.class.methods[this.fullName];
                    console.log(this.fullName + '(' + this.args + ') -> ' + this.return);
                    console.log(JSON.stringify(Object.keys(obj), null, 2));
                }
            },
            // func
            overload: {
                value(args = []) {
                    if (typeof args === 'string') {
                        if (arguments.length > 1) {
                            args = Object.keys(arguments).map((key) => arguments[key]);
                        }
                    }
                    const overloads = this.class.methods[this.fullName];
                    return overloads[args.toString()];
                }
            },
            attach: {
                value(callbacksOrProbe, data) {
                    return Interceptor.attach(f.address, callbacksOrProbe, data);
                }
            },
            invoke: {
                value(thiz = NULL /* static method */, args = NULL) {
                    if (thiz === null) thiz = NULL;
                    else if (thiz instanceof NativePointer === false) {
                        thiz = thiz.thiz;
                    }
                    if (args === null) args = NULL;
                    if (args instanceof Array === true) {
                        const _args = Memory.alloc(args.length * Process.pointerSize);
                        for (let i = 0; i < args.length; i++) {
                            const arg = args[i];
                            _args.add(i * Process.pointerSize).writePointer(arg);
                        }
                        args = _args;
                    }
                    //MonoApi.mono_thread_attach(MonoApi.mono_get_root_domain());
                    const exception = Memory.alloc(Process.pageSize);
                    const val = MonoApi.mono_runtime_invoke(
                        this.handle /* MethodInfo* */,
                        thiz, /* Il2cppOpject* */
                        args /* void** */,
                        exception /* Il2CppException** */
                    );  // MonoObject*
                    const e = exception.readPointer();
                    if (e.isNull() === false) {
                        console.log('exception', hexdump(e, { length: 0x40 }));
                        console.log(e.add(0x20).readPointer().readMonoString());
                    }
                    return val;
                }
            },
            inflate: {
                value() {
                    // TODO: inflating a generic method
                }
            }
        });

        const m = makeMethodCallable();
        Object.setPrototypeOf(m, f);
        return m;
    }

    function _objectWrap(clazz, thiz) {
        const obj = {
            clazz,
            thiz
        }
        const wrapperHandler = {
            get (x, property) {
                if (property === 'thiz') return thiz;
                if (property === 'clazz') return clazz;
                const target = x.clazz;
                const result = target[property];
                if (result !== undefined)
                    return result;
                const method = target.findMethod(property);
                return method;
            }
        };
        return new Proxy(obj, wrapperHandler);
    }

    function _classWrap(o) {
        // handle, name, namespace, fullName, imageName
        let clone = {
            findMethod: function (name, argCnt) {
                return MonoApiHelper.findMethod(this, name, argCnt);
            },
            findField: function (name) {
                return MonoApiHelper.findField(this, name);
            },
            get methods() {
                if (this._methods === undefined) {
                    this._methods = Object.create(null);
                    const iter = Memory.alloc(Process.pointerSize);
                    while (true) {
                        const md = MonoApi.mono_class_get_methods(this.handle, iter);
                        if (md.isNull() === true) {
                            break;
                        }
                        var methodObj = _methodWrap({
                            handle: md,
                            class: this
                        });
                        const key1 = methodObj.fullName; // String
                        const key2 = methodObj.args; // Array
                        
                        if (this._methods[key1] === undefined) {
                            this._methods[key1] = Object.create(null);
                        }
                        this._methods[key1][key2.toString()] = methodObj;
                    }
                }
                return this._methods;
            },
            method: function(name) {
                if (this._methods === undefined) {
                    return findMethod(name);
                }
                const methods = methods[name];
                if (methods !== undefined) {
                    const overloads = Object.values(methods);
                    return overloads[0];
                }
                return null;
            },
            $new: function () {
                // TODO
                //const staticInit = this.methods['.cctor'];
                const init = this.methods['.ctor'];
                console.log('CallCtor', this.name, JSON.stringify(init, null, 2));
            },
            alloc() {
                const thiz = MonoApi.mono_object_new(this.handle);
                return _objectWrap(this, thiz);
            },
            $dump() {
                console.log('---');
                console.log(o.fullName + ' functions:');
                for (const key in this.methods) {
                    const method = this._methods[key];

                    console.log('  ' + key);
                    for (const sig in method) {
                        const object_ = method[sig];

                        console.log('    - ' + sig);
                        console.log('    - ' + object_.return);
                        console.log('      Generic : ' + object_.generic);
                        console.log('      Inflated: ' + object_.inflated);
                        console.log('      Tnstance: ' + object_.instance);
                        console.log('      handle  : ' + object_.handle);
                    }
                }
                console.log('---');
            },
            get inflated() {
                if (o.inflated === undefined) {
                    o.inflated = MonoApi.mono_class_is_inflated(o.handle);
                }
                return o.inflated;
            },
            get generic() {
                if (o.generic === undefined) {
                    o.generic = MonoApi.mono_class_is_generic(o.handle);
                }
                return o.generic;
            },
            inflate(...classes) {
                // TODO: inflating a generic class
            }
        };

        // TODO:
        if (o !== undefined)
             clone = Object.assign(clone, o);

        const wrapperHandler = {
            get (target, property) {
                const result = target[property];
                if (result !== undefined)
                    return result;
                let r = target.findMethod(property);
                if (r === null)
                    r = target.findField(property);
                return r;
            },
            construct (target, args, newtarget) {
                console.log('construct Captured!');
                return Reflect.construct(target, args, newtarget);
            }
        };

        return new Proxy(clone, wrapperHandler);
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
            mono_get_root_domain: createNativeFunction('il2cpp_domain_get', 'pointer'), // mono_domain_get <=> mono_get_root_domain?
            mono_thread_attach: createNativeFunction('il2cpp_thread_attach', 'pointer', ['pointer']),
            mono_thread_detach: createNativeFunction('il2cpp_thread_detach', 'pointer', ['pointer']),
            mono_assembly_get_image: createNativeFunction('il2cpp_assembly_get_image', 'pointer', ['pointer']),
            //il2cpp_domain_get_assemblies: createNativeFunction('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']),
            mono_class_from_name: createNativeFunction('il2cpp_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']),
            mono_class_get_method_from_name: createNativeFunction('il2cpp_class_get_method_from_name', 'pointer', ['pointer', 'pointer', 'int']),
            mono_image_get_name: createNativeFunction('il2cpp_image_get_name', 'pointer', ['pointer']),
            mono_runtime_invoke: createNativeFunction('il2cpp_runtime_invoke', 'pointer', ['pointer', 'pointer', 'pointer', 'pointer']),
            mono_object_unbox: createNativeFunction('il2cpp_object_unbox', 'pointer', ['pointer']),
            mono_string_new_utf16: createNativeFunction('il2cpp_string_new_utf16', 'pointer', ['pointer', 'pointer', 'int']),
            mono_class_get_field_from_name: createNativeFunction('il2cpp_class_get_field_from_name', 'pointer', ['pointer', 'pointer']),
            mono_field_get_value: createNativeFunction('il2cpp_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_static_get_value: createNativeFunction('il2cpp_field_static_get_value', 'void', ['pointer', 'pointer']),
            mono_field_get_offset: createNativeFunction('il2cpp_field_get_offset', 'int', ['pointer']),
            //
            mono_class_get_methods: createNativeFunction('il2cpp_class_get_methods', 'pointer', ['pointer', 'pointer']),
            mono_method_get_name: createNativeFunction('il2cpp_method_get_name', 'pointer', ['pointer']),
            mono_method_get_param_count: createNativeFunction('il2cpp_method_get_param_count', 'int', ['pointer']),
            mono_method_get_param: createNativeFunction('il2cpp_method_get_param', 'pointer', ['pointer', 'int']),
            mono_type_get_name: createNativeFunction('il2cpp_type_get_name', 'pointer', ['pointer']),
            mono_type_get_class: createNativeFunction('il2cpp_type_get_class', 'pointer', ['pointer']),
            mono_class_is_generic: createNativeFunction('il2cpp_class_is_generic', 'bool', ['pointer']),
            mono_class_is_inflated: createNativeFunction('il2cpp_class_is_inflated', 'bool', ['pointer']),
            mono_method_is_generic: createNativeFunction('il2cpp_method_is_generic', 'bool', ['pointer']),
            mono_method_is_inflated: createNativeFunction('il2cpp_method_is_inflated', 'bool', ['pointer']),
            mono_method_is_instance: createNativeFunction('il2cpp_method_is_instance', 'bool', ['pointer']),
            //
            //mono_method_signature: createNativeFunction('il2cpp_method_signature', 'pointer', ['pointer']),
            //mono_signature_get_param_count: createNativeFunction('il2cpp_signature_get_param_count', 'int', ['pointer']),
            //mono_signature_get_params: createNativeFunction('il2cpp_signature_get_params', 'pointer', ['pointer', 'pointer']),
            //mono_signature_get_return_type: createNativeFunction('il2cpp_signature_get_return_type', 'pointer', ['pointer']),
            //
            il2cpp_method_get_return_type: createNativeFunction('il2cpp_method_get_return_type', 'pointer', ['pointer']),
            //
            mono_object_new: createNativeFunction('il2cpp_object_new', "pointer", ["pointer"]),
            //
            mono_class_get_type: createNativeFunction('il2cpp_class_get_type', "pointer", ["pointer"]),
            mono_type_get_object: createNativeFunction('il2cpp_type_get_object', "pointer", ["pointer", "pointer"]),
            mono_object_get_class: createNativeFunction('il2cpp_object_get_class', "pointer", ["pointer"]),
            mono_array_new: createNativeFunction('il2cpp_array_new', "pointer", ["pointer", "pointer", "int"]),
            //mono_array_set: createNativeFunction('il2cpp_array_set', "pointer", ["pointer", "pointer", "int", "pointer"]),
            //mono_array_get_elements: createNativeFunction('il2cpp_array_get_elements', "pointer", ["pointer"]),
            mono_class_from_mono_type: createNativeFunction('il2cpp_class_from_system_type', "pointer", ["pointer"]),
        }

        const mono_class_from_name_case = _mod.findExportByName('il2cpp_class_from_name_case');
        if (mono_class_from_name_case !== null) {
            MonoApi.mono_class_from_name = new NativeFunction(mono_class_from_name_case, 'pointer', ['pointer', 'pointer', 'pointer']);
        }

        const il2cpp_domain_get_assemblies = createNativeFunction('il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']);
        MonoApi.AssemblyForeach = function (cb) {
            const domain = MonoApi.mono_get_root_domain();
            const buf = new Uint8Array(8);
            const ptr = buf.buffer.unwrap();
            const asms = il2cpp_domain_get_assemblies(domain, ptr);
            const size = ptr.readU32();
            for (let i = 0; i < size; i++) {
                const assembly = asms.add(i * Process.pointerSize).readPointer();
                if (cb(assembly) === 1) break;
            }
        }

        return MonoApi;
    } {
        const MonoApi = {
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
            mono_field_get_value: createNativeFunction('mono_field_get_value', 'void', ['pointer', 'pointer', 'pointer']),
            mono_field_static_get_value: createNativeFunction('mono_field_static_get_value', 'void', ['pointer', 'pointer']),
            mono_field_get_offset: createNativeFunction('mono_field_get_offset', 'int', ['pointer']),
            //
            mono_class_get_methods: createNativeFunction('mono_class_get_methods', 'pointer', ['pointer', 'pointer']),
            mono_method_get_name: createNativeFunction('mono_method_get_name', 'pointer', ['pointer']),
            //mono_method_get_param_count: createNativeFunction('mono_method_get_param_count', 'int', ['pointer']),
            //mono_method_get_param: createNativeFunction('mono_method_get_param', 'pointer', ['pointer', 'int']),
            mono_type_get_name: createNativeFunction('mono_type_get_name', 'pointer', ['pointer']),
            mono_type_get_class: createNativeFunction('mono_type_get_class', 'pointer', ['pointer']),
            mono_class_is_generic: createNativeFunction('mono_class_is_generic', 'bool', ['pointer']),
            mono_class_is_inflated: createNativeFunction('mono_class_is_inflated', 'bool', ['pointer']),
            mono_method_is_generic: createNativeFunction('unity_mono_method_is_generic', 'bool', ['pointer']),
            mono_method_is_inflated: createNativeFunction('unity_mono_method_is_inflated', 'bool', ['pointer']),
            //mono_method_is_instance: createNativeFunction('mono_method_is_instance', 'bool', ['pointer']),
            //
            mono_signature_is_instance: createNativeFunction('mono_signature_is_instance', 'bool', ['pointer']),
            mono_method_signature: createNativeFunction('mono_method_signature', 'pointer', ['pointer']),
            //
            mono_signature_get_param_count: createNativeFunction('mono_signature_get_param_count', 'int', ['pointer']),
            mono_signature_get_params: createNativeFunction('mono_signature_get_params', 'pointer', ['pointer', 'pointer']),
            mono_signature_get_return_type: createNativeFunction('mono_signature_get_return_type', 'pointer', ['pointer']),
            //
            mono_object_new_: createNativeFunction('mono_object_new', "pointer", ["pointer", "pointer"]),
            //mono_security_set_mode: createNativeFunction('mono_security_set_mode', 'void', ['int']),
            //
            mono_class_get_type: createNativeFunction('mono_class_get_type', "pointer", ["pointer"]),
            mono_type_get_object: createNativeFunction('mono_type_get_object', "pointer", ["pointer", "pointer"]),
            mono_object_get_class: createNativeFunction('mono_object_get_class', "pointer", ["pointer"]),
            mono_array_new: createNativeFunction('mono_array_new', "pointer", ["pointer", "pointer", "int"]),
            //mono_array_set: createNativeFunction('mono_array_set', "pointer", ["pointer", "pointer", "int", "pointer"]),
            //mono_array_get_elements: createNativeFunction('mono_array_get_elements', "pointer", ["pointer"]),
            mono_class_from_mono_type: createNativeFunction('mono_class_from_mono_type', "pointer", ["pointer"])
        };
        MonoApi.mono_method_is_instance = function(md) {
            const sig = MonoApi.mono_method_signature(md);
            return MonoApi.mono_signature_is_instance(sig);
        }
        MonoApi.mono_object_new = function(kclass) {
            return MonoApi.mono_object_new_(MonoApi.mono_domain_get(), kclass);
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

        return MonoApi;
    }
}

function isMono() {
    let address = Module.findExportByName(null, 'mono_thread_attach');
    if (address !== null) {
        const mod = Process.getModuleByAddress(address);
        return { isAot: false, module: mod };
    }

    address = Module.findExportByName(null, 'il2cpp_thread_attach');
    if (address !== null) {
        const mod = Process.getModuleByAddress(address);
        return { isAot: true, module: mod };
    }

    address = Module.findExportByName(null, 'il2cpp_runtime_class_init');
    if (address !== null) {
        const mod = Process.getModuleByAddress(address);
        return { isAot: true, module: mod };
    }
    
    // try again
    const mods = Process.enumerateModules();
    for (const mod of mods) {
        // if (mod.findExportByName('mono_thread_attach') !== null) {
        //     return { isAot: false, mod: mod };
        // }
        // else if (mod.findExportByName('il2cpp_thread_attach') !== null) {
        //     return { isAot: true, mod: mod };
        // }
        const exps = mod.enumerateExports();
        for (const exp of exps) {
            if (exp.name.includes('mono_thread_attach') === true) {
                console.log('exports: `' + exp.name + '`');
                return { isAot: false, module: mod };
            }
            else if (exp.name.includes('il2cpp_thread_attach') === true
            || exp.name.includes('il2cpp_runtime_class_init') === true) {
                console.log('exports: `' + exp.name + '`');
                return { isAot: true, module: mod };
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
        return function () { /*console.log(arguments);*/ return null; }; // create dummy function
    }
    return new NativeFunction(address, retType, argTypes, abiOrOptions);
}

function ShowMethodInfo(md) {
    if (isAot === false) return;
    try {
        console.warn("-------------------------------------------")
        console.log("\x1b[36mFunctionName\t\t===>\t " + md.add(Process.pointerSize * 2).readPointer().readCString() + "\x1b[0m")
        console.log("Il2CppMethodPointer\t===>\t", md.readPointer())
        console.log("InvokerMethod\t\t===>\t", md.add(Process.pointerSize).readPointer())
        console.warn("-------------------------------------------")
    }
    catch (e) {
        console.error(e);
    }
}

function schedule(fn) {
    // TODO
}

function scheduleOnMainThread(fn) {
    // TODO
}

module.exports = exports = {
    perform,
    setHook,
    findClass,
    findMethod,
    findField,
    use: findClass,
    get available() {
        return isMonoLoaded();
    },
    schedule,
    scheduleOnMainThread,
    createFunction
};