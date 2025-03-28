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
import { VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";

export default function VehiclesTable() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<any>(null);
  const [newVehicle, setNewVehicle] = useState({
    plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    renavam: "",
    driverId: "",
    vehicleType: Object.values(VEHICLE_TYPES)[0],
    bodyType: Object.values(BODY_TYPES)[0]
  });

  // Buscar veículos
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vehicles");
      if (!res.ok) throw new Error("Falha ao carregar veículos");
      return await res.json();
    }
  });

  // Buscar motoristas para o dropdown
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/drivers");
      if (!res.ok) throw new Error("Falha ao carregar motoristas");
      return await res.json();
    }
  });

  // Mutação para deletar veículo
  const deleteMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
      if (!res.ok) throw new Error("Falha ao deletar veículo");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Veículo deletado",
        description: "O veículo foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setSelectedVehicle(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar veículo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar veículo
  const updateMutation = useMutation({
    mutationFn: async (vehicle: any) => {
      const res = await apiRequest("PUT", `/api/vehicles/${vehicle.id}`, vehicle);
      if (!res.ok) throw new Error("Falha ao atualizar veículo");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Veículo atualizado",
        description: "Os dados do veículo foram atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setSelectedVehicle(null);
      setEditedVehicle(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar veículo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para criar veículo
  const createMutation = useMutation({
    mutationFn: async (vehicle: any) => {
      const vehicleData = {...vehicle, driverId: parseInt(vehicle.driverId)};
      const res = await apiRequest("POST", "/api/vehicles", vehicleData);
      if (!res.ok) throw new Error("Falha ao criar veículo");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Veículo criado",
        description: "O novo veículo foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsCreating(false);
      setNewVehicle({
        plate: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        renavam: "",
        driverId: "",
        vehicleType: Object.values(VEHICLE_TYPES)[0],
        bodyType: Object.values(BODY_TYPES)[0]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar veículo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEditClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setEditedVehicle(vehicle);
  };

  const handleDeleteClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedVehicle) {
      deleteMutation.mutate(selectedVehicle.id);
    }
  };

  const handleSaveEdit = () => {
    if (editedVehicle) {
      const vehicle = {...editedVehicle};
      if (typeof vehicle.driverId === "string") {
        vehicle.driverId = parseInt(vehicle.driverId);
      }
      updateMutation.mutate(vehicle);
    }
  };

  const handleCreateVehicle = () => {
    createMutation.mutate(newVehicle);
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      leve_todos: "Leve (Todos)",
      leve_fiorino: "Leve (Fiorino)",
      leve_toco: "Leve (Toco)",
      leve_vlc: "Leve (VLC)",
      medio_todos: "Médio (Todos)",
      medio_bitruck: "Médio (Bitruck)",
      medio_truck: "Médio (Truck)",
      pesado_todos: "Pesado (Todos)",
      pesado_bitrem: "Pesado (Bitrem)",
      pesado_carreta: "Pesado (Carreta)",
      pesado_carreta_ls: "Pesado (Carreta LS)",
      pesado_rodotrem: "Pesado (Rodotrem)",
      pesado_vanderleia: "Pesado (Vanderleia)"
    };
    return labels[type] || type;
  };

  const getBodyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bau: "Baú",
      graneleira: "Graneleira",
      basculante: "Basculante",
      plataforma: "Plataforma",
      tanque: "Tanque",
      frigorifica: "Frigorífica",
      porta_conteiner: "Porta Container",
      sider: "Sider",
      cacamba: "Caçamba",
      aberta: "Aberta",
      fechada: "Fechada"
    };
    return labels[type] || type;
  };

  if (isLoadingVehicles || isLoadingDrivers) {
    return (
      <div className="flex justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Veículos Cadastrados</h3>
        <Button onClick={() => setIsCreating(true)}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Marca/Modelo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Carroceria</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle: any) => {
              const driver = drivers.find((d: any) => d.id === vehicle.driverId);
              return (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.id}</TableCell>
                  <TableCell>{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                  <TableCell>{getVehicleTypeLabel(vehicle.vehicleType)}</TableCell>
                  <TableCell>{getBodyTypeLabel(vehicle.bodyType)}</TableCell>
                  <TableCell>{driver ? driver.name : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(vehicle)}
                      >
                        <Icons.edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(vehicle)}
                      >
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para editar */}
      <Dialog open={Boolean(editedVehicle)} onOpenChange={(open) => !open && setEditedVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>
              Edite as informações do veículo
            </DialogDescription>
          </DialogHeader>
          
          {editedVehicle && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plate">Placa</Label>
                <Input
                  id="edit-plate"
                  value={editedVehicle.plate}
                  onChange={(e) => setEditedVehicle({...editedVehicle, plate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-brand">Marca</Label>
                <Input
                  id="edit-brand"
                  value={editedVehicle.brand}
                  onChange={(e) => setEditedVehicle({...editedVehicle, brand: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  value={editedVehicle.model}
                  onChange={(e) => setEditedVehicle({...editedVehicle, model: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-year">Ano</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editedVehicle.year}
                  onChange={(e) => setEditedVehicle({...editedVehicle, year: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Cor</Label>
                <Input
                  id="edit-color"
                  value={editedVehicle.color}
                  onChange={(e) => setEditedVehicle({...editedVehicle, color: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-renavam">RENAVAM</Label>
                <Input
                  id="edit-renavam"
                  value={editedVehicle.renavam || ""}
                  onChange={(e) => setEditedVehicle({...editedVehicle, renavam: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vehicleType">Tipo de Veículo</Label>
                <Select 
                  value={editedVehicle.vehicleType} 
                  onValueChange={(value) => setEditedVehicle({...editedVehicle, vehicleType: value})}
                >
                  <SelectTrigger id="edit-vehicleType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {getVehicleTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bodyType">Tipo de Carroceria</Label>
                <Select 
                  value={editedVehicle.bodyType} 
                  onValueChange={(value) => setEditedVehicle({...editedVehicle, bodyType: value})}
                >
                  <SelectTrigger id="edit-bodyType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BODY_TYPES).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {getBodyTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-driverId">Motorista</Label>
                <Select 
                  value={String(editedVehicle.driverId)} 
                  onValueChange={(value) => setEditedVehicle({...editedVehicle, driverId: value})}
                >
                  <SelectTrigger id="edit-driverId">
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={String(driver.id)}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditedVehicle(null)}>Cancelar</Button>
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

      {/* Dialog para criar novo veículo */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Veículo</DialogTitle>
            <DialogDescription>
              Preencha os campos para adicionar um novo veículo
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-plate">Placa</Label>
              <Input
                id="new-plate"
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-brand">Marca</Label>
              <Input
                id="new-brand"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-model">Modelo</Label>
              <Input
                id="new-model"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-year">Ano</Label>
              <Input
                id="new-year"
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-color">Cor</Label>
              <Input
                id="new-color"
                value={newVehicle.color}
                onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-renavam">RENAVAM</Label>
              <Input
                id="new-renavam"
                value={newVehicle.renavam}
                onChange={(e) => setNewVehicle({...newVehicle, renavam: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-vehicleType">Tipo de Veículo</Label>
              <Select 
                value={newVehicle.vehicleType} 
                onValueChange={(value) => setNewVehicle({...newVehicle, vehicleType: value})}
              >
                <SelectTrigger id="new-vehicleType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {getVehicleTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-bodyType">Tipo de Carroceria</Label>
              <Select 
                value={newVehicle.bodyType} 
                onValueChange={(value) => setNewVehicle({...newVehicle, bodyType: value})}
              >
                <SelectTrigger id="new-bodyType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BODY_TYPES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {getBodyTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-driverId">Motorista</Label>
              <Select 
                value={newVehicle.driverId} 
                onValueChange={(value) => setNewVehicle({...newVehicle, driverId: value})}
              >
                <SelectTrigger id="new-driverId">
                  <SelectValue placeholder="Selecione o motorista" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={String(driver.id)}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateVehicle}
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
              Tem certeza que deseja excluir o veículo {selectedVehicle?.plate}? Esta ação não pode ser desfeita.
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