// "source_lang_user_selected":"ja"
// "target_lang" "en"
(function () {
    var sourceLanguage, targetLanguage, regionVar;
    var id;
    function init(src, dst) {
        id = 1e4 * Math.round(1e4 * Math.random()); // from utils
        setSrc(src)
        setDst(dst);
    }

    function translate(str, sl, tl, stop) {
        return createRequest(str, sl, tl)
            .then(r => r.json())
            .then(async v => {
                if (v.result !== undefined) {
                    return v.result.texts[0].text;
                }
                else {
                    if (stop === true) {
                        return v.error.message;
                    }
                    else {
                        if (v.error !== undefined && v.error.code === 1042902) {
                            await cookieStore.delete({ url: 'https://www.deepl.com/' });
                            return translate(str, undefined, undefined, true);
                        }
                        else {
                            return 'ERROR';
                        }
                    }
                }
            });;
    }

    function createRequest(str, f, t) {
        let from = sourceLanguage;
        let to = targetLanguage;
        if (f && t) {
            from = fixSrc(f);
            to = fixDst(t);
        }
        let n = 1; id++;
        for (let i = 0; i < str.length; i++)
            if (str[i] === 'i') n++;
        let timestamp = Date.now();
        timestamp = (timestamp - (timestamp % n)) + n; // from translater_late
        str = JSON.stringify(str);
        const body = `{"params":{"texts":[{"text":${str},"requestAlternatives":0}],"splitting":"newlines","commonJobParams":{"regionalVariant":${regionVar},"wasSpoken":false},"lang":{"target_lang":"${to}","source_lang_user_selected":"${from}"},"timestamp":${timestamp}},"id":${id},"jsonrpc":"2.0","method"${((id + 3) % 13 === 0 || (id + 5) % 29 === 0) ? " : " : ": "}"LMT_handle_texts"}`;
        return fetch("https://www2.deepl.com/jsonrpc", {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: body,
            credentials: 'include'
        });
    }

    function setSrc(v) {
        v = fixSrc(v);
        sourceLanguage = typeof v === 'string' ? v : 'ja';
    }

    function setDst(v) {
        v = fixDst(v);
        targetLanguage = typeof v === 'string' ? v : 'en';
        regionVar = targetLanguage === 'en' ? '"en-US"' : 'null';
    }

    function fixSrc(v) {
        if (v === 'auto') v = '';
        else if (v === 'zh-CN') v = 'zh';
        else if (v === 'zh-TW') v = 'zh';
        else if (v === 'ko') v = ''; // Korean is not supported
        return v;
    }

    function fixDst(v) {
        if (v === 'vi') v = 'en'; // Vietnamese is not supported
        else if (v === 'zh-CN') v = 'zh';
        else if (v === 'zh-TW') v = 'zh';
        else if (v === 'ko') v = 'en'; // Korean is not supported
        return v;
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