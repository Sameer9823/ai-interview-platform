import type { Difficulty, QuestionType, SourceType, Permission } from "./types";

/** Research leads from the Phase 2 brief. NONE of these has been reviewed or approved. Link only entries are for linking, not copying. */
interface SeedSource {
  slug: string;
  title: string;
  url: string;
  type: SourceType;
  permission: Permission;
  publisher: string;
  note: string;
}
const LEAD =
  "Research lead from the Phase 2 brief. Terms, licensing and API availability have not been reviewed. Do not import from this source until an administrator completes a review.";
const LINK = "Linked as a pointer to the company's own page. Terms have not been reviewed, so nothing is copied from it.";
const co = (slug: string, title: string, url: string, publisher: string): SeedSource => ({
  slug,
  title,
  url,
  type: "OFFICIAL_CAREERS",
  permission: "LINK_ONLY",
  publisher,
  note: LINK,
});
const lead = (slug: string, title: string, url: string, type: SourceType, permission: Permission, publisher: string): SeedSource => ({
  slug,
  title,
  url,
  type,
  permission,
  publisher,
  note: LEAD,
});

export const SEED_SOURCES: SeedSource[] = [
  {
    slug: "platform-original",
    title: "Original practice content written for this platform",
    url: "https://example.invalid/platform-original",
    type: "PLATFORM_ORIGINAL",
    permission: "APPROVED",
    publisher: "This platform",
    note: "Questions written by the platform team. They are not taken from any company or third party.",
  },
  co("amazon-careers", "Amazon: how we hire", "https://www.amazon.jobs/content/en/how-we-hire/", "Amazon"),
  co("google-careers", "Google Careers", "https://careers.google.com/", "Google"),
  co("microsoft-careers", "Microsoft Careers", "https://careers.microsoft.com/", "Microsoft"),
  co("tcs-careers", "TCS Careers India", "https://www.tcs.com/careers/india", "Tata Consultancy Services"),
  co("infosys-careers", "Infosys Careers", "https://www.infosys.com/careers/", "Infosys"),
  co("wipro-careers", "Wipro Careers", "https://careers.wipro.com/", "Wipro"),
  co("accenture-careers", "Accenture Careers India", "https://www.accenture.com/in-en/careers", "Accenture"),
  co("cognizant-careers", "Cognizant Careers", "https://careers.cognizant.com/", "Cognizant"),
  co("capgemini-careers", "Capgemini Careers", "https://www.capgemini.com/careers/", "Capgemini"),
  co("deloitte-careers", "Deloitte Careers", "https://www.deloitte.com/global/en/careers.html", "Deloitte"),
  co("ibm-careers", "IBM Careers", "https://www.ibm.com/careers", "IBM"),
  co("oracle-careers", "Oracle Careers", "https://www.oracle.com/careers/", "Oracle"),
  co("adobe-careers", "Adobe Careers", "https://careers.adobe.com/", "Adobe"),
  co("flipkart-careers", "Flipkart Careers", "https://www.flipkartcareers.com/", "Flipkart"),
  co("swiggy-careers", "Swiggy Careers", "https://careers.swiggy.com/", "Swiggy"),
  co("razorpay-careers", "Razorpay Jobs", "https://razorpay.com/jobs/", "Razorpay"),
  lead(
    "gfg-experiences",
    "GeeksforGeeks interview experiences",
    "https://www.geeksforgeeks.org/category/experiences/interview-experiences/",
    "PUBLIC_EXPERIENCE",
    "MANUAL_REVIEW_REQUIRED",
    "GeeksforGeeks",
  ),
  lead(
    "glassdoor-interviews",
    "Glassdoor interviews",
    "https://www.glassdoor.com/Interview/index.htm",
    "PUBLIC_EXPERIENCE",
    "MANUAL_REVIEW_REQUIRED",
    "Glassdoor",
  ),
  lead("ambitionbox", "AmbitionBox", "https://www.ambitionbox.com/", "PUBLIC_EXPERIENCE", "MANUAL_REVIEW_REQUIRED", "AmbitionBox"),
  lead("leetcode-discuss", "LeetCode Discuss", "https://leetcode.com/discuss/", "PUBLIC_EXPERIENCE", "MANUAL_REVIEW_REQUIRED", "LeetCode"),
  lead(
    "github-experiences",
    "GitHub search: interview experiences",
    "https://github.com/search?q=interview+experiences&type=repositories",
    "GITHUB_REPO",
    "UNKNOWN",
    "GitHub (many authors)",
  ),
  lead(
    "github-questions",
    "GitHub search: interview questions",
    "https://github.com/search?q=interview+questions&type=repositories",
    "GITHUB_REPO",
    "UNKNOWN",
    "GitHub (many authors)",
  ),
  lead(
    "hackerrank-kit",
    "HackerRank interview preparation kit",
    "https://www.hackerrank.com/interview/interview-preparation-kit",
    "EDUCATIONAL",
    "LINK_ONLY",
    "HackerRank",
  ),
  lead("leetcode", "LeetCode", "https://leetcode.com/", "EDUCATIONAL", "LINK_ONLY", "LeetCode"),
  lead("geeksforgeeks", "GeeksforGeeks", "https://www.geeksforgeeks.org/", "EDUCATIONAL", "LINK_ONLY", "GeeksforGeeks"),
  lead("indiabix", "IndiaBIX", "https://www.indiabix.com/", "EDUCATIONAL", "LINK_ONLY", "IndiaBIX"),
  lead("codewars", "Codewars", "https://www.codewars.com/", "EDUCATIONAL", "LINK_ONLY", "Codewars"),
  lead("project-euler", "Project Euler", "https://projecteuler.net/", "EDUCATIONAL", "LINK_ONLY", "Project Euler"),
  lead("w3schools", "W3Schools", "https://www.w3schools.com/", "EDUCATIONAL", "LINK_ONLY", "W3Schools"),
  lead("mdn", "MDN Web Docs", "https://developer.mozilla.org/", "OFFICIAL_DOCS", "LINK_ONLY", "Mozilla"),
  lead("sqlbolt", "SQLBolt", "https://sqlbolt.com/", "EDUCATIONAL", "LINK_ONLY", "SQLBolt"),
  lead("roadmap-sh", "roadmap.sh", "https://roadmap.sh/", "EDUCATIONAL", "LINK_ONLY", "roadmap.sh"),
  lead(
    "huggingface-datasets",
    "Hugging Face datasets",
    "https://huggingface.co/datasets",
    "OPEN_DATASET",
    "MANUAL_REVIEW_REQUIRED",
    "Hugging Face (many authors)",
  ),
  lead(
    "kaggle-datasets",
    "Kaggle datasets",
    "https://www.kaggle.com/datasets",
    "OPEN_DATASET",
    "MANUAL_REVIEW_REQUIRED",
    "Kaggle (many authors)",
  ),
  lead(
    "google-dataset-search",
    "Google Dataset Search",
    "https://datasetsearch.research.google.com/",
    "OPEN_DATASET",
    "MANUAL_REVIEW_REQUIRED",
    "Google",
  ),
  lead(
    "github-coding",
    "GitHub search: coding interview",
    "https://github.com/search?q=coding+interview&type=repositories",
    "GITHUB_REPO",
    "UNKNOWN",
    "GitHub (many authors)",
  ),
  lead(
    "github-aptitude",
    "GitHub search: aptitude questions",
    "https://github.com/search?q=aptitude+questions&type=repositories",
    "GITHUB_REPO",
    "UNKNOWN",
    "GitHub (many authors)",
  ),
];

