(function () {
    const crypto = require('crypto');
    const ctid = crypto.randomUUID().replace(/\-/g, '');
    const app = atob('TVNUcmFuc2xhdG9yQW5kcm9pZEFwcA==');
    const key = Buffer.from(atob('b2lrNlBkRGRNbk9YZW1UYnd2TW45ZGUvaDlsRm5mQmFDV2JHTU1acXFvU2FRYXFVT3FqVkdtNU5xc21qY0JJMXgrc1M5dWdqQjU1SEVKV1JpRlhZRnc9PQ=='), 'base64');
    var sourceLanguage, targetLanguage, _url, _urlEnc;
    function init(sl, tl) {
        setSrc(sl)
        setDst(tl);
    }

    function translate(str, sl, tl) {
        return createRequest(str, sl, tl)
            .then(r => r.json())
            .then(v => {
                if (v.error !== undefined) {
                    return v.error.message;
                }
                return v[0].translations[0].text;
            });
    }

    function createRequest(str, sl, tl) {
        let url = _url;
        let urlEnc = _urlEnc;
        if (sl && tl) {
            sl = fixSrc(sl);
            tl = fixDst(tl);
            url = createUrl(sl, tl);
            urlEnc = encodeUrl(url);
        }

        const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hourCycle: 'h24', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone: 'GMT' };
        let now = new Date().toLocaleDateString("en-UK", options).replace(/, /g, ' ').toLowerCase();
        now = now.substring(0, 3) + ', ' + now.substring(4) + 'GMT';

        const uuid = crypto.randomUUID().replace(/\-/g, '');
        const mark = app + urlEnc + now + uuid;
        const sign = app + '::' + crypto.createHmac('sha256', key).update(mark.toLowerCase()).digest("base64") + '::' + now + '::' + uuid;

        const body = '[{"Text":' + JSON.stringify(str) + '}]';
        return fetch(url, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-ClientTraceId': ctid,
                'X-MT-Signature': sign
            },
            method: "POST",
            body: body
        });
    }

    function setSrc(v) {
        v = fixSrc(v);
        sourceLanguage = typeof v === 'string' ? v : 'ja';
        _url = createUrl(sourceLanguage, targetLanguage);
        _urlEnc = encodeUrl(_url);
    }

    function setDst(v) {
        v = fixDst(v);
        targetLanguage = typeof v === 'string' ? v : 'en';
        _url = createUrl(sourceLanguage, targetLanguage);
        _urlEnc = encodeUrl(_url);
    }

    function fixSrc(v) {
        if (v === 'auto') v = '';
        else if (v === 'zh-CN') v = 'zh-Hans';
        else if (v === 'zh-TW') v = 'zh-Hant';
        return v;
    }

    function fixDst(v) {
        if (v === 'zh-CN') v = 'zh-Hans';
        else if (v === 'zh-TW') v = 'zh-Hant';
        return v;
    }

    function createUrl(sl, tl) {
        return 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=' + sl + '&to=' + tl;
    }

    function encodeUrl(s) {
        return encodeURIComponent(s.substring(8));
    }

    if (typeof module !== 'undefined') {
        module.exports = { init, translate, setSrc, setDst, createRequest };
    }
    else {
        init();
        globalThis._init = init;
        globalThis._trans = translate;
    }
})();