const { WebSocketServer } = require('ws');

/** @type WebSocketServer */
var wss = null;

addEventListener('wssStart', function (e) {
    wss = new WebSocketServer({
        host: '127.0.0.1',
        port: 9001
    });
    addEventListener('copyText', broadcast);
    //addEventListener('deepl', broadcast);
    e.preventDefault();
});

addEventListener('wssStop', function (e) {
    removeEventListener('copyText', broadcast);
    //removeEventListener('deepl', broadcast);
    wss !== null && wss.close();
    e.preventDefault();
});

/** @param {CustomEvent} e */
function broadcast(e) {
    const message = JSON.stringify({
        process_path: e.detail.target,
        id: e.detail.id,
        sentence: e.detail.text
    });

    wss.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}