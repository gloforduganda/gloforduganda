"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "@/lib/services/teamMembers";

export async function createTeamMemberAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const socialLinks: Record<string, string> = {};
  for (const key of ["linkedin", "twitter", "instagram", "facebook", "website"]) {
    const val = formData.get(`social_${key}`) as string | null;
    if (val?.trim()) socialLinks[key] = val.trim();
  }
  await createTeamMember(actor, {
    name: formData.get("name") as string,
    role: formData.get("role") as string,
    department: (formData.get("department") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    order: Number(formData.get("order") ?? 0),
    socialLinks,
  });
  revalidatePath("/admin/team");
  revalidatePath("/leadership", "page");
  revalidateTag("team-members");
}

export async function updateTeamMemberAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const id = formData.get("id") as string;
  const socialLinks: Record<string, string> = {};
  for (const key of ["linkedin", "twitter", "instagram", "facebook", "website"]) {
    const val = formData.get(`social_${key}`) as string | null;
    if (val?.trim()) socialLinks[key] = val.trim();
  }
  await updateTeamMember(actor, id, {
    name: formData.get("name") as string,
    role: formData.get("role") as string,
    department: (formData.get("department") as string) || null,
    bio: (formData.get("bio") as string) || null,
    photoUrl: (formData.get("photoUrl") as string) || null,
    email: (formData.get("email") as string) || null,
    order: Number(formData.get("order") ?? 0),
    isActive: formData.get("isActive") === "true",
    socialLinks,
  });
  revalidatePath("/admin/team");
  revalidatePath("/leadership", "page");
  revalidateTag("team-members");
}

export async function deleteTeamMemberAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const id = formData.get("id") as string;
  await deleteTeamMember(actor, id);
  revalidatePath("/admin/team");
  revalidatePath("/leadership", "page");
  revalidateTag("team-members");
}

export async function toggleTeamMemberAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateTeamMember(actor, id, { isActive: !isActive });
  revalidatePath("/admin/team");
  revalidatePath("/leadership", "page");
  revalidateTag("team-members");
}
