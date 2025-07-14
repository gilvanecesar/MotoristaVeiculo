import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Upload, X } from "lucide-react";
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
import { clientValidator, CLIENT_TYPES } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import LocationInput from "@/components/location/location-input";

// Brazilian states
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

// Função para formatar CPF/CNPJ automaticamente
const formatDocument = (value: string) => {
  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, '');
  
  // CPF: 000.000.000-00
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ: 00.000.000/0000-00
  else {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export default function ClientForm() {
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const clientId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form definition com valores padrão
  const defaultValues = {
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    whatsapp: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipcode: "",
    contactName: user?.name || "",
    contactPhone: "",
    notes: "",
    logoUrl: user?.avatarUrl || "",
    cnpj: "",
    clientType: CLIENT_TYPES.SHIPPER,
  };

  // Registra os valores iniciais no console para debug
  console.log("Valores iniciais do formulário:", defaultValues);

  const form = useForm({
    // Removendo o validador para permitir o envio do formulário mesmo com dados incompletos
    // resolver: zodResolver(clientValidator),
    defaultValues,
  });

  // Fetch client data for editing
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['/api/clients', clientId],
    enabled: isEditing,
    queryFn: async () => {
      console.log("Buscando dados do cliente para edição:", clientId);
      try {
        const res = await apiRequest("GET", `/api/clients/${clientId}`);
        if (!res.ok) {
          console.error("Erro ao buscar cliente:", await res.text());
          throw new Error("Falha ao carregar dados do cliente");
        }
        const data = await res.json();
        console.log("Dados do cliente recebidos:", data);
        return data;
      } catch (error) {
        console.error("Exceção ao buscar cliente:", error);
        throw error;
      }
    }
  });

  // Fetch logged-in user's client data if they have a clientId
  const { data: userClient, isLoading: isUserClientLoading } = useQuery({
    queryKey: ['/api/clients', user?.clientId],
    enabled: !isEditing && !!user?.clientId,
  });

  useEffect(() => {
    // Log dos valores iniciais do formulário para debug
    console.log("Valores iniciais do formulário antes do reset:", form.getValues());
    
    // Se estiver editando um cliente existente
    if (client && !isClientLoading) {
      console.log("Dados recebidos para edição:", client);
      
      // Garantir que todos os campos esperados existam com valores padrão
      const safeClient = {
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        whatsapp: client.whatsapp || "",
        street: client.street || "",
        number: client.number || "",
        complement: client.complement || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        zipcode: client.zipcode || "",
        contactName: client.contactName || "",
        contactPhone: client.contactPhone || "",
        notes: client.notes || "",
        cnpj: client.cnpj || "",
        clientType: client.clientType || CLIENT_TYPES.SHIPPER,
        logoUrl: client.logoUrl || ""
      };
      
      console.log("Dados normalizados para edição:", safeClient);
      
      // Em vez de usar form.reset, vamos definir cada campo individualmente
      // isso pode resolver problemas de sincronização dos dados
      Object.entries(safeClient).forEach(([field, value]) => {
        form.setValue(field as any, value);
      });
      
      // Ainda mantemos o reset, mas ele vem depois da definição manual dos campos
      form.reset(safeClient, { keepValues: true });
      
      const clientLogoUrl = client.logoUrl as string | undefined;
      if (clientLogoUrl) {
        setLogoPreview(clientLogoUrl);
      }
    } 
    // Se estiver criando um novo cliente e o usuário já tiver um cliente
    else if (userClient && !isUserClientLoading) {
      console.log("Dados de cliente existente para novo registro:", userClient);
      
      // Garantir que todos os campos esperados existam com valores padrão
      const safeUserClient = {
        name: userClient.name || "",
        email: userClient.email || "",
        phone: userClient.phone || "",
        whatsapp: userClient.whatsapp || "",
        street: userClient.street || "",
        number: userClient.number || "",
        complement: userClient.complement || "",
        neighborhood: userClient.neighborhood || "",
        city: userClient.city || "",
        state: userClient.state || "",
        zipcode: userClient.zipcode || "",
        contactName: userClient.contactName || "",
        contactPhone: userClient.contactPhone || "",
        notes: userClient.notes || "",
        cnpj: userClient.cnpj || "",
        clientType: userClient.clientType || CLIENT_TYPES.SHIPPER,
        logoUrl: userClient.logoUrl || ""
      };
      
      console.log("Dados normalizados para novo cliente:", safeUserClient);
      form.reset(safeUserClient);
      
      const userClientLogoUrl = userClient.logoUrl as string | undefined;
      if (userClientLogoUrl) {
        setLogoPreview(userClientLogoUrl);
      }
      
      // Exibe notificação para o usuário
      toast({
        title: "Dados pré-preenchidos",
        description: "Os dados do seu cliente já registrado foram carregados para edição.",
      });
    }
    // Se os dados do usuário estiverem disponíveis, mas não houver cliente ainda
    else if (user && !isEditing) {
      console.log("Preenchendo com dados do usuário:", user);
      
      // Preenche os campos com dados do usuário
      setTimeout(() => {
        form.setValue("name", user.name || "");
        form.setValue("email", user.email || "");
        form.setValue("contactName", user.name || "");
        if (user.avatarUrl) {
          form.setValue("logoUrl", user.avatarUrl);
          setLogoPreview(user.avatarUrl);
        }
      }, 0);
    }
  }, [client, isClientLoading, userClient, isUserClientLoading, user, form, isEditing, toast]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem válida (PNG, JPG, JPEG).",
        variant: "destructive",
      });
      return;
    }

    // Máximo de 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      setLogoPreview(logoUrl);
      form.setValue("logoUrl", logoUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue("logoUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Log para depuração
      console.log("Enviando dados do cliente:", data);
      
      // Lista de campos obrigatórios
      const requiredFields = [
        { name: 'name', label: 'Nome/Razão Social' },
        { name: 'email', label: 'E-mail' },
        { name: 'cnpj', label: 'CNPJ' },
        { name: 'phone', label: 'Telefone' },
        { name: 'street', label: 'Endereço' },
        { name: 'number', label: 'Número' },
        { name: 'neighborhood', label: 'Bairro' },
        { name: 'city', label: 'Cidade' },
        { name: 'state', label: 'Estado' },
        { name: 'zipcode', label: 'CEP' },
        { name: 'contactName', label: 'Nome do Contato' },
        { name: 'contactPhone', label: 'Telefone do Contato' }
      ];
      
      // Verificar todos os campos obrigatórios
      const missingFields = requiredFields.filter(field => !data[field.name]);
      
      if (missingFields.length > 0) {
        const missingLabels = missingFields.map(field => field.label).join(', ');
        toast({
          title: "Campos obrigatórios não preenchidos",
          description: `Por favor, preencha os seguintes campos: ${missingLabels}`,
          variant: "destructive"
        });
        return;
      }
      
      // Preparar dados para envio
      const clientDataToSend = {
        ...data,
        // Garantir que campos opcionais tenham valores vazios em vez de undefined
        whatsapp: data.whatsapp || "",
        complement: data.complement || "",
        contactName: data.contactName || "",
        contactPhone: data.contactPhone || "",
        notes: data.notes || "",
        logoUrl: data.logoUrl || ""
      };
      
      let clientResponse;
      
      if (isEditing) {
        console.log(`Editando cliente ID: ${clientId}`, clientDataToSend);
        
        // Usando fetch diretamente para maior controle e debug
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(clientDataToSend)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erro na resposta:", errorData);
          throw new Error(errorData.message || "Erro ao salvar os dados");
        }
        
        clientResponse = await response.json();
        console.log("Resposta da edição:", clientResponse);
      } else {
        // Quando estamos criando um novo cliente
        console.log("Criando novo cliente:", clientDataToSend);
        const response = await apiRequest(
          'POST',
          '/api/clients',
          clientDataToSend
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao criar o cliente");
        }
        
        clientResponse = await response.json();
        console.log("Resposta da criação:", clientResponse);
        
        // A associação automática ao usuário já é feita no backend
        // O objeto req.user é atualizado automaticamente no servidor
      }

      toast({
        title: isEditing ? "Cliente atualizado" : "Cliente criado",
        description: isEditing 
          ? "As alterações foram salvas com sucesso."
          : "O novo cliente foi cadastrado com sucesso.",
      });

      // Atualiza o cache do React Query para refletir as mudanças
      await queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      // Importante: Atualizar os dados do usuário para refletir a associação com o cliente
      // Isso garante que o menu será liberado imediatamente
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      try {
        // Buscar os dados atualizados do usuário para garantir que a UI seja atualizada
        const userResponse = await fetch('/api/user', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const updatedUser = await userResponse.json();
          queryClient.setQueryData(['/api/user'], updatedUser);
          console.log("Dados do usuário atualizados:", updatedUser);
        }
      } catch (error) {
        console.error("Erro ao buscar dados atualizados do usuário:", error);
        // Continua mesmo se houver erro ao buscar os dados do usuário
      }
      
      // Redireciona para a página de pagamento se estiver criando um novo cliente
      // ou volta para a página de clientes se estiver editando
      if (!isEditing) {
        // Se for um novo cliente, redireciona para a página de pagamento
        toast({
          title: "Redirecionando para pagamento",
          description: "Por favor, escolha seu plano para ativar o acesso completo."
        });
        // Curto atraso para garantir que o toast seja exibido
        setTimeout(() => {
          navigate("/checkout");
        }, 1000);
      } else {
        // Se estiver editando, volta para a lista de clientes
        navigate("/clients");
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
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
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Cliente" : "Novo Cliente"}
            </h1>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Preencha as informações do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault(); // Evita o comportamento padrão de submissão
              console.log("Formulário submetido manualmente");
              
              // Obtém todos os valores atuais do formulário
              const data = form.getValues();
              console.log("Dados do formulário para envio:", data);
              
              // Chama a função onSubmit manualmente com os dados
              onSubmit(data);
            }} className="space-y-6">
              <h3 className="text-lg font-medium">Dados Básicos</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Client Type */}
                <FormField
                  control={form.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cliente</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CLIENT_TYPES.SHIPPER}>Embarcador</SelectItem>
                          <SelectItem value={CLIENT_TYPES.CARRIER}>Transportador</SelectItem>
                          <SelectItem value={CLIENT_TYPES.AGENT}>Agente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de operação do cliente no sistema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome / Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome ou Razão Social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CNPJ/CPF */}
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ / CPF</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00.123.456/0001-00 ou 000.000.000-00" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatDocument(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={18} // Máximo para CNPJ formatado
                        />
                      </FormControl>
                      <FormDescription>
                        Formato CNPJ: XX.XXX.XXX/XXXX-XX ou CPF: XXX.XXX.XXX-XX
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp */}
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional. Se não for informado, será usado o telefone principal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-medium">Endereço</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {/* Street */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua / Logradouro</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da rua" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Number */}
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Complement */}
                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Sala, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Neighborhood */}
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <LocationInput 
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Se o valor contiver um estado (formato: "Cidade - UF")
                            if (value.includes(" - ")) {
                              const state = value.split(" - ")[1];
                              // Atualiza o campo de estado automaticamente
                              form.setValue("state", state);
                            }
                          }}
                          placeholder="Digite a cidade (ex: São Paulo - SP)"
                          errorMessage={form.formState.errors.city?.message as string}
                          onStateChange={(state) => {
                            form.setValue("state", state);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label} ({state.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Zipcode */}
                <FormField
                  control={form.control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-medium">Informações Adicionais</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Contact Name */}
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da pessoa de contato" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional. Nome da pessoa para contato.
                      </FormDescription>
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
                      <FormLabel>Telefone do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Opcional. Telefone direto da pessoa de contato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo Upload */}
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Logomarca</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary/50 transition-colors">
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="mb-2"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Escolher arquivo
                              </Button>
                              <FormDescription>
                                Tamanho recomendado: 200x200px (máximo 2MB)
                              </FormDescription>
                              <FormDescription>
                                Formatos aceitos: PNG, JPG, JPEG
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <div>
                          {logoPreview ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative w-40 h-40 border rounded-lg overflow-hidden flex items-center justify-center p-2 bg-white">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo preview" 
                                  className="max-w-full max-h-full object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6"
                                  onClick={removeLogo}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <FormDescription>Prévia da logomarca</FormDescription>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <Avatar className="w-20 h-20">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <Building2 className="h-10 w-10" />
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-slate-500 mt-2">
                                Nenhuma logo selecionada
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre o cliente..." 
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
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/clients")}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? "Salvar Alterações" : "Criar Cliente"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}