export const SEED_COMPANIES: { slug: string; name: string; website: string; industry: string; source: string }[] = [
  {
    slug: "amazon",
    name: "Amazon",
    website: "https://www.amazon.com",
    industry: "E-commerce and cloud computing",
    source: "amazon-careers",
  },
  { slug: "google", name: "Google", website: "https://www.google.com", industry: "Technology", source: "google-careers" },
  { slug: "microsoft", name: "Microsoft", website: "https://www.microsoft.com", industry: "Technology", source: "microsoft-careers" },
  { slug: "tcs", name: "Tata Consultancy Services (TCS)", website: "https://www.tcs.com", industry: "IT services", source: "tcs-careers" },
  { slug: "infosys", name: "Infosys", website: "https://www.infosys.com", industry: "IT services", source: "infosys-careers" },
  { slug: "wipro", name: "Wipro", website: "https://www.wipro.com", industry: "IT services", source: "wipro-careers" },
  {
    slug: "accenture",
    name: "Accenture",
    website: "https://www.accenture.com",
    industry: "Consulting and IT services",
    source: "accenture-careers",
  },
  { slug: "cognizant", name: "Cognizant", website: "https://www.cognizant.com", industry: "IT services", source: "cognizant-careers" },
  {
    slug: "capgemini",
    name: "Capgemini",
    website: "https://www.capgemini.com",
    industry: "Consulting and IT services",
    source: "capgemini-careers",
  },
  {
    slug: "deloitte",
    name: "Deloitte",
    website: "https://www.deloitte.com",
    industry: "Professional services",
    source: "deloitte-careers",
  },
  { slug: "ibm", name: "IBM", website: "https://www.ibm.com", industry: "Technology", source: "ibm-careers" },
  { slug: "oracle", name: "Oracle", website: "https://www.oracle.com", industry: "Enterprise software", source: "oracle-careers" },
  { slug: "adobe", name: "Adobe", website: "https://www.adobe.com", industry: "Software", source: "adobe-careers" },
  { slug: "flipkart", name: "Flipkart", website: "https://www.flipkart.com", industry: "E-commerce", source: "flipkart-careers" },
  {
    slug: "swiggy",
    name: "Swiggy",
    website: "https://www.swiggy.com",
    industry: "Food delivery and quick commerce",
    source: "swiggy-careers",
  },
  { slug: "razorpay", name: "Razorpay", website: "https://razorpay.com", industry: "Financial technology", source: "razorpay-careers" },
];
export const COMPANY_CAREERS: Record<string, string> = Object.fromEntries(
  SEED_SOURCES.filter((s) => s.type === "OFFICIAL_CAREERS").map((s) => [s.slug, s.url]),
);

