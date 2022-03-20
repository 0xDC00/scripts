// ==UserScript==
// @name         JavaScript - Monkey Patching
// @version      
// @author       [DC]
// @description  
// ** Runtime: Electron, NW.js (node-webkit)
// ** Engines:
//  - Tyrano: https://github.com/ShikemokuMK/tyranoscript
//  - RPG Maker MV, MZ (experiment)
//
// Limitation:
//  - AGENT RUN (does not support Attach/Detach; Select path to EXE instead drag-n-drop).
//  - Set the text speed to max.
//
//  - [Electron] Does not support 'app.asar' hook.
//      Solution: You'd have to extract file 'resources/app.asar' to folder 'resources/app'
//      step-by-step: https://discord.com/channels/867944111557201980/888396325345964092/944732282038648852
//      Video: https://youtu.be/yMPVHY5Ndn8
//
// ==/UserScript==

const isElectron = isElectronProcess();
console.log('\r\nRuntime: ' + (isElectron === true ? 'Electron\r\nMake sure `app.asar` is extracted to `app` folder.\n' : 'NW.js'));

/* Handler: Target -> Agent */
Interceptor.attach(Module.getExportByName('user32.dll', 'SetClipboardData'), {
    onEnter: function (args) {
        const uFormat = args[0];
        const hMem = args[1];
        if (uFormat.toInt32() == 13 /* CF_UNICODETEXT */) {
            const ptr = hMem.readPointer();
            if (ptr.readU16() == 0) {
                console.log('onEnter');
                let s = ptr.add(2).readUtf16String();
                trans.send(s);
                args[1] = NULL;
            }
            else console.log('Copy: ' + JSON.stringify(ptr.readUtf16String()));
        }
    }
});

/* Inject code to index.html (IO way) */
const __init = isElectron === true ? __initElectron : __initNWjs;
globalThis.__inject ?? (globalThis.__inject = __inject);

let isWrite = false;
let patched = false;

// ELECTRON TODO:
//  - asar hook? (hard!, many version => wrong pattern): https://github.com/electron/electron/blob/main/shell/browser/net/asar/asar_url_loader.cc#L130
//  - Inject js to electron v8? (hard!, many version => v8 ABI conflict)
//  - Electron driver? (can't do via agent side)
// => Nothing to do!
Interceptor.attach(Module.getExportByName('kernel32.dll', 'GetFileAttributesExW'), {
    onEnter: function (args) {
        const filePath = args[0].readUtf16String();
        this.args0 = args[0];
        this.filePath = filePath;
        this.isTarget = filePath.endsWith('index.html');

        if (this.isTarget === true && isWrite === false) {
            console.log('Patch_f2');

            // patch index.html => indef.html
            const numChar = this.filePath.length;
            const pointer = this.args0;
            pointer.add((numChar - 6) * 2).writeU8(0x66); // f=0x66

            if (patched === false) {
                patched = true;
                console.log('-> write');
                const outPath = pointer.readUtf16String(numChar * 2);
                patchHtml(this.filePath, outPath);
            }
        }
    }
});
if (!isElectron) {
    let h1, h2;
    // [Package] Overwrite after write
    h1 = Interceptor.attach(Module.getExportByName('kernel32.dll', 'CreateFileW'), {
        onEnter: function (args) {
            const filePath = args[0].readUtf16String();
            if (filePath.endsWith('index.html')) {
                const dwDesiredAccess = args[1].toUInt32();
                if (dwDesiredAccess === 0x100 /* FILE_WRITE_ATTRIBUTES */) {
                    if (patched === false) {
                        patched = true;
                        console.log('Patch_1\r\n-> write');

                        patchHtml(filePath);
                    }
                }
                else if (dwDesiredAccess === 0x80000000 /* GENERIC_READ */) {
                    if (patched === true) {
                        console.log('Patch_2');
                        //setTimeout(function () { writeAllText(filePath, oriHtml); }, 500); // restore (JFF)

                        if (isWrite === false) {
                            const numChar = filePath.length;
                            const pointer = args[0];
                            pointer.add((numChar - 6) * 2).writeU8(0x66); // f=0x66
                        }
                    }
                    else {
                        console.log('Path_e');
                    }
                    //h1.detach();
                    //h2.detach();
                }
                else if (dwDesiredAccess === 0x40000000 /* GENERIC_WRITE */) {
                    console.log('Patch_0');
                    isWrite = true;
                }
            }
        },
    });

    // [Folder] Redirect on exist
    h2 = Interceptor.attach(Module.getExportByName('kernel32.dll', 'GetFileAttributesW'), {
        onEnter: function (args) {
            const filePath = args[0].readUtf16String();
            this.args0 = args[0];
            this.filePath = filePath;
            this.isTarget = filePath.endsWith('index.html');
        },
        onLeave: function (ret) {
            if (this.isTarget === true) {
                if (ret.toInt32() > 0 && isWrite === false) {
                    console.log('Patch_f');

                    // patch index.html => indef.html
                    const numChar = this.filePath.length;
                    const pointer = this.args0;
                    pointer.add((numChar - 6) * 2).writeU8(0x66); // f=0x66

                    if (patched === false) {
                        patched = true;
                        console.log('-> write');
                        const outPath = pointer.readUtf16String(numChar * 2);
                        patchHtml(this.filePath, outPath);
                    }
                }
            }
        }
    });
}

