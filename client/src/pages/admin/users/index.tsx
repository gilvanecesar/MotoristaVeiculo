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

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

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
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
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
                      {user.profileType && <div className="text-xs text-muted-foreground md:hidden capitalize">{user.profileType}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{user.profileType}</TableCell>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openReminderDialog(user)}
                          className="whitespace-nowrap"
                        >
                          Enviar Cobrança
                        </Button>
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
    </div>
  );
}