import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart, Loader2 } from "lucide-react";
import { DriverWithVehicles } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { generateDriversReport } from "@/lib/utils/pdf-generator-jspdf";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportsPage() {
  const [isGeneratingDriverReport, setIsGeneratingDriverReport] = useState(false);
  const [isGeneratingVehicleReport, setIsGeneratingVehicleReport] = useState(false);
  const [isGeneratingStatsReport, setIsGeneratingStatsReport] = useState(false);
  const { toast } = useToast();
  
  // Buscar dados dos motoristas com veículos
  const { data: drivers = [], isLoading } = useQuery<DriverWithVehicles[]>({
    queryKey: ["/api/drivers"],
  });

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

  // Função para gerar relatório de estatísticas
  const handleGenerateStatsReport = async () => {
    try {
      setIsGeneratingStatsReport(true);
      
      // Dados para o relatório de estatísticas
      const stats = {
        totalDrivers: drivers.length,
        totalVehicles: drivers.reduce((acc, driver) => acc + (driver.vehicles?.length || 0), 0),
        vehiclesByType: countVehiclesByType(drivers),
        vehiclesByBodyType: countVehiclesByBodyType(drivers),
      };
      
      // Simular atraso para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ainda não implementamos o relatório de estatísticas, então mostramos uma notificação
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "O relatório de estatísticas será disponibilizado em breve.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStatsReport(false);
    }
  };

  // Função para contar veículos por tipo
  const countVehiclesByType = (drivers: DriverWithVehicles[]) => {
    const result: Record<string, number> = {};
    
    drivers.forEach(driver => {
      driver.vehicles?.forEach(vehicle => {
        const type = vehicle.vehicleType;
        result[type] = (result[type] || 0) + 1;
      });
    });
    
    return result;
  };

  // Função para contar veículos por tipo de carroceria
  const countVehiclesByBodyType = (drivers: DriverWithVehicles[]) => {
    const result: Record<string, number> = {};
    
    drivers.forEach(driver => {
      driver.vehicles?.forEach(vehicle => {
        const type = vehicle.bodyType;
        result[type] = (result[type] || 0) + 1;
      });
    });
    
    return result;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                    <CardDescription>Resumo estatístico do sistema</CardDescription>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Exibe estatísticas sobre motoristas, veículos e outras métricas importantes.
                </p>
                <Button 
                  className="w-full flex items-center justify-center gap-1"
                  onClick={handleGenerateStatsReport}
                  disabled={isGeneratingStatsReport || drivers.length === 0}
                >
                  {isGeneratingStatsReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Gerar Relatório
                    </>
                  )}
                </Button>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">
                  Em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </div>

          {drivers.length === 0 && (
            <Alert className="mt-6">
              <AlertDescription>
                Não há motoristas cadastrados para gerar relatórios. Adicione alguns motoristas primeiro.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Módulo de Relatórios</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Este módulo permite gerar relatórios diversos do sistema em formato PDF.
              <br />
              Selecione o tipo de relatório desejado e clique em "Gerar Relatório PDF".
            </p>
          </div>
        </>
      )}
    </div>
  );
}
