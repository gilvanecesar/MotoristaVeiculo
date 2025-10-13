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
import LocationInput from "@/components/location/location-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import ClientSelector from "@/components/clients/client-selector";
import { FreightDetailModal } from "@/components/freights/freight-detail-modal";

// Schema para validação do formulário de frete
const freightSchema = insertFreightSchema.extend({
  clientId: z.union([z.number(), z.null()]),
  cargoWeight: z.string().min(1, "Peso da carga é obrigatório"),
  destination: z.string().optional(),
  destinationState: z.string().optional(),
  origin: z.string().min(1, "Origem é obrigatória"),
  originState: z.string().min(1, "Estado de origem é obrigatório"),
  // Campos calculados ou definidos internamente
  userId: z.number().optional(),
  vehicleCategory: z.string().optional(),
  vehicleTypesSelected: z.string().optional(),
  bodyTypesSelected: z.string().optional(),
  // Novos campos de pagamento
  valueType: z.enum(["known", "to_combine"]).optional(),
  valueCalculation: z.string().optional(),
  advancePayment: z.string().optional(),
  // Campo para multidestinos
  hasMultipleDestinations: z.boolean().optional().default(false),
});

// Schema para validação dos destinos
const destinationSchema = z.object({
  destination: z.string().optional(),
  destinationState: z.string().optional(),
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
  const search = useSearch();
  const searchParams = new URLSearchParams(search as string);
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
  const [currentClient, setCurrentClient] = useState<any>(null);

  // Função para verificar se usuário tem permissão para editar este frete
  const userCanEditFreight = (freightUserId?: number) => {
    // Se é administrador, pode editar qualquer frete
    if (user?.profileType === "admin" || user?.profileType === "administrador") {
      return true;
    }
    
    // Se é o criador do frete, pode editar
    if (freightUserId && freightUserId === user?.id) {
      return true;
    }
    
    return false;
  };

  const [isLoadingFreight, setIsLoadingFreight] = useState(isEditing);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [freightDestinations, setFreightDestinations] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<DestinationFormValues[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [hasInitializedFreight, setHasInitializedFreight] = useState(false);

  const defaultValues: FreightFormValues = {
    clientId: user?.clientId || currentClient?.id || undefined, // Usar ID do cliente do usuário ou cliente atual
    origin: "",
    originState: "",
    destination: "",
    destinationState: "",
    cargoType: "",
    needsTarp: "",
    productType: "",
    cargoWeight: "", // Iniciando vazio para forçar o usuário a preencher
    vehicleCategory: "", // Iniciando vazio - nenhuma categoria selecionada por padrão
    vehicleType: "", // Iniciando vazio - nenhum tipo selecionado por padrão
    bodyType: "", // Iniciando vazio - nenhum tipo de carroceria selecionado por padrão
    valueType: "known", // Padrão: "Já sei o valor"
    freightValue: "", // Iniciando vazio para forçar o usuário a preencher
    valueCalculation: "",
    tollOption: "",
    paymentMethod: "",
    advancePayment: "",
    observations: "",
    status: "",
    contactName: "",
    contactPhone: "",
    hasMultipleDestinations: false,
  };

  const form = useForm<FreightFormValues>({
    resolver: zodResolver(freightSchema),
    defaultValues,
  });

  const hasMultipleDestinations = form.watch("hasMultipleDestinations");

  // Criar uma função para adicionar destinos
  const addDestination = () => {
    setDestinations([
      ...destinations,
      { destinationState: "", destination: "" },
    ]);
  };

  // Criar uma função para atualizar um destino
  const updateDestination = (index: number, field: keyof DestinationFormValues, value: string) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value,
    };
    setDestinations(updatedDestinations);
  };

  // Criar uma função para remover um destino
  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  // Função para carregar os dados de um frete existente (no modo de edição)
  const loadFreight = async () => {
    if (isEditing && freightId && !hasInitializedFreight) {
      setIsLoadingFreight(true);
      try {
        const response = await apiRequest("GET", `/api/freights/${freightId}`);
        
        if (response.ok) {
          const freight = await response.json();
          
          if (freight.clientId) {
            const clientResponse = await apiRequest("GET", `/api/clients/${freight.clientId}`);
            if (clientResponse.ok) {
              const client = await clientResponse.json();
              setCurrentClient(client);
              
              // Se o usuário não puder editar este frete, forçar modo somente leitura
              if (!userCanEditFreight(freight.userId)) {
                setIsViewingInReadOnlyMode(true);
              }
            }
          }

          // Carregar destinos adicionais associados a este frete (multidestinos)
          const destinationsResponse = await apiRequest("GET", `/api/freight-destinations?freightId=${freightId}`);
          if (destinationsResponse.ok) {
            const destinationData = await destinationsResponse.json();
            setFreightDestinations(destinationData);
            
            // Configurar destinos para o formulário
            const destinationsForForm = destinationData.map((dest: any) => ({
              destination: dest.destination,
              destinationState: dest.destinationState,
            }));
            
            setDestinations(destinationsForForm);
  
            // Se tem destinos adicionais, marcar como multidestinos
            if (destinationsForForm.length > 0) {
              freight.hasMultipleDestinations = true;
            }
          }

            // Configurar form com dados do frete
            form.reset({
              ...freight,
              clientId: freight.clientId,
              cargoWeight: freight.cargoWeight,
              freightValue: freight.freightValue,
              vehicleCategory: getVehicleCategory(freight.vehicleType),
              hasMultipleDestinations: freight.destinations && freight.destinations.length > 0,
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
            
            setHasInitializedFreight(true);
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do frete.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar frete:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados do frete.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFreight(false);
      }
    }
  };

  // Função para carregar clientes
  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await apiRequest("GET", "/api/clients");
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Carregar clientes e dados do frete ao montar o componente
  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (isEditing && !hasInitializedFreight) {
      loadFreight();
    }
  }, [isEditing, freightId, hasInitializedFreight]);

  // Atualiza o cliente atual quando muda o clientId no formulário
  useEffect(() => {
    const clientId = form.getValues("clientId");
    if (clientId) {
      const selectedClient = clients.find(client => client.id === clientId);
      if (selectedClient) {
        setCurrentClient(selectedClient);
      }
    }
  }, [clients]);

  const onSubmit = async (data: FreightFormValues) => {
    // Se for multidestinos e não tiver destinos adicionados, adiciona aviso
    if (data.hasMultipleDestinations && destinations.length === 0) {
      toast({
        title: "Aviso",
        description: "Você selecionou a opção de múltiplos destinos, mas não adicionou nenhum destino.",
        variant: "destructive",
      });
      return;
    }

    // Se for multidestinos, verifica se tem pelo menos um destino completo
    if (data.hasMultipleDestinations) {
      const hasValidDestination = destinations.some(dest => dest.destination && dest.destinationState);
      if (!hasValidDestination) {
        toast({
          title: "Aviso",
          description: "Adicione pelo menos um destino completo (cidade e estado).",
          variant: "destructive",
        });
        return;
      }
    }

    // Define status inicial como aberto
    data.status = "aberto";
    
    // Define o tipo de veículo principal (primeiro da lista)
    if (selectedVehicleTypes.length > 0) {
      data.vehicleType = selectedVehicleTypes[0];
    }
    
    // Define o tipo de carroceria principal (primeiro da lista)
    if (selectedBodyTypes.length > 0) {
      data.bodyType = selectedBodyTypes[0];
    }
    
    // Configura o ID do usuário atual
    data.userId = user?.id;
    
    // Mostra erros de desenvolvimento
    console.log("Form data:", data);
    console.log("Destinations:", destinations);
    
    try {
      let response;
      let freightResponse: any;
      
      if (isEditing) {
        // Atualiza um frete existente
        response = await apiRequest(
          "PUT",
          `/api/freights/${freightId}`,
          data
        );
      } else {
        // Cria um novo frete
        response = await apiRequest("POST", "/api/freights", data);
      }

      if (response.ok) {
        freightResponse = await response.json();
        
        // Se é multidestinos e tem destinos, salva os destinos
        if (data.hasMultipleDestinations && destinations.length > 0) {
          // Primeiro, remove destinos antigos se estiver editando
          if (isEditing) {
            await Promise.all(
              freightDestinations.map(async (dest) => {
                await apiRequest("DELETE", `/api/freight-destinations/${dest.id}`);
              })
            );
          }
          
          // Depois adiciona os novos
          await Promise.all(
            destinations.map(async (dest) => {
              if (dest.destination && dest.destinationState) {
                await apiRequest("POST", "/api/freight-destinations", {
                  freightId: freightResponse.id,
                  destination: dest.destination,
                  destinationState: dest.destinationState,
                });
              }
            })
          );
        }

        queryClient.invalidateQueries({ queryKey: ["/api/freights"] });

        toast({
          title: isEditing ? "Frete atualizado" : "Frete criado",
          description: isEditing
            ? "O frete foi atualizado com sucesso."
            : "O novo frete foi cadastrado com sucesso.",
        });

        // Redireciona para a página de lista de fretes ou detalhes do frete
        navigate(isEditing ? `/freights/${freightId}` : "/freights");
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.message || "Ocorreu um erro ao salvar o frete.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar frete:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a operação.",
        variant: "destructive",
      });
    }
  };

  // Função para selecionar um cliente
  const handleClientSelect = (clientId: number | null) => {
    form.setValue("clientId", clientId);
    if (clientId) {
      const selectedClient = clients.find(client => client.id === clientId);
      setCurrentClient(selectedClient);
    } else {
      setCurrentClient(null);
    }
  };

  // Função para formatar um valor monetário em reais
  const formatarValorReal = (valor: string) => {
    // Remove tudo que não é número
    const numerico = valor.replace(/\D/g, "");
    
    // Converte para centavos
    const centavos = parseInt(numerico) / 100;
    
    // Formata em moeda brasileira
    return centavos.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Manipulador para formatar valor do frete
  const handleFreightValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const valorFormatado = formatarValorReal(valor);
    form.setValue("freightValue", valorFormatado);
  };

  return (
    <div className="container px-2 py-4 mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/freights")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isViewingInReadOnlyMode
            ? "Detalhes do Frete"
            : isEditing
            ? "Editar Frete"
            : "Novo Frete"}
        </h1>
        
        {isViewingInReadOnlyMode && userCanEditFreight(form.getValues("userId")) && (
          <Button 
            variant="outline" 
            size="sm"
            className="ml-auto"
            onClick={enableEditMode}
          >
            Editar
          </Button>
        )}
      </div>

      {isLoadingFreight ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados essenciais para o cadastro do frete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <ClientSelector
                            readOnly={isViewingInReadOnlyMode}
                            selectedClientId={field.value || null}
                            onClientSelect={handleClientSelect}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select
                            disabled={isViewingInReadOnlyMode || !isEditing}
                            value={field.value || "aberto"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aberto">Aberto</SelectItem>
                              <SelectItem value="em_transporte">
                                Em Transporte
                              </SelectItem>
                              <SelectItem value="concluido">
                                Concluído
                              </SelectItem>
                              <SelectItem value="cancelado">
                                Cancelado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade de Origem</FormLabel>
                          <FormControl>
                            <LocationInput
                              readOnly={isViewingInReadOnlyMode}
                              value={field.value}
                              onChange={field.onChange}
                              stateField="originState"
                              stateValue={form.watch("originState")}
                              onStateChange={(state) =>
                                form.setValue("originState", state)
                              }
                            />
                          </FormControl>
                          {form.formState.errors.origin && (
                            <FormMessage>
                              {form.formState.errors.origin.message}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="hasMultipleDestinations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Múltiplos destinos</FormLabel>
                            <FormDescription>
                              Marque esta opção para adicionar mais de um destino para este frete
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {!hasMultipleDestinations && (
                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade de Destino</FormLabel>
                            <FormControl>
                              <LocationInput
                                readOnly={isViewingInReadOnlyMode}
                                value={field.value || ""}
                                onChange={field.onChange}
                                stateField="destinationState"
                                stateValue={form.watch("destinationState")}
                                onStateChange={(state) =>
                                  form.setValue("destinationState", state)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {hasMultipleDestinations && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">Destinos</FormLabel>
                          {!isViewingInReadOnlyMode && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addDestination}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Destino
                            </Button>
                          )}
                        </div>
                        
                        {destinations.length === 0 ? (
                          <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                            Nenhum destino adicionado. Clique em "Adicionar Destino".
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {destinations.map((dest, index) => (
                              <div key={index} className="flex gap-2 items-start p-3 border rounded-md">
                                <div className="flex-1">
                                  <div className="mb-2">
                                    <FormLabel className="text-xs">Cidade</FormLabel>
                                    <LocationInput
                                      readOnly={isViewingInReadOnlyMode}
                                      value={dest.destination || ""}
                                      onChange={(value) => updateDestination(index, "destination", value)}
                                      stateField={`destination-state-${index}`}
                                      stateValue={dest.destinationState || ""}
                                      onStateChange={(state) => updateDestination(index, "destinationState", state)}
                                    />
                                  </div>
                                </div>
                                {!isViewingInReadOnlyMode && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeDestination(index)}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Veículo e Carga</CardTitle>
                <CardDescription>
                  Detalhes do veículo necessário e da carga
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel className="text-base">Qual o perfil veicular para transportar sua carga?</FormLabel>
                  <FormDescription className="mb-4">
                    Escolha aquela(s) que considera(m) necessária(s) para o transporte.
                  </FormDescription>

                  <div className="space-y-6">
                    {Object.entries(VEHICLE_CATEGORIES).map(([categoryKey, categoryValue]) => {
                      const vehicleTypes = VEHICLE_TYPES_BY_CATEGORY[categoryValue];
                      
                      return (
                        <div key={categoryKey} className="border rounded-lg p-4 bg-muted/30">
                          <h4 className="text-sm font-semibold mb-3 text-foreground">
                            {getVehicleCategoryDisplay(categoryValue)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {vehicleTypes.map((type) => (
                              <div key={type} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`vehicle-type-${type}`}
                                  disabled={isViewingInReadOnlyMode}
                                  checked={selectedVehicleTypes.includes(type)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Adicionar tipo à lista
                                      const newList = [...selectedVehicleTypes, type];
                                      setSelectedVehicleTypes(newList);
                                      form.setValue("vehicleTypesSelected", newList.join(","));
                                      
                                      // Atualizar o tipo principal para o primeiro da lista
                                      form.setValue("vehicleType", newList[0]);
                                      form.setValue("vehicleCategory", getVehicleCategory(newList[0]));
                                    } else {
                                      // Remover tipo da lista
                                      const newList = selectedVehicleTypes.filter(t => t !== type);
                                      setSelectedVehicleTypes(newList);
                                      form.setValue("vehicleTypesSelected", newList.join(","));
                                      
                                      // Atualizar o tipo principal 
                                      if (newList.length > 0) {
                                        form.setValue("vehicleType", newList[0]);
                                        form.setValue("vehicleCategory", getVehicleCategory(newList[0]));
                                      } else {
                                        form.setValue("vehicleType", "");
                                        form.setValue("vehicleCategory", "");
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
                </div>

                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carga</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          disabled={isViewingInReadOnlyMode}
                          type="single"
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                          className="flex flex-wrap"
                        >
                          <ToggleGroupItem value="completa" className="mb-1">
                            Completa
                          </ToggleGroupItem>
                          <ToggleGroupItem value="fracionada" className="mb-1">
                            Fracionada
                          </ToggleGroupItem>
                          <ToggleGroupItem value="retorno" className="mb-1">
                            Retorno
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Produto</FormLabel>
                      <FormControl>
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Ex: Grãos, Bebidas, Eletrônicos..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needsTarp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Necessita Lona?</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          disabled={isViewingInReadOnlyMode}
                          type="single"
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                        >
                          <ToggleGroupItem value="sim">Sim</ToggleGroupItem>
                          <ToggleGroupItem value="nao">Não</ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cargoWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso da Carga (kg)</FormLabel>
                      <FormControl>
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          type="number"
                          min="1"
                          placeholder="Ex: 25000"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Informe o peso em quilogramas (kg)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="text-base">Qual o perfil da carroceria para transportar sua carga?</FormLabel>
                  <FormDescription className="mb-4">
                    Escolha aquela(s) que considera(m) necessária(s) para o transporte.
                  </FormDescription>
                  
                  <div className="space-y-4">
                    {/* Carrocerias Abertas */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Abertas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(BODY_TYPES)
                          .filter(([_, value]) => ['truck', 'gaiola', 'grade_baixa', 'prancha'].includes(value))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`body-type-${key}`}
                                disabled={isViewingInReadOnlyMode}
                                checked={selectedBodyTypes.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const newList = [...selectedBodyTypes, value];
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    form.setValue("bodyType", newList[0]);
                                  } else {
                                    const newList = selectedBodyTypes.filter(t => t !== value);
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    if (newList.length > 0) {
                                      form.setValue("bodyType", newList[0]);
                                    } else {
                                      form.setValue("bodyType", "");
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
                    </div>

                    {/* Carrocerias Fechadas */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Fechadas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(BODY_TYPES)
                          .filter(([_, value]) => ['bau', 'sider', 'graneleiro'].includes(value))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`body-type-${key}`}
                                disabled={isViewingInReadOnlyMode}
                                checked={selectedBodyTypes.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const newList = [...selectedBodyTypes, value];
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    form.setValue("bodyType", newList[0]);
                                  } else {
                                    const newList = selectedBodyTypes.filter(t => t !== value);
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    if (newList.length > 0) {
                                      form.setValue("bodyType", newList[0]);
                                    } else {
                                      form.setValue("bodyType", "");
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
                    </div>

                    {/* Carrocerias Especiais */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Especiais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(BODY_TYPES)
                          .filter(([_, value]) => !['truck', 'gaiola', 'grade_baixa', 'prancha', 'bau', 'sider', 'graneleiro'].includes(value))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`body-type-${key}`}
                                disabled={isViewingInReadOnlyMode}
                                checked={selectedBodyTypes.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const newList = [...selectedBodyTypes, value];
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    form.setValue("bodyType", newList[0]);
                                  } else {
                                    const newList = selectedBodyTypes.filter(t => t !== value);
                                    setSelectedBodyTypes(newList);
                                    form.setValue("bodyTypesSelected", newList.join(","));
                                    if (newList.length > 0) {
                                      form.setValue("bodyType", newList[0]);
                                    } else {
                                      form.setValue("bodyType", "");
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
                    </div>
                  </div>
                  
                  {form.formState.errors.bodyType && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      {form.formState.errors.bodyType.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mensagem informativa */}
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Faça o pagamento via Conta Freteiras de motorista e garanta uma parceria eficiente e segura!
                  </AlertDescription>
                </Alert>

                {/* Informações de valor */}
                <div>
                  <FormLabel className="text-base mb-3 block">Informações de valor</FormLabel>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="valueType"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="radio"
                              id="value-known"
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value === "known"}
                              onChange={() => field.onChange("known")}
                              className="w-4 h-4"
                            />
                          </FormControl>
                          <label htmlFor="value-known" className="text-sm font-medium cursor-pointer">
                            Já sei o valor
                          </label>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valueType"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="radio"
                              id="value-combine"
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value === "to_combine"}
                              onChange={() => field.onChange("to_combine")}
                              className="w-4 h-4"
                            />
                          </FormControl>
                          <label htmlFor="value-combine" className="text-sm font-medium cursor-pointer">
                            A combinar
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pedágio */}
                <div>
                  <FormLabel className="text-base mb-3 block">Pedágio</FormLabel>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="tollOption"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="radio"
                              id="toll-included"
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value === TOLL_OPTIONS.INCLUSO}
                              onChange={() => field.onChange(TOLL_OPTIONS.INCLUSO)}
                              className="w-4 h-4"
                            />
                          </FormControl>
                          <label htmlFor="toll-included" className="text-sm font-medium cursor-pointer">
                            Incluso no valor
                          </label>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tollOption"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="radio"
                              id="toll-separate"
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value === TOLL_OPTIONS.A_PARTE}
                              onChange={() => field.onChange(TOLL_OPTIONS.A_PARTE)}
                              className="w-4 h-4"
                            />
                          </FormControl>
                          <label htmlFor="toll-separate" className="text-sm font-medium cursor-pointer">
                            Pago à parte
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Campos de valores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="freightValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do frete</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={isViewingInReadOnlyMode}
                            placeholder="R$ 0,00"
                            {...field}
                            onChange={(e) => {
                              handleFreightValueChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valueCalculation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cálculo do valor</FormLabel>
                        <Select 
                          disabled={isViewingInReadOnlyMode}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="por_km">Por quilômetro</SelectItem>
                            <SelectItem value="por_tonelada">Por tonelada</SelectItem>
                            <SelectItem value="tabela_frete">Tabela de frete</SelectItem>
                            <SelectItem value="negociado">Negociado</SelectItem>
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
                        <FormLabel>Forma de pagamento (opcional)</FormLabel>
                        <Select 
                          disabled={isViewingInReadOnlyMode}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="a_vista">À vista</SelectItem>
                            <SelectItem value="7_dias">7 dias</SelectItem>
                            <SelectItem value="14_dias">14 dias</SelectItem>
                            <SelectItem value="28_dias">28 dias</SelectItem>
                            <SelectItem value="30_dias">30 dias</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advancePayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adiantamento (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={isViewingInReadOnlyMode}
                            placeholder="Ex: 50%"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato e Observações</CardTitle>
                <CardDescription>
                  Informações adicionais e contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome para Contato</FormLabel>
                      <FormControl>
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Ex: João da Silva"
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
                      <FormLabel>Telefone para Contato</FormLabel>
                      <FormControl>
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Ex: (11) 98765-4321"
                          inputMode="tel"
                          autoComplete="tel"
                          onBlur={(e) => {
                            // Prevenir fechamento do app no mobile ao perder foco
                            e.preventDefault();
                            field.onBlur();
                          }}
                          onChange={(e) => {
                            // Garantir que onChange funcione corretamente no mobile
                            field.onChange(e.target.value);
                          }}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Observações adicionais sobre o frete..."
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {!isViewingInReadOnlyMode && (
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/freights")}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? "Atualizar Frete" : "Criar Frete"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}