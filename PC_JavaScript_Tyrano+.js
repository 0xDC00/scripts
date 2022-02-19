// ==UserScript==
// @name         JavaScript - Monkey Patching
// @version      
// @author       [DC]
// @description  
// ** NW.js (node-webkit)
// ** Engines:
//  - Tyrano: https://github.com/ShikemokuMK/tyranoscript
//  - RPG Maker MV (experiment)
//
// Limitation:
//  - AGENT RUN (does not support Attach/Detach; Select path to EXE instead drag-n-drop).
//  - Set the text speed to max.
//
// ==/UserScript==

/* Handler: NW.js -> Agent */
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
        }
    }
});

/* Inject code to index.html (IO way) */
let isWrite = false;
let patched = false;
let h1, h2;
globalThis.__inject ?? (globalThis.__inject = __inject);

// [Package] Overwrite after write
h1 = Interceptor.attach(Module.getExportByName('kernel32.dll', 'CreateFileW'), {
    onEnter: function (args) {
        const filePath = args[0].readUtf16String();
        if (filePath.endsWith('index.html')) {
            const dwDesiredAccess = args[1].toUInt32();
            if (dwDesiredAccess === 0x100 /* FILE_WRITE_ATTRIBUTES */ ) {
                if (patched === false) {
                    patched = true;
                    console.log('Patch_1');

                    patchHtml(filePath);
                }
            }
            else if (dwDesiredAccess === 0x80000000 /* GENERIC_READ */) {
                if (patched === true) {
                    console.log('Patch_2');
                    //setTimeout(function () { writeAllText(filePath, oriHtml); }, 500); // restore (JFF)
                }
                else {
                    // do nothing (isWrite is false)
                }
                h1.detach();
                h2.detach();
            }
            else if (dwDesiredAccess === 0x40000000 /* GENERIC_WRITE */ ) {
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
            if (ret.toInt32() > 0  && isWrite === false && patched === false) {
                console.log('Patch_f');
                patched = true;

                // patch index.html => indef.html
                const numChar = this.filePath.length;
                const pointer = this.args0;
                pointer.add((numChar-6) * 2).writeU8(0x66); // f=0x66
                
                const outPath = pointer.readUtf16String(numChar * 2);
                patchHtml(this.filePath, outPath);
            }
        }
    }
});

function patchHtml(filePath, outPath) {
    outPath ?? (outPath = filePath);

    const injectInit = __init.toString();
    const injectJs = globalThis.__inject.toString();

    let oriHtml = readAllText(filePath);
    oriHtml = oriHtml.replace(/\<script\>\/\/_JS_PATCH_BEGIN_.+_JS_PATCH_END_.\<\/script\>/s, ''); // cleanup
    let newHtml = oriHtml.replace('</body>', `
<script>//_JS_PATCH_BEGIN_
const send = (${injectInit})();
(${injectJs})();
//_JS_PATCH_END_
</script></body>
`);
    writeAllText(outPath, newHtml);
}

function readAllText(path) {
    return fs_readFileSync(path, 'utf8');
}

function writeAllText(path, content) {
    const file = new File(path, 'w+');
    file.write(content);
    file.flush();
    file.close();
}

/* Payload */
function __init() {
    document.title += ' | Agent';
    //require('nw.gui').Window.get().showDevTools();

    const _clipboard = require('nw.gui').Clipboard.get();
    function send(s) {
        console.log(s);
        _clipboard.set('\x00' + s, 'text'); // NW.js -> Agent
    }

    send('Script loaded!');
    return send;
}

function __inject() {
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
        }, 4000);
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
                Window_Message.prototype.onEndOfText = function() {
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
        }, 4000);
    }
    else {
        send('[Error] Unsupported engine!');
    }
}