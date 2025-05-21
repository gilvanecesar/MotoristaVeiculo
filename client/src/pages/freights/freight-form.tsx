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
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { ArrowLeft, Check, Plus, Trash, X } from "lucide-react";
import { Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
// Removido useClientAuth para evitar dependências circulares
import LocationInput from "@/components/location/location-input";
import NumberInput from "@/components/ui/number-input";
import StateSelect from "@/components/location/state-select";
import CitySelect from "@/components/location/city-select";
import VehicleTypesCheckboxes from "@/components/ui/vehicle-types-checkboxes";

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

interface FreightFormProps {
  isEditMode?: boolean;
}

export default function FreightForm({ isEditMode }: FreightFormProps) {
  const params = useParams();
  const [, navigate] = useLocation();
  const [search] = useSearch();
  const searchParams = new URLSearchParams(search);
  const isEditing = Boolean(params.id);
  const freightId = params.id;

  // Inicia como somente leitura apenas se estiver editando e sem parâmetro de edição ou se isEditMode não for true
  // Será atualizado após carregar os dados do frete
  const [isViewingInReadOnlyMode, setIsViewingInReadOnlyMode] = useState(
    isEditing && !searchParams.get("edit") && !isEditMode
  );
  
  // Esta função cria e abre um novo formulário em modo de edição
  const enableEditMode = () => {
    console.log("Ativando modo de edição através da navegação");
    
    // Redirecionar para a página de edição com parâmetro forçado
    navigate(`/freights/${freightId}/edit?v=${Date.now()}`);
  };

  const { user } = useAuth();
  
  // Simplificando a lógica sem useClientAuth para evitar dependências circulares
  const currentClient = null; // Não precisamos do cliente atual para motoristas
  
  // Função simplificada para verificar autorização
  const isClientAuthorized = (clientId: number | null) => {
    // Motoristas não podem editar/excluir fretes
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    // Administradores têm acesso total
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    // Para outros perfis, verifica se o frete pertence ao cliente do usuário
    return user?.clientId === clientId;
  };

  const [isLoadingFreight, setIsLoadingFreight] = useState(isEditing);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [freightDestinations, setFreightDestinations] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<DestinationFormValues[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  
  // Estado para controlar se já inicializou os valores (para evitar sobrescrita)
  const [initializedSelections, setInitializedSelections] = useState(false);

  const defaultValues: FreightFormValues = {
    clientId: user?.clientId || undefined,
    origin: "",
    originState: "",
    destination: "",
    destinationState: "",
    cargoType: "completa",
    needsTarp: "nao",
    productType: "",
    cargoWeight: "0",
    vehicleCategory: VEHICLE_CATEGORIES.LEVE,
    vehicleType: VEHICLE_TYPES.LEVE_TODOS,
    bodyType: BODY_TYPES.BAU,
    freightValue: "0",
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
  
  // Inicializar as seleções de tipos de veículos e carroceria
  useEffect(() => {
    // Se não estiver em modo de edição, começar com arrays vazios
    // Isso garante que o usuário escolha explicitamente seus tipos
    if (!isEditing) {
      console.log("Inicializando seleções com arrays vazios para novo frete");
      setSelectedVehicleTypes([]);
      setSelectedBodyTypes([]);
      setInitializedSelections(true);
    }
  }, [isEditing]);

  // Atualizar modo de edição quando isEditMode mudar
  useEffect(() => {
    if (isEditMode && isEditing) {
      setIsViewingInReadOnlyMode(false);
    }
  }, [isEditMode, isEditing]);

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
      
      // Inicializar tipos de veículo - deixar vazio para não marcar nenhum por padrão
      setSelectedVehicleTypes([]);
      
      // Inicializar tipos de carroceria - deixar vazio para não marcar nenhum por padrão
      setSelectedBodyTypes([]);
      
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

      // Adicionar os destinos extras para enviar ao backend
      if (destinations.length > 0) {
        submitData.extraDestinations = destinations.map(dest => ({
          destinationState: dest.destinationState,
          destination: dest.destination
        }));
      }

      console.log("Enviando dados do frete:", submitData);

      // Make API request to save the freight
      if (isEditing && freightId) {
        // Update existing freight
        const res = await apiRequest("PUT", `/api/freights/${freightId}`, submitData);
        if (res.ok) {
          const updatedFreight = await res.json();
          toast({
            title: "Frete atualizado",
            description: "As informações do frete foram atualizadas com sucesso.",
          });
          
          // Invalidar cache para atualizar a lista de fretes
          queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
          
          // Redirecionar para a página de detalhes
          navigate(`/freights/${updatedFreight.id}`);
        } else {
          const errorData = await res.json();
          toast({
            title: "Erro ao atualizar",
            description: errorData.message || "Ocorreu um erro ao atualizar o frete.",
            variant: "destructive",
          });
        }
      } else {
        // Create new freight
        const res = await apiRequest("POST", "/api/freights", submitData);
        if (res.ok) {
          const newFreight = await res.json();
          toast({
            title: "Frete criado",
            description: "O frete foi cadastrado com sucesso.",
          });
          
          // Invalidar cache para atualizar a lista de fretes
          queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
          
          // Redirecionar para a página de detalhes do frete criado
          navigate(`/freights/${newFreight.id}`);
        } else {
          const errorData = await res.json();
          toast({
            title: "Erro ao criar",
            description: errorData.message || "Ocorreu um erro ao cadastrar o frete.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar frete:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o frete. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para renderizar seletor de cliente
  const renderClientSelector = () => {
    // Se for um motorista, não mostra o seletor
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return null;
    }
    
    // Se for um embarcador/agente associado a um cliente específico
    if (user && user.clientId) {
      // Encontrar o cliente associado ao usuário
      const userClient = clients.find(client => client.id === user.clientId);
      if (userClient) {
        return (
          <FormField
            control={form.control}
            name="clientId"
            disabled={true}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <div className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <div className="text-foreground">{userClient.name}</div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
    }
    
    // Se for administrador ou não tiver cliente associado
    return (
      <FormField
        control={form.control}
        name="clientId"
        disabled={isViewingInReadOnlyMode}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Cliente</FormLabel>
            <Select 
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value ? field.value.toString() : ""}
              disabled={isLoadingClients}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (isLoadingFreight) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // HandleVehicleTypesChange para atualizar os tipos de veículo selecionados
  const handleVehicleTypesChange = (newSelectedTypes: string[]) => {
    setSelectedVehicleTypes(newSelectedTypes);
    form.setValue("vehicleType", newSelectedTypes.length > 0 ? newSelectedTypes[0] : "");
    form.setValue("vehicleTypesSelected", newSelectedTypes.join(","));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/freights")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? (isViewingInReadOnlyMode ? "Visualizar Frete" : "Editar Frete") : "Novo Frete"}
        </h1>
        
        {isEditing && isViewingInReadOnlyMode && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={enableEditMode}
          >
            Editar Frete
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Dados do Frete" : "Novo Frete"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Visualize ou altere as informações do frete cadastrado."
              : "Preencha os dados para cadastrar um novo frete."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              className="space-y-6" 
              id="freight-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <fieldset 
                disabled={isViewingInReadOnlyMode} 
                className="space-y-6"
              >
                {/* Client Selector */}
                {renderClientSelector()}
                
                {/* Main Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Origin */}
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Cidade de Origem</FormLabel>
                        <LocationInput
                          defaultValue={field.value}
                          onChange={(location, locationObj) => {
                            field.onChange(location);
                            if (locationObj) {
                              form.setValue("originState", locationObj.state);
                            }
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Estado de Origem</FormLabel>
                        <div className="flex h-10 items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          {field.value || "Estado será preenchido automaticamente"}
                        </div>
                        {form.formState.errors.origin && (
                          <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.origin.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Destination Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Destination State */}
                  <FormField
                    control={form.control}
                    name="destinationState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Estado de Destino</FormLabel>
                        <StateSelect
                          value={field.value}
                          onChange={(state) => {
                            field.onChange(state);
                            // Reset city when state changes
                            form.setValue("destination", "");
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Destination City */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Cidade de Destino</FormLabel>
                        <CitySelect
                          state={form.watch("destinationState")}
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Additional Destinations */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Destinos Adicionais</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDestination}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {destinations.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      Nenhum destino adicional. Clique em "Adicionar" para incluir mais destinos.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {destinations.map((dest, index) => (
                        <div 
                          key={dest.id || index} 
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md relative"
                        >
                          <div className="md:col-span-1">
                            <label className="text-sm font-medium block mb-1.5">
                              Estado
                            </label>
                            <StateSelect
                              value={dest.destinationState}
                              onChange={(state) => {
                                updateDestination(index, 'destinationState', state);
                                // Reset city when state changes
                                updateDestination(index, 'destination', '');
                              }}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-sm font-medium block mb-1.5">
                              Cidade
                            </label>
                            <CitySelect
                              state={dest.destinationState}
                              value={dest.destination}
                              onChange={(city) => updateDestination(index, 'destination', city)}
                            />
                          </div>
                          <div className="flex items-end md:justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeDestination(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Vehicle Category */}
                <FormField
                  control={form.control}
                  name="vehicleCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de Veículo</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // Reset selection based on category
                          setSelectedVehicleTypes([]);
                          
                          // Set a default type for the category
                          if (value === VEHICLE_CATEGORIES.LEVE) {
                            form.setValue("vehicleType", VEHICLE_TYPES.LEVE_TODOS);
                          } else if (value === VEHICLE_CATEGORIES.MEDIO) {
                            form.setValue("vehicleType", VEHICLE_TYPES.MEDIO_TODOS);
                          } else if (value === VEHICLE_CATEGORIES.PESADO) {
                            form.setValue("vehicleType", VEHICLE_TYPES.PESADO_TODOS);
                          }
                        }}
                        defaultValue={field.value}
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
                
                {/* Vehicle Types - Checkboxes de todas as categorias */}
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tipos de Veículo</FormLabel>
                      <VehicleTypesCheckboxes 
                        selectedVehicleTypes={selectedVehicleTypes} 
                        onChange={handleVehicleTypesChange} 
                      />
                      {form.formState.errors.vehicleType && (
                        <FormMessage>{form.formState.errors.vehicleType.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                
                {/* Cargo Type */}
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carga</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de carga" />
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
                      <Input {...field} placeholder="Exemplo: Móveis, Eletrônicos, etc." />
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione se precisa de lona" />
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
                
                {/* Body Type - Multiple Selection */}
                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Tipos de Carroceria</FormLabel>
                    <div className="w-full border rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(BODY_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`body-type-${value}`}
                            checked={selectedBodyTypes.includes(value)}
                            style={{ 
                              width: '24px', 
                              height: '24px',
                              margin: '0px 8px 0px 0px'
                            }}
                            onChange={(e) => {
                              // Lógica simplificada - apenas alterna o valor atual
                              let newSelected: string[] = [];
                              if (e.target.checked) {
                                // Adicionar à seleção
                                newSelected = [...selectedBodyTypes, value];
                              } else {
                                // Remover da seleção
                                newSelected = selectedBodyTypes.filter(t => t !== value);
                              }
                              
                              // Atualiza o estado e os valores do formulário
                              console.log(`Atualizando tipos de carroceria: ${newSelected.join(', ')}`);
                              setSelectedBodyTypes([...newSelected]); // Clone para garantir nova referência
                              form.setValue("bodyType", newSelected.length > 0 ? newSelected[0] : "");
                              form.setValue("bodyTypesSelected", newSelected.join(","));
                            }}
                          />
                          <label 
                            htmlFor={`body-type-${value}`}
                            className="text-sm font-medium cursor-pointer"
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
                  </FormItem>
                </div>
                
                {/* Cargo Weight and Freight Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cargoWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso da Carga (kg)</FormLabel>
                        <NumberInput 
                          {...field} 
                          placeholder="0" 
                          min={0}
                          step={50}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="freightValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Frete (R$)</FormLabel>
                        <NumberInput 
                          {...field} 
                          placeholder="0.00" 
                          min={0}
                          step={100}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Toll Option and Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tollOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pedágio</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a opção de pedágio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TOLL_OPTIONS.INCLUSO}>Incluso no Valor</SelectItem>
                            <SelectItem value={TOLL_OPTIONS.A_PARTE}>Não Incluso (à parte)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Input {...field} placeholder="Exemplo: PIX, Transferência, etc." />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <Input {...field} placeholder="Nome da pessoa responsável" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Contato</FormLabel>
                        <Input {...field} placeholder="(00) 00000-0000" />
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
                      <Textarea 
                        {...field} 
                        placeholder="Informações adicionais sobre o frete..." 
                        rows={4}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/freights")}
                >
                  Cancelar
                </Button>
                {!isViewingInReadOnlyMode && (
                  <Button 
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                        {isEditing ? "Salvando..." : "Cadastrando..."}
                      </>
                    ) : (
                      <>{isEditing ? "Salvar Alterações" : "Cadastrar Frete"}</>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}