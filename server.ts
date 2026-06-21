import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Allow body parsing
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Gemini Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error(
        "La clave API de Gemini no está configurada o contiene el marcador de posición por defecto. Configúrala en la pestaña de Secretos."
      );
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// REST API endpoint for Gap Analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { cvText, jobText } = req.body;

    if (!cvText || !cvText.trim()) {
      return res.status(400).json({ error: "El texto del CV es requerido para el análisis." });
    }
    if (!jobText || !jobText.trim()) {
      return res.status(400).json({ error: "El texto de la oferta de trabajo es requerido para el análisis." });
    }

    // Get client (throws if missing env variables)
    const ai = getGeminiClient();

    const systemPrompt = `Eres un reclutador experto mundial en reclutamiento de TI (Tecnologías de la Información) y consultor de carrera de software avanzado. Tu misión es realizar un análisis de brechas exhaustivo, crítico y exacto entre el Curriculum Vitae (CV) de un candidato y los requisitos técnicos de una Oferta de Empleo.

Debes leer ambos textos detalladamente y responder en un formato JSON estrictamente válido que describa con precisión:
1. 'compatibilityPercentage': Porcentaje entero de compatibilidad general basado en habilidades requeridas versus ofrecidas (pondera altamente las tecnologias núcleo del puesto).
2. 'roleSummary': Un breve resumen ejecutivo en español de lo que pide la oferta, su nivel de seniority y responsabilidades clave.
3. 'candidateStrengths': Una lista estructurada de los puntos fuertes del candidato que coinciden plenamente con lo solicitado.
4. 'matchingTechnologies': Las tecnologías, lenguajes, frameworks o herramientas que sí coinciden tanto en la oferta como en el CV (pueden ser sinónimos, pero extráelos de manera uniforme y limpia).
5. 'missingTechnologies': Tecnologías, metodologías o herramientas explícitamente solicitadas o altamente sugerivas en la oferta que no aparecen en el CV del candidato.
6. 'optimizationTips': Un array de consejos u optimizaciones personalizadas, categorizadas por 'category' (ej. "Reescritura de Logros", "Habilidades Técnicas", "Proyectos Personales", "Certificaciones") con detalles claros ('tip') e impacto estimado ('impact'), ayudando al candidato a saber exactamente qué reescribir, qué añadir o qué destacar para este puesto en particular.
7. 'suggestedIntroParagraph': Un resumen profesional (párrafo de introducción) en español redactado a la medida de este empleo que el candidato podría colocar al inicio de su CV para captar de inmediato el interés del reclutador, uniendo de manera atractiva sus fortalezas clave con los requisitos críticos de la oferta.

Todos los datos e introducciones deben redactarse obligatoriamente en Español (Spanish).`;

    const userPrompt = `A continuación, se te presenta el CV de un candidato y la Oferta de Empleo a la que desea postular.

--- CURRICULUM VITAE ---
${cvText}

--- OFERTA DE EMPLEO ---
${jobText}

Analiza meticulosamente ambos textos según las reglas asignadas y completa el esquema JSON solicitado de forma exhaustiva.`;

    // CORRECCIÓN: Cambiado de gemini-3.5-flash a gemini-2.5-flash para compatibilidad oficial con el SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // low temperature for precise factual matching
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compatibilityPercentage: {
              type: Type.INTEGER,
              description: "General compliance level from 0 to 100."
            },
            roleSummary: {
              type: Type.STRING,
              description: "Brief summary in Spanish describing the job opportunity, key mission, and seniority."
            },
            candidateStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key strengths of this candidate that fit current offer perfectly."
            },
            matchingTechnologies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of tech keywords matching."
            },
            missingTechnologies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Critical technologies or competencies required in the job card that are missing from the CV."
            },
            optimizationTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  tip: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["category", "tip", "impact"]
              },
              description: "Actionable concrete instructions to update the curriculum to boost conversion."
            },
            suggestedIntroParagraph: {
              type: Type.STRING,
              description: "A tailored, high-converting professional summary or teaser (3-4 sentences) matching the role keywords directly in professional Spanish."
            }
          },
          required: [
            "compatibilityPercentage",
            "roleSummary",
            "candidateStrengths",
            "matchingTechnologies",
            "missingTechnologies",
            "optimizationTips",
            "suggestedIntroParagraph"
          ]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("No se recibió respuesta o texto del servicio de análisis de Gemini.");
    }

    const jsonText = response.text.trim();
    const resultObj = JSON.parse(jsonText);
    return res.json(resultObj);

  } catch (error: any) {
    console.error("Error durando análisis de brechas:", error);
    return res.status(500).json({
      error: error.message || "Se produjo un error inesperado al analizar el CV frente a la oferta de empleo.",
    });
  }
});

// Setup Vite & static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

setupServer();
