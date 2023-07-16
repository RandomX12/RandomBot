import { ButtonInteraction, CacheType } from "discord.js";
import { QzGame } from "../lib/QuizGame";
import { answer } from "../model/QuizGame";
import { ButtonCommand } from "../lib/Commands";

module.exports = new ButtonCommand({
    data : {
        name : "answer",
        description : "Choose an answer"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction.customId.startsWith("answer") || !interaction.customId){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
            const hostId = interaction.customId.split("_")[2]
            const ans : answer = interaction.customId.split("_")[1] as answer
            const index : number = +interaction.customId.split("_")[3]
            await QzGame.setAns(hostId,interaction.user.id,ans,index)
            await interaction.deleteReply()
    },
    ephemeral : true,    
})