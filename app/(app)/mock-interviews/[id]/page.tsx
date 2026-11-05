import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MockInterviewRoomClient } from "@/components/mock-interview/mock-interview-room-client";

export default async function MockInterviewRoomPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ started?: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { id } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0" }}>
      <MockInterviewRoomClient sessionId={id} userId={record.id} />
    </div>
  );
}