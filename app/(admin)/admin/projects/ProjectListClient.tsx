"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Project, ContentStatus } from "@prisma/client";

type ProjectRow = Project;

const columns: Column<ProjectRow>[] = [
  {
    key: "title",
    header: "Title",
    sortable: true,
    render: (row) => (
      <Link href={`/admin/projects/${row.id}`} className="font-medium hover:underline">
        {row.title}
      </Link>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    sortable: true,
    render: (row) => (
      <code className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-fg)]">
        /projects/{row.slug}
      </code>
    ),
  },
  {
    key: "order",
    header: "Order",
    sortable: true,
    className: "text-[var(--color-muted-fg)]",
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status as ContentStatus} />,
  },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    render: (row) => (
      <span className="text-[var(--color-muted-fg)]">
        {new Date(row.updatedAt).toLocaleDateString()}
      </span>
    ),
  },
];

export function ProjectListClient({ data }: { data: ProjectRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Search projects..."
      emptyState={{
        title: "No projects yet",
        description: "Your projects will appear here once you create them.",
        actionLabel: "New project",
        actionHref: "/admin/projects/new",
        icon: FolderKanban,
      }}
    />
  );
}
