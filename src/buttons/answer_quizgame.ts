import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";
import { answer } from "../model/QuizGame";

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
            const ans : answer = interaction.customId.split("_")[1] as answer
            const index : number = +interaction.customId.split("_")[3]
            await QuizGame.setAns(interaction.guildId,hostId,interaction.user.id,ans,index)
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