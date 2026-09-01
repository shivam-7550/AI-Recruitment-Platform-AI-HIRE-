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

    const allowedExtensions = [".pdf", ".doc", ".docx", ".word"];

    const extension = "." + selectedFile.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a PDF, DOC, DOCX, or WORD file.");

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
      setFile(null);

      setMessage("Resume uploaded successfully.");

      /*
       * After successful upload, calculate deterministic ATS score.
       */
      if (uploadedResume?.id) {
        await analyzeResume(uploadedResume.id);
      }
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

      // Candidate-side ATS is deterministic. AI is intentionally
      // restricted to the Company portal.
      const result = await candidateApi.resume();

      setAtsResult({
        atsScore: Number(result?.atsScore || 0),
        matchedSkills: [],
        missingSkills: [],
        strengths: [],
        suggestions: [],
      });

      setMessage("ATS keyword analysis completed.");
    } catch (err) {
      setError(err?.message || "Unable to calculate ATS score.");
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
          subtitle="Upload your resume and get a keyword-based ATS analysis."
        />

        <div className="candidate-resume-content">
          {/* ==========================================
              PAGE INTRO
          ========================================== */}

          <section className="candidate-resume-intro">
            <div>
              <span className="candidate-resume-eyebrow">
                Resume ATS Analyzer
              </span>

              <h2>Build a resume that gets noticed.</h2>

              <p>
                Upload your latest resume and calculate its ATS compatibility,
                skills, strengths and improvement areas.
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

                <p>PDF, DOC, DOCX or WORD files up to 5 MB.</p>
              </div>
            </div>

            <label className="candidate-resume-dropzone">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.word,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />

              <div className="candidate-resume-upload-icon">
                <Upload />
              </div>

              <strong>
                {file ? file.name : "Click to select your resume"}
              </strong>

              <span>Drag and drop or browse your computer</span>

              <small>Accepted formats: PDF, DOC, DOCX and WORD</small>
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
                    Calculating ATS...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Calculate ATS
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
                  <span className="candidate-resume-eyebrow">ATS Analysis</span>

                  <h2>Your ATS Resume Score</h2>

                  <p>
                    ATS keyword analysis checks your resume skills and overall
                    recruitment readiness.
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
                    Your resume has been evaluated using keyword-based ATS
                    analysis.
                  </p>
                </div>
              </div>

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
                <h3>Detected Skills</h3>

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

                  <h3>ATS Information</h3>
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
                    ATS score is calculated using deterministic keyword
                    matching.
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
                Recalculate ATS
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
