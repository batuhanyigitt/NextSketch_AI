import type { NextApiRequest, NextApiResponse } from "next";
import { FormData, Blob } from "formdata-node";

export const config = {
  api: {
    bodyParser: false, // Gövdeyi kendimiz okuyacağız
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Gövdeyi elle oku
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString();
    const { prompt, imageData, strength = 0.6, style, aspect } = JSON.parse(body);

    const safePrompt = prompt && prompt.trim().length > 0 ? prompt : "Sketch to image";

    //  FormData oluştur
    const formData = new FormData();
    formData.append("prompt", safePrompt);
    formData.append("aspect_ratio", aspect || "1:1");
    formData.append("output_format", "png");
    formData.append("strength", String(strength));

    //  Eğer çizim varsa init_image ekle
    if (imageData) {
      const base64 = imageData.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      formData.append("init_image", new Blob([buffer], { type: "image/png" }), "sketch.png");
    }

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: formData as any,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Stability API error:", errText);
      return res.status(500).send(errText);
    }

    const result = await response.json();
    // Yeni API genellikle base64 sonucu `image` veya `artifacts[0].base64` olarak döner
    const base64 = result.image || result.artifacts?.[0]?.base64;

    if (!base64) {
      return res.status(500).json({ error: "No image returned from Stability API" });
    }

    res.status(200).json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (err: any) {
    console.error("Stability API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
