import AppShell from "@/components/app/AppShell";
import "./app-shell.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
