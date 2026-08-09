import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublishedJob = { id: string; title: string; company: string };

const MAX_NOTIFICATIONS_PER_USER = 5;

/**
 * Fans out in-app notifications to every profile that opted into new-job
 * alerts, and queues the same digest as an email when email sending is set up.
 */
export async function notifyNewJobs(
  admin: SupabaseClient<Database>,
  jobs: PublishedJob[],
): Promise<{ notified: number; emailed: number }> {
  if (jobs.length === 0) return { notified: 0, emailed: 0 };

  const { data: recipients } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("notify_new_jobs", true);

  if (!recipients || recipients.length === 0) return { notified: 0, emailed: 0 };

  const highlights = jobs.slice(0, MAX_NOTIFICATIONS_PER_USER);
  const rows = recipients.flatMap((profile) =>
    highlights.map((job) => ({
      user_id: profile.id,
      job_id: job.id,
      type: "new_job",
      title: `New verified job: ${job.title}`,
      body: `${job.company} — verified by the 45LITE AI verifier and now live in your feed.`,
    })),
  );

  const { error } = await admin.from("notifications").insert(rows);
  if (error) return { notified: 0, emailed: 0 };

  const emailed = await sendDigestEmails(
    recipients.map((r) => ({ email: r.email, name: r.full_name })),
    jobs,
  );

  return { notified: recipients.length, emailed };
}

/**
 * Sends the digest through the project's managed email sender. Email is
 * optional: without a verified sender domain this is a no-op so a sync never
 * fails because alerts could not be delivered.
 */
async function sendDigestEmails(
  recipients: Array<{ email: string | null; name: string | null }>,
  jobs: PublishedJob[],
): Promise<number> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!apiKey || !from) return 0;

  const list = jobs
    .slice(0, 10)
    .map((j) => `<li><strong>${escapeHtml(j.title)}</strong> — ${escapeHtml(j.company)}</li>`)
    .join("");

  let sent = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: recipient.email,
          subject: `${jobs.length} new verified job${jobs.length === 1 ? "" : "s"} on 45LITE`,
          html: `<p>Hi ${escapeHtml(recipient.name ?? "there")},</p>
<p>Your latest 45LITE sync published ${jobs.length} verified vacanc${jobs.length === 1 ? "y" : "ies"}:</p>
<ul>${list}</ul>
<p><a href="https://a45lite.lovable.app/">Open 45LITE</a></p>`,
        }),
      });
      if (res.ok) sent += 1;
    } catch {
      /* email is best-effort */
    }
  }
  return sent;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
