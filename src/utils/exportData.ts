import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type InterviewSession = Tables<'interview_sessions'>;
type EQ5DResponse = Tables<'eq5d_responses'>;
type TTOResponse = Tables<'tto_responses'>;
type DCEResponse = Tables<'dce_responses'>;
type Demographics = Tables<'demographics'>;
type SessionNote = Tables<'session_notes'>;

export interface ExportData {
  sessions: InterviewSession[];
  eq5dResponses: EQ5DResponse[];
  ttoResponses: TTOResponse[];
  dceResponses: DCEResponse[];
  demographics: Demographics[];
  sessionNotes: SessionNote[];
}

export const fetchExportData = async (): Promise<ExportData> => {
  const [sessions, eq5d, tto, dce, demographics, notes] = await Promise.all([
    supabase.from('interview_sessions').select('*'),
    supabase.from('eq5d_responses').select('*'),
    supabase.from('tto_responses').select('*'),
    supabase.from('dce_responses').select('*'),
    supabase.from('demographics').select('*'),
    supabase.from('session_notes').select('*'),
  ]);

  return {
    sessions: sessions.data || [],
    eq5dResponses: eq5d.data || [],
    ttoResponses: tto.data || [],
    dceResponses: dce.data || [],
    demographics: demographics.data || [],
    sessionNotes: notes.data || [],
  };
};

export const exportToJSON = (data: ExportData): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `tto-export-${getTimestamp()}.json`);
};

export const exportToCSV = (data: ExportData): void => {
  // Export each table as a separate CSV in a zip-like format
  // For simplicity, we'll export sessions with joined data
  const combinedData = data.sessions.map(session => {
    const eq5d = data.eq5dResponses.find(r => r.session_id === session.id) || {};
    const demo = data.demographics.find(d => d.session_id === session.id) || {};
    const ttoResponses = data.ttoResponses.filter(r => r.session_id === session.id);
    const notes = data.sessionNotes.filter(n => n.session_id === session.id);
    
    return {
      session_id: session.id,
      respondent_code: session.respondent_code,
      language: session.language,
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      // Quality fields
      quality_status: session.quality_status || 'pending',
      quality_notes: session.quality_notes || '',
      quality_reviewed_at: session.quality_reviewed_at || '',
      // EQ-5D
      eq5d_mobility: eq5d.mobility,
      eq5d_self_care: eq5d.self_care,
      eq5d_usual_activities: eq5d.usual_activities,
      eq5d_pain_discomfort: eq5d.pain_discomfort,
      eq5d_anxiety_depression: eq5d.anxiety_depression,
      eq5d_vas_score: eq5d.vas_score,
      // Demographics
      age: demo.age,
      gender: demo.gender,
      education: demo.education,
      employment: demo.employment,
      ethnicity: demo.ethnicity,
      marital_status: demo.marital_status,
      // TTO values (concatenated)
      tto_values: ttoResponses.map(r => r.final_value).join(';'),
      tto_states: ttoResponses.map(r => r.health_state).join(';'),
      tto_flagged: ttoResponses.filter(r => r.flagged).map(r => r.health_state).join(';'),
      tto_flag_reasons: ttoResponses.filter(r => r.flagged).map(r => r.flag_reason).join(';'),
      // Session notes (concatenated)
      notes: notes.map(n => n.content).join(' | '),
      notes_count: notes.length,
    };
  });

  const csvString = convertToCSV(combinedData);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `tto-export-${getTimestamp()}.csv`);
};

type CSVRow = Record<string, string | number | null | undefined>;

const convertToCSV = (data: CSVRow[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ];
  
  return csvRows.join('\n');
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
};
