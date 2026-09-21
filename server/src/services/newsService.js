import fs from 'fs/promises';
import path from 'path';

const RSS_FEED_URL = 'https://www.sciencedaily.com/rss/all.xml';
const NEWS_FILE_PATH = path.join(process.cwd(), 'src', 'config', 'news_context.json');

/**
 * Fetches and parses academic news from ScienceDaily RSS.
 * Filters for items within the last 4 months.
 */
export const fetchRecentNews = async () => {
    try {
        console.log(`[News-Service] Fetching latest news from ${RSS_FEED_URL}...`);
        const response = await fetch(RSS_FEED_URL);
        const xml = await response.text();

        // Simple Regex-based RSS parsing (to avoid extra dependencies)
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

        while ((match = itemRegex.exec(xml)) !== null) {
            const content = match[1];
            const title = content.match(/<title>(.*?)<\/title>/)?.[1] || "";
            const description = content.match(/<description>(.*?)<\/description>/)?.[1] || "";
            const pubDateStr = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
            const pubDate = new Date(pubDateStr);

            // Filter by date
            if (pubDate >= fourMonthsAgo) {
                items.push({
                    topic: "Science & Technology", // RSS feeds are generally broad
                    title: unescapeHtml(title),
                    content: unescapeHtml(description),
                    date: pubDate.toISOString().substring(0, 7) // e.g., "2026-03"
                });
            }
        }

        console.log(`[News-Service] Found ${items.length} relevant items from the last 4 months.`);
        return items;
    } catch (error) {
        console.error("[News-Service] Fetch Error:", error.message);
        return [];
    }
};

export const syncRecentNews = async () => {
    const news = await fetchRecentNews();
    if (news.length > 0) {
        await fs.writeFile(NEWS_FILE_PATH, JSON.stringify(news, null, 2));
        console.log(`[News-Service] Successfully updated ${NEWS_FILE_PATH}`);
    }
};

// Minimal HTML unescape
function unescapeHtml(safe) {
    return safe.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
}

export default { fetchRecentNews, syncRecentNews };
