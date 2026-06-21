import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import google.generativeai as genai

app = FastAPI(title="CV Analyzer API")

# Configurar CORS para permitir que tu frontend en Vercel se conecte sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción puedes cambiarlo por tu URL de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar las credenciales de Gemini
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Esquemas de datos para validar la entrada (Pydantic)
class AnalyzeRequest(BaseModel):
    cvText: str
    jobText: str

class OptimizationTip(BaseModel):
    category: str
    tip: str
    impact: str

# Esquema estricto de salida que espera tu Frontend
class AnalysisResponse(BaseModel):
    compatibilityPercentage: int
    roleSummary: str
    candidateStrengths: List[str]
    matchingTechnologies: List[str]
    missingTechnologies: List[str]
    optimizationTips: List[OptimizationTip]
    suggestedIntroParagraph: str

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_cv(payload: AnalyzeRequest):
    if not payload.cvText.strip() or not payload.jobText.strip():
        raise HTTPException(status_code=400, detail="El CV y la oferta son obligatorios.")
    
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada en Render.")

    system_prompt = (
        "Eres un reclutador experto mundial en reclutamiento de TI (Tecnologías de la Información) "
        "y consultor de carrera de software avanzado. Tu misión es realizar un análisis de brechas "
        "exhaustivo, crítico y exacto entre el CV de un candidato y los requisitos de una Oferta de Empleo.\n\n"
        "Debes responder en un formato JSON estrictamente válido que describa con precisión:\n"
        "1. 'compatibilityPercentage': Porcentaje entero de compatibilidad.\n"
        "2. 'roleSummary': Breve resumen ejecutivo del puesto en español.\n"
        "3. 'candidateStrengths': Lista de puntos fuertes del candidato.\n"
        "4. 'matchingTechnologies': Tecnologías coincidentes.\n"
        "5. 'missingTechnologies': Tecnologías requeridas ausentes en el CV.\n"
        "6. 'optimizationTips': Array de objetos con 'category', 'tip' e 'impact'.\n"
        "7. 'suggestedIntroParagraph': Resumen profesional a la medida del empleo en español.\n\n"
        "Devuelve ÚNICAMENTE el JSON plano, sin formato markdown ni bloques de código."
    )

    user_prompt = f"""
    --- CURRICULUM VITAE ---
    {payload.cvText}

    --- OFERTA DE EMPLEO ---
    {payload.jobText}
    """

    try:
        # CORRECCIÓN DEFINITIVA: Usamos el modelo de producción oficial gemini-1.5-flash
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )
        
        response = model.generate_content(
            user_prompt,
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
        )
        
        # Parsear el texto devuelto por la IA
        data_json = json.loads(response.text.strip())
        return data_json

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA no devolvió un formato JSON válido.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "CV Analyzer Backend is running"}
