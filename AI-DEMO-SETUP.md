# AI-Hire Demo Setup

## AI scope

- Candidate portal: **no Gemini/LLM call**.
- Candidate/job ATS score: **deterministic keyword matching**.
- Company portal: **Gemini AI candidate analysis** is available from the application details modal.

## Company AI endpoint

`POST /api/Application/{applicationId}/ai-analysis`

The endpoint is protected with the `Company` role and uses the application, candidate resume, and job information to return:

- Summary
- Strengths
- Missing job skills
- Suggestions
- Interview focus

The AI is explicitly instructed not to calculate or replace the ATS score.

## Gemini key

Do **not** put the real Gemini API key in `appsettings.json`. The project expects it from configuration/environment.

PowerShell example for the current terminal:

```powershell
$env:GEMINI_API_KEY = "YOUR_NEW_GEMINI_KEY"
$env:Jwt__Key = "YOUR_NEW_LONG_RANDOM_JWT_SECRET"

cd Backend
dotnet run --project Backend/Backend.csproj
```

You can also use ASP.NET Core User Secrets for local development.

The Gemini Interactions API is used by `ResumeAIService`. Gemini's current documentation recommends the Interactions API for new applications and documents `gemini-3.6-flash` as a supported model.

## Demo flow

1. Admin approves company.
2. Company creates a job with required skills.
3. Candidate uploads PDF resume.
4. Candidate applies.
5. ATS score is calculated by required-skill keyword matching.
6. Company opens the application.
7. Company clicks **Analyze with AI**.
8. Company receives candidate summary, strengths, missing skills, suggestions and interview focus.

## Important

The previous repository contained real secrets. Rotate/revoke the old Gemini key and JWT secret before using the project again.
