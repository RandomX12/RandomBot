import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import Command, { reply } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";


module.exports = new Command({
    data : {
        name : "start",
        description : "Start a quiz game",
        options : [{
            name : "id",
            description : "game id",
            type : ApplicationCommandOptionType.String,
            required : true
        }]
    },
    async execute(interaction){
            const hostId = `${interaction.options.getString("id")}`
            const game = await QzGame.getGame(hostId)
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
            const announcement = await QzGame.getAnnouncement(interaction,hostId)
            await reply(interaction,{
                content : "game started :white_check_mark:"
            })
            if(!announcement){
                game.delete()
                const embed = new EmbedBuilder()
                .setAuthor({name : "Quiz Game"})
                .setTitle("It looks like someone deleted the game announcement ❌")
                .setFooter({text : "Game deleted"})
                await interaction.channel.send({
                embeds : [embed],
                })
            }
            try{
                await game.executeGame(interaction,announcement)
            }
            catch(err){
                game.delete()
            }
    },
    permissions : ["Administrator"],
    ephemeral : true
})