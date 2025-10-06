import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import healthcheck from "./src/routes/healthcheck.js"
import errorHandler from "./src/middlewares/error.middleware.js"
import userRouter from "./src/routes/user.route.js"
import songRouter from "./src/routes/song.route.js"
import artistRouter from "./src/routes/artist.route.js"
import albumRouter from "./src/routes/album.route.js"
import playlistRouter from "./src/routes/playlist.route.js"


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
app.use("/api/v1/songs", songRouter)
app.use("/api/v1/artists", artistRouter)
app.use("/api/v1/albums", albumRouter)
app.use("/api/v1/playlists", playlistRouter)

app.use(errorHandler)

export default app

