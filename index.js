import puppeteer from "puppeteer"
import "dotenv/config"

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized"],
  })

  const page = await browser.newPage()
  await page.goto(process.env.URL)
  const query = "coiffeur yvetot"

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

    const results = []

    async function scrollToBottom() {
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
    await scrollToBottom()

    const elements = await page.$$(".hfpxzc")
    //console.log(`Nombre total d'éléments trouvés : ${elements}`)
    const hrefs = await Promise.all(
      elements.map((element) =>
        page.evaluate((element) => element.href, element)
      )
    )

    for (const goto of hrefs) {
      await page.goto(goto)
      // await item.click()
      await page.waitForNavigation({ waitUntil: "networkidle0" })
      await page
        .waitForSelector('a[data-item-id="authority"]', { timeout: 5000 })
        .catch(() => console.log("Sélecteur non trouvé"))

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

      results.push(result)
    }
    console.log(results)
  } catch (error) {
    console.error("Error during scraping:", error)
    return new JSON.stringify(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
