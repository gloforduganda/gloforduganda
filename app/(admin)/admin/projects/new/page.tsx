import { requireActorFromSession } from "@/lib/auth-context";
import { ProjectForm } from "../ProjectForm";

export const metadata = { title: "New project", robots: { index: false, follow: false } };

export default async function NewProject() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      </header>
      <ProjectForm />
    </div>
  );
}
