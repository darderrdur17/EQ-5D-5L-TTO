import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerformanceData {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  avgApprovalRate: number;
  topPerformers: { name: string; sessions: number; completionRate: number }[];
  flaggedSessions: number;
}

async function fetchPerformanceData(supabase: any, periodStart: Date, periodEnd: Date): Promise<PerformanceData> {
  // Fetch sessions in the period
  const { data: sessions } = await supabase
    .from('interview_sessions')
    .select('id, interviewer_id, status, quality_status, started_at')
    .gte('started_at', periodStart.toISOString())
    .lte('started_at', periodEnd.toISOString());

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email');

  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role');

  const interviewerIds = roles?.filter((r: any) => r.role === 'interviewer').map((r: any) => r.user_id) || [];
  
  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter((s: any) => s.status === 'completed').length || 0;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const flaggedSessions = sessions?.filter((s: any) => s.quality_status === 'flagged').length || 0;

  // Calculate per-interviewer stats
  const interviewerStats = interviewerIds.map((id: string) => {
    const profile = profiles?.find((p: any) => p.id === id);
    const userSessions = sessions?.filter((s: any) => s.interviewer_id === id) || [];
    const completed = userSessions.filter((s: any) => s.status === 'completed').length;
    const approved = userSessions.filter((s: any) => s.quality_status === 'approved').length;
    
    return {
      name: profile?.full_name || profile?.email || 'Unknown',
      sessions: userSessions.length,
      completionRate: userSessions.length > 0 ? Math.round((completed / userSessions.length) * 100) : 0,
      approvalRate: completed > 0 ? Math.round((approved / completed) * 100) : 0,
    };
  });

  const avgApprovalRate = interviewerStats.length > 0
    ? Math.round(interviewerStats.reduce((sum: number, s: any) => sum + s.approvalRate, 0) / interviewerStats.length)
    : 0;

  const topPerformers = interviewerStats
    .sort((a: any, b: any) => b.sessions - a.sessions)
    .slice(0, 5);

  return {
    totalSessions,
    completedSessions,
    completionRate,
    avgApprovalRate,
    topPerformers,
    flaggedSessions,
  };
}

function generateEmailHtml(data: PerformanceData, periodType: string, periodLabel: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${periodType} Performance Report</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${periodType} Performance Report</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">${periodLabel}</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 20px;">Summary</h2>
          
          <div style="display: grid; gap: 15px;">
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <p style="margin: 0; color: #166534; font-weight: 600;">Total Sessions</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #15803d;">${data.totalSessions}</p>
            </div>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">Completion Rate</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #1d4ed8;">${data.completionRate}%</p>
            </div>
            
            <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308;">
              <p style="margin: 0; color: #854d0e; font-weight: 600;">Avg Approval Rate</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #a16207;">${data.avgApprovalRate}%</p>
            </div>
            
            ${data.flaggedSessions > 0 ? `
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">Flagged Sessions</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #dc2626;">${data.flaggedSessions}</p>
            </div>
            ` : ''}
          </div>
          
          <h2 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">Top Performers</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="text-align: left; padding: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Interviewer</th>
                <th style="text-align: right; padding: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Sessions</th>
                <th style="text-align: right; padding: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Completion</th>
              </tr>
            </thead>
            <tbody>
              ${data.topPerformers.map((performer, index) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #1f2937;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : '#e5e7eb'}; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 8px; font-size: 12px; color: #fff;">${index + 1}</span>
                    ${performer.name}
                  </td>
                  <td style="text-align: right; padding: 12px; color: #1f2937; font-weight: 600;">${performer.sessions}</td>
                  <td style="text-align: right; padding: 12px; color: #1f2937;">${performer.completionRate}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            EQ-5D-5L TTO Survey System
          </p>
          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
            This is an automated report. Do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-performance-report function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { scheduleId, isTest } = body;

    // Fetch the schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('email_report_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      console.error("Schedule not found:", scheduleError);
      throw new Error("Schedule not found");
    }

    // Calculate period based on schedule type
    const now = new Date();
    let periodStart: Date, periodEnd: Date, periodLabel: string;

    if (schedule.schedule_type === 'weekly') {
      // Last 7 days
      periodEnd = new Date(now);
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);
      periodLabel = `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;
    } else {
      // Last 30 days
      periodEnd = new Date(now);
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 30);
      periodLabel = `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;
    }

    console.log(`Fetching data for period: ${periodStart} to ${periodEnd}`);

    // Fetch performance data
    const performanceData = await fetchPerformanceData(supabase, periodStart, periodEnd);

    console.log("Performance data:", performanceData);

    // Generate email HTML
    const emailHtml = generateEmailHtml(
      performanceData,
      schedule.schedule_type === 'weekly' ? 'Weekly' : 'Monthly',
      periodLabel
    );

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "EQ-5D TTO Survey <onboarding@resend.dev>",
      to: [schedule.email_address],
      subject: `${isTest ? '[TEST] ' : ''}${schedule.schedule_type === 'weekly' ? 'Weekly' : 'Monthly'} Performance Report - ${periodLabel}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      throw emailError;
    }

    // Update last_sent_at if not a test
    if (!isTest) {
      await supabase
        .from('email_report_schedules')
        .update({ last_sent_at: now.toISOString() })
        .eq('id', scheduleId);
    }

    console.log("Email sent successfully to:", schedule.email_address);

    return new Response(
      JSON.stringify({ success: true, message: "Report sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-performance-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
