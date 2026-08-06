import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ProgressPage() {
  return (
    <ComingSoon
      icon={LineChart}
      title="Progress"
      description="Weight trends, measurements, and photos will live here soon."
    />
  );
}
