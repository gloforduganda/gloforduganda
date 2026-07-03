import { inngest } from "../client";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { passwordResetEmail } from "@/lib/mail/templates";

export const passwordResetSend = inngest.createFunction(
  { id: "user-password-reset-send", retries: 3 },
  { event: "user/password-reset.send" },
  async ({ event, step }) => {
    const { email, resetUrl, isInvite } = event.data;
    const brand = await step.run("load-brand", () => buildBrand());
    const mail = passwordResetEmail({ brand, resetUrl, isInvite });
    const provider = getMailProvider();
    await step.run("send", () =>
      provider.send({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        metadata: { type: isInvite ? "user-invite-set-password" : "password-reset", email },
      }),
    );
    return { sent: true };
  },
);
