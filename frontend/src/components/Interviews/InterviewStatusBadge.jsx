import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  RotateCcw,
  XCircle,
} from "lucide-react";

import "../../styles/InterviewCSS/InterviewStatusBadge.css";

export default function InterviewStatusBadge({ status }) {
  const normalizedStatus = String(status || "Scheduled").toLowerCase();

  let label = status || "Scheduled";
  let className = "scheduled";
  let Icon = CalendarCheck2;

  if (normalizedStatus === "completed") {
    label = "Completed";
    className = "completed";
    Icon = CheckCircle2;
  } else if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    label = "Cancelled";
    className = "cancelled";
    Icon = XCircle;
  } else if (normalizedStatus === "rescheduled") {
    label = "Rescheduled";
    className = "rescheduled";
    Icon = RotateCcw;
  } else if (normalizedStatus === "scheduled") {
    label = "Scheduled";
    className = "scheduled";
    Icon = Clock3;
  }

  return (
    <span className={`interview-status-badge ${className}`}>
      <Icon />
      {label}
    </span>
  );
}
