interface RedditPost {
  data: {
    id: string
    title: string
    permalink: string
    url: string
    created_utc: number
    selftext: string
    author: string
    subreddit: string
    score: number
    num_comments: number
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

// For a single Reddit source
const redditPopular = defineSource(async () => {
  const response: RedditResponse = await myFetch("https://www.reddit.com/r/popular.json")

  return response.data.children.map(post => ({
    id: post.data.id,
    title: post.data.title,
    url: `https://www.reddit.com${post.data.permalink}`,
    pubDate: post.data.created_utc * 1000, // Convert to milliseconds
    extra: {
      hover: post.data.selftext || "Click to view on Reddit",
      info: `u/${post.data.author} · ${formatNumber(post.data.score)} points · ${formatNumber(post.data.num_comments)} comments`,
    },
  }))
})

// For Reddit news
const redditNews = defineSource(async () => {
  const response: RedditResponse = await myFetch("https://www.reddit.com/r/news.json")

  // Similar implementation as above
  return response.data.children.map(post => ({
    id: post.data.id,
    title: post.data.title,
    url: `https://www.reddit.com${post.data.permalink}`,
    pubDate: post.data.created_utc * 1000,
    extra: {
      hover: post.data.selftext || "Click to view on Reddit",
      info: `u/${post.data.author} · ${formatNumber(post.data.score)} points · ${formatNumber(post.data.num_comments)} comments`,
    },
  }))
})

// Helper function for formatting numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Export the sources
export default defineSource({
  "reddit": redditPopular,
  "reddit-popular": redditPopular,
  "reddit-news": redditNews,
})
