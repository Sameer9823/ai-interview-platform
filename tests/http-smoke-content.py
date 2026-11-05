# Phase 2 end to end HTTP test: public content, admin protection, workflow, imports, bookmarks, leak checks.
#   AUTH_SECRET=test-secret ALLOW_DEV_ADMIN=1 DEV_ADMIN_EMAIL=admin@example.com npm start -- -p 3100
#   python3 tests/http-smoke-content.py       (needs: pip install requests)
import json, re, sys, requests

B = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
ADMIN_EMAIL = "admin@example.com"
res = []
def t(name, cond, extra=""):
    res.append(bool(cond)); print(("PASS " if cond else "FAIL ") + name + ("" if cond or not extra else "  -> " + str(extra)[:200]))
def plain(html): return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<!--.*?-->", "", html, flags=re.S)))
def errs(html): return [re.sub(r"<[^>]+>", "", e).strip() for e in re.findall(r'<div class="err"[^>]*>(.*?)</div>', html, re.S)]
def H(ck): return {"Cookie": f"ip_session={ck}"} if ck else {}
def get(path, ck=None): return requests.get(B + path, headers=H(ck), allow_redirects=False)
def loc(r): return r.headers.get("location") or r.headers.get("x-action-redirect", "").split(";")[0]
def hidden_of(block):
    out = {}
    for tag in re.findall(r"<input[^>]*type=\"hidden\"[^>]*>", block):
        n = re.search(r'name="([^"]+)"', tag); v = re.search(r'value="([^"]*)"', tag)
        if n: out[n.group(1)] = (v.group(1) if v else "").replace("&quot;", '"').replace("&amp;", "&")
    return out
def forms(html): return [m for m in re.findall(r"<form\b.*?</form>", html, re.S)]
def pick(html, needle): return next((hidden_of(f) for f in forms(html) if needle in f), None)
def post(path, hidden, fields, ck=None, files=None):
    parts = [(k, (None, v)) for k, v in hidden.items() if k not in fields]  # explicit fields win over hidden ones
    for k, v in fields.items():
        for item in (v if isinstance(v, list) else [v]): parts.append((k, (None, item)))
    parts += files or []
    return requests.post(B + path, files=parts, headers=H(ck), allow_redirects=False)
def submit(path, fields, ck, needle=None, page=None):
    html = get(page or path, ck).text
    h = pick(html, needle) if needle else hidden_of(html)
    return post(path, h or {}, fields, ck)
def sign_up(name, email):
    h = hidden_of(get("/sign-up").text)
    r = post("/sign-up", h, {"name": name, "email": email, "password": "longenough123", "confirmPassword": "longenough123", "acceptTerms": "on"})
    return requests.utils.dict_from_cookiejar(r.cookies).get("ip_session")
_ids = {}
def action_id(ck, name):
    if name in _ids: return _ids[name]
    html = get("/onboarding", ck).text
    for src in set(re.findall(r'/_next/static/[^"\']+\.js', html)):
        m = re.search(r'"([0-9a-f]{30,})",[^)]{0,160}?"' + name + '"', requests.get(B + src).text)
        if m: _ids[name] = m.group(1); return m.group(1)
def onboard(ck, stage="PROFESSIONAL"):
    body = {"careerStage": stage, "careerDomain": "Software engineering", "targetRole": "Engineer", "experienceLevel": "INTERMEDIATE", "yearsOfExperience": "5", "educationLevel": "BACHELORS", "degree": "CS"}
    return requests.post(B + "/onboarding", data=json.dumps([body]), allow_redirects=False, headers={"Next-Action": action_id(ck, "completeOnboardingAction") or "x", "Content-Type": "text/plain;charset=UTF-8", "Accept": "text/x-component", **H(ck)})

