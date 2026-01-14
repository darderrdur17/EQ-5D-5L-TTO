import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionNotificationRequest {
  sessionId: string;
  respondentCode: string;
  interviewerId: string;
  notificationType: 'completed' | 'flagged' | 'quality_update';
  qualityStatus?: string;
  qualityNotes?: string;
}

const getNotificationContent = (type: string, respondentCode: string, qualityStatus?: string, qualityNotes?: string) => {
  switch (type) {
    case 'completed':
      return {
        title: '✅ Interview Completed',
        message: `Session ${respondentCode} has been completed successfully.`,
        alertType: 'session_complete',
        color: '#22c55e'
      };
    case 'flagged':
      return {
        title: '⚠️ Session Flagged',
        message: `Session ${respondentCode} has been flagged for review.${qualityNotes ? ` Note: ${qualityNotes}` : ''}`,
        alertType: 'goal_at_risk',
        color: '#f59e0b'
      };
    case 'quality_update': {
      const statusInfo = {
        approved: { emoji: '✅', color: '#22c55e', alertType: 'quality_update' },
        flagged: { emoji: '⚠️', color: '#f59e0b', alertType: 'goal_at_risk' },
        rejected: { emoji: '❌', color: '#ef4444', alertType: 'goal_failed' },
        pending: { emoji: '⏳', color: '#6b7280', alertType: 'quality_update' }
      }[qualityStatus || 'pending'] || { emoji: '📋', color: '#6b7280', alertType: 'quality_update' };
      
      return {
        title: `${statusInfo.emoji} Quality Review Update`,
        message: qualityStatus === 'approved' 
          ? `Great work! Session ${respondentCode} has been approved.`
          : qualityStatus === 'rejected'
          ? `Session ${respondentCode} was rejected.${qualityNotes ? ` Reason: ${qualityNotes}` : ''}`
          : `Quality status updated for session ${respondentCode}: ${qualityStatus}.${qualityNotes ? ` Note: ${qualityNotes}` : ''}`,
        alertType: statusInfo.alertType,
        color: statusInfo.color
      };
    }
    default:
      return {
        title: 'Session Update',
        message: `Update for session ${respondentCode}.`,
        alertType: 'quality_update',
        color: '#6b7280'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-interview-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const { 
      sessionId, 
      respondentCode, 
      interviewerId,
      notificationType,
      qualityStatus,
      qualityNotes
    }: CompletionNotificationRequest = await req.json();

    console.log("Notification request:", { sessionId, interviewerId, notificationType, qualityStatus });

    // Get interviewer profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', interviewerId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Interviewer not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notification = getNotificationContent(notificationType, respondentCode, qualityStatus, qualityNotes);
    const interviewerName = profile.full_name || 'Interviewer';

    // Create in-app notification (performance_alerts table)
    const { error: alertError } = await supabase
      .from('performance_alerts')
      .insert({
        interviewer_id: interviewerId,
        alert_type: notification.alertType,
        message: notification.message,
      });

    if (alertError) {
      console.error("Error creating alert:", alertError);
    } else {
      console.log("In-app notification created for:", interviewerId);
    }

    // Send email notification for important events
    if (RESEND_API_KEY && (notificationType === 'quality_update' || notificationType === 'flagged')) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "TTO Survey <notifications@resend.dev>",
            to: [profile.email],
            subject: `${notification.title} - Session ${respondentCode}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">EQ-5D-5L TTO Survey</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Interview Notification</p>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Hello ${interviewerName},
                  </p>
                  
                  <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid ${notification.color}; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0; color: ${notification.color};">${notification.title}</h2>
                    <p style="margin: 0; color: #64748b;">
                      ${notification.message}
                    </p>
                  </div>
                  
                  ${qualityNotes ? `
                    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                      <p style="margin: 0; font-weight: 600; color: #92400e;">Notes:</p>
                      <p style="margin: 10px 0 0 0; color: #78350f;">${qualityNotes}</p>
                    </div>
                  ` : ''}
                  
                  <p style="color: #64748b; font-size: 14px;">
                    Log in to your dashboard to view full details.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                  
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    This is an automated notification from the TTO Survey Platform.
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Email sent:", emailResult);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    // Send push notification via Web Push if subscribed
    // This would integrate with a push service - for now we rely on in-app notifications

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-interview-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
