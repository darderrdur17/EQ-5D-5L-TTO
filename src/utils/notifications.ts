import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  sessionId: string;
  respondentCode: string;
  interviewerId: string;
  notificationType: 'completed' | 'flagged' | 'quality_update';
  qualityStatus?: string;
  qualityNotes?: string;
}

export async function sendInterviewNotification(payload: NotificationPayload) {
  try {
    console.log('Sending interview notification:', payload);
    
    const { data, error } = await supabase.functions.invoke('send-interview-notification', {
      body: payload
    });

    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }

    console.log('Notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false, error };
  }
}

export async function notifyInterviewCompleted(
  sessionId: string, 
  respondentCode: string, 
  interviewerId: string
) {
  return sendInterviewNotification({
    sessionId,
    respondentCode,
    interviewerId,
    notificationType: 'completed'
  });
}

export async function notifySessionFlagged(
  sessionId: string, 
  respondentCode: string, 
  interviewerId: string,
  notes?: string
) {
  return sendInterviewNotification({
    sessionId,
    respondentCode,
    interviewerId,
    notificationType: 'flagged',
    qualityNotes: notes
  });
}

export async function notifyQualityUpdate(
  sessionId: string, 
  respondentCode: string, 
  interviewerId: string,
  qualityStatus: string,
  notes?: string
) {
  return sendInterviewNotification({
    sessionId,
    respondentCode,
    interviewerId,
    notificationType: 'quality_update',
    qualityStatus,
    qualityNotes: notes
  });
}