# ===================== public content =====================
r = get("/companies?pageSize=50"); p = plain(r.text)
t("companies directory is public", r.status_code == 200 and "Tata Consultancy Services (TCS)" in p and "Razorpay" in p)
t("sixteen seeded companies are listed", len(re.findall(r'href="/companies/[a-z0-9-]+"', r.text)) == 16, len(re.findall(r'href="/companies/[a-z0-9-]+"', r.text)))
t("company cards say not yet verified", p.count("Not yet verified") >= 16)
t("companies are described as reference entries, not employers", "not employers on this platform" in p)
r = get("/companies/google"); p = plain(r.text)
t("company page works", r.status_code == 200 and "Google" in p)
t("company page links the official careers page safely", 'href="https://careers.google.com/"' in r.text and "noopener" in r.text and "nofollow" in r.text)
t("company page shows a clear message instead of invented information", "No verified information available yet" in p and "No verified overview has been published yet" in p)
t("company page separates official from reported content", "Officially documented hiring information" in p and "Reported interview rounds" in p and "Not company policy" in p and "Candidate reported experiences" in p)
t("company page says last verified never", "Last verified: never" in p)
t("unknown company is 404", get("/companies/nonexistent").status_code == 404)
t("company search works and filters", "Razorpay" in plain(get("/companies?q=razorpay").text) and "Amazon" not in plain(get("/companies?q=razorpay").text))
t("company industry filter works", "Infosys" in plain(get("/companies?industry=IT services").text) and "Amazon" not in plain(get("/companies?industry=IT services").text))

r = get("/questions"); p = plain(r.text)
t("question bank is public with real counts", r.status_code == 200 and re.search(r"Page 1 of \d+ · \d+ results", p))
total = int(re.search(r"· (\d+) results", p).group(1))
t("server side pagination: bounded page and size", len(re.findall(r'href="/questions/[a-z0-9-]+"', get("/questions?pageSize=5").text)) == 5 and "Page 1 of" in plain(get("/questions?pageSize=5").text))
t("oversized page size falls back to a safe default", len(re.findall(r'class="card h qcard"', get("/questions?pageSize=100000").text)) <= 12)
t("page two shows different questions", set(re.findall(r'href="(/questions/[a-z0-9-]+)"', get("/questions?pageSize=5").text)).isdisjoint(re.findall(r'href="(/questions/[a-z0-9-]+)"', get("/questions?pageSize=5&page=2").text)))
t("garbage page numbers do not break", get("/questions?page=abc").status_code == 200 and get("/questions?page=-5").status_code == 200 and get("/questions?page=99999").status_code == 200)
t("keyword search finds the right question", "/questions/reverse-linked-list" in get("/questions?q=linked+list").text)
t("search needs every word to match", "No questions match" in plain(get("/questions?q=linked+banana").text))
for evil in ["(.*+", "' OR 1=1 --", "<script>alert(1)</script>", "%00", "a" * 3000]:
    r = get("/questions", None) if False else requests.get(B + "/questions", params={"q": evil}, allow_redirects=False); t(f"hostile search is safe: {evil[:20]}", r.status_code == 200 and "<script>alert(1)</script>" not in r.text)
t("difficulty filter works", "/questions/design-url-shortener" in get("/questions?difficulty=ADVANCED").text and "/questions/train-speed-pole" not in get("/questions?difficulty=ADVANCED").text)
t("category filter includes sub categories", "/questions/second-highest-salary" in get("/questions?category=technical&pageSize=50").text)
t("type, stage and skill filters work", "/questions/second-highest-salary" in get("/questions?type=SQL").text and "/questions/design-url-shortener" in get("/questions?stage=PROFESSIONAL&pageSize=50").text and "/questions/two-sum-indices" in get("/questions?skill=hash").text)
t("sorting options work", get("/questions?sort=difficulty").status_code == 200 and get("/questions?sort=time").status_code == 200 and get("/questions?sort=chaos").status_code == 200)
t("invalid filter values are ignored, not errors", get("/questions?difficulty=IMPOSSIBLE&type=x").status_code == 200)
t("search form is a plain GET form (works without JavaScript)", 'method="get"' in get("/questions").text and 'role="search"' in get("/questions").text)

