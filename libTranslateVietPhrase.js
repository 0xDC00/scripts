(function () {
    function init(sl, tl) { }

    function translate(str, sl, tl) {
        return createRequest(str, sl, tl)
            .then(r => r.text())
            .then(r => r.replace(/\t+/g, ''));
    }

    function createRequest(str, sl, tl) {
        str = JSON.stringify(str);
        const body = '{"chineseContent":' + str + '}';
        return fetch("https://vietphrase.info/Vietphrase/TranslateVietPhraseS", {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: body
        });
    }

    function setSrc(v) { }
    function setDst(v) { }

    if (typeof module !== 'undefined') {
        module.exports = { init, translate, setSrc, setDst, createRequest };
    }
    else {
        init();
        globalThis._init = init;
        globalThis._trans = translate;
    }
})();