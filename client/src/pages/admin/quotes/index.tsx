import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Calendar,
  User,
  MapPin,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Quote {
  id: number;
  userId: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  origin: string;
  originState: string;
  destination: string;
  destinationState: string;
  cargoType: string;
  weight: number;
  volume: number;
  urgency: string;
  deliveryDate: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  shipperName?: string;
  shipperEmail?: string;
  shipperWhatsapp?: string;
}

interface QuoteStats {
  totalQuotes: number;
  publicQuotes: number;
  registeredQuotes: number;
  activeQuotes: number;
  closedQuotes: number;
  canceledQuotes: number;
  expiredQuotes: number;
  thisMonthQuotes: number;
  lastMonthQuotes: number;
  thisWeekQuotes: number;
}

const statusColors = {
  "ativa": "bg-green-100 text-green-800",
  "fechada": "bg-blue-100 text-blue-800",
  "cancelada": "bg-red-100 text-red-800",
  "expirada": "bg-gray-100 text-gray-800",
  "pendente": "bg-yellow-100 text-yellow-800"
};

const urgencyColors = {
  "baixa": "bg-green-100 text-green-800",
  "media": "bg-yellow-100 text-yellow-800",
  "alta": "bg-orange-100 text-orange-800",
  "urgente": "bg-red-100 text-red-800"
};

export default function AdminQuotesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<Quote>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cotações
  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/admin/quotes'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar estatísticas
  const { data: stats } = useQuery<QuoteStats>({
    queryKey: ['/api/admin/quotes/stats'],
    refetchInterval: 30000,
  });

  // Mutation para atualizar cotação
  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Quote> }) => {
      return await apiRequest(`/api/admin/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Cotação atualizada",
        description: "A cotação foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes/stats'] });
      setIsEditDialogOpen(false);
      setEditingQuote({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cotação",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar cotação
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/quotes/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Cotação deletada",
        description: "A cotação foi deletada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar cotação",
        variant: "destructive",
      });
    },
  });

  // Filtrar cotações
  const filteredQuotes = quotes?.filter((quote: Quote) => {
    const matchesSearch = 
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.cargoType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openWhatsApp = (quote: Quote) => {
    const phone = quote.clientPhone.replace(/\D/g, '');
    const message = `Olá ${quote.clientName}, temos uma proposta para sua cotação de ${quote.origin} para ${quote.destination}. Valor estimado: R$ ${quote.price.toFixed(2)}`;
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEditDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setEditingQuote(quote);
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuote = () => {
    if (!selectedQuote) return;
    
    updateQuoteMutation.mutate({
      id: selectedQuote.id,
      data: editingQuote
    });
  };

  const handleDeleteQuote = (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta cotação?")) {
      deleteQuoteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Cotações</h1>
          <p className="text-gray-600">Visualize e gerencie todas as cotações do sistema</p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Cotações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalQuotes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cotações Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{stats.activeQuotes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cotações Públicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold">{stats.publicQuotes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">{stats.thisMonthQuotes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Pesquisar por cliente, email, origem, destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="expirada">Expirada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Cotações ({filteredQuotes?.length || 0})</CardTitle>
          <CardDescription>
            Todas as cotações do sistema com opções de gerenciamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando cotações...</p>
            </div>
          ) : filteredQuotes?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma cotação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem → Destino</TableHead>
                    <TableHead>Carga</TableHead>
                    <TableHead>Valor de NF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes?.map((quote: Quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{quote.clientName}</p>
                          <p className="text-sm text-gray-600">{quote.clientEmail}</p>
                          <p className="text-sm text-gray-600">{quote.clientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{quote.origin} - {quote.originState}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{quote.destination} - {quote.destinationState}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{quote.cargoType}</p>
                          <p className="text-sm text-gray-600">{quote.weight}kg</p>
                          <p className="text-sm text-gray-600">{quote.volume}m³</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{formatCurrency(quote.price)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={urgencyColors[quote.urgency as keyof typeof urgencyColors]}>
                          {quote.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quote.userId ? "default" : "secondary"}>
                          {quote.userId ? "Registrado" : "Público"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(quote.deliveryDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWhatsApp(quote)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(quote)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cotação</DialogTitle>
            <DialogDescription>
              Atualize os dados da cotação selecionada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  value={editingQuote.clientName || ''}
                  onChange={(e) => setEditingQuote({...editingQuote, clientName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email do Cliente</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={editingQuote.clientEmail || ''}
                  onChange={(e) => setEditingQuote({...editingQuote, clientEmail: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  value={editingQuote.origin || ''}
                  onChange={(e) => setEditingQuote({...editingQuote, origin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  value={editingQuote.destination || ''}
                  onChange={(e) => setEditingQuote({...editingQuote, destination: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Valor de NF (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={editingQuote.price || ''}
                  onChange={(e) => setEditingQuote({...editingQuote, price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingQuote.status || ''}
                  onValueChange={(value) => setEditingQuote({...editingQuote, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="fechada">Fechada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgência</Label>
                <Select
                  value={editingQuote.urgency || ''}
                  onValueChange={(value) => setEditingQuote({...editingQuote, urgency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a urgência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editingQuote.description || ''}
                onChange={(e) => setEditingQuote({...editingQuote, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateQuote}
              disabled={updateQuoteMutation.isPending}
            >
              {updateQuoteMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}