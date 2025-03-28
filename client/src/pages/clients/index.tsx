import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Edit, Eye, Trash2, Building2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Client } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPhoneNumber } from "@/lib/utils/format";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Fetch data
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    
    try {
      await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'DELETE',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${formattedPhone}`, '_blank');
  };

  const toggleDeleteDialog = (client: Client | null) => {
    setSelectedClient(client);
    setDeleteDialogOpen(!!client);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Clientes</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-auto min-w-[200px]"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <Button onClick={() => navigate("/clients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Gerenciamento de clientes para fretes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : clients && clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: Client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {client.logoUrl ? (
                            <AvatarImage src={client.logoUrl} alt={client.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-slate-500">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{client.documentType}: {client.document}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatPhoneNumber(client.phone)}</span>
                        {client.whatsapp && (
                          <div className="mt-1">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-green-600 hover:text-green-700"
                              onClick={() => openWhatsApp(client.whatsapp || '')}
                            >
                              <Phone className="h-3 w-3 mr-1" /> WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.city}, {client.state}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDeleteDialog(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <div className="flex justify-center mb-3">
                <Building2 className="h-10 w-10 text-slate-300" />
              </div>
              <p>Nenhum cliente encontrado.</p>
              <p className="text-sm">
                Comece cadastrando um novo cliente através do botão acima.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500">
            Total de registros: {clients?.length || 0}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedClient && (
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    {selectedClient.logoUrl ? (
                      <AvatarImage src={selectedClient.logoUrl} alt={selectedClient.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedClient.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-lg">{selectedClient.name}</div>
                    <div className="text-sm text-slate-500">{selectedClient.email}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="font-medium">Documento:</span> {selectedClient.documentType}: {selectedClient.document}
                </div>
                <div className="mb-4">
                  <span className="font-medium">Telefone:</span> {formatPhoneNumber(selectedClient.phone)}
                </div>
                <div>
                  <span className="font-medium">Localização:</span> {selectedClient.city}, {selectedClient.state}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}