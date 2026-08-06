import { Dumbbell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function TrainPage() {
  return (
    <ComingSoon
      icon={Dumbbell}
      title="Today's workout"
      description="Your circuit, sets, and rest timer will show up here soon."
    />
  );
}
