import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Package, Calculator, Share2, MapPin, ExternalLink, MessageSquare } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Complement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  // Buscar complementos
  const { data: complements = [], isLoading } = useQuery<Complement[]>({
    queryKey: ["/api/complements"],
  });

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

  // Filtrar complementos baseado na pesquisa
  const filteredComplements = complements.filter((complement) =>
    complement.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complement.contactPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complement.observations && complement.observations.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (complement.origin && complement.origin.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (complement.destination && complement.destination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

📅 *Publicado em:* ${complement.createdAt ? formatDate(complement.createdAt) : 'Data não disponível'}

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Complementos</h1>
          <p className="text-muted-foreground">Gerencie seus complementos de carga</p>
        </div>
        <Button asChild>
          <Link href="/complements/create">
            <Plus className="h-4 w-4 mr-2" />
            Novo Complemento
          </Link>
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por contato, telefone ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
                    <TableRow key={complement.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{complement.contactName}</p>
                          <p className="text-sm text-muted-foreground">{complement.contactPhone}</p>
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/complements/${complement.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4">
              {filteredComplements.map((complement) => (
                <Card key={complement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{complement.contactName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{complement.contactPhone}</p>
                      </div>
                      <Badge variant="secondary">#{complement.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Peso</p>
                          <p className="font-semibold">{formatWeight(complement.weight)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volumes</p>
                          <p className="font-semibold">{complement.volumeQuantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Metros Cúbicos</p>
                          <p className="font-semibold">{complement.cubicMeters} m³</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Frete</p>
                          <p className="font-semibold">{formatCurrency(complement.freightValue)}</p>
                        </div>
                      </div>
                      
                      {(complement.origin || complement.destination) && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <p className="text-muted-foreground text-sm font-medium">Rota</p>
                          </div>
                          <div className="text-sm">
                            {complement.origin && (
                              <p><span className="font-medium">De:</span> {complement.origin}</p>
                            )}
                            {complement.destination && (
                              <p><span className="font-medium">Para:</span> {complement.destination}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openComplementPage(complement)}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => shareViaWhatsApp(e, complement)}
                        className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <FaWhatsapp className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/complements/${complement.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}