r = get("/questions/two-sum-indices"); p = plain(r.text)
t("question detail is public", r.status_code == 200 and "Given an array of integers and a target" in p)
t("question is labeled as original practice content, not a company question", "Original practice content" in p and "not a real company interview question" in p and "Not yet verified" in p)
t("answers are behind native disclosure widgets", "<details" in r.text and "Show the answer outline" in p and "Show the explanation" in p)
t("code solution has a language and test cases", "Code solution (python)" in p and "Test cases" in p)
t("question detail shows sources with attribution", "Sources" in p and "Original practice content written for this platform" in p)
t("question detail has related questions", "Related questions" in p)
t("save is offered, with a sign in hint when signed out", "Save question" in p and "Sign in to save questions" in p)
t("seeded questions are not linked to companies", "Linked companies" not in p)
t("private moderator notes never reach the page or payload", "Answer not yet independently reviewed" not in r.text and "moderatorNotes" not in r.text and "Sample practice question written for the platform" not in r.text)
t("unknown question is 404", get("/questions/does-not-exist").status_code == 404)
t("preview is ignored for visitors", "Preview." not in plain(get("/questions/design-url-shortener?preview=1").text))
t("experiences list is empty and says so, nothing invented", get("/interview-experiences").status_code == 200 and "No interview experiences have been published yet" in plain(get("/interview-experiences").text))
r = get("/topics/sql"); t("topic page works", r.status_code == 200 and "/questions/second-highest-salary" in r.text and get("/topics/nope").status_code == 404)
t("topic page lists sub topics", "/topics/sql" in get("/topics/technical").text)
t("public pages contain no recruiter content", not any(re.search(r"recruit|applicant|job posting|candidate pipeline", plain(get(p).text), re.I) for p in ["/companies", "/questions", "/interview-experiences", "/companies/amazon", "/topics/technical"]))
t("signed out visitors are sent to sign in for saved and admin", "/sign-in" in loc(get("/saved")) and "/sign-in" in loc(get("/admin")) and "/sign-in" in loc(get("/admin/imports")))
t("admin error report route does not reveal itself", get("/admin/imports/anything/errors").status_code == 404)

# ===================== accounts =====================
student = sign_up("Sita Student", "sita.s@example.com"); onboard(student, "STUDENT")
other = sign_up("Omar Other", "omar.o@example.com"); onboard(other, "FRESHER")
admin = sign_up("Ada Admin", ADMIN_EMAIL); r = onboard(admin, "PROFESSIONAL")
t("admin account reached its dashboard", "/professional/dashboard" in loc(r), loc(r))

# ===================== authorization =====================
for path in ["/admin", "/admin/companies", "/admin/questions/new", "/admin/imports", "/admin/sources", "/admin/audit", "/admin/review"]:
    r = get(path, student); t(f"student is redirected away from {path}", r.status_code in (302, 303, 307) and "/student/dashboard" in loc(r), f"{r.status_code} {loc(r)}")
t("professional non admin is redirected too", "/professional/dashboard" in loc(get("/admin", sign_up("Pat Pro", "pat.p@example.com") and onboard(sign_up("Pam Pro", "pam.p@example.com"), "PROFESSIONAL") and requests.utils.dict_from_cookiejar(requests.post(B + "/sign-in", files=[(k, (None, v)) for k, v in {**hidden_of(get("/sign-in").text), "email": "pam.p@example.com", "password": "longenough123", "next": ""}.items()], allow_redirects=False).cookies).get("ip_session"))))
t("admin sees the admin area", get("/admin", admin).status_code == 200 and "Administration" in plain(get("/admin", admin).text))
t("error report route is 404 for a non admin", get("/admin/imports/x/errors", student).status_code == 404)
t("admin link shows in the sidebar only for admins", "Administration" in plain(get("/profile", admin).text) and "Administration" not in plain(get("/profile", student).text))
t("a career stage never grants admin", "/student/dashboard" in loc(get("/admin", other)))

# replay an ADMIN form with a STUDENT session: the server must refuse
page = get("/admin/companies/new", admin).text
newco = pick(page, "f-name")
r = post("/admin/companies/new", newco, {"name": "Forged Co", "website": "https://forged.example.com", "careersUrl": "https://forged.example.com/jobs", "industry": "Software", "origin": "ADMIN_CURATED", "verification": "NOT_VERIFIED"}, student)
t("admin action replayed by a student is refused", "/student/dashboard" in loc(r) or r.status_code in (303, 307), f"{r.status_code} {loc(r)}")
t("and nothing was created", "Forged Co" not in plain(get("/admin/companies", admin).text))
r = post("/admin/companies/new", newco, {"name": "Anon Forged", "website": "https://forged.example.com", "careersUrl": "https://forged.example.com/jobs", "industry": "Software", "origin": "ADMIN_CURATED", "platformRole": "ADMIN"}, None)
t("admin action without a session is refused", "Anon Forged" not in plain(get("/admin/companies", admin).text))

