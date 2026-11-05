# Import formats

Upload a `.csv` or `.json` file on Administration, Imports. Maximum 1 MB and 1000 rows. UTF-8 text only. Nothing is fetched from the web.

Records are previewed first. After you confirm, they are created as **drafts**. Imports never publish.

## Questions

| Column | Required | Notes |
|---|---|---|
| `text` | yes | 10 to 2000 characters. Markup is removed. |
| `category` | yes | A category slug or its exact name. Unknown categories make the row invalid. |
| `type` | yes | `MULTIPLE_CHOICE`, `SINGLE_ANSWER`, `SHORT_ANSWER`, `LONG_ANSWER`, `CODING`, `SQL`, `SCENARIO`, `BEHAVIORAL`, `SYSTEM_DESIGN`, `COMMUNICATION` (any letter case) |
| `difficulty` | yes | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `answerOutline` | yes | 2 to 3000 characters |
| `roles`, `skills`, `tags`, `hints` | no | CSV: separate with `\|`. JSON: an array |
| `careerStages` | no | `STUDENT`, `FRESHER`, `PROFESSIONAL`. Empty means all |
| `experienceLevels` | no | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`. Empty means all |
| `options` | for multiple choice | CSV: `\|` separated, correct option starts with `*`. Needs 2 or more and one correct |
| `companies` | no | Existing company names or slugs. Only allowed when the source can support the claim (official page, public report, GitHub, user submitted). Unknown companies make the row invalid |
| `explanation`, `exampleAnswer`, `codeSolution`, `codeLanguage` | no | A code solution needs a language |
| `estimatedMinutes` | no | 1 to 240, default 5 |

## Companies

| Column | Required | Notes |
|---|---|---|
| `name` | yes | 2 to 120 characters |
| `website`, `careersUrl` | yes | Public http or https addresses |
| `industry` | yes | |
| `description`, `headquarters` | no | |
| `roleCategories` | no | `\|` separated, or an array in JSON |

## How rows are treated

| Result | Meaning |
|---|---|
| Valid | Will be created as a draft |
| Invalid | Failed validation. The reason names the column |
| Duplicate | Matches an existing record, or an earlier row in the same file. Skipped |
| Skipped | Appeared after the preview (for example created in the meantime) |

Row numbers match the file. For CSV the header is row 1. For JSON the first record is row 1.

The origin of created records comes from the source type (official source: Officially documented, public experience: Community reported, anything else curated: Administrator curated, original: Original practice content). Verification is always Not yet verified.

## Rules that stop an import

- The source is not Approved or Attribution required (preview works, commit does not).
- This exact file was already imported from this source.
- A file over 1 MB, over 1000 rows, not UTF-8, containing binary bytes, or with the wrong extension.
- You did not tick the confirmation box.

If any batch fails during commit, everything inserted is rolled back and the job is marked Failed.

## Error report

When a preview has invalid or duplicate rows, download a CSV with `row`, `status`, `details` and `preview`. Cells that start with `=`, `+`, `-`, `@` or a tab are prefixed so a spreadsheet will not run them.
