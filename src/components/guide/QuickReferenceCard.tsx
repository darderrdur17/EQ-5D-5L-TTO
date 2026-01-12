import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export function QuickReferenceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Reference
        </CardTitle>
        <CardDescription>Key phrases and responses for common situations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Script Templates */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Suggested Scripts
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
              <Badge variant="secondary" className="mb-2">Introducing TTO</Badge>
              <p className="text-sm italic">
                "I'm going to show you different health conditions. For each one, imagine you could live 
                in that condition for 10 years. Then I'll ask how many years of perfect health would 
                feel the same to you."
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-amber-500">
              <Badge variant="secondary" className="mb-2">Clarifying Indifference</Badge>
              <p className="text-sm italic">
                "Try to find the point where you genuinely can't decide between the two options - 
                where they feel equally good or equally bad to you."
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-emerald-500">
              <Badge variant="secondary" className="mb-2">Encouraging Exploration</Badge>
              <p className="text-sm italic">
                "Feel free to move the slider back and forth. There's no rush - take your time 
                to find what feels right for you."
              </p>
            </div>
          </div>
        </div>

        {/* Time Guidelines */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expected Durations
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">2-3 min</p>
              <p className="text-xs text-muted-foreground">Consent</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">5-7 min</p>
              <p className="text-xs text-muted-foreground">EQ-5D-5L</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">3-5 min</p>
              <p className="text-xs text-muted-foreground">Practice</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">15-25 min</p>
              <p className="text-xs text-muted-foreground">TTO Tasks</p>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Do
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Read health states exactly as written</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Allow silence for thinking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Remain neutral and non-judgmental</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Document unusual responses in notes</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              Don't
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Suggest or influence answers</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Rush through tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Express surprise at responses</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Skip the practice task</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Common Issues */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Troubleshooting
          </h4>
          <div className="space-y-2">
            <details className="group">
              <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium">Participant doesn't understand the task</span>
              </summary>
              <div className="p-3 text-sm text-muted-foreground">
                Return to the practice task with the wheelchair example. Use concrete scenarios 
                and check understanding before proceeding.
              </div>
            </details>
            <details className="group">
              <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium">Participant gives same value for every state</span>
              </summary>
              <div className="p-3 text-sm text-muted-foreground">
                Gently remind them that each health state is different. Read the descriptions 
                carefully and ask if they noticed the differences.
              </div>
            </details>
            <details className="group">
              <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium">Participant becomes emotional</span>
              </summary>
              <div className="p-3 text-sm text-muted-foreground">
                Pause and offer a break. Acknowledge that these topics can be sensitive. 
                They may resume when ready or end the session.
              </div>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
