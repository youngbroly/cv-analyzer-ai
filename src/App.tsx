import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Terminal, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  FileUp,
  Printer, 
  Briefcase, 
  Layers, 
  Gauge, 
  ArrowRight,
  Info
} from 'lucide-react';
import { SAMPLE_CV, SAMPLE_JOB_OFFER } from './data';
import { GapAnalysisResult } from './types';

export default function App() {
  const [cvText, setCvText] = useState<string>('');
  const [jobText, setJobText] = useState<string>('');
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copiedIntro, setCopiedIntro] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Drag and drop states
  const [isDraggingCV, setIsDraggingCV] = useState<boolean>(false);
  const [isDraggingJob, setIsDraggingJob] = useState<boolean>(false);

  // Loading steps to show to the user during the LLM request
  const loadingSteps = [
    'Iniciando motor de análisis experto TI...',
    'Analizando estructura gramática y logros del CV...',
    'Extrayendo pila técnica necesaria de la oferta de trabajo...',
    'Ponderando tecnologías núcleo frente a secundarias...',
    'Calculando brechas técnicas y diferencias de seniority...',
    'Diseñando estrategias personalizadas de optimización...',
    'Redactando introducción ejecutiva de alto impacto...',
    'Validando estructura de datos final...',
  ];

  useEffect(() => {
    let intervalId: any;
    if (isLoading) {
      let currentStepIndex = 0;
      setLoadingStep(loadingSteps[0]);
      intervalId = setInterval(() => {
        if (currentStepIndex < loadingSteps.length - 1) {
          currentStepIndex++;
          setLoadingStep(loadingSteps[currentStepIndex]);
        }
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  // Load sample data trigger
  const handleLoadSamples = () => {
    setCvText(SAMPLE_CV);
    setJobText(SAMPLE_JOB_OFFER);
    setError(null);
  };

  const handleClearCV = () => {
    setCvText('');
  };

  const handleClearJob = () => {
    setJobText('');
  };

  // Plain text File Reader helper
  const handleFileRead = (file: File, target: 'cv' | 'job') => {
    if (!file) return;
    
    // Check if it looks like a readable text/word file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        if (target === 'cv') {
          setCvText(text);
        } else {
          setJobText(text);
        }
      }
    };
    reader.onerror = () => {
      setError(`No se pudo leer el archivo ${file.name}. Asegúrese de que sea un archivo de texto plano válido.`);
    };
    reader.readAsText(file);
  };

  // Drag CV triggers
  const handleDragCVOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(true);
  };

  const handleDragCVLeave = () => {
    setIsDraggingCV(false);
  };

  const handleDropCV = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0], 'cv');
    }
  };

  // Drag Job triggers
  const handleDragJobOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJob(true);
  };

  const handleDragJobLeave = () => {
    setIsDraggingJob(false);
  };

  const handleDropJob = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJob(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0], 'job');
    }
  };

  // File Inputs
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'cv' | 'job') => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0], target);
    }
  };

  // Backend Analysis Trigger
  const runAnalysis = async () => {
    if (!cvText.trim()) {
      setError('Por favor, pega el contenido o sube un archivo de tu CV antes de analizar.');
      return;
    }
    if (!jobText.trim()) {
      setError('Por favor, pega la oferta de empleo antes de analizar.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const apiBaseUrl = (import.meta as any).env.VITE_EXTERNAL_API_URL || '';
      const endpoint = `${apiBaseUrl}/api/analyze`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvText, jobText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión con el motor de IA de Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, isIntro: boolean) => {
    navigator.clipboard.writeText(text);
    if (isIntro) {
      setCopiedIntro(true);
      setTimeout(() => setCopiedIntro(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Dynamic color for percentage score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-sky-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-sky-500/10 border-sky-500/20';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getImpactBadge = (impact: string) => {
    const cleanImpact = impact.toLowerCase();
    if (cleanImpact.includes('alt') || cleanImpact.includes('high')) {
      return (
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
          Impacto Alto
        </span>
      );
    }
    if (cleanImpact.includes('medi') || cleanImpact.includes('mod')) {
      return (
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
          Impacto Medio
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded">
        Impacto Modesto
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white print:bg-white print:text-black">
      {/* Top Header */}
      <header id="app-header" className="h-16 border-b border-slate-900 flex items-center justify-between px-4 sm:px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              TalentMatch <span className="text-sky-400 font-mono text-xs bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded uppercase">v1.5 Flash</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
          <span className="hidden md:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-glow-green"></span>
            Reclutador Experto TI Activo
          </span>
          <div className="hidden md:block h-4 w-[1px] bg-slate-800"></div>
          <button 
            id="btn-load-samples"
            onClick={handleLoadSamples}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sky-400 transition-colors flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            Cargar Ejemplos
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-0 print:block">
        
        {/* Left Inputs Section */}
        <section className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-900 bg-slate-950/40 p-4 sm:p-6 flex flex-col gap-5 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Datos de Postulación</h2>
            <p className="text-xs text-slate-400">Pega texto o arrastra archivos</p>
          </div>

          {/* CV Section */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-slate-300 font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                1. Curriculum Vitae (CV)
              </label>
              {cvText && (
                <button 
                  id="btn-clear-cv"
                  onClick={handleClearCV}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>

            <div 
              onDragOver={handleDragCVOver}
              onDragLeave={handleDragCVLeave}
              onDrop={handleDropCV}
              className={`flex-1 flex flex-col bg-slate-950 border rounded-xl overflow-hidden transition-all-custom relative group ${
                isDraggingCV 
                  ? 'border-sky-500 bg-sky-950/20 shadow-lg shadow-sky-500/5' 
                  : 'border-slate-800 focus-within:border-slate-700 focus-within:ring-1 focus-within:ring-slate-700'
              }`}
            >
              {/* Optional Drag and Drop Overlay/Placeholder */}
              {!cvText && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none text-center bg-slate-950/90 z-10 transition-opacity">
                  <Upload className="w-8 h-8 text-slate-600 mb-2 group-hover:text-slate-400 group-hover:scale-105 transition-transform" />
                  <p className="text-sm text-slate-400 font-medium">Pega tu CV aquí o suelta un archivo</p>
                  <p className="text-xs text-slate-600 mt-1">.txt, .md, .pdf o texto enriquecido como texto plano</p>
                  
                  <label className="mt-4 pointer-events-auto cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors text-slate-200">
                    <FileUp className="w-3.5 h-3.5 text-sky-400" />
                    Seleccionar Archivo
                    <input 
                      type="file" 
                      accept=".txt,.md,.pdf,.docx,.doc,text/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'cv')}
                    />
                  </label>
                </div>
              )}

              {/* Textarea */}
              <textarea 
                id="textarea-cv"
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Pega el texto completo de tu Currículum aquí..."
                className="w-full flex-1 p-4 bg-transparent resize-none text-sm text-slate-300 focus:outline-none min-h-[160px] font-mono leading-relaxed"
              />

              {/* Bottom bar of textarea */}
              {cvText && (
                <div className="p-2 border-t border-slate-900/60 bg-slate-950 flex justify-between items-center text-xs text-slate-500">
                  <span>{cvText.length} caracteres ({cvText.split(/\s+/).filter(Boolean).length} palabras)</span>
                  <label className="cursor-pointer text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold transition-colors">
                    <Upload className="w-3 h-3" /> Reemplazar por archivo
                    <input 
                      type="file" 
                      accept=".txt,.md,.pdf,.docx,.doc,text/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'cv')}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Job Offer Section */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-slate-300 font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-500" />
                2. Oferta de Empleo Técnica
              </label>
              {jobText && (
                <button 
                  id="btn-clear-job"
                  onClick={handleClearJob}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>

            <div 
              onDragOver={handleDragJobOver}
              onDragLeave={handleDragJobLeave}
              onDrop={handleDropJob}
              className={`flex-1 flex flex-col bg-slate-950 border rounded-xl overflow-hidden transition-all-custom relative group ${
                isDraggingJob 
                  ? 'border-sky-500 bg-sky-950/20 shadow-lg shadow-sky-500/5' 
                  : 'border-slate-800 focus-within:border-slate-700 focus-within:ring-1 focus-within:ring-slate-700'
              }`}
            >
              {/* Optional Drag and Drop Overlay/Placeholder */}
              {!jobText && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none text-center bg-slate-950/90 z-10 transition-opacity">
                  <Upload className="w-8 h-8 text-slate-600 mb-2 group-hover:text-slate-400 group-hover:scale-105 transition-transform" />
                  <p className="text-sm text-slate-400 font-medium">Pega la descripción del puesto aquí</p>
                  <p className="text-xs text-slate-600 mt-1">Saca el texto directo del portal de empleo</p>
                  
                  <label className="mt-4 pointer-events-auto cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors text-slate-200">
                    <FileUp className="w-3.5 h-3.5 text-sky-400" />
                    Cargar Oferta
                    <input 
                      type="file" 
                      accept=".txt,.md,.pdf,.docx,.doc,text/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'job')}
                    />
                  </label>
                </div>
              )}

              {/* Textarea */}
              <textarea 
                id="textarea-job"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Pega la oferta de empleo completa rascada de LinkedIn, InfoJobs, etc..."
                className="w-full flex-1 p-4 bg-transparent resize-none text-sm text-slate-300 focus:outline-none min-h-[160px] font-mono leading-relaxed"
              />

              {/* Bottom bar of textarea */}
              {jobText && (
                <div className="p-2 border-t border-slate-900/60 bg-slate-950 flex justify-between items-center text-xs text-slate-500">
                  <span>{jobText.length} caracteres ({jobText.split(/\s+/).filter(Boolean).length} palabras)</span>
                  <label className="cursor-pointer text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold transition-colors">
                    <Upload className="w-3 h-3" /> Reemplazar por archivo
                    <input 
                      type="file" 
                      accept=".txt,.md,.pdf,.docx,.doc,text/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'job')}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Trigger Actions */}
          <div className="pt-2 flex flex-col gap-3">
            {error && (
              <div id="error-banner" className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2.5 items-start text-sm text-rose-300">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Error de Validación:</span> {error}
                </div>
              </div>
            )}

            <button 
              id="btn-analyze"
              disabled={isLoading}
              onClick={runAnalysis}
              className={`w-full py-4 bg-sky-500 hover:bg-sky-450 active:bg-sky-600 text-slate-950 font-bold rounded-xl transition-all-custom flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer text-sm sm:text-base tracking-wider leading-none select-none disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  PROCESANDO CON GEMA DE IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse text-slate-950" />
                  EJECUTAR ANÁLISIS DE BRECHAS
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Output Section */}
        <section className="col-span-12 lg:col-span-7 p-4 sm:p-8 bg-slate-950 flex flex-col min-h-[500px] print:p-0 print:border-none print:bg-white print:text-black">
          
          {isLoading && (
            <div id="loading-container" className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="relative flex items-center justify-center">
                {/* Circular wave spinner */}
                <div className="w-20 h-20 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin"></div>
                <div className="absolute w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-sky-400 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <p className="text-white font-medium text-base">Gemini 3.5 Flash está evaluando el CV</p>
                <div className="h-6 overflow-hidden">
                  <p className="text-sky-400 font-mono text-xs tracking-wide animate-pulse">
                    {loadingStep}
                  </p>
                </div>
                <div className="w-48 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full animate-[shimmer_1.5s_infinite] w-2/3"></div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div id="empty-state-container" className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-center mb-6">
                <Gauge className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Esperando Información para Iniciar el Análisis</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                Introduce el texto de tu currículum vitae y de la vacante TI. Nuestro reclutador experto calculará la compatibilidad, listará las palabras clave y te dará un listado detallado de mejoras específicas.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={handleLoadSamples}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sky-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Cargar Ejemplo Completo para Prueba
                </button>
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div id="results-wrapper" className="space-y-6 fade-in print:text-black">
              
              {/* Header metrics */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-900/80 pb-6 print:border-slate-200">
                <div>
                  <h2 className="text-2xl font-light text-white print:text-black print:font-bold">Informe de Compatibilidad TI</h2>
                  <p className="text-slate-400 text-xs mt-1 print:text-slate-600">
                    Analizado bajo el rol de Senior IT Recruiter • Gemini 3.5 Flash
                  </p>
                </div>
                
                {/* Visual circular progress score */}
                <div className={`flex items-center gap-4 p-3 rounded-xl border ${getScoreBg(result.compatibilityPercentage)} print:border-slate-300 print:bg-slate-50`}>
                  <div className="text-right">
                    <div className={`text-4xl font-extrabold font-mono tracking-tight leading-none ${getScoreColor(result.compatibilityPercentage)}`}>
                      {result.compatibilityPercentage}%
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                      Ajuste de Postulación
                    </div>
                  </div>
                  
                  {/* Arc visualization */}
                  <div className="w-14 h-14 rounded-full border border-slate-800 flex items-center justify-center relative shrink-0">
                    <svg className="absolute w-full h-full -rotate-90">
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="24" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        fill="transparent" 
                        className="text-slate-900/60" 
                      />
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="24" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        fill="transparent" 
                        className={`${getScoreColor(result.compatibilityPercentage)}`}
                        strokeDasharray="150.7" 
                        strokeDashoffset={150.7 - (150.7 * result.compatibilityPercentage) / 100} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[11px] font-bold text-slate-300 font-mono">
                      KPI
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary Card */}
              <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-900 print:border-slate-200 print:bg-slate-50">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">Resumen de la Vacante</div>
                <h3 className="text-base text-white font-medium mb-3 flex items-center gap-2 print:text-black">
                  <Briefcase className="w-4 h-4 text-sky-500" />
                  Misión Clave y Seniority Identificado
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed print:text-slate-800">
                  {result.roleSummary}
                </p>
              </div>

              {/* Candidate strengths / matchmaking points */}
              {result.candidateStrengths && result.candidateStrengths.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Puntos Fuertes del Candidato Seleccionados
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.candidateStrengths.map((strength, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed bg-slate-900/20 border border-slate-900/40 p-2.5 rounded-lg text-left print:text-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies Matched & Missing Grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tech Matched */}
                <div className="bg-slate-900/20 rounded-xl p-5 border border-slate-900 flex flex-col print:border-slate-200">
                  <h3 className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tecnologías Coincidentes ({result.matchingTechnologies.length})
                  </h3>
                  
                  {result.matchingTechnologies.length === 0 ? (
                    <p className="text-xs text-slate-500 italic mt-1">Ninguna tecnología coincidente detectada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchingTechnologies.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Gap */}
                <div className="bg-slate-900/20 rounded-xl p-5 border border-slate-900 flex flex-col print:border-slate-200">
                  <h3 className="text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Brechas / Faltas Tecnológicas ({result.missingTechnologies.length})
                  </h3>
                  
                  {result.missingTechnologies.length === 0 ? (
                    <p className="text-xs text-emerald-400 font-medium italic mt-1">¡Increíble! Satisfecho al 100% o sin brechas sustanciales.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingTechnologies.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Advice Blueprint */}
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-5 sm:p-6 print:border-slate-200 print:bg-slate-50">
                <h3 className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 print:text-sky-600">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                  Blueprint de Optimización y Consejos Críticos
                </h3>
                
                <div className="space-y-4">
                  {result.optimizationTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 items-start border-l-2 border-sky-950 pl-3.5 py-0.5 print:border-sky-300">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-sky-400 bg-sky-950/60 border border-sky-900 px-2 py-0.5 rounded">
                            {tip.category}
                          </span>
                          {getImpactBadge(tip.impact)}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed print:text-slate-800">
                          {tip.tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Intro / Executive Pitch block */}
              <div className="bg-gradient-to-br from-indigo-950/20 to-sky-950/15 border border-indigo-500/15 rounded-xl p-5 sm:p-6 print:border-slate-200 print:bg-slate-50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 print:text-indigo-800">
                      Resumen Ejecutivo para Cabecera del CV
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(result.suggestedIntroParagraph, true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-indigo-950 rounded-lg text-xs font-semibold text-slate-300 transition-colors cursor-pointer select-none print:hidden"
                  >
                    {copiedIntro ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Copiar Párrafo</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs sm:text-sm italic text-slate-300 leading-relaxed bg-slate-950/40 p-4 border border-indigo-500/5 rounded-lg print:text-slate-800 print:bg-white">
                  &ldquo;{result.suggestedIntroParagraph}&rdquo;
                </p>
                
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 print:hidden">
                  <Info className="w-3 h-3 shrink-0 text-slate-600" />
                  Usa este párrafo en la cabecera de tu Curriculum para incrementar el engagement inicial del ATS y del reclutador.
                </p>
              </div>

              {/* Action feet */}
              <footer className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <span className="text-[10px] text-slate-600 font-mono tracking-wider">
                  OUTPUT_FORMAT: STRICT_JSON_SECURE • AGENT_COMPLIANT: TRUE
                </span>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyToClipboard(
                      `--- INFORME DE COMPATIBILIDAD TI ---
Porcentaje de Compatibilidad Geral: ${result.compatibilityPercentage}%

Resumen del Rol:
${result.roleSummary}

Puntos Fuertes Coincidentes:
${result.candidateStrengths.map(s => `- ${s}`).join('\n')}

Habilidades Coincidentes:
${result.matchingTechnologies.join(', ')}

Habilidades Faltantes:
${result.missingTechnologies.join(', ')}

Consejos de Optimización:
${result.optimizationTips.map(t => `[${t.category} - ${t.impact}] ${t.tip}`).join('\n')}

Introducción Sugerida:
${result.suggestedIntroParagraph}`,
                      false
                    )}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors cursor-pointer select-none flex items-center gap-1.5"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copiar Todo el Reporte</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handlePrint}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-450 active:bg-sky-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer select-none flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / PDF
                  </button>
                </div>
              </footer>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
