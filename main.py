from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
import google.generativeai as genai

app = FastAPI(
    title="TalentMatch - API de Análisis de Brechas de CV",
    description="Backend para analizar Currículums Vitae frente a Ofertas de Empleo usando Gemini 1.5 Flash o superior."
)

# 1. Configurar CORS para permitir peticiones desde Vercel, Netlify o cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto por tu dominio de frontend en producción (ej: ["https://talentmatch.vercel.app"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Esquemas de validación de datos con Pydantic
class AnalysisRequest(BaseModel):
    cvText: str = Field(..., description="Texto legible o contenido decodificado del Currículum Vitae")
    jobText: str = Field(..., description="Texto completo de la oferta de trabajo o vacante TI")

class OptimizationTip(BaseModel):
    category: str
    tip: str
    impact: str

class GapAnalysisResponse(BaseModel):
    compatibilityPercentage: int
    roleSummary: str
    candidateStrengths: List[str]
    matchingTechnologies: List[str]
    missingTechnologies: List[str]
    optimizationTips: List[OptimizationTip]
    suggestedIntroParagraph: str

# 3. Endpoint de Análisis
@app.post("/api/analyze", response_model=GapAnalysisResponse)
async def analyze_gap(request: AnalysisRequest):
    # Obtener API Key de las variables de entorno
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="La clave GEMINI_API_KEY no está configurada en las variables de entorno del servidor."
        )
    
    if not request.cvText.strip():
        raise HTTPException(status_code=400, detail="El contenido del CV está vacío.")
    
    if not request.jobText.strip():
        raise HTTPException(status_code=400, detail="El contenido de la oferta de trabajo está vacío.")

    try:
        # Inicializar el SDK de Google Generative AI
        genai.configure(api_key=api_key)
        
        # Usar el modelo recomendado (gemini-1.5-flash o gemini-2.5-flash según disponibilidad)
        # Nota: La llamada se configura bajo el rol de consultor experto TI
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            }
        )

        system_prompt = (
            "Eres un reclutador experto mundial en reclutamiento de TI (Tecnologías de la Información) "
            "y consultor de carrera de software avanzado. Tu misión es realizar un análisis de brechas exhaustivo, "
            "crítico y exacto entre el Curriculum Vitae (CV) de un candidato y los requisitos técnicos de una Oferta de Empleo.\n\n"
            "Debes leer ambos textos detalladamente y responder en un formato JSON estrictamente válido que describa con precisión:\n"
            "1. 'compatibilityPercentage': Porcentaje entero de compatibilidad general basado en habilidades requeridas versus ofrecidas.\n"
            "2. 'roleSummary': Un breve resumen ejecutivo en español de lo que pide la oferta, su nivel de seniority y responsabilidades clave.\n"
            "3. 'candidateStrengths': Una lista estructurada de los puntos fuertes del candidato que coinciden plenamente con lo solicitado.\n"
            "4. 'matchingTechnologies': Las tecnologías, lenguajes o herramientas que sí coinciden tanto en la oferta como en el CV.\n"
            "5. 'missingTechnologies': Tecnologías, metodologías o herramientas explícitamente solicitadas en la oferta que no aparecen en el CV.\n"
            "6. 'optimizationTips': Un array de objetos con 'category', 'tip' e 'impact' con consejos clave personalizados para mejorar el CV de cara a la vacante.\n"
            "7. 'suggestedIntroParagraph': Un resumen profesional (párrafo de introducción) en español personalizado que el candidato puede añadir a la cabecera de su CV para captar al reclutador.\n\n"
            "Toda la respuesta debe estructurarse en la siguiente especificación JSON de forma obligatoria:\n"
            "{\n"
            "  \"compatibilityPercentage\": 75,\n"
            "  \"roleSummary\": \"Texto...\",\n"
            "  \"candidateStrengths\": [\"Fuerte en React\"],\n"
            "  \"matchingTechnologies\": [\"React\", \"Node.js\"],\n"
            "  \"missingTechnologies\": [\"PostgreSQL\", \"Docker\"],\n"
            "  \"optimizationTips\": [\n"
            "     { \"category\": \"Tecnologías\", \"tip\": \"Añade proyectos en PostgreSQL\", \"impact\": \"Alta\" }\n"
            "  ],\n"
            "  \"suggestedIntroParagraph\": \"Texto...\"\n"
            "}\n"
            "Toda la información debe estar en Idioma Español."
        )

        user_content = f"""A continuación, se te presenta el CV de un candidato y la Oferta de Empleo.

--- CURRICULUM VITAE ---
{request.cvText}

--- OFERTA DE EMPLEO ---
{request.jobText}

Analiza meticulosamente ambos textos según las instrucciones y devuelve el JSON requerido."""

        # Ejecutar llamada utilizando instrucciones del sistema
        response = model.generate_content(
            contents=user_content,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2
            ),
            # system_instruction se puede pasar directamente si el SDK de tu entorno lo soporta
            # u opcionalmente concatenado para máxima compatibilidad con versiones antiguas
        )
        
        if not response or not response.text:
            raise HTTPException(status_code=502, detail="No se recibió respuesta válida del servicio de Gemini.")

        # Intentar parsear a JSON directo para responder
        result_json = json.loads(response.text.strip())
        return result_json

    except json.JSONDecodeError as je:
        print("Error al decodificar la respuesta JSON del modelo:", je)
        raise HTTPException(
            status_code=502, 
            detail="La IA devolvió un formato no decodificable. Intenta nuevamente."
        )
    except Exception as e:
        print("Error durante el procesamiento con Gemini:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Para ejecución local opcional
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
