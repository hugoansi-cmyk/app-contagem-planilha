'use client';

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Clock, MapPin, TrendingUp, Trash2, ArrowLeft, Calendar, Download, FileText, Save, Archive, Eye, X } from 'lucide-react';
import { processSpreadsheet } from '@/lib/spreadsheet';
import { saveAnalysis, getStoredData, clearHistory, saveMonth, getProjectSavedMonths, deleteSavedMonth } from '@/lib/storage';
import { AnalysisResult, SavedMonth } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const projectNames: Record<string, string> = {
  'campo-largo': 'ENGIE - CAMPO LARGO',
  'umburanas': 'ENGIE - UMBURANAS',
  'gentio-do-ouro': 'ENGIE - GENTIO DO OURO'
};

// Legendas específicas para Campo Largo
const campoLargoLegends: Record<string, string> = {
  'PONTO 1': 'PORTARIA PRINCIPAL',
  'PONTO 2': 'ROTATÓRIA PARQUE 10 COMPLEMENTO PARQUE 2',
  'PONTO 3': 'SUBESTAÇÃO CAMPO LARGO',
  'PONTO 4': 'PORTARIA 3 CAMPO LARGO',
  'PONTO 5': 'ROTATÓRIA DO PARQUE 11, 12 E 13',
  'PONTO 6': 'ROTATÓRIA PARQUE 19, 20 E 22',
  'PONTO 7': 'PRÉDIO CENTRAL - BORRACHARIA',
  'PONTO 8': 'VILA ENGIE'
};

// Legendas específicas para Umburanas
const umburanasLegends: Record<string, string> = {
  'PONTO 1': 'PORTARIA PRINCIPAL UMBURANAS',
  'PONTO 2': 'PARQUE 19 AG 6',
  'PONTO 3': 'PARQUE 2 AERO 10',
  'PONTO 4': 'SUBESTAÇÃO UMBURANAS',
  'PONTO 5': 'ROTATÓRIA PARQUE 8 COM 16',
  'PONTO 6': 'ROTATÓRIA DO PARQUE 9 COM 5, 10 E 23',
  'PONTO 7': 'PARQUE 10 AG 6',
  'PONTO 8': 'VILA ENGIE'
};

