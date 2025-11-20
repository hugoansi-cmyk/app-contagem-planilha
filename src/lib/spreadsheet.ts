// Processamento de planilhas Excel

import * as XLSX from 'xlsx';
import { AnalysisResult } from './types';

export const processSpreadsheet = async (file: File, projectId?: string): Promise<AnalysisResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Processar horas da primeira aba ou aba com coluna "Duração"
        let totalHours = 0;
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // Procurar coluna "Duração"
        if (firstSheetData.length > 0) {
          const headers = firstSheetData[0];
          const durationIndex = headers.findIndex((h: any) => 
            h && h.toString().toLowerCase().includes('duração') || 
            h && h.toString().toLowerCase().includes('duracao')
          );

          if (durationIndex !== -1) {
            for (let i = 1; i < firstSheetData.length; i++) {
              const value = firstSheetData[i][durationIndex];
              if (value) {
                const hours = parseHours(value);
                totalHours += hours;
              }
            }
          }
        }

        // Processar quilômetros - buscar em TODAS as abas pela coluna "KM Rodado" ou "KM Total"
        let totalKilometers = 0;
        
        // Iterar por todas as abas
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          
          if (sheetData.length > 0) {
            const headers = sheetData[0];
            
            // Procurar pela coluna "KM Rodado" ou "KM Total" (busca exata e variações)
            const kmIndex = headers.findIndex((h: any) => {
              if (!h) return false;
              const headerStr = h.toString().toLowerCase().trim();
              return headerStr === 'km rodado' || 
                     headerStr === 'km total' ||
                     headerStr === 'km' || 
                     headerStr.includes('km rodado') ||
                     headerStr.includes('km total') ||
                     headerStr.includes('quilômetro') ||
                     headerStr.includes('kilometro');
            });

            if (kmIndex !== -1) {
              // Encontrou a coluna, somar todos os valores
              for (let i = 1; i < sheetData.length; i++) {
                const value = sheetData[i][kmIndex];
                if (value !== undefined && value !== null && value !== '') {
                  // Converter para string e limpar
                  const valueStr = value.toString().trim();
                  // Remover caracteres não numéricos exceto ponto e vírgula
                  const cleanValue = valueStr.replace(/[^\d.,\-]/g, '').replace(',', '.');
                  const km = parseFloat(cleanValue);
                  
                  if (!isNaN(km) && km > 0) {
                    totalKilometers += km;
                  }
                }
              }
            }
          }
        }

        // Contar pontos e roteiros baseado no projeto
        const pointCounts: Record<string, number> = {};
        const isGentioDoOuro = projectId === 'gentio-do-ouro';
        
        if (isGentioDoOuro) {
          // Apenas para Gentio do Ouro: contar ROTEIROS
          for (let i = 1; i <= 5; i++) {
            pointCounts[`ROTEIRO ${i}`] = 0;
          }
        } else {
          // Para outros projetos: contar PONTOS
          for (let i = 1; i <= 8; i++) {
            pointCounts[`PONTO ${i}`] = 0;
          }
        }

        // Procurar em todas as abas
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

          sheetData.forEach(row => {
            row.forEach((cell: any) => {
              if (cell && typeof cell === 'string') {
                if (isGentioDoOuro) {
                  // Contar ROTEIROS apenas para Gentio do Ouro
                  for (let i = 1; i <= 5; i++) {
                    const pattern = new RegExp(`ROTEIRO\\s*${i}`, 'gi');
                    const matches = cell.match(pattern);
                    if (matches) {
                      pointCounts[`ROTEIRO ${i}`] += matches.length;
                    }
                  }
                } else {
                  // Contar PONTOS para outros projetos
                  for (let i = 1; i <= 8; i++) {
                    const pattern = new RegExp(`PONTO\\s*${i}`, 'gi');
                    const matches = cell.match(pattern);
                    if (matches) {
                      pointCounts[`PONTO ${i}`] += matches.length;
                    }
                  }
                }
              }
            });
          });
        });

        const result: AnalysisResult = {
          totalHours,
          totalKilometers,
          pointCounts,
          timestamp: new Date().toISOString(),
        };

        resolve(result);
      } catch (error) {
        reject(new Error('Erro ao processar planilha: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
};

const parseHours = (value: any): number => {
  if (typeof value === 'number') {
    // Se for número decimal do Excel (dias), converter para horas
    return value * 24;
  }

  const str = value.toString();
  
  // Formato HH:MM ou HH:MM:SS
  const timeMatch = str.match(/(\d+):(\d+)(?::(\d+))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    return hours + minutes / 60 + seconds / 3600;
  }

  // Tentar extrair número
  const numMatch = str.match(/[\d.,]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0].replace(',', '.'));
    if (!isNaN(num)) {
      return num;
    }
  }

  return 0;
};
