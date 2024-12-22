import { CVUpload } from "@/components/CVUpload";

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              PreScreen AI Interview Platform
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience an AI-powered interview with real-time feedback and natural conversation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 my-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">How it works</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">1. Upload your CV</p>
                <p className="text-muted-foreground">2. Our AI analyzes your experience</p>
                <p className="text-muted-foreground">3. Complete the interactive interview</p>
                <p className="text-muted-foreground">4. Receive detailed feedback</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf"
                alt="Professional Interview"
                className="rounded-lg object-cover w-full aspect-video"
              />
            </div>

            <div className="flex items-center">
              <CVUpload />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Technical Assessment</h3>
              <p className="text-sm text-muted-foreground">
                In-depth evaluation of your technical skills based on your CV
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Soft Skills Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive assessment of communication and interpersonal abilities
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Instant Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Real-time voice feedback and detailed performance reports
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
