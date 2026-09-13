import { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "SIH 2026 Tracker",
};

export default function Page() {
  return <Dashboard />;
}