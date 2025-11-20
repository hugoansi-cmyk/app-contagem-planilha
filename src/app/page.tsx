'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Building2, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, isAdmin } from '@/lib/auth';
import { toast } from 'sonner';

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const projects = [
    { id: 'campo-largo', name: 'ENGIE - CAMPO LARGO' },
    { id: 'umburanas', name: 'ENGIE - UMBURANAS' },
    { id: 'gentio-do-ouro', name: 'ENGIE - GENTIO DO OURO' }
  ];

  const handleProjectSelect = (value: string) => {
    setSelectedProject(value);
  };

  const handleContinue = () => {
    if (selectedProject) {
      router.push(`/projeto/${selectedProject}`);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    router.push('/login');
  };

  const handleControlPanel = () => {
    router.push('/control-panel');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        {/* Header com info do usuário */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              currentUser.role === 'admin' 
                ? 'bg-purple-100 dark:bg-purple-900/40' 
                : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              {currentUser.role === 'admin' ? (
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.role === 'admin' ? 'Administrador' : 'Visualizador'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin() && (
              <Button
                onClick={handleControlPanel}
                variant="outline"
                size="sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Painel de Controle
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSpreadsheet className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Análise de Planilhas
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Selecione o projeto para começar a análise de planilhas
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Project Selection Card */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Building2 className="w-6 h-6 text-blue-600" />
                Selecione o Projeto
              </CardTitle>
              <CardDescription>
                Escolha o projeto ENGIE para realizar a análise de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Projeto
                </label>
                <Select value={selectedProject} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um projeto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!selectedProject}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Sobre a análise
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cada projeto possui sua própria página de análise com cálculo automático de horas, 
                    quilômetros rodados e contagem de pontos específicos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
