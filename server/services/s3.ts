import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function uploadCV(file: Buffer, filename: string): Promise<string> {
  const key = `cvs/${Date.now()}-${filename}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: 'application/pdf'
  }));

  return key;
}

export async function getSignedCVUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
