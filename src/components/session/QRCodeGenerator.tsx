import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Download, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  baseUrl?: string;
}

export function QRCodeGenerator({ baseUrl }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [respondentCode, setRespondentCode] = useState('');
  const [language, setLanguage] = useState('en');
  
  // Use current origin or provided base URL
  const origin = baseUrl || window.location.origin;
  const surveyUrl = respondentCode 
    ? `${origin}/survey?code=${encodeURIComponent(respondentCode)}&lang=${language}`
    : `${origin}/survey?lang=${language}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    toast({
      title: 'Link copied!',
      description: 'Survey URL has been copied to clipboard',
    });
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('survey-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `survey-qr-${respondentCode || 'general'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Survey QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate QR codes for participants to access the survey directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="respondent-code">Respondent Code (Optional)</Label>
            <Input
              id="respondent-code"
              placeholder="e.g., R001"
              value={respondentCode}
              onChange={(e) => setRespondentCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a general survey link
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Survey Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
          <QRCodeSVG
            id="survey-qr-code"
            value={surveyUrl}
            size={200}
            level="H"
            includeMargin
            className="bg-white p-2 rounded-lg"
          />
          <p className="text-sm text-muted-foreground text-center break-all max-w-md">
            {surveyUrl}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="gap-2" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          <Button className="gap-2" onClick={handleDownloadQR}>
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
