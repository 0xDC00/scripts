if (typeof module !== 'undefined') {
    module.exports = {
        Google: require('./libTranslateGoogle.js'),
        DeepL: require('./libTranslateDeepL.js'),
        Microsoft: require('./libTranslateMicrosoft.js'),
        VietPhrase: require('./libTranslateVietPhrase.js'),
        Papago: require('./libTranslatePapago.js')
    };
}
else {
    return ['Google', 'DeepL', 'Microsoft', 'VietPhrase', 'Papago'];
}