# ===================== sources =====================
sp = plain(get("/admin/sources", admin).text)
t("seeded sources are registered and unreviewed", "registered sources" in sp and "Not yet reviewed" in sp and "GeeksforGeeks interview experiences" in sp)
row = lambda name: next((r for r in re.findall(r"<tr>.*?</tr>", get("/admin/sources", admin).text, re.S) if name in r), "")
t("research leads are not approved", all("<td>Approved</td>" not in row(n) and "<td>Attribution required</td>" not in row(n) for n in ["Glassdoor interviews", "AmbitionBox", "Hugging Face datasets", "GitHub search: interview questions"]))
t("only the platform original source is approved", "<td>Approved</td>" in row("Original practice content"))
good = {"title": "Open interview dataset", "url": "https://datasets.example.org/interviews", "type": "OPEN_DATASET", "publisher": "Example Org", "description": "", "licenseNotes": "CC BY 4.0, reviewed", "attribution": "Example Org (CC BY 4.0)", "permission": "ATTRIBUTION_REQUIRED", "commercialUse": "ATTRIBUTION_REQUIRED", "redistribution": "ATTRIBUTION_REQUIRED", "accessMethod": "Owner CSV export", "reliability": "MEDIUM", "reviewStatus": "REVIEWED", "notes": ""}
r = submit("/admin/sources/new", good, admin, "f-title"); sid = (re.search(r"/admin/sources/([\w-]+)", loc(r)) or [None, None])[1]
t("admin registers a source", sid and "ok=Saved" in loc(r), loc(r))
r = submit("/admin/sources/new", {**good, "url": "javascript:alert(1)", "title": "Bad"}, admin, "f-title"); t("unsafe source URL rejected", any("public http or https" in e for e in errs(r.text)), errs(r.text))
r = submit("/admin/sources/new", good, admin, "f-title"); t("duplicate source URL rejected", any("already exists" in e for e in errs(r.text)), errs(r.text))
r = submit("/admin/sources/new", {**good, "url": "http://169.254.169.254/latest", "title": "Meta"}, admin, "f-title"); t("cloud metadata address rejected", any("public http or https" in e for e in errs(r.text)))

# ===================== company workflow =====================
co = {"name": "Workflow Labs", "slug": "", "website": "https://workflowlabs.example.com", "careersUrl": "https://workflowlabs.example.com/jobs", "logoUrl": "", "industry": "Software", "description": "A made up company used only in this test.", "headquarters": "", "hiringInfo": "", "roleCategories": "Software engineer", "prepCategories": "sql", "origin": "ADMIN_CURATED", "verification": "NOT_VERIFIED", "sourceIds": [sid], "moderatorNotes": "TOPSECRETNOTE do not show"}
r = submit("/admin/companies/new", co, admin, "f-name"); cid = (re.search(r"/admin/companies/([\w-]+)", loc(r)) or [None, None])[1]
t("admin creates a company draft", cid and "ok=Saved" in loc(r), loc(r))
t("draft company is not public", get("/companies/workflow-labs").status_code == 404 and "Workflow Labs" not in plain(get("/companies").text))
t("admin can preview the draft", "Preview." in plain(get("/companies/workflow-labs?preview=1", admin).text) and get("/companies/workflow-labs?preview=1", student).status_code == 404)
r = submit("/admin/companies/new", {**co, "name": "Dup Slug", "slug": "workflow-labs"}, admin, "f-name"); t("slug clash is reported", any("slug is already in use" in e.lower() for e in errs(r.text)), errs(r.text))
page = get(f"/admin/companies/{cid}", admin).text
t("publish checklist and version history are shown", "Publish checklist" in plain(page) and "Version history" in plain(page))
r = post(f"/admin/companies/{cid}", pick(page, 'value="IN_REVIEW"'), {"to": "PUBLISHED", "back": f"/admin/companies/{cid}"}, admin)  # a crafted request: the page never offers this
t("draft cannot jump straight to published, even with a crafted request", "error=" in loc(r) and "Cannot+move" in loc(r).replace("%20", "+"), loc(r))
r = post(f"/admin/companies/{cid}", pick(page, 'value="IN_REVIEW"'), {"to": "IN_REVIEW", "back": f"/admin/companies/{cid}"}, admin); t("send to review works", "ok=" in loc(r), loc(r))
page = get(f"/admin/companies/{cid}", admin).text
r = post(f"/admin/companies/{cid}", pick(page, 'value="PUBLISHED"'), {"to": "PUBLISHED", "back": f"/admin/companies/{cid}"}, admin); t("publish works when the rules pass", "ok=" in loc(r), loc(r))
pg = get("/companies/workflow-labs"); pp = plain(pg.text)
t("published company is public with source attribution", pg.status_code == 200 and "Example Org (CC BY 4.0)" in pp and "Open interview dataset" in pp and "Administrator curated" in pp)
t("moderator notes never leak", "TOPSECRETNOTE" not in pg.text and "TOPSECRETNOTE" not in get("/companies").text)
t("company listing counts only published items", "0 linked questions" in plain(get("/companies?q=workflow").text))
rr = get("/admin/review", admin); t("review queue renders", rr.status_code == 200)

