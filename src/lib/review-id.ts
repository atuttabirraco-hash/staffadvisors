export function reviewCode(id: string) {
  return `#${id.split("-")[0]?.toUpperCase() ?? id.toUpperCase()}`;
}

export function reviewMatches(id: string, query: string) {
  const needle = query.trim().replace(/^#/, "").toLowerCase();
  if (!needle) return true;
  return id.toLowerCase().includes(needle) || reviewCode(id).toLowerCase().includes(needle);
}