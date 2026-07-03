"use server";

import { signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirectTo: process.env.AUTH_URL + "/login" });
}
