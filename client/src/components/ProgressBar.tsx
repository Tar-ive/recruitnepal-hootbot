import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Interview Progress</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Start</span>
        <span>CV Analysis</span>
        <span>Technical</span>
        <span>Soft Skills</span>
        <span>Complete</span>
      </div>
    </div>
  );
}
