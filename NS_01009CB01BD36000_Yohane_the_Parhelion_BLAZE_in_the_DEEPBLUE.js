// ==UserScript==
// @name         [01009CB01BD36000] YOHANE THE PARHELION -BLAZE in the DEEPBLUE-
// @version      1.0.0
// @author       Tom (tomrock645)
// @description  Yuzu
// * Developer & publisher: INTI CREATES CO., LTD.
// * 
// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '50+');

setHook(
  {
    "1.0.0": {
      [0x8070197c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8070b16c - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x80719d08 - 0x80004000]: mainHandler.bind_(null, 0, "boards"), // First message
      [0x8071a164 - 0x80004000]: mainHandler.bind_(null, 0, "boards"), // Second message
      [0x8095fac4 - 0x80004000]: mainHandler.bind_(null, 0, "item description"), 
      [0x80662934 - 0x80004000]: mainHandler.bind_(null, 1, "menu dialogue"),
      [0x80983dd0 - 0x80004000]: mainHandler.bind_(null, 0, "shop quantity"),
      [0x80984740 - 0x80004000]: mainHandler.bind_(null, 0, "shop confirmation"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.warn("\nKnown issues:\n- The item description hook might print out an empty line after buying or creating an item.");
console.warn("\n- When consuming or creating an item the name doesn't get hooked, so I made it generic using \"[アイテム]\"\n");

let previousDescription = "";
function handler(regs, index, hookname) 
{
  console.warn("Hook: " + hookname);
  const address = regs[index].value;

  if(hookname === "text" || hookname === "name")
    processBinaryString(address, hookname);

  else
  {
    const reg = regs[index];
    let s = address.readUtf8String();
    
    if (hookname === "item description")
    {
      if (previousDescription === s)
      {
        // item description gets extracted again when leaving the shop, this prevents that and reset the variable in case it was the first item on the list,
        // which would otherwise not display the item's description next time we visit the shop.
        previousDescription = "";                     
        return;
      }

      previousDescription = s;
    }

    s = s
      .replace(/<[^>]+>/g, "")
      .replace(/^を\n/g, "[アイテム]を\n"); // Menu dialogue can't hook the name of an item, so this makes it generic

    return s;
  }
}

const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
let currentName = "";


function processBinaryString(address, hookname) 
{
  let s = '', c;

  while (c = address.readU8()) 
    {
    if (c >= 0x20) // Read printable characters 
      {  
        c = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
        s += c;
        address = address.add(encoder.encode(c).byteLength);
    }

    else
    {
      if (c === 0x0A) 
        s += "\n";
    
      address = address.add(1);
    }
  }

  if (hookname === "name") 
    {
      currentName = s.trim();
      return;
    }

  if (s) 
  {
    if (currentName) // Prepend the current name if it exists 
    {
      s = currentName + "\n" + s.trim();
    }

    s = s.replace(/<[^>]+>/g, "");

    trans.send(s);
  }
}



























// const gameVer = '1.0.0';

// const { setHook } = require('./libYuzu.js');

// const mainHandler = trans.send(handler, '200+');

// setHook(
//     {
//       "1.0.0": {
//         [0x8070197c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
//         [0x8070b16c - 0x80004000]: mainHandler.bind_(null, 0, "name"),
//       },
//     }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
//   );

//   let name = "";
//   function handler(regs, index, hookname)
//   {
//     // let nameAndText = "";
//     // const reg = regs[index];
//     // const address = reg.value;
//     // let s = address.readUtf8String();

//     // if(hookname === "name")
//     // {
//     //   name = s + "\n";
//     //   return;
//     // }

//     // nameAndText =  name + s
//     // .replace(/<[^>]+>/g, '')
//     // return nameAndText;






//     // const address = regs[index];
//     // let s = readString(address);
//     // return s;







//     const address = regs[index].value;

//     //console.log('onEnter');
//     //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

//     /*let s =*/ processBinaryString(address, hookname);

//     // s = s
//     //   .replace(/<[^>]+>/g, '')

//     // return s;
//   }

// const encoder = new TextEncoder('utf-8');
// const decoder = new TextDecoder('utf-8');
// let timerPreCheck = null, previousString = '', previousTime = 0;
// let currentName = "";

// function processBinaryString(address, hookname, condition) {
//     const _address = address;
//     let s = '', bottom = '', c;
//     while (c = address.readU8()) {
//         if (c >= 0x20) {  // readChar
//             c = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
//             s += c;
//             address = address.add(encoder.encode(c).byteLength);
//         }
//          else { // readControl
//             address = address.add(1);

//             // if (c == 1) { // ruby (01_text_02 03_ruby_04)
//             //     bottom = '';
//             //     while (true) {
//             //         c = decoder.decode(address.readByteArray(4))[0];
//             //         address = address.add(encoder.encode(c).byteLength);
//             //         if (c < '\u000a') break; // 0002
//             //         bottom += c;
//             //         s += c;
//             //     }
//             // }
//             // /*else*/ if (c == 3) {
//             //     let rubi = '';
//             //     while (true) {
//             //         c = decoder.decode(address.readByteArray(4))[0];
//             //         address = address.add(encoder.encode(c).byteLength);
//             //         if (c < '\u000a') break; // 0004
//             //         rubi += c;
//             //     }
//             //     //console.log('rubi: ', rubi);
//             //     //console.log('char: ', bottom);
//             // }
//             // /*else*/ if (c == 7) { // begin 07 30
//             //     address = address.add(1);
//             // }
//             // /*else*/ if (c == 0xa) { // delay
//             //     if (address.readU8() === 0) {
//             //         //console.log('Animating...');
//             //         return setTimeout(processBinaryString, 500, _address); // wait
//             //     }
//             // }
//             // /*else*/ if (c == 0xd) { // compress: 0d 03 c5 92 06
//             //     c = address.readU32();
//             //     const count = c & 0xFF;
//             //     c = c & 0xFFFFFF00;
//             //     if (c == 0x0692c500) {
//             //         s += '―'.repeat(count);
//             //         address = address.add(4);
//             //     }
//             // }
//             // else {
//             //     // do nothing
//             // }
//         }
//     }

//     if (hookname === "name") {
//       // Update current name and remove trailing/leading whitespace
//       currentName = s.trim();
//       //console.log("Updated name: ", currentName);
//       return;
//     }

//     if (s) {
//       // Prepend the current name if it exists
//       if (currentName) {
//         s = currentName + "\n" + s.trim();
//     }

//         // const fromHook = condition === undefined; // hook or delay
//         // if (fromHook) {
//         //     if (previousString === s) return //console.log('>' + s);
//         //     const currentTime = Date.now();
//         //     s = previousString = currentTime - previousTime < 300 ? previousString + '\n' + s : s; // join fast string (choise)
//         //     previousTime = currentTime;
//         // } else previousString = s;

//         trans.send(s);
//         //return s;

//         //detect missed chars
//         // if (fromHook) {
//         //     const blockSize = align(address.sub(_address).add(1).toInt32(), 4);
//         //     const oldBuf = _address.readByteArray(blockSize);
//         //     clearTimeout(timerPreCheck);
//         //     timerPreCheck = setTimeout(function () {
//         //         const newBuf = _address.readByteArray(blockSize);
//         //         if (!equal32(oldBuf, newBuf)) {
//         //             processBinaryString(_address, true);
//         //         }
//         //     }, 2250);
//         // }
//     }
// }

// // function align(value, alignment) { // 1 2 4 8 16
// //     return (value + (alignment - 1)) & ~(alignment - 1);
// // }

// // function equal32(a, b) {
// //     const ua = new Uint32Array(a, 0, a.byteLength / 4);
// //     const ub = new Uint32Array(b, 0, b.byteLength / 4);
// //     return compare(ua, ub);
// // }

// // function compare(a, b) {
// //     for (let i = a.length; -1 < i; i -= 1) {
// //         if ((a[i] !== b[i])) return false;
// //     }
// //     return true;
// // }