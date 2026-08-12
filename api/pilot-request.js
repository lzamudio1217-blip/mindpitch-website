export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, club, teams, message } = req.body || {};

    if (!name || !email || !club) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }

    const submissionHtml = `
      <h2>New MindPitch Pilot Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Club:</strong> ${club}</p>
      <p><strong>Teams:</strong> ${teams || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message || "No message provided"}</p>
    `;

    const confirmationHtml = `
      <h2>Thanks for reaching out to MindPitch</h2>
      <p>Hi ${name},</p>
      <p>We received your pilot request for <strong>${club}</strong>.</p>
      <p>Someone from MindPitch will follow up soon.</p>
      <p style="color:#64748B;font-size:13px;">MindPitch · Mental Performance for Youth Soccer</p>
    `;

    async function sendEmail(payload) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Resend email failed");
      }

      return data;
    }

    await sendEmail({
      from: "MindPitch <noreply@mindpitch.net>",
      to: ["info@mindpitch.net"],
      subject: `New MindPitch pilot request — ${club}`,
      html: submissionHtml,
      reply_to: email,
    });

    await sendEmail({
      from: "MindPitch <noreply@mindpitch.net>",
      to: [email],
      subject: "We received your MindPitch pilot request",
      html: confirmationHtml,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Pilot request failed:", error);
    return res.status(500).json({ error: "Could not send pilot request" });
  }
}