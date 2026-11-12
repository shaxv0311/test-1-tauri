export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 5 }, (_, i) =>
  String(CURRENT_YEAR - i),
);
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const CURRENT_MONTH = MONTHS[new Date().getMonth()];

export const QUALITY_OPTIONS = [
  { label: "First Quality", value: "First Quality" },
  { label: "Second Hand", value: "Second Hand" },
];
