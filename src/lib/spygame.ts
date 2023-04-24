import DiscordServers from "../model/discordServers"
import { getServerByGuildId } from "./DiscordServers";
export default class Spygame{
    public inanimateThings = [
        'Chair',
        'Table',
        'Bed',
        'Lamp',
        'Book',
        'Pen',
        'Pencil',
        'Eraser',
        'Desk',
        'Computer',
        'Smartphone',
        'Tablet',
        'Television',
        'Car',
        'Bicycle',
        'Airplane',
        'Train',
        'Bus',
        'Refrigerator',
        'Microwave',
        'Toaster',
        'Coffee maker',
        'Blender',
        'Vacuum cleaner',
        'Washing machine',
        'Dryer',
        'Iron',
        'Dishwasher',
        'Oven',
        'Stove',
        'Freezer',
        'Camera',
        'Headphones',
        'Speakers',
        'Keyboard',
        'Mouse',
        'Monitor',
        'Printer',
        'Scanner',
        'Projector',
        'Clock',
        'Watch',
        'Calendar',
        'Globe',
        'Map',
        'Telescope',
        'Microscope',
        'Binoculars',
        'Compass',
        'Thermometer',
        'Barometer',
        'Scale',
        'Ruler',
        'Tape measure',
        'Scissors',
        'Knife',
        'Spoon',
        'Fork',
        'Plate',
        'Cup',
        'Glass',
        'Bowl',
        'Vase',
        'Picture frame',
        'Painting',
        'Sculpture',
        'Statue',
        'Doll',
        'Teddy bear',
        'Action figure',
        'Puzzle',
        'Board game',
        'Chess set',
        'Card deck',
        'Soccer ball',
        'Basketball',
        'Football',
        'Baseball',
        'Hockey stick',
        'Golf club',
        'Tennis racket',
        'Swimming goggles',
        'Snorkel',
        'Fishing rod',
        'Skateboard',
        'Roller skates',
        'Surfboard',
        'Snowboard',
        'Ski',
        'Tent',
        'Sleeping bag',
        'Backpack',
        'Suitcase',
        'Wallet',
        'Sunglasses',
        'Hat',
        'Scarf',
        'Gloves',
        'Umbrella',
        'Keychain'
    ];
    static async isHost(guildId : string,userId : string){
        const discordServer = await getServerByGuildId(guildId)
        let isHost = false
        if(discordServer.games.length === 0) return false
        discordServer.games.map(e=>{
            if(e.hostId === userId){
                isHost =true
            }
        })
        return isHost
    }
    constructor(public serverId : string,public hostName : string,public hostId : string,public maxPlayers : number,public channelId :string,public announcementId : string){}
    async save(){
        const discordSv = await getServerByGuildId(this.serverId)
        if(!discordSv) throw new Error(`discord server not found.`)
        discordSv.games.map(e=>{
            if(e.hostId === this.hostId){
                throw new Error(`You have already created a Spygame`)
            }
        })
            let randomNum = Math.floor(Math.random() * this.inanimateThings.length)
        discordSv.games.push({
            word : this.inanimateThings[randomNum],
            hostName : this.hostName,
            hostId : this.hostId,
            index : 0,
            maxPlayers : this.maxPlayers,
            players : [{username : this.hostName,id : this.hostId}],
            channelId : this.channelId,
            announcementId : this.announcementId
        })
        await discordSv.save()
    }
}   