import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import CandidateHeader from "../../components/Candidate/CandidateHeader";

import { candidateApi } from "../../services/api";

import "../../styles/CandidatesCSS/CandidateResume.css";

export default function CandidateResume() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [resume, setResume] = useState(null);
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [atsResult, setAtsResult] = useState(null);

  useEffect(() => {
    if (session?.role !== "User") return;

    loadResume();
  }, [session?.role]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  async function loadResume() {
    try {
      setLoading(true);
      setError("");

      const response = await candidateApi.resume();

      setResume(response || null);

      /*
       * If your backend already returns ATS analysis
       * along with resume details.
       */
      if (response?.atsScore !== undefined) {
        setAtsResult({
          atsScore: response.atsScore,
          matchedSkills: response.matchedSkills || [],
          missingSkills: response.missingSkills || [],
          strengths: response.strengths || [],
          suggestions: response.suggestions || [],
        });
      }
    } catch (err) {
      setError(err?.message || "Unable to load resume.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // ========================================================
    // FILE TYPE VALIDATION
    // Allowed:
    // PDF, DOC, DOCX and WORD
    // ========================================================

    const allowedExtensions = [".pdf", ".docx"];

    const extension = "." + selectedFile.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a PDF or DOCX file.");

      setFile(null);
      return;
    }

    // ========================================================
    // FILE SIZE VALIDATION
    // ========================================================

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Resume size must be less than 5 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function uploadResume() {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      /*
       * Your candidateApi.uploadResume()
       * should send multipart/form-data to backend.
       */
      const uploadedResume = await candidateApi.uploadResume(file);

      setResume(uploadedResume || null);
      setAtsResult(null);
      setFile(null);
      setMessage("Resume uploaded successfully. Run AI analysis when you're ready.");
    } catch (err) {
      setError(err?.message || "Unable to upload resume.");
    } finally {
      setUploading(false);
    }
  }

  async function analyzeResume(resumeId = resume?.id) {
    if (!resumeId) {
      setError("Resume ID is not available.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setMessage("");

      const result = await candidateApi.analyzeResume(resumeId);

      setAtsResult({
        atsScore: Number(result?.atsScore || 0),
        matchedSkills: result?.matchedSkills || [],
        missingSkills: result?.missingSkills || [],
        strengths: result?.strengths || [],
        suggestions: result?.suggestions || [],
        summary: result?.summary || "",
        analysisMode: result?.analysisMode || "AI",
      });

      setMessage(
        result?.analysisMode === "Local"
          ? "Resume analysis completed with the built-in review. AI quota is currently unavailable."
          : "AI resume analysis completed.",
      );
    } catch (err) {
      setError(err?.message || "Unable to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  }

  function getScoreClass(score) {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";

    return "low";
  }

  return (
    <div className="candidate-dashboard-layout">
      <section className="candidate-sidebar">
        <CandidateSidebar />
      </section>

      <main className="candidate-page">
        <CandidateHeader
          title="Resume"
          subtitle="Upload your resume and get an ATS score with practical feedback."
        />

        <div className="candidate-resume-content">
          {/* ==========================================
              PAGE INTRO
          ========================================== */}

          <section className="candidate-resume-intro">
            <div>
              <span className="candidate-resume-eyebrow">
                AI Resume Analyzer
              </span>

              <h2>Build a resume that gets noticed.</h2>

              <p>
                Upload your latest resume to see its ATS score, strengths,
                profile-related skill gaps, and practical improvements.
              </p>
            </div>

            <div className="candidate-resume-ats-icon">
              <Sparkles />
            </div>
          </section>

          {/* ==========================================
              MESSAGE
          ========================================== */}

          {message && (
            <div className="candidate-resume-message success">
              <CheckCircle2 />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="candidate-resume-message error">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* ==========================================
              UPLOAD SECTION
          ========================================== */}

          <section className="candidate-resume-upload-card">
            <div className="candidate-resume-section-heading">
              <div>
                <h3>Upload Resume</h3>

                <p>PDF or DOCX files up to 5 MB.</p>
              </div>
            </div>

            <label className="candidate-resume-dropzone">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />

              <div className="candidate-resume-upload-icon">
                <Upload />
              </div>

              <strong>
                {file ? file.name : "Click to select your resume"}
              </strong>

              <span>Drag and drop or browse your computer</span>

              <small>Accepted formats: PDF and DOCX</small>
            </label>

            {file && (
              <button
                type="button"
                className="candidate-resume-upload-button"
                onClick={uploadResume}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="candidate-resume-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload />
                    Upload Resume
                  </>
                )}
              </button>
            )}
          </section>

          {/* ==========================================
              CURRENT RESUME
          ========================================== */}

          {!loading && resume && (
            <section className="candidate-resume-current-card">
              <div className="candidate-resume-file-icon">
                <FileText />
              </div>

              <div className="candidate-resume-file-info">
                <strong>
                  {resume.fileName ||
                    resume.originalFileName ||
                    "Current Resume"}
                </strong>

                <span>Your latest resume is available for applications.</span>
              </div>

              <button
                type="button"
                className="candidate-resume-analyze-button"
                onClick={() => analyzeResume(resume.id)}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="candidate-resume-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Analyze resume
                  </>
                )}
              </button>
            </section>
          )}

          {/* ==========================================
              ATS RESULT
          ========================================== */}

          {atsResult && (
            <section className="candidate-resume-analysis">
              <div className="candidate-resume-analysis-heading">
                <div>
                  <span className="candidate-resume-eyebrow">
                    {atsResult.analysisMode === "Local"
                      ? "Resume Analysis · Local Review"
                      : "AI Analysis"}
                  </span>

                  <h2>Your ATS Resume Score</h2>

                  <p>
                    Resume feedback highlights strengths and ways to improve
                    your profile. The score uses consistent ATS criteria.
                  </p>
                </div>

                <Sparkles />
              </div>

              {/* SCORE */}

              <div className="candidate-resume-score-card">
                <div
                  className={`candidate-resume-score-circle ${getScoreClass(
                    atsResult.atsScore,
                  )}`}
                >
                  <strong>{Math.round(atsResult.atsScore)}</strong>

                  <span>/100</span>
                </div>

                <div className="candidate-resume-score-info">
                  <h3>
                    {atsResult.atsScore >= 80
                      ? "Excellent Resume"
                      : atsResult.atsScore >= 60
                        ? "Good Resume"
                        : atsResult.atsScore >= 40
                          ? "Needs Improvement"
                          : "Needs Major Improvement"}
                  </h3>

                  <p>
                    Your ATS score is paired with feedback based on the resume
                    text.
                  </p>
                </div>
              </div>

              {atsResult.summary && (
                <div className="candidate-resume-analysis-card">
                  <h3>
                    {atsResult.analysisMode === "Local"
                      ? "Resume review summary"
                      : "AI resume summary"}
                  </h3>
                  <p>{atsResult.summary}</p>
                </div>
              )}

              {/* ======================================
                  SKILLS
              ====================================== */}

              <div className="candidate-resume-analysis-grid">
                <div className="candidate-resume-analysis-card">
                  <h3>Matched Skills</h3>

                  {atsResult.matchedSkills?.length > 0 ? (
                    <div className="candidate-resume-tags">
                      {atsResult.matchedSkills.map((skill, index) => (
                        <span key={`${skill}-${index}`}>{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p>No matched skills detected.</p>
                  )}
                </div>

                <div className="candidate-resume-analysis-card">
                  <h3>Missing Skills</h3>

                  <p>
                    Skills below are profile-related keywords not found in the
                    resume text. Include them only if they reflect your real
                    experience.
                  </p>

                  {atsResult.missingSkills?.length > 0 ? (
                    <div className="candidate-resume-tags missing">
                      {atsResult.missingSkills.map((skill, index) => (
                        <span key={`${skill}-${index}`}>{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p>No major missing skills detected.</p>
                  )}
                </div>
              </div>

              {/* ======================================
                  STRENGTHS
              ====================================== */}

              <div className="candidate-resume-analysis-card">
                <h3>AI identified strengths</h3>

                {atsResult.strengths?.length > 0 ? (
                  <ul className="candidate-resume-list">
                    {atsResult.strengths.map((item, index) => (
                      <li key={index}>
                        <CheckCircle2 />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No detected skills available yet.</p>
                )}
              </div>

              {/* ======================================
                  SUGGESTIONS
              ====================================== */}

              <div className="candidate-resume-analysis-card suggestions">
                <div className="candidate-resume-suggestion-title">
                  <Sparkles />

                  <h3>AI suggestions</h3>
                </div>

                {atsResult.suggestions?.length > 0 ? (
                  <ul className="candidate-resume-list">
                    {atsResult.suggestions.map((item, index) => (
                      <li key={index}>
                        <span className="candidate-resume-number">
                          {index + 1}
                        </span>

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No suggestions were returned for this resume.
                  </p>
                )}
              </div>

              {/* Re-analyze */}

              <button
                type="button"
                className="candidate-resume-reanalyze"
                onClick={() => analyzeResume(resume?.id)}
                disabled={analyzing}
              >
                <RefreshCw />
                Re-run AI analysis
              </button>
            </section>
          )}

          {/* ==========================================
              NO RESUME
          ========================================== */}

          {!loading && !resume && (
            <div className="candidate-resume-empty">
              <FileText />

              <h3>No resume uploaded</h3>

              <p>
                Upload your resume above to receive your keyword-based ATS
                score.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
