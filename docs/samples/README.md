# Sample import files

Every record is marked **[Example]** and uses reserved `example.com` addresses. They are fixtures for learning and testing the import screen, not real content. Do not publish them.

| File | Kind | Expected preview |
|---|---|---|
| `questions.csv` | questions | 3 valid |
| `questions-with-errors.csv` | questions | 1 valid, 2 invalid (row 3 text too short, row 4 unknown category), 1 duplicate (row 5) |
| `questions.json` | questions | 2 valid |
| `companies.csv` | companies | 2 valid |
| `companies.json` | companies | 1 valid |

`tests/samples.test.ts` runs every file through the real import pipeline and checks these numbers, so this table cannot drift from the code.

To try one: register a source whose permission is Approved or Attribution required (for example a dataset you authored), open Administration, Imports, choose the file and the source, and review the preview.
