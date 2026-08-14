/**
 * lib/email-templates.ts
 * Dormosaur Branded HTML Email Templates for Supabase Auth & Resend.
 */

export function getDormosaurConfirmationEmailHtml(params: {
  name?: string
  confirmationUrl: string
}): string {
  const studentName = params.name ? params.name.trim() : 'Student'
  const confirmUrl = params.confirmationUrl || 'https://dormosaur.vercel.app/api/auth/callback'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Dormosaur Account</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAFBF7;
      margin: 0;
      padding: 0;
      color: #1c1c1e;
    }
    .container {
      max-width: 560px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #1F6F50;
      padding: 32px 24px;
      text-align: center;
    }
    .header img {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      margin-bottom: 12px;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .header p {
      color: #D9F99D;
      font-size: 13px;
      font-weight: 600;
      margin: 4px 0 0 0;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 28px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #1F6F50;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(31, 111, 80, 0.3);
    }
    .fallback {
      font-size: 12px;
      color: #9ca3af;
      word-break: break-all;
      margin-top: 24px;
      background-color: #f9fafb;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://dormosaur-app.vercel.app/android-chrome-192x192.png" alt="Dormosaur Logo" />
      <h1>Dormosaur</h1>
      <p>THE AI CAMPUS ASSISTANT FOR STUDENTS</p>
    </div>
    <div class="content">
      <div class="greeting">Hi ${studentName},</div>
      <div class="text">
        Welcome to Dormosaur! Please confirm your email address to activate your account and turn the semester scramble into a plan.
      </div>
      <div class="btn-container">
        <a href="${confirmUrl}" class="btn" target="_blank">Confirm Email Address</a>
      </div>
      <div class="text" style="font-size: 13px; color: #6b7280;">
        If you didn't create a Dormosaur account, you can safely ignore this email.
      </div>
      <div class="fallback">
        Or copy and paste this confirmation link into your browser:<br>
        <a href="${confirmUrl}" style="color: #1F6F50;">${confirmUrl}</a>
      </div>
    </div>
    <div class="footer">
      Dormosaur App • Built for College Students<br>
      https://dormosaur.vercel.app
    </div>
  </div>
</body>
</html>
  `.trim()
}
