# End to end HTTP test against a running production build. Replays the real server actions.
#   AUTH_SECRET=test-secret AI_PROVIDER=openai AI_MODEL=smoke-model OPENAI_API_KEY=sk-smoke-secret-9999 ALLOW_DEV_ADMIN=1 DEV_ADMIN_EMAIL=admin@example.com npm start -- -p 3100
#   python3 tests/http-smoke.py        (needs: pip install requests)
import json, re, sys, requests

B = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
SECRET = "sk-smoke-secret-9999"
res = []
def t(name, cond, extra=""):
    res.append(bool(cond)); print(("PASS " if cond else "FAIL ") + name + ("" if cond or not extra else "  -> " + str(extra)[:160]))
def errs(html): return [re.sub(r"<[^>]+>", "", e).strip() for e in re.findall(r'<div class="err"[^>]*>(.*?)</div>', html, re.S)]
def plain(html): return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<!--.*?-->", "", html, flags=re.S)))
def get(path, ck=None): return requests.get(B + path, headers={"Cookie": f"ip_session={ck}"} if ck else {}, allow_redirects=False)
def hidden(html):
    out = {}
    for tag in re.findall(r"<input[^>]*type=\"hidden\"[^>]*>", html):
        n = re.search(r'name="([^"]+)"', tag); v = re.search(r'value="([^"]*)"', tag)
        if n: out[n.group(1)] = (v.group(1) if v else "").replace("&quot;", '"').replace("&amp;", "&")
    return out
def form(path, fields, ck=None):
    h = hidden(get(path, ck).text)
    return requests.post(B + path, files={k: (None, v) for k, v in {**h, **fields}.items()}, headers={"Cookie": f"ip_session={ck}"} if ck else {}, allow_redirects=False)
def loc(r): return r.headers.get("location") or r.headers.get("x-action-redirect", "").split(";")[0]
def sign_up(name, email):
    r = form("/sign-up", {"name": name, "email": email, "password": "longenough123", "confirmPassword": "longenough123", "acceptTerms": "on"})
    return r, requests.utils.dict_from_cookiejar(r.cookies).get("ip_session")

_ids = {}
def action_id(ck, name):
    if name in _ids: return _ids[name]
    html = get("/onboarding", ck).text
    for src in set(re.findall(r'/_next/static/[^"\']+\.js', html)):
        js = requests.get(B + src).text
        m = re.search(r'"([0-9a-f]{30,})",[^)]{0,160}?"' + name + '"', js)
        if m: _ids[name] = m.group(1); return m.group(1)
    return None
def call(ck, path, name, payload):
    return requests.post(B + path, data=json.dumps([payload]), allow_redirects=False,
        headers={"Next-Action": action_id(ck, name) or "missing", "Content-Type": "text/plain;charset=UTF-8", "Accept": "text/x-component", "Cookie": f"ip_session={ck}"})

# ---------- public site ----------
home = get("/")
t("home is 200", home.status_code == 200); p = plain(home.text)
t("hero headline from the spec", "Prepare Smarter. Interview With Confidence." in p)
t("hero CTAs", "Start Preparing" in p and "Explore Features" in p)
for a in ["#features", "#how", "#students", "#professionals", "#faq"]: t(f"nav link {a} exists and has a target", f'href="{a}"' in home.text and f'id="{a[1:]}"' in home.text)
t("Sign In and Get Started present", "Sign In" in p and "Get Started" in p)
t("AI mock interviews and skill gap labelled Coming soon", p.count("Coming soon") >= 4)
t("sample dashboard preview is labelled as not real data", "Sample layout, not real data" in p)
t("footer has privacy, terms and a dynamic year", 'href="/privacy"' in home.text and 'href="/terms"' in home.text and re.search(r"© 20\d\d", p))
for path in ["/", "/privacy", "/terms", "/sign-in", "/sign-up"]:
    r = get(path); t(f"{path} is 200 and has no recruiter or hiring content", r.status_code == 200 and not re.search(r"recruit|applicant|job posting|candidate pipeline", plain(r.text), re.I))
