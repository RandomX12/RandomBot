import { CacheType, ChatInputCommandInteraction } from "discord.js";

interface Info{
    website : string,
    commands : string,
    server : string
}

module.exports = {
    data : {
        name : "help",
        description : "Do you need help using the bot ?"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const info : Info = require("../../config.json").info
        await interaction.reply({
            content : 
`Website : ${info.website}
commands : ${info.commands}
server   : ${info.server}`,
            ephemeral : true
        })
    }
}