/**
 * Used to store data in the memory
 */
export class Storage<K,V> extends Map<K,V>{
    constructor(){super()}
    get cache(){
        let cache : V[] = []
        this.forEach((e)=>cache.push(e))
        return cache
    }
    /**
     * Select array of values that share the same data
     * @param data shared data
     * @example this.select({age : 20}) // will return all the values that containe age = 20
     */
    select(data : Partial<V>){
        const keys = Object.keys(data)
        let values = this.cache
        let result : V[] = []
        for(let i = 0;i<values.length;i++){
            let isEqual = true
            for(let j = 0 ;j<keys.length;j++){
                if(JSON.stringify(values[i][keys[j]]) !== JSON.stringify(data[keys[j]])){
                    isEqual = false
                }
            }
            if(isEqual){
                result.push(values[i])
            }
        }
        return result
    }
}