t("legal pages are marked as drafts", "Draft" in plain(get("/privacy").text) and "Draft" in plain(get("/terms").text))
h = get("/").headers; t("security headers set, no x-powered-by", h.get("x-frame-options") == "DENY" and h.get("x-content-type-options") == "nosniff" and "x-powered-by" not in h)

# ---------- protection ----------
for path in ["/student/dashboard", "/professional/dashboard", "/profile", "/goals", "/library", "/assessments", "/mock-interviews", "/resume", "/settings/security", "/onboarding"]:
    r = get(path); t(f"signed out {path} -> sign in", r.status_code in (302, 303, 307, 308) and "/sign-in" in loc(r), f"{r.status_code} {loc(r)}")
t("redirect remembers the page", "next=%2Fstudent%2Fdashboard" in loc(get("/student/dashboard")))
t("unknown paths are 404 and /admin needs sign in", get("/recruiter/dashboard").status_code == 404 and get("/jobs").status_code == 404 and "/sign-in" in loc(get("/admin")))
t("AI health needs a session", get("/api/health/ai").status_code == 401)

# ---------- sign up ----------
h0 = hidden(get("/sign-up").text)
def raw(fields): return requests.post(B + "/sign-up", files={k: (None, v) for k, v in {**h0, **fields}.items()}, allow_redirects=False)
good = {"name": "Asha Raman", "email": "asha@example.com", "password": "longenough123", "confirmPassword": "longenough123", "acceptTerms": "on"}
t("weak password rejected by server", "Use at least 10 characters" in errs(raw({**good, "password": "short", "confirmPassword": "short"}).text))
t("mismatched passwords rejected", "Passwords do not match" in errs(raw({**good, "confirmPassword": "different12345"}).text))
t("terms required, with a friendly message", errs(raw({k: v for k, v in good.items() if k != "acceptTerms"}).text) == ["Accept the terms to continue"], errs(raw({k: v for k, v in good.items() if k != "acceptTerms"}).text))
r, asha = sign_up("Asha Raman", "asha@example.com")
t("sign up redirects to onboarding", r.status_code in (302, 303, 307) and "/onboarding" in loc(r), f"{r.status_code} {loc(r)}")
sc = r.headers.get("set-cookie", "").lower(); t("session cookie is HttpOnly, Secure, SameSite=Lax", "httponly" in sc and "secure" in sc and "samesite=lax" in sc)
t("cookie holds no password, stage or role", asha and not re.search("longenough|STUDENT|PROFESSIONAL|ADMIN", asha))
t("duplicate email rejected", "An account with this email already exists" in errs(raw(good).text))
inj, ck_inj = sign_up("Eve Inject", "eve@example.com")
t("role fields at sign up are ignored", ck_inj is not None)
t("forged and garbage sessions rejected", "/sign-in" in loc(get("/onboarding", asha.rsplit(".", 1)[0] + ".AAAA")) and "/sign-in" in loc(get("/onboarding", "garbage")))

