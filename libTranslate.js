if (typeof module !== 'undefined') {
    module.exports = {
        Google: require('./libTranslateGoogle.js'),
        DeepL: require('./libTranslateDeepL.js')
    };
}
else {
    return ['Google', 'DeepL'];
}