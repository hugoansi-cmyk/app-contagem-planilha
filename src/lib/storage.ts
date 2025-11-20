// Gerenciamento de Local Storage

import { StoredData, AnalysisResult, SavedMonth, ProjectMonthsData } from './types';

const STORAGE_KEY = 'spreadsheet-analysis-data';
const SAVED_MONTHS_KEY = 'spreadsheet-saved-months';

export const saveAnalysis = (result: AnalysisResult): void => {
  try {
    const stored = getStoredData();
    const newData: StoredData = {
      history: [...stored.history, result].slice(-10), // Mantém últimas 10 análises
      lastAnalysis: result,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Erro ao salvar análise:', error);
  }
};

export const getStoredData = (): StoredData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
  return { history: [], lastAnalysis: null };
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
  }
};

// Funções para gerenciar meses salvos
export const saveMonth = (
  projectId: string,
  data: AnalysisResult,
  monthYear: string,
  displayName: string,
  startDate?: string,
  endDate?: string
): void => {
  try {
    const savedMonths = getSavedMonths();
    
    const newMonth: SavedMonth = {
      id: `${projectId}-${monthYear}-${Date.now()}`,
      projectId,
      monthYear,
      displayName,
      data,
      savedAt: new Date().toISOString(),
      startDate,
      endDate,
    };

    if (!savedMonths[projectId]) {
      savedMonths[projectId] = [];
    }

    savedMonths[projectId].push(newMonth);
    localStorage.setItem(SAVED_MONTHS_KEY, JSON.stringify(savedMonths));
  } catch (error) {
    console.error('Erro ao salvar mês:', error);
    throw error;
  }
};

export const getSavedMonths = (): ProjectMonthsData => {
  try {
    const data = localStorage.getItem(SAVED_MONTHS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar meses salvos:', error);
  }
  return {};
};

export const getProjectSavedMonths = (projectId: string): SavedMonth[] => {
  const allMonths = getSavedMonths();
  return allMonths[projectId] || [];
};

export const deleteSavedMonth = (monthId: string): void => {
  try {
    const savedMonths = getSavedMonths();
    
    // Encontrar e remover o mês
    for (const projectId in savedMonths) {
      savedMonths[projectId] = savedMonths[projectId].filter(
        (month) => month.id !== monthId
      );
    }
    
    localStorage.setItem(SAVED_MONTHS_KEY, JSON.stringify(savedMonths));
  } catch (error) {
    console.error('Erro ao deletar mês salvo:', error);
    throw error;
  }
};
