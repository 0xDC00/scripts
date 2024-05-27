const { WebSocket, WebSocketServer } = require('ws');
const { createServer } = require('http');
const { Readable } = require("node:stream");
const fs = require('fs');

//// TODO: https://github.com/electron/electron/issues/37285
//if (Readable.fromWeb === undefined) {
Readable.fromWeb = function (body) {
    const reader = body.getReader();
    const rs = new Readable();
    rs._read = async () => {
        const result = await reader.read();
        rs.push(result.done === true ? null : Buffer.from(result.value));
    };
    return rs;
}
//}

if (globalThis.JSON5 === undefined) {
    const { runInNewContext } = require('vm');
    const sandbox = {};
    globalThis.JSON5 = {
        parse(s) {
            runInNewContext('_SAFE_EVAL_=' + s, sandbox);
            return sandbox._SAFE_EVAL_;
        }
    }
}
const _OCRURL = atob('aHR0cHM6Ly9sZW5zLmdvb2dsZS5jb20vdjMvdXBsb2FkP3N0Y3M9');
const _COOKIE = atob('U09DUz1DQUVTRXdnREVnazBPREUzTnprM01qUWFBbVZ1SUFFYUJnaUFfTHlhQmc=').split('=');
cookieStore.set({ url: _OCRURL.split('/v')[0], name: _COOKIE[0], value: _COOKIE[1], secure: true, httpOnly: true, sameSite: 'no_restriction' });

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
        if (url === '/' || url.startsWith('/?') === true) {
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
                    }).catch((e) => {
                        console.error(e.stack);
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
            // if (__vue.opt_ocr === 'ext') {
            //     return fetch('http://127.0.0.1:8001' + url).then(r => {
            //         res.writeHead(r.status, headers);
            //         Readable.fromWeb(r.body).pipe(res, { end: true });
            //     }).catch((e) => {
            //         console.error(e.stack);
            //         res.writeHead(500);
            //         res.end();
            //     });
            // }

            const params = new URL(url, 'http://0').searchParams;
            const x = parseInt(params.get('x'));
            const y = parseInt(params.get('y'));
            const w = parseInt(params.get('w'));
            const h = parseInt(params.get('h'));

            ipc.screenSnip(x, y, w, h).then(pngBytes => {
                const timestamp = Date.now().toString();
                const body = new FormData();
                body.append('encoded_image', new Blob([pngBytes], { type: 'image/png' }), 'text_' + timestamp + '.png');
                return fetch(_OCRURL + timestamp, {
                    method: 'POST',
                    body: body,
                    credentials: 'include',
                    timeout: 5000
                });
            }).then(r => {
                return r.text();
            }).then(v => {
                const regex = />AF_initDataCallback\(({key: 'ds:1'.*?)\);<\/script>/;
                const match = regex.exec(v);
                if (match === null) {
                    res.writeHead(200, headers);
                    res.write('{"text": "Regex error!"}');
                    return;
                }

                let result = '';
                const lensObj = JSON5.parse(match[1]);
                const text = lensObj.data[3][4][0];
                if (text.length !== 0) {
                    result = text[0].join('\r\n');
                }

                res.writeHead(200, headers);
                res.write('{"text":' + JSON.stringify(result) + '}');
            }).catch(e => {
                console.error(e.stack);
                res.writeHead(500);
            }).finally(() => {
                res.end();
            });
            return;
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

    wss.once('error', e => console.error(e.message));

    server.listen(e.detail.port, e.detail.host);
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