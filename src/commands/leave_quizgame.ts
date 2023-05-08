import { CacheType, ChatInputCommandInteraction } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import { QuizGame } from "../lib/QuizGame";
import Spygame from "../lib/spygame";


module.exports = {
    data : {
        name : "leave_quizgame",
        description : "Leave Quiz Game"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        if(!isIn) {
            await interaction.reply({
                content : "You are not in game :x:",
                ephemeral : true
            })
            return
        }
        // still under dev :)
        const server = await getServerByGuildId(interaction.guildId)
        const game = await Spygame.findGameByUserId(server.games,interaction.user.id)
        await QuizGame.leave(interaction.guildId,game.hostId,interaction.user.id)
    }
}