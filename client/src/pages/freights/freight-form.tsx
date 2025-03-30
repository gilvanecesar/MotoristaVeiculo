import { useState, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Truck } from "lucide-react";
import { useClientAuth } from "@/lib/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  VEHICLE_TYPES, 
  BODY_TYPES, 
  CARGO_TYPES, 
  TARP_OPTIONS, 
  TOLL_OPTIONS, 
  FreightWithDestinations
} from "@shared/schema";
import { freightFormSchema } from "@/lib/validation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { 
  getVehicleTypeDisplay, 
  getBodyTypeDisplay,
  getVehicleCategory,
  getVehicleCategoryDisplay,
  VEHICLE_CATEGORIES,
  VEHICLE_TYPES_BY_CATEGORY
} from "@/lib/utils/vehicle-types";
import { StateSelect } from "@/components/state-select";
import { CitySelect } from "@/components/city-select";

// Brazilian states para fallback caso a API do IBGE falhe
const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

// Destination form schema
const destinationSchema = z.object({
  destination: z.string().min(3, "Informe o destino"),
  destinationState: z.string().min(2, "Selecione o estado"),
  order: z.number().int().positive(),
});

// Use the imported freight form schema 
// and create a destination schema separately
type FreightFormValues = z.infer<typeof freightFormSchema>;
type DestinationFormValues = z.infer<typeof destinationSchema>;

export default function FreightForm() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const isEditMode = searchParams.get('edit') === 'true';
  const isEditing = !!params.id;
  const isViewingInReadOnlyMode = isEditing && !isEditMode;
  const freightId = parseInt(params.id || "0");
  const [destinations, setDestinations] = useState<DestinationFormValues[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentClient } = useClientAuth();
  const { user } = useAuth();

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: true,
  });

  // Fetch freight data for editing
  const { data: freight, isLoading } = useQuery({
    queryKey: ['/api/freights', freightId],
    enabled: isEditing,
  });

  // Fetch destinations if freight has multiple destinations
  const { data: freightDestinations = [] } = useQuery({
    queryKey: ['/api/freight-destinations', { freightId }],
    queryFn: async () => {
      const res = await fetch(`/api/freight-destinations?freightId=${freightId}`);
      if (!res.ok) throw new Error("Failed to fetch destinations");
      return await res.json();
    },
    enabled: isEditing && freight?.hasMultipleDestinations === true,
  });

  const form = useForm<FreightFormValues>({
    resolver: zodResolver(freightFormSchema),
    defaultValues: {
      origin: "",
      originState: "",
      destination: "",
      destinationState: "",
      cargoType: CARGO_TYPES.COMPLETA,
      needsTarp: TARP_OPTIONS.NAO,
      productType: "",
      cargoWeight: 0,
      vehicleType: VEHICLE_TYPES.LEVE_TODOS,
      vehicleCategory: VEHICLE_CATEGORIES.LEVE,
      bodyType: BODY_TYPES.BAU,
      freightValue: 0,
      tollOption: TOLL_OPTIONS.INCLUSO,
      paymentMethod: "Vista",
      observations: "",
      clientId: null,
      status: "aberto",
      hasMultipleDestinations: false,
      contactName: "",
      contactPhone: "",
    },
  });

  const hasMultipleDestinations = form.watch("hasMultipleDestinations");

  // Definir o cliente autenticado como o cliente do frete quando estiver criando um novo frete
  useEffect(() => {
    if (currentClient && !isEditing) {
      form.setValue("clientId", currentClient.id);
    } else if (user?.clientId && !isEditing) {
      // Se não tem cliente atual mas o usuário tem um clientId associado,
      // usamos o clientId do usuário logado
      form.setValue("clientId", user.clientId);
    } else if (isEditing && freight?.clientId) {
      // Se estamos editando, mantemos o cliente original do frete
      form.setValue("clientId", freight.clientId);
    }
  }, [currentClient, user, isEditing, form, freight]);

  useEffect(() => {
    if (freight && !isLoading) {
      // Format values for the form
      const formattedFreight = {
        ...freight,
        cargoWeight: Number(freight.cargoWeight),
        freightValue: Number(freight.freightValue),
        // Determinar a categoria com base no tipo de veículo
        vehicleCategory: getVehicleCategory(freight.vehicleType),
      };
      form.reset(formattedFreight);
      
      // Inicializar os tipos de veículos selecionados
      // Aqui estamos usando o vehicleType individual, mas poderia ser adaptado para múltiplos tipos
      setSelectedVehicleTypes([freight.vehicleType]);
    }
  }, [freight, isLoading, form]);

  useEffect(() => {
    if (freightDestinations) {
      setDestinations(freightDestinations);
    }
  }, [freightDestinations]);

  const addDestination = () => {
    const newOrder = destinations.length > 0 
      ? Math.max(...destinations.map(d => d.order)) + 1 
      : 1;
    
    setDestinations([
      ...destinations,
      { destination: "", destinationState: "", order: newOrder }
    ]);
  };

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const updateDestination = (index: number, field: keyof DestinationFormValues, value: any) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value
    };
    setDestinations(updatedDestinations);
  };

  const onSubmit = async (data: FreightFormValues) => {
    // Se estiver no modo somente leitura, não submeter o formulário
    if (isViewingInReadOnlyMode) {
      return;
    }
    try {
      // Verificar se um cliente foi selecionado
      if (!data.clientId) {
        toast({
          title: "Erro no formulário",
          description: "É necessário selecionar um cliente para o frete",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se pelo menos um tipo de veículo foi selecionado
      if (selectedVehicleTypes.length === 0) {
        toast({
          title: "Erro no formulário",
          description: "É necessário selecionar pelo menos um tipo de veículo",
          variant: "destructive",
        });
        return;
      }
      
      // Usar o primeiro tipo de veículo selecionado como o principal para o campo vehicleType
      // mantendo compatibilidade com sistemas existentes que esperam um único tipo
      // Os outros tipos selecionados estão disponíveis no array selectedVehicleTypes se necessário
      
      // Add destinations to the form data if has multiple destinations
      const submitData = {
        ...data,
        // Garantir que os campos numéricos sejam enviados como string
        cargoWeight: String(data.cargoWeight),
        freightValue: String(data.freightValue),
        // Garantir que status seja enviado
        status: data.status || "aberto",
        // Usar o primeiro tipo de veículo selecionado como principal
        vehicleType: selectedVehicleTypes[0] || data.vehicleType,
        // Adicionar meta-informação com todos os veículos selecionados (como string separada por vírgula)
        vehicleTypesSelected: selectedVehicleTypes.join(',')
      };

      // For create or update
      let response;
      if (isEditing) {
        response = await apiRequest(
          `/api/freights/${freightId}`,
          'PUT',
          submitData
        );

        // Handle destinations separately for editing
        if (data.hasMultipleDestinations) {
          // Remove existing destinations first (will re-add them)
          if (freightDestinations && freightDestinations.length > 0) {
            for (const dest of freightDestinations) {
              await fetch(`/api/freight-destinations/${dest.id}`, {
                method: 'DELETE',
              });
            }
          }

          // Add new destinations
          for (const dest of destinations) {
            await apiRequest(
              'POST',
              `/api/freight-destinations`,
              { ...dest, freightId }
            );
          }
        }
      } else {
        response = await apiRequest(
          'POST',
          '/api/freights',
          submitData
        );

        // Handle destinations separately for new freight
        if (data.hasMultipleDestinations && response) {
          for (const dest of destinations) {
            await apiRequest(
              'POST',
              `/api/freight-destinations`,
              { ...dest, freightId: response.id }
            );
          }
        }
      }

      toast({
        title: isEditing ? "Frete atualizado" : "Frete criado",
        description: isEditing 
          ? "As alterações foram salvas com sucesso."
          : "O novo frete foi cadastrado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/freights'] });
      navigate("/freights");
    } catch (error) {
      console.error("Error saving freight:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o frete. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/freights")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Frete" : "Novo Frete"}
            </h1>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Frete</CardTitle>
          <CardDescription>
            Preencha as informações sobre o frete e a carga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {isViewingInReadOnlyMode && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4">
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    Você está visualizando este frete no modo somente leitura. Clique em "Editar Frete" para fazer alterações.
                  </p>
                </div>
              )}
              <fieldset disabled={isViewingInReadOnlyMode}>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Client Selection */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value !== "null" ? parseInt(value) : null)}
                        disabled={(currentClient !== null || user?.clientId !== null) && !isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {currentClient && !isEditing ? (
                              <div className="text-foreground">{currentClient.name}</div>
                            ) : user?.clientId && !isEditing && clients ? (
                              <div className="text-foreground">
                                {clients.find((c: any) => c.id === user.clientId)?.name || "Cliente do usuário"}
                              </div>
                            ) : field.value && clients ? (
                              <div className="text-foreground">
                                {clients.find((c: any) => c.id === field.value)?.name || "Cliente selecionado"}
                              </div>
                            ) : (
                              <SelectValue placeholder="Selecione um cliente" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(currentClient || user?.clientId) && !isEditing && (
                        <FormDescription>
                          {currentClient ? (
                            <>O frete será associado automaticamente ao cliente logado ({currentClient.name})</>
                          ) : user?.clientId && clients ? (
                            <>O frete será associado automaticamente ao seu cliente ({clients.find((c: any) => c.id === user.clientId)?.name || "Cliente associado"})</>
                          ) : null}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status Selection */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Frete</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Origem e Destino</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Origin State */}
                <FormField
                  control={form.control}
                  name="originState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Origem</FormLabel>
                      <FormControl>
                        <StateSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione o estado de origem"
                          errorMessage={form.formState.errors.originState?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Origin City */}
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade de Origem</FormLabel>
                      <FormControl>
                        <CitySelect
                          state={form.watch("originState")}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione a cidade de origem"
                          disabled={!form.watch("originState")}
                          errorMessage={form.formState.errors.origin?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multiple Destinations Checkbox */}
                <FormField
                  control={form.control}
                  name="hasMultipleDestinations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-full">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Frete com múltiplos destinos</FormLabel>
                        <FormDescription>
                          Marque esta opção se o frete possuir mais de um destino
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Primary Destination */}
                {!hasMultipleDestinations ? (
                  <>
                    <FormField
                      control={form.control}
                      name="destinationState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado de Destino</FormLabel>
                          <FormControl>
                            <StateSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione o estado de destino"
                              errorMessage={form.formState.errors.destinationState?.message}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade de Destino</FormLabel>
                          <FormControl>
                            <CitySelect
                              state={form.watch("destinationState")}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione a cidade de destino"
                              disabled={!form.watch("destinationState")}
                              errorMessage={form.formState.errors.destination?.message}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <div className="col-span-full">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Destinos</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addDestination}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Destino
                      </Button>
                    </div>
                    
                    {destinations.length === 0 ? (
                      <div className="text-center py-6 border rounded-md bg-slate-50 dark:bg-slate-800">
                        <p className="text-sm text-slate-500">
                          Nenhum destino adicionado. Clique no botão acima para adicionar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {destinations.map((dest, index) => (
                          <div 
                            key={index} 
                            className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800"
                          >
                            <div className="md:col-span-2">
                              <FormLabel>Estado</FormLabel>
                              <StateSelect
                                value={dest.destinationState}
                                onChange={(value) => updateDestination(index, 'destinationState', value)}
                                placeholder="Selecione o estado"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <FormLabel>Cidade</FormLabel>
                              <CitySelect
                                state={dest.destinationState}
                                value={dest.destination}
                                onChange={(value) => updateDestination(index, 'destination', value)}
                                placeholder="Selecione a cidade de destino"
                                disabled={!dest.destinationState}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeDestination(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Informações da Carga</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {/* Cargo Type */}
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carga</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de carga" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CARGO_TYPES.COMPLETA}>Carga Completa</SelectItem>
                          <SelectItem value={CARGO_TYPES.COMPLEMENTO}>Complemento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Needs Tarp */}
                <FormField
                  control={form.control}
                  name="needsTarp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precisa de Lona?</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Lona necessária?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TARP_OPTIONS.SIM}>Sim</SelectItem>
                          <SelectItem value={TARP_OPTIONS.NAO}>Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Type */}
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Grãos, Móveis, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cargo Weight */}
                <FormField
                  control={form.control}
                  name="cargoWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso da Carga (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Peso em kg" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Informações de Contato</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Contact Name */}
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da pessoa de contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Phone */}
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone de Contato (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Este número será usado para contato via WhatsApp
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Veículo e Valores</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {/* Vehicle Category */}
                <FormField
                  control={form.control}
                  name="vehicleCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de Veículo</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Ao mudar categoria, limpar a seleção atual e selecionar "todos" dessa categoria
                          if (value === VEHICLE_CATEGORIES.LEVE) {
                            setSelectedVehicleTypes([VEHICLE_TYPES.LEVE_TODOS]);
                            form.setValue("vehicleType", VEHICLE_TYPES.LEVE_TODOS);
                          } else if (value === VEHICLE_CATEGORIES.MEDIO) {
                            setSelectedVehicleTypes([VEHICLE_TYPES.MEDIO_TODOS]);
                            form.setValue("vehicleType", VEHICLE_TYPES.MEDIO_TODOS);
                          } else if (value === VEHICLE_CATEGORIES.PESADO) {
                            setSelectedVehicleTypes([VEHICLE_TYPES.PESADO_TODOS]);
                            form.setValue("vehicleType", VEHICLE_TYPES.PESADO_TODOS);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={VEHICLE_CATEGORIES.LEVE}>
                            {getVehicleCategoryDisplay(VEHICLE_CATEGORIES.LEVE)}
                          </SelectItem>
                          <SelectItem value={VEHICLE_CATEGORIES.MEDIO}>
                            {getVehicleCategoryDisplay(VEHICLE_CATEGORIES.MEDIO)}
                          </SelectItem>
                          <SelectItem value={VEHICLE_CATEGORIES.PESADO}>
                            {getVehicleCategoryDisplay(VEHICLE_CATEGORIES.PESADO)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione primeiro a categoria do veículo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Vehicle Types - Multiple Selection */}
                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Tipos de Veículo</FormLabel>
                    <div className="w-full border rounded-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {form.watch("vehicleCategory") === VEHICLE_CATEGORIES.LEVE && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-leve-todos"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_TODOS)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Adicionar ao array
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.LEVE_TODOS]);
                                  // Para compatibilidade, também definir no form
                                  form.setValue("vehicleType", VEHICLE_TYPES.LEVE_TODOS);
                                } else {
                                  // Remover do array
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.LEVE_TODOS));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-leve-todos" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.LEVE_TODOS)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-leve-fiorino"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_FIORINO)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.LEVE_FIORINO]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.LEVE_FIORINO);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.LEVE_FIORINO));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-leve-fiorino" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.LEVE_FIORINO)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-leve-toco"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_TOCO)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.LEVE_TOCO]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.LEVE_TOCO);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.LEVE_TOCO));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-leve-toco" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.LEVE_TOCO)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-leve-vlc"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_VLC)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.LEVE_VLC]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.LEVE_VLC);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.LEVE_VLC));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-leve-vlc" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.LEVE_VLC)}
                            </label>
                          </div>
                        </>
                      )}
                      
                      {form.watch("vehicleCategory") === VEHICLE_CATEGORIES.MEDIO && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-medio-todos"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_TODOS)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.MEDIO_TODOS]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.MEDIO_TODOS);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.MEDIO_TODOS));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-medio-todos" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.MEDIO_TODOS)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-medio-bitruck"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_BITRUCK)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.MEDIO_BITRUCK]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.MEDIO_BITRUCK);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.MEDIO_BITRUCK));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-medio-bitruck" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.MEDIO_BITRUCK)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-medio-truck"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_TRUCK)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.MEDIO_TRUCK]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.MEDIO_TRUCK);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.MEDIO_TRUCK));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-medio-truck" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.MEDIO_TRUCK)}
                            </label>
                          </div>
                        </>
                      )}
                      
                      {form.watch("vehicleCategory") === VEHICLE_CATEGORIES.PESADO && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-todos"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_TODOS)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_TODOS]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_TODOS);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_TODOS));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-todos" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_TODOS)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-bitrem"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_BITREM)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_BITREM]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_BITREM);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_BITREM));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-bitrem" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_BITREM)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-carreta"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_CARRETA)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_CARRETA]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_CARRETA);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_CARRETA));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-carreta" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_CARRETA)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-carreta-ls"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_CARRETA_LS)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_CARRETA_LS]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_CARRETA_LS);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_CARRETA_LS));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-carreta-ls" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_CARRETA_LS)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-rodotrem"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_RODOTREM)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_RODOTREM]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_RODOTREM);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_RODOTREM));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-rodotrem" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_RODOTREM)}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vehicle-pesado-vanderleia"
                              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_VANDERLEIA)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVehicleTypes(prev => [...prev, VEHICLE_TYPES.PESADO_VANDERLEIA]);
                                  form.setValue("vehicleType", VEHICLE_TYPES.PESADO_VANDERLEIA);
                                } else {
                                  setSelectedVehicleTypes(prev => prev.filter(t => t !== VEHICLE_TYPES.PESADO_VANDERLEIA));
                                }
                              }}
                            />
                            <label htmlFor="vehicle-pesado-vanderleia" className="text-sm font-medium leading-none cursor-pointer">
                              {getVehicleTypeDisplay(VEHICLE_TYPES.PESADO_VANDERLEIA)}
                            </label>
                          </div>
                        </>
                      )}
                      
                      {!form.watch("vehicleCategory") && (
                        <div className="col-span-full text-center py-3 text-sm text-muted-foreground">
                          Selecione uma categoria de veículo primeiro
                        </div>
                      )}
                    </div>
                    {form.formState.errors.vehicleType && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.vehicleType.message}
                      </p>
                    )}
                    
                    {selectedVehicleTypes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Tipos de veículo selecionados:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedVehicleTypes.map((type) => (
                            <div key={type} className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs flex items-center">
                              {getVehicleTypeDisplay(type)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormItem>
                </div>

                {/* Body Type */}
                <FormField
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carroceria</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={BODY_TYPES.BAU}>
                            {getBodyTypeDisplay(BODY_TYPES.BAU)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.GRANELEIRA}>
                            {getBodyTypeDisplay(BODY_TYPES.GRANELEIRA)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.BASCULANTE}>
                            {getBodyTypeDisplay(BODY_TYPES.BASCULANTE)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.PLATAFORMA}>
                            {getBodyTypeDisplay(BODY_TYPES.PLATAFORMA)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.TANQUE}>
                            {getBodyTypeDisplay(BODY_TYPES.TANQUE)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.FRIGORIFICA}>
                            {getBodyTypeDisplay(BODY_TYPES.FRIGORIFICA)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.PORTA_CONTEINER}>
                            {getBodyTypeDisplay(BODY_TYPES.PORTA_CONTEINER)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.SIDER}>
                            {getBodyTypeDisplay(BODY_TYPES.SIDER)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.CACAMBA}>
                            {getBodyTypeDisplay(BODY_TYPES.CACAMBA)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.ABERTA}>
                            {getBodyTypeDisplay(BODY_TYPES.ABERTA)}
                          </SelectItem>
                          <SelectItem value={BODY_TYPES.FECHADA}>
                            {getBodyTypeDisplay(BODY_TYPES.FECHADA)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Freight Value */}
                <FormField
                  control={form.control}
                  name="freightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Toll Option */}
                <FormField
                  control={form.control}
                  name="tollOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pedágio</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Opção de pedágio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TOLL_OPTIONS.INCLUSO}>Incluso no Valor</SelectItem>
                          <SelectItem value={TOLL_OPTIONS.A_PARTE}>À Parte</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: À Vista, 28 DDL, etc" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome da pessoa de contato" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Contato (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Será usado como contato de WhatsApp
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observations */}
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o frete..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Até 500 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/freights")}
                >
                  Cancelar
                </Button>
                
                {isViewingInReadOnlyMode ? (
                  <Button 
                    type="button"
                    onClick={() => navigate(`/freights/${freightId}?edit=true`)}
                  >
                    Editar Frete
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={isViewingInReadOnlyMode}
                  >
                    {isEditing ? "Salvar Alterações" : "Criar Frete"}
                  </Button>
                )}
              </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}