import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useParams } from "@/lib/use-params";
import { useAuth } from "@/hooks/use-auth";
import { useClientAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InsertFreight, InsertFreightDestination, PROFILE_TYPES, VEHICLE_TYPES, CARGO_TYPES, BODY_TYPES } from "@shared/schema";
import LocationInput from "@/components/location/location-input";
import ClientSelector from "@/components/clients/client-selector";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { AlertCircle, AlertTriangle, Loader2, MinusCircle, Pencil, Plus, Trash } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatValue, WHATSAPP_PREFIXES, getVehicleCategory, formatMultipleVehicleTypes } from "@/lib/utils";
import { ButtonCancel } from "@/components/ui/button-cancel";

// Constantes
const PAYMENT_OPTIONS = {
  INCLUSO: "incluso",
  A_PARTE: "a_parte"
} as const;

interface FormValues extends InsertFreight {
  destination: string;
  destinationState: string;
  additionalDestinations: {
    destination: string;
    destinationState: string;
  }[];
}

interface FreightFormProps {
  isEditMode?: boolean;
}

export default function FreightForm({ isEditMode = false }: FreightFormProps) {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { clients } = useClientAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isViewingInReadOnlyMode, setIsViewingInReadOnlyMode] = useState(false);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);

  // Verificar se o usuário está tentando editar um frete existente
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      // Obter os dados do frete para edição
      apiRequest("GET", `/api/freights/${id}`)
        .then(response => response.json())
        .then(data => {
          // Preencher o formulário com os dados existentes
          const hasMultipleDestinations = data.destinations && data.destinations.length > 1;
          
          // Ajustar tipos de veículos e carrocerias para arrays
          let vehicleTypes = [];
          let bodyTypes = [];
          
          if (data.vehicleType && typeof data.vehicleType === 'string') {
            vehicleTypes = data.vehicleType.split(',').map((type: string) => type.trim());
            setSelectedVehicleTypes(vehicleTypes);
          }
          
          if (data.bodyType && typeof data.bodyType === 'string') {
            bodyTypes = data.bodyType.split(',').map((type: string) => type.trim());
            setSelectedBodyTypes(bodyTypes);
          }
          
          // Preparar os destinos adicionais
          const additionalDestinations = hasMultipleDestinations
            ? data.destinations.slice(1).map((dest: any) => ({
                destination: dest.destination,
                destinationState: dest.destinationState
              }))
            : [];
          
          // Definir os valores iniciais no formulário
          form.reset({
            ...data,
            vehicleType: '', // Será tratado separadamente com checkboxes
            bodyType: '', // Será tratado separadamente com checkboxes
            vehicleCategory: data.vehicleCategory || '',
            destination: hasMultipleDestinations ? '' : (data.destinations?.[0]?.destination || ''),
            destinationState: hasMultipleDestinations ? '' : (data.destinations?.[0]?.destinationState || ''),
            hasMultipleDestinations,
            additionalDestinations
          });
          
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Erro ao carregar dados do frete:", error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível obter os dados do frete para edição.",
            variant: "destructive"
          });
          setIsLoading(false);
        });
    }
  }, [isEditMode, id, toast]);

  // Configuração do formulário com validação
  const form = useForm<FormValues>({
    defaultValues: {
      clientId: null,
      userId: user?.id,
      origin: "",
      originState: "",
      destination: "",
      destinationState: "",
      cargoType: "",
      needsTarp: "false",
      productType: "",
      cargoWeight: "",
      vehicleType: "",
      bodyType: "",
      vehicleSize: "",
      loadType: "",
      paymentMethod: "",
      paymentTerm: "",
      paymentValue: "",
      tollPayment: "",
      observations: "",
      contactName: "",
      contactPhone: "",
      hasMultipleDestinations: false,
      additionalDestinations: [],
      vehicleCategory: ""
    },
    resolver: zodResolver(InsertFreight.extend({
      destination: isEditMode ? z => z.optional() : z => z.string().min(1, "Cidade de destino é obrigatória"),
      destinationState: isEditMode ? z => z.optional() : z => z.string().min(1, "Estado de destino é obrigatório"),
      additionalDestinations: z => z.array(
        z.object({
          destination: z.string().min(1, "Cidade de destino é obrigatória"),
          destinationState: z.string().min(1, "Estado de destino é obrigatório")
        })
      ),
    }))
  });

  // Mutação para criar ou atualizar frete
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Preparar tipos de veículos e carrocerias como strings separadas por vírgula
      const vehicleType = selectedVehicleTypes.join(", ");
      const bodyType = selectedBodyTypes.join(", ");
      
      const freightData = {
        ...values,
        userId: user?.id,
        clientId: values.clientId,
        vehicleType,
        bodyType,
        vehicleCategory: getVehicleCategory(vehicleType)
      };
      
      // Remover campos que não são necessários para a API
      delete freightData.destination;
      delete freightData.destinationState;
      delete freightData.additionalDestinations;
      
      let freightId: number;
      let freightResponse;
      
      // Criar ou atualizar o frete
      if (isEditMode && id) {
        freightResponse = await apiRequest("PUT", `/api/freights/${id}`, freightData);
        freightId = parseInt(id);
      } else {
        freightResponse = await apiRequest("POST", "/api/freights", freightData);
        const newFreight = await freightResponse.json();
        freightId = newFreight.id;
      }

      // Se a criação/atualização do frete foi bem-sucedida e temos um ID
      if (freightResponse.ok && freightId) {
        // Processar destinos
        if (values.hasMultipleDestinations) {
          // Lidar com múltiplos destinos
          
          // Primeiro, verifique se já existem destinos em modo de edição
          if (isEditMode) {
            // Excluir destinos existentes
            await apiRequest("DELETE", `/api/freight-destinations/${freightId}`);
          }
          
          // Adicionar todos os destinos
          const destinationsPromises = values.additionalDestinations.map((dest, index) => {
            const destinationData = {
              freightId,
              destination: dest.destination,
              destinationState: dest.destinationState,
              order: index + 1
            };
            return apiRequest("POST", "/api/freight-destinations", destinationData);
          });
          
          await Promise.all(destinationsPromises);
        } else {
          // Lidar com destino único
          
          // Se estivermos em modo de edição, primeiro excluímos os destinos existentes
          if (isEditMode) {
            await apiRequest("DELETE", `/api/freight-destinations/${freightId}`);
          }
          
          // Adicionar o destino único
          const destinationData = {
            freightId,
            destination: values.destination,
            destinationState: values.destinationState
          };
          await apiRequest("POST", "/api/freight-destinations", destinationData);
        }
      }
      
      return freightId;
    },
    onSuccess: (freightId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      
      toast({
        title: isEditMode ? "Frete atualizado" : "Frete cadastrado",
        description: isEditMode 
          ? "O frete foi atualizado com sucesso!" 
          : "O frete foi cadastrado com sucesso!",
      });
      
      navigate(isEditMode ? `/freights/${freightId}` : "/freights");
    },
    onError: (error: any) => {
      console.error("Erro ao salvar frete:", error);
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível ${isEditMode ? "atualizar" : "cadastrar"} o frete. ${error.message || ""}`,
        variant: "destructive",
      });
    }
  });

  // Observa mudanças no campo hasMultipleDestinations
  const hasMultipleDestinations = form.watch("hasMultipleDestinations");
  
  // Adicionar nova linha de destino adicional
  const addDestination = () => {
    const currentDestinations = form.getValues("additionalDestinations") || [];
    form.setValue("additionalDestinations", [
      ...currentDestinations,
      { destination: "", destinationState: "" }
    ]);
  };
  
  // Remover linha de destino adicional
  const removeDestination = (index: number) => {
    const currentDestinations = form.getValues("additionalDestinations") || [];
    form.setValue(
      "additionalDestinations",
      currentDestinations.filter((_, i) => i !== index)
    );
  };
  
  // Gerenciar seleção de tipos de veículos com checkboxes HTML nativos
  const handleVehicleTypeChange = (type: string) => {
    setSelectedVehicleTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Gerenciar seleção de tipos de carrocerias com checkboxes HTML nativos
  const handleBodyTypeChange = (type: string) => {
    setSelectedBodyTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Função para formatar número de telefone para o WhatsApp
  const formatWhatsAppNumber = (phone: string, state: string = "") => {
    if (!phone) return "";
    
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, "");
    
    // Se o número não começar com 55 (Brasil), adicionar
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned;
    }
    
    // Se o número não tiver o comprimento correto para incluir DDD
    if (cleaned.length < 12) {
      // Tentar adicionar o DDD baseado no estado
      const prefix = state ? WHATSAPP_PREFIXES[state] : "";
      if (prefix) {
        cleaned = "55" + prefix + cleaned;
      }
    }
    
    return cleaned;
  };
  
  // Função para criar link de WhatsApp
  const createWhatsAppLink = (phone: string, message: string = "") => {
    return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  };
  
  // Função para submeter o formulário
  const onSubmit = (values: FormValues) => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para cadastrar um frete.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o formulário está em modo de visualização apenas
    if (isViewingInReadOnlyMode) {
      setIsViewingInReadOnlyMode(false);
      return;
    }
    
    // Verificar se pelo menos um tipo de veículo foi selecionado
    if (selectedVehicleTypes.length === 0) {
      toast({
        title: "Tipo de veículo obrigatório",
        description: "Selecione pelo menos um tipo de veículo.",
        variant: "destructive",
      });
      return;
    }
    
    // Executar a mutação para salvar o frete
    mutation.mutate(values);
  };
  
  // Cancelar a edição e voltar para a lista de fretes
  const handleCancel = () => {
    navigate("/freights");
  };
  
  // Verificar se está no modo de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Editar Frete" : "Novo Frete"}
        </h1>
        
        <div className="flex space-x-2">
          <ButtonCancel 
            onClick={handleCancel} 
            disabled={mutation.isPending}
          />
          
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {isViewingInReadOnlyMode ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </>
                ) : (
                  "Salvar"
                )}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Dados básicos do frete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <ClientSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isViewingInReadOnlyMode}
                      />
                      <FormDescription>
                        Selecione o cliente associado a este frete
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da pessoa para contato"
                            {...field}
                            readOnly={isViewingInReadOnlyMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone de Contato</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            readOnly={isViewingInReadOnlyMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Seção de Origem e Destino - ALTERADA PARA LAYOUT VERTICAL */}
              <div className="grid grid-cols-1 gap-4">
                {/* Checkbox para múltiplos destinos */}
                <div>
                  <FormField
                    control={form.control}
                    name="hasMultipleDestinations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            id="multiple-destinations"
                            disabled={isViewingInReadOnlyMode}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded-sm border border-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label htmlFor="multiple-destinations">Múltiplos destinos</Label>
                          <FormDescription>
                            Marque esta opção para adicionar mais de um destino para este frete
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Cidade de Origem */}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Cidade de Destino - só aparece se não for múltiplos destinos */}
                {!hasMultipleDestinations && (
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
                              value={field.value}
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
                  </div>
                )}
                
                {/* Lista de destinos adicionais - aparece apenas se hasMultipleDestinations for true */}
                {hasMultipleDestinations && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Destinos</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDestination}
                        disabled={isViewingInReadOnlyMode}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Destino
                      </Button>
                    </div>
                    
                    {form.getValues("additionalDestinations")?.map((_, index) => (
                      <div key={index} className="border p-4 rounded-md relative">
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name={`additionalDestinations.${index}.destination`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade de Destino {index + 1}</FormLabel>
                                <FormControl>
                                  <LocationInput
                                    readOnly={isViewingInReadOnlyMode}
                                    value={field.value}
                                    onChange={(value) => field.onChange(value)}
                                    stateField={`additionalDestinations.${index}.destinationState`}
                                    stateValue={form.watch(`additionalDestinations.${index}.destinationState`)}
                                    onStateChange={(state) =>
                                      form.setValue(`additionalDestinations.${index}.destinationState`, state)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {!isViewingInReadOnlyMode && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDestination(index)}
                              className="absolute top-2 right-2"
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {(!form.getValues("additionalDestinations") || form.getValues("additionalDestinations").length === 0) && (
                      <div className="text-center p-6 border border-dashed rounded-md">
                        <p className="text-muted-foreground">
                          Nenhum destino adicionado. Clique em "Adicionar Destino" para incluir os pontos de entrega.
                        </p>
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
                Detalhes do veículo necessário e da carga
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* TIPOS DE VEÍCULO - USANDO CHECKBOXES HTML NATIVOS */}
              <div>
                <FormLabel className="text-base">Tipo de Veículo</FormLabel>
                <FormDescription className="mb-4">
                  Selecione o(s) tipo(s) de veículo adequado(s) para o frete
                </FormDescription>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(VEHICLE_TYPES).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`vehicle-type-${key}`}
                        checked={selectedVehicleTypes.includes(key)}
                        onChange={() => handleVehicleTypeChange(key)}
                        disabled={isViewingInReadOnlyMode}
                        className="h-4 w-4 rounded-sm border border-primary"
                      />
                      <Label 
                        htmlFor={`vehicle-type-${key}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedVehicleTypes.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Veículos selecionados: {formatMultipleVehicleTypes(selectedVehicleTypes)}
                  </div>
                )}
              </div>
              
              {/* TIPOS DE CARROCERIA - USANDO CHECKBOXES HTML NATIVOS */}
              <div>
                <FormLabel className="text-base">Tipo de Carroceria</FormLabel>
                <FormDescription className="mb-4">
                  Selecione o(s) tipo(s) de carroceria necessário(s)
                </FormDescription>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(BODY_TYPES).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`body-type-${key}`}
                        checked={selectedBodyTypes.includes(key)}
                        onChange={() => handleBodyTypeChange(key)}
                        disabled={isViewingInReadOnlyMode}
                        className="h-4 w-4 rounded-sm border border-primary"
                      />
                      <Label 
                        htmlFor={`body-type-${key}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedBodyTypes.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Carrocerias selecionadas: {selectedBodyTypes.map(type => BODY_TYPES[type as keyof typeof BODY_TYPES]).join(", ")}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho do Veículo</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pequeno">Pequeno</SelectItem>
                          <SelectItem value="médio">Médio</SelectItem>
                          <SelectItem value="grande">Grande</SelectItem>
                          <SelectItem value="extra_grande">Extra Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carga</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de carga" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CARGO_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Descreva o produto a ser transportado"
                          {...field}
                          readOnly={isViewingInReadOnlyMode}
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
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
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
                          type="number"
                          placeholder="Peso em kg"
                          {...field}
                          readOnly={isViewingInReadOnlyMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="loadType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Carregamento</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="batido">Batido</SelectItem>
                          <SelectItem value="paletizado">Paletizado</SelectItem>
                          <SelectItem value="misto">Misto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
              <CardDescription>
                Detalhes sobre o pagamento do frete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="a_vista">À Vista</SelectItem>
                          <SelectItem value="30_dias">30 Dias</SelectItem>
                          <SelectItem value="adiantamento">Adiantamento</SelectItem>
                          <SelectItem value="cartão">Cartão</SelectItem>
                          <SelectItem value="transferência">Transferência</SelectItem>
                          <SelectItem value="negociar">A Negociar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Pagamento</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="na_descarga">Na Descarga</SelectItem>
                          <SelectItem value="apresentacao_nf">Após Apresentação NF</SelectItem>
                          <SelectItem value="faturado">Faturado</SelectItem>
                          <SelectItem value="antecipado">Antecipado</SelectItem>
                          <SelectItem value="negociar">A Negociar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Valor total em reais"
                          {...field}
                          readOnly={isViewingInReadOnlyMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tollPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagamento de Pedágio</FormLabel>
                      <Select
                        disabled={isViewingInReadOnlyMode}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PAYMENT_OPTIONS.INCLUSO}>Incluso no Frete</SelectItem>
                          <SelectItem value={PAYMENT_OPTIONS.A_PARTE}>Pago à Parte</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Informações adicionais sobre o frete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre o frete, instruções especiais, etc."
                        className="min-h-32"
                        {...field}
                        readOnly={isViewingInReadOnlyMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <ButtonCancel 
              onClick={handleCancel} 
              disabled={mutation.isPending}
            />
            
            <Button 
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  {isViewingInReadOnlyMode ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </>
                  ) : (
                    "Salvar"
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}