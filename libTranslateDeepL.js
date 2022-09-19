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

    function translate(str) {
        let n = 1; id++;
        for (let i = 0; i < str.length; i++)
            if (str[i] === 'i') n++;
        let timestamp = Date.now();
        timestamp = (timestamp - (timestamp % n)) + n; // from translater_late
        str = JSON.stringify(str);
        const body = `{"params":{"texts":[{"text":${str},"requestAlternatives":0}],"splitting":"newlines","commonJobParams":{"regionalVariant":${regionVar},"wasSpoken":false},"lang":{"target_lang":"${targetLanguage}","source_lang_user_selected":"${sourceLanguage}"},"timestamp":${timestamp}},"id":${id},"jsonrpc":"2.0","method"${((id + 3) % 13 === 0 || (id + 5) % 29 === 0) ? " : " : ": "}"LMT_handle_texts"}`;
        return post(body);
    }

    function post(body, again) {
        return fetch("https://www2.deepl.com/jsonrpc", {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: body,
            credentials: 'include'
        }).then(r => r.json())
            .then(async v => {
                if (v.result !== undefined) {
                    return v.result.texts[0].text;
                }
                else {
                    if (again === true) {
                        return v.error.message;
                    }
                    else {
                        if (v.error !== undefined && v.error.code === 1042902) {
                            await cookieStore.delete({ url: 'https://www.deepl.com/' });
                            return post(body, true);
                        }
                        else {
                            return 'ERROR';
                        }
                    }
                }
            });
    }

    function setSrc(v) {
        sourceLanguage = typeof v === 'string' ? v : 'ja';
    }

    function setDst(v) {
        targetLanguage = typeof v === 'string' ? v : 'en';
        regionVar = targetLanguage === 'en' ? '"en-US"' : 'null';
    }

    if (typeof module !== 'undefined') {
        module.exports = { init, translate, setSrc, setDst };
    }
    else {
        init();
        globalThis._init = init;
        globalThis._trans = translate;
    }
})();