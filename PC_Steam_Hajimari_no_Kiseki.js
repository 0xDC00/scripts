// ==UserScript==
// @name         英雄伝説 創の軌跡 / THE LEGEND OF HEROES: HAJIMARI NO KISEKI
// @version      
// @author       T4uburn
// @description  Steam
// * Nihon Falcom
// * Clouded Leopard Entertainment
//
// https://store.steampowered.com/app/1562940/___THE_LEGEND_OF_HEROES_HAJIMARI_NO_KISEKI/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+'); // dialog + chests
const handler2 = trans.send(s => s, '200+'); // doors + master quartz abilities + item names
const handler3 = trans.send(s => s, '200+'); // menu descriptions
const handler4 = trans.send(s => s, '200+'); // other descriptions

function sanitizeText(some_text){
    var text = some_text.replace(/#[0-9]+[A-z]/g, '').replace(/#[A-z]/g, '').replace("\u0001", "\n").replace("\u0002", "")
    // while(text[0].match(/[A-z]/g || text.slice(0,2).match(/[0-9]/g))){
    //     text = text.slice(1)
    // }
    return text
}

(function () {
    var chestItemsArray=[]
    function parseChest(interc){ // some hack to parse chest items
        interc.detach()
        var chestText = "Items in chest: \n"
        chestItemsArray.forEach(item => {
            chestText+=`${item}\n`
        })
        chestItemsArray=[]
        handler(chestText)
    }

    const dialogSig = '40 55 53 56 57 41 54 41 55 41 56 41 57 48 8D AC 24 ?? ?? ?? ?? B8 ?? ?? ?? ?? E8 ?? ?? ?? ?? 48 2B E0 48 C7 44 24 48';
    var results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[Dialogue] Hook not found!');
        return;
    }

    const address = results[0].address; //dialog
    console.log(results.length)

    const chestItemsSig = '48 89 5C 24 ?? 48 89 74 24 ?? 57 48 83 EC ?? 48 8B 0D ?? ?? ?? ?? 41 0F B6 F9 0F B7 F2 41 8B D8 8B D6';
    results = Memory.scanSync(__e.base, __e.size, chestItemsSig);
    if (results.length === 0) {
        console.error('[ChestItems] Hook not found!');
        return;
    }
    
    const address2 = results[0].address; //chest items
    console.log(results.length)
    
    console.log('[Dialogue] Found hook', address);
    console.log('[ChestItems] Found hook', address2);
    ;

    Interceptor.attach(address, function (args) { //dialog and chest items
        var text
        if(args[2].readU8()!=6){
            var pointer = args[2]
            if(pointer.readU8() == 0x11) {
                pointer = pointer.add(0x05)
                if(pointer.readU8() == 0x23) pointer = pointer.add(0x6)
            }
            try{
                text = pointer.readUtf8String()
            }
            catch (e){
                console.error("Dialogue format not recognized.")
            }
            handler(sanitizeText(text))
        }
        else{
            const chestInterceptor = Interceptor.attach(address2, {
                onLeave(retval) {
                  var view = new Uint8Array(retval.add(0x30).readByteArray(4))
                  view=view.reverse();
                  const coolstring = Buffer.from(view).toString('hex');;
                  const addr1=new NativePointer("0x"+coolstring)
                  var chestItem = addr1.readUtf8String()
                  if(!chestItemsArray.includes(chestItem)) chestItemsArray.push(chestItem)
                }
              });
            
            setTimeout(() => parseChest(chestInterceptor), 100);
        }
    });
})();


(function () {
    const walkingTextSig = '48 ?? ?? ?? ?? 57 48 83 EC ?? 48 8B D9 41 B8 ?? ?? ?? ?? 48 81 C1 ?? ?? ?? ?? FF 15 ?? ?? ?? ?? 33 FF';
    var results = Memory.scanSync(__e.base, __e.size, walkingTextSig);
    if (results.length === 0) {
        console.error('[WalkingText] Hook not found!');
        return;
    }
    
    const address = results[0].address; //walking chat
    console.log('[WalkingText] Found hook', address)

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = args[1].readUtf8String()
        handler(sanitizeText(text))
    }});
})();

