// ==UserScript==
// @name         LUNAR: Silver Star Story Complete
// @version      
// @author       T4uburn
// @description  Steam
// * GungHo
//
// https://store.steampowered.com/app/3255380/LUNAR_Remastered_Collection/
// https://steamdb.info/patchnotes/18155215/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '0+');

const decoder = new TextDecoder('shift_jis');

var inputString = ''
var debounceTimer = null
var last_offset = 0

function addCharacter(char) {
    inputString += char;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        handler(inputString);
        inputString = '';
        last_offset = 0;
    }, 100);
}

(function () {
    // const address= new NativePointer("0x7FF67EB9C3D6")
    const sig = 'EB ?? 83 F8 ?? 75 ?? 4D 8B C2 41 8B CB';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[General text] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[General text] Found hook', address)

    Interceptor.attach(address, {onEnter (args) {
        var offset = this.context.rax
        if (last_offset != 0 && String(last_offset) != String(offset))
            addCharacter("\n")
        // addCharacter(String.fromCharCode(this.context.r11))
        addCharacter(decoder.decode([(this.context.r11>>8) & 0xFF,this.context.r11 & 0xFF]))
        last_offset = offset.add(2)
    }});
})();

// subtitle pointer at 7FF680E3AA58

(function () {
    // const address= new NativePointer("0x7FF67EB0EC5F")
    const sig = '48 89 15 ?? ?? ?? ?? 44 38 72 ?? 75';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[Subtitles 1] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[Subtitles 1] Found hook', address)
    
    Interceptor.attach(address, {onEnter (args) {
        let subtitle_start = this.context.rdx.add(0x10)
        let subtitle = ""
        let iterator = 0
        let current_char = subtitle_start.readU8()
        while(current_char != 0){
            if(current_char >= 0x80){ //multi-byte char
                subtitle += decoder.decode([current_char, subtitle_start.add(iterator+1).readU8()])
                iterator+=2
            }
            else { //single-byte char
                subtitle += decoder.decode([current_char])
                iterator++
            }
            current_char = subtitle_start.add(iterator).readU8()
        }
        handler(subtitle)
    }});
})();

(function () {
    // const address= new NativePointer("0x7FF67EB0E69E")
    const sig = '48 89 05 ?? ?? ?? ?? B0 ?? E9 ?? ?? ?? ?? 32 C9';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[Subtitles 2] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[Subtitles 2] Found hook', address)
    
    Interceptor.attach(address, {onEnter (args) {
        let subtitle_start = this.context.rax.add(0x10)
        let subtitle = ""
        let iterator = 0
        let current_char = subtitle_start.readU8()
        while(current_char != 0){
            if(current_char >= 0x80){ //multi-byte char
                subtitle += decoder.decode([current_char, subtitle_start.add(iterator+1).readU8()])
                iterator+=2
            }
            else { //single-byte char
                subtitle += decoder.decode([current_char])
                iterator++
            }
            current_char = subtitle_start.add(iterator).readU8()
        }
        handler(subtitle)
    }});
})();

