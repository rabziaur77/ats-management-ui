import { CheckCircle2, LoaderCircle } from "lucide-react";

interface Props {
  text: string;
  loading?: boolean;
}

export default function StatusBar({ text, loading }: Props) {
  return (
    <div className={`status-bar ${loading ? "loading" : "success"}`}>
      {loading ? (
        <LoaderCircle className="spin" size={17} />
      ) : (
        <CheckCircle2 size={17} />
      )}
      <span>{text}</span>
    </div>
  );
}