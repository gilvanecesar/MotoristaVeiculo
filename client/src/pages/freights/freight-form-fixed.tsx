import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useLocation, useSearch } from "wouter";
import { z } from "zod";
import { insertFreightSchema, insertFreightDestinationSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import LocationInput from "@/components/location/location-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ClientSelector from "@/components/clients/client-selector";

// Schema para validação do formulário de frete
const freightSchema = insertFreightSchema.extend({
  clientId: z.union([z.number(), z.null()]),
  cargoWeight: z.string().min(1, "Peso da carga é obrigatório"),
});

// Schema para validação de destinos
const destinationSchema = insertFreightDestinationSchema;

// Tipos inferidos do schema
type FreightFormValues = z.infer<typeof freightSchema>;
type DestinationFormValues = z.infer<typeof destinationSchema>;

interface FreightFormProps {
  isEditMode?: boolean;
}

// Constants para tipos de veículos e carrocerias
const vehicleTypes = [
  "Toco",
  "Truck",
  "Carreta",
  "Bitrem",
  "Rodotrem",
  "VUC",
  "Outros",
];

const VEHICLE_CATEGORIES = {
  PESADO: "pesado",
  LEVE: "leve",
  MEDIO: "medio",
};

const BODY_TYPES = {
  BAU: "bau",
  GRADE_BAIXA: "grade_baixa", 
  GRADE_ALTA: "grade_alta",
  SIDER: "sider",
  PRANCHA: "prancha",
  CONTAINER: "container",
  CACAMBA: "cacamba",
  TANQUE: "tanque",
  FRIGORIFICADO: "frigorificado",
  GAIOLA: "gaiola",
  GRANELEIRO: "graneleiro",
  CANAVIEIRO: "canavieiro",
};

// Helper functions
const getBodyTypeDisplay = (bodyType: string) => {
  const bodyTypeMap: { [key: string]: string } = {
    bau: "Baú",
    grade_baixa: "Grade Baixa",
    grade_alta: "Grade Alta",
    sider: "Sider",
    prancha: "Prancha",
    container: "Container",
    cacamba: "Caçamba",
    tanque: "Tanque",
    frigorificado: "Frigorificado",
    gaiola: "Gaiola",
    graneleiro: "Graneleiro",
    canavieiro: "Canavieiro",
  };
  return bodyTypeMap[bodyType] || bodyType;
};

const getVehicleCategory = (vehicleType: string) => {
  const pesados = ["Carreta", "Bitrem", "Rodotrem"];
  const leves = ["VUC"];
  
  if (pesados.includes(vehicleType)) {
    return VEHICLE_CATEGORIES.PESADO;
  } else if (leves.includes(vehicleType)) {
    return VEHICLE_CATEGORIES.LEVE;
  } else {
    return VEHICLE_CATEGORIES.MEDIO;
  }
};

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
    freightValue: "", // Iniciando vazio para forçar o usuário a preencher
    tollOption: "",
    paymentMethod: "",
    observations: "",
    status: "",
    contactName: "",
    contactPhone: "",
  };

  const form = useForm<FreightFormValues>({
    resolver: zodResolver(freightSchema),
    defaultValues,
  });

  const hasMultipleDestinations = form.watch("hasMultipleDestinations");

  const { toast } = useToast();

  const addDestination = () => {
    setDestinations([
      ...destinations,
      {
        freightId: Number(freightId),
        destination: "",
        destinationState: "",
      },
    ]);
  };

  const removeDestination = (index: number) => {
    const newDestinations = [...destinations];
    newDestinations.splice(index, 1);
    setDestinations(newDestinations);
  };

  const updateDestination = (
    index: number,
    field: keyof DestinationFormValues,
    value: string
  ) => {
    const newDestinations = [...destinations];
    newDestinations[index] = {
      ...newDestinations[index],
      [field]: value,
    };
    setDestinations(newDestinations);
  };

  // Função auxiliar para formatar valores monetários
  const formatCurrency = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "");
    
    // Converte para número e divide por 100 para obter o valor em reais
    const floatValue = parseInt(numericValue) / 100;
    
    // Formata o valor com duas casas decimais
    return floatValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para formatar o valor do frete no formulário
  const handleFreightValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue) {
      const formattedValue = formatCurrency(numericValue);
      form.setValue("freightValue", formattedValue);
    } else {
      form.setValue("freightValue", "");
    }
  };

  // Função para converter o valor formatado para centavos no envio
  const getNumericValue = (formattedValue: string) => {
    const numericValue = formattedValue.replace(/\D/g, "");
    return numericValue ? parseInt(numericValue) : 0;
  };

  // Carrega os dados do frete se estiver editando
  useEffect(() => {
    if (isEditing && freightId) {
      setIsLoadingFreight(true);
      
      const fetchFreight = async () => {
        try {
          const response = await apiRequest("GET", `/api/freights/${freightId}`);
          const freightData = await response.json();
          
          // Verifica se o usuário tem permissão para editar este frete
          const canEditThisFreight = userCanEditFreight(freightData.userId);
          
          // Define o modo de visualização com base nas permissões
          const shouldBeReadOnly = !canEditThisFreight || (isEditing && !searchParams.get("edit") && !isEditMode);
          setIsViewingInReadOnlyMode(shouldBeReadOnly);
          
          // Formatar valor do frete para exibição
          let formattedFreightValue = freightData.freightValue;
          if (typeof freightData.freightValue === "number") {
            formattedFreightValue = formatCurrency(freightData.freightValue.toString());
          }
          
          // Preparar dados para o formulário
          const formData = {
            ...freightData,
            clientId: freightData.clientId,
            freightValue: formattedFreightValue,
            hasMultipleDestinations: !!freightData.hasMultipleDestinations,
          };
          
          // Carregar tipos de veículos selecionados
          if (freightData.vehicleTypesSelected) {
            const vehicleTypesList = freightData.vehicleTypesSelected.split(",");
            setSelectedVehicleTypes(vehicleTypesList);
          }
          
          // Carregar tipos de carroceria selecionados
          if (freightData.bodyTypesSelected) {
            const bodyTypesList = freightData.bodyTypesSelected.split(",");
            setSelectedBodyTypes(bodyTypesList);
          }
          
          // Carregar destinos múltiplos se existirem
          if (freightData.destinations && freightData.destinations.length > 0) {
            setDestinations(freightData.destinations);
          }
          
          // Resetar o formulário com os dados carregados
          form.reset(formData);
          
        } catch (error) {
          console.error("Erro ao carregar dados do frete:", error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar os dados do frete.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingFreight(false);
        }
      };
      
      fetchFreight();
    }
  }, [freightId, isEditing, form]);

  // Carrega os clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await apiRequest("GET", "/api/clients");
        const clientsData = await response.json();
        setClients(clientsData);
        
        // Se o usuário tiver um clientId associado, busca os dados desse cliente
        if (user?.clientId) {
          const clientResponse = await apiRequest("GET", `/api/clients/${user.clientId}`);
          const clientData = await clientResponse.json();
          setCurrentClient(clientData);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    fetchClients();
  }, [user]);

  // Função para selecionar um cliente
  const handleClientSelect = (clientId: number | null) => {
    form.setValue("clientId", clientId);
  };

  // Mutation para criar/atualizar frete
  const freightMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `/api/freights/${freightId}` : "/api/freights";
      
      const response = await apiRequest(method, endpoint, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar o frete");
      }
      
      return await response.json();
    },
    onSuccess: (freightResponse) => {
      // Atualizar o cache do React Query
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      
      toast({
        title: isEditing ? "Frete atualizado" : "Frete criado",
        description: isEditing
          ? "O frete foi atualizado com sucesso."
          : "O frete foi criado com sucesso.",
      });
      
      // Redirecionar para a página de detalhes do frete
      navigate(`/freights/${freightResponse.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para criar destinos
  const destinationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/freight-destinations", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar destinos");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = async (data: FreightFormValues) => {
    try {
      // Converter valor do frete de string formatada para número
      const freightValueNumeric = getNumericValue(data.freightValue);
      
      // Preparar dados do frete para envio
      const freightData = {
        ...data,
        freightValue: freightValueNumeric,
        hasMultipleDestinations: !!data.hasMultipleDestinations,
        vehicleTypesSelected: selectedVehicleTypes.join(","),
        bodyTypesSelected: selectedBodyTypes.join(","),
      };
      
      // Enviar dados do frete
      const freightResponse = await freightMutation.mutateAsync(freightData);
      
      // Se houver múltiplos destinos, criar cada um
      if (data.hasMultipleDestinations && destinations.length > 0) {
        for (const dest of destinations) {
          const destinationData = {
            ...dest,
            freightId: freightResponse.id,
          };
          
          await destinationMutation.mutateAsync(destinationData);
        }
      }
      
    } catch (error) {
      console.error("Erro ao salvar frete:", error);
    }
  };

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/freights")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing
              ? isViewingInReadOnlyMode
                ? "Visualizar Frete"
                : "Editar Frete"
              : "Novo Frete"}
          </h1>
        </div>
        
        {isEditing && isViewingInReadOnlyMode && userCanEditFreight(form.getValues("userId")) && (
          <Button onClick={enableEditMode}>Editar</Button>
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

                <div className="grid grid-cols-1 gap-4">
                  {/* Opção de múltiplos destinos */}
                  <div className="mb-4">
                    <FormField
                      control={form.control}
                      name="hasMultipleDestinations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              disabled={isViewingInReadOnlyMode}
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded-sm border border-primary"
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
                  </div>

                  {/* Cidade de Origem */}
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
                  
                  {/* Cidade de Destino - só aparece se não for múltiplos destinos */}
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
                  
                  {/* Lista de múltiplos destinos */}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Veículo e Carga</CardTitle>
                <CardDescription>
                  Informações sobre o veículo e carga a ser transportada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Carga</FormLabel>
                        <FormControl>
                          <Select
                            disabled={isViewingInReadOnlyMode}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de carga" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geral">Carga Geral</SelectItem>
                              <SelectItem value="granel_solido">
                                Granel Sólido
                              </SelectItem>
                              <SelectItem value="granel_liquido">
                                Granel Líquido
                              </SelectItem>
                              <SelectItem value="frigorificada">
                                Carga Frigorificada
                              </SelectItem>
                              <SelectItem value="perigosa">
                                Carga Perigosa
                              </SelectItem>
                              <SelectItem value="viva">Carga Viva</SelectItem>
                              <SelectItem value="valores">Valores</SelectItem>
                              <SelectItem value="maquinario">
                                Maquinário
                              </SelectItem>
                              <SelectItem value="indivisivel">
                                Carga Indivisível
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                            placeholder="Ex: Eletrônicos, Alimentos, etc."
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
                          <Select
                            disabled={isViewingInReadOnlyMode}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
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
                </div>

                <div>
                  <FormLabel>Tipos de Veículos</FormLabel>
                  <div className="w-full border rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {vehicleTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`vehicle-type-${type}`}
                          disabled={isViewingInReadOnlyMode}
                          checked={selectedVehicleTypes.includes(type)}
                          onChange={(e) => {
                            const checked = e.target.checked;
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
                          className="h-4 w-4 rounded-sm border border-primary"
                        />
                        <label 
                          htmlFor={`vehicle-type-${type}`} 
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.vehicleType && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      {form.formState.errors.vehicleType.message}
                    </p>
                  )}
                </div>

                <div>
                  <FormLabel>Tipos de Carroceria</FormLabel>
                  <div className="w-full border rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(BODY_TYPES).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`body-type-${key}`}
                          disabled={isViewingInReadOnlyMode}
                          checked={selectedBodyTypes.includes(value)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              // Adicionar tipo à lista
                              const newList = [...selectedBodyTypes, value];
                              setSelectedBodyTypes(newList);
                              form.setValue("bodyTypesSelected", newList.join(","));
                              
                              // Atualizar o tipo principal para o primeiro da lista
                              form.setValue("bodyType", newList[0]);
                            } else {
                              // Remover tipo da lista
                              const newList = selectedBodyTypes.filter(t => t !== value);
                              setSelectedBodyTypes(newList);
                              form.setValue("bodyTypesSelected", newList.join(","));
                              
                              // Atualizar o tipo principal
                              if (newList.length > 0) {
                                form.setValue("bodyType", newList[0]);
                              } else {
                                form.setValue("bodyType", "");
                              }
                            }
                          }}
                          className="h-4 w-4 rounded-sm border border-primary"
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Financeiras</CardTitle>
                <CardDescription>
                  Detalhes sobre valores e formas de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="freightValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Frete</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={isViewingInReadOnlyMode}
                            placeholder="R$ 0,00"
                            onChange={handleFreightValueChange}
                            value={field.value}
                            className="text-right"
                          />
                        </FormControl>
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
                        <FormControl>
                          <Select
                            disabled={isViewingInReadOnlyMode}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="transferencia">
                                Transferência Bancária
                              </SelectItem>
                              <SelectItem value="cartao">
                                Cartão de Crédito
                              </SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tollOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pedágio</FormLabel>
                        <FormControl>
                          <Select
                            disabled={isViewingInReadOnlyMode}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a opção de pedágio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="incluso">Incluso</SelectItem>
                              <SelectItem value="a_parte">À parte</SelectItem>
                            </SelectContent>
                          </Select>
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
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>
                  Dados de contato para este frete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={isViewingInReadOnlyMode}
                            placeholder="Ex: João Silva"
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
                        <FormLabel>Telefone de Contato</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={isViewingInReadOnlyMode}
                            placeholder="Ex: (11) 98765-4321"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Preferencialmente com WhatsApp
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Informações adicionais sobre o frete"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {!isViewingInReadOnlyMode && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/freights")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={freightMutation.isPending}
                >
                  {freightMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                  )}
                  {isEditing ? "Salvar Alterações" : "Criar Frete"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}