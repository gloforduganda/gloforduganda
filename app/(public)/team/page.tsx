import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the dedicated team behind our mission and programs.",
};

// The team page is the same as leadership — redirect for clean URLs
export default function TeamPage() {
  redirect("/leadership");
}