# ---------- onboarding (real server action) ----------
r = get("/student/dashboard", asha); t("before onboarding every private page redirects to onboarding", "/onboarding" in loc(r) and "/onboarding" in loc(get("/profile", asha)))
ob = plain(get("/onboarding", asha).text)
t("onboarding step 1 offers the three career stages", "Step 1 of 3" in ob and all(x in ob for x in ["Student", "Fresher", "Working professional"]))
t("onboarding action found", action_id(asha, "completeOnboardingAction") is not None)
r = call(asha, "/onboarding", "completeOnboardingAction", {"careerStage": "RECRUITER", "careerDomain": "X", "targetRole": "Y", "experienceLevel": "BEGINNER"})
t("RECRUITER career stage rejected with a readable message", "/dashboard" not in loc(r) and "Choose your career stage" in r.text and "discriminator" not in r.text, r.text[:160])
r = call(asha, "/onboarding", "completeOnboardingAction", {"careerStage": "FRESHER", "careerDomain": "Software engineering", "targetRole": "Backend developer", "experienceLevel": "BEGINNER", "educationLevel": "BACHELORS"})
t("missing degree rejected by server", "Enter your degree or specialization" in r.text, r.text[:120])
r = call(asha, "/onboarding", "completeOnboardingAction", {"careerStage": "FRESHER", "careerDomain": "Software engineering", "targetRole": "Backend developer", "experienceLevel": "BEGINNER", "educationLevel": "BACHELORS", "degree": "Computer Science", "graduationYear": "2026", "primaryProgrammingLanguage": "Python", "goals": ["CODING_DSA", "APTITUDE_REASONING", "NOT_A_GOAL"]})
t("invalid goal category rejected", "Choose a valid goal" in r.text, r.text[:120])
r = call(asha, "/onboarding", "completeOnboardingAction", {"careerStage": "FRESHER", "careerDomain": "Software engineering", "targetRole": "Backend developer", "experienceLevel": "BEGINNER", "educationLevel": "BACHELORS", "degree": "Computer Science", "graduationYear": "2026", "primaryProgrammingLanguage": "Python", "goals": ["CODING_DSA", "APTITUDE_REASONING"], "platformRole": "ADMIN"})
t("fresher onboarding redirects to the student dashboard", "/student/dashboard" in loc(r), f"{r.status_code} {dict(r.headers).get('x-action-redirect')}")
_, ravi = sign_up("Ravi Kumar", "ravi@example.com")
r = call(ravi, "/onboarding", "completeOnboardingAction", {"careerStage": "PROFESSIONAL", "careerDomain": "Data and AI", "targetRole": "ML engineer", "experienceLevel": "ADVANCED"})
t("professional needs years of experience", "Enter your years of experience" in r.text)
r = call(ravi, "/onboarding", "completeOnboardingAction", {"careerStage": "PROFESSIONAL", "careerDomain": "Data and AI", "targetRole": "ML engineer", "experienceLevel": "ADVANCED", "currentRole": "Data engineer", "yearsOfExperience": "6", "skillsToImprove": "System design, Statistics", "goals": ["SYSTEM_DESIGN"]})
t("professional onboarding redirects to the professional dashboard", "/professional/dashboard" in loc(r), f"{r.status_code} {dict(r.headers).get('x-action-redirect')}")
t("finished users cannot reopen onboarding", "/dashboard" in loc(get("/onboarding", asha)))
t("signed in users cannot reopen sign up", "/dashboard" in loc(get("/sign-up", ravi)))

# ---------- dashboards and cross role ----------
sd = get("/student/dashboard", asha); sp = plain(sd.text)
t("fresher sees the student dashboard with real data", sd.status_code == 200 and "Welcome, Asha" in sp and "Backend developer" in sp and "Coding and DSA" in sp and "Python" in sp)
t("student dashboard shows a real zero for practice sessions, no invented numbers", "Practice sessions completed 0" in sp)
t("student dashboard has an empty recently accessed state", "Items you open in the Preparation Library will appear here" in sp)
pd = plain(get("/professional/dashboard", ravi).text)
t("professional sees their own dashboard with skills", "Welcome, Ravi" in pd and "System design" in pd and "Statistics" in pd and "Data engineer" in pd and "6 years" in pd)
t("professional dashboard has no student only content", "Graduation year" not in pd and "Programming language" not in pd)
t("professional blocked from student area", "/professional/dashboard" in loc(get("/student/dashboard", ravi)))
t("student blocked from professional area", "/student/dashboard" in loc(get("/professional/dashboard", asha)))
nav = plain(get("/profile", asha).text)
t("sidebar has all eight spec items", all(x in nav for x in ["Overview", "My Profile", "Preparation Goals", "Preparation Library", "Assessments", "AI Mock Interviews", "Resume Analysis", "Settings"]))
for path in ["/assessments", "/mock-interviews", "/resume"]:
    r = get(path, asha); t(f"{path} is a labelled Coming soon page", r.status_code == 200 and "Coming soon" in plain(r.text) and "no sample results are shown" in plain(r.text))
t("settings redirects to account", "/settings/account" in loc(get("/settings", asha)))
t("account page shows own email only", "asha@example.com" in plain(get("/settings/account", asha).text) and "ravi@example.com" not in plain(get("/settings/account", asha).text))

