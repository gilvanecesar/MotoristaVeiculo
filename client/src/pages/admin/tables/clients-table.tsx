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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ClientsTable() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    documentType: "CNPJ",
    documentNumber: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipcode: "",
    logoUrl: ""
  });

  // Buscar clientes
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return await res.json();
    }
  });

  // Mutação para deletar cliente
  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("DELETE", `/api/clients/${clientId}`);
      if (!res.ok) throw new Error("Falha ao deletar cliente");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Cliente deletado",
        description: "O cliente foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setSelectedClient(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async (client: any) => {
      const res = await apiRequest("PUT", `/api/clients/${client.id}`, client);
      if (!res.ok) throw new Error("Falha ao atualizar cliente");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setSelectedClient(null);
      setEditedClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para criar cliente
  const createMutation = useMutation({
    mutationFn: async (client: any) => {
      const res = await apiRequest("POST", "/api/clients", client);
      if (!res.ok) throw new Error("Falha ao criar cliente");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado",
        description: "O novo cliente foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreating(false);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        documentType: "CNPJ",
        documentNumber: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipcode: "",
        logoUrl: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEditClick = (client: any) => {
    setSelectedClient(client);
    setEditedClient(client);
  };

  const handleDeleteClick = (client: any) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.id);
    }
  };

  const handleSaveEdit = () => {
    if (editedClient) {
      updateMutation.mutate(editedClient);
    }
  };

  const handleCreateClient = () => {
    createMutation.mutate(newClient);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Clientes Cadastrados</h3>
        <Button onClick={() => setIsCreating(true)}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client: any) => (
              <TableRow key={client.id}>
                <TableCell>{client.id}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.documentNumber}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.city}/{client.state}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(client)}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(client)}
                    >
                      <Icons.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para editar */}
      <Dialog open={Boolean(editedClient)} onOpenChange={(open) => !open && setEditedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Edite as informações do cliente
            </DialogDescription>
          </DialogHeader>
          
          {editedClient && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editedClient.name}
                  onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editedClient.email}
                  onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editedClient.phone}
                  onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={editedClient.whatsapp || ""}
                  onChange={(e) => setEditedClient({...editedClient, whatsapp: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-documentType">Tipo de Documento</Label>
                <Select 
                  value={editedClient.documentType} 
                  onValueChange={(value) => setEditedClient({...editedClient, documentType: value})}
                >
                  <SelectTrigger id="edit-documentType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-documentNumber">Número do Documento</Label>
                <Input
                  id="edit-documentNumber"
                  value={editedClient.documentNumber}
                  onChange={(e) => setEditedClient({...editedClient, documentNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-street">Rua</Label>
                <Input
                  id="edit-street"
                  value={editedClient.street}
                  onChange={(e) => setEditedClient({...editedClient, street: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-number">Número</Label>
                <Input
                  id="edit-number"
                  value={editedClient.number}
                  onChange={(e) => setEditedClient({...editedClient, number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-complement">Complemento</Label>
                <Input
                  id="edit-complement"
                  value={editedClient.complement || ""}
                  onChange={(e) => setEditedClient({...editedClient, complement: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-neighborhood">Bairro</Label>
                <Input
                  id="edit-neighborhood"
                  value={editedClient.neighborhood}
                  onChange={(e) => setEditedClient({...editedClient, neighborhood: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  value={editedClient.city}
                  onChange={(e) => setEditedClient({...editedClient, city: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado</Label>
                <Input
                  id="edit-state"
                  value={editedClient.state}
                  onChange={(e) => setEditedClient({...editedClient, state: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-zipcode">CEP</Label>
                <Input
                  id="edit-zipcode"
                  value={editedClient.zipcode}
                  onChange={(e) => setEditedClient({...editedClient, zipcode: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-logoUrl">URL do Logo</Label>
                <Input
                  id="edit-logoUrl"
                  value={editedClient.logoUrl || ""}
                  onChange={(e) => setEditedClient({...editedClient, logoUrl: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditedClient(null)}>Cancelar</Button>
            <Button 
              onClick={handleSaveEdit}
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

      {/* Dialog para criar novo cliente */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os campos para adicionar um novo cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-phone">Telefone</Label>
              <Input
                id="new-phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-whatsapp">WhatsApp</Label>
              <Input
                id="new-whatsapp"
                value={newClient.whatsapp}
                onChange={(e) => setNewClient({...newClient, whatsapp: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-documentType">Tipo de Documento</Label>
              <Select 
                value={newClient.documentType} 
                onValueChange={(value) => setNewClient({...newClient, documentType: value})}
              >
                <SelectTrigger id="new-documentType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-documentNumber">Número do Documento</Label>
              <Input
                id="new-documentNumber"
                value={newClient.documentNumber}
                onChange={(e) => setNewClient({...newClient, documentNumber: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-street">Rua</Label>
              <Input
                id="new-street"
                value={newClient.street}
                onChange={(e) => setNewClient({...newClient, street: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-number">Número</Label>
              <Input
                id="new-number"
                value={newClient.number}
                onChange={(e) => setNewClient({...newClient, number: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-complement">Complemento</Label>
              <Input
                id="new-complement"
                value={newClient.complement}
                onChange={(e) => setNewClient({...newClient, complement: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-neighborhood">Bairro</Label>
              <Input
                id="new-neighborhood"
                value={newClient.neighborhood}
                onChange={(e) => setNewClient({...newClient, neighborhood: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-city">Cidade</Label>
              <Input
                id="new-city"
                value={newClient.city}
                onChange={(e) => setNewClient({...newClient, city: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-state">Estado</Label>
              <Input
                id="new-state"
                value={newClient.state}
                onChange={(e) => setNewClient({...newClient, state: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-zipcode">CEP</Label>
              <Input
                id="new-zipcode"
                value={newClient.zipcode}
                onChange={(e) => setNewClient({...newClient, zipcode: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-logoUrl">URL do Logo</Label>
              <Input
                id="new-logoUrl"
                value={newClient.logoUrl}
                onChange={(e) => setNewClient({...newClient, logoUrl: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateClient}
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

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente {selectedClient?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}