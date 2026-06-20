export interface OptimizationTip {
  category: string;
  tip: string;
  impact: 'Alta' | 'Media' | 'Baja' | string;
}

export interface GapAnalysisResult {
  compatibilityPercentage: number;
  roleSummary: string;
  candidateStrengths: string[];
  matchingTechnologies: string[];
  missingTechnologies: string[];
  optimizationTips: OptimizationTip[];
  suggestedIntroParagraph: string;
}

export interface AnalysisRequest {
  cvText: string;
  jobText: string;
}