// Legendas específicas para Gentio do Ouro
const gentioDoOuroLegends: Record<string, string> = {
  'ROTEIRO 1': 'ROTA NORTE - PARQUES 1 A 5',
  'ROTEIRO 2': 'ROTA SUL - PARQUES 6 A 10',
  'ROTEIRO 3': 'ROTA LESTE - PARQUES 11 A 15',
  'ROTEIRO 4': 'ROTA OESTE - PARQUES 16 A 20',
  'ROTEIRO 5': 'ROTA CENTRAL - SUBESTAÇÃO E VILA'
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const projectName = projectNames[projectId] || 'Projeto';
  const isGentioDoOuro = projectId === 'gentio-do-ouro';
  const isCampoLargo = projectId === 'campo-largo';
  const isUmburanas = projectId === 'umburanas';

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [savedMonths, setSavedMonths] = useState<SavedMonth[]>([]);
  const [viewingMonth, setViewingMonth] = useState<SavedMonth | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [monthName, setMonthName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // Não carregar análise anterior - sempre começar limpo
    setResult(null);
    loadSavedMonths();
  }, [projectId, router]);

  const loadSavedMonths = () => {
    const months = getProjectSavedMonths(projectId);
    setSavedMonths(months.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Verificar se usuário é visualizador
    if (currentUser?.role === 'viewer') {
      toast.error('Você não tem permissão para fazer upload de arquivos');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      toast.error('Formato inválido. Use arquivos Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    setIsProcessing(true);
    toast.info('Processando planilha...');

    try {
      const analysisResult = await processSpreadsheet(file, projectId);
      setResult(analysisResult);
      saveAnalysis(analysisResult);
      
      toast.success('Planilha analisada com sucesso!');
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao processar planilha');
      console.error(error);
    } finally {
      setIsProcessing(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const handleSaveMonth = () => {
    // Verificar se usuário é visualizador
    if (currentUser?.role === 'viewer') {
      toast.error('Você não tem permissão para salvar meses');
      return;
    }

    if (!result) {
      toast.error('Nenhum dado para salvar');
      return;
    }

    if (!monthName.trim()) {
      toast.error('Digite um nome para o mês');
      return;
    }

    try {
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      saveMonth(
        projectId,
        result,
        monthYear,
        monthName.trim(),
        startDate,
        endDate
      );

      loadSavedMonths();
      setShowSaveDialog(false);
      setMonthName('');
      toast.success(`Mês "${monthName}" salvo com sucesso!`);
    } catch (error) {
      toast.error('Erro ao salvar mês');
      console.error(error);
    }
  };

  const handleViewMonth = (month: SavedMonth) => {
    setViewingMonth(month);
    setResult(month.data);
    setStartDate(month.startDate || '');
    setEndDate(month.endDate || '');
  };

  const handleCloseViewMonth = () => {
    setViewingMonth(null);
    setResult(null);
    setStartDate('');
    setEndDate('');
  };

  const handleDeleteMonth = (monthId: string) => {
    // Verificar se usuário é visualizador
    if (currentUser?.role === 'viewer') {
      toast.error('Você não tem permissão para excluir meses');
      return;
    }

    try {
      deleteSavedMonth(monthId);
      loadSavedMonths();
      if (viewingMonth?.id === monthId) {
        handleCloseViewMonth();
      }
      toast.success('Mês excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir mês');
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    // Verificar se usuário é visualizador
    if (currentUser?.role === 'viewer') {
      toast.error('Você não tem permissão para exportar PDF');
      return;
    }

    if (!result) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      toast.info('Gerando PDF...');
      
      // Importação dinâmica do jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 20;

      // Função auxiliar para formatar data
      const formatDisplayDate = (dateString: string) => {
        if (!dateString) return 'Não definida';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return 'Não definida';
        }
      };

      const formatTimestamp = (isoString: string) => {
        try {
          const date = new Date(isoString);
          return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return 'Data inválida';
        }
      };

      // Cabeçalho com fundo azul
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const titleWidth = doc.getTextWidth(projectName);
      doc.text(projectName, (pageWidth - titleWidth) / 2, 18);
      
      // Número do Contrato
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contractText = 'CONTRATO: CONSCLWPTT.DPS.22.1982';
      const contractWidth = doc.getTextWidth(contractText);
      doc.text(contractText, (pageWidth - contractWidth) / 2, 26);
      
      doc.setFontSize(12);
      const subtitleText = viewingMonth ? `${viewingMonth.displayName} - SOMENTE LEITURA` : 'Relatório de Análise de Dados';
      const subtitleWidth = doc.getTextWidth(subtitleText);
      doc.text(subtitleText, (pageWidth - subtitleWidth) / 2, 35);
      
      if (viewingMonth) {
        doc.setFontSize(10);
        const readonlyText = 'ARQUIVO ARQUIVADO';
        const readonlyWidth = doc.getTextWidth(readonlyText);
        doc.text(readonlyText, (pageWidth - readonlyWidth) / 2, 43);
      }

      // Resetar cor do texto
      doc.setTextColor(0, 0, 0);
      yPosition = 65;

      // Informações do Relatório
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações do Relatório', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Análise Realizada em: ${formatTimestamp(result.timestamp)}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Período - Início: ${formatDisplayDate(startDate)}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Período - Fim: ${formatDisplayDate(endDate)}`, margin, yPosition);
      yPosition += 15;

      // Resumo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${isGentioDoOuro ? 'Duração de Horas' : 'Total de Horas'}: ${result.totalHours.toFixed(2)}h`, margin, yPosition);
      yPosition += 7;
      doc.text(`${isGentioDoOuro ? 'KM Total' : 'Total de KM'}: ${result.totalKilometers.toFixed(2)} km`, margin, yPosition);
      yPosition += 7;

      if (!isGentioDoOuro) {
        const totalPoints = Object.values(result.pointCounts).reduce((a, b) => a + b, 0);
        doc.text(`Total de Pontos: ${totalPoints}`, margin, yPosition);
        yPosition += 15;
      } else {
        yPosition += 10;
      }

      // Contagem por Ponto/Roteiro
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(isGentioDoOuro ? 'Informe o Roteiro' : 'Contagem por Ponto', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const entries = Object.entries(result.pointCounts);
      
      // Determinar qual conjunto de legendas usar
      const legends = isCampoLargo ? campoLargoLegends : (isUmburanas ? umburanasLegends : (isGentioDoOuro ? gentioDoOuroLegends : null));
      
      entries.forEach(([point, count]) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(`${point}: ${count}`, margin, yPosition);
        yPosition += 6;

        // Adicionar legenda se existir para este projeto
        if (legends && legends[point]) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(legends[point], margin + 5, yPosition);
          yPosition += 5;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        }
      });

      // Rodapé
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const footer1 = 'Relatório gerado automaticamente pelo sistema de Análise de Planilhas';
      const footer1Width = doc.getTextWidth(footer1);
      doc.text(footer1, (pageWidth - footer1Width) / 2, footerY);
      
      const footer2 = 'APLICATIVO DESENVOLVIDO - HLAS TECH TODOS OS DIREITOS RESERVADOS ®';
      const footer2Width = doc.getTextWidth(footer2);
      doc.text(footer2, (pageWidth - footer2Width) / 2, footerY + 4);

      // Gerar o PDF como blob
      const pdfBlob = doc.output('blob');
      
      // Criar URL temporária
      const url = URL.createObjectURL(pdfBlob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      const fileName = viewingMonth 
        ? `relatorio-${projectId}-${viewingMonth.displayName.replace(/\s+/g, '-')}.pdf`
        : `relatorio-${projectId}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      URL.revokeObjectURL(url);

      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isReadOnly = viewingMonth !== null;
  const isViewer = currentUser?.role === 'viewer';

  // Determinar qual conjunto de legendas usar
  const currentLegends = isCampoLargo ? campoLargoLegends : (isUmburanas ? umburanasLegends : (isGentioDoOuro ? gentioDoOuroLegends : null));

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para seleção
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FileSpreadsheet className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {projectName}
              </h1>
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
              CONTRATO: CONSCLWPTT.DPS.22.1982
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {isGentioDoOuro 
                ? 'Faça upload da sua planilha para análise automática dos 5 roteiros'
                : 'Faça upload da sua planilha para análise automática de horas, quilômetros e contagem de pontos'
              }
            </p>
          </div>
        </div>

        {/* Banner de Modo Somente Leitura */}
        {isReadOnly && (
          <Card className="mb-6 border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Modo Somente Leitura
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Visualizando: {viewingMonth.displayName} (salvo em {formatDate(viewingMonth.savedAt)})
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseViewMonth}
                  className="border-amber-500 text-amber-700 hover:bg-amber-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banner de Visualizador */}
        {isViewer && (
          <Card className="mb-6 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Modo Visualizador
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Você tem acesso apenas para visualização. Upload, salvar e exportar estão desabilitados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meses Salvos */}
        {savedMonths.length > 0 && (
          <Card className="mb-6 border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Archive className="w-5 h-5 text-purple-600" />
                Meses Arquivados
              </CardTitle>
              <CardDescription>Clique em um mês para visualizar os dados salvos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedMonths.map((month) => (
                  <div
                    key={month.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      viewingMonth?.id === month.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1" onClick={() => handleViewMonth(month)}>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {month.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Salvo em {formatDate(month.savedAt)}
                        </p>
                      </div>
                      {!isViewer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMonth(month.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs" onClick={() => handleViewMonth(month)}>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Horas:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {month.data.totalHours.toFixed(2)}h
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">KM:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {month.data.totalKilometers.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Período de Análise - OCULTO PARA VISUALIZADORES */}
        {!isReadOnly && !isViewer && (
          <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
                Período de Análise
              </CardTitle>
              <CardDescription>Defina o período para análise dos dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data de Início
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data de Fim
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">Período selecionado:</span> {formatDisplayDate(startDate)} até {formatDisplayDate(endDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Area - OCULTO PARA VISUALIZADORES */}
        {!isReadOnly && !isViewer && (
          <Card className="mb-8 border-2 border-dashed hover:border-blue-500 transition-colors duration-300">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {isProcessing ? 'Processando...' : 'Clique para fazer upload'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Formatos aceitos: Excel (.xlsx, .xls) ou CSV
                  </p>
                </div>
                <Button 
                  type="button" 
                  disabled={isProcessing}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Botões de Ação - OCULTOS PARA VISUALIZADORES */}
            {!isViewer && (
              <div className="flex flex-wrap gap-3 justify-end">
                {!isReadOnly && (
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Mês
                  </Button>
                )}
                <Button
                  onClick={handleExportPDF}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            )}

            {isGentioDoOuro ? (
              // Layout especial para Gentio do Ouro
              <>
                {/* Summary Cards - Duração e KM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Clock className="w-5 h-5" />
                        Duração de Horas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {result.totalHours.toFixed(2)}h
                      </p>
                      <p className="text-sm text-blue-100 mt-2">
                        Soma total de todos os roteiros
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <MapPin className="w-5 h-5" />
                        KM Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {result.totalKilometers.toFixed(2)} km
                      </p>
                      <p className="text-sm text-purple-100 mt-2">
                        Soma total de todos os roteiros
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Roteiros - 5 botões */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Informe o Roteiro</CardTitle>
                    <CardDescription>Contagem de ocorrências por roteiro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                      {[1, 2, 3, 4, 5].map((roteiro) => {
                        const count = result.pointCounts[`ROTEIRO ${roteiro}`] || 0;
                        const legend = gentioDoOuroLegends[`ROTEIRO ${roteiro}`];
                        return (
                          <div
                            key={roteiro}
                            className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border-2 border-green-300 dark:border-green-700 hover:shadow-lg transition-all duration-200"
                          >
                            <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 mb-2 text-center">
                              ROTEIRO {roteiro}
                            </p>
                            <p className="text-3xl sm:text-4xl font-bold text-green-900 dark:text-green-100 text-center">
                              {count}
                            </p>
                            {legend && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center uppercase">
                                {legend}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // Layout padrão para outros projetos
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Clock className="w-5 h-5" />
                        Total de Horas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {result.totalHours.toFixed(2)}h
                      </p>
                      <p className="text-sm text-blue-100 mt-2">
                        {(result.totalHours / 24).toFixed(1)} dias
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <MapPin className="w-5 h-5" />
                        Total de KM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {result.totalKilometers.toFixed(2)} km
                      </p>
                      <p className="text-sm text-purple-100 mt-2">
                        Quilômetros rodados
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <TrendingUp className="w-5 h-5" />
                        Total de Pontos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {Object.values(result.pointCounts).reduce((a, b) => a + b, 0)}
                      </p>
                      <p className="text-sm text-green-100 mt-2">
                        Pontos identificados
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Point Counts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Contagem por Ponto</CardTitle>
                    <CardDescription>Distribuição individual de cada ponto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(result.pointCounts).map(([point, count]) => (
                        <div key={point} className="space-y-1">
                          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-blue-300 dark:border-blue-700 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white uppercase">
                                {point}
                              </p>
                              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {count}
                              </p>
                            </div>
                          </div>
                          {currentLegends && currentLegends[point] && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pl-4 uppercase">
                              {currentLegends[point]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !isProcessing && (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400">
                Nenhuma análise realizada ainda
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {isViewer 
                  ? 'Aguarde um administrador fazer upload de uma planilha ou clique em um mês arquivado'
                  : 'Faça upload de uma planilha para começar ou clique em um mês arquivado'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Salvar Mês */}
        {showSaveDialog && !isViewer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-green-600" />
                  Salvar Mês
                </CardTitle>
                <CardDescription>
                  Digite um nome para identificar este mês (ex: "Janeiro 2024", "Fevereiro 2024")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="month-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Mês
                  </label>
                  <input
                    id="month-name"
                    type="text"
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    placeholder="Ex: Janeiro 2024"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setMonthName('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveMonth}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rodapé */}
        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            APLICATIVO DESENVOLVIDO - HLAS TECH TODOS OS DIREITOS RESERVADOS ®
          </p>
        </footer>
      </div>
    </div>
  );
}
