import express from "express"
import cors from "cors"
import scrapeRoutes from "./routes/scrapeRoutes.js"
import "dotenv/config.js"

const app = express()
const PORT = process.env.PORT || 5003

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
)
app.use(express.json())

app.use("/api", scrapeRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
