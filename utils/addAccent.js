function createAccentInsensitiveRegex(query) {
    const accentMap = {
        a: '[aàáâãäå]',
        e: '[eèéêë]',
        i: '[iìíîï]',
        o: '[oòóôõö]',
        u: '[uùúûü]',
        c: '[cç]',
        n: '[nñ]'
    };

    let regexStr = '';
    for (const char of query) {
        const lowerChar = char.toLowerCase();
        regexStr += accentMap[lowerChar] || char;
    }

    return new RegExp(regexStr, 'i');
}

module.exports = createAccentInsensitiveRegex;
