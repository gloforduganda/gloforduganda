"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createEvent, updateEvent, deleteEvent,
  createEventNotification, updateEventNotification,
  deleteEventNotification, sendEventNotificationNow,
} from "@/lib/services/events";
import { upsertDocuments, deleteDocument, eventToDoc } from "@/lib/search/sync";
import { db } from "@/lib/db";

export async function createEventAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createEvent(actor, raw);
  revalidatePath("/admin/events");
  revalidatePath("/events", "page");
  void upsertDocuments([eventToDoc(row)]).catch(() => {});
  redirect(`/admin/events/${row.id}`);
}

export async function updateEventAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await updateEvent(actor, raw);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${row.id}`);
  revalidatePath("/events", "page");
  revalidatePath(`/events/${row.slug}`, "page");
  void upsertDocuments([eventToDoc(row)]).catch(() => {});
}

export async function deleteEventAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const evt = await db.event.findUnique({ where: { id: (raw as { id: string }).id }, select: { id: true } });
  await deleteEvent(actor, raw);
  revalidatePath("/admin/events");
  revalidatePath("/events", "page");
  if (evt) void deleteDocument(`events:${evt.id}`).catch(() => {});
  redirect("/admin/events");
}

export async function createEventNotificationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createEventNotification(actor, raw);
  revalidatePath(`/admin/events/${(raw as { eventId: string }).eventId}`);
  return row.id;
}

export async function updateEventNotificationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateEventNotification(actor, raw);
  revalidatePath("/admin/events");
}

export async function deleteEventNotificationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteEventNotification(actor, raw);
  revalidatePath("/admin/events");
}

export async function sendEventNotificationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await sendEventNotificationNow(actor, raw);
  revalidatePath("/admin/events");
}
