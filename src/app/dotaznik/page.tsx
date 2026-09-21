import type { Metadata } from "next";
import ScreeningApp from "@/components/screening/ScreeningApp";
import "@/components/app/process-sidebar.css";
import "./screening.css";

export const metadata: Metadata = {
  title: "Screening | FOLLICAD",
  description:
    "Krátký screening o vašich vlasech. Orientační profil zdarma, bez automatické objednávky.",
};

export default function DotaznikPage() {
  return <ScreeningApp />;
}
