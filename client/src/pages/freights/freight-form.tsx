import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute, useParams, useSearch } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFreightSchema, VEHICLE_TYPES, BODY_TYPES, TOLL_OPTIONS } from "@shared/schema";
import {
  VEHICLE_CATEGORIES,
  VEHICLE_TYPES_BY_CATEGORY,
  getVehicleCategoryDisplay,
  getVehicleTypeDisplay,
  getVehicleTypeNameOnly,
  getVehicleCategory,
  getBodyTypeDisplay,
} from "@/lib/utils/vehicle-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash, X } from "lucide-react";
import { Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useClientAuth } from "@/lib/auth-context";
import LocationInput from "@/components/location/location-input";
import NumberInput from "@/components/ui/number-input";
import StateSelect from "@/components/location/state-select";
import CitySelect from "@/components/location/city-select";

const freightSchema = insertFreightSchema
  .omit({
    createdAt: true,
    expirationDate: true,
  })
  .extend({
    destinationState: z.string().min(2, "Selecione o estado de destino").optional(),
    destination: z.string().min(2, "Selecione a cidade de destino").optional(),
    cargoWeight: z.string().refine(
      (val) => !val || !isNaN(parseFloat(val)),
      { message: "Peso da carga deve ser um número válido" }
    ),
    freightValue: z.string().refine(
      (val) => !val || !isNaN(parseFloat(val)),
      { message: "Valor do frete deve ser um número válido" }
    ),
  })
  .refine(
    (data) => {
      // Verificar se existe pelo menos um destino informado
      // Este código será modificado para verificar o array de destinations mais tarde
      return data.destinationState && data.destination;
    },
    {
      message: "Informe o destino principal ou adicione destinos adicionais",
      path: ["destination"],
    }
  );

// Validação para destinos múltiplos
const destinationSchema = z.object({
  destinationState: z.string().min(2, "Selecione o estado"),
  destination: z.string().min(2, "Selecione a cidade"),
  id: z.number().optional(), // ID temporário para manipulação da interface
});

// Tipos inferidos do schema
type FreightFormValues = z.infer<typeof freightSchema>;
type DestinationFormValues = z.infer<typeof destinationSchema>;

