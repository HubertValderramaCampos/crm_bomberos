import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.STORAGE_BUCKET ?? "solicitudes-capacitacion";

export const s3 = new S3Client({
  region: "us-east-1",
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function subirImagen(base64: string, key: string): Promise<string> {
  const dataUrl = base64.includes(",") ? base64.split(",")[1] : base64;
  const mimeMatch = base64.match(/data:([^;]+);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const buffer = Buffer.from(dataUrl, "base64");

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mime,
  }));

  // URL pública firmada con 7 días de vigencia
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 60 * 60 * 24 * 7 });
  return url;
}

export async function obtenerUrlFirmada(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}
