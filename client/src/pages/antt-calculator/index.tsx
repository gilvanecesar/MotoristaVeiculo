import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, MapPin, Calculator, Loader2, FileText, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Schema para validação do formulário
const anttCalculatorSchema = z.object({
  resolution: z.string().min(1, "Selecione a resolução"),
  transportCategory: z.string().min(1, "Selecione a categoria do transporte"),
  cargoType: z.string().min(1, "Selecione o tipo de carga"),
  axles: z.string().min(1, "Selecione o número de eixos"),
  originCity: z.string().min(1, "Selecione a cidade de origem"),
  destinationCity: z.string().min(1, "Selecione a cidade de destino"),
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

interface IBGECity {
  id: number;
  name: string;
  state: string;
  displayName: string;
}

export default function AnttCalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [originCities, setOriginCities] = useState<IBGECity[]>([]);
  const [destinationCities, setDestinationCities] = useState<IBGECity[]>([]);
  const [originOpen, setOriginOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [originSearch, setOriginSearch] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const { toast } = useToast();

  const form = useForm<AnttCalculatorForm>({
    resolver: zodResolver(anttCalculatorSchema),
    defaultValues: {
      resolution: "6067_2025",
      transportCategory: "CARGA_LOTACAO",
      cargoType: "",
      axles: "",
      originCity: "",
      destinationCity: "",
    },
  });

  const axles = form.watch("axles");
  const originCity = form.watch("originCity");
  const destinationCity = form.watch("destinationCity");

  // Função para buscar cidades do IBGE
  const searchCities = async (query: string): Promise<IBGECity[]> => {
    if (query.length < 2) return [];
    
    try {
      const response = await fetch(`/api/ibge/cities?search=${encodeURIComponent(query)}&limit=20`);
      if (!response.ok) throw new Error('Erro ao buscar cidades');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      return [];
    }
  };

  // Buscar cidades de origem
  useEffect(() => {
    if (originSearch.length >= 2) {
      searchCities(originSearch).then(setOriginCities);
    } else {
      setOriginCities([]);
    }
  }, [originSearch]);

  // Buscar cidades de destino
  useEffect(() => {
    if (destinationSearch.length >= 2) {
      searchCities(destinationSearch).then(setDestinationCities);
    } else {
      setDestinationCities([]);
    }
  }, [destinationSearch]);

  const onSubmit = async (data: AnttCalculatorForm) => {
    setIsCalculating(true);
    
    try {
      const payload = {
        cargoType: data.cargoType,
        axles: data.axles,
        originCity: data.originCity,
        destinationCity: data.destinationCity,
        transportCategory: data.transportCategory,
        resolution: data.resolution
      };

      const response = await fetch("/api/antt/calculate", {
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
        description: `Valor do frete: ${formatCurrency(result.totalValue)} - Distância: ${result.distance}km`,
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

                  {/* Campo Origem */}
                  <FormField
                    control={form.control}
                    name="originCity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-blue-800 font-medium">
                          <MapPin className="h-4 w-4 inline mr-2" />
                          Cidade de Origem
                        </FormLabel>
                        <Popover open={originOpen} onOpenChange={setOriginOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? originCities.find((city) => city.displayName === field.value)?.displayName || field.value
                                  : "Selecione a cidade de origem"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder="Digite o nome da cidade..."
                                value={originSearch}
                                onValueChange={setOriginSearch}
                              />
                              <CommandList>
                                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {originCities.map((city) => (
                                    <CommandItem
                                      value={city.displayName}
                                      key={city.id}
                                      onSelect={() => {
                                        form.setValue("originCity", city.displayName);
                                        setOriginOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          city.displayName === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {city.displayName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo Destino */}
                  <FormField
                    control={form.control}
                    name="destinationCity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-blue-800 font-medium">
                          <MapPin className="h-4 w-4 inline mr-2" />
                          Cidade de Destino
                        </FormLabel>
                        <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? destinationCities.find((city) => city.displayName === field.value)?.displayName || field.value
                                  : "Selecione a cidade de destino"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder="Digite o nome da cidade..."
                                value={destinationSearch}
                                onValueChange={setDestinationSearch}
                              />
                              <CommandList>
                                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {destinationCities.map((city) => (
                                    <CommandItem
                                      value={city.displayName}
                                      key={city.id}
                                      onSelect={() => {
                                        form.setValue("destinationCity", city.displayName);
                                        setDestinationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          city.displayName === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {city.displayName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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