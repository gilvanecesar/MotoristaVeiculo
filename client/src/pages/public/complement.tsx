import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Phone, User, Weight, Box, Calculator, FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PublicComplement {
  id: number;
  contactName: string;
  contactPhone: string;
  origin?: string;
  originState?: string;
  destination?: string;
  destinationState?: string;
  weight: string;
  volumeQuantity: number;
  volumeLength: string;
  volumeWidth: string;
  volumeHeight: string;
  cubicMeters: number;
  invoiceValue: string;
  freightValue: string;
  observations?: string;
  status: string;
  createdAt: string;
  client?: {
    id: number;
    name: string;
    phone: string;
  };
}

export default function PublicComplementPage() {
  const [match, params] = useRoute("/public/complements/:id");
  const complementId = params?.id;

  const { data: complement, isLoading, error } = useQuery<PublicComplement>({
    queryKey: [`/api/public/complements/${complementId}`],
    enabled: !!complementId,
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Complemento não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Este complemento não existe ou não está mais disponível.
              </p>
              <Button asChild>
                <Link href="/">
                  Voltar ao início
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">QUERO FRETES</h1>
          </div>
          <p className="text-muted-foreground">Complemento #{complement.id}</p>
        </div>

        {/* Complement Details */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Detalhes do Complemento
                </CardTitle>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  #{complement.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações de Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Contato</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">{complement.contactName}</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{complement.contactPhone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {complement.client && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Cliente</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">{complement.client.name}</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground">{complement.client.phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Informações da Carga */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Weight className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Peso</span>
                    </div>
                    <p className="text-lg font-semibold">{formatWeight(complement.weight)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Box className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Volumes</span>
                    </div>
                    <p className="text-lg font-semibold">{complement.volumeQuantity}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Metros Cúbicos</span>
                    </div>
                    <p className="text-lg font-semibold">{complement.cubicMeters} m³</p>
                  </CardContent>
                </Card>
              </div>

              {/* Dimensões */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Box className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Dimensões (cm)</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Comprimento</p>
                      <p className="text-lg font-semibold">{complement.volumeLength}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Largura</p>
                      <p className="text-lg font-semibold">{complement.volumeWidth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Altura</p>
                      <p className="text-lg font-semibold">{complement.volumeHeight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Origem e Destino */}
              {(complement.origin || complement.destination) && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Rota</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complement.origin && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Origem</p>
                          <p className="text-lg font-semibold">{complement.origin}</p>
                        </div>
                      )}
                      {complement.destination && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Destino</p>
                          <p className="text-lg font-semibold">{complement.destination}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Valor Nota Fiscal</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(complement.invoiceValue)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Valor do Frete</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(complement.freightValue)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Observações */}
              {complement.observations && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Observações</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{complement.observations}</p>
                  </CardContent>
                </Card>
              )}

              {/* Informações Adicionais */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Publicado em: {formatDate(complement.createdAt)}</span>
                    <Badge variant="outline">{complement.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="text-center bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Interessado neste complemento?</h3>
              <p className="text-muted-foreground mb-4">
                Entre em contato diretamente com o responsável ou acesse nossa plataforma para mais oportunidades.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${complement.contactPhone}`}>
                    Ligar: {complement.contactPhone}
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/">
                    Ver mais complementos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}