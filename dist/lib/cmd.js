"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animateRotatingSlash = exports.TimeTampNow = exports.logLineNumber = exports.warning = exports.error = exports.log = void 0;
const colorsArr = ["Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
const colorsCode = ["\x1b[31m", "\x1b[32m", "\x1b[33m", "\x1b[34m", "\x1b[35m", "\x1b[36m", "\x1b[37m"];
function log(config) {
    if (!config.timeColor) {
        config.timeColor = "White";
    }
    if (!config.textColor) {
        config.textColor = "White";
    }
    console.log(`${colorsCode[colorsArr.indexOf(config.timeColor)]}`, `[${new Date().toLocaleTimeString()}] `, `${colorsCode[colorsArr.indexOf(config.textColor)]}`, `${config.text}`, "\x1b[37m");
}
exports.log = log;
function error(text) {
    console.log(`\x1b[31m`, "[ERROR] ", `${text}`, "\x1b[37m");
}
exports.error = error;
function warning(text) {
    console.log(`\x1b[33m`, "[WARNING] ", `${text}`, "\x1b[37m");
    logLineNumber();
}
exports.warning = warning;
function logLineNumber() {
    const error = new Error();
    const lineNumber = error.stack.split('\n')[4].split(':')[2];
    const fileName = error.stack.split('\n')[4].split(':')[1].split('/').pop();
    let relativeFilePath = "";
    let st = false;
    let rn = false;
    fileName.split("\\").map((e) => {
        if (e === "RandomBot") {
            st = true;
            if (!rn) {
                relativeFilePath += "./";
                rn = true;
            }
            else {
                relativeFilePath += e + "/";
            }
            return;
        }
        if (!st)
            return;
        relativeFilePath += e + "/";
    });
    console.log(`File: ${relativeFilePath}, Line: ${lineNumber}`);
}
exports.logLineNumber = logLineNumber;
function TimeTampNow() {
    return `<t:${Math.floor(Date.now() / 1000)}:R>`;
}
exports.TimeTampNow = TimeTampNow;
function animateRotatingSlash(text) {
    let frame = 0;
    const animation = setInterval(() => {
        frame++;
        const slash = ['-', '\\', '|', '/'][frame % 4];
        process.stdout.write('\r' + slash + "\t" + text);
    }, 100); // Change the interval value (in milliseconds) to control the speed of animation
    return animation;
}
exports.animateRotatingSlash = animateRotatingSlash;
