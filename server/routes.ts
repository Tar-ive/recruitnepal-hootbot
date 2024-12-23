import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { candidates, interviews, messages } from "@db/schema";
import { analyzeCv, conductInterview, generateSpeech, generateAssessment } from "./services/openai";
import { uploadCV, getSignedCVUrl } from "./services/s3";
import multer from "multer";
import { eq } from "drizzle-orm";

const upload = multer();
const STOP_WORDS = [
  "thanks", "thank you", "bye", "goodbye", "good bye",
  "see you", "take care", "have a great day"
];

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/candidates", upload.single("cv"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const cvUrl = await uploadCV(file.buffer, file.originalname);
      const cvAnalysis = await analyzeCv(file.buffer);

      const [candidate] = await db
        .insert(candidates)
        .values({
          name: req.body.name,
          email: req.body.email,
          cvUrl,
          cvAnalysis
        })
        .returning();

      const [interview] = await db
        .insert(interviews)
        .values({ 
          candidateId: candidate.id,
          status: "in_progress"
        })
        .returning();

      res.json({ 
        candidateId: candidate.id, 
        interviewId: interview.id 
      });
    } catch (error) {
      console.error("Error creating candidate:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ error: "Invalid interview ID" });
      }

      const [interview] = await db
        .select()
        .from(interviews)
        .where(eq(interviews.id, interviewId));

      if (!interview) {
        return res.status(404).json({ error: "Interview not found" });
      }

      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, interview.candidateId));

      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const messagesList = await db
        .select()
        .from(messages)
        .where(eq(messages.interviewId, interviewId))
        .orderBy(messages.timestamp);

      const signedCvUrl = await getSignedCVUrl(candidate.cvUrl);
      
      res.json({ 
        id: interview.id,
        status: interview.status,
        technicalScore: interview.technicalScore,
        softSkillScore: interview.softSkillScore,
        report: interview.report,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        messages: messagesList,
        candidate: {
          ...candidate,
          signedCvUrl
        }
      });
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/interviews/:id/message", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ error: "Invalid interview ID" });
      }

      const [interview] = await db
        .select()
        .from(interviews)
        .where(eq(interviews.id, interviewId));

      if (!interview) {
        return res.status(404).json({ error: "Interview not found" });
      }

      if (interview.status === "completed") {
        return res.status(400).json({ error: "Interview has already concluded" });
      }

      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, interview.candidateId));

      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const existingMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.interviewId, interviewId))
        .orderBy(messages.timestamp);

      const [userMessage] = await db
        .insert(messages)
        .values({
          interviewId,
          role: "user",
          content: req.body.message
        })
        .returning();

      const allMessages = [...existingMessages, userMessage];
      const shouldEnd = allMessages.length >= 12 || 
                       STOP_WORDS.some(word => req.body.message.toLowerCase().includes(word.toLowerCase()));

      const aiResponse = await conductInterview(allMessages, candidate.cvAnalysis);

      const [aiMessage] = await db
        .insert(messages)
        .values({
          interviewId,
          role: "assistant",
          content: aiResponse
        })
        .returning();

      if (shouldEnd) {
        const assessment = await generateAssessment(
          [...allMessages, aiMessage], 
          candidate.cvAnalysis
        );

        await db
          .update(interviews)
          .set({
            status: "completed",
            report: assessment,
            technicalScore: assessment.technicalScore,
            softSkillScore: assessment.softSkillScore,
            updatedAt: new Date()
          })
          .where(eq(interviews.id, interviewId));
      }

      const speech = await generateSpeech(aiResponse);

      res.json({
        message: aiMessage,
        audioBuffer: speech.toString("base64"),
        isComplete: shouldEnd
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}