import { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

interface Props {
  accept: string;
  label: string;
  hint: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}

export default function DropZone({
  accept,
  label,
  hint,
  disabled,
  onFile,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const choose = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`drop-zone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
      onClick={choose}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") choose();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }}
      />
      <div className="drop-icon">
        {dragging ? <FileText size={24} /> : <UploadCloud size={24} />}
      </div>
      <div>
        <strong>{label}</strong>
        <p>{hint}</p>
      </div>
    </div>
  );
}