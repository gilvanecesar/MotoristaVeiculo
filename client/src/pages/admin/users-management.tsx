import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { USER_TYPES } from "@shared/schema";
import { format } from "date-fns";

export default function UsersManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    profileType: USER_TYPES.SHIPPER
  });

  // Buscar usuários
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      return await res.json();
    }
  });

  // Mutação para deletar usuário
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Falha ao deletar usuário");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Usuário deletado",
        description: "O usuário foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar usuário
  const updateMutation = useMutation({
    mutationFn: async (user: any) => {
      const res = await apiRequest("PUT", `/api/admin/users/${user.id}`, user);
      if (!res.ok) throw new Error("Falha ao atualizar usuário");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para criar usuário
  const createMutation = useMutation({
    mutationFn: async (user: any) => {
      const res = await apiRequest("POST", "/api/admin/users", user);
      if (!res.ok) throw new Error("Falha ao criar usuário");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setNewUser({
        name: "",
        email: "",
        password: "",
        profileType: USER_TYPES.SHIPPER
      });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveUser = () => {
    if (selectedUser) {
      updateMutation.mutate(selectedUser);
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleCreateUser = () => {
    createMutation.mutate(newUser);
  };

  const getProfileTypeLabel = (type: string) => {
    switch (type) {
      case USER_TYPES.ADMIN: return "Administrador";
      case USER_TYPES.AGENT: return "Agente";
      case USER_TYPES.DRIVER: return "Motorista";
      case USER_TYPES.SHIPPER: return "Embarcador";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Erro ao carregar os dados: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <Button onClick={() => setIsCreating(true)}>
          <Icons.userPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Lista de todos os usuários registrados no sistema</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo de Perfil</TableHead>
              <TableHead>Verificado</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getProfileTypeLabel(user.profileType)}</TableCell>
                <TableCell>{user.isVerified ? "Sim" : "Não"}</TableCell>
                <TableCell>{format(new Date(user.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedUser(user);
                        handleDeleteUser();
                      }}
                    >
                      <Icons.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Dialog para editar usuário */}
        <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário selecionado
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input
                    id="name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profile-type" className="text-right">Tipo de Perfil</Label>
                  <Select 
                    value={selectedUser.profileType} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, profileType: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um tipo de perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={USER_TYPES.ADMIN}>Administrador</SelectItem>
                      <SelectItem value={USER_TYPES.AGENT}>Agente</SelectItem>
                      <SelectItem value={USER_TYPES.DRIVER}>Motorista</SelectItem>
                      <SelectItem value={USER_TYPES.SHIPPER}>Embarcador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Nova Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    onChange={(e) => setSelectedUser({...selectedUser, password: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
              <Button 
                onClick={handleSaveUser}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para criar novo usuário */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os campos para criar um novo usuário
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">Nome</Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-email" className="text-right">Email</Label>
                <Input
                  id="new-email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-profile-type" className="text-right">Tipo de Perfil</Label>
                <Select 
                  value={newUser.profileType} 
                  onValueChange={(value) => setNewUser({...newUser, profileType: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um tipo de perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={USER_TYPES.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={USER_TYPES.AGENT}>Agente</SelectItem>
                    <SelectItem value={USER_TYPES.DRIVER}>Motorista</SelectItem>
                    <SelectItem value={USER_TYPES.SHIPPER}>Embarcador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}