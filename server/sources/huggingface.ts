import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"
import { defineSource } from "#/utils/source"

// Helper function to get current date format as YYYY-MM-DD
function getCurrentDateFormat(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function to get current week number and format it as YYYY-WXX
function getCurrentWeekFormat(): string {
  const now = new Date()
  const year = now.getFullYear()

  // Calculate week number
  const firstDayOfYear = new Date(year, 0, 1)
  const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)

  // Format as YYYY-WXX
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`
}

// Helper function to get current month format as YYYY-MM
function getCurrentMonthFormat(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}

// Helper function to fetch and parse papers with correct URL patterns
async function fetchPapers(timeframe: string): Promise<NewsItem[]> {
  // Adjust URL based on timeframe using the specific patterns with dates
  let url = "https://huggingface.co/papers"

  if (timeframe === "daily") {
    const dateFormat = getCurrentDateFormat()
    url = `https://huggingface.co/papers/date/${dateFormat}`
  } else if (timeframe === "weekly") {
    const weekFormat = getCurrentWeekFormat()
    url = `https://huggingface.co/papers/week/${weekFormat}`
  } else if (timeframe === "monthly") {
    const monthFormat = getCurrentMonthFormat()
    url = `https://huggingface.co/papers/month/${monthFormat}`
  }

  const response = await fetch(url)
  const html = await response.text()

  // Parse the HTML to extract paper items
  const $ = cheerio.load(html)
  const papers: NewsItem[] = []

  // Adjust selectors based on actual HTML structure
  $(".paper-card").each((_, el) => {
    const $el = $(el)
    const url = $el.find("a.paper-link").attr("href")
    const title = $el.find(".paper-title").text().trim()

    if (url && title) {
      papers.push({
        url: url.startsWith("http") ? url : `https://huggingface.co${url}`,
        title,
        id: url,
        // Optional fields
        pubDate: new Date().getTime(),
        extra: {
          hover: $el.find(".paper-abstract").text().trim(),
          info: $el.find(".paper-authors").text().trim(),
        },
      })
    }
  })

  return papers
}

// Define source getter functions for each timeframe
const dailyPapers = defineSource(async () => {
  return await fetchPapers("daily")
})

const weeklyPapers = defineSource(async () => {
  return await fetchPapers("weekly")
})

const monthlyPapers = defineSource(async () => {
  return await fetchPapers("monthly")
})

// Export the sources
export default {
  "huggingface-daily": dailyPapers,
  "huggingface-weekly": weeklyPapers,
  "huggingface-monthly": monthlyPapers,
}
