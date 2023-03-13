if (typeof module !== 'undefined') {
    module.exports = {
        Google: require('./libTranslateGoogle.js'),
        DeepL: require('./libTranslateDeepL.js'),
        VietPhrase: require('./libTranslateVietPhrase.js')
    };
}
else {
    return ['Google', 'DeepL', 'VietPhrase'];
}