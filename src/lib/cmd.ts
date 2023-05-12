export interface Cmd{
    name : string,
    description : string,
    execute : ()=> any
}
const colorsArr = ["Red" , "Green" , "Yellow" , "Blue" , "Magenta" , "Cyan" , "White"]
const colorsCode = ["\x1b[31m" , "\x1b[32m" , "\x1b[33m" , "\x1b[34m" , "\x1b[35m" , "\x1b[36m" , "\x1b[37m"]

export type colors = "Red" | "Green" | "Yellow" | "Blue" | "Magenta" | "Cyan" | "White"
interface Log{
    timeColor? : colors,
    textColor? : colors,
    text : string
}
export function log(config : Log){
    if(!config.timeColor){
        config.timeColor = "White"
    }
    if(!config.textColor){
        config.textColor = "White"
    }
    console.clear()
    console.log(`${colorsCode[colorsArr.indexOf(config.timeColor)]}`,`[${new Date().toLocaleTimeString()}] `,`${colorsCode[colorsArr.indexOf(config.textColor)]}`,`${config.text}`,"\x1b[37m");
}
export function error(text :string){
    console.log(`\x1b[31m`,"[ERROR] ",`${text}`);
}
export function warning(text : string){
    console.log(`\x1b[33m`,"[WARNING] ",`${text}`,"\x1b[37m");
}
export function TimeTampNow(){
    return `<t:${Math.floor(Date.now() / 1000)}:R>`
}