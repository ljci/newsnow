import type { RSSCategory, RSSItem, SourceGetter } from "#/types"

// Reddit's *.json endpoints (and api.reddit.com) now answer 403 to
// unauthenticated clients regardless of User-Agent, so read the Atom feeds
// instead. They carry no score/comment counts, hence the leaner `info`.
function defineRedditSource(subreddit: string): SourceGetter {
  return async () => {
    const feed = await rss2json(`https://www.reddit.com/r/${subreddit}/.rss`)
    if (!feed?.items.length) throw new Error(`Cannot fetch r/${subreddit} feed`)

    return feed.items.map(item => ({
      id: item.id ?? item.link,
      title: item.title,
      url: item.link,
      pubDate: item.created,
      extra: {
        info: info(item, subreddit),
      },
    }))
  }
}

// r/popular aggregates other subreddits, so name the origin when it differs
// from the feed we asked for.
function info(item: RSSItem, subreddit: string) {
  const from = label(item.category)
  const author = item.author?.replace(/^\//, "")
  return [from === `r/${subreddit}` ? undefined : from, author].filter(Boolean).join(" · ") || undefined
}

function label(category?: RSSCategory | RSSCategory[]) {
  const first = Array.isArray(category) ? category[0] : category
  if (!first) return
  return typeof first === "string" ? first : first.label ?? (first.term && `r/${first.term}`)
}

const redditPopular = defineRedditSource("popular")
const redditNews = defineRedditSource("news")

export default defineSource({
  "reddit": redditPopular,
  "reddit-popular": redditPopular,
  "reddit-news": redditNews,
})
