import { FileCheck2, Layers3, WandSparkles } from "lucide-react";
import type { FormatType } from "../types/resume";

interface Props {
  value: FormatType;
  onChange: (value: FormatType) => void;
  disabled?: boolean;
}

const options: Array<{
  value: FormatType;
  label: string;
  description: string;
  icon: typeof FileCheck2;
}> = [
  {
    value: "default",
    label: "Default Format",
    description: "Keep the converted resume design",
    icon: FileCheck2,
  },
  {
    value: "ats",
    label: "ATS Format",
    description: "Apply the ATS-friendly layout",
    icon: Layers3,
  },
  {
    value: "custom",
    label: "Custom Format",
    description: "Use another PDF as the visual reference",
    icon: WandSparkles,
  },
];

export default function FormatSelector({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="format-grid">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            type="button"
            key={option.value}
            className={`format-card ${active ? "active" : ""}`}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            <span className="format-card-icon">
              <Icon size={19} />
            </span>
            <span className="format-card-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <span className="radio-dot">{active ? "✓" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}