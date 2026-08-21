import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Bell, Bookmark, BriefcaseBusiness, ChevronDown, FileText, Grid2X2,
  LogOut, MapPin, MessageSquare, Search, Settings, SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { candidateApi, jobsApi, notificationApi, savedJobsApi } from "../services/api";
import "../styles/UserJobs.css";

export default function UserJobs() {
  const navigate = useNavigate();
  const session = JSON.parse(sessionStorage.getItem("user") || "null");
  const [profile, setProfile] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resume, setResume] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("All types");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (session?.role !== "User") return;
    Promise.allSettled([jobsApi.all(), candidateApi.profile(), candidateApi.applications(), candidateApi.resume(), notificationApi.mine(), savedJobsApi.mine()])
      .then(([j,p,a,r,n,s]) => {
        if(j.status==="fulfilled") setJobs(j.value.filter(job=>job.isActive));
        if(p.status==="fulfilled") setProfile(p.value);
        if(a.status==="fulfilled") setApplications(a.value);
        if(r.status==="fulfilled") setResume(r.value);
        if(n.status==="fulfilled") setNotifications(n.value);
        if(s.status==="fulfilled") setSaved(s.value.map(item=>item.jobId));
      });
  }, [session?.role]);

  const types = useMemo(() => ["All types", ...new Set(jobs.map(job=>job.employmentType).filter(Boolean))], [jobs]);
  const visibleJobs = useMemo(() => jobs.filter(job => {
    const searchText=`${job.title} ${job.companyName} ${job.skills} ${job.description}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase()) && job.location.toLowerCase().includes(location.trim().toLowerCase()) && (type==="All types" || job.employmentType===type);
  }), [jobs,query,location,type]);
  const unread=notifications.filter(item=>!item.isRead).length;

  if(!session) return <Navigate to="/login" replace/>;
  if(session.role!=="User") return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace/>;

  async function apply(jobId){
    if(!resume) return setMessage("Apply karne se pehle apna resume upload karein.");
    if(applications.some(item=>item.jobId===jobId)) return setMessage("Aap is job ke liye already apply kar chuke hain.");
    try{setMessage(await candidateApi.apply(jobId,resume.id));setApplications(await candidateApi.applications());}catch(error){setMessage(error.message);}
  }
  async function toggleSaved(id){try{if(saved.includes(id)){await savedJobsApi.remove(id);setSaved(items=>items.filter(item=>item!==id));}else{await savedJobsApi.save(id);setSaved(items=>[...items,id]);}}catch(error){setMessage(error.message);}}
  function logout(){fetch("/api/Auth/logout",{method:"POST"}).catch(()=>{});sessionStorage.removeItem("user");navigate("/login");}

  return <div className="user-jobs-page">
    <aside className="user-jobs-sidebar"><Link className="uj-logo" to="/">HireLine<small>Find Your Dream Job</small></Link><nav>
      <Link to="/user/dashboard"><Grid2X2/>Dashboard</Link><Link className="active" to="/user/jobs"><BriefcaseBusiness/>Browse Jobs</Link><Link to="/user/applications"><FileText/>My Applications</Link><Link to="/user/resume"><FileText/>Resume</Link><Link to="/user/saved-jobs"><Bookmark/>Saved Jobs <b>{saved.length}</b></Link><Link to="/user/messages"><MessageSquare/>Messages</Link><Link to="/user/profile"><UserRound/>Profile</Link><Link to="/user/settings"><Settings/>Settings</Link>
    </nav><button className="uj-logout" onClick={logout}><LogOut/>Logout</button></aside>

    <main className="user-jobs-main">
      <header className="user-jobs-topbar"><div><h1>Browse Jobs</h1><p>Discover opportunities posted by verified companies.</p></div><button aria-label="Notifications"><Bell/>{unread>0&&<i>{unread>9?"9+":unread}</i>}</button><div className="uj-user"><span>{profile.photoUrl?<img src={profile.photoUrl} alt=""/>:profile.name?.slice(0,1)||"U"}</span><div><strong>{profile.name||session.name}</strong><small>Candidate</small></div></div></header>

      <section className="user-jobs-hero"><span>Find your next opportunity</span><h2>Search jobs that match<br/>your ambition.</h2><p>Every role below has been published directly by a company on HireLine.</p><div className="uj-searchbar"><label><Search/><span><small>Job title, company or skill</small><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="React developer, Microsoft..."/></span></label><label><MapPin/><span><small>Location</small><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Bangalore or Remote"/></span></label><button onClick={()=>document.querySelector("#company-jobs")?.scrollIntoView({behavior:"smooth"})}>Search Jobs</button></div></section>

      <section className="user-jobs-content" id="company-jobs"><div className="uj-results-head"><div><span>Company opportunities</span><h2>{visibleJobs.length} jobs found</h2></div><label><SlidersHorizontal/><select value={type} onChange={e=>setType(e.target.value)}>{types.map(item=><option key={item}>{item}</option>)}</select><ChevronDown/></label></div>
        {message&&<div className="uj-message">{message}</div>}
        <div className="uj-job-grid">{visibleJobs.map(job=>{const applied=applications.some(item=>item.jobId===job.id);return <article className="uj-job-card" key={job.id}>
          <header><div className="uj-company-logo">{job.companyName?.slice(0,1)}</div><button className={saved.includes(job.id)?"saved":""} onClick={()=>toggleSaved(job.id)} aria-label="Save job"><Bookmark/></button></header>
          <div className="uj-company-name">{job.companyName}<span>Company posted</span></div><h3>{job.title}</h3><div className="uj-job-tags"><span>{job.employmentType}</span><span>{job.experience} years</span><span>{job.vacancies} vacancies</span></div>
          <p>{job.description?.slice(0,125)}{job.description?.length>125?"…":""}</p><div className="uj-skills">{job.skills?.split(",").slice(0,4).map(skill=><span key={skill}>{skill.trim()}</span>)}</div>
          <footer><div><MapPin/><span>{job.location}<small>₹{Number(job.salary||0).toLocaleString("en-IN")}</small></span></div><button disabled={applied} onClick={()=>apply(job.id)}>{applied?"Applied":"Apply Now"}</button></footer>
        </article>})}{!visibleJobs.length&&<div className="uj-empty"><Search/><h3>No related jobs found</h3><p>Try another title, company, skill or location.</p><button onClick={()=>{setQuery("");setLocation("");setType("All types");}}>Clear filters</button></div>}</div>
      </section>
    </main>
  </div>;
}
