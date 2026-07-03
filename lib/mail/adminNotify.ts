/**
 * Admin notification emails for inbound submissions.
 * Fire-and-forget — never throws, never blocks the user-facing response.
 *
 * APPLICATION_EMAIL  → career + volunteer applications
 * NOTIFICATION_EMAIL → contact, partner applications
 */
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { db } from "@/lib/db";

type SubmissionType =
  | "contact"
  | "career_application"
  | "volunteer_application"
  | "partner_application";

async function getNotificationEmail(type: SubmissionType): Promise<string | null> {
  try {
    if (type === "career_application" || type === "volunteer_application") {
      if (process.env.APPLICATION_EMAIL) return process.env.APPLICATION_EMAIL;
    }
    if (process.env.NOTIFICATION_EMAIL) return process.env.NOTIFICATION_EMAIL;
    const settings = await db.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { contact: true },
    });
    const contact = settings?.contact as Record<string, string> | null;
    return contact?.email ?? process.env.SEED_ADMIN_EMAIL ?? null;
  } catch {
    return (
      process.env.APPLICATION_EMAIL ??
      process.env.NOTIFICATION_EMAIL ??
      process.env.SEED_ADMIN_EMAIL ??
      null
    );
  }
}

type NotifyOpts = {
  type: SubmissionType;
  subject: string;
  applicantName?: string;
  position?: string;
  details: Record<string, string>;
  documents?: Array<{ label: string; url: string }>;
  adminUrl: string;
  toEmail?: string;
};

const TYPE_META: Record<SubmissionType, { label: string; color: string; icon: string }> = {
  career_application:    { label: "Career Application",    color: "#7B2DBB", icon: "💼" },
  volunteer_application: { label: "Volunteer Application", color: "#059669", icon: "🤝" },
  contact:               { label: "Contact Message",       color: "#2563EB", icon: "✉️" },
  partner_application:   { label: "Partnership Inquiry",   color: "#D97706", icon: "🌐" },
};

export async function notifyAdminOfSubmission(opts: NotifyOpts): Promise<void> {
  try {
    const [recipientEmail, brand] = await Promise.all([
      opts.toEmail ?? getNotificationEmail(opts.type),
      buildBrand(),
    ]);
    if (!recipientEmail) return;

    // Resolve primary color from DB theme
    let resolvedPrimary = "#7B2DBB";
    try {
      const theme = await db.theme.findUnique({ where: { id: "singleton" }, select: { colors: true } });
      const colors = theme?.colors as Record<string, string> | null;
      if (colors?.primary) {
        const [r, g, b] = colors.primary.split(" ").map(Number);
        if (r !== undefined && g !== undefined && b !== undefined) {
          resolvedPrimary = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        }
      }
    } catch { /* use default */ }
    const primaryColor = resolvedPrimary;
    const orgName = brand.orgName ?? "GloFord Foundation";
    const logoUrl = brand.logoUrl;
    const meta = TYPE_META[opts.type];
    const isApplication = opts.type === "career_application" || opts.type === "volunteer_application";
    const year = new Date().getFullYear();

    // ── Detail rows ──
    const detailRows = Object.entries(opts.details)
      .map(([k, v]) => `
        <tr>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;white-space:nowrap;width:150px;vertical-align:top;border-bottom:1px solid #f3f4f6">${k}</td>
          <td style="padding:10px 16px;font-size:13px;color:#111827;vertical-align:top;border-bottom:1px solid #f3f4f6">${v}</td>
        </tr>`)
      .join("");

    // ── Document pills ──
    const docSection = opts.documents && opts.documents.length > 0
      ? `<div style="margin:24px 0 0">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em">Attached Documents</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${opts.documents.map((d) =>
              `<a href="${d.url}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f8f7ff;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;font-weight:500;color:#374151;text-decoration:none">
                <span style="font-size:15px">📎</span> ${d.label}
                <span style="font-size:11px;color:#9ca3af">↗</span>
              </a>`
            ).join("")}
          </div>
        </div>`
      : "";

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">

  <!-- Preheader -->
  <div style="display:none;overflow:hidden;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:#f0f0f5">
    ${meta.icon} ${opts.subject} — ${orgName} Admin Notification
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%">

        <!-- Logo bar -->
        <tr><td style="padding:0 0 20px;text-align:center">
          ${logoUrl
            ? `<img src="${logoUrl}" alt="${orgName}" height="40" style="display:inline-block;max-height:40px;max-width:180px">`
            : `<span style="font-size:16px;font-weight:700;color:#374151">${orgName}</span>`}
        </td></tr>

        <!-- Header band -->
        <tr><td style="background:${primaryColor};border-radius:16px 16px 0 0;padding:32px 36px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;padding:4px 12px;background:rgba(255,255,255,0.18);border-radius:20px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px">
                  ${meta.icon} ${meta.label}
                </span>
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">${opts.subject}</h1>
                ${opts.applicantName
                  ? `<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.80)">
                      From <strong style="color:#ffffff">${opts.applicantName}</strong>
                      ${opts.position ? ` — applying for <strong style="color:#ffffff">${opts.position}</strong>` : ""}
                    </p>`
                  : `<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.80)">A new submission has been received.</p>`}
              </td>
              <td align="right" valign="top" style="padding-left:16px">
                <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;text-align:center;line-height:52px">
                  ${meta.icon}
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px">

          <!-- Applicant details table -->
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em">Submission Details</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:0">
            <tbody>${detailRows}</tbody>
          </table>

          ${docSection}

          <!-- CTA button -->
          <div style="margin:32px 0 0;text-align:center">
            <a href="${opts.adminUrl}"
               style="display:inline-block;padding:14px 32px;background:${primaryColor};color:#ffffff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(0,0,0,0.15)">
              ${isApplication ? "Review Application →" : "View in Admin →"}
            </a>
          </div>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0 0">

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 36px;border-top:1px solid #f3f4f6">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
                  This is an automated notification from <strong style="color:#6b7280">${orgName}</strong>.<br>
                  Replies go to the submitter's address, not this inbox.
                </p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:11px;color:#d1d5db">&copy; ${year} ${orgName}</p>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
      `[${meta.label}] ${opts.subject}`,
      "",
      ...Object.entries(opts.details).map(([k, v]) => `${k}: ${v}`),
      ...(opts.documents?.length
        ? ["", "Documents:", ...opts.documents.map((d) => `  ${d.label}: ${d.url}`)]
        : []),
      "",
      `View in admin: ${opts.adminUrl}`,
    ].join("\n");

    const provider = getMailProvider();
    await provider.send({
      to: recipientEmail,
      subject: opts.subject,
      html,
      text,
      metadata: { type: `admin-notify-${opts.type}` },
    });
  } catch {
    // Fire-and-forget — never surface errors to the caller
  }
}
