if (typeof module !== 'undefined') {
    module.exports = {
        Google: require('./libTranslateGoogle.js'),
        DeepL: require('./libTranslateDeepL.js'),
        Microsoft: require('./libTranslateMicrosoft.js'),
        VietPhrase: require('./libTranslateVietPhrase.js')
    };
}
else {
    return ['Google', 'DeepL', 'Microsoft', 'VietPhrase'];
}