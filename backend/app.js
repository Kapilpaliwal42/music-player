import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import healthcheck from "./src/routes/healthcheck.js"
import errorHandler from "./src/middlewares/error.middleware.js"
import userRouter from "./src/routes/user.route.js"
const app = express()

app.use(cors(
    {
        origin: "*",
        credentials: true
    }
))

app.use(express.json(
    {
        limit: "30mb",
        extended: true
    }
))

app.use(express.urlencoded(
    {
        limit: "30mb",
        extended: true
    }
))

app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/healthcheck", healthcheck)
app.use("/api/v1/users", userRouter)

app.use(errorHandler)

export default app

