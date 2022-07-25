// ==UserScript==
// @name         Livestream: Escape from Hotel Izanami
// @version      
// @author       Darkmans11
// @description  Steam
// * qureate, Orgesta Inc.
// * Unity (JIT)
//
// https://store.steampowered.com/app/1523400/Livestream_Escape_from_Hotel_Izanami/
// ==/UserScript==

const {
    setHook
} = require('./libMono.js');

const handlerChar = trans.send((s) => s, '200++');

//public void SetName(string name)
setHook('', 'Atup.MessageBoxOperator', 'SetName', -1, {
    onEnter: (args) => {
        console.log('onEnter: MessageBoxOperator.SetName');
        readString(args[1]);
    }
});

//public IEnumerator PlayMessage(bool is_read, string message, Func<Vector3> request_talker_pos, Action finish_open_window, Action finish_display_message)
setHook('', 'Atup.MessageBoxOperator', 'PlayMessage', -1, {
    onEnter: (args) => {
        console.log('onEnter: MessageBoxOperator.PlayMessage.message');
        readString(args[2]);
    }
});

//public void SetChat(string name, string message)
setHook('', 'Atup.MessageBoxOperator', 'SetChat', -1, {
    onEnter: (args) => {
        console.log('onEnter: MessageBoxOperator.SetChat.name');
        readString(args[1]);

        console.log('onEnter: MessageBoxOperator.SetChat.Message');
        readString(args[2]);
    }
});

function readString(address) {
    const s = address.readMonoString()

    if (s !== '') handlerChar(s + '\r\n');
}
// Replacer
trans.replace((s) => {
    return s
        .replace(/<.+?>|^\s+|\r?\n+$|@n|%co1|%coe|%hoe|%rbs|%rbe|%dot/g, '') // htmlTag | trimBeginSpace | trimEndNewLine
        ;
});