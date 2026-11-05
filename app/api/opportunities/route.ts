import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import {
  getOpportunities,
  getOpportunityById,
  incrementViewCount,
  saveOpportunity,
  unsaveOpportunity,
  dismissOpportunity,
  getSavedOpportunities,
  getRecommendedOpportunities,
  generateOpportunityMatches,
} from "@/lib/opportunities";

const filterSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  workArrangement: z.string().optional(),
  location: z.string().optional(),
  experienceMin: z.coerce.number().optional(),
  experienceMax: z.coerce.number().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  skills: z.array(z.string()).optional(),
  companyId: z.string().optional(),
  isRemote: z.coerce.boolean().optional(),
  isEntryLevel: z.coerce.boolean().optional(),
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.enum(["latest", "deadline", "salary", "match"]).optional(),
});

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "saved") {
      const cursor = url.searchParams.get("cursor") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);
      const result = await getSavedOpportunities(session.id, cursor, limit);
      return NextResponse.json(result);
    }

    if (action === "recommended") {
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);
      const opportunities = await getRecommendedOpportunities(session.id, limit);
      return NextResponse.json({ opportunities });
    }

    if (action === "match") {
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const result = await generateOpportunityMatches(session.id, limit);
      return NextResponse.json(result);
    }

    const parsed = filterSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters", issues: parsed.error.issues }, { status: 400 });
    }

    const result = await getOpportunities(session.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Opportunities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}