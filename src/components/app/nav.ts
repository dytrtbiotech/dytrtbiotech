import type { ComponentType } from "react";
import {
  IconCarePlan,
  IconOverview,
  IconProfile,
  IconSettings,
} from "@/components/app/nav-icons";

type IconProps = { className?: string };

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
};

export const APP_NAV: NavItem[] = [
  { href: "/prehled", label: "Přehled", icon: IconOverview },
  { href: "/prubeh-pece", label: "Průběh péče", icon: IconCarePlan },
  { href: "/profil", label: "Můj profil", icon: IconProfile },
  { href: "/nastaveni", label: "Nastavení", icon: IconSettings },
];
