import express from "express"
import { main } from "../scraper/index.js"

const router = express.Router()

router.get("/scrape-stream", async (req, res) => {
  console.log("debut de la requete")
  const { query } = req.query

  console.log(query)
  // Configuration pour SSE
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  // Fonction pour envoyer les données
  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    main(query, sendData)
  } catch (error) {
    sendData({ error: "Internal server error" })
    res.end()
  } finally {
    // sendData({ status: "completed" })
    console.log("fin de la requete")
  }
})

export default router