/** [slug, name, parent slug | null] */
export const SEED_CATEGORIES: [string, string, string | null][] = [
  ["general-preparation", "General preparation", null],
  ["technical", "Technical", null],
  ["professional-and-business", "Professional and business", null],
  ["aptitude", "Aptitude", "general-preparation"],
  ["quantitative-aptitude", "Quantitative aptitude", "aptitude"],
  ["logical-reasoning", "Logical reasoning", "aptitude"],
  ["verbal-ability", "Verbal ability", "aptitude"],
  ["communication", "Communication", "general-preparation"],
  ["problem-solving", "Problem solving", "general-preparation"],
  ["programming-fundamentals", "Programming fundamentals", "technical"],
  ["data-structures-algorithms", "Data structures and algorithms", "technical"],
  ["object-oriented-programming", "Object oriented programming", "technical"],
  ["operating-systems", "Operating systems", "technical"],
  ["computer-networks", "Computer networks", "technical"],
  ["dbms", "DBMS", "technical"],
  ["sql", "SQL", "technical"],
  ["system-design", "System design", "technical"],
  ["frontend-development", "Frontend development", "technical"],
  ["backend-development", "Backend development", "technical"],
  ["full-stack-development", "Full stack development", "technical"],
  ["mobile-development", "Mobile development", "technical"],
  ["cloud-computing", "Cloud computing", "technical"],
  ["devops", "DevOps", "technical"],
  ["cybersecurity", "Cybersecurity", "technical"],
  ["data-science", "Data science", "technical"],
  ["machine-learning", "Machine learning", "technical"],
  ["artificial-intelligence", "Artificial intelligence", "technical"],
  ["software-testing", "Software testing", "technical"],
  ["behavioral-interviews", "Behavioral interviews", "professional-and-business"],
  ["hr-interviews", "HR interviews", "professional-and-business"],
  ["leadership", "Leadership", "professional-and-business"],
  ["managerial-interviews", "Managerial interviews", "professional-and-business"],
  ["sales", "Sales", "professional-and-business"],
  ["marketing", "Marketing", "professional-and-business"],
  ["finance", "Finance", "professional-and-business"],
  ["human-resources", "Human resources", "professional-and-business"],
  ["operations", "Operations", "professional-and-business"],
  ["domain-specific", "Domain specific and customer facing roles", "professional-and-business"],
];

