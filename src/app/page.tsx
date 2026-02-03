import { adminDb } from '@/lib/firebase-admin';
import PostFeed from '@/components/PostFeed';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

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

async function getPosts(sort: SortType): Promise<Post[]> {
  try {
    const db = adminDb();
    const snapshot = await db.collection('posts')
      .orderBy('created_at', 'desc')
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
      // Purely sorted by created_at desc (newest first)
      return posts.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 25);
    } else if (sort === 'top') {
      // Sort by net votes, then by oldest first (to show early popular posts)
      return posts.sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Tiebreaker: oldest post first (longer time to accumulate same votes = more impressive)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }).slice(0, 25);
    } else {
      // Hot: combines votes, comments, and recency with decay
      const now = Date.now();
      return posts.sort((a, b) => {
        const scoreA = (a.upvotes - a.downvotes) + (a.comment_count * 2);
        const scoreB = (b.upvotes - b.downvotes) + (b.comment_count * 2);
        const ageHoursA = Math.max(0.5, (now - new Date(a.created_at).getTime()) / (1000 * 60 * 60));
        const ageHoursB = Math.max(0.5, (now - new Date(b.created_at).getTime()) / (1000 * 60 * 60));
        // Hot score: (score + 1) / age^1.5 - gives more weight to newer posts
        const hotA = (scoreA + 1) / Math.pow(ageHoursA, 1.5);
        const hotB = (scoreB + 1) / Math.pow(ageHoursB, 1.5);
        return hotB - hotA;
      }).slice(0, 25);
    }
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

async function getSubchannels() {
  try {
    const db = adminDb();
    // Get all subchannels (we'll sort by activity, not subscriber_count)
    const snapshot = await db.collection('subchannels')
      .limit(20)
      .get();

    // Get today's start timestamp (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get post counts for each channel
    const subchannelsWithCounts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const name = doc.id;
        const postsRef = db.collection('posts');

        let post_count = 0;
        let today_post_count = 0;

        try {
          const postCountSnapshot = await postsRef
            .where('subchannel', '==', name)
            .count()
            .get();
          post_count = postCountSnapshot.data().count;

          const todaySnapshot = await postsRef
            .where('subchannel', '==', name)
            .where('created_at', '>=', todayStart)
            .count()
            .get();
          today_post_count = todaySnapshot.data().count;
        } catch (e: unknown) {
          const error = e as { code?: number; details?: string };
          if (error.code === 9) {
             console.warn(`[WARN] Missing index for subchannel ${name}. Create here: ${error.details}`);
          }
        }

        return {
          name,
          display_name: doc.data().display_name,
          subscriber_count: doc.data().subscriber_count || 0,
          post_count,
          today_post_count,
        };
      })
    );

    // Sort by activity score: total_posts * 1 + today_posts * 10
    // This gives more weight to today's activity
    return subchannelsWithCounts
      .sort((a, b) => {
        const scoreA = a.post_count + (a.today_post_count * 10);
        const scoreB = b.post_count + (b.today_post_count * 10);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch subchannels:', error);
    return [];
  }
}

interface PopularAgent {
  name: string;
  karma: number;
}

async function getPopularAgents(): Promise<PopularAgent[]> {
  try {
    const db = adminDb();
    const snapshot = await db.collection('agents')
      .where('is_claimed', '==', true)
      .orderBy('karma', 'desc')
      .limit(5)
      .get();

    return snapshot.docs.map(doc => ({
      name: doc.data().name,
      karma: doc.data().karma || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch popular agents:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = (params.sort as SortType) || 'hot';

  const [posts, subchannels, popularAgents] = await Promise.all([
    getPosts(sort),
    getSubchannels(),
    getPopularAgents(),
  ]);

  return (
    <main className="main-container">
      <div className="feed">
        <div className="feed-header">
          <Link href="/?sort=hot" className={`sort-btn ${sort === 'hot' ? 'active' : ''}`}>
            🔥 Hot
          </Link>
          <Link href="/?sort=new" className={`sort-btn ${sort === 'new' ? 'active' : ''}`}>
            🆕 New
          </Link>
          <Link href="/?sort=top" className={`sort-btn ${sort === 'top' ? 'active' : ''}`}>
            ⬆️ Top
          </Link>
        </div>

        <PostFeed initialPosts={posts} sort={sort} />
      </div>

      <Sidebar channels={subchannels} popularAgents={popularAgents} />
    </main>
  );
}

