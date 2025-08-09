(function () {
    // Node.js 내장 모듈
    const crypto = require('crypto');

    let sourceLanguage = 'auto';
    let targetLanguage = 'en';
    let deviceId = generateUUID();
    let version = '';

    function init(sl, tl) {
        setSrc(sl);
        setDst(tl);
    }

    async function translate(text, sl, tl) {
        sl = fixLang(sl || sourceLanguage, true);
        tl = fixLang(tl || targetLanguage, false);

        // Papago 웹 버전 체크 (1회만)
        if (!version) {
            version = await getPapagoVersion();
        }
        if (!version) return 'Papago 버전 확인 실패';

        // Papago 해시키 생성
        const time = Date.now();
        const hash = crypto.createHmac("md5", version)
            .update(`${deviceId}\nhttps://papago.naver.com/apis/n2mt/translate\n${time}`)
            .digest("base64");

        const data = 
            `deviceId=${deviceId}` +
            `&locale=ko` + // 필요에 따라 en/ko 변경
            `&honorific=false` +
            `&agree=false` +
            `&dict=true` +
            `&dictDisplay=30` +
            `&instant=false` +
            `&paging=false` +
            `&source=${sl}` +
            `&target=${tl}` +
            `&text=${encodeURIComponent(text)}`;

        const headers = {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "Device-Type": "pc",
            "X-Apigw-Partnerid": "papago",
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://papago.naver.com",
            "Referer": "https://papago.naver.com/",
            "Authorization": `PPG ${deviceId}:${hash}`,
            "Timestamp": time.toString()
        };

        try {
            const response = await fetch("https://papago.naver.com/apis/n2mt/translate", {
                method: "POST",
                headers,
                body: data
            });
            const result = await response.json();
            if (result.translatedText) {
                return result.translatedText;
            } else if (result.errorMessage) {
                return `Papago 오류: ${result.errorMessage}`;
            } else {
                return "Papago 번역 실패";
            }
        } catch (e) {
            return "Papago API 호출 중 에러 발생";
        }
    }

    function setSrc(v) {
        sourceLanguage = fixLang(v, true);
    }

    function setDst(v) {
        targetLanguage = fixLang(v, false);
    }

    function fixLang(lang, isSource) {
        // Papago 지원 언어코드 맞춤
        if (!lang) return isSource ? 'auto' : 'en';
        if (lang === 'zh-CN') return 'zh-CN';
        if (lang === 'zh-TW') return 'zh-TW';
        if (lang === 'ja') return 'ja';
        if (lang === 'en') return 'en';
        if (lang === 'ko') return 'ko';
        // 필요한 언어 추가
        return lang;
    }

    function generateUUID() {
        // 간단한 uuid4 생성
        let rnd = crypto.randomBytes(16);
        rnd[6] = (rnd[6] & 0x0f) | 0x40;
        rnd[8] = (rnd[8] & 0x3f) | 0x80;
        rnd = rnd.toString("hex").match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
        rnd.shift();
        return rnd.join("-");
    }

    async function getPapagoVersion() {
        // Papago 웹에서 version 값을 동적으로 추출 (변경 가능성 있음)
        try {
            const MAIN_URL = "https://papago.naver.com/";
            const page = await fetch(MAIN_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
            const html = await page.text();
            const mainJs = html.match(/"\/main.([^"]+)"/);
            if (!mainJs) return '';
            const jsPath = `https://papago.naver.com/main.${mainJs[1]}`;
            const jsFile = await fetch(jsPath, { headers: { "User-Agent": "Mozilla/5.0" } });
            const jsText = await jsFile.text();
            const ver = jsText.match(/"v1.([^"]+)"/);
            if (!ver) return '';
            return `v1.${ver[1]}`;
        } catch (e) {
            return '';
        }
    }

    if (typeof module !== 'undefined') {
        module.exports = { init, translate, setSrc, setDst };
    } else {
        init();
        globalThis._init = init;
        globalThis._trans = translate;
    }
})();