import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";
import { answers } from "../model/QuizGame";

module.exports = {
    data : {
        name : "answer_[:ans]_[:id]",
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
        try{
            const hostId = interaction.customId.split("_")[2]
            const ans : answers = interaction.customId.split("_")[1] as answers
            await QuizGame.setAns(interaction.guildId,hostId,interaction.user.id,ans)
            const inte =  await interaction.deferReply({
                ephemeral : true
            })
            await inte.delete()
        }
        catch(err : any){
            await interaction.reply({
                content : "Cannot answer :x:",
                ephemeral : true
            })
        }
    }
}