import React, { useState, useEffect } from "react";
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
import { Calculator, MapPin, Truck, AlertCircle, DollarSign, Route, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ANTT_CARGO_TYPES } from "@shared/schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema para validação do formulário
const anttCalculatorSchema = z.object({
  cargoType: z.string().min(1, "Selecione o tipo de carga"),
  axles: z.string().min(1, "Selecione o número de eixos"),
  originCity: z.string().min(1, "Selecione a cidade de origem"),
  destinationCity: z.string().min(1, "Selecione a cidade de destino"),
  isComposition: z.boolean().default(false),
  isHighPerformance: z.boolean().default(false),
  emptyReturn: z.boolean().default(false),
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
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const { toast } = useToast();

  const form = useForm<AnttCalculatorForm>({
    resolver: zodResolver(anttCalculatorSchema),
    defaultValues: {
      cargoType: "",
      axles: "",
      originCity: "",
      destinationCity: "",
      isComposition: false,
      isHighPerformance: false,
      emptyReturn: false,
    },
  });

  // Carregar cidades do IBGE
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const response = await fetch('/api/ibge/cities');
        if (response.ok) {
          const data = await response.json();
          // Filtrar apenas cidades com estrutura completa
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
        } else {
          console.error('Erro ao carregar cidades');
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
    const currentTime = Date.now();
    
    // Proteção contra múltiplas chamadas simultâneas
    if (isCalculating) {
      console.warn("⚠️ Cálculo já em andamento, ignorando nova chamada");
      return;
    }

    // Proteção contra cliques muito rápidos (debounce de 1 segundo)
    if (currentTime - lastRequestTime < 1000) {
      console.warn("⚠️ Chamada muito rápida após anterior, ignorando");
      return;
    }

    console.log("🚛 Iniciando cálculo ANTT:", data);
    setIsCalculating(true);
    setLastRequestTime(currentTime);
    
    try {
      const payload = {
        cargoType: data.cargoType,
        axles: data.axles,
        originCity: data.originCity,
        destinationCity: data.destinationCity,
        isComposition: data.isComposition,
        isHighPerformance: data.isHighPerformance,
        emptyReturn: data.emptyReturn
      };

      console.log("📦 Payload enviado:", payload);

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
      console.log("✅ Resultado do cálculo:", result);
      setCalculationResult(result);
      
      toast({
        title: "Cálculo realizado com sucesso!",
        description: `Valor total: R$ ${result.totalValue.toFixed(2)}`,
      });
    } catch (error) {
      console.error("❌ Erro ao calcular:", error);
      toast({
        title: "Erro no cálculo",
        description: error instanceof Error ? error.message : "Não foi possível calcular o frete. Tente novamente.",
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

  // Função helper para exibir cidades seguramente
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
                    name="originCity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Cidade de Origem
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
                          Cidade de Destino
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
                </div>

                {/* Informação sobre cálculo automático de distância */}
                <div className="col-span-full">
                  <Alert>
                    <Route className="h-4 w-4" />
                    <AlertDescription>
                      A distância será calculada automaticamente com base nas cidades selecionadas.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Tipo de carga */}
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
                          {Object.entries(ANTT_CARGO_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número de eixos */}
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
                          <FormLabel>Veículo articulado (CVC)</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Combinação de Veículos de Carga
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
                          <FormLabel>Veículo de alto desempenho</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Aplica coeficiente adicional para veículos especiais
                          </p>
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
                          <FormLabel>Retorno vazio</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Considera retorno sem carga
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isCalculating || loadingCities}
                    className="flex-1"
                    onClick={(e) => {
                      // Proteção adicional contra cliques múltiplos
                      if (isCalculating) {
                        e.preventDefault();
                        return;
                      }
                    }}
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : loadingCities ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando cidades...
                      </>
                    ) : (
                      "Calcular Frete"
                    )}
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

        {/* Sidebar com informações */}
        <div className="space-y-6">
          {/* Resultado do cálculo */}
          {calculationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Resultado do Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span>Rota:</span>
                    <Badge variant="outline">{calculationResult.route}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Distância:</span>
                    <span className="font-medium">{calculationResult.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor do Frete:</span>
                    <span className="font-medium">{formatCurrency(calculationResult.freightValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedágios:</span>
                    <span className="font-medium">{formatCurrency(calculationResult.tollValue)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(calculationResult.totalValue)}</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este é o valor mínimo conforme tabela ANTT. O valor final pode incluir outros custos e margens.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Informações de uso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como usar a calculadora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>• <strong>Origem e Destino:</strong> Selecione as cidades usando a busca integrada ao IBGE</p>
              <p>• <strong>Tipo de Carga:</strong> Selecione conforme a classificação ANTT</p>
              <p>• <strong>Número de Eixos:</strong> Considere todos os eixos do veículo</p>
              <p>• <strong>Distância:</strong> Calculada automaticamente entre as cidades</p>
              <p>• <strong>Opções Avançadas:</strong> Marque conforme características do transporte</p>
            </CardContent>
          </Card>

          {/* Informações legais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Legais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>• Valores baseados na <strong>tabela oficial ANTT 2025</strong></p>
              <p>• Lei nº 11.442/2007 - Transporte Rodoviário de Cargas</p>
              <p>• Resolução ANTT nº 5.820/2018</p>
              <p>• <strong>Importante:</strong> Estes são os valores mínimos obrigatórios</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}