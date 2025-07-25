import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Loader2, FileText, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema para validação do formulário
const anttCalculatorSchema = z.object({
  resolution: z.string().min(1, "Selecione a resolução"),
  transportCategory: z.string().min(1, "Selecione a categoria do transporte"),
  cargoType: z.string().min(1, "Selecione o tipo de carga"),
  axles: z.string().min(1, "Selecione o número de eixos"),
  distance: z.string().min(1, "Digite a distância em km").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Distância deve ser um número maior que 0"),
});

type AnttCalculatorForm = z.infer<typeof anttCalculatorSchema>;

// Formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Opções de eixos
const axleOptions = [
  { value: "2", label: "2 eixos" },
  { value: "3", label: "3 eixos" },
  { value: "4", label: "4 eixos" },
  { value: "5", label: "5 eixos" },
  { value: "6", label: "6 eixos" },
  { value: "7", label: "7 eixos" },
  { value: "9", label: "9 eixos" },
];

interface CalculationResult {
  freightValue: number;
  tollValue: number;
  totalValue: number;
  distance: number;
  route: string;
  calculation: {
    baseRate: number;
    loadUnloadCoefficient: number;
    distanceCoefficient: number;
    adjustments: any[];
  };
}

export default function AnttCalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const form = useForm<AnttCalculatorForm>({
    resolver: zodResolver(anttCalculatorSchema),
    defaultValues: {
      resolution: "6067_2025",
      transportCategory: "CARGA_LOTACAO",
      cargoType: "",
      axles: "",
      distance: "",
    },
  });

  const axles = form.watch("axles");

  const onSubmit = async (data: AnttCalculatorForm) => {
    setIsCalculating(true);
    
    try {
      const payload = {
        cargoType: data.cargoType,
        axles: data.axles,
        distance: parseFloat(data.distance),
        transportCategory: data.transportCategory,
        resolution: data.resolution
      };

      const response = await fetch("/api/antt/calculate-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao calcular frete");
      }

      const result = await response.json();
      setCalculationResult(result);
      
      toast({
        title: "Cálculo realizado!",
        description: `Valor do frete: ${formatCurrency(result.totalValue)}`,
      });
    } catch (error: any) {
      console.error("Erro ao calcular frete:", error);
      toast({
        title: "Erro no cálculo",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com padrão do sistema */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              Calculadora ANTT
            </h1>
            <p className="text-gray-600 mt-1">
              Calcule o valor mínimo do frete conforme resoluções da ANTT
            </p>
          </div>
        </div>
      </div>

      {/* Layout em 2 colunas seguindo padrão do sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Dados do Frete
              </CardTitle>
              <CardDescription>
                Preencha as informações para calcular o valor do frete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Resolução/Portaria */}
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolução/Portaria:</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a resolução" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="6067_2025">RESOLUÇÃO 6.067/2025 (Atual)</SelectItem>
                            <SelectItem value="5867_2020">RESOLUÇÃO 5.867/2020</SelectItem>
                            <SelectItem value="5849_2020">RESOLUÇÃO 5.849/2020</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categoria de Transporte */}
                  <FormField
                    control={form.control}
                    name="transportCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria de Transporte:</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CARGA_LOTACAO">Carga Lotação (Tabela A)</SelectItem>
                            <SelectItem value="VEICULO">Veículo (Tabela B)</SelectItem>
                            <SelectItem value="ALTO_DESEMPENHO">Alto Desempenho (Tabela C)</SelectItem>
                            <SelectItem value="VEICULO_ALTO_DESEMPENHO">Veículo Alto Desempenho (Tabela D)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo de Carga */}
                  <FormField
                    control={form.control}
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Carga:</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CARGA_GERAL">Carga Geral</SelectItem>
                            <SelectItem value="GRANEL_SOLIDO">Granel Sólido</SelectItem>
                            <SelectItem value="GRANEL_LIQUIDO">Granel Líquido</SelectItem>
                            <SelectItem value="FRIGORIFICADA">Frigorificada</SelectItem>
                            <SelectItem value="CONTEINERIZADA">Contêinerizada</SelectItem>
                            <SelectItem value="NEOGRANEL">Neogranel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número de Eixos */}
                  <FormField
                    control={form.control}
                    name="axles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Eixos:</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o número de eixos" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {axleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Distância */}
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distância (km):</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite a distância em quilômetros"
                            type="number"
                            min="1"
                            step="0.1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botão Calcular com padrão do sistema */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="mr-2 h-4 w-4" />
                    )}
                    {isCalculating ? "Calculando..." : "Calcular Valor do Frete"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Resultado com padrão do sistema */}
        <div className="lg:col-span-1">
          {!calculationResult ? (
            <Card className="shadow-sm h-fit">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Calculator className="h-12 w-12 mx-auto mb-4" />
                </div>
                <p className="text-gray-500 text-sm">
                  Preencha os campos ao lado para calcular o valor do frete.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-blue-200 bg-blue-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-800 text-center flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resultado do Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Valor Principal */}
                  <div className="bg-white p-6 rounded-lg border border-blue-200 text-center">
                    <p className="text-3xl font-bold text-blue-800 mb-1">
                      {formatCurrency(calculationResult.totalValue)}
                    </p>
                    <p className="text-sm text-blue-600">
                      Valor mínimo conforme tabela ANTT
                    </p>
                  </div>
                  
                  {/* Informações em Grade */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-600 font-medium mb-1">Distância</p>
                      <p className="text-gray-900 text-lg font-semibold">
                        {calculationResult.distance} km
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-600 font-medium mb-1">Eixos</p>
                      <p className="text-gray-900 text-lg font-semibold">
                        {axles} eixos
                      </p>
                    </div>
                  </div>

                  {/* Detalhes do Cálculo */}
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Detalhes do Cálculo:
                    </h4>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>CCD (por km):</span>
                        <span className="font-medium">R$ {calculationResult.calculation.baseRate.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CC (fixo):</span>
                        <span className="font-medium">{formatCurrency(calculationResult.calculation.loadUnloadCoefficient)}</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="text-xs bg-gray-50 p-2 rounded">
                        <strong>Fórmula:</strong> ({calculationResult.distance} km × R$ {calculationResult.calculation.baseRate.toFixed(4)}) + {formatCurrency(calculationResult.calculation.loadUnloadCoefficient)}
                      </div>
                      {calculationResult.calculation.adjustments.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="font-medium text-gray-700 mb-1">Ajustes aplicados:</p>
                          {calculationResult.calculation.adjustments.map((adj, idx) => (
                            <p key={idx} className="text-gray-600">
                              • {adj.type}: {((adj.factor - 1) * 100).toFixed(1)}%
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}