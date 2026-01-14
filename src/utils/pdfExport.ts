import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface SessionData {
  id: string;
  respondent_code: string;
  status: string;
  language: string;
  current_step: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface EQ5DResponse {
  id: string;
  mobility: number;
  self_care: number;
  usual_activities: number;
  pain_discomfort: number;
  anxiety_depression: number;
  vas_score: number | null;
  created_at: string;
}

interface TTOResponse {
  id: string;
  task_number: number;
  health_state: string;
  final_value: number;
  is_worse_than_death: boolean;
  lead_time_value: number | null;
  flagged: boolean;
  flag_reason: string | null;
  moves_count: number | null;
  time_spent_seconds: number | null;
  created_at: string;
}

interface Demographics {
  id: string;
  age: number | null;
  gender: string | null;
  education: string | null;
  employment: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  created_at: string;
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

export function exportSessionToPDF(
  session: SessionData,
  eq5dResponse: EQ5DResponse | null,
  ttoResponses: TTOResponse[],
  demographics: Demographics | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Session Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('EQ-5D-5L Time Trade-Off Valuation Study', pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  yPos += 15;

  // Session Info Box
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, 'F');
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Respondent Code: ${session.respondent_code}`, 20, yPos);
  doc.text(`Status: ${session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}`, pageWidth / 2 + 10, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Language: ${LANGUAGES[session.language] || session.language}`, 20, yPos);
  doc.text(`Session ID: ${session.id.substring(0, 8)}...`, pageWidth / 2 + 10, yPos);
  yPos += 8;

  doc.text(`Started: ${format(new Date(session.started_at), 'MMM dd, yyyy HH:mm')}`, 20, yPos);
  if (session.completed_at) {
    doc.text(`Completed: ${format(new Date(session.completed_at), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2 + 10, yPos);
  }
  yPos += 20;

  // EQ-5D Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EQ-5D-5L Self-Reported Health', 14, yPos);
  yPos += 8;

  if (eq5dResponse) {
    const eq5dData = [
      ['Mobility', eq5dResponse.mobility.toString(), EQ5D_LEVELS[eq5dResponse.mobility]],
      ['Self-Care', eq5dResponse.self_care.toString(), EQ5D_LEVELS[eq5dResponse.self_care]],
      ['Usual Activities', eq5dResponse.usual_activities.toString(), EQ5D_LEVELS[eq5dResponse.usual_activities]],
      ['Pain/Discomfort', eq5dResponse.pain_discomfort.toString(), EQ5D_LEVELS[eq5dResponse.pain_discomfort]],
      ['Anxiety/Depression', eq5dResponse.anxiety_depression.toString(), EQ5D_LEVELS[eq5dResponse.anxiety_depression]],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Dimension', 'Level', 'Description']],
      body: eq5dData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
    });

    yPos = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos) + 5;

    if (eq5dResponse.vas_score !== null) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`VAS Score: ${eq5dResponse.vas_score}/100`, 14, yPos);
      yPos += 5;
    }

    // Health state profile
    const healthState = `${eq5dResponse.mobility}${eq5dResponse.self_care}${eq5dResponse.usual_activities}${eq5dResponse.pain_discomfort}${eq5dResponse.anxiety_depression}`;
    doc.setFont('helvetica', 'bold');
    doc.text(`Health State Profile: ${healthState}`, 14, yPos);
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128);
    doc.text('No EQ-5D responses recorded', 14, yPos);
    doc.setTextColor(0);
  }
  yPos += 15;

  // Check if we need a new page
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // TTO Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Time Trade-Off Responses', 14, yPos);
  yPos += 8;

  if (ttoResponses.length > 0) {
    const ttoData = ttoResponses.map((r) => [
      r.task_number.toString(),
      r.health_state,
      r.final_value.toFixed(3),
      r.is_worse_than_death ? 'Yes' : 'No',
      r.moves_count?.toString() || '-',
      r.time_spent_seconds ? `${r.time_spent_seconds}s` : '-',
      r.flagged ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Task', 'Health State', 'Value', 'WTD', 'Moves', 'Time', 'Flagged']],
      body: ttoData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35, fontStyle: 'bold', font: 'courier' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
      },
    });

    yPos = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos) + 10;

    // Calculate summary stats
    const avgValue = ttoResponses.reduce((sum, r) => sum + Number(r.final_value), 0) / ttoResponses.length;
    const wtdCount = ttoResponses.filter((r) => r.is_worse_than_death).length;
    const flaggedCount = ttoResponses.filter((r) => r.flagged).length;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Average TTO Value: ${avgValue.toFixed(3)}`, 20, yPos);
    yPos += 5;
    doc.text(`Worse than Death States: ${wtdCount}`, 20, yPos);
    yPos += 5;
    doc.text(`Flagged Responses: ${flaggedCount}`, 20, yPos);
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128);
    doc.text('No TTO responses recorded', 14, yPos);
    doc.setTextColor(0);
  }
  yPos += 15;

  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Demographics Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Demographics', 14, yPos);
  yPos += 8;

  if (demographics) {
    const demoData = [
      ['Age', demographics.age?.toString() || 'Not provided'],
      ['Gender', demographics.gender || 'Not provided'],
      ['Education', demographics.education || 'Not provided'],
      ['Employment', demographics.employment || 'Not provided'],
      ['Ethnicity', demographics.ethnicity || 'Not provided'],
      ['Marital Status', demographics.marital_status || 'Not provided'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: demoData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
      },
    });
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128);
    doc.text('No demographics recorded', 14, yPos);
    doc.setTextColor(0);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `session-report-${session.respondent_code}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
