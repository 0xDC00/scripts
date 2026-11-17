// ==UserScript==
// @name         Umineko When They Cry - Question Arcs
// @version      0.1
// @author       [samheiden]
// @description  Steam
//
//
// https://store.steampowered.com/app/406550/Umineko_When_They_Cry__Question_Arcs/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

function sizeOfUtf8Char(firstChar) {
    if (firstChar >= 0xF0) return 4;
    if (firstChar >= 0xE0) return 3;
    if (firstChar >= 0xC0) return 2;
    return 1;
}

(function () {
    attach('DialogueHook', 'E8 67A8FFFF', 'eax');
    
    let first    = null;
    let last     = null;
    let size     = 0;
    let finished = true;

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);
        Interceptor.attach(address, function (args) {
	    const pointer = this.context[register];
	    if (finished && ((last === null || pointer.compare(last) > 0 )|| pointer.compare(first) < 0)) {
	        first = last = pointer;
		size = sizeOfUtf8Char(pointer.readU8());
		finished = false;
	    } else if (!finished && pointer.equals(first)) {
                finished = true;
		const text = first.readUtf8String(size);
		handler(text);
	    } else if (!finished) {
                last = pointer;
		size += sizeOfUtf8Char(pointer.readU8());
	    }
        });
    }
})();
