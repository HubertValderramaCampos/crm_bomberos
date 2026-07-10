const CLOUD  = "dg7cpknzv";
const PRESET = "nora_party";

export async function subirEvidencia(blob: Blob): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", blob);
    form.append("upload_preset", PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data.secure_url ?? null;
  } catch {
    return null;
  }
}

export function capturarFrame(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise(resolve => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(null); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.85);
  });
}
