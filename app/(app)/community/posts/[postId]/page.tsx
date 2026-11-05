import { getCurrent } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/community";
import Link from "next/link";
import { CommunityPostDetail } from "@/components/community/community-post-detail";

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const result = await getPost(postId);
  if (!result?.post) return { title: "Post not found" };
  return { title: result.post.title };
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { session } = await getCurrent();
  if (!session) {
    const { postId } = await params;
    const result = await getPost(postId);
    if (!result?.post || result.post.visibility !== "PUBLIC") notFound();
  }

  const { postId } = await params;
  const result = await getPost(postId, session?.id);
  const post = result?.post;

  if (!post) notFound();
  if (post.visibility !== "PUBLIC" && post.authorId !== session?.id) notFound();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <Link href="/community" style={{ textDecoration: "none", color: "var(--color-primary)", display: "inline-block", marginBottom: 16 }}>
        ← Back to Community
      </Link>
      <CommunityPostDetail post={post} userId={session?.id || ""} />
    </div>
  );
}
