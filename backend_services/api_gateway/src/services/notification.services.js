export async function sendDoctorCredentialsEmail({
  email,
  firstName,
  lastName,
  password,
}) {
  const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;

  if (!notificationServiceUrl) {
    throw new Error("NOTIFICATION_SERVICE_URL is not configured");
  }

  const displayName = `${firstName} ${lastName}`.trim();
  const title = "Your CareConnect Doctor Account Credentials";
  const content = `Hello Dr. ${displayName},\n\nYour doctor account has been created by the admin.\n\nLogin credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and complete your profile.\n\nRegards,\nCareConnect Team`;

  const response = await fetch(
    `${notificationServiceUrl}/api/notifications/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        title,
        content,
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Failed to send credentials email");
  }

  return response.json().catch(() => ({ success: true }));
}