export default function FreightForm() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [search] = useSearch();
  const searchParams = new URLSearchParams(search);
  const isEditing = Boolean(params.id);
  const freightId = params.id;

  // Inicia como somente leitura apenas se estiver editando e sem parâmetro de edição
  // Será atualizado após carregar os dados do frete
  const [isViewingInReadOnlyMode, setIsViewingInReadOnlyMode] = useState(
    isEditing && !searchParams.get("edit")
  );
  
  // Atualiza o modo de visualização quando o parâmetro "edit" na URL muda
  useEffect(() => {
    // Verifica se tem o parâmetro "edit=true" na URL
    const isEditMode = isEditing && searchParams.get("edit") === "true";
    // Se estiver no modo de edição, desativa o modo somente leitura
    if (isEditMode) {
      setIsViewingInReadOnlyMode(false);
    }
  }, [searchParams, isEditing]);

  const { user } = useAuth();
  const { currentClient, isClientAuthorized } = useClientAuth();

  const [isLoadingFreight, setIsLoadingFreight] = useState(isEditing);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [freightDestinations, setFreightDestinations] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<DestinationFormValues[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);

  const defaultValues: FreightFormValues = {
    clientId: user?.clientId || currentClient?.id || undefined, // Usar ID do cliente do usuário ou cliente atual
    origin: "",
    originState: "",
    destination: "",
    destinationState: "",
    cargoType: "completa",
    needsTarp: "nao",
    productType: "",
    cargoWeight: "0", // Garantindo que seja uma string "0" em vez de string vazia
    vehicleCategory: VEHICLE_CATEGORIES.LEVE,
    vehicleType: VEHICLE_TYPES.LEVE_TODOS,
    bodyType: BODY_TYPES.BAU,
    freightValue: "0", // Garantindo que seja uma string "0" em vez de string vazia
    tollOption: TOLL_OPTIONS.INCLUSO,
    paymentMethod: "",
    observations: "",
    status: "aberto",
    contactName: "",
    contactPhone: "",
  };

  const form = useForm<FreightFormValues>({
    resolver: zodResolver(freightSchema),
    defaultValues,
  });

  // Agora sempre tratamos como se pudesse ter múltiplos destinos
  const hasMultipleDestinations = true;

  // Criar uma função para adicionar destinos
  const addDestination = () => {
    // Adicionamos um ID temporário único para ajudar com a estabilidade da lista e rastreamento
    const newDestination = { 
      destinationState: "", 
      destination: "", 
      // Usar timestamp como ID temporário
      id: Date.now()
    };
    
    // Fazer uma cópia do array atual e adicionar o novo destino
    const updatedDestinations = [...destinations, newDestination];
    setDestinations(updatedDestinations);
    
    // Log para debug
    console.log("Destino adicionado:", newDestination);
    console.log("Total de destinos:", updatedDestinations.length);
  };

  // Criar uma função para atualizar um destino
  const updateDestination = (index: number, field: keyof DestinationFormValues, value: string) => {
    console.log(`Atualizando destino ${index}, campo ${field} para ${value}`);
    const updatedDestinations = [...destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value,
    };
    setDestinations(updatedDestinations);
    console.log("Destino atualizado:", updatedDestinations[index]);
  };

  // Criar uma função para remover um destino
  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  // Carregar clientes
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Carregar frete para edição
  useEffect(() => {
    if (isEditing && freightId) {
      const loadFreight = async () => {
        try {
          const res = await fetch(`/api/freights/${freightId}`);
          if (res.ok) {
            const freight = await res.json();
            console.log("Carregando frete para edição:", [freight]);

            // Verificar se tem permissão para editar - apenas admin ou dono do frete
            const canEditFreight = isClientAuthorized(freight.clientId);
            
            // Se não tem autorização para editar, mostrar em modo somente leitura
            // Mesmo que o parâmetro edit esteja na URL
            if (!canEditFreight) {
              toast({
                title: "Modo somente leitura",
                description: "Você não tem permissão para editar este frete.",
                variant: "destructive",
              });
              // Ativar modo somente leitura independente da URL
              setIsViewingInReadOnlyMode(true);
            } else if (searchParams.get("edit") === "true") {
              // Se tem autorização e o parâmetro edit=true está na URL, desativar modo somente leitura
              console.log("Desativando modo somente leitura por edit=true na URL");
              setIsViewingInReadOnlyMode(false);
            }

            // Configurar form com dados do frete
            form.reset({
              ...freight,
              clientId: freight.clientId,
              cargoWeight: freight.cargoWeight,
              freightValue: freight.freightValue,
              vehicleCategory: getVehicleCategory(freight.vehicleType),
            });

            // Configurar tipos de veículos
            let vehicleTypesArray: string[] = [];
            if (freight.vehicleTypesSelected) {
              // Se tem lista de tipos selecionados, usa ela
              vehicleTypesArray = freight.vehicleTypesSelected.split(',');
            } else {
              // Senão, usa só o tipo principal
              vehicleTypesArray = [freight.vehicleType];
            }
            setSelectedVehicleTypes(vehicleTypesArray);

            // Configurar tipos de carroceria
            let bodyTypesArray: string[] = [];
            if (freight.bodyTypesSelected) {
              // Se tem lista de tipos selecionados, usa ela
              bodyTypesArray = freight.bodyTypesSelected.split(',');
            } else {
              // Senão, usa só o tipo principal
              bodyTypesArray = [freight.bodyType];
            }
            setSelectedBodyTypes(bodyTypesArray);

            // Configurar destinos
            if (freight.destinations && freight.destinations.length > 0) {
              setFreightDestinations(freight.destinations);
              
              // Transformar os destinos do formato do BD para o formato do formulário
              const formattedDestinations = freight.destinations.map((dest: any) => ({
                destinationState: dest.destinationState,
                destination: dest.destination,
                id: dest.id || Date.now() // Usar o ID do banco se disponível, senão gerar um temporário
              }));
              
              console.log("Destinos formatados:", formattedDestinations);
              setDestinations(formattedDestinations);
            }
          } else {
            toast({
              title: "Erro ao carregar",
              description: "Não foi possível carregar as informações do frete.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Erro ao carregar frete:", error);
          toast({
            title: "Erro ao carregar",
            description: "Ocorreu um erro ao carregar as informações do frete.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingFreight(false);
        }
      };

      loadFreight();
    } else {
      // Se não for edição, verificar se tem cliente logado e pré-selecionar
      if (currentClient) {
        form.setValue("clientId", currentClient.id);
      } else if (user && user.clientId) {
        form.setValue("clientId", user.clientId);
      }
      
      // Inicializar tipos de veículo
      setSelectedVehicleTypes([VEHICLE_TYPES.LEVE_TODOS]);
      
      // Inicializar tipos de carroceria
      setSelectedBodyTypes([BODY_TYPES.BAU]);
      
      setIsLoadingFreight(false);
    }
  }, [isEditing, freightId, form, currentClient, user, navigate, isClientAuthorized]);

  const onSubmit = async (data: FreightFormValues) => {
    try {
      if (isViewingInReadOnlyMode) {
        // Evitar submissão no modo somente leitura
        toast({
          title: "Modo somente leitura",
          description: "Você precisa clicar em 'Editar Frete' antes de salvar alterações.",
          variant: "destructive",
        });
        return;
      }
      
      // Usar o primeiro tipo de veículo selecionado como o principal para o campo vehicleType
      // mantendo compatibilidade com sistemas existentes que esperam um único tipo
      
      // Verificar se pelo menos um tipo de carroceria foi selecionado
      if (selectedBodyTypes.length === 0) {
        toast({
          title: "Erro no formulário",
          description: "É necessário selecionar pelo menos um tipo de carroceria",
          variant: "destructive",
        });
        return;
      }

      // Verificar se todos os destinos adicionais têm cidade e estado preenchidos
      if (destinations.length > 0) {
        const incompleteDestination = destinations.find(dest => !dest.destination || !dest.destinationState);
        if (incompleteDestination) {
          toast({
            title: "Erro no formulário",
            description: "Todos os destinos adicionados precisam ter cidade e estado preenchidos.",
            variant: "destructive",
          });
          return;
        }
      }

      // Add destinations to the form data if has multiple destinations
      const submitData = {
        ...data,
        // Garantir que os campos numéricos sejam enviados como string e não sejam NaN
        cargoWeight: data.cargoWeight ? String(data.cargoWeight) : "0",
        freightValue: data.freightValue ? String(data.freightValue) : "0",
        // Garantir que status seja enviado
        status: data.status || "aberto",
        // Usar o primeiro tipo de veículo selecionado como principal
        vehicleType: selectedVehicleTypes[0] || data.vehicleType,
        // Adicionar meta-informação com todos os veículos selecionados (como string separada por vírgula)
        vehicleTypesSelected: selectedVehicleTypes.join(','),
        // Usar o primeiro tipo de carroceria selecionado como principal
        bodyType: selectedBodyTypes[0] || data.bodyType,
        // Adicionar meta-informação com todos os tipos de carroceria selecionados
        bodyTypesSelected: selectedBodyTypes.join(',')
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
        // Remove existing destinations first (will re-add them)
        if (freightDestinations && freightDestinations.length > 0) {
          for (const dest of freightDestinations) {
            await fetch(`/api/freight-destinations/${dest.id}`, {
              method: 'DELETE',
            });
          }
        }

        // Add new destinations
        try {
          for (const dest of destinations) {
            // Enviar apenas os campos necessários para o destino
            await apiRequest(
              'POST',
              `/api/freight-destinations`,
              {
                destination: dest.destination,
                destinationState: dest.destinationState,
                freightId
              }
            );
          }
        } catch (error) {
          console.error("Erro ao adicionar destino:", error);
          toast({
            title: "Erro ao adicionar destinos",
            description: error instanceof Error ? error.message : "Erro ao adicionar destinos ao frete",
            variant: "destructive",
          });
        }
      } else {
        response = await apiRequest(
          'POST',
          '/api/freights',
          submitData
        );

        // Handle destinations separately for new freight
        if (response && destinations.length > 0) {
          try {
            for (const dest of destinations) {
              // Enviar apenas os campos necessários para o destino
              await apiRequest(
                'POST',
                `/api/freight-destinations`,
                {
                  destination: dest.destination,
                  destinationState: dest.destinationState,
                  freightId: response.id
                }
              );
            }
          } catch (error) {
            console.error("Erro ao adicionar destino para novo frete:", error);
            toast({
              title: "Erro ao adicionar destinos",
              description: error instanceof Error ? error.message : "Erro ao adicionar destinos ao frete",
              variant: "destructive",
            });
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
                        value={field.value?.toString() || "0"}
                        onValueChange={(value) => field.onChange(parseInt(value) || 0)}
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
                {/* Origin Location */}
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => {
                    // Criar um string combinado para exibição se o formulário já tem data
                    let combinedValue = field.value || "";
                    const originState = form.watch("originState");
                    
                    if (field.value && originState && !combinedValue.includes(" - ")) {
                      combinedValue = `${field.value} - ${originState}`;
                    }
                    
                    return (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <LocationInput
                            value={combinedValue}
                            onChange={(value) => {
                              // Se o valor contiver a formatação Cidade - UF
                              if (value.includes(" - ")) {
                                const [city, state] = value.split(" - ");
                                field.onChange(city);
                                form.setValue("originState", state);
                              } else {
                                // Caso tenha apenas a cidade
                                field.onChange(value);
                              }
                            }}
                            placeholder="Digite a cidade e estado (ex: Contagem - MG)"
                            errorMessage={form.formState.errors.origin?.message}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Multiple Destinations Checkbox foi removido para simplificar a interface */}

                {/* Destination Section - Always show destinations section */}
                <div className="col-span-full">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Destinos</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addDestination}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Destino
                    </Button>
                  </div>
                  
                  {/* Primary Destination - Always show this */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => {
                      // Criar um string combinado para exibição se o formulário já tem data
                      let combinedValue = field.value || "";
                      const destinationState = form.watch("destinationState");
                      
                      if (field.value && destinationState && !combinedValue.includes(" - ")) {
                        combinedValue = `${field.value} - ${destinationState}`;
                      }
                      
                      return (
                        <FormItem className="mb-4">
                          <FormLabel>Destino Principal</FormLabel>
                          <FormControl>
                            <LocationInput
                              value={combinedValue}
                              onChange={(value) => {
                                // Se o valor contiver a formatação Cidade - UF
                                if (value.includes(" - ")) {
                                  const [city, state] = value.split(" - ");
                                  field.onChange(city);
                                  form.setValue("destinationState", state);
                                } else {
                                  // Caso tenha apenas a cidade
                                  field.onChange(value);
                                }
                              }}
                              placeholder="Digite a cidade e estado (ex: Belo Horizonte - MG)"
                              errorMessage={form.formState.errors.destination?.message}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  
                  {/* Additional Destinations */}
                  {destinations.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Destinos Adicionais</h5>
                      {destinations.map((dest, index) => (
                        <div 
                          key={dest.id || index} 
                          className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800"
                        >
                          <div className="md:col-span-4">
                            <FormLabel>Destino {index + 1}</FormLabel>
                            <LocationInput
                              value={dest.destination && dest.destinationState ? `${dest.destination} - ${dest.destinationState}` : ""}
                              onChange={(value) => {
                                console.log(`Destino ${index} alterado para: ${value}`);
                                // Se o valor contiver a formatação Cidade - UF
                                if (value.includes(" - ")) {
                                  const parts = value.split(" - ");
                                  if (parts.length === 2) {
                                    const city = parts[0];
                                    const state = parts[1];
                                    
                                    if (city && state) {
                                      // Importante: Criar um novo objeto de destino para evitar atualizações consecutivas
                                      const updatedDest = {
                                        ...dest,
                                        destination: city,
                                        destinationState: state
                                      };
                                      
                                      // Atualizar o array de destinos diretamente
                                      const updatedDestinations = [...destinations];
                                      updatedDestinations[index] = updatedDest;
                                      setDestinations(updatedDestinations);
                                      
                                      console.log(`Destino ${index} atualizado para: cidade=${city}, estado=${state}`);
                                    }
                                  }
                                }
                              }}
                              placeholder="Digite a cidade e estado (ex: São Paulo - SP)"
                              errorMessage={!dest.destination || !dest.destinationState ? "Selecione uma cidade com estado" : ""}
                            />
                          </div>
                          <div className="flex items-end justify-end h-full md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDestination(index)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Vehicle Types - Multiple Selection */}
                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Tipos de Veículo</FormLabel>
                    <div className="w-full border rounded-md p-4">
                      {Object.entries(VEHICLE_CATEGORIES).map((categoryEntry) => {
                        const [categoryKey, categoryValue] = categoryEntry;
                        const vehicleTypes = VEHICLE_TYPES_BY_CATEGORY[categoryValue];
                        
                        return (
                          <div key={categoryKey} className="mb-4">
                            <h4 className="text-sm font-semibold mb-2">
                              {getVehicleCategoryDisplay(categoryValue)}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {vehicleTypes.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`vehicle-type-${type}`}
                                    checked={selectedVehicleTypes.includes(type)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedVehicleTypes(prev => [...prev, type]);
                                        form.setValue("vehicleType", type); // Para compatibilidade
                                        
                                        // Atualiza a categoria do veículo com base no tipo selecionado
                                        form.setValue("vehicleCategory", getVehicleCategory(type));
                                      } else {
                                        setSelectedVehicleTypes(prev => prev.filter(t => t !== type));
                                        // Se removeu o que estava selecionado principal e ainda tem outros, seleciona o primeiro
                                        if (form.getValues("vehicleType") === type && selectedVehicleTypes.length > 1) {
                                          const remaining = selectedVehicleTypes.filter(t => t !== type);
                                          form.setValue("vehicleType", remaining[0]);
                                          form.setValue("vehicleCategory", getVehicleCategory(remaining[0]));
                                        }
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`vehicle-type-${type}`} 
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {getVehicleTypeNameOnly(type)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
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
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completa">Carga Completa</SelectItem>
                          <SelectItem value="fracionada">Carga Fracionada</SelectItem>
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
                        <Input 
                          placeholder="Ex: Caixas, Grãos, etc" 
                          {...field} 
                        />
                      </FormControl>
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
                      <FormLabel>Necessita Lona?</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormLabel>Peso da Carga (toneladas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Se o valor for vazio, definir como vazio (não NaN)
                            if (!value.trim()) {
                              field.onChange('');
                              return;
                            }
                            // Remove caracteres não numéricos, exceto ponto ou vírgula
                            const cleanValue = value.replace(/[^\d.,]/g, '');
                            // Substitui vírgula por ponto para cálculos em JavaScript
                            const normalizedValue = cleanValue.replace(/,/g, '.');
                            field.onChange(normalizedValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Body Type - Multiple Selection */}
                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Tipos de Carroceria</FormLabel>
                    <div className="w-full border rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(BODY_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`body-type-${key}`}
                            checked={selectedBodyTypes.includes(value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBodyTypes(prev => [...prev, value]);
                                form.setValue("bodyType", value); // Para compatibilidade
                              } else {
                                setSelectedBodyTypes(prev => prev.filter(t => t !== value));
                                // Se removeu o que estava selecionado principal e ainda tem outros, seleciona o primeiro
                                if (form.getValues("bodyType") === value && selectedBodyTypes.length > 1) {
                                  const remaining = selectedBodyTypes.filter(t => t !== value);
                                  form.setValue("bodyType", remaining[0]);
                                }
                              }
                            }}
                          />
                          <label 
                            htmlFor={`body-type-${key}`} 
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {getBodyTypeDisplay(value)}
                          </label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.bodyType && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.bodyType.message}
                      </p>
                    )}
                    
                    {selectedBodyTypes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Tipos de carroceria selecionados:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedBodyTypes.map((type) => (
                            <div key={type} className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs flex items-center">
                              {getBodyTypeDisplay(type)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormItem>
                </div>

                {/* Freight Value */}
                <FormField
                  control={form.control}
                  name="freightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Se o valor for vazio, definir como vazio (não NaN)
                            if (!value.trim()) {
                              field.onChange('');
                              return;
                            }
                            // Remove caracteres não numéricos, exceto ponto ou vírgula
                            const cleanValue = value.replace(/[^\d.,]/g, '');
                            // Substitui vírgula por ponto para cálculos em JavaScript
                            const normalizedValue = cleanValue.replace(/,/g, '.');
                            field.onChange(normalizedValue);
                          }}
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
                    onClick={() => setIsViewingInReadOnlyMode(false)}
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