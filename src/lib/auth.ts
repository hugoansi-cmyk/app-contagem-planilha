// Sistema de autenticação e gerenciamento de usuários

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: Omit<User, 'password'>;
}

const USERS_KEY = 'system-users';
const CURRENT_USER_KEY = 'current-user';

// Inicializar com usuários padrão
const initializeDefaultUsers = (): void => {
  const users = getAllUsers();
  if (users.length === 0) {
    // Criar usuários padrão se não existir NENHUM usuário
    const defaultUsers: User[] = [
      {
        id: 'admin-default',
        username: 'admin',
        password: 'abc123!@', // Em produção, usar hash
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cliente-default',
        username: 'cliente',
        password: 'cliente123', // Em produção, usar hash
        role: 'viewer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gestor-default',
        username: 'gestor',
        password: 'gestor123', // Em produção, usar hash
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'operador-default',
        username: 'operador',
        password: 'operador123', // Em produção, usar hash
        role: 'viewer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'supervisor-default',
        username: 'supervisor',
        password: 'supervisor123', // Em produção, usar hash
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'analista-default',
        username: 'analista',
        password: 'analista123', // Em produção, usar hash
        role: 'viewer',
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  // Se já existem usuários, não fazer nada - manter todos os usuários criados
};

// Obter todos os usuários
export const getAllUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
  return [];
};

// Criar novo usuário
export const createUser = (
  username: string,
  password: string,
  role: 'admin' | 'viewer'
): AuthResult => {
  try {
    const users = getAllUsers();
    
    // Verificar se usuário já existe
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return {
        success: false,
        message: 'Usuário já existe',
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password, // Em produção, usar hash
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return {
      success: true,
      message: 'Usuário criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      success: false,
      message: 'Erro ao criar usuário',
    };
  }
};

// Autenticar usuário
export const authenticateUser = (
  username: string,
  password: string
): AuthResult => {
  try {
    // Inicializar usuários padrão se necessário
    initializeDefaultUsers();
    
    const users = getAllUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      return {
        success: true,
        user: userWithoutPassword,
      };
    }

    return {
      success: false,
      message: 'Usuário ou senha incorretos',
    };
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    return {
      success: false,
      message: 'Erro ao autenticar',
    };
  }
};

// Obter usuário atual
export const getCurrentUser = (): Omit<User, 'password'> | null => {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
  }
  return null;
};

// Verificar se usuário está autenticado
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Verificar se usuário é admin
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Logout
export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Deletar usuário
export const deleteUser = (userId: string): AuthResult => {
  try {
    const users = getAllUsers();
    const currentUser = getCurrentUser();
    
    // Não permitir deletar a si mesmo
    if (currentUser?.id === userId) {
      return {
        success: false,
        message: 'Você não pode deletar seu próprio usuário',
      };
    }

    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));

    return {
      success: true,
      message: 'Usuário deletado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return {
      success: false,
      message: 'Erro ao deletar usuário',
    };
  }
};
