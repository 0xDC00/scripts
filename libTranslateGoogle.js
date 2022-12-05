// sl=ja
// tl=en
(function () {
    var sourceLanguage, targetLanguage;
    function init(src, dst) {
        setSrc(src)
        setDst(dst);
    }

    function translate(str, sl, tl) {
        return createRequest(str, sl, tl)
            .then(r => r.json())
            .then(v => {
                if (v.sentences.length === 0) {
                    return '';
                }
                return v.sentences.map(x => x.trans).join(' ');
            });
    }

    function createRequest(str, f, t) {
        const tkk = getTTK(str);
        let from = sourceLanguage;
        let to = targetLanguage;
        if (f && t) {
            from = f;
            to = t;
        }
        const options = {
            method: "GET",
        };
        let url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + from + "&tl=" + to + "&hl=en-US&dt=t&dt=bd&dj=1&source=icon&tk=" + tkk;
        let q = "q=" + encodeURIComponent(str);
        if (2000 > url.length + q.length) {
            url += '&' + q; q = '';
        }
        else {
            options.headers = {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            };
            options.method = 'POST';
            options.body = q;
        }
        return fetch(url, options);
    }

    function setSrc(v) {
        sourceLanguage = typeof v === 'string' ? v : 'ja';
    }

    function setDst(v) {
        targetLanguage = typeof v === 'string' ? v : 'en';
    }

    if (typeof module !== 'undefined') {
        module.exports = { init, translate, setSrc, setDst, createRequest };
    }
    else {
        init();
        globalThis._init = init;
        globalThis._trans = translate;
    }

    /* TODO: grap ttk from www */
    const window = { TKK: "" };
    let Bc = ""; // instead null

    function getTTK(s) {
        let tk = Cc(s);
        tk = tk.replace("&tk=", "");
        return tk;
    }

    function Cc(a) {
        if (null !== Bc)
            var b = Bc;
        else {
            b = zc(String.fromCharCode(84));
            var c = zc(String.fromCharCode(75));
            b = [b(), b()];
            b[1] = c();
            b = (Bc = window[b.join(c())] || "") || ""
        }
        var d = zc(String.fromCharCode(116));
        c = zc(String.fromCharCode(107));
        d = [d(), d()];
        d[1] = c();
        c = "&" + d.join("") + "=";
        d = b.split(".");
        b = Number(d[0]) || 0;
        for (var e = [], f = 0, h = 0; h < a.length; h++) {
            var g = a.charCodeAt(h);
            128 > g ? e[f++] = g : (2048 > g ? e[f++] = g >> 6 | 192 : (55296 == (g & 64512) && h + 1 < a.length && 56320 == (a.charCodeAt(h + 1) & 64512) ? (g = 65536 + ((g & 1023) << 10) + (a.charCodeAt(++h) & 1023),
                e[f++] = g >> 18 | 240,
                e[f++] = g >> 12 & 63 | 128) : e[f++] = g >> 12 | 224,
                e[f++] = g >> 6 & 63 | 128),
                e[f++] = g & 63 | 128)
        }
        a = b;
        for (f = 0; f < e.length; f++)
            a += e[f],
                a = Ac(a, "+-a^+6");
        a = Ac(a, "+-3^+b+-f");
        a ^= Number(d[1]) || 0;
        0 > a && (a = (a & 2147483647) + 2147483648);
        a %= 1E6;
        return c + (a.toString() + "." + (a ^ b))
    };

    function zc(a) {
        return function () {
            return a
        }
    }

    function Ac(a, b) {
        for (var c = 0; c < b.length - 2; c += 3) {
            var d = b.charAt(c + 2);
            d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d);
            d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
            a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
        }
        return a
    }
})();