import QzGameError, { QzErrors, QzGameErrorCode } from "../QuizGame"
import handleError from "../handler"

describe("testing error handling system",()=>{
    describe("Testing the error system of QzGame",()=>{
        it("create an error saying channel not found",()=>{
            const code = "201"
            const des = "channel not found"
            const error = new QzGameError(code,des)
            expect(error).toBeInstanceOf(QzGameError)
            expect(error.code).toBe(code)
            expect(error.name).toBeDefined()
            expect(error.message).toBe(des)
            expect(error.stack).toBeDefined()
        })
    })
})