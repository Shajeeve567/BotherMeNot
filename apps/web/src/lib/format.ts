const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** "Oct 9, 2026" in the viewer's locale. */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
