import { XMLParser } from "fast-xml-parser"
import { $fetch } from "ofetch"

const myFetch = $fetch.create({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" },
  timeout: 10000,
  retry: 3,
})

// inline copy of server/utils/rss2json.ts logic (same parser options)
async function rss2json(url: string) {
  const data = await myFetch(url, { responseType: "text" })
  const xml = new XMLParser({ attributeNamePrefix: "", textNodeName: "$text", ignoreAttributes: false })
  const result = xml.parse(data as string)
  let channel = result.rss && result.rss.channel ? result.rss.channel : result.feed
  if (Array.isArray(channel)) channel = channel[0]
  let items = channel.item || channel.entry || []
  if (items && !Array.isArray(items)) items = [items]
  return {
    items: items.map((val: any) => ({
      id: val.guid && val.guid.$text ? val.guid.$text : val.id,
      title: val.title && val.title.$text ? val.title.$text : val.title,
      link: val.link && val.link.href ? val.link.href : val.link,
      author: val.author && val.author.name ? val.author.name : val["dc:creator"],
      created: val.updated ?? val.pubDate ?? val.created,
      category: val.category || [],
    })),
  }
}

function label(category: any) {
  const first = Array.isArray(category) ? category[0] : category
  if (!first) return
  return typeof first === "string" ? first : first.label ?? (first.term && `r/${first.term}`)
}
function info(item: any, subreddit: string) {
  const from = label(item.category)
  const author = item.author?.replace(/^\//, "")
  return [from === `r/${subreddit}` ? undefined : from, author].filter(Boolean).join(" · ") || undefined
}

async function main() {
  for (const sub of ["news"]) {
    const feed = await rss2json(`https://www.reddit.com/r/${sub}/.rss`)
    const items = feed.items.map((item: any) => ({
      id: item.id ?? item.link,
      title: item.title,
      url: item.link,
      pubDate: item.created,
      extra: { info: info(item, sub) },
    }))
    console.log(`\n### r/${sub}: ${items.length} items`)
    console.log(JSON.stringify(items.slice(0, 3), null, 2))
    const bad = items.filter((i: any) => !i.id || !i.title || !i.url || !i.pubDate)
    console.log("items missing id/title/url/pubDate:", bad.length)
    await new Promise(r => setTimeout(r, 8000))
  }
}
main()
