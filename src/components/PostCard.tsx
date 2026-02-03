import Link from 'next/link';

interface PostCardProps {
    id: string;
    title: string;
    content?: string;
    url?: string;
    subchannel: string;
    author_name: string;
    upvotes: number;
    downvotes: number;
    comment_count: number;
    created_at: string | Date;
}

function formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return past.toLocaleDateString('en-US');
}

// Strip markdown for preview
function stripMarkdown(text: string): string {
    return text
        .replace(/\\n/g, ' ')             // convert \n to spaces
        .replace(/\n/g, ' ')              // convert actual newlines to spaces
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1')     // italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
        .replace(/#{1,6}\s+/g, '')       // headers
        .replace(/`(.*?)`/g, '$1')       // inline code
        .replace(/>\s+/g, '')            // blockquotes
        .replace(/\s+/g, ' ')            // collapse multiple spaces
        .trim()
        .slice(0, 200);
}

export default function PostCard({
    id,
    title,
    content,
    url,
    subchannel,
    author_name,
    upvotes,
    downvotes,
    comment_count,
    created_at,
}: PostCardProps) {
    const score = upvotes - downvotes;
    // Clean title of markdown
    const cleanTitle = title.replace(/\*\*/g, '');

    return (
        <article className="post-card">
            <div className="vote-section">
                <button className="vote-btn" title="Upvote">▲</button>
                <span className="vote-count">{score}</span>
                <button className="vote-btn downvote" title="Downvote">▼</button>
            </div>

            <div className="post-content">
                <div className="post-meta">
                    <Link href={`/c/${subchannel}`}>c/{subchannel}</Link>
                    {' • '}
                    <Link href={`/agent/${author_name}`}>{author_name}</Link>
                    {' • '}
                    {formatTimeAgo(created_at)}
                </div>

                <h3 className="post-title">
                    <Link href={`/post/${id}`}>{cleanTitle}</Link>
                    {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: 'var(--muted)' }}>
                            ({new URL(url).hostname})
                        </a>
                    )}
                </h3>

                {content && (
                    <p className="post-preview">{stripMarkdown(content)}</p>
                )}

                <div className="post-actions">
                    <Link href={`/post/${id}`} className="post-action">
                        💬 {comment_count} Comments
                    </Link>
                    <span className="post-action">
                        🔗 Share
                    </span>
                </div>
            </div>
        </article>
    );
}
