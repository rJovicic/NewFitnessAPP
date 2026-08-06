import { UtensilsCrossed } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function LogPage() {
  return (
    <ComingSoon
      icon={UtensilsCrossed}
      title="Meal logging"
      description="Scan a barcode or log today's plan meals here soon."
    />
  );
}
