function key(user) {
  return `hireline-saved-jobs-${user?.userId || user?.email || "candidate"}`;
}

export function localSavedJobIds(user) {
  try { return JSON.parse(localStorage.getItem(key(user)) || "[]"); }
  catch { return []; }
}

export function writeLocalSavedJobIds(user, ids) {
  localStorage.setItem(key(user), JSON.stringify([...new Set(ids)]));
}

export function mergeSavedJobIds(user, serverItems = []) {
  const ids = [...new Set([...localSavedJobIds(user), ...serverItems.map((item) => item.jobId)])];
  writeLocalSavedJobIds(user, ids);
  return ids;
}
