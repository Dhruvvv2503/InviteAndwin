import { MetadataRoute } from 'next'

const BASE = 'https://inviteandwin.online'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
        { url: `${BASE}/join`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ]
}
