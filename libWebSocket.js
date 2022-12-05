const { WebSocket, WebSocketServer } = require('ws');
const { createServer } = require('http');
const { Readable } = require("node:stream");
const fs = require('fs');

if (Readable.fromWeb === undefined) {
    Readable.fromWeb = function (body) {
        const reader = body.getReader();
        const rs = new Readable();
        rs._read = async () => {
            const result = await reader.read();
            rs.push(result.done === true ? null : Buffer.from(result.value));
        };
        return rs;
    }
}

/** @type WebSocketServer */
var wss = null;
/** @type Server */
var server = null;
const headers = {
    'access-control-allow-origin': '*',
    'content-type': 'application/json; charset=UTF-8'
}

addEventListener('wssStart', function (e) {
    e.preventDefault();

    server = createServer(function (req, res) {
        const url = req.url;
        if (url === '/') {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            const stream = fs.createReadStream(__dirname + '/libOverlay.html');
            stream.on('error', () => res.end('Update scripts'));
            stream.pipe(res, { end: true });
            return;
        }
        else if (url.startsWith('/api/translate/') === true) {
            const index = url.indexOf('?', 15);
            const apiName = url.substring(15, index === -1 ? undefined : index);
            const translate = __nmtEngine[apiName];
            if (translate !== undefined) {
                const query = url.substring(15 + apiName.length);
                const params = new URLSearchParams(query);
                let sl, tl, s = params.get('s');
                if (params.get('r') !== null) {
                    sl = __vue.opt_nmtDst;
                    tl = __vue.opt_nmtSrc;
                }
                else {
                    sl = params.get('sl');
                    tl = params.get('tl');
                }
                if (req.method === 'POST') {
                    s = '';
                    req.on('data', data => s += data);
                    req.on('end', () => processRequest());
                }
                else {
                    processRequest();
                }

                function processRequest() {
                    const request = translate.createRequest(s, sl, tl);
                    return request.then(r => {
                        res.writeHead(r.status, headers);
                        Readable.fromWeb(r.body).pipe(res, { end: true });
                    }).catch(() => {
                        res.writeHead(500);
                        res.end();
                    });
                }
                return;
            }
            else if (apiName === '') {
                const query = url.substring(15);
                const params = new URLSearchParams(query);
                let s = params.get('s');
                let sl = tl = null;
                if (params.get('r') !== null) {
                    sl = __vue.opt_nmtDst;
                    tl = __vue.opt_nmtSrc;
                }
                if (req.method === 'POST') {
                    s = '';
                    req.on('data', data => s += data);
                    req.on('end', () => processRequest());
                }
                else {
                    processRequest();
                }
                function processRequest() {
                    __translate.translate(s, sl, tl).then(r => {
                        res.writeHead(200, headers);
                        res.write(r);
                    }).finally(() => {
                        res.end();
                    });
                }
                return;
            }
        }
        else if (url.startsWith('/api/position') === true) {
            return ipc.invoke('getCursorScreenPoint').then(p => {
                res.writeHead(200, headers);
                res.write(JSON.stringify(p));
            }).finally(() => {
                res.end();
            });
        }
        else if (url.startsWith('/api/ocr') === true) {
            return fetch('http://127.0.0.1:8001' + url).then(r => {
                res.writeHead(r.status, headers);
                Readable.fromWeb(r.body).pipe(res, { end: true });
            }).catch(() => {
                res.writeHead(500);
                res.end();
            });
        }
        else if (url.endsWith('/libOverlay.js') === true) {
            res.writeHead(200, { 'content-type': 'text/javascript; charset=UTF-8' });
            const stream = fs.createReadStream(__dirname + '/libOverlay.js');
            stream.on('error', () => res.end());
            stream.pipe(res, { end: true });
            return;
        }
        res.writeHead(404);
        res.end();
    });
    wss = new WebSocketServer({
        server,
        perMessageDeflate: false
    });

    wss.on('connection', function (ws) {
        ws.on('message', function (data) {
            const obj = JSON.parse(data);
            if (obj.type === 'translate') {
                const ori = obj.sentence;
                __translate.translate(ori)
                    .then(function (s) {
                        if (s !== ori) {
                            obj.sentence = s;
                            return ws.send(JSON.stringify(obj));
                        }
                        // try reverse
                        __translate.translate(ori, __vue.opt_nmtDst, __vue.opt_nmtSrc)
                            .then(function (s) {
                                if (s !== ori) {
                                    obj.sentence = s;
                                    return ws.send(JSON.stringify(obj));
                                }

                                __translate.translate(ori, 'auto', __vue.opt_nmtSrc)
                                    .then(function (s) {
                                        obj.sentence = s;
                                        return ws.send(JSON.stringify(obj));
                                    });
                            });
                    });
            }
        });
    });

    server.listen(9001, '127.0.0.1');
    addEventListener('copyText', broadcast);
    addEventListener('translate', broadcast);
});

addEventListener('wssStop', function (e) {
    e.preventDefault();

    removeEventListener('copyText', broadcast);
    removeEventListener('translate', broadcast);
    if (wss !== null) {
        wss.clients.forEach(client => client.close());
        wss.close();
        wss = null;
        server.close();
    };
});

/** @param {CustomEvent} e */
function broadcast(e) {
    const message = JSON.stringify({
        process_path: e.detail.target,
        id: e.detail.id,
        sentence: e.detail.text,
        type: e.type
    });

    wss.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}