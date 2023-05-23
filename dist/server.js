// This file is an express server to keep replit server alive
// don't use this code in your local pc
// set The prop "productionMode" in ./config.json to false to disable the server lunch (if you are not in replit sv)
const productionMode = require("../config.json").productionMode
let express = require("express")
if(!productionMode) {
    express = null
}
const app = express()
const log = require("./lib/cmd").log
app.get("/",(req,res)=>{
    res.send(`<h1>Random Bot express server</h1><h3>Status : ONLINE</h3>`)
})
// lunch the server
function keepAlive(){
    if(!productionMode) return
    app.listen(3000,()=>{
        log({textColor : "Green",text : "Server Ready"})
    })
}
module.exports = keepAlive