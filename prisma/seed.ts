// Development seed only. Creates two users WITHOUT passwords, so nobody can sign in with them.
// Use the real sign up flow to create accounts you can sign in with.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production");

  await db.user.upsert({
    where: { email: "student.seed@example.com" },
    update: {},
    create: {
      email: "student.seed@example.com",
      name: "Seed Student",
      careerStage: "STUDENT",
      emailVerified: new Date(),
      onboardingCompletedAt: new Date(),
      profile: {
        create: {
          careerDomain: "Software engineering",
          targetRole: "Software engineer",
          experienceLevel: "BEGINNER",
          educationLevel: "BACHELORS",
          degree: "Computer Science",
        },
      },
      goals: { create: [{ category: "CODING_DSA" }, { category: "APTITUDE_REASONING" }] },
      preference: { create: {} },
    },
  });
  await db.user.upsert({
    where: { email: "professional.seed@example.com" },
    update: {},
    create: {
      email: "professional.seed@example.com",
      name: "Seed Professional",
      careerStage: "PROFESSIONAL",
      emailVerified: new Date(),
      onboardingCompletedAt: new Date(),
      profile: {
        create: {
          careerDomain: "Software engineering",
          targetRole: "Engineering manager",
          experienceLevel: "ADVANCED",
          currentRole: "Backend developer",
          yearsOfExperience: 6,
          skillsToImprove: ["System design", "People management"],
        },
      },
      goals: { create: [{ category: "SYSTEM_DESIGN" }, { category: "BEHAVIORAL_HR" }] },
      preference: { create: {} },
    },
  });
  console.log("Seeded 2 development users (no passwords).");

  const topics = [
    { name: "Data Structures & Algorithms", slug: "dsa", description: "Discuss algorithms, data structures, and coding interview problems", category: "Technical", color: "#3B82F6", icon: "code" },
    { name: "JavaScript", slug: "javascript", description: "JavaScript discussions, tips, and best practices", category: "Technical", color: "#F59E0B", icon: "file-code" },
    { name: "Python", slug: "python", description: "Python programming and interview preparation", category: "Technical", color: "#10B981", icon: "snake" },
    { name: "Java", slug: "java", description: "Java programming discussions", category: "Technical", color: "#EF4444", icon: "coffee" },
    { name: "React", slug: "react", description: "React.js discussions and best practices", category: "Technical", color: "#38BDF8", icon: "atom" },
    { name: "Next.js", slug: "nextjs", description: "Next.js framework discussions", category: "Technical", color: "#10B981", icon: "layout" },
    { name: "Backend Development", slug: "backend", description: "Backend architecture, APIs, and server-side development", category: "Technical", color: "#8B5CF6", icon: "server" },
    { name: "System Design", slug: "system-design", description: "System design concepts and interview prep", category: "Technical", color: "#EC4899", icon: "network" },
    { name: "Database Management", slug: "database", description: "SQL, NoSQL, and database design", category: "Technical", color: "#8B5CF6", icon: "database" },
    { name: "SQL", slug: "sql", description: "SQL queries, optimization, and interview questions", category: "Technical", color: "#06B6D4", icon: "table" },
    { name: "Cloud Computing", slug: "cloud", description: "AWS, Azure, GCP and cloud architecture", category: "Technical", color: "#F59E0B", icon: "cloud" },
    { name: "DevOps", slug: "devops", description: "CI/CD, deployment, and infrastructure", category: "Technical", color: "#6366F1", icon: "settings" },
    { name: "AI & Machine Learning", slug: "ai-ml", description: "AI, ML, and data science discussions", category: "Technical", color: "#EC4899", icon: "brain" },
    { name: "Cybersecurity", slug: "cybersecurity", description: "Security best practices and interview prep", category: "Technical", color: "#EF4444", icon: "shield" },
    { name: "Aptitude", slug: "aptitude", description: "Quantitative and logical aptitude", category: "Non-Technical", color: "#10B981", icon: "calculator" },
    { name: "Logical Reasoning", slug: "reasoning", description: "Logical reasoning and problem solving", category: "Non-Technical", color: "#3B82F6", icon: "brain-circuit" },
    { name: "Verbal Ability", slug: "verbal", description: "English proficiency and communication skills", category: "Non-Technical", color: "#F59E0B", icon: "book-open" },
    { name: "Communication Skills", slug: "communication", description: "Verbal and written communication", category: "Non-Technical", color: "#06B6D4", icon: "message-circle" },
    { name: "HR Interviews", slug: "hr-interviews", description: "HR interview preparation and questions", category: "Non-Technical", color: "#8B5CF6", icon: "users" },
    { name: "Behavioral Interviews", slug: "behavioral", description: "Behavioral interview prep and frameworks", category: "Non-Technical", color: "#EC4899", icon: "user-check" },
    { name: "Group Discussions", slug: "gd", description: "Group discussion topics and strategies", category: "Non-Technical", color: "#EF4444", icon: "users" },
    { name: "Resume Preparation", slug: "resume", description: "Resume writing and optimization tips", category: "Career Development", color: "#38BDF8", icon: "file-text" },
    { name: "Job Preparation", slug: "job-prep", description: "Job search strategies and interview prep", category: "Career Development", color: "#10B981", icon: "briefcase" },
    { name: "Career Switching", slug: "career-switch", description: "Transitioning between roles and industries", category: "Career Development", color: "#6366F1", icon: "refresh-cw" },
    { name: "Professional Development", slug: "professional-dev", description: "Career growth and leadership skills", category: "Career Development", color: "#F59E0B", icon: "trending-up" },
  ];

  for (const t of topics) {
    await db.communityTopic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }
  console.log(`Seeded ${topics.length} community topics.`);
}

main().finally(() => db.$disconnect());
