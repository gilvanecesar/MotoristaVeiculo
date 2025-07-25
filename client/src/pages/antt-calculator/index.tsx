import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator, MapPin, Truck, AlertCircle, DollarSign, Route } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ANTT_CARGO_TYPES } from "@shared/schema";

// Schema para validação do formulário
const anttCalculatorSchema = z.object({
  cargoType: z.string().min(1, "Selecione o tipo de carga"),
  axles: z.string().min(1, "Selecione o número de eixos"),
  distance: z.string().min(1, "Distância é obrigatória")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Digite uma distância válida"),
  origin: z.string().min(3, "Origem deve ter pelo menos 3 caracteres"),
  destination: z.string().min(3, "Destino deve ter pelo menos 3 caracteres"),
  isComposition: z.boolean().default(false),
  isHighPerformance: z.boolean().default(false),
  emptyReturn: z.boolean().default(false),
});

type AnttCalculatorForm = z.infer<typeof anttCalculatorSchema>;

// Tipos de carga com labels em português
const cargoTypeLabels = {
  [ANTT_CARGO_TYPES.CARGA_GERAL]: "Carga Geral",
  [ANTT_CARGO_TYPES.CARGA_GRANEL_PRESSURIZADA]: "Carga Granel Pressurizada",
  [ANTT_CARGO_TYPES.CONTEINERIZADA]: "Conteinerizada",
  [ANTT_CARGO_TYPES.FRIGORIFICADA_OU_AQUECIDA]: "Frigorificada ou Aquecida",
  [ANTT_CARGO_TYPES.GRANEL_LIQUIDO]: "Granel Líquido",
  [ANTT_CARGO_TYPES.GRANEL_SOLIDO]: "Granel Sólido",
  [ANTT_CARGO_TYPES.NEOGRANEL]: "Neogranel",
  [ANTT_CARGO_TYPES.PERIGOSA_CARGA_GERAL]: "Perigosa (Carga Geral)",
  [ANTT_CARGO_TYPES.PERIGOSA_CONTEINERIZADA]: "Perigosa (Conteinerizada)",
  [ANTT_CARGO_TYPES.PERIGOSA_FRIGORIFICADA]: "Perigosa (Frigorificada)",
  [ANTT_CARGO_TYPES.PERIGOSA_GRANEL_LIQUIDO]: "Perigosa (Granel Líquido)",
  [ANTT_CARGO_TYPES.PERIGOSA_GRANEL_SOLIDO]: "Perigosa (Granel Sólido)",
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
}

export default function AnttCalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const form = useForm<AnttCalculatorForm>({
    resolver: zodResolver(anttCalculatorSchema),
    defaultValues: {
      cargoType: "",
      axles: "",
      distance: "",
      origin: "",
      destination: "",
      isComposition: false,
      isHighPerformance: false,
      emptyReturn: false,
    },
  });

  const onSubmit = async (data: AnttCalculatorForm) => {
    setIsCalculating(true);
    
    try {
      const response = await fetch("/api/antt/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao calcular frete");
      }

      const result = await response.json();
      setCalculationResult(result);
      
      toast({
        title: "Cálculo realizado com sucesso!",
        description: `Valor total: R$ ${result.totalValue.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Erro ao calcular:", error);
      toast({
        title: "Erro no cálculo",
        description: "Não foi possível calcular o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearForm = () => {
    form.reset();
    setCalculationResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Calculadora ANTT</h1>
        </div>
        <p className="text-muted-foreground">
          Calcule o piso mínimo de frete conforme a tabela oficial da ANTT
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dados da Operação
            </CardTitle>
            <CardDescription>
              Informe os dados da operação de transporte para calcular o frete mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origem */}
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Origem
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Betim-MG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Destino */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Route className="h-4 w-4" />
                          Destino
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Guarulhos-SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Carga */}
                  <FormField
                    control={form.control}
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Carga</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(cargoTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
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
                        <FormLabel>Número de Eixos</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </div>

                {/* Distância */}
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distância (km)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 580" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Opções avançadas */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">Opções Avançadas</h4>
                  
                  <FormField
                    control={form.control}
                    name="isComposition"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            É composição veicular?
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Veículo automotor + implemento ou caminhão simples
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isHighPerformance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            É alto desempenho?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emptyReturn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Retorno vazio?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isCalculating}
                    className="flex-1"
                  >
                    {isCalculating ? "Calculando..." : "Calcular Frete"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearForm}
                    disabled={isCalculating}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <div className="space-y-6">
          {calculationResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resultado do Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Frete Mínimo ANTT:</span>
                    <Badge variant="secondary" className="text-lg">
                      R$ {calculationResult.freightValue.toFixed(2)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Pedágios Estimados:</span>
                    <Badge variant="outline" className="text-lg">
                      R$ {calculationResult.tollValue.toFixed(2)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <span className="font-bold text-lg">Valor Total:</span>
                    <Badge className="text-xl px-4 py-2">
                      R$ {calculationResult.totalValue.toFixed(2)}
                    </Badge>
                  </div>

                  <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Rota:</strong> {calculationResult.route}</p>
                    <p><strong>Distância:</strong> {calculationResult.distance} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Preencha os dados do formulário para calcular o frete mínimo
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações importantes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Os valores são calculados conforme a tabela oficial da ANTT. 
              Qualquer valor abaixo do piso mínimo é considerado infração com multa de R$ 550,00.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como usar a calculadora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>• <strong>Origem e Destino:</strong> Informe as cidades de origem e destino</p>
              <p>• <strong>Tipo de Carga:</strong> Selecione conforme a classificação ANTT</p>
              <p>• <strong>Número de Eixos:</strong> Considere todos os eixos do veículo</p>
              <p>• <strong>Distância:</strong> Insira a quilometragem da rota</p>
              <p>• <strong>Opções Avançadas:</strong> Marque conforme características do transporte</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}