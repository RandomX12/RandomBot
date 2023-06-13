import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import { fetchServer } from "../lib/DiscordServers"
import { QuizCategoryImg } from "../lib/QuizGame"
// still under dev
module.exports = {
    data : {
        name : "games",
        description : "Liste all the games"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const server = await fetchServer(interaction.guildId)
        let v = ""
        server.games.map((e)=>{
            v += e.hostName + " | id : "+e.hostId+ ` <#${e.channelId}>` + "\n" 
        })
        if(!v){
            v = "There is no game right now"
        }
        const embed = new EmbedBuilder()
        .setTitle(`Quiz Games`)
        .addFields({name : "Games",value : v})
        .setThumbnail(QuizCategoryImg.Random)
        .setFooter({text : `${server.games.length} game`})
        await interaction.reply({
            embeds : [embed],
            ephemeral : true
        })
    }
}