import { db } from "@/lib/db";

/** Public-facing event queries. */

export function listPublicEvents() {
  return db.event.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { startsAt: "asc" },
    include: { cover: { select: { url: true, alt: true } } },
  });
}

export function getPublicEvent(eventSlug: string) {
  return db.event.findFirst({
    where: { slug: eventSlug, status: "PUBLISHED", deletedAt: null },
    include: { cover: { select: { url: true, alt: true } } },
  });
}

// Legacy aliases — public pages used to take org slug; now they just
// ignore it. Kept as passthroughs so routes don't have to change.
export function listPublicEventsByOrg() {
  return listPublicEvents();
}

export function getPublicEventBySlug(eventSlug: string) {
  return getPublicEvent(eventSlug);
}
