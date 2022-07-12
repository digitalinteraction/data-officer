type Segment = "*" | number | [number, number];

interface CronExpr {
  minutes: Segment[];
  hours: Segment[];
  daysOfMonth: Segment[];
  months: Segment[];
  daysOfWeek: Segment[];
}

export function _parseRange(
  input: string,
  min: number,
  max: number,
): Segment[] {
  function assertRange(n: number) {
    if (n >= min && n <= max) return;
    throw new Error(
      `Bad cron segment '${n}', allowed range ${min}:${max}`,
    );
  }

  const sections = input.split(",");
  const output: Segment[] = [];

  for (const section of sections) {
    if (input === "*") {
      output.push("*");
      break;
    }

    const rangeMatch = /^(\d)+-(\d)+$/.exec(section);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      assertRange(start);
      assertRange(end);
      output.push([start, end]);
      continue;
    }

    const numberMatch = /^\d+$/.exec(section);
    if (numberMatch) {
      const value = parseInt(section);
      assertRange(value);
      output.push(value);
      continue;
    }

    throw new Error(`Bad cron segment '${section}'`);
  }
  return output;
}

/** Experimental */
export function parseCronExpression(input: string) {
  const components = input.split(/\s+/);
  if (components.length !== 5) return null;

  const [minutes, hours, daysOfMonth, months, daysOfWeek] = components;

  const cron: CronExpr = {
    minutes: _parseRange(minutes, 0, 59),
    hours: _parseRange(hours, 0, 23),
    daysOfMonth: _parseRange(daysOfMonth, 1, 31),
    months: _parseRange(months, 0, 11),
    daysOfWeek: _parseRange(daysOfWeek, 0, 6),
  };

  return cron;
}
