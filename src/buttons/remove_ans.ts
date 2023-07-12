import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";
import { reply } from "../lib/Commands";


module.exports = {
    data : {
        name : "remove_ans_[:id]",
        description : "remove your answer"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        const message =  await interaction.deferReply({ephemeral : true})
        const hostId = interaction.customId.split("_")[2]
        const index = +interaction.customId.split("_")[3]
        if(typeof index !== "number" || !hostId){
            await reply(interaction,{
                content : "error : cannot remove answer. unknown hostId."
            })
            return
        }
        await QuizGame.removeAns(interaction.guildId,hostId,interaction.user.id,index)
        await message.delete()
    }
}