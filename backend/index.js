import app from "./app.js"
import connectDB from "./src/db/DBConnect.js"
import dotenv from "dotenv"

dotenv.config()

connectDB().then(()=>{
    const PORT = process.env.PORT || 5000
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch((err)=>{
    console.log(err)
})


