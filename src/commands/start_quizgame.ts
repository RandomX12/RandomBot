import { ApplicationCommandOptionType } from "discord.js";
import Command, { reply } from "../lib/Commands";
import { error } from "../lib/cmd";
import QuizGame, { QzGame } from "../lib/QuizGame";


module.exports = new Command({
    data : {
        name : "start",
        description : "Start a quiz game",
        options : [{
            name : "id",
            description : "game id",
            type : ApplicationCommandOptionType.Number,
            required : true
        }]
    },
    async execute(interaction){
            const hostId = `${interaction.options.getNumber("id")}`
            const game = await QzGame.getGame(interaction.guildId,hostId)
            if(game.players.length === 0) {
                await reply(interaction,{
                    content : ":x: cannot start the game : the game is empty"
                })
                return
            }
            if(game.started){
                await reply(interaction,{
                    content : ":x: The game is already started"
                })
                return
            }
            const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,hostId)
            await reply(interaction,{
                content : "game started :white_check_mark:"
            })
            await game.executeGame(interaction,announcement)
    },
    permissions : ["Administrator"],
    ephemeral : true
})