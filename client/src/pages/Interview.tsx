import { useInterview } from "@/lib/api";
import { InterviewChat } from "@/components/InterviewChat";
import { ProgressBar } from "@/components/ProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Interview({ params }: { params: { id: string } }) {
  const { data: interview, isLoading, error } = useInterview(params.id);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-destructive mb-2">Error</h1>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const progress = interview.status === "completed" ? 100 : 
    interview.messages.length > 0 ? Math.min(90, interview.messages.length * 10) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Interview with {interview.candidate.name}
            </h1>
            <ProgressBar progress={progress} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <InterviewChat
                messages={interview.messages}
                interviewId={params.id}
                status={interview.status}
              />
            </div>
            <div>
              <Card>
                <CardContent className="pt-6">
                  <h2 className="font-semibold mb-4">Candidate Info</h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Email</dt>
                      <dd>{interview.candidate.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">CV</dt>
                      <dd>
                        <a
                          href={interview.candidate.signedCvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View CV
                        </a>
                      </dd>
                    </div>
                    {interview.status === "completed" && (
                      <>
                        <div>
                          <dt className="text-sm text-muted-foreground">Technical Score</dt>
                          <dd>{interview.technicalScore}/5</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Soft Skills Score</dt>
                          <dd>{interview.softSkillScore}/5</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
