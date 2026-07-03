import { requireActorFromSession } from "@/lib/auth-context";
import { listTranslations } from "@/lib/services/translations";
import { TranslationsClient } from "./TranslationsClient";

export const metadata = { title: "Translations", robots: { index: false, follow: false } };

export default async function TranslationsAdminPage() {
  await requireActorFromSession();
  const translations = await listTranslations("en");
  return <TranslationsClient initialTranslations={translations} />;
}
