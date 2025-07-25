import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResolutionSelector from "./components/resolution-selector";

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Calculadora de Frete ANTT
          </h1>
          <p className="text-gray-600">
            Calcule o valor mínimo do frete conforme as resoluções da ANTT
          </p>
        </div>

        {/* Layout em 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Formulário */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Frete</CardTitle>
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

                    {/* Botão Calcular */}
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Calculator className="mr-2 h-4 w-4" />
                      )}
                      {isCalculating ? "Calculando..." : "Calcular valor do frete"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Resultado */}
          <div className="lg:col-span-1">
            {!calculationResult ? (
              <Card className="h-fit">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Calculator className="h-16 w-16 mx-auto mb-4" />
                  </div>
                  <p className="text-gray-500">
                    Preencha os campos ao lado para calcular o valor do frete.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 text-center">
                    💰 Valor do Frete Calculado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="bg-white p-6 rounded-lg border border-green-200">
                      <p className="text-4xl font-bold text-green-800 mb-2">
                        {formatCurrency(calculationResult.totalValue)}
                      </p>
                      <p className="text-sm text-green-600">
                        Valor mínimo conforme tabela ANTT
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-green-700 font-medium">Distância</p>
                        <p className="text-green-800 text-lg font-semibold">
                          {calculationResult.distance} km
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200">
                        <p className="text-green-700 font-medium">Eixos</p>
                        <p className="text-green-800 text-lg font-semibold">
                          {axles} eixos
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded border border-green-200">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Detalhes do Cálculo:</h4>
                      <div className="text-xs text-green-600 space-y-1">
                        <p><strong>CCD:</strong> R$ {calculationResult.calculation.baseRate.toFixed(4)}/km</p>
                        <p><strong>CC:</strong> {formatCurrency(calculationResult.calculation.loadUnloadCoefficient)}</p>
                        <p><strong>Fórmula:</strong> ({calculationResult.distance} km × R$ {calculationResult.calculation.baseRate.toFixed(4)}) + {formatCurrency(calculationResult.calculation.loadUnloadCoefficient)}</p>
                        {calculationResult.calculation.adjustments.length > 0 && (
                          <div className="pt-2 border-t border-green-200">
                            <p className="font-medium">Ajustes aplicados:</p>
                            {calculationResult.calculation.adjustments.map((adj, idx) => (
                              <p key={idx}>• {adj.type}: {((adj.factor - 1) * 100).toFixed(1)}%</p>
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
    </div>
  );
}