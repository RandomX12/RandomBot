"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warning = exports.error = exports.log = void 0;
const colorsArr = ["Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
const colorsCode = ["\x1b[31m", "\x1b[32m", "\x1b[33m", "\x1b[34m", "\x1b[35m", "\x1b[36m", "\x1b[37m"];
function log(config) {
    if (!config.timeColor) {
        config.timeColor = "White";
    }
    if (!config.textColor) {
        config.textColor = "White";
    }
    console.log(`${colorsCode[colorsArr.indexOf(config.timeColor)]}`, `[${new Date().toLocaleTimeString()}] `, `${colorsCode[colorsArr.indexOf(config.textColor)]}`, `${config.text}`);
}
exports.log = log;
function error(text) {
    console.log(`\x1b[31m`, "[ERROR] ", `${text}`);
}
exports.error = error;
function warning(text) {
    console.log(`\x1b[33m`, "[WARNING] ", `${text}`, "\x1b[37m");
}
exports.warning = warning;