# ===================== questions: provenance rules =====================
q = {"text": "Explain how a database index speeds up a query.", "slug": "", "categorySlug": "dbms", "type": "SHORT_ANSWER", "difficulty": "BEGINNER", "estimatedMinutes": "5", "companySlugs": "", "roles": "", "skills": "indexing", "tags": "dbms", "answerOutline": "An index keeps sorted keys so lookups avoid a full scan.", "explanation": "", "exampleAnswer": "", "codeSolution": "", "codeLanguage": "", "testCases": "", "hints": "", "options": "", "origin": "ADMIN_CURATED", "verification": "NOT_VERIFIED", "sourceIds": [sid], "moderatorNotes": ""}
r = submit("/admin/questions/new", q, admin, "f-text"); qid = (re.search(r"/admin/questions/([\w-]+)", loc(r)) or [None, None])[1]; t("admin creates a question draft", qid and "ok=Saved" in loc(r), loc(r))
t("draft question is not public or searchable", get("/questions/explain-how-a-database-index-speeds-up-a-query").status_code == 404 and "speeds up a query" not in plain(get("/questions?q=database+index").text) and "speeds-up-a-query" not in get("/questions?q=database+index").text)
page = get("/admin/questions/new", admin).text
r = submit("/admin/questions/new", {**q, "text": "A question wrongly tagged with a company name.", "companySlugs": "amazon", "origin": "PLATFORM_ORIGINAL", "sourceIds": []}, admin, "f-text")
t("company tag on original content is refused", any("cannot be used on original practice questions" in e for e in errs(r.text)), errs(r.text))
r = submit("/admin/questions/new", {**q, "text": "A multiple choice question with no correct option.", "type": "MULTIPLE_CHOICE", "options": "One\nTwo"}, admin, "f-text"); t("multiple choice needs a marked correct option", any("mark the correct one" in e for e in errs(r.text)), errs(r.text))
r = submit("/admin/questions/new", {**q, "text": "x", "answerOutline": ""}, admin, "f-text"); e = errs(r.text); t("required fields give readable errors", any("at least 10" in x for x in e) and len(e) >= 2, e)
r = submit("/admin/questions/new", {**q, "text": "A question with a script <script>alert(1)</script> inside it.", "slug": "xss-test"}, admin, "f-text")
listing = get("/admin/questions?q=question+with+a+script", admin).text
t("markup is stripped from stored text", "alert(1)" not in listing and "A question with a script" in listing)
r = submit(f"/admin/questions/{qid}", {**q, "difficulty": "ADVANCED"}, admin, "f-text", page=f"/admin/questions/{qid}"); t("editing saves a new version", "ok=Saved" in loc(r) and "2" in plain(get(f"/admin/questions/{qid}", admin).text))
dupe = submit("/admin/questions/new", {**q, "slug": "dup-copy"}, admin, "f-text"); did = (re.search(r"/admin/questions/([\w-]+)", loc(dupe)) or [None, None])[1]
t("a likely duplicate is flagged", "Possible duplicate" in plain(get(f"/admin/questions/{did}", admin).text))

