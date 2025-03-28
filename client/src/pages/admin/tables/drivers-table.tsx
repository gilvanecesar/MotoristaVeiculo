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
import { format } from "date-fns";

export default function DriversTable() {
  const { toast } = useToast();
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedDriver, setEditedDriver] = useState<any>(null);
  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    cnh: "",
    cnhCategory: "B",
    whatsapp: "",
    birthdate: "",
    cnhExpiration: "",
    cnhIssueDate: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipcode: "",
    complement: ""
  });

  // Buscar motoristas
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/drivers");
      if (!res.ok) throw new Error("Falha ao carregar motoristas");
      return await res.json();
    }
  });

  // Mutação para deletar motorista
  const deleteMutation = useMutation({
    mutationFn: async (driverId: number) => {
      const res = await apiRequest("DELETE", `/api/drivers/${driverId}`);
      if (!res.ok) throw new Error("Falha ao deletar motorista");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Motorista deletado",
        description: "O motorista foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setSelectedDriver(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar motorista",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar motorista
  const updateMutation = useMutation({
    mutationFn: async (driver: any) => {
      const res = await apiRequest("PUT", `/api/drivers/${driver.id}`, driver);
      if (!res.ok) throw new Error("Falha ao atualizar motorista");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Motorista atualizado",
        description: "Os dados do motorista foram atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setSelectedDriver(null);
      setEditedDriver(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar motorista",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para criar motorista
  const createMutation = useMutation({
    mutationFn: async (driver: any) => {
      const res = await apiRequest("POST", "/api/drivers", driver);
      if (!res.ok) throw new Error("Falha ao criar motorista");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Motorista criado",
        description: "O novo motorista foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setIsCreating(false);
      setNewDriver({
        name: "",
        email: "",
        cpf: "",
        phone: "",
        cnh: "",
        cnhCategory: "B",
        whatsapp: "",
        birthdate: "",
        cnhExpiration: "",
        cnhIssueDate: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        zipcode: "",
        complement: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar motorista",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEditClick = (driver: any) => {
    setSelectedDriver(driver);
    setEditedDriver(driver);
  };

  const handleDeleteClick = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDriver) {
      deleteMutation.mutate(selectedDriver.id);
    }
  };

  const handleSaveEdit = () => {
    if (editedDriver) {
      updateMutation.mutate(editedDriver);
    }
  };

  const handleCreateDriver = () => {
    createMutation.mutate(newDriver);
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
        <h3 className="text-lg font-medium">Motoristas Cadastrados</h3>
        <Button onClick={() => setIsCreating(true)}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Novo Motorista
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CNH</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver: any) => (
              <TableRow key={driver.id}>
                <TableCell>{driver.id}</TableCell>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.cpf}</TableCell>
                <TableCell>{driver.cnh}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(driver)}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(driver)}
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
      <Dialog open={Boolean(editedDriver)} onOpenChange={(open) => !open && setEditedDriver(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Motorista</DialogTitle>
            <DialogDescription>
              Edite as informações do motorista
            </DialogDescription>
          </DialogHeader>
          
          {editedDriver && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editedDriver.name}
                  onChange={(e) => setEditedDriver({...editedDriver, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editedDriver.email}
                  onChange={(e) => setEditedDriver({...editedDriver, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editedDriver.cpf}
                  onChange={(e) => setEditedDriver({...editedDriver, cpf: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editedDriver.phone}
                  onChange={(e) => setEditedDriver({...editedDriver, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={editedDriver.whatsapp || ""}
                  onChange={(e) => setEditedDriver({...editedDriver, whatsapp: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-birthdate">Data de Nascimento</Label>
                <Input
                  id="edit-birthdate"
                  type="date"
                  value={editedDriver.birthdate}
                  onChange={(e) => setEditedDriver({...editedDriver, birthdate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnh">CNH</Label>
                <Input
                  id="edit-cnh"
                  value={editedDriver.cnh}
                  onChange={(e) => setEditedDriver({...editedDriver, cnh: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnhCategory">Categoria CNH</Label>
                <Select 
                  value={editedDriver.cnhCategory} 
                  onValueChange={(value) => setEditedDriver({...editedDriver, cnhCategory: value})}
                >
                  <SelectTrigger id="edit-cnhCategory">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AD">AD</SelectItem>
                    <SelectItem value="AE">AE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnhExpiration">Validade CNH</Label>
                <Input
                  id="edit-cnhExpiration"
                  type="date"
                  value={editedDriver.cnhExpiration}
                  onChange={(e) => setEditedDriver({...editedDriver, cnhExpiration: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnhIssueDate">Data de Emissão CNH</Label>
                <Input
                  id="edit-cnhIssueDate"
                  type="date"
                  value={editedDriver.cnhIssueDate}
                  onChange={(e) => setEditedDriver({...editedDriver, cnhIssueDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-street">Rua</Label>
                <Input
                  id="edit-street"
                  value={editedDriver.street}
                  onChange={(e) => setEditedDriver({...editedDriver, street: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-number">Número</Label>
                <Input
                  id="edit-number"
                  value={editedDriver.number}
                  onChange={(e) => setEditedDriver({...editedDriver, number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-complement">Complemento</Label>
                <Input
                  id="edit-complement"
                  value={editedDriver.complement || ""}
                  onChange={(e) => setEditedDriver({...editedDriver, complement: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-neighborhood">Bairro</Label>
                <Input
                  id="edit-neighborhood"
                  value={editedDriver.neighborhood}
                  onChange={(e) => setEditedDriver({...editedDriver, neighborhood: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  value={editedDriver.city}
                  onChange={(e) => setEditedDriver({...editedDriver, city: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado</Label>
                <Input
                  id="edit-state"
                  value={editedDriver.state}
                  onChange={(e) => setEditedDriver({...editedDriver, state: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-zipcode">CEP</Label>
                <Input
                  id="edit-zipcode"
                  value={editedDriver.zipcode}
                  onChange={(e) => setEditedDriver({...editedDriver, zipcode: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditedDriver(null)}>Cancelar</Button>
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

      {/* Dialog para criar novo motorista */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Motorista</DialogTitle>
            <DialogDescription>
              Preencha os campos para adicionar um novo motorista
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                value={newDriver.name}
                onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                value={newDriver.email}
                onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cpf">CPF</Label>
              <Input
                id="new-cpf"
                value={newDriver.cpf}
                onChange={(e) => setNewDriver({...newDriver, cpf: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-phone">Telefone</Label>
              <Input
                id="new-phone"
                value={newDriver.phone}
                onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-whatsapp">WhatsApp</Label>
              <Input
                id="new-whatsapp"
                value={newDriver.whatsapp}
                onChange={(e) => setNewDriver({...newDriver, whatsapp: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-birthdate">Data de Nascimento</Label>
              <Input
                id="new-birthdate"
                type="date"
                value={newDriver.birthdate}
                onChange={(e) => setNewDriver({...newDriver, birthdate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cnh">CNH</Label>
              <Input
                id="new-cnh"
                value={newDriver.cnh}
                onChange={(e) => setNewDriver({...newDriver, cnh: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cnhCategory">Categoria CNH</Label>
              <Select 
                value={newDriver.cnhCategory} 
                onValueChange={(value) => setNewDriver({...newDriver, cnhCategory: value})}
              >
                <SelectTrigger id="new-cnhCategory">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AD">AD</SelectItem>
                  <SelectItem value="AE">AE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-cnhExpiration">Validade CNH</Label>
              <Input
                id="new-cnhExpiration"
                type="date"
                value={newDriver.cnhExpiration}
                onChange={(e) => setNewDriver({...newDriver, cnhExpiration: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cnhIssueDate">Data de Emissão CNH</Label>
              <Input
                id="new-cnhIssueDate"
                type="date"
                value={newDriver.cnhIssueDate}
                onChange={(e) => setNewDriver({...newDriver, cnhIssueDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-street">Rua</Label>
              <Input
                id="new-street"
                value={newDriver.street}
                onChange={(e) => setNewDriver({...newDriver, street: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-number">Número</Label>
              <Input
                id="new-number"
                value={newDriver.number}
                onChange={(e) => setNewDriver({...newDriver, number: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-complement">Complemento</Label>
              <Input
                id="new-complement"
                value={newDriver.complement}
                onChange={(e) => setNewDriver({...newDriver, complement: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-neighborhood">Bairro</Label>
              <Input
                id="new-neighborhood"
                value={newDriver.neighborhood}
                onChange={(e) => setNewDriver({...newDriver, neighborhood: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-city">Cidade</Label>
              <Input
                id="new-city"
                value={newDriver.city}
                onChange={(e) => setNewDriver({...newDriver, city: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-state">Estado</Label>
              <Input
                id="new-state"
                value={newDriver.state}
                onChange={(e) => setNewDriver({...newDriver, state: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-zipcode">CEP</Label>
              <Input
                id="new-zipcode"
                value={newDriver.zipcode}
                onChange={(e) => setNewDriver({...newDriver, zipcode: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateDriver}
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
              Tem certeza que deseja excluir o motorista {selectedDriver?.name}? Esta ação não pode ser desfeita.
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