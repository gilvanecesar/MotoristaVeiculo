import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Complement } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { 
  Package, 
  MapPin, 
  ArrowLeft, 
  DollarSign, 
  Edit, 
  Loader2, 
  AlertCircle,
  Share2,
  Phone,
  User,
  Weight,
  Ruler,
  Box
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ComplementDetailPage() {
  const [match, params] = useRoute("/complements/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (!complementUserId && user?.clientId === clientId) {
      return true;
    }
    
    return false;
  };

  const id = params?.id ? parseInt(params.id) : null;

  // Buscar complemento específico
  const { data: complement, isLoading, error } = useQuery<Complement>({
    queryKey: [`/api/complements/${id}`],
    enabled: !!id,
  });

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

  const formatWeight = (weight: string) => {
    return `${weight} kg`;
  };

  // Função para compartilhar via WhatsApp
  const formatWhatsAppMessage = () => {
    if (!complement) return "";
    
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

  const shareViaWhatsApp = () => {
    const message = formatWhatsAppMessage();
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (!match || !id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Complemento não encontrado</h3>
            <p className="text-muted-foreground mb-4">O complemento que você está procurando não existe.</p>
            <Button onClick={() => navigate("/complements")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Complementos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando complemento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar complemento</h3>
            <p className="text-muted-foreground mb-4">Não foi possível carregar os dados do complemento.</p>
            <Button onClick={() => navigate("/complements")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Complementos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEditOrDelete = isComplementAuthorized(complement.clientId, complement.userId);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <Button variant="outline" onClick={() => navigate("/complements")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (complement.contactPhone) {
                window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
              }
            }}
            className="gap-2"
          >
            <FaWhatsapp className="h-4 w-4 text-green-500" />
            Contatar
          </Button>
          
          <Button onClick={shareViaWhatsApp}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          
          {canEditOrDelete && (
            <Button onClick={() => navigate(`/complements/${complement.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Complemento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID:</p>
                <p className="font-semibold">#{complement.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação:</p>
                <p className="font-semibold">{complement.createdAt ? formatDate(complement.createdAt) : 'N/A'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Peso:</p>
                <p className="font-semibold flex items-center gap-1">
                  <Weight className="h-4 w-4" />
                  {formatWeight(complement.weight)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volumes:</p>
                <p className="font-semibold flex items-center gap-1">
                  <Box className="h-4 w-4" />
                  {complement.volumeQuantity}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimensões (L x W x H):</p>
                <p className="font-semibold flex items-center gap-1">
                  <Ruler className="h-4 w-4" />
                  {complement.volumeLength} x {complement.volumeWidth} x {complement.volumeHeight} cm
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metros Cúbicos:</p>
                <p className="font-semibold">{complement.cubicMeters} m³</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor da Nota Fiscal:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(complement.invoiceValue)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor do Frete:</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(complement.freightValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rota */}
      {(complement.origin || complement.destination) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Rota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complement.origin && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Origem:</p>
                  <p className="font-semibold text-lg">{complement.origin}</p>
                </div>
              )}
              {complement.destination && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destino:</p>
                  <p className="font-semibold text-lg">{complement.destination}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contato */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nome do Contato:</p>
              <p className="font-semibold text-lg uppercase">{complement.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Telefone:</p>
              <button
                onClick={() => {
                  if (complement.contactPhone) {
                    window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank');
                  }
                }}
                className="font-semibold text-lg text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                title="Clique para chamar no WhatsApp"
              >
                {complement.contactPhone}
              </button>
            </div>
          </div>
          
          {complement.contactPhone && (
            <div className="flex justify-center pt-4">
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open(`https://wa.me/55${complement.contactPhone.replace(/\D/g, '')}`, '_blank')}
              >
                <FaWhatsapp className="h-5 w-5 mr-2" />
                Entrar em Contato via WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      {complement.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{complement.observations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}