(function () {
    // const address= new NativePointer("0x1403e1f00") // door text
    const sig = '48 89 5C 24 ?? 48 89 74 24 ?? 57 48 83 EC ?? 44 89 81 ?? ?? ?? ?? 33 C0 48 8B F1 48 8B DA';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[DoorText] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[DoorText] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = args[1].readUtf8String()
        if(text !== previous){
            previous = text
            handler2(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x1401C4F37")
    const sig = '48 2B C8 E8 ?? ?? ?? ?? 48 89 47 ?? 0F B6 43 ?? 83 E0 ?? 48 8B 4B ?? 48 2B C8';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[ItemQuartzNames] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[ItemQuartzNames] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rcx.readUtf8String()
        if(text !== previous){
            previous = text
            handler2(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x14049822A")
    var sig = 'E8 ?? ?? ?? ?? 48 8B D8 48 85 C0 74 ?? 49 8B 4D ?? 48 85 C9 74 ?? 0F B6 D1';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[ItemQuartzDescription] Hook not found!');
        return;
    }
    
    const address = results[0].address;


    // const address2= new NativePointer("0x1402A41B1")
    sig = 'BA ?? ?? ?? ?? E8 ?? ?? ?? ?? C7 44 24 ?? ?? ?? ?? ?? 0F 57 C9 F3 0F 11 4C 24 ?? 48 85 DB';
    results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[BattleDescriptions] Hook not found!');
        return;
    }
    
    const address2 = results[0].address;
    
    console.log('[ItemQuartzDescription] Found hook', address)
    console.log('[BattleDescriptions] Found hook', address2)

    let timeout = 0;

    let previous = ''
    let previousBattle = ''
    function write_if_not_repeat(mem_address,ref_handler){
        var text = mem_address.readUtf8String()
        if(text !== previous){
            ref_handler(sanitizeText(text))
        }  
    }

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rcx.readUtf8String()
        if(text !== previous){
            previous = text
            handler4(sanitizeText(text))
        }  
    }});
    Interceptor.attach(address2, {onEnter (args) {
        var text
        text = this.context.rcx.readUtf8String()
        var mem_address_to_write = this.context.rcx
        if(text !== previousBattle){
            previousBattle = text
            clearTimeout(timeout);
            timeout = setTimeout(() => write_if_not_repeat(mem_address_to_write,handler4), 10);
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x1402E5E7D")
    var sig = '48 8B D0 48 8B CF E8 ?? ?? ?? ?? E9 ?? ?? ?? ?? 48 8D 8B ?? ?? ?? ?? E8 ?? ?? ?? ?? E9 ?? ?? ?? ?? 48 8D 8B';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[MenuDescriptions] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[MenuDescriptions] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rax.readUtf8String()
        if(text !== previous){
            previous = text
            handler3(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x1402E6D32")
    var sig = '48 8B D0 48 8B CE E8 ?? ?? ?? ?? 41 0F B7 C7 EB ?? 48 C7 44 24 ?? ?? ?? ?? ?? E8';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[MenuDescriptions2] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[MenuDescriptions2] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rax.readUtf8String()
        if(text !== previous){
            previous = text
            handler3(sanitizeText(text))
        }  
    }});
})();

(function () { //TODO
    // const address= new NativePointer("0x1402E702B")
    var sig = '49 8B CE E8 ?? ?? ?? ?? 90 48 8B 4C 24 ?? 48 85 C9 74 ?? 0F B6 C1 F6 D0 A8 ?? 74 ?? E8 ?? ?? ?? ?? 90 0F B7 C5 E9';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[ArtsDescriptions] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[ArtsDescriptions] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rdx.readUtf8String()
        if(text !== previous){
            previous = text
            handler4(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x14049829C")
    var sig = '49 8B CD E8 ?? ?? ?? ?? 48 8B 8D ?? ?? ?? ?? 48 33 CC E8 ?? ?? ?? ?? 48 81 C4';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[MQuartzDescriptions] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[MQuartzDescriptions] Found hook', address)


    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rdx.readUtf8String()
        if(text !== previous){
            previous = text
            handler4(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x1402E71FB")
    var sig = '49 8B CE E8 ?? ?? ?? ?? 0F B7 C5 EB ?? B8 ?? ?? ?? ?? 48 8B 5C 24 ?? 48 8B AC 24 ?? ?? ?? ?? 48 83 C4';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[MQuartzDescriptions2] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[MQuartzDescriptions2] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rdx.readUtf8String()
        if(text !== previous){
            previous = text
            handler4(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x140721B77")
    var sig = '48 8B CB E8 ?? ?? ?? ?? 48 8B 9C 24 ?? ?? ?? ?? 33 FF E9 ?? ?? ?? ?? BA ?? ?? ?? ?? 48 8B 0D ?? ?? ?? ?? 48 8B 89';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[MQuartzAbilities] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[MQuartzAbilities] Found hook', address)


    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rdi.readUtf8String()
        if(text !== previous){
            previous = text
            handler2(sanitizeText(text))
        }  
    }});
})();

(function () {
    // const address= new NativePointer("0x14073F0B1")
    // const address= new NativePointer("0x1402E617D")
    var sig = 'E8 ?? ?? ?? ?? 44 39 B3 ?? ?? ?? ?? 75 ?? BA ?? ?? ?? ?? 48 8B 0D ?? ?? ?? ?? 48 8B 89';
    var results = Memory.scanSync(__e.base, __e.size, sig);
    if (results.length === 0) {
        console.error('[CraftsDescriptions] Hook not found!');
        return;
    }
    
    const address = results[0].address;
    console.log('[CraftsDescriptions] Found hook', address)

    let previous = ''

    Interceptor.attach(address, {onEnter (args) {
        var text
        text = this.context.rdx.readUtf8String()
        if(text !== previous){
            previous = text
            setTimeout(() => handler4(sanitizeText(text)), 100);
        }  
    }});
})();
