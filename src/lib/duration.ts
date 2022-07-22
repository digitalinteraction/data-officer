import { datetime } from "../../deps.ts";

const allUnits = [
  { max: null, durationMs: datetime.DAY, suffix: "d" },
  { max: 24, durationMs: datetime.HOUR, suffix: "h" },
  { max: 60, durationMs: datetime.MINUTE, suffix: "m" },
  { max: 60, durationMs: datetime.SECOND, suffix: "s" },
];

/** Get a human-friendly consice duration of time like `5h 4m 3s` */
export function formatDuration(ms: number): string {
  if (ms === 0) return "0s";

  const result = allUnits
    .map((v) => {
      let value = Math.floor(Math.abs(ms) / v.durationMs);
      if (v.max !== null) value %= v.max;
      return { ...v, value };
    })
    .filter((p) => p.value)
    .map((p) => `${Math.floor(p.value)}${p.suffix}`)
    .join(" ");

  return ms < 0 ? "-" + result : result;
}
