import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bell, BriefcaseBusiness, CalendarDays,
  FileSearch, Gauge, Menu, MessageSquare, Search, Settings,
  ShieldCheck, Sparkles, Target, Users, UserSearch, Zap,
} from "lucide-react";
import "../styles/landing.css";

const features = [
  [FileSearch, "AI-powered screening", "Automatically screen resumes and rank the best candidates.", "violet"],
  [Target, "Smart talent matching", "Match candidates to roles using skills, experience and relevance.", "green"],
  [CalendarDays, "Interview automation", "Organize interviews and keep every hiring stage moving.", "blue"],
  [ShieldCheck, "Bias-aware hiring", "Support consistent, evidence-based candidate evaluations.", "orange"],
  [Users, "Collaboration tools", "Review talent together and keep feedback in one workspace.", "red"],
  [BarChart3, "Advanced analytics", "Understand your pipeline and make smarter hiring decisions.", "indigo"],
];

const steps = [
  [BriefcaseBusiness, "Create a job", "Publish role details and define what great talent looks like."],
  [FileSearch, "AI screens & matches", "Shortlist applicants using resume analysis and ATS scoring."],
  [UserSearch, "Review & interview", "Compare candidates, review profiles and conduct interviews."],
  [ShieldCheck, "Hire & onboard", "Select the strongest candidate and close the role confidently."],
];

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/"><Sparkles size={20} /> Hireline</Link>
        <nav aria-label="Main navigation">
          <a href="#product">Product</a><a href="#solutions">Solutions</a>
          <a href="#process">How it works</a><Link to="/jobs">Jobs</Link>
          <a href="#about">About us</a>
        </nav>
        <div className="landing-nav-actions">
          <Link className="plain-link" to="/login">Log in</Link>
          <Link className="black-button compact" to="/register/candidate">Get started free</Link>
        </div>
        <button className="mobile-menu" type="button" aria-label="Open navigation"><Menu /></button>
      </header>

      <main>
        <section className="landing-hero" id="product">
          <div className="hero-copy">
            <div className="hero-pill"><Sparkles size={13} /> AI-powered recruitment platform</div>
            <h1>Hire Smarter.<br />Build Stronger Teams.</h1>
            <p>AI-powered screening, intelligent matching and automated workflows to help you find the right talent—faster.</p>
            <div className="hero-actions">
              <Link className="black-button" to="/register/company">Start hiring for free <ArrowRight size={16} /></Link>
              <Link className="outline-button" to="/register/candidate">Find your next role</Link>
            </div>
            <div className="hero-benefits">
              <span><FileSearch /> AI screening</span><span><Target /> Smart matching</span>
              <span><ShieldCheck /> Fair evaluation</span><span><Zap /> Save time</span>
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section className="trust-strip" aria-label="Platform benefits">
          <p>Built for modern, fast-growing teams</p>
          <div><strong>Startups</strong><strong>Agencies</strong><strong>Enterprises</strong><strong>Remote teams</strong><strong>Universities</strong></div>
        </section>

        <section className="feature-section" id="solutions">
          <div className="section-copy">
            <span>Why Hireline?</span><h2>Everything you need to hire the best talent</h2>
            <p>From intelligent screening to interview coordination, Hireline helps teams discover and evaluate the right people with clarity.</p>
            <a href="#process">Explore the process <ArrowRight size={15} /></a>
          </div>
          <div className="feature-grid">
            {features.map(([Icon, title, text, color]) => (
              <article className="feature-card" key={title}>
                <div className={`feature-icon ${color}`}><Icon /></div><h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="center-heading"><span>How it works</span><h2>Hire in 4 simple steps</h2></div>
          <div className="steps-grid">
            {steps.map(([Icon, title, text], index) => (
              <article className="step-card" key={title}>
                <div className="step-icon"><Icon /></div><div className="step-title"><b>{index + 1}</b><h3>{title}</h3></div><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="results-section" id="about">
          <div className="metric"><Gauge /><strong>70%</strong><b>Faster hiring</b><span>Reduce time-to-hire with focused workflows.</span></div>
          <div className="metric"><Target /><strong>90%</strong><b>Better matches</b><span>Connect candidates with relevant roles.</span></div>
          <div className="metric"><Users /><strong>500+</strong><b>Teams supported</b><span>Designed for growing hiring teams.</span></div>
          <div className="metric"><BriefcaseBusiness /><strong>10K+</strong><b>Applications</b><span>Candidate journeys managed clearly.</span></div>
          <blockquote><span>“</span><p>Hireline brings jobs, applicants and team decisions into one simple workspace. We spend less time managing and more time hiring.</p><footer><div className="quote-avatar">SS</div><div><strong>Shivam Shukla</strong><small>Hiring team</small></div></footer></blockquote>
        </section>

        <section className="landing-cta">
          <div><h2>Ready to transform<br />your hiring?</h2><p>Join Hireline and build stronger teams with a clearer recruitment workflow.</p></div>
          <div><Link className="black-button" to="/register/company">Start hiring for free <ArrowRight size={16} /></Link><Link className="outline-button" to="/register/candidate">Join as candidate</Link></div>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-brand" to="/"><Sparkles size={18} /> Hireline</Link>
        <nav><a href="#product">Product</a><a href="#solutions">Solutions</a><a href="#process">Process</a><Link to="/jobs">Jobs</Link></nav>
        <span>© 2026 Hireline</span>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return <div className="preview-shell" aria-label="Hireline dashboard preview">
    <aside><strong><Sparkles size={15} /> Hireline</strong>
      {[Gauge, BriefcaseBusiness, Users, CalendarDays, MessageSquare, BarChart3, Settings].map((Icon, i) => <div className={i === 0 ? "active" : ""} key={i}><Icon />{["Dashboard", "Jobs", "Candidates", "Interviews", "Messages", "Analytics", "Settings"][i]}</div>)}
    </aside>
    <div className="preview-main">
      <header><div><h3>Good morning, Shivam! 👋</h3><p>Here’s what’s happening with your hiring today.</p></div><span><Search /><Bell /></span></header>
      <div className="preview-stats">{[["28", "Open jobs"], ["342", "Candidates"], ["56", "Interviews"], ["12", "Offers made"]].map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span><small>↑ Active this week</small></article>)}</div>
      <div className="preview-panels">
        <article><h4>AI match overview</h4><div className="match-chart"><div><strong>87%</strong><small>Excellent match</small></div></div><p><i /> Excellent <b>87%</b></p><p><i /> Good <b>10%</b></p><p><i /> Average <b>3%</b></p></article>
        <article><h4>Top candidates <small>View all</small></h4>{[["AJ", "Aarav Joshi", "96%"], ["NP", "Neha Patel", "92%"], ["RK", "Riya Kapoor", "90%"], ["DS", "Dev Sharma", "88%"]].map(([initials, name, score]) => <div className="candidate-row" key={name}><i>{initials}</i><span><b>{name}</b><small>Product candidate</small></span><em>{score}</em></div>)}</article>
      </div>
    </div>
  </div>;
}

export default Landing;
