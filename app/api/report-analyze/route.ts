import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a medical report analyzer. Read the attached lab report, prescription, or scan summary text and extract every relevant finding.

Respond ONLY with valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "categories": [
    {
      "category": "vitals" | "blood_sugar" | "lipids" | "liver" | "kidney" | "other",
      "findings": [
        {
          "name": string,
          "value": string,
          "unit": string,
          "normal_range": string,
          "tone": "good" | "attn" | "alert",
          "explanation": string
        }
      ]
    }
  ],
  "detailed_summary": string
}

Rules for each finding:
- "normal_range": the standard reference range for this test (e.g. "90-120 mmHg systolic", "70-99 mg/dL fasting"). If a range genuinely varies by lab/age/sex, give the most commonly cited adult range.
- "tone": "good" = within normal range, "attn" = borderline or mildly outside range, "alert" = clearly outside range.
- "explanation": 2-3 sentences, doctor-like but plain-language. Cover: (1) what this specific number means relative to the normal range, (2) why this marker matters for the body, (3) one or two common, non-diagnostic reasons a value like this occurs (e.g. diet, activity level, medication, dehydration). Do not diagnose the patient or claim they have a specific condition — describe possibilities in general terms only (e.g. "elevated triglycerides are often linked to diet high in refined carbs or sugar" rather than "you have high triglycerides because...").
- Group findings under the correct "category". Use "vitals" for blood pressure, heart rate, BMI, temperature; "blood_sugar" for glucose, HbA1c, insulin; "lipids" for cholesterol, LDL, HDL, triglycerides; "liver" for ALT, AST, bilirubin, ALP; "kidney" for creatinine, eGFR, BUN; "other" for anything that doesn't fit. Omit categories with no findings.

Rules for "detailed_summary":
- 5-8 sentences, written like a knowledgeable friend, not a form letter. Avoid stock openers like "The medical report shows..." — start from what actually stands out in THESE results.
- Weave in the biggest-picture pattern across categories (e.g. how blood sugar, lipids, and weight-related markers often relate to each other) rather than listing each finding again.
- Mention 2-3 specific, well-chosen questions the patient could ask their doctor, tied to what's actually abnormal here.
- End with a brief, natural reminder to discuss the full report with their doctor — not a boilerplate disclaimer tacked on.
- Do not diagnose. Describe patterns and possibilities, not conclusions.
- If the document has no readable medical data, return { "categories": [], "detailed_summary": "No readable medical data was found in this document." }`;

function extractJson(raw: string) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function analyzeImageWithGroq(base64Data: string, mediaType: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this medical report image." },
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64Data}` },
            },
          ],
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`Groq vision error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function analyzeTextWithGroq(text: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this medical report text:\n\n${text}` },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`Groq text error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mediaType = file.type || "application/pdf";
    const isImage = mediaType.startsWith("image/");

    let rawText: string;

    if (isImage) {
      const base64Data = buffer.toString("base64");
      rawText = await analyzeImageWithGroq(base64Data, mediaType);
    } else {
      const pdfParse = (await import("pdf-parse")).default;

      let extractedText: string | undefined;

      try {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text?.trim();
      } catch (firstErr: any) {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const repairedBytes = await pdfDoc.save();
          const repairedBuffer = Buffer.from(repairedBytes);
          const parsed = await pdfParse(repairedBuffer);
          extractedText = parsed.text?.trim();
        } catch (repairErr: any) {
          return NextResponse.json(
            {
              error:
                "This PDF's internal structure is corrupted and could not be repaired automatically. Try re-exporting or 'printing to PDF' the file again, or upload it as a JPG/PNG instead.",
              detail: `${firstErr.message} / repair attempt: ${repairErr.message}`,
            },
            { status: 422 }
          );
        }
      }

      if (!extractedText) {
        return NextResponse.json(
          { error: "Could not extract text from this PDF (it may be a scanned image PDF)." },
          { status: 422 }
        );
      }

      rawText = await analyzeTextWithGroq(extractedText);
    }

    let parsed: { categories: any[]; detailed_summary: string };
    try {
      parsed = extractJson(rawText);
    } catch {
      return NextResponse.json({ error: "AI response was not valid JSON", raw: rawText }, { status: 502 });
    }

    return NextResponse.json({
      categories: parsed.categories,
      detailedSummary: parsed.detailed_summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Unexpected server error: ${err.message}` }, { status: 500 });
  }
}