# ===================== bulk =====================
page = get("/admin/questions?status=DRAFT", admin).text; bulk = pick(page, 'name="ids"')
ids = re.findall(r'name="ids" value="([\w-]+)"', page)[:2]
r = post("/admin/questions", bulk, {"ids": ids, "to": "PUBLISHED", "back": "/admin/questions"}, admin); t("bulk change needs the confirmation box", "error=" in loc(r) and "Tick" in requests.utils.unquote(loc(r)), loc(r))
r = post("/admin/questions", bulk, {"ids": ids, "to": "PUBLISHED", "confirm": "on", "back": "/admin/questions"}, admin)
t("bulk change cannot bypass the workflow rules", "error=" in loc(r) and "0+applied" in loc(r).replace("%20", "+") and "refused" in loc(r), loc(r))

# ===================== experiences =====================
ex = {"companyId": cid, "role": "Backend engineer", "slug": "", "careerStage": "FRESHER", "experienceLevel": "BEGINNER", "reportedYear": "2025", "summary": "The contributor described an online test followed by two technical conversations about databases.", "rounds": "Online test: timed questions\nTechnical call: SQL and design", "topics": "SQL, Joins", "reportedQuestions": "Write a query to join two tables", "advice": "Practice joins.", "sourceUrl": "", "sourceRef": "", "origin": "CANDIDATE_REPORTED", "verification": "NOT_VERIFIED", "sourceIds": [sid], "moderatorNotes": "PRIVATE contributor remark"}
r = submit("/admin/experiences/new", {**ex, "origin": "OFFICIAL"}, admin, "f-role"); t("an experience cannot be labeled official", any("candidate reported or community reported" in e for e in errs(r.text)), errs(r.text))
r = submit("/admin/experiences/new", ex, admin, "f-role"); eid = (re.search(r"/admin/experiences/([\w-]+)", loc(r)) or [None, None])[1]; t("admin creates an experience draft", eid and "ok=Saved" in loc(r), loc(r))
page = get(f"/admin/experiences/{eid}", admin).text
post(f"/admin/experiences/{eid}", pick(page, 'value="IN_REVIEW"'), {"to": "IN_REVIEW", "back": f"/admin/experiences/{eid}"}, admin)
page = get(f"/admin/experiences/{eid}", admin).text
r = post(f"/admin/experiences/{eid}", pick(page, 'value="PUBLISHED"'), {"to": "PUBLISHED", "back": f"/admin/experiences/{eid}"}, admin)
t("publishing needs the original source reference", "error=" in loc(r) and "original+source" in loc(r).replace("%20", "+"), loc(r))
submit(f"/admin/experiences/{eid}", {**ex, "sourceRef": "Submission 42"}, admin, "f-role", page=f"/admin/experiences/{eid}")
page = get(f"/admin/experiences/{eid}", admin).text
r = post(f"/admin/experiences/{eid}", pick(page, 'value="PUBLISHED"'), {"to": "PUBLISHED", "back": f"/admin/experiences/{eid}"}, admin); t("publishes once provenance is kept", "ok=" in loc(r), loc(r))
slug = "workflow-labs-backend-engineer"; er = get(f"/interview-experiences/{slug}"); ep = plain(er.text)
t("experience is public and labeled candidate reported", er.status_code == 200 and "Candidate reported" in ep and "Not confirmed by the company" in ep)
t("experience shows rounds, topics and its source", "Online test" in ep and "SQL" in ep and "Submission 42" in ep and "Open interview dataset" in ep)
t("internal moderation notes never leak from experiences", "PRIVATE contributor remark" not in er.text and "moderatorNotes" not in er.text)
t("experience appears on its company page and in the list", slug in get("/companies/workflow-labs").text and slug in get("/interview-experiences").text)
t("experience list filters by company", slug in get("/interview-experiences?company=workflow-labs").text and slug not in get("/interview-experiences?company=google").text)

# ===================== imports =====================
CSV = "text,category,type,difficulty,roles,careerStages,experienceLevels,skills,tags,answerOutline,estimatedMinutes,options,companies\n" + "\n".join(
    [f"What does the SQL keyword {k} do in a query?,sql,SHORT_ANSWER,BEGINNER,Data analyst,STUDENT|FRESHER,,sql,sql|databases,{k} changes how rows are returned.,4,," for k in ["DISTINCT", "LIMIT"]] +
    ["Short,sql,SHORT_ANSWER,BEGINNER,,,,,,x,4,,", "What does GROUP BY do in a query?,no-such-category,SHORT_ANSWER,BEGINNER,,,,,,Groups rows.,4,,", "Explain the ACID properties of a database transaction.,dbms,SHORT_ANSWER,BEGINNER,,,,,,Duplicate of a seeded one.,4,,"]) + "\n"
