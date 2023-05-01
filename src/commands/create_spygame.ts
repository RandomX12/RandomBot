import { CacheType, ChatInputCommandInteraction, EmbedBuilder ,ApplicationCommandDataResolvable, ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder} from "discord.js";
import Spygame from "../lib/spygame"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import { error } from "../lib/cmd";
const cmdBody : ApplicationCommandDataResolvable = {
    name : "create_spygame",
    description : "create a Spy Game",
    options : [
        {
            name : "max_players",
            description : "set the maximum number of players",
            type : ApplicationCommandOptionType.Number,
            required : true,
            maxValue : 10,
            minValue : 3
        },
    ]
}

module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const maxPl = interaction.options.getNumber("max_players",true)
        const isHost = await Spygame.isHost(interaction.guildId,interaction.user.id)
        if(isHost){
            interaction.reply({
                content : `:x: You have already created a Spygame`,
                ephemeral : true
            })
            return
        }
        const leaveButton = new ButtonBuilder()
        .setCustomId(`leave_spygame_${interaction.user.id}`)
        .setLabel("leave")
        .setStyle(4)
        const rowLeave : any = new ActionRowBuilder()
        .addComponents(leaveButton)
        const embed = new EmbedBuilder()
        .setTitle("Spy Game")
        .setAuthor({name : `Waiting for players ${"1 /"+maxPl}`})
        await interaction.reply({
            content : "spygame created :white_check_mark:",
            ephemeral : true,
            components : [rowLeave]
        })
        const button = new ButtonBuilder()
        .setCustomId(`join_spygame_${interaction.user.id}`)
        .setStyle(3)
        .setLabel("join")
        const row : any = new ActionRowBuilder()
        .addComponents(button)
        let msg = await interaction.channel.send({
            content : `creating Spy Game...`,
        })
        try{
            const spygame = new Spygame(interaction.guildId,interaction.user.tag,interaction.user.id,maxPl,interaction.channelId,msg.id)
            await spygame.save()
        }
        catch(err : any){
            console.log(err.message);
            await msg.delete()
            msg = null
        }
        try{
            await msg.edit({
                content : `@everyone new Spygame created by <@${interaction.user.id}>`,
                components : [row],
                embeds : [embed],
            })
        }
        catch(err : any){
            console.log(err.message);
            Spygame.delete(interaction.guildId,interaction.user.id)
        }
        setTimeout(async()=>{
            try{
                const dcServer = await getServerByGuildId(interaction.guildId)
                dcServer.games.map(async(e,i)=>{
                    if(e.hostId === interaction.user.id){
                        if(e.maxPlayers !== e.players.length){
                            dcServer.games.splice(i,1)
                            await dcServer.save()
                            await interaction.editReply({
                                content : ":x: Timeout: no one has joined the game",
                                components : [],
                                embeds : []
                            })
                            await interaction.channel.messages.cache.get(msg.id).delete()
                        }
                    }
                })
            }
            catch(err : any){
                error(err.message)
            }
        },60*5*1000)
        
    }
}