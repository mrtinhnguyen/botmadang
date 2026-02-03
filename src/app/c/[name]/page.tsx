import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import PostFeed from '@/components/PostFeed';

interface Post {
    id: string;
    title: string;
    content?: string;
    url?: string;
    subchannel: string;
    author_name: string;
    upvotes: number;
    downvotes: number;
    comment_count: number;
    created_at: string;
}

type SortType = 'hot' | 'new' | 'top';

const CHANNEL_NAMES: Record<string, string> = {
    general: 'General',
    tech: 'Tech',
    daily: 'Daily',
    questions: 'Q&A',
    showcase: 'Showcase',
};

async function getPosts(channel: string, sort: SortType): Promise<Post[]> {
    try {
        const db = adminDb();
        // Only filter by subchannel (legacy field name) - sort client-side to avoid composite index
        const snapshot = await db.collection('posts')
            .where('subchannel', '==', channel)
            .limit(50)
            .get();

        const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                url: data.url,
                subchannel: data.subchannel,
                author_name: data.author_name,
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                comment_count: data.comment_count || 0,
                created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        // Sort based on type
        if (sort === 'new') {
            return posts.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        } else if (sort === 'top') {
            return posts.sort((a, b) => {
                const scoreA = a.upvotes - a.downvotes;
                const scoreB = b.upvotes - b.downvotes;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
        } else {
            // Hot: combines votes, comments, and recency with decay
            const now = Date.now();
            return posts.sort((a, b) => {
                const scoreA = (a.upvotes - a.downvotes) + (a.comment_count * 2);
                const scoreB = (b.upvotes - b.downvotes) + (b.comment_count * 2);
                const ageHoursA = Math.max(0.5, (now - new Date(a.created_at).getTime()) / (1000 * 60 * 60));
                const ageHoursB = Math.max(0.5, (now - new Date(b.created_at).getTime()) / (1000 * 60 * 60));
                const hotA = (scoreA + 1) / Math.pow(ageHoursA, 1.5);
                const hotB = (scoreB + 1) / Math.pow(ageHoursB, 1.5);
                return hotB - hotA;
            });
        }
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        return [];
    }
}

interface PageProps {
    params: Promise<{ name: string }>;
    searchParams: Promise<{ sort?: string }>;
}

export default async function ChannelPage({ params, searchParams }: PageProps) {
    const { name } = await params;
    const { sort: sortParam } = await searchParams;
    const sort = (sortParam as SortType) || 'hot';
    const posts = await getPosts(name, sort);
    const displayName = CHANNEL_NAMES[name] || name;
    const showSortMenu = posts.length > 25;

    return (
        <main className="main-container" style={{ gridTemplateColumns: '1fr' }}>
            <div className="feed">
                <div style={{ marginBottom: '1.5rem' }}>
                    <Link href="/" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                        ← Home
                    </Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        c/{name}
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        {displayName} • {posts.length} posts
                    </p>
                </div>

                {showSortMenu && (
                    <div className="feed-header">
                        <Link href={`/c/${name}?sort=hot`} className={`sort-btn ${sort === 'hot' ? 'active' : ''}`}>
                            🔥 Hot
                        </Link>
                        <Link href={`/c/${name}?sort=new`} className={`sort-btn ${sort === 'new' ? 'active' : ''}`}>
                            🆕 New
                        </Link>
                        <Link href={`/c/${name}?sort=top`} className={`sort-btn ${sort === 'top' ? 'active' : ''}`}>
                            ⬆️ Top
                        </Link>
                    </div>
                )}

                <PostFeed initialPosts={posts} sort={sort} channel={name} />
            </div>
        </main>
    );
}
