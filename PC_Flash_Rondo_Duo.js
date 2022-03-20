// ==UserScript==
// @name         Rondo Duo -Yoake no Fortissimo- Punyu Puri ff
// @version      
// @author       [DC]
// @description  
// * TinkleBell
// * Adobe Flash
//
// https://vndb.org/v16266
// ==/UserScript==

const { setHook } = require('./libFlash.js');

const ptrSize = Process.pointerSize;
const mainHandler = trans.send(handler, '200+');

setHook({
    'AS.StoryObj.MsgWin::MsgArea/ShowMsg': mainHandler
});

function handler(args) {
    const argx = args[2]; // env, argc, args
    console.log('onEnter ShowMsg');
    const address = argx.add(ptrSize).readPointer(); // get args[0]; (this call?)

    const s = address.readFlashString();
    return s;
}

/* OR */

// const ptrSize = Process.pointerSize;
// const mainHandler = trans.send(s => s, '200+');

// setHook('AS.StoryObj.MsgWin::MsgArea/ShowMsg', function (args) {
//     const argx = args[2];
//     console.log('onEnter ShowMsg');

//     const address = argx.add(4).readPointer();
//     const s = address.readFlashString();

//     mainHandler(s);
// });