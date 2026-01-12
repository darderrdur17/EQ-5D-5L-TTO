import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  id: string;
  respondent_code: string;
  status: string;
  language: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface EQ5DResponse {
  mobility: number;
  self_care: number;
  usual_activities: number;
  pain_discomfort: number;
  anxiety_depression: number;
  vas_score: number | null;
}

interface TTOResponse {
  task_number: number;
  health_state: string;
  final_value: number;
  is_worse_than_death: boolean;
  flagged: boolean;
}

interface Demographics {
  age: number | null;
  gender: string | null;
  education: string | null;
  employment: string | null;
}

const EQ5D_LEVELS: Record<number, string> = {
  1: 'No problems',
  2: 'Slight problems',
  3: 'Moderate problems',
  4: 'Severe problems',
  5: 'Extreme problems / Unable',
};

const LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
};

export async function exportBatchToPDF(
  sessionIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirstSession = true;

  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    onProgress?.(i + 1, sessionIds.length);

    // Fetch session data
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) continue;

    // Fetch related data
    const [eq5dResult, ttoResult, demoResult] = await Promise.all([
      supabase.from('eq5d_responses').select('*').eq('session_id', sessionId).maybeSingle(),
      supabase.from('tto_responses').select('*').eq('session_id', sessionId).order('task_number'),
      supabase.from('demographics').select('*').eq('session_id', sessionId).maybeSingle(),
    ]);

    const eq5dResponse = eq5dResult.data;
    const ttoResponses = ttoResult.data || [];
    const demographics = demoResult.data;

    // Add new page for each session after the first
    if (!isFirstSession) {
      doc.addPage();
    }
    isFirstSession = false;

    let yPos = 20;

    // Session Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Session: ${session.respondent_code}`, 14, yPos);
    yPos += 8;

    // Session Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Status: ${session.status} | Language: ${LANGUAGES[session.language] || session.language} | Date: ${format(new Date(session.created_at), 'MMM dd, yyyy')}`, 14, yPos);
    doc.setTextColor(0);
    yPos += 12;

    // EQ-5D Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EQ-5D-5L Responses', 14, yPos);
    yPos += 6;

    if (eq5dResponse) {
      const healthState = `${eq5dResponse.mobility}${eq5dResponse.self_care}${eq5dResponse.usual_activities}${eq5dResponse.pain_discomfort}${eq5dResponse.anxiety_depression}`;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Dimension', 'Level', 'Description']],
        body: [
          ['Mobility', eq5dResponse.mobility.toString(), EQ5D_LEVELS[eq5dResponse.mobility]],
          ['Self-Care', eq5dResponse.self_care.toString(), EQ5D_LEVELS[eq5dResponse.self_care]],
          ['Usual Activities', eq5dResponse.usual_activities.toString(), EQ5D_LEVELS[eq5dResponse.usual_activities]],
          ['Pain/Discomfort', eq5dResponse.pain_discomfort.toString(), EQ5D_LEVELS[eq5dResponse.pain_discomfort]],
          ['Anxiety/Depression', eq5dResponse.anxiety_depression.toString(), EQ5D_LEVELS[eq5dResponse.anxiety_depression]],
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(10);
      doc.text(`Health State: ${healthState} | VAS: ${eq5dResponse.vas_score ?? 'N/A'}`, 14, yPos);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No EQ-5D responses', 14, yPos);
    }
    yPos += 10;

    // TTO Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TTO Responses', 14, yPos);
    yPos += 6;

    if (ttoResponses.length > 0) {
      const ttoData = ttoResponses.map((r) => [
        r.task_number.toString(),
        r.health_state,
        r.final_value.toFixed(3),
        r.is_worse_than_death ? 'Yes' : 'No',
        r.flagged ? 'Yes' : 'No',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Task', 'Health State', 'Value', 'WTD', 'Flagged']],
        body: ttoData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          1: { fontStyle: 'bold', font: 'courier' },
          2: { halign: 'right' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 4;

      // Summary stats
      const avgValue = ttoResponses.reduce((sum, r) => sum + Number(r.final_value), 0) / ttoResponses.length;
      const wtdCount = ttoResponses.filter((r) => r.is_worse_than_death).length;
      const flaggedCount = ttoResponses.filter((r) => r.flagged).length;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Avg Value: ${avgValue.toFixed(3)} | WTD: ${wtdCount} | Flagged: ${flaggedCount}`, 14, yPos);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No TTO responses', 14, yPos);
    }
    yPos += 10;

    // Demographics Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Demographics', 14, yPos);
    yPos += 6;

    if (demographics) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Age: ${demographics.age ?? 'N/A'} | Gender: ${demographics.gender ?? 'N/A'} | Education: ${demographics.education ?? 'N/A'}`, 14, yPos);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No demographics recorded', 14, yPos);
    }
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(
      `Batch Export - Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `batch-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(filename);
}
