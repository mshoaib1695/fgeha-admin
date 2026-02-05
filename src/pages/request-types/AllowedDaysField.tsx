import { Checkbox, Space, Button } from "antd";

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

function parseDays(value: string | undefined): number[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
    .sort((a, b) => a - b);
}

function formatDays(days: number[]): string {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon–Fri
const WEEKENDS = [0, 6]; // Sun, Sat
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface AllowedDaysFieldProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function AllowedDaysField({ value, onChange }: AllowedDaysFieldProps) {
  const selected = parseDays(value);

  const toggle = (day: number) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day].sort((a, b) => a - b);
    onChange?.(formatDays(next));
  };

  const setPreset = (days: number[]) => {
    onChange?.(formatDays(days));
  };

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <Space wrap size="small">
        <Button size="small" type="link" onClick={() => setPreset(WEEKDAYS)}>
          Weekdays (Mon–Fri)
        </Button>
        <Button size="small" type="link" onClick={() => setPreset(WEEKENDS)}>
          Weekends
        </Button>
        <Button size="small" type="link" onClick={() => setPreset(ALL_DAYS)}>
          All days
        </Button>
      </Space>
      <Space wrap size="small">
        {DAYS.map(({ value: day, label }) => (
          <Checkbox
            key={day}
            checked={selected.includes(day)}
            onChange={() => toggle(day)}
          >
            {label}
          </Checkbox>
        ))}
      </Space>
    </Space>
  );
}
