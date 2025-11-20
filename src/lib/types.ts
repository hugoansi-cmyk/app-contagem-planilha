// Tipos para o aplicativo de análise de planilhas

export interface AnalysisResult {
  totalHours: number;
  totalKilometers: number;
  pointCounts: Record<string, number>;
  timestamp: string;
  startDate?: string;
  endDate?: string;
}

export interface StoredData {
  history: AnalysisResult[];
  lastAnalysis: AnalysisResult | null;
}

export interface SavedMonth {
  id: string;
  projectId: string;
  monthYear: string; // formato: "2024-01" (YYYY-MM)
  displayName: string; // formato: "Janeiro 2024"
  data: AnalysisResult;
  savedAt: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectMonthsData {
  [projectId: string]: SavedMonth[];
}