interface Q {
  slug: string;
  cat: string;
  type: QuestionType;
  diff: Difficulty;
  text: string;
  outline: string;
  explanation?: string;
  example?: string;
  code?: string;
  lang?: string;
  tests?: string[];
  hints?: string[];
  options?: string[];
  minutes: number;
  roles?: string[];
  stages?: ("STUDENT" | "FRESHER" | "PROFESSIONAL")[];
  skills?: string[];
  tags?: string[];
}
const S: ("STUDENT" | "FRESHER")[] = ["STUDENT", "FRESHER"];
const ALL: ("STUDENT" | "FRESHER" | "PROFESSIONAL")[] = ["STUDENT", "FRESHER", "PROFESSIONAL"];

/** Original practice questions written for this platform. None is claimed to come from a real company interview. */
export const SEED_QUESTIONS: Q[] = [
  {
    slug: "train-speed-pole",
    cat: "quantitative-aptitude",
    type: "SINGLE_ANSWER",
    diff: "BEGINNER",
    minutes: 3,
    stages: S,
    skills: ["speed and distance"],
    tags: ["aptitude", "numbers"],
    text: "A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?",
    outline: "36 km/h.",
    explanation:
      "Passing a pole means the train covers its own length. Speed = 150 m / 15 s = 10 m/s. Multiply by 3.6 to convert to km/h: 10 x 3.6 = 36.",
    hints: ["The distance covered equals the train's length.", "Multiply m/s by 3.6 to get km/h."],
  },
  {
    slug: "percent-up-then-down",
    cat: "quantitative-aptitude",
    type: "SINGLE_ANSWER",
    diff: "BEGINNER",
    minutes: 3,
    stages: S,
    skills: ["percentages"],
    tags: ["aptitude", "numbers"],
    text: "The price of an item rises by 20 percent and then falls by 20 percent. What is the net percentage change?",
    outline: "A decrease of 4 percent.",
    explanation:
      "Start at 100. After the rise it is 120. A 20 percent fall takes off 24, leaving 96. The net change is 96 - 100 = -4, a 4 percent decrease.",
    hints: ["The second percentage applies to the new price, not the original."],
  },
  {
    slug: "tank-pipes-and-drain",
    cat: "quantitative-aptitude",
    type: "SINGLE_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 5,
    stages: S,
    skills: ["time and work"],
    tags: ["aptitude", "numbers"],
    text: "Two pipes can fill a tank in 12 minutes and 15 minutes. A drain can empty a full tank in 20 minutes. With all three open, how long does the tank take to fill?",
    outline: "10 minutes.",
    explanation:
      "Add the filling rates and subtract the draining rate: 1/12 + 1/15 - 1/20 = 5/60 + 4/60 - 3/60 = 6/60 = 1/10 of the tank per minute. So the tank fills in 10 minutes.",
    hints: ["Think in tanks per minute.", "Use 60 as a common denominator."],
  },
  {
    slug: "letter-code-shift",
    cat: "logical-reasoning",
    type: "SINGLE_ANSWER",
    diff: "BEGINNER",
    minutes: 2,
    stages: S,
    skills: ["coding and decoding"],
    tags: ["aptitude", "reasoning"],
    text: "In a certain code, CAT is written as DBU. How is DOG written in that code?",
    outline: "EPH.",
    explanation:
      "Each letter moves one place forward in the alphabet: C to D, A to B, T to U. Applying the same shift: D to E, O to P, G to H.",
    hints: ["Compare each letter of CAT with the matching letter of DBU."],
  },
  {
    slug: "number-series-products",
    cat: "logical-reasoning",
    type: "SINGLE_ANSWER",
    diff: "BEGINNER",
    minutes: 2,
    stages: S,
    skills: ["number series"],
    tags: ["aptitude", "reasoning"],
    text: "What comes next in the series 2, 6, 12, 20, 30, ...?",
    outline: "42.",
    explanation: "The terms are 1x2, 2x3, 3x4, 4x5, 5x6. The next term is 6x7 = 42. The gaps grow by 2 each time: 4, 6, 8, 10, 12.",
    hints: ["Try writing each number as a product of two neighbouring integers."],
  },
  {
    slug: "synonym-candid",
    cat: "verbal-ability",
    type: "MULTIPLE_CHOICE",
    diff: "BEGINNER",
    minutes: 1,
    stages: S,
    skills: ["vocabulary"],
    tags: ["aptitude", "verbal"],
    text: 'Choose the word closest in meaning to "candid".',
    options: ["*Frank", "Secretive", "Hesitant", "Careless"],
    outline: "Frank.",
    explanation: "Candid means open and honest in speech. Secretive is the opposite. Hesitant and careless describe different qualities.",
  },
  {
    slug: "pass-by-value-vs-reference",
    cat: "programming-fundamentals",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["functions", "memory"],
    tags: ["fundamentals"],
    roles: ["Software engineer"],
    text: "What is the difference between pass by value and pass by reference?",
    outline:
      "Pass by value gives the function a copy, so changes inside do not affect the caller's variable. Pass by reference gives access to the original, so changes are visible to the caller.",
    explanation:
      "Languages differ. C passes everything by value, and passes pointers by value to allow shared access. C++ has true references. Java and Python pass object references by value: the function can change the object but cannot rebind the caller's variable. A strong answer names the language it is describing.",
    hints: ["Say what happens to the caller's variable after the call."],
  },
  {
    slug: "reverse-linked-list",
    cat: "data-structures-algorithms",
    type: "CODING",
    diff: "INTERMEDIATE",
    minutes: 15,
    stages: ALL,
    skills: ["linked lists", "pointers"],
    tags: ["dsa", "linked-list"],
    roles: ["Software engineer"],
    text: "Reverse a singly linked list in place. Describe your approach and its time and space complexity.",
    outline: "Walk the list once, pointing each node back at the previous one. O(n) time, O(1) extra space.",
    explanation:
      "Keep three references: previous, current and next. At each step save current.next, point current.next at previous, then advance both. When current is empty, previous is the new head.",
    code: "def reverse_list(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev",
    lang: "python",
    tests: ["1->2->3 => 3->2->1", "1 => 1", "empty list => empty list"],
    hints: ["You need to remember the next node before you overwrite the pointer."],
  },
  {
    slug: "two-sum-indices",
    cat: "data-structures-algorithms",
    type: "CODING",
    diff: "INTERMEDIATE",
    minutes: 15,
    stages: ALL,
    skills: ["hash maps", "arrays"],
    tags: ["dsa", "hashing"],
    roles: ["Software engineer"],
    text: "Given an array of integers and a target, return the indices of two numbers that add up to the target. Assume exactly one solution exists.",
    outline:
      "Use a hash map from value to index. For each number, check whether target minus the number is already in the map. O(n) time, O(n) space.",
    explanation:
      "A brute force pair check is O(n squared). Storing values seen so far lets you answer the complement lookup in constant time, so a single pass is enough. Mention how you would handle duplicates and an empty input.",
    code: "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i",
    lang: "python",
    tests: ["[2,7,11,15], 9 => [0,1]", "[3,3], 6 => [0,1]", "[3,2,4], 6 => [1,2]"],
    hints: ["What would you need to look up quickly for each number?"],
  },
  {
    slug: "stack-vs-queue",
    cat: "data-structures-algorithms",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["stacks", "queues"],
    tags: ["dsa"],
    text: "Explain the difference between a stack and a queue. Give one real use of each.",
    outline:
      "A stack is last in, first out. A queue is first in, first out. Stack use: undo history or function call tracking. Queue use: print jobs or task scheduling.",
    explanation:
      "Both support adding and removing in constant time when built on a linked list or a circular array. The difference is which end removal happens at.",
  },
  {
    slug: "what-is-polymorphism",
    cat: "object-oriented-programming",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["oop"],
    tags: ["oop"],
    text: "Explain polymorphism with an example.",
    outline:
      "One interface, many behaviours. Example: a Shape interface with an area method implemented differently by Circle and Rectangle, and code that calls area on any Shape.",
    explanation:
      "Distinguish compile time polymorphism (overloading) from runtime polymorphism (overriding through inheritance or interfaces). The benefit is that calling code does not need to know the concrete type.",
  },
  {
    slug: "composition-over-inheritance",
    cat: "object-oriented-programming",
    type: "LONG_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 8,
    stages: ALL,
    skills: ["design"],
    tags: ["oop", "design"],
    roles: ["Software engineer"],
    text: "When would you prefer composition over inheritance? Give a concrete example.",
    outline:
      "Prefer composition when the relationship is has-a rather than is-a, when behaviour needs to change at runtime, or when inheritance would create deep or brittle hierarchies.",
    explanation:
      "Inheritance couples a subclass to its parent's internals. Composition lets you combine small parts and swap them. Example: a Logger object held by a service, instead of the service extending a base class just to log. A balanced answer also names cases where inheritance fits, such as a true subtype with shared behaviour.",
  },
  {
    slug: "deadlock-four-conditions",
    cat: "operating-systems",
    type: "SHORT_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 5,
    stages: ALL,
    skills: ["concurrency"],
    tags: ["os"],
    text: "What is a deadlock? List the four conditions that must hold for it to occur.",
    outline:
      "A deadlock is when processes wait on each other forever. The conditions are mutual exclusion, hold and wait, no preemption and circular wait.",
    explanation:
      "Breaking any one condition prevents deadlock. A common practical fix is to acquire locks in a fixed global order, which removes circular wait.",
  },
  {
    slug: "process-vs-thread",
    cat: "operating-systems",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["processes"],
    tags: ["os"],
    text: "What is the difference between a process and a thread?",
    outline:
      "A process has its own address space and resources. Threads live inside a process and share its memory, so they are lighter to create and switch but need synchronisation.",
    explanation:
      "Because threads share memory, bugs such as race conditions are possible. Processes are isolated, so one crashing usually does not affect another.",
  },
  {
    slug: "type-url-in-browser",
    cat: "computer-networks",
    type: "LONG_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 8,
    stages: ALL,
    skills: ["http", "dns", "tcp"],
    tags: ["networks"],
    text: "At a high level, what happens between typing a URL into a browser and seeing the page?",
    outline:
      "DNS lookup, TCP connection, TLS handshake for https, HTTP request, server response, then the browser parses HTML and loads further resources while rendering.",
    explanation:
      "A strong answer is ordered and mentions caching at each stage, redirects, and that rendering continues as resources arrive. You do not need every detail. Show that you understand the layers.",
  },
  {
    slug: "acid-properties",
    cat: "dbms",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 5,
    stages: S,
    skills: ["transactions"],
    tags: ["dbms"],
    text: "Explain the ACID properties of a database transaction.",
    outline:
      "Atomicity: all or nothing. Consistency: the database moves between valid states. Isolation: concurrent transactions do not see each other's partial work. Durability: committed data survives failures.",
    explanation: "Give a small example such as transferring money between two accounts, where both updates must succeed together.",
  },
  {
    slug: "second-highest-salary",
    cat: "sql",
    type: "SQL",
    diff: "INTERMEDIATE",
    minutes: 10,
    stages: ALL,
    skills: ["subqueries", "aggregation"],
    tags: ["sql"],
    text: "Write a query to find the second highest salary from an Employee table with columns id, name and salary.",
    outline: "Select the maximum salary that is below the overall maximum. Return NULL if there is no second value.",
    explanation:
      "The subquery finds the top salary and the outer query finds the highest value below it. Alternatives use DENSE_RANK or LIMIT with OFFSET. Mention how ties are treated.",
    code: "SELECT MAX(salary) AS second_highest\nFROM Employee\nWHERE salary < (SELECT MAX(salary) FROM Employee);",
    lang: "sql",
    hints: ["Can you first find the highest salary?"],
  },
  {
    slug: "inner-vs-left-join",
    cat: "sql",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 5,
    stages: S,
    skills: ["joins"],
    tags: ["sql"],
    text: "Explain the difference between INNER JOIN and LEFT JOIN with an example.",
    outline:
      "INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table and fills the right side with NULL where there is no match.",
    explanation:
      "Example: customers and orders. INNER JOIN lists only customers who have orders. LEFT JOIN lists all customers, with NULL order columns for those who have none.",
  },
  {
    slug: "design-url-shortener",
    cat: "system-design",
    type: "SYSTEM_DESIGN",
    diff: "ADVANCED",
    minutes: 30,
    stages: ["PROFESSIONAL"],
    skills: ["scalability", "storage", "caching"],
    tags: ["system-design"],
    roles: ["Software engineer", "Backend engineer"],
    text: "Design a URL shortening service.",
    outline:
      "Clarify requirements and scale. Define create and redirect APIs. Choose an ID scheme (counter encoded in base 62, or random IDs with collision checks). Pick storage and a cache for hot links. Decide redirect status code. Discuss scaling, expiry, analytics and abuse prevention.",
    explanation:
      "There is no single correct design. Interviewers usually evaluate how you clarify requirements, estimate load, justify trade-offs and handle failure. Be ready to compare counter based and hash based IDs, and to explain how reads (far more common than writes) are served from cache.",
  },
  {
    slug: "disagree-with-teammate",
    cat: "behavioral-interviews",
    type: "BEHAVIORAL",
    diff: "INTERMEDIATE",
    minutes: 6,
    stages: ALL,
    skills: ["collaboration"],
    tags: ["behavioral"],
    text: "Tell me about a time you disagreed with a teammate. How did you handle it?",
    outline:
      "Use the STAR framework: Situation, Task, Action, Result. Focus on understanding the other view, using evidence, and what you learned.",
    explanation:
      "Choose a real example with a clear outcome. Avoid blaming. Show that you listened, found shared goals and committed to the decision once made. Close with what you would do differently.",
  },
  {
    slug: "why-this-role",
    cat: "hr-interviews",
    type: "BEHAVIORAL",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["self awareness"],
    tags: ["hr"],
    text: "Why are you interested in this role?",
    outline:
      "Connect your skills and interests to the work itself. Give one or two specific reasons, show you understand what the role involves, and link it to where you want to grow.",
    explanation: "Avoid generic answers about salary or brand. Research the role's responsibilities first so your reasons are specific.",
  },
  {
    slug: "underperforming-team-member",
    cat: "managerial-interviews",
    type: "SCENARIO",
    diff: "ADVANCED",
    minutes: 8,
    stages: ["PROFESSIONAL"],
    skills: ["people management", "feedback"],
    tags: ["managerial"],
    text: "A team member's output has dropped for several weeks. How do you handle it?",
    outline:
      "Start with a private conversation to understand causes. Set clear expectations and a support plan with check-ins. Document progress. Escalate to HR only if the plan is not working.",
    explanation:
      "Show empathy and accountability together. Separate performance from personal circumstances, give specific feedback, and agree measurable goals and dates.",
  },
  {
    slug: "explain-api-simply",
    cat: "communication",
    type: "COMMUNICATION",
    diff: "BEGINNER",
    minutes: 5,
    stages: ALL,
    skills: ["clarity"],
    tags: ["communication"],
    text: "Explain what an API is to a non technical stakeholder in about two minutes.",
    outline:
      "Use an everyday analogy (a waiter taking your order to the kitchen), say what it lets two programs do, give one product example, and check understanding at the end.",
    explanation: "Avoid jargon. Lead with the benefit to the listener, keep sentences short and invite a question.",
  },
  {
    slug: "horizontal-vs-vertical-scaling",
    cat: "cloud-computing",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["scaling"],
    tags: ["cloud"],
    text: "What is the difference between horizontal and vertical scaling?",
    outline: "Vertical scaling adds more power to one machine. Horizontal scaling adds more machines and spreads the load.",
    explanation:
      "Vertical is simple but has a hardware ceiling and a single point of failure. Horizontal scales further and tolerates failures but needs load balancing and stateless or shared state design.",
  },
  {
    slug: "sql-injection-prevention",
    cat: "cybersecurity",
    type: "SHORT_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 5,
    stages: ALL,
    skills: ["web security"],
    tags: ["security"],
    text: "What is SQL injection and how do you prevent it?",
    outline:
      "Attackers insert SQL through user input that is concatenated into a query. Prevent it with parameterized queries, input validation, least privilege database accounts and avoiding dynamic SQL.",
    explanation:
      "Parameterized queries keep data separate from code, which is the key defence. Escaping alone is fragile. Mention ORMs and that error messages should not reveal query details.",
  },
  {
    slug: "overfitting-and-fixes",
    cat: "machine-learning",
    type: "SHORT_ANSWER",
    diff: "INTERMEDIATE",
    minutes: 5,
    stages: ALL,
    skills: ["model evaluation"],
    tags: ["ml"],
    text: "What is overfitting and how can you reduce it?",
    outline:
      "Overfitting is when a model fits training data, including noise, and performs worse on new data. Reduce it with more data, simpler models, regularization, cross validation and early stopping.",
    explanation:
      "Detect it by comparing training and validation error. A growing gap is the signal. Feature selection and data augmentation also help.",
  },
  {
    slug: "double-vs-triple-equals",
    cat: "frontend-development",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 3,
    stages: S,
    skills: ["javascript"],
    tags: ["frontend", "javascript"],
    text: "What is the difference between == and === in JavaScript?",
    outline: "== compares after converting types. === compares value and type with no conversion. Prefer ===.",
    explanation:
      'For example, 0 == "0" is true but 0 === "0" is false. Loose equality has surprising rules, which is why strict equality is the usual default.',
  },
  {
    slug: "unit-vs-integration-tests",
    cat: "software-testing",
    type: "SHORT_ANSWER",
    diff: "BEGINNER",
    minutes: 4,
    stages: S,
    skills: ["testing"],
    tags: ["testing"],
    text: "What is the difference between unit tests and integration tests?",
    outline:
      "Unit tests check one small piece in isolation. Integration tests check that several pieces work together, such as code with a database or an API.",
    explanation:
      "Unit tests are fast and pinpoint failures. Integration tests catch wiring problems but are slower. A healthy suite uses both, with more unit tests.",
  },
];