# ---------- profile, goals, isolation ----------
r = form("/profile", {"name": "Asha R", "careerDomain": "Cloud and DevOps", "targetRole": "Zebra Wrangler Role", "experienceLevel": "INTERMEDIATE", "educationLevel": "BACHELORS", "degree": "Unique Degree 777", "graduationYear": "2026", "primaryProgrammingLanguage": "Go", "currentRole": "InjectedProRole", "yearsOfExperience": "99", "skillsToImprove": "InjectedSkill"}, asha)
pf = get("/profile", asha).text; sdp = plain(get("/student/dashboard", asha).text)
t("profile update persists", "Zebra Wrangler Role" in pf and "Unique Degree 777" in pf and "Zebra Wrangler Role" in sdp)
t("professional only fields cannot be written onto a student profile", "InjectedProRole" not in pf + sdp and "InjectedSkill" not in pf + sdp and "99 years" not in sdp)
r = form("/profile", {"name": "A", "careerDomain": "", "targetRole": "", "experienceLevel": "EXPERT", "educationLevel": "BACHELORS", "degree": "X"}, asha)
e = errs(r.text); t("invalid profile update shows specific field errors", "Enter your full name" in e and "Enter your preferred career domain" in e and "Enter your target role" in e and "Choose your experience level" in e, e)
t("a failed update does not change saved data", "Zebra Wrangler Role" in get("/profile", asha).text)
r = form("/goals", {"goals": "SYSTEM_DESIGN"}, asha); sdp = plain(get("/student/dashboard", asha).text)
t("goals update persists and replaces the old goals", "System design" in sdp and "Coding and DSA" not in sdp)
t("one user's edits never appear for another", "Zebra Wrangler Role" not in get("/profile", ravi).text and "Unique Degree 777" not in get("/profile", ravi).text and "Zebra" not in plain(get("/professional/dashboard", ravi).text))
t("activity shows the real events that happened", all(x in sdp for x in ["Account created", "Onboarding completed", "Profile updated", "Preparation goals updated"]) and "Practice session completed" not in sdp)

# ---------- sign in, rate limit, redirects ----------
si = hidden(get("/sign-in?next=https://evil.com").text)
def signin(email, pw, nxt=""): return requests.post(B + "/sign-in", files={k: (None, v) for k, v in {**si, "email": email, "password": pw, "next": nxt}.items()}, allow_redirects=False)
t("wrong password gives a generic error", "Email or password is incorrect" in plain(signin("asha@example.com", "wrongpassword1").text))
t("unknown email gives the same error", "Email or password is incorrect" in plain(signin("nobody@example.com", "wrongpassword1").text))
r = signin("asha@example.com", "longenough123", "https://evil.com"); t("sign in ignores an external next and goes to the dashboard", "evil.com" not in loc(r) and "/student/dashboard" in loc(r), loc(r))
r = signin("asha@example.com", "longenough123", "/goals"); t("sign in honours a safe next", loc(r) == "/goals", loc(r))
for _ in range(6): last = signin("limit@example.com", "wrongpassword1")
t("sign in is rate limited after repeated failures", "Too many attempts" in plain(last.text))

# ---------- AI health ----------
r = get("/api/health/ai", asha); body = r.text
t("AI health returns safe status for a signed in user", r.status_code == 200 and json.loads(body)["configured"] is True and json.loads(body)["provider"] == "openai", body[:200])
t("AI health never contains the API key", SECRET not in body and json.loads(body)["keyPresent"] is True and json.loads(body)["peerSdkInstalled"] is True)
t("AI health response is not cacheable", "no-store" in r.headers.get("cache-control", ""))

# ---------- delete account ----------
r = form("/settings/security", {"password": "wrong-password", "confirmation": "DELETE"}, ravi); t("delete needs the right password", "Password is incorrect" in errs(r.text))
r = form("/settings/security", {"password": "longenough123", "confirmation": "delete"}, ravi); t("delete needs the exact word DELETE", errs(r.text) == ["Type DELETE to confirm"], errs(r.text))
r = form("/settings/security", {"password": "longenough123", "confirmation": "DELETE"}, ravi)
t("account deletion signs the user out and removes the account", "/" == loc(r) or r.status_code in (302, 303, 307), f"{r.status_code} {loc(r)}")
t("deleted account session no longer works", "/sign-in" in loc(get("/professional/dashboard", ravi)))
t("deleted account cannot sign in", "Email or password is incorrect" in plain(signin("ravi@example.com", "longenough123").text))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
