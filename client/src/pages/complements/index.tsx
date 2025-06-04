import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Package, Calculator, Share2 } from "lucide-react";
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
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar complementos baseado na busca
  const filteredComplements = complements.filter((complement) =>
    complement.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complement.contactPhone.includes(searchTerm) ||
    (complement.observations && complement.observations.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Complementos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie cargas de complemento para fretes
          </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Dimensões (cm)</p>
                    <p className="font-semibold">
                      {complement.volumeLength} × {complement.volumeWidth} × {complement.volumeHeight}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">Valor NF</p>
                    <p className="font-semibold">{formatCurrency(complement.invoiceValue)}</p>
                  </div>

                  {complement.observations && (
                    <div>
                      <p className="text-muted-foreground text-sm">Observações</p>
                      <p className="text-sm truncate">{complement.observations}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalhes do Complemento #{complement.id}</DialogTitle>
                        <DialogDescription>
                          Informações completas do complemento
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-sm">Contato</p>
                            <p>{complement.contactName}</p>
                            <p className="text-sm text-muted-foreground">{complement.contactPhone}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Peso</p>
                            <p>{formatWeight(complement.weight)}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Quantidade Volumes</p>
                            <p>{complement.volumeQuantity}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Metros Cúbicos</p>
                            <p>{complement.cubicMeters} m³</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Dimensões (cm)</p>
                            <p>{complement.volumeLength} × {complement.volumeWidth} × {complement.volumeHeight}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Valor Nota Fiscal</p>
                            <p>{formatCurrency(complement.invoiceValue)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-semibold text-sm">Valor do Frete</p>
                            <p>{formatCurrency(complement.freightValue)}</p>
                          </div>
                        </div>
                        {complement.observations && (
                          <div>
                            <p className="font-semibold text-sm">Observações</p>
                            <p>{complement.observations}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/public/complements/${complement.id}`;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        toast({
                          title: "Link copiado!",
                          description: "O link do complemento foi copiado para a área de transferência.",
                        });
                      }).catch(() => {
                        toast({
                          title: "Erro",
                          description: "Não foi possível copiar o link.",
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Compartilhar
                  </Button>

                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/complements/${complement.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
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
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}