import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Package, Calculator, Share2, MapPin, ExternalLink, MessageSquare, PhoneCall, Filter, X, DollarSign } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Complement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ComplementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    minWeight: "",
    maxWeight: "",
    minValue: "",
    maxValue: "",
    contactName: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar complementos
  const { data: complements = [], isLoading } = useQuery<Complement[]>({
    queryKey: ["/api/complements"],
  });

  // Função para verificar autorização baseado no usuário que criou o complemento
  const isComplementAuthorized = (clientId: number | null, complementUserId?: number | null) => {
    // Motoristas não podem editar/excluir complementos
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    
    // Administradores têm acesso total
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    
    // Verificação primária: o usuário é o criador do complemento?
    if (complementUserId && user?.id === complementUserId) {
      return true;
    }
    
    // Verificação secundária para compatibilidade: cliente associado
    // Se não houver userId no complemento, usa a regra do cliente
    if (!complementUserId && user?.clientId === clientId) {
      return true;
    }
    
    return false;
  };

  // Função para filtrar complementos
  const filterComplements = (data: Complement[]) => {
    if (!data) return [];
    
    return data.filter(complement => {
      // Filtro de busca por texto
      if (searchTerm && !Object.values(complement).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return false;
      }
      
      // Filtros avançados
      if (filters.origin && !complement.origin?.toLowerCase().includes(filters.origin.toLowerCase())) {
        return false;
      }
      
      if (filters.destination && !complement.destination?.toLowerCase().includes(filters.destination.toLowerCase())) {
        return false;
      }
      
      if (filters.contactName && !complement.contactName.toLowerCase().includes(filters.contactName.toLowerCase())) {
        return false;
      }
      
      if (filters.minWeight && parseFloat(complement.weight.toString()) < parseFloat(filters.minWeight)) {
        return false;
      }
      
      if (filters.maxWeight && parseFloat(complement.weight.toString()) > parseFloat(filters.maxWeight)) {
        return false;
      }
      
      if (filters.minValue && parseFloat(complement.freightValue.toString()) < parseFloat(filters.minValue)) {
        return false;
      }
      
      if (filters.maxValue && parseFloat(complement.freightValue.toString()) > parseFloat(filters.maxValue)) {
        return false;
      }
      
      return true;
    });
  };

  // Função para limpar filtros
  const resetFilters = () => {
    setFilters({
      origin: "",
      destination: "",
      minWeight: "",
      maxWeight: "",
      minValue: "",
      maxValue: "",
      contactName: ""
    });
    setSearchTerm("");
  };

  // Mutation para deletar complemento
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/complements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complements"] });
      toast({
        title: "Sucesso",
        description: "Complemento excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir complemento.",
        variant: "destructive",
      });
    },
  });

  // Aplicar filtros aos complementos
  const filteredComplements = filterComplements(complements);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatWeight = (weight: string) => {
    return `${weight} kg`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWhatsAppMessage = (complement: Complement) => {
    const baseUrl = window.location.origin;
    const complementUrl = `${baseUrl}/public/complements/${complement.id}`;

    return encodeURIComponent(`📦 *COMPLEMENTO DISPONÍVEL*

🏷️ *ID:* ${complement.id}
${complement.origin ? `📍 *Origem:* ${complement.origin}` : ''}
${complement.destination ? `📍 *Destino:* ${complement.destination}` : ''}
⚖️ *Peso:* ${complement.weight} Kg
📦 *Volumes:* ${complement.volumeQuantity}
📏 *Dimensões:* ${complement.volumeLength}x${complement.volumeWidth}x${complement.volumeHeight} cm
📊 *Metros Cúbicos:* ${complement.cubicMeters} m³
💰 *Valor NF:* ${formatCurrency(complement.invoiceValue)}
💵 *Valor Frete:* ${formatCurrency(complement.freightValue)}

👤 *Contato:* ${complement.contactName}
📞 *Telefone:* ${complement.contactPhone}
${complement.observations ? `\n📝 *Observações:* ${complement.observations}\n` : ''}
🌐 *Sistema QUERO FRETES:* ${baseUrl}
🔗 *Link do complemento:* ${complementUrl}
`);
  };

  const shareViaWhatsApp = (e: React.MouseEvent, complement: Complement) => {
    e.stopPropagation();
    const message = formatWhatsAppMessage(complement);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const openComplementPage = (complement: Complement) => {
    const baseUrl = window.location.origin;
    const complementUrl = `${baseUrl}/public/complements/${complement.id}`;
    window.open(complementUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Complementos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie seus complementos de carga</p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/complements/create">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Complemento</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        </Button>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por contato, telefone ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {showFilters && <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origem</label>
                  <Input 
                    placeholder="Cidade de origem" 
                    value={filters.origin} 
                    onChange={(e) => setFilters({...filters, origin: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destino</label>
                  <Input 
                    placeholder="Cidade de destino" 
                    value={filters.destination} 
                    onChange={(e) => setFilters({...filters, destination: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contato</label>
                  <Input 
                    placeholder="Nome do contato" 
                    value={filters.contactName} 
                    onChange={(e) => setFilters({...filters, contactName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peso Mínimo (kg)</label>
                  <Input 
                    type="number"
                    placeholder="Peso Mínimo" 
                    value={filters.minWeight} 
                    onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peso Máximo (kg)</label>
                  <Input 
                    type="number"
                    placeholder="Peso Máximo" 
                    value={filters.maxWeight} 
                    onChange={(e) => setFilters({...filters, maxWeight: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Mínimo (R$)</label>
                  <Input 
                    type="number"
                    placeholder="Valor Mínimo" 
                    value={filters.minValue} 
                    onChange={(e) => setFilters({...filters, minValue: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Máximo (R$)</label>
                  <Input 
                    type="number"
                    placeholder="Valor Máximo" 
                    value={filters.maxValue} 
                    onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={resetFilters}>Limpar Filtros</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Complementos</p>
                <p className="text-2xl font-bold">{complements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total m³</p>
                <p className="text-2xl font-bold">
                  {complements.reduce((acc, comp) => acc + parseFloat(comp.cubicMeters || "0"), 0).toFixed(3)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    complements.reduce((acc, comp) => acc + parseFloat(comp.freightValue), 0).toString()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de complementos */}
      {filteredComplements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum complemento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Nenhum resultado para sua busca." : "Comece criando seu primeiro complemento."}
            </p>
            <Button asChild>
              <Link href="/complements/create">
                <Plus className="h-4 w-4 mr-2" />
                Criar Complemento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Volumes</TableHead>
                    <TableHead>m³</TableHead>
                    <TableHead>Valor Frete</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplements.map((complement) => (
                    <TableRow 
                      key={complement.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/complements/${complement.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium uppercase">{complement.contactName}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (complement.contactPhone) {
                                window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
                              }
                            }}
                            className="text-sm text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                            title="Clique para chamar no WhatsApp"
                          >
                            {complement.contactPhone}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {complement.origin && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span>{complement.origin}</span>
                            </div>
                          )}
                          {complement.destination && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-red-600" />
                              <span>{complement.destination}</span>
                            </div>
                          )}
                          {!complement.origin && !complement.destination && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatWeight(complement.weight)}</TableCell>
                      <TableCell>{complement.volumeQuantity}</TableCell>
                      <TableCell>{complement.cubicMeters} m³</TableCell>
                      <TableCell className="font-medium">{formatCurrency(complement.freightValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openComplementPage(complement);
                            }}
                            title="Visualizar"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => shareViaWhatsApp(e, complement)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Compartilhar no WhatsApp"
                          >
                            <FaWhatsapp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (complement.contactPhone) {
                                window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
                              }
                            }}
                            title="Contatar via WhatsApp"
                            disabled={!complement.contactPhone}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          
                          {/* Botões para usuários autorizados (criador do complemento ou admin) */}
                          {isComplementAuthorized(complement.clientId, complement.userId) && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link href={`/complements/${complement.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este complemento? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(complement.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {filteredComplements.map((complement) => (
                <div 
                  key={complement.id} 
                  className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden"
                  onClick={() => navigate(`/complements/${complement.id}`)}
                >
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm uppercase">{complement.contactName}</span>
                    </div>
                    <Badge variant={complement.status === 'active' ? 'default' : 'secondary'}>
                      {complement.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Origem:</p>
                        <p className="text-sm">{complement.origin}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Destino:</p>
                        <p className="text-sm">{complement.destination}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Peso:</p>
                        <p className="text-sm">{complement.weight} Kg</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Valor:</p>
                        <p className="text-sm font-medium">{formatCurrency(complement.freightValue)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complements/${complement.id}`);
                        }}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => shareViaWhatsApp(e, complement)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Compartilhar no WhatsApp"
                      >
                        <FaWhatsapp className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (complement.contactPhone) {
                            window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
                          }
                        }}
                        disabled={!complement.contactPhone}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Contatar via WhatsApp"
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                      
                      {/* Botões para usuários autorizados */}
                      {isComplementAuthorized(complement.clientId, complement.userId) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/complements/${complement.id}/edit`);
                            }}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={(e) => e.stopPropagation()}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este complemento? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(complement.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (complement.contactPhone) {
                            window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
                          }
                        }}
                        className="text-green-600 hover:text-green-700 hover:underline"
                        title="Clique para chamar no WhatsApp"
                      >
                        {complement.contactPhone}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}