upload = lambda ck, sidv, content, name="q.csv", kind="questions": post("/admin/imports", hidden_of(get("/admin/imports", ck).text), {"kind": kind, "sourceId": sidv}, ck, files=[("file", (name, content, "text/csv"))])
r = upload(admin, sid, CSV); jid = (re.search(r"/admin/imports/([\w-]+)", loc(r)) or [None, None])[1]; t("admin uploads a CSV and gets a preview", jid and r.status_code in (302, 303, 307), f"{r.status_code} {loc(r)}")
jp = plain(get(f"/admin/imports/{jid}", admin).text)
t("preview shows valid, invalid and duplicate counts", "Valid 2" in jp and "Invalid 2" in jp and "Duplicate 1" in jp and "Rows in file 5" in jp, jp[:400])
t("preview shows row level reasons", "unknown category" in jp and "Matches an existing question" in jp)
t("nothing is created by previewing", "SQL keyword DISTINCT" not in plain(get("/admin/questions?q=DISTINCT", admin).text))
ph = get(f"/admin/imports/{jid}", admin).text
r = post(f"/admin/imports/{jid}", pick(ph, 'name="confirm"'), {}, admin); t("commit needs confirmation", "error=" in loc(r) and "Tick" in requests.utils.unquote(loc(r)), loc(r))
r = post(f"/admin/imports/{jid}", pick(ph, 'name="confirm"'), {"confirm": "on"}, admin); t("confirmed commit succeeds", "ok=" in loc(r) and "Created+2" in loc(r).replace("%20", "+"), loc(r))
dl = get("/admin/questions?status=DRAFT&q=keyword", admin); t("imported records are drafts with provenance", "SQL keyword DISTINCT" in plain(dl.text) or "keyword DISTINCT" in plain(dl.text))
t("imported records are not public", "keyword DISTINCT" not in plain(get("/questions?q=keyword").text) and "keyword DISTINCT" not in plain(get("/questions?q=distinct").text))
r = upload(admin, sid, CSV); t("the same file cannot be imported twice", "already+imported" in requests.utils.quote(requests.utils.unquote(loc(r)), safe="+").replace("%20", "+") or "ALREADY" in plain(get(loc(r), admin).text).upper() or "already imported" in plain(get(loc(r), admin).text), loc(r))
rep = get(f"/admin/imports/{jid}/errors", admin); t("admin downloads the error report as CSV", rep.status_code == 200 and "text/csv" in rep.headers.get("content-type", "") and "attachment" in rep.headers.get("content-disposition", "") and rep.text.startswith("row,status,details,preview"), rep.text[:80])
t("error report is private", get(f"/admin/imports/{jid}/errors", student).status_code == 404 and get(f"/admin/imports/{jid}/errors").status_code == 404)
# blocked source
src_page = re.sub(r"<!--.*?-->", "", get("/admin/imports", admin).text); link_only = re.search(r'value="([\w-]+)">GeeksforGeeks \(Link only\)', src_page) or re.search(r'value="([\w-]+)">HackerRank interview preparation kit \(Link only\)', src_page)
r = upload(admin, link_only.group(1), CSV.replace("DISTINCT", "OFFSET").replace("LIMIT", "HAVING")); bjid = (re.search(r"/admin/imports/([\w-]+)", loc(r)) or [None, None])[1]
bp = plain(get(f"/admin/imports/{bjid}", admin).text); t("a link only source can be previewed but not imported", "blocked" in bp.lower() and "cannot be imported from" in bp and "Confirm import" not in bp, bp[:300])
for bad, name, mime in [(b"", "e.csv", "text/csv"), (b"a,b\n1,2\n", "x.exe", "text/csv"), (b"\xff\xfe\xfd\x80", "bad.csv", "text/csv"), (b'text,category\n"open,1\n', "u.csv", "text/csv"), (b"{}", "o.json", "application/json")]:
    r = post("/admin/imports", hidden_of(get("/admin/imports", admin).text), {"kind": "questions", "sourceId": sid}, admin, files=[("file", (name, bad, mime))]); t(f"bad upload is refused: {name} {len(bad)}b", "error=" in loc(r) and "/admin/imports/" not in loc(r).split("?")[0].replace("/admin/imports", "", 1), loc(r))
r = upload(student, sid, CSV, name="s.csv"); t("a student cannot upload imports", "/student/dashboard" in loc(r) or "/admin/imports/" not in loc(r), loc(r))
cjob = post("/admin/imports", hidden_of(get("/admin/imports", admin).text), {"kind": "companies", "sourceId": sid}, admin, files=[("file", ("c.csv", b"name,website,careersUrl,industry\nCsv Corp,https://csvcorp.example.com,https://csvcorp.example.com/jobs,Software\nGoogle,https://www.google.com,https://careers.google.com,Technology\n", "text/csv"))])
cj = (re.search(r"/admin/imports/([\w-]+)", loc(cjob)) or [None, None])[1]; t("company import previews with a duplicate flagged", "Duplicate 1" in plain(get(f"/admin/imports/{cj}", admin).text))

# ===================== source downgrade flows to content =====================
page = get(f"/admin/sources/{sid}", admin).text
r = submit(f"/admin/sources/{sid}", {**good, "permission": "NOT_APPROVED", "reviewStatus": "REJECTED"}, admin, "f-title", page=f"/admin/sources/{sid}")
t("rejecting a source is saved", "ok=Saved" in loc(r), loc(r))
t("content that relied on it disappears from the public site", get("/companies/workflow-labs").status_code == 404 and get(f"/interview-experiences/{slug}").status_code == 404)
rq = plain(get("/admin/review", admin).text); t("and returns to the review queue with a reason", "Workflow Labs" in rq and "Backend engineer" in rq and "no longer cleared" in rq or "not cleared" in rq, rq[:300])
t("it cannot be republished while the source is rejected", "Not ready" in plain(get(f"/admin/companies/{cid}", admin).text))

# ===================== bookmarks =====================
qp = get("/questions/two-sum-indices", student).text; sv = pick(qp, 'name="questionId"')
t("save button shows for a signed in user", "Save question" in plain(qp) and sv and sv.get("questionId"))
r = post("/questions/two-sum-indices", sv, {}, student); t("saving a question works", r.status_code in (302, 303, 307), f"{r.status_code} {loc(r)}")
t("saved question persists on the saved page", "two-sum" in get("/saved", student).text.lower() or "Given an array of integers" in plain(get("/saved", student).text))
t("detail page shows it is saved", "Saved. Remove from saved" in plain(get("/questions/two-sum-indices", student).text))
t("another user cannot see it", "Given an array of integers" not in plain(get("/saved", other).text) and "Nothing saved yet" in plain(get("/saved", other).text))
r = post("/questions/two-sum-indices", {**sv, "questionId": "someone-elses-or-missing"}, {}, student); t("saving an unknown question is ignored", r.status_code in (302, 303, 307) and "Given an array of integers" in plain(get("/saved", student).text))
r = post("/questions/two-sum-indices", sv, {}, None); t("saving while signed out sends to sign in", "/sign-in" in loc(r), loc(r))
post("/questions/two-sum-indices", sv, {}, student); t("saving again removes it", "Nothing saved yet" in plain(get("/saved", student).text))
t("saved page needs sign in", "/sign-in" in loc(get("/saved")))

# ===================== audit =====================
ap = plain(get("/admin/audit", admin).text)
t("audit log records admin mutations", all(x in ap for x in ["source.create", "company.create", "status.published", "import.commit", "import.stage", "bulk.status", "question.create"]), ap[:300])
t("audit log is admin only", "/student/dashboard" in loc(get("/admin/audit", student)))
t("admin overview numbers match the public site", re.search(r"Published questions\s*(\d+)", plain(get("/admin", admin).text)).group(1) == str(total))

# ===================== library hub =====================
lp = plain(get("/library", student).text)
t("library hub shows real counts and topics", f"{total} published questions" in lp and "Question bank" in lp and "Topics" in lp)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed"); sys.exit(0 if all(res) else 1)
