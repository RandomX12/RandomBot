import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";
import { ButtonCommand, reply } from "../lib/Commands";


module.exports = new ButtonCommand({
    data : {
        name : "removeans",
        description : "remove your answer"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        const message =  await interaction.deferReply({ephemeral : true})
        const hostId = interaction.customId.split("_")[1]
        const index = +interaction.customId.split("_")[2]
        if(typeof index !== "number" || !hostId){
            await reply(interaction,{
                content : "error : cannot remove answer. unknown hostId."
            })
            return
        }
        await QuizGame.removeAns(interaction.guildId,hostId,interaction.user.id,index)
        await message.delete()
    }
})