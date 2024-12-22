import { useRef, useEffect } from "react";
import { useSendMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@db/schema";

interface InterviewChatProps {
  messages: Message[];
  interviewId: string;
  status: string;
}

export function InterviewChat({ messages, interviewId, status }: InterviewChatProps) {
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sendMessage = useSendMessage(interviewId);

  const form = useForm({
    defaultValues: {
      message: ""
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (data: { message: string }) => {
    try {
      const response = await sendMessage.mutateAsync(data.message);
      form.reset();

      // Play the AI response audio
      if (response.audioBuffer) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.audioBuffer), c => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "assistant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </CardContent>

      <CardContent className="border-t p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <Textarea
            {...form.register("message")}
            placeholder="Type your message..."
            className="resize-none"
            disabled={status === "completed" || sendMessage.isPending}
          />
          <Button
            type="submit"
            disabled={status === "completed" || sendMessage.isPending}
          >
            Send
          </Button>
        </form>
      </CardContent>

      <audio ref={audioRef} className="hidden" />
    </Card>
  );
}
