import React from "react";

function StatusBadge({ status }) {
  const key = (status || "").toLowerCase();

  let classes =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ";

  if (key === "signed") {
    classes += "bg-green-100 text-green-800";
  } else if (key === "rejected") {
    classes += "bg-red-100 text-red-800";
  } else {
    // Pending or default
    classes += "bg-yellow-100 text-yellow-800";
  }

  return <span className={classes}>{status || "Pending"}</span>;
}

export default StatusBadge;
