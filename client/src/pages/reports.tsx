import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Calendar, 
  Truck, 
  Loader2, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Clock,
  BarChart
} from "lucide-react";
import { 
  DriverWithVehicles, 
  FreightWithDestinations, 
  Client, 
  CARGO_TYPES, 
  VEHICLE_TYPES 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { generateDriversReport } from "@/lib/utils/pdf-generator-jspdf";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils/format";

export default function ReportsPage() {
  const [isGeneratingDriverReport, setIsGeneratingDriverReport] = useState(false);
  const [isGeneratingVehicleReport, setIsGeneratingVehicleReport] = useState(false);
  const { toast } = useToast();
  
  // Buscar dados dos motoristas com veículos
  const { data: drivers = [], isLoading: driversLoading } = useQuery<DriverWithVehicles[]>({
    queryKey: ["/api/drivers"],
  });

  // Buscar dados dos fretes
  const { data: freights = [], isLoading: freightsLoading } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights"],
  });
  
  // Buscar dados dos clientes
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const isLoading = driversLoading || freightsLoading;
  
  // Função para gerar relatório de motoristas
  const handleGenerateDriversReport = async () => {
    try {
      setIsGeneratingDriverReport(true);
      const pdfUrl = await generateDriversReport(
        drivers, 
        'Relatório de Motoristas - Cadastro Completo',
        'driver'
      );
      
      // Abrir o PDF em uma nova janela
      window.open(pdfUrl, '_blank');
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O relatório de motoristas foi gerado e aberto em uma nova janela.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDriverReport(false);
    }
  };

  // Função para gerar relatório completo (motoristas e veículos)
  const handleGenerateVehiclesReport = async () => {
    try {
      setIsGeneratingVehicleReport(true);
      const pdfUrl = await generateDriversReport(
        drivers, 
        'Relatório de Motoristas e Veículos',
        'full'
      );
      
      // Abrir o PDF em uma nova janela
      window.open(pdfUrl, '_blank');
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O relatório de veículos foi gerado e aberto em uma nova janela.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVehicleReport(false);
    }
  };

  // Verifica se um frete está expirado
  const isExpired = (expirationDate: Date) => {
    return new Date(expirationDate) < new Date();
  };

  // Verifica se um frete está vencendo em breve (próximos 3 dias)
  const isExpiringSoon = (expirationDate: Date) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  // Separa os fretes por status para o relatório
  const activeFreights = freights.filter(freight => !isExpired(freight.expirationDate));
  const expiredFreights = freights.filter(freight => isExpired(freight.expirationDate));
  const expiringSoonFreights = freights.filter(freight => isExpiringSoon(freight.expirationDate));

  // Resumo dos fretes para o relatório
  const freightsSummary = {
    total: freights.length,
    active: activeFreights.length,
    expired: expiredFreights.length,
    expiringSoon: expiringSoonFreights.length,
    totalValue: freights.reduce((sum, freight) => sum + Number(freight.freightValue), 0),
    averageValue: freights.length > 0 
      ? freights.reduce((sum, freight) => sum + Number(freight.freightValue), 0) / freights.length 
      : 0
  };

  // Mapeia o tipo de veículo para um nome amigável
  const getVehicleTypeName = (type: string) => {
    const [category, model] = type.split('_');
    
    if (model === 'todos') {
      switch (category) {
        case 'leve': return 'Leve (Todos)';
        case 'medio': return 'Médio (Todos)';
        case 'pesado': return 'Pesado (Todos)';
        default: return type;
      }
    }
    
    return Object.entries(VEHICLE_TYPES).find(([key]) => key === type)?.[1] || type;
  };

  // Encontra o nome do cliente pelo ID
  const getClientName = (clientId: number | null) => {
    if (!clientId) return "Cliente não associado";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };

  // Renderiza o status do frete como um badge colorido
  const renderStatusBadge = (freight: FreightWithDestinations) => {
    if (isExpired(freight.expirationDate)) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (isExpiringSoon(freight.expirationDate)) {
      return <Badge className="bg-yellow-500">Vencendo em breve</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  // Retorna o tipo de carga formatado
  const getCargoType = (cargoType: string) => {
    switch (cargoType) {
      case 'completa': return 'Completa';
      case 'complemento': return 'Complemento';
      default: return cargoType;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Relatórios</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gere relatórios do sistema</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório de Motoristas</CardTitle>
                    <CardDescription>Lista todos os motoristas cadastrados</CardDescription>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Exibe uma lista completa de todos os motoristas com suas informações pessoais e dados de contato.
                </p>
                <Button 
                  className="w-full flex items-center justify-center gap-1"
                  onClick={handleGenerateDriversReport}
                  disabled={isGeneratingDriverReport || drivers.length === 0}
                >
                  {isGeneratingDriverReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Gerar Relatório PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório de Veículos</CardTitle>
                    <CardDescription>Motoristas e seus veículos</CardDescription>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Exibe uma lista completa de todos os motoristas e seus veículos cadastrados com detalhes completos.
                </p>
                <Button 
                  className="w-full flex items-center justify-center gap-1"
                  onClick={handleGenerateVehiclesReport}
                  disabled={isGeneratingVehicleReport || drivers.length === 0}
                >
                  {isGeneratingVehicleReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Gerar Relatório PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Relatório de Fretes</CardTitle>
                    <CardDescription>Situação dos fretes cadastrados</CardDescription>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Exibe um resumo dos fretes por status e valor total no sistema.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total de fretes:</span>
                    <span className="font-semibold">{freightsSummary.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Fretes ativos:</span>
                    <span className="font-semibold text-green-600">{freightsSummary.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Fretes expirados:</span>
                    <span className="font-semibold text-red-600">{freightsSummary.expired}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Vencendo em breve:</span>
                    <span className="font-semibold text-yellow-600">{freightsSummary.expiringSoon}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="text-slate-600 dark:text-slate-400">Valor total:</span>
                    <span className="font-semibold">{formatCurrency(freightsSummary.totalValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Relatório detalhado de fretes */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Truck className="h-5 w-5" /> Relatório Detalhado de Fretes
              </CardTitle>
              <CardDescription>
                Análise completa dos fretes cadastrados no sistema por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {freights.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Não há fretes cadastrados no sistema para gerar o relatório.
                  </AlertDescription>
                </Alert>
              ) : (
                <Tabs defaultValue="todos" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="todos">
                      Todos ({freights.length})
                    </TabsTrigger>
                    <TabsTrigger value="ativos">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" /> 
                      Ativos ({activeFreights.length})
                    </TabsTrigger>
                    <TabsTrigger value="vencendo">
                      <Clock className="h-4 w-4 mr-1 text-yellow-500" /> 
                      Vencendo ({expiringSoonFreights.length})
                    </TabsTrigger>
                    <TabsTrigger value="expirados">
                      <XCircle className="h-4 w-4 mr-1 text-red-500" /> 
                      Expirados ({expiredFreights.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Todos os fretes */}
                  <TabsContent value="todos" className="responsive-table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Origem/Destino</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Carga</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {freights.map((freight) => (
                          <TableRow key={freight.id}>
                            <TableCell>{renderStatusBadge(freight)}</TableCell>
                            <TableCell>{getClientName(freight.clientId)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <span className="font-medium">Origem:</span>
                                  <span className="ml-1">{freight.origin}, {freight.originState}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <ChevronRight className="h-3 w-3 mr-1 text-slate-400" />
                                  <span className="font-medium">Destino:</span>
                                  <span className="ml-1">{freight.destination}, {freight.destinationState}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getVehicleTypeName(freight.vehicleType)}</TableCell>
                            <TableCell>{getCargoType(freight.cargoType)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(freight.freightValue))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  {/* Fretes ativos */}
                  <TabsContent value="ativos" className="responsive-table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Origem/Destino</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Carga</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeFreights.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                              Não há fretes ativos no momento.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeFreights.map((freight) => (
                            <TableRow key={freight.id}>
                              <TableCell><Badge>Ativo</Badge></TableCell>
                              <TableCell>{getClientName(freight.clientId)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center">
                                    <span className="font-medium">Origem:</span>
                                    <span className="ml-1">{freight.origin}, {freight.originState}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <ChevronRight className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="font-medium">Destino:</span>
                                    <span className="ml-1">{freight.destination}, {freight.destinationState}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getVehicleTypeName(freight.vehicleType)}</TableCell>
                              <TableCell>{getCargoType(freight.cargoType)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(Number(freight.freightValue))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  {/* Fretes vencendo em breve */}
                  <TabsContent value="vencendo" className="responsive-table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Origem/Destino</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Carga</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiringSoonFreights.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                              Não há fretes vencendo em breve.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expiringSoonFreights.map((freight) => (
                            <TableRow key={freight.id}>
                              <TableCell>
                                <Badge className="bg-yellow-500">Vencendo</Badge>
                              </TableCell>
                              <TableCell>{getClientName(freight.clientId)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center">
                                    <span className="font-medium">Origem:</span>
                                    <span className="ml-1">{freight.origin}, {freight.originState}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <ChevronRight className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="font-medium">Destino:</span>
                                    <span className="ml-1">{freight.destination}, {freight.destinationState}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getVehicleTypeName(freight.vehicleType)}</TableCell>
                              <TableCell>{getCargoType(freight.cargoType)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(Number(freight.freightValue))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  {/* Fretes expirados */}
                  <TabsContent value="expirados" className="responsive-table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Origem/Destino</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Carga</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiredFreights.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                              Não há fretes expirados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expiredFreights.map((freight) => (
                            <TableRow key={freight.id}>
                              <TableCell>
                                <Badge variant="destructive">Expirado</Badge>
                              </TableCell>
                              <TableCell>{getClientName(freight.clientId)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center">
                                    <span className="font-medium">Origem:</span>
                                    <span className="ml-1">{freight.origin}, {freight.originState}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <ChevronRight className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="font-medium">Destino:</span>
                                    <span className="ml-1">{freight.destination}, {freight.destinationState}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getVehicleTypeName(freight.vehicleType)}</TableCell>
                              <TableCell>{getCargoType(freight.cargoType)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(Number(freight.freightValue))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {drivers.length === 0 && (
            <Alert className="mt-6">
              <AlertDescription>
                Não há motoristas cadastrados para gerar relatórios. Adicione alguns motoristas primeiro.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}