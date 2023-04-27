import { ActionRowBuilder, ButtonBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import Spygame from "../lib/spygame";
import { error } from "../lib/cmd";

module.exports = {
    data : {
        name : "join_spygame_[:id]",
        description : "Join a Spy game" 
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType> & {customId : string}){
        try{
            if(interaction.user.id === interaction.customId.split("_")[2]){
                await interaction.reply({
                    content : "You are already the host of this game :x:",
                    ephemeral : true
                })
                return
            }
            if(interaction.customId.startsWith("join_spygame")){
                const isFull = await Spygame.isFull(interaction.guildId,interaction.customId.split("_")[2])
                        if(isFull){
                            await interaction.reply({
                                content : "This game is full",
                                ephemeral : true
                            })
                            return
                        }
                        const game = await DiscordServers.getGameByHostId(interaction.guildId,interaction.customId.split("_")[2])
                        await Spygame.join(interaction.guildId,game.hostId,interaction.user.id)
                        const announcement = interaction.channel.messages.cache.get(game.announcementId)
                        if(announcement){
                            const embed = new EmbedBuilder()
                            .setTitle("Spy Game")
                            .setAuthor({name : `Waiting for players ${game.players.length + 1} / ${game.maxPlayers}`})
                            await announcement.edit({
                                embeds : [embed]
                            })
                            const button = new ButtonBuilder()
                            .setCustomId(`leave_spygame_${interaction.customId.split("_")[2]}`)
                            .setStyle(4)
                            .setLabel("leave")
                            const row : any = new ActionRowBuilder()
                        .addComponents(button)
                            await interaction.reply({
                                content : "you have joined the game :white_check_mark:",
                                ephemeral : true,
                                components : [row]
                            })
                        }
                        const gameUpdate = await DiscordServers.getGameByHostId(interaction.guildId,interaction.customId.split("_")[2])
                        if(game.maxPlayers === gameUpdate.players.length){
                            const embed = new EmbedBuilder()
                            .setAuthor({name : "Spy game is starting 🟢"})
                            .setTitle("Spy Game")
                            await announcement.edit({
                                embeds : [embed],
                                content : ""
                            })
                            setTimeout(async()=>{
                                await interaction.channel.send({
                                    content : "**Spy game started !**"
                                })
                            },2000)
                            const randomNum = Math.floor(Math.random() * gameUpdate.players.length)
                            const server = await getServerByGuildId(interaction.guildId)
                            const spy = game.players[randomNum]
                            server.games.map((e,i)=>{
                                if(e.hostId === interaction.customId.split("_")[2]){
                                    server.games[i].spy = spy
                                }
                            })
                            await server.save()
                            console.log(gameUpdate.players);
                            gameUpdate.players.map(async(e)=>{
                                try{
                                    if(e.id === spy.id){
                                        await interaction.client.users.cache.get(e.id).send({
                                            content : `You are the spy in ${interaction.guild.name} \n ${interaction.channel.url}`
                                        })
                                    }else{
                                        const embed = new EmbedBuilder()
                                        .setAuthor({name : "The Random word is :"})
                                        .setTitle(gameUpdate.word)
                                        await interaction.client.users.cache.get(e.id).send({
                                            content : `You are an agent in ${interaction.guild.name} \n ${interaction.channel.url}`,
                                            embeds : [embed]
                                        })
                                    }
                                }
                                catch(err: any){
                                    error(err.message)
                                }
                            })
                        }
            }
        }
        catch(err : any){
            error(err.message)
        }
    }
}