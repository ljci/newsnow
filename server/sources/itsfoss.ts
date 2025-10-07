import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const response: any = await myFetch("https://itsfoss.com/")
  const $ = cheerio.load(response)
  const news: NewsItem[] = []

  // Try multiple possible selectors
  const articles = $("article, .post, .entry")

  articles.each((_, el) => {
    const $el = $(el)
    // Try multiple possible link locations
    const $a = $el.find("h2 a, h3 a, .entry-title a, a.entry-title-link").first()
    const url = $a.attr("href")
    const title = $a.text().trim() || $el.find("h2, h3, .entry-title").first().text().trim()

    if (url && title) {
      news.push({
        url,
        title,
        id: url,
      })
    }
  })

  return news
})
