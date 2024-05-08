"use strict";

const { nouns, adjectives } = require("./usernameDict");

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomNumber = (maxNumber) => {
    if (maxNumber < 1 || !Number.isFinite(maxNumber)) {
        return "";
    }

    let min = Math.pow(10, maxNumber - 1);
    let max = Math.pow(10, maxNumber) - 1;

    return getRandomInt(min, max).toString();
};

function generateUsername(separator = "", randomDigits = 0, length = undefined, prefix = "") {
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const adjective = prefix ? prefix.trim().replace(/\s+/g, separator).toLowerCase() : adjectives[Math.floor(Math.random() * adjectives.length)];
    let username;

    if (separator) {
        username = adjective + separator + noun + randomNumber(randomDigits);
    } else {
        username = adjective + noun + randomNumber(randomDigits);
    }

    if (length) {
        username = username.substring(0, length);
    }

    return username;
}

module.exports = { generateUsername };
