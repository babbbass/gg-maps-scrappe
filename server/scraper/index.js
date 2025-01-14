import puppeteer from "puppeteer"
import "dotenv/config"

export async function main(query, sendData) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized"],
  })

  const page = await browser.newPage()
  await page.goto(process.env.URL)
  // await page.goto("https://www.google.com/maps")

  // Configuration pour éviter la détection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  )

  try {
    await page.waitForSelector('button[aria-label="Tout accepter"]', {
      timeout: 5000,
    })
    await page.click('button[aria-label="Tout accepter"]')

    await page.waitForSelector("#searchboxinput")
    await page.type("#searchboxinput", query)
    await page.keyboard.press("Enter")

    await page.waitForSelector('div[role="feed"]')

    const batchSize = 2
    let currentBatch = []

    await scrollToBottom(page)

    const processElement = async (href) => {
      await page.goto(href)
      await page.waitForNavigation({ waitUntil: "networkidle0" })

      const result = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector)
          return element ? element.textContent.trim() : null
        }

        return {
          name: getTextContent("h1"),
          phone:
            document.body.innerText.match(
              /(?:0[1-9])[\s.-]?(?:\d{2}[\s.-]?){4}/
            )?.[0] || null,
          email:
            document.body.innerText.match(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
            )?.[0] || null,
          website:
            document.querySelector('a[data-item-id="authority"]')?.href || null,
        }
      })
      currentBatch.push(result)
      if (currentBatch.length >= batchSize) {
        sendData({
          results: currentBatch,
          status: "partial",
        })
        currentBatch = []
      }
    }
    const elements = await page.$$(".hfpxzc")
    const hrefs = await Promise.all(
      elements.map((element) =>
        page.evaluate((element) => element.href, element)
      )
    )

    // Traitement des hrefs par lots
    for (const href of hrefs) {
      await processElement(href)
    }
    console.log("Scraping completed", currentBatch)
    // Envoi du dernier lot s'il en reste
    if (currentBatch.length <= 1) {
      sendData({
        results: currentBatch,
        status: "completed",
      })
    }
  } catch (error) {
    console.error("Error during scraping:", error)
    sendData({ error: "Internal server error" })
  } finally {
    await browser.close()
  }
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    const wrapper = document.querySelector('div[role="feed"]')

    await new Promise((resolve, reject) => {
      var totalHeight = 0
      var distance = 1000
      var scrollDelay = 3000

      var timer = setInterval(async () => {
        var scrollHeightBefore = wrapper.scrollHeight
        wrapper.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeightBefore) {
          totalHeight = 0
          await new Promise((resolve) => setTimeout(resolve, scrollDelay))

          // Calculate scrollHeight after waiting
          var scrollHeightAfter = wrapper.scrollHeight

          if (scrollHeightAfter > scrollHeightBefore) {
            // More content loaded, keep scrolling
            return
          } else {
            // No more content loaded, stop scrolling
            clearInterval(timer)
            resolve()
          }
        }
      }, 200)
    })
  })
}

//main().catch(console.error)
