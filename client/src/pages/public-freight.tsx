import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Package, DollarSign, Calendar, Phone, User, Truck, Weight } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface FreightData {
  id: number;
  origin: string;
  originState: string;
  destination: string;
  destinationState: string;
  destination2?: string;
  destinationState2?: string;
  destination3?: string;
  destinationState3?: string;
  cargoType: string;
  cargoWeight: string;
  vehicleType: string;
  bodyType: string;
  freightValue: string;
  paymentMethod: string;
  contactName: string;
  contactPhone: string;
  status: string;
  observations?: string;
  createdAt: string;
  expirationDate?: string;
}

export default function PublicFreight() {
  const { id } = useParams();
  const [freight, setFreight] = useState<FreightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFreight(parseInt(id));
    }
  }, [id]);

  const fetchFreight = async (freightId: number) => {
    try {
      const response = await fetch(`/api/public/freights/${freightId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Frete não encontrado');
        } else if (response.status === 403) {
          setError('Este frete não está mais disponível');
        } else {
          setError('Erro ao carregar o frete');
        }
        return;
      }

      const data = await response.json();
      setFreight(data);
    } catch (err) {
      setError('Erro ao carregar o frete');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVehicleTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'leve_vuc': 'VUC',
      'leve_toco': 'Toco',
      'medio_truck': 'Truck',
      'medio_bitruck': 'Bi-truck',
      'pesado_trucado': 'Trucado',
      'pesado_bitrem': 'Bi-trem',
      'pesado_tritrem': 'Tri-trem'
    };
    return types[type] || type;
  };

  const getBodyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'bau': 'Baú',
      'sider': 'Sider',
      'carroceria': 'Carroceria',
      'graneleiro': 'Graneleiro',
      'tanque': 'Tanque',
      'frigorifica': 'Frigorífica'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-red-600 text-lg font-semibold mb-2">
                  Frete não encontrado
                </div>
                <p className="text-red-500 mb-4">{error}</p>
                <p className="text-slate-600">
                  O frete solicitado não existe ou você não tem permissão para visualizá-lo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!freight) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Detalhes do Frete
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Frete #{freight.id} - Sistema QUERO FRETES
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="default" className="text-sm px-4 py-2">
            Frete Ativo
          </Badge>
        </div>

        {/* Informações principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Frete
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Origem:</p>
                  <p className="font-medium">{freight.origin}, {freight.originState}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Destinos:</p>
                  <div className="font-medium space-y-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Principal:</span>
                      <div>{freight.destination}, {freight.destinationState}</div>
                    </div>
                    {freight.destination2 && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="text-xs text-blue-600 dark:text-blue-400">Destino 2:</span>
                        <div className="text-blue-700 dark:text-blue-300">
                          {freight.destination2}, {freight.destinationState2}
                        </div>
                      </div>
                    )}
                    {freight.destination3 && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="text-xs text-blue-600 dark:text-blue-400">Destino 3:</span>
                        <div className="text-blue-700 dark:text-blue-300">
                          {freight.destination3}, {freight.destinationState3}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Tipo de Carga:</p>
                  <p className="font-medium">{freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Veículo:</p>
                  <p className="font-medium">{getVehicleTypeLabel(freight.vehicleType)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Carroceria:</p>
                  <p className="font-medium">{getBodyTypeLabel(freight.bodyType)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Weight className="h-4 w-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Peso:</p>
                  <p className="font-medium">{freight.cargoWeight} Kg</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor e Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valor e Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Valor do Frete:</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(freight.freightValue)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Forma de Pagamento:</p>
              <p className="font-medium">{freight.paymentMethod}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Nome do Contato:</p>
                <p className="font-medium">{freight.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Telefone:</p>
                <p className="font-medium">{freight.contactPhone}</p>
              </div>
            </div>
            
            {freight.contactPhone && (
              <div className="flex justify-center pt-4">
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank')}
                >
                  <FaWhatsapp className="h-5 w-5 mr-2" />
                  Entrar em Contato via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {freight.observations && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300">{freight.observations}</p>
            </CardContent>
          </Card>
        )}

        {/* Data de publicação */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>Publicado em {formatDate(freight.createdAt)}</span>
              {freight.expirationDate && (
                <span>• Válido até {formatDate(freight.expirationDate)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}