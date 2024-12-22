import OpenAI from "openai";
import { type Message } from "@db/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI();

export async function analyzeCv(text: string) {
  // Truncate text to ~30k chars to stay within API limits
  const truncatedText = text.slice(0, 30000);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert CV analyzer. Extract key information from the CV in JSON format with the following structure: { skills: string[], experience: { company: string, role: string, duration: string }[], education: { degree: string, institution: string, year: string }[] }"
      },
      {
        role: "user",
        content: text
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function conductInterview(messages: Message[], cvAnalysis: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are PreScreen AI, an expert technical interviewer. Evaluate the candidate based on their CV and responses. 
CV Analysis: ${JSON.stringify(cvAnalysis)}

Your task is to:
1. Ask relevant technical questions based on their experience
2. Evaluate their responses for technical accuracy
3. Assess soft skills through conversation
4. Keep responses concise and professional
5. End the interview when you have gathered enough information to make an assessment`
      },
      ...messages.map(m => ({
        role: m.role as any,
        content: m.content
      }))
    ]
  });

  return response.choices[0].message.content;
}

export async function generateSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text
  });

  return Buffer.from(await response.arrayBuffer());
}