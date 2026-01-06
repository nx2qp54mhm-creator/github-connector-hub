// supabase/functions/send-confirmation-email/index.ts
// Deploy with: supabase functions deploy send-confirmation-email --no-verify-jwt
// This function handles sending confirmation emails via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  confirmation_url: string;
  email_type: "signup" | "password_reset" | "email_change";
}

function getEmailContent(emailType: string, confirmationUrl: string): { subject: string; html: string } {
  switch (emailType) {
    case "signup":
      return {
        subject: "Confirm your Policy Pocket account",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; margin-bottom: 10px;">Welcome to Policy Pocket</h1>
    <p style="color: #666; font-size: 16px;">Your coverage intelligence system</p>
  </div>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Confirm your email address</h2>
    <p style="color: #555; font-size: 15px;">
      Thanks for signing up! Please click the button below to confirm your email address and activate your account.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Confirm Email Address
      </a>
    </div>
    <p style="color: #888; font-size: 13px; margin-bottom: 0;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>Policy Pocket - Track your insurance and credit card benefits in one place.</p>
  </div>
</body>
</html>
        `,
      };

    case "password_reset":
      return {
        subject: "Reset your Policy Pocket password",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; margin-bottom: 10px;">Policy Pocket</h1>
    <p style="color: #666; font-size: 16px;">Password Reset Request</p>
  </div>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Reset your password</h2>
    <p style="color: #555; font-size: 15px;">
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    <p style="color: #888; font-size: 13px; margin-bottom: 0;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>Policy Pocket - Track your insurance and credit card benefits in one place.</p>
  </div>
</body>
</html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm your new email address",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; margin-bottom: 10px;">Policy Pocket</h1>
    <p style="color: #666; font-size: 16px;">Email Address Change</p>
  </div>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Confirm your new email</h2>
    <p style="color: #555; font-size: 15px;">
      You requested to change your email address. Click the button below to confirm this change.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Confirm New Email
      </a>
    </div>
    <p style="color: #888; font-size: 13px; margin-bottom: 0;">
      If you didn't request this change, please secure your account immediately.
    </p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>Policy Pocket - Track your insurance and credit card benefits in one place.</p>
  </div>
</body>
</html>
        `,
      };

    default:
      return {
        subject: "Policy Pocket Notification",
        html: `<p>Please click <a href="${confirmationUrl}">here</a> to continue.</p>`,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured. Please set RESEND_API_KEY.");
    }

    const body: EmailRequest = await req.json();
    const { email, confirmation_url, email_type } = body;

    if (!email || !confirmation_url) {
      throw new Error("Email and confirmation_url are required");
    }

    const { subject, html } = getEmailContent(email_type || "signup", confirmation_url);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Policy Pocket <noreply@policypocket.app>",
        to: [email],
        subject: subject,
        html: html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        email_id: resendData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-confirmation-email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
