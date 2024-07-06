function parseOrString(str) {
    let result = str;
    try {
        result = JSON.parse(result);
    } catch (e) {
    }
    return result;
}

function stringifyOrString(el) {
    if (typeof el === 'string') {
        return el;
    }
    return JSON.stringify(el, null, '\t');
}

module.exports = {
    parseOrString,
    stringifyOrString
};
