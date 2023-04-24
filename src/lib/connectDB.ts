import mongoose from "mongoose";
require("dotenv").config()
export async function connectDB(){
    await mongoose.connect(process.env.DB)
}