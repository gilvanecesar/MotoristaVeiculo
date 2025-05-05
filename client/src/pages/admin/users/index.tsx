import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, Users } from "lucide-react";

// Utils
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

import { USER_TYPES } from "@shared/schema";

// Função para retornar o tipo de cadastro do usuário com estilo visual aprimorado
const getRegistrationType = (user: any) => {
  // Primeiro verificamos o tipo de perfil definido
  if (user.profileType === USER_TYPES.DRIVER) {
    return { 
      type: "Motorista", 
      color: "#16a34a", // green-600
      bgColor: "#dcfce7", // green-100
      textColor: "#166534" // green-800
    };
  } else if (user.profileType === USER_TYPES.SHIPPER) {
    return { 
      type: "Embarcador", 
      color: "#2563eb", // blue-600
      bgColor: "#dbeafe", // blue-100
      textColor: "#1e40af" // blue-800
    };
  } else if (user.profileType === USER_TYPES.AGENT) {
    return { 
      type: "Transportadora", 
      color: "#ea580c", // orange-600
      bgColor: "#ffedd5", // orange-100
      textColor: "#9a3412" // orange-800
    };
  } else if (user.profileType === USER_TYPES.ADMIN) {
    return { 
      type: "Administrador", 
      color: "#7c3aed", // violet-600
      bgColor: "#ede9fe", // violet-100
      textColor: "#5b21b6" // violet-800
    };
  } else {
    // Se o perfil não estiver definido, verificamos se tem cliente ou motorista associado
    if (user.driverId) {
      return { 
        type: "Motorista (sem perfil definido)", 
        color: "#16a34a", // green-600
        bgColor: "#dcfce7", // green-100
        textColor: "#166534" // green-800
      };
    } else if (user.clientId) {
      return { 
        type: "Cliente (sem perfil definido)", 
        color: "#2563eb", // blue-600
        bgColor: "#dbeafe", // blue-100
        textColor: "#1e40af" // blue-800
      };
    } else {
      return { 
        type: "Sem cadastro específico", 
        color: "#6b7280", // gray-500
        bgColor: "#f3f4f6", // gray-100
        textColor: "#374151" // gray-700
      };
    }
  }
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  
  // Estado para controlar o diálogo de alteração de tipo de perfil
  const [profileTypeDialogOpen, setProfileTypeDialogOpen] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState("");
  
  // Estado para controlar o diálogo de redefinição de senha
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Buscar lista de usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      return await res.json();
    },
    enabled: !!user && user.profileType === "admin"
  });

  // Mutation para alternar acesso (bloquear/desbloquear)
  const toggleAccessMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: number, blocked: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/toggle-access`, { blocked });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao alterar acesso do usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Acesso alterado",
        description: "O acesso do usuário foi alterado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para enviar e-mail de cobrança
  const sendPaymentReminderMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number, message: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/send-payment-reminder`, { message });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao enviar e-mail de cobrança");
      }
      return await res.json();
    },
    onSuccess: () => {
      setReminderDialogOpen(false);
      setReminderMessage("");
      toast({
        title: "E-mail enviado",
        description: "O e-mail de cobrança foi enviado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar o tipo de perfil do usuário
  const updateProfileTypeMutation = useMutation({
    mutationFn: async ({ userId, profileType }: { userId: number, profileType: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/update-profile-type`, { profileType });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao atualizar tipo de perfil");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Perfil atualizado",
        description: "O tipo de perfil do usuário foi atualizado com sucesso",
      });
      setProfileTypeDialogOpen(false);
      setSelectedProfileType("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filtragem de usuários com base no termo de pesquisa
  const filteredUsers = searchTerm.trim() === "" 
    ? users 
    : users?.filter((user: any) => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profileType.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Verifica se o usuário é administrador
  if (user?.profileType !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Esta página só pode ser acessada por administradores.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Voltar para o início</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleToggleAccess = (userId: number, currentStatus: boolean | undefined) => {
    toggleAccessMutation.mutate({
      userId,
      blocked: !currentStatus || false
    });
  };

  const openReminderDialog = (user: any) => {
    setSelectedUser(user);
    setReminderDialogOpen(true);
  };

  const handleSendReminder = () => {
    if (selectedUser) {
      sendPaymentReminderMutation.mutate({
        userId: selectedUser.id,
        message: reminderMessage
      });
    }
  };
  
  // Abrir o diálogo de alteração de tipo de perfil
  const openProfileTypeDialog = (user: any) => {
    setSelectedUser(user);
    setSelectedProfileType(user.profileType || "");
    setProfileTypeDialogOpen(true);
  };
  
  // Atualizar o tipo de perfil do usuário
  const handleUpdateProfileType = () => {
    if (selectedUser && selectedProfileType) {
      updateProfileTypeMutation.mutate({
        userId: selectedUser.id,
        profileType: selectedProfileType
      });
    }
  };
  
  // Abrir o diálogo de redefinição de senha
  const openResetPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setNewPassword(""); // Limpa a senha anterior
    setResetPasswordDialogOpen(true);
  };
  
  // Mutation para redefinir a senha do usuário
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number, newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao redefinir senha");
      }
      return await res.json();
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      toast({
        title: "Senha redefinida",
        description: "A senha do usuário foi redefinida com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Funcao para lidar com a redefinição de senha
  const handleResetPassword = () => {
    if (selectedUser && newPassword) {
      resetPasswordMutation.mutate({
        userId: selectedUser.id,
        newPassword
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-full md:w-64"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableCaption>Lista de usuários registrados no sistema</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Tipo de Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Tipo de Cadastro</TableHead>
                <TableHead className="hidden md:table-cell">Registro</TableHead>
                <TableHead className="hidden md:table-cell">Último Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground md:hidden">{user.email}</div>
                      {user.profileType && (
                        <div className="flex flex-col md:hidden gap-1 mt-1">
                          <div className="text-xs text-muted-foreground capitalize">{user.profileType}</div>
                          <Badge 
                            variant="outline" 
                            className="w-fit" 
                            style={{ 
                              color: getRegistrationType(user).textColor,
                              backgroundColor: getRegistrationType(user).bgColor,
                              borderColor: getRegistrationType(user).color
                            }}
                          >
                            {getRegistrationType(user).type}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{user.profileType}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge 
                        variant="outline" 
                        className="w-fit" 
                        style={{ 
                          color: getRegistrationType(user).textColor,
                          backgroundColor: getRegistrationType(user).bgColor,
                          borderColor: getRegistrationType(user).color
                        }}
                      >
                        {getRegistrationType(user).type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.lastLogin ? formatDate(user.lastLogin) : "Nunca"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isActive ? "default" : "destructive"}
                        className="whitespace-nowrap"
                      >
                        {user.isActive ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Switch 
                          checked={user.isActive} 
                          onCheckedChange={() => handleToggleAccess(user.id, user.isActive)}
                          aria-label="Alternar acesso"
                        />
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openReminderDialog(user)}
                            className="whitespace-nowrap"
                          >
                            Enviar Cobrança
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openProfileTypeDialog(user)}
                            className="whitespace-nowrap"
                          >
                            Alterar Perfil
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openResetPasswordDialog(user)}
                            className="whitespace-nowrap"
                          >
                            Redefinir Senha
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    {searchTerm.trim() !== ""
                      ? "Nenhum usuário encontrado com este termo de busca."
                      : "Nenhum usuário encontrado no sistema."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de e-mail de cobrança */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar e-mail de cobrança</DialogTitle>
            <DialogDescription>
              Envie um lembrete de pagamento para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail do destinatário</Label>
              <Input id="email" value={selectedUser?.email} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Insira uma mensagem personalizada para o e-mail de cobrança..."
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSendReminder} 
              disabled={sendPaymentReminderMutation.isPending}
            >
              {sendPaymentReminderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar E-mail"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de alteração de tipo de perfil */}
      <Dialog open={profileTypeDialogOpen} onOpenChange={setProfileTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar tipo de perfil</DialogTitle>
            <DialogDescription>
              Altere o tipo de perfil de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profileType">Tipo de perfil</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div 
                  className={`p-4 border rounded-lg flex flex-col items-center cursor-pointer transition-all ${
                    selectedProfileType === USER_TYPES.DRIVER 
                      ? "border-green-500 bg-green-50 dark:bg-green-950" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedProfileType(USER_TYPES.DRIVER)}
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span className="font-medium">Motorista</span>
                </div>
                <div 
                  className={`p-4 border rounded-lg flex flex-col items-center cursor-pointer transition-all ${
                    selectedProfileType === USER_TYPES.SHIPPER 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedProfileType(USER_TYPES.SHIPPER)}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span className="font-medium">Embarcador</span>
                </div>
                <div 
                  className={`p-4 border rounded-lg flex flex-col items-center cursor-pointer transition-all ${
                    selectedProfileType === USER_TYPES.AGENT 
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedProfileType(USER_TYPES.AGENT)}
                >
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span className="font-medium">Transportadora</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileTypeDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleUpdateProfileType} 
              disabled={updateProfileTypeMutation.isPending || !selectedProfileType}
            >
              {updateProfileTypeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Perfil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de redefinição de senha */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="text"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}