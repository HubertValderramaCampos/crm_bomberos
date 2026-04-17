type Color = "green" | "red" | "yellow" | "blue" | "gray" | "orange";

const COLORS: Record<Color, string> = {
  green:  "bg-green-100 text-green-800 border-green-200",
  red:    "bg-red-100 text-red-800 border-red-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  blue:   "bg-blue-100 text-blue-800 border-blue-200",
  gray:   "bg-gray-100 text-gray-600 border-gray-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
};

export function StatusBadge({ label, color = "gray" }: { label: string; color?: Color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${COLORS[color]}`}>
      {label}
    </span>
  );
}