function buildPayload() {
    const injectInit = __init.toString();
    const injectJs = globalThis.__inject.toString();

    return `if (!window.__agent_injected__) {
    window.__agent_injected__ = true;
    const send = (${injectInit})();
    (${injectJs})();
}`;
}

function patchHtml(filePath, outPath) {
    outPath ?? (outPath = filePath);

    let oriHtml = readAllText(filePath);
    oriHtml = oriHtml.replace(/\<script\>\/\/_JS_PATCH_BEGIN_.+_JS_PATCH_END_.\<\/script\>/s, ''); // cleanup
    let newHtml = oriHtml.replace('</body>', `
<script>//_JS_PATCH_BEGIN_
${buildPayload()}
//_JS_PATCH_END_
</script></body>
`);
    writeAllText(outPath, newHtml);
}

function readAllText(path) {
    return fs_readFileSync(path, 'utf8');
}

function writeAllText(path, content) {
    if (globalThis.fs_writeFileSync instanceof Function) {
        fs_writeFileSync(path, content);
    }
    else {
        const file = new File(path, 'w+');
        file.write(content);
        file.flush();
        file.close();
    }
}

function isElectronProcess() {
    const ranges = Process.enumerateRanges({ protection: 'r--', coalesce: false });
    const modExe = Process.enumerateModules()[0];
    const end = modExe.base.add(modExe.size);
    for (const range of ranges) {
        if (modExe.base.sub(range.base) > 0
            && end.sub(range.base) > 0) {
            // ELECTRON_RUN_AS_NODE
            if (Memory.scanSync(range.base, range.size, "454C454354524F4E5F52554E5F41535F4E4F444500").length !== 0)
                return true;
        }
    }

    return false;
}

/* Payload */
function __initElectron() {
    document.title += ' | Agent';

    const send = (function () {
        let str = null;
        document.addEventListener("copy", function (event) {
            if (str !== null) {
                console.log(str);
                event.clipboardData.setData('text', '\x00' + str);
                str = null;
                event.preventDefault();
            }
        });
        return function (s) {
            str = s;
            document.execCommand("copy", false, null);
        }
    })();

    send('Script loaded!');
    return send;
}

function __initNWjs() {
    document.title += ' | Agent';
    //require('nw.gui').Window.get().showDevTools();

    const _clipboard = require('nw.gui').Clipboard.get();
    function send(s) {
        console.log(s);
        _clipboard.set('\x00' + s, 'text'); // Target -> Agent
    }

    send('Script loaded!');
    return send;
}

function __inject(tryAgain) {
    const delay = tryAgain === true ? 0 : 4000;
    if (window.tyrano && tyrano.plugin) {
        function getTyranoHook() {
            try {
                return tyrano.plugin.kag.tag.text.showMessage;
            }
            catch (e) {
                return null;
            }
        }

        send('Engine: Tyrano');
        setTimeout(function () {
            document.title = 'Tyrano | Agent';
            const _text_showMessage = getTyranoHook();
            if (_text_showMessage) {
                var _previous_text = '';
                tyrano.plugin.kag.tag.text.showMessage = function () {
                    // get name
                    //const chara_name = $.isNull($(".chara_name_area").html());
                    //if (_previous_text === '' && chara_name !== '') _previous_text = chara_name + ': ';

                    // debounce trailing (join)
                    _previous_text += arguments[0]; // add line
                    clearTimeout(this._timer);
                    this._timer = setTimeout(function () {
                        // full dialogue
                        var innerText = $.isNull($(".message_inner").text());
                        if (innerText.length > _previous_text.length) _previous_text = innerText;

                        send(_previous_text);
                        _previous_text = '';
                    }, 500);

                    return _text_showMessage.apply(this, arguments);
                }
            }
            else {
                send('[Error] Tyrano');
            }
        }, delay);
    }
    else if (window.Utils && Utils.RPGMAKER_NAME) {
        function getRpgMakerHook() {
            try {
                return Window_Message.prototype.onEndOfText;
            }
            catch (e) {
                return null;
            }
        }

        const title = Utils.RPGMAKER_NAME + ' ' + Utils.RPGMAKER_VERSION;
        send('Engine: ' + title);
        setTimeout(function () {
            document.title = title + ' | Agent';

            const _drawText = getRpgMakerHook();
            if (_drawText) {
                Window_Message.prototype.onEndOfText = function () {
                    if (this._textState) {
                        var text = this._textState.text;
                        text = text.replace(/\x1b(#)*/g, ''); // control
                        send(text);
                    }
                    _drawText.apply(this, arguments);
                }
            }
            else {
                send('[Error] ' + title);
            }
        }, delay);
    }
    else {
        if (tryAgain === true) {
            send('[Error] Unsupported engine!');
        }
        else setTimeout(__inject, delay, true);
    }
}