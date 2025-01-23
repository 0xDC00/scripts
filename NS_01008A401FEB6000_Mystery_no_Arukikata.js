// ==UserScript==
// @name         [01008A401FEB6000] Mystery no Arukikata (ミステリーの歩き方)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu, Ryujinx
// * Toybox Inc.
// * Imagineer Co., Ltd. 
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");
const mainHandler = trans.send(handler1, "300+");
const subHandler = trans.send(handler2, "200+");

let text2Triggered = false;

setHook({
    "1.0.0": {
      [0x818703d4 - 0x80004000]: subHandler.bind_(null, 2, 0, "text1"),
      [0x8180d928 - 0x80004000]: mainHandler.bind_(null, 0, 0, "text2"),      
      [0x8180c1e8 - 0x80004000]: mainHandler.bind_(null, 0, 0, "choices"),
      // [0x8180d900 - 0x80004000]: mainHandler.bind_(null, 0, 0, "names"),
    },

  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler1(regs, index, offset, hookname) {
  const address = regs[index].value;
// console.log("onEnter: " + hookname);
   
  let s = address.add(0x14).readUtf16String(); 
      s = s.replace(/<color=.*>(.*)<\/color>/g, '$1')
           .replaceAll("%player", "赤沢独歩");   

  if (hookname === "text2") {
    text2Triggered = true;
    
    setTimeout(() => {
      text2Triggered = false;
    }, 200);
  }

  if (hookname === "text1" || hookname === "text2") {
    s = s.replace(/[\r\n]+/g, '');
  }

  return s;
}

function handler2(regs, index, offset, hookname) {
  const address = regs[index].value;
// console.log("onEnter: " + hookname);
  
  if (text2Triggered) {  
    return null; 
  }
  let s = address.add(0x14).readUtf16String();  
      s = s.replace(/<color=.*>(.*)<\/color>/g, '$1');
         

  if (hookname === "text1" || hookname === "text2") {
      s = s.replace(/[\r\n]+/g, '');
  }

  return s;
}
