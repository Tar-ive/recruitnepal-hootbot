import OpenAI from "openai";
import { type Message } from "@db/schema";
import PDFParser from "pdf2json";

const openai = new OpenAI();

const STOP_WORDS = [
  "thanks", "thank you", "bye", "goodbye", "good bye",
  "see you", "take care", "have a great day"
];

function isEndingMessage(message: string): boolean {
  return STOP_WORDS.some(word => message.toLowerCase().includes(word.toLowerCase()));
}

function calculateInterviewPhase(messages: Message[]): {
  phase: 'technical' | 'soft_skills' | 'conclusion',
  shouldEnd: boolean
} {
  const messageCount = messages.length;
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  const isEnding = isEndingMessage(lastMessage);

  if (isEnding || messageCount >= 12) {
    return { phase: 'conclusion', shouldEnd: true };
  }
  if (messageCount >= 8) {
    return { phase: 'soft_skills', shouldEnd: false };
  }
  return { phase: 'technical', shouldEnd: false };
}

export async function analyzeCv(buffer: Buffer) {
  try {
    const pdfText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const text = decodeURIComponent(pdfData.Pages
          .map(page => page.Texts
            .map(text => text.R
              .map(r => r.T)
              .join(' '))
            .join(' '))
          .join('\n'));
        resolve(text);
      });
      
      pdfParser.on("pdfParser_dataError", (error) => {
        reject(new Error(`PDF parsing failed: ${error}`));
      });
      
      pdfParser.parseBuffer(buffer);
    });

    const truncatedText = pdfText.slice(0, 15000);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert CV analyzer. Extract key information from the CV in JSON format with the following structure: { skills: string[], experience: { company: string, role: string, duration: string }[], education: { degree: string, institution: string, year: string }[] }",
        },
        {
          role: "user",
          content: truncatedText,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing CV:", error);
    throw new Error("Failed to analyze CV: " + (error as Error).message);
  }
}

export async function generateAssessment(messages: Message[], cvAnalysis: any) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer conducting a final assessment. Review the entire interview conversation and CV to generate a comprehensive evaluation. Output in this JSON format:
{
  "technical": [
    {"category": string, "score": number, "notes": string}
  ],
  "softSkills": [
    {"category": string, "score": number, "notes": string}
  ],
  "overall": string,
  "technicalScore": number,
  "softSkillScore": number
}

Guidelines:
- Score each category from 1-10
- Include specific examples from the conversation
- Base technical categories on candidate's primary skills
- Address both strengths and areas for improvement
- Overall section should summarize candidacy
- Calculate average scores for technical and soft skills`,
        },
        ...messages.map((m) => ({
          role: m.role as any,
          content: m.content,
        })),
      ],
      response_format: { type: "json_object" },
    });

    const assessmentContent = response.choices[0].message.content;
    if (!assessmentContent) {
      throw new Error("Failed to generate assessment content");
    }
    return JSON.parse(assessmentContent);
  } catch (error) {
    console.error("Error generating assessment:", error);
    throw new Error("Failed to generate assessment");
  }
}

export async function conductInterview(messages: Message[], cvAnalysis: any) {
  try {
    const { phase, shouldEnd } = calculateInterviewPhase(messages);
    const lastMessageIsUser = messages[messages.length - 1]?.role === 'user';

    if (shouldEnd && lastMessageIsUser) {
      return `Thank you for participating in this interview. I've gathered comprehensive information about your technical skills and professional experiences. I'll now conclude the interview and prepare a detailed assessment. Best of luck with your future endeavors!`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are PreScreen AI, a professional technical interviewer conducting a structured interview. The interview has three phases:

1. Technical Assessment Phase (4-5 questions):
- Focus on technical skills from CV: ${JSON.stringify(cvAnalysis.skills)}
- Evaluate depth of knowledge
- Each question should build on previous answers
- Current phase: ${phase === 'technical' ? 'ACTIVE - Ask focused technical questions' : 'COMPLETED'}

2. Soft Skills Assessment Phase (3-4 questions):
- Focus on communication, teamwork, problem-solving
- Ask about specific examples from their experience: ${JSON.stringify(cvAnalysis.experience)}
- Current phase: ${phase === 'soft_skills' ? 'ACTIVE - Ask behavioral questions' : phase === 'technical' ? 'PENDING' : 'COMPLETED'}

3. Conclusion Phase:
- Provide final assessment
- End interview professionally
- Current phase: ${phase === 'conclusion' ? 'ACTIVE - Conclude the interview' : 'PENDING'}

Interview Status:
- Messages exchanged: ${messages.length}
- Current phase: ${phase.toUpperCase()}
- CV Analysis: ${JSON.stringify(cvAnalysis)}

IMPORTANT GUIDELINES:
- Keep responses concise and professional (max 3-4 sentences)
- Focus questions on candidate's specific experience
- If user says ${STOP_WORDS.join(', ')}, conclude the interview
- Assess readiness for role based on responses
${shouldEnd ? '- INTERVIEW SHOULD END AFTER THIS RESPONSE' : ''}`
        },
        ...messages.map((m) => ({
          role: m.role as any,
          content: m.content,
        })),
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error conducting interview:", error);
    throw new Error("Failed to conduct interview");
  }
}

export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate speech");
  }
}