import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";


module.exports = {
    data : {
        name : "remove_ans",
        description : "remove your answer"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        const message =  await interaction.deferReply({ephemeral : true})
        await QuizGame.removeAns(interaction.guildId,interaction.user.id)
        await message.delete()
    }
}