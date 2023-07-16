import { Storage } from "../storage"


describe("test the storage",()=>{
    it("store data and get it",()=>{
        const store = new Storage()
        let data = {name : "hello"}
        store.set("1",data)
        expect(store.get("1")).toBe(data)
        expect(store.has("1")).toBe(true)
        expect(store.cache).toBeInstanceOf(Array)
        expect(store.cache.length).toBe(store.size)
    })
    it("try do get data that doesn't exist",()=>{
        const store = new Storage()
        expect(store.get("7")).toBeUndefined()
        expect(store.get(undefined)).toBeUndefined()
    })
    it("try to set invalid data",()=>{
        const store = new Storage()
        //@ts-ignore
        store.set("1")
        expect(store.get("1")).toBeUndefined()
    })
    describe("test the select function",()=>{
        it("test with one prop",()=>{
            const store = new Storage<string,{age : number}>()
            store.set("1",{age : 8})
            store.set("2",{age : 8})
            store.set("3",{age : 5})
            store.set("4",{age : 3})
            expect(store.select({age : 8})).toBeInstanceOf(Array)
            expect(store.select({age : 8})).toHaveLength(2)
        })
        it("test with more props",()=>{
            const store = new Storage<string,{age : number,name : string}>()
            store.set("1",{age : 8,name : "3am lazhir"})
            store.set("2",{age : 8,name : "obama"})
            store.set("3",{age : 5,name : "-_-"})
            store.set("4",{age : 3,name : "o_o"})
            expect(store.select({age : 8})).toHaveLength(2)
            expect(store.select({age : 8,name : "obama"})).toHaveLength(1)
            expect(store.select({age : 8,name : "RandomBot"})).toHaveLength(0)
            expect(store.select({})).toHaveLength(store.size)
        })
        it("test it with object values",()=>{
            const store = new Storage()
            store.set("1",{user : {email : "a.com"}})
            expect(store.select({user : {email : "a.com"}})).toHaveLength(1)
        })
        it("test with different types",()=>{
            const store = new Storage()
            store.set("1",{age : 18})
            store.set("2",{age : "18"})
            store.set("3",{age : true})
            store.set("4",{age : "true"})
            store.set("5",{age : [1,2,[3,5]]})
            store.set("6",{age : [1,2,[3,"5"]]})
            store.set("7",{age : {a : 0,b : 1}})
            store.set("8",{age : {a : 0,b : 1,c : 3}})
            expect(store.select({age : 18})).toHaveLength(1)
            expect(store.select({age : "true"})).toHaveLength(1)
            expect(store.select({age : [1,2,[3,"5"]]})).toHaveLength(1)
            expect(store.select({age : {a : 0,b : 1,c : "3"}})).toHaveLength(0)
        })
    })
})