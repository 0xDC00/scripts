// @name         PC KiriKiriZ ENGINES
// @version      
// @author       [DC]
// @description  

// KiriKiriZ - textrender.dll (MSVC)
function hookTextrenderDll(callback) {
    // $utf-16,2|l200|0000,-0xB|eax|textrender.dll$FF ?? 88 ?? ?? ?? ?? ?? ?? ?? ?? ?? 74 ?? ?? ?? ?? ?? ?? ?? E8 ?? ?? ?? ?? B0 01 C3
    let timer = null;
    function onEnter() {
        if (timer !== null) {
            const address = this.context.eax;
            let s = address.readUtf16String();
            callback.call(null, s);
        }

        clearTimeout(timer);
        timer = setTimeout(function () {
            timer = null;
            console.log('>>>');
        }, 100);
    }

    const m = Process.findModuleByName('textrender.dll');
    if (!m) return -1;

    const pattern = 'FF ?? 88 ?? ?? ?? ?? ?? ?? ?? ?? ?? 74 ?? ?? ?? ?? ?? ?? ?? E8 ?? ?? ?? ?? B0 01 C3'; // MSVC
    const results = Memory.scanSync(m.base, m.size, pattern);
    for (const m of results) {
        const address = m.address.sub(0xB); // GetString ret
        console.log('Attach', address);
        Breakpoint.add(address, onEnter);
    }
    let found = results.length;

    if (found === 0) {
        // TODO: mingw
        console.error('[DialoguesPattern] no result!!');
    }

    return found;
}

module.exports = exports = {
    hookTextrenderDll
}