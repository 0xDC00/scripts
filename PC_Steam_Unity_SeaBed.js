// ==UserScript==
// @name         SeaBed
// @version
// @author       landon
// @description  Steam
// * Fruitbat Factory
// * Paleontology
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/583090/SeaBed/
// ==/UserScript==
const Mono = require('./libMono.js');
const handleLine = trans.send((s) => s, '250++');
// use 250+ if you want newlines for things like menus, but be aware that furigana styled text will have its own lines which may be annoying

//System.Void FruitbatVN.Engine.MessageLayer::AddText(System.String)
Mono.setHook('', 'FruitbatVN.Engine.MessageLayer', 'AddText', -1, {
    onEnter(args) {
        let line = args[1].readMonoString()
        if (line[0] == "　") {
            line = line.substring(1);
        }
        if (line.includes("<style")){
            line = "";
        }
        handleLine(line);
    }
});