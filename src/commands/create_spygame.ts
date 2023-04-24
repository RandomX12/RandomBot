import { CacheType, ChatInputCommandInteraction, EmbedBuilder ,ApplicationCommandDataResolvable, ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder} from "discord.js";
import Spygame from "../lib/spygame"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
const cmdBody : ApplicationCommandDataResolvable = {
    name : "create_spygame",
    description : "create a Spy Game",
    options : [
        {
            name : "max_players",
            description : "set the maximum number of players",
            type : ApplicationCommandOptionType.Number,
            required : true,
            maxValue : 20,
            minValue : 3
        },
    ]
}
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const maxPl = interaction.options.getNumber("max_players",true)
        const server = await getServerByGuildId(interaction.guildId)
        const isHost = await Spygame.isHost(interaction.guildId,interaction.user.id)
        if(isHost){
            interaction.reply({
                content : `:x: You have already created a Spygame`,
                ephemeral : true
            })
            return
        }
        
        const embed = new EmbedBuilder()
        .setTitle("Spy Game")
        .setAuthor({name : `Waiting for players ${"1 /"+maxPl}`})
        await interaction.reply({
            content : "spygame created :white_check_mark:",
            ephemeral : true,
            embeds : [embed]
        })

        const button = new ButtonBuilder()
        .setCustomId("join_spygame")
        .setStyle(3)
        .setLabel("join")
        const row : any = new ActionRowBuilder()
        .addComponents(button)
        const msg = await interaction.channel.send({
            content : `@everyone new Spygame created by <@${interaction.user.id}>`,
            components : [row]
        })
        const spygame = new Spygame(interaction.guildId,interaction.user.tag,interaction.user.id,maxPl,interaction.channelId,msg.id)
        await spygame.save()
        setTimeout(async()=>{
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
        },60*5*1000)
    }
}