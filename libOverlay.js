(function () {
    /** @type HTMLDivElement */
    var _layoutLocked; // visibility track
    /** @type HTMLDivElement */
    var _rootDiv;
    /** @type HTMLCanvasElement */
    var _canvas;
    /** @type CanvasRenderingContext2D */
    var _canvasCtxText;
    /** @type HTMLDivElement - (resizable.text-view + options) */
    var _divView;
    /** @type HTMLDivElement */
    var _divTextFlow;
    /** @type HTMLInputElement */
    var _divTextTran;
    /** @type HTMLDivElement */
    var _divRectOCR;
    /** @type HTMLDivElement */
    var _divOptions;
    var _options = {
        otpPinOverlay: false,
        otpUnlockShowDiscord: false,
        otpLockShowOverlay: false,
        otpBacklog: false,
        otpOriginalText: false,
        otpLeftRight: false,
        otpRectOCR: false,
        otpColorOriginal: '#ffc107',
        otpColorTranslated: '#adff2f',
        otpColorSize: 16
    };

    /** @type WebSocket */
    var _ws;

    setTimeout(main, 0);
    globalThis.__INJECT__ = main;

    function main() {
        if (globalThis.__OVERLAY__) {
            console.log('Inject');
        }
        const _app = document.getElementById('app-mount');
        const _overlay = _app.firstElementChild.childNodes[2]; // svg,svg,div
        const lockedOrBg = _overlay.firstElementChild;
        if (lockedOrBg === null)
            return setTimeout(main, 500);
        _layoutLocked = lockedOrBg.className.includes('layoutLocked') === true ? lockedOrBg : lockedOrBg.nextElementSibling;

        _rootDiv = document.getElementById('dcOverlay');
        if (_rootDiv != undefined)
            _rootDiv.remove();
        createOverlay(_overlay);
    }

    function createOverlay(_overlay) {
        _rootDiv = document.createElement('div');
        _rootDiv.id = "dcOverlay";
        _rootDiv.style.width = '100%';
        _rootDiv.style.height = '100%';
        _rootDiv.innerHTML = getViewHtml();
        _overlay.appendChild(_rootDiv);

        initCanvas();
        initView();
        initOptions();
        initObserver();
        initSocket();
        initXTranslate();
        refeshVisibility();
    }

    function initXTranslate() {
        const control = document.importNode(document.querySelector('template').content, true).childNodes[0];
        control.addEventListener('pointerdown', oncontroldown, true);

        const divDict = document.getElementById('divDict');
        let rect;
        document.addEventListener('pointerup', function (e) {
            const selection = document.getSelection();
            const s = selection.toString().trim();
            if (s === '') return;
            if (e.ctrlKey === true) document.execCommand('copy');

            rect = selection.getRangeAt(0).getBoundingClientRect();
            const { x, y } = e;
            if (rect.width === 0) {
                rect.x = x;
                rect.y = y - 12;
            }
            const isInside = rect.x <= x && x <= rect.x + rect.width
                && rect.y <= y && y <= rect.y + rect.height;
            if (isInside === true) {
                control.style.top = e.y - 40 + 'px';
                control.style.left = e.x - 12 + 'px';
            }
            else {
                control.style.top = e.y - 27 + 'px';
                control.style.left = e.x - 12 + 'px';
            }
            const reverse = selection.baseNode.parentElement.previousElementSibling !== null;
            control['text'] = s;
            control['r'] = reverse;
            document.body.appendChild(control);

            control.querySelector('#google').addEventListener('pointerdown', onGoogleDown, true);
        });
        document.addEventListener('pointerdown', function (e) {
            const control = document.querySelector('#control');
            if (control !== null) {
                control.remove();
                if (e.shiftKey !== true)
                    document.getSelection().removeAllRanges();
            }
            divDict.style.display = 'none';
        });
        divDict.addEventListener('pointerdown', function (e) {
            e.stopImmediatePropagation();
        });

        function oncontroldown(e) {
            if (e.button !== 0) return;
            document.getSelection().removeAllRanges();
            this.remove();
        }

        function onGoogleDown(e) {
            e.stopPropagation();
            showDictGoogle(this.parentNode.text, this.parentNode.r);
        }

        function showDictGoogle(s, r) {
            let url = '/api/translate/Google?s=' + encodeURI(s);
            if (r === true) url += '&r=1'; // reverse translate
            fetch(url)
                .then(r => r.json())
                .then(r => {
                    divDict.innerHTML = '';
                    const text = r.sentences.map(x => x.trans).join(' ');
                    const dict = r.dict;

                    // translated text
                    const divTarget = document.createElement('div');
                    divTarget.innerText = text;
                    divTarget.setAttribute('data-tooltip', s);
                    divTarget.style.fontSize = '1.25em';
                    divDict.appendChild(divTarget);

                    // dict...
                    if (dict) {
                        try {
                            for (const item of dict) {
                                const divItem = document.createElement('div');
                                divItem.style.marginTop = '0.1em';

                                const divItemTitle = document.createElement('div');
                                divItemTitle.style.fontWeight = 'bold';
                                divItemTitle.innerText = item.pos;

                                const divItemBody = document.createElement('div');
                                for (const entry of item.entry) {
                                    const word = entry.word;
                                    const recv = entry.reverse_translation.join(', ');
                                    const span = document.createElement('span');
                                    span.innerText = word;
                                    //span.title = recv;
                                    span.setAttribute('data-tooltip', recv);
                                    span.style.backgroundColor = '#eeeeee';
                                    span.className = "dict-item";
                                    divItemBody.appendChild(span);
                                    divItemBody.append(', ');

                                }
                                divItemBody.lastChild.remove();

                                divItem.appendChild(divItemTitle);
                                divItem.appendChild(divItemBody);
                                divDict.appendChild(divItem);
                            }
                        }
                        catch (e) { console.error(e, dict) }
                    }

                    divDict.style.top = parseInt(rect.top + 27) + 'px';
                    divDict.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 12px)`;
                    divDict.style.display = 'inherit';
                });
        }
    }

    function initView() {
        _divView = _canvas.nextElementSibling;
        makeResizableDiv('.resizable');

        /** @type HTMLDivElement */
        const myResizableDiv = _divView.firstElementChild.nextElementSibling; // div > style > div
        _divTextFlow = myResizableDiv.firstElementChild.firstElementChild.firstElementChild;
        _divTextTran = myResizableDiv.firstElementChild.firstElementChild.lastElementChild.firstElementChild;
        _divTextTran.addEventListener("keyup", function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                const s = _divTextTran.value.trim();
                _divTextTran.value = '';
                if (s === '') return;

                addTextItem(s); // TODO: GPT
            }
            else if (e.key === 'Escape') {
                _divTextTran.value = '';
            }
        });

        if (__EXTERNAL__ === false) return;

        const ipc = require('electron').ipcRenderer;
        let enableInput = false;
        _divTextTran.addEventListener('focus', (e) => {
            // ignore focus from focusOnWebView();
            if (e.sourceCapabilities === null) {
                enableInput = false;
                _divTextTran.blur();
                // focus->focusout
            }
            else {
                enableInput = true;
            }
        });
        _divTextTran.addEventListener('focusin', () => {
            if (enableInput === true) {
                _canvas.onmousemove = () => { };
                ipc.sendSync('enableInput', true);

            }
        });
        _divTextTran.addEventListener('focusout', () => {
            if (enableInput === true) {
                _canvas.onmousemove = null;
                ipc.send('enableInput', false);
            }
        });
    }

    function initSocket() {
        _ws = new WebSocket("ws://" + document.location.host);
        _ws.onmessage = wsOnMessage;
        _ws.onclose = () => setTimeout(initSocket, 3000);
    }

    /** @param {MessageEvent} ev */
    function wsOnMessage(ev) {
        const data = JSON.parse(ev.data);
        const scroll = _divTextFlow.offsetHeight + _divTextFlow.scrollTop >= _divTextFlow.scrollHeight;
        if (data.type === 'copyText') {
            const val = createTextItem(data.id, data.sentence);
            _divTextFlow.appendChild(val[0]);
        }
        else if (data.type === 'translate') {
            setTextItemTranslate(data);
        }
        if (scroll === true) flowScroll();
    }

    function initCanvas() {
        /** @type {HTMLButtonElement} */
        _divRectOCR = document.getElementById('divRectOCR');
        const btnManualOCR = document.getElementById('btnManualOCR');
        btnManualOCR.onclick = function () {
            this.disabled = true;
            const rect = _divRectOCR.getBoundingClientRect();
            OCR(rect.x, rect.y, rect.width, rect.height, 'one', rect.x, rect.y)
                .finally(() => this.disabled = false);
        };

        _canvas = _rootDiv.firstElementChild;
        _canvas.width = _rootDiv.clientWidth;
        _canvas.height = _rootDiv.clientHeight;
        globalThis.__CANVAS__ = _canvas;
        _canvasCtxText = _canvas.getContext("2d");
        if (!globalThis.__OVERLAY__) return;

        const ctx1 = _canvasCtxText;
        var x = 0, y = 0, w = 0, h = 0;
        var cx, cy;

        function render(e) {
            ctx1.clearRect(0, 0, _canvas.width, _canvas.height);
            w = e.clientX - x;
            h = e.clientY - y;
            if (e.buttons === 0) {
                showWidgets();
                return;
            }

            ctx1.beginPath();
            ctx1.rect(x, y, w, h);
            ctx1.stroke();
        }

        function action(e) {
            if (e.buttons !== 0) return;
            if (_canvas.onmousemove === null) return;
            _canvas.onmousemove = _canvas.ontouchmove = null;
            _canvas.onmouseup = _canvas.ontouchend = null;

            ctx1.clearRect(0, 0, _canvas.width, _canvas.height);
            if (e.button === 2) {
                showWidgets();
                return;
            }

            const mode = e.altKey ? 'lines' : (e.shiftKey ? 'snip' : (e.ctrlKey ? 'lines' : 'one'));

            if (mode === 'full') {
                x = 0; y = 0;
                cx = 0; cy = 0;
                w = _canvas.width;
                h = _canvas.height;
            }
            else {
                if (w < 0) {
                    cx += w;
                    x += w;
                    w = -w;
                }
                if (h < 0) {
                    cx += h;
                    y += h;
                    h = -h;
                }
                if ((w < 20 || h < 20)) {
                    showWidgets();
                    return;
                }

                if (mode === 'snip') {
                    showWidgets();
                    return;
                }
            }
            requestAnimationFrame(() => {
                OCR(x, y, w, h, mode, cx, cy)
                    .finally(() => {
                        showWidgets();
                    });
            });
        };

        function renderT(e) {
            render(e.touches[0]);
        }

        function actionT(e) {
            const t = e.changedTouches[0];
            t.buttons = 0;
            action(t);
        }

        function startDrag() {
            _canvas.onmousemove = render;
            _canvas.onmouseup = action;
            _canvas.ontouchmove = renderT;
            _canvas.ontouchend = actionT;
            hideWidgets();
        }

        _canvas.onmousedown = _canvas.ontouchstart = function (e) {
            if (_canvas.onmousemove !== null) return;
            if (e.touches) {
                const t = e.touches[0];
                t.ctrlKey = e.ctrlKey;
                t.button = e.touches.length !== 1 ? 2 : 0;
                e = t;
            }
            if (e.button === 2) {
                ctx1.clearRect(0, 0, _canvas.width, _canvas.height);
                return;
            }
            ctx1.strokeStyle = "#00ff00";
            w = 0;
            h = 0;
            x = e.clientX;
            y = e.clientY;
            // Overlay offscreen renderring, e.screenX, e.screenY is 0
            // we force full screen mode frist
            cx = x;
            cy = y;

            if (globalThis.__EXTERNAL__ === true) {
                startDrag();
                return;
            }

            // the try to get the current mouse position
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 250)
            fetch('/api/position', { signal: controller.signal })
                .then(r => r.json())
                .then(z => {
                    x = z.x;
                    y = z.y;
                }).finally(startDrag);
        };
    }

    // overlay <-> agent <-> ocr
    function OCR(x, y, w, h, mode, cx, cy) {
        return fetch('/api/ocr?mode=' + mode +
            '&x=' + x +
            '&y=' + y +
            '&w=' + w +
            '&h=' + h +
            '&cx=' + cx +
            '&cy=' + cy
        )
            .then(r => r.json())
            .then(z => {
                const s = z.text;
                if (s === '') return;

                addTextItem(s);
            }).catch((e) => {
                addTextLog('[Error] ocr-server:\n' + e.stack);
            });
    }

    function addTextLog(s) {
        const val = createTextItem(Date.now(), s);
        _divTextFlow.appendChild(val[0]);
        flowScroll();
    }

    function addTextItem(s) {
        const scroll = _divTextFlow.offsetHeight + _divTextFlow.scrollTop >= _divTextFlow.scrollHeight;
        const id = Date.now();
        const val = createTextItem(id, s, '');
        _divTextFlow.appendChild(val[0]);

        fetch('/api/translate/?s=' + encodeURI(s))
            .then(r => r.text())
            .then(t => {
                val[2].innerText = t;
            }).finally(() => {
                if (scroll === true) flowScroll();
            });
    }

    function setTextItemTranslate(data) {
        const val = findTextItem(data.id);
        if (val[2] === null) {
            const tran = document.createElement('p');
            val[2] = tran;
            val[0].appendChild(tran);
        }

        val[2].innerText = data.sentence;
    }

    function findTextItem(id) {
        const item = document.getElementById('text-item-' + id);
        if (item === null) return null;
        const orig = item.firstElementChild;
        const trans = orig.nextElementSibling;

        return [item, orig, trans];
    }

    function createTextItem(id, txtOri, txtTran) {
        const item = document.createElement('div');
        const orig = document.createElement('p');
        if (txtOri !== undefined) {
            orig.innerText = txtOri;
        }
        item.id = 'text-item-' + id;
        item.className = 'text-item';
        item.appendChild(orig);

        let tran = null;
        if (txtTran !== undefined) {
            tran = document.createElement('p');
            tran.innerText = txtTran;
            item.appendChild(tran);
        }

        return [item, orig, tran];
    }

    function initOptions() {
        /** @type HTMLInputElement */
        const inputPinOverlay = document.getElementById('otpPinOverlay');
        /** @type HTMLInputElement */
        const inputShowDiscordLock = document.getElementById('otpUnlockShowDiscord');
        /** @type HTMLInputElement */
        const inputShowOverlayLock = document.getElementById('otpLockShowOverlay');
        /** @type HTMLInputElement */
        const inputBacklog = document.getElementById('otpBacklog');
        /** @type HTMLInputElement */
        const inputLeftRight = document.getElementById('otpLeftRight');
        /** @type HTMLInputElement */
        const inputOriginalText = document.getElementById('otpOriginalText');
        /** @type HTMLInputElement */
        const inputOCRBox = document.getElementById('otpRectOCR');
        _divOptions = inputBacklog.parentElement.parentElement;

        let timer;
        function saveOptions() {
            clearTimeout(timer);
            timer = setTimeout(() => {
                localStorage.setItem('options', JSON.stringify(_options));
            }, 100);
        }

        const inputColorOriginal = document.getElementById('inputColorOriginal');
        const inputColorTranslated = document.getElementById('inputColorTranslated');
        const btnFontSizeSub = document.getElementById('btnFontSizeSub');
        const btnFontSizeIns = document.getElementById('btnFontSizeIns');

        const _textView = document.querySelector('.resizable.text-view');
        inputColorOriginal.parentElement.onclick = () => inputColorOriginal.click();
        inputColorTranslated.parentElement.onclick = () => inputColorTranslated.click();
        btnFontSizeSub.onclick = () => {
            _options.otpColorSize--;
            _textView.style.setProperty('--text-view-font-size', _options.otpColorSize + 'px');
            saveOptions();
        }
        btnFontSizeIns.onclick = () => {
            _options.otpColorSize++;
            _textView.style.setProperty('--text-view-font-size', _options.otpColorSize + 'px');
            saveOptions();
            flowScroll();
        }
        inputColorOriginal.oninput = () => {
            const color = inputColorOriginal.value;
            _options.otpColorOriginal = color;
            _textView.style.setProperty('--text-view-original-color', color);
            saveOptions();
        }
        inputColorTranslated.oninput = () => {
            const color = inputColorTranslated.value;
            _options.otpColorTranslated = color;
            _textView.style.setProperty('--text-view-translate-color', color);
            saveOptions();
        }
        document.getElementById('btnFontReset').onclick = () => {
            _textView.style.setProperty('--text-view-font-size', '16px');
            _textView.style.setProperty('--text-view-original-color', '#ffc107');
            _textView.style.setProperty('--text-view-translate-color', '#adff2f');
            _options.otpColorSize = 16;
            inputColorOriginal.value = _options.otpColorOriginal = '#ffc107';
            inputColorTranslated.value = _options.otpColorTranslated = '#adff2f';
            saveOptions();
        }

        /** @param {MouseEvent} e */
        function onClick(e) {
            const target = e.target.getElementsByTagName('input')[0];
            if (target === undefined) return;
            const checked = !target.checked;
            target.checked = checked;
            _options[target.id] = checked;
            saveOptions();
            refeshVisibility();
            flowScroll();
        }
        inputShowDiscordLock.parentElement.onclick = onClick;
        inputShowOverlayLock.parentElement.onclick = onClick;
        inputBacklog.parentElement.onclick = onClick;
        inputOriginalText.parentElement.onclick = onClick;
        inputLeftRight.parentElement.onclick = onClick;
        inputOCRBox.parentElement.onclick = onClick;

        let setLockClickThrough;
        if (globalThis.__EXTERNAL__ === true) {
            inputShowDiscordLock.parentElement.style.display = 'none';

            const ipc = require('electron').ipcRenderer;
            setLockClickThrough = v => ipc.sendSync('setLockClickThrough', v);
        }
        else {
            // TODO: 
            inputPinOverlay.parentElement.style.display = 'none';
            setLockClickThrough = v => false;
        }

        inputPinOverlay.parentElement.onclick = () => {
            const target = inputPinOverlay;
            const checked = !target.checked;
            _options.otpPinOverlay = target.checked = setLockClickThrough(checked);
            saveOptions();
        }

        const cb = document.getElementById('cbShowRectOCR');
        cb.parentElement.onclick = () => {
            //cb.checked = !cb.checked; // 3 state
            if (cb.readOnly) {
                cb.checked = cb.readOnly = cb.indeterminate = false;
                _divRectOCR.firstElementChild.style.visibility = 'hidden';
            }
            else if (!cb.checked) {
                cb.readOnly = cb.indeterminate = true;
                _divRectOCR.firstElementChild.style.visibility = '';
            }
        }

        // default value
        cb.readOnly = cb.indeterminate = true;
        const options = localStorage.getItem('options');
        if (options === null) {
            _options.otpPinOverlay = true;
            inputPinOverlay.checked = true;

            _options.otpLockShowOverlay = true;
            inputShowOverlayLock.checked = true;

            _options.otpOriginalText = true;
            inputOriginalText.checked = true;

            _options.otpRectOCR = true;
            inputOCRBox.checked = true;
            _options.otpPinOverlay = inputPinOverlay.checked = setLockClickThrough(true);
        }
        else {
            _options = JSON.parse(options);

            inputPinOverlay.checked = _options.otpPinOverlay = setLockClickThrough(_options.otpPinOverlay !== true ? false : true);
            inputShowDiscordLock.checked = _options.otpUnlockShowDiscord;
            inputShowOverlayLock.checked = _options.otpLockShowOverlay;
            inputOriginalText.checked = _options.otpColorOriginal;
            inputBacklog.checked = _options.otpBacklog;
            inputLeftRight.checked = _options.otpLeftRight;

            inputColorOriginal.value = _options.otpColorOriginal;
            inputColorTranslated.value = _options.otpColorTranslated;
            _textView.style.setProperty('--text-view-font-size', _options.otpColorSize + 'px');
            _textView.style.setProperty('--text-view-original-color', _options.otpColorOriginal);
            _textView.style.setProperty('--text-view-translate-color', _options.otpColorTranslated);

            inputOCRBox.checked = _options.otpRectOCR;
        }
    }

    function hideWidgets() {
        if (_layoutLocked.isConnected === false) {
            // TODO: lost root => try reload
            return __INJECT__();
        }
        _divOptions.style.visibility = 'hidden';
        _divView.style.visibility = 'hidden';
        _layoutLocked.style.visibility = 'hidden';
        _layoutLocked.previousElementSibling.style.visibility = 'hidden';
    }

    function showWidgets() {
        _divOptions.style.visibility = 'visible';
        _divView.style.visibility = 'visible';
        _layoutLocked.style.visibility = 'visible';
        _layoutLocked.previousElementSibling.style.visibility = 'visible';
        refeshVisibility();
    }

    function refeshVisibility() {
        const isUnlock = _layoutLocked.className.includes('layoutUnlocked');
        const visibility = isUnlock === true ? 'visible' : 'hidden';

        _divOptions.style.visibility = visibility;
        if (isUnlock === true) {
            _layoutLocked.style.visibility = _options.otpUnlockShowDiscord ? 'visible' : 'hidden';
            _divView.style.visibility = 'visible';
            _divTextFlow.parentElement.classList.remove('locked');
            _divTextFlow.style.overflowY = 'auto';

            if (_options.otpBacklog === true) {
                _divTextTran.parentElement.style.display = null;
                _divTextTran.focus();
            }

            if (_options.otpPinOverlay === true) {
                _canvas.style.pointerEvents = '';
                _layoutLocked.previousElementSibling.style.backgroundColor = 'rgb(0 0 0 / 1%)';
            }
        }
        else {
            if (globalThis.__EXTERNAL__ !== true)
                _layoutLocked.style.visibility = 'visible';
            _divView.style.visibility = _options.otpLockShowOverlay ? 'visible' : 'hidden';
            _divTextFlow.parentElement.classList.add('locked');
            _divTextFlow.style.overflowY = 'hidden';
            _divTextFlow.focus();
            _divTextTran.parentElement.style.display = 'none';
            _canvasCtxText.clearRect(0, 0, _canvas.width, _canvas.height);

            if (_options.otpPinOverlay === true) {
                _canvas.style.pointerEvents = 'none';
                _layoutLocked.previousElementSibling.style.backgroundColor = 'rgb(0 0 0 / 0%)';

                _layoutLocked.parentElement.style.pointerEvents = 'auto';
                _divTextFlow.style.overflowY = 'auto';
                if (_options.otpBacklog === true) {
                    _divTextFlow.parentElement.classList.remove('locked');

                    _divTextTran.parentElement.style.display = null;
                }
            }
        }

        if (_options.otpOriginalText === true) {
            _divTextFlow.classList.remove('translated-only');
        } else {
            _divTextFlow.classList.add('translated-only');
        }

        if (_options.otpBacklog === true) {
            _divTextFlow.classList.remove('single');
            flowScroll();
        }
        else {
            _divTextFlow.classList.add('single');
            _divTextTran.parentElement.style.display = 'none';
        }

        if (_options.otpLeftRight === true) {
            _divTextFlow.classList.add('left-right');
            flowScroll();
        }
        else {
            _divTextFlow.classList.remove('left-right');
        }

        if (_options.otpRectOCR === true) {
            _divRectOCR.style.display = '';
        } else {
            _divRectOCR.style.display = 'none';
        }
    }

    function flowScroll() {
        _divTextFlow.scrollTop = _divTextFlow.scrollHeight;
    }

    function refeshSize() {
        if (_rootDiv.clientWidth !== _canvas.width
            || _rootDiv.clientHeight !== _canvas.height) {
            _canvas.width = _rootDiv.clientWidth;
            _canvas.height = _rootDiv.clientHeight;
            //console.log('resize', _canvas.width, _canvas.height);
        }
    }

    function initObserver() {
        if (globalThis.__OBSERVER__) __OBSERVER__.disconnect();
        const observer = new MutationObserver(function (mutationList, observer) {
            const mutation = mutationList[0];
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'class') {
                    refeshVisibility();
                }
                else if (mutation.attributeName === 'style') {
                    refeshSize();
                }
            }
        });
        observer.observe(_layoutLocked, { attributes: true });
        globalThis.__OBSERVER__ = observer;
    }
})();

function makeResizableDiv(selectors) {
    const elements = document.querySelectorAll(selectors);
    for (let i = 0; i < elements.length; i++) {
        _makeResizableDiv(elements[i]);
    }
}

function _makeResizableDiv(element) {
    function pin() {
        const target = element;
        const sw = document.body.clientWidth;
        const sh = document.body.clientHeight;
        let { x, y, width, height } = target.getBoundingClientRect();

        const overflowX = (x + width) - sw;
        if (overflowX > 0) {
            x -= parseInt(overflowX / 2);
        }
        const overflowY = (y + height) - sh;
        if (overflowY > 0) {
            y -= parseInt(overflowY / 2);
        }
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        const ry = sh - (y + height);
        const rx = sw - (x + width);
        const isTop = ry > y;
        const isLeft = rx > x;

        if (isTop === true) {
            target.style.top = y + 'px';
            target.style.bottom = null;
        }
        else {
            target.style.top = null;
            target.style.bottom = ry + 'px';
        }
        if (isLeft === true) {
            target.style.left = x + 'px';
            target.style.right = null;
        }
        else {
            target.style.right = rx + 'px';
            target.style.left = null;
        }
    }

    //const resizers = document.querySelectorAll(div + ' .resizer')
    const resizers = element.querySelectorAll('.resizer')
    const minimum_size = 50;
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;
    for (let i = 0; i < resizers.length; i++) {
        const currentResizer = resizers[i];
        currentResizer.addEventListener('mousedown', startResize);
        currentResizer.addEventListener('touchstart', startResize, { passive: true });

        function startResize(e) {
            if (e.touches) {
                const t = e.touches[0];
                t.ctrlKey = e.ctrlKey;
                t.button = e.touches.length !== 1 ? 2 : 0;
                e = t;
            }
            else {
                e.preventDefault();
            }
            if (e.ctrlKey === true || e.button === 2) {
                const target = element;
                const rect = target.getBoundingClientRect();
                const shiftX = e.clientX - rect.left;
                const shiftY = e.clientY - rect.top;
                moveAt(e.pageX, e.pageY);

                function moveAt(pageX, pageY) {
                    target.style.left = pageX - shiftX + 'px';
                    target.style.top = pageY - shiftY + 'px';
                }

                function onMouseMove(e) {
                    moveAt(e.pageX, e.pageY);
                }

                function onTouchMove(e) {
                    moveAt(e.touches[0].pageX, e.touches[0].pageY);
                }

                function onMouseUp(e) {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    window.removeEventListener('touchmove', onTouchMove);
                    window.removeEventListener('touchend', onMouseUp);
                    pin();
                }

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
                window.addEventListener('touchmove', onTouchMove);
                window.addEventListener('touchend', onMouseUp);
                return;
            }

            const eStyle = getComputedStyle(element, null);
            const eRect = element.getBoundingClientRect();
            original_width = parseFloat(eStyle.getPropertyValue('width').replace('px', ''));
            original_height = parseFloat(eStyle.getPropertyValue('height').replace('px', ''));
            original_x = eRect.left;
            original_y = eRect.top;
            original_mouse_x = e.pageX;
            original_mouse_y = e.pageY;

            element.style.left = original_x + 'px';
            element.style.top = original_y + 'px';
            element.style.right = null;
            element.style.bottom = null;

            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
            window.addEventListener('touchmove', resizeT);
            window.addEventListener('touchend', stopResize);
        }

        function stopResize() {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
            window.removeEventListener('touchmove', resizeT);
            window.removeEventListener('touchend', stopResize);
            pin();
        }

        function resizeT(e) {
            resize(e.touches[0]);
        }

        function resize(e) {
            const classList = currentResizer.classList;
            if (classList.contains('left')) {
                const width = original_width - (e.pageX - original_mouse_x);
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                }
            }
            else if (classList.contains('right')) {
                const width = original_width + (e.pageX - original_mouse_x);
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                }
            }
            else if (classList.contains('top')) {
                const height = original_height - (e.pageY - original_mouse_y);
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                }
            }
            else if (classList.contains('bottom')) {
                const height = original_height + (e.pageY - original_mouse_y);
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                }
            }
            else if (classList.contains('bottom-right')) {
                const width = original_width + (e.pageX - original_mouse_x);
                const height = original_height + (e.pageY - original_mouse_y);
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                }
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                }
            }
            else if (classList.contains('bottom-left')) {
                const height = original_height + (e.pageY - original_mouse_y);
                const width = original_width - (e.pageX - original_mouse_x);
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                }
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                }
            }
            else if (classList.contains('top-right')) {
                const width = original_width + (e.pageX - original_mouse_x);
                const height = original_height - (e.pageY - original_mouse_y);
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                }
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                }
            }
            else {
                const width = original_width - (e.pageX - original_mouse_x);
                const height = original_height - (e.pageY - original_mouse_y);
                if (width > minimum_size) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                }
                if (height > minimum_size) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                }
            }
        }
    }
}

function getViewHtml() {
    return /*html*/`
<canvas style="position: absolute;"></canvas>
<div style="width: 100%; height: 100%;">
    <style>
    .resizable {
        position: absolute;
        width: 530px;
        height: 180px;
    }
    .resizable .resizers {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
    }
    .resizable .resizers .resizer {
        width: 12px;
        height: 12px;
        position: absolute;
    }
    .resizable .resizers .resizer.left {
        left: -2px;
        top: 0px;
        cursor: ew-resize;
        height: 100%;
        width: 6px;
    }
    .resizable .resizers .resizer.right {
        right: -2px;
        top: 0px;
        cursor: ew-resize;
        height: 100%;
        width: 6px;
    }
    .resizable .resizers .resizer.top {
        left: 0px;
        top: -2px;
        cursor: ns-resize;
        height: 6px;
        width: 100%;
    }
    .resizable .resizers .resizer.bottom {
        left: 0px;
        bottom: -2px;
        cursor: ns-resize;
        height: 6px;
        width: 100%;
    }
    .resizable .resizers .resizer.top-left {
        left: -2px;
        top: -2px;
        cursor: nwse-resize;
    }
    .resizable .resizers .resizer.top-right {
        right: -2px;
        top: -2px;
        cursor: nesw-resize;
    }
    .resizable .resizers .resizer.bottom-left {
        left: -2px;
        bottom: -2px;
        cursor: nesw-resize;
    }
    .resizable .resizers .resizer.bottom-right {
        right: -2px;
        bottom: -2px;
        cursor: nwse-resize;
    }

    /* Text-view style */
    .resizable.text-view {
        --text-view-background-color: #00000096;
        --text-view-original-color: #ffc107;
        --text-view-translate-color: #adff2f;
        --text-view-font-size: 16px;
        --text-view-font-family: "gg sans","Noto Sans","Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;

        overflow: hidden;
        user-select: text;
        line-height: normal;
        background-color: var(--text-view-background-color);
        color: var(--text-view-translate-color);
        font-size: var(--text-view-font-size);
        font-family: var(--text-view-font-family);
    }
    .resizable.text-view .resizers .text-flow {
        width: 100%;
        /*height: calc(100% - 1.4em);  1.75 em*/
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        /*justify-content: flex-end;  breaks scrolling */
    }
    .resizable.text-view p {
        margin: 0;
    }

    /* original style */
    .resizable.text-view .resizers .text-flow .text-item > :first-child {
        color: var(--text-view-original-color);
    }

    /* multiple view; bottom up */
    .resizable.text-view .resizers .text-flow > :first-child {
        margin-top: auto;
    }
    /* last text item style: bigger?
    .resizable.text-view .resizers .text-flow > :last-child {
        font-size: 1.25em;
    } */

    /* single view + hide input */
    .resizable.text-view .resizers .text-flow.single,
    .resizable.text-view .resizers .locked .text-flow {
        height: 100%;
    }
    .resizable.text-view .resizers .text-flow.single > :not(:last-child) {
        display: none;
    }
    .resizable.text-view .resizers .text-flow.single > :last-child {
        /*margin-top: auto;*/
        background-color: inherit;
        border-bottom: none;
    }

    .resizable.text-view .resizers .text-flow .text-item {
        padding: 4px;
        border-bottom: 1px solid #80808040;
    }

    /* row mode (left-right) */
    .resizable.text-view .resizers .text-flow.left-right:not(.single):not(.translated-only) .text-item,
    .resizable.text-view .resizers .text-flow.single.left-right:not(.translated-only) > :last-child {
        display: flex;
        flex-direction: row;
    }
    .resizable.text-view .resizers .text-flow.left-right:not(.single):not(.translated-only) .text-item > p,
    .resizable.text-view .resizers .text-flow.single.left-right:not(.translated-only) > :last-child > p {
        width: 50%;
    }

    /* translated view */
    .resizable.text-view .resizers .text-flow.translated-only .text-item > :not(:last-child) {
        display: none;
    }
    .resizable.text-view .resizers .text-flow.translated-only .text-item > :first-child {
        visibility: hidden;
        animation: 0s linear 1s forwards delayedShow;
    }
    @keyframes delayedShow {
        to {
            visibility: visible;
        }
    }

    /* scrollbar  */
    .resizable.text-view .resizers .text-flow::-webkit-scrollbar {
        width: 12px;
    }
    .resizable.text-view .resizers .text-flow::-webkit-scrollbar-track {
        background-color: #3c3d46;
    }
    .resizable.text-view .resizers .text-flow::-webkit-scrollbar-thumb {
        background-color: #5c5d66;
        border-radius: 5px;
    }
    .resizable.text-view .resizers .text-flow::-webkit-scrollbar-thumb:hover {
        background-color: #5c5d66;
    }

    /* options  */
    .options > div:hover {
        background-color: gray;
    }
    .options input {
        pointer-events: none;
    }
    </style>
    <!-- text-view -->
    <div class='resizable text-view' style="z-index: 999; bottom: 50px; left: 250px; border-radius: 5px;">
        <div class='resizers'>
            <div style='height: 100%; display: flex; flex-direction: column; justify-content: flex-end;'>
                <div class='text-flow single'>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p></div>
                    <div class="text-item"><p>Agent Overlay</p><p>Agent Overlay</p></div>
                </div>
                <div style="width: 100%;">
                    <input type="text" spellcheck="false" tabindex="-1" style="width: 100%;outline: none;background: #202126; border: 0; padding-left: 0.6em; color: #a3a3aa; height: 1.75em;">
                </div>
            </div>
            <div class='resizer left'></div>
            <div class='resizer right'></div>
            <div class='resizer top'></div>
            <div class='resizer bottom'></div>
            <div class='resizer top-left'></div>
            <div class='resizer top-right'></div>
            <div class='resizer bottom-left'></div>
            <div class='resizer bottom-right'></div>
        </div>
    </div>
    <!-- options -->
    <div class="options" style="position: absolute; bottom: 4em; padding: 0.25em; color: white; background: #2f3135ab; user-select: none;">
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpPinOverlay"> Pin Overlay
        </div>
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpUnlockShowDiscord"> [Unlock] Show Discord
        </div>
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpLockShowOverlay"> [Lock] Show Overlay
        </div>
        <hr>
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpOriginalText"> Show original text
        </div>
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpBacklog"> Backlog mode
        </div>
        <div style="cursor: pointer; margin-bottom: 4px">
            <input type="checkbox" id="otpLeftRight"> Left-Right
        </div>
        <hr>
        <div style="cursor: pointer; margin-bottom: 4px">
            <input id="inputColorOriginal" type="color" value="#ffc107" style="cursor: pointer; pointer-events: auto"> Original
        </div>
        <div style="cursor: pointer; margin-bottom: 4px">
            <input id="inputColorTranslated" type="color" value="#adff2f" style="cursor: pointer; pointer-events: auto"> Translated
        </div>
        <div style="margin-bottom: 4px">
            <button id="btnFontSizeSub" style="width: 50px; cursor: pointer;">-</button> Font size
            <button id="btnFontSizeIns" style="width: 50px; cursor: pointer; margin-right: 6px;">+</button>
        </div>
        <div>
            <button id="btnFontReset" style="width: 100%; cursor: pointer; ">Reset</button>
        </div>
        <hr>
        <div style="cursor: pointer;">
            <input type="checkbox" id="otpRectOCR"> OCR Box
        </div>
    </div>
    <!-- translate button -->
    <style>
    #control {
        z-index: 2147483647;
        cursor: pointer;
        position: absolute;
        width: 27px;
        height: 27px;
        border-radius: 5px;
        border: 1px solid;
        border-color: rgb(220, 220, 220);
        background-color: white;
    }
    #control b {
        display: inline-block;
        width: 27px;
        height: 27px;
        background-repeat: no-repeat;
        background-position: center;
        /*background-size: 70%;*/
        background-size: 19px;
    }
    #google{background-image: url("data:image/png;base64,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") }
    #divDict {
        z-index: 2147483647;
        position: absolute;
        border-radius: 5px;
        border: 1px solid;
        border-color: rgb(220, 220, 220);
        background-color: white;
        color: black;
        padding: 4px;
        user-select: none;
        display: none;
        max-width: 400px;
        font-family: "Times New Roman", Times, serif;
        font-size: 1.2em;
    }
    [data-tooltip] {
        position: relative;
    }
    [data-tooltip]:after {
        z-index: 2147483648;
        content: attr(data-tooltip);
        position: absolute;
        left: 0;
        bottom: 100%;
        background-color: lightsteelblue;
        display: none;
        pointer-events: none;
        border-radius: 5px;
        padding: 0.2em;
        width: max-content;
        max-width: 300px;
    }
    [data-tooltip]:hover:after {
        display: inherit;
    }
    .dict-item:hover {
        background-color: lightgray !important;
    }

    /* OCR */
    #btnManualOCR:disabled,
    #btnManualOCR[disabled]  {
        background-color: #00FF00 !important;
    }
    </style>
    <template><span id="control"><b id="google"></b></span></template><div id="divDict"></div>
    <!-- OCR -->
    <div class='resizable' id='divRectOCR' style="pointer-events: none; z-index: 999; bottom: 300px; left: 250px;">
        <div class='resizers' style="background-color: transparent; border: 1px solid rgb(0, 255, 0);">
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer left'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer right'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer top'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer bottom'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer top-left'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer top-right'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer bottom-left'></div>
            <div style="pointer-events: auto; background-color: rgb(0 0 0 / 1%)" class='resizer bottom-right'></div>
        </div>
        <div style="pointer-events: auto; position: absolute; right: 0; display: flex; align-items: center; gap: 10px;">
            <div style="
                cursor: pointer;
                background: rgb(0 0 0 / 1%);
                padding: 8px;
            ">
                <input type="checkbox" style="
                    -webkit-transform: scale(1.4);
                    pointer-events: none;
                    margin: 0;" id="cbShowRectOCR">
            </div>
            <button  style="
                cursor: pointer;
                user-select: none;
                border: 1px solid #e7e7e7;
                background-color: #e7e7e7;
                color: black;
                padding: 6px;
            " id="btnManualOCR">OCR</button>
        </div>
    </div>
</div>
`;
}