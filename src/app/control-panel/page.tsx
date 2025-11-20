'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, Shield, Eye, LogOut, ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCurrentUser, logout, getAllUsers, createUser, deleteUser, User } from '@/lib/auth';

export default function ControlPanelPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadUsers();
  }, [router]);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  // Gerador de senha aleatória segura
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Especial
    
    // Preencher o resto
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Gerador de nome de usuário
  const generateUsername = () => {
    const adjectives = ['rapido', 'forte', 'inteligente', 'veloz', 'astuto', 'bravo', 'sabio', 'agil'];
    const nouns = ['leao', 'aguia', 'tigre', 'lobo', 'falcao', 'urso', 'pantera', 'dragao'];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}_${noun}${number}`;
  };

  const handleGenerateCredentials = () => {
    const username = generateUsername();
    const password = generatePassword();
    
    setNewUsername(username);
    setNewPassword(password);
    
    toast.success('Credenciais geradas com sucesso!');
  };

  const handleCopyPassword = async () => {
    if (!newPassword) {
      toast.error('Nenhuma senha para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(newPassword);
      setCopiedPassword(true);
      toast.success('Senha copiada para a área de transferência!');
      
      setTimeout(() => {
        setCopiedPassword(false);
      }, 2000);
    } catch (err) {
      toast.error('Erro ao copiar senha');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    const result = createUser(newUsername, newPassword, newRole);
    
    if (result.success) {
      toast.success('Usuário criado com sucesso!');
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      loadUsers();
    } else {
      toast.error(result.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const result = deleteUser(userId);
      
      if (result.success) {
        toast.success('Usuário excluído com sucesso!');
        loadUsers();
      } else {
        toast.error(result.message || 'Erro ao excluir usuário');
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    router.push('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Painel de Controle
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gerenciamento de usuários e acessos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Criar Novo Usuário */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Criar Novo Usuário
              </CardTitle>
              <CardDescription>
                Adicione novos usuários ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Botão Gerador de Credenciais */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gerador Automático
                    </p>
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Gere credenciais seguras automaticamente
                  </p>
                  <Button
                    type="button"
                    onClick={handleGenerateCredentials}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Gerar Usuário e Senha
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite ou gere automaticamente"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Digite ou gere automaticamente"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyPassword}
                      variant="outline"
                      size="icon"
                      disabled={!newPassword}
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {newPassword && (
                    <p className="text-xs text-gray-500">
                      Clique no ícone para copiar a senha
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Acesso</Label>
                  <Select value={newRole} onValueChange={(value: 'admin' | 'viewer') => setNewRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Visualizador (Somente Leitura)
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Administrador (Acesso Total)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Usuários Cadastrados
              </CardTitle>
              <CardDescription>
                {users.length} usuário(s) no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nenhum usuário cadastrado
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900/40' 
                            : 'bg-blue-100 dark:bg-blue-900/40'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-gray-500">
                            {user.role === 'admin' ? 'Administrador' : 'Visualizador'}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Administradores
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Têm acesso total ao sistema, incluindo criação de usuários e gerenciamento de projetos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Visualizadores
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Podem apenas visualizar dados dos projetos, sem permissão para editar ou criar
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
