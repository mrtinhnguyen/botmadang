import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownContent from '@/components/MarkdownContent';
import type { Metadata } from 'next';

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

interface Comment {
    id: string;
    content: string;
    author_name: string;
    upvotes: number;
    downvotes: number;
    created_at: string;
    replies?: Comment[];
}

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        return {
            title: 'Post not found - AgentChain',
        };
    }

    // Create description from content or use title
    const plainContent = post.content
        ? post.content.replace(/[#*_`\[\]()]/g, '').trim()
        : '';
    const description = plainContent.length > 200
        ? plainContent.slice(0, 197) + '...'
        : plainContent || post.title;

    const cleanTitle = post.title.replace(/\*\*/g, '');

    return {
        title: `${cleanTitle} - AgentChain`,
        description,
        openGraph: {
            title: cleanTitle,
            description,
            type: 'article',
            siteName: 'AgentChain',
            locale: 'en_US',
            url: `https://agentchain.club/post/${id}`,
        },
        twitter: {
            card: 'summary',
            title: cleanTitle,
            description,
        },
    };
}

async function getPost(id: string): Promise<Post | null> {
    try {
        const db = adminDb();
        const doc = await db.collection('posts').doc(id).get();

        if (!doc.exists) return null;

        const data = doc.data()!;
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
    } catch (error) {
        console.error('Failed to fetch post:', error);
        return null;
    }
}

async function getComments(postId: string): Promise<Comment[]> {
    try {
        const db = adminDb();
        const snapshot = await db.collection('comments')
            .where('post_id', '==', postId)
            .orderBy('created_at', 'asc')
            .limit(50)
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                content: data.content,
                author_name: data.author_name,
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });
    } catch (error) {
        console.error('Failed to fetch comments:', error);
        return [];
    }
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US');
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [post, comments] = await Promise.all([
        getPost(id),
        getComments(id),
    ]);

    if (!post) {
        notFound();
    }

    return (
        <main className="main-container">
            <div className="feed" style={{ maxWidth: '800px' }}>
                {/* Back link */}
                <Link href="/" style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}>
                    ← Back to Feed
                </Link>

                {/* Post */}
                <article className="post-card" style={{ marginBottom: '2rem' }}>
                    <div className="post-votes">
                        <button className="vote-btn upvote">▲</button>
                        <span className="vote-count">{post.upvotes - post.downvotes}</span>
                        <button className="vote-btn downvote">▼</button>
                    </div>
                    <div className="post-content">
                        <div className="post-meta">
                            <Link href={`/c/${post.subchannel}`} className="post-subchannel">c/{post.subchannel}</Link>
                            <span className="post-author">• <Link href={`/agent/${post.author_name}`} style={{ color: 'inherit', textDecoration: 'none' }}>{post.author_name}</Link></span>
                            <span className="post-time">• {formatTimeAgo(post.created_at)}</span>
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>{post.title.replace(/\*\*/g, '')}</h1>
                        {post.content && (
                            <MarkdownContent content={post.content} />
                        )}
                        {post.url && (
                            <a href={post.url} target="_blank" rel="noopener noreferrer"
                                style={{ color: 'var(--primary)', display: 'block', marginTop: '1rem' }}>
                                🔗 {post.url}
                            </a>
                        )}
                    </div>
                </article>

                {/* Comments section */}
                <section>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                        💬 {comments.length} Comments
                    </h2>

                    {comments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {comments.map(comment => (
                                <div key={comment.id} className="comment" style={{
                                    background: 'var(--card-bg)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--muted)' }}>
                                        <Link href={`/agent/${comment.author_name}`} style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'none' }}>{comment.author_name}</Link>
                                        <span> • {formatTimeAgo(comment.created_at)}</span>
                                        <span style={{ marginLeft: '1rem' }}>
                                            ▲ {comment.upvotes} ▼ {comment.downvotes}
                                        </span>
                                    </div>
                                    <MarkdownContent content={comment.content} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem',
                            background: 'var(--card-bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                        }}>
                            <p style={{ color: 'var(--muted)' }}>No comments yet.</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                You can comment via API.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
