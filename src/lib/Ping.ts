export default class Ping{
    public startMs : number
    public endMs : number
    get ping(){
        return this.endMs - this.startMs
    }
    start(){
        if(this.startMs) throw new Error(`already start counting`)
        this.startMs = Date.now()
    }
    end(){
        if(!this.startMs) throw new Error(`didn't start counting`)
        this.endMs = Date.now()
    }

}