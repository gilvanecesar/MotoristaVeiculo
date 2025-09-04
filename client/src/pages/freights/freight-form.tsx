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

// Schema simplificado para evitar crashes em mobile
const freightSchema = z.object({
  clientId: z.union([z.number(), z.null()]).optional(),
  cargoWeight: z.string().optional(),
  destination: z.string().optional(),
  destinationState: z.string().optional(),
  origin: z.string().optional(),
  originState: z.string().optional(),
  cargoType: z.string().optional(),
  needsTarp: z.string().optional(),
  productType: z.string().optional(),
  vehicleCategory: z.string().optional(),
  vehicleType: z.string().optional(),
  bodyType: z.string().optional(),
  freightValue: z.string().optional(),
  tollOption: z.string().optional(),
  paymentMethod: z.string().optional(),
  observations: z.string().optional(),
  status: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  userId: z.number().optional(),
  vehicleTypesSelected: z.string().optional(),
  bodyTypesSelected: z.string().optional(),
  hasMultipleDestinations: z.boolean().optional().default(false),
  destination1: z.string().optional(),
  destinationState1: z.string().optional(),
  destination2: z.string().optional(),
  destinationState2: z.string().optional(),
  destination3: z.string().optional(),
  destinationState3: z.string().optional(),
  destination4: z.string().optional(),
  destinationState4: z.string().optional(),
  destination5: z.string().optional(),
  destinationState5: z.string().optional(),
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
    console.log("Ativando modo de edição diretamente");
    
    // Alterar estado para modo de edição sem redirecionar
    setIsViewingInReadOnlyMode(false);
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
    hasMultipleDestinations: false,
  };

  const form = useForm<FreightFormValues>({
    resolver: zodResolver(freightSchema),
    defaultValues,
    mode: "onSubmit", // Evita validação em tempo real que pode causar crashes em mobile
    reValidateMode: "onSubmit",
  });

  // Campos diretos para destinos agora - sem arrays complexos

  // Função para carregar os dados de um frete existente (no modo de edição)
  const loadFreight = async () => {
    if (isEditing && freightId) {
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

          // Os destinos adicionais agora são campos diretos no formulário

            // Configurar form com dados do frete
            form.reset({
              ...freight,
              clientId: freight.clientId,
              cargoWeight: freight.cargoWeight,
              freightValue: freight.freightValue,
              vehicleCategory: getVehicleCategory(freight.vehicleType),
              hasMultipleDestinations: Boolean(freight.destination1 || freight.destination2),
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
    
    if (isEditing) {
      loadFreight();
    }
  }, [isEditing, freightId]);

  // Atualiza o cliente atual quando muda o clientId no formulário
  useEffect(() => {
    const clientId = form.getValues("clientId");
    if (clientId) {
      const selectedClient = clients.find(client => client.id === clientId);
      if (selectedClient) {
        setCurrentClient(selectedClient);
      }
    }
  }, [clients, form]);

  const onSubmit = async (data: FreightFormValues) => {
    // Log para depuração
    console.log("Função onSubmit foi chamada");
    console.log("Dados do formulário:", data);

    // Validação do formulário
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      console.log("Erros no formulário:", form.formState.errors);
      toast({
        title: "Erros no formulário",
        description: "Verifique os campos obrigatórios e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("🎯 SUBMISSÃO - Dados do formulário:", data);
    console.log("🎯 SUBMISSÃO - destination1:", data.destination1);
    console.log("🎯 SUBMISSÃO - destination2:", data.destination2);

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
    
    // Formatar o valor do frete para o formato numérico que o banco espera
    if (data.freightValue) {
      // Remove pontos e substitui vírgula por ponto para formato numérico
      data.freightValue = data.freightValue.replace(/\./g, '').replace(',', '.');
    }
    
    // Os campos destination1 e destination2 já estão no data do formulário
    const payloadData = {
      ...data,
    };
    
    console.log("Destinos no payload:", {
      destination1: payloadData.destination1,
      destinationState1: payloadData.destinationState1,
      destination2: payloadData.destination2,
      destinationState2: payloadData.destinationState2
    });
    
    try {
      let response;
      let freightResponse;
      
      if (isEditing) {
        console.log("Enviando requisição PUT para atualizar frete:", `/api/freights/${freightId}`);
        
        // Garante que o freightId está definido
        if (!freightId) {
          throw new Error("ID do frete não definido para atualização");
        }
        
        // Atualiza um frete existente - adicionando userId para garantir
        const updateData = {
          ...payloadData,
          userId: user?.id
        };
        
        console.log("Dados para atualização:", updateData);
        
        // Alterando para usar fetch diretamente para maior confiabilidade
        response = await fetch(`/api/freights/${freightId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          credentials: 'include'
        });
        
        console.log("Resposta da atualização:", response.status, response.statusText);
      } else {
        // Cria um novo frete
        console.log("Enviando requisição POST para criar frete");
        response = await apiRequest("POST", "/api/freights", payloadData);
      }

      console.log("Resposta da API recebida:", response.status, response.ok);
      
      if (response.ok) {
        console.log("Resposta OK, fazendo parse do JSON...");
        freightResponse = await response.json();
        console.log("JSON parsado com sucesso:", freightResponse);
        
        // Os destinos múltiplos agora são salvos diretamente nos campos destination1 e destination2

        queryClient.invalidateQueries({queryKey: ["/api/freights"]});

        toast({
          title: isEditing ? "Frete atualizado" : "Frete criado",
          description: isEditing
            ? "O frete foi atualizado com sucesso."
            : "O novo frete foi cadastrado com sucesso.",
        });

        console.log("Salvamento concluído, redirecionando...");
        
        // Redireciona para a página de lista de fretes
        navigate("/freights");
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
    
    // Verifica se é um valor vazio ou zero
    if (!numerico || parseInt(numerico) === 0) {
      return "0,00";
    }
    
    // Converte para centavos
    const centavos = parseInt(numerico) / 100;
    
    // Formata em moeda brasileira
    return centavos.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Manipulador para formatar valor do frete com debounce
  const handleFreightValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    
    // Permitir valor zero explicitamente
    if (valor === "0" || valor === "0,00" || valor === "0.00" || valor === "") {
      form.setValue("freightValue", "0,00");
      return;
    }
    
    const valorFormatado = formatarValorReal(valor);
    form.setValue("freightValue", valorFormatado);
  };

  // Manipulador otimizado para peso da carga
  const handleCargoWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir campo vazio
    if (value === "") {
      form.setValue("cargoWeight", "");
      return;
    }
    
    // Remover caracteres não numéricos exceto vírgula e ponto
    let cleanValue = value.replace(/[^\d.,]/g, '');
    
    // Permitir apenas um separador decimal (vírgula ou ponto)
    const hasComma = cleanValue.includes(',');
    const hasDot = cleanValue.includes('.');
    
    if (hasComma && hasDot) {
      // Se tem ambos, manter apenas o último inserido
      const lastCommaIndex = cleanValue.lastIndexOf(',');
      const lastDotIndex = cleanValue.lastIndexOf('.');
      
      if (lastCommaIndex > lastDotIndex) {
        // Última vírgula, remover pontos
        cleanValue = cleanValue.replace(/\./g, '');
      } else {
        // Último ponto, remover vírgulas
        cleanValue = cleanValue.replace(/,/g, '');
      }
    }
    
    // Garantir apenas um separador decimal
    if (hasComma) {
      const parts = cleanValue.split(',');
      if (parts.length > 2) {
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
      }
    } else if (hasDot) {
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    // Validar se é um número válido
    const testValue = cleanValue.replace(',', '.');
    if (testValue === '' || !isNaN(parseFloat(testValue))) {
      form.setValue("cargoWeight", cleanValue);
    }
  };

  return (
    <div className="container px-3 sm:px-4 lg:px-6 py-4 mx-auto">
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
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log("Formulário enviado");
            
            // Verificar se estamos no modo de edição e garantir que temos o ID
            if (isEditing && !freightId) {
              console.error("Erro: Tentando editar, mas freightId não está definido");
              toast({
                title: "Erro",
                description: "Não foi possível identificar o frete para atualização",
                variant: "destructive",
              });
              return;
            }
            
            // Executar onSubmit manualmente
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
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

                    {/* Campos diretos para destinos adicionais */}
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="destination1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade de Destino 2 (Opcional)</FormLabel>
                              <FormControl>
                                <LocationInput
                                  readOnly={isViewingInReadOnlyMode}
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  stateField="destinationState1"
                                  stateValue={form.watch("destinationState1") || ""}
                                  onStateChange={(state) => form.setValue("destinationState1", state)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="destination2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade de Destino 3 (Opcional)</FormLabel>
                              <FormControl>
                                <LocationInput
                                  readOnly={isViewingInReadOnlyMode}
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  stateField="destinationState2"
                                  stateValue={form.watch("destinationState2") || ""}
                                  onStateChange={(state) => form.setValue("destinationState2", state)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
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
                  <FormLabel className="text-base">Tipo de Veículo</FormLabel>
                  <FormDescription className="mb-4">
                    Selecione o(s) tipo(s) de veículo adequado(s) para o frete
                  </FormDescription>

                  <div className="space-y-4">
                    {Object.entries(VEHICLE_CATEGORIES).map(([categoryKey, categoryValue]) => {
                      const vehicleTypes = VEHICLE_TYPES_BY_CATEGORY[categoryValue];
                      
                      return (
                        <div key={categoryKey} className="mb-4">
                          <h4 className="text-sm font-semibold mb-2">
                            {getVehicleCategoryDisplay(categoryValue)}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Ex: 25000"
                          value={field.value || ""}
                          onChange={handleCargoWeightChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                <FormField
                  control={form.control}
                  name="freightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete (R$)</FormLabel>
                      <FormControl>
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => {
                            handleFreightValueChange(e);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Informe o valor em reais (R$)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tollOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opção de Pedágio</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          disabled={isViewingInReadOnlyMode}
                          type="single"
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                        >
                          <ToggleGroupItem value={TOLL_OPTIONS.INCLUSO}>
                            Incluso
                          </ToggleGroupItem>
                          <ToggleGroupItem value={TOLL_OPTIONS.EMBARCADOR}>
                            Pago pelo Embarcador
                          </ToggleGroupItem>
                          <ToggleGroupItem value={TOLL_OPTIONS.TRANSPORTADOR}>
                            Pago pelo Transportador
                          </ToggleGroupItem>
                        </ToggleGroup>
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
                        <Input
                          readOnly={isViewingInReadOnlyMode}
                          placeholder="Ex: À vista, 28 dias, 50% adiantado..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button 
                  type="button"
                  onClick={async () => {
                    console.log("Botão de submissão clicado diretamente");
                    
                    // Dados do formulário
                    const formData = form.getValues();
                    
                    // Pulamos a validação manual para evitar problemas com campos de data
                    // Isso permitirá que o backend faça o processamento adequado
                    
                    try {
                      // Formatar o valor do frete para o formato numérico que o banco espera
                      let freightValue = formData.freightValue;
                      if (freightValue) {
                        freightValue = freightValue.replace(/\./g, '').replace(',', '.');
                      }
                      
                      // Preparar dados com userId e corrigir datas
                      // Convertendo strings de data para objetos Date ou null para envio ao servidor
                      const expirationDate = formData.expirationDate ? 
                        (typeof formData.expirationDate === 'string' ? 
                          new Date(formData.expirationDate) : formData.expirationDate) : null;
                      
                      const createdAt = formData.createdAt ? 
                        (typeof formData.createdAt === 'string' ? 
                          new Date(formData.createdAt) : formData.createdAt) : null;
                          
                      const submitData = {
                        ...formData,
                        expirationDate,
                        createdAt,
                        freightValue,
                        userId: user?.id
                      };
                      
                      console.log("Enviando dados:", submitData);
                      
                      let response;
                      
                      if (isEditing && freightId) {
                        response = await fetch(`/api/freights/${freightId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(submitData),
                          credentials: 'include'
                        });
                      } else {
                        response = await fetch('/api/freights', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(submitData),
                          credentials: 'include'
                        });
                      }
                      
                      if (response.ok) {
                        toast({
                          title: isEditing ? "Frete atualizado" : "Frete criado",
                          description: "Operação realizada com sucesso.",
                        });
                        
                        // Forçar redirecionamento para a lista de fretes
                        window.location.href = "/freights";
                      } else {
                        const errorData = await response.json();
                        toast({
                          title: "Erro",
                          description: errorData.message || "Ocorreu um erro ao salvar o frete.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("Erro ao salvar:", error);
                      toast({
                        title: "Erro no sistema",
                        description: "Não foi possível salvar. Tente novamente.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {isEditing ? "Salvar Edição" : "Criar Frete"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}