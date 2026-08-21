import CandidateSidebar from "../components/candidate/CandidateSidebar";

export default function CandidateExploreJobs() {
  return (
    <div className="candidate-dashboard-layout">
      <CandidateSidebar />

      <main className="candidate-page">{/* Explore Jobs content */}</main>
    </div>
  );
}
