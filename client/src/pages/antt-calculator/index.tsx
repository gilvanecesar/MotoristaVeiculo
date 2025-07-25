import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator, MapPin, Truck, Route, Loader2, FileText, Scale } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import TransportCategories from "./components/transport-categories";
import CargoTypes from "./components/cargo-types";
import CalculationInfo from "./components/calculation-info";
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

interface IBGECity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      };
    };
  };
}

export default function AnttCalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDestination, setOpenDestination] = useState(false);
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

  const resolution = form.watch("resolution");
  const transportCategory = form.watch("transportCategory");
  const cargoType = form.watch("cargoType");
  const axles = form.watch("axles");

  // Carregar cidades do IBGE
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const response = await fetch('/api/ibge/cities');
        if (response.ok) {
          const data = await response.json();
          const validCities = data.filter((city: IBGECity) => {
            try {
              return city?.nome && 
                     city?.microrregiao?.mesorregiao?.UF?.sigla &&
                     city?.microrregiao?.mesorregiao?.UF?.nome;
            } catch (error) {
              return false;
            }
          });
          setCities(validCities);
        }
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

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
        title: "Cálculo realizado com sucesso!",
        description: `Valor total: ${formatCurrency(result.totalValue)}`,
      });
    } catch (error) {
      toast({
        title: "Erro no cálculo",
        description: error instanceof Error ? error.message : "Não foi possível calcular o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Função helper para exibir cidades
  const getCityDisplayName = (city: IBGECity): string => {
    try {
      return `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`;
    } catch (error) {
      return city.nome || "Cidade";
    }
  };

  const getCityValue = (city: IBGECity): string => {
    try {
      return `${city.nome}-${city.microrregiao.mesorregiao.UF.sigla}`;
    } catch (error) {
      return city.nome || "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Calculadora de Frete Mínimo ANTT
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calcule o frete mínimo conforme RESOLUÇÃO Nº 6.067, DE 17 DE JULHO DE 2025
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Formulário */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Simulador da tabela de pisos mínimos</CardTitle>
                <CardDescription>
                  Use o simulador para cálculo dos pisos mínimos de frete com base na tabela da ANTT estabelecida pela Resolução abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Seletor de Resolução */}
                    <FormField
                      control={form.control}
                      name="resolution"
                      render={({ field }) => (
                        <FormItem>
                          <ResolutionSelector
                            selectedResolution={field.value}
                            onResolutionChange={field.onChange}
                          />
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
                          <TransportCategories
                            selectedCategory={field.value}
                            onCategoryChange={field.onChange}
                          />
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
                          <CargoTypes
                            value={field.value}
                            onValueChange={field.onChange}
                          />
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
                          <label className="text-sm font-medium">Num. eixos:</label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {axleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.value}
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
                              type="number"
                              placeholder="Digite a distância em km"
                              {...field}
                              min="1"
                              step="0.1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Origem */}
                    <FormField
                      control={form.control}
                      name="originCity"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Cidade de Origem:
                          </FormLabel>
                          <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
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
                                  {field.value ? field.value.replace('-', ' - ') : "Selecione a cidade..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar cidade..." />
                                <CommandList>
                                  <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                  <CommandGroup>
                                    {cities.map((city) => {
                                      const cityValue = getCityValue(city);
                                      const displayName = getCityDisplayName(city);
                                      return (
                                        <CommandItem
                                          key={city.id}
                                          value={cityValue}
                                          onSelect={() => {
                                            form.setValue("originCity", cityValue);
                                            setOpenOrigin(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === cityValue ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {displayName}
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Destino */}
                    <FormField
                      control={form.control}
                      name="destinationCity"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            <Route className="h-4 w-4" />
                            Cidade de Destino:
                          </FormLabel>
                          <Popover open={openDestination} onOpenChange={setOpenDestination}>
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
                                  {field.value ? field.value.replace('-', ' - ') : "Selecione a cidade..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar cidade..." />
                                <CommandList>
                                  <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                  <CommandGroup>
                                    {cities.map((city) => {
                                      const cityValue = getCityValue(city);
                                      const displayName = getCityDisplayName(city);
                                      return (
                                        <CommandItem
                                          key={city.id}
                                          value={cityValue}
                                          onSelect={() => {
                                            form.setValue("destinationCity", cityValue);
                                            setOpenDestination(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === cityValue ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {displayName}
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Opções Adicionais */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Opções adicionais:</h4>
                      
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
                              <FormLabel className="text-sm font-normal">
                                Composição Veicular (+5%)
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
                              <FormLabel className="text-sm font-normal">
                                Retorno Vazio (-15%)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

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