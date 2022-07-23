// ==UserScript==
// @name         STEINS;GATE
// @version      
// @author       [DC]
// @description  com.mages.steinsgate
// 
// ==/UserScript==
Java.perform(() => {
    const GameView = Java.use('com.mtrix.steinsgate.gameclass.GameView');
    GameView.messageDisplay.implementation = function (vector) {
        const m_stMess = this.m_pEngine.value.m_stMess.value;

        // this.m_pEngine.m_stMess.strName
        const name = m_stMess.strName.value;
        // this.m_pEngine.m_stMess.strMes
        const mess = m_stMess.strMes.value.replace(/%p/g, '');

        trans.send(name + '\r\n' + mess);

        this.messageDisplay(vector);
    };
});