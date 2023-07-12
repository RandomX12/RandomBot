import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import Command, { reply } from "../lib/Commands";
import QuizGame, { QzGame } from "../lib/QuizGame";
import { error, warning } from "../lib/cmd";


module.exports = new Command({
    data : {
        name : "kick",
        description : "kicks a player",
        options : [{
            name : "player",
            description : "player",
            type : ApplicationCommandOptionType.User,
            required : true
        }]
    },
    async execute(interaction) {
        try{
            const user = interaction.options.getUser("player")
            const game = await QzGame.getGameWithUserId(interaction.guildId,user.id)
            game.removePlayer(user.id)
            await game.update()
            if(!game.started){
                const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,game.hostId)
                if(announcement){
                    const embed = game.generateEmbed()
                    await announcement.edit({
                        embeds : [embed],
                    })
                }else{
                    const channel = await QuizGame.getChannel(interaction,game.hostId)
                    await game.delete()
                    const embed = new EmbedBuilder()
                    .setAuthor({name : "Quiz Game"})
                    .setTitle("It looks like someone deleted the game announcement ❌")
                    .setFooter({text : "Game deleted"})
                    const msg = await channel?.send({
                        embeds : [embed],
                    })
                    setTimeout(async()=>{
                        try{
                            if(!game.mainChannel || channel){
                                await channel?.delete()
                                return
                            }
                            await msg.delete()
                        }catch(err){
                            warning(err.message)
                        }
                    },5000)
                    return
                }
            }
            await reply(interaction,{
                content : `<@${user.id}> kicked from the game in <#${game.channelId}>`,
                ephemeral : true
            })
            await user.send({
                content : `You are kicked from a quiz game in <#${game.channelId}>`
            })
        }
        catch(err){
            error(err.message)
            await reply(interaction,{
                content : "unknown error occurred when kicking the player"
            })
        }
    },
    ephemeral : true,
    permissions : ["Administrator"]
})