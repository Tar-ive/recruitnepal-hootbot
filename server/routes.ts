import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { candidates, interviews, messages } from "@db/schema";
import { analyzeCv, conductInterview, generateSpeech } from "./services/openai";
import { uploadCV, getSignedCVUrl } from "./services/s3";
import multer from "multer";
import { eq } from "drizzle-orm";

const upload = multer();

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/candidates", upload.single("cv"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) throw new Error("No file uploaded");

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
        .values({ candidateId: candidate.id })
        .returning();

      res.json({ candidateId: candidate.id, interviewId: interview.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, parseInt(req.params.id)),
        with: {
          candidate: true,
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.timestamp)]
          }
        }
      });

      if (!interview || !interview.candidate) {
        throw new Error("Interview or candidate not found");
      }

      const signedCvUrl = await getSignedCVUrl(interview.candidate.cvUrl);
      res.json({ 
        ...interview, 
        status: interview.status || 'in_progress',
        messages: interview.messages || [],
        candidate: { ...interview.candidate, signedCvUrl }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/interviews/:id/message", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
        with: { candidate: true }
      });

      if (!interview) throw new Error("Interview not found");

      const [message] = await db
        .insert(messages)
        .values({
          interviewId,
          role: "user",
          content: req.body.message
        })
        .returning();

      const prevMessages = await db.query.messages.findMany({
        where: eq(messages.interviewId, interviewId),
        orderBy: messages.timestamp
      });

      const aiResponse = await conductInterview(prevMessages, interview.candidate.cvAnalysis);
      const [aiMessage] = await db
        .insert(messages)
        .values({
          interviewId,
          role: "assistant",
          content: aiResponse
        })
        .returning();

      const speech = await generateSpeech(aiResponse);
      res.json({
        message: aiMessage,
        audioBuffer: speech.toString("base64")
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
