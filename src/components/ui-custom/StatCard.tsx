import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "red" | "blue" | "green" | "yellow" | "slate";
}

const ACCENT_MAP = {
  red:    { bg: "bg-red-50",    border: "border-red-100",   icon: "bg-red-700 text-white",  value: "text-red-800"   },
  blue:   { bg: "bg-blue-50",   border: "border-blue-100",  icon: "bg-blue-700 text-white", value: "text-blue-800"  },
  green:  { bg: "bg-green-50",  border: "border-green-100", icon: "bg-green-700 text-white",value: "text-green-800" },
  yellow: { bg: "bg-amber-50",  border: "border-amber-100", icon: "bg-amber-600 text-white",value: "text-amber-800" },
  slate:  { bg: "bg-slate-50",  border: "border-slate-200", icon: "bg-slate-700 text-white",value: "text-slate-800" },
};

export function StatCard({ icon: Icon, label, value, sub, accent = "slate" }: StatCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <div className={`rounded-xl border ${a.border} ${a.bg} p-5 flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 font-[family-name:var(--font-heading)] ${a.value}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
