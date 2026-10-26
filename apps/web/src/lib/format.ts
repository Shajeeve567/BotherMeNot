const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** "Oct 9, 2026" in the viewer's locale. */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/** "Oct 9, 2026, 3:42 PM" in the viewer's locale. */
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

/** "just now", "5 min ago", "3 h ago", then the plain date once it is more than a day old. */
export function formatAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return formatDate(iso);
}
