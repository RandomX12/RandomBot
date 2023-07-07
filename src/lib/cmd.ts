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
    console.log(`${colorsCode[colorsArr.indexOf(config.timeColor)]}`,`[${new Date().toLocaleTimeString()}] `,`${colorsCode[colorsArr.indexOf(config.textColor)]}`,`${config.text}`,"\x1b[37m");
}
export function error(text :string){
    console.log(`\x1b[31m`,"[ERROR] ",`${text}`,"\x1b[37m");
}
export function warning(text : string){
    console.log(`\x1b[33m`,"[WARNING] ",`${text}`,"\x1b[37m");
    logLineNumber()
}

// this function needs fix
export function logLineNumber() {
    const error = new Error();
    const lineNumber = error.stack?.split('\n')[4]?.split(':')[2];
    const fileName = error.stack?.split('\n')[4]?.split(':')[1]?.split('/')?.pop();
    if(!lineNumber || !fileName) return
    let relativeFilePath = ""
    let st = false
    let rn= false
    fileName?.split("\\")?.map((e)=>{
        if(e === "RandomBot"){
            st = true
            if(!rn){
                relativeFilePath += "./"
                rn = true
            }else{
                relativeFilePath += e + "/"
            }
            return
        }
        if(!st) return
        relativeFilePath += e + "/"
    })
    console.log(`File: ${relativeFilePath}, Line: ${lineNumber}`);
}
export function TimeTampNow(){
    return `<t:${Math.floor(Date.now() / 1000)}:R>`
}

export function animateRotatingSlash(text? : string) {
    let frame = 0;
    const animation = setInterval(() => {
      frame++;
      const slash = ['-', '\\', '|', '/'][frame % 4];
      process.stdout.write('\r' + slash + "\t"+text);
    }, 100); // Change the interval value (in milliseconds) to control the speed of animation
    return animation
  }
