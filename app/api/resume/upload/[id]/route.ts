import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { validateFileType, validateFileSize, validateFileSignature, generateStorageKey, uploadFile } from "@/lib/resume";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
  });
  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  if (resume.status !== "UPLOADED") {
    return NextResponse.json({ error: "Resume already processed or in progress" }, { status: 409 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file
  const typeCheck = validateFileType(file.name, file.type);
  if (!typeCheck.valid) return NextResponse.json({ error: typeCheck.error }, { status: 400 });

  const sizeCheck = validateFileSize(file.size);
  if (!sizeCheck.valid) return NextResponse.json({ error: sizeCheck.error }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const sigCheck = await validateFileSignature(buffer, file.type);
  if (!sigCheck.valid) return NextResponse.json({ error: sigCheck.error }, { status: 400 });

  // Upload to storage
  const storageKey = generateStorageKey(session.id, file.name);
  await uploadFile(storageKey, Buffer.from(buffer), file.type);

  // Update resume with storage key and queue for extraction
  await db.resume.update({
    where: { id },
    data: {
      storageKey,
      status: "QUEUED",
    },
  });

  // Create processing job
  await db.resumeProcessingJob.create({
    data: {
      resumeId: id,
      type: "EXTRACTION",
      status: "PENDING",
      inputJson: { storageKey, mimeType: file.type },
    },
  });

  return NextResponse.json({ success: true, message: "File uploaded, extraction